// SITES Spectral V3 Platforms Handler
// Enhanced platform management with type-specific filtering
// Version: 8.0.0

import { requireAuthentication, checkUserPermissions } from '../../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse,
  createValidationErrorResponse
} from '../../utils/responses.js';
import { parsePaginationParams, parseSortParams, createPaginatedResponse } from '../api-handler-v3.js';

/**
 * Handle V3 platform requests with type filtering and pagination
 * @param {string} method - HTTP method
 * @param {Object} params - Route parameters { id, type }
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {URL} url - Parsed URL object
 * @returns {Response} Platform response
 */
export async function handlePlatformsV3(method, params, request, env, url) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all platform operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  try {
    switch (method) {
      case 'GET':
        if (params.id) {
          return await getPlatformByIdV3(params.id, user, env);
        } else if (params.type) {
          return await getPlatformsByTypeV3(params.type, user, request, env, url);
        } else {
          return await getPlatformsListV3(user, request, env, url);
        }

      case 'POST':
        return await createPlatformV3(user, request, env);

      case 'PUT':
        if (!params.id) {
          return createErrorResponse('Platform ID required for update', 400);
        }
        return await updatePlatformV3(params.id, user, request, env);

      case 'DELETE':
        if (!params.id) {
          return createErrorResponse('Platform ID required for deletion', 400);
        }
        return await deletePlatformV3(params.id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Platform V3 handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get platform by ID with full details including type-specific data
 */
async function getPlatformByIdV3(id, user, env) {
  let query = `
    SELECT p.id, p.normalized_name, p.display_name, p.location_code, p.station_id,
           p.latitude, p.longitude, p.platform_height_m, p.status, p.mounting_structure,
           p.deployment_date, p.description, p.operation_programs,
           p.platform_type, p.platform_type_id, p.ecosystem_code,
           p.created_at, p.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           pt.name as platform_type_name, pt.icon as platform_type_icon,
           pt.color as platform_type_color, pt.requires_aoi
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN platform_types pt ON p.platform_type = pt.code
    WHERE p.id = ?
  `;

  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const platform = await executeQueryFirst(env, query, params, 'getPlatformByIdV3');

  if (!platform) {
    return createNotFoundResponse();
  }

  // Get instrument count
  const instrumentCount = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM instruments WHERE platform_id = ?',
    [id], 'getPlatformInstrumentCount'
  );
  platform.instrument_count = instrumentCount?.count || 0;

  // Get AOI count for this platform
  const aoiCount = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM areas_of_interest WHERE platform_id = ?',
    [id], 'getPlatformAOICount'
  );
  platform.aoi_count = aoiCount?.count || 0;

  // Get campaign count for this platform
  const campaignCount = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM acquisition_campaigns WHERE platform_id = ?',
    [id], 'getPlatformCampaignCount'
  );
  platform.campaign_count = campaignCount?.count || 0;

  return createSuccessResponse(platform);
}

/**
 * Get platforms filtered by type (uav, satellite, fixed, mobile)
 */
async function getPlatformsByTypeV3(platformType, user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const { sortBy, sortOrder } = parseSortParams(url, ['created_at', 'display_name', 'id', 'status']);

  // Get total count
  let countQuery = `
    SELECT COUNT(*) as total
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.platform_type = ?
  `;
  const countParams = [platformType];

  if (user.role === 'station' && user.station_normalized_name) {
    countQuery += ' AND s.normalized_name = ?';
    countParams.push(user.station_normalized_name);
  }

  const countResult = await executeQueryFirst(env, countQuery, countParams, 'getPlatformsByTypeCount');
  const totalCount = countResult?.total || 0;

  // Get paginated results
  let query = `
    SELECT p.id, p.normalized_name, p.display_name, p.location_code, p.station_id,
           p.latitude, p.longitude, p.platform_height_m, p.status, p.mounting_structure,
           p.deployment_date, p.description, p.platform_type, p.ecosystem_code,
           p.created_at, p.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           pt.name as platform_type_name, pt.icon as platform_type_icon,
           pt.color as platform_type_color,
           (SELECT COUNT(*) FROM instruments WHERE platform_id = p.id) as instrument_count,
           (SELECT COUNT(*) FROM areas_of_interest WHERE platform_id = p.id) as aoi_count
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN platform_types pt ON p.platform_type = pt.code
    WHERE p.platform_type = ?
  `;

  const params = [platformType];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ` ORDER BY p.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(pagination.limit, pagination.offset);

  const result = await executeQuery(env, query, params, 'getPlatformsByTypeV3');
  const platforms = result?.results || [];

  const baseUrl = url.origin + url.pathname;
  const response = createPaginatedResponse(platforms, totalCount, pagination, baseUrl);
  response.meta.platformType = platformType;

  return createSuccessResponse(response);
}

/**
 * Get all platforms with pagination and filtering
 */
async function getPlatformsListV3(user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const { sortBy, sortOrder } = parseSortParams(url, ['created_at', 'display_name', 'id', 'status']);

  // Filter parameters
  const stationParam = url.searchParams.get('station');
  const typeParam = url.searchParams.get('type');
  const statusParam = url.searchParams.get('status');
  const ecosystemParam = url.searchParams.get('ecosystem');

  // Build WHERE conditions
  let whereConditions = [];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ? OR s.id = ?)');
    params.push(stationParam, stationParam, stationParam);
  }

  if (typeParam) {
    whereConditions.push('p.platform_type = ?');
    params.push(typeParam);
  }

  if (statusParam) {
    whereConditions.push('p.status = ?');
    params.push(statusParam);
  }

  if (ecosystemParam) {
    whereConditions.push('p.ecosystem_code = ?');
    params.push(ecosystemParam);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
  `;
  const countResult = await executeQueryFirst(env, countQuery, params, 'getPlatformsListCount');
  const totalCount = countResult?.total || 0;

  // Get paginated results
  const query = `
    SELECT p.id, p.normalized_name, p.display_name, p.location_code, p.station_id,
           p.latitude, p.longitude, p.platform_height_m, p.status, p.mounting_structure,
           p.deployment_date, p.description, p.platform_type, p.ecosystem_code,
           p.created_at, p.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           pt.name as platform_type_name, pt.icon as platform_type_icon,
           pt.color as platform_type_color, pt.requires_aoi,
           (SELECT COUNT(*) FROM instruments WHERE platform_id = p.id) as instrument_count,
           (SELECT COUNT(*) FROM areas_of_interest WHERE platform_id = p.id) as aoi_count
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN platform_types pt ON p.platform_type = pt.code
    ${whereClause}
    ORDER BY p.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'getPlatformsListV3');
  const platforms = result?.results || [];

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(platforms, totalCount, pagination, baseUrl));
}

/**
 * Create a new platform
 */
async function createPlatformV3(user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const platformData = await request.json();

  // Validate required fields
  const requiredFields = ['display_name', 'station_id'];
  const errors = [];

  for (const field of requiredFields) {
    if (!platformData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate platform_type
  const validTypes = ['fixed', 'uav', 'satellite', 'mobile'];
  if (platformData.platform_type && !validTypes.includes(platformData.platform_type)) {
    errors.push(`Invalid platform_type. Valid types: ${validTypes.join(', ')}`);
  }

  if (errors.length > 0) {
    return createValidationErrorResponse(errors);
  }

  // For station users, verify access
  if (user.role === 'station') {
    const stationQuery = 'SELECT id, normalized_name FROM stations WHERE normalized_name = ?';
    const userStation = await executeQueryFirst(env, stationQuery, [user.station_normalized_name], 'createPlatformV3-stationCheck');

    if (!userStation || userStation.id !== parseInt(platformData.station_id, 10)) {
      return createForbiddenResponse();
    }
  }

  // Verify station exists
  const stationQuery = 'SELECT id, normalized_name, acronym FROM stations WHERE id = ?';
  const station = await executeQueryFirst(env, stationQuery, [platformData.station_id], 'createPlatformV3-stationVerify');

  if (!station) {
    return createErrorResponse('Station not found', 404);
  }

  // Generate normalized name
  let normalizedName = platformData.normalized_name;
  if (!normalizedName) {
    const ecosystemCode = platformData.ecosystem_code || 'GEN';
    const nextCode = await getNextLocationCode(station.id, ecosystemCode, env);
    normalizedName = `${station.normalized_name}_${ecosystemCode}_${nextCode}`;
  }

  // Check for duplicates
  const duplicate = await executeQueryFirst(env,
    'SELECT id FROM platforms WHERE normalized_name = ?',
    [normalizedName], 'createPlatformV3-duplicateCheck'
  );

  if (duplicate) {
    return createErrorResponse(`Platform with normalized name '${normalizedName}' already exists`, 409);
  }

  // Insert platform
  const now = new Date().toISOString();
  const insertQuery = `
    INSERT INTO platforms (
      normalized_name, display_name, location_code, station_id, ecosystem_code,
      platform_type, latitude, longitude, platform_height_m, status,
      mounting_structure, deployment_date, description, operation_programs,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await executeQueryRun(env, insertQuery, [
    normalizedName,
    platformData.display_name,
    platformData.location_code || null,
    platformData.station_id,
    platformData.ecosystem_code || null,
    platformData.platform_type || 'fixed',
    platformData.latitude || null,
    platformData.longitude || null,
    platformData.platform_height_m || null,
    platformData.status || 'Active',
    platformData.mounting_structure || null,
    platformData.deployment_date || null,
    platformData.description || null,
    platformData.operation_programs || null,
    now,
    now
  ], 'createPlatformV3');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create platform', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'create', 'platform', ?, ?, ?)
    `, [user.id, user.username, result.meta.last_row_id, platformData.display_name, now], 'createPlatformV3-log');
  } catch (e) {
    console.warn('Failed to log platform creation:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'Platform created successfully',
    id: result.meta.last_row_id,
    normalized_name: normalizedName,
    platform_type: platformData.platform_type || 'fixed'
  }, 201);
}

/**
 * Update platform
 */
async function updatePlatformV3(id, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const platformData = await request.json();

  // Verify platform exists
  const checkQuery = `
    SELECT p.id, s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `;
  const existing = await executeQueryFirst(env, checkQuery, [id], 'updatePlatformV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  // Check station access
  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Build update query
  const allowedFields = [];
  const values = [];

  const editableFields = [
    'display_name', 'status', 'mounting_structure', 'platform_height_m',
    'latitude', 'longitude', 'deployment_date', 'description',
    'operation_programs', 'platform_type', 'ecosystem_code'
  ];

  editableFields.forEach(field => {
    if (platformData[field] !== undefined) {
      let value = platformData[field];

      if (field === 'latitude' || field === 'longitude') {
        value = value ? Math.round(parseFloat(value) * 1000000) / 1000000 : null;
      } else if (field === 'platform_height_m') {
        value = value ? parseFloat(value) : null;
      }

      allowedFields.push(`${field} = ?`);
      values.push(value);
    }
  });

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  allowedFields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const updateQuery = `UPDATE platforms SET ${allowedFields.join(', ')} WHERE id = ?`;
  const result = await executeQueryRun(env, updateQuery, values, 'updatePlatformV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update platform', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Platform updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Delete platform (admin only)
 */
async function deletePlatformV3(id, user, env) {
  // Only admin can delete platforms
  if (user.role !== 'admin') {
    return createForbiddenResponse();
  }

  // Check for dependent records
  const instrumentCheck = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM instruments WHERE platform_id = ?',
    [id], 'deletePlatformV3-instrumentCheck'
  );

  if (instrumentCheck && instrumentCheck.count > 0) {
    return createErrorResponse(
      `Cannot delete platform: ${instrumentCheck.count} instrument(s) are attached. Delete instruments first.`,
      409
    );
  }

  const campaignCheck = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM acquisition_campaigns WHERE platform_id = ?',
    [id], 'deletePlatformV3-campaignCheck'
  );

  if (campaignCheck && campaignCheck.count > 0) {
    return createErrorResponse(
      `Cannot delete platform: ${campaignCheck.count} campaign(s) reference this platform.`,
      409
    );
  }

  // Delete the platform
  const result = await executeQueryRun(env,
    'DELETE FROM platforms WHERE id = ?',
    [id], 'deletePlatformV3'
  );

  if (!result || result.changes === 0) {
    return createNotFoundResponse();
  }

  return createSuccessResponse({
    success: true,
    message: 'Platform deleted successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Get next available location code for platform
 */
async function getNextLocationCode(stationId, ecosystemCode, env) {
  const query = `
    SELECT location_code
    FROM platforms
    WHERE station_id = ? AND ecosystem_code = ?
    ORDER BY location_code DESC
    LIMIT 1
  `;

  const result = await executeQueryFirst(env, query, [stationId, ecosystemCode], 'getNextLocationCode');

  if (!result || !result.location_code) {
    return 'P01';
  }

  const match = result.location_code.match(/P(\d+)/);
  if (match) {
    const number = parseInt(match[1], 10) + 1;
    return `P${number.toString().padStart(2, '0')}`;
  }

  return 'P01';
}
