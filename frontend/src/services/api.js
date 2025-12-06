/**
 * API Service
 *
 * V10 API client for SITES Spectral backend (Hexagonal Architecture).
 * Handles authentication, error handling, and response parsing.
 *
 * @module services/api
 */

const API_BASE = '/api/v10';

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

/**
 * Station API
 */
export const stationApi = {
  list: (params = {}) => api.get('/stations', params),
  get: (id) => api.get(`/stations/${id}`),
  dashboard: (acronym) => api.get(`/stations/${acronym}/dashboard`),
  create: (data) => api.post('/stations', data),
  update: (id, data) => api.put(`/stations/${id}`, data),
  delete: (id) => api.delete(`/stations/${id}`)
};

/**
 * Platform API
 */
export const platformApi = {
  list: (params = {}) => api.get('/platforms', params),
  get: (id) => api.get(`/platforms/${id}`),
  byStation: (stationId) => api.get(`/platforms/station/${stationId}`),
  byType: (type, params = {}) => api.get(`/platforms/type/${type}`, params),
  create: (data) => api.post('/platforms', data),
  update: (id, data) => api.put(`/platforms/${id}`, data),
  delete: (id) => api.delete(`/platforms/${id}`)
};

/**
 * Instrument API
 */
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

/**
 * Auth API (uses legacy endpoint)
 */
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

/**
 * Health check
 */
export const healthApi = {
  check: () => api.get('/health'),
  info: () => api.get('/info')
};

export default api;
