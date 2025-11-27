/**
 * Timeline & Deployment Section
 * SITES Spectral v8.0.0-alpha.2
 *
 * Config-driven section for instrument timeline:
 * - Deployment type
 * - Ecosystem code (from ecosystems.yaml)
 * - Deployment date
 * - Decommission date
 * - Calibration date
 * - Years active (calculated)
 */

class TimelineSection {
    /**
     * Render timeline and deployment section
     * @param {Object} instrument - Instrument data
     * @param {Object} config - Configuration from YAML
     * @returns {string} HTML string
     */
    static render(instrument, config = {}) {
        const instrumentTypes = TimelineSection._getInstrumentTypes(config);
        const ecosystemCodes = TimelineSection._getEcosystemCodes(config);

        return `
            <div class="form-section" data-section="timeline">
                <h4 class="form-section-header" onclick="toggleSection(this)">
                    <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                    <span>Timeline & Deployment</span>
                    <i class="fas fa-chevron-down section-toggle-icon" aria-hidden="true"></i>
                </h4>
                <div class="form-section-content">
                    ${TimelineSection._renderInstrumentType(instrument, instrumentTypes)}

                    ${TimelineSection._renderEcosystemCode(instrument, ecosystemCodes)}

                    ${FormField.date({
                        id: 'edit-instrument-deployment',
                        label: 'Deployment Date',
                        value: instrument.deployment_date || '',
                        helpText: 'Date when instrument was installed and became operational',
                        onChange: 'TimelineSection.updateYearsActive()'
                    })}

                    ${FormField.date({
                        id: 'edit-instrument-decommission',
                        label: 'Decommission Date',
                        value: instrument.decommission_date || '',
                        helpText: 'Date when instrument was taken out of service (if applicable)',
                        onChange: 'TimelineSection.updateYearsActive()'
                    })}

                    ${FormField.date({
                        id: 'edit-instrument-calibration-date',
                        label: 'Last Calibration Date',
                        value: instrument.calibration_date || '',
                        helpText: 'Most recent calibration or verification date',
                        onChange: 'TimelineSection.updateCalibrationStatus()'
                    })}

                    <div id="calibration-status-display" class="info-display"></div>

                    ${FormField.number({
                        id: 'edit-instrument-first-year',
                        label: 'First Measurement Year',
                        value: instrument.first_measurement_year || '',
                        min: 2000,
                        max: 2030,
                        placeholder: 'e.g., 2010',
                        helpText: 'Year of first data collection'
                    })}

                    ${FormField.number({
                        id: 'edit-instrument-last-year',
                        label: 'Last Measurement Year',
                        value: instrument.last_measurement_year || '',
                        min: 2000,
                        max: 2030,
                        placeholder: 'e.g., 2024',
                        helpText: 'Year of most recent data (leave empty if still collecting)'
                    })}

                    ${TimelineSection._renderYearsActive(instrument)}

                    ${TimelineSection._renderPlatformInfo(instrument)}
                </div>
            </div>
        `;
    }

    /**
     * Render instrument type selector with "Other" option
     * @private
     */
    static _renderInstrumentType(instrument, instrumentTypes) {
        const isOtherType = instrument.instrument_type &&
            !instrumentTypes.some(type => type.value === instrument.instrument_type);

        return `
            <div class="form-group">
                <label for="edit-instrument-type">Instrument Type</label>
                <select
                    id="edit-instrument-type"
                    name="instrument-type"
                    class="form-control"
                    onchange="TimelineSection.handleInstrumentTypeOther(this)"
                    aria-label="Instrument Type"
                >
                    ${FormField._buildOptions(instrumentTypes, isOtherType ? '' : instrument.instrument_type)}
                    <option value="Other" ${isOtherType ? 'selected' : ''}>Other</option>
                </select>
                <input
                    type="text"
                    id="edit-instrument-type-other"
                    class="form-control mt-2"
                    placeholder="Specify instrument type..."
                    value="${isOtherType ? instrument.instrument_type : ''}"
                    style="display: ${isOtherType ? 'block' : 'none'};"
                    aria-label="Other Instrument Type"
                >
                <small class="form-text">Primary classification of this instrument</small>
            </div>
        `;
    }

    /**
     * Render ecosystem code selector with "Other" option
     * @private
     */
    static _renderEcosystemCode(instrument, ecosystemCodes) {
        const standardCodes = ecosystemCodes.map(e => e.value).filter(v => v);
        const isOtherEcosystem = instrument.ecosystem_code &&
            !standardCodes.includes(instrument.ecosystem_code);

        return `
            <div class="form-group">
                <label for="edit-instrument-ecosystem">Ecosystem Code</label>
                <select
                    id="edit-instrument-ecosystem"
                    name="ecosystem-code"
                    class="form-control"
                    onchange="TimelineSection.handleEcosystemOther(this)"
                    aria-label="Ecosystem Code"
                >
                    ${FormField._buildOptions(ecosystemCodes, isOtherEcosystem ? '' : instrument.ecosystem_code)}
                    <option value="Other" ${isOtherEcosystem ? 'selected' : ''}>Other</option>
                </select>
                <input
                    type="text"
                    id="edit-instrument-ecosystem-other"
                    class="form-control mt-2"
                    placeholder="Enter ecosystem code..."
                    value="${isOtherEcosystem ? instrument.ecosystem_code : ''}"
                    style="display: ${isOtherEcosystem ? 'block' : 'none'};"
                    aria-label="Other Ecosystem Code"
                >
                <small class="form-text">Ecosystem type where instrument is deployed</small>
            </div>
        `;
    }

    /**
     * Render years active display (calculated from dates)
     * @private
     */
    static _renderYearsActive(instrument) {
        const yearsActive = TimelineSection._calculateYearsActive(
            instrument.deployment_date,
            instrument.decommission_date
        );

        return `
            <div class="form-group full-width">
                <div id="years-active-display" class="info-display">
                    <i class="fas fa-clock" aria-hidden="true"></i>
                    <span>Years Active: <strong>${yearsActive}</strong></span>
                </div>
                <small class="form-text">Automatically calculated from deployment and decommission dates</small>
            </div>
        `;
    }

    /**
     * Render platform and station info (read-only)
     * @private
     */
    static _renderPlatformInfo(instrument) {
        if (!instrument.platform_name && !instrument.station_name) {
            return '';
        }

        return `
            <div class="form-group full-width">
                <label>Platform & Station</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <input
                        type="text"
                        value="${FormField._escapeHtml(instrument.platform_name || '')}"
                        class="form-control field-readonly"
                        readonly
                        tabindex="-1"
                        aria-label="Platform"
                        title="Platform is managed separately"
                    >
                    <input
                        type="text"
                        value="${FormField._escapeHtml(instrument.station_name || '')}${instrument.station_acronym ? ' (' + instrument.station_acronym + ')' : ''}"
                        class="form-control field-readonly"
                        readonly
                        tabindex="-1"
                        aria-label="Station"
                        title="Station is managed separately"
                    >
                </div>
                <small class="form-text">Associated platform and station (managed in platform settings)</small>
            </div>
        `;
    }

    /**
     * Get instrument types from config
     * @private
     */
    static _getInstrumentTypes(config) {
        const defaultTypes = [
            { value: '', label: 'Select type...' },
            { value: 'Phenocam', label: 'Phenocam' },
            { value: 'Multispectral Sensor', label: 'Multispectral Sensor' },
            { value: 'PAR Sensor', label: 'PAR Sensor' },
            { value: 'NDVI Sensor', label: 'NDVI Sensor' },
            { value: 'PRI Sensor', label: 'PRI Sensor' },
            { value: 'Hyperspectral', label: 'Hyperspectral' }
        ];

        if (config.instrumentTypes && Array.isArray(config.instrumentTypes)) {
            return [
                { value: '', label: 'Select type...' },
                ...config.instrumentTypes
            ];
        }

        return defaultTypes;
    }

    /**
     * Get ecosystem codes from config
     * @private
     */
    static _getEcosystemCodes(config) {
        const defaultEcosystems = [
            { value: '', label: 'Select ecosystem...' },
            { value: 'FOR', label: 'FOR - Forest' },
            { value: 'AGR', label: 'AGR - Arable Land' },
            { value: 'MIR', label: 'MIR - Mires' },
            { value: 'LAK', label: 'LAK - Lake' },
            { value: 'WET', label: 'WET - Wetland' },
            { value: 'GRA', label: 'GRA - Grassland' },
            { value: 'ALP', label: 'ALP - Alpine Forest' },
            { value: 'HEA', label: 'HEA - Heathland' },
            { value: 'CON', label: 'CON - Coniferous Forest' },
            { value: 'DEC', label: 'DEC - Deciduous Forest' },
            { value: 'MAR', label: 'MAR - Marshland' },
            { value: 'PEA', label: 'PEA - Peatland' }
        ];

        if (config.ecosystemCodes && Array.isArray(config.ecosystemCodes)) {
            return [
                { value: '', label: 'Select ecosystem...' },
                ...config.ecosystemCodes
            ];
        }

        return defaultEcosystems;
    }

    /**
     * Calculate years active from deployment and decommission dates
     * @private
     */
    static _calculateYearsActive(deploymentDate, decommissionDate) {
        if (!deploymentDate) {
            return 'N/A';
        }

        const start = new Date(deploymentDate);
        const end = decommissionDate ? new Date(decommissionDate) : new Date();

        if (isNaN(start.getTime())) {
            return 'N/A';
        }

        const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
        return years.toFixed(1);
    }

    /**
     * Handle instrument type "Other" selection
     */
    static handleInstrumentTypeOther(selectElement) {
        const otherInput = document.getElementById('edit-instrument-type-other');
        if (!otherInput) return;

        if (selectElement.value === 'Other') {
            otherInput.style.display = 'block';
            otherInput.focus();
        } else {
            otherInput.style.display = 'none';
            otherInput.value = '';
        }
    }

    /**
     * Handle ecosystem "Other" selection
     */
    static handleEcosystemOther(selectElement) {
        const otherInput = document.getElementById('edit-instrument-ecosystem-other');
        if (!otherInput) return;

        if (selectElement.value === 'Other') {
            otherInput.style.display = 'block';
            otherInput.focus();
        } else {
            otherInput.style.display = 'none';
            otherInput.value = '';
        }
    }

    /**
     * Update years active display
     */
    static updateYearsActive() {
        const deploymentInput = document.getElementById('edit-instrument-deployment');
        const decommissionInput = document.getElementById('edit-instrument-decommission');
        const display = document.getElementById('years-active-display');

        if (!deploymentInput || !display) return;

        const yearsActive = TimelineSection._calculateYearsActive(
            deploymentInput.value,
            decommissionInput?.value
        );

        display.innerHTML = `
            <i class="fas fa-clock" aria-hidden="true"></i>
            <span>Years Active: <strong>${yearsActive}</strong></span>
        `;
    }

    /**
     * Update calibration status display
     */
    static updateCalibrationStatus() {
        const calibrationInput = document.getElementById('edit-instrument-calibration-date');
        const display = document.getElementById('calibration-status-display');

        if (!calibrationInput || !display) return;

        const calibrationDate = calibrationInput.value;
        if (!calibrationDate) {
            display.innerHTML = '';
            return;
        }

        const date = new Date(calibrationDate);
        const now = new Date();
        const daysSince = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        const yearsSince = (daysSince / 365.25).toFixed(1);

        let statusClass = 'success';
        let statusText = 'Recent';
        let icon = 'check-circle';

        if (daysSince > 730) { // 2 years
            statusClass = 'warning';
            statusText = 'Due for recalibration';
            icon = 'exclamation-triangle';
        } else if (daysSince > 365) { // 1 year
            statusClass = 'info';
            statusText = 'Consider recalibration';
            icon = 'info-circle';
        }

        display.innerHTML = `
            <div class="alert alert-${statusClass}">
                <i class="fas fa-${icon}" aria-hidden="true"></i>
                <span><strong>Calibration Status:</strong> ${statusText} (${yearsSince} years ago)</span>
            </div>
        `;
    }

    /**
     * Extract form data from section
     * @param {HTMLElement} sectionElement - Section DOM element
     * @returns {Object} Form data
     */
    static extractData(sectionElement) {
        if (!sectionElement) return {};

        const typeSelect = document.getElementById('edit-instrument-type');
        const typeOther = document.getElementById('edit-instrument-type-other');
        const instrumentType = typeSelect?.value === 'Other' ? typeOther?.value : typeSelect?.value;

        const ecosystemSelect = document.getElementById('edit-instrument-ecosystem');
        const ecosystemOther = document.getElementById('edit-instrument-ecosystem-other');
        const ecosystemCode = ecosystemSelect?.value === 'Other' ? ecosystemOther?.value : ecosystemSelect?.value;

        return {
            instrument_type: instrumentType || '',
            ecosystem_code: ecosystemCode || '',
            deployment_date: document.getElementById('edit-instrument-deployment')?.value || null,
            decommission_date: document.getElementById('edit-instrument-decommission')?.value || null,
            calibration_date: document.getElementById('edit-instrument-calibration-date')?.value || null,
            first_measurement_year: parseInt(document.getElementById('edit-instrument-first-year')?.value) || null,
            last_measurement_year: parseInt(document.getElementById('edit-instrument-last-year')?.value) || null
        };
    }

    /**
     * Validate section data
     * @param {Object} data - Data to validate
     * @returns {Object} { valid: boolean, errors: Array }
     */
    static validate(data) {
        const errors = [];

        // Validate date sequence
        if (data.deployment_date && data.decommission_date) {
            const deployment = new Date(data.deployment_date);
            const decommission = new Date(data.decommission_date);

            if (decommission < deployment) {
                errors.push('Decommission date cannot be before deployment date');
            }
        }

        // Validate year sequence
        if (data.first_measurement_year && data.last_measurement_year) {
            if (data.last_measurement_year < data.first_measurement_year) {
                errors.push('Last measurement year cannot be before first measurement year');
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
    module.exports = TimelineSection;
}
if (typeof window !== 'undefined') {
    window.TimelineSection = TimelineSection;
}
