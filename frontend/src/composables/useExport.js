/**
 * Export Composable
 *
 * Provides data export functionality for stations, platforms, instruments, and ROIs.
 * Supports CSV and JSON formats.
 *
 * @module composables/useExport
 */

import { ref } from 'vue';
import { api } from '@services/api';

/**
 * Export data types
 */
export const EXPORT_TYPES = {
  stations: {
    key: 'stations',
    name: 'Stations',
    description: 'All station information',
    adminOnly: false
  },
  platforms: {
    key: 'platforms',
    name: 'Platforms',
    description: 'Platform configurations and metadata',
    adminOnly: false
  },
  instruments: {
    key: 'instruments',
    name: 'Instruments',
    description: 'Instrument specifications and status',
    adminOnly: false
  },
  rois: {
    key: 'rois',
    name: 'ROIs',
    description: 'Region of Interest definitions',
    adminOnly: false
  },
  full: {
    key: 'full',
    name: 'Full Export',
    description: 'Complete data export (all entities)',
    adminOnly: true
  }
};

/**
 * Export formats
 */
export const EXPORT_FORMATS = {
  csv: {
    key: 'csv',
    name: 'CSV',
    mimeType: 'text/csv',
    extension: '.csv'
  },
  json: {
    key: 'json',
    name: 'JSON',
    mimeType: 'application/json',
    extension: '.json'
  }
};

/**
 * Use Export composable
 * @returns {Object} Export methods and state
 */
export function useExport() {
  const loading = ref(false);
  const error = ref(null);

  /**
   * Generate filename for export
   * @param {string} type - Export type
   * @param {string} format - Export format
   * @param {string} [scope] - Optional scope (e.g., station acronym)
   * @returns {string} Filename
   */
  function generateFilename(type, format, scope = null) {
    const date = new Date().toISOString().split('T')[0];
    const scopePart = scope ? `_${scope}` : '';
    const extension = EXPORT_FORMATS[format]?.extension || '.txt';
    return `sites_spectral${scopePart}_${type}_${date}${extension}`;
  }

  /**
   * Convert data to CSV format
   * @param {Array} data - Array of objects
   * @param {Array} [columns] - Optional column order
   * @returns {string} CSV content
   */
  function toCSV(data, columns = null) {
    if (!data || data.length === 0) {
      return '';
    }

    // Get columns from first item if not provided
    const cols = columns || Object.keys(data[0]);

    // Header row
    let csv = cols.join(',') + '\n';

    // Data rows
    data.forEach(item => {
      const row = cols.map(col => {
        const value = item[col];
        if (value === null || value === undefined) {
          return '';
        }
        const strValue = String(value);
        // Escape if contains comma, quote, or newline
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return '"' + strValue.replace(/"/g, '""') + '"';
        }
        return strValue;
      });
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Convert data to JSON format
   * @param {any} data - Data to convert
   * @returns {string} JSON content
   */
  function toJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Trigger file download
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export stations data
   * @param {Object} options - Export options
   * @returns {Promise<boolean>} Success status
   */
  async function exportStations(options = {}) {
    const { format = 'csv', stationId = null } = options;
    loading.value = true;
    error.value = null;

    try {
      const endpoint = stationId ? `/stations/${stationId}` : '/stations';
      const response = await api.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch stations');
      }

      const data = stationId ? [response.data] : (response.data || []);
      const scope = stationId ? data[0]?.acronym : 'all';

      // Format data
      const content = format === 'json'
        ? toJSON(data)
        : toCSV(data.map(s => ({
            id: s.id,
            acronym: s.acronym,
            display_name: s.display_name,
            normalized_name: s.normalized_name,
            status: s.status,
            country: s.country,
            latitude: s.latitude,
            longitude: s.longitude,
            elevation_m: s.elevation_m,
            description: s.description,
            platform_count: s.platform_count,
            instrument_count: s.instrument_count,
            created_at: s.created_at,
            updated_at: s.updated_at
          })));

      const filename = generateFilename('stations', format, scope);
      const mimeType = EXPORT_FORMATS[format].mimeType;

      downloadFile(content, filename, mimeType);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Export platforms data
   * @param {Object} options - Export options
   * @returns {Promise<boolean>} Success status
   */
  async function exportPlatforms(options = {}) {
    const { format = 'csv', stationId = null, stationAcronym = null } = options;
    loading.value = true;
    error.value = null;

    try {
      let endpoint = '/platforms';
      if (stationId) {
        endpoint = `/stations/${stationId}/platforms`;
      }

      const response = await api.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch platforms');
      }

      const data = response.data || [];
      const scope = stationAcronym || (stationId ? 'station' : 'all');

      // Format data
      const content = format === 'json'
        ? toJSON(data)
        : toCSV(data.map(p => ({
            id: p.id,
            normalized_name: p.normalized_name,
            display_name: p.display_name,
            platform_type: p.platform_type,
            ecosystem_code: p.ecosystem_code,
            mount_type_code: p.mount_type_code || p.location_code,
            status: p.status,
            latitude: p.latitude,
            longitude: p.longitude,
            platform_height_m: p.platform_height_m,
            station_id: p.station_id,
            station_acronym: p.station_acronym,
            instrument_count: p.instrument_count,
            deployment_date: p.deployment_date,
            description: p.description,
            created_at: p.created_at,
            updated_at: p.updated_at
          })));

      const filename = generateFilename('platforms', format, scope);
      const mimeType = EXPORT_FORMATS[format].mimeType;

      downloadFile(content, filename, mimeType);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Export instruments data
   * @param {Object} options - Export options
   * @returns {Promise<boolean>} Success status
   */
  async function exportInstruments(options = {}) {
    const { format = 'csv', platformId = null, stationId = null, stationAcronym = null } = options;
    loading.value = true;
    error.value = null;

    try {
      let endpoint = '/instruments';
      if (platformId) {
        endpoint = `/platforms/${platformId}/instruments`;
      } else if (stationId) {
        endpoint = `/stations/${stationId}/instruments`;
      }

      const response = await api.get(endpoint);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch instruments');
      }

      const data = response.data || [];
      const scope = stationAcronym || (platformId ? 'platform' : stationId ? 'station' : 'all');

      // Format data - flatten specifications
      const flatData = data.map(i => {
        const specs = typeof i.specifications === 'string'
          ? JSON.parse(i.specifications || '{}')
          : (i.specifications || {});

        return {
          id: i.id,
          normalized_name: i.normalized_name,
          display_name: i.display_name,
          instrument_type: i.instrument_type,
          status: i.status,
          measurement_status: i.measurement_status,
          platform_id: i.platform_id,
          platform_name: i.platform_name,
          station_acronym: i.station_acronym,
          deployment_date: i.deployment_date,
          calibration_date: i.calibration_date,
          roi_count: i.roi_count,
          description: i.description,
          ...specs,
          created_at: i.created_at,
          updated_at: i.updated_at
        };
      });

      const content = format === 'json'
        ? toJSON(data)  // Keep full structure for JSON
        : toCSV(flatData);

      const filename = generateFilename('instruments', format, scope);
      const mimeType = EXPORT_FORMATS[format].mimeType;

      downloadFile(content, filename, mimeType);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Export ROIs data
   * @param {Object} options - Export options
   * @returns {Promise<boolean>} Success status
   */
  async function exportROIs(options = {}) {
    const { format = 'csv', instrumentId = null, stationAcronym = null } = options;
    loading.value = true;
    error.value = null;

    try {
      let params = {};
      if (instrumentId) {
        params.instrument = instrumentId;
      }
      if (stationAcronym) {
        params.station = stationAcronym;
      }

      const response = await api.get('/rois', params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch ROIs');
      }

      const data = response.data?.rois || [];
      const scope = stationAcronym || (instrumentId ? 'instrument' : 'all');

      // Format data
      const content = format === 'json'
        ? toJSON(data)
        : toCSV(data.map(r => ({
            id: r.id,
            roi_name: r.roi_name,
            instrument_id: r.instrument_id,
            instrument_name: r.instrument_name,
            station_acronym: r.station_acronym,
            description: r.description,
            color_r: r.color_r,
            color_g: r.color_g,
            color_b: r.color_b,
            alpha: r.alpha,
            thickness: r.thickness,
            auto_generated: r.auto_generated,
            point_count: r.points?.length || 0,
            generated_date: r.generated_date,
            source_image: r.source_image,
            created_at: r.created_at
          })));

      const filename = generateFilename('rois', format, scope);
      const mimeType = EXPORT_FORMATS[format].mimeType;

      downloadFile(content, filename, mimeType);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Full export (all entities for a station or all stations)
   * @param {Object} options - Export options
   * @returns {Promise<boolean>} Success status
   */
  async function exportFull(options = {}) {
    const { format = 'json', stationAcronym = null } = options;
    loading.value = true;
    error.value = null;

    try {
      // Use the backend export endpoint for station export
      if (stationAcronym) {
        // Download CSV directly from backend
        const url = `/api/export/station/${stationAcronym}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = `${stationAcronym}_full_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }

      // For full export of all stations (admin only), fetch all data
      const [stationsRes, platformsRes, instrumentsRes, roisRes] = await Promise.all([
        api.get('/stations'),
        api.get('/platforms'),
        api.get('/instruments'),
        api.get('/rois')
      ]);

      const fullData = {
        export_date: new Date().toISOString(),
        version: '10.0.0-alpha.15',
        stations: stationsRes.data || [],
        platforms: platformsRes.data || [],
        instruments: instrumentsRes.data || [],
        rois: roisRes.data?.rois || []
      };

      const content = format === 'json'
        ? toJSON(fullData)
        : toCSV([
            { type: 'stations', count: fullData.stations.length },
            { type: 'platforms', count: fullData.platforms.length },
            { type: 'instruments', count: fullData.instruments.length },
            { type: 'rois', count: fullData.rois.length }
          ]);

      const filename = generateFilename('full', format, 'all');
      const mimeType = EXPORT_FORMATS[format].mimeType;

      downloadFile(content, filename, mimeType);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    loading,
    error,

    // Constants
    EXPORT_TYPES,
    EXPORT_FORMATS,

    // Methods
    exportStations,
    exportPlatforms,
    exportInstruments,
    exportROIs,
    exportFull,
    generateFilename,
    toCSV,
    toJSON,
    downloadFile
  };
}

export default useExport;
