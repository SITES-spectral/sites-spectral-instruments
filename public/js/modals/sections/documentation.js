/**
 * Documentation Section
 * SITES Spectral v8.0.0-alpha.2
 *
 * Config-driven section for instrument documentation:
 * - Description textarea with character counter
 * - Installation notes
 * - Maintenance notes
 * - Related documents list (future)
 */

class DocumentationSection {
    /**
     * Render documentation section
     * @param {Object} instrument - Instrument data
     * @param {Object} config - Configuration from YAML
     * @returns {string} HTML string
     */
    static render(instrument, config = {}) {
        const maxLengths = config.maxLengths || {
            description: 1000,
            installation_notes: 1000,
            maintenance_notes: 1000
        };

        return `
            <div class="form-section" data-section="documentation">
                <h4 class="form-section-header" onclick="toggleSection(this)">
                    <i class="fas fa-sticky-note" aria-hidden="true"></i>
                    <span>Documentation</span>
                    <i class="fas fa-chevron-down section-toggle-icon" aria-hidden="true"></i>
                </h4>
                <div class="form-section-content">
                    ${FormField.textarea({
                        id: 'edit-instrument-description',
                        label: 'Description',
                        value: instrument.description || '',
                        rows: 3,
                        maxlength: maxLengths.description,
                        placeholder: 'General description of the instrument, its purpose, and key features...',
                        showCharCount: true,
                        helpText: 'Overview of instrument purpose and characteristics'
                    })}

                    ${FormField.textarea({
                        id: 'edit-instrument-installation-notes',
                        label: 'Installation Notes',
                        value: instrument.installation_notes || '',
                        rows: 3,
                        maxlength: maxLengths.installation_notes,
                        placeholder: 'Installation date, setup procedures, mounting details, initial configuration...',
                        showCharCount: true,
                        helpText: 'Technical notes about installation and setup'
                    })}

                    ${FormField.textarea({
                        id: 'edit-instrument-maintenance-notes',
                        label: 'Maintenance Notes',
                        value: instrument.maintenance_notes || '',
                        rows: 3,
                        maxlength: maxLengths.maintenance_notes,
                        placeholder: 'Maintenance history, service records, repairs, upgrades...',
                        showCharCount: true,
                        helpText: 'Historical record of maintenance and repairs'
                    })}

                    ${DocumentationSection._renderDocumentationTips()}
                </div>
            </div>
        `;
    }

    /**
     * Render helpful tips for documentation
     * @private
     */
    static _renderDocumentationTips() {
        return `
            <div class="info-panel">
                <h5><i class="fas fa-lightbulb" aria-hidden="true"></i> Documentation Best Practices</h5>
                <ul class="tips-list">
                    <li><strong>Description:</strong> Include instrument purpose, key specifications, and unique features</li>
                    <li><strong>Installation:</strong> Document setup date, mounting configuration, and initial settings</li>
                    <li><strong>Maintenance:</strong> Record all service dates, issues found, and actions taken</li>
                    <li>Use clear, concise language for future reference</li>
                    <li>Include dates, names, and specific values where applicable</li>
                </ul>
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
            description: document.getElementById('edit-instrument-description')?.value || '',
            installation_notes: document.getElementById('edit-instrument-installation-notes')?.value || '',
            maintenance_notes: document.getElementById('edit-instrument-maintenance-notes')?.value || ''
        };
    }

    /**
     * Validate section data
     * @param {Object} data - Data to validate
     * @param {Object} config - Configuration with max lengths
     * @returns {Object} { valid: boolean, errors: Array }
     */
    static validate(data, config = {}) {
        const errors = [];
        const maxLengths = config.maxLengths || {
            description: 1000,
            installation_notes: 1000,
            maintenance_notes: 1000
        };

        if (data.description && data.description.length > maxLengths.description) {
            errors.push(`Description exceeds maximum length of ${maxLengths.description} characters`);
        }

        if (data.installation_notes && data.installation_notes.length > maxLengths.installation_notes) {
            errors.push(`Installation notes exceed maximum length of ${maxLengths.installation_notes} characters`);
        }

        if (data.maintenance_notes && data.maintenance_notes.length > maxLengths.maintenance_notes) {
            errors.push(`Maintenance notes exceed maximum length of ${maxLengths.maintenance_notes} characters`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

/**
 * Helper function for character count updates (global scope)
 */
if (typeof window !== 'undefined') {
    window.updateCharCount = function(textarea, counterId) {
        const counter = document.getElementById(counterId);
        if (!counter) return;

        const current = textarea.value.length;
        const max = textarea.maxLength;

        counter.textContent = `${current}/${max}`;

        // Add warning class if approaching limit
        if (current > max * 0.9) {
            counter.classList.add('char-counter-warning');
        } else {
            counter.classList.remove('char-counter-warning');
        }

        // Update ARIA
        counter.setAttribute('aria-label', `${current} of ${max} characters used`);
    };
}

// Export for module systems and make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentationSection;
}
if (typeof window !== 'undefined') {
    window.DocumentationSection = DocumentationSection;
}
