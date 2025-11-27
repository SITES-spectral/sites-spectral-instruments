// SITES Spectral V3 UAV Platforms Handler
// UAV-specific platform management
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
import { parsePaginationParams, createPaginatedResponse } from '../api-handler-v3.js';

/**
 * Handle V3 UAV platform requests
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - Remaining path segments after /uav or platform id
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {URL} url - Parsed URL object
 * @returns {Response} UAV platform response
 */
export async function handleUAVPlatformsV3(method, pathSegments, request, env, url) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  const platformId = pathSegments[0];
  const subResource = pathSegments[1];

  try {
    // Handle specific sub-resources
    if (platformId && subResource === 'flights') {
      return await getUAVFlights(platformId, user, request, env, url);
    }

    if (platformId && subResource === 'maintenance') {
      return await getUAVMaintenance(platformId, user, request, env, url);
    }

    // Standard CRUD operations
    switch (method) {
      case 'GET':
        if (platformId) {
          return await getUAVPlatformById(platformId, user, env);
        } else {
          return await getUAVPlatformsList(user, request, env, url);
        }

      case 'POST':
        if (platformId) {
          // Create/update UAV extension for existing platform
          return await createUAVExtension(platformId, user, request, env);
        }
        return createErrorResponse('Platform ID required to create UAV extension', 400);

      case 'PUT':
        if (!platformId) {
          return createErrorResponse('Platform ID required for update', 400);
        }
        return await updateUAVPlatform(platformId, user, request, env);

      case 'DELETE':
        if (!platformId) {
          return createErrorResponse('Platform ID required for deletion', 400);
        }
        return await deleteUAVExtension(platformId, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('UAV Platform V3 handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get UAV platform by ID with extension data
 */
async function getUAVPlatformById(platformId, user, env) {
  // Get base platform info
  let query = `
    SELECT p.id, p.normalized_name, p.display_name, p.station_id,
           p.latitude, p.longitude, p.status, p.platform_type,
           p.deployment_date, p.description,
           p.created_at, p.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ? AND p.platform_type = 'uav'
  `;

  const params = [platformId];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const platform = await executeQueryFirst(env, query, params, 'getUAVPlatformById');

  if (!platform) {
    return createNotFoundResponse();
  }

  // Get UAV extension data
  const uavExtension = await executeQueryFirst(env, `
    SELECT uav_model, manufacturer, serial_number, registration_number,
           max_flight_time_min, max_payload_kg, max_range_km, max_altitude_m, max_speed_ms,
           navigation_system, rtk_capable, ppk_capable, rtk_module, positioning_accuracy_cm,
           rgb_camera, multispectral_camera, thermal_camera, lidar_sensor,
           home_location_lat, home_location_lon,
           operating_temp_min_c, operating_temp_max_c, wind_resistance_ms,
           total_flight_hours, last_maintenance_date, firmware_version,
           created_at as extension_created_at, updated_at as extension_updated_at
    FROM uav_platforms
    WHERE platform_id = ?
  `, [platformId], 'getUAVPlatformExtension');

  // Merge extension data
  const result = {
    ...platform,
    uav_details: uavExtension || null,
    has_uav_extension: !!uavExtension
  };

  // Get flight statistics
  const flightStats = await executeQueryFirst(env, `
    SELECT COUNT(*) as total_campaigns,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_campaigns,
           SUM(images_collected) as total_images,
           SUM(data_size_gb) as total_data_gb
    FROM acquisition_campaigns
    WHERE platform_id = ?
  `, [platformId], 'getUAVFlightStats');

  result.flight_statistics = {
    total_campaigns: flightStats?.total_campaigns || 0,
    completed_campaigns: flightStats?.completed_campaigns || 0,
    total_images: flightStats?.total_images || 0,
    total_data_gb: flightStats?.total_data_gb ? Math.round(flightStats.total_data_gb * 100) / 100 : 0
  };

  // Get AOI count
  const aoiCount = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM areas_of_interest WHERE platform_id = ?',
    [platformId], 'getUAVAOICount'
  );
  result.aoi_count = aoiCount?.count || 0;

  return createSuccessResponse(result);
}

/**
 * Get list of all UAV platforms
 */
async function getUAVPlatformsList(user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const stationParam = url.searchParams.get('station');
  const statusParam = url.searchParams.get('status');

  let whereConditions = ["p.platform_type = 'uav'"];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationParam, stationParam);
  }

  if (statusParam) {
    whereConditions.push('p.status = ?');
    params.push(statusParam);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  // Get count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    ${whereClause}
  `;
  const countResult = await executeQueryFirst(env, countQuery, params, 'getUAVPlatformsCount');
  const totalCount = countResult?.total || 0;

  // Get platforms with UAV extension
  const query = `
    SELECT p.id, p.normalized_name, p.display_name, p.station_id,
           p.latitude, p.longitude, p.status,
           p.deployment_date, p.description,
           p.created_at,
           s.acronym as station_acronym, s.display_name as station_name,
           u.uav_model, u.manufacturer, u.max_flight_time_min,
           u.rtk_capable, u.total_flight_hours,
           (SELECT COUNT(*) FROM acquisition_campaigns WHERE platform_id = p.id) as campaign_count,
           (SELECT COUNT(*) FROM areas_of_interest WHERE platform_id = p.id) as aoi_count
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN uav_platforms u ON p.id = u.platform_id
    ${whereClause}
    ORDER BY p.display_name
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'getUAVPlatformsList');

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(result?.results || [], totalCount, pagination, baseUrl));
}

/**
 * Create UAV extension for existing platform
 */
async function createUAVExtension(platformId, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Verify platform exists and is UAV type
  const platform = await executeQueryFirst(env, `
    SELECT p.id, p.platform_type, s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `, [platformId], 'createUAVExtension-check');

  if (!platform) {
    return createNotFoundResponse();
  }

  if (platform.platform_type !== 'uav') {
    return createErrorResponse('Platform is not a UAV type. Update platform_type first.', 400);
  }

  if (user.role === 'station' && user.station_normalized_name !== platform.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check if extension already exists
  const existing = await executeQueryFirst(env,
    'SELECT id FROM uav_platforms WHERE platform_id = ?',
    [platformId], 'createUAVExtension-existing'
  );

  if (existing) {
    return createErrorResponse('UAV extension already exists for this platform. Use PUT to update.', 409);
  }

  const uavData = await request.json();
  const now = new Date().toISOString();

  const insertQuery = `
    INSERT INTO uav_platforms (
      platform_id, uav_model, manufacturer, serial_number, registration_number,
      max_flight_time_min, max_payload_kg, max_range_km, max_altitude_m, max_speed_ms,
      navigation_system, rtk_capable, ppk_capable, rtk_module, positioning_accuracy_cm,
      rgb_camera, multispectral_camera, thermal_camera, lidar_sensor,
      home_location_lat, home_location_lon,
      operating_temp_min_c, operating_temp_max_c, wind_resistance_ms,
      total_flight_hours, last_maintenance_date, firmware_version,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await executeQueryRun(env, insertQuery, [
    platformId,
    uavData.uav_model || null,
    uavData.manufacturer || null,
    uavData.serial_number || null,
    uavData.registration_number || null,
    uavData.max_flight_time_min || null,
    uavData.max_payload_kg || null,
    uavData.max_range_km || null,
    uavData.max_altitude_m || null,
    uavData.max_speed_ms || null,
    uavData.navigation_system || null,
    uavData.rtk_capable ? 1 : 0,
    uavData.ppk_capable ? 1 : 0,
    uavData.rtk_module || null,
    uavData.positioning_accuracy_cm || null,
    uavData.rgb_camera || null,
    uavData.multispectral_camera || null,
    uavData.thermal_camera || null,
    uavData.lidar_sensor || null,
    uavData.home_location_lat || null,
    uavData.home_location_lon || null,
    uavData.operating_temp_min_c || null,
    uavData.operating_temp_max_c || null,
    uavData.wind_resistance_ms || null,
    uavData.total_flight_hours || 0,
    uavData.last_maintenance_date || null,
    uavData.firmware_version || null,
    now,
    now
  ], 'createUAVExtension');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create UAV extension', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'UAV extension created successfully',
    platform_id: parseInt(platformId, 10),
    extension_id: result.meta.last_row_id
  }, 201);
}

/**
 * Update UAV platform extension
 */
async function updateUAVPlatform(platformId, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Verify platform and access
  const platform = await executeQueryFirst(env, `
    SELECT p.id, s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ? AND p.platform_type = 'uav'
  `, [platformId], 'updateUAVPlatform-check');

  if (!platform) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== platform.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check if extension exists
  const existing = await executeQueryFirst(env,
    'SELECT id FROM uav_platforms WHERE platform_id = ?',
    [platformId], 'updateUAVPlatform-existing'
  );

  if (!existing) {
    return createErrorResponse('UAV extension not found. Use POST to create.', 404);
  }

  const uavData = await request.json();

  const allowedFields = [];
  const values = [];

  const editableFields = [
    'uav_model', 'manufacturer', 'serial_number', 'registration_number',
    'max_flight_time_min', 'max_payload_kg', 'max_range_km', 'max_altitude_m', 'max_speed_ms',
    'navigation_system', 'rtk_capable', 'ppk_capable', 'rtk_module', 'positioning_accuracy_cm',
    'rgb_camera', 'multispectral_camera', 'thermal_camera', 'lidar_sensor',
    'home_location_lat', 'home_location_lon',
    'operating_temp_min_c', 'operating_temp_max_c', 'wind_resistance_ms',
    'total_flight_hours', 'last_maintenance_date', 'firmware_version'
  ];

  editableFields.forEach(field => {
    if (uavData[field] !== undefined) {
      let value = uavData[field];

      // Handle boolean fields
      if (field === 'rtk_capable' || field === 'ppk_capable') {
        value = value ? 1 : 0;
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
  values.push(platformId);

  const updateQuery = `UPDATE uav_platforms SET ${allowedFields.join(', ')} WHERE platform_id = ?`;
  const result = await executeQueryRun(env, updateQuery, values, 'updateUAVPlatform');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update UAV extension', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'UAV extension updated successfully',
    platform_id: parseInt(platformId, 10)
  });
}

/**
 * Delete UAV extension (not the platform itself)
 */
async function deleteUAVExtension(platformId, user, env) {
  // Only admin can delete extensions
  if (user.role !== 'admin') {
    return createForbiddenResponse();
  }

  const result = await executeQueryRun(env,
    'DELETE FROM uav_platforms WHERE platform_id = ?',
    [platformId], 'deleteUAVExtension'
  );

  if (!result || result.changes === 0) {
    return createNotFoundResponse();
  }

  return createSuccessResponse({
    success: true,
    message: 'UAV extension deleted successfully',
    platform_id: parseInt(platformId, 10)
  });
}

/**
 * Get flight campaigns for UAV platform
 */
async function getUAVFlights(platformId, user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const statusParam = url.searchParams.get('status');

  let whereConditions = ['c.platform_id = ?'];
  let params = [platformId];

  if (statusParam) {
    whereConditions.push('c.status = ?');
    params.push(statusParam);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  const query = `
    SELECT c.id, c.campaign_name, c.campaign_type, c.status,
           c.planned_start_datetime, c.actual_start_datetime, c.actual_end_datetime,
           c.flight_altitude_m, c.gsd_cm, c.images_collected, c.data_size_gb,
           c.quality_score, c.weather_conditions,
           a.name as aoi_name,
           s.acronym as station_acronym
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    LEFT JOIN areas_of_interest a ON c.aoi_id = a.id
    ${whereClause}
    ORDER BY c.planned_start_datetime DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'getUAVFlights');

  // Get count
  const countResult = await executeQueryFirst(env, `
    SELECT COUNT(*) as total
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    ${whereClause}
  `, params, 'getUAVFlightsCount');

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(
    result?.results || [],
    countResult?.total || 0,
    pagination,
    baseUrl
  ));
}

/**
 * Get maintenance history for UAV platform
 */
async function getUAVMaintenance(platformId, user, request, env, url) {
  // Get UAV extension with maintenance info
  const uav = await executeQueryFirst(env, `
    SELECT u.last_maintenance_date, u.total_flight_hours, u.firmware_version,
           p.display_name as platform_name
    FROM uav_platforms u
    JOIN platforms p ON u.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE u.platform_id = ?
  `, [platformId], 'getUAVMaintenance');

  if (!uav) {
    return createNotFoundResponse();
  }

  // Calculate days since last maintenance
  let daysSinceMaintenance = null;
  if (uav.last_maintenance_date) {
    const lastMaint = new Date(uav.last_maintenance_date);
    const now = new Date();
    daysSinceMaintenance = Math.floor((now - lastMaint) / (1000 * 60 * 60 * 24));
  }

  // Get recent flights for maintenance tracking
  const recentFlights = await executeQuery(env, `
    SELECT campaign_name, actual_start_datetime, actual_end_datetime,
           images_collected, quality_score, quality_notes
    FROM acquisition_campaigns
    WHERE platform_id = ? AND status = 'completed'
    ORDER BY actual_end_datetime DESC
    LIMIT 10
  `, [platformId], 'getUAVRecentFlights');

  return createSuccessResponse({
    platform_id: parseInt(platformId, 10),
    platform_name: uav.platform_name,
    maintenance_status: {
      last_maintenance_date: uav.last_maintenance_date,
      days_since_maintenance: daysSinceMaintenance,
      total_flight_hours: uav.total_flight_hours,
      firmware_version: uav.firmware_version,
      maintenance_due: daysSinceMaintenance !== null && daysSinceMaintenance > 90
    },
    recent_flights: recentFlights?.results || []
  });
}
