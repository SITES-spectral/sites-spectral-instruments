/**
 * Analytics Service
 *
 * Business logic for system analytics and metrics.
 * Orchestrates repository calls and computes derived metrics.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles analytics business logic
 * - Dependency Inversion: Depends on AnalyticsRepository abstraction
 *
 * @module domain/analytics/AnalyticsService
 */

export class AnalyticsService {
  /**
   * @param {import('./AnalyticsRepository.js').AnalyticsRepository} analyticsRepository
   */
  constructor(analyticsRepository) {
    this.repository = analyticsRepository;
  }

  /**
   * Get comprehensive system overview
   * @returns {Promise<Object>} System overview data
   */
  async getSystemOverview() {
    const [
      counts,
      stationsStatus,
      platformsStatus,
      instrumentsStatus,
      instrumentTypes,
      ecosystems,
      deploymentTimeline,
      recentActivity
    ] = await Promise.all([
      this.repository.getTotalCounts(),
      this.repository.getStatusBreakdown('stations'),
      this.repository.getStatusBreakdown('platforms'),
      this.repository.getStatusBreakdown('instruments'),
      this.repository.getInstrumentTypeDistribution(),
      this.repository.getEcosystemDistribution(),
      this.repository.getDeploymentTimeline(),
      this.repository.getRecentActivity(7)
    ]);

    // Calculate averages
    const avgPlatformsPerStation = counts.platforms / Math.max(counts.stations, 1);
    const avgInstrumentsPerPlatform = counts.instruments / Math.max(counts.platforms, 1);
    const avgROIsPerInstrument = counts.rois / Math.max(counts.instruments, 1);

    return {
      generated_at: new Date().toISOString(),
      summary: {
        total_stations: counts.stations,
        total_platforms: counts.platforms,
        total_instruments: counts.instruments,
        total_rois: counts.rois,
        avg_platforms_per_station: Math.round(avgPlatformsPerStation * 10) / 10,
        avg_instruments_per_platform: Math.round(avgInstrumentsPerPlatform * 10) / 10,
        avg_rois_per_instrument: Math.round(avgROIsPerInstrument * 10) / 10
      },
      status_breakdown: {
        stations: stationsStatus,
        platforms: platformsStatus,
        instruments: instrumentsStatus
      },
      instrument_types: instrumentTypes,
      ecosystems: ecosystems,
      deployment_timeline: deploymentTimeline,
      recent_activity: recentActivity
    };
  }

  /**
   * Get detailed station analytics with rankings
   * @returns {Promise<Object>} Station analytics data
   */
  async getStationAnalytics() {
    const stations = await this.repository.getStationsWithCounts();

    // Calculate rankings
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

    return {
      stations: stationsWithRanks,
      total_stations: stations.length,
      most_active_station: stationsWithRanks[0] || null,
      least_active_station: stationsWithRanks[stationsWithRanks.length - 1] || null
    };
  }

  /**
   * Get detailed instrument analytics
   * @returns {Promise<Object>} Instrument analytics data
   */
  async getInstrumentAnalytics() {
    const [
      deploymentTrends,
      cameraBrands,
      cameraModels,
      measurementStatus,
      heightDistribution,
      roiStats
    ] = await Promise.all([
      this.repository.getDeploymentTrends(24),
      this.repository.getCameraBrandDistribution(),
      this.repository.getCameraModelDistribution(10),
      this.repository.getMeasurementStatusDistribution(),
      this.repository.getHeightDistribution(),
      this.repository.getROIStatistics()
    ]);

    return {
      deployment_trends: deploymentTrends,
      camera_brands: cameraBrands,
      camera_models: cameraModels,
      measurement_status: measurementStatus,
      height_distribution: heightDistribution,
      roi_statistics: roiStats
    };
  }

  /**
   * Get activity analytics
   * @returns {Promise<Object>} Activity analytics data
   */
  async getActivityAnalytics() {
    const [
      activityLog,
      activityByDay,
      activityByType,
      entityTimeline
    ] = await Promise.all([
      this.repository.getActivityLog(50),
      this.repository.getActivityByDay(30),
      this.repository.getActivityByType(30),
      this.repository.getEntityTimeline(100)
    ]);

    return {
      recent_activity: activityLog,
      activity_by_day: activityByDay,
      activity_by_type: activityByType,
      entity_timeline: entityTimeline,
      note: activityLog.length === 0 ? 'Activity logging will be available after activity_log table migration' : null
    };
  }

  /**
   * Get system health metrics
   * @returns {Promise<Object>} System health data
   */
  async getSystemHealth() {
    const [databaseHealthy, counts, issues] = await Promise.all([
      this.repository.checkDatabaseHealth(),
      this.repository.getTotalCounts(),
      this.repository.getHealthIssues()
    ]);

    // Calculate data quality scores
    const coordinateCompleteness = {
      stations: 100 - (issues.stationsNoCoordinates / Math.max(counts.stations, 1) * 100),
      platforms: 100 - (issues.platformsNoCoordinates / Math.max(counts.platforms, 1) * 100)
    };

    const metadataCompleteness = {
      deployment_dates: 100 - (issues.instrumentsNoDeploymentDate / Math.max(counts.instruments, 1) * 100),
      heights: 100 - (issues.instrumentsNoHeight / Math.max(counts.instruments, 1) * 100),
      rois: 100 - (issues.instrumentsNoROIs / Math.max(counts.instruments, 1) * 100)
    };

    // Overall health score
    const healthScore = Math.round((
      coordinateCompleteness.stations +
      coordinateCompleteness.platforms +
      metadataCompleteness.deployment_dates +
      metadataCompleteness.heights +
      metadataCompleteness.rois
    ) / 5);

    return {
      database_healthy: databaseHealthy,
      health_score: healthScore,
      data_quality: {
        coordinate_completeness: coordinateCompleteness,
        metadata_completeness: metadataCompleteness
      },
      issues: {
        stations_without_coordinates: issues.stationsNoCoordinates,
        platforms_without_coordinates: issues.platformsNoCoordinates,
        instruments_without_deployment_date: issues.instrumentsNoDeploymentDate,
        instruments_without_height: issues.instrumentsNoHeight,
        instruments_without_rois: issues.instrumentsNoROIs
      },
      recommendations: this.generateHealthRecommendations(issues)
    };
  }

  /**
   * Generate health recommendations based on issues
   * @param {Object} issues - Issue counts
   * @returns {Array} Recommendations
   */
  generateHealthRecommendations(issues) {
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
}
