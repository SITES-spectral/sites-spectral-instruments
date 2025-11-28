/**
 * Configuration Service for SITES Spectral
 *
 * Provides centralized access to YAML configuration files.
 * Preloads common configurations and provides typed accessors.
 *
 * @module core/config-service
 * @version 8.5.0
 */

(function(global) {
    'use strict';

    /**
     * Configuration Service Class
     */
    class ConfigService {
        constructor() {
            /** @private */
            this.configs = {};

            /** @private */
            this.loaded = false;

            /** @private */
            this.loadPromise = null;

            /** Configuration file paths */
            this.CONFIG_PATHS = {
                platformTypes: 'ui/platform-types',
                instrumentTypes: 'ui/instrument-types',
                statusIndicators: 'ui/status-indicators',
                sensorOrientations: 'ui/sensor-orientations',
                uavSensors: 'sensors/uav-sensors',
                ecosystems: 'core/ecosystems',
                validationRules: 'core/validation-rules'
            };
        }

        /**
         * Initialize and load all configurations
         * @returns {Promise<void>}
         */
        async init() {
            if (this.loaded) return;
            if (this.loadPromise) return this.loadPromise;

            this.loadPromise = this._loadAllConfigs();
            await this.loadPromise;
            this.loaded = true;

            console.log('✅ ConfigService: All configurations loaded');
        }

        /**
         * Load all configuration files
         * @private
         */
        async _loadAllConfigs() {
            const loader = global.ConfigLoader;
            if (!loader) {
                console.error('ConfigLoader not available');
                return;
            }

            const loadPromises = Object.entries(this.CONFIG_PATHS).map(async ([key, path]) => {
                try {
                    this.configs[key] = await loader.get(path);
                } catch (error) {
                    console.warn(`Failed to load config: ${path}`, error);
                    this.configs[key] = null;
                }
            });

            await Promise.all(loadPromises);
        }

        /**
         * Check if configs are loaded
         * @returns {boolean}
         */
        isLoaded() {
            return this.loaded;
        }

        // ==========================================
        // Platform Type Accessors
        // ==========================================

        /**
         * Get all platform types
         * @returns {Object}
         */
        getPlatformTypes() {
            return this.configs.platformTypes?.platform_types || {};
        }

        /**
         * Get platform type by code
         * @param {string} code - Platform type code (e.g., 'fixed', 'uav')
         * @returns {Object|null}
         */
        getPlatformType(code) {
            return this.getPlatformTypes()[code] || null;
        }

        /**
         * Get active platform types only
         * @returns {Object}
         */
        getActivePlatformTypes() {
            const types = this.getPlatformTypes();
            const active = {};
            for (const [key, value] of Object.entries(types)) {
                if (value.status === 'active') {
                    active[key] = value;
                }
            }
            return active;
        }

        /**
         * Get platform type icon
         * @param {string} code - Platform type code
         * @returns {string}
         */
        getPlatformTypeIcon(code) {
            return this.getPlatformType(code)?.icon || 'fa-cube';
        }

        /**
         * Get platform type color
         * @param {string} code - Platform type code
         * @returns {string}
         */
        getPlatformTypeColor(code) {
            return this.getPlatformType(code)?.color || '#6b7280';
        }

        // ==========================================
        // Instrument Type Accessors
        // ==========================================

        /**
         * Get all instrument types
         * @returns {Object}
         */
        getInstrumentTypes() {
            return this.configs.instrumentTypes?.instrument_types || {};
        }

        /**
         * Get instrument type by key
         * @param {string} key - Instrument type key (e.g., 'phenocam', 'multispectral')
         * @returns {Object|null}
         */
        getInstrumentType(key) {
            return this.getInstrumentTypes()[key] || null;
        }

        /**
         * Get instrument type icon
         * @param {string} key - Instrument type key
         * @returns {string}
         */
        getInstrumentTypeIcon(key) {
            return this.getInstrumentType(key)?.icon || 'fa-cube';
        }

        /**
         * Get instrument type color
         * @param {string} key - Instrument type key
         * @returns {string}
         */
        getInstrumentTypeColor(key) {
            return this.getInstrumentType(key)?.color || '#6b7280';
        }

        /**
         * Get instrument type background color
         * @param {string} key - Instrument type key
         * @returns {string}
         */
        getInstrumentTypeBackground(key) {
            return this.getInstrumentType(key)?.background || '#f3f4f6';
        }

        /**
         * Detect instrument category from type string
         * @param {string} typeString - Instrument type string from database
         * @returns {string} Category key (e.g., 'phenocam', 'multispectral', 'other')
         */
        detectInstrumentCategory(typeString) {
            if (!typeString) return 'other';
            const t = typeString.toLowerCase();

            const types = this.getInstrumentTypes();
            for (const [key, config] of Object.entries(types)) {
                if (config.patterns && config.patterns.length > 0) {
                    for (const pattern of config.patterns) {
                        if (t.includes(pattern.toLowerCase())) {
                            return key;
                        }
                    }
                }
            }

            return 'other';
        }

        // ==========================================
        // Status Indicator Accessors
        // ==========================================

        /**
         * Get all status indicators
         * @returns {Object}
         */
        getStatuses() {
            return this.configs.statusIndicators?.statuses || {};
        }

        /**
         * Get status by code
         * @param {string} code - Status code (e.g., 'Active', 'Inactive')
         * @returns {Object|null}
         */
        getStatus(code) {
            const statuses = this.getStatuses();
            // Find by code property (case-insensitive)
            for (const [key, status] of Object.entries(statuses)) {
                if (status.code && status.code.toLowerCase() === code.toLowerCase()) {
                    return status;
                }
            }
            return null;
        }

        /**
         * Get status color
         * @param {string} code - Status code
         * @returns {string}
         */
        getStatusColor(code) {
            return this.getStatus(code)?.color || '#6b7280';
        }

        /**
         * Get status icon
         * @param {string} code - Status code
         * @returns {string}
         */
        getStatusIcon(code) {
            return this.getStatus(code)?.icon || 'fa-question-circle';
        }

        /**
         * Get status categories
         * @returns {Object}
         */
        getStatusCategories() {
            return this.configs.statusIndicators?.categories || {};
        }

        // ==========================================
        // Sensor Orientation Accessors
        // ==========================================

        /**
         * Get all sensor orientations
         * @returns {Object}
         */
        getOrientations() {
            return this.configs.sensorOrientations?.orientations || {};
        }

        /**
         * Get orientation by code
         * @param {string} code - Orientation code (e.g., 'uplooking', 'downlooking')
         * @returns {Object|null}
         */
        getOrientation(code) {
            return this.getOrientations()[code] || null;
        }

        /**
         * Get orientation icon
         * @param {string} code - Orientation code
         * @returns {string}
         */
        getOrientationIcon(code) {
            return this.getOrientation(code)?.icon || 'fa-arrows-alt';
        }

        /**
         * Get viewing directions (for phenocams)
         * @returns {Object}
         */
        getViewingDirections() {
            return this.configs.sensorOrientations?.viewing_directions || {};
        }

        // ==========================================
        // UAV Sensor Accessors
        // ==========================================

        /**
         * Get all UAV sensor vendors
         * @returns {Object}
         */
        getUAVVendors() {
            return this.configs.uavSensors?.vendors || {};
        }

        /**
         * Get UAV sensor specs by vendor and model
         * @param {string} vendor - Vendor code (e.g., 'DJI', 'MICASENSE')
         * @param {string} model - Model code (e.g., 'M3M', 'REDEDGE')
         * @returns {Object|null}
         */
        getUAVSensorSpecs(vendor, model) {
            const vendors = this.getUAVVendors();
            return vendors[vendor]?.models?.[model] || null;
        }

        /**
         * Get UAV vendor options for dropdown
         * @returns {Array}
         */
        getUAVVendorOptions() {
            return this.configs.uavSensors?.vendor_options || [];
        }

        // ==========================================
        // Ecosystem Accessors
        // ==========================================

        /**
         * Get all ecosystems
         * @returns {Object}
         */
        getEcosystems() {
            return this.configs.ecosystems?.ecosystems || {};
        }

        /**
         * Get ecosystem by code
         * @param {string} code - Ecosystem code (e.g., 'FOR', 'AGR')
         * @returns {Object|null}
         */
        getEcosystem(code) {
            return this.getEcosystems()[code] || null;
        }

        /**
         * Get ecosystem categories
         * @returns {Object}
         */
        getEcosystemCategories() {
            return this.configs.ecosystems?.categories || {};
        }

        /**
         * Get ecosystems by category
         * @param {string} category - Category name (e.g., 'forest', 'wetland')
         * @returns {Array}
         */
        getEcosystemsByCategory(category) {
            const cat = this.getEcosystemCategories()[category];
            if (!cat || !cat.ecosystems) return [];

            const ecosystems = this.getEcosystems();
            return cat.ecosystems.map(code => ecosystems[code]).filter(Boolean);
        }

        // ==========================================
        // Validation Rules Accessors
        // ==========================================

        /**
         * Get all validation rules
         * @returns {Object}
         */
        getValidationRules() {
            return this.configs.validationRules || {};
        }

        /**
         * Get validation rule by entity and field
         * @param {string} entity - Entity type (e.g., 'station', 'platform')
         * @param {string} field - Field name (e.g., 'acronym', 'latitude')
         * @returns {Object|null}
         */
        getFieldValidation(entity, field) {
            return this.configs.validationRules?.[entity]?.[field] || null;
        }

        /**
         * Get valid ecosystem codes
         * @returns {Array}
         */
        getValidEcosystemCodes() {
            return this.configs.validationRules?.valid_ecosystems || [];
        }

        /**
         * Get valid status codes
         * @returns {Array}
         */
        getValidStatusCodes() {
            return this.configs.validationRules?.valid_statuses || [];
        }

        /**
         * Get geographic bounds
         * @returns {Object}
         */
        getGeographicValidation() {
            return this.configs.validationRules?.geographic || {};
        }

        // ==========================================
        // Utility Methods
        // ==========================================

        /**
         * Get raw config by key
         * @param {string} key - Config key from CONFIG_PATHS
         * @returns {Object|null}
         */
        getRawConfig(key) {
            return this.configs[key] || null;
        }

        /**
         * Reload all configurations
         * @returns {Promise<void>}
         */
        async reload() {
            this.loaded = false;
            this.loadPromise = null;

            // Clear ConfigLoader cache
            if (global.ConfigLoader) {
                global.ConfigLoader.clearCache();
            }

            await this.init();
        }
    }

    // Create singleton instance
    const configService = new ConfigService();

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = configService;
    }

    // Export for browser global
    global.SitesConfig = configService;

})(typeof window !== 'undefined' ? window : global);
