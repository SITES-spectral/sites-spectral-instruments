// SITES Spectral ROIs Handler v2.0.0
// Enhanced with pagination support

import { requireAuthentication } from '../../auth/authentication.js';
import { checkUserPermissions } from '../../auth/permissions.js';
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
 * Handle ROIs requests with pagination (V2)
 * @param {string} method - HTTP method
 * @param {string|null} id - ROI ID or null for list
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} API response
 */
export async function handleROIsV2(method, id, request, env) {
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  switch (method) {
    case 'GET':
      if (id) {
        return await getROIByIdV2(id, user, env);
      }
      return await getROIsListV2(request, user, env);

    case 'POST':
    case 'PUT':
    case 'DELETE':
      // Use v1 API for write operations
      return createErrorResponse('Write operations available at /api/rois', 400);

    default:
      return createMethodNotAllowedResponse();
  }
}

/**
 * Get paginated list of ROIs (V2)
 * @param {Request} request - The incoming request
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Paginated ROIs list
 */
async function getROIsListV2(request, user, env) {
  const url = new URL(request.url);
  const { limit, offset } = extractPaginationParams(request);

  // Filter parameters
  const stationParam = url.searchParams.get('station');
  const instrumentParam = url.searchParams.get('instrument') || url.searchParams.get('instrument_id');

  let baseQuery = `
    SELECT
      r.id, r.instrument_id, r.roi_name, r.description,
      r.points_json, r.alpha, r.color_r, r.color_g, r.color_b, r.thickness,
      r.auto_generated, r.generated_date, r.source_image, r.comment,
      r.roi_processing_enabled, r.vegetation_mask_path,
      r.last_processed_timestamp, r.processing_status,
      r.created_at, r.updated_at,
      i.normalized_name as instrument_normalized_name, i.display_name as instrument_name,
      s.acronym as station_acronym, s.display_name as station_name,
      s.normalized_name as station_normalized_name
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
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

  // Apply instrument filter
  if (instrumentParam) {
    const instrumentQuery = `SELECT id FROM instruments WHERE id = ? OR normalized_name = ?`;
    const instrument = await executeQueryFirst(env, instrumentQuery, [instrumentParam, instrumentParam], 'getInstrumentForROIs');
    if (!instrument) {
      return createNotFoundResponse();
    }
    conditions.push('r.instrument_id = ?');
    params.push(instrument.id);
  }

  // Station users can only see their own station's ROIs
  if (user.role === 'station' && user.station_normalized_name) {
    conditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  baseQuery += ' ORDER BY s.acronym, i.normalized_name, r.roi_name';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id` +
    (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '');
  const countResult = await executeQueryFirst(env, countQuery, params, 'getROIsCount-v2');
  const total = countResult?.total || 0;

  // Get paginated results
  const paginatedQuery = addPaginationToQuery(baseQuery, limit, offset);
  const result = await executeQuery(env, paginatedQuery, params, 'getROIsList-v2');

  // Parse points_json for each ROI
  const rois = (result.results || []).map(roi => {
    try {
      roi.points = roi.points_json ? JSON.parse(roi.points_json) : [];
    } catch (e) {
      roi.points = [];
    }
    return roi;
  });

  return createSuccessResponse(
    buildPaginatedResponse(rois, total, limit, offset, 'rois')
  );
}

/**
 * Get ROI by ID (V2)
 * @param {string} id - ROI identifier
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} ROI details
 */
async function getROIByIdV2(id, user, env) {
  const query = `
    SELECT
      r.*,
      i.normalized_name as instrument_normalized_name, i.display_name as instrument_name,
      s.acronym as station_acronym, s.display_name as station_name,
      s.normalized_name as station_normalized_name
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE r.id = ?
  `;

  const result = await executeQueryFirst(env, query, [id], 'getROIById-v2');

  if (!result) {
    return createNotFoundResponse();
  }

  // Check station access for station users
  if (user.role === 'station' && user.station_normalized_name) {
    if (result.station_normalized_name !== user.station_normalized_name) {
      return createForbiddenResponse();
    }
  }

  // Parse points_json
  try {
    result.points = result.points_json ? JSON.parse(result.points_json) : [];
  } catch (e) {
    result.points = [];
  }

  return createSuccessResponse({ roi: result });
}
