// ROIs Handler Module
// ROI (Region of Interest) operations
// v10.0.0-alpha.17: Added Legacy ROI System for time series data protection

import { requireAuthentication, checkUserPermissions } from '../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../utils/database.js';
import {
  validateROIData,
  sanitizeRequestBody,
  sanitizeString,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeJSON,
  sanitizeDate,
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

// ============================================================================
// Constants for Legacy ROI System
// ============================================================================

/**
 * Super admin roles that can directly edit ROIs (bypassing legacy workflow)
 * admin, sites-admin, spectral-admin have full system privileges
 */
const SUPER_ADMIN_ROLES = ['admin', 'sites-admin', 'spectral-admin'];

/**
 * Check if user can directly edit ROIs (super admin only)
 * @param {Object} user - Authenticated user
 * @returns {boolean} True if user can directly edit
 */
function canDirectlyEditROI(user) {
  return SUPER_ADMIN_ROLES.includes(user.role);
}

/**
 * Get next available ROI name, skipping legacy ROI numbers
 * @param {number} instrumentId - Instrument ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<string>} Next available ROI name (e.g., 'ROI_03')
 */
async function getNextAvailableROIName(instrumentId, env) {
  // Query ALL ROI names (including legacy) for this instrument
  const query = `
    SELECT roi_name FROM instrument_rois
    WHERE instrument_id = ? AND roi_name LIKE 'ROI_%'
    ORDER BY roi_name
  `;
  const result = await executeQuery(env, query, [instrumentId], 'getNextAvailableROIName');
  const existingNames = new Set((result?.results || []).map(r => r.roi_name));

  // Find first available number (starting at 1, skipping all existing including legacy)
  let num = 1;
  while (existingNames.has(`ROI_${String(num).padStart(2, '0')}`)) {
    num++;
  }
  return `ROI_${String(num).padStart(2, '0')}`;
}

/**
 * Handle ROI requests
 * @param {string} method - HTTP method
 * @param {string} id - ROI identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {string} subAction - Sub-action for special endpoints (e.g., 'legacy', 'override')
 * @returns {Response} ROI response
 */
export async function handleROIs(method, id, request, env, subAction = null) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all ROI operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  try {
    // Handle special sub-actions for legacy system
    if (subAction === 'legacy' && method === 'POST' && id) {
      return await markROIAsLegacy(id, user, request, env);
    }
    if (subAction === 'override' && method === 'PUT' && id) {
      return await adminOverrideUpdate(id, user, request, env);
    }
    if (subAction === 'edit-mode' && method === 'GET' && id) {
      return await getROIEditMode(id, user, env);
    }

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
           r.is_legacy, r.legacy_date, r.replaced_by_roi_id,
           r.timeseries_broken, r.legacy_reason,
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

  // Convert is_legacy to boolean
  roi.is_legacy = roi.is_legacy === 1 || roi.is_legacy === true;
  roi.timeseries_broken = roi.timeseries_broken === 1 || roi.timeseries_broken === true;

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
  const includeLegacy = url.searchParams.get('include_legacy') === 'true';

  let query = `
    SELECT r.id, r.roi_name, r.description, r.alpha, r.auto_generated,
           r.color_r, r.color_g, r.color_b, r.thickness, r.generated_date,
           r.source_image, r.points_json, r.created_at,
           r.instrument_id,
           r.is_legacy, r.legacy_date, r.replaced_by_roi_id,
           r.timeseries_broken, r.legacy_reason,
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

  // Filter out legacy ROIs by default unless include_legacy=true
  if (!includeLegacy) {
    whereConditions.push('(r.is_legacy IS NULL OR r.is_legacy = 0)');
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
    // Convert is_legacy to boolean
    roi.is_legacy = roi.is_legacy === 1 || roi.is_legacy === true;
    roi.timeseries_broken = roi.timeseries_broken === 1 || roi.timeseries_broken === true;
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
  // Uses getNextAvailableROIName to skip legacy ROI numbers
  let roiName = roiData.roi_name;
  if (!roiName) {
    roiName = await getNextAvailableROIName(roiData.instrument_id, env);
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

// ============================================================================
// Legacy ROI System Endpoints (v10.0.0-alpha.17)
// ============================================================================

/**
 * Get ROI edit mode based on user permissions
 * Returns information about how the user can edit the ROI
 * @param {string} id - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Edit mode information
 */
async function getROIEditMode(id, user, env) {
  // Get ROI with legacy status
  const query = `
    SELECT r.id, r.roi_name, r.is_legacy, r.timeseries_broken,
           r.instrument_id,
           s.normalized_name as station_normalized_name
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE r.id = ?
  `;

  const roi = await executeQueryFirst(env, query, [id], 'getROIEditMode');

  if (!roi) {
    return createNotFoundResponse();
  }

  // Check station access for station users
  if (user.role === 'station' && user.station_normalized_name !== roi.station_normalized_name) {
    return createForbiddenResponse();
  }

  const isLegacy = roi.is_legacy === 1 || roi.is_legacy === true;
  const isSuperAdmin = canDirectlyEditROI(user);

  let editMode;
  let message;

  if (isLegacy) {
    // Legacy ROIs can only be viewed (or edited by super admin)
    editMode = isSuperAdmin ? 'admin-legacy' : 'readonly';
    message = isSuperAdmin
      ? 'This is a legacy ROI. You can edit it as a super admin.'
      : 'This ROI is marked as legacy and cannot be edited.';
  } else if (isSuperAdmin) {
    // Super admins can directly edit
    editMode = 'admin';
    message = 'You can directly edit this ROI. Warning: This may break time series data.';
  } else {
    // Station users must create new ROI (old becomes legacy)
    editMode = 'legacy-create';
    message = 'To modify this ROI, a new ROI will be created and this one will be marked as legacy.';
  }

  return createSuccessResponse({
    roi_id: parseInt(id, 10),
    roi_name: roi.roi_name,
    is_legacy: isLegacy,
    timeseries_broken: roi.timeseries_broken === 1 || roi.timeseries_broken === true,
    edit_mode: editMode,
    can_direct_edit: isSuperAdmin,
    requires_legacy_workflow: !isSuperAdmin && !isLegacy,
    message
  });
}

/**
 * Mark ROI as legacy and optionally create a replacement
 * @param {string} id - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Legacy marking response
 */
async function markROIAsLegacy(id, user, request, env) {
  // Check write permission
  const permission = checkUserPermissions(user, 'rois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Parse request body
  let rawData;
  try {
    rawData = await request.json();
  } catch (e) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  const legacyReason = sanitizeString(rawData.reason, { maxLength: 500 }) || 'Replaced by new ROI';
  const replacementData = rawData.replacement_data;

  // Get existing ROI with station info
  const checkQuery = `
    SELECT r.id, r.roi_name, r.instrument_id, r.is_legacy,
           r.description, r.alpha, r.color_r, r.color_g, r.color_b,
           r.thickness, r.source_image, r.points_json,
           s.normalized_name as station_normalized_name
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE r.id = ?
  `;

  const existingROI = await executeQueryFirst(env, checkQuery, [id], 'markROIAsLegacy-check');

  if (!existingROI) {
    return createNotFoundResponse();
  }

  // Check station access
  if (user.role === 'station' && user.station_normalized_name !== existingROI.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check if already legacy
  if (existingROI.is_legacy === 1 || existingROI.is_legacy === true) {
    return createErrorResponse('ROI is already marked as legacy', 400);
  }

  const now = new Date().toISOString();

  // Start with marking the existing ROI as legacy
  const markLegacyQuery = `
    UPDATE instrument_rois
    SET is_legacy = 1, legacy_date = ?, legacy_reason = ?, updated_at = ?
    WHERE id = ?
  `;

  await executeQueryRun(env, markLegacyQuery, [now, legacyReason, now, id], 'markROIAsLegacy-update');

  // Create replacement ROI if data provided
  let newROI = null;
  if (replacementData) {
    const newRoiName = await getNextAvailableROIName(existingROI.instrument_id, env);

    // Merge existing ROI properties with replacement data
    const newDescription = replacementData.description || existingROI.description || '';
    const newAlpha = replacementData.alpha !== undefined ? replacementData.alpha : existingROI.alpha;
    const newColorR = replacementData.color_r !== undefined ? replacementData.color_r : existingROI.color_r;
    const newColorG = replacementData.color_g !== undefined ? replacementData.color_g : existingROI.color_g;
    const newColorB = replacementData.color_b !== undefined ? replacementData.color_b : existingROI.color_b;
    const newThickness = replacementData.thickness !== undefined ? replacementData.thickness : existingROI.thickness;
    const newSourceImage = replacementData.source_image || existingROI.source_image;
    const newPointsJson = replacementData.points_json || existingROI.points_json;

    const insertQuery = `
      INSERT INTO instrument_rois (
        instrument_id, roi_name, description, alpha, auto_generated,
        color_r, color_g, color_b, thickness, generated_date,
        source_image, points_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertResult = await executeQueryRun(env, insertQuery, [
      existingROI.instrument_id,
      newRoiName,
      newDescription,
      newAlpha,
      newColorR,
      newColorG,
      newColorB,
      newThickness,
      now,
      newSourceImage,
      newPointsJson,
      now,
      now
    ], 'markROIAsLegacy-insert');

    if (insertResult && insertResult.meta?.last_row_id) {
      newROI = {
        id: insertResult.meta.last_row_id,
        roi_name: newRoiName
      };

      // Update the legacy ROI with replaced_by_roi_id
      await executeQueryRun(env, `
        UPDATE instrument_rois SET replaced_by_roi_id = ? WHERE id = ?
      `, [newROI.id, id], 'markROIAsLegacy-link');
    }
  }

  return createSuccessResponse({
    success: true,
    message: 'ROI marked as legacy',
    legacy_roi: {
      id: parseInt(id, 10),
      roi_name: existingROI.roi_name
    },
    new_roi: newROI
  });
}

/**
 * Admin override update - directly edit ROI (sets timeseries_broken flag)
 * Only available to super admins
 * @param {string} id - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Update response
 */
async function adminOverrideUpdate(id, user, request, env) {
  // Only super admins can use this endpoint
  if (!canDirectlyEditROI(user)) {
    return createForbiddenResponse('Only super admins can use the override endpoint');
  }

  // Parse request body
  let rawData;
  try {
    rawData = await request.json();
  } catch (e) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  // Verify ROI exists
  const checkQuery = `
    SELECT r.id, r.roi_name, r.is_legacy, r.timeseries_broken
    FROM instrument_rois r
    WHERE r.id = ?
  `;

  const existingROI = await executeQueryFirst(env, checkQuery, [id], 'adminOverrideUpdate-check');

  if (!existingROI) {
    return createNotFoundResponse();
  }

  // Sanitize update data
  const roiData = sanitizeRequestBody(rawData, ROI_SCHEMA);

  // Handle additional fields
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

  // Build update fields
  const allowedFields = [];
  const values = [];

  const editableFields = [
    'roi_name', 'description', 'alpha', 'color_r', 'color_g', 'color_b',
    'thickness', 'source_image', 'points_json'
  ];

  editableFields.forEach(field => {
    if (roiData[field] !== undefined) {
      allowedFields.push(`${field} = ?`);
      values.push(roiData[field]);
    }
  });

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  // Set timeseries_broken flag if this is an active ROI (not legacy)
  const isLegacy = existingROI.is_legacy === 1 || existingROI.is_legacy === true;
  if (!isLegacy) {
    allowedFields.push('timeseries_broken = ?');
    values.push(1);
  }

  // Add updated_at
  allowedFields.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(id);

  const updateQuery = `
    UPDATE instrument_rois
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'adminOverrideUpdate');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update ROI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: isLegacy
      ? 'Legacy ROI updated (admin override)'
      : 'ROI updated with admin override. Time series data may be affected.',
    id: parseInt(id, 10),
    timeseries_broken: !isLegacy
  });
}