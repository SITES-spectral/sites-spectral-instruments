// SITES Spectral Instruments Handler v2.0.0
// Enhanced with pagination support

import { requireAuthentication } from '../../auth/authentication.js';
import { checkUserPermissions } from '../../auth/permissions.js';
import { executeQuery, executeQueryFirst, getStationData, getPlatformData } from '../../utils/database.js';
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
 * Handle instruments requests with pagination (V2)
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - URL path segments
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} API response
 */
export async function handleInstrumentsV2(method, pathSegments, request, env) {
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  const id = pathSegments[1];
  const subResource = pathSegments[2];

  // Handle sub-resources
  if (id && subResource) {
    switch (subResource) {
      case 'rois':
        return await getInstrumentROIsV2(id, request, user, env);
      case 'latest-image':
        return await getLatestImageV2(id, user, env);
      default:
        return createNotFoundResponse();
    }
  }

  switch (method) {
    case 'GET':
      if (id) {
        return await getInstrumentByIdV2(id, user, env);
      }
      return await getInstrumentsListV2(request, user, env);

    case 'POST':
    case 'PUT':
    case 'DELETE':
      // Use v1 API for write operations
      return createErrorResponse('Write operations available at /api/instruments', 400);

    default:
      return createMethodNotAllowedResponse();
  }
}

/**
 * Get paginated list of instruments (V2)
 * @param {Request} request - The incoming request
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Paginated instruments list
 */
async function getInstrumentsListV2(request, user, env) {
  const url = new URL(request.url);
  const { limit, offset } = extractPaginationParams(request);

  // Filter parameters
  const stationParam = url.searchParams.get('station') || url.searchParams.get('station_id');
  const platformParam = url.searchParams.get('platform') || url.searchParams.get('platform_id');
  const typeParam = url.searchParams.get('type') || url.searchParams.get('instrument_type');

  let baseQuery = `
    SELECT
      i.id, i.platform_id, i.normalized_name, i.display_name, i.legacy_acronym,
      i.instrument_type, i.ecosystem_code, i.instrument_number,
      i.latitude, i.longitude, i.epsg_code, i.instrument_height_m,
      i.viewing_direction, i.azimuth_degrees, i.degrees_from_nadir,
      i.status, i.deployment_date, i.end_date,
      i.first_measurement_year, i.last_measurement_year, i.measurement_status,
      i.camera_brand, i.camera_model, i.camera_resolution,
      i.sensor_brand, i.sensor_model, i.number_of_channels,
      i.power_source, i.data_transmission, i.image_processing_enabled,
      i.description, i.created_at, i.updated_at,
      p.normalized_name as platform_normalized_name, p.display_name as platform_name,
      s.acronym as station_acronym, s.display_name as station_name,
      s.normalized_name as station_normalized_name,
      (SELECT COUNT(*) FROM instrument_rois r WHERE r.instrument_id = i.id) as roi_count
    FROM instruments i
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

  // Apply platform filter
  if (platformParam) {
    const platform = await getPlatformData(env, platformParam);
    if (!platform) {
      return createNotFoundResponse();
    }
    conditions.push('i.platform_id = ?');
    params.push(platform.id);
  }

  // Apply type filter
  if (typeParam) {
    conditions.push('i.instrument_type = ?');
    params.push(typeParam);
  }

  // Station users can only see their own station's instruments
  if (user.role === 'station' && user.station_normalized_name) {
    conditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  baseQuery += ' ORDER BY s.acronym, p.normalized_name, i.normalized_name';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id` +
    (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '');
  const countResult = await executeQueryFirst(env, countQuery, params, 'getInstrumentsCount-v2');
  const total = countResult?.total || 0;

  // Get paginated results
  const paginatedQuery = addPaginationToQuery(baseQuery, limit, offset);
  const result = await executeQuery(env, paginatedQuery, params, 'getInstrumentsList-v2');

  return createSuccessResponse(
    buildPaginatedResponse(result.results || [], total, limit, offset, 'instruments')
  );
}

/**
 * Get instrument by ID (V2)
 * @param {string} identifier - Instrument identifier
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Instrument details
 */
async function getInstrumentByIdV2(identifier, user, env) {
  const query = `
    SELECT
      i.*,
      p.normalized_name as platform_normalized_name, p.display_name as platform_name,
      s.acronym as station_acronym, s.display_name as station_name,
      s.normalized_name as station_normalized_name,
      (SELECT COUNT(*) FROM instrument_rois r WHERE r.instrument_id = i.id) as roi_count
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ? OR i.normalized_name = ? OR i.legacy_acronym = ?
  `;

  const result = await executeQueryFirst(env, query, [identifier, identifier, identifier], 'getInstrumentById-v2');

  if (!result) {
    return createNotFoundResponse();
  }

  // Check station access for station users
  if (user.role === 'station' && user.station_normalized_name) {
    if (result.station_normalized_name !== user.station_normalized_name) {
      return createForbiddenResponse();
    }
  }

  return createSuccessResponse({ instrument: result });
}

/**
 * Get ROIs for an instrument (V2)
 * @param {string} instrumentId - Instrument identifier
 * @param {Request} request - The incoming request
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Paginated ROIs list
 */
async function getInstrumentROIsV2(instrumentId, request, user, env) {
  const { limit, offset } = extractPaginationParams(request);

  // First verify instrument access
  const instrumentQuery = `
    SELECT i.id, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ? OR i.normalized_name = ?
  `;

  const instrument = await executeQueryFirst(env, instrumentQuery, [instrumentId, instrumentId], 'getInstrumentForROIs-v2');

  if (!instrument) {
    return createNotFoundResponse();
  }

  // Check station access
  if (user.role === 'station' && user.station_normalized_name) {
    if (instrument.station_normalized_name !== user.station_normalized_name) {
      return createForbiddenResponse();
    }
  }

  // Get ROIs with pagination
  const baseQuery = `
    SELECT * FROM instrument_rois
    WHERE instrument_id = ?
    ORDER BY roi_name
  `;

  const countResult = await executeQueryFirst(env,
    'SELECT COUNT(*) as total FROM instrument_rois WHERE instrument_id = ?',
    [instrument.id], 'getROIsCount-v2'
  );
  const total = countResult?.total || 0;

  const paginatedQuery = addPaginationToQuery(baseQuery, limit, offset);
  const result = await executeQuery(env, paginatedQuery, [instrument.id], 'getInstrumentROIs-v2');

  return createSuccessResponse(
    buildPaginatedResponse(result.results || [], total, limit, offset, 'rois')
  );
}

/**
 * Get latest image for instrument (V2)
 * @param {string} instrumentId - Instrument identifier
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables
 * @returns {Response} Latest image metadata
 */
async function getLatestImageV2(instrumentId, user, env) {
  const query = `
    SELECT i.id, i.normalized_name, i.last_image_timestamp, i.image_archive_path,
           s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ? OR i.normalized_name = ?
  `;

  const result = await executeQueryFirst(env, query, [instrumentId, instrumentId], 'getLatestImage-v2');

  if (!result) {
    return createNotFoundResponse();
  }

  // Check station access
  if (user.role === 'station' && user.station_normalized_name) {
    if (result.station_normalized_name !== user.station_normalized_name) {
      return createForbiddenResponse();
    }
  }

  return createSuccessResponse({
    instrument_id: result.id,
    normalized_name: result.normalized_name,
    last_image_timestamp: result.last_image_timestamp,
    image_archive_path: result.image_archive_path
  });
}
