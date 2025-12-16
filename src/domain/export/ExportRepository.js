/**
 * Export Repository Port (Interface)
 *
 * Defines the contract for export data access.
 * Infrastructure layer must implement this interface.
 *
 * Following Hexagonal Architecture (Ports & Adapters):
 * - This is a PORT (interface) in the domain layer
 * - Adapters (D1ExportRepository) implement this in infrastructure
 *
 * @module domain/export/ExportRepository
 */

/**
 * @typedef {Object} StationExportRow
 * @property {string} station_name - Station display name
 * @property {string} station_acronym - Station acronym
 * @property {string} station_normalized_name - Normalized station name
 * @property {string} station_status - Station status
 * @property {string} station_country - Country
 * @property {number} station_latitude - Latitude
 * @property {number} station_longitude - Longitude
 * @property {number} station_elevation - Elevation in meters
 * @property {string} station_description - Description
 * @property {number} platform_id - Platform ID
 * @property {string} platform_normalized_name - Platform normalized name
 * @property {string} platform_name - Platform display name
 * @property {string} platform_location_code - Platform location code
 * @property {string} platform_mounting_structure - Mounting structure
 * @property {number} platform_height - Platform height
 * @property {string} platform_status - Platform status
 * @property {number} platform_latitude - Platform latitude
 * @property {number} platform_longitude - Platform longitude
 * @property {string} platform_deployment_date - Deployment date
 * @property {string} platform_description - Description
 * @property {string} platform_operation_programs - Operation programs
 * @property {number} instrument_id - Instrument ID
 * @property {string} instrument_normalized_name - Instrument normalized name
 * @property {string} instrument_name - Instrument display name
 * @property {string} instrument_legacy_acronym - Legacy acronym
 * @property {string} instrument_type - Instrument type
 * @property {string} instrument_ecosystem_code - Ecosystem code
 * @property {number} instrument_number - Instrument number
 * @property {string} instrument_status - Instrument status
 * @property {string} instrument_deployment_date - Deployment date
 * @property {number} instrument_latitude - Latitude
 * @property {number} instrument_longitude - Longitude
 * @property {string} instrument_viewing_direction - Viewing direction
 * @property {number} instrument_azimuth - Azimuth degrees
 * @property {number} instrument_nadir_degrees - Degrees from nadir
 * @property {string} instrument_camera_brand - Camera brand
 * @property {string} instrument_camera_model - Camera model
 * @property {string} instrument_camera_resolution - Camera resolution
 * @property {string} instrument_camera_serial - Camera serial number
 * @property {number} instrument_first_year - First measurement year
 * @property {number} instrument_last_year - Last measurement year
 * @property {string} instrument_measurement_status - Measurement status
 * @property {number} instrument_height - Instrument height
 * @property {string} instrument_description - Description
 * @property {string} instrument_installation_notes - Installation notes
 * @property {string} instrument_maintenance_notes - Maintenance notes
 * @property {number} roi_id - ROI ID
 * @property {string} roi_name - ROI name
 * @property {string} roi_description - ROI description
 * @property {number} roi_alpha - Alpha value
 * @property {boolean} roi_auto_generated - Auto-generated flag
 * @property {number} roi_color_r - Red color value
 * @property {number} roi_color_g - Green color value
 * @property {number} roi_color_b - Blue color value
 * @property {number} roi_thickness - Line thickness
 * @property {string} roi_generated_date - Generation date
 * @property {string} roi_source_image - Source image path
 * @property {string} roi_points_json - Points as JSON
 */

export class ExportRepository {
  /**
   * Get station by identifier (id, normalized_name, or acronym)
   * @param {string} identifier - Station identifier
   * @returns {Promise<Object|null>} Station data or null if not found
   */
  async getStationByIdentifier(identifier) {
    throw new Error('ExportRepository.getStationByIdentifier() must be implemented');
  }

  /**
   * Get comprehensive station export data
   * @param {string} identifier - Station identifier
   * @returns {Promise<StationExportRow[]>} Export rows
   */
  async getStationExportData(identifier) {
    throw new Error('ExportRepository.getStationExportData() must be implemented');
  }
}
