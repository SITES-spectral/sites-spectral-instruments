/**
 * SITES Spectral Instruments - API Client
 *
 * Unified API client supporting V12 Hexagonal Architecture with:
 * - Semantic version aliases (/api/latest, /api/stable)
 * - Maintenance and calibration timelines
 * - Pagination, platform extensions, AOI spatial queries, campaigns, and products
 *
 * @module api
 * @version 12.0.3
 * @requires core/debug.js (Debug utilities)
 * @requires core/config-service.js (SitesConfig)
 * @requires core/api-config.js (API configuration service)
 */

(function(global) {
    'use strict';

    // Get debug logger
    const logger = global.Debug?.withCategory('API-V3') || {
        log: () => {},
        info: () => {},
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    /**
     * V3 API Response wrapper
     * Handles the standardized V3 response format with data, meta, and links
     */
    class V3Response {
        /**
         * @param {Object} rawResponse - Raw API response
         * @param {Array|Object} rawResponse.data - Response data
         * @param {Object} [rawResponse.meta] - Pagination metadata
         * @param {Object} [rawResponse.links] - HATEOAS links
         */
        constructor(rawResponse) {
            this.data = rawResponse.data || rawResponse;
            this.meta = rawResponse.meta || null;
            this.links = rawResponse.links || null;
            this._raw = rawResponse;
        }

        /**
         * Check if response has pagination info
         * @returns {boolean}
         */
        hasPagination() {
            return this.meta !== null && typeof this.meta.page !== 'undefined';
        }

        /**
         * Check if there are more pages
         * @returns {boolean}
         */
        hasNextPage() {
            if (!this.hasPagination()) return false;
            return this.meta.page < this.meta.totalPages;
        }

        /**
         * Check if there is a previous page
         * @returns {boolean}
         */
        hasPrevPage() {
            if (!this.hasPagination()) return false;
            return this.meta.page > 1;
        }

        /**
         * Get total count of items
         * @returns {number}
         */
        getTotalCount() {
            return this.meta?.total || (Array.isArray(this.data) ? this.data.length : 1);
        }

        /**
         * Get current page number
         * @returns {number}
         */
        getCurrentPage() {
            return this.meta?.page || 1;
        }

        /**
         * Get total pages
         * @returns {number}
         */
        getTotalPages() {
            return this.meta?.totalPages || 1;
        }

        /**
         * Get page size
         * @returns {number}
         */
        getPageSize() {
            return this.meta?.limit || (Array.isArray(this.data) ? this.data.length : 1);
        }

        /**
         * Get next page URL if available
         * @returns {string|null}
         */
        getNextPageUrl() {
            return this.links?.next || null;
        }

        /**
         * Get previous page URL if available
         * @returns {string|null}
         */
        getPrevPageUrl() {
            return this.links?.prev || null;
        }

        /**
         * Get raw response
         * @returns {Object}
         */
        getRaw() {
            return this._raw;
        }
    }

    /**
     * SITES Spectral API Client
     * Unified API client with support for semantic version aliases
     */
    class SitesSpectralAPIv3 {
        constructor() {
            /** @private */
            this._baseAPI = global.sitesAPI;

            /**
             * Primary API base path - uses /api/latest for production
             * This auto-resolves to the current version (v11) on the server
             */
            this.latestBasePath = '/api/latest';

            /**
             * V3 API base path - NOW uses /api/latest for automatic version resolution
             * v12.0.3: Changed from '/api/v3' to '/api/latest' to ensure frontend
             * always uses the current API version without manual updates
             */
            this.v3BasePath = '/api/latest';

            /** V10/V11 API base path (explicit version) */
            this.v10BasePath = '/api/v10';

            /** V11 API base path (explicit version) */
            this.v11BasePath = '/api/v11';

            /** Default pagination settings from config or sensible defaults */
            this.defaultPageSize = 20;
            this.maxPageSize = 100;

            /** Default timeout for requests (ms) */
            this.defaultTimeout = 15000;

            /** Use API config if available */
            this._apiConfig = global.apiConfig || null;
        }

        /**
         * Get the preferred API base path
         * Uses /api/latest for production, can be overridden by apiConfig
         * @returns {string}
         */
        getPreferredBasePath() {
            if (this._apiConfig) {
                return this._apiConfig.getBasePath();
            }
            return this.latestBasePath;
        }

        // ==========================================
        // Configuration Integration
        // ==========================================

        /**
         * Get configuration value with fallback
         * @private
         * @param {Function} configGetter - Config getter function
         * @param {*} fallback - Fallback value
         * @returns {*}
         */
        _getConfig(configGetter, fallback) {
            try {
                const config = global.SitesConfig;
                if (config && config.isLoaded() && typeof configGetter === 'function') {
                    const value = configGetter(config);
                    return value !== undefined && value !== null ? value : fallback;
                }
            } catch (e) {
                logger.warn('Failed to get config value:', e);
            }
            return fallback;
        }

        /**
         * Get valid platform types from config
         * @returns {Array<string>}
         */
        getValidPlatformTypes() {
            return this._getConfig(
                (config) => Object.keys(config.getActivePlatformTypes()),
                ['fixed', 'uav', 'satellite']
            );
        }

        /**
         * Get valid status codes from config
         * @returns {Array<string>}
         */
        getValidStatuses() {
            return this._getConfig(
                (config) => config.getValidStatusCodes(),
                ['Active', 'Inactive', 'Maintenance', 'Decommissioned']
            );
        }

        // ==========================================
        // Core Request Methods
        // ==========================================

        /**
         * Get authentication headers from base API
         * @returns {Object}
         */
        getAuthHeaders() {
            if (!this._baseAPI) {
                logger.error('Base API not available');
                return { 'Content-Type': 'application/json' };
            }
            return this._baseAPI.getAuthHeaders();
        }

        /**
         * Check if user is authenticated
         * @returns {boolean}
         */
        isAuthenticated() {
            return this._baseAPI?.isAuthenticated() || false;
        }

        /**
         * Build query string from parameters object
         * @private
         * @param {Object} params - Query parameters
         * @returns {string}
         */
        _buildQueryString(params) {
            if (!params || Object.keys(params).length === 0) {
                return '';
            }

            const queryParts = [];
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        // Handle array parameters (e.g., types[]=a&types[]=b)
                        value.forEach(v => {
                            queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`);
                        });
                    } else {
                        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
                    }
                }
            }

            return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        }

        /**
         * Make V3 API request with authentication
         * @private
         * @param {string} endpoint - API endpoint (without /api/v3 prefix)
         * @param {Object} [options={}] - Fetch options
         * @param {boolean} [requireAuth=true] - Whether authentication is required
         * @returns {Promise<V3Response>}
         */
        async _fetchV3(endpoint, options = {}, requireAuth = true) {
            const url = `${this.v3BasePath}${endpoint}`;
            const timeout = options.timeout || this.defaultTimeout;

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const headers = requireAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };

            const config = {
                ...options,
                signal: controller.signal,
                headers: {
                    ...headers,
                    ...(options.headers || {})
                }
            };

            try {
                logger.log(`V3 Request: ${config.method || 'GET'} ${url}`);

                const response = await fetch(url, {
                    ...config,
                    credentials: 'include'  // Send httpOnly cookie with request
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    await this._handleV3Error(response);
                }

                const data = await response.json();
                logger.log(`V3 Response: ${response.status}`, data);

                return new V3Response(data);
            } catch (error) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }

                logger.error(`V3 Request failed for ${url}:`, error);
                throw error;
            }
        }

        /**
         * Make API request using preferred path (/api/latest or configured)
         * This is the recommended method for new code
         * @private
         * @param {string} endpoint - API endpoint (without version prefix)
         * @param {Object} [options={}] - Fetch options
         * @param {boolean} [requireAuth=true] - Whether authentication is required
         * @returns {Promise<V3Response>}
         */
        async _fetchLatest(endpoint, options = {}, requireAuth = true) {
            const basePath = this.getPreferredBasePath();
            const url = `${basePath}${endpoint}`;
            const timeout = options.timeout || this.defaultTimeout;

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const headers = requireAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };

            const config = {
                ...options,
                signal: controller.signal,
                headers: {
                    ...headers,
                    ...(options.headers || {})
                }
            };

            try {
                logger.log(`API Request: ${config.method || 'GET'} ${url}`);

                const response = await fetch(url, {
                    ...config,
                    credentials: 'include'  // Send httpOnly cookie with request
                });
                clearTimeout(timeoutId);

                // Log version info from headers
                const apiVersion = response.headers.get('X-API-Version');
                const versionStatus = response.headers.get('X-API-Version-Status');
                if (apiVersion) {
                    logger.log(`API Version: ${apiVersion} (${versionStatus})`);
                }

                if (!response.ok) {
                    await this._handleV3Error(response);
                }

                const data = await response.json();
                logger.log(`API Response: ${response.status}`, data);

                return new V3Response(data);
            } catch (error) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }

                logger.error(`API Request failed for ${url}:`, error);
                throw error;
            }
        }

        /**
         * Make V10 API request with authentication (V11 Hexagonal Architecture)
         * @deprecated Use _fetchLatest() instead for new code
         * @private
         * @param {string} endpoint - API endpoint (without /api/v10 prefix)
         * @param {Object} [options={}] - Fetch options
         * @param {boolean} [requireAuth=true] - Whether authentication is required
         * @returns {Promise<V3Response>}
         */
        async _fetchV10(endpoint, options = {}, requireAuth = true) {
            // Redirect to _fetchLatest for automatic version resolution
            return this._fetchLatest(endpoint, options, requireAuth);
        }

        /**
         * Handle V3 API errors
         * @private
         * @param {Response} response - Fetch response
         */
        async _handleV3Error(response) {
            // Handle 401 by redirecting to login
            if (response.status === 401) {
                logger.warn('V3 API: Authentication expired');
                if (this._baseAPI) {
                    this._baseAPI.clearAuth();
                }
                global.location.href = '/login.html';
                return;
            }

            let errorMessage = `API Error: ${response.status} ${response.statusText}`;

            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;

                // Include validation errors if present
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorMessage += ': ' + errorData.errors.join(', ');
                }
            } catch (parseError) {
                logger.warn('Could not parse V3 error response:', parseError);
            }

            // Provide user-friendly error messages
            switch (response.status) {
                case 400:
                    errorMessage = errorMessage || 'Invalid request. Please check your input.';
                    break;
                case 403:
                    errorMessage = 'Access denied. You do not have permission to perform this action.';
                    break;
                case 404:
                    errorMessage = 'Resource not found. The requested data may have been deleted.';
                    break;
                case 409:
                    errorMessage = errorMessage || 'Conflict. The resource may already exist.';
                    break;
                case 422:
                    errorMessage = errorMessage || 'Invalid data provided. Please check your input.';
                    break;
                case 429:
                    errorMessage = 'Too many requests. Please wait a moment and try again.';
                    break;
                case 500:
                    errorMessage = 'Server error occurred. Please try again later.';
                    break;
                case 503:
                    errorMessage = 'Service temporarily unavailable. Please try again later.';
                    break;
            }

            throw new Error(errorMessage);
        }

        // ==========================================
        // Platform Methods
        // ==========================================

        /**
         * Get platforms filtered by type
         * @param {string} type - Platform type (fixed, uav, satellite, mobile, usv, uuv)
         * @param {number} [page=1] - Page number
         * @param {number} [limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getPlatformsByType(type, page = 1, limit = null) {
            const validTypes = this.getValidPlatformTypes();
            if (!validTypes.includes(type)) {
                logger.warn(`Platform type '${type}' may not be valid. Valid types: ${validTypes.join(', ')}`);
            }

            const params = {
                type: type,
                page: page,
                limit: limit || this.defaultPageSize
            };

            return this._fetchV3(`/platforms${this._buildQueryString(params)}`);
        }

        /**
         * Get platforms with advanced filtering
         * @param {Object} filters - Filter parameters
         * @param {string} [filters.type] - Platform type
         * @param {string} [filters.station] - Station acronym
         * @param {string} [filters.ecosystem] - Ecosystem code
         * @param {string} [filters.status] - Status filter
         * @param {number} [page=1] - Page number
         * @param {number} [limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getPlatforms(filters = {}, page = 1, limit = null) {
            const params = {
                ...filters,
                page: page,
                limit: limit || this.defaultPageSize
            };

            return this._fetchV3(`/platforms${this._buildQueryString(params)}`);
        }

        /**
         * Get single platform by ID
         * @param {number|string} id - Platform ID
         * @returns {Promise<V3Response>}
         */
        async getPlatform(id) {
            return this._fetchV3(`/platforms/${encodeURIComponent(id)}`);
        }

        /**
         * Get UAV extension data for a platform
         * @param {number|string} platformId - Platform ID
         * @returns {Promise<V3Response>}
         */
        async getPlatformUAVExtension(platformId) {
            return this._fetchV3(`/platforms/${encodeURIComponent(platformId)}/uav`);
        }

        /**
         * Get satellite extension data for a platform
         * @param {number|string} platformId - Platform ID
         * @returns {Promise<V3Response>}
         */
        async getPlatformSatelliteExtension(platformId) {
            return this._fetchV3(`/platforms/${encodeURIComponent(platformId)}/satellite`);
        }

        /**
         * Get mobile extension data for a platform
         * @param {number|string} platformId - Platform ID
         * @returns {Promise<V3Response>}
         */
        async getPlatformMobileExtension(platformId) {
            return this._fetchV3(`/platforms/${encodeURIComponent(platformId)}/mobile`);
        }

        /**
         * Create or update UAV extension for a platform
         * @param {number|string} platformId - Platform ID
         * @param {Object} extensionData - UAV extension data
         * @returns {Promise<V3Response>}
         */
        async savePlatformUAVExtension(platformId, extensionData) {
            return this._fetchV3(`/platforms/${encodeURIComponent(platformId)}/uav`, {
                method: 'PUT',
                body: JSON.stringify(extensionData)
            });
        }

        /**
         * Create or update satellite extension for a platform
         * @param {number|string} platformId - Platform ID
         * @param {Object} extensionData - Satellite extension data
         * @returns {Promise<V3Response>}
         */
        async savePlatformSatelliteExtension(platformId, extensionData) {
            return this._fetchV3(`/platforms/${encodeURIComponent(platformId)}/satellite`, {
                method: 'PUT',
                body: JSON.stringify(extensionData)
            });
        }

        // ==========================================
        // AOI (Area of Interest) Spatial Methods
        // ==========================================

        /**
         * Get AOIs within a bounding box
         * @param {Object} bounds - Bounding box coordinates
         * @param {number} bounds.minLat - Minimum latitude
         * @param {number} bounds.maxLat - Maximum latitude
         * @param {number} bounds.minLon - Minimum longitude
         * @param {number} bounds.maxLon - Maximum longitude
         * @param {Object} [options={}] - Additional options
         * @param {number} [options.page=1] - Page number
         * @param {number} [options.limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getAOIsSpatialBbox(bounds, options = {}) {
            if (!bounds || typeof bounds.minLat !== 'number' || typeof bounds.maxLat !== 'number' ||
                typeof bounds.minLon !== 'number' || typeof bounds.maxLon !== 'number') {
                throw new Error('Invalid bounding box. Required: minLat, maxLat, minLon, maxLon');
            }

            const params = {
                minLat: bounds.minLat,
                maxLat: bounds.maxLat,
                minLon: bounds.minLon,
                maxLon: bounds.maxLon,
                page: options.page || 1,
                limit: options.limit || this.defaultPageSize
            };

            return this._fetchV3(`/aois/spatial/bbox${this._buildQueryString(params)}`);
        }

        /**
         * Get AOIs near a point
         * @param {number} lat - Latitude
         * @param {number} lon - Longitude
         * @param {number} [radius=1000] - Search radius in meters
         * @param {Object} [options={}] - Additional options
         * @returns {Promise<V3Response>}
         */
        async getAOIsSpatialNear(lat, lon, radius = 1000, options = {}) {
            const params = {
                lat: lat,
                lon: lon,
                radius: radius,
                page: options.page || 1,
                limit: options.limit || this.defaultPageSize
            };

            return this._fetchV3(`/aois/spatial/near${this._buildQueryString(params)}`);
        }

        /**
         * Get AOIs as GeoJSON for a station
         * @param {string|number} stationId - Station ID or acronym
         * @param {Object} [options={}] - Additional options
         * @param {string} [options.instrumentId] - Filter by instrument ID
         * @param {boolean} [options.includeMetadata=true] - Include metadata in properties
         * @returns {Promise<V3Response>}
         */
        async getAOIsGeoJSON(stationId, options = {}) {
            const params = {};
            if (options.instrumentId) {
                params.instrumentId = options.instrumentId;
            }
            if (typeof options.includeMetadata !== 'undefined') {
                params.includeMetadata = options.includeMetadata;
            }

            return this._fetchV3(`/stations/${encodeURIComponent(stationId)}/aois/geojson${this._buildQueryString(params)}`);
        }

        /**
         * Get all ROIs/AOIs for a station with pagination
         * @param {string|number} stationId - Station ID or acronym
         * @param {Object} [options={}] - Options
         * @param {number} [options.page=1] - Page number
         * @param {number} [options.limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getStationAOIs(stationId, options = {}) {
            const params = {
                page: options.page || 1,
                limit: options.limit || this.defaultPageSize
            };

            return this._fetchV3(`/stations/${encodeURIComponent(stationId)}/aois${this._buildQueryString(params)}`);
        }

        // ==========================================
        // Campaign Methods
        // ==========================================

        /**
         * Get campaigns with optional filtering
         * @param {Object} [filters={}] - Filter parameters
         * @param {string} [filters.station] - Station acronym
         * @param {string} [filters.status] - Campaign status
         * @param {string} [filters.startDate] - Start date filter (ISO format)
         * @param {string} [filters.endDate] - End date filter (ISO format)
         * @param {string} [filters.type] - Campaign type
         * @param {number} [page=1] - Page number
         * @param {number} [limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getCampaigns(filters = {}, page = 1, limit = null) {
            const params = {
                ...filters,
                page: page,
                limit: limit || this.defaultPageSize
            };

            return this._fetchV3(`/campaigns${this._buildQueryString(params)}`);
        }

        /**
         * Get single campaign by ID
         * @param {number|string} id - Campaign ID
         * @returns {Promise<V3Response>}
         */
        async getCampaign(id) {
            return this._fetchV3(`/campaigns/${encodeURIComponent(id)}`);
        }

        /**
         * Create a new campaign
         * @param {Object} campaignData - Campaign data
         * @param {string} campaignData.name - Campaign name
         * @param {string} [campaignData.description] - Campaign description
         * @param {string} campaignData.startDate - Start date (ISO format)
         * @param {string} [campaignData.endDate] - End date (ISO format)
         * @param {string} [campaignData.stationId] - Associated station ID
         * @param {string} [campaignData.type] - Campaign type
         * @param {Object} [campaignData.metadata] - Additional metadata
         * @returns {Promise<V3Response>}
         */
        async createCampaign(campaignData) {
            if (!campaignData.name) {
                throw new Error('Campaign name is required');
            }
            if (!campaignData.startDate) {
                throw new Error('Campaign start date is required');
            }

            return this._fetchV3('/campaigns', {
                method: 'POST',
                body: JSON.stringify(campaignData)
            });
        }

        /**
         * Update an existing campaign
         * @param {number|string} id - Campaign ID
         * @param {Object} campaignData - Updated campaign data
         * @returns {Promise<V3Response>}
         */
        async updateCampaign(id, campaignData) {
            return this._fetchV3(`/campaigns/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(campaignData)
            });
        }

        /**
         * Delete a campaign
         * @param {number|string} id - Campaign ID
         * @returns {Promise<V3Response>}
         */
        async deleteCampaign(id) {
            return this._fetchV3(`/campaigns/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
        }

        /**
         * Get campaigns for a specific station
         * @param {string} stationAcronym - Station acronym
         * @param {Object} [options={}] - Additional options
         * @param {number} [options.page=1] - Page number
         * @param {number} [options.limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getStationCampaigns(stationAcronym, options = {}) {
            return this.getCampaigns({ station: stationAcronym }, options.page || 1, options.limit);
        }

        // ==========================================
        // Product Methods
        // ==========================================

        /**
         * Get products with optional filtering
         * @param {Object} [filters={}] - Filter parameters
         * @param {string} [filters.station] - Station acronym
         * @param {string} [filters.instrument] - Instrument ID
         * @param {string} [filters.type] - Product type (e.g., 'L1', 'L2', 'L3')
         * @param {string} [filters.status] - Product status
         * @param {string} [filters.startDate] - Start date filter (ISO format)
         * @param {string} [filters.endDate] - End date filter (ISO format)
         * @param {number} [page=1] - Page number
         * @param {number} [limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getProducts(filters = {}, page = 1, limit = null) {
            const params = {
                ...filters,
                page: page,
                limit: limit || this.defaultPageSize
            };

            return this._fetchV3(`/products${this._buildQueryString(params)}`);
        }

        /**
         * Get single product by ID
         * @param {number|string} id - Product ID
         * @returns {Promise<V3Response>}
         */
        async getProduct(id) {
            return this._fetchV3(`/products/${encodeURIComponent(id)}`);
        }

        /**
         * Get products timeline/summary
         * @param {Object} [filters={}] - Filter parameters
         * @param {string} [filters.station] - Station acronym
         * @param {string} [filters.instrument] - Instrument ID
         * @param {string} [filters.type] - Product type
         * @param {string} [filters.startDate] - Start date (ISO format)
         * @param {string} [filters.endDate] - End date (ISO format)
         * @param {string} [filters.groupBy] - Group by (day, week, month, year)
         * @returns {Promise<V3Response>}
         */
        async getProductsTimeline(filters = {}) {
            const params = { ...filters };

            return this._fetchV3(`/products/timeline${this._buildQueryString(params)}`);
        }

        /**
         * Get product statistics
         * @param {Object} [filters={}] - Filter parameters
         * @returns {Promise<V3Response>}
         */
        async getProductsStats(filters = {}) {
            return this._fetchV3(`/products/stats${this._buildQueryString(filters)}`);
        }

        /**
         * Get products for a specific station
         * @param {string} stationAcronym - Station acronym
         * @param {Object} [options={}] - Additional options
         * @param {number} [options.page=1] - Page number
         * @param {number} [options.limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getStationProducts(stationAcronym, options = {}) {
            return this.getProducts({ station: stationAcronym }, options.page || 1, options.limit);
        }

        // ==========================================
        // Instrument Methods (V3 Enhanced)
        // ==========================================

        /**
         * Get instruments with V3 pagination
         * @param {Object} [filters={}] - Filter parameters
         * @param {string} [filters.station] - Station acronym
         * @param {string} [filters.platform] - Platform ID
         * @param {string} [filters.type] - Instrument type
         * @param {string} [filters.status] - Status filter
         * @param {number} [page=1] - Page number
         * @param {number} [limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getInstruments(filters = {}, page = 1, limit = null) {
            const params = {
                ...filters,
                page: page,
                limit: limit || this.defaultPageSize
            };

            return this._fetchV3(`/instruments${this._buildQueryString(params)}`);
        }

        /**
         * Get single instrument by ID
         * @param {number|string} id - Instrument ID
         * @returns {Promise<V3Response>}
         */
        async getInstrument(id) {
            return this._fetchV3(`/instruments/${encodeURIComponent(id)}`);
        }

        // ==========================================
        // Station Methods (V3 Enhanced)
        // ==========================================

        /**
         * Get stations with V3 pagination
         * @param {Object} [filters={}] - Filter parameters
         * @param {number} [page=1] - Page number
         * @param {number} [limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getStations(filters = {}, page = 1, limit = null) {
            const params = {
                ...filters,
                page: page,
                limit: limit || this.defaultPageSize
            };

            return this._fetchV3(`/stations${this._buildQueryString(params)}`);
        }

        /**
         * Get single station by ID or acronym
         * @param {string|number} id - Station ID or acronym
         * @returns {Promise<V3Response>}
         */
        async getStation(id) {
            return this._fetchV3(`/stations/${encodeURIComponent(id)}`);
        }

        /**
         * Get station summary with counts
         * @param {string|number} id - Station ID or acronym
         * @returns {Promise<V3Response>}
         */
        async getStationSummary(id) {
            return this._fetchV3(`/stations/${encodeURIComponent(id)}/summary`);
        }

        // ==========================================
        // Public Endpoints (No Auth Required)
        // ==========================================

        /**
         * Get public station list (no authentication required)
         * @returns {Promise<V3Response>}
         */
        async getPublicStations() {
            return this._fetchV3('/public/stations', {}, false);
        }

        /**
         * Get public station info (no authentication required)
         * @param {string} acronym - Station acronym
         * @returns {Promise<V3Response>}
         */
        async getPublicStation(acronym) {
            return this._fetchV3(`/public/stations/${encodeURIComponent(acronym)}`, {}, false);
        }

        /**
         * Health check endpoint (no authentication required)
         * @returns {Promise<V3Response>}
         */
        async checkHealth() {
            return this._fetchV3('/health', {}, false);
        }

        // ==========================================
        // Maintenance Methods (V11 Architecture)
        // ==========================================

        /**
         * Get maintenance timeline for an entity (platform or instrument)
         * @param {string} entityType - Entity type ('platform' or 'instrument')
         * @param {number|string} entityId - Entity ID
         * @returns {Promise<V3Response>}
         */
        async getMaintenanceTimeline(entityType, entityId) {
            const params = {
                entity_type: entityType,
                entity_id: entityId
            };
            return this._fetchV10(`/maintenance/timeline${this._buildQueryString(params)}`);
        }

        /**
         * Get pending maintenance items
         * @param {Object} [filters={}] - Filter parameters
         * @param {number|string} [filters.stationId] - Filter by station ID
         * @returns {Promise<V3Response>}
         */
        async getPendingMaintenance(filters = {}) {
            return this._fetchV10(`/maintenance/pending${this._buildQueryString(filters)}`);
        }

        /**
         * Get overdue maintenance items
         * @param {Object} [filters={}] - Filter parameters
         * @param {number|string} [filters.stationId] - Filter by station ID
         * @returns {Promise<V3Response>}
         */
        async getOverdueMaintenance(filters = {}) {
            return this._fetchV10(`/maintenance/overdue${this._buildQueryString(filters)}`);
        }

        /**
         * Get all maintenance records with optional filtering
         * @param {Object} [filters={}] - Filter parameters
         * @param {string} [filters.entity_type] - Filter by entity type
         * @param {number|string} [filters.entity_id] - Filter by entity ID
         * @param {string} [filters.status] - Filter by status
         * @param {number} [page=1] - Page number
         * @param {number} [limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getMaintenanceRecords(filters = {}, page = 1, limit = null) {
            const params = {
                ...filters,
                page: page,
                limit: limit || this.defaultPageSize
            };
            return this._fetchV10(`/maintenance${this._buildQueryString(params)}`);
        }

        /**
         * Get single maintenance record by ID
         * @param {number|string} id - Maintenance record ID
         * @returns {Promise<V3Response>}
         */
        async getMaintenanceRecord(id) {
            return this._fetchV10(`/maintenance/${encodeURIComponent(id)}`);
        }

        /**
         * Create a new maintenance record
         * @param {Object} maintenanceData - Maintenance data
         * @param {string} maintenanceData.entity_type - Entity type (platform, instrument)
         * @param {number} maintenanceData.entity_id - Entity ID
         * @param {string} maintenanceData.maintenance_type - Type of maintenance
         * @param {string} [maintenanceData.description] - Description
         * @param {string} [maintenanceData.scheduled_date] - Scheduled date (ISO format)
         * @param {string} [maintenanceData.priority] - Priority level
         * @returns {Promise<V3Response>}
         */
        async createMaintenanceRecord(maintenanceData) {
            return this._fetchV10('/maintenance', {
                method: 'POST',
                body: JSON.stringify(maintenanceData)
            });
        }

        /**
         * Update a maintenance record
         * @param {number|string} id - Maintenance record ID
         * @param {Object} maintenanceData - Updated data
         * @returns {Promise<V3Response>}
         */
        async updateMaintenanceRecord(id, maintenanceData) {
            return this._fetchV10(`/maintenance/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(maintenanceData)
            });
        }

        /**
         * Mark maintenance as complete
         * @param {number|string} id - Maintenance record ID
         * @param {Object} [completionData={}] - Completion details
         * @param {string} [completionData.notes] - Completion notes
         * @param {string} [completionData.completed_date] - Completion date (ISO format)
         * @returns {Promise<V3Response>}
         */
        async completeMaintenanceRecord(id, completionData = {}) {
            return this._fetchV10(`/maintenance/${encodeURIComponent(id)}/complete`, {
                method: 'POST',
                body: JSON.stringify(completionData)
            });
        }

        /**
         * Delete a maintenance record
         * @param {number|string} id - Maintenance record ID
         * @returns {Promise<V3Response>}
         */
        async deleteMaintenanceRecord(id) {
            return this._fetchV10(`/maintenance/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
        }

        // ==========================================
        // Calibration Methods (V11 Architecture)
        // ==========================================

        /**
         * Get calibration timeline for an instrument
         * @param {number|string} instrumentId - Instrument ID
         * @returns {Promise<V3Response>}
         */
        async getCalibrationTimeline(instrumentId) {
            const params = { instrument_id: instrumentId };
            return this._fetchV10(`/calibrations/timeline${this._buildQueryString(params)}`);
        }

        /**
         * Get current calibration for an instrument
         * @param {number|string} instrumentId - Instrument ID
         * @returns {Promise<V3Response>}
         */
        async getCurrentCalibration(instrumentId) {
            const params = { instrument_id: instrumentId };
            return this._fetchV10(`/calibrations/current${this._buildQueryString(params)}`);
        }

        /**
         * Get expired calibrations
         * @param {Object} [filters={}] - Filter parameters
         * @param {number|string} [filters.stationId] - Filter by station ID
         * @returns {Promise<V3Response>}
         */
        async getExpiredCalibrations(filters = {}) {
            return this._fetchV10(`/calibrations/expired${this._buildQueryString(filters)}`);
        }

        /**
         * Get calibrations expiring within a time period
         * @param {number} [days=30] - Days until expiration
         * @param {Object} [filters={}] - Additional filters
         * @returns {Promise<V3Response>}
         */
        async getExpiringCalibrations(days = 30, filters = {}) {
            const params = { days, ...filters };
            return this._fetchV10(`/calibrations/expiring${this._buildQueryString(params)}`);
        }

        /**
         * Get all calibration records with optional filtering
         * @param {Object} [filters={}] - Filter parameters
         * @param {number|string} [filters.instrument_id] - Filter by instrument ID
         * @param {string} [filters.status] - Filter by status
         * @param {number} [page=1] - Page number
         * @param {number} [limit] - Items per page
         * @returns {Promise<V3Response>}
         */
        async getCalibrationRecords(filters = {}, page = 1, limit = null) {
            const params = {
                ...filters,
                page: page,
                limit: limit || this.defaultPageSize
            };
            return this._fetchV10(`/calibrations${this._buildQueryString(params)}`);
        }

        /**
         * Get single calibration record by ID
         * @param {number|string} id - Calibration record ID
         * @returns {Promise<V3Response>}
         */
        async getCalibrationRecord(id) {
            return this._fetchV10(`/calibrations/${encodeURIComponent(id)}`);
        }

        /**
         * Create a new calibration record
         * @param {Object} calibrationData - Calibration data
         * @param {number} calibrationData.instrument_id - Instrument ID
         * @param {string} calibrationData.calibration_date - Calibration date (ISO format)
         * @param {string} [calibrationData.expiration_date] - Expiration date (ISO format)
         * @param {string} [calibrationData.method] - Calibration method
         * @param {string} [calibrationData.certificate_number] - Certificate number
         * @param {Object} [calibrationData.measurements] - Calibration measurements
         * @param {Object} [calibrationData.ambient_conditions] - Ambient conditions
         * @param {Object} [calibrationData.panel_info] - Spectralon panel info
         * @returns {Promise<V3Response>}
         */
        async createCalibrationRecord(calibrationData) {
            return this._fetchV10('/calibrations', {
                method: 'POST',
                body: JSON.stringify(calibrationData)
            });
        }

        /**
         * Update a calibration record
         * @param {number|string} id - Calibration record ID
         * @param {Object} calibrationData - Updated data
         * @returns {Promise<V3Response>}
         */
        async updateCalibrationRecord(id, calibrationData) {
            return this._fetchV10(`/calibrations/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(calibrationData)
            });
        }

        /**
         * Expire a calibration record
         * @param {number|string} id - Calibration record ID
         * @param {Object} [expirationData={}] - Expiration details
         * @param {string} [expirationData.reason] - Expiration reason
         * @returns {Promise<V3Response>}
         */
        async expireCalibrationRecord(id, expirationData = {}) {
            return this._fetchV10(`/calibrations/${encodeURIComponent(id)}/expire`, {
                method: 'POST',
                body: JSON.stringify(expirationData)
            });
        }

        /**
         * Delete a calibration record
         * @param {number|string} id - Calibration record ID
         * @returns {Promise<V3Response>}
         */
        async deleteCalibrationRecord(id) {
            return this._fetchV10(`/calibrations/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
        }

        // ==========================================
        // Pagination Helpers
        // ==========================================

        /**
         * Fetch all pages of a paginated endpoint
         * @param {Function} fetchFn - Fetch function that accepts (filters, page, limit)
         * @param {Object} [filters={}] - Filter parameters
         * @param {number} [limit] - Items per page
         * @param {number} [maxPages=100] - Maximum pages to fetch (safety limit)
         * @returns {Promise<Array>} - All items from all pages
         */
        async fetchAllPages(fetchFn, filters = {}, limit = null, maxPages = 100) {
            const allItems = [];
            let page = 1;
            let hasMore = true;

            while (hasMore && page <= maxPages) {
                const response = await fetchFn.call(this, filters, page, limit);

                if (Array.isArray(response.data)) {
                    allItems.push(...response.data);
                }

                hasMore = response.hasNextPage();
                page++;
            }

            if (page > maxPages) {
                logger.warn(`Reached maximum page limit (${maxPages}). Some results may be missing.`);
            }

            return allItems;
        }

        /**
         * Create a paginated iterator for lazy loading
         * @param {Function} fetchFn - Fetch function that accepts (filters, page, limit)
         * @param {Object} [filters={}] - Filter parameters
         * @param {number} [limit] - Items per page
         * @returns {AsyncGenerator<V3Response>}
         */
        async *paginatedIterator(fetchFn, filters = {}, limit = null) {
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await fetchFn.call(this, filters, page, limit);
                yield response;

                hasMore = response.hasNextPage();
                page++;
            }
        }
    }

    // Create singleton instance
    const apiV3 = new SitesSpectralAPIv3();

    // Export V3Response class for external use
    global.V3Response = V3Response;

    // Export main API instance
    global.sitesAPIv3 = apiV3;

    // Also export class for extensibility
    global.SitesSpectralAPIv3 = SitesSpectralAPIv3;

    logger.log('SITES Spectral API V3 client initialized');

})(typeof window !== 'undefined' ? window : global);
