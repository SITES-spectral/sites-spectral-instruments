/**
 * Campaign Manager Utilities
 * SITES Spectral v12.0.14
 *
 * Shared utilities and configuration for campaign components.
 * Provides campaign type and status configurations with YAML fallbacks.
 *
 * @module campaigns/campaign-utils
 * @version 12.0.14
 * @requires core/config-service.js (SitesConfig) - optional
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CAMPAIGN TYPE CONFIGURATION
    // =========================================================================

    /**
     * Fallback campaign type configurations
     * Used when YAML config is not available
     */
    const CAMPAIGN_TYPE_FALLBACKS = {
        field_survey: {
            name: 'Field Survey',
            icon: 'fa-clipboard-list',
            color: '#2563eb',
            code: 'FS'
        },
        uav_flight: {
            name: 'UAV Flight Mission',
            icon: 'fa-helicopter',
            color: '#059669',
            code: 'UAV'
        },
        satellite_acquisition: {
            name: 'Satellite Data Acquisition',
            icon: 'fa-satellite',
            color: '#7c3aed',
            code: 'SAT'
        },
        mobile_survey: {
            name: 'Mobile Survey',
            icon: 'fa-truck',
            color: '#f59e0b',
            code: 'MOB'
        },
        flight: {
            name: 'Flight Mission',
            icon: 'fa-helicopter',
            color: '#059669',
            code: 'FLT'
        },
        acquisition: {
            name: 'Acquisition',
            icon: 'fa-download',
            color: '#7c3aed',
            code: 'ACQ'
        },
        survey: {
            name: 'Survey',
            icon: 'fa-clipboard-list',
            color: '#2563eb',
            code: 'SRV'
        },
        monitoring: {
            name: 'Monitoring',
            icon: 'fa-chart-line',
            color: '#0891b2',
            code: 'MON'
        },
        calibration: {
            name: 'Calibration',
            icon: 'fa-bullseye',
            color: '#f59e0b',
            code: 'CAL'
        }
    };

    /**
     * Default campaign type (when unknown)
     */
    const DEFAULT_CAMPAIGN_TYPE = {
        name: 'Unknown',
        icon: 'fa-calendar',
        color: '#6b7280',
        code: 'UNK'
    };

    // =========================================================================
    // CAMPAIGN STATUS CONFIGURATION
    // =========================================================================

    /**
     * Fallback campaign status configurations
     * Used when YAML config is not available
     */
    const CAMPAIGN_STATUS_FALLBACKS = {
        planning: {
            label: 'Planning',
            icon: 'fa-clipboard',
            color: '#6b7280',
            background: '#f3f4f6'
        },
        scheduled: {
            label: 'Scheduled',
            icon: 'fa-calendar-check',
            color: '#3b82f6',
            background: '#dbeafe'
        },
        planned: {
            label: 'Planned',
            icon: 'fa-calendar-check',
            color: '#3b82f6',
            background: '#dbeafe'
        },
        in_progress: {
            label: 'In Progress',
            icon: 'fa-spinner',
            color: '#f59e0b',
            background: '#fef3c7'
        },
        completed: {
            label: 'Completed',
            icon: 'fa-check-circle',
            color: '#22c55e',
            background: '#dcfce7'
        },
        cancelled: {
            label: 'Cancelled',
            icon: 'fa-times-circle',
            color: '#dc2626',
            background: '#fee2e2'
        },
        failed: {
            label: 'Failed',
            icon: 'fa-exclamation-circle',
            color: '#dc2626',
            background: '#fee2e2'
        },
        archived: {
            label: 'Archived',
            icon: 'fa-archive',
            color: '#6b7280',
            background: '#f3f4f6'
        }
    };

    /**
     * Default campaign status (when unknown)
     */
    const DEFAULT_CAMPAIGN_STATUS = {
        label: 'Unknown',
        icon: 'fa-question-circle',
        color: '#6b7280',
        background: '#f3f4f6'
    };

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Get campaign type configuration from YAML or fallback
     * @param {string} typeCode - Campaign type code
     * @returns {Object} Campaign type configuration
     */
    function getCampaignTypeConfig(typeCode) {
        // Try YAML configuration first
        if (global.SitesConfig && global.SitesConfig.isLoaded()) {
            const config = global.SitesConfig.getRawConfig('campaigns');
            if (config?.campaign_types?.[typeCode]) {
                return config.campaign_types[typeCode];
            }
        }

        // Use fallback or default
        return CAMPAIGN_TYPE_FALLBACKS[typeCode] || {
            ...DEFAULT_CAMPAIGN_TYPE,
            name: typeCode || DEFAULT_CAMPAIGN_TYPE.name
        };
    }

    /**
     * Get campaign status configuration from YAML or fallback
     * @param {string} statusCode - Campaign status code
     * @returns {Object} Campaign status configuration
     */
    function getCampaignStatusConfig(statusCode) {
        // Try YAML configuration first
        if (global.SitesConfig && global.SitesConfig.isLoaded()) {
            const config = global.SitesConfig.getRawConfig('campaigns');
            if (config?.campaign_status?.[statusCode]) {
                return config.campaign_status[statusCode];
            }
        }

        // Use fallback or default
        return CAMPAIGN_STATUS_FALLBACKS[statusCode] || {
            ...DEFAULT_CAMPAIGN_STATUS,
            label: statusCode || DEFAULT_CAMPAIGN_STATUS.label
        };
    }

    /**
     * Get all campaign types for dropdown
     * @returns {Array<{value: string, label: string}>} Campaign types
     */
    function getAllCampaignTypes() {
        // Try YAML configuration first
        if (global.SitesConfig && global.SitesConfig.isLoaded()) {
            const config = global.SitesConfig.getRawConfig('campaigns');
            if (config?.campaign_types) {
                return Object.entries(config.campaign_types).map(([key, val]) => ({
                    value: key,
                    label: val.name || key
                }));
            }
        }

        // Fallback list
        return [
            { value: 'flight', label: 'Flight Mission' },
            { value: 'acquisition', label: 'Acquisition' },
            { value: 'survey', label: 'Survey' },
            { value: 'monitoring', label: 'Monitoring' },
            { value: 'calibration', label: 'Calibration' }
        ];
    }

    /**
     * Get all campaign statuses for dropdown
     * @returns {Array<{value: string, label: string}>} Campaign statuses
     */
    function getAllCampaignStatuses() {
        // Try YAML configuration first
        if (global.SitesConfig && global.SitesConfig.isLoaded()) {
            const config = global.SitesConfig.getRawConfig('campaigns');
            if (config?.campaign_status) {
                return Object.entries(config.campaign_status).map(([key, val]) => ({
                    value: key,
                    label: val.label || key
                }));
            }
        }

        // Fallback list
        return [
            { value: 'planned', label: 'Planned' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'failed', label: 'Failed' }
        ];
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Campaign utilities module
     */
    const CampaignUtils = {
        // Configuration constants
        CAMPAIGN_TYPE_FALLBACKS,
        CAMPAIGN_STATUS_FALLBACKS,
        DEFAULT_CAMPAIGN_TYPE,
        DEFAULT_CAMPAIGN_STATUS,

        // Helper functions
        getCampaignTypeConfig,
        getCampaignStatusConfig,
        getAllCampaignTypes,
        getAllCampaignStatuses
    };

    // Export to global scope
    global.CampaignUtils = CampaignUtils;

})(typeof window !== 'undefined' ? window : this);
