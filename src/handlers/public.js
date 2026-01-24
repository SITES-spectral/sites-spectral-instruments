/**
 * Public API Handler
 * No-authentication endpoints for public dashboard and status
 *
 * Provides read-only access to station status, platform counts,
 * and system health without requiring authentication.
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module handlers/public
 * @version 15.0.0
 */

import { createErrorResponse, createNotFoundResponse } from '../utils/responses.js';

/**
 * Handle public API endpoints
 *
 * @param {string} method - HTTP method
 * @param {string[]} pathSegments - Path segments after /api/public
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
export async function handlePublicApi(method, pathSegments, request, env) {
  const resource = pathSegments[0];

  switch (resource) {
    case 'stations':
      if (method !== 'GET') {
        return createErrorResponse('Method not allowed', 405);
      }
      return await getPublicStations(request, env);

    case 'health':
      if (method !== 'GET') {
        return createErrorResponse('Method not allowed', 405);
      }
      return await getPublicHealth(env);

    case 'metrics':
      if (method !== 'GET') {
        return createErrorResponse('Method not allowed', 405);
      }
      return await getPublicMetrics(env);

    case 'station':
      if (method !== 'GET') {
        return createErrorResponse('Method not allowed', 405);
      }
      return await getPublicStationDetails(pathSegments[1], env);

    default:
      return createNotFoundResponse('Public endpoint not found');
  }
}

/**
 * Get list of all stations with public information
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function getPublicStations(request, env) {
  try {
    const url = new URL(request.url);
    const sitesOnly = url.searchParams.get('sites_member') === 'true';

    let query = `
      SELECT
        s.id,
        s.acronym,
        s.display_name,
        s.description,
        s.latitude,
        s.longitude,
        s.elevation_m,
        s.status,
        s.country,
        s.sites_member,
        s.icos_member,
        s.icos_class,
        (SELECT COUNT(*) FROM platforms p WHERE p.station_id = s.id) as platform_count,
        (SELECT COUNT(*) FROM instruments i
         JOIN platforms p ON i.platform_id = p.id
         WHERE p.station_id = s.id) as instrument_count
      FROM stations s
      WHERE 1=1
    `;

    if (sitesOnly) {
      query += ' AND s.sites_member = 1';
    }

    query += ' ORDER BY s.display_name';

    const result = await env.DB.prepare(query).all();

    // Add operational status indicator
    const stations = result.results.map(station => ({
      ...station,
      sites_member: !!station.sites_member,
      icos_member: !!station.icos_member,
      portal_url: `https://${station.acronym.toLowerCase()}.sitesspectral.work`,
      operational_status: getOperationalStatus(station)
    }));

    return new Response(JSON.stringify({
      success: true,
      count: stations.length,
      stations
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      }
    });

  } catch (error) {
    console.error('Error fetching public stations:', error);
    return createErrorResponse('Failed to fetch stations', 500);
  }
}

/**
 * Get public health status
 *
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function getPublicHealth(env) {
  try {
    // Test database connectivity
    const dbTest = await env.DB.prepare('SELECT 1 as test').first();

    // Get basic counts
    const counts = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM stations) as stations,
        (SELECT COUNT(*) FROM platforms) as platforms,
        (SELECT COUNT(*) FROM instruments) as instruments
    `).first();

    return new Response(JSON.stringify({
      status: dbTest ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbTest ? 'connected' : 'disconnected',
      version: env.APP_VERSION || '15.0.0',
      counts: {
        stations: counts?.stations || 0,
        platforms: counts?.platforms || 0,
        instruments: counts?.instruments || 0
      }
    }), {
      status: dbTest ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // 1 minute cache
      }
    });

  } catch (error) {
    console.error('Error in public health check:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get public metrics summary
 *
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function getPublicMetrics(env) {
  try {
    // Get platform counts by type
    const platformsByType = await env.DB.prepare(`
      SELECT platform_type, COUNT(*) as count
      FROM platforms
      GROUP BY platform_type
    `).all();

    // Get instrument counts by type
    const instrumentsByType = await env.DB.prepare(`
      SELECT instrument_type, COUNT(*) as count
      FROM instruments
      GROUP BY instrument_type
    `).all();

    // Get station counts by status
    const stationsByStatus = await env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM stations
      GROUP BY status
    `).all();

    // Get active instruments count
    const activeInstruments = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM instruments
      WHERE status = 'Active'
    `).first();

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        platforms_by_type: Object.fromEntries(
          platformsByType.results.map(r => [r.platform_type, r.count])
        ),
        instruments_by_type: Object.fromEntries(
          instrumentsByType.results.map(r => [r.instrument_type, r.count])
        ),
        stations_by_status: Object.fromEntries(
          stationsByStatus.results.map(r => [r.status || 'unknown', r.count])
        ),
        active_instruments: activeInstruments?.count || 0
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      }
    });

  } catch (error) {
    console.error('Error fetching public metrics:', error);
    return createErrorResponse('Failed to fetch metrics', 500);
  }
}

/**
 * Get public details for a specific station
 *
 * @param {string} stationId - Station ID or acronym
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function getPublicStationDetails(stationId, env) {
  if (!stationId) {
    return createErrorResponse('Station ID or acronym is required', 400);
  }

  try {
    // Try to find by ID or acronym
    const station = await env.DB.prepare(`
      SELECT
        s.id,
        s.acronym,
        s.display_name,
        s.description,
        s.latitude,
        s.longitude,
        s.elevation_m,
        s.status,
        s.country,
        s.sites_member,
        s.icos_member,
        s.icos_class
      FROM stations s
      WHERE s.id = ? OR LOWER(s.acronym) = LOWER(?)
    `).bind(stationId, stationId).first();

    if (!station) {
      return createNotFoundResponse('Station not found');
    }

    // Get platform summary (no sensitive details)
    const platforms = await env.DB.prepare(`
      SELECT
        p.id,
        p.normalized_name,
        p.display_name,
        p.platform_type,
        p.ecosystem_code,
        p.status,
        (SELECT COUNT(*) FROM instruments i WHERE i.platform_id = p.id) as instrument_count
      FROM platforms p
      WHERE p.station_id = ?
      ORDER BY p.display_name
    `).bind(station.id).all();

    // Get instrument type summary (no sensitive details)
    const instrumentSummary = await env.DB.prepare(`
      SELECT instrument_type, COUNT(*) as count
      FROM instruments i
      JOIN platforms p ON i.platform_id = p.id
      WHERE p.station_id = ?
      GROUP BY instrument_type
    `).bind(station.id).all();

    return new Response(JSON.stringify({
      success: true,
      station: {
        ...station,
        sites_member: !!station.sites_member,
        icos_member: !!station.icos_member,
        portal_url: `https://${station.acronym.toLowerCase()}.sitesspectral.work`,
        operational_status: getOperationalStatus(station)
      },
      platforms: platforms.results.map(p => ({
        ...p,
        instruments: instrumentSummary.results.find(
          i => i.instrument_type === p.platform_type
        )?.count || 0
      })),
      instrument_summary: Object.fromEntries(
        instrumentSummary.results.map(r => [r.instrument_type, r.count])
      )
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      }
    });

  } catch (error) {
    console.error('Error fetching public station details:', error);
    return createErrorResponse('Failed to fetch station details', 500);
  }
}

/**
 * Determine operational status based on station data
 *
 * @param {Object} station - Station record
 * @returns {string} Operational status
 */
function getOperationalStatus(station) {
  if (station.status === 'Inactive') {
    return 'offline';
  }

  if (station.instrument_count === 0) {
    return 'pending';
  }

  if (station.status === 'Active') {
    return 'operational';
  }

  return 'unknown';
}

export default handlePublicApi;
