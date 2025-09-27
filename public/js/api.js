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

    // Get stored user data
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
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

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
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

    // Handle API errors
    handleApiError(response, error = null) {
        if (response && response.status === 401) {
            this.clearAuth();
            window.location.href = '/';
            return;
        }

        if (error) {
            console.error('API Error:', error);
            throw new Error(error.message || 'Network error occurred');
        }

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
    }

    // Make authenticated API request
    async fetchWithAuth(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                this.handleApiError(response);
            }

            return response;
        } catch (error) {
            this.handleApiError(null, error);
        }
    }

    // Authentication methods
    async login(username, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: this.defaultHeaders,
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        this.setToken(data.token);
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
        this.clearAuth();
        window.location.href = '/';
    }

    // Station methods
    async getStations() {
        const response = await this.fetchWithAuth('/api/stations');
        return response.json();
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

    // Platform methods
    async getPlatforms(stationId = null) {
        const url = stationId ? `/api/platforms?station_id=${stationId}` : '/api/platforms';
        const response = await this.fetchWithAuth(url);
        return response.json();
    }

    async getPlatform(id) {
        const response = await this.fetchWithAuth(`/api/platforms/${id}`);
        return response.json();
    }

    async createPlatform(platformData) {
        const response = await this.fetchWithAuth('/api/platforms', {
            method: 'POST',
            body: JSON.stringify(platformData)
        });
        return response.json();
    }

    async updatePlatform(id, platformData) {
        const response = await this.fetchWithAuth(`/api/platforms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(platformData)
        });
        return response.json();
    }

    async deletePlatform(id) {
        const response = await this.fetchWithAuth(`/api/platforms/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    // Instrument methods
    async getInstruments(platformId = null) {
        const url = platformId ? `/api/instruments?platform_id=${platformId}` : '/api/instruments';
        const response = await this.fetchWithAuth(url);
        return response.json();
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