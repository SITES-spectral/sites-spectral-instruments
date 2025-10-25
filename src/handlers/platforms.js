// Platforms Handler Module
// Regular platform operations

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
 * Handle platform requests
 * @param {string} method - HTTP method
 * @param {string} id - Platform identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Platform response
 */
export async function handlePlatforms(method, id, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all platform operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  try {
    switch (method) {
      case 'GET':
        if (id) {
          return await getPlatformById(id, user, env);
        } else {
          return await getPlatformsList(user, request, env);
        }

      case 'POST':
        return await createPlatform(user, request, env);

      case 'PUT':
        if (!id) {
          return createErrorResponse('Platform ID required for update', 400);
        }
        return await updatePlatform(id, user, request, env);

      case 'DELETE':
        // Platform deletion is admin-only, redirect to admin handler
        return createForbiddenResponse();

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Platform handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get specific platform by ID
 * @param {string} id - Platform ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Platform data response
 */
async function getPlatformById(id, user, env) {
  let query = `
    SELECT p.id, p.normalized_name, p.display_name, p.location_code, p.station_id,
           p.latitude, p.longitude, p.platform_height_m, p.status, p.mounting_structure,
           p.deployment_date, p.description, p.operation_programs,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `;

  // Add permission filtering for station users
  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const result = await executeQueryFirst(env, query, params, 'getPlatformById');

  if (!result) {
    return createNotFoundResponse();
  }

  return createSuccessResponse(result);
}

/**
 * Get list of platforms filtered by user permissions
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object (for query parameters)
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Platforms list response
 */
async function getPlatformsList(user, request, env) {
  const url = new URL(request.url);
  const stationParam = url.searchParams.get('station');

  console.debug('Platform API Debug:', {
    stationParam,
    userRole: user.role,
    userStationNormalizedName: user.station_normalized_name,
    userStationAcronym: user.station_acronym
  });

  let query = `
    SELECT p.id, p.normalized_name, p.display_name, p.location_code, p.station_id,
           p.latitude, p.longitude, p.platform_height_m, p.status, p.mounting_structure,
           p.operation_programs, p.created_at,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           COUNT(i.id) as instrument_count
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN instruments i ON p.id = i.platform_id
  `;

  let params = [];

  // Filter by specific station if requested
  if (stationParam) {
    query += ' WHERE (s.acronym = ? OR s.normalized_name = ?)';
    params = [stationParam, stationParam];
  }

  // Add permission filtering for station users
  if (user.role === 'station' && user.station_normalized_name) {
    query += stationParam ? ' AND' : ' WHERE';
    query += ' s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' GROUP BY p.id ORDER BY p.display_name';

  console.debug('Platform query:', query);
  console.debug('Platform params:', params);

  const result = await executeQuery(env, query, params, 'getPlatformsList');

  console.debug('Platform query result:', {
    success: result?.success,
    resultCount: result?.results?.length || 0,
    results: result?.results
  });

  return createSuccessResponse({
    platforms: result?.results || []
  });
}

/**
 * Update platform data
 * @param {string} id - Platform ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Update response
 */
async function updatePlatform(id, user, request, env) {
  // Check if user has write permissions for platforms
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const platformData = await request.json();

  // First verify platform exists and get its station
  const checkQuery = `
    SELECT p.id, s.normalized_name as station_normalized_name, s.id as station_id
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `;

  const existingPlatform = await executeQueryFirst(env, checkQuery, [id], 'updatePlatform-check');

  if (!existingPlatform) {
    return createNotFoundResponse();
  }

  // Check if station user can access this specific platform
  if (user.role === 'station' && user.station_normalized_name !== existingPlatform.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Build update query with allowed fields
  const allowedFields = [];
  const values = [];

  // Helper function to round coordinates to exactly 6 decimal places
  const roundCoordinate = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    // Round to 6 decimal places: multiply by 1000000, round, divide by 1000000
    return Math.round(num * 1000000) / 1000000;
  };

  // Fields that station users can edit
  const stationEditableFields = [
    'display_name', 'status', 'mounting_structure', 'platform_height_m',
    'latitude', 'longitude', 'deployment_date', 'description', 'operation_programs'
  ];

  // Fields that only admin can edit
  const adminOnlyFields = ['location_code', 'ecosystem_code', 'normalized_name'];

  // Add station editable fields with proper data type handling
  stationEditableFields.forEach(field => {
    if (platformData[field] !== undefined) {
      let value = platformData[field];

      // Apply coordinate rounding to latitude and longitude
      if (field === 'latitude' || field === 'longitude') {
        value = roundCoordinate(value);
      }
      // Ensure platform_height_m is properly parsed as a number
      else if (field === 'platform_height_m') {
        value = value ? parseFloat(value) : null;
      }

      allowedFields.push(`${field} = ?`);
      values.push(value);
    }
  });

  // Add admin-only fields if user is admin
  if (user.role === 'admin') {
    adminOnlyFields.forEach(field => {
      if (platformData[field] !== undefined) {
        allowedFields.push(`${field} = ?`);
        values.push(platformData[field]);
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
    UPDATE platforms
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updatePlatform');

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
 * Create new platform
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Create response
 */
async function createPlatform(user, request, env) {
  // Check if user has write permissions for platforms
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const platformData = await request.json();

  // Required fields validation
  const requiredFields = ['display_name', 'station_id', 'ecosystem_code'];
  for (const field of requiredFields) {
    if (!platformData[field]) {
      return createErrorResponse(`Missing required field: ${field}`, 400);
    }
  }

  // For station users, ensure they can only create platforms for their own station
  if (user.role === 'station') {
    // Get user's station info
    const stationQuery = `SELECT id, normalized_name FROM stations WHERE normalized_name = ?`;
    const userStation = await executeQueryFirst(env, stationQuery, [user.station_normalized_name], 'createPlatform-station-check');

    if (!userStation || userStation.id !== parseInt(platformData.station_id, 10)) {
      return createForbiddenResponse();
    }
  }

  // Verify station exists
  const stationQuery = `SELECT id, normalized_name, acronym FROM stations WHERE id = ?`;
  const station = await executeQueryFirst(env, stationQuery, [platformData.station_id], 'createPlatform-station-verify');

  if (!station) {
    return createErrorResponse('Station not found', 404);
  }

  // Generate normalized name and location code if not provided (admin can override)
  let normalizedName = platformData.normalized_name;
  let locationCode = platformData.location_code;

  if (!normalizedName || user.role !== 'admin') {
    // Auto-generate normalized name: {STATION}_{ECOSYSTEM}_{LOCATION}
    const nextLocationCode = await getNextLocationCode(station.id, platformData.ecosystem_code, env);
    normalizedName = `${station.normalized_name}_${platformData.ecosystem_code}_${nextLocationCode}`;
    locationCode = nextLocationCode;
  }

  // Check for duplicate normalized names
  const duplicateCheck = `SELECT id FROM platforms WHERE normalized_name = ?`;
  const duplicate = await executeQueryFirst(env, duplicateCheck, [normalizedName], 'createPlatform-duplicate-check');

  if (duplicate) {
    return createErrorResponse(`Platform with normalized name '${normalizedName}' already exists`, 409);
  }

  // Prepare insert data
  const now = new Date().toISOString();
  const insertQuery = `
    INSERT INTO platforms (
      normalized_name, display_name, location_code, station_id, ecosystem_code,
      latitude, longitude, platform_height_m, status, mounting_structure,
      deployment_date, description, operation_programs, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    normalizedName,
    platformData.display_name,
    locationCode,
    platformData.station_id,
    platformData.ecosystem_code,
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
  ];

  const result = await executeQueryRun(env, insertQuery, values, 'createPlatform');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create platform', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Platform created successfully',
    id: result.meta.last_row_id,
    normalized_name: normalizedName,
    location_code: locationCode
  });
}

/**
 * Get next available location code for platform
 * @param {number} stationId - Station ID
 * @param {string} ecosystemCode - Ecosystem code
 * @param {Object} env - Environment variables and bindings
 * @returns {string} Next location code (P01, P02, etc.)
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

  // Extract number and increment
  const match = result.location_code.match(/P(\d+)/);
  if (match) {
    const number = parseInt(match[1], 10) + 1;
    return `P${number.toString().padStart(2, '0')}`;
  }

  return 'P01';
}