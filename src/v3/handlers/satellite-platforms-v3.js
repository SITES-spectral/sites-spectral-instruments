// SITES Spectral V3 Satellite Platforms Handler
// Satellite-specific platform management
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

// Common satellite constellations
const SATELLITE_CONSTELLATIONS = [
  'Sentinel-2', 'Sentinel-3', 'Landsat', 'MODIS', 'VIIRS',
  'Planet', 'Maxar', 'Airbus', 'ICESat-2', 'GEDI'
];

/**
 * Handle V3 Satellite platform requests
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - Remaining path segments after /satellite or platform id
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {URL} url - Parsed URL object
 * @returns {Response} Satellite platform response
 */
export async function handleSatellitePlatformsV3(method, pathSegments, request, env, url) {
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
    if (platformId && subResource === 'bands') {
      return await getSatelliteBands(platformId, user, env);
    }

    if (platformId && subResource === 'coverage') {
      return await getSatelliteCoverage(platformId, user, request, env, url);
    }

    if (platformId && subResource === 'acquisitions') {
      return await getSatelliteAcquisitions(platformId, user, request, env, url);
    }

    // Standard CRUD operations
    switch (method) {
      case 'GET':
        if (platformId) {
          return await getSatellitePlatformById(platformId, user, env);
        } else {
          return await getSatellitePlatformsList(user, request, env, url);
        }

      case 'POST':
        if (platformId) {
          // Create/update Satellite extension for existing platform
          return await createSatelliteExtension(platformId, user, request, env);
        }
        return createErrorResponse('Platform ID required to create satellite extension', 400);

      case 'PUT':
        if (!platformId) {
          return createErrorResponse('Platform ID required for update', 400);
        }
        return await updateSatellitePlatform(platformId, user, request, env);

      case 'DELETE':
        if (!platformId) {
          return createErrorResponse('Platform ID required for deletion', 400);
        }
        return await deleteSatelliteExtension(platformId, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Satellite Platform V3 handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get Satellite platform by ID with extension data
 */
async function getSatellitePlatformById(platformId, user, env) {
  // Get base platform info
  let query = `
    SELECT p.id, p.normalized_name, p.display_name, p.station_id,
           p.status, p.platform_type,
           p.deployment_date, p.description,
           p.created_at, p.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           s.latitude as station_lat, s.longitude as station_lon
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ? AND p.platform_type = 'satellite'
  `;

  const params = [platformId];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const platform = await executeQueryFirst(env, query, params, 'getSatellitePlatformById');

  if (!platform) {
    return createNotFoundResponse();
  }

  // Get Satellite extension data
  const satExtension = await executeQueryFirst(env, `
    SELECT satellite_name, satellite_id, operator, program, constellation,
           orbit_type, altitude_km, inclination_deg, repeat_cycle_days, revisit_days, local_time,
           swath_width_km, native_resolution_m, radiometric_resolution_bits,
           sensor_name, num_spectral_bands, spectral_bands_json,
           coverage_lat_min, coverage_lat_max,
           data_provider, data_access_url, data_format, processing_levels,
           launch_date, end_of_life_date, operational_status,
           created_at as extension_created_at, updated_at as extension_updated_at
    FROM satellite_platforms
    WHERE platform_id = ?
  `, [platformId], 'getSatellitePlatformExtension');

  // Parse JSON fields
  if (satExtension) {
    if (satExtension.spectral_bands_json) {
      try {
        satExtension.spectral_bands = JSON.parse(satExtension.spectral_bands_json);
      } catch (e) {
        satExtension.spectral_bands = [];
      }
    }

    if (satExtension.processing_levels) {
      try {
        satExtension.available_processing_levels = JSON.parse(satExtension.processing_levels);
      } catch (e) {
        satExtension.available_processing_levels = [];
      }
    }
  }

  // Merge extension data
  const result = {
    ...platform,
    satellite_details: satExtension || null,
    has_satellite_extension: !!satExtension
  };

  // Get product count
  const productCount = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM products WHERE platform_id = ?',
    [platformId], 'getSatelliteProductCount'
  );
  result.product_count = productCount?.count || 0;

  // Get AOI count
  const aoiCount = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM areas_of_interest WHERE platform_id = ?',
    [platformId], 'getSatelliteAOICount'
  );
  result.aoi_count = aoiCount?.count || 0;

  return createSuccessResponse(result);
}

/**
 * Get list of all Satellite platforms
 */
async function getSatellitePlatformsList(user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const stationParam = url.searchParams.get('station');
  const constellationParam = url.searchParams.get('constellation');
  const operatorParam = url.searchParams.get('operator');

  let whereConditions = ["p.platform_type = 'satellite'"];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationParam, stationParam);
  }

  if (constellationParam) {
    whereConditions.push('sat.constellation = ?');
    params.push(constellationParam);
  }

  if (operatorParam) {
    whereConditions.push('sat.operator = ?');
    params.push(operatorParam);
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
    LEFT JOIN satellite_platforms sat ON p.id = sat.platform_id
    ${whereClause}
  `;
  const countResult = await executeQueryFirst(env, countQuery, params, 'getSatellitePlatformsCount');
  const totalCount = countResult?.total || 0;

  // Get platforms with Satellite extension
  const query = `
    SELECT p.id, p.normalized_name, p.display_name, p.station_id,
           p.status, p.description,
           p.created_at,
           s.acronym as station_acronym, s.display_name as station_name,
           sat.satellite_name, sat.constellation, sat.operator,
           sat.native_resolution_m, sat.revisit_days, sat.num_spectral_bands,
           sat.operational_status,
           (SELECT COUNT(*) FROM products WHERE platform_id = p.id) as product_count,
           (SELECT COUNT(*) FROM areas_of_interest WHERE platform_id = p.id) as aoi_count
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN satellite_platforms sat ON p.id = sat.platform_id
    ${whereClause}
    ORDER BY sat.constellation, p.display_name
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'getSatellitePlatformsList');

  const baseUrl = url.origin + url.pathname;
  const response = createPaginatedResponse(result?.results || [], totalCount, pagination, baseUrl);

  // Add available constellations for filtering
  response.meta.available_constellations = SATELLITE_CONSTELLATIONS;

  return createSuccessResponse(response);
}

/**
 * Create Satellite extension for existing platform
 */
async function createSatelliteExtension(platformId, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Verify platform exists and is satellite type
  const platform = await executeQueryFirst(env, `
    SELECT p.id, p.platform_type, s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `, [platformId], 'createSatelliteExtension-check');

  if (!platform) {
    return createNotFoundResponse();
  }

  if (platform.platform_type !== 'satellite') {
    return createErrorResponse('Platform is not a satellite type. Update platform_type first.', 400);
  }

  if (user.role === 'station' && user.station_normalized_name !== platform.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check if extension already exists
  const existing = await executeQueryFirst(env,
    'SELECT id FROM satellite_platforms WHERE platform_id = ?',
    [platformId], 'createSatelliteExtension-existing'
  );

  if (existing) {
    return createErrorResponse('Satellite extension already exists for this platform. Use PUT to update.', 409);
  }

  const satData = await request.json();
  const now = new Date().toISOString();

  // Handle JSON fields
  const spectralBandsJson = satData.spectral_bands
    ? (typeof satData.spectral_bands === 'string' ? satData.spectral_bands : JSON.stringify(satData.spectral_bands))
    : satData.spectral_bands_json || null;

  const processingLevels = satData.processing_levels
    ? (typeof satData.processing_levels === 'string' ? satData.processing_levels : JSON.stringify(satData.processing_levels))
    : null;

  const insertQuery = `
    INSERT INTO satellite_platforms (
      platform_id, satellite_name, satellite_id, operator, program, constellation,
      orbit_type, altitude_km, inclination_deg, repeat_cycle_days, revisit_days, local_time,
      swath_width_km, native_resolution_m, radiometric_resolution_bits,
      sensor_name, num_spectral_bands, spectral_bands_json,
      coverage_lat_min, coverage_lat_max,
      data_provider, data_access_url, data_format, processing_levels,
      launch_date, end_of_life_date, operational_status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await executeQueryRun(env, insertQuery, [
    platformId,
    satData.satellite_name || null,
    satData.satellite_id || null,
    satData.operator || null,
    satData.program || null,
    satData.constellation || null,
    satData.orbit_type || 'sun_synchronous',
    satData.altitude_km || null,
    satData.inclination_deg || null,
    satData.repeat_cycle_days || null,
    satData.revisit_days || null,
    satData.local_time || null,
    satData.swath_width_km || null,
    satData.native_resolution_m || null,
    satData.radiometric_resolution_bits || null,
    satData.sensor_name || null,
    satData.num_spectral_bands || null,
    spectralBandsJson,
    satData.coverage_lat_min || -90,
    satData.coverage_lat_max || 90,
    satData.data_provider || null,
    satData.data_access_url || null,
    satData.data_format || null,
    processingLevels,
    satData.launch_date || null,
    satData.end_of_life_date || null,
    satData.operational_status || 'operational',
    now,
    now
  ], 'createSatelliteExtension');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create satellite extension', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Satellite extension created successfully',
    platform_id: parseInt(platformId, 10),
    extension_id: result.meta.last_row_id
  }, 201);
}

/**
 * Update Satellite platform extension
 */
async function updateSatellitePlatform(platformId, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Verify platform and access
  const platform = await executeQueryFirst(env, `
    SELECT p.id, s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ? AND p.platform_type = 'satellite'
  `, [platformId], 'updateSatellitePlatform-check');

  if (!platform) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== platform.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check if extension exists
  const existing = await executeQueryFirst(env,
    'SELECT id FROM satellite_platforms WHERE platform_id = ?',
    [platformId], 'updateSatellitePlatform-existing'
  );

  if (!existing) {
    return createErrorResponse('Satellite extension not found. Use POST to create.', 404);
  }

  const satData = await request.json();

  const allowedFields = [];
  const values = [];

  const editableFields = [
    'satellite_name', 'satellite_id', 'operator', 'program', 'constellation',
    'orbit_type', 'altitude_km', 'inclination_deg', 'repeat_cycle_days', 'revisit_days', 'local_time',
    'swath_width_km', 'native_resolution_m', 'radiometric_resolution_bits',
    'sensor_name', 'num_spectral_bands', 'spectral_bands_json',
    'coverage_lat_min', 'coverage_lat_max',
    'data_provider', 'data_access_url', 'data_format', 'processing_levels',
    'launch_date', 'end_of_life_date', 'operational_status'
  ];

  editableFields.forEach(field => {
    if (satData[field] !== undefined) {
      let value = satData[field];

      // Handle JSON fields
      if ((field === 'spectral_bands_json' || field === 'processing_levels') && typeof value !== 'string' && value !== null) {
        value = JSON.stringify(value);
      }

      // Handle spectral_bands shortcut
      if (field === 'spectral_bands_json' && satData.spectral_bands && !satData.spectral_bands_json) {
        value = typeof satData.spectral_bands === 'string' ? satData.spectral_bands : JSON.stringify(satData.spectral_bands);
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

  const updateQuery = `UPDATE satellite_platforms SET ${allowedFields.join(', ')} WHERE platform_id = ?`;
  const result = await executeQueryRun(env, updateQuery, values, 'updateSatellitePlatform');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update satellite extension', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Satellite extension updated successfully',
    platform_id: parseInt(platformId, 10)
  });
}

/**
 * Delete Satellite extension (not the platform itself)
 */
async function deleteSatelliteExtension(platformId, user, env) {
  // Only admin can delete extensions
  if (user.role !== 'admin') {
    return createForbiddenResponse();
  }

  const result = await executeQueryRun(env,
    'DELETE FROM satellite_platforms WHERE platform_id = ?',
    [platformId], 'deleteSatelliteExtension'
  );

  if (!result || result.changes === 0) {
    return createNotFoundResponse();
  }

  return createSuccessResponse({
    success: true,
    message: 'Satellite extension deleted successfully',
    platform_id: parseInt(platformId, 10)
  });
}

/**
 * Get spectral bands for satellite platform
 */
async function getSatelliteBands(platformId, user, env) {
  const satExtension = await executeQueryFirst(env, `
    SELECT sat.satellite_name, sat.sensor_name, sat.num_spectral_bands,
           sat.spectral_bands_json, sat.radiometric_resolution_bits
    FROM satellite_platforms sat
    JOIN platforms p ON sat.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE sat.platform_id = ?
  `, [platformId], 'getSatelliteBands');

  if (!satExtension) {
    return createNotFoundResponse();
  }

  let spectralBands = [];
  if (satExtension.spectral_bands_json) {
    try {
      spectralBands = JSON.parse(satExtension.spectral_bands_json);
    } catch (e) {
      spectralBands = [];
    }
  }

  return createSuccessResponse({
    platform_id: parseInt(platformId, 10),
    satellite_name: satExtension.satellite_name,
    sensor_name: satExtension.sensor_name,
    num_bands: satExtension.num_spectral_bands,
    radiometric_resolution_bits: satExtension.radiometric_resolution_bits,
    bands: spectralBands
  });
}

/**
 * Get coverage information for satellite platform
 */
async function getSatelliteCoverage(platformId, user, request, env, url) {
  const satExtension = await executeQueryFirst(env, `
    SELECT sat.satellite_name, sat.swath_width_km, sat.native_resolution_m,
           sat.coverage_lat_min, sat.coverage_lat_max,
           sat.repeat_cycle_days, sat.revisit_days
    FROM satellite_platforms sat
    WHERE sat.platform_id = ?
  `, [platformId], 'getSatelliteCoverage');

  if (!satExtension) {
    return createNotFoundResponse();
  }

  // Get associated stations
  const associatedStations = await executeQuery(env, `
    SELECT DISTINCT s.acronym, s.display_name, s.latitude, s.longitude
    FROM stations s
    JOIN areas_of_interest a ON s.id = a.station_id
    JOIN platforms p ON a.platform_id = p.id
    WHERE p.id = ?
  `, [platformId], 'getSatelliteCoverageStations');

  // Get product coverage dates
  const productDates = await executeQueryFirst(env, `
    SELECT MIN(source_date) as earliest, MAX(source_date) as latest,
           COUNT(DISTINCT source_date) as unique_dates
    FROM products
    WHERE platform_id = ?
  `, [platformId], 'getSatelliteProductDates');

  return createSuccessResponse({
    platform_id: parseInt(platformId, 10),
    satellite_name: satExtension.satellite_name,
    spatial_coverage: {
      swath_width_km: satExtension.swath_width_km,
      native_resolution_m: satExtension.native_resolution_m,
      latitude_range: {
        min: satExtension.coverage_lat_min,
        max: satExtension.coverage_lat_max
      }
    },
    temporal_coverage: {
      repeat_cycle_days: satExtension.repeat_cycle_days,
      revisit_days: satExtension.revisit_days,
      product_dates: {
        earliest: productDates?.earliest,
        latest: productDates?.latest,
        unique_dates: productDates?.unique_dates || 0
      }
    },
    associated_stations: associatedStations?.results || []
  });
}

/**
 * Get acquisition records for satellite platform
 */
async function getSatelliteAcquisitions(platformId, user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const fromDate = url.searchParams.get('from_date');
  const toDate = url.searchParams.get('to_date');

  let whereConditions = ['c.platform_id = ?'];
  let params = [platformId];

  if (fromDate) {
    whereConditions.push('c.planned_start_datetime >= ?');
    params.push(fromDate);
  }

  if (toDate) {
    whereConditions.push('c.planned_start_datetime <= ?');
    params.push(toDate);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');

  const query = `
    SELECT c.id, c.campaign_name, c.status,
           c.planned_start_datetime, c.actual_start_datetime,
           c.cloud_cover_pct, c.quality_score,
           c.processing_status,
           a.name as aoi_name,
           s.acronym as station_acronym,
           (SELECT COUNT(*) FROM products WHERE campaign_id = c.id) as product_count
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    LEFT JOIN areas_of_interest a ON c.aoi_id = a.id
    ${whereClause}
    ORDER BY c.planned_start_datetime DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'getSatelliteAcquisitions');

  // Get count
  const countResult = await executeQueryFirst(env, `
    SELECT COUNT(*) as total
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    ${whereClause}
  `, params, 'getSatelliteAcquisitionsCount');

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(
    result?.results || [],
    countResult?.total || 0,
    pagination,
    baseUrl
  ));
}
