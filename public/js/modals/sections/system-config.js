/**
 * System Configuration Section
 * SITES Spectral v8.0.0-alpha.2
 *
 * Config-driven section for system configuration:
 * - Power source (from config)
 * - Data transmission method
 * - Warranty status
 * - Maintenance schedule
 * - Processing settings
 */

class SystemConfigSection {
    /**
     * Render system configuration section
     * @param {Object} instrument - Instrument data
     * @param {Object} config - Configuration from YAML
     * @returns {string} HTML string
     */
    static render(instrument, config = {}) {
        const powerSources = SystemConfigSection._getPowerSources(config);
        const transmissionMethods = SystemConfigSection._getTransmissionMethods(config);

        return `
            <div class="form-section" data-section="system-config">
                <h4 class="form-section-header" onclick="toggleSection(this)">
                    <i class="fas fa-cog" aria-hidden="true"></i>
                    <span>System Configuration</span>
                    <i class="fas fa-chevron-down section-toggle-icon" aria-hidden="true"></i>
                </h4>
                <div class="form-section-content">
                    ${FormField.select({
                        id: 'edit-instrument-power-source',
                        label: 'Power Source',
                        value: instrument.power_source || '',
                        options: powerSources,
                        helpText: 'Primary power supply for the instrument'
                    })}

                    ${FormField.select({
                        id: 'edit-instrument-data-transmission',
                        label: 'Data Transmission',
                        value: instrument.data_transmission || '',
                        options: transmissionMethods,
                        helpText: 'Method used to transmit data from instrument'
                    })}

                    ${SystemConfigSection._renderWarrantyField(instrument)}

                    ${FormField.text({
                        id: 'edit-instrument-maintenance-schedule',
                        label: 'Maintenance Schedule',
                        value: instrument.maintenance_schedule || '',
                        placeholder: 'e.g., Quarterly, Annually',
                        helpText: 'Regular maintenance frequency and schedule'
                    })}

                    ${FormField.toggle({
                        id: 'edit-instrument-image-processing',
                        label: 'Enable Data Processing',
                        checked: instrument.image_processing_enabled || instrument.processing_enabled || false,
                        helpText: 'Automatically process data from this instrument',
                        onChange: 'SystemConfigSection.updateProcessingStatus(this)'
                    })}

                    ${SystemConfigSection._renderCalibrationNotes(instrument)}
                </div>
            </div>
        `;
    }

    /**
     * Render warranty expiration field with status indicator
     * @private
     */
    static _renderWarrantyField(instrument) {
        const warrantyDate = instrument.manufacturer_warranty_expires || instrument.warranty_expires || '';
        let statusHTML = '';

        if (warrantyDate) {
            const date = new Date(warrantyDate);
            const now = new Date();
            const daysUntil = Math.floor((date - now) / (1000 * 60 * 60 * 24));

            let statusClass = 'success';
            let statusText = 'Active';
            let icon = 'check-circle';

            if (daysUntil < 0) {
                statusClass = 'danger';
                statusText = `Expired ${Math.abs(daysUntil)} days ago`;
                icon = 'times-circle';
            } else if (daysUntil < 30) {
                statusClass = 'warning';
                statusText = `Expires in ${daysUntil} days`;
                icon = 'exclamation-triangle';
            } else if (daysUntil < 90) {
                statusClass = 'info';
                statusText = `Expires in ${daysUntil} days`;
                icon = 'info-circle';
            } else {
                statusText = `Active (${daysUntil} days remaining)`;
            }

            statusHTML = `
                <div id="warranty-status" class="field-status status-${statusClass}">
                    <i class="fas fa-${icon}" aria-hidden="true"></i>
                    <span>${statusText}</span>
                </div>
            `;
        }

        return `
            <div class="form-group">
                <label for="edit-instrument-warranty-expires">Warranty Expiration</label>
                <input
                    type="date"
                    id="edit-instrument-warranty-expires"
                    name="warranty-expires"
                    class="form-control"
                    value="${warrantyDate}"
                    onchange="SystemConfigSection.updateWarrantyStatus(this)"
                    aria-label="Warranty Expiration"
                    aria-describedby="warranty-help"
                >
                ${statusHTML}
                <small class="form-text" id="warranty-help">Manufacturer warranty expiration date</small>
            </div>
        `;
    }

    /**
     * Render calibration notes textarea
     * @private
     */
    static _renderCalibrationNotes(instrument) {
        return FormField.textarea({
            id: 'edit-instrument-calibration-notes',
            label: 'Calibration Notes',
            value: instrument.calibration_notes || '',
            rows: 2,
            maxlength: 500,
            placeholder: 'Notes about calibration procedures, coefficients, etc...',
            showCharCount: true,
            helpText: 'Calibration history and technical notes'
        });
    }

    /**
     * Get power source options from config
     * @private
     */
    static _getPowerSources(config) {
        const defaultSources = [
            { value: '', label: 'Select power source...' },
            { value: 'Solar', label: '☀️ Solar' },
            { value: 'Grid', label: '🔌 Grid' },
            { value: 'Battery', label: '🔋 Battery' },
            { value: 'Solar + Battery', label: '☀️🔋 Solar + Battery' },
            { value: 'Wind', label: '💨 Wind' },
            { value: 'Other', label: 'Other' }
        ];

        if (config.powerSources && Array.isArray(config.powerSources)) {
            return [
                { value: '', label: 'Select power source...' },
                ...config.powerSources
            ];
        }

        return defaultSources;
    }

    /**
     * Get data transmission methods from config
     * @private
     */
    static _getTransmissionMethods(config) {
        const defaultMethods = [
            { value: '', label: 'Select transmission method...' },
            { value: 'WiFi', label: '📡 WiFi' },
            { value: 'Ethernet', label: '🔗 Ethernet' },
            { value: 'Cellular', label: '📱 Cellular (4G/5G)' },
            { value: 'LoRaWAN', label: '📻 LoRaWAN' },
            { value: 'Satellite', label: '🛰️ Satellite' },
            { value: 'SD Card', label: '💾 SD Card (Manual)' },
            { value: 'USB', label: '🔌 USB (Manual)' },
            { value: 'Other', label: 'Other' }
        ];

        if (config.transmissionMethods && Array.isArray(config.transmissionMethods)) {
            return [
                { value: '', label: 'Select transmission method...' },
                ...config.transmissionMethods
            ];
        }

        return defaultMethods;
    }

    /**
     * Update warranty status display
     */
    static updateWarrantyStatus(input) {
        const statusDiv = document.getElementById('warranty-status');
        if (!statusDiv || !input.value) {
            if (statusDiv) statusDiv.innerHTML = '';
            return;
        }

        const date = new Date(input.value);
        const now = new Date();
        const daysUntil = Math.floor((date - now) / (1000 * 60 * 60 * 24));

        let statusClass = 'success';
        let statusText = 'Active';
        let icon = 'check-circle';

        if (daysUntil < 0) {
            statusClass = 'danger';
            statusText = `Expired ${Math.abs(daysUntil)} days ago`;
            icon = 'times-circle';
        } else if (daysUntil < 30) {
            statusClass = 'warning';
            statusText = `Expires in ${daysUntil} days`;
            icon = 'exclamation-triangle';
        } else if (daysUntil < 90) {
            statusClass = 'info';
            statusText = `Expires in ${daysUntil} days`;
            icon = 'info-circle';
        } else {
            statusText = `Active (${daysUntil} days remaining)`;
        }

        statusDiv.className = `field-status status-${statusClass}`;
        statusDiv.innerHTML = `
            <i class="fas fa-${icon}" aria-hidden="true"></i>
            <span>${statusText}</span>
        `;
    }

    /**
     * Update processing status label
     */
    static updateProcessingStatus(checkbox) {
        const status = document.getElementById('edit-instrument-image-processing-status');
        if (status) {
            status.textContent = checkbox.checked ? 'Enabled' : 'Disabled';
        }
    }

    /**
     * Extract form data from section
     * @param {HTMLElement} sectionElement - Section DOM element
     * @returns {Object} Form data
     */
    static extractData(sectionElement) {
        if (!sectionElement) return {};

        return {
            power_source: document.getElementById('edit-instrument-power-source')?.value || null,
            data_transmission: document.getElementById('edit-instrument-data-transmission')?.value || null,
            manufacturer_warranty_expires: document.getElementById('edit-instrument-warranty-expires')?.value || null,
            maintenance_schedule: document.getElementById('edit-instrument-maintenance-schedule')?.value || null,
            processing_enabled: document.getElementById('edit-instrument-image-processing')?.checked || false,
            calibration_notes: document.getElementById('edit-instrument-calibration-notes')?.value || ''
        };
    }

    /**
     * Validate section data
     * @param {Object} data - Data to validate
     * @returns {Object} { valid: boolean, errors: Array }
     */
    static validate(data) {
        const errors = [];

        // Validate warranty date (shouldn't be too far in future)
        if (data.manufacturer_warranty_expires) {
            const warrantyDate = new Date(data.manufacturer_warranty_expires);
            const tenYearsFromNow = new Date();
            tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

            if (warrantyDate > tenYearsFromNow) {
                errors.push('Warranty expiration date seems unrealistic (more than 10 years in future)');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export for module systems and make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemConfigSection;
}
if (typeof window !== 'undefined') {
    window.SystemConfigSection = SystemConfigSection;
}
