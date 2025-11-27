/**
 * General Information Section
 * SITES Spectral v8.0.0-alpha.2
 *
 * Config-driven section for instrument general information:
 * - Instrument name (normalized_name)
 * - Status dropdown (from status.yaml)
 * - Measurement status
 * - Legacy acronym
 * - Quality score slider
 *
 * All options loaded from YAML configuration files
 */

class GeneralInfoSection {
    /**
     * Render general information section
     * @param {Object} instrument - Instrument data
     * @param {Object} config - Configuration from YAML
     * @returns {string} HTML string
     */
    static render(instrument, config = {}) {
        const statusOptions = GeneralInfoSection._getStatusOptions(config);
        const measurementStatusOptions = GeneralInfoSection._getMeasurementStatusOptions(config);

        return `
            <div class="form-section" data-section="general-info">
                <h4 class="form-section-header" onclick="toggleSection(this)">
                    <i class="fas fa-info-circle" aria-hidden="true"></i>
                    <span>General Information</span>
                    <i class="fas fa-chevron-down section-toggle-icon" aria-hidden="true"></i>
                </h4>
                <div class="form-section-content">
                    ${FormField.text({
                        id: 'edit-instrument-name',
                        label: 'Instrument Name',
                        value: instrument.display_name || '',
                        required: true,
                        placeholder: 'Enter instrument name',
                        helpText: 'Human-readable display name for this instrument',
                        validation: {
                            required: true,
                            custom: (value) => value.length >= 3 || 'Name must be at least 3 characters'
                        }
                    })}

                    ${FormField.text({
                        id: 'edit-instrument-normalized',
                        label: 'Normalized ID',
                        value: instrument.normalized_name || '',
                        readonly: true,
                        helpText: 'System-generated identifier (auto-generated from platform and type)'
                    })}

                    ${FormField.text({
                        id: 'edit-instrument-legacy',
                        label: 'Legacy Acronym',
                        value: instrument.legacy_acronym || '',
                        placeholder: 'e.g., ANS-FOR-P01',
                        helpText: 'Legacy identifier for historical data compatibility'
                    })}

                    ${FormField.select({
                        id: 'edit-instrument-status',
                        label: 'Status',
                        value: instrument.status || 'Active',
                        options: statusOptions,
                        required: true,
                        helpText: 'Current operational status of the instrument'
                    })}

                    ${FormField.select({
                        id: 'edit-instrument-measurement-status',
                        label: 'Measurement Status',
                        value: instrument.measurement_status || '',
                        options: measurementStatusOptions,
                        helpText: 'Current data collection status'
                    })}

                    ${GeneralInfoSection._renderQualityScore(instrument)}
                </div>
            </div>
        `;
    }

    /**
     * Get status options from config
     * @private
     */
    static _getStatusOptions(config) {
        // Default status options (fallback if config not loaded)
        const defaultStatuses = [
            { value: 'Active', label: 'Active', description: 'Currently operational' },
            { value: 'Inactive', label: 'Inactive', description: 'Temporarily not in use' },
            { value: 'Testing', label: 'Testing', description: 'Being tested' },
            { value: 'Maintenance', label: 'Maintenance', description: 'Under maintenance' },
            { value: 'Decommissioned', label: 'Decommissioned', description: 'Permanently retired' },
            { value: 'Planned', label: 'Planned', description: 'Approved for future installation' }
        ];

        // Load from config if available
        if (config.statusOptions && Array.isArray(config.statusOptions)) {
            return config.statusOptions.map(status => ({
                value: status.value || status,
                label: status.label || status.value || status,
                description: status.description
            }));
        }

        return defaultStatuses;
    }

    /**
     * Get measurement status options from config
     * @private
     */
    static _getMeasurementStatusOptions(config) {
        const defaultStatuses = [
            { value: '', label: 'Select status...' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Intermittent', label: 'Intermittent' },
            { value: 'Seasonal', label: 'Seasonal' },
            { value: 'Completed', label: 'Completed' }
        ];

        if (config.measurementStatusOptions && Array.isArray(config.measurementStatusOptions)) {
            return [
                { value: '', label: 'Select status...' },
                ...config.measurementStatusOptions.map(status => ({
                    value: status.value || status,
                    label: status.label || status.value || status
                }))
            ];
        }

        return defaultStatuses;
    }

    /**
     * Render quality score slider
     * @private
     */
    static _renderQualityScore(instrument) {
        const qualityScore = instrument.image_quality_score || instrument.quality_score || 80;
        const qualityClass = qualityScore >= 75 ? 'high' : qualityScore >= 50 ? 'medium' : 'low';
        const qualityLabel = qualityScore >= 75 ? 'High Quality' : qualityScore >= 50 ? 'Medium Quality' : 'Low Quality';

        return `
            <div class="form-group full-width">
                <label id="quality-score-label">Quality Score</label>
                <div class="range-slider-container">
                    <input
                        type="range"
                        id="edit-instrument-quality-score"
                        name="quality-score"
                        class="range-slider"
                        value="${qualityScore}"
                        min="0"
                        max="100"
                        step="1"
                        oninput="updateQualityDisplay(this.value)"
                        aria-labelledby="quality-score-label"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="${qualityScore}"
                    >
                    <div class="range-value-display">
                        <span>Score: <strong id="quality-score-value">${qualityScore}</strong></span>
                        <span id="quality-badge" class="quality-badge ${qualityClass}">${qualityLabel}</span>
                    </div>
                </div>
                <small class="form-text">Overall quality rating for data from this instrument (0-100)</small>
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

        return {
            display_name: document.getElementById('edit-instrument-name')?.value || '',
            normalized_name: document.getElementById('edit-instrument-normalized')?.value || '',
            legacy_acronym: document.getElementById('edit-instrument-legacy')?.value || '',
            status: document.getElementById('edit-instrument-status')?.value || '',
            measurement_status: document.getElementById('edit-instrument-measurement-status')?.value || '',
            quality_score: parseInt(document.getElementById('edit-instrument-quality-score')?.value || 80)
        };
    }

    /**
     * Validate section data
     * @param {Object} data - Data to validate
     * @returns {Object} { valid: boolean, errors: Array }
     */
    static validate(data) {
        const errors = [];

        if (!data.display_name || data.display_name.length < 3) {
            errors.push('Instrument name must be at least 3 characters');
        }

        if (!data.status) {
            errors.push('Status is required');
        }

        if (data.quality_score < 0 || data.quality_score > 100) {
            errors.push('Quality score must be between 0 and 100');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Helper function for quality score display (global scope for inline handlers)
if (typeof window !== 'undefined') {
    window.updateQualityDisplay = function(value) {
        const valueElement = document.getElementById('quality-score-value');
        const badgeElement = document.getElementById('quality-badge');

        if (valueElement) {
            valueElement.textContent = value;
        }

        if (badgeElement) {
            const score = parseInt(value);
            let className = 'quality-badge ';
            let label = '';

            if (score >= 75) {
                className += 'high';
                label = 'High Quality';
            } else if (score >= 50) {
                className += 'medium';
                label = 'Medium Quality';
            } else {
                className += 'low';
                label = 'Low Quality';
            }

            badgeElement.className = className;
            badgeElement.textContent = label;
        }

        // Update ARIA value
        const slider = document.getElementById('edit-instrument-quality-score');
        if (slider) {
            slider.setAttribute('aria-valuenow', value);
        }
    };
}

// Export for module systems and make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeneralInfoSection;
}
if (typeof window !== 'undefined') {
    window.GeneralInfoSection = GeneralInfoSection;
}
