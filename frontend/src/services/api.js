/**
 * API Service
 *
 * V11 API client for SITES Spectral backend (Hexagonal Architecture).
 * Handles authentication, error handling, and response parsing.
 *
 * V11 Features:
 * - Maintenance tracking for platforms and instruments
 * - Calibration tracking for multispectral/hyperspectral sensors
 * - AOI with GeoJSON/KML import
 * - Campaign management
 * - Product management
 *
 * @module services/api
 */

const API_BASE = '/api/v11';

/**
 * Get stored auth token
 * @returns {string|null}
 */
function getToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Build request headers
 * @returns {Headers}
 */
function buildHeaders() {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

/**
 * Handle API response
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>}
 */
async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    throw new Error(data.error || data.message || `HTTP error ${response.status}`);
  }

  return data;
}

/**
 * Core API client
 */
export const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>}
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: buildHeaders()
    });

    return handleResponse(response);
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>}
   */
  async post(endpoint, data = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });

    return handleResponse(response);
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>}
   */
  async put(endpoint, data = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });

    return handleResponse(response);
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>}
   */
  async delete(endpoint, params = {}) {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: buildHeaders()
    });

    return handleResponse(response);
  }
};

// ============================================================================
// STATION API
// ============================================================================

export const stationApi = {
  list: (params = {}) => api.get('/stations', params),
  get: (id) => api.get(`/stations/${id}`),
  dashboard: (acronym) => api.get(`/stations/${acronym}/dashboard`),
  create: (data) => api.post('/stations', data),
  update: (id, data) => api.put(`/stations/${id}`, data),
  delete: (id) => api.delete(`/stations/${id}`)
};

// ============================================================================
// PLATFORM API
// ============================================================================

export const platformApi = {
  list: (params = {}) => api.get('/platforms', params),
  get: (id) => api.get(`/platforms/${id}`),
  byStation: (stationId) => api.get(`/platforms/station/${stationId}`),
  byType: (type, params = {}) => api.get(`/platforms/type/${type}`, params),
  create: (data) => api.post('/platforms', data),
  update: (id, data) => api.put(`/platforms/${id}`, data),
  delete: (id) => api.delete(`/platforms/${id}`)
};

// ============================================================================
// INSTRUMENT API
// ============================================================================

export const instrumentApi = {
  list: (params = {}) => api.get('/instruments', params),
  get: (id) => api.get(`/instruments/${id}`),
  details: (id) => api.get(`/instruments/${id}/details`),
  byPlatform: (platformId) => api.get(`/instruments/platform/${platformId}`),
  byStation: (stationId) => api.get(`/instruments/station/${stationId}`),
  create: (data) => api.post('/instruments', data),
  update: (id, data) => api.put(`/instruments/${id}`, data),
  delete: (id, cascade = false) => api.delete(`/instruments/${id}`, { cascade })
};

// ============================================================================
// MAINTENANCE API (V11 - New)
// ============================================================================

/**
 * Maintenance API
 *
 * Unified maintenance tracking for both platforms AND instruments.
 * Supports timeline visualization and scheduling.
 */
export const maintenanceApi = {
  // CRUD Operations
  list: (params = {}) => api.get('/maintenance', params),
  get: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),

  // Timeline & Status
  timeline: (entityType, entityId, params = {}) =>
    api.get('/maintenance/timeline', { entity_type: entityType, entity_id: entityId, ...params }),
  pending: (params = {}) => api.get('/maintenance/pending', params),
  overdue: (params = {}) => api.get('/maintenance/overdue', params),

  // Actions
  complete: (id, data) => api.post(`/maintenance/${id}/complete`, data),

  // Convenience methods
  forPlatform: (platformId, params = {}) =>
    api.get('/maintenance', { entity_type: 'platform', entity_id: platformId, ...params }),
  forInstrument: (instrumentId, params = {}) =>
    api.get('/maintenance', { entity_type: 'instrument', entity_id: instrumentId, ...params }),
  forStation: (stationId, params = {}) =>
    api.get('/maintenance', { station_id: stationId, ...params })
};

// ============================================================================
// CALIBRATION API (V11 - New)
// ============================================================================

/**
 * Calibration API
 *
 * Calibration tracking for multispectral and hyperspectral sensors only.
 * Supports field calibration workflow with panel tracking and ambient conditions.
 */
export const calibrationApi = {
  // CRUD Operations
  list: (params = {}) => api.get('/calibrations', params),
  get: (id) => api.get(`/calibrations/${id}`),
  create: (data) => api.post('/calibrations', data),
  update: (id, data) => api.put(`/calibrations/${id}`, data),
  delete: (id) => api.delete(`/calibrations/${id}`),

  // Current & Timeline
  current: (instrumentId, channelId = null) =>
    api.get('/calibrations/current', { instrument_id: instrumentId, channel_id: channelId }),
  timeline: (instrumentId, params = {}) =>
    api.get('/calibrations/timeline', { instrument_id: instrumentId, ...params }),

  // Expiration
  expired: (params = {}) => api.get('/calibrations/expired', params),
  expiring: (days = 30, params = {}) =>
    api.get('/calibrations/expiring', { days, ...params }),

  // Actions
  expire: (id) => api.post(`/calibrations/${id}/expire`),

  // Convenience methods
  forInstrument: (instrumentId, params = {}) =>
    api.get('/calibrations', { instrument_id: instrumentId, ...params }),
  forStation: (stationId, params = {}) =>
    api.get('/calibrations', { station_id: stationId, ...params }),

  // Quality analysis
  statistics: (instrumentId) =>
    api.get(`/calibrations/statistics/${instrumentId}`),
  cloudCoverDistribution: (instrumentId = null) =>
    api.get('/calibrations/cloud-cover-distribution', instrumentId ? { instrument_id: instrumentId } : {}),
  optimalConditions: (instrumentId) =>
    api.get(`/calibrations/optimal-conditions/${instrumentId}`)
};

// ============================================================================
// AOI API (V11 - Enhanced)
// ============================================================================

/**
 * AOI (Area of Interest) API
 *
 * Supports GeoJSON/KML import, platform location mapping, and geospatial queries.
 */
export const aoiApi = {
  // CRUD Operations
  list: (params = {}) => api.get('/aois', params),
  get: (id) => api.get(`/aois/${id}`),
  create: (data) => api.post('/aois', data),
  update: (id, data) => api.put(`/aois/${id}`, data),
  delete: (id) => api.delete(`/aois/${id}`),

  // Filtered queries
  byStation: (stationId, params = {}) =>
    api.get('/aois', { station_id: stationId, ...params }),
  byPlatformType: (stationId, platformType) =>
    api.get('/aois', { station_id: stationId, platform_type: platformType }),
  byGeometryType: (stationId, geometryType) =>
    api.get('/aois', { station_id: stationId, geometry_type: geometryType }),

  // Import/Export
  importGeoJSON: async (stationId, file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('station_id', stationId);
    if (metadata.platformType) formData.append('platform_type', metadata.platformType);
    if (metadata.missionType) formData.append('mission_type', metadata.missionType);
    if (metadata.recurrence) formData.append('recurrence', metadata.recurrence);

    const token = getToken();
    const response = await fetch(`${API_BASE}/aois/import/geojson`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    return handleResponse(response);
  },
  importKML: async (stationId, file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('station_id', stationId);
    if (metadata.platformType) formData.append('platform_type', metadata.platformType);
    if (metadata.missionType) formData.append('mission_type', metadata.missionType);
    if (metadata.recurrence) formData.append('recurrence', metadata.recurrence);

    const token = getToken();
    const response = await fetch(`${API_BASE}/aois/import/kml`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    return handleResponse(response);
  },
  exportGeoJSON: (aoiIds) => api.post('/aois/export/geojson', { aoi_ids: aoiIds })
};

// ============================================================================
// CAMPAIGN API (V11 - Enhanced)
// ============================================================================

/**
 * Campaign API
 *
 * Acquisition campaign management with status workflow.
 */
export const campaignApi = {
  // CRUD Operations
  list: (params = {}) => api.get('/campaigns', params),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),

  // Filtered queries
  byStation: (stationId, params = {}) =>
    api.get('/campaigns', { station_id: stationId, ...params }),
  byPlatform: (platformId, params = {}) =>
    api.get('/campaigns', { platform_id: platformId, ...params }),
  active: (params = {}) =>
    api.get('/campaigns', { status: 'active', ...params }),

  // Status workflow
  start: (id) => api.post(`/campaigns/${id}/start`),
  complete: (id) => api.post(`/campaigns/${id}/complete`),
  cancel: (id) => api.post(`/campaigns/${id}/cancel`),

  // Participants
  addParticipant: (id, userId) =>
    api.post(`/campaigns/${id}/participants`, { user_id: userId }),
  removeParticipant: (id, userId) =>
    api.delete(`/campaigns/${id}/participants/${userId}`)
};

// ============================================================================
// PRODUCT API (V11 - Enhanced)
// ============================================================================

/**
 * Product API
 *
 * Data products with processing levels and quality scoring.
 */
export const productApi = {
  // CRUD Operations
  list: (params = {}) => api.get('/products', params),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),

  // Filtered queries
  byInstrument: (instrumentId, params = {}) =>
    api.get('/products', { instrument_id: instrumentId, ...params }),
  byCampaign: (campaignId, params = {}) =>
    api.get('/products', { campaign_id: campaignId, ...params }),
  byProcessingLevel: (level, params = {}) =>
    api.get('/products', { processing_level: level, ...params }),
  byType: (type, params = {}) =>
    api.get('/products', { type, ...params }),

  // Quality
  updateQualityScore: (id, score) =>
    api.put(`/products/${id}/quality`, { quality_score: score }),

  // DOI
  lookupDOI: (doi) => api.get('/products/doi', { doi })
};

// ============================================================================
// ROI API
// ============================================================================

export const roiApi = {
  list: (instrumentId) => api.get('/rois', { instrument_id: instrumentId }),
  get: (id) => api.get(`/rois/${id}`),
  create: (data) => api.post('/rois', data),
  update: (id, data) => api.put(`/rois/${id}`, data),
  delete: (id) => api.delete(`/rois/${id}`),
  markLegacy: (id, replacedById, reason) =>
    api.post(`/rois/${id}/legacy`, { replaced_by_roi_id: replacedById, legacy_reason: reason })
};

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  login: async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  },
  me: async () => {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: buildHeaders()
    });
    return handleResponse(response);
  }
};

// ============================================================================
// HEALTH API
// ============================================================================

export const healthApi = {
  check: () => api.get('/health'),
  info: () => api.get('/info')
};

export default api;
