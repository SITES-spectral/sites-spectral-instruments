// V3 Instruments Handler
// Provides V3 API endpoints for instrument data with pagination support

import { requireAuthentication } from '../../auth/permissions.js';
import { executeQuery, executeQueryFirst } from '../../utils/database.js';
import {
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../../utils/responses.js';
import { parsePaginationParams, createPaginatedResponse } from '../api-handler-v3.js';

/**
 * V3 Instruments Handler
 * Handles /api/v3/instruments endpoints with pagination
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment bindings
 * @param {Object} ctx - Request context
 * @param {string[]} pathSegments - URL path segments after /api/v3/instruments
 * @returns {Response} API response
 */
export async function handleInstrumentsV3(request, env, ctx, pathSegments) {
  const method = request.method;
  const url = new URL(request.url);

  // Only GET is supported for V3 instruments read operations
  if (method !== 'GET') {
    return createMethodNotAllowedResponse();
  }

  // Authentication required
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  try {
    // Route: /api/v3/instruments/:id
    if (pathSegments.length > 0 && pathSegments[0]) {
      const instrumentId = pathSegments[0];

      // Route: /api/v3/instruments/:id/rois
      if (pathSegments[1] === 'rois') {
        return await getInstrumentROIsV3(instrumentId, user, env, url);
      }

      // Default: Get single instrument
      return await getInstrumentByIdV3(instrumentId, user, env);
    }

    // Route: /api/v3/instruments (list with pagination and filters)
    return await getInstrumentsListV3(user, env, url);

  } catch (error) {
    console.error('V3 Instruments handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get single instrument by ID with V3 response format
 */
async function getInstrumentByIdV3(identifier, user, env) {
  const numericId = parseInt(identifier, 10);
  const isNumeric = !isNaN(numericId) && String(numericId) === String(identifier);

  let query = `
    SELECT i.*,
           p.display_name as platform_name, p.normalized_name as platform_normalized_name,
           p.platform_type, p.ecosystem_code as platform_ecosystem,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           (SELECT COUNT(*) FROM instrument_rois WHERE instrument_id = i.id) as roi_count
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
  `;

  let params = [];
  if (isNumeric) {
    query += ' WHERE i.id = ?';
    params = [numericId];
  } else {
    query += ' WHERE (i.normalized_name = ? OR i.legacy_acronym = ?)';
    params = [identifier, identifier];
  }

  // Apply station access filter for station users
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const result = await executeQueryFirst(env, query, params, 'getInstrumentByIdV3');

  if (!result) {
    return createNotFoundResponse('Instrument not found');
  }

  return new Response(JSON.stringify({
    data: result,
    meta: {
      api_version: 'v3'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get paginated list of instruments with filters
 */
async function getInstrumentsListV3(user, env, url) {
  const pagination = parsePaginationParams(url);

  // Parse filter parameters
  const stationFilter = url.searchParams.get('station');
  const platformFilter = url.searchParams.get('platform');
  const typeFilter = url.searchParams.get('type');
  const statusFilter = url.searchParams.get('status');

  // Build base query
  let baseQuery = `
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE 1=1
  `;
  const params = [];

  // Apply filters
  if (stationFilter) {
    baseQuery += ' AND (s.acronym = ? OR s.normalized_name = ?)';
    params.push(stationFilter, stationFilter);
  }

  if (platformFilter) {
    const platformId = parseInt(platformFilter, 10);
    if (!isNaN(platformId)) {
      baseQuery += ' AND i.platform_id = ?';
      params.push(platformId);
    } else {
      baseQuery += ' AND p.normalized_name = ?';
      params.push(platformFilter);
    }
  }

  if (typeFilter) {
    baseQuery += ' AND i.instrument_type = ?';
    params.push(typeFilter);
  }

  if (statusFilter) {
    baseQuery += ' AND i.status = ?';
    params.push(statusFilter);
  }

  // Apply station access filter for station users
  if (user.role === 'station' && user.station_normalized_name) {
    baseQuery += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
  const countResult = await executeQueryFirst(env, countQuery, params, 'countInstrumentsV3');
  const totalCount = countResult?.count || 0;

  // Get paginated results
  const selectQuery = `
    SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
           i.instrument_type, i.ecosystem_code, i.instrument_number, i.status,
           i.deployment_date, i.calibration_date,
           i.latitude, i.longitude, i.viewing_direction, i.azimuth_degrees,
           i.camera_brand, i.camera_model, i.camera_resolution,
           i.instrument_height_m, i.degrees_from_nadir, i.description,
           i.first_measurement_year, i.last_measurement_year, i.measurement_status,
           i.created_at, i.updated_at,
           p.display_name as platform_name, p.normalized_name as platform_normalized_name,
           p.platform_type,
           s.acronym as station_acronym, s.display_name as station_name,
           (SELECT COUNT(*) FROM instrument_rois WHERE instrument_id = i.id) as roi_count
    ${baseQuery}
    ORDER BY i.display_name ASC
    LIMIT ? OFFSET ?
  `;

  const dataParams = [...params, pagination.limit, pagination.offset];
  const results = await executeQuery(env, selectQuery, dataParams, 'getInstrumentsListV3');

  // Build response
  const response = createPaginatedResponse(
    results || [],
    totalCount,
    pagination,
    '/api/v3/instruments'
  );

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get ROIs for an instrument with pagination
 */
async function getInstrumentROIsV3(instrumentId, user, env, url) {
  // First verify the instrument exists and user has access
  const numericId = parseInt(instrumentId, 10);
  const isNumeric = !isNaN(numericId);

  let checkQuery = `
    SELECT i.id, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE ${isNumeric ? 'i.id = ?' : '(i.normalized_name = ? OR i.legacy_acronym = ?)'}
  `;
  const checkParams = isNumeric ? [numericId] : [instrumentId, instrumentId];

  const instrument = await executeQueryFirst(env, checkQuery, checkParams, 'checkInstrumentV3');

  if (!instrument) {
    return createNotFoundResponse('Instrument not found');
  }

  // Check station access
  if (user.role === 'station' && user.station_normalized_name !== instrument.station_normalized_name) {
    return createForbiddenResponse();
  }

  const pagination = parsePaginationParams(url);

  // Get total count
  const countResult = await executeQueryFirst(
    env,
    'SELECT COUNT(*) as count FROM instrument_rois WHERE instrument_id = ?',
    [instrument.id],
    'countInstrumentROIsV3'
  );

  // Get paginated ROIs
  const rois = await executeQuery(
    env,
    `SELECT * FROM instrument_rois WHERE instrument_id = ? ORDER BY roi_name ASC LIMIT ? OFFSET ?`,
    [instrument.id, pagination.limit, pagination.offset],
    'getInstrumentROIsV3'
  );

  const response = createPaginatedResponse(
    rois || [],
    countResult?.count || 0,
    pagination,
    `/api/v3/instruments/${instrumentId}/rois`
  );

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
