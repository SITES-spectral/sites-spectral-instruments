/**
 * Shared Modal Sections - Reusable Form Sections for All Instrument Types
 * SITES Spectral v8.0.0-alpha.2
 *
 * Configuration-driven rendering of shared modal sections:
 * - General Information
 * - Position & Orientation
 * - Timeline & Deployment
 * - System Configuration
 * - Documentation
 *
 * Uses YAML configuration from /yamls/sections/shared.yaml
 *
 * @module modals/sections/shared-sections
 * @version 8.0.0-alpha.2
 */

(function(global) {
    'use strict';

    // =========================================================================
    // SECTION RENDERER CLASS
    // =========================================================================

    /**
     * Shared sections renderer with YAML configuration support
     */
    class SharedSections {
        /**
         * Create shared sections instance
         */
        constructor() {
            /** @private - Cached configuration */
            this._config = null;

            /** @private - Config loader reference */
            this._configLoader = null;

            /** @private - Initialization state */
            this._initialized = false;
        }

        /**
         * Initialize with config loader
         * @returns {Promise<void>}
         */
        async initialize() {
            if (this._initialized) return;

            this._configLoader = global.ConfigLoader;

            if (this._configLoader) {
                try {
                    this._config = await this._configLoader.get('sections/shared');
                    console.log('[SharedSections] Loaded configuration from YAML');
                } catch (error) {
                    console.warn('[SharedSections] Failed to load YAML config, using defaults:', error);
                }
            }

            this._initialized = true;
        }

        /**
         * Render field based on configuration
         * @param {string} fieldName - Field name
         * @param {Object} fieldConfig - Field configuration from YAML
         * @param {*} value - Current value
         * @returns {string} Field HTML
         */
        renderField(fieldName, fieldConfig, value) {
            const id = fieldConfig.field_id || `edit-${fieldName.replace(/_/g, '-')}`;
            const label = fieldConfig.label || fieldName;
            const required = fieldConfig.required ? '<span style="color: #ef4444;">*</span>' : '';
            const helpText = fieldConfig.help_text ?
                `<small class="form-text">${this._escapeHtml(fieldConfig.help_text)}</small>` : '';
            const fullWidth = fieldConfig.full_width ? ' full-width' : '';

            switch (fieldConfig.type) {
                case 'text':
                    return this._renderTextField(id, label, required, fieldConfig, value, helpText, fullWidth);
                case 'number':
                    return this._renderNumberField(id, label, required, fieldConfig, value, helpText, fullWidth);
                case 'select':
                    return this._renderSelectField(id, label, required, fieldConfig, value, helpText, fullWidth);
                case 'textarea':
                    return this._renderTextareaField(id, label, required, fieldConfig, value, helpText, fullWidth);
                case 'date':
                    return this._renderDateField(id, label, required, fieldConfig, value, helpText, fullWidth);
                case 'toggle':
                    return this._renderToggleField(id, label, fieldConfig, value, fullWidth);
                case 'range':
                    return this._renderRangeField(id, label, fieldConfig, value, fullWidth);
                default:
                    return this._renderTextField(id, label, required, fieldConfig, value, helpText, fullWidth);
            }
        }

        /**
         * Render a complete section
         * @param {string} sectionKey - Section key in config
         * @param {Object} instrument - Instrument data
         * @returns {string} Section HTML
         */
        renderSection(sectionKey, instrument) {
            if (!this._config || !this._config[sectionKey]) {
                console.warn(`[SharedSections] Section config not found: ${sectionKey}`);
                return '';
            }

            const section = this._config[sectionKey];
            const fields = section.fields || {};

            let fieldsHTML = '';
            for (const [fieldName, fieldConfig] of Object.entries(fields)) {
                const value = instrument[fieldName];
                fieldsHTML += this.renderField(fieldName, fieldConfig, value);
            }

            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)">
                    <i class="fas ${section.icon || 'fa-cog'}"></i> ${section.title}
                </h4>
                <div class="form-section-content">
                    ${fieldsHTML}
                </div>
            </div>
            `;
        }

        // =====================================================================
        // FIELD RENDERERS
        // =====================================================================

        /**
         * Render text field
         * @private
         */
        _renderTextField(id, label, required, config, value, helpText, fullWidth) {
            const readonly = config.readonly ?
                'readonly class="form-control field-readonly" tabindex="-1"' :
                'class="form-control"';
            const pattern = config.pattern ? `pattern="${config.pattern}"` : '';
            const maxLength = config.max_length ? `maxlength="${config.max_length}"` : '';

            return `
            <div class="form-group${fullWidth}">
                <label>${label} ${required}</label>
                <input type="text" id="${id}" value="${this._escapeHtml(value || '')}"
                       ${readonly} placeholder="${config.placeholder || ''}"
                       ${pattern} ${maxLength} aria-label="${label}">
                ${helpText}
            </div>
            `;
        }

        /**
         * Render number field
         * @private
         */
        _renderNumberField(id, label, required, config, value, helpText, fullWidth) {
            const step = config.step !== undefined ? `step="${config.step}"` : '';
            const min = config.min !== undefined ? `min="${config.min}"` : '';
            const max = config.max !== undefined ? `max="${config.max}"` : '';

            return `
            <div class="form-group${fullWidth}">
                <label>${label} ${required}</label>
                <input type="number" id="${id}" value="${value !== null && value !== undefined ? value : ''}"
                       class="form-control" ${step} ${min} ${max}
                       placeholder="${config.placeholder || ''}" aria-label="${label}">
                ${helpText}
            </div>
            `;
        }

        /**
         * Render select field
         * @private
         */
        _renderSelectField(id, label, required, config, value, helpText, fullWidth) {
            let options = '';

            // Handle grouped options
            if (config.groups) {
                for (const group of config.groups) {
                    if (group.label) {
                        options += `<optgroup label="${group.label}">`;
                    }
                    for (const opt of group.options) {
                        const selected = opt.value === value ? 'selected' : '';
                        options += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
                    }
                    if (group.label) {
                        options += '</optgroup>';
                    }
                }
            } else if (config.options) {
                for (const opt of config.options) {
                    const selected = opt.value === value ? 'selected' : '';
                    options += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
                }
            }

            // Handle allow_other
            const isOtherValue = config.allow_other && value &&
                !this._isStandardValue(value, config);
            const onchange = config.allow_other ?
                `onchange="handleSelectOther(this, '${id}-other')"` : '';
            const otherInput = config.allow_other ? `
                <input type="text" id="${id}-other" class="form-control mt-2"
                       value="${isOtherValue ? this._escapeHtml(value) : ''}"
                       placeholder="Enter other..." style="display: ${isOtherValue ? 'block' : 'none'};"
                       aria-label="Other ${label}">` : '';

            // Add "Other" option if allow_other
            if (config.allow_other) {
                options += `<option value="Other" ${isOtherValue ? 'selected' : ''}>Other</option>`;
            }

            return `
            <div class="form-group${fullWidth}">
                <label>${label} ${required}</label>
                <select id="${id}" class="form-control" aria-label="${label}" ${onchange}>
                    ${options}
                </select>
                ${otherInput}
                ${helpText}
            </div>
            `;
        }

        /**
         * Render textarea field
         * @private
         */
        _renderTextareaField(id, label, required, config, value, helpText, fullWidth) {
            const rows = config.rows || 3;
            const maxLength = config.max_length || 1000;
            const charCount = (value || '').length;

            return `
            <div class="form-group${fullWidth}">
                <label for="${id}">${label} ${required}</label>
                <textarea id="${id}" class="form-control" rows="${rows}"
                          maxlength="${maxLength}"
                          oninput="updateCharCount(this, '${id}-char-count')"
                          placeholder="${config.placeholder || ''}"
                          aria-describedby="${id}-char-count">${this._escapeHtml(value || '')}</textarea>
                <div id="${id}-char-count" class="char-counter" aria-live="polite">
                    ${charCount}/${maxLength}
                </div>
            </div>
            `;
        }

        /**
         * Render date field
         * @private
         */
        _renderDateField(id, label, required, config, value, helpText, fullWidth) {
            const onchange = config.onchange ? `onchange="${config.onchange}"` : '';

            return `
            <div class="form-group${fullWidth}">
                <label>${label} ${required}</label>
                <input type="date" id="${id}" value="${value || ''}"
                       class="form-control" ${onchange} aria-label="${label}">
                ${helpText}
            </div>
            `;
        }

        /**
         * Render toggle field
         * @private
         */
        _renderToggleField(id, label, config, value, fullWidth) {
            const checked = value ? 'checked' : '';
            const statusText = value ? 'Enabled' : 'Disabled';

            return `
            <div class="form-group${fullWidth}">
                <label id="${id}-label">${label}</label>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <label class="toggle-switch">
                        <input type="checkbox" id="${id}" ${checked}
                               aria-labelledby="${id}-label"
                               onchange="updateToggleLabel(this, '${id}-status')">
                        <span class="toggle-slider"></span>
                    </label>
                    <span id="${id}-status">${statusText}</span>
                </div>
            </div>
            `;
        }

        /**
         * Render range field
         * @private
         */
        _renderRangeField(id, label, config, value, fullWidth) {
            const currentValue = value !== undefined ? value : (config.default || 80);
            const min = config.min || 0;
            const max = config.max || 100;
            const step = config.step || 1;

            const qualityClass = currentValue >= 75 ? 'high' :
                                 currentValue >= 50 ? 'medium' : 'low';
            const qualityLabel = currentValue >= 75 ? 'High Quality' :
                                 currentValue >= 50 ? 'Medium Quality' : 'Low Quality';

            return `
            <div class="form-group${fullWidth}">
                <label id="${id}-label">${label}</label>
                <div class="range-slider-container">
                    <input type="range" id="${id}" value="${currentValue}"
                           min="${min}" max="${max}" step="${step}" class="range-slider"
                           oninput="updateQualityDisplay(this.value)"
                           aria-labelledby="${id}-label"
                           aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${currentValue}">
                    <div class="range-value-display">
                        <span>Score: <strong id="${id}-value">${currentValue}</strong></span>
                        <span id="${id}-badge" class="quality-badge ${qualityClass}">${qualityLabel}</span>
                    </div>
                </div>
            </div>
            `;
        }

        // =====================================================================
        // HELPER METHODS
        // =====================================================================

        /**
         * Check if value is in standard options
         * @private
         */
        _isStandardValue(value, config) {
            if (!value || !config.options) return true;

            const standardValues = config.options.map(o => o.value);
            return standardValues.includes(value);
        }

        /**
         * Escape HTML to prevent XSS
         * @private
         * @see core/security.js - Delegates to central implementation
         */
        _escapeHtml(str) {
            return global.SitesSecurity?.escapeHtml?.(str) ?? (str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
        }
    }

    // =========================================================================
    // HELPER FUNCTIONS (Global)
    // =========================================================================

    /**
     * Update quality display from range slider
     * @param {number} value - Current value
     */
    global.updateQualityDisplay = function(value) {
        const scoreEl = document.getElementById('edit-instrument-quality-score-value');
        const badgeEl = document.getElementById('edit-instrument-quality-score-badge');
        const rangeEl = document.getElementById('edit-instrument-quality-score');

        if (scoreEl) {
            scoreEl.textContent = value;
        }

        if (badgeEl) {
            const qualityClass = value >= 75 ? 'high' : value >= 50 ? 'medium' : 'low';
            const qualityLabel = value >= 75 ? 'High Quality' :
                                 value >= 50 ? 'Medium Quality' : 'Low Quality';
            badgeEl.className = `quality-badge ${qualityClass}`;
            badgeEl.textContent = qualityLabel;
        }

        if (rangeEl) {
            rangeEl.setAttribute('aria-valuenow', value);
        }
    };

    /**
     * Update character count for textarea
     * @param {HTMLTextAreaElement} textarea - Textarea element
     * @param {string} counterId - Counter element ID
     */
    global.updateCharCount = function(textarea, counterId) {
        const counter = document.getElementById(counterId);
        if (counter && textarea) {
            const maxLength = textarea.getAttribute('maxlength') || 1000;
            counter.textContent = `${textarea.value.length}/${maxLength}`;
        }
    };

    /**
     * Toggle section visibility
     * @param {HTMLElement} header - Section header element
     */
    global.toggleSection = function(header) {
        const section = header.closest('.form-section');
        if (section) {
            section.classList.toggle('collapsed');
            const content = section.querySelector('.form-section-content');
            if (content) {
                content.setAttribute('aria-hidden', section.classList.contains('collapsed'));
            }
        }
    };

    /**
     * Update calibration status display
     * @param {HTMLInputElement} input - Date input element
     */
    global.updateCalibrationStatus = function(input) {
        const status = document.getElementById('calibration-status');
        if (!status || !input.value) {
            if (status) status.textContent = '';
            return;
        }

        const calibDate = new Date(input.value);
        const now = new Date();
        const daysSince = Math.floor((now - calibDate) / (1000 * 60 * 60 * 24));

        if (daysSince < 0) {
            status.textContent = 'Calibration scheduled';
            status.className = 'form-text text-info';
        } else if (daysSince < 365) {
            status.textContent = `Calibrated ${daysSince} days ago`;
            status.className = 'form-text text-success';
        } else if (daysSince < 730) {
            status.textContent = `Calibration due (${Math.floor(daysSince / 30)} months ago)`;
            status.className = 'form-text text-warning';
        } else {
            status.textContent = `Calibration overdue (${Math.floor(daysSince / 365)} years ago)`;
            status.className = 'form-text text-danger';
        }
    };

    /**
     * Update warranty status display
     * @param {HTMLInputElement} input - Date input element
     */
    global.updateWarrantyStatus = function(input) {
        const status = document.getElementById('warranty-status');
        if (!status || !input.value) {
            if (status) status.textContent = '';
            return;
        }

        const warrantyDate = new Date(input.value);
        const now = new Date();
        const daysUntil = Math.floor((warrantyDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntil > 180) {
            status.textContent = `Valid for ${Math.floor(daysUntil / 30)} months`;
            status.className = 'form-text text-success';
        } else if (daysUntil > 0) {
            status.textContent = `Expires in ${daysUntil} days`;
            status.className = 'form-text text-warning';
        } else {
            status.textContent = `Expired ${Math.abs(daysUntil)} days ago`;
            status.className = 'form-text text-danger';
        }
    };

    /**
     * Update image processing label
     * @param {HTMLInputElement} checkbox - Checkbox element
     */
    global.updateImageProcessingLabel = function(checkbox) {
        const status = document.getElementById('image-processing-status');
        if (status) {
            status.textContent = checkbox.checked ? 'Enabled' : 'Disabled';
        }
    };

    // =========================================================================
    // EXPORTS
    // =========================================================================

    // Create singleton instance
    const sharedSections = new SharedSections();

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SharedSections, sharedSections };
    }

    // Export for browser global
    global.SharedSections = sharedSections;
    global.SharedSectionsClass = SharedSections;

})(typeof window !== 'undefined' ? window : global);
