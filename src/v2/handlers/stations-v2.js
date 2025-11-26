// SITES Spectral Stations Handler v2.0.0
// Enhanced with pagination support

import { requireAuthentication, getUserFromRequest } from '../../auth/authentication.js';
import { checkUserPermissions } from '../../auth/permissions.js';
import { executeQuery, executeQueryFirst } from '../../utils/database.js';
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
  addPaginationToQuery,
  generateCountQuery
} from '../../middleware/pagination.js';

/**
 * Handle stations requests with pagination (V2)
 * @param {string} method - HTTP method
 * @param {string|null} id - Station ID or null for list
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} API response
 */
export async function handleStationsV2(method, id, request, env) {
  // Require authentication for all requests
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  switch (method) {
    case 'GET':
      if (id) {
        return await getStationByIdV2(id, user, env);
      }
      return await getStationsListV2(request, user, env);

    case 'POST':
    case 'PUT':
    case 'DELETE':
      // Write operations require admin access via /api/admin/
      return createForbiddenResponse();

    default:
      return createMethodNotAllowedResponse();
  }
}

/**
 * Get paginated list of stations (V2)
 * @param {Request} request - The incoming request
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Paginated stations list
 */
async function getStationsListV2(request, user, env) {
  const { limit, offset } = extractPaginationParams(request);

  let baseQuery = `
    SELECT
      id, normalized_name, display_name, acronym, status, country,
      latitude, longitude, elevation_m, epsg_code, description,
      created_at, updated_at
    FROM stations
  `;

  const params = [];

  // Station users can only see their own station
  if (user.role === 'station' && user.station_normalized_name) {
    baseQuery += ' WHERE normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  baseQuery += ' ORDER BY display_name';

  // Get total count
  const countQuery = generateCountQuery(baseQuery);
  const countResult = await executeQueryFirst(env, countQuery, params, 'getStationsCount-v2');
  const total = countResult?.total || 0;

  // Get paginated results
  const paginatedQuery = addPaginationToQuery(baseQuery, limit, offset);
  const result = await executeQuery(env, paginatedQuery, params, 'getStationsList-v2');

  return createSuccessResponse(
    buildPaginatedResponse(result.results || [], total, limit, offset, 'stations')
  );
}

/**
 * Get station by ID, acronym, or normalized_name (V2)
 * @param {string} identifier - Station identifier
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Station details
 */
async function getStationByIdV2(identifier, user, env) {
  const query = `
    SELECT
      id, normalized_name, display_name, acronym, status, country,
      latitude, longitude, elevation_m, epsg_code, description,
      created_at, updated_at
    FROM stations
    WHERE id = ? OR acronym = ? OR normalized_name = ?
  `;

  const result = await executeQueryFirst(env, query, [identifier, identifier, identifier], 'getStationById-v2');

  if (!result) {
    return createNotFoundResponse();
  }

  // Check station access for station users
  if (user.role === 'station' && user.station_normalized_name) {
    if (result.normalized_name !== user.station_normalized_name) {
      return createForbiddenResponse();
    }
  }

  return createSuccessResponse({ station: result });
}
