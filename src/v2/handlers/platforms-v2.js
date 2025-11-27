// SITES Spectral Platforms Handler v2.0.0
// Enhanced with pagination support

import { requireAuthentication, checkUserPermissions } from '../../auth/permissions.js';
import { executeQuery, executeQueryFirst, getStationData } from '../../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createMethodNotAllowedResponse,
  createForbiddenResponse
} from '../../utils/responses.js';
import {
  extractPaginationParams,
  buildPaginatedResponse,
  addPaginationToQuery
} from '../../middleware/pagination.js';

/**
 * Handle platforms requests with pagination (V2)
 * @param {string} method - HTTP method
 * @param {string|null} id - Platform ID or null for list
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} API response
 */
export async function handlePlatformsV2(method, id, request, env) {
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  switch (method) {
    case 'GET':
      if (id) {
        return await getPlatformByIdV2(id, user, env);
      }
      return await getPlatformsListV2(request, user, env);

    case 'POST':
    case 'PUT':
    case 'DELETE':
      // Use v1 API for write operations
      return createErrorResponse('Write operations available at /api/platforms', 400);

    default:
      return createMethodNotAllowedResponse();
  }
}

/**
 * Get paginated list of platforms (V2)
 * @param {Request} request - The incoming request
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Paginated platforms list
 */
async function getPlatformsListV2(request, user, env) {
  const url = new URL(request.url);
  const { limit, offset } = extractPaginationParams(request);

  // Filter by station if provided
  const stationParam = url.searchParams.get('station') || url.searchParams.get('station_id');

  let baseQuery = `
    SELECT
      p.id, p.station_id, p.normalized_name, p.display_name,
      p.location_code, p.mounting_structure, p.platform_height_m,
      p.status, p.latitude, p.longitude, p.epsg_code,
      p.operation_programs, p.research_programs, p.deployment_date,
      p.description, p.created_at, p.updated_at,
      s.acronym as station_acronym, s.display_name as station_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
  `;

  const params = [];
  const conditions = [];

  // Apply station filter
  if (stationParam) {
    const station = await getStationData(env, stationParam);
    if (!station) {
      return createNotFoundResponse();
    }
    conditions.push('p.station_id = ?');
    params.push(station.id);
  }

  // Station users can only see their own station's platforms
  if (user.role === 'station' && user.station_normalized_name) {
    conditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  baseQuery += ' ORDER BY s.acronym, p.normalized_name';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM platforms p JOIN stations s ON p.station_id = s.id` +
    (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '');
  const countResult = await executeQueryFirst(env, countQuery, params, 'getPlatformsCount-v2');
  const total = countResult?.total || 0;

  // Get paginated results
  const paginatedQuery = addPaginationToQuery(baseQuery, limit, offset);
  const result = await executeQuery(env, paginatedQuery, params, 'getPlatformsList-v2');

  return createSuccessResponse(
    buildPaginatedResponse(result.results || [], total, limit, offset, 'platforms')
  );
}

/**
 * Get platform by ID (V2)
 * @param {string} id - Platform identifier
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Platform details
 */
async function getPlatformByIdV2(id, user, env) {
  const query = `
    SELECT
      p.id, p.station_id, p.normalized_name, p.display_name,
      p.location_code, p.mounting_structure, p.platform_height_m,
      p.status, p.latitude, p.longitude, p.epsg_code,
      p.operation_programs, p.research_programs, p.deployment_date,
      p.description, p.created_at, p.updated_at,
      s.acronym as station_acronym, s.display_name as station_name,
      s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ? OR p.normalized_name = ?
  `;

  const result = await executeQueryFirst(env, query, [id, id], 'getPlatformById-v2');

  if (!result) {
    return createNotFoundResponse();
  }

  // Check station access for station users
  if (user.role === 'station' && user.station_normalized_name) {
    if (result.station_normalized_name !== user.station_normalized_name) {
      return createForbiddenResponse();
    }
  }

  return createSuccessResponse({ platform: result });
}
