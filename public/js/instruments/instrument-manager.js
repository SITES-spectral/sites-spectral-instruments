/**
 * Instrument Manager - Central Orchestrator for Instrument Modals
 * SITES Spectral v8.0.0-alpha.2
 *
 * Provides a unified API for:
 * - Loading instrument type configurations from YAML
 * - Routing to correct modal builder per instrument type
 * - Managing CRUD operations across all instrument types
 * - Reactive validation with user-friendly messages
 *
 * @module instruments/instrument-manager
 * @version 8.0.0-alpha.2
 */

(function(global) {
    'use strict';

    // =========================================================================
    // INSTRUMENT TYPE REGISTRY
    // =========================================================================

    /**
     * Registry of instrument types and their module paths
     * @type {Map<string, Object>}
     */
    const INSTRUMENT_TYPES = new Map([
        ['phenocam', {
            category: 'phenocam',
            configPath: 'instruments/phenocam',
            icon: 'fa-camera',
            displayName: 'Phenocam',
            moduleClass: 'PhenocamModal'
        }],
        ['multispectral', {
            category: 'multispectral',
            configPath: 'instruments/multispectral',
            icon: 'fa-satellite',
            displayName: 'Multispectral Sensor',
            moduleClass: 'MultispectralModal'
        }],
        ['par', {
            category: 'par',
            configPath: 'instruments/par',
            icon: 'fa-sun',
            displayName: 'PAR Sensor',
            moduleClass: 'PARModal'
        }],
        ['ndvi', {
            category: 'ndvi',
            configPath: 'instruments/ndvi',
            icon: 'fa-leaf',
            displayName: 'NDVI Sensor',
            moduleClass: 'NDVIModal'
        }],
        ['pri', {
            category: 'pri',
            configPath: 'instruments/pri',
            icon: 'fa-microscope',
            displayName: 'PRI Sensor',
            moduleClass: 'PRIModal'
        }],
        ['hyperspectral', {
            category: 'hyperspectral',
            configPath: 'instruments/hyperspectral',
            icon: 'fa-rainbow',
            displayName: 'Hyperspectral Sensor',
            moduleClass: 'HyperspectralModal'
        }]
    ]);

    /**
     * Detection patterns for instrument type classification
     */
    const DETECTION_PATTERNS = {
        phenocam: ['phenocam', 'camera', 'phe'],
        hyperspectral: ['hyperspectral', 'hyp'],
        multispectral: ['multispectral', 'skye', 'decagon', 'apogee ms', 'ms sensor'],
        par: ['par', 'photosynthetically active'],
        ndvi: ['ndvi'],
        pri: ['pri', '530', '570']
    };

    // =========================================================================
    // INSTRUMENT MANAGER CLASS
    // =========================================================================

    /**
     * Central manager for instrument modals and operations
     */
    class InstrumentManager {
        /**
         * Create instrument manager instance
         */
        constructor() {
            /** @private - Cached configurations */
            this._configs = new Map();

            /** @private - Loaded modal modules */
            this._modules = new Map();

            /** @private - Shared sections configuration */
            this._sharedSections = null;

            /** @private - Config loader reference */
            this._configLoader = null;

            /** @private - Initialization state */
            this._initialized = false;

            /** @private - Event listeners */
            this._listeners = new Map();
        }

        /**
         * Initialize the instrument manager
         * @returns {Promise<void>}
         */
        async initialize() {
            if (this._initialized) {
                return;
            }

            // Get config loader reference
            this._configLoader = global.ConfigLoader;

            if (!this._configLoader) {
                throw new Error('ConfigLoader not available. Ensure core/config-loader.js is loaded first.');
            }

            // Load shared sections configuration
            try {
                this._sharedSections = await this._configLoader.get('sections/shared');
                console.log('[InstrumentManager] Loaded shared sections configuration');
            } catch (error) {
                console.warn('[InstrumentManager] Failed to load shared sections:', error);
                this._sharedSections = {};
            }

            this._initialized = true;
            this._emit('initialized');
            console.log('[InstrumentManager] Initialized successfully');
        }

        /**
         * Detect instrument category from type string
         * @param {string} instrumentType - The instrument type string
         * @returns {string} Category name
         */
        getCategory(instrumentType) {
            if (!instrumentType) return 'other';

            const type = instrumentType.toLowerCase();

            // Check patterns in order (hyperspectral before multispectral to avoid false match)
            const checkOrder = ['phenocam', 'hyperspectral', 'multispectral', 'par', 'ndvi', 'pri'];

            for (const category of checkOrder) {
                const patterns = DETECTION_PATTERNS[category];
                for (const pattern of patterns) {
                    if (type.includes(pattern)) {
                        return category;
                    }
                }
            }

            return 'other';
        }

        /**
         * Get type metadata
         * @param {string} category - Instrument category
         * @returns {Object|null} Type metadata
         */
        getTypeMetadata(category) {
            return INSTRUMENT_TYPES.get(category) || null;
        }

        /**
         * Get configuration for instrument type
         * @param {string} category - Instrument category
         * @returns {Promise<Object>} Configuration object
         */
        async getConfig(category) {
            // Check cache
            if (this._configs.has(category)) {
                return this._configs.get(category);
            }

            const typeInfo = INSTRUMENT_TYPES.get(category);
            if (!typeInfo) {
                console.warn(`[InstrumentManager] Unknown instrument category: ${category}`);
                return null;
            }

            try {
                const config = await this._configLoader.get(typeInfo.configPath);
                this._configs.set(category, config);
                return config;
            } catch (error) {
                console.error(`[InstrumentManager] Failed to load config for ${category}:`, error);
                return null;
            }
        }

        /**
         * Get shared sections configuration
         * @returns {Object} Shared sections config
         */
        getSharedSections() {
            return this._sharedSections || {};
        }

        /**
         * Get modal module for instrument type
         * @param {string} category - Instrument category
         * @returns {Object|null} Modal module instance
         */
        getModule(category) {
            const typeInfo = INSTRUMENT_TYPES.get(category);
            if (!typeInfo) {
                return null;
            }

            // Try to get registered module
            if (this._modules.has(category)) {
                return this._modules.get(category);
            }

            // Try to get from global scope
            const moduleClass = global[typeInfo.moduleClass];
            if (moduleClass) {
                const instance = new moduleClass(this);
                this._modules.set(category, instance);
                return instance;
            }

            return null;
        }

        /**
         * Register a modal module
         * @param {string} category - Instrument category
         * @param {Object} module - Modal module instance
         */
        registerModule(category, module) {
            this._modules.set(category, module);
            console.log(`[InstrumentManager] Registered module for ${category}`);
        }

        /**
         * Build modal HTML for instrument
         * @param {Object} instrument - Instrument data
         * @param {boolean} isAdmin - Admin mode flag
         * @returns {Promise<string>} Modal HTML
         */
        async buildModal(instrument, isAdmin = false) {
            const category = this.getCategory(instrument.instrument_type);
            const module = this.getModule(category);

            if (module && typeof module.build === 'function') {
                return await module.build(instrument, isAdmin);
            }

            // Fallback to legacy modal builders if available
            const legacyBuilder = this._getLegacyBuilder(category);
            if (legacyBuilder) {
                return legacyBuilder(instrument, isAdmin);
            }

            console.warn(`[InstrumentManager] No modal builder for category: ${category}`);
            return this._buildGenericModal(instrument, isAdmin);
        }

        /**
         * Save instrument changes
         * @param {string} instrumentId - Instrument ID
         * @param {Object} formData - Form data
         * @returns {Promise<Object>} Save result
         */
        async save(instrumentId, formData) {
            const category = this.getCategory(formData.instrument_type);
            const module = this.getModule(category);

            // Run type-specific validation
            if (module && typeof module.validate === 'function') {
                const validationResult = module.validate(formData);
                if (!validationResult.valid) {
                    return {
                        success: false,
                        errors: validationResult.errors
                    };
                }
            }

            // Run shared validation
            const sharedValidation = this.validateSharedFields(formData);
            if (!sharedValidation.valid) {
                return {
                    success: false,
                    errors: sharedValidation.errors
                };
            }

            // Emit pre-save event
            this._emit('preSave', { instrumentId, formData, category });

            // Perform save via API (delegate to caller or API module)
            // This returns the data to be saved; actual API call is external
            return {
                success: true,
                data: formData,
                category
            };
        }

        /**
         * Validate shared fields
         * @param {Object} formData - Form data
         * @returns {{valid: boolean, errors: string[]}}
         */
        validateSharedFields(formData) {
            const errors = [];

            // Required field: display_name
            if (!formData.display_name || formData.display_name.trim() === '') {
                errors.push('Instrument name is required');
            }

            // Latitude validation
            if (formData.latitude !== null && formData.latitude !== undefined && formData.latitude !== '') {
                const lat = parseFloat(formData.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    errors.push('Latitude must be between -90 and 90');
                }
            }

            // Longitude validation
            if (formData.longitude !== null && formData.longitude !== undefined && formData.longitude !== '') {
                const lon = parseFloat(formData.longitude);
                if (isNaN(lon) || lon < -180 || lon > 180) {
                    errors.push('Longitude must be between -180 and 180');
                }
            }

            // Quality score validation
            if (formData.image_quality_score !== undefined) {
                const score = parseInt(formData.image_quality_score);
                if (isNaN(score) || score < 0 || score > 100) {
                    errors.push('Quality score must be between 0 and 100');
                }
            }

            return {
                valid: errors.length === 0,
                errors
            };
        }

        /**
         * Get form data from modal
         * @param {string} category - Instrument category
         * @returns {Object} Form data
         */
        collectFormData(category) {
            const module = this.getModule(category);

            if (module && typeof module.collectFormData === 'function') {
                return module.collectFormData();
            }

            // Fallback to generic collection
            return this._collectGenericFormData();
        }

        /**
         * Get list of all supported instrument types
         * @returns {Array<Object>} List of type metadata
         */
        getSupportedTypes() {
            const types = [];
            for (const [category, metadata] of INSTRUMENT_TYPES) {
                types.push({
                    category,
                    ...metadata
                });
            }
            return types;
        }

        /**
         * Check if instrument type is supported
         * @param {string} category - Instrument category
         * @returns {boolean}
         */
        isSupported(category) {
            return INSTRUMENT_TYPES.has(category);
        }

        /**
         * Subscribe to events
         * @param {string} event - Event name
         * @param {Function} callback - Callback function
         * @returns {Function} Unsubscribe function
         */
        on(event, callback) {
            if (!this._listeners.has(event)) {
                this._listeners.set(event, []);
            }
            this._listeners.get(event).push(callback);

            return () => this.off(event, callback);
        }

        /**
         * Unsubscribe from events
         * @param {string} event - Event name
         * @param {Function} callback - Callback function
         */
        off(event, callback) {
            if (!this._listeners.has(event)) return;
            const callbacks = this._listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) callbacks.splice(index, 1);
        }

        /**
         * Emit event
         * @private
         * @param {string} event - Event name
         * @param {*} data - Event data
         */
        _emit(event, data) {
            if (!this._listeners.has(event)) return;
            for (const callback of this._listeners.get(event)) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[InstrumentManager] Error in event listener for ${event}:`, error);
                }
            }
        }

        /**
         * Get legacy modal builder function
         * @private
         * @param {string} category - Instrument category
         * @returns {Function|null}
         */
        _getLegacyBuilder(category) {
            const builderMap = {
                'phenocam': global.buildPhenocamModalHTML || global.renderPhenocamEditForm,
                'multispectral': global.buildMSSensorModalHTML || global.renderMSSensorEditForm,
                'par': global.buildPARSensorModalHTML || global.renderPARSensorEditForm,
                'ndvi': global.buildNDVISensorModalHTML || global.renderNDVISensorEditForm,
                'pri': global.buildPRISensorModalHTML || global.renderPRISensorEditForm,
                'hyperspectral': global.buildHyperspectralModalHTML || global.renderHyperspectralEditForm
            };
            return builderMap[category] || null;
        }

        /**
         * Build generic modal for unknown types
         * @private
         * @param {Object} instrument - Instrument data
         * @param {boolean} isAdmin - Admin mode flag
         * @returns {string} Modal HTML
         */
        _buildGenericModal(instrument, isAdmin) {
            const MS = global.ModalSections;
            if (!MS) {
                return '<div class="error">Modal sections not available</div>';
            }

            const sections = [
                MS.renderGeneralInfoSection(instrument),
                MS.renderPositionSection(instrument),
                MS.renderTimelineSection(instrument),
                MS.renderSystemConfigSection(instrument),
                MS.renderDocumentationSection(instrument)
            ].join('');

            return MS.renderFormWrapper(instrument, isAdmin, sections);
        }

        /**
         * Collect form data generically
         * @private
         * @returns {Object} Form data
         */
        _collectGenericFormData() {
            const getValue = (id) => {
                const el = document.getElementById(id);
                if (!el) return null;
                if (el.type === 'checkbox') return el.checked;
                return el.value || null;
            };

            return {
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
                ecosystem_code: getValue('edit-instrument-ecosystem'),
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
                maintenance_notes: getValue('edit-instrument-maintenance-notes')
            };
        }
    }

    // =========================================================================
    // BASE MODAL CLASS
    // =========================================================================

    /**
     * Base class for instrument modal modules
     * All instrument-specific modals should extend this class
     */
    class BaseInstrumentModal {
        /**
         * Create base modal instance
         * @param {InstrumentManager} manager - Parent manager
         */
        constructor(manager) {
            /** @protected - Manager reference */
            this._manager = manager;

            /** @protected - Cached configuration */
            this._config = null;

            /** @protected - Category identifier */
            this._category = 'other';
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
         * Build modal HTML (must be overridden)
         * @param {Object} instrument - Instrument data
         * @param {boolean} isAdmin - Admin mode flag
         * @returns {Promise<string>} Modal HTML
         */
        async build(instrument, isAdmin) {
            throw new Error('build() must be implemented by subclass');
        }

        /**
         * Validate form data (can be overridden)
         * @param {Object} formData - Form data
         * @returns {{valid: boolean, errors: string[]}}
         */
        validate(formData) {
            return { valid: true, errors: [] };
        }

        /**
         * Collect form data (can be overridden)
         * @returns {Object} Form data
         */
        collectFormData() {
            return this._manager._collectGenericFormData();
        }

        /**
         * Render a field based on configuration
         * @protected
         * @param {string} fieldName - Field name
         * @param {Object} fieldConfig - Field configuration
         * @param {*} value - Current value
         * @returns {string} Field HTML
         */
        _renderField(fieldName, fieldConfig, value) {
            const id = fieldConfig.field_id || `edit-${fieldName.replace(/_/g, '-')}`;
            const label = fieldConfig.label || fieldName;
            const required = fieldConfig.required ? '<span style="color: #ef4444;">*</span>' : '';
            const helpText = fieldConfig.help_text ?
                `<small class="form-text">${this._escapeHtml(fieldConfig.help_text)}</small>` : '';

            switch (fieldConfig.type) {
                case 'text':
                    return this._renderTextField(id, label, required, fieldConfig, value, helpText);
                case 'number':
                    return this._renderNumberField(id, label, required, fieldConfig, value, helpText);
                case 'select':
                    return this._renderSelectField(id, label, required, fieldConfig, value, helpText);
                case 'textarea':
                    return this._renderTextareaField(id, label, required, fieldConfig, value, helpText);
                case 'date':
                    return this._renderDateField(id, label, required, fieldConfig, value, helpText);
                case 'toggle':
                    return this._renderToggleField(id, label, fieldConfig, value);
                case 'range':
                    return this._renderRangeField(id, label, fieldConfig, value);
                default:
                    return this._renderTextField(id, label, required, fieldConfig, value, helpText);
            }
        }

        /**
         * Render text field
         * @private
         */
        _renderTextField(id, label, required, config, value, helpText) {
            const readonly = config.readonly ? 'readonly class="form-control field-readonly" tabindex="-1"' : 'class="form-control"';
            const pattern = config.pattern ? `pattern="${config.pattern}"` : '';
            const maxLength = config.max_length ? `maxlength="${config.max_length}"` : '';

            return `
                <div class="form-group${config.full_width ? ' full-width' : ''}">
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
        _renderNumberField(id, label, required, config, value, helpText) {
            const step = config.step !== undefined ? `step="${config.step}"` : '';
            const min = config.min !== undefined ? `min="${config.min}"` : '';
            const max = config.max !== undefined ? `max="${config.max}"` : '';

            return `
                <div class="form-group${config.full_width ? ' full-width' : ''}">
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
        _renderSelectField(id, label, required, config, value, helpText) {
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
            const allowOther = config.allow_other ?
                `onchange="handleSelectOther(this, '${id}-other')"` : '';
            const otherInput = config.allow_other ?
                `<input type="text" id="${id}-other" class="form-control mt-2"
                        placeholder="Enter other..." style="display: none;"
                        aria-label="Other ${label}">` : '';

            return `
                <div class="form-group${config.full_width ? ' full-width' : ''}">
                    <label>${label} ${required}</label>
                    <select id="${id}" class="form-control" aria-label="${label}" ${allowOther}>
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
        _renderTextareaField(id, label, required, config, value, helpText) {
            const rows = config.rows || 3;
            const maxLength = config.max_length || 1000;
            const charCount = (value || '').length;

            return `
                <div class="form-group${config.full_width ? ' full-width' : ''}">
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
        _renderDateField(id, label, required, config, value, helpText) {
            const onchange = config.onchange ? `onchange="${config.onchange}"` : '';

            return `
                <div class="form-group${config.full_width ? ' full-width' : ''}">
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
        _renderToggleField(id, label, config, value) {
            const checked = value ? 'checked' : '';
            const statusText = value ? 'Enabled' : 'Disabled';

            return `
                <div class="form-group${config.full_width ? ' full-width' : ''}">
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
        _renderRangeField(id, label, config, value) {
            const currentValue = value !== undefined ? value : (config.default || 80);
            const min = config.min || 0;
            const max = config.max || 100;
            const step = config.step || 1;

            const qualityClass = currentValue >= 75 ? 'high' : currentValue >= 50 ? 'medium' : 'low';
            const qualityLabel = currentValue >= 75 ? 'High Quality' :
                                 currentValue >= 50 ? 'Medium Quality' : 'Low Quality';

            return `
                <div class="form-group${config.full_width ? ' full-width' : ''}">
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

        /**
         * Escape HTML to prevent XSS
         * @protected
         * @param {string} str - String to escape
         * @returns {string} Escaped string
         * @see core/security.js - Delegates to central implementation
         */
        _escapeHtml(str) {
            return global.SitesSecurity?.escapeHtml?.(str) ?? (str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
        }

        /**
         * Render section wrapper
         * @protected
         * @param {string} title - Section title
         * @param {string} icon - FontAwesome icon class
         * @param {string} content - Section content HTML
         * @returns {string} Section HTML
         */
        _renderSection(title, icon, content) {
            return `
                <div class="form-section">
                    <h4 onclick="toggleSection(this)"><i class="fas ${icon}"></i> ${title}</h4>
                    <div class="form-section-content">
                        ${content}
                    </div>
                </div>
            `;
        }

        /**
         * Render form wrapper with actions
         * @protected
         * @param {Object} instrument - Instrument data
         * @param {boolean} isAdmin - Admin mode flag
         * @param {string} sectionsHTML - Combined sections HTML
         * @returns {string} Complete form HTML
         */
        _renderFormWrapper(instrument, isAdmin, sectionsHTML) {
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
    }

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Handle select with "Other" option
     * @param {HTMLSelectElement} select - Select element
     * @param {string} otherId - Other input ID
     */
    global.handleSelectOther = function(select, otherId) {
        const otherInput = document.getElementById(otherId);
        if (otherInput) {
            otherInput.style.display = select.value === 'Other' ? 'block' : 'none';
            if (select.value === 'Other') {
                otherInput.focus();
            }
        }
    };

    /**
     * Update toggle label text
     * @param {HTMLInputElement} checkbox - Checkbox element
     * @param {string} statusId - Status span ID
     */
    global.updateToggleLabel = function(checkbox, statusId) {
        const status = document.getElementById(statusId);
        if (status) {
            status.textContent = checkbox.checked ? 'Enabled' : 'Disabled';
        }
    };

    // =========================================================================
    // EXPORTS
    // =========================================================================

    // Create singleton instance
    const instrumentManager = new InstrumentManager();

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { InstrumentManager, BaseInstrumentModal, instrumentManager };
    }

    // Export for browser global
    global.InstrumentManager = instrumentManager;
    global.BaseInstrumentModal = BaseInstrumentModal;
    global.InstrumentManagerClass = InstrumentManager;

})(typeof window !== 'undefined' ? window : global);
