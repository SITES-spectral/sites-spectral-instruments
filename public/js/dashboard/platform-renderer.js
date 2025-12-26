/**
 * SITES Spectral - Platform Renderer Module
 *
 * Handles rendering of platform cards and instrument UI components.
 * Extracted from station-dashboard.js for better modularity.
 *
 * Security: Uses escapeHtml() for all user-supplied content.
 *
 * @module dashboard/platform-renderer
 * @version 12.0.10
 */

(function(global) {
    'use strict';

    // Use global escapeHtml from security module
    const escapeHtml = global.escapeHtml || global.SitesSecurity?.escapeHtml || function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    /**
     * Platform Renderer - utility functions for platform card rendering
     */
    const PlatformRenderer = {
        /**
         * Darken a hex color by percentage
         * @param {string} color - Hex color
         * @param {number} percent - Percentage to darken (0-100)
         * @returns {string} Darkened hex color
         */
        darkenColor(color, percent) {
            let hex = (color || '#6b7280').replace('#', '');
            let r = parseInt(hex.substring(0, 2), 16);
            let g = parseInt(hex.substring(2, 4), 16);
            let b = parseInt(hex.substring(4, 6), 16);

            r = Math.max(0, Math.floor(r * (1 - percent / 100)));
            g = Math.max(0, Math.floor(g * (1 - percent / 100)));
            b = Math.max(0, Math.floor(b * (1 - percent / 100)));

            const toHex = (n) => n.toString(16).padStart(2, '0');
            return '#' + toHex(r) + toHex(g) + toHex(b);
        },

        /**
         * Get instrument type icon class
         * @param {string} instrumentType
         * @returns {string} Font Awesome icon class
         */
        getInstrumentTypeIcon(instrumentType) {
            if (!instrumentType) return 'fa-cube';
            const type = instrumentType.toLowerCase();
            if (type.includes('phenocam')) return 'fa-camera';
            if (type.includes('multispectral')) return 'fa-satellite-dish';
            if (type.includes('par')) return 'fa-sun';
            if (type.includes('ndvi')) return 'fa-leaf';
            if (type.includes('pri')) return 'fa-microscope';
            if (type.includes('hyperspectral')) return 'fa-rainbow';
            if (type.includes('thermal')) return 'fa-temperature-high';
            if (type.includes('lidar')) return 'fa-crosshairs';
            return 'fa-cube';
        },

        /**
         * Get instrument type color
         * @param {string} instrumentType
         * @returns {string} Hex color
         */
        getInstrumentTypeColor(instrumentType) {
            if (!instrumentType) return '#6b7280';
            const type = instrumentType.toLowerCase();
            if (type.includes('phenocam')) return '#2563eb';
            if (type.includes('multispectral')) return '#7c3aed';
            if (type.includes('par')) return '#f59e0b';
            if (type.includes('ndvi')) return '#059669';
            if (type.includes('pri')) return '#ec4899';
            if (type.includes('hyperspectral')) return '#6366f1';
            if (type.includes('thermal')) return '#ef4444';
            if (type.includes('lidar')) return '#14b8a6';
            return '#6b7280';
        },

        /**
         * Detect instrument category from type string
         * @param {string} instrumentType
         * @returns {string} Category key
         */
        detectCategory(instrumentType) {
            if (!instrumentType) return 'other';
            const type = instrumentType.toLowerCase();
            if (type.includes('phenocam') || type === 'phe') return 'phenocam';
            if (type.includes('multispectral')) return 'multispectral';
            if (type.includes('par')) return 'par';
            if (type.includes('ndvi')) return 'ndvi';
            if (type.includes('pri')) return 'pri';
            if (type.includes('hyperspectral')) return 'hyperspectral';
            if (type.includes('thermal')) return 'thermal';
            if (type.includes('lidar')) return 'lidar';
            return 'other';
        },

        /**
         * Get category configuration
         * @returns {Object} Category configurations
         */
        getCategoryConfigs() {
            return {
                phenocam: { label: 'Phenocams', icon: 'fa-camera', color: '#2563eb' },
                multispectral: { label: 'MS Sensors', icon: 'fa-satellite-dish', color: '#7c3aed' },
                par: { label: 'PAR Sensors', icon: 'fa-sun', color: '#f59e0b' },
                ndvi: { label: 'NDVI Sensors', icon: 'fa-leaf', color: '#059669' },
                pri: { label: 'PRI Sensors', icon: 'fa-microscope', color: '#ec4899' },
                hyperspectral: { label: 'Hyperspectral', icon: 'fa-rainbow', color: '#6366f1' },
                thermal: { label: 'Thermal', icon: 'fa-temperature-high', color: '#ef4444' },
                lidar: { label: 'LiDAR', icon: 'fa-crosshairs', color: '#14b8a6' },
                other: { label: 'Other', icon: 'fa-cube', color: '#6b7280' }
            };
        },

        /**
         * Group instruments by type category
         * @param {Array} instruments
         * @returns {Object} Grouped instruments with category info
         */
        groupByCategory(instruments) {
            if (!Array.isArray(instruments)) return {};

            const configs = this.getCategoryConfigs();
            const grouped = {};

            // Initialize categories with instruments
            instruments.forEach(inst => {
                if (!inst?.instrument_type) return;
                const category = this.detectCategory(inst.instrument_type);
                if (!grouped[category]) {
                    grouped[category] = {
                        ...configs[category],
                        instruments: []
                    };
                }
                grouped[category].instruments.push(inst);
            });

            // Sort instruments within each category by status
            const statusOrder = { 'Active': 0, 'Operational': 1, 'Maintenance': 2, 'Inactive': 4 };
            Object.values(grouped).forEach(cat => {
                cat.instruments.sort((a, b) => {
                    const orderA = statusOrder[a.status] ?? 10;
                    const orderB = statusOrder[b.status] ?? 10;
                    if (orderA !== orderB) return orderA - orderB;
                    return (a.display_name || '').localeCompare(b.display_name || '');
                });
            });

            return grouped;
        },

        /**
         * Count instruments by category
         * @param {Array} instruments
         * @returns {Object} Category counts
         */
        countByCategory(instruments) {
            if (!Array.isArray(instruments)) return {};
            const counts = {};
            instruments.forEach(inst => {
                if (!inst?.instrument_type) return;
                const category = this.detectCategory(inst.instrument_type);
                counts[category] = (counts[category] || 0) + 1;
            });
            return counts;
        },

        /**
         * Create safe text element (DOM-based, no innerHTML)
         * @param {string} tag - Element tag
         * @param {string} text - Text content
         * @param {string} className - CSS class
         * @returns {HTMLElement}
         */
        createTextElement(tag, text, className) {
            const el = document.createElement(tag);
            if (className) el.className = className;
            el.textContent = text || '';
            return el;
        },

        /**
         * Create icon element
         * @param {string} iconClass - Font Awesome class (e.g., 'fa-camera')
         * @param {string} color - Optional color
         * @returns {HTMLElement}
         */
        createIcon(iconClass, color) {
            const icon = document.createElement('i');
            icon.className = 'fas ' + iconClass;
            if (color) icon.style.color = color;
            return icon;
        }
    };

    // Export to global
    global.PlatformRenderer = PlatformRenderer;

})(typeof window !== 'undefined' ? window : this);
