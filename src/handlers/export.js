// Export Handler Module
// Data export functionality for stations, platforms, and instruments

import { requireAuthentication } from '../auth/permissions.js';
import { getStationData } from '../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../utils/responses.js';

/**
 * Handle export requests
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - Path segments after /api/export
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Export response
 */
export async function handleExport(method, pathSegments, request, env) {
  if (method !== 'GET') {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all export operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  const action = pathSegments[1];
  const stationId = pathSegments[2];

  try {
    switch (action) {
      case 'station':
        if (!stationId) {
          return createErrorResponse('Station ID required', 400);
        }
        return await handleStationExport(stationId, user, env);

      default:
        return createErrorResponse('Export type not found', 404);
    }
  } catch (error) {
    console.error('Export error:', error);
    return createErrorResponse(`Failed to export data: ${error.message}`, 500);
  }
}

/**
 * Export comprehensive station data including platforms and instruments
 * @param {string} stationId - Station identifier
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Station export response
 */
export async function handleStationExport(stationId, user, env) {
  try {
    // Get station data first to check permissions and get station name
    const station = await getStationData(stationId, env);
    if (!station) {
      return createNotFoundResponse();
    }

    // Check access permission
    if (!canAccessStation(user, station)) {
      return createForbiddenResponse();
    }

    // Query for complete station data with all platforms and instruments
    let query = `
      SELECT
        s.display_name as station_name,
        s.acronym as station_acronym,
        s.normalized_name as station_normalized_name,
        s.status as station_status,
        s.country as station_country,
        s.latitude as station_latitude,
        s.longitude as station_longitude,
        s.elevation_m as station_elevation,
        s.description as station_description,

        p.id as platform_id,
        p.normalized_name as platform_normalized_name,
        p.display_name as platform_name,
        p.mount_type_code as platform_mount_type_code,
        p.mounting_structure as platform_mounting_structure,
        p.platform_height_m as platform_height,
        p.status as platform_status,
        p.latitude as platform_latitude,
        p.longitude as platform_longitude,
        p.deployment_date as platform_deployment_date,
        p.description as platform_description,
        p.operation_programs as platform_operation_programs,

        i.id as instrument_id,
        i.normalized_name as instrument_normalized_name,
        i.display_name as instrument_name,
        i.legacy_acronym as instrument_legacy_acronym,
        i.instrument_type as instrument_type,
        i.ecosystem_code as instrument_ecosystem_code,
        i.instrument_number as instrument_number,
        i.status as instrument_status,
        i.deployment_date as instrument_deployment_date,
        i.latitude as instrument_latitude,
        i.longitude as instrument_longitude,
        i.viewing_direction as instrument_viewing_direction,
        i.azimuth_degrees as instrument_azimuth,
        i.degrees_from_nadir as instrument_nadir_degrees,
        i.camera_brand as instrument_camera_brand,
        i.camera_model as instrument_camera_model,
        i.camera_resolution as instrument_camera_resolution,
        i.camera_serial_number as instrument_camera_serial,
        i.first_measurement_year as instrument_first_year,
        i.last_measurement_year as instrument_last_year,
        i.measurement_status as instrument_measurement_status,
        i.instrument_height_m as instrument_height,
        i.description as instrument_description,
        i.installation_notes as instrument_installation_notes,
        i.maintenance_notes as instrument_maintenance_notes,

        r.id as roi_id,
        r.roi_name as roi_name,
        r.description as roi_description,
        r.alpha as roi_alpha,
        r.auto_generated as roi_auto_generated,
        r.color_r as roi_color_r,
        r.color_g as roi_color_g,
        r.color_b as roi_color_b,
        r.thickness as roi_thickness,
        r.generated_date as roi_generated_date,
        r.source_image as roi_source_image,
        r.points_json as roi_points_json

      FROM stations s
      LEFT JOIN platforms p ON s.id = p.station_id
      LEFT JOIN instruments i ON p.id = i.platform_id
      LEFT JOIN instrument_rois r ON i.id = r.instrument_id
      WHERE s.id = ? OR s.normalized_name = ? OR s.acronym = ?
      ORDER BY p.display_name, i.display_name, r.roi_name
    `;

    const result = await env.DB.prepare(query).bind(stationId, stationId, stationId).all();
    const rows = result?.results || [];

    if (rows.length === 0) {
      return createNotFoundResponse();
    }

    // Generate CSV content
    const csvContent = generateStationCSV(rows, station, user);

    // Generate filename
    const filename = `${station.acronym || station.normalized_name}_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Station export error:', error);
    return createErrorResponse(`Failed to export station data: ${error.message}`, 500);
  }
}

/**
 * Generate CSV content from station data
 * @param {Array} rows - Database rows containing station, platform, instrument, and ROI data
 * @param {Object} station - Station data
 * @param {Object} user - User data
 * @returns {string} CSV content
 */
function generateStationCSV(rows, station, user) {
  // CSV headers with all available fields
  const headers = [
    // Station fields
    'station_name', 'station_acronym', 'station_normalized_name', 'station_status',
    'station_country', 'station_latitude', 'station_longitude', 'station_elevation', 'station_description',

    // Platform fields
    'platform_id', 'platform_normalized_name', 'platform_name', 'platform_mount_type_code',
    'platform_mounting_structure', 'platform_height', 'platform_status',
    'platform_latitude', 'platform_longitude', 'platform_deployment_date', 'platform_description', 'platform_operation_programs',

    // Instrument fields
    'instrument_id', 'instrument_normalized_name', 'instrument_name', 'instrument_legacy_acronym',
    'instrument_type', 'instrument_ecosystem_code', 'instrument_number', 'instrument_status',
    'instrument_deployment_date', 'instrument_latitude', 'instrument_longitude', 'instrument_viewing_direction',
    'instrument_azimuth', 'instrument_nadir_degrees', 'instrument_camera_brand', 'instrument_camera_model',
    'instrument_camera_resolution', 'instrument_camera_serial', 'instrument_first_year', 'instrument_last_year',
    'instrument_measurement_status', 'instrument_height', 'instrument_description', 'instrument_installation_notes', 'instrument_maintenance_notes',

    // ROI fields
    'roi_id', 'roi_name', 'roi_description', 'roi_alpha', 'roi_auto_generated',
    'roi_color_r', 'roi_color_g', 'roi_color_b', 'roi_thickness', 'roi_generated_date', 'roi_source_image'
  ];

  // Start CSV with headers
  let csvContent = headers.join(',') + '\n';

  // Add metadata header row
  csvContent += `# Station Export Data for ${station.display_name || station.acronym}\n`;
  csvContent += `# Exported by: ${user.username}\n`;
  csvContent += `# Export Date: ${new Date().toISOString()}\n`;
  csvContent += `# SITES Spectral Version: 5.2.22\n`;
  csvContent += `# Total Records: ${rows.length}\n`;
  csvContent += '\n';

  // Process data rows
  const processedRows = new Set();

  for (const row of rows) {
    // Create a unique key for deduplication (platform + instrument + roi combination)
    const rowKey = `${row.platform_id || 'no-platform'}_${row.instrument_id || 'no-instrument'}_${row.roi_id || 'no-roi'}`;

    // Skip if we've already processed this exact combination
    if (processedRows.has(rowKey)) {
      continue;
    }
    processedRows.add(rowKey);

    // Build the row data
    const rowData = [
      // Station data
      escapeCSVField(row.station_name || ''),
      escapeCSVField(row.station_acronym || ''),
      escapeCSVField(row.station_normalized_name || ''),
      escapeCSVField(row.station_status || ''),
      escapeCSVField(row.station_country || ''),
      row.station_latitude || '',
      row.station_longitude || '',
      row.station_elevation || '',
      escapeCSVField(row.station_description || ''),

      // Platform data
      row.platform_id || '',
      escapeCSVField(row.platform_normalized_name || ''),
      escapeCSVField(row.platform_name || ''),
      escapeCSVField(row.platform_mount_type_code || ''),
      escapeCSVField(row.platform_mounting_structure || ''),
      row.platform_height || '',
      escapeCSVField(row.platform_status || ''),
      row.platform_latitude || '',
      row.platform_longitude || '',
      escapeCSVField(row.platform_deployment_date || ''),
      escapeCSVField(row.platform_description || ''),
      escapeCSVField(row.platform_operation_programs || ''),

      // Instrument data
      row.instrument_id || '',
      escapeCSVField(row.instrument_normalized_name || ''),
      escapeCSVField(row.instrument_name || ''),
      escapeCSVField(row.instrument_legacy_acronym || ''),
      escapeCSVField(row.instrument_type || ''),
      escapeCSVField(row.instrument_ecosystem_code || ''),
      row.instrument_number || '',
      escapeCSVField(row.instrument_status || ''),
      escapeCSVField(row.instrument_deployment_date || ''),
      row.instrument_latitude || '',
      row.instrument_longitude || '',
      escapeCSVField(row.instrument_viewing_direction || ''),
      row.instrument_azimuth || '',
      row.instrument_nadir_degrees || '',
      escapeCSVField(row.instrument_camera_brand || ''),
      escapeCSVField(row.instrument_camera_model || ''),
      escapeCSVField(row.instrument_camera_resolution || ''),
      escapeCSVField(row.instrument_camera_serial || ''),
      row.instrument_first_year || '',
      row.instrument_last_year || '',
      escapeCSVField(row.instrument_measurement_status || ''),
      row.instrument_height || '',
      escapeCSVField(row.instrument_description || ''),
      escapeCSVField(row.instrument_installation_notes || ''),
      escapeCSVField(row.instrument_maintenance_notes || ''),

      // ROI data
      row.roi_id || '',
      escapeCSVField(row.roi_name || ''),
      escapeCSVField(row.roi_description || ''),
      row.roi_alpha || '',
      row.roi_auto_generated || '',
      row.roi_color_r || '',
      row.roi_color_g || '',
      row.roi_color_b || '',
      row.roi_thickness || '',
      escapeCSVField(row.roi_generated_date || ''),
      escapeCSVField(row.roi_source_image || '')
    ];

    csvContent += rowData.join(',') + '\n';
  }

  return csvContent;
}

/**
 * Escape CSV field values to handle commas, quotes, and newlines
 * @param {string} field - Field value to escape
 * @returns {string} Escaped field value
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
    return '"' + stringField.replace(/"/g, '""') + '"';
  }

  return stringField;
}

/**
 * Check if user can access a specific station
 * @param {Object} user - User object from token
 * @param {Object} station - Station data
 * @returns {boolean} True if user can access the station
 */
function canAccessStation(user, station) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'station') {
    // Check both normalized name and acronym for station access
    return user.station_normalized_name === station.normalized_name ||
           user.station_acronym === station.acronym ||
           user.station_acronym === station.normalized_name ||
           user.station_id === station.id;
  }

  // readonly users can access all stations for viewing
  return user.role === 'readonly';
}