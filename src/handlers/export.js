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
        p.location_code as platform_location_code,
        p.ecosystem_code as platform_ecosystem_code,
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

    // Process the flat data into a hierarchical structure
    const exportData = {
      station: {},
      platforms: [],
      export_metadata: {
        exported_at: new Date().toISOString(),
        exported_by: user.username,
        export_format: 'hierarchical_json',
        sites_spectral_version: '5.0.0',
        total_platforms: 0,
        total_instruments: 0,
        total_rois: 0
      }
    };

    const platformsMap = new Map();
    const instrumentsMap = new Map();

    rows.forEach(row => {
      // Station data (same for all rows)
      if (!exportData.station.station_name) {
        exportData.station = {
          station_name: row.station_name,
          station_acronym: row.station_acronym,
          station_normalized_name: row.station_normalized_name,
          station_status: row.station_status,
          station_country: row.station_country,
          station_latitude: row.station_latitude,
          station_longitude: row.station_longitude,
          station_elevation: row.station_elevation,
          station_description: row.station_description
        };
      }

      // Platform data
      if (row.platform_id && !platformsMap.has(row.platform_id)) {
        const platform = {
          platform_id: row.platform_id,
          platform_normalized_name: row.platform_normalized_name,
          platform_name: row.platform_name,
          platform_location_code: row.platform_location_code,
          platform_ecosystem_code: row.platform_ecosystem_code,
          platform_mounting_structure: row.platform_mounting_structure,
          platform_height: row.platform_height,
          platform_status: row.platform_status,
          platform_latitude: row.platform_latitude,
          platform_longitude: row.platform_longitude,
          platform_deployment_date: row.platform_deployment_date,
          platform_description: row.platform_description,
          platform_operation_programs: row.platform_operation_programs,
          instruments: []
        };
        platformsMap.set(row.platform_id, platform);
        exportData.platforms.push(platform);
      }

      // Instrument data
      if (row.instrument_id && !instrumentsMap.has(row.instrument_id)) {
        const instrument = {
          instrument_id: row.instrument_id,
          instrument_normalized_name: row.instrument_normalized_name,
          instrument_name: row.instrument_name,
          instrument_legacy_acronym: row.instrument_legacy_acronym,
          instrument_type: row.instrument_type,
          instrument_ecosystem_code: row.instrument_ecosystem_code,
          instrument_number: row.instrument_number,
          instrument_status: row.instrument_status,
          instrument_deployment_date: row.instrument_deployment_date,
          instrument_latitude: row.instrument_latitude,
          instrument_longitude: row.instrument_longitude,
          instrument_viewing_direction: row.instrument_viewing_direction,
          instrument_azimuth: row.instrument_azimuth,
          instrument_nadir_degrees: row.instrument_nadir_degrees,
          instrument_camera_brand: row.instrument_camera_brand,
          instrument_camera_model: row.instrument_camera_model,
          instrument_camera_resolution: row.instrument_camera_resolution,
          instrument_camera_serial: row.instrument_camera_serial,
          instrument_first_year: row.instrument_first_year,
          instrument_last_year: row.instrument_last_year,
          instrument_measurement_status: row.instrument_measurement_status,
          instrument_height: row.instrument_height,
          instrument_description: row.instrument_description,
          instrument_installation_notes: row.instrument_installation_notes,
          instrument_maintenance_notes: row.instrument_maintenance_notes,
          rois: []
        };
        instrumentsMap.set(row.instrument_id, instrument);

        // Add instrument to its platform
        const platform = platformsMap.get(row.platform_id);
        if (platform) {
          platform.instruments.push(instrument);
        }
      }

      // ROI data
      if (row.roi_id) {
        const roi = {
          roi_id: row.roi_id,
          roi_name: row.roi_name,
          roi_description: row.roi_description,
          roi_alpha: row.roi_alpha,
          roi_auto_generated: row.roi_auto_generated,
          roi_color_r: row.roi_color_r,
          roi_color_g: row.roi_color_g,
          roi_color_b: row.roi_color_b,
          roi_thickness: row.roi_thickness,
          roi_generated_date: row.roi_generated_date,
          roi_source_image: row.roi_source_image,
          roi_points: null
        };

        // Parse points JSON if it exists
        if (row.roi_points_json) {
          try {
            roi.roi_points = JSON.parse(row.roi_points_json);
          } catch (e) {
            console.warn('Failed to parse ROI points JSON:', e);
            roi.roi_points = [];
          }
        }

        // Add ROI to its instrument
        const instrument = instrumentsMap.get(row.instrument_id);
        if (instrument) {
          instrument.rois.push(roi);
        }
      }
    });

    // Update metadata counts
    exportData.export_metadata.total_platforms = exportData.platforms.length;
    exportData.export_metadata.total_instruments = Array.from(instrumentsMap.keys()).length;
    exportData.export_metadata.total_rois = rows.filter(row => row.roi_id).length;

    // Generate filename
    const filename = `${station.acronym || station.normalized_name}_export_${new Date().toISOString().split('T')[0]}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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