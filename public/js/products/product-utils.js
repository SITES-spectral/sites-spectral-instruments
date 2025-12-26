/**
 * SITES Spectral - Product Utilities Module
 *
 * Shared utility functions for product browser and related components.
 * Extracted from product-browser.js for reusability.
 *
 * @module products/product-utils
 * @version 12.0.12
 */

(function(global) {
    'use strict';

    // =========================================================================
    // PRODUCT TYPES CONFIGURATION
    // =========================================================================

    /**
     * Default product types configuration (fallback if YAML not loaded)
     */
    const PRODUCT_TYPES = {
        orthomosaic: {
            name: 'Orthomosaic',
            icon: 'fa-image',
            color: '#2563eb',
            background: '#dbeafe'
        },
        ndvi_map: {
            name: 'NDVI Map',
            icon: 'fa-leaf',
            color: '#22c55e',
            background: '#d1fae5'
        },
        point_cloud: {
            name: 'Point Cloud',
            icon: 'fa-cubes',
            color: '#8b5cf6',
            background: '#ede9fe'
        },
        thermal_map: {
            name: 'Thermal Map',
            icon: 'fa-temperature-high',
            color: '#ef4444',
            background: '#fee2e2'
        },
        dem: {
            name: 'Digital Elevation Model',
            icon: 'fa-mountain',
            color: '#78716c',
            background: '#f5f5f4'
        },
        dsm: {
            name: 'Digital Surface Model',
            icon: 'fa-layer-group',
            color: '#06b6d4',
            background: '#cffafe'
        },
        reflectance: {
            name: 'Surface Reflectance',
            icon: 'fa-adjust',
            color: '#7c3aed',
            background: '#ede9fe'
        },
        classification_map: {
            name: 'Classification Map',
            icon: 'fa-map',
            color: '#f59e0b',
            background: '#fef3c7'
        }
    };

    // =========================================================================
    // PROCESSING LEVELS CONFIGURATION
    // =========================================================================

    /**
     * Processing levels configuration (fallback if YAML not loaded)
     */
    const PROCESSING_LEVELS = {
        L0: {
            name: 'Raw Data',
            icon: 'fa-database',
            color: '#6b7280',
            description: 'Unprocessed sensor data'
        },
        L1: {
            name: 'Processed',
            icon: 'fa-cogs',
            color: '#3b82f6',
            description: 'Geometrically and radiometrically corrected'
        },
        L2: {
            name: 'Validated',
            icon: 'fa-check-double',
            color: '#22c55e',
            description: 'Quality controlled and validated'
        },
        L3: {
            name: 'Published',
            icon: 'fa-globe',
            color: '#7c3aed',
            description: 'Final product ready for distribution'
        }
    };

    // =========================================================================
    // SORT OPTIONS
    // =========================================================================

    /**
     * Sort options for product listings
     */
    const SORT_OPTIONS = {
        date: { label: 'Date', icon: 'fa-calendar' },
        name: { label: 'Name', icon: 'fa-font' },
        type: { label: 'Type', icon: 'fa-tag' },
        size: { label: 'Size', icon: 'fa-weight' }
    };

    // =========================================================================
    // FORMATTING UTILITIES
    // =========================================================================

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string|null} Formatted size or null if invalid
     */
    function formatFileSize(bytes) {
        if (!bytes || bytes === 0) return null;

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }

    /**
     * Format date for display (YYYY-MM-DD)
     * @param {string|Date} date - Date to format
     * @returns {string|null} Formatted date or null if invalid
     */
    function formatDate(date) {
        if (!date) return null;

        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return null;

            return d.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        } catch (error) {
            return null;
        }
    }

    /**
     * Format datetime for display
     * @param {string|Date} datetime - Datetime to format
     * @returns {string|null} Formatted datetime or null if invalid
     */
    function formatDateTime(datetime) {
        if (!datetime) return null;

        try {
            const d = new Date(datetime);
            if (isNaN(d.getTime())) return null;

            return d.toLocaleString('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return null;
        }
    }

    // =========================================================================
    // SECURITY UTILITIES
    // =========================================================================

    /**
     * Escape HTML to prevent XSS
     * Delegates to centralized security module if available
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function escapeHtml(str) {
        // Use centralized security module if available
        if (global.SitesSecurity?.escapeHtml) {
            return global.SitesSecurity.escapeHtml(str);
        }
        // Fallback implementation
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // =========================================================================
    // PRODUCT TYPE UTILITIES
    // =========================================================================

    /**
     * Get product type configuration
     * @param {string} type - Product type key
     * @returns {Object} Product type configuration
     */
    function getProductType(type) {
        if (!type) return { name: 'Unknown', icon: 'fa-file', color: '#6b7280', background: '#f3f4f6' };

        const normalizedType = type.toLowerCase().replace(/[^a-z0-9]/g, '_');

        // Try YAML config first
        if (global.SitesConfig?.getProductType) {
            const config = global.SitesConfig.getProductType(normalizedType);
            if (config) return config;
        }

        // Fallback to defaults
        return PRODUCT_TYPES[normalizedType] || {
            name: type,
            icon: 'fa-file',
            color: '#6b7280',
            background: '#f3f4f6'
        };
    }

    /**
     * Get processing level configuration
     * @param {string} level - Processing level (L0, L1, L2, L3)
     * @returns {Object} Processing level configuration
     */
    function getProcessingLevel(level) {
        if (!level) return { name: 'Unknown', icon: 'fa-question', color: '#6b7280' };

        const normalizedLevel = level.toUpperCase();

        // Try YAML config first
        if (global.SitesConfig?.getProcessingLevel) {
            const config = global.SitesConfig.getProcessingLevel(normalizedLevel);
            if (config) return config;
        }

        // Fallback to defaults
        return PROCESSING_LEVELS[normalizedLevel] || {
            name: level,
            icon: 'fa-question',
            color: '#6b7280'
        };
    }

    // =========================================================================
    // EXPORT
    // =========================================================================

    const ProductUtils = {
        // Configurations
        PRODUCT_TYPES,
        PROCESSING_LEVELS,
        SORT_OPTIONS,

        // Formatters
        formatFileSize,
        formatDate,
        formatDateTime,

        // Security
        escapeHtml,

        // Product helpers
        getProductType,
        getProcessingLevel
    };

    // Export to global
    global.ProductUtils = ProductUtils;

})(typeof window !== 'undefined' ? window : this);
