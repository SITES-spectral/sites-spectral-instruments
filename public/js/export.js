// SITES Spectral Instruments - Export Module
// Data export functionality for stations, platforms, instruments, and ROIs

class SitesExport {
    constructor() {
        this.supportedFormats = ['csv', 'json', 'xlsx'];
        this.exportQueue = [];
        this.isExporting = false;
    }

    // Export station data
    async exportStationData(stationId, format = 'csv', options = {}) {
        try {
            this.setExportingState(true);

            // Get comprehensive station data
            const stationData = await this.getStationExportData(stationId);

            // Format and download
            await this.processExport(stationData, format, `station_${stationData.acronym}`, options);

        } catch (error) {
            console.error('Export error:', error);
            showNotification(`Export failed: ${error.message}`, 'error');
        } finally {
            this.setExportingState(false);
        }
    }

    // Export platform data
    async exportPlatformData(platformId, format = 'csv', options = {}) {
        try {
            this.setExportingState(true);

            const platformData = await this.getPlatformExportData(platformId);
            await this.processExport(platformData, format, `platform_${platformData.normalized_name}`, options);

        } catch (error) {
            console.error('Platform export error:', error);
            showNotification(`Platform export failed: ${error.message}`, 'error');
        } finally {
            this.setExportingState(false);
        }
    }

    // Export instrument data
    async exportInstrumentData(instrumentId, format = 'csv', options = {}) {
        try {
            this.setExportingState(true);

            const instrumentData = await this.getInstrumentExportData(instrumentId);
            await this.processExport(instrumentData, format, `instrument_${instrumentData.name}`, options);

        } catch (error) {
            console.error('Instrument export error:', error);
            showNotification(`Instrument export failed: ${error.message}`, 'error');
        } finally {
            this.setExportingState(false);
        }
    }

    // Export all stations data
    async exportAllStations(format = 'csv', options = {}) {
        try {
            this.setExportingState(true);

            const stations = await window.sitesAPI.getStations();
            const exportData = {
                stations: stations,
                export_date: new Date().toISOString(),
                total_count: stations.length
            };

            await this.processExport(exportData, format, 'all_stations', options);

        } catch (error) {
            console.error('All stations export error:', error);
            showNotification(`Export failed: ${error.message}`, 'error');
        } finally {
            this.setExportingState(false);
        }
    }

    // Get comprehensive station data for export
    async getStationExportData(stationId) {
        const [station, platforms, instruments, rois] = await Promise.all([
            this.getStationDetails(stationId),
            window.sitesAPI.getPlatforms(stationId),
            this.getStationInstruments(stationId),
            this.getStationROIs(stationId)
        ]);

        return {
            station: station,
            platforms: platforms,
            instruments: instruments,
            rois: rois,
            export_metadata: {
                export_date: new Date().toISOString(),
                station_id: stationId,
                total_platforms: platforms.length,
                total_instruments: instruments.length,
                total_rois: rois.length
            }
        };
    }

    async getStationDetails(stationId) {
        const stations = await window.sitesAPI.getStations();
        // Use == for type coercion
        return stations.find(s => s.id == stationId);
    }

    async getStationInstruments(stationId) {
        const platforms = await window.sitesAPI.getPlatforms(stationId);
        const instrumentPromises = platforms.map(platform =>
            window.sitesAPI.getInstruments(platform.id)
        );
        const instrumentArrays = await Promise.all(instrumentPromises);
        return instrumentArrays.flat();
    }

    async getStationROIs(stationId) {
        const instruments = await this.getStationInstruments(stationId);
        const roiPromises = instruments.map(instrument =>
            window.sitesAPI.getROIs(instrument.id)
        );
        const roiArrays = await Promise.all(roiPromises);
        return roiArrays.flat();
    }

    async getPlatformExportData(platformId) {
        const [platform, instruments, rois] = await Promise.all([
            window.sitesAPI.getPlatform(platformId),
            window.sitesAPI.getInstruments(platformId),
            this.getPlatformROIs(platformId)
        ]);

        return {
            platform: platform,
            instruments: instruments,
            rois: rois,
            export_metadata: {
                export_date: new Date().toISOString(),
                platform_id: platformId,
                total_instruments: instruments.length,
                total_rois: rois.length
            }
        };
    }

    async getPlatformROIs(platformId) {
        const instruments = await window.sitesAPI.getInstruments(platformId);
        const roiPromises = instruments.map(instrument =>
            window.sitesAPI.getROIs(instrument.id)
        );
        const roiArrays = await Promise.all(roiPromises);
        return roiArrays.flat();
    }

    async getInstrumentExportData(instrumentId) {
        const [instrument, rois] = await Promise.all([
            window.sitesAPI.getInstrument(instrumentId),
            window.sitesAPI.getROIs(instrumentId)
        ]);

        return {
            instrument: instrument,
            rois: rois,
            export_metadata: {
                export_date: new Date().toISOString(),
                instrument_id: instrumentId,
                total_rois: rois.length
            }
        };
    }

    // Process export based on format
    async processExport(data, format, filename, options = {}) {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const fullFilename = `${filename}_${timestamp}`;

        switch (format.toLowerCase()) {
            case 'csv':
                this.exportAsCSV(data, fullFilename, options);
                break;

            case 'json':
                this.exportAsJSON(data, fullFilename, options);
                break;

            case 'xlsx':
                await this.exportAsExcel(data, fullFilename, options);
                break;

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }

        showNotification(`Export completed: ${fullFilename}.${format}`, 'success');
    }

    // Export as CSV
    exportAsCSV(data, filename, options = {}) {
        let csvContent = '';

        if (data.stations) {
            // Multiple stations export
            csvContent = this.convertArrayToCSV(data.stations, 'stations');
        } else if (data.station) {
            // Single station export with related data
            csvContent += this.convertArrayToCSV([data.station], 'station');
            csvContent += '\n\n' + this.convertArrayToCSV(data.platforms, 'platforms');
            csvContent += '\n\n' + this.convertArrayToCSV(data.instruments, 'instruments');
            if (data.rois && data.rois.length > 0) {
                csvContent += '\n\n' + this.convertArrayToCSV(data.rois, 'rois');
            }
        } else if (data.platform) {
            // Platform export
            csvContent += this.convertArrayToCSV([data.platform], 'platform');
            csvContent += '\n\n' + this.convertArrayToCSV(data.instruments, 'instruments');
            if (data.rois && data.rois.length > 0) {
                csvContent += '\n\n' + this.convertArrayToCSV(data.rois, 'rois');
            }
        } else if (data.instrument) {
            // Instrument export
            csvContent += this.convertArrayToCSV([data.instrument], 'instrument');
            if (data.rois && data.rois.length > 0) {
                csvContent += '\n\n' + this.convertArrayToCSV(data.rois, 'rois');
            }
        }

        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }

    // Convert array to CSV format
    convertArrayToCSV(array, sectionName) {
        if (!array || array.length === 0) {
            return `# ${sectionName.toUpperCase()}\nNo data available`;
        }

        const headers = Object.keys(array[0]);
        const csvRows = [
            `# ${sectionName.toUpperCase()}`,
            headers.join(','),
            ...array.map(item =>
                headers.map(header => {
                    const value = item[header];
                    // Handle special characters and commas in CSV
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ];

        return csvRows.join('\n');
    }

    // Export as JSON
    exportAsJSON(data, filename, options = {}) {
        const jsonContent = JSON.stringify(data, null, options.pretty !== false ? 2 : 0);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }

    // Export as Excel (requires additional library or service)
    async exportAsExcel(data, filename, options = {}) {
        // For now, fall back to CSV with Excel-friendly formatting
        // In a full implementation, you would use a library like SheetJS
        showNotification('Excel export coming soon - downloading as CSV instead', 'info');
        this.exportAsCSV(data, filename, options);
    }

    // Download file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // Export state management
    setExportingState(isExporting) {
        this.isExporting = isExporting;

        // Update UI elements
        const exportButtons = document.querySelectorAll('.export-btn');
        exportButtons.forEach(btn => {
            btn.disabled = isExporting;
            if (isExporting) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            } else {
                btn.innerHTML = '<i class="fas fa-download"></i> Export';
            }
        });

        // Show/hide loading indicator
        const loadingIndicator = document.getElementById('export-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = isExporting ? 'block' : 'none';
        }
    }

    // Batch export functionality
    async exportMultipleStations(stationIds, format = 'csv') {
        try {
            this.setExportingState(true);

            const exportPromises = stationIds.map(id =>
                this.getStationExportData(id)
            );

            const allStationData = await Promise.all(exportPromises);

            const batchData = {
                stations: allStationData,
                export_metadata: {
                    export_date: new Date().toISOString(),
                    total_stations: stationIds.length,
                    station_ids: stationIds
                }
            };

            await this.processExport(batchData, format, 'batch_stations_export');

        } catch (error) {
            console.error('Batch export error:', error);
            showNotification(`Batch export failed: ${error.message}`, 'error');
        } finally {
            this.setExportingState(false);
        }
    }

    // Utility functions
    isValidFormat(format) {
        return this.supportedFormats.includes(format.toLowerCase());
    }

    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    isExportInProgress() {
        return this.isExporting;
    }

    // Format data for better readability
    formatExportData(data, options = {}) {
        if (options.includeTimestamps) {
            data.export_timestamp = new Date().toISOString();
        }

        if (options.flattenNested) {
            return this.flattenNestedObjects(data);
        }

        return data;
    }

    flattenNestedObjects(obj, prefix = '', result = {}) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}_${key}` : key;

                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    this.flattenNestedObjects(obj[key], newKey, result);
                } else {
                    result[newKey] = obj[key];
                }
            }
        }
        return result;
    }
}

// Global instance
window.sitesExport = new SitesExport();

// Global convenience functions
function exportStationData(stationId, format = 'csv', options = {}) {
    return window.sitesExport.exportStationData(stationId, format, options);
}

function exportPlatformData(platformId, format = 'csv', options = {}) {
    return window.sitesExport.exportPlatformData(platformId, format, options);
}

function exportInstrumentData(instrumentId, format = 'csv', options = {}) {
    return window.sitesExport.exportInstrumentData(instrumentId, format, options);
}

function exportAllStations(format = 'csv', options = {}) {
    return window.sitesExport.exportAllStations(format, options);
}

function downloadBackup(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    window.sitesExport.downloadFile(jsonContent, filename, 'application/json');
}