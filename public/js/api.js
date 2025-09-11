// SITES Spectral - API Client
// Handles all API communication with Cloudflare Workers

class APIClient {
    constructor() {
        this.baseUrl = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make HTTP request with error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Station API methods
    async getStations() {
        return this.request('/stations');
    }

    async getStation(id) {
        return this.request(`/stations/${id}`);
    }

    async createStation(data) {
        return this.request('/stations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateStation(id, data) {
        return this.request(`/stations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteStation(id) {
        return this.request(`/stations/${id}`, {
            method: 'DELETE'
        });
    }

    // Instrument API methods
    async getInstruments(params = {}) {
        const queryString = Utils.objectToQueryString(params);
        return this.request(`/instruments${queryString}`);
    }

    async getInstrument(id) {
        return this.request(`/instruments/${id}`);
    }

    async getInstrumentsByStation(stationId) {
        return this.request(`/stations/${stationId}/instruments`);
    }

    async createInstrument(data) {
        return this.request('/instruments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateInstrument(id, data) {
        return this.request(`/instruments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteInstrument(id) {
        return this.request(`/instruments/${id}`, {
            method: 'DELETE'
        });
    }

    async updateInstrumentStatus(id, status, notes = '') {
        return this.request(`/instruments/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, notes })
        });
    }

    // ROI API methods
    async getInstrumentROIs(instrumentId) {
        return this.request(`/instruments/${instrumentId}/rois`);
    }

    async createROI(instrumentId, data) {
        return this.request(`/instruments/${instrumentId}/rois`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateROI(instrumentId, roiId, data) {
        return this.request(`/instruments/${instrumentId}/rois/${roiId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteROI(instrumentId, roiId) {
        return this.request(`/instruments/${instrumentId}/rois/${roiId}`, {
            method: 'DELETE'
        });
    }

    // History API methods
    async getInstrumentHistory(instrumentId) {
        return this.request(`/instruments/${instrumentId}/history`);
    }

    async addHistoryEntry(instrumentId, data) {
        return this.request(`/instruments/${instrumentId}/history`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Quality flags API methods
    async getQualityFlags(instrumentId) {
        return this.request(`/instruments/${instrumentId}/quality-flags`);
    }

    async addQualityFlag(instrumentId, data) {
        return this.request(`/instruments/${instrumentId}/quality-flags`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async resolveQualityFlag(flagId, notes = '') {
        return this.request(`/quality-flags/${flagId}/resolve`, {
            method: 'PATCH',
            body: JSON.stringify({ resolution_notes: notes, resolved_date: Utils.getCurrentTimestamp() })
        });
    }

    // Statistics API methods
    async getNetworkStats() {
        return this.request('/stats/network');
    }

    async getStationStats(stationId) {
        return this.request(`/stats/stations/${stationId}`);
    }

    async getInstrumentStats() {
        return this.request('/stats/instruments');
    }

    // Search API methods
    async searchInstruments(query, filters = {}) {
        const params = { q: query, ...filters };
        const queryString = Utils.objectToQueryString(params);
        return this.request(`/search/instruments${queryString}`);
    }

    async searchStations(query) {
        return this.request(`/search/stations?q=${encodeURIComponent(query)}`);
    }

    // Export API methods
    async exportData(format = 'csv', params = {}) {
        const queryString = Utils.objectToQueryString({ format, ...params });
        return this.request(`/export${queryString}`);
    }

    async exportStationData(stationId, format = 'csv') {
        return this.request(`/stations/${stationId}/export?format=${format}`);
    }

    async exportInstrumentData(instrumentId, format = 'csv') {
        return this.request(`/instruments/${instrumentId}/export?format=${format}`);
    }

    // Reference data API methods
    async getEcosystems() {
        return this.request('/reference/ecosystems');
    }

    async getInstrumentTypes() {
        return this.request('/reference/instrument-types');
    }

    async getPlatformTypes() {
        return this.request('/reference/platform-types');
    }

    // Activity feed API methods
    async getRecentActivity(limit = 10) {
        return this.request(`/activity/recent?limit=${limit}`);
    }

    async getActivityFeed(params = {}) {
        const queryString = Utils.objectToQueryString(params);
        return this.request(`/activity${queryString}`);
    }

    // Bulk operations
    async bulkUpdateInstruments(updates) {
        return this.request('/instruments/bulk-update', {
            method: 'PATCH',
            body: JSON.stringify({ updates })
        });
    }

    async bulkImportInstruments(data) {
        return this.request('/instruments/bulk-import', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Validation API methods
    async validateInstrumentId(canonicalId) {
        return this.request(`/validate/instrument-id?id=${encodeURIComponent(canonicalId)}`);
    }

    async validateCoordinates(latitude, longitude) {
        return this.request(`/validate/coordinates?lat=${latitude}&lon=${longitude}`);
    }

    // Phenocams API methods
    async getPhenocams() {
        return this.request('/phenocams');
    }

    // Multispectral sensors API methods  
    async getMspectralSensors() {
        return this.request('/mspectral');
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

// Create global API client instance
window.API = new APIClient();