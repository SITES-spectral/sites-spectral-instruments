/**
 * Hyperspectral Modal - Type-Specific Modal Builder for Hyperspectral Sensors
 * SITES Spectral v11.0.0-alpha.35
 *
 * Extends BaseInstrumentModal to provide hyperspectral-specific:
 * - Spectral range configuration (start/end wavelength)
 * - Spectral resolution (nm)
 * - Number of bands
 * - Imaging resolution
 * - Bit depth
 * - Calibration settings
 *
 * Hyperspectral sensors capture hundreds of contiguous narrow spectral bands
 * for detailed spectral characterization of vegetation and surfaces.
 *
 * @module instruments/hyperspectral/hyperspectral-modal
 * @version 11.0.0-alpha.35
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    const SENSOR_BRANDS = [
        { value: '', label: 'Select brand...' },
        { value: 'Headwall', label: 'Headwall Photonics' },
        { value: 'Specim', label: 'Specim Spectral Imaging' },
        { value: 'HySpex', label: 'HySpex (Norsk Elektro Optikk)' },
        { value: 'AVIRIS', label: 'AVIRIS (NASA/JPL)' },
        { value: 'Resonon', label: 'Resonon' },
        { value: 'Cubert', label: 'Cubert GmbH' },
        { value: 'Corning', label: 'Corning' },
        { value: 'BaySpec', label: 'BaySpec' },
        { value: 'Ocean Insight', label: 'Ocean Insight' },
        { value: 'Custom', label: 'Custom/Research' },
        { value: 'Other', label: 'Other' }
    ];

    const SENSOR_TYPES = [
        { value: '', label: 'Select sensor type...' },
        { value: 'pushbroom', label: 'Pushbroom (Line Scanner)' },
        { value: 'snapshot', label: 'Snapshot (Full-Frame)' },
        { value: 'whiskbroom', label: 'Whiskbroom (Point Scanner)' },
        { value: 'imaging_spectrometer', label: 'Imaging Spectrometer' },
        { value: 'fiber_optic', label: 'Fiber Optic Spectrometer' }
    ];

    const BIT_DEPTH_OPTIONS = [
        { value: '', label: 'Select bit depth...' },
        { value: '8', label: '8-bit (256 levels)' },
        { value: '10', label: '10-bit (1024 levels)' },
        { value: '12', label: '12-bit (4096 levels)' },
        { value: '14', label: '14-bit (16384 levels)' },
        { value: '16', label: '16-bit (65536 levels)' }
    ];

    const VIEWING_DIRECTION_OPTIONS = [
        { value: '', label: 'Select direction...' },
        { value: 'nadir', label: 'Nadir (Down)' },
        { value: 'zenith', label: 'Zenith (Up)' },
        { value: 'oblique', label: 'Oblique (Angled)' },
        { value: 'horizontal', label: 'Horizontal' }
    ];

    const CALIBRATION_METHODS = [
        { value: '', label: 'Select method...' },
        { value: 'factory', label: 'Factory Calibration' },
        { value: 'integrating_sphere', label: 'Integrating Sphere' },
        { value: 'spectralon_panel', label: 'Spectralon Reference Panel' },
        { value: 'cross_calibration', label: 'Cross-Calibration' },
        { value: 'in_situ', label: 'In-Situ Field Calibration' }
    ];

    // =========================================================================
    // HYPERSPECTRAL MODAL CLASS
    // =========================================================================

    /**
     * Hyperspectral sensor modal builder
     */
    class HyperspectralModal {
        /**
         * Create Hyperspectral modal instance
         * @param {InstrumentManager} manager - Parent manager
         */
        constructor(manager) {
            /** @private - Manager reference */
            this._manager = manager;

            /** @private - Cached configuration */
            this._config = null;

            /** @protected - Category identifier */
            this._category = 'hyperspectral';
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
         * Build Hyperspectral modal HTML
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
                this._renderSpectralConfigSection(instrument, config),
                this._renderImagingSection(instrument, config),
                this._renderCalibrationSection(instrument, config),
                this._renderPositionSection(instrument),
                this._renderTimelineSection(instrument),
                this._renderSystemConfigSection(instrument),
                this._renderDocumentationSection(instrument)
            ].join('');

            return this._renderFormWrapper(instrument, isAdmin, sections);
        }

        /**
         * Validate Hyperspectral form data
         * @param {Object} formData - Form data
         * @returns {{valid: boolean, errors: string[]}}
         */
        validate(formData) {
            const errors = [];

            // Validate spectral range start
            if (formData.spectral_range_start_nm) {
                const start = parseFloat(formData.spectral_range_start_nm);
                if (isNaN(start) || start < 200 || start > 2500) {
                    errors.push('Spectral range start must be between 200 and 2500 nm');
                }
            }

            // Validate spectral range end
            if (formData.spectral_range_end_nm) {
                const end = parseFloat(formData.spectral_range_end_nm);
                if (isNaN(end) || end < 200 || end > 2500) {
                    errors.push('Spectral range end must be between 200 and 2500 nm');
                }
            }

            // Validate range order
            if (formData.spectral_range_start_nm && formData.spectral_range_end_nm) {
                const start = parseFloat(formData.spectral_range_start_nm);
                const end = parseFloat(formData.spectral_range_end_nm);
                if (start >= end) {
                    errors.push('Spectral range start must be less than end');
                }
            }

            // Validate spectral resolution
            if (formData.spectral_resolution_nm) {
                const res = parseFloat(formData.spectral_resolution_nm);
                if (isNaN(res) || res < 0.1 || res > 50) {
                    errors.push('Spectral resolution must be between 0.1 and 50 nm');
                }
            }

            // Validate number of bands
            if (formData.number_of_bands) {
                const bands = parseInt(formData.number_of_bands);
                if (isNaN(bands) || bands < 10 || bands > 2000) {
                    errors.push('Number of bands must be between 10 and 2000');
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
         * Collect form data from Hyperspectral modal
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

                // Hyperspectral-specific fields
                sensor_brand: getSelectOrOther('edit-hyp-sensor-brand', 'edit-hyp-sensor-brand-other'),
                sensor_model: getValue('edit-hyp-sensor-model'),
                sensor_serial_number: getValue('edit-hyp-sensor-serial'),
                sensor_type: getValue('edit-hyp-sensor-type'),
                spectral_range_start_nm: getValue('edit-hyp-spectral-start'),
                spectral_range_end_nm: getValue('edit-hyp-spectral-end'),
                spectral_resolution_nm: getValue('edit-hyp-spectral-resolution'),
                spectral_sampling_nm: getValue('edit-hyp-spectral-sampling'),
                number_of_bands: getValue('edit-hyp-number-bands'),
                spatial_resolution_width: getValue('edit-hyp-spatial-width'),
                spatial_resolution_height: getValue('edit-hyp-spatial-height'),
                bit_depth: getValue('edit-hyp-bit-depth'),
                field_of_view_degrees: getValue('edit-hyp-field-of-view'),
                frame_rate_hz: getValue('edit-hyp-frame-rate'),
                integration_time_ms: getValue('edit-hyp-integration-time'),
                calibration_method: getValue('edit-hyp-calibration-method'),
                reference_panel_type: getValue('edit-hyp-reference-panel'),
                dark_current_correction: getValue('edit-hyp-dark-current'),
                datalogger_type: getValue('edit-hyp-datalogger-type'),
                data_format: getValue('edit-hyp-data-format')
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
            const isOtherBrand = instrument.sensor_brand &&
                !SENSOR_BRANDS.some(b => b.value === instrument.sensor_brand);

            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-rainbow"></i> Sensor Hardware</h4>
                <div class="form-section-content">
                    <div class="form-group">
                        <label>Sensor Brand</label>
                        <select id="edit-hyp-sensor-brand" class="form-control" aria-label="Sensor Brand"
                                onchange="handleHyperspectralSensorBrandOther(this)">
                            ${SENSOR_BRANDS.map(b =>
                                `<option value="${b.value}" ${instrument.sensor_brand === b.value ? 'selected' : ''}>${b.label}</option>`
                            ).join('')}
                        </select>
                        <input type="text" id="edit-hyp-sensor-brand-other"
                               value="${isOtherBrand ? this._escapeHtml(instrument.sensor_brand) : ''}"
                               class="form-control mt-2" placeholder="Enter other brand..."
                               style="display: ${isOtherBrand ? 'block' : 'none'};"
                               aria-label="Other Sensor Brand">
                    </div>
                    <div class="form-group">
                        <label>Sensor Model</label>
                        <input type="text" id="edit-hyp-sensor-model"
                               value="${this._escapeHtml(instrument.sensor_model || '')}"
                               class="form-control" placeholder="e.g., Nano-Hyperspec, AISA Eagle II"
                               aria-label="Sensor Model">
                    </div>
                    <div class="form-group">
                        <label>Sensor Serial Number</label>
                        <input type="text" id="edit-hyp-sensor-serial"
                               value="${this._escapeHtml(instrument.sensor_serial_number || '')}"
                               class="form-control" placeholder="Sensor serial number"
                               aria-label="Sensor Serial Number">
                    </div>
                    <div class="form-group">
                        <label>Sensor Type</label>
                        <select id="edit-hyp-sensor-type" class="form-control" aria-label="Sensor Type">
                            ${SENSOR_TYPES.map(t =>
                                `<option value="${t.value}" ${instrument.sensor_type === t.value ? 'selected' : ''}>${t.label}</option>`
                            ).join('')}
                        </select>
                        <small class="form-text">Imaging architecture of the hyperspectral sensor</small>
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Render spectral configuration section
         * @private
         */
        _renderSpectralConfigSection(instrument, config) {
            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-wave-square"></i> Spectral Configuration</h4>
                <div class="form-section-content">
                    <div class="info-callout">
                        <i class="fas fa-info-circle"></i>
                        <p>Hyperspectral sensors capture hundreds of contiguous narrow spectral bands, enabling detailed spectral analysis of vegetation, soil, and water.</p>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Spectral Range Start (nm)</label>
                            <input type="number" id="edit-hyp-spectral-start"
                                   value="${instrument.spectral_range_start_nm || ''}"
                                   class="form-control" step="1" min="200" max="2500"
                                   placeholder="e.g., 400"
                                   aria-label="Spectral Range Start">
                            <small class="form-text">Starting wavelength</small>
                        </div>
                        <div class="form-group">
                            <label>Spectral Range End (nm)</label>
                            <input type="number" id="edit-hyp-spectral-end"
                                   value="${instrument.spectral_range_end_nm || ''}"
                                   class="form-control" step="1" min="200" max="2500"
                                   placeholder="e.g., 1000"
                                   aria-label="Spectral Range End">
                            <small class="form-text">Ending wavelength</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Spectral Resolution (nm)</label>
                            <input type="number" id="edit-hyp-spectral-resolution"
                                   value="${instrument.spectral_resolution_nm || ''}"
                                   class="form-control" step="0.1" min="0.1" max="50"
                                   placeholder="e.g., 2.8"
                                   aria-label="Spectral Resolution">
                            <small class="form-text">FWHM of individual bands</small>
                        </div>
                        <div class="form-group">
                            <label>Spectral Sampling (nm)</label>
                            <input type="number" id="edit-hyp-spectral-sampling"
                                   value="${instrument.spectral_sampling_nm || ''}"
                                   class="form-control" step="0.1" min="0.1" max="50"
                                   placeholder="e.g., 2.0"
                                   aria-label="Spectral Sampling">
                            <small class="form-text">Wavelength increment between bands</small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Number of Spectral Bands</label>
                        <input type="number" id="edit-hyp-number-bands"
                               value="${instrument.number_of_bands || ''}"
                               class="form-control" step="1" min="10" max="2000"
                               placeholder="e.g., 270"
                               aria-label="Number of Bands">
                        <small class="form-text">Total number of discrete spectral bands</small>
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Render imaging specifications section
         * @private
         */
        _renderImagingSection(instrument, config) {
            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-image"></i> Imaging Specifications</h4>
                <div class="form-section-content">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Spatial Width (pixels)</label>
                            <input type="number" id="edit-hyp-spatial-width"
                                   value="${instrument.spatial_resolution_width || ''}"
                                   class="form-control" step="1" min="1" max="20000"
                                   placeholder="e.g., 640"
                                   aria-label="Spatial Width">
                        </div>
                        <div class="form-group">
                            <label>Spatial Height (pixels)</label>
                            <input type="number" id="edit-hyp-spatial-height"
                                   value="${instrument.spatial_resolution_height || ''}"
                                   class="form-control" step="1" min="1" max="20000"
                                   placeholder="e.g., 480"
                                   aria-label="Spatial Height">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Bit Depth</label>
                        <select id="edit-hyp-bit-depth" class="form-control" aria-label="Bit Depth">
                            ${BIT_DEPTH_OPTIONS.map(b =>
                                `<option value="${b.value}" ${instrument.bit_depth === b.value ? 'selected' : ''}>${b.label}</option>`
                            ).join('')}
                        </select>
                        <small class="form-text">Radiometric resolution per band</small>
                    </div>
                    <div class="form-group">
                        <label>Field of View (degrees)</label>
                        <input type="number" id="edit-hyp-field-of-view"
                               value="${instrument.field_of_view_degrees || ''}"
                               class="form-control" step="0.1" min="0" max="180"
                               placeholder="e.g., 16"
                               aria-label="Field of View">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Frame Rate (Hz)</label>
                            <input type="number" id="edit-hyp-frame-rate"
                                   value="${instrument.frame_rate_hz || ''}"
                                   class="form-control" step="0.1" min="0" max="1000"
                                   placeholder="e.g., 100"
                                   aria-label="Frame Rate">
                            <small class="form-text">For pushbroom/line scanners</small>
                        </div>
                        <div class="form-group">
                            <label>Integration Time (ms)</label>
                            <input type="number" id="edit-hyp-integration-time"
                                   value="${instrument.integration_time_ms || ''}"
                                   class="form-control" step="0.1" min="0" max="10000"
                                   placeholder="e.g., 10"
                                   aria-label="Integration Time">
                            <small class="form-text">Exposure time per frame</small>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Render calibration section
         * @private
         */
        _renderCalibrationSection(instrument, config) {
            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-balance-scale"></i> Calibration & Data</h4>
                <div class="form-section-content">
                    <div class="form-group">
                        <label>Calibration Method</label>
                        <select id="edit-hyp-calibration-method" class="form-control" aria-label="Calibration Method">
                            ${CALIBRATION_METHODS.map(m =>
                                `<option value="${m.value}" ${instrument.calibration_method === m.value ? 'selected' : ''}>${m.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Reference Panel Type</label>
                        <input type="text" id="edit-hyp-reference-panel"
                               value="${this._escapeHtml(instrument.reference_panel_type || '')}"
                               class="form-control" placeholder="e.g., Spectralon 99%, Labsphere"
                               aria-label="Reference Panel Type">
                        <small class="form-text">Type of reflectance reference used</small>
                    </div>
                    <div class="form-group">
                        <label id="dark-current-label">Dark Current Correction</label>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <label class="toggle-switch">
                                <input type="checkbox" id="edit-hyp-dark-current"
                                       ${instrument.dark_current_correction ? 'checked' : ''}
                                       aria-labelledby="dark-current-label">
                                <span class="toggle-slider"></span>
                            </label>
                            <span>${instrument.dark_current_correction ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Data Format</label>
                        <input type="text" id="edit-hyp-data-format"
                               value="${this._escapeHtml(instrument.data_format || '')}"
                               class="form-control" placeholder="e.g., ENVI BSQ, GeoTIFF, HDF5"
                               aria-label="Data Format">
                        <small class="form-text">Output data cube format</small>
                    </div>
                    <div class="form-group">
                        <label>Datalogger/Computer</label>
                        <input type="text" id="edit-hyp-datalogger-type"
                               value="${this._escapeHtml(instrument.datalogger_type || '')}"
                               class="form-control" placeholder="e.g., Embedded PC, NUC"
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
         * @see core/security.js - Delegates to central implementation
         */
        _escapeHtml(str) {
            return global.SitesSecurity?.escapeHtml?.(str) ?? (str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
        }
    }

    // =========================================================================
    // HELPER FUNCTIONS FOR HYPERSPECTRAL
    // =========================================================================

    /**
     * Handle Hyperspectral sensor brand "Other" option
     * @param {HTMLSelectElement} select - Select element
     */
    global.handleHyperspectralSensorBrandOther = function(select) {
        const otherInput = document.getElementById('edit-hyp-sensor-brand-other');
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
        module.exports = HyperspectralModal;
    }

    // Export for browser global
    global.HyperspectralModal = HyperspectralModal;

    // Auto-register with InstrumentManager if available
    if (global.InstrumentManager && global.InstrumentManager.registerModule) {
        global.InstrumentManager.registerModule('hyperspectral', new HyperspectralModal(global.InstrumentManager));
    }

})(typeof window !== 'undefined' ? window : global);
