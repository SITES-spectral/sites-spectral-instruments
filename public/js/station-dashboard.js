// SITES Spectral Instruments - Station Dashboard Module
// Station-specific management functionality

class SitesStationDashboard {
    constructor() {
        this.currentUser = null;
        this.stationData = null;
        this.stationMap = null;
        this.platforms = [];
        this.instruments = [];
        this.selectedPlatform = null;
        this.selectedInstrument = null;
        this.stationAcronym = null;
        this.init();
    }

    async init() {
        // Get station acronym from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.stationAcronym = urlParams.get('station');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupStationDashboard());
        } else {
            this.setupStationDashboard();
        }
    }

    async setupStationDashboard() {
        try {
            // Verify authentication
            await this.verifyAccess();

            // Load station data
            if (this.stationAcronym) {
                await this.loadStationData();
                this.setupMap();
                this.setupEventListeners();
            } else {
                this.redirectToAppropriateLocation();
            }

        } catch (error) {
            console.error('Station dashboard setup error:', error);
            this.showError('Failed to initialize station: ' + error.message);
        }
    }

    async verifyAccess() {
        if (!window.sitesAPI?.isAuthenticated()) {
            window.location.href = '/';
            return;
        }

        this.currentUser = window.sitesAPI.getUser();

        // Check if station user has access to this station
        if (this.currentUser.role === 'station' &&
            this.currentUser.station_acronym !== this.stationAcronym) {
            window.location.href = `/station.html?station=${this.currentUser.station_acronym}`;
            return;
        }

        this.updateUserDisplay();
    }

    redirectToAppropriateLocation() {
        if (this.currentUser?.role === 'admin') {
            window.location.href = '/dashboard.html';
        } else {
            window.location.href = '/';
        }
    }

    updateUserDisplay() {
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');

        if (userNameEl && this.currentUser) {
            userNameEl.textContent = this.currentUser.username;
        }

        if (userRoleEl && this.currentUser) {
            userRoleEl.textContent = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
        }

        // Show/hide admin controls
        this.toggleAdminControls();
    }

    toggleAdminControls() {
        const isAdmin = this.currentUser?.role === 'admin';
        const adminElements = document.querySelectorAll('.admin-only');

        adminElements.forEach(element => {
            element.style.display = isAdmin ? '' : 'none';
        });
    }

    async loadStationData() {
        try {
            // Load station details by acronym
            const stations = await window.sitesAPI.getStations();
            this.stationData = stations.find(s => s.acronym === this.stationAcronym);

            if (!this.stationData) {
                throw new Error(`Station ${this.stationAcronym} not found`);
            }

            // Load platforms and instruments
            await Promise.all([
                this.loadPlatformsAndInstruments(),
                this.updateStationDisplay()
            ]);

        } catch (error) {
            console.error('Error loading station data:', error);
            throw error;
        }
    }

    async loadPlatformsAndInstruments() {
        try {
            // Load platforms for this station
            const platformsResponse = await window.sitesAPI.getPlatforms(this.stationData.id);
            this.platforms = Array.isArray(platformsResponse) ? platformsResponse : [];

            // Load all instruments for this station's platforms
            const instrumentPromises = this.platforms.map(platform =>
                window.sitesAPI.getInstruments(platform.id)
            );

            const instrumentResponses = await Promise.all(instrumentPromises);
            this.instruments = instrumentResponses.flat();

            // Update displays
            this.renderPlatforms();
            this.updateMapMarkers();

        } catch (error) {
            console.error('Error loading platforms and instruments:', error);
            this.showError('Failed to load station data');
        }
    }

    updateStationDisplay() {
        if (!this.stationData) return;

        // Update page title
        document.title = `${this.stationData.display_name} - SITES Spectral`;

        // Update station header
        const elements = {
            'station-name': this.stationData.display_name,
            'station-acronym': this.stationData.acronym,
            'station-description': this.stationData.description,
            'station-organization': this.stationData.organization,
            'station-coordinates': this.formatCoordinates()
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.textContent = value;
            }
        });

        // Update counts
        this.updateCounts();
    }

    formatCoordinates() {
        if (this.stationData.latitude && this.stationData.longitude) {
            return `${this.stationData.latitude.toFixed(4)}, ${this.stationData.longitude.toFixed(4)}`;
        }
        return 'No coordinates';
    }

    updateCounts() {
        const platformCount = this.platforms.length;
        const instrumentCount = this.instruments.length;

        const platformCountEl = document.getElementById('platform-count');
        const instrumentCountEl = document.getElementById('instrument-count');

        if (platformCountEl) {
            platformCountEl.textContent = platformCount;
        }

        if (instrumentCountEl) {
            instrumentCountEl.textContent = instrumentCount;
        }
    }

    setupMap() {
        if (!this.stationData || !window.sitesMap) return;

        const mapContainer = document.getElementById('station-map');
        if (!mapContainer) return;

        const lat = this.stationData.latitude || 59.8586;
        const lng = this.stationData.longitude || 17.6389;

        this.stationMap = window.sitesMap.initializeMap('station-map', {
            center: [lat, lng],
            zoom: 12
        });

        // Add station marker
        window.sitesMap.addStation(this.stationMap, lat, lng, this.stationData);

        // Add platform markers
        this.updateMapMarkers();
    }

    updateMapMarkers() {
        if (!this.stationMap || !window.sitesMap) return;

        const stationCoords = {
            lat: this.stationData.latitude || 59.8586,
            lng: this.stationData.longitude || 17.6389
        };

        window.sitesMap.addPlatformMarkers(this.stationMap, this.platforms, stationCoords);
    }

    renderPlatforms() {
        const platformsContainer = document.getElementById('platforms-list');
        if (!platformsContainer) return;

        if (this.platforms.length === 0) {
            platformsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-building fa-3x"></i>
                    <h3>No platforms found</h3>
                    <p>This station doesn't have any platforms yet.</p>
                    ${this.currentUser?.role === 'admin' ? `
                        <button onclick="sitesStationDashboard.showCreatePlatformModal()" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Create First Platform
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        const platformCards = this.platforms.map(platform => this.createPlatformCard(platform)).join('');
        platformsContainer.innerHTML = platformCards;
    }

    createPlatformCard(platform) {
        const instruments = this.instruments.filter(inst => inst.platform_id === platform.id);
        const instrumentCount = instruments.length;

        const coordinates = platform.latitude && platform.longitude
            ? `${platform.latitude.toFixed(4)}, ${platform.longitude.toFixed(4)}`
            : 'No coordinates';

        return `
            <div class="platform-card" data-platform-id="${platform.id}">
                <div class="platform-header">
                    <h4>${this.escapeHtml(platform.display_name)}</h4>
                    <div class="platform-meta">
                        ${platform.ecosystem_code ? `<span class="ecosystem-badge">${platform.ecosystem_code}</span>` : ''}
                        ${platform.location_code ? `<span class="location-code">${platform.location_code}</span>` : ''}
                    </div>
                </div>

                <div class="platform-body">
                    <div class="platform-info">
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${coordinates}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-camera"></i>
                            <span>${instrumentCount} instruments</span>
                        </div>
                    </div>

                    ${instrumentCount > 0 ? `
                        <div class="instruments-preview">
                            ${instruments.slice(0, 3).map(inst => `
                                <div class="instrument-chip">
                                    <i class="fas fa-camera"></i>
                                    ${this.escapeHtml(inst.name)}
                                </div>
                            `).join('')}
                            ${instrumentCount > 3 ? `<div class="instrument-chip more">+${instrumentCount - 3} more</div>` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="platform-actions">
                    <button class="btn btn-primary btn-sm" onclick="sitesStationDashboard.viewPlatformDetails('${platform.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>

                    ${this.currentUser?.role === 'admin' ? `
                        <button class="btn btn-secondary btn-sm" onclick="sitesStationDashboard.editPlatform('${platform.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="sitesStationDashboard.deletePlatform('${platform.id}', '${this.escapeHtml(platform.display_name)}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPlatformsAndInstruments());
        }

        // Back to dashboard (admin only)
        const backBtn = document.getElementById('back-to-dashboard');
        if (backBtn && this.currentUser?.role === 'admin') {
            backBtn.addEventListener('click', () => {
                window.location.href = '/dashboard.html';
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // Platform management
    showCreatePlatformModal() {
        if (this.currentUser?.role !== 'admin') {
            showNotification('Admin privileges required', 'error');
            return;
        }

        const modal = document.getElementById('create-platform-modal');
        if (modal) {
            showModal('create-platform-modal');
            this.resetCreatePlatformForm();
        }
    }

    resetCreatePlatformForm() {
        const form = document.getElementById('create-platform-form');
        if (form) {
            form.reset();
            // Set station ID
            const stationIdField = form.querySelector('[name="station_id"]');
            if (stationIdField) {
                stationIdField.value = this.stationData.id;
            }
        }
    }

    async saveNewPlatform() {
        const form = document.getElementById('create-platform-form');
        if (!form) return;

        const formData = new FormData(form);
        const platformData = {
            station_id: this.stationData.id,
            display_name: formData.get('display_name'),
            ecosystem_code: formData.get('ecosystem_code'),
            location_code: formData.get('location_code'),
            latitude: formData.get('latitude') ? parseFloat(formData.get('latitude')) : null,
            longitude: formData.get('longitude') ? parseFloat(formData.get('longitude')) : null
        };

        try {
            showNotification('Creating platform...', 'info');

            await window.sitesAPI.createPlatform(platformData);

            showNotification('Platform created successfully', 'success');
            closeModal('create-platform-modal');

            // Reload platforms
            await this.loadPlatformsAndInstruments();

        } catch (error) {
            console.error('Error creating platform:', error);
            showNotification(`Failed to create platform: ${error.message}`, 'error');
        }
    }

    viewPlatformDetails(platformId) {
        const platform = this.platforms.find(p => p.id === platformId);
        if (platform) {
            // Show platform details modal or navigate to dedicated page
            showNotification(`Platform details for "${platform.display_name}" coming soon`, 'info');
        }
    }

    editPlatform(platformId) {
        if (this.currentUser?.role !== 'admin') {
            showNotification('Admin privileges required', 'error');
            return;
        }

        const platform = this.platforms.find(p => p.id === platformId);
        if (platform) {
            showNotification(`Edit functionality for "${platform.display_name}" coming soon`, 'info');
        }
    }

    deletePlatform(platformId, platformName) {
        if (this.currentUser?.role !== 'admin') {
            showNotification('Admin privileges required', 'error');
            return;
        }

        const message = `Are you sure you want to delete the platform "${platformName}"? This will also delete all associated instruments.`;

        showConfirmDialog(message, async () => {
            try {
                showNotification(`Deleting platform "${platformName}"...`, 'info');

                await window.sitesAPI.deletePlatform(platformId);

                showNotification(`Platform "${platformName}" deleted successfully`, 'success');

                // Reload platforms
                await this.loadPlatformsAndInstruments();

            } catch (error) {
                console.error('Error deleting platform:', error);
                showNotification(`Failed to delete platform: ${error.message}`, 'error');
            }
        });
    }

    // Utility functions
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        showNotification(message, 'error');
    }

    async logout() {
        try {
            await window.sitesAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
            window.sitesAPI.clearAuth();
            window.location.href = '/';
        }
    }
}

// Global instance
window.sitesStationDashboard = new SitesStationDashboard();

// Global convenience functions
function loadPlatformsAndInstruments() {
    return window.sitesStationDashboard.loadPlatformsAndInstruments();
}

function showCreatePlatformModal() {
    return window.sitesStationDashboard.showCreatePlatformModal();
}

function saveNewPlatform() {
    return window.sitesStationDashboard.saveNewPlatform();
}

function refreshOpenModals() {
    // Placeholder for modal refresh functionality
    return Promise.resolve();
}