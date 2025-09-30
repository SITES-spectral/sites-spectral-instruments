// Instruments Handler Module
// Regular instrument operations

import { requireAuthentication, checkUserPermissions } from '../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../utils/responses.js';
import { validateCameraSpecifications } from '../utils/camera-validation.js';

/**
 * Handle instrument requests
 * @param {string} method - HTTP method
 * @param {string} id - Instrument identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument response
 */
export async function handleInstruments(method, id, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all instrument operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  try {
    switch (method) {
      case 'GET':
        if (id) {
          return await getInstrumentById(id, user, env);
        } else {
          return await getInstrumentsList(user, request, env);
        }

      case 'POST':
        return await createInstrument(user, request, env);

      case 'PUT':
        if (!id) {
          return createErrorResponse('Instrument ID required for update', 400);
        }
        return await updateInstrument(id, user, request, env);

      case 'DELETE':
        if (!id) {
          return createErrorResponse('Instrument ID required for deletion', 400);
        }
        return await deleteInstrument(id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Instrument handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get specific instrument by ID
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument data response
 */
async function getInstrumentById(id, user, env) {
  let query = `
    SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
           i.instrument_type, i.ecosystem_code, i.instrument_number, i.status,
           i.deployment_date, i.instrument_deployment_date,
           i.latitude, i.longitude, i.epsg_code, i.viewing_direction, i.azimuth_degrees,
           i.instrument_degrees_from_nadir, i.degrees_from_nadir,
           i.camera_brand, i.camera_model, i.camera_resolution, i.camera_serial_number,
           i.camera_aperture, i.camera_exposure_time, i.camera_focal_length_mm,
           i.camera_iso, i.camera_lens, i.camera_mega_pixels, i.camera_white_balance,
           i.calibration_date, i.calibration_notes, i.manufacturer_warranty_expires,
           i.power_source, i.data_transmission,
           i.image_processing_enabled, i.image_archive_path, i.last_image_timestamp,
           i.image_quality_score,
           i.first_measurement_year, i.last_measurement_year, i.measurement_status,
           i.instrument_height_m, i.description, i.installation_notes, i.maintenance_notes,
           i.created_at, i.updated_at,
           p.display_name as platform_name, p.location_code, p.mounting_structure,
           p.research_programs,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           COUNT(r.id) as roi_count,
           COUNT(CASE WHEN r.roi_processing_enabled = true THEN 1 END) as active_roi_count
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN instrument_rois r ON i.id = r.instrument_id
    WHERE i.id = ?
  `;

  // Add permission filtering for station users
  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' GROUP BY i.id';

  const result = await executeQueryFirst(env, query, params, 'getInstrumentById');

  if (!result) {
    return createNotFoundResponse();
  }

  return createSuccessResponse(result);
}

/**
 * Get list of instruments filtered by user permissions
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object (for query parameters)
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instruments list response
 */
async function getInstrumentsList(user, request, env) {
  const url = new URL(request.url);
  const stationParam = url.searchParams.get('station');
  const platformParam = url.searchParams.get('platform');

  let query = `
    SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
           i.instrument_type, i.ecosystem_code, i.instrument_number, i.status,
           i.latitude, i.longitude, i.viewing_direction, i.azimuth_degrees,
           i.camera_brand, i.camera_model, i.camera_resolution, i.created_at,
           p.display_name as platform_name, p.location_code, p.normalized_name as platform_normalized_name,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           COUNT(r.id) as roi_count
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN instrument_rois r ON i.id = r.instrument_id
  `;

  let params = [];
  let whereConditions = [];

  // Filter by specific station if requested
  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationParam, stationParam);
  }

  // Filter by specific platform if requested
  if (platformParam) {
    whereConditions.push('(p.id = ? OR p.normalized_name = ?)');
    params.push(platformParam, platformParam);
  }

  // Add permission filtering for station users
  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' GROUP BY i.id ORDER BY i.display_name';

  const result = await executeQuery(env, query, params, 'getInstrumentsList');

  return createSuccessResponse({
    instruments: result?.results || []
  });
}

/**
 * Update instrument data
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Update response
 */
async function updateInstrument(id, user, request, env) {
  // Check if user has write permissions for instruments
  const permission = checkUserPermissions(user, 'instruments', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const instrumentData = await request.json();

  // First verify instrument exists and get its station
  const checkQuery = `
    SELECT i.id, s.normalized_name as station_normalized_name, s.id as station_id
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  const existingInstrument = await executeQueryFirst(env, checkQuery, [id], 'updateInstrument-check');

  if (!existingInstrument) {
    return createNotFoundResponse();
  }

  // Check if station user can access this specific instrument
  if (user.role === 'station' && user.station_normalized_name !== existingInstrument.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Build update query with allowed fields
  const allowedFields = [];
  const values = [];

  // Fields that station users can edit
  const stationEditableFields = [
    'display_name', 'status',
    // Camera specifications (all new camera fields from migration 0025 & 0026)
    'camera_brand', 'camera_model', 'camera_resolution', 'camera_serial_number',
    'camera_aperture', 'camera_exposure_time', 'camera_focal_length_mm',
    'camera_iso', 'camera_lens', 'camera_mega_pixels', 'camera_white_balance',
    // Position & orientation (including new degrees_from_nadir fields)
    'latitude', 'longitude', 'epsg_code', 'instrument_height_m', 'viewing_direction',
    'azimuth_degrees', 'degrees_from_nadir', 'instrument_degrees_from_nadir',
    // Timeline & classification (including new deployment date field)
    'instrument_type', 'ecosystem_code', 'deployment_date', 'instrument_deployment_date',
    'first_measurement_year', 'last_measurement_year', 'measurement_status',
    // Calibration and maintenance (new fields from migration 0026)
    'calibration_date', 'calibration_notes', 'manufacturer_warranty_expires',
    'power_source', 'data_transmission',
    // Phenocam processing (new fields from migration 0026)
    'image_processing_enabled', 'image_archive_path', 'last_image_timestamp',
    'image_quality_score',
    // Notes & context
    'description', 'installation_notes', 'maintenance_notes'
  ];

  // Fields that only admin can edit
  const adminOnlyFields = ['legacy_acronym', 'normalized_name', 'instrument_number'];

  // Add station editable fields
  stationEditableFields.forEach(field => {
    if (instrumentData[field] !== undefined) {
      allowedFields.push(`${field} = ?`);
      values.push(instrumentData[field]);
    }
  });

  // Add admin-only fields if user is admin
  if (user.role === 'admin') {
    adminOnlyFields.forEach(field => {
      if (instrumentData[field] !== undefined) {
        allowedFields.push(`${field} = ?`);
        values.push(instrumentData[field]);
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
    UPDATE instruments
    SET ${allowedFields.join(', ')}
    WHERE id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updateInstrument');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update instrument', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Instrument updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Create new instrument
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Create response
 */
async function createInstrument(user, request, env) {
  // Check if user has write permissions for instruments
  const permission = checkUserPermissions(user, 'instruments', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const instrumentData = await request.json();

  // Required fields validation
  const requiredFields = ['display_name', 'platform_id', 'instrument_type'];
  for (const field of requiredFields) {
    if (!instrumentData[field]) {
      return createErrorResponse(`Missing required field: ${field}`, 400);
    }
  }

  // Validate camera specifications if provided
  const cameraValidation = await validateCameraSpecifications(instrumentData, env);
  if (!cameraValidation.isValid) {
    return createErrorResponse(`Camera validation failed: ${cameraValidation.errors.join(', ')}`, 400);
  }

  // Verify platform exists and get platform/station info
  const platformQuery = `
    SELECT p.id, p.normalized_name as platform_normalized_name,
           s.id as station_id, s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `;
  const platform = await executeQueryFirst(env, platformQuery, [instrumentData.platform_id], 'createInstrument-platform-verify');

  if (!platform) {
    return createErrorResponse('Platform not found', 404);
  }

  // For station users, ensure they can only create instruments for their own station's platforms
  if (user.role === 'station') {
    // Type-safe comparisons with multiple fallback checks
    const userStationId = parseInt(user.station_id, 10);
    const platformStationId = parseInt(platform.station_id, 10);

    console.log('🔐 Station Access Validation:', {
      user_role: user.role,
      user_station_id: user.station_id,
      user_station_id_type: typeof user.station_id,
      user_station_id_parsed: userStationId,
      user_station_normalized_name: user.station_normalized_name,
      platform_station_id: platform.station_id,
      platform_station_id_type: typeof platform.station_id,
      platform_station_id_parsed: platformStationId,
      platform_station_normalized_name: platform.station_normalized_name,
      integer_match: userStationId === platformStationId,
      name_match: user.station_normalized_name === platform.station_normalized_name
    });

    const userCanAccessPlatform =
      // Integer ID comparison (type-safe)
      (userStationId === platformStationId) ||
      // Normalized name comparison (case-insensitive)
      (user.station_normalized_name?.toLowerCase() === platform.station_normalized_name?.toLowerCase());

    if (!userCanAccessPlatform) {
      console.log(`❌ Station access DENIED`);
      return createForbiddenResponse();
    }

    console.log(`✅ Station access GRANTED`);
  }

  // Generate normalized name and instrument number if not provided (admin can override)
  let normalizedName = instrumentData.normalized_name;
  let instrumentNumber = instrumentData.instrument_number;

  if (!normalizedName || user.role !== 'admin') {
    // Auto-generate instrument number for this platform
    const nextInstrumentNumber = await getNextInstrumentNumber(platform.id, env);
    instrumentNumber = nextInstrumentNumber;

    // Generate normalized name: {PLATFORM}_{INSTRUMENT_TYPE}_{NUMBER}
    const instrumentTypeCode = instrumentData.instrument_type.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
    normalizedName = `${platform.platform_normalized_name}_${instrumentTypeCode}_${instrumentNumber}`;
  }

  // Check for duplicate normalized names
  const duplicateCheck = `SELECT id FROM instruments WHERE normalized_name = ?`;
  const duplicate = await executeQueryFirst(env, duplicateCheck, [normalizedName], 'createInstrument-duplicate-check');

  if (duplicate) {
    return createErrorResponse(`Instrument with normalized name '${normalizedName}' already exists`, 409);
  }

  // Prepare insert data
  const now = new Date().toISOString();
  const insertQuery = `
    INSERT INTO instruments (
      normalized_name, display_name, legacy_acronym, platform_id, instrument_type,
      ecosystem_code, instrument_number, status, deployment_date, instrument_deployment_date,
      latitude, longitude, epsg_code, viewing_direction, azimuth_degrees,
      degrees_from_nadir, instrument_degrees_from_nadir,
      camera_brand, camera_model, camera_resolution, camera_serial_number,
      camera_aperture, camera_exposure_time, camera_focal_length_mm,
      camera_iso, camera_lens, camera_mega_pixels, camera_white_balance,
      calibration_date, calibration_notes, manufacturer_warranty_expires,
      power_source, data_transmission,
      image_processing_enabled, image_archive_path, last_image_timestamp, image_quality_score,
      first_measurement_year, last_measurement_year, measurement_status,
      instrument_height_m, description, installation_notes, maintenance_notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    normalizedName,
    instrumentData.display_name,
    instrumentData.legacy_acronym || null,
    instrumentData.platform_id,
    instrumentData.instrument_type,
    instrumentData.ecosystem_code || null,
    instrumentNumber,
    instrumentData.status || 'Active',
    instrumentData.deployment_date || null,
    instrumentData.instrument_deployment_date || null,
    instrumentData.latitude || null,
    instrumentData.longitude || null,
    instrumentData.epsg_code || 'EPSG:4326',
    instrumentData.viewing_direction || null,
    instrumentData.azimuth_degrees || null,
    instrumentData.degrees_from_nadir || null,
    instrumentData.instrument_degrees_from_nadir || null,
    instrumentData.camera_brand || null,
    instrumentData.camera_model || null,
    instrumentData.camera_resolution || null,
    instrumentData.camera_serial_number || null,
    instrumentData.camera_aperture || null,
    instrumentData.camera_exposure_time || null,
    instrumentData.camera_focal_length_mm || null,
    instrumentData.camera_iso || null,
    instrumentData.camera_lens || null,
    instrumentData.camera_mega_pixels || null,
    instrumentData.camera_white_balance || null,
    instrumentData.calibration_date || null,
    instrumentData.calibration_notes || null,
    instrumentData.manufacturer_warranty_expires || null,
    instrumentData.power_source || 'Solar+Battery',
    instrumentData.data_transmission || 'LoRaWAN',
    instrumentData.image_processing_enabled || false,
    instrumentData.image_archive_path || null,
    instrumentData.last_image_timestamp || null,
    instrumentData.image_quality_score || null,
    instrumentData.first_measurement_year || null,
    instrumentData.last_measurement_year || null,
    instrumentData.measurement_status || 'Active',
    instrumentData.instrument_height_m || null,
    instrumentData.description || null,
    instrumentData.installation_notes || null,
    instrumentData.maintenance_notes || null,
    now,
    now
  ];

  const result = await executeQueryRun(env, insertQuery, values, 'createInstrument');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create instrument', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Instrument created successfully',
    id: result.meta.last_row_id,
    normalized_name: normalizedName,
    instrument_number: instrumentNumber
  });
}

/**
 * Delete instrument
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Delete response
 */
async function deleteInstrument(id, user, env) {
  // Check if user has write permissions for instruments (station users can delete their own)
  const permission = checkUserPermissions(user, 'instruments', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // First verify instrument exists and get its station
  const checkQuery = `
    SELECT i.id, i.normalized_name, s.normalized_name as station_normalized_name, s.id as station_id
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  const existingInstrument = await executeQueryFirst(env, checkQuery, [id], 'deleteInstrument-check');

  if (!existingInstrument) {
    return createNotFoundResponse();
  }

  // Check if station user can access this specific instrument
  if (user.role === 'station' && user.station_normalized_name !== existingInstrument.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check for dependencies (ROIs)
  const roiCheck = `SELECT COUNT(*) as roi_count FROM instrument_rois WHERE instrument_id = ?`;
  const roiResult = await executeQueryFirst(env, roiCheck, [id], 'deleteInstrument-roi-check');

  if (roiResult && roiResult.roi_count > 0) {
    return createErrorResponse(`Cannot delete instrument: ${roiResult.roi_count} ROI(s) are associated with this instrument. Please delete ROIs first.`, 409);
  }

  // Delete the instrument
  const deleteQuery = `DELETE FROM instruments WHERE id = ?`;
  const result = await executeQueryRun(env, deleteQuery, [id], 'deleteInstrument');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete instrument', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Instrument deleted successfully',
    id: parseInt(id, 10),
    normalized_name: existingInstrument.normalized_name
  });
}

/**
 * Get next available instrument number for platform
 * @param {number} platformId - Platform ID
 * @param {Object} env - Environment variables and bindings
 * @returns {string} Next instrument number (01, 02, etc.)
 */
async function getNextInstrumentNumber(platformId, env) {
  const query = `
    SELECT instrument_number
    FROM instruments
    WHERE platform_id = ?
    ORDER BY instrument_number DESC
    LIMIT 1
  `;

  const result = await executeQueryFirst(env, query, [platformId], 'getNextInstrumentNumber');

  if (!result || !result.instrument_number) {
    return '01';
  }

  // Increment number
  const number = parseInt(result.instrument_number, 10) + 1;
  return number.toString().padStart(2, '0');
}