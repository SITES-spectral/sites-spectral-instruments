/**
 * Configuration Service for SITES Spectral
 *
 * Provides centralized access to YAML configuration files.
 * Preloads common configurations and provides typed accessors.
 *
 * @module core/config-service
 * @version 9.0.0
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
                // UI Configurations
                platformTypes: 'ui/platform-types',
                instrumentTypes: 'ui/instrument-types',
                statusIndicators: 'ui/status-indicators',
                sensorOrientations: 'ui/sensor-orientations',
                pagination: 'ui/pagination',
                // Core Configurations
                ecosystems: 'core/ecosystems',
                validationRules: 'core/validation-rules',
                // Sensor Configurations
                uavSensors: 'sensors/uav-sensors',
                // API Configurations
                apiVersions: 'api/api-versions',
                // Campaign Configurations
                campaignTypes: 'campaigns/campaign-types',
                // Product Configurations
                productTypes: 'products/product-types'
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
            // ConfigService initialized - debug logging removed for production
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
                    return { key, status: 'success' };
                } catch (error) {
                    console.warn(`Failed to load config: ${path}`, error);
                    this.configs[key] = null;
                    return { key, status: 'failed', error };
                }
            });

            // Use Promise.allSettled to ensure all configs are attempted
            await Promise.allSettled(loadPromises);
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
        // API Version Accessors
        // ==========================================

        /**
         * Get all API versions configuration
         * @returns {Object}
         */
        getAPIVersions() {
            return this.configs.apiVersions?.api_versions || {};
        }

        /**
         * Get current API version configuration
         * @returns {Object}
         */
        getAPIVersion() {
            const versions = this.getAPIVersions();
            // Find the version marked as current or default
            for (const [key, config] of Object.entries(versions)) {
                if (config.status === 'current' || config.is_default) {
                    return { version: key, ...config };
                }
            }
            // Fallback to v3 if no current version found
            return versions.v3 ? { version: 'v3', ...versions.v3 } : null;
        }

        /**
         * Get specific API version by key
         * @param {string} version - Version key (e.g., 'v1', 'v2', 'v3')
         * @returns {Object|null}
         */
        getAPIVersionByKey(version) {
            return this.getAPIVersions()[version] || null;
        }

        /**
         * Get API version selection configuration
         * @returns {Object}
         */
        getAPIVersionSelection() {
            return this.configs.apiVersions?.version_selection || {};
        }

        /**
         * Get default API version string
         * @returns {string} Returns 'latest' for automatic version resolution
         */
        getDefaultAPIVersion() {
            return this.configs.apiVersions?.version_selection?.default_version || 'latest';
        }

        /**
         * Get API feature availability by version
         * @returns {Object}
         */
        getAPIFeatures() {
            return this.configs.apiVersions?.features || {};
        }

        // ==========================================
        // Campaign Type Accessors
        // ==========================================

        /**
         * Get all campaign types
         * @returns {Object}
         */
        getCampaignTypes() {
            return this.configs.campaignTypes?.campaign_types || {};
        }

        /**
         * Get campaign type by code
         * @param {string} code - Campaign type code (e.g., 'field_survey', 'uav_flight')
         * @returns {Object|null}
         */
        getCampaignType(code) {
            return this.getCampaignTypes()[code] || null;
        }

        /**
         * Get campaign type icon
         * @param {string} code - Campaign type code
         * @returns {string}
         */
        getCampaignTypeIcon(code) {
            return this.getCampaignType(code)?.icon || 'fa-clipboard';
        }

        /**
         * Get campaign type color
         * @param {string} code - Campaign type code
         * @returns {string}
         */
        getCampaignTypeColor(code) {
            return this.getCampaignType(code)?.color || '#6b7280';
        }

        /**
         * Get all campaign status definitions
         * @returns {Object}
         */
        getCampaignStatuses() {
            return this.configs.campaignTypes?.campaign_status || {};
        }

        /**
         * Get campaign status by code
         * @param {string} code - Campaign status code (e.g., 'planning', 'in_progress')
         * @returns {Object|null}
         */
        getCampaignStatus(code) {
            return this.getCampaignStatuses()[code] || null;
        }

        /**
         * Get campaign status color
         * @param {string} code - Campaign status code
         * @returns {string}
         */
        getCampaignStatusColor(code) {
            return this.getCampaignStatus(code)?.color || '#6b7280';
        }

        /**
         * Get campaign status icon
         * @param {string} code - Campaign status code
         * @returns {string}
         */
        getCampaignStatusIcon(code) {
            return this.getCampaignStatus(code)?.icon || 'fa-question-circle';
        }

        /**
         * Get campaign priorities
         * @returns {Object}
         */
        getCampaignPriorities() {
            return this.configs.campaignTypes?.campaign_priorities || {};
        }

        /**
         * Get campaign UI configuration
         * @returns {Object}
         */
        getCampaignUIConfig() {
            return this.configs.campaignTypes?.ui_config || {};
        }

        /**
         * Get campaign validation rules
         * @returns {Object}
         */
        getCampaignValidation() {
            return this.configs.campaignTypes?.validation || {};
        }

        // ==========================================
        // Product Type Accessors
        // ==========================================

        /**
         * Get all product types
         * @returns {Object}
         */
        getProductTypes() {
            return this.configs.productTypes?.product_types || {};
        }

        /**
         * Get product type by code
         * @param {string} code - Product type code (e.g., 'orthomosaic', 'ndvi_map')
         * @returns {Object|null}
         */
        getProductType(code) {
            return this.getProductTypes()[code] || null;
        }

        /**
         * Get product type icon
         * @param {string} code - Product type code
         * @returns {string}
         */
        getProductTypeIcon(code) {
            return this.getProductType(code)?.icon || 'fa-file';
        }

        /**
         * Get product type color
         * @param {string} code - Product type code
         * @returns {string}
         */
        getProductTypeColor(code) {
            return this.getProductType(code)?.color || '#6b7280';
        }

        /**
         * Get product types by category
         * @param {string} category - Category name (e.g., 'imagery', 'vegetation_index')
         * @returns {Array}
         */
        getProductTypesByCategory(category) {
            const types = this.getProductTypes();
            const results = [];
            for (const [key, config] of Object.entries(types)) {
                if (config.category === category) {
                    results.push({ key, ...config });
                }
            }
            return results;
        }

        /**
         * Get all processing level definitions
         * @returns {Object}
         */
        getProcessingLevels() {
            return this.configs.productTypes?.processing_levels || {};
        }

        /**
         * Get processing level by code
         * @param {string} code - Processing level code (e.g., 'raw', 'processed', 'validated')
         * @returns {Object|null}
         */
        getProcessingLevel(code) {
            return this.getProcessingLevels()[code] || null;
        }

        /**
         * Get all file format definitions
         * @returns {Object}
         */
        getFileFormats() {
            return this.configs.productTypes?.file_formats || {};
        }

        /**
         * Get file format by key
         * @param {string} key - File format key (e.g., 'geotiff', 'cog', 'las')
         * @returns {Object|null}
         */
        getFileFormat(key) {
            return this.getFileFormats()[key] || null;
        }

        /**
         * Get product categories
         * @returns {Object}
         */
        getProductCategories() {
            return this.configs.productTypes?.categories || {};
        }

        /**
         * Get quality control configuration
         * @returns {Object}
         */
        getProductQualityControl() {
            return this.configs.productTypes?.quality_control || {};
        }

        // ==========================================
        // Pagination Accessors
        // ==========================================

        /**
         * Get pagination configuration
         * @returns {Object}
         */
        getPaginationConfig() {
            return this.configs.pagination || {};
        }

        /**
         * Get default pagination settings
         * @returns {Object}
         */
        getPaginationDefaults() {
            return this.configs.pagination?.defaults || {};
        }

        /**
         * Get view-specific pagination settings
         * @param {string} viewName - View name (e.g., 'instruments', 'campaigns', 'products')
         * @returns {Object}
         */
        getViewPagination(viewName) {
            const viewConfig = this.configs.pagination?.views?.[viewName];
            if (viewConfig) {
                // Merge with defaults
                return { ...this.getPaginationDefaults(), ...viewConfig };
            }
            return this.getPaginationDefaults();
        }

        /**
         * Get pagination style configuration
         * @param {string} styleName - Style name (e.g., 'numbered', 'load_more', 'infinite_scroll')
         * @returns {Object|null}
         */
        getPaginationStyle(styleName) {
            return this.configs.pagination?.pagination_styles?.[styleName] || null;
        }

        /**
         * Get API pagination configuration
         * @returns {Object}
         */
        getAPIPaginationConfig() {
            return this.configs.pagination?.api || {};
        }

        /**
         * Get pagination UI components configuration
         * @returns {Object}
         */
        getPaginationUIComponents() {
            return this.configs.pagination?.ui_components || {};
        }

        /**
         * Get pagination performance settings
         * @returns {Object}
         */
        getPaginationPerformance() {
            return this.configs.pagination?.performance || {};
        }

        /**
         * Get pagination accessibility settings
         * @returns {Object}
         */
        getPaginationAccessibility() {
            return this.configs.pagination?.accessibility || {};
        }

        /**
         * Get pagination mobile settings
         * @returns {Object}
         */
        getPaginationMobile() {
            return this.configs.pagination?.mobile || {};
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
