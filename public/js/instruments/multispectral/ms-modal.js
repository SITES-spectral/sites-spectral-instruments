/**
 * Multispectral Modal - Type-Specific Modal Builder for MS Instruments
 * SITES Spectral v8.0.0-alpha.2
 *
 * Extends BaseInstrumentModal to provide multispectral-specific:
 * - Sensor specifications section
 * - Channel configuration support
 * - Datalogger settings
 * - Calibration information
 *
 * @module instruments/multispectral/ms-modal
 * @version 8.0.0-alpha.2
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    const ORIENTATION_OPTIONS = [
        { value: '', label: 'Select orientation...' },
        { value: 'uplooking', label: 'Uplooking' },
        { value: 'downlooking', label: 'Downlooking' }
    ];

    const DEFAULT_DATALOGGER = 'Campbell Scientific CR1000X';

    // =========================================================================
    // MULTISPECTRAL MODAL CLASS
    // =========================================================================

    /**
     * Multispectral sensor modal builder
     */
    class MultispectralModal {
        /**
         * Create multispectral modal instance
         * @param {InstrumentManager} manager - Parent manager
         */
        constructor(manager) {
            /** @private - Manager reference */
            this._manager = manager;

            /** @private - Cached configuration */
            this._config = null;

            /** @protected - Category identifier */
            this._category = 'multispectral';
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
         * Build multispectral modal HTML
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
                this._renderSensorSpecsSection(instrument, config),
                this._renderPositionSection(instrument),
                this._renderTimelineSection(instrument),
                this._renderSystemConfigSection(instrument),
                this._renderDocumentationSection(instrument)
            ].join('');

            return this._renderFormWrapper(instrument, isAdmin, sections);
        }

        /**
         * Validate multispectral form data
         * @param {Object} formData - Form data
         * @returns {{valid: boolean, errors: string[]}}
         */
        validate(formData) {
            const errors = [];

            // Validate number of channels
            if (formData.number_of_channels) {
                const channels = parseInt(formData.number_of_channels);
                if (isNaN(channels) || channels < 1 || channels > 8) {
                    errors.push('Number of channels must be between 1 and 8');
                }
            }

            // Validate field of view
            if (formData.field_of_view_degrees) {
                const fov = parseFloat(formData.field_of_view_degrees);
                if (isNaN(fov) || fov < 0 || fov > 180) {
                    errors.push('Field of view must be between 0 and 180 degrees');
                }
            }

            // Validate cable length
            if (formData.cable_length_m) {
                const cable = parseFloat(formData.cable_length_m);
                if (isNaN(cable) || cable < 0) {
                    errors.push('Cable length must be a positive number');
                }
            }

            return {
                valid: errors.length === 0,
                errors
            };
        }

        /**
         * Collect form data from multispectral modal
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

                // MS-specific fields
                sensor_brand: getValue('edit-sensor-brand'),
                sensor_model: getValue('edit-sensor-model'),
                sensor_serial_number: getValue('edit-sensor-serial'),
                orientation: getValue('edit-sensor-orientation'),
                number_of_channels: getValue('edit-number-channels'),
                field_of_view_degrees: getValue('edit-field-of-view'),
                cable_length_m: getValue('edit-cable-length'),
                datalogger_type: getValue('edit-datalogger-type'),
                datalogger_program_normal: getValue('edit-datalogger-program-normal'),
                datalogger_program_calibration: getValue('edit-datalogger-program-calibration'),
                end_date: getValue('edit-end-date'),
                calibration_logs: getValue('edit-calibration-logs')
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
         * Render sensor specifications section
         * @private
         */
        _renderSensorSpecsSection(instrument, config) {
            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-satellite"></i> Sensor Specifications</h4>
                <div class="form-section-content">
                    <div class="form-group">
                        <label>Sensor Brand</label>
                        <input type="text" id="edit-sensor-brand"
                               value="${this._escapeHtml(instrument.sensor_brand || '')}"
                               class="form-control" placeholder="e.g., SKYE, Decagon, Apogee"
                               aria-label="Sensor Brand">
                    </div>
                    <div class="form-group">
                        <label>Sensor Model</label>
                        <input type="text" id="edit-sensor-model"
                               value="${this._escapeHtml(instrument.sensor_model || '')}"
                               class="form-control" placeholder="e.g., SKR 1800, SKR110"
                               aria-label="Sensor Model">
                    </div>
                    <div class="form-group">
                        <label>Sensor Serial Number</label>
                        <input type="text" id="edit-sensor-serial"
                               value="${this._escapeHtml(instrument.sensor_serial_number || '')}"
                               class="form-control" placeholder="Sensor serial number"
                               aria-label="Sensor Serial Number">
                    </div>
                    <div class="form-group">
                        <label>Orientation</label>
                        <select id="edit-sensor-orientation" class="form-control" aria-label="Sensor Orientation">
                            ${ORIENTATION_OPTIONS.map(o =>
                                `<option value="${o.value}" ${instrument.orientation === o.value ? 'selected' : ''}>${o.label}</option>`
                            ).join('')}
                        </select>
                        <small class="form-text">Sensor pointing direction</small>
                    </div>
                    <div class="form-group">
                        <label>Number of Channels</label>
                        <input type="number" id="edit-number-channels"
                               value="${instrument.number_of_channels || ''}"
                               class="form-control" min="1" max="8" placeholder="e.g., 2, 4"
                               aria-label="Number of Channels">
                        <small class="form-text">Spectral bands/wavelengths (typically 2-8)</small>
                    </div>
                    <div class="form-group">
                        <label>Field of View (degrees)</label>
                        <input type="number" id="edit-field-of-view"
                               value="${instrument.field_of_view_degrees || ''}"
                               class="form-control" step="0.1" min="0" max="180" placeholder="e.g., 180"
                               aria-label="Field of View">
                    </div>
                    <div class="form-group">
                        <label>Cable Length (meters)</label>
                        <input type="number" id="edit-cable-length"
                               value="${instrument.cable_length_m || ''}"
                               class="form-control" step="0.1" min="0" placeholder="e.g., 10.0"
                               aria-label="Cable Length">
                    </div>
                    <div class="form-group">
                        <label>Datalogger Type</label>
                        <input type="text" id="edit-datalogger-type"
                               value="${this._escapeHtml(instrument.datalogger_type || DEFAULT_DATALOGGER)}"
                               class="form-control" placeholder="e.g., Campbell Scientific CR1000X"
                               aria-label="Datalogger Type">
                    </div>
                    <div class="form-group">
                        <label>Normal Datalogger Program</label>
                        <input type="text" id="edit-datalogger-program-normal"
                               value="${this._escapeHtml(instrument.datalogger_program_normal || '')}"
                               class="form-control" placeholder="Program name or file path"
                               aria-label="Normal Program">
                        <small class="form-text">Program used for regular measurements</small>
                    </div>
                    <div class="form-group">
                        <label>Calibration Datalogger Program</label>
                        <input type="text" id="edit-datalogger-program-calibration"
                               value="${this._escapeHtml(instrument.datalogger_program_calibration || '')}"
                               class="form-control" placeholder="Program name or file path"
                               aria-label="Calibration Program">
                        <small class="form-text">Program used for calibration procedures</small>
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="date" id="edit-end-date"
                               value="${instrument.end_date || ''}"
                               class="form-control" aria-label="End Date">
                        <small class="form-text">Date sensor was decommissioned (if applicable)</small>
                    </div>
                    <div class="form-group full-width">
                        <label>Calibration Logs</label>
                        <textarea id="edit-calibration-logs" class="form-control" rows="3"
                                  placeholder="Calibration history and notes..."
                                  aria-label="Calibration Logs">${this._escapeHtml(instrument.calibration_logs || '')}</textarea>
                        <small class="form-text">Calibration history, coefficients, and procedures</small>
                    </div>
                    <div class="form-group full-width">
                        <p class="form-text">
                            <i class="fas fa-info-circle"></i> <strong>Channel Management:</strong>
                            Individual spectral channels/bands can be configured after saving.
                            Use the channel manager to define wavelengths, calibration coefficients,
                            and processing parameters for each band.
                        </p>
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
         * @see core/security.js - Delegates to central implementation
         */
        _escapeHtml(str) {
            return global.SitesSecurity?.escapeHtml?.(str) ?? (str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
        }
    }

    // =========================================================================
    // EXPORTS
    // =========================================================================

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MultispectralModal;
    }

    // Export for browser global
    global.MultispectralModal = MultispectralModal;

    // Auto-register with InstrumentManager if available
    if (global.InstrumentManager && global.InstrumentManager.registerModule) {
        global.InstrumentManager.registerModule('multispectral', new MultispectralModal(global.InstrumentManager));
    }

})(typeof window !== 'undefined' ? window : global);
