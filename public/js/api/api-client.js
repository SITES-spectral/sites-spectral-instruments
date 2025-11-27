/**
 * API Client
 *
 * Base API client for SITES Spectral application.
 * Handles authentication, error handling, and request/response interceptors.
 *
 * @module api/api-client
 * @version 8.0.0
 */

(function(global) {
    'use strict';

    /**
     * API Client Class
     */
    class APIClient {
        constructor() {
            /** @private */
            this.baseUrl = null;

            /** @private */
            this.authToken = null;

            /** @private */
            this.defaultHeaders = {
                'Content-Type': 'application/json'
            };

            /** @private */
            this.requestInterceptors = [];

            /** @private */
            this.responseInterceptors = [];

            /** @private */
            this.errorInterceptors = [];

            // Initialize base URL from meta tag or current origin
            this._initializeBaseUrl();

            // Load auth token from localStorage
            this._loadAuthToken();
        }

        /**
         * Initialize base URL
         * @private
         */
        _initializeBaseUrl() {
            // Try to get from meta tag
            const metaTag = document.querySelector('meta[name="api-base-url"]');
            if (metaTag) {
                this.baseUrl = metaTag.content;
                return;
            }

            // Fallback to current origin
            this.baseUrl = window.location.origin;
        }

        /**
         * Load auth token from localStorage
         * @private
         */
        _loadAuthToken() {
            try {
                this.authToken = localStorage.getItem('authToken');
            } catch (error) {
                console.warn('Failed to load auth token from localStorage:', error);
            }
        }

        /**
         * Set authentication token
         * @param {string} token - JWT token
         */
        setAuthToken(token) {
            this.authToken = token;
            try {
                if (token) {
                    localStorage.setItem('authToken', token);
                } else {
                    localStorage.removeItem('authToken');
                }
            } catch (error) {
                console.warn('Failed to save auth token to localStorage:', error);
            }
        }

        /**
         * Get authentication token
         * @returns {string|null}
         */
        getAuthToken() {
            return this.authToken;
        }

        /**
         * Clear authentication token
         */
        clearAuthToken() {
            this.setAuthToken(null);
        }

        /**
         * Set base URL
         * @param {string} url - Base URL
         */
        setBaseUrl(url) {
            this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
        }

        /**
         * Build full URL
         * @private
         * @param {string} endpoint - API endpoint
         * @returns {string} Full URL
         */
        _buildUrl(endpoint) {
            // If endpoint is already a full URL, return it
            if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
                return endpoint;
            }

            // Ensure endpoint starts with /
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

            return `${this.baseUrl}${cleanEndpoint}`;
        }

        /**
         * Build headers
         * @private
         * @param {Object} customHeaders - Custom headers
         * @returns {Object} Complete headers
         */
        _buildHeaders(customHeaders = {}) {
            const headers = { ...this.defaultHeaders, ...customHeaders };

            // Add auth token if present
            if (this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            return headers;
        }

        /**
         * Execute request interceptors
         * @private
         * @param {Object} config - Request config
         * @returns {Object} Modified config
         */
        async _executeRequestInterceptors(config) {
            let modifiedConfig = config;

            for (const interceptor of this.requestInterceptors) {
                try {
                    modifiedConfig = await interceptor(modifiedConfig);
                } catch (error) {
                    console.error('Request interceptor error:', error);
                }
            }

            return modifiedConfig;
        }

        /**
         * Execute response interceptors
         * @private
         * @param {Response} response - Fetch response
         * @returns {Response} Modified response
         */
        async _executeResponseInterceptors(response) {
            let modifiedResponse = response;

            for (const interceptor of this.responseInterceptors) {
                try {
                    modifiedResponse = await interceptor(modifiedResponse);
                } catch (error) {
                    console.error('Response interceptor error:', error);
                }
            }

            return modifiedResponse;
        }

        /**
         * Execute error interceptors
         * @private
         * @param {Error} error - Error object
         * @returns {Error} Modified error
         */
        async _executeErrorInterceptors(error) {
            let modifiedError = error;

            for (const interceptor of this.errorInterceptors) {
                try {
                    modifiedError = await interceptor(modifiedError);
                } catch (err) {
                    console.error('Error interceptor error:', err);
                }
            }

            return modifiedError;
        }

        /**
         * Make HTTP request
         * @param {string} endpoint - API endpoint
         * @param {Object} options - Fetch options
         * @returns {Promise<any>} Response data
         */
        async request(endpoint, options = {}) {
            try {
                // Build request config
                let config = {
                    url: this._buildUrl(endpoint),
                    method: options.method || 'GET',
                    headers: this._buildHeaders(options.headers),
                    ...options
                };

                // Execute request interceptors
                config = await this._executeRequestInterceptors(config);

                // Make request
                const response = await fetch(config.url, {
                    method: config.method,
                    headers: config.headers,
                    body: config.body,
                    signal: config.signal
                });

                // Execute response interceptors
                const interceptedResponse = await this._executeResponseInterceptors(response);

                // Handle non-OK responses
                if (!interceptedResponse.ok) {
                    const error = await this._handleErrorResponse(interceptedResponse);
                    throw error;
                }

                // Parse response
                return await this._parseResponse(interceptedResponse);

            } catch (error) {
                // Execute error interceptors
                const interceptedError = await this._executeErrorInterceptors(error);
                throw interceptedError;
            }
        }

        /**
         * Handle error response
         * @private
         * @param {Response} response - Fetch response
         * @returns {Error} Error object
         */
        async _handleErrorResponse(response) {
            let message = 'An error occurred';
            let details = null;

            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    message = errorData.message || errorData.error || message;
                    details = errorData.details || null;
                } else {
                    message = await response.text();
                }
            } catch (parseError) {
                console.warn('Failed to parse error response:', parseError);
            }

            const error = new Error(message);
            error.status = response.status;
            error.statusText = response.statusText;
            error.details = details;
            error.response = response;

            return error;
        }

        /**
         * Parse response
         * @private
         * @param {Response} response - Fetch response
         * @returns {Promise<any>} Parsed data
         */
        async _parseResponse(response) {
            const contentType = response.headers.get('content-type');

            if (!contentType) {
                return null;
            }

            if (contentType.includes('application/json')) {
                return await response.json();
            }

            if (contentType.includes('text/')) {
                return await response.text();
            }

            if (contentType.includes('application/octet-stream')) {
                return await response.blob();
            }

            return await response.text();
        }

        /**
         * GET request
         * @param {string} endpoint - API endpoint
         * @param {Object} options - Request options
         * @returns {Promise<any>}
         */
        async get(endpoint, options = {}) {
            return this.request(endpoint, { ...options, method: 'GET' });
        }

        /**
         * POST request
         * @param {string} endpoint - API endpoint
         * @param {any} data - Request body
         * @param {Object} options - Request options
         * @returns {Promise<any>}
         */
        async post(endpoint, data, options = {}) {
            return this.request(endpoint, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        /**
         * PUT request
         * @param {string} endpoint - API endpoint
         * @param {any} data - Request body
         * @param {Object} options - Request options
         * @returns {Promise<any>}
         */
        async put(endpoint, data, options = {}) {
            return this.request(endpoint, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }

        /**
         * PATCH request
         * @param {string} endpoint - API endpoint
         * @param {any} data - Request body
         * @param {Object} options - Request options
         * @returns {Promise<any>}
         */
        async patch(endpoint, data, options = {}) {
            return this.request(endpoint, {
                ...options,
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        }

        /**
         * DELETE request
         * @param {string} endpoint - API endpoint
         * @param {Object} options - Request options
         * @returns {Promise<any>}
         */
        async delete(endpoint, options = {}) {
            return this.request(endpoint, { ...options, method: 'DELETE' });
        }

        /**
         * Add request interceptor
         * @param {Function} interceptor - Interceptor function
         * @returns {Function} Remove function
         */
        addRequestInterceptor(interceptor) {
            this.requestInterceptors.push(interceptor);
            return () => {
                const index = this.requestInterceptors.indexOf(interceptor);
                if (index !== -1) {
                    this.requestInterceptors.splice(index, 1);
                }
            };
        }

        /**
         * Add response interceptor
         * @param {Function} interceptor - Interceptor function
         * @returns {Function} Remove function
         */
        addResponseInterceptor(interceptor) {
            this.responseInterceptors.push(interceptor);
            return () => {
                const index = this.responseInterceptors.indexOf(interceptor);
                if (index !== -1) {
                    this.responseInterceptors.splice(index, 1);
                }
            };
        }

        /**
         * Add error interceptor
         * @param {Function} interceptor - Interceptor function
         * @returns {Function} Remove function
         */
        addErrorInterceptor(interceptor) {
            this.errorInterceptors.push(interceptor);
            return () => {
                const index = this.errorInterceptors.indexOf(interceptor);
                if (index !== -1) {
                    this.errorInterceptors.splice(index, 1);
                }
            };
        }
    }

    // Create singleton instance
    const apiClient = new APIClient();

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = apiClient;
    }

    // Export for browser global
    global.APIClient = apiClient;

})(typeof window !== 'undefined' ? window : global);
