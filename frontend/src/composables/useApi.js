/**
 * API Composable
 *
 * Provides reactive API utilities for Vue components.
 *
 * @module composables/useApi
 */

import { ref } from 'vue';
import { api } from '@services/api';

/**
 * Use API composable for making API requests with reactive state
 * @returns {Object} API methods and state
 */
export function useApi() {
  const loading = ref(false);
  const error = ref(null);
  const data = ref(null);

  /**
   * Execute an API request
   * @param {Function} request - Request function
   * @returns {Promise<any>}
   */
  async function execute(request) {
    loading.value = true;
    error.value = null;

    try {
      const response = await request();
      if (response.success) {
        data.value = response.data;
        return response.data;
      } else {
        error.value = response.error || 'Request failed';
        return null;
      }
    } catch (err) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * GET request with reactive state
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<any>}
   */
  async function get(endpoint, params = {}) {
    return execute(() => api.get(endpoint, params));
  }

  /**
   * POST request with reactive state
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<any>}
   */
  async function post(endpoint, body = {}) {
    return execute(() => api.post(endpoint, body));
  }

  /**
   * PUT request with reactive state
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<any>}
   */
  async function put(endpoint, body = {}) {
    return execute(() => api.put(endpoint, body));
  }

  /**
   * DELETE request with reactive state
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>}
   */
  async function del(endpoint) {
    return execute(() => api.delete(endpoint));
  }

  /**
   * Reset state
   */
  function reset() {
    loading.value = false;
    error.value = null;
    data.value = null;
  }

  return {
    // State
    loading,
    error,
    data,

    // Methods
    execute,
    get,
    post,
    put,
    delete: del,
    reset
  };
}

export default useApi;
