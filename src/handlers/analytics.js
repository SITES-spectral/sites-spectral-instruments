// Analytics Handler
// System-wide statistics and metrics for admin dashboard
// Real-time data aggregation from stations, platforms, instruments

import { getUserFromRequest } from '../auth/authentication.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse
} from '../utils/responses.js';

/**
 * Handle analytics requests (Admin only for full analytics)
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - Path segments from URL
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Analytics response
 */
export async function handleAnalytics(method, pathSegments, request, env) {
  // Authenticate user
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return createUnauthorizedResponse();
  }

  // Only admin users get full analytics
  if (user.role !== 'admin') {
    return createForbiddenResponse('Admin privileges required for system analytics');
  }

  const action = pathSegments[1];

  try {
    switch (method) {
      case 'GET':
        if (action === 'overview') {
          return await getSystemOverview(user, env);
        }
        if (action === 'stations') {
          return await getStationAnalytics(user, env);
        }
        if (action === 'instruments') {
          return await getInstrumentAnalytics(user, env);
        }
        if (action === 'activity') {
          return await getActivityAnalytics(user, env);
        }
        if (action === 'health') {
          return await getSystemHealth(user, env);
        }
        // Default: return full analytics
        return await getSystemOverview(user, env);

      default:
        return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return createErrorResponse('Analytics operation failed: ' + error.message, 500);
  }
}

/**
 * Get comprehensive system overview
 * @param {Object} user - Authenticated admin user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} System overview response
 */
async function getSystemOverview(user, env) {
  try {
    // Get total counts
    const stationsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM stations').first();
    const platformsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM platforms').first();
    const instrumentsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM instruments').first();
    const roisCount = await env.DB.prepare('SELECT COUNT(*) as count FROM instrument_rois').first();

    // Get status breakdown
    const stationsStatus = await env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM stations
      GROUP BY status
    `).all();

    const platformsStatus = await env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM platforms
      GROUP BY status
    `).all();

    const instrumentsStatus = await env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM instruments
      GROUP BY status
    `).all();

    // Get instrument types breakdown
    const instrumentTypes = await env.DB.prepare(`
      SELECT instrument_type, COUNT(*) as count
      FROM instruments
      GROUP BY instrument_type
    `).all();

    // Get ecosystem distribution
    const ecosystems = await env.DB.prepare(`
      SELECT ecosystem_code, COUNT(*) as count
      FROM instruments
      GROUP BY ecosystem_code
    `).all();

    // Get recent activity (if activity_log exists)
    let recentActivity = [];
    try {
      const activityResults = await env.DB.prepare(`
        SELECT action, COUNT(*) as count
        FROM activity_log
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY action
        ORDER BY count DESC
        LIMIT 10
      `).all();
      recentActivity = activityResults.results || [];
    } catch (e) {
      // Activity log table may not exist yet
      console.log('Activity log not available');
    }

    // Get deployment timeline
    const deploymentTimeline = await env.DB.prepare(`
      SELECT
        strftime('%Y', deployment_date) as year,
        COUNT(*) as count
      FROM instruments
      WHERE deployment_date IS NOT NULL
      GROUP BY year
      ORDER BY year ASC
    `).all();

    // Calculate averages
    const avgPlatformsPerStation = platformsCount.count / Math.max(stationsCount.count, 1);
    const avgInstrumentsPerPlatform = instrumentsCount.count / Math.max(platformsCount.count, 1);
    const avgROIsPerInstrument = roisCount.count / Math.max(instrumentsCount.count, 1);

    return createSuccessResponse({
      generated_at: new Date().toISOString(),
      summary: {
        total_stations: stationsCount.count,
        total_platforms: platformsCount.count,
        total_instruments: instrumentsCount.count,
        total_rois: roisCount.count,
        avg_platforms_per_station: Math.round(avgPlatformsPerStation * 10) / 10,
        avg_instruments_per_platform: Math.round(avgInstrumentsPerPlatform * 10) / 10,
        avg_rois_per_instrument: Math.round(avgROIsPerInstrument * 10) / 10
      },
      status_breakdown: {
        stations: stationsStatus.results || [],
        platforms: platformsStatus.results || [],
        instruments: instrumentsStatus.results || []
      },
      instrument_types: instrumentTypes.results || [],
      ecosystems: ecosystems.results || [],
      deployment_timeline: deploymentTimeline.results || [],
      recent_activity: recentActivity
    });

  } catch (error) {
    console.error('Error generating system overview:', error);
    return createErrorResponse('Failed to generate system overview: ' + error.message, 500);
  }
}

/**
 * Get detailed station analytics
 * @param {Object} user - Authenticated admin user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Station analytics response
 */
async function getStationAnalytics(user, env) {
  try {
    const stationsWithCounts = await env.DB.prepare(`
      SELECT
        s.id,
        s.normalized_name,
        s.display_name,
        s.acronym,
        s.status,
        s.country,
        s.latitude,
        s.longitude,
        s.elevation_m,
        COUNT(DISTINCT p.id) as platform_count,
        COUNT(DISTINCT i.id) as instrument_count,
        COUNT(DISTINCT r.id) as roi_count
      FROM stations s
      LEFT JOIN platforms p ON s.id = p.station_id
      LEFT JOIN instruments i ON p.id = i.platform_id
      LEFT JOIN instrument_rois r ON i.id = r.instrument_id
      GROUP BY s.id, s.normalized_name, s.display_name, s.acronym,
               s.status, s.country, s.latitude, s.longitude, s.elevation_m
      ORDER BY s.display_name ASC
    `).all();

    // Calculate station rankings
    const stations = stationsWithCounts.results || [];
    const stationsWithRanks = stations.map(station => ({
      ...station,
      total_entities: station.platform_count + station.instrument_count + station.roi_count,
      data_richness_score: (station.platform_count * 1.5) + (station.instrument_count * 2) + (station.roi_count * 0.5)
    }));

    // Sort by data richness
    stationsWithRanks.sort((a, b) => b.data_richness_score - a.data_richness_score);

    // Add ranks
    stationsWithRanks.forEach((station, index) => {
      station.rank = index + 1;
    });

    return createSuccessResponse({
      stations: stationsWithRanks,
      total_stations: stations.length,
      most_active_station: stationsWithRanks[0] || null,
      least_active_station: stationsWithRanks[stationsWithRanks.length - 1] || null
    });

  } catch (error) {
    console.error('Error generating station analytics:', error);
    return createErrorResponse('Failed to generate station analytics: ' + error.message, 500);
  }
}

/**
 * Get detailed instrument analytics
 * @param {Object} user - Authenticated admin user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument analytics response
 */
async function getInstrumentAnalytics(user, env) {
  try {
    // Instrument deployment trends
    const deploymentTrends = await env.DB.prepare(`
      SELECT
        strftime('%Y-%m', deployment_date) as month,
        instrument_type,
        COUNT(*) as count
      FROM instruments
      WHERE deployment_date IS NOT NULL
      GROUP BY month, instrument_type
      ORDER BY month DESC
      LIMIT 24
    `).all();

    // Camera specifications breakdown
    const cameraBrands = await env.DB.prepare(`
      SELECT camera_brand, COUNT(*) as count
      FROM instruments
      WHERE camera_brand IS NOT NULL AND camera_brand != ''
      GROUP BY camera_brand
      ORDER BY count DESC
    `).all();

    const cameraModels = await env.DB.prepare(`
      SELECT camera_model, camera_brand, COUNT(*) as count
      FROM instruments
      WHERE camera_model IS NOT NULL AND camera_model != ''
      GROUP BY camera_model, camera_brand
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // Measurement status
    const measurementStatus = await env.DB.prepare(`
      SELECT measurement_status, COUNT(*) as count
      FROM instruments
      GROUP BY measurement_status
    `).all();

    // Height distribution
    const heightDistribution = await env.DB.prepare(`
      SELECT
        CASE
          WHEN instrument_height_m < 2 THEN '0-2m'
          WHEN instrument_height_m >= 2 AND instrument_height_m < 5 THEN '2-5m'
          WHEN instrument_height_m >= 5 AND instrument_height_m < 10 THEN '5-10m'
          WHEN instrument_height_m >= 10 AND instrument_height_m < 20 THEN '10-20m'
          WHEN instrument_height_m >= 20 THEN '20m+'
          ELSE 'Unknown'
        END as height_range,
        COUNT(*) as count
      FROM instruments
      GROUP BY height_range
      ORDER BY
        CASE height_range
          WHEN '0-2m' THEN 1
          WHEN '2-5m' THEN 2
          WHEN '5-10m' THEN 3
          WHEN '10-20m' THEN 4
          WHEN '20m+' THEN 5
          ELSE 6
        END
    `).all();

    // ROI statistics
    const roiStats = await env.DB.prepare(`
      SELECT
        i.instrument_type,
        COUNT(DISTINCT r.id) as total_rois,
        AVG(CASE WHEN r.roi_name IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100 as percent_with_rois
      FROM instruments i
      LEFT JOIN instrument_rois r ON i.id = r.instrument_id
      GROUP BY i.instrument_type
    `).all();

    return createSuccessResponse({
      deployment_trends: deploymentTrends.results || [],
      camera_brands: cameraBrands.results || [],
      camera_models: cameraModels.results || [],
      measurement_status: measurementStatus.results || [],
      height_distribution: heightDistribution.results || [],
      roi_statistics: roiStats.results || []
    });

  } catch (error) {
    console.error('Error generating instrument analytics:', error);
    return createErrorResponse('Failed to generate instrument analytics: ' + error.message, 500);
  }
}

/**
 * Get activity analytics (recent actions, user activity)
 * @param {Object} user - Authenticated admin user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Activity analytics response
 */
async function getActivityAnalytics(user, env) {
  try {
    let activityLog = [];
    let activityByDay = [];
    let activityByType = [];

    try {
      // Get recent activity
      const recentActivity = await env.DB.prepare(`
        SELECT
          action,
          resource_type,
          resource_id,
          details,
          ip_address,
          created_at
        FROM activity_log
        ORDER BY created_at DESC
        LIMIT 50
      `).all();
      activityLog = recentActivity.results || [];

      // Activity by day (last 30 days)
      const dailyActivity = await env.DB.prepare(`
        SELECT
          date(created_at) as date,
          COUNT(*) as count
        FROM activity_log
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY date
        ORDER BY date DESC
      `).all();
      activityByDay = dailyActivity.results || [];

      // Activity by type
      const typeActivity = await env.DB.prepare(`
        SELECT
          action,
          COUNT(*) as count
        FROM activity_log
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY action
        ORDER BY count DESC
      `).all();
      activityByType = typeActivity.results || [];

    } catch (e) {
      console.log('Activity log not available:', e.message);
    }

    // Get entity creation dates
    const entityTimeline = await env.DB.prepare(`
      SELECT 'station' as entity_type, created_at FROM stations
      UNION ALL
      SELECT 'platform' as entity_type, created_at FROM platforms
      UNION ALL
      SELECT 'instrument' as entity_type, created_at FROM instruments
      UNION ALL
      SELECT 'roi' as entity_type, created_at FROM instrument_rois
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return createSuccessResponse({
      recent_activity: activityLog,
      activity_by_day: activityByDay,
      activity_by_type: activityByType,
      entity_timeline: entityTimeline.results || [],
      note: activityLog.length === 0 ? 'Activity logging will be available after activity_log table migration' : null
    });

  } catch (error) {
    console.error('Error generating activity analytics:', error);
    return createErrorResponse('Failed to generate activity analytics: ' + error.message, 500);
  }
}

/**
 * Get system health metrics
 * @param {Object} user - Authenticated admin user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} System health response
 */
async function getSystemHealth(user, env) {
  try {
    // Check database connectivity
    const dbCheck = await env.DB.prepare('SELECT 1 as test').first();
    const databaseHealthy = dbCheck && dbCheck.test === 1;

    // Count entities with missing critical data
    const stationsNoCoordinates = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM stations
      WHERE latitude IS NULL OR longitude IS NULL
    `).first();

    const platformsNoCoordinates = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM platforms
      WHERE latitude IS NULL OR longitude IS NULL
    `).first();

    const instrumentsNoDeploymentDate = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM instruments
      WHERE deployment_date IS NULL
    `).first();

    const instrumentsNoHeight = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM instruments
      WHERE instrument_height_m IS NULL
    `).first();

    const instrumentsNoROIs = await env.DB.prepare(`
      SELECT COUNT(DISTINCT i.id) as count
      FROM instruments i
      LEFT JOIN instrument_rois r ON i.id = r.instrument_id
      WHERE r.id IS NULL
    `).first();

    // Calculate data quality scores
    const totalStations = await env.DB.prepare('SELECT COUNT(*) as count FROM stations').first();
    const totalPlatforms = await env.DB.prepare('SELECT COUNT(*) as count FROM platforms').first();
    const totalInstruments = await env.DB.prepare('SELECT COUNT(*) as count FROM instruments').first();

    const coordinateCompleteness = {
      stations: 100 - (stationsNoCoordinates.count / Math.max(totalStations.count, 1) * 100),
      platforms: 100 - (platformsNoCoordinates.count / Math.max(totalPlatforms.count, 1) * 100)
    };

    const metadataCompleteness = {
      deployment_dates: 100 - (instrumentsNoDeploymentDate.count / Math.max(totalInstruments.count, 1) * 100),
      heights: 100 - (instrumentsNoHeight.count / Math.max(totalInstruments.count, 1) * 100),
      rois: 100 - (instrumentsNoROIs.count / Math.max(totalInstruments.count, 1) * 100)
    };

    // Overall health score
    const healthScore = Math.round((
      coordinateCompleteness.stations +
      coordinateCompleteness.platforms +
      metadataCompleteness.deployment_dates +
      metadataCompleteness.heights +
      metadataCompleteness.rois
    ) / 5);

    return createSuccessResponse({
      database_healthy: databaseHealthy,
      health_score: healthScore,
      data_quality: {
        coordinate_completeness: coordinateCompleteness,
        metadata_completeness: metadataCompleteness
      },
      issues: {
        stations_without_coordinates: stationsNoCoordinates.count,
        platforms_without_coordinates: platformsNoCoordinates.count,
        instruments_without_deployment_date: instrumentsNoDeploymentDate.count,
        instruments_without_height: instrumentsNoHeight.count,
        instruments_without_rois: instrumentsNoROIs.count
      },
      recommendations: generateHealthRecommendations({
        stationsNoCoordinates: stationsNoCoordinates.count,
        platformsNoCoordinates: platformsNoCoordinates.count,
        instrumentsNoDeploymentDate: instrumentsNoDeploymentDate.count,
        instrumentsNoHeight: instrumentsNoHeight.count,
        instrumentsNoROIs: instrumentsNoROIs.count
      })
    });

  } catch (error) {
    console.error('Error checking system health:', error);
    return createErrorResponse('Failed to check system health: ' + error.message, 500);
  }
}

/**
 * Generate health recommendations based on issues
 * @param {Object} issues - Object containing issue counts
 * @returns {Array} Array of recommendation objects
 */
function generateHealthRecommendations(issues) {
  const recommendations = [];

  if (issues.stationsNoCoordinates > 0) {
    recommendations.push({
      priority: 'high',
      category: 'data_quality',
      message: `${issues.stationsNoCoordinates} station(s) missing coordinates. Add latitude/longitude for mapping.`
    });
  }

  if (issues.platformsNoCoordinates > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'data_quality',
      message: `${issues.platformsNoCoordinates} platform(s) missing coordinates. Consider adding precise platform locations.`
    });
  }

  if (issues.instrumentsNoDeploymentDate > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'metadata',
      message: `${issues.instrumentsNoDeploymentDate} instrument(s) missing deployment dates. Update for timeline analysis.`
    });
  }

  if (issues.instrumentsNoHeight > 0) {
    recommendations.push({
      priority: 'low',
      category: 'metadata',
      message: `${issues.instrumentsNoHeight} instrument(s) missing height data. Add for spatial analysis.`
    });
  }

  if (issues.instrumentsNoROIs > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'rois',
      message: `${issues.instrumentsNoROIs} instrument(s) have no ROIs defined. Add ROIs for image analysis.`
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'info',
      category: 'success',
      message: 'System health is excellent! All critical data is complete.'
    });
  }

  return recommendations;
}
