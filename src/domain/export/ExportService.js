/**
 * Export Service
 *
 * Business logic for data export functionality.
 * Handles CSV generation and access control.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles export business logic
 * - Dependency Inversion: Depends on ExportRepository abstraction
 *
 * @module domain/export/ExportService
 */

// Application version for export metadata
const APP_VERSION = '11.0.0-alpha.42';

export class ExportService {
  /**
   * @param {import('./ExportRepository.js').ExportRepository} exportRepository
   */
  constructor(exportRepository) {
    this.repository = exportRepository;
  }

  /**
   * Export station data to CSV format
   * @param {string} stationId - Station identifier
   * @param {Object} user - Authenticated user
   * @returns {Promise<{csv: string, filename: string, station: Object}|null>}
   */
  async exportStationToCSV(stationId, user) {
    // Get station to verify existence and check permissions
    const station = await this.repository.getStationByIdentifier(stationId);
    if (!station) {
      return null;
    }

    // Check access permission
    if (!this.canAccessStation(user, station)) {
      return { error: 'forbidden', station };
    }

    // Get comprehensive export data
    const rows = await this.repository.getStationExportData(stationId);

    if (rows.length === 0) {
      return null;
    }

    // Generate CSV content
    const csv = this.generateStationCSV(rows, station, user);

    // Generate filename
    const filename = `${station.acronym || station.normalized_name}_export_${new Date().toISOString().split('T')[0]}.csv`;

    return { csv, filename, station };
  }

  /**
   * Check if user can access a specific station
   * @param {Object} user - User object from token
   * @param {Object} station - Station data
   * @returns {boolean} True if user can access the station
   */
  canAccessStation(user, station) {
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

  /**
   * Generate CSV content from station data
   * @param {Array} rows - Database rows
   * @param {Object} station - Station data
   * @param {Object} user - User data
   * @returns {string} CSV content
   */
  generateStationCSV(rows, station, user) {
    // CSV headers with all available fields
    const headers = [
      // Station fields
      'station_name', 'station_acronym', 'station_normalized_name', 'station_status',
      'station_country', 'station_latitude', 'station_longitude', 'station_elevation', 'station_description',

      // Platform fields
      'platform_id', 'platform_normalized_name', 'platform_name', 'platform_location_code',
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

    // Add metadata header rows
    csvContent += `# Station Export Data for ${station.display_name || station.acronym}\n`;
    csvContent += `# Exported by: ${user.username}\n`;
    csvContent += `# Export Date: ${new Date().toISOString()}\n`;
    csvContent += `# SITES Spectral Version: ${APP_VERSION}\n`;
    csvContent += `# Total Records: ${rows.length}\n`;
    csvContent += '\n';

    // Process data rows with deduplication
    const processedRows = new Set();

    for (const row of rows) {
      // Create a unique key for deduplication
      const rowKey = `${row.platform_id || 'no-platform'}_${row.instrument_id || 'no-instrument'}_${row.roi_id || 'no-roi'}`;

      // Skip duplicates
      if (processedRows.has(rowKey)) {
        continue;
      }
      processedRows.add(rowKey);

      // Build the row data
      const rowData = [
        // Station data
        this.escapeCSVField(row.station_name || ''),
        this.escapeCSVField(row.station_acronym || ''),
        this.escapeCSVField(row.station_normalized_name || ''),
        this.escapeCSVField(row.station_status || ''),
        this.escapeCSVField(row.station_country || ''),
        row.station_latitude || '',
        row.station_longitude || '',
        row.station_elevation || '',
        this.escapeCSVField(row.station_description || ''),

        // Platform data
        row.platform_id || '',
        this.escapeCSVField(row.platform_normalized_name || ''),
        this.escapeCSVField(row.platform_name || ''),
        this.escapeCSVField(row.platform_location_code || ''),
        this.escapeCSVField(row.platform_mounting_structure || ''),
        row.platform_height || '',
        this.escapeCSVField(row.platform_status || ''),
        row.platform_latitude || '',
        row.platform_longitude || '',
        this.escapeCSVField(row.platform_deployment_date || ''),
        this.escapeCSVField(row.platform_description || ''),
        this.escapeCSVField(row.platform_operation_programs || ''),

        // Instrument data
        row.instrument_id || '',
        this.escapeCSVField(row.instrument_normalized_name || ''),
        this.escapeCSVField(row.instrument_name || ''),
        this.escapeCSVField(row.instrument_legacy_acronym || ''),
        this.escapeCSVField(row.instrument_type || ''),
        this.escapeCSVField(row.instrument_ecosystem_code || ''),
        row.instrument_number || '',
        this.escapeCSVField(row.instrument_status || ''),
        this.escapeCSVField(row.instrument_deployment_date || ''),
        row.instrument_latitude || '',
        row.instrument_longitude || '',
        this.escapeCSVField(row.instrument_viewing_direction || ''),
        row.instrument_azimuth || '',
        row.instrument_nadir_degrees || '',
        this.escapeCSVField(row.instrument_camera_brand || ''),
        this.escapeCSVField(row.instrument_camera_model || ''),
        this.escapeCSVField(row.instrument_camera_resolution || ''),
        this.escapeCSVField(row.instrument_camera_serial || ''),
        row.instrument_first_year || '',
        row.instrument_last_year || '',
        this.escapeCSVField(row.instrument_measurement_status || ''),
        row.instrument_height || '',
        this.escapeCSVField(row.instrument_description || ''),
        this.escapeCSVField(row.instrument_installation_notes || ''),
        this.escapeCSVField(row.instrument_maintenance_notes || ''),

        // ROI data
        row.roi_id || '',
        this.escapeCSVField(row.roi_name || ''),
        this.escapeCSVField(row.roi_description || ''),
        row.roi_alpha || '',
        row.roi_auto_generated || '',
        row.roi_color_r || '',
        row.roi_color_g || '',
        row.roi_color_b || '',
        row.roi_thickness || '',
        this.escapeCSVField(row.roi_generated_date || ''),
        this.escapeCSVField(row.roi_source_image || '')
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
  escapeCSVField(field) {
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
}
