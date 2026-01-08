/**
 * SITES Spectral - API Client (ES6 Module)
 *
 * Unified API client supporting V12 Hexagonal Architecture with:
 * - Semantic version aliases (/api/latest, /api/stable)
 * - Maintenance and calibration timelines
 * - Pagination, platform extensions, AOI spatial queries, campaigns, and products
 *
 * @module api/client
 * @version 13.15.0
 */

/**
 * V3 API Response wrapper
 * Handles the standardized V3 response format with data, meta, and links
 */
export class V3Response {
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
 * API Configuration
 */
const API_DEFAULTS = {
    latestBasePath: '/api/latest',
    v3BasePath: '/api/latest',
    v10BasePath: '/api/v10',
    v11BasePath: '/api/v11',
    defaultPageSize: 20,
    maxPageSize: 100,
    defaultTimeout: 15000,
};

/**
 * Token storage key
 */
const TOKEN_STORAGE_KEY = 'sites_auth_token';

/**
 * Get stored authentication token
 * @returns {string|null}
 */
function getStoredToken() {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

/**
 * Store authentication token
 * @param {string} token - JWT token
 */
export function setAuthToken(token) {
    try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
        // localStorage not available
    }
}

/**
 * Clear authentication token
 */
export function clearAuthToken() {
    try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
        // localStorage not available
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
    return !!getStoredToken();
}

/**
 * Get authentication headers
 * @returns {Object}
 */
export function getAuthHeaders() {
    const token = getStoredToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Build query string from parameters object
 * @param {Object} params - Query parameters
 * @returns {string}
 */
function buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) {
        return '';
    }

    const queryParts = [];
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
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
 * Handle API errors
 * @param {Response} response - Fetch response
 */
async function handleApiError(response) {
    // Handle 401 by redirecting to login
    if (response.status === 401) {
        clearAuthToken();
        window.location.href = '/login.html';
        return;
    }

    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;

        if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage += ': ' + errorData.errors.join(', ');
        }
    } catch {
        // Could not parse error response
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

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {Object} [options={}] - Fetch options
 * @param {boolean} [requireAuth=true] - Whether authentication is required
 * @returns {Promise<V3Response>}
 */
async function fetchApi(endpoint, options = {}, requireAuth = true) {
    const url = `${API_DEFAULTS.latestBasePath}${endpoint}`;
    const timeout = options.timeout || API_DEFAULTS.defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers = requireAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' };

    const config = {
        ...options,
        signal: controller.signal,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
            await handleApiError(response);
        }

        const data = await response.json();
        return new V3Response(data);
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }

        throw error;
    }
}

// ==========================================
// Station API
// ==========================================

/**
 * Get stations with pagination
 * @param {Object} [filters={}] - Filter parameters
 * @param {number} [page=1] - Page number
 * @param {number} [limit] - Items per page
 * @returns {Promise<V3Response>}
 */
export async function getStations(filters = {}, page = 1, limit = null) {
    const params = {
        ...filters,
        page: page,
        limit: limit || API_DEFAULTS.defaultPageSize
    };
    return fetchApi(`/stations${buildQueryString(params)}`);
}

/**
 * Get single station by ID or acronym
 * @param {string|number} id - Station ID or acronym
 * @returns {Promise<V3Response>}
 */
export async function getStation(id) {
    return fetchApi(`/stations/${encodeURIComponent(id)}`);
}

/**
 * Get station summary with counts
 * @param {string|number} id - Station ID or acronym
 * @returns {Promise<V3Response>}
 */
export async function getStationSummary(id) {
    return fetchApi(`/stations/${encodeURIComponent(id)}/summary`);
}

/**
 * Get public station list (no authentication required)
 * @returns {Promise<V3Response>}
 */
export async function getPublicStations() {
    return fetchApi('/public/stations', {}, false);
}

/**
 * Get public station info (no authentication required)
 * @param {string} acronym - Station acronym
 * @returns {Promise<V3Response>}
 */
export async function getPublicStation(acronym) {
    return fetchApi(`/public/stations/${encodeURIComponent(acronym)}`, {}, false);
}

// ==========================================
// Platform API
// ==========================================

/**
 * Get platforms with filtering
 * @param {Object} [filters={}] - Filter parameters
 * @param {number} [page=1] - Page number
 * @param {number} [limit] - Items per page
 * @returns {Promise<V3Response>}
 */
export async function getPlatforms(filters = {}, page = 1, limit = null) {
    const params = {
        ...filters,
        page: page,
        limit: limit || API_DEFAULTS.defaultPageSize
    };
    return fetchApi(`/platforms${buildQueryString(params)}`);
}

/**
 * Get platforms by type
 * @param {string} type - Platform type
 * @param {number} [page=1] - Page number
 * @param {number} [limit] - Items per page
 * @returns {Promise<V3Response>}
 */
export async function getPlatformsByType(type, page = 1, limit = null) {
    return getPlatforms({ type }, page, limit);
}

/**
 * Get single platform by ID
 * @param {number|string} id - Platform ID
 * @returns {Promise<V3Response>}
 */
export async function getPlatform(id) {
    return fetchApi(`/platforms/${encodeURIComponent(id)}`);
}

/**
 * Get UAV extension data for a platform
 * @param {number|string} platformId - Platform ID
 * @returns {Promise<V3Response>}
 */
export async function getPlatformUAVExtension(platformId) {
    return fetchApi(`/platforms/${encodeURIComponent(platformId)}/uav`);
}

/**
 * Get satellite extension data for a platform
 * @param {number|string} platformId - Platform ID
 * @returns {Promise<V3Response>}
 */
export async function getPlatformSatelliteExtension(platformId) {
    return fetchApi(`/platforms/${encodeURIComponent(platformId)}/satellite`);
}

/**
 * Save UAV extension for a platform
 * @param {number|string} platformId - Platform ID
 * @param {Object} extensionData - UAV extension data
 * @returns {Promise<V3Response>}
 */
export async function savePlatformUAVExtension(platformId, extensionData) {
    return fetchApi(`/platforms/${encodeURIComponent(platformId)}/uav`, {
        method: 'PUT',
        body: JSON.stringify(extensionData)
    });
}

/**
 * Save satellite extension for a platform
 * @param {number|string} platformId - Platform ID
 * @param {Object} extensionData - Satellite extension data
 * @returns {Promise<V3Response>}
 */
export async function savePlatformSatelliteExtension(platformId, extensionData) {
    return fetchApi(`/platforms/${encodeURIComponent(platformId)}/satellite`, {
        method: 'PUT',
        body: JSON.stringify(extensionData)
    });
}

// ==========================================
// Instrument API
// ==========================================

/**
 * Get instruments with pagination
 * @param {Object} [filters={}] - Filter parameters
 * @param {number} [page=1] - Page number
 * @param {number} [limit] - Items per page
 * @returns {Promise<V3Response>}
 */
export async function getInstruments(filters = {}, page = 1, limit = null) {
    const params = {
        ...filters,
        page: page,
        limit: limit || API_DEFAULTS.defaultPageSize
    };
    return fetchApi(`/instruments${buildQueryString(params)}`);
}

/**
 * Get single instrument by ID
 * @param {number|string} id - Instrument ID
 * @returns {Promise<V3Response>}
 */
export async function getInstrument(id) {
    return fetchApi(`/instruments/${encodeURIComponent(id)}`);
}

// ==========================================
// AOI/ROI API
// ==========================================

/**
 * Get AOIs within a bounding box
 * @param {Object} bounds - Bounding box coordinates
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<V3Response>}
 */
export async function getAOIsSpatialBbox(bounds, options = {}) {
    if (!bounds || typeof bounds.minLat !== 'number') {
        throw new Error('Invalid bounding box. Required: minLat, maxLat, minLon, maxLon');
    }

    const params = {
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLon: bounds.minLon,
        maxLon: bounds.maxLon,
        page: options.page || 1,
        limit: options.limit || API_DEFAULTS.defaultPageSize
    };

    return fetchApi(`/aois/spatial/bbox${buildQueryString(params)}`);
}

/**
 * Get AOIs near a point
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} [radius=1000] - Search radius in meters
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<V3Response>}
 */
export async function getAOIsSpatialNear(lat, lon, radius = 1000, options = {}) {
    const params = {
        lat: lat,
        lon: lon,
        radius: radius,
        page: options.page || 1,
        limit: options.limit || API_DEFAULTS.defaultPageSize
    };

    return fetchApi(`/aois/spatial/near${buildQueryString(params)}`);
}

/**
 * Get AOIs as GeoJSON for a station
 * @param {string|number} stationId - Station ID or acronym
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<V3Response>}
 */
export async function getAOIsGeoJSON(stationId, options = {}) {
    const params = {};
    if (options.instrumentId) {
        params.instrumentId = options.instrumentId;
    }
    if (typeof options.includeMetadata !== 'undefined') {
        params.includeMetadata = options.includeMetadata;
    }

    return fetchApi(`/stations/${encodeURIComponent(stationId)}/aois/geojson${buildQueryString(params)}`);
}

/**
 * Get all ROIs/AOIs for a station
 * @param {string|number} stationId - Station ID or acronym
 * @param {Object} [options={}] - Options
 * @returns {Promise<V3Response>}
 */
export async function getStationAOIs(stationId, options = {}) {
    const params = {
        page: options.page || 1,
        limit: options.limit || API_DEFAULTS.defaultPageSize
    };

    return fetchApi(`/stations/${encodeURIComponent(stationId)}/aois${buildQueryString(params)}`);
}

// ==========================================
// Campaign API
// ==========================================

/**
 * Get campaigns with filtering
 * @param {Object} [filters={}] - Filter parameters
 * @param {number} [page=1] - Page number
 * @param {number} [limit] - Items per page
 * @returns {Promise<V3Response>}
 */
export async function getCampaigns(filters = {}, page = 1, limit = null) {
    const params = {
        ...filters,
        page: page,
        limit: limit || API_DEFAULTS.defaultPageSize
    };

    return fetchApi(`/campaigns${buildQueryString(params)}`);
}

/**
 * Get single campaign by ID
 * @param {number|string} id - Campaign ID
 * @returns {Promise<V3Response>}
 */
export async function getCampaign(id) {
    return fetchApi(`/campaigns/${encodeURIComponent(id)}`);
}

/**
 * Create a new campaign
 * @param {Object} campaignData - Campaign data
 * @returns {Promise<V3Response>}
 */
export async function createCampaign(campaignData) {
    if (!campaignData.name) {
        throw new Error('Campaign name is required');
    }
    if (!campaignData.startDate) {
        throw new Error('Campaign start date is required');
    }

    return fetchApi('/campaigns', {
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
export async function updateCampaign(id, campaignData) {
    return fetchApi(`/campaigns/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(campaignData)
    });
}

/**
 * Delete a campaign
 * @param {number|string} id - Campaign ID
 * @returns {Promise<V3Response>}
 */
export async function deleteCampaign(id) {
    return fetchApi(`/campaigns/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
}

// ==========================================
// Product API
// ==========================================

/**
 * Get products with filtering
 * @param {Object} [filters={}] - Filter parameters
 * @param {number} [page=1] - Page number
 * @param {number} [limit] - Items per page
 * @returns {Promise<V3Response>}
 */
export async function getProducts(filters = {}, page = 1, limit = null) {
    const params = {
        ...filters,
        page: page,
        limit: limit || API_DEFAULTS.defaultPageSize
    };

    return fetchApi(`/products${buildQueryString(params)}`);
}

/**
 * Get single product by ID
 * @param {number|string} id - Product ID
 * @returns {Promise<V3Response>}
 */
export async function getProduct(id) {
    return fetchApi(`/products/${encodeURIComponent(id)}`);
}

/**
 * Get products timeline/summary
 * @param {Object} [filters={}] - Filter parameters
 * @returns {Promise<V3Response>}
 */
export async function getProductsTimeline(filters = {}) {
    return fetchApi(`/products/timeline${buildQueryString(filters)}`);
}

/**
 * Get product statistics
 * @param {Object} [filters={}] - Filter parameters
 * @returns {Promise<V3Response>}
 */
export async function getProductsStats(filters = {}) {
    return fetchApi(`/products/stats${buildQueryString(filters)}`);
}

// ==========================================
// Maintenance API
// ==========================================

/**
 * Get maintenance timeline for an entity
 * @param {string} entityType - Entity type ('platform' or 'instrument')
 * @param {number|string} entityId - Entity ID
 * @returns {Promise<V3Response>}
 */
export async function getMaintenanceTimeline(entityType, entityId) {
    const params = {
        entity_type: entityType,
        entity_id: entityId
    };
    return fetchApi(`/maintenance/timeline${buildQueryString(params)}`);
}

/**
 * Get pending maintenance items
 * @param {Object} [filters={}] - Filter parameters
 * @returns {Promise<V3Response>}
 */
export async function getPendingMaintenance(filters = {}) {
    return fetchApi(`/maintenance/pending${buildQueryString(filters)}`);
}

/**
 * Get overdue maintenance items
 * @param {Object} [filters={}] - Filter parameters
 * @returns {Promise<V3Response>}
 */
export async function getOverdueMaintenance(filters = {}) {
    return fetchApi(`/maintenance/overdue${buildQueryString(filters)}`);
}

/**
 * Get all maintenance records
 * @param {Object} [filters={}] - Filter parameters
 * @param {number} [page=1] - Page number
 * @param {number} [limit] - Items per page
 * @returns {Promise<V3Response>}
 */
export async function getMaintenanceRecords(filters = {}, page = 1, limit = null) {
    const params = {
        ...filters,
        page: page,
        limit: limit || API_DEFAULTS.defaultPageSize
    };
    return fetchApi(`/maintenance${buildQueryString(params)}`);
}

/**
 * Get single maintenance record by ID
 * @param {number|string} id - Maintenance record ID
 * @returns {Promise<V3Response>}
 */
export async function getMaintenanceRecord(id) {
    return fetchApi(`/maintenance/${encodeURIComponent(id)}`);
}

/**
 * Create a new maintenance record
 * @param {Object} maintenanceData - Maintenance data
 * @returns {Promise<V3Response>}
 */
export async function createMaintenanceRecord(maintenanceData) {
    return fetchApi('/maintenance', {
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
export async function updateMaintenanceRecord(id, maintenanceData) {
    return fetchApi(`/maintenance/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(maintenanceData)
    });
}

/**
 * Mark maintenance as complete
 * @param {number|string} id - Maintenance record ID
 * @param {Object} [completionData={}] - Completion details
 * @returns {Promise<V3Response>}
 */
export async function completeMaintenanceRecord(id, completionData = {}) {
    return fetchApi(`/maintenance/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
        body: JSON.stringify(completionData)
    });
}

/**
 * Delete a maintenance record
 * @param {number|string} id - Maintenance record ID
 * @returns {Promise<V3Response>}
 */
export async function deleteMaintenanceRecord(id) {
    return fetchApi(`/maintenance/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
}

// ==========================================
// Calibration API
// ==========================================

/**
 * Get calibration timeline for an instrument
 * @param {number|string} instrumentId - Instrument ID
 * @returns {Promise<V3Response>}
 */
export async function getCalibrationTimeline(instrumentId) {
    const params = { instrument_id: instrumentId };
    return fetchApi(`/calibrations/timeline${buildQueryString(params)}`);
}

/**
 * Get current calibration for an instrument
 * @param {number|string} instrumentId - Instrument ID
 * @returns {Promise<V3Response>}
 */
export async function getCurrentCalibration(instrumentId) {
    const params = { instrument_id: instrumentId };
    return fetchApi(`/calibrations/current${buildQueryString(params)}`);
}

/**
 * Get expired calibrations
 * @param {Object} [filters={}] - Filter parameters
 * @returns {Promise<V3Response>}
 */
export async function getExpiredCalibrations(filters = {}) {
    return fetchApi(`/calibrations/expired${buildQueryString(filters)}`);
}

/**
 * Get calibrations expiring within a time period
 * @param {number} [days=30] - Days until expiration
 * @param {Object} [filters={}] - Additional filters
 * @returns {Promise<V3Response>}
 */
export async function getExpiringCalibrations(days = 30, filters = {}) {
    const params = { days, ...filters };
    return fetchApi(`/calibrations/expiring${buildQueryString(params)}`);
}

/**
 * Get all calibration records
 * @param {Object} [filters={}] - Filter parameters
 * @param {number} [page=1] - Page number
 * @param {number} [limit] - Items per page
 * @returns {Promise<V3Response>}
 */
export async function getCalibrationRecords(filters = {}, page = 1, limit = null) {
    const params = {
        ...filters,
        page: page,
        limit: limit || API_DEFAULTS.defaultPageSize
    };
    return fetchApi(`/calibrations${buildQueryString(params)}`);
}

/**
 * Get single calibration record by ID
 * @param {number|string} id - Calibration record ID
 * @returns {Promise<V3Response>}
 */
export async function getCalibrationRecord(id) {
    return fetchApi(`/calibrations/${encodeURIComponent(id)}`);
}

/**
 * Create a new calibration record
 * @param {Object} calibrationData - Calibration data
 * @returns {Promise<V3Response>}
 */
export async function createCalibrationRecord(calibrationData) {
    return fetchApi('/calibrations', {
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
export async function updateCalibrationRecord(id, calibrationData) {
    return fetchApi(`/calibrations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(calibrationData)
    });
}

/**
 * Expire a calibration record
 * @param {number|string} id - Calibration record ID
 * @param {Object} [expirationData={}] - Expiration details
 * @returns {Promise<V3Response>}
 */
export async function expireCalibrationRecord(id, expirationData = {}) {
    return fetchApi(`/calibrations/${encodeURIComponent(id)}/expire`, {
        method: 'POST',
        body: JSON.stringify(expirationData)
    });
}

/**
 * Delete a calibration record
 * @param {number|string} id - Calibration record ID
 * @returns {Promise<V3Response>}
 */
export async function deleteCalibrationRecord(id) {
    return fetchApi(`/calibrations/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
}

// ==========================================
// Utility API
// ==========================================

/**
 * Health check endpoint (no authentication required)
 * @returns {Promise<V3Response>}
 */
export async function checkHealth() {
    return fetchApi('/health', {}, false);
}

/**
 * Fetch all pages of a paginated endpoint
 * @param {Function} fetchFn - Fetch function that accepts (filters, page, limit)
 * @param {Object} [filters={}] - Filter parameters
 * @param {number} [limit] - Items per page
 * @param {number} [maxPages=100] - Maximum pages to fetch
 * @returns {Promise<Array>} - All items from all pages
 */
export async function fetchAllPages(fetchFn, filters = {}, limit = null, maxPages = 100) {
    const allItems = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
        const response = await fetchFn(filters, page, limit);

        if (Array.isArray(response.data)) {
            allItems.push(...response.data);
        }

        hasMore = response.hasNextPage();
        page++;
    }

    return allItems;
}

/**
 * API namespace export for convenient access
 */
export const API = {
    // Auth
    setAuthToken,
    clearAuthToken,
    isAuthenticated,
    getAuthHeaders,

    // Stations
    getStations,
    getStation,
    getStationSummary,
    getPublicStations,
    getPublicStation,

    // Platforms
    getPlatforms,
    getPlatformsByType,
    getPlatform,
    getPlatformUAVExtension,
    getPlatformSatelliteExtension,
    savePlatformUAVExtension,
    savePlatformSatelliteExtension,

    // Instruments
    getInstruments,
    getInstrument,

    // AOI/ROI
    getAOIsSpatialBbox,
    getAOIsSpatialNear,
    getAOIsGeoJSON,
    getStationAOIs,

    // Campaigns
    getCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,

    // Products
    getProducts,
    getProduct,
    getProductsTimeline,
    getProductsStats,

    // Maintenance
    getMaintenanceTimeline,
    getPendingMaintenance,
    getOverdueMaintenance,
    getMaintenanceRecords,
    getMaintenanceRecord,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    completeMaintenanceRecord,
    deleteMaintenanceRecord,

    // Calibration
    getCalibrationTimeline,
    getCurrentCalibration,
    getExpiredCalibrations,
    getExpiringCalibrations,
    getCalibrationRecords,
    getCalibrationRecord,
    createCalibrationRecord,
    updateCalibrationRecord,
    expireCalibrationRecord,
    deleteCalibrationRecord,

    // Utility
    checkHealth,
    fetchAllPages,
};

export default API;
