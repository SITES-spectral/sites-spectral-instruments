/**
 * D1 Export Repository Adapter
 *
 * Cloudflare D1 implementation of ExportRepository port.
 *
 * Following Hexagonal Architecture:
 * - This is an ADAPTER implementing the domain port
 * - Contains all D1/SQL-specific code
 *
 * @module infrastructure/persistence/d1/D1ExportRepository
 */

import { ExportRepository } from '../../../domain/export/ExportRepository.js';

export class D1ExportRepository extends ExportRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database binding
   */
  constructor(db) {
    super();
    this.db = db;
  }

  /**
   * Get station by identifier (id, normalized_name, or acronym)
   * @param {string} identifier - Station identifier
   * @returns {Promise<Object|null>} Station data or null if not found
   */
  async getStationByIdentifier(identifier) {
    const result = await this.db.prepare(`
      SELECT id, normalized_name, display_name, acronym, status, country,
             latitude, longitude, elevation_m, description
      FROM stations
      WHERE id = ? OR normalized_name = ? OR acronym = ?
      LIMIT 1
    `).bind(identifier, identifier, identifier).first();

    return result || null;
  }

  /**
   * Get comprehensive station export data
   * @param {string} identifier - Station identifier
   * @returns {Promise<Array>} Export rows
   */
  async getStationExportData(identifier) {
    const result = await this.db.prepare(`
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
    `).bind(identifier, identifier, identifier).all();

    return result?.results || [];
  }
}
