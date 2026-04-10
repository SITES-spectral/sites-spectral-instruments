/**
 * Public API Handler
 * No-authentication endpoints for public dashboard and status
 *
 * Reads from the public-only database (PUBLIC_DB) which contains
 * denormalized station data synced from the main database.
 * The main database is never exposed to public queries.
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module handlers/public
 * @version 16.1.0
 */

import { createErrorResponse, createNotFoundResponse } from '../utils/responses.js';
import { checkAuthRateLimit } from '../middleware/auth-rate-limiter.js';

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
  // v16.0.0 (M4): Rate limit public endpoints (60 req/min per IP)
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  try {
    const rateLimit = await checkAuthRateLimit(clientIP, 'public_api', env);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: 'Too many requests. Please try again later.',
        retry_after_seconds: rateLimit.retryAfter
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter)
        }
      });
    }
  } catch {
    // Rate limit check failed — allow request but log
    console.warn('Public API rate limit check failed');
  }

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
 * Get the public database binding, with fallback to main DB
 * during migration period before PUBLIC_DB is created.
 *
 * @param {Object} env - Environment variables and bindings
 * @returns {Object} D1 database binding
 */
function getPublicDb(env) {
  return env.PUBLIC_DB || env.DB;
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
    const db = getPublicDb(env);
    const url = new URL(request.url);
    const sitesOnly = url.searchParams.get('sites_member') === 'true';

    let query = `
      SELECT
        id, acronym, normalized_name, display_name, description,
        latitude, longitude, elevation_m, status, country,
        sites_member, icos_member, icos_class,
        platform_count, instrument_count
      FROM public_stations
      WHERE 1=1
    `;

    if (sitesOnly) {
      query += ' AND sites_member = 1';
    }

    query += ' ORDER BY display_name';

    const result = await db.prepare(query).all();

    const stations = result.results.map(station => ({
      ...station,
      sites_member: !!station.sites_member,
      icos_member: !!station.icos_member,
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
        'Cache-Control': 'public, max-age=300'
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
    const db = getPublicDb(env);

    // Test database connectivity
    const dbTest = await db.prepare('SELECT 1 as test').first();

    // Get counts from denormalized public_stations
    const counts = await db.prepare(`
      SELECT
        COUNT(*) as stations,
        COALESCE(SUM(platform_count), 0) as platforms,
        COALESCE(SUM(instrument_count), 0) as instruments
      FROM public_stations
    `).first();

    return new Response(JSON.stringify({
      status: dbTest ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbTest ? 'connected' : 'disconnected',
      counts: {
        stations: counts?.stations || 0,
        platforms: counts?.platforms || 0,
        instruments: counts?.instruments || 0
      }
    }), {
      status: dbTest ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
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
 * Station-level metrics only — platform/instrument type breakdowns are internal data
 *
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function getPublicMetrics(env) {
  try {
    const db = getPublicDb(env);

    // Station counts by status
    const stationsByStatus = await db.prepare(`
      SELECT status, COUNT(*) as count
      FROM public_stations
      GROUP BY status
    `).all();

    // Aggregate totals
    const totals = await db.prepare(`
      SELECT
        COUNT(*) as total_stations,
        COALESCE(SUM(platform_count), 0) as total_platforms,
        COALESCE(SUM(instrument_count), 0) as total_instruments
      FROM public_stations
    `).first();

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        stations_by_status: Object.fromEntries(
          stationsByStatus.results.map(r => [r.status || 'unknown', r.count])
        ),
        total_stations: totals?.total_stations || 0,
        total_platforms: totals?.total_platforms || 0,
        total_instruments: totals?.total_instruments || 0
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
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
    const db = getPublicDb(env);

    const station = await db.prepare(`
      SELECT
        id, acronym, normalized_name, display_name, description,
        latitude, longitude, elevation_m, status, country,
        sites_member, icos_member, icos_class,
        platform_count, instrument_count
      FROM public_stations
      WHERE id = ? OR LOWER(acronym) = LOWER(?) OR LOWER(normalized_name) = LOWER(?)
    `).bind(stationId, stationId, stationId).first();

    if (!station) {
      return createNotFoundResponse('Station not found');
    }

    return new Response(JSON.stringify({
      success: true,
      station: {
        ...station,
        sites_member: !!station.sites_member,
        icos_member: !!station.icos_member,
        operational_status: getOperationalStatus(station)
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
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
