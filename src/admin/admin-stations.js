// Admin Stations Module
// Admin-only station CRUD operations

import { executeQueryRun, resolveStationIdentifier } from '../utils/database.js';
import {
  validateStationData,
  validateStationUpdateData,
  generateNormalizedName,
  generateAlternativeNormalizedName,
  generateAlternativeAcronym
} from '../utils/validation.js';
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
 * Handle admin station operations
 * @param {string} method - HTTP method
 * @param {string} id - Station identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Admin station response
 */
export async function handleAdminStations(method, id, request, env, user) {
  const startTime = Date.now();

  try {
    let result;

    switch (method) {
      case 'POST':
        result = await createStationAdmin(request, env, user);
        break;

      case 'PUT':
        if (!id) {
          return createErrorResponse('Station ID required for update', 400);
        }
        result = await updateStationAdmin(id, request, env, user);
        break;

      case 'DELETE':
        if (!id) {
          return createErrorResponse('Station ID required for deletion', 400);
        }
        result = await deleteStationAdmin(id, request, env, user);
        break;

      default:
        return createMethodNotAllowedResponse();
    }

    // Log operation timing
    const duration = Date.now() - startTime;
    await logAdminAction(user, method, `Station ${method} operation completed`, env, {
      station_id: id,
      duration_ms: duration,
      success: true
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Admin Station Error:', error);
    await logAdminAction(user, method, `Station ${method} operation failed: ${error.message}`, env, {
      station_id: id,
      duration_ms: duration,
      success: false,
      error: error.message
    });
    throw error;
  }
}

/**
 * Create new station (admin only)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Creation response
 */
async function createStationAdmin(request, env, user) {
  const stationData = await request.json();

  // Enhanced validation
  const validation = validateStationData(stationData);
  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors);
  }

  // Generate normalized name with Swedish character handling
  const normalizedName = generateNormalizedName(stationData.display_name);

  // Check for conflicts using unified resolution
  const existingStation = await resolveStationIdentifier(normalizedName, env);
  const existingAcronym = await resolveStationIdentifier(stationData.acronym, env);

  if (existingStation || existingAcronym) {
    const conflicts = [];
    if (existingStation) conflicts.push({ field: 'normalized_name', value: normalizedName });
    if (existingAcronym) conflicts.push({ field: 'acronym', value: stationData.acronym });

    return new Response(JSON.stringify({
      error: 'Duplicate values detected',
      conflicts: conflicts,
      suggestions: {
        normalized_name: await generateAlternativeNormalizedName(normalizedName, env),
        acronym: await generateAlternativeAcronym(stationData.acronym, env)
      }
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Insert with comprehensive data
  const insertQuery = `
    INSERT INTO stations (
      normalized_name, display_name, acronym, status, country,
      latitude, longitude, elevation_m, description,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();
  const result = await executeQueryRun(env, insertQuery, [
    normalizedName,
    stationData.display_name,
    stationData.acronym.toUpperCase(),
    stationData.status || 'Active',
    stationData.country || 'Sweden',
    stationData.latitude || null,
    stationData.longitude || null,
    stationData.elevation_m || null,
    stationData.description || '',
    now,
    now
  ], 'createStationAdmin');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create station', 500);
  }

  // Log admin action
  await logAdminAction(user, 'CREATE', `Station created: ${stationData.display_name}`, env, {
    station_id: result.meta.last_row_id,
    normalized_name: normalizedName,
    acronym: stationData.acronym
  });

  return createSuccessResponse({
    success: true,
    message: 'Station created successfully',
    id: result.meta.last_row_id,
    normalized_name: normalizedName,
    created_at: now
  }, 201);
}

/**
 * Update station (admin only)
 * @param {string} id - Station identifier
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Update response
 */
async function updateStationAdmin(id, request, env, user) {
  const stationData = await request.json();

  // Resolve station using unified system
  const existingStation = await resolveStationIdentifier(id, env);
  if (!existingStation) {
    return createNotFoundResponse();
  }

  // Enhanced validation for updates
  const validation = validateStationUpdateData(stationData);
  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors);
  }

  // Check for conflicts if normalized name or acronym is being changed
  if (stationData.display_name && stationData.display_name !== existingStation.display_name) {
    const newNormalizedName = generateNormalizedName(stationData.display_name);
    if (newNormalizedName !== existingStation.normalized_name) {
      const conflictStation = await resolveStationIdentifier(newNormalizedName, env);
      if (conflictStation && conflictStation.id !== existingStation.id) {
        return new Response(JSON.stringify({
          error: 'Normalized name conflict',
          conflict: { field: 'normalized_name', value: newNormalizedName },
          suggestion: await generateAlternativeNormalizedName(newNormalizedName, env)
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  if (stationData.acronym && stationData.acronym !== existingStation.acronym) {
    const conflictStation = await resolveStationIdentifier(stationData.acronym, env);
    if (conflictStation && conflictStation.id !== existingStation.id) {
      return new Response(JSON.stringify({
        error: 'Acronym conflict',
        conflict: { field: 'acronym', value: stationData.acronym },
        suggestion: await generateAlternativeAcronym(stationData.acronym, env)
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Build update query
  const allowedFields = [];
  const values = [];

  const editableFields = [
    'display_name', 'acronym', 'status', 'country', 'latitude',
    'longitude', 'elevation_m', 'description'
  ];

  editableFields.forEach(field => {
    if (stationData[field] !== undefined) {
      if (field === 'display_name' && stationData[field] !== existingStation.display_name) {
        // Update both display name and normalized name
        allowedFields.push('display_name = ?', 'normalized_name = ?');
        values.push(stationData[field], generateNormalizedName(stationData[field]));
      } else if (field === 'acronym') {
        allowedFields.push('acronym = ?');
        values.push(stationData[field].toUpperCase());
      } else {
        allowedFields.push(`${field} = ?`);
        values.push(stationData[field]);
      }
    }
  });

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  // Add updated_at timestamp
  allowedFields.push('updated_at = ?');
  values.push(new Date().toISOString());

  // Add WHERE clause parameter
  values.push(existingStation.id);

  const updateQuery = `
    UPDATE stations
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updateStationAdmin');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update station', 500);
  }

  // Log admin action
  await logAdminAction(user, 'UPDATE', `Station updated: ${existingStation.display_name}`, env, {
    station_id: existingStation.id,
    changes: Object.keys(stationData)
  });

  return createSuccessResponse({
    success: true,
    message: 'Station updated successfully',
    id: existingStation.id
  });
}

/**
 * Delete station (admin only)
 * @param {string} id - Station identifier
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Deletion response
 */
async function deleteStationAdmin(id, request, env, user) {
  // Parse request body for backup preferences
  let requestData = {};
  try {
    requestData = await request.json();
  } catch (e) {
    // Ignore JSON parsing errors for DELETE requests
  }

  // Resolve station using unified system
  const existingStation = await resolveStationIdentifier(id, env);
  if (!existingStation) {
    return createNotFoundResponse();
  }

  // Analyze dependencies
  const dependencies = await analyzeDependencies('station', existingStation.id, env);

  // Generate backup if requested or if there are dependencies
  let backup = null;
  if (requestData.generate_backup !== false) {
    try {
      backup = await generateComprehensiveBackup('station', existingStation.id, env, user);
    } catch (backupError) {
      console.error('Backup generation failed:', backupError);
      return createErrorResponse('Failed to generate backup before deletion', 500);
    }
  }

  // Delete station (CASCADE should handle dependent records)
  const deleteQuery = 'DELETE FROM stations WHERE id = ?';
  const result = await executeQueryRun(env, deleteQuery, [existingStation.id], 'deleteStationAdmin');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete station', 500);
  }

  // Log admin action
  await logAdminAction(user, 'DELETE', `Station deleted: ${existingStation.display_name}`, env, {
    station_id: existingStation.id,
    normalized_name: existingStation.normalized_name,
    backup_generated: !!backup,
    dependencies_deleted: dependencies
  });

  const response = {
    success: true,
    message: 'Station deleted successfully',
    id: existingStation.id,
    dependencies_deleted: dependencies
  };

  if (backup) {
    response.backup = backup;
  }

  return createSuccessResponse(response);
}