/**
 * Station Dashboard Utilities
 * SITES Spectral v12.0.17
 *
 * Shared utilities and configuration for station dashboard components.
 * Provides DOM helpers, color utilities, and dashboard constants.
 *
 * @module dashboard/station-dashboard-utils
 * @version 12.0.17
 * @requires core/security.js (SitesSecurity) - optional
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    /** Default pagination settings */
    const DEFAULT_PAGE_SIZE = 20;

    /** Platform type descriptions */
    const PLATFORM_TYPE_DEFAULTS = {
        fixed: 'Fixed observation platform',
        uav: 'Uncrewed Aerial Vehicle',
        satellite: 'Satellite-based remote sensing',
        mobile: 'Mobile measurement platform',
        usv: 'Unmanned Surface Vehicle',
        uuv: 'Unmanned Underwater Vehicle'
    };

    /** Default instrument category configurations */
    const INSTRUMENT_CATEGORY_DEFAULTS = {
        phenocam: { label: 'Phenocams', icon: 'fa-camera', color: '#2563eb' },
        multispectral: { label: 'MS Sensors', icon: 'fa-satellite-dish', color: '#7c3aed' },
        par: { label: 'PAR Sensors', icon: 'fa-sun', color: '#f59e0b' },
        ndvi: { label: 'NDVI Sensors', icon: 'fa-leaf', color: '#059669' },
        pri: { label: 'PRI Sensors', icon: 'fa-microscope', color: '#ec4899' },
        hyperspectral: { label: 'Hyperspectral', icon: 'fa-rainbow', color: '#8b5cf6' },
        thermal: { label: 'Thermal', icon: 'fa-thermometer-half', color: '#ef4444' },
        lidar: { label: 'LiDAR', icon: 'fa-wave-square', color: '#06b6d4' },
        rgb: { label: 'RGB Cameras', icon: 'fa-camera-retro', color: '#3b82f6' },
        sar: { label: 'SAR/Radar', icon: 'fa-broadcast-tower', color: '#6366f1' },
        other: { label: 'Other', icon: 'fa-cube', color: '#6b7280' }
    };

    /** Status icon mapping */
    const STATUS_ICONS = {
        active: 'fa-check-circle',
        maintenance: 'fa-wrench',
        inactive: 'fa-pause-circle',
        decommissioned: 'fa-times-circle',
        unknown: 'fa-question-circle'
    };

    /** Status color mapping */
    const STATUS_COLORS = {
        active: '#22c55e',
        maintenance: '#f59e0b',
        inactive: '#6b7280',
        decommissioned: '#dc2626',
        unknown: '#94a3b8'
    };

    // =========================================================================
    // DOM UTILITIES
    // =========================================================================

    /**
     * Escape HTML to prevent XSS
     * Delegates to centralized security module
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        if (typeof global.SitesSecurity !== 'undefined') {
            return global.SitesSecurity.escapeHtml(text);
        }
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Create safe element with textContent
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string} [textContent] - Text content
     * @returns {HTMLElement}
     */
    function createElement(tag, attributes = {}, textContent = null) {
        const el = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        if (textContent !== null) {
            el.textContent = textContent;
        }
        return el;
    }

    // =========================================================================
    // COLOR UTILITIES
    // =========================================================================

    /**
     * Darken a hex color by a percentage
     * @param {string} color - Hex color (e.g., '#2563eb')
     * @param {number} percent - Percentage to darken (0-100)
     * @returns {string} Darkened hex color
     */
    function darkenColor(color, percent) {
        // Delegate to PlatformRenderer if available
        if (global.PlatformRenderer?.darkenColor) {
            return global.PlatformRenderer.darkenColor(color, percent);
        }
        // Inline implementation
        let hex = (color || '#6b7280').replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        r = Math.max(0, Math.floor(r * (1 - percent / 100)));
        g = Math.max(0, Math.floor(g * (1 - percent / 100)));
        b = Math.max(0, Math.floor(b * (1 - percent / 100)));
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Lighten a hex color by a percentage
     * @param {string} color - Hex color (e.g., '#2563eb')
     * @param {number} percent - Percentage to lighten (0-100)
     * @returns {string} Lightened hex color
     */
    function lightenColor(color, percent) {
        let hex = (color || '#6b7280').replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
        g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
        b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // =========================================================================
    // INSTRUMENT UTILITIES
    // =========================================================================

    /**
     * Detect instrument category from type string
     * @param {string} instrumentType - Instrument type string
     * @returns {string} Category key
     */
    function detectInstrumentCategory(instrumentType) {
        if (global.SitesConfig?.detectInstrumentCategory) {
            return global.SitesConfig.detectInstrumentCategory(instrumentType);
        }
        // Fallback detection
        const type = (instrumentType || '').toLowerCase();
        if (type.includes('phenocam')) return 'phenocam';
        if (type.includes('multispectral') || type.includes('ms sensor')) return 'multispectral';
        if (type.includes('par')) return 'par';
        if (type.includes('ndvi')) return 'ndvi';
        if (type.includes('pri')) return 'pri';
        if (type.includes('hyperspectral')) return 'hyperspectral';
        if (type.includes('thermal')) return 'thermal';
        if (type.includes('lidar')) return 'lidar';
        if (type.includes('rgb')) return 'rgb';
        if (type.includes('sar') || type.includes('radar')) return 'sar';
        return 'other';
    }

    /**
     * Get instrument category configuration
     * @param {string} category - Category key
     * @returns {Object} Category configuration
     */
    function getInstrumentCategoryConfig(category) {
        if (global.SitesConfig?.isLoaded()) {
            const types = global.SitesConfig.getInstrumentTypes();
            if (types[category]) {
                return {
                    label: types[category].plural || types[category].label || category,
                    icon: types[category].icon || 'fa-cube',
                    color: types[category].color || '#6b7280'
                };
            }
        }
        return INSTRUMENT_CATEGORY_DEFAULTS[category] || INSTRUMENT_CATEGORY_DEFAULTS.other;
    }

    /**
     * Group instruments by type category
     * @param {Array} instruments - Instruments array
     * @returns {Object} Grouped instruments by category
     */
    function groupInstrumentsByCategory(instruments) {
        if (!Array.isArray(instruments)) return {};

        const groups = {};

        instruments.forEach(inst => {
            if (!inst?.instrument_type) return;
            const category = detectInstrumentCategory(inst.instrument_type);

            if (!groups[category]) {
                groups[category] = {
                    ...getInstrumentCategoryConfig(category),
                    instruments: []
                };
            }
            groups[category].instruments.push(inst);
        });

        return groups;
    }

    // =========================================================================
    // STATUS UTILITIES
    // =========================================================================

    /**
     * Get status icon class
     * @param {string} status - Status string
     * @returns {string} FontAwesome icon class
     */
    function getStatusIcon(status) {
        const key = (status || 'unknown').toLowerCase();
        return STATUS_ICONS[key] || STATUS_ICONS.unknown;
    }

    /**
     * Get status color
     * @param {string} status - Status string
     * @returns {string} Hex color
     */
    function getStatusColor(status) {
        const key = (status || 'unknown').toLowerCase();
        return STATUS_COLORS[key] || STATUS_COLORS.unknown;
    }

    // =========================================================================
    // FORMAT UTILITIES
    // =========================================================================

    /**
     * Format coordinates for display
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {number} [precision=6] - Decimal precision
     * @returns {string} Formatted coordinates
     */
    function formatCoordinates(lat, lon, precision = 6) {
        if (lat == null || lon == null) return 'Not set';
        return `${Number(lat).toFixed(precision)}°N, ${Number(lon).toFixed(precision)}°E`;
    }

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    function formatDate(date) {
        if (!date) return 'Not set';
        try {
            return new Date(date).toLocaleDateString('en-SE');
        } catch {
            return String(date);
        }
    }

    /**
     * Format datetime for display
     * @param {string|Date} datetime - Datetime to format
     * @returns {string} Formatted datetime
     */
    function formatDateTime(datetime) {
        if (!datetime) return 'Not set';
        try {
            return new Date(datetime).toLocaleString('en-SE');
        } catch {
            return String(datetime);
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    const StationDashboardUtils = {
        // Constants
        DEFAULT_PAGE_SIZE,
        PLATFORM_TYPE_DEFAULTS,
        INSTRUMENT_CATEGORY_DEFAULTS,
        STATUS_ICONS,
        STATUS_COLORS,

        // DOM utilities
        escapeHtml,
        createElement,

        // Color utilities
        darkenColor,
        lightenColor,

        // Instrument utilities
        detectInstrumentCategory,
        getInstrumentCategoryConfig,
        groupInstrumentsByCategory,

        // Status utilities
        getStatusIcon,
        getStatusColor,

        // Format utilities
        formatCoordinates,
        formatDate,
        formatDateTime
    };

    // Export to global scope
    global.StationDashboardUtils = StationDashboardUtils;

})(typeof window !== 'undefined' ? window : this);
