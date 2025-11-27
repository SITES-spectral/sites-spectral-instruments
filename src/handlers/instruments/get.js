// Instruments Handler - Read Operations
// GET operations for instruments

import { executeQuery, executeQueryFirst } from '../../utils/database.js';
import {
  createSuccessResponse,
  createNotFoundResponse
} from '../../utils/responses.js';

/**
 * Get specific instrument by ID
 * @param {string} identifier - Instrument ID, normalized_name, or legacy_acronym
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument data response
 */
export async function getInstrumentById(identifier, user, env) {
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
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           COUNT(r.id) as roi_count
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
export async function getInstrumentsList(user, request, env) {
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
