// SITES Spectral Instruments - API Communication Module
// Centralized API communication with authentication and error handling

class SitesSpectralAPI {
    constructor() {
        this.baseUrl = '';
        this.tokenKey = 'sites_spectral_token';
        this.userKey = 'sites_spectral_user';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    // Get stored authentication token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Get stored user data - SECURITY FIX: wrap JSON.parse in try-catch
    getUser() {
        try {
            const userData = localStorage.getItem(this.userKey);
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            // If JSON is malformed, clear corrupted data and return null
            console.error('Corrupted user data in localStorage, clearing');
            localStorage.removeItem(this.userKey);
            return null;
        }
    }

    // Set authentication token
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    // Set user data
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    // Check if user is authenticated (synchronous check of cached state)
    // Note: With httpOnly cookies, token is not accessible from JS
    // Use verifyAuth() for server-side verification
    isAuthenticated() {
        return this.getUser() !== null;
    }

    // Verify authentication with server (async)
    // This should be called on page load before checking isAuthenticated()
    // Returns true if authenticated, false otherwise
    async verifyAuth() {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                credentials: 'include'  // Send httpOnly cookie
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid && data.user) {
                    this.setUser(data.user);
                    return true;
                }
            }
        } catch (error) {
            console.warn('Auth verification failed:', error);
        }

        // Clear local state on verification failure
        this.clearAuth();
        return false;
    }

    // Check if user has admin role
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }

    // Check if user has station role
    isStationUser() {
        const user = this.getUser();
        return user && user.role === 'station';
    }

    // Get authenticated headers
    getAuthHeaders() {
        const token = this.getToken();
        const headers = { ...this.defaultHeaders };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // Handle API errors with enhanced error messages
    async handleApiError(response, error = null) {
        if (response && response.status === 401) {
            console.warn('Authentication expired, redirecting to login');
            this.clearAuth();
            window.location.href = '/login.html';
            return;
        }

        if (error) {
            console.error('API Network Error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network connection failed. Please check your internet connection and try again.');
            }
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw new Error(error.message || 'Network error occurred. Please try again.');
        }

        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;

            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (parseError) {
                // If we can't parse the error response, use the status text
                console.warn('Could not parse error response:', parseError);
            }

            // Provide user-friendly error messages for common status codes
            switch (response.status) {
                case 403:
                    errorMessage = 'Access denied. You do not have permission to perform this action.';
                    break;
                case 404:
                    errorMessage = 'Resource not found. The requested data may have been deleted.';
                    break;
                case 422:
                    errorMessage = errorMessage || 'Invalid data provided. Please check your input and try again.';
                    break;
                case 500:
                    errorMessage = 'Server error occurred. Please try again in a few moments.';
                    break;
                case 503:
                    errorMessage = 'Service temporarily unavailable. Please try again later.';
                    break;
            }

            throw new Error(errorMessage);
        }
    }

    // Make authenticated API request with timeout and retry logic
    async fetchWithAuth(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const timeout = options.timeout || 10000; // 10 second default timeout

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const config = {
            ...options,
            signal: controller.signal,
            credentials: 'include', // Send httpOnly cookie with request
            headers: {
                ...this.getAuthHeaders(),
                ...(options.headers || {})
            }
        };

        try {
            console.debug(`API Request: ${config.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                await this.handleApiError(response);
            }

            console.debug(`API Response: ${response.status} ${response.statusText}`);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`API Request failed for ${url}:`, error);
            await this.handleApiError(null, error);
        }
    }

    // Authentication methods
    async login(username, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: this.defaultHeaders,
            credentials: 'include', // Required for httpOnly cookie to be set by server
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        // Token is now stored in httpOnly cookie by server
        // Keep local token for backward compatibility during migration
        if (data.token) {
            this.setToken(data.token);
        }
        this.setUser(data.user);

        return data;
    }

    async verifyToken() {
        if (!this.isAuthenticated()) {
            throw new Error('No authentication token');
        }

        const response = await this.fetchWithAuth('/api/auth/verify');
        const data = await response.json();

        if (data.user) {
            this.setUser(data.user);
        }

        return data;
    }

    async logout() {
        try {
            // Call logout endpoint to clear httpOnly cookie on server
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include', // Send httpOnly cookie with request
                headers: this.defaultHeaders
            });
        } catch (error) {
            console.warn('Logout API call failed:', error);
            // Continue with local cleanup even if API call fails
        }

        // Clear local state
        this.clearAuth();

        // Redirect to login page (not root, to avoid auto-redirect loop)
        window.location.href = '/login.html';
    }

    // Station methods with enhanced error handling
    async getStations() {
        try {
            const response = await this.fetchWithAuth('/api/stations');
            const data = await response.json();
            console.debug('Loaded stations:', data);
            return data;
        } catch (error) {
            console.error('Failed to load stations:', error);
            throw new Error(`Failed to load stations: ${error.message}`);
        }
    }

    async getStation(id) {
        const response = await this.fetchWithAuth(`/api/stations/${id}`);
        return response.json();
    }

    async createStation(stationData) {
        const response = await this.fetchWithAuth('/api/stations', {
            method: 'POST',
            body: JSON.stringify(stationData)
        });
        return response.json();
    }

    async updateStation(id, stationData) {
        const response = await this.fetchWithAuth(`/api/stations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(stationData)
        });
        return response.json();
    }

    async deleteStation(id) {
        const response = await this.fetchWithAuth(`/api/stations/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    // Platform methods with enhanced error handling
    async getPlatforms(stationAcronym = null) {
        try {
            const url = stationAcronym ? `/api/platforms?station=${stationAcronym}` : '/api/platforms';
            console.debug(`Loading platforms${stationAcronym ? ` for station ${stationAcronym}` : ''}`);
            const response = await this.fetchWithAuth(url);
            const data = await response.json();
            console.debug(`Loaded ${Array.isArray(data.platforms) ? data.platforms.length : Array.isArray(data) ? data.length : 0} platforms`);
            return data;
        } catch (error) {
            console.error(`Failed to load platforms${stationAcronym ? ` for station ${stationAcronym}` : ''}:`, error);
            throw new Error(`Failed to load platforms: ${error.message}`);
        }
    }

    async getPlatform(id) {
        const response = await this.fetchWithAuth(`/api/platforms/${id}`);
        return response.json();
    }

    async createPlatform(platformData) {
        try {
            console.debug('Creating platform:', platformData);
            const response = await this.fetchWithAuth('/api/platforms', {
                method: 'POST',
                body: JSON.stringify(platformData)
            });
            const data = await response.json();
            console.debug('Platform created successfully:', data);
            return data;
        } catch (error) {
            console.error('Failed to create platform:', error);
            throw new Error(`Failed to create platform: ${error.message}`);
        }
    }

    async updatePlatform(id, platformData) {
        const response = await this.fetchWithAuth(`/api/platforms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(platformData)
        });
        return response.json();
    }

    async deletePlatform(id) {
        try {
            console.debug(`Deleting platform ${id}`);
            const response = await this.fetchWithAuth(`/api/platforms/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            console.debug('Platform deleted successfully');
            return data;
        } catch (error) {
            console.error(`Failed to delete platform ${id}:`, error);
            throw new Error(`Failed to delete platform: ${error.message}`);
        }
    }

    // Instrument methods with enhanced error handling
    async getInstruments(stationAcronym = null) {
        try {
            const url = stationAcronym ? `/api/instruments?station=${stationAcronym}` : '/api/instruments';
            console.debug(`Loading instruments${stationAcronym ? ` for station ${stationAcronym}` : ''}`);
            const response = await this.fetchWithAuth(url);
            const data = await response.json();
            console.debug(`Loaded ${Array.isArray(data.instruments) ? data.instruments.length : Array.isArray(data) ? data.length : 0} instruments`);
            return data;
        } catch (error) {
            console.error(`Failed to load instruments${stationAcronym ? ` for station ${stationAcronym}` : ''}:`, error);
            throw new Error(`Failed to load instruments: ${error.message}`);
        }
    }

    async getInstrument(id) {
        const response = await this.fetchWithAuth(`/api/instruments/${id}`);
        return response.json();
    }

    async createInstrument(instrumentData) {
        const response = await this.fetchWithAuth('/api/instruments', {
            method: 'POST',
            body: JSON.stringify(instrumentData)
        });
        return response.json();
    }

    async updateInstrument(id, instrumentData) {
        const response = await this.fetchWithAuth(`/api/instruments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(instrumentData)
        });
        return response.json();
    }

    async deleteInstrument(id) {
        const response = await this.fetchWithAuth(`/api/instruments/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    // ROI methods
    async getROIs(instrumentId = null) {
        const url = instrumentId ? `/api/rois?instrument_id=${instrumentId}` : '/api/rois';
        const response = await this.fetchWithAuth(url);
        return response.json();
    }

    async getROI(id) {
        const response = await this.fetchWithAuth(`/api/rois/${id}`);
        return response.json();
    }

    async createROI(roiData) {
        const response = await this.fetchWithAuth('/api/rois', {
            method: 'POST',
            body: JSON.stringify(roiData)
        });
        return response.json();
    }

    async updateROI(id, roiData) {
        const response = await this.fetchWithAuth(`/api/rois/${id}`, {
            method: 'PUT',
            body: JSON.stringify(roiData)
        });
        return response.json();
    }

    async deleteROI(id) {
        const response = await this.fetchWithAuth(`/api/rois/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    // Health check
    async checkHealth() {
        const response = await fetch('/api/health');
        return response.json();
    }
}

// Global instance
window.sitesAPI = new SitesSpectralAPI();

// Backward compatibility functions for existing code
function fetchWithAuth(endpoint, options = {}) {
    return window.sitesAPI.fetchWithAuth(endpoint, options);
}

function getAuthHeaders() {
    return window.sitesAPI.getAuthHeaders();
}

function isAuthenticated() {
    return window.sitesAPI.isAuthenticated();
}

function getStoredToken() {
    return window.sitesAPI.getToken();
}

function getStoredUser() {
    return window.sitesAPI.getUser();
}

function clearAuthData() {
    return window.sitesAPI.clearAuth();
}