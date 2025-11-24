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
 * @param {Array} pathSegments - Path segments from URL (e.g., ['instruments', '42', 'latest-image'])
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument response
 */
export async function handleInstruments(method, pathSegments, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all instrument operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  // Extract ID and sub-resource from path segments
  // pathSegments[0] = 'instruments'
  // pathSegments[1] = instrument ID (optional)
  // pathSegments[2] = sub-resource (e.g., 'latest-image', 'rois')
  const id = pathSegments[1];
  const subResource = pathSegments[2];

  try {
    switch (method) {
      case 'GET':
        // Handle sub-resources first
        if (id && subResource === 'latest-image') {
          return await getLatestImage(id, user, env);
        }
        if (id && subResource === 'rois') {
          return await getInstrumentROIs(id, user, env);
        }
        // Regular instrument requests
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
async function getInstrumentById(identifier, user, env) {
  // Support both numeric ID and normalized_name/legacy_acronym
  const numericId = parseInt(identifier, 10);
  const isNumeric = !isNaN(numericId) && String(numericId) === String(identifier);

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
  `;

  // Build WHERE clause based on identifier type
  let params;
  if (isNumeric) {
    query += ' WHERE i.id = ?';
    params = [numericId];
  } else {
    // Search by normalized_name or legacy_acronym
    query += ' WHERE (i.normalized_name = ? OR i.legacy_acronym = ?)';
    params = [identifier, identifier];
  }
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
  // Support both 'station' and 'station_id' query parameters
  const stationParam = url.searchParams.get('station') || url.searchParams.get('station_id');
  // Support both 'platform' and 'platform_id' query parameters
  const platformParam = url.searchParams.get('platform') || url.searchParams.get('platform_id');

  let query = `
    SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
           i.instrument_type, i.ecosystem_code, i.instrument_number, i.status,
           i.deployment_date, i.instrument_deployment_date, i.calibration_date,
           i.latitude, i.longitude, i.viewing_direction, i.azimuth_degrees,
           i.camera_brand, i.camera_model, i.camera_resolution, i.camera_serial_number,
           i.instrument_height_m, i.degrees_from_nadir, i.description,
           i.created_at,
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

  // Filter by specific station if requested (supports ID, acronym, or normalized name)
  if (stationParam) {
    const numericStationId = parseInt(stationParam, 10);
    if (!isNaN(numericStationId) && String(numericStationId) === String(stationParam)) {
      // Numeric ID provided
      whereConditions.push('s.id = ?');
      params.push(numericStationId);
    } else {
      // String identifier (acronym or normalized name)
      whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
      params.push(stationParam, stationParam);
    }
  }

  // Filter by specific platform if requested (supports ID or normalized name)
  if (platformParam) {
    const numericPlatformId = parseInt(platformParam, 10);
    if (!isNaN(numericPlatformId) && String(numericPlatformId) === String(platformParam)) {
      // Numeric ID provided
      whereConditions.push('p.id = ?');
      params.push(numericPlatformId);
    } else {
      // String identifier (normalized name)
      whereConditions.push('p.normalized_name = ?');
      params.push(platformParam);
    }
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
    'display_name', 'status', 'legacy_acronym',  // Added legacy_acronym for station users
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

  // Fields that only admin can edit (legacy_acronym moved to station-editable)
  const adminOnlyFields = ['normalized_name', 'instrument_number'];

  // Add station editable fields with proper data type handling
  stationEditableFields.forEach(field => {
    if (instrumentData[field] !== undefined) {
      let value = instrumentData[field];

      // Apply coordinate rounding to latitude and longitude
      if (field === 'latitude' || field === 'longitude') {
        value = roundCoordinate(value);
      }
      // Ensure numeric fields are properly parsed
      else if (['instrument_height_m', 'azimuth_degrees', 'degrees_from_nadir',
                 'instrument_degrees_from_nadir', 'camera_focal_length_mm'].includes(field)) {
        value = value ? parseFloat(value) : null;
      }
      // Ensure integer fields are properly parsed
      else if (['first_measurement_year', 'last_measurement_year', 'camera_iso'].includes(field)) {
        value = value ? parseInt(value, 10) : null;
      }
      // Ensure boolean fields are properly parsed
      else if (field === 'image_processing_enabled') {
        value = Boolean(value);
      }

      allowedFields.push(`${field} = ?`);
      values.push(value);
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

    // Generate instrument type code using SITES Spectral specific mapping
    const instrumentTypeCode = getInstrumentTypeCode(instrumentData.instrument_type);

    // Build full instrument number with type code prefix (e.g., "PHE01", "MS02", "NDVI01")
    instrumentNumber = `${instrumentTypeCode}${nextInstrumentNumber}`;

    // Generate normalized name
    // For MS instruments: {PLATFORM}_{BRAND}_MS{NN}_NB{number_of_channels}
    // For other instruments: {PLATFORM}_{TYPE}{NN}
    if (instrumentTypeCode === 'MS' && instrumentData.sensor_brand) {
      const brandAcronym = extractBrandAcronym(instrumentData.sensor_brand, instrumentData.sensor_model);
      const channelsSuffix = instrumentData.number_of_channels ? `_NB${String(instrumentData.number_of_channels).padStart(2, '0')}` : '';
      normalizedName = `${platform.platform_normalized_name}_${brandAcronym}_MS${nextInstrumentNumber}${channelsSuffix}`;
    } else {
      normalizedName = `${platform.platform_normalized_name}_${instrumentTypeCode}${nextInstrumentNumber}`;
    }
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
 * Get instrument type code (acronym) for SITES Spectral instruments
 * Maps full instrument type names to standardized acronyms
 * @param {string} instrumentType - Full instrument type name
 * @returns {string} Instrument type code/acronym
 */
function getInstrumentTypeCode(instrumentType) {
  // SITES Spectral specific instrument type mappings
  const typeMapping = {
    // Phenocams
    'Phenocam': 'PHE',

    // Multispectral Sensors (Fixed Platform) - All use MS acronym
    'SKYE MultiSpectral Sensor (Uplooking)': 'MS',
    'SKYE MultiSpectral Sensor (Downlooking)': 'MS',
    'Decagon Sensor (Uplooking)': 'MS',
    'Decagon Sensor (Downlooking)': 'MS',
    'Apogee MS': 'MS',

    // PRI Sensors
    'PRI Sensor (2-band ~530nm/~570nm)': 'PRI',

    // NDVI Sensors
    'NDVI Sensor': 'NDVI',
    'Apogee NDVI': 'NDVI',

    // PAR Sensors
    'PAR Sensor': 'PAR',
    'Apogee PAR': 'PAR',

    // Legacy types (for backward compatibility)
    'Multispectral Sensor': 'MS',
    'Hyperspectral Sensor': 'HYP'
  };

  // Return mapped code if exists, otherwise generate from first 3 uppercase letters
  if (typeMapping[instrumentType]) {
    return typeMapping[instrumentType];
  }

  // Fallback: extract first 3 uppercase letters
  return instrumentType.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
}

/**
 * Extract brand acronym from sensor brand or model
 * Used for multispectral sensor naming convention
 * @param {string} sensorBrand - Sensor brand name
 * @param {string} sensorModel - Sensor model name (fallback)
 * @returns {string} Brand acronym (e.g., SKYE, APOGEE, DECAGON, LICOR, PP)
 */
function extractBrandAcronym(sensorBrand, sensorModel) {
  if (!sensorBrand && !sensorModel) {
    return 'MS'; // Fallback to generic MS
  }

  const brand = (sensorBrand || sensorModel || '').toUpperCase();

  // Known brand mappings
  const brandMappings = {
    'SKYE': 'SKYE',
    'APOGEE': 'APOGEE',
    'DECAGON': 'DECAGON',
    'METER': 'METER',
    'LICOR': 'LICOR',
    'LI-COR': 'LICOR',
    'PPSYSTEMS': 'PP',
    'PP SYSTEMS': 'PP',
    'PP': 'PP'
  };

  // Check for exact match
  if (brandMappings[brand]) {
    return brandMappings[brand];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(brandMappings)) {
    if (brand.includes(key)) {
      return value;
    }
  }

  // Fallback: use first word in uppercase
  const firstWord = brand.split(/\s+/)[0];
  return firstWord || 'MS';
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

  // Extract numeric suffix from instrument_number (e.g., "PHE01" -> "01", "MSP02" -> "02")
  const match = result.instrument_number.match(/(\d+)$/);
  if (!match) {
    // If no numeric suffix found, start from 01
    return '01';
  }

  // Increment number
  const number = parseInt(match[1], 10) + 1;
  return number.toString().padStart(2, '0');
}

/**
 * Get latest phenocam image metadata for an instrument
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Latest image metadata
 */
async function getLatestImage(id, user, env) {
  // Check if instrument exists and user has access
  const instrument = await getInstrumentForUser(id, user, env);
  if (!instrument) {
    return createNotFoundResponse();
  }

  // Query for latest image metadata from the instrument
  const query = `
    SELECT
      id,
      normalized_name,
      display_name,
      instrument_type,
      status,
      image_archive_path,
      last_image_timestamp,
      image_quality_score,
      image_processing_enabled
    FROM instruments
    WHERE id = ?
  `;

  const result = await executeQueryFirst(env, query, [id], 'getLatestImage');

  if (!result) {
    return createNotFoundResponse();
  }

  // Build response with image metadata
  const imageMetadata = {
    instrument_id: result.id,
    instrument_name: result.normalized_name,
    display_name: result.display_name,
    instrument_type: result.instrument_type,
    status: result.status,
    image_available: !!result.last_image_timestamp,
    last_image_timestamp: result.last_image_timestamp || null,
    image_quality_score: result.image_quality_score || null,
    image_archive_path: result.image_archive_path || null,
    image_processing_enabled: result.image_processing_enabled || false,
    // Placeholder for future image URL generation
    image_url: result.last_image_timestamp && result.image_archive_path
      ? `/api/images/${result.image_archive_path}`
      : null,
    thumbnail_url: result.last_image_timestamp && result.image_archive_path
      ? `/api/images/thumbnails/${result.image_archive_path}`
      : null
  };

  return createSuccessResponse(imageMetadata);
}

/**
 * Get all ROIs for a specific instrument
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument ROIs list
 */
async function getInstrumentROIs(id, user, env) {
  // Check if instrument exists and user has access
  const instrument = await getInstrumentForUser(id, user, env);
  if (!instrument) {
    return createNotFoundResponse();
  }

  // Query for all ROIs for this instrument
  const query = `
    SELECT
      id,
      instrument_id,
      roi_name,
      description,
      color_r,
      color_g,
      color_b,
      alpha,
      thickness,
      points_json,
      auto_generated,
      source_image,
      generated_date,
      roi_processing_enabled,
      created_at,
      updated_at
    FROM instrument_rois
    WHERE instrument_id = ?
    ORDER BY roi_name
  `;

  const rois = await executeQuery(env, query, [id], 'getInstrumentROIs');

  return createSuccessResponse(rois || []);
}

/**
 * Helper function to get instrument and verify user access
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Instrument if found and accessible, null otherwise
 */
async function getInstrumentForUser(id, user, env) {
  const query = `
    SELECT i.id, i.normalized_name, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  const instrument = await executeQueryFirst(env, query, [id], 'getInstrumentForUser');

  if (!instrument) {
    return null;
  }

  // Check permissions
  if (user.role === 'admin') {
    return instrument;
  }

  if (user.role === 'station' && user.station_normalized_name === instrument.station_normalized_name) {
    return instrument;
  }

  if (user.role === 'readonly') {
    return instrument;
  }

  return null; // No access
}