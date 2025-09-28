// Admin Instruments Module
// Admin-only instrument CRUD operations

import { executeQueryRun, executeQueryFirst } from '../utils/database.js';
import { validateInstrumentData } from '../utils/validation.js';
import { generateComprehensiveBackup, analyzeDependencies } from '../utils/backup.js';
import { logAdminAction } from '../utils/logging.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createValidationErrorResponse,
  createMethodNotAllowedResponse
} from '../utils/responses.js';

/**
 * Handle admin instrument operations
 * @param {string} method - HTTP method
 * @param {string} id - Instrument identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Admin instrument response
 */
export async function handleAdminInstruments(method, id, request, env, user) {
  const startTime = Date.now();

  try {
    let result;

    switch (method) {
      case 'POST':
        result = await createInstrumentAdmin(request, env, user);
        break;

      case 'PUT':
        if (!id) {
          return createErrorResponse('Instrument ID required for update', 400);
        }
        result = await updateInstrumentAdmin(id, request, env, user);
        break;

      case 'DELETE':
        if (!id) {
          return createErrorResponse('Instrument ID required for deletion', 400);
        }
        result = await deleteInstrumentAdmin(id, request, env, user);
        break;

      default:
        return createMethodNotAllowedResponse();
    }

    // Log operation timing
    const duration = Date.now() - startTime;
    await logAdminAction(user, method, `Instrument ${method} operation completed`, env, {
      instrument_id: id,
      duration_ms: duration,
      success: true
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Admin Instrument Error:', error);
    await logAdminAction(user, method, `Instrument ${method} operation failed: ${error.message}`, env, {
      instrument_id: id,
      duration_ms: duration,
      success: false,
      error: error.message
    });
    throw error;
  }
}

/**
 * Create new instrument (admin only)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Creation response
 */
async function createInstrumentAdmin(request, env, user) {
  const instrumentData = await request.json();

  // Enhanced validation
  const validation = validateInstrumentData(instrumentData);
  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors);
  }

  // Verify platform exists and get station info
  const platform = await getPlatformById(instrumentData.platform_id, env);
  if (!platform) {
    return createErrorResponse('Platform not found', 404);
  }

  // Generate normalized name if not provided
  let normalizedName = instrumentData.normalized_name;
  if (!normalizedName) {
    // Generate from display name
    normalizedName = instrumentData.display_name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[åä]/g, 'a')
      .replace(/[ö]/g, 'o')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // Check for duplicate normalized names within the platform
  const duplicateCheck = await executeQueryFirst(env, `
    SELECT normalized_name FROM instruments
    WHERE platform_id = ? AND normalized_name = ?
  `, [instrumentData.platform_id, normalizedName], 'createInstrumentAdmin-duplicateCheck');

  if (duplicateCheck) {
    // Generate alternative name
    let counter = 1;
    let candidateName = normalizedName;
    while (duplicateCheck) {
      candidateName = `${normalizedName}_${counter.toString().padStart(2, '0')}`;
      const altCheck = await executeQueryFirst(env, `
        SELECT normalized_name FROM instruments
        WHERE platform_id = ? AND normalized_name = ?
      `, [instrumentData.platform_id, candidateName], 'createInstrumentAdmin-altCheck');
      if (!altCheck) break;
      counter++;
    }

    return new Response(JSON.stringify({
      error: 'Duplicate normalized name',
      conflict: { field: 'normalized_name', value: normalizedName },
      suggestion: candidateName
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Insert instrument
  const insertQuery = `
    INSERT INTO instruments (
      platform_id, normalized_name, display_name, legacy_acronym,
      instrument_type, ecosystem_code, instrument_number, status,
      deployment_date, latitude, longitude, viewing_direction,
      azimuth_degrees, degrees_from_nadir, camera_brand, camera_model,
      camera_resolution, camera_serial_number, first_measurement_year,
      last_measurement_year, measurement_status, instrument_height_m,
      description, installation_notes, maintenance_notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();
  const result = await executeQueryRun(env, insertQuery, [
    instrumentData.platform_id,
    normalizedName,
    instrumentData.display_name,
    instrumentData.legacy_acronym || null,
    instrumentData.instrument_type,
    instrumentData.ecosystem_code || null,
    instrumentData.instrument_number || null,
    instrumentData.status || 'Active',
    instrumentData.deployment_date || null,
    instrumentData.latitude || null,
    instrumentData.longitude || null,
    instrumentData.viewing_direction || null,
    instrumentData.azimuth_degrees || null,
    instrumentData.degrees_from_nadir || null,
    instrumentData.camera_brand || null,
    instrumentData.camera_model || null,
    instrumentData.camera_resolution || null,
    instrumentData.camera_serial_number || null,
    instrumentData.first_measurement_year || null,
    instrumentData.last_measurement_year || null,
    instrumentData.measurement_status || null,
    instrumentData.instrument_height_m || null,
    instrumentData.description || '',
    instrumentData.installation_notes || null,
    instrumentData.maintenance_notes || null,
    now,
    now
  ], 'createInstrumentAdmin');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create instrument', 500);
  }

  // Log admin action
  await logAdminAction(user, 'CREATE', `Instrument created: ${instrumentData.display_name}`, env, {
    instrument_id: result.meta.last_row_id,
    platform_id: instrumentData.platform_id,
    normalized_name: normalizedName,
    instrument_type: instrumentData.instrument_type
  });

  return createSuccessResponse({
    success: true,
    message: 'Instrument created successfully',
    id: result.meta.last_row_id,
    normalized_name: normalizedName,
    created_at: now
  }, 201);
}

/**
 * Update instrument (admin only)
 * @param {string} id - Instrument identifier
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Update response
 */
async function updateInstrumentAdmin(id, request, env, user) {
  const instrumentData = await request.json();

  // First verify instrument exists
  const existingInstrument = await getInstrumentById(id, env);
  if (!existingInstrument) {
    return createNotFoundResponse();
  }

  // Build update query
  const allowedFields = [];
  const values = [];

  const editableFields = [
    'display_name', 'legacy_acronym', 'instrument_type', 'ecosystem_code',
    'instrument_number', 'status', 'deployment_date', 'latitude', 'longitude',
    'viewing_direction', 'azimuth_degrees', 'degrees_from_nadir',
    'camera_brand', 'camera_model', 'camera_resolution', 'camera_serial_number',
    'first_measurement_year', 'last_measurement_year', 'measurement_status',
    'instrument_height_m', 'description', 'installation_notes', 'maintenance_notes'
  ];

  editableFields.forEach(field => {
    if (instrumentData[field] !== undefined) {
      allowedFields.push(`${field} = ?`);
      values.push(instrumentData[field]);
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
    UPDATE instruments
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updateInstrumentAdmin');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update instrument', 500);
  }

  // Log admin action
  await logAdminAction(user, 'UPDATE', `Instrument updated: ${existingInstrument.display_name}`, env, {
    instrument_id: id,
    changes: Object.keys(instrumentData)
  });

  return createSuccessResponse({
    success: true,
    message: 'Instrument updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Delete instrument (admin only)
 * @param {string} id - Instrument identifier
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Deletion response
 */
async function deleteInstrumentAdmin(id, request, env, user) {
  // Parse request body for backup preferences
  let requestData = {};
  try {
    requestData = await request.json();
  } catch (e) {
    // Ignore JSON parsing errors for DELETE requests
  }

  // First verify instrument exists
  const existingInstrument = await getInstrumentById(id, env);
  if (!existingInstrument) {
    return createNotFoundResponse();
  }

  // Analyze dependencies
  const dependencies = await analyzeDependencies('instrument', id, env);

  // Generate backup if requested or if there are dependencies
  let backup = null;
  if (requestData.generate_backup !== false) {
    try {
      backup = await generateComprehensiveBackup('instrument', id, env, user);
    } catch (backupError) {
      console.error('Backup generation failed:', backupError);
      return createErrorResponse('Failed to generate backup before deletion', 500);
    }
  }

  // Delete instrument (CASCADE should handle dependent records)
  const deleteQuery = 'DELETE FROM instruments WHERE id = ?';
  const result = await executeQueryRun(env, deleteQuery, [id], 'deleteInstrumentAdmin');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete instrument', 500);
  }

  // Log admin action
  await logAdminAction(user, 'DELETE', `Instrument deleted: ${existingInstrument.display_name}`, env, {
    instrument_id: id,
    normalized_name: existingInstrument.normalized_name,
    backup_generated: !!backup,
    dependencies_deleted: dependencies
  });

  const response = {
    success: true,
    message: 'Instrument deleted successfully',
    id: parseInt(id, 10),
    dependencies_deleted: dependencies
  };

  if (backup) {
    response.backup = backup;
  }

  return createSuccessResponse(response);
}

/**
 * Get platform by ID (internal helper)
 * @param {string} platformId - Platform ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Platform data or null
 */
async function getPlatformById(platformId, env) {
  const query = `
    SELECT p.*, s.acronym as station_acronym
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `;

  return await executeQueryFirst(env, query, [platformId], 'getPlatformById');
}

/**
 * Get instrument by ID (internal helper)
 * @param {string} id - Instrument ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Instrument data or null
 */
async function getInstrumentById(id, env) {
  const query = `
    SELECT i.*, p.display_name as platform_name, s.acronym as station_acronym
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  return await executeQueryFirst(env, query, [id], 'getInstrumentById');
}