// Admin Platforms Module
// Admin-only platform CRUD operations

import { executeQueryRun, resolveStationIdentifier } from '../utils/database.js';
import {
  validatePlatformData,
  checkPlatformConflicts,
  generatePlatformAlternatives
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
 * Handle admin platform operations
 * @param {string} method - HTTP method
 * @param {string} id - Platform identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Admin platform response
 */
export async function handleAdminPlatforms(method, id, request, env, user) {
  const startTime = Date.now();

  try {
    let result;

    switch (method) {
      case 'POST':
        result = await createPlatformAdmin(request, env, user);
        break;

      case 'PUT':
        if (!id) {
          return createErrorResponse('Platform ID required for update', 400);
        }
        result = await updatePlatformAdmin(id, request, env, user);
        break;

      case 'DELETE':
        if (!id) {
          return createErrorResponse('Platform ID required for deletion', 400);
        }
        result = await deletePlatformAdmin(id, request, env, user);
        break;

      default:
        return createMethodNotAllowedResponse();
    }

    // Log operation timing
    const duration = Date.now() - startTime;
    await logAdminAction(user, method, `Platform ${method} operation completed`, env, {
      platform_id: id,
      duration_ms: duration,
      success: true
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Admin Platform Error:', error);
    await logAdminAction(user, method, `Platform ${method} operation failed: ${error.message}`, env, {
      platform_id: id,
      duration_ms: duration,
      success: false,
      error: error.message
    });
    throw error;
  }
}

/**
 * Create new platform (admin only)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Creation response
 */
async function createPlatformAdmin(request, env, user) {
  const platformData = await request.json();

  // Enhanced validation
  const validation = validatePlatformData(platformData);
  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors);
  }

  // Resolve station using unified system
  const station = await resolveStationIdentifier(platformData.station_id, env);
  if (!station) {
    return createErrorResponse('Station not found', 404);
  }

  // Generate smart normalized name
  const ecosystemCode = platformData.ecosystem_code || 'GEN';
  const normalizedName = `${station.acronym}_${ecosystemCode}_${platformData.location_code}`;

  // Check conflicts
  const conflicts = await checkPlatformConflicts(platformData.station_id, normalizedName, platformData.location_code, env);
  if (conflicts.length > 0) {
    return new Response(JSON.stringify({
      error: 'Duplicate values detected',
      conflicts: conflicts,
      suggestions: await generatePlatformAlternatives(normalizedName, platformData.location_code, platformData.station_id, env)
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Insert platform
  const insertQuery = `
    INSERT INTO platforms (
      station_id, normalized_name, display_name, location_code,
      ecosystem_code, mounting_structure, platform_height_m, status,
      latitude, longitude, deployment_date, description, operation_programs,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();
  const result = await executeQueryRun(env, insertQuery, [
    station.id,
    normalizedName,
    platformData.display_name,
    platformData.location_code,
    ecosystemCode,
    platformData.mounting_structure || null,
    platformData.platform_height_m || null,
    platformData.status || 'Active',
    platformData.latitude || null,
    platformData.longitude || null,
    platformData.deployment_date || null,
    platformData.description || '',
    platformData.operation_programs || null,
    now,
    now
  ], 'createPlatformAdmin');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create platform', 500);
  }

  // Log admin action
  await logAdminAction(user, 'CREATE', `Platform created: ${platformData.display_name}`, env, {
    platform_id: result.meta.last_row_id,
    station_id: station.id,
    normalized_name: normalizedName,
    location_code: platformData.location_code
  });

  return createSuccessResponse({
    success: true,
    message: 'Platform created successfully',
    id: result.meta.last_row_id,
    normalized_name: normalizedName,
    created_at: now
  }, 201);
}

/**
 * Update platform (admin only)
 * @param {string} id - Platform identifier
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Update response
 */
async function updatePlatformAdmin(id, request, env, user) {
  const platformData = await request.json();

  // First verify platform exists
  const existingPlatform = await getPlatformById(id, env);
  if (!existingPlatform) {
    return createNotFoundResponse();
  }

  // Validate platform data for updates
  const validation = validatePlatformData({ ...existingPlatform, ...platformData });
  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors);
  }

  // Check for conflicts if location_code or ecosystem_code is being changed
  if (platformData.location_code && platformData.location_code !== existingPlatform.location_code) {
    const conflicts = await checkPlatformConflicts(
      existingPlatform.station_id,
      existingPlatform.normalized_name,
      platformData.location_code,
      env
    );
    if (conflicts.length > 0) {
      return new Response(JSON.stringify({
        error: 'Location code conflict',
        conflicts: conflicts,
        suggestions: await generatePlatformAlternatives(
          existingPlatform.normalized_name,
          platformData.location_code,
          existingPlatform.station_id,
          env
        )
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
    'display_name', 'location_code', 'ecosystem_code', 'mounting_structure',
    'platform_height_m', 'status', 'latitude', 'longitude', 'deployment_date',
    'description', 'operation_programs'
  ];

  editableFields.forEach(field => {
    if (platformData[field] !== undefined) {
      allowedFields.push(`${field} = ?`);
      values.push(platformData[field]);
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
    UPDATE platforms
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updatePlatformAdmin');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update platform', 500);
  }

  // Log admin action
  await logAdminAction(user, 'UPDATE', `Platform updated: ${existingPlatform.display_name}`, env, {
    platform_id: id,
    changes: Object.keys(platformData)
  });

  return createSuccessResponse({
    success: true,
    message: 'Platform updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Delete platform (admin only)
 * @param {string} id - Platform identifier
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {Object} user - Admin user object
 * @returns {Response} Deletion response
 */
async function deletePlatformAdmin(id, request, env, user) {
  // Parse request body for backup preferences
  let requestData = {};
  try {
    requestData = await request.json();
  } catch (e) {
    // Ignore JSON parsing errors for DELETE requests
  }

  // First verify platform exists
  const existingPlatform = await getPlatformById(id, env);
  if (!existingPlatform) {
    return createNotFoundResponse();
  }

  // Analyze dependencies
  const dependencies = await analyzeDependencies('platform', id, env);

  // Generate backup if requested or if there are dependencies
  let backup = null;
  if (requestData.generate_backup !== false) {
    try {
      backup = await generateComprehensiveBackup('platform', id, env, user);
    } catch (backupError) {
      console.error('Backup generation failed:', backupError);
      return createErrorResponse('Failed to generate backup before deletion', 500);
    }
  }

  // Delete platform (CASCADE should handle dependent records)
  const deleteQuery = 'DELETE FROM platforms WHERE id = ?';
  const result = await executeQueryRun(env, deleteQuery, [id], 'deletePlatformAdmin');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete platform', 500);
  }

  // Log admin action
  await logAdminAction(user, 'DELETE', `Platform deleted: ${existingPlatform.display_name}`, env, {
    platform_id: id,
    normalized_name: existingPlatform.normalized_name,
    backup_generated: !!backup,
    dependencies_deleted: dependencies
  });

  const response = {
    success: true,
    message: 'Platform deleted successfully',
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
 * @param {string} id - Platform ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Platform data or null
 */
async function getPlatformById(id, env) {
  const query = `
    SELECT p.*, s.acronym as station_acronym
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `;

  const result = await env.DB.prepare(query).bind(id).first();
  return result || null;
}