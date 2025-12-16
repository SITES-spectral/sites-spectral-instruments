/**
 * PRI Modal - Type-Specific Modal Builder for PRI Sensors
 * SITES Spectral v11.0.0-alpha.35
 *
 * Extends BaseInstrumentModal to provide PRI-specific:
 * - Band 1 wavelength configuration (typically ~531nm for xanthophyll)
 * - Band 2 wavelength configuration (typically ~570nm reference)
 * - Calibration coefficient
 * - Orientation (incoming/reflected)
 *
 * The Photochemical Reflectance Index (PRI) measures xanthophyll cycle activity
 * and photosynthetic light use efficiency using narrow-band reflectance.
 *
 * @module instruments/pri/pri-modal
 * @version 11.0.0-alpha.35
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    const DEFAULT_BAND1_WAVELENGTH = 531;  // Xanthophyll sensitive band
    const DEFAULT_BAND2_WAVELENGTH = 570;  // Reference band

    const SENSOR_BRANDS = [
        { value: '', label: 'Select brand...' },
        { value: 'Skye', label: 'Skye Instruments' },
        { value: 'Apogee', label: 'Apogee Instruments' },
        { value: 'Meter', label: 'METER Group' },
        { value: 'Ocean Insight', label: 'Ocean Insight' },
        { value: 'Decagon', label: 'Decagon Devices' },
        { value: 'Custom', label: 'Custom/Research' },
        { value: 'Other', label: 'Other' }
    ];

    const ORIENTATION_OPTIONS = [
        { value: '', label: 'Select orientation...' },
        { value: 'uplooking', label: 'Uplooking (Incident Radiation)' },
        { value: 'downlooking', label: 'Downlooking (Reflected Radiation)' },
        { value: 'dual', label: 'Dual (Both Directions)' }
    ];

    // =========================================================================
    // PRI MODAL CLASS
    // =========================================================================

    /**
     * PRI sensor modal builder
     */
    class PRIModal {
        /**
         * Create PRI modal instance
         * @param {InstrumentManager} manager - Parent manager
         */
        constructor(manager) {
            /** @private - Manager reference */
            this._manager = manager;

            /** @private - Cached configuration */
            this._config = null;

            /** @protected - Category identifier */
            this._category = 'pri';
        }

        /**
         * Get configuration (lazy load)
         * @returns {Promise<Object>}
         */
        async getConfig() {
            if (!this._config) {
                this._config = await this._manager.getConfig(this._category);
            }
            return this._config;
        }

        /**
         * Build PRI modal HTML
         * @param {Object} instrument - Instrument data
         * @param {boolean} isAdmin - Admin mode flag
         * @returns {Promise<string>} Modal HTML
         */
        async build(instrument, isAdmin) {
            // Load configuration
            const config = await this.getConfig();

            // Build sections
            const sections = [
                this._renderGeneralInfoSection(instrument),
                this._renderPRISpecsSection(instrument, config),
                this._renderPositionSection(instrument),
                this._renderTimelineSection(instrument),
                this._renderSystemConfigSection(instrument),
                this._renderDocumentationSection(instrument)
            ].join('');

            return this._renderFormWrapper(instrument, isAdmin, sections);
        }

        /**
         * Validate PRI form data
         * @param {Object} formData - Form data
         * @returns {{valid: boolean, errors: string[]}}
         */
        validate(formData) {
            const errors = [];

            // Validate band 1 wavelength (xanthophyll band ~531nm)
            if (formData.band1_wavelength_nm) {
                const band1 = parseFloat(formData.band1_wavelength_nm);
                if (isNaN(band1) || band1 < 520 || band1 > 545) {
                    errors.push('Band 1 (xanthophyll) wavelength must be between 520 and 545 nm');
                }
            }

            // Validate band 2 wavelength (reference band ~570nm)
            if (formData.band2_wavelength_nm) {
                const band2 = parseFloat(formData.band2_wavelength_nm);
                if (isNaN(band2) || band2 < 555 || band2 > 590) {
                    errors.push('Band 2 (reference) wavelength must be between 555 and 590 nm');
                }
            }

            // Validate calibration coefficient
            if (formData.calibration_coefficient) {
                const coef = parseFloat(formData.calibration_coefficient);
                if (isNaN(coef) || coef < 0 || coef > 1000) {
                    errors.push('Calibration coefficient must be between 0 and 1000');
                }
            }

            // Validate field of view
            if (formData.field_of_view_degrees) {
                const fov = parseFloat(formData.field_of_view_degrees);
                if (isNaN(fov) || fov < 0 || fov > 180) {
                    errors.push('Field of view must be between 0 and 180 degrees');
                }
            }

            return {
                valid: errors.length === 0,
                errors
            };
        }

        /**
         * Collect form data from PRI modal
         * @returns {Object} Form data
         */
        collectFormData() {
            const getValue = (id) => {
                const el = document.getElementById(id);
                if (!el) return null;
                if (el.type === 'checkbox') return el.checked;
                return el.value || null;
            };

            const getSelectOrOther = (selectId, otherId) => {
                const select = document.getElementById(selectId);
                const other = document.getElementById(otherId);
                if (select && select.value === 'Other' && other) {
                    return other.value || null;
                }
                return select ? select.value || null : null;
            };

            // Shared fields
            const data = {
                id: getValue('edit-instrument-id'),
                display_name: getValue('edit-instrument-name'),
                legacy_acronym: getValue('edit-instrument-legacy'),
                status: getValue('edit-instrument-status'),
                measurement_status: getValue('edit-instrument-measurement-status'),
                latitude: getValue('edit-instrument-latitude'),
                longitude: getValue('edit-instrument-longitude'),
                instrument_height_m: getValue('edit-instrument-height'),
                viewing_direction: getValue('edit-instrument-viewing-direction'),
                azimuth_degrees: getValue('edit-instrument-azimuth'),
                degrees_from_nadir: getValue('edit-instrument-nadir'),
                instrument_type: getValue('edit-instrument-type'),
                ecosystem_code: getSelectOrOther('edit-instrument-ecosystem', 'edit-instrument-ecosystem-other'),
                deployment_date: getValue('edit-instrument-deployment'),
                calibration_date: getValue('edit-instrument-calibration-date'),
                first_measurement_year: getValue('edit-instrument-first-year'),
                last_measurement_year: getValue('edit-instrument-last-year'),
                power_source: getValue('edit-instrument-power-source'),
                data_transmission: getValue('edit-instrument-data-transmission'),
                manufacturer_warranty_expires: getValue('edit-instrument-warranty-expires'),
                image_processing_enabled: getValue('edit-instrument-image-processing'),
                image_quality_score: getValue('edit-instrument-quality-score'),
                calibration_notes: getValue('edit-instrument-calibration-notes'),
                description: getValue('edit-instrument-description'),
                installation_notes: getValue('edit-instrument-installation-notes'),
                maintenance_notes: getValue('edit-instrument-maintenance-notes'),

                // PRI-specific fields
                sensor_brand: getSelectOrOther('edit-pri-sensor-brand', 'edit-pri-sensor-brand-other'),
                sensor_model: getValue('edit-pri-sensor-model'),
                sensor_serial_number: getValue('edit-pri-sensor-serial'),
                band1_wavelength_nm: getValue('edit-pri-band1-wavelength'),
                band1_bandwidth_nm: getValue('edit-pri-band1-bandwidth'),
                band2_wavelength_nm: getValue('edit-pri-band2-wavelength'),
                band2_bandwidth_nm: getValue('edit-pri-band2-bandwidth'),
                calibration_coefficient: getValue('edit-pri-calibration-coefficient'),
                orientation: getValue('edit-pri-sensor-orientation'),
                field_of_view_degrees: getValue('edit-pri-field-of-view'),
                cable_length_m: getValue('edit-pri-cable-length'),
                datalogger_type: getValue('edit-pri-datalogger-type')
            };

            return data;
        }

        // =====================================================================
        // SECTION RENDERERS
        // =====================================================================

        /**
         * Render general info section
         * @private
         */
        _renderGeneralInfoSection(instrument) {
            const MS = global.ModalSections;
            if (MS && MS.renderGeneralInfoSection) {
                return MS.renderGeneralInfoSection(instrument);
            }
            return this._renderGenericGeneralInfo(instrument);
        }

        /**
         * Render PRI specifications section
         * @private
         */
        _renderPRISpecsSection(instrument, config) {
            const isOtherBrand = instrument.sensor_brand &&
                !SENSOR_BRANDS.some(b => b.value === instrument.sensor_brand);

            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-microscope"></i> PRI Sensor Specifications</h4>
                <div class="form-section-content">
                    <div class="info-callout">
                        <i class="fas fa-info-circle"></i>
                        <p>The Photochemical Reflectance Index (PRI) uses narrow-band reflectance at ~531nm (xanthophyll sensitive) and ~570nm (reference) to measure photosynthetic light use efficiency.</p>
                    </div>
                    <div class="form-group">
                        <label>Sensor Brand</label>
                        <select id="edit-pri-sensor-brand" class="form-control" aria-label="Sensor Brand"
                                onchange="handlePRISensorBrandOther(this)">
                            ${SENSOR_BRANDS.map(b =>
                                `<option value="${b.value}" ${instrument.sensor_brand === b.value ? 'selected' : ''}>${b.label}</option>`
                            ).join('')}
                        </select>
                        <input type="text" id="edit-pri-sensor-brand-other"
                               value="${isOtherBrand ? this._escapeHtml(instrument.sensor_brand) : ''}"
                               class="form-control mt-2" placeholder="Enter other brand..."
                               style="display: ${isOtherBrand ? 'block' : 'none'};"
                               aria-label="Other Sensor Brand">
                    </div>
                    <div class="form-group">
                        <label>Sensor Model</label>
                        <input type="text" id="edit-pri-sensor-model"
                               value="${this._escapeHtml(instrument.sensor_model || '')}"
                               class="form-control" placeholder="e.g., SKR 1850A"
                               aria-label="Sensor Model">
                    </div>
                    <div class="form-group">
                        <label>Sensor Serial Number</label>
                        <input type="text" id="edit-pri-sensor-serial"
                               value="${this._escapeHtml(instrument.sensor_serial_number || '')}"
                               class="form-control" placeholder="Sensor serial number"
                               aria-label="Sensor Serial Number">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Band 1 Center - Xanthophyll (nm)</label>
                            <input type="number" id="edit-pri-band1-wavelength"
                                   value="${instrument.band1_wavelength_nm || DEFAULT_BAND1_WAVELENGTH}"
                                   class="form-control" step="1" min="520" max="545"
                                   placeholder="e.g., 531"
                                   aria-label="Band 1 Wavelength">
                            <small class="form-text">Typically ~531nm (xanthophyll sensitive)</small>
                        </div>
                        <div class="form-group">
                            <label>Band 1 Bandwidth (nm)</label>
                            <input type="number" id="edit-pri-band1-bandwidth"
                                   value="${instrument.band1_bandwidth_nm || ''}"
                                   class="form-control" step="0.1" min="1" max="20"
                                   placeholder="e.g., 10"
                                   aria-label="Band 1 Bandwidth">
                            <small class="form-text">FWHM, typically narrow (5-15nm)</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Band 2 Center - Reference (nm)</label>
                            <input type="number" id="edit-pri-band2-wavelength"
                                   value="${instrument.band2_wavelength_nm || DEFAULT_BAND2_WAVELENGTH}"
                                   class="form-control" step="1" min="555" max="590"
                                   placeholder="e.g., 570"
                                   aria-label="Band 2 Wavelength">
                            <small class="form-text">Typically ~570nm (reference band)</small>
                        </div>
                        <div class="form-group">
                            <label>Band 2 Bandwidth (nm)</label>
                            <input type="number" id="edit-pri-band2-bandwidth"
                                   value="${instrument.band2_bandwidth_nm || ''}"
                                   class="form-control" step="0.1" min="1" max="20"
                                   placeholder="e.g., 10"
                                   aria-label="Band 2 Bandwidth">
                            <small class="form-text">FWHM, typically narrow (5-15nm)</small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Calibration Coefficient</label>
                        <input type="number" id="edit-pri-calibration-coefficient"
                               value="${instrument.calibration_coefficient || ''}"
                               class="form-control" step="0.001" placeholder="e.g., 1.0"
                               aria-label="Calibration Coefficient">
                        <small class="form-text">Sensor-specific calibration multiplier</small>
                    </div>
                    <div class="form-group">
                        <label>Orientation</label>
                        <select id="edit-pri-sensor-orientation" class="form-control" aria-label="Sensor Orientation">
                            ${ORIENTATION_OPTIONS.map(o =>
                                `<option value="${o.value}" ${instrument.orientation === o.value ? 'selected' : ''}>${o.label}</option>`
                            ).join('')}
                        </select>
                        <small class="form-text">Measurement direction of the sensor</small>
                    </div>
                    <div class="form-group">
                        <label>Field of View (degrees)</label>
                        <input type="number" id="edit-pri-field-of-view"
                               value="${instrument.field_of_view_degrees || ''}"
                               class="form-control" step="0.1" min="0" max="180" placeholder="e.g., 25"
                               aria-label="Field of View">
                    </div>
                    <div class="form-group">
                        <label>Cable Length (meters)</label>
                        <input type="number" id="edit-pri-cable-length"
                               value="${instrument.cable_length_m || ''}"
                               class="form-control" step="0.1" min="0" placeholder="e.g., 10.0"
                               aria-label="Cable Length">
                    </div>
                    <div class="form-group">
                        <label>Datalogger Type</label>
                        <input type="text" id="edit-pri-datalogger-type"
                               value="${this._escapeHtml(instrument.datalogger_type || '')}"
                               class="form-control" placeholder="e.g., Campbell Scientific CR1000X"
                               aria-label="Datalogger Type">
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Render position section
         * @private
         */
        _renderPositionSection(instrument) {
            const MS = global.ModalSections;
            if (MS && MS.renderPositionSection) {
                return MS.renderPositionSection(instrument);
            }
            return '';
        }

        /**
         * Render timeline section
         * @private
         */
        _renderTimelineSection(instrument) {
            const MS = global.ModalSections;
            if (MS && MS.renderTimelineSection) {
                return MS.renderTimelineSection(instrument);
            }
            return '';
        }

        /**
         * Render system config section
         * @private
         */
        _renderSystemConfigSection(instrument) {
            const MS = global.ModalSections;
            if (MS && MS.renderSystemConfigSection) {
                return MS.renderSystemConfigSection(instrument);
            }
            return '';
        }

        /**
         * Render documentation section
         * @private
         */
        _renderDocumentationSection(instrument) {
            const MS = global.ModalSections;
            if (MS && MS.renderDocumentationSection) {
                return MS.renderDocumentationSection(instrument);
            }
            return '';
        }

        // =====================================================================
        // FALLBACK RENDERERS
        // =====================================================================

        /**
         * Fallback generic general info section
         * @private
         */
        _renderGenericGeneralInfo(instrument) {
            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-info-circle"></i> General Information</h4>
                <div class="form-section-content">
                    <div class="form-group">
                        <label>Instrument Name <span style="color: #ef4444;">*</span></label>
                        <input type="text" id="edit-instrument-name"
                               value="${this._escapeHtml(instrument.display_name)}"
                               class="form-control" required aria-label="Instrument Name">
                    </div>
                    <div class="form-group">
                        <label>Normalized ID</label>
                        <input type="text" id="edit-instrument-normalized"
                               value="${this._escapeHtml(instrument.normalized_name)}"
                               class="form-control field-readonly" readonly tabindex="-1">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="edit-instrument-status" class="form-control">
                            <option value="Active" ${instrument.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${instrument.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Testing" ${instrument.status === 'Testing' ? 'selected' : ''}>Testing</option>
                            <option value="Maintenance" ${instrument.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                </div>
            </div>
            `;
        }

        // =====================================================================
        // HELPER METHODS
        // =====================================================================

        /**
         * Render form wrapper
         * @private
         */
        _renderFormWrapper(instrument, isAdmin, sectionsHTML) {
            const MS = global.ModalSections;
            if (MS && MS.renderFormWrapper) {
                return MS.renderFormWrapper(instrument, isAdmin, sectionsHTML);
            }

            const readonlyNotice = !isAdmin ?
                '<div class="form-readonly-notice" role="alert"><i class="fas fa-info-circle" aria-hidden="true"></i> Some fields are read-only based on your permissions</div>' : '';

            return `
                ${readonlyNotice}
                <form id="instrument-update-form" role="form" aria-label="Edit Instrument Form">
                    <input type="hidden" id="edit-instrument-id" value="${instrument.id}">
                    ${sectionsHTML}
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeInstrumentEditModal()">
                            Cancel
                        </button>
                        <button type="submit" class="save-btn">
                            <i class="fas fa-save" aria-hidden="true"></i> Save Changes
                        </button>
                    </div>
                </form>
            `;
        }

        /**
         * Escape HTML to prevent XSS
         * @private
         */
        _escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    }

    // =========================================================================
    // HELPER FUNCTIONS FOR PRI
    // =========================================================================

    /**
     * Handle PRI sensor brand "Other" option
     * @param {HTMLSelectElement} select - Select element
     */
    global.handlePRISensorBrandOther = function(select) {
        const otherInput = document.getElementById('edit-pri-sensor-brand-other');
        if (otherInput) {
            otherInput.style.display = select.value === 'Other' ? 'block' : 'none';
            if (select.value === 'Other') {
                otherInput.focus();
            }
        }
    };

    // =========================================================================
    // EXPORTS
    // =========================================================================

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PRIModal;
    }

    // Export for browser global
    global.PRIModal = PRIModal;

    // Auto-register with InstrumentManager if available
    if (global.InstrumentManager && global.InstrumentManager.registerModule) {
        global.InstrumentManager.registerModule('pri', new PRIModal(global.InstrumentManager));
    }

})(typeof window !== 'undefined' ? window : global);
