/**
 * API Service
 *
 * V3 API client for SITES Spectral backend.
 * Handles authentication, error handling, and response parsing.
 *
 * @module services/api
 */

const API_BASE = '/api';

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

    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

/**
 * API client
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
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>}
   */
  async patch(endpoint, data = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    });

    return handleResponse(response);
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>}
   */
  async delete(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders()
    });

    return handleResponse(response);
  }
};

export default api;
