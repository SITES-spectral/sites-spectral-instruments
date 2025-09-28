// Instruments Handler Module
// Regular instrument operations

import { requireAuthentication, checkUserPermissions } from '../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../utils/responses.js';

/**
 * Handle instrument requests
 * @param {string} method - HTTP method
 * @param {string} id - Instrument identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument response
 */
export async function handleInstruments(method, id, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all instrument operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  try {
    switch (method) {
      case 'GET':
        if (id) {
          return await getInstrumentById(id, user, env);
        } else {
          return await getInstrumentsList(user, request, env);
        }

      case 'POST':
        // Instrument creation is admin-only, redirect to admin handler
        return createForbiddenResponse();

      case 'PUT':
        if (!id) {
          return createErrorResponse('Instrument ID required for update', 400);
        }
        return await updateInstrument(id, user, request, env);

      case 'DELETE':
        // Instrument deletion is admin-only, redirect to admin handler
        return createForbiddenResponse();

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Instrument handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get specific instrument by ID
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument data response
 */
async function getInstrumentById(id, user, env) {
  let query = `
    SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
           i.instrument_type, i.ecosystem_code, i.instrument_number, i.status, i.deployment_date,
           i.latitude, i.longitude, i.viewing_direction, i.azimuth_degrees, i.degrees_from_nadir,
           i.camera_brand, i.camera_model, i.camera_resolution, i.camera_serial_number,
           i.first_measurement_year, i.last_measurement_year, i.measurement_status,
           i.instrument_height_m, i.description, i.installation_notes, i.maintenance_notes,
           i.created_at, i.updated_at,
           p.display_name as platform_name, p.location_code, p.mounting_structure,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           COUNT(r.id) as roi_count
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN instrument_rois r ON i.id = r.instrument_id
    WHERE i.id = ?
  `;

  // Add permission filtering for station users
  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' GROUP BY i.id';

  const result = await executeQueryFirst(env, query, params, 'getInstrumentById');

  if (!result) {
    return createNotFoundResponse();
  }

  return createSuccessResponse(result);
}

/**
 * Get list of instruments filtered by user permissions
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object (for query parameters)
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instruments list response
 */
async function getInstrumentsList(user, request, env) {
  const url = new URL(request.url);
  const stationParam = url.searchParams.get('station');
  const platformParam = url.searchParams.get('platform');

  let query = `
    SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
           i.instrument_type, i.ecosystem_code, i.instrument_number, i.status,
           i.latitude, i.longitude, i.viewing_direction, i.azimuth_degrees,
           i.camera_brand, i.camera_model, i.camera_resolution, i.created_at,
           p.display_name as platform_name, p.location_code, p.normalized_name as platform_normalized_name,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           COUNT(r.id) as roi_count
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN instrument_rois r ON i.id = r.instrument_id
  `;

  let params = [];
  let whereConditions = [];

  // Filter by specific station if requested
  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationParam, stationParam);
  }

  // Filter by specific platform if requested
  if (platformParam) {
    whereConditions.push('(p.id = ? OR p.normalized_name = ?)');
    params.push(platformParam, platformParam);
  }

  // Add permission filtering for station users
  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' GROUP BY i.id ORDER BY i.display_name';

  const result = await executeQuery(env, query, params, 'getInstrumentsList');

  return createSuccessResponse({
    instruments: result?.results || []
  });
}

/**
 * Update instrument data
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Update response
 */
async function updateInstrument(id, user, request, env) {
  // Check if user has write permissions for instruments
  const permission = checkUserPermissions(user, 'instruments', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const instrumentData = await request.json();

  // First verify instrument exists and get its station
  const checkQuery = `
    SELECT i.id, s.normalized_name as station_normalized_name, s.id as station_id
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  const existingInstrument = await executeQueryFirst(env, checkQuery, [id], 'updateInstrument-check');

  if (!existingInstrument) {
    return createNotFoundResponse();
  }

  // Check if station user can access this specific instrument
  if (user.role === 'station' && user.station_normalized_name !== existingInstrument.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Build update query with allowed fields
  const allowedFields = [];
  const values = [];

  // Fields that station users can edit
  const stationEditableFields = [
    'display_name', 'status',
    // Camera specifications
    'camera_brand', 'camera_model', 'camera_resolution', 'camera_serial_number',
    // Position & orientation
    'latitude', 'longitude', 'instrument_height_m', 'viewing_direction', 'azimuth_degrees', 'degrees_from_nadir',
    // Timeline & classification
    'instrument_type', 'ecosystem_code', 'deployment_date', 'first_measurement_year', 'last_measurement_year', 'measurement_status',
    // Notes & context
    'description', 'installation_notes', 'maintenance_notes'
  ];

  // Fields that only admin can edit
  const adminOnlyFields = ['legacy_acronym', 'normalized_name', 'instrument_number'];

  // Add station editable fields
  stationEditableFields.forEach(field => {
    if (instrumentData[field] !== undefined) {
      allowedFields.push(`${field} = ?`);
      values.push(instrumentData[field]);
    }
  });

  // Add admin-only fields if user is admin
  if (user.role === 'admin') {
    adminOnlyFields.forEach(field => {
      if (instrumentData[field] !== undefined) {
        allowedFields.push(`${field} = ?`);
        values.push(instrumentData[field]);
      }
    });
  }

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  // Add updated_at timestamp
  allowedFields.push('updated_at = ?');
  values.push(new Date().toISOString());

  // Add WHERE clause parameter
  values.push(id);

  const updateQuery = `
    UPDATE instruments
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updateInstrument');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update instrument', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Instrument updated successfully',
    id: parseInt(id, 10)
  });
}