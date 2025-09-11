// SITES Spectral - Export JavaScript
// Handle data export functionality

class ExportManager {
    constructor() {
        this.currentFormats = {
            complete: 'csv',
            stations: 'csv',
            instruments: 'csv',
            custom: 'csv'
        };
        this.init();
    }

    async init() {
        try {
            await this.loadFilterOptions();
            this.setupEventListeners();
        } catch (error) {
            console.error('Export manager initialization failed:', error);
            Utils.showToast('Failed to initialize export options', 'error');
        }
    }

    async loadFilterOptions() {
        try {
            // Load stations for instrument filter
            const stationsData = await API.getStations();
            const stations = stationsData.stations || stationsData || [];
            
            const stationSelect = document.getElementById('instruments-station');
            if (stationSelect) {
                stations.forEach(station => {
                    const option = document.createElement('option');
                    option.value = station.id;
                    option.textContent = `${station.display_name} (${station.acronym})`;
                    stationSelect.appendChild(option);
                });
            }

            // Load ecosystems for instrument filter
            const ecosystems = await API.getEcosystems();
            const ecosystemSelect = document.getElementById('instruments-ecosystem');
            if (ecosystemSelect) {
                ecosystems.forEach(ecosystem => {
                    const option = document.createElement('option');
                    option.value = ecosystem.code;
                    option.textContent = ecosystem.name;
                    ecosystemSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }

    setupEventListeners() {
        // Update export buttons when format changes
        document.querySelectorAll('.export-card').forEach(card => {
            const formatBtns = card.querySelectorAll('.format-btn');
            const exportBtn = card.querySelector('.btn-primary');
            
            formatBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const format = btn.dataset.format;
                    const exportType = this.getExportTypeFromCard(card);
                    this.updateExportButton(exportBtn, format, exportType);
                });
            });
        });
    }

    getExportTypeFromCard(card) {
        const title = card.querySelector('h3').textContent.toLowerCase();
        if (title.includes('complete')) return 'complete';
        if (title.includes('stations')) return 'stations';
        if (title.includes('instruments')) return 'instruments';
        if (title.includes('custom')) return 'custom';
        return 'unknown';
    }

    updateExportButton(button, format, exportType) {
        this.currentFormats[exportType] = format;
        
        const formatText = format.toUpperCase();
        const exportText = exportType.charAt(0).toUpperCase() + exportType.slice(1);
        
        button.onclick = () => this.handleExport(exportType, format);
        
        // Update button text if needed
        if (exportType === 'complete') {
            button.innerHTML = `<i class="fas fa-download"></i> Export Complete Dataset (${formatText})`;
        } else if (exportType === 'custom') {
            button.innerHTML = `<i class="fas fa-download"></i> Create Custom Export (${formatText})`;
        }
    }

    async handleExport(type, format) {
        try {
            this.showProgressModal(type, format);
            
            let data, filename;
            
            switch (type) {
                case 'complete':
                    ({ data, filename } = await this.exportComplete(format));
                    break;
                case 'stations':
                    ({ data, filename } = await this.exportStations(format));
                    break;
                case 'instruments':
                    ({ data, filename } = await this.exportInstruments(format));
                    break;
                case 'custom':
                    ({ data, filename } = await this.exportCustom(format));
                    break;
                default:
                    throw new Error('Unknown export type');
            }

            this.downloadFile(data, filename, format);
            this.hideProgressModal();
            
            Utils.showToast(`${type} data exported successfully`, 'success');
            this.addToExportHistory(type, format, filename, data);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.hideProgressModal();
            Utils.showToast(`Export failed: ${error.message}`, 'error');
        }
    }

    async exportComplete(format) {
        this.updateProgress(25, 'Loading stations...');
        const stationsData = await API.getStations();
        const stations = stationsData.stations || stationsData || [];

        this.updateProgress(50, 'Loading instruments...');
        const instrumentsData = await API.getInstruments();
        const instruments = instrumentsData.instruments || instrumentsData || [];

        this.updateProgress(75, 'Preparing export...');
        
        const completeData = {
            export_info: {
                type: 'complete_dataset',
                format: format,
                exported_at: new Date().toISOString(),
                total_stations: stations.length,
                total_instruments: instruments.length
            },
            stations: stations,
            instruments: instruments
        };

        this.updateProgress(100, 'Export ready!');
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `sites-spectral-complete-${timestamp}`;
        
        return {
            data: this.formatData(completeData, format),
            filename: filename
        };
    }

    async exportStations(format) {
        this.updateProgress(25, 'Loading stations...');
        
        const region = document.getElementById('stations-region')?.value || '';
        const params = region ? { region } : {};
        
        const stationsData = await API.getStations(params);
        const stations = stationsData.stations || stationsData || [];

        this.updateProgress(100, 'Export ready!');
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `sites-spectral-stations-${timestamp}`;
        
        return {
            data: this.formatData(stations, format),
            filename: filename
        };
    }

    async exportInstruments(format) {
        this.updateProgress(25, 'Loading instruments...');
        
        // Gather filter parameters
        const params = {
            station_id: document.getElementById('instruments-station')?.value || '',
            instrument_type: document.getElementById('instruments-type')?.value || '',
            status: document.getElementById('instruments-status')?.value || '',
            ecosystem: document.getElementById('instruments-ecosystem')?.value || '',
            include_rois: document.getElementById('include-rois')?.checked || false,
            include_history: document.getElementById('include-history')?.checked || false,
            include_quality_flags: document.getElementById('include-quality-flags')?.checked || false
        };

        // Remove empty parameters
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === false) {
                delete params[key];
            }
        });

        this.updateProgress(50, 'Applying filters...');
        const instrumentsData = await API.getInstruments(params);
        const instruments = instrumentsData.instruments || instrumentsData || [];

        // Load additional data if requested
        if (params.include_rois || params.include_history || params.include_quality_flags) {
            this.updateProgress(75, 'Loading additional data...');
            
            for (const instrument of instruments) {
                if (params.include_rois) {
                    try {
                        instrument.rois = await API.getInstrumentROIs(instrument.id);
                    } catch (error) {
                        console.warn(`Failed to load ROIs for instrument ${instrument.id}`);
                        instrument.rois = [];
                    }
                }
                
                if (params.include_history) {
                    try {
                        instrument.history = await API.getInstrumentHistory(instrument.id);
                    } catch (error) {
                        console.warn(`Failed to load history for instrument ${instrument.id}`);
                        instrument.history = [];
                    }
                }
                
                if (params.include_quality_flags) {
                    try {
                        instrument.quality_flags = await API.getQualityFlags(instrument.id);
                    } catch (error) {
                        console.warn(`Failed to load quality flags for instrument ${instrument.id}`);
                        instrument.quality_flags = [];
                    }
                }
            }
        }

        this.updateProgress(100, 'Export ready!');
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `sites-spectral-instruments-${timestamp}`;
        
        return {
            data: this.formatData(instruments, format),
            filename: filename
        };
    }

    async exportCustom(format) {
        this.updateProgress(25, 'Gathering custom fields...');
        
        // Get selected station fields
        const stationFields = Array.from(document.querySelectorAll('input[name="station-field"]:checked'))
            .map(input => input.value);
            
        // Get selected instrument fields
        const instrumentFields = Array.from(document.querySelectorAll('input[name="instrument-field"]:checked'))
            .map(input => input.value);

        if (stationFields.length === 0 && instrumentFields.length === 0) {
            throw new Error('Please select at least one field to export');
        }

        this.updateProgress(50, 'Loading data...');
        
        // Load stations and instruments
        const [stationsData, instrumentsData] = await Promise.all([
            stationFields.length > 0 ? API.getStations() : Promise.resolve({ stations: [] }),
            instrumentFields.length > 0 ? API.getInstruments() : Promise.resolve({ instruments: [] })
        ]);

        const stations = stationsData.stations || stationsData || [];
        const instruments = instrumentsData.instruments || instrumentsData || [];

        this.updateProgress(75, 'Filtering fields...');
        
        // Filter fields for stations
        const filteredStations = stations.map(station => {
            const filtered = {};
            stationFields.forEach(field => {
                if (station.hasOwnProperty(field)) {
                    filtered[field] = station[field];
                }
            });
            return filtered;
        });

        // Filter fields for instruments
        const filteredInstruments = instruments.map(instrument => {
            const filtered = {};
            instrumentFields.forEach(field => {
                if (instrument.hasOwnProperty(field)) {
                    filtered[field] = instrument[field];
                }
            });
            return filtered;
        });

        this.updateProgress(100, 'Export ready!');
        
        const customData = {
            export_info: {
                type: 'custom_export',
                format: format,
                exported_at: new Date().toISOString(),
                station_fields: stationFields,
                instrument_fields: instrumentFields
            }
        };

        if (stationFields.length > 0) {
            customData.stations = filteredStations;
        }
        
        if (instrumentFields.length > 0) {
            customData.instruments = filteredInstruments;
        }
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `sites-spectral-custom-${timestamp}`;
        
        return {
            data: this.formatData(customData, format),
            filename: filename
        };
    }

    formatData(data, format) {
        switch (format) {
            case 'csv':
                return this.convertToCSV(data);
            case 'yaml':
                return this.convertToYAML(data);
            case 'json':
                return JSON.stringify(data, null, 2);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    convertToCSV(data) {
        // Handle different data structures
        if (Array.isArray(data)) {
            return this.arrayToCSV(data);
        }
        
        if (data.stations && data.instruments) {
            // Complete dataset - create separate sections
            let csv = '# SITES Spectral Complete Dataset Export\n';
            csv += `# Exported: ${new Date().toISOString()}\n\n`;
            
            csv += '# STATIONS\n';
            csv += this.arrayToCSV(data.stations);
            
            csv += '\n\n# INSTRUMENTS\n';
            csv += this.arrayToCSV(data.instruments);
            
            return csv;
        }
        
        if (data.stations) {
            return this.arrayToCSV(data.stations);
        }
        
        if (data.instruments) {
            return this.arrayToCSV(data.instruments);
        }
        
        // Fallback for other structures
        return this.objectToCSV(data);
    }

    arrayToCSV(array) {
        if (!array || array.length === 0) {
            return '';
        }

        const headers = Object.keys(array[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = array.map(row => {
            return headers.map(header => {
                const value = row[header];
                // Handle null, undefined, objects, and arrays
                if (value === null || value === undefined) {
                    return '';
                }
                if (typeof value === 'object') {
                    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }
                // Escape quotes in strings
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',');
        });

        return [csvHeaders, ...csvRows].join('\n');
    }

    objectToCSV(obj) {
        const rows = Object.entries(obj).map(([key, value]) => {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return `${key},${stringValue}`;
        });
        
        return ['Field,Value', ...rows].join('\n');
    }

    convertToYAML(data) {
        // Simple YAML conversion (for more complex data, would use a proper YAML library)
        return this.objectToYAML(data, 0);
    }

    objectToYAML(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        let yaml = '';

        if (Array.isArray(obj)) {
            obj.forEach(item => {
                yaml += `${spaces}- `;
                if (typeof item === 'object' && item !== null) {
                    yaml += '\n' + this.objectToYAML(item, indent + 2);
                } else {
                    yaml += this.valueToYAML(item) + '\n';
                }
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
                yaml += `${spaces}${key}: `;
                if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    yaml += '\n' + this.objectToYAML(value, indent + 2);
                } else {
                    yaml += this.valueToYAML(value) + '\n';
                }
            });
        }

        return yaml;
    }

    valueToYAML(value) {
        if (value === null || value === undefined) {
            return 'null';
        }
        if (typeof value === 'string') {
            // Quote strings that need it
            if (value.includes(':') || value.includes('\n') || value.includes('"')) {
                return `"${value.replace(/"/g, '\\"')}"`;
            }
            return value;
        }
        return String(value);
    }

    downloadFile(content, filename, format) {
        const mimeTypes = {
            csv: 'text/csv',
            yaml: 'text/yaml',
            json: 'application/json'
        };

        const extensions = {
            csv: 'csv',
            yaml: 'yaml',
            json: 'json'
        };

        const blob = new Blob([content], { type: mimeTypes[format] });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.${extensions[format]}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    showProgressModal(type, format) {
        const modal = document.getElementById('export-progress-modal');
        if (!modal) return;

        document.getElementById('export-type-value').textContent = 
            type.charAt(0).toUpperCase() + type.slice(1);
        document.getElementById('export-format-value').textContent = format.toUpperCase();
        document.getElementById('export-records-value').textContent = 'Calculating...';

        modal.classList.add('show');
    }

    updateProgress(percentage, message) {
        const progressFill = document.getElementById('export-progress-fill');
        const progressText = document.getElementById('export-progress-text');

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = message;
        }
    }

    hideProgressModal() {
        const modal = document.getElementById('export-progress-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    addToExportHistory(type, format, filename, data) {
        // This would typically save to localStorage or send to API
        const history = JSON.parse(localStorage.getItem('export-history') || '[]');
        
        const exportRecord = {
            id: Utils.generateUUID(),
            type: type,
            format: format,
            filename: filename,
            date: new Date().toISOString(),
            fileSize: new Blob([data]).size,
            recordCount: this.countRecords(data, type)
        };

        history.unshift(exportRecord);
        
        // Keep only last 10 exports
        if (history.length > 10) {
            history.splice(10);
        }

        localStorage.setItem('export-history', JSON.stringify(history));
        this.updateExportHistoryTable(history);
    }

    countRecords(data, type) {
        try {
            if (typeof data === 'string') {
                if (type === 'csv') {
                    return data.split('\n').length - 1; // Subtract header
                }
                data = JSON.parse(data);
            }

            if (Array.isArray(data)) {
                return data.length;
            }

            if (data.stations && data.instruments) {
                return data.stations.length + data.instruments.length;
            }

            if (data.stations) {
                return data.stations.length;
            }

            if (data.instruments) {
                return data.instruments.length;
            }

            return 1;
        } catch {
            return 0;
        }
    }

    updateExportHistoryTable(history) {
        const tbody = document.getElementById('export-history-tbody');
        if (!tbody) return;

        if (history.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-history"></i>
                            <p>No recent exports</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = history.map(record => `
            <tr>
                <td>${Utils.capitalize(record.type)}</td>
                <td><span class="format-badge">${record.format.toUpperCase()}</span></td>
                <td>${Utils.formatDateTime(record.date)}</td>
                <td>${Utils.formatFileSize(record.fileSize)}</td>
                <td>${record.recordCount.toLocaleString()}</td>
                <td>
                    <button class="btn-icon" title="Download again" 
                            onclick="exportManager.redownloadExport('${record.id}')">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    redownloadExport(exportId) {
        Utils.showToast('Re-download functionality would be implemented here', 'info');
    }
}

// Global functions for format selection
window.selectFormat = function(button, exportType) {
    // Remove active class from siblings
    const siblings = button.parentElement.querySelectorAll('.format-btn');
    siblings.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    button.classList.add('active');
    
    // Update the current format
    if (window.exportManager) {
        window.exportManager.currentFormats[exportType] = button.dataset.format;
    }
};

// Global export functions
window.exportComplete = function(format) {
    if (window.exportManager) {
        window.exportManager.handleExport('complete', format);
    }
};

window.exportStations = function(format) {
    if (window.exportManager) {
        window.exportManager.handleExport('stations', format);
    }
};

window.exportInstruments = function(format) {
    if (window.exportManager) {
        window.exportManager.handleExport('instruments', format);
    }
};

window.exportCustom = function(format) {
    if (window.exportManager) {
        window.exportManager.handleExport('custom', format);
    }
};

// Initialize export manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.exportManager = new ExportManager();
    
    // Load export history
    const history = JSON.parse(localStorage.getItem('export-history') || '[]');
    window.exportManager.updateExportHistoryTable(history);
});