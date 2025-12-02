// Instruments Handler - Write Operations
// POST, PUT, DELETE operations for instruments

import { checkUserPermissions } from '../../auth/permissions.js';
import { executeQueryFirst, executeQueryRun } from '../../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse
} from '../../utils/responses.js';
import { validateCameraSpecifications } from '../../utils/camera-validation.js';
import {
  sanitizeRequestBody,
  sanitizeString,
  sanitizeCoordinate,
  sanitizeFloat,
  sanitizeInteger,
  sanitizeEnum,
  sanitizeDate,
  INSTRUMENT_SCHEMA
} from '../../utils/validation.js';
import {
  getInstrumentTypeCode,
  extractBrandAcronym,
  getNextInstrumentNumber,
  roundCoordinate
} from './utils.js';

/**
 * Create new instrument
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Create response
 */
export async function createInstrument(user, request, env) {
  // Check if user has write permissions for instruments
  const permission = checkUserPermissions(user, 'instruments', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // SECURITY: Parse and sanitize request body
  let rawData;
  try {
    rawData = await request.json();
  } catch (e) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  // Sanitize core fields using schema
  const instrumentData = sanitizeRequestBody(rawData, INSTRUMENT_SCHEMA);

  // Preserve additional fields that aren't in the core schema but need sanitization
  const additionalFields = [
    'camera_brand', 'camera_model', 'camera_resolution', 'camera_serial_number',
    'camera_aperture', 'camera_exposure_time', 'camera_lens', 'camera_white_balance',
    'sensor_brand', 'sensor_model', 'number_of_channels', 'epsg_code',
    'image_archive_path', 'calibration_notes', 'power_source', 'data_transmission'
  ];

  additionalFields.forEach(field => {
    if (rawData[field] !== undefined) {
      instrumentData[field] = sanitizeString(rawData[field], { maxLength: 500 });
    }
  });

  // Preserve numeric fields with proper sanitization
  if (rawData.camera_focal_length_mm !== undefined) {
    instrumentData.camera_focal_length_mm = sanitizeFloat(rawData.camera_focal_length_mm, { min: 0, max: 2000 });
  }
  if (rawData.camera_iso !== undefined) {
    instrumentData.camera_iso = sanitizeInteger(rawData.camera_iso, { min: 0, max: 1000000 });
  }
  if (rawData.camera_mega_pixels !== undefined) {
    instrumentData.camera_mega_pixels = sanitizeFloat(rawData.camera_mega_pixels, { min: 0, max: 500 });
  }
  if (rawData.first_measurement_year !== undefined) {
    instrumentData.first_measurement_year = sanitizeInteger(rawData.first_measurement_year, { min: 1900, max: 2100 });
  }
  if (rawData.last_measurement_year !== undefined) {
    instrumentData.last_measurement_year = sanitizeInteger(rawData.last_measurement_year, { min: 1900, max: 2100 });
  }

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
    const userStationId = parseInt(user.station_id, 10);
    const platformStationId = parseInt(platform.station_id, 10);

    const userCanAccessPlatform =
      (userStationId === platformStationId) ||
      (user.station_normalized_name?.toLowerCase() === platform.station_normalized_name?.toLowerCase());

    if (!userCanAccessPlatform) {
      return createForbiddenResponse();
    }
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
 * Update instrument data
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Update response
 */
export async function updateInstrument(id, user, request, env) {
  // Check if user has write permissions for instruments
  const permission = checkUserPermissions(user, 'instruments', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // SECURITY: Parse request body with error handling
  let rawData;
  try {
    rawData = await request.json();
  } catch (e) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  // Sanitize core fields using schema
  const instrumentData = sanitizeRequestBody(rawData, INSTRUMENT_SCHEMA);

  // Preserve additional camera fields that aren't in the core schema
  const additionalFields = [
    'camera_brand', 'camera_model', 'camera_resolution', 'camera_serial_number',
    'camera_aperture', 'camera_exposure_time', 'camera_lens', 'camera_white_balance',
    'sensor_brand', 'sensor_model', 'number_of_channels', 'epsg_code',
    'image_archive_path', 'calibration_notes', 'power_source', 'data_transmission'
  ];

  additionalFields.forEach(field => {
    if (rawData[field] !== undefined) {
      instrumentData[field] = sanitizeString(rawData[field], { maxLength: 500 });
    }
  });

  // Preserve numeric fields with proper sanitization
  if (rawData.camera_focal_length_mm !== undefined) {
    instrumentData.camera_focal_length_mm = sanitizeFloat(rawData.camera_focal_length_mm, { min: 0, max: 2000 });
  }
  if (rawData.camera_iso !== undefined) {
    instrumentData.camera_iso = sanitizeInteger(rawData.camera_iso, { min: 0, max: 1000000 });
  }
  if (rawData.camera_mega_pixels !== undefined) {
    instrumentData.camera_mega_pixels = sanitizeFloat(rawData.camera_mega_pixels, { min: 0, max: 500 });
  }
  if (rawData.first_measurement_year !== undefined) {
    instrumentData.first_measurement_year = sanitizeInteger(rawData.first_measurement_year, { min: 1900, max: 2100 });
  }
  if (rawData.last_measurement_year !== undefined) {
    instrumentData.last_measurement_year = sanitizeInteger(rawData.last_measurement_year, { min: 1900, max: 2100 });
  }
  // Boolean field
  if (rawData.image_processing_enabled !== undefined) {
    instrumentData.image_processing_enabled = rawData.image_processing_enabled === true || rawData.image_processing_enabled === 'true';
  }

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
    'display_name', 'status', 'legacy_acronym',
    // Camera specifications
    'camera_brand', 'camera_model', 'camera_resolution', 'camera_serial_number',
    'camera_aperture', 'camera_exposure_time', 'camera_focal_length_mm',
    'camera_iso', 'camera_lens', 'camera_mega_pixels', 'camera_white_balance',
    // Position & orientation
    'latitude', 'longitude', 'epsg_code', 'instrument_height_m', 'viewing_direction',
    'azimuth_degrees', 'degrees_from_nadir', 'instrument_degrees_from_nadir',
    // Timeline & classification
    'instrument_type', 'ecosystem_code', 'deployment_date', 'instrument_deployment_date',
    'first_measurement_year', 'last_measurement_year', 'measurement_status',
    // Calibration and maintenance
    'calibration_date', 'calibration_notes', 'manufacturer_warranty_expires',
    'power_source', 'data_transmission',
    // Phenocam processing
    'image_processing_enabled', 'image_archive_path', 'last_image_timestamp',
    'image_quality_score',
    // Notes & context
    'description', 'installation_notes', 'maintenance_notes'
  ];

  // Fields that only admin can edit
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
 * Delete instrument
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Delete response
 */
export async function deleteInstrument(id, user, env) {
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
