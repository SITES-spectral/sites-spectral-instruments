// AOIs Handler Module
// Areas of Interest (AOI) operations for UAV/Satellite platforms
// Version: 8.0.0-beta.2

import { requireAuthentication, checkUserPermissions } from '../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse,
  createValidationErrorResponse
} from '../utils/responses.js';

/**
 * Handle AOI requests
 * @param {string} method - HTTP method
 * @param {string} id - AOI identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} AOI response
 */
export async function handleAOIs(method, id, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all AOI operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  try {
    switch (method) {
      case 'GET':
        if (id) {
          return await getAOIById(id, user, env);
        } else {
          return await getAOIsList(user, request, env);
        }

      case 'POST':
        return await createAOI(user, request, env);

      case 'PUT':
        if (!id) {
          return createErrorResponse('AOI ID required for update', 400);
        }
        return await updateAOI(id, user, request, env);

      case 'DELETE':
        if (!id) {
          return createErrorResponse('AOI ID required for deletion', 400);
        }
        return await deleteAOI(id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('AOI handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Validate AOI data
 * @param {Object} data - AOI data to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
function validateAOIData(data) {
  const errors = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
    errors.push('Name is required and must be at least 3 characters');
  }

  if (!data.station_id && !data.platform_id) {
    errors.push('Either station_id or platform_id is required');
  }

  if (!data.geometry_type) {
    errors.push('Geometry type is required');
  }

  if (!data.geometry_json) {
    errors.push('Geometry JSON is required');
  } else {
    // Validate GeoJSON structure
    try {
      const geom = typeof data.geometry_json === 'string'
        ? JSON.parse(data.geometry_json)
        : data.geometry_json;

      if (!geom.type || !geom.coordinates) {
        errors.push('Invalid GeoJSON geometry structure');
      }

      if (!['Polygon', 'MultiPolygon', 'Point'].includes(geom.type)) {
        errors.push('Geometry type must be Polygon, MultiPolygon, or Point');
      }
    } catch (e) {
      errors.push('Invalid GeoJSON: ' + e.message);
    }
  }

  // Validate normalized_name format if provided
  if (data.normalized_name && !/^[a-z0-9_]+$/.test(data.normalized_name)) {
    errors.push('Normalized name must contain only lowercase letters, numbers, and underscores');
  }

  // Validate status if provided
  if (data.status && !['active', 'inactive', 'archived'].includes(data.status)) {
    errors.push('Status must be active, inactive, or archived');
  }

  // Validate aoi_type if provided
  const validAOITypes = ['flight_area', 'coverage_area', 'study_site', 'validation_site', 'reference_area'];
  if (data.aoi_type && !validAOITypes.includes(data.aoi_type)) {
    errors.push('Invalid AOI type');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get specific AOI by ID
 * @param {string} id - AOI ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} AOI data response
 */
async function getAOIById(id, user, env) {
  let query = `
    SELECT a.id, a.station_id, a.platform_id, a.name, a.normalized_name,
           a.description, a.geometry_type, a.geometry_json, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           a.source, a.source_file, a.source_crs,
           a.created_by, a.created_at, a.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    LEFT JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE a.id = ?
  `;

  // Add permission filtering for station users
  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const aoi = await executeQueryFirst(env, query, params, 'getAOIById');

  if (!aoi) {
    return createNotFoundResponse();
  }

  // Parse JSON fields
  if (aoi.geometry_json) {
    try {
      aoi.geometry = JSON.parse(aoi.geometry_json);
    } catch (e) {
      console.warn('Failed to parse AOI geometry JSON:', e);
      aoi.geometry = null;
    }
  }

  if (aoi.bbox_json) {
    try {
      aoi.bbox = JSON.parse(aoi.bbox_json);
    } catch (e) {
      console.warn('Failed to parse AOI bbox JSON:', e);
      aoi.bbox = null;
    }
  }

  return createSuccessResponse(aoi);
}

/**
 * Get list of AOIs filtered by user permissions
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object (for query parameters)
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} AOIs list response
 */
async function getAOIsList(user, request, env) {
  const url = new URL(request.url);
  const stationParam = url.searchParams.get('station');
  const platformParam = url.searchParams.get('platform');
  const typeParam = url.searchParams.get('type');
  const statusParam = url.searchParams.get('status') || 'active';

  let query = `
    SELECT a.id, a.station_id, a.platform_id, a.name, a.normalized_name,
           a.description, a.geometry_type, a.bbox_json,
           a.centroid_lat, a.centroid_lon, a.area_m2, a.perimeter_m,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           a.source, a.created_at,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    LEFT JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
  `;

  let params = [];
  let whereConditions = [];

  // Filter by station
  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ? OR s.id = ?)');
    params.push(stationParam, stationParam, stationParam);
  }

  // Filter by platform
  if (platformParam) {
    whereConditions.push('(p.id = ? OR p.normalized_name = ?)');
    params.push(platformParam, platformParam);
  }

  // Filter by AOI type
  if (typeParam) {
    whereConditions.push('a.aoi_type = ?');
    params.push(typeParam);
  }

  // Filter by status
  if (statusParam && statusParam !== 'all') {
    whereConditions.push('a.status = ?');
    params.push(statusParam);
  }

  // Add permission filtering for station users
  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY s.acronym, a.name';

  const result = await executeQuery(env, query, params, 'getAOIsList');
  const aois = (result?.results || []).map(aoi => {
    // Parse bbox JSON
    if (aoi.bbox_json) {
      try {
        aoi.bbox = JSON.parse(aoi.bbox_json);
      } catch (e) {
        aoi.bbox = null;
      }
    }
    return aoi;
  });

  return createSuccessResponse({ aois });
}

/**
 * Create new AOI
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Creation response
 */
async function createAOI(user, request, env) {
  // Check if user has write permissions for AOIs
  const permission = checkUserPermissions(user, 'aois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const aoiData = await request.json();

  // Validate AOI data
  const validation = validateAOIData(aoiData);
  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors);
  }

  // If platform_id provided, get station_id from platform
  let stationId = aoiData.station_id;
  let stationNormalizedName = null;

  if (aoiData.platform_id) {
    const platformQuery = `
      SELECT p.id, p.station_id, s.normalized_name as station_normalized_name
      FROM platforms p
      JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `;
    const platform = await executeQueryFirst(env, platformQuery, [aoiData.platform_id], 'createAOI-platformCheck');

    if (!platform) {
      return createErrorResponse('Platform not found', 404);
    }

    stationId = platform.station_id;
    stationNormalizedName = platform.station_normalized_name;
  } else if (stationId) {
    // Get station normalized name
    const stationQuery = 'SELECT normalized_name FROM stations WHERE id = ?';
    const station = await executeQueryFirst(env, stationQuery, [stationId], 'createAOI-stationCheck');
    if (station) {
      stationNormalizedName = station.normalized_name;
    }
  }

  // Check if station user can access this specific station
  if (user.role === 'station' && user.station_normalized_name !== stationNormalizedName) {
    return createForbiddenResponse();
  }

  // Generate normalized name if not provided
  let normalizedName = aoiData.normalized_name;
  if (!normalizedName && aoiData.name) {
    normalizedName = aoiData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // Ensure geometry_json is a string
  const geometryJson = typeof aoiData.geometry_json === 'string'
    ? aoiData.geometry_json
    : JSON.stringify(aoiData.geometry_json);

  // Ensure bbox_json is a string if provided
  const bboxJson = aoiData.bbox_json
    ? (typeof aoiData.bbox_json === 'string' ? aoiData.bbox_json : JSON.stringify(aoiData.bbox_json))
    : null;

  // Insert new AOI
  const insertQuery = `
    INSERT INTO areas_of_interest (
      station_id, platform_id, name, normalized_name, description,
      geometry_type, geometry_json, bbox_json,
      centroid_lat, centroid_lon, area_m2, perimeter_m,
      ecosystem_code, purpose, aoi_type, status,
      source, source_file, source_crs,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();

  const result = await executeQueryRun(env, insertQuery, [
    stationId,
    aoiData.platform_id || null,
    aoiData.name.trim(),
    normalizedName,
    aoiData.description || '',
    aoiData.geometry_type || 'Polygon',
    geometryJson,
    bboxJson,
    aoiData.centroid_lat || null,
    aoiData.centroid_lon || null,
    aoiData.area_m2 || null,
    aoiData.perimeter_m || null,
    aoiData.ecosystem_code || null,
    aoiData.purpose || 'mapping',
    aoiData.aoi_type || 'flight_area',
    aoiData.status || 'active',
    aoiData.source || 'manual',
    aoiData.source_file || null,
    aoiData.source_crs || 'EPSG:4326',
    user.id || null,
    now,
    now
  ], 'createAOI');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create AOI', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'create', 'aoi', ?, ?, ?)
    `, [user.id, user.username, result.meta.last_row_id, aoiData.name, now], 'createAOI-log');
  } catch (e) {
    console.warn('Failed to log AOI creation:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'AOI created successfully',
    id: result.meta.last_row_id,
    name: aoiData.name,
    normalized_name: normalizedName
  }, 201);
}

/**
 * Update AOI data
 * @param {string} id - AOI ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Update response
 */
async function updateAOI(id, user, request, env) {
  // Check if user has write permissions for AOIs
  const permission = checkUserPermissions(user, 'aois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const aoiData = await request.json();

  // First verify AOI exists and get its station
  const checkQuery = `
    SELECT a.id, a.name, s.normalized_name as station_normalized_name, s.id as station_id
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    WHERE a.id = ?
  `;

  const existingAOI = await executeQueryFirst(env, checkQuery, [id], 'updateAOI-check');

  if (!existingAOI) {
    return createNotFoundResponse();
  }

  // Check if station user can access this specific AOI
  if (user.role === 'station' && user.station_normalized_name !== existingAOI.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Build update query with allowed fields
  const allowedFields = [];
  const values = [];

  const editableFields = [
    'name', 'normalized_name', 'description',
    'geometry_type', 'geometry_json', 'bbox_json',
    'centroid_lat', 'centroid_lon', 'area_m2', 'perimeter_m',
    'ecosystem_code', 'purpose', 'aoi_type', 'status',
    'source', 'source_file', 'source_crs'
  ];

  // Add editable fields
  editableFields.forEach(field => {
    if (aoiData[field] !== undefined) {
      let value = aoiData[field];

      // Ensure JSON fields are strings
      if ((field === 'geometry_json' || field === 'bbox_json') && typeof value !== 'string') {
        value = JSON.stringify(value);
      }

      allowedFields.push(`${field} = ?`);
      values.push(value);
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
    UPDATE areas_of_interest
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updateAOI');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update AOI', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'update', 'aoi', ?, ?, ?)
    `, [user.id, user.username, id, existingAOI.name, new Date().toISOString()], 'updateAOI-log');
  } catch (e) {
    console.warn('Failed to log AOI update:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'AOI updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Delete AOI
 * @param {string} id - AOI ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Deletion response
 */
async function deleteAOI(id, user, env) {
  // Check if user has delete permissions for AOIs
  const permission = checkUserPermissions(user, 'aois', 'delete');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // First verify AOI exists and get its station
  const checkQuery = `
    SELECT a.id, a.name, s.normalized_name as station_normalized_name, s.id as station_id
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    WHERE a.id = ?
  `;

  const existingAOI = await executeQueryFirst(env, checkQuery, [id], 'deleteAOI-check');

  if (!existingAOI) {
    return createNotFoundResponse();
  }

  // Check if station user can access this specific AOI
  if (user.role === 'station' && user.station_normalized_name !== existingAOI.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check for dependent records (campaigns referencing this AOI)
  const campaignCheck = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM acquisition_campaigns WHERE aoi_id = ?',
    [id], 'deleteAOI-campaignCheck'
  );

  if (campaignCheck && campaignCheck.count > 0) {
    return createErrorResponse(
      `Cannot delete AOI: ${campaignCheck.count} campaign(s) reference this AOI`,
      409
    );
  }

  // Delete the AOI
  const deleteQuery = 'DELETE FROM areas_of_interest WHERE id = ?';
  const result = await executeQueryRun(env, deleteQuery, [id], 'deleteAOI');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete AOI', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'delete', 'aoi', ?, ?, ?)
    `, [user.id, user.username, id, existingAOI.name, new Date().toISOString()], 'deleteAOI-log');
  } catch (e) {
    console.warn('Failed to log AOI deletion:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'AOI deleted successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Get AOIs by platform type (for filtering)
 * @param {string} platformType - Platform type (uav, satellite)
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} AOIs list response
 */
export async function getAOIsByPlatformType(platformType, user, env) {
  let query = `
    SELECT a.id, a.name, a.normalized_name, a.aoi_type, a.status,
           a.centroid_lat, a.centroid_lon, a.area_m2,
           s.acronym as station_acronym,
           p.display_name as platform_name
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE p.platform_type = ? AND a.status = 'active'
  `;

  const params = [platformType];

  // Add permission filtering for station users
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' ORDER BY s.acronym, a.name';

  const result = await executeQuery(env, query, params, 'getAOIsByPlatformType');

  return createSuccessResponse({ aois: result?.results || [] });
}

/**
 * Get GeoJSON FeatureCollection of all AOIs for a station
 * @param {string} stationId - Station ID or acronym
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} GeoJSON FeatureCollection response
 */
export async function getAOIsGeoJSON(stationId, user, env) {
  let query = `
    SELECT a.id, a.name, a.normalized_name, a.description,
           a.geometry_type, a.geometry_json,
           a.ecosystem_code, a.purpose, a.aoi_type, a.status,
           a.area_m2, a.perimeter_m,
           s.acronym as station_acronym,
           p.display_name as platform_name, p.platform_type
    FROM areas_of_interest a
    JOIN stations s ON a.station_id = s.id
    LEFT JOIN platforms p ON a.platform_id = p.id
    WHERE (s.id = ? OR s.acronym = ? OR s.normalized_name = ?)
      AND a.status = 'active'
  `;

  const params = [stationId, stationId, stationId];

  // Add permission filtering for station users
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const result = await executeQuery(env, query, params, 'getAOIsGeoJSON');
  const aois = result?.results || [];

  // Build GeoJSON FeatureCollection
  const features = aois.map(aoi => {
    let geometry = null;
    try {
      geometry = JSON.parse(aoi.geometry_json);
    } catch (e) {
      console.warn(`Failed to parse geometry for AOI ${aoi.id}:`, e);
      return null;
    }

    return {
      type: 'Feature',
      id: aoi.id,
      geometry: geometry,
      properties: {
        id: aoi.id,
        name: aoi.name,
        normalized_name: aoi.normalized_name,
        description: aoi.description,
        aoi_type: aoi.aoi_type,
        purpose: aoi.purpose,
        ecosystem_code: aoi.ecosystem_code,
        area_m2: aoi.area_m2,
        perimeter_m: aoi.perimeter_m,
        station_acronym: aoi.station_acronym,
        platform_name: aoi.platform_name,
        platform_type: aoi.platform_type
      }
    };
  }).filter(f => f !== null);

  const featureCollection = {
    type: 'FeatureCollection',
    features: features,
    properties: {
      station: stationId,
      count: features.length,
      generated_at: new Date().toISOString()
    }
  };

  return createSuccessResponse(featureCollection);
}
