/**
 * Phenocam Modal - Type-Specific Modal Builder for Phenocam Instruments
 * SITES Spectral v8.0.0-alpha.2
 *
 * Extends BaseInstrumentModal to provide phenocam-specific:
 * - Camera specifications section
 * - Phenocam processing section (archive path)
 * - ROI management integration
 * - Image preview capability
 *
 * @module instruments/phenocam/phenocam-modal
 * @version 8.0.0-alpha.2
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    const STANDARD_BRANDS = ['Mobotix', 'Axis', 'Canon', 'Nikon', 'Sony'];

    const STANDARD_RESOLUTIONS = [
        { value: '4096x3072', label: '4096x3072 (12MP)' },
        { value: '3264x2448', label: '3264x2448 (8MP)' },
        { value: '2592x1944', label: '2592x1944 (5MP)' },
        { value: '2048x1536', label: '2048x1536 (3MP)' },
        { value: '1920x1080', label: '1920x1080 (2MP/FHD)' }
    ];

    const APERTURE_OPTIONS = [
        { value: '', label: 'Select aperture...' },
        { value: 'f/1.4', label: 'f/1.4' },
        { value: 'f/1.8', label: 'f/1.8' },
        { value: 'f/2.0', label: 'f/2.0' },
        { value: 'f/2.8', label: 'f/2.8' },
        { value: 'f/4.0', label: 'f/4.0' },
        { value: 'f/5.6', label: 'f/5.6' },
        { value: 'f/8.0', label: 'f/8.0' },
        { value: 'Auto', label: 'Auto' }
    ];

    const ISO_OPTIONS = [
        { value: '', label: 'Select ISO...' },
        { value: '100', label: '100' },
        { value: '200', label: '200' },
        { value: '400', label: '400' },
        { value: '800', label: '800' },
        { value: '1600', label: '1600' },
        { value: '3200', label: '3200' },
        { value: 'Auto', label: 'Auto' }
    ];

    const WHITE_BALANCE_OPTIONS = [
        { value: '', label: 'Select white balance...' },
        { value: 'Auto', label: 'Auto' },
        { value: 'Daylight', label: 'Daylight' },
        { value: 'Cloudy', label: 'Cloudy' },
        { value: 'Shade', label: 'Shade' },
        { value: 'Tungsten', label: 'Tungsten' },
        { value: 'Fluorescent', label: 'Fluorescent' },
        { value: 'Custom', label: 'Custom' }
    ];

    // =========================================================================
    // PHENOCAM MODAL CLASS
    // =========================================================================

    /**
     * Phenocam-specific modal builder
     * @extends BaseInstrumentModal
     */
    class PhenocamModal {
        /**
         * Create phenocam modal instance
         * @param {InstrumentManager} manager - Parent manager
         */
        constructor(manager) {
            /** @private - Manager reference */
            this._manager = manager;

            /** @private - Cached configuration */
            this._config = null;

            /** @protected - Category identifier */
            this._category = 'phenocam';
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
         * Build phenocam modal HTML
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
                this._renderCameraSpecsSection(instrument, config),
                this._renderPositionSection(instrument),
                this._renderTimelineSection(instrument),
                this._renderSystemConfigSection(instrument),
                this._renderPhenocamProcessingSection(instrument),
                this._renderDocumentationSection(instrument)
            ].join('');

            return this._renderFormWrapper(instrument, isAdmin, sections);
        }

        /**
         * Validate phenocam form data
         * @param {Object} formData - Form data
         * @returns {{valid: boolean, errors: string[]}}
         */
        validate(formData) {
            const errors = [];

            // Validate camera-specific fields
            if (formData.camera_mega_pixels) {
                const mp = parseFloat(formData.camera_mega_pixels);
                if (isNaN(mp) || mp < 0 || mp > 200) {
                    errors.push('Camera megapixels must be between 0 and 200');
                }
            }

            if (formData.camera_focal_length_mm) {
                const fl = parseFloat(formData.camera_focal_length_mm);
                if (isNaN(fl) || fl < 0 || fl > 2000) {
                    errors.push('Focal length must be between 0 and 2000 mm');
                }
            }

            // Validate archive path format
            if (formData.image_archive_path) {
                const path = formData.image_archive_path;
                if (!path.startsWith('/') || !path.endsWith('/')) {
                    errors.push('Archive path must start and end with /');
                }
            }

            return {
                valid: errors.length === 0,
                errors
            };
        }

        /**
         * Collect form data from phenocam modal
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

                // Camera-specific fields
                camera_brand: getSelectOrOther('edit-instrument-camera-brand', 'edit-instrument-camera-brand-other'),
                camera_model: getValue('edit-instrument-camera-model'),
                camera_serial_number: getValue('edit-instrument-camera-serial'),
                camera_resolution: getSelectOrOther('edit-instrument-camera-resolution', 'edit-instrument-camera-resolution-other'),
                camera_mega_pixels: getValue('edit-instrument-camera-megapixels'),
                camera_lens: getValue('edit-instrument-camera-lens'),
                camera_focal_length_mm: getValue('edit-instrument-camera-focal-length'),
                camera_aperture: getValue('edit-instrument-camera-aperture'),
                camera_exposure_time: getValue('edit-instrument-camera-exposure'),
                camera_iso: getValue('edit-instrument-camera-iso'),
                camera_white_balance: getValue('edit-instrument-camera-wb'),

                // Phenocam processing
                image_archive_path: getValue('edit-instrument-archive-path')
            };

            return data;
        }

        // =====================================================================
        // SECTION RENDERERS
        // =====================================================================

        /**
         * Render general info section (uses shared ModalSections)
         * @private
         */
        _renderGeneralInfoSection(instrument) {
            const MS = global.ModalSections;
            if (MS && MS.renderGeneralInfoSection) {
                return MS.renderGeneralInfoSection(instrument);
            }
            // Fallback
            return this._renderGenericGeneralInfo(instrument);
        }

        /**
         * Render camera specifications section
         * @private
         */
        _renderCameraSpecsSection(instrument, config) {
            // Determine if current values are "Other"
            const isOtherBrand = instrument.camera_brand &&
                !STANDARD_BRANDS.includes(instrument.camera_brand);
            const standardResValues = STANDARD_RESOLUTIONS.map(r => r.value);
            const isOtherResolution = instrument.camera_resolution &&
                !standardResValues.includes(instrument.camera_resolution);

            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-camera"></i> Camera Specifications</h4>
                <div class="form-section-content">
                    <div class="form-group">
                        <label>Camera Brand</label>
                        <select id="edit-instrument-camera-brand" class="form-control" aria-label="Camera Brand"
                                onchange="handleCameraBrandOther(this)">
                            <option value="">Select brand...</option>
                            ${STANDARD_BRANDS.map(b =>
                                `<option value="${b}" ${instrument.camera_brand === b ? 'selected' : ''}>${b}</option>`
                            ).join('')}
                            <option value="Other" ${isOtherBrand ? 'selected' : ''}>Other</option>
                        </select>
                        <input type="text" id="edit-instrument-camera-brand-other"
                               value="${isOtherBrand ? this._escapeHtml(instrument.camera_brand) : ''}"
                               class="form-control mt-2" placeholder="Enter other brand..."
                               style="display: ${isOtherBrand ? 'block' : 'none'};"
                               aria-label="Other Camera Brand">
                    </div>
                    <div class="form-group">
                        <label>Camera Model</label>
                        <input type="text" id="edit-instrument-camera-model"
                               value="${this._escapeHtml(instrument.camera_model || '')}"
                               class="form-control" placeholder="e.g., M16B, P1437-E" aria-label="Camera Model">
                    </div>
                    <div class="form-group">
                        <label>Serial Number</label>
                        <input type="text" id="edit-instrument-camera-serial"
                               value="${this._escapeHtml(instrument.camera_serial_number || '')}"
                               class="form-control" placeholder="Camera serial number" aria-label="Camera Serial Number">
                    </div>
                    <div class="form-group">
                        <label>Resolution</label>
                        <select id="edit-instrument-camera-resolution" class="form-control" aria-label="Camera Resolution"
                                onchange="handleCameraResolutionOther(this)">
                            <option value="">Select resolution...</option>
                            ${STANDARD_RESOLUTIONS.map(r =>
                                `<option value="${r.value}" ${instrument.camera_resolution === r.value ? 'selected' : ''}>${r.label}</option>`
                            ).join('')}
                            <option value="Other" ${isOtherResolution ? 'selected' : ''}>Other</option>
                        </select>
                        <input type="text" id="edit-instrument-camera-resolution-other"
                               value="${isOtherResolution ? this._escapeHtml(instrument.camera_resolution) : ''}"
                               class="form-control mt-2" placeholder="e.g., 5472x3648"
                               style="display: ${isOtherResolution ? 'block' : 'none'};"
                               aria-label="Other Camera Resolution">
                    </div>
                    <div class="form-group">
                        <label>Mega Pixels</label>
                        <input type="number" id="edit-instrument-camera-megapixels"
                               value="${instrument.camera_mega_pixels || ''}"
                               class="form-control" step="0.1" min="0" placeholder="e.g., 12.3" aria-label="Camera Megapixels">
                    </div>
                    <div class="form-group">
                        <label>Lens</label>
                        <input type="text" id="edit-instrument-camera-lens"
                               value="${this._escapeHtml(instrument.camera_lens || '')}"
                               class="form-control" placeholder="e.g., 18-55mm f/3.5-5.6" aria-label="Camera Lens">
                    </div>
                    <div class="form-group">
                        <label>Focal Length (mm)</label>
                        <input type="number" id="edit-instrument-camera-focal-length"
                               value="${instrument.camera_focal_length_mm || ''}"
                               class="form-control" step="0.1" min="0" placeholder="e.g., 50" aria-label="Camera Focal Length">
                    </div>
                    <div class="form-group">
                        <label>Aperture (f-stop)</label>
                        <select id="edit-instrument-camera-aperture" class="form-control" aria-label="Camera Aperture">
                            ${APERTURE_OPTIONS.map(o =>
                                `<option value="${o.value}" ${instrument.camera_aperture === o.value ? 'selected' : ''}>${o.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Exposure Time</label>
                        <input type="text" id="edit-instrument-camera-exposure"
                               value="${this._escapeHtml(instrument.camera_exposure_time || '')}"
                               class="form-control" placeholder="e.g., 1/250s, Auto" aria-label="Camera Exposure Time">
                        <small class="form-text">Format: 1/250s or Auto</small>
                    </div>
                    <div class="form-group">
                        <label>ISO</label>
                        <select id="edit-instrument-camera-iso" class="form-control" aria-label="Camera ISO">
                            ${ISO_OPTIONS.map(o =>
                                `<option value="${o.value}" ${instrument.camera_iso === o.value ? 'selected' : ''}>${o.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>White Balance</label>
                        <select id="edit-instrument-camera-wb" class="form-control" aria-label="Camera White Balance">
                            ${WHITE_BALANCE_OPTIONS.map(o =>
                                `<option value="${o.value}" ${instrument.camera_white_balance === o.value ? 'selected' : ''}>${o.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Render position section (uses shared ModalSections)
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
         * Render timeline section (uses shared ModalSections)
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
         * Render system config section (uses shared ModalSections)
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
         * Render phenocam processing section
         * @private
         */
        _renderPhenocamProcessingSection(instrument) {
            const MS = global.ModalSections;
            if (MS && MS.renderPhenocamProcessingSection) {
                return MS.renderPhenocamProcessingSection(instrument);
            }

            // Fallback implementation
            const hasArchivePath = !!instrument.image_archive_path;

            return `
            <div class="form-section">
                <h4 onclick="toggleSection(this)"><i class="fas fa-tree"></i> Phenocam Processing</h4>
                <div class="form-section-content">
                    <div class="form-group full-width">
                        <label id="phenocam-processing-label">Enable Phenocam Data Processing</label>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <label class="toggle-switch">
                                <input type="checkbox" id="phenocam-processing-toggle"
                                       ${hasArchivePath ? 'checked' : ''}
                                       onchange="togglePhenocamSection(this)"
                                       aria-labelledby="phenocam-processing-label">
                                <span class="toggle-slider"></span>
                            </label>
                            <span id="phenocam-processing-status">${hasArchivePath ? 'Phenocam processing enabled' : 'Phenocam processing disabled'}</span>
                        </div>
                        <div id="phenocam-archive-section" class="progressive-section ${hasArchivePath ? 'active' : ''}"
                             ${hasArchivePath ? '' : 'aria-hidden="true"'}>
                            <label for="edit-instrument-archive-path">Image Archive Path</label>
                            <input type="text" id="edit-instrument-archive-path"
                                   value="${this._escapeHtml(instrument.image_archive_path || '')}"
                                   class="form-control" placeholder="/path/to/archive/STATION/INSTRUMENT/"
                                   pattern="^/.*/$" aria-describedby="archive-path-help">
                            <small class="form-text" id="archive-path-help">Path must start with / and end with /</small>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }

        /**
         * Render documentation section (uses shared ModalSections)
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
                        <input type="text" id="edit-instrument-name" value="${this._escapeHtml(instrument.display_name)}"
                               class="form-control" required aria-label="Instrument Name">
                    </div>
                    <div class="form-group">
                        <label>Normalized ID</label>
                        <input type="text" id="edit-instrument-normalized" value="${this._escapeHtml(instrument.normalized_name)}"
                               class="form-control field-readonly" readonly aria-label="Normalized ID" tabindex="-1">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="edit-instrument-status" class="form-control" aria-label="Status">
                            <option value="Active" ${instrument.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${instrument.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Testing" ${instrument.status === 'Testing' ? 'selected' : ''}>Testing</option>
                            <option value="Maintenance" ${instrument.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                            <option value="Decommissioned" ${instrument.status === 'Decommissioned' ? 'selected' : ''}>Decommissioned</option>
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

            // Fallback
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
    // HELPER FUNCTIONS FOR PHENOCAM
    // =========================================================================

    /**
     * Handle camera brand "Other" option
     * @param {HTMLSelectElement} select - Select element
     */
    global.handleCameraBrandOther = function(select) {
        const otherInput = document.getElementById('edit-instrument-camera-brand-other');
        if (otherInput) {
            otherInput.style.display = select.value === 'Other' ? 'block' : 'none';
            if (select.value === 'Other') {
                otherInput.focus();
            }
        }
    };

    /**
     * Handle camera resolution "Other" option
     * @param {HTMLSelectElement} select - Select element
     */
    global.handleCameraResolutionOther = function(select) {
        const otherInput = document.getElementById('edit-instrument-camera-resolution-other');
        if (otherInput) {
            otherInput.style.display = select.value === 'Other' ? 'block' : 'none';
            if (select.value === 'Other') {
                otherInput.focus();
            }
        }
    };

    /**
     * Toggle phenocam processing section visibility
     * @param {HTMLInputElement} checkbox - Checkbox element
     */
    global.togglePhenocamSection = function(checkbox) {
        const section = document.getElementById('phenocam-archive-section');
        const status = document.getElementById('phenocam-processing-status');

        if (section) {
            section.classList.toggle('active', checkbox.checked);
            section.setAttribute('aria-hidden', !checkbox.checked);
        }

        if (status) {
            status.textContent = checkbox.checked ?
                'Phenocam processing enabled' :
                'Phenocam processing disabled';
        }
    };

    // =========================================================================
    // EXPORTS
    // =========================================================================

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PhenocamModal;
    }

    // Export for browser global
    global.PhenocamModal = PhenocamModal;

    // Auto-register with InstrumentManager if available
    if (global.InstrumentManager && global.InstrumentManager.registerModule) {
        global.InstrumentManager.registerModule('phenocam', new PhenocamModal(global.InstrumentManager));
    }

})(typeof window !== 'undefined' ? window : global);
