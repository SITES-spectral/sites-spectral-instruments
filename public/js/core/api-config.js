/**
 * API Configuration Service
 * SITES Spectral v11.0.0-alpha.33
 *
 * Single source of truth for API endpoints in the frontend.
 * Uses semantic aliases (/api/latest) for production to avoid
 * hardcoding version numbers that require updates on each release.
 *
 * @module core/api-config
 */

(function(global) {
    'use strict';

    /**
     * API Configuration by environment
     *
     * Production: Uses /api/latest (auto-resolves to current version)
     * Development: Can pin to specific version for testing
     * Test: Pinned for stability
     */
    const API_CONFIG = {
        production: {
            basePath: '/api/latest',
            versionMode: 'alias',
            description: 'Uses semantic alias - auto-resolves to current version'
        },
        staging: {
            basePath: '/api/latest',
            versionMode: 'alias',
            description: 'Staging uses latest alias for pre-production testing'
        },
        development: {
            basePath: '/api/v11',
            versionMode: 'explicit',
            description: 'Pin to specific version for development'
        },
        test: {
            basePath: '/api/v11',
            versionMode: 'explicit',
            description: 'Pin to specific version for testing stability'
        }
    };

    /**
     * Known production hostnames
     */
    const PRODUCTION_HOSTS = [
        'sites.jobelab.com',
        'sites-spectral-instruments.jose-e5f.workers.dev'
    ];

    /**
     * Known staging hostnames
     */
    const STAGING_HOSTS = [
        'staging.sites.jobelab.com'
    ];

    /**
     * API Configuration Service Class
     */
    class APIConfigService {
        constructor() {
            this.environment = this._detectEnvironment();
            this.config = API_CONFIG[this.environment];
            this._cachedVersionInfo = null;
        }

        /**
         * Detect current environment based on hostname
         * @private
         * @returns {string}
         */
        _detectEnvironment() {
            const hostname = window.location.hostname;

            if (PRODUCTION_HOSTS.includes(hostname)) {
                return 'production';
            }

            if (STAGING_HOSTS.includes(hostname)) {
                return 'staging';
            }

            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'development';
            }

            // Default to development for unknown hosts
            return 'development';
        }

        /**
         * Get the current environment
         * @returns {string}
         */
        getEnvironment() {
            return this.environment;
        }

        /**
         * Get the base API path
         * @returns {string}
         */
        getBasePath() {
            return this.config.basePath;
        }

        /**
         * Check if using semantic alias
         * @returns {boolean}
         */
        isUsingAlias() {
            return this.config.versionMode === 'alias';
        }

        /**
         * Build full API URL for an endpoint
         * @param {string} path - API path (e.g., '/stations', '/instruments/123')
         * @returns {string}
         */
        buildUrl(path) {
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            return `${this.config.basePath}${cleanPath}`;
        }

        /**
         * Create a version-specific URL builder
         * @param {string} version - Version or alias (e.g., 'v11', 'latest', 'v10')
         * @returns {Object} Object with buildUrl method
         */
        withVersion(version) {
            const basePath = `/api/${version}`;
            return {
                basePath,
                buildUrl: (path) => {
                    const cleanPath = path.startsWith('/') ? path : `/${path}`;
                    return `${basePath}${cleanPath}`;
                }
            };
        }

        /**
         * Get V3 API path (legacy)
         * @deprecated Use getBasePath() instead - returns /api/latest for automatic version resolution
         * @returns {string}
         */
        getV3Path() {
            console.warn('APIConfig.getV3Path() is deprecated. Use getBasePath() for automatic version resolution');
            return '/api/latest';
        }

        /**
         * Get V10 API path (legacy)
         * @deprecated Use getBasePath() instead - returns /api/latest for automatic version resolution
         * @returns {string}
         */
        getV10Path() {
            console.warn('APIConfig.getV10Path() is deprecated. Use getBasePath() for automatic version resolution');
            return '/api/latest';
        }

        /**
         * Fetch version info from server
         * @returns {Promise<Object>}
         */
        async fetchVersionInfo() {
            if (this._cachedVersionInfo) {
                return this._cachedVersionInfo;
            }

            try {
                const response = await fetch('/api/health');
                if (response.ok) {
                    const data = await response.json();
                    this._cachedVersionInfo = data.api || {};
                    return this._cachedVersionInfo;
                }
            } catch (error) {
                console.warn('Failed to fetch version info:', error);
            }

            return {
                current: 'v11',
                aliases: { latest: 'v11', stable: 'v11' },
                supported: ['v11', 'v10']
            };
        }

        /**
         * Get configuration info for debugging
         * @returns {Object}
         */
        getDebugInfo() {
            return {
                environment: this.environment,
                basePath: this.config.basePath,
                versionMode: this.config.versionMode,
                description: this.config.description,
                hostname: window.location.hostname,
                isAlias: this.isUsingAlias()
            };
        }
    }

    // Create singleton instance
    const apiConfig = new APIConfigService();

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { APIConfigService, apiConfig };
    }

    // Make globally available
    global.APIConfigService = APIConfigService;
    global.apiConfig = apiConfig;

    // Log configuration on load (development only)
    if (apiConfig.getEnvironment() === 'development') {
        console.log('API Config loaded:', apiConfig.getDebugInfo());
    }

})(typeof window !== 'undefined' ? window : global);
