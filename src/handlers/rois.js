// ROIs Handler Module
// ROI (Region of Interest) operations

import { requireAuthentication, checkUserPermissions } from '../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../utils/database.js';
import {
  validateROIData,
  sanitizeRequestBody,
  sanitizeString,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeJSON,
  ROI_SCHEMA
} from '../utils/validation.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse,
  createValidationErrorResponse
} from '../utils/responses.js';

/**
 * Handle ROI requests
 * @param {string} method - HTTP method
 * @param {string} id - ROI identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} ROI response
 */
export async function handleROIs(method, id, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all ROI operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  try {
    switch (method) {
      case 'GET':
        if (id) {
          return await getROIById(id, user, env);
        } else {
          return await getROIsList(user, request, env);
        }

      case 'POST':
        return await createROI(user, request, env);

      case 'PUT':
        if (!id) {
          return createErrorResponse('ROI ID required for update', 400);
        }
        return await updateROI(id, user, request, env);

      case 'DELETE':
        if (!id) {
          return createErrorResponse('ROI ID required for deletion', 400);
        }
        return await deleteROI(id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('ROI handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get specific ROI by ID
 * @param {string} id - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} ROI data response
 */
async function getROIById(id, user, env) {
  let query = `
    SELECT r.id, r.roi_name, r.description, r.alpha, r.auto_generated,
           r.color_r, r.color_g, r.color_b, r.thickness, r.generated_date,
           r.source_image, r.points_json, r.created_at, r.updated_at,
           r.instrument_id,
           i.normalized_name as instrument_name, i.display_name as instrument_display_name,
           p.display_name as platform_name,
           s.acronym as station_acronym, s.normalized_name as station_normalized_name
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE r.id = ?
  `;

  // Add permission filtering for station users
  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const roi = await executeQueryFirst(env, query, params, 'getROIById');

  if (!roi) {
    return createNotFoundResponse();
  }

  // Parse points JSON if it exists
  if (roi.points_json) {
    try {
      roi.points = JSON.parse(roi.points_json);
    } catch (e) {
      console.warn('Failed to parse ROI points JSON:', e);
      roi.points = [];
    }
  }

  return createSuccessResponse(roi);
}

/**
 * Get list of ROIs filtered by user permissions
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object (for query parameters)
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} ROIs list response
 */
async function getROIsList(user, request, env) {
  const url = new URL(request.url);
  const instrumentParam = url.searchParams.get('instrument');
  const stationParam = url.searchParams.get('station');

  let query = `
    SELECT r.id, r.roi_name, r.description, r.alpha, r.auto_generated,
           r.color_r, r.color_g, r.color_b, r.thickness, r.generated_date,
           r.source_image, r.points_json, r.created_at,
           r.instrument_id,
           i.normalized_name as instrument_name, i.display_name as instrument_display_name,
           p.display_name as platform_name,
           s.acronym as station_acronym, s.normalized_name as station_normalized_name
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
  `;

  let params = [];
  let whereConditions = [];

  // Filter by specific instrument if requested
  if (instrumentParam) {
    whereConditions.push('(i.id = ? OR i.normalized_name = ?)');
    params.push(instrumentParam, instrumentParam);
  }

  // Filter by specific station if requested
  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationParam, stationParam);
  }

  // Add permission filtering for station users
  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY s.acronym, i.normalized_name, r.roi_name';

  const result = await executeQuery(env, query, params, 'getROIsList');
  const rois = (result?.results || []).map(roi => {
    // Parse points JSON if it exists
    if (roi.points_json) {
      try {
        roi.points = JSON.parse(roi.points_json);
      } catch (e) {
        console.warn('Failed to parse ROI points JSON:', e);
        roi.points = [];
      }
    }
    return roi;
  });

  return createSuccessResponse({ rois });
}

/**
 * Create new ROI
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Creation response
 */
async function createROI(user, request, env) {
  // Check if user has write permissions for ROIs
  const permission = checkUserPermissions(user, 'rois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // SECURITY: Parse request body with error handling
  let rawData;
  try {
    rawData = await request.json();
  } catch (e) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  // Sanitize ROI data using schema
  const roiData = sanitizeRequestBody(rawData, ROI_SCHEMA);

  // Handle additional ROI-specific fields
  if (rawData.alpha !== undefined) roiData.alpha = sanitizeFloat(rawData.alpha, { min: 0, max: 1 });
  if (rawData.thickness !== undefined) roiData.thickness = sanitizeInteger(rawData.thickness, { min: 1, max: 20 });
  if (rawData.color_r !== undefined) roiData.color_r = sanitizeInteger(rawData.color_r, { min: 0, max: 255 });
  if (rawData.color_g !== undefined) roiData.color_g = sanitizeInteger(rawData.color_g, { min: 0, max: 255 });
  if (rawData.color_b !== undefined) roiData.color_b = sanitizeInteger(rawData.color_b, { min: 0, max: 255 });
  if (rawData.auto_generated !== undefined) roiData.auto_generated = rawData.auto_generated === true || rawData.auto_generated === 'true';
  if (rawData.source_image !== undefined) roiData.source_image = sanitizeString(rawData.source_image, { maxLength: 500 });
  if (rawData.generated_date !== undefined) roiData.generated_date = sanitizeString(rawData.generated_date, { maxLength: 50 });
  if (rawData.points_json !== undefined) {
    // Validate points_json is valid JSON
    const points = sanitizeJSON(rawData.points_json);
    roiData.points_json = points ? JSON.stringify(points) : rawData.points_json;
  }

  // Validate ROI data
  const validation = validateROIData(roiData);
  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors);
  }

  // Verify instrument exists and get its station for permission check
  const instrumentQuery = `
    SELECT i.id, i.normalized_name as instrument_normalized_name,
           s.normalized_name as station_normalized_name, s.id as station_id
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  const instrument = await executeQueryFirst(env, instrumentQuery, [roiData.instrument_id], 'createROI-instrumentCheck');

  if (!instrument) {
    return createErrorResponse('Instrument not found', 404);
  }

  // Check if station user can access this specific instrument
  if (user.role === 'station' && user.station_normalized_name !== instrument.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Generate next ROI name for this instrument if not provided
  let roiName = roiData.roi_name;
  if (!roiName) {
    const existingROIsQuery = `
      SELECT roi_name FROM instrument_rois
      WHERE instrument_id = ? AND roi_name LIKE 'ROI_%'
      ORDER BY roi_name DESC
      LIMIT 1
    `;

    const lastROI = await executeQueryFirst(env, existingROIsQuery, [roiData.instrument_id], 'createROI-lastROI');

    if (lastROI && lastROI.roi_name) {
      const lastNumber = parseInt(lastROI.roi_name.replace('ROI_', ''), 10);
      roiName = `ROI_${String(lastNumber + 1).padStart(2, '0')}`;
    } else {
      roiName = 'ROI_01';
    }
  }

  // Insert new ROI
  const insertQuery = `
    INSERT INTO instrument_rois (
      instrument_id, roi_name, description, alpha, auto_generated,
      color_r, color_g, color_b, thickness, generated_date,
      source_image, points_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();

  const result = await executeQueryRun(env, insertQuery, [
    roiData.instrument_id,
    roiName,
    roiData.description || '',
    roiData.alpha !== undefined ? roiData.alpha : 0.3,
    roiData.auto_generated || false,
    roiData.color_r !== undefined ? roiData.color_r : 255,
    roiData.color_g !== undefined ? roiData.color_g : 0,
    roiData.color_b !== undefined ? roiData.color_b : 0,
    roiData.thickness !== undefined ? roiData.thickness : 2,
    roiData.generated_date || now,
    roiData.source_image || null,
    roiData.points_json || JSON.stringify([]),
    now,
    now
  ], 'createROI');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create ROI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'ROI created successfully',
    id: result.meta.last_row_id,
    roi_name: roiName
  }, 201);
}

/**
 * Update ROI data
 * @param {string} id - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Update response
 */
async function updateROI(id, user, request, env) {
  // Check if user has write permissions for ROIs
  const permission = checkUserPermissions(user, 'rois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // SECURITY: Parse request body with error handling
  let rawData;
  try {
    rawData = await request.json();
  } catch (e) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  // Sanitize ROI data using schema
  const roiData = sanitizeRequestBody(rawData, ROI_SCHEMA);

  // Handle additional ROI-specific fields
  if (rawData.alpha !== undefined) roiData.alpha = sanitizeFloat(rawData.alpha, { min: 0, max: 1 });
  if (rawData.thickness !== undefined) roiData.thickness = sanitizeInteger(rawData.thickness, { min: 1, max: 20 });
  if (rawData.color_r !== undefined) roiData.color_r = sanitizeInteger(rawData.color_r, { min: 0, max: 255 });
  if (rawData.color_g !== undefined) roiData.color_g = sanitizeInteger(rawData.color_g, { min: 0, max: 255 });
  if (rawData.color_b !== undefined) roiData.color_b = sanitizeInteger(rawData.color_b, { min: 0, max: 255 });
  if (rawData.source_image !== undefined) roiData.source_image = sanitizeString(rawData.source_image, { maxLength: 500 });
  if (rawData.points_json !== undefined) {
    const points = sanitizeJSON(rawData.points_json);
    roiData.points_json = points ? JSON.stringify(points) : rawData.points_json;
  }

  // First verify ROI exists and get its station
  const checkQuery = `
    SELECT r.id, s.normalized_name as station_normalized_name, s.id as station_id
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE r.id = ?
  `;

  const existingROI = await executeQueryFirst(env, checkQuery, [id], 'updateROI-check');

  if (!existingROI) {
    return createNotFoundResponse();
  }

  // Check if station user can access this specific ROI
  if (user.role === 'station' && user.station_normalized_name !== existingROI.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Build update query with allowed fields
  const allowedFields = [];
  const values = [];

  const editableFields = [
    'roi_name', 'description', 'alpha', 'color_r', 'color_g', 'color_b',
    'thickness', 'source_image', 'points_json'
  ];

  // Add editable fields
  editableFields.forEach(field => {
    if (roiData[field] !== undefined) {
      allowedFields.push(`${field} = ?`);
      values.push(roiData[field]);
    }
  });

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  // Add updated_at timestamp
  allowedFields.push('updated_at = ?');
  values.push(new Date().toISOString());

  // Add WHERE clause parameter
  values.push(id);

  const updateQuery = `
    UPDATE instrument_rois
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updateROI');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update ROI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'ROI updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Delete ROI
 * @param {string} id - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Deletion response
 */
async function deleteROI(id, user, env) {
  // Check if user has delete permissions for ROIs
  const permission = checkUserPermissions(user, 'rois', 'delete');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // First verify ROI exists and get its station
  const checkQuery = `
    SELECT r.id, s.normalized_name as station_normalized_name, s.id as station_id
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE r.id = ?
  `;

  const existingROI = await executeQueryFirst(env, checkQuery, [id], 'deleteROI-check');

  if (!existingROI) {
    return createNotFoundResponse();
  }

  // Check if station user can access this specific ROI
  if (user.role === 'station' && user.station_normalized_name !== existingROI.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Delete the ROI
  const deleteQuery = 'DELETE FROM instrument_rois WHERE id = ?';
  const result = await executeQueryRun(env, deleteQuery, [id], 'deleteROI');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete ROI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'ROI deleted successfully',
    id: parseInt(id, 10)
  });
}