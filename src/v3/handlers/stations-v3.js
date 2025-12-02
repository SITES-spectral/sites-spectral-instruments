// V3 Stations Handler
// Provides V3 API endpoints for station data with pagination support

import { requireAuthentication } from '../../auth/permissions.js';
import { getStationData, getStationsData } from '../../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../../utils/responses.js';
import { parsePaginationParams, createPaginatedResponse } from '../api-handler-v3.js';

/**
 * V3 Stations Handler
 * Handles /api/v3/stations endpoints with pagination
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment bindings
 * @param {Object} ctx - Request context
 * @param {string[]} pathSegments - URL path segments after /api/v3/stations
 * @returns {Response} API response
 */
export async function handleStationsV3(request, env, ctx, pathSegments) {
  const method = request.method;
  const url = new URL(request.url);

  // Only GET is supported for V3 stations
  if (method !== 'GET') {
    return createMethodNotAllowedResponse();
  }

  // Authentication required
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  try {
    // Route: /api/v3/stations/:id
    if (pathSegments.length > 0 && pathSegments[0]) {
      const stationId = pathSegments[0];

      // Route: /api/v3/stations/:id/summary
      if (pathSegments[1] === 'summary') {
        return await getStationSummaryV3(stationId, user, env);
      }

      // Route: /api/v3/stations/:id/platforms
      if (pathSegments[1] === 'platforms') {
        return await getStationPlatformsV3(stationId, user, env, url);
      }

      // Route: /api/v3/stations/:id/aois
      if (pathSegments[1] === 'aois') {
        return await getStationAOIsV3(stationId, user, env, url);
      }

      // Default: Get single station
      return await getStationByIdV3(stationId, user, env);
    }

    // Route: /api/v3/stations (list with pagination)
    return await getStationsListV3(user, env, url);

  } catch (error) {
    console.error('V3 Stations handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get single station by ID with V3 response format
 */
async function getStationByIdV3(id, user, env) {
  const station = await getStationData(id, env);

  if (!station) {
    return createNotFoundResponse('Station not found');
  }

  // Check access permission
  if (!canAccessStation(user, station)) {
    return createForbiddenResponse();
  }

  // V3 response format with data wrapper
  return new Response(JSON.stringify({
    data: station,
    meta: {
      api_version: 'v3'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get station summary with counts
 */
async function getStationSummaryV3(id, user, env) {
  const station = await getStationData(id, env);

  if (!station) {
    return createNotFoundResponse('Station not found');
  }

  if (!canAccessStation(user, station)) {
    return createForbiddenResponse();
  }

  // Get counts
  const platformCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM platforms WHERE station_id = ?
  `).bind(station.id).first();

  const instrumentCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    WHERE p.station_id = ?
  `).bind(station.id).first();

  const roiCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM instrument_rois ir
    JOIN instruments i ON ir.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    WHERE p.station_id = ?
  `).bind(station.id).first();

  return new Response(JSON.stringify({
    data: {
      ...station,
      summary: {
        platforms: platformCount?.count || 0,
        instruments: instrumentCount?.count || 0,
        rois: roiCount?.count || 0
      }
    },
    meta: {
      api_version: 'v3'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get paginated list of stations
 */
async function getStationsListV3(user, env, url) {
  const pagination = parsePaginationParams(url);

  // Get all accessible stations
  const stations = await getStationsData(user, env);

  // Apply pagination
  const totalCount = stations.length;
  const paginatedStations = stations.slice(pagination.offset, pagination.offset + pagination.limit);

  // Create V3 paginated response
  const response = createPaginatedResponse(
    paginatedStations,
    totalCount,
    pagination,
    '/api/v3/stations'
  );

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get platforms for a station with pagination
 */
async function getStationPlatformsV3(stationId, user, env, url) {
  const station = await getStationData(stationId, env);

  if (!station) {
    return createNotFoundResponse('Station not found');
  }

  if (!canAccessStation(user, station)) {
    return createForbiddenResponse();
  }

  const pagination = parsePaginationParams(url);
  const platformType = url.searchParams.get('type');

  // Build query
  let query = `
    SELECT p.*,
           (SELECT COUNT(*) FROM instruments WHERE platform_id = p.id) as instrument_count
    FROM platforms p
    WHERE p.station_id = ?
  `;
  const params = [station.id];

  if (platformType) {
    query += ' AND p.platform_type = ?';
    params.push(platformType);
  }

  query += ' ORDER BY p.display_name ASC';

  // Get total count
  const countResult = await env.DB.prepare(
    query.replace('SELECT p.*,', 'SELECT COUNT(*) as count FROM (SELECT p.id').replace('ORDER BY p.display_name ASC', ') as sub')
  ).bind(...params).first();

  // Get paginated results
  query += ` LIMIT ? OFFSET ?`;
  params.push(pagination.limit, pagination.offset);

  const platforms = await env.DB.prepare(query).bind(...params).all();

  const response = createPaginatedResponse(
    platforms.results || [],
    countResult?.count || 0,
    pagination,
    `/api/v3/stations/${stationId}/platforms`
  );

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get AOIs/ROIs for a station with pagination
 */
async function getStationAOIsV3(stationId, user, env, url) {
  const station = await getStationData(stationId, env);

  if (!station) {
    return createNotFoundResponse('Station not found');
  }

  if (!canAccessStation(user, station)) {
    return createForbiddenResponse();
  }

  const pagination = parsePaginationParams(url);

  // Get total count
  const countResult = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM instrument_rois ir
    JOIN instruments i ON ir.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    WHERE p.station_id = ?
  `).bind(station.id).first();

  // Get paginated results
  const rois = await env.DB.prepare(`
    SELECT ir.*, i.normalized_name as instrument_name, p.normalized_name as platform_name
    FROM instrument_rois ir
    JOIN instruments i ON ir.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    WHERE p.station_id = ?
    ORDER BY ir.roi_name ASC
    LIMIT ? OFFSET ?
  `).bind(station.id, pagination.limit, pagination.offset).all();

  const response = createPaginatedResponse(
    rois.results || [],
    countResult?.count || 0,
    pagination,
    `/api/v3/stations/${stationId}/aois`
  );

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Check if user can access a specific station
 */
function canAccessStation(user, station) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'station') {
    return user.station_normalized_name === station.normalized_name ||
           user.station_acronym === station.acronym ||
           user.station_acronym === station.normalized_name ||
           user.station_id === station.id;
  }

  // readonly users can access all stations for viewing
  return user.role === 'readonly';
}
