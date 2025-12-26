/**
 * Platform Modal Configuration
 * SITES Spectral v12.0.16
 *
 * Shared configuration constants for platform modal components.
 * Used by platform-modals.js and platform-forms.
 *
 * @module platform-modal-config
 * @version 12.0.16
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CARRIER TYPES (Mobile Platforms)
    // =========================================================================

    /**
     * Mobile platform carrier type definitions
     * @type {Object.<string, {label: string, icon: string, desc: string}>}
     */
    const CARRIER_TYPES = {
        'vehicle': { label: 'Vehicle', icon: 'fa-truck', desc: 'Truck, car, ATV for road/trail surveys' },
        'boat': { label: 'Boat', icon: 'fa-ship', desc: 'Watercraft for lake/coastal surveys' },
        'rover': { label: 'Rover', icon: 'fa-robot', desc: 'Autonomous/remote-controlled ground robot' },
        'backpack': { label: 'Backpack', icon: 'fa-hiking', desc: 'Human walking with backpack instruments' },
        'bicycle': { label: 'Bicycle', icon: 'fa-bicycle', desc: 'Human cycling with mounted/backpack instruments' },
        'other': { label: 'Other', icon: 'fa-question', desc: 'Custom carrier type' }
    };

    /**
     * Carrier type codes for normalized naming
     * @type {Object.<string, string>}
     */
    const CARRIER_CODES = {
        'vehicle': 'VEH',
        'boat': 'BOT',
        'rover': 'ROV',
        'backpack': 'BPK',
        'bicycle': 'BIC',
        'other': 'OTH'
    };

    // =========================================================================
    // TERRAIN OPTIONS
    // =========================================================================

    /**
     * Terrain types for mobile platform surveys
     * @type {string[]}
     */
    const TERRAIN_OPTIONS = ['road', 'trail', 'offroad', 'water', 'snow', 'sand', 'rocky'];

    // =========================================================================
    // POWER TYPES
    // =========================================================================

    /**
     * Power source types for mobile platforms
     * @type {string[]}
     */
    const POWER_TYPES = ['battery', 'fuel', 'human', 'solar', 'hybrid'];

    // =========================================================================
    // SURVEY METHODS
    // =========================================================================

    /**
     * Survey method types for mobile platforms
     * @type {string[]}
     */
    const SURVEY_METHODS = ['transect', 'grid', 'opportunistic', 'route', 'manual'];

    // =========================================================================
    // PLATFORM STATUS OPTIONS
    // =========================================================================

    /**
     * Platform status options
     * @type {string[]}
     */
    const PLATFORM_STATUS_OPTIONS = ['Active', 'Maintenance', 'Inactive', 'Decommissioned'];

    // =========================================================================
    // MOUNTING STRUCTURES (Fixed Platforms)
    // =========================================================================

    /**
     * Mounting structure types for fixed platforms
     * @type {string[]}
     */
    const MOUNTING_STRUCTURES = ['Tower', 'Mast', 'Building Rooftop', 'Pole', 'Scaffold', 'Other'];

    // =========================================================================
    // SATELLITE CONFIGURATIONS
    // =========================================================================

    /**
     * Common satellite constellations
     * @type {string[]}
     */
    const SATELLITE_CONSTELLATIONS = [
        'Sentinel-1', 'Sentinel-2', 'Sentinel-3',
        'Landsat-8', 'Landsat-9',
        'Planet', 'MODIS', 'VIIRS',
        'WorldView', 'PlanetScope'
    ];

    /**
     * Common satellite agencies
     * @type {string[]}
     */
    const SATELLITE_AGENCIES = ['ESA', 'NASA', 'NOAA', 'Planet', 'Maxar', 'Other'];

    // =========================================================================
    // UAV CONFIGURATIONS
    // =========================================================================

    /**
     * Common UAV manufacturers
     * @type {string[]}
     */
    const UAV_MANUFACTURERS = ['DJI', 'MicaSense', 'Parrot', 'senseFly', 'AgEagle', 'Headwall', 'Other'];

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Get carrier code from carrier type
     * @param {string} carrierType - Carrier type key
     * @returns {string} Carrier code (e.g., 'VEH', 'BOT')
     */
    function getCarrierCode(carrierType) {
        return CARRIER_CODES[carrierType] || 'OTH';
    }

    /**
     * Get carrier type configuration
     * @param {string} carrierType - Carrier type key
     * @returns {Object|null} Carrier type config or null
     */
    function getCarrierType(carrierType) {
        return CARRIER_TYPES[carrierType] || null;
    }

    /**
     * Get all carrier types as array for dropdowns
     * @returns {Array<{value: string, label: string, icon: string, desc: string}>}
     */
    function getAllCarrierTypes() {
        return Object.entries(CARRIER_TYPES).map(([key, val]) => ({
            value: key,
            label: val.label,
            icon: val.icon,
            desc: val.desc
        }));
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Platform modal configuration module
     */
    const PlatformModalConfig = {
        // Carrier configurations
        CARRIER_TYPES,
        CARRIER_CODES,

        // Survey options
        TERRAIN_OPTIONS,
        POWER_TYPES,
        SURVEY_METHODS,

        // Platform options
        PLATFORM_STATUS_OPTIONS,
        MOUNTING_STRUCTURES,

        // Satellite options
        SATELLITE_CONSTELLATIONS,
        SATELLITE_AGENCIES,

        // UAV options
        UAV_MANUFACTURERS,

        // Helper functions
        getCarrierCode,
        getCarrierType,
        getAllCarrierTypes
    };

    // Export to global scope
    global.PlatformModalConfig = PlatformModalConfig;

})(typeof window !== 'undefined' ? window : this);
