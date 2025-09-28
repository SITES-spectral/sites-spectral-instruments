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
        this.isLoadingPlatforms = false;
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
            // Show loading state initially
            this.showLoadingState();

            // Verify authentication
            await this.verifyAccess();

            // Load station data
            if (this.stationAcronym) {
                await this.loadStationData();
                this.setupMap();
                this.setupEventListeners();

                // Show successful state
                this.showSuccessState();
            } else {
                this.redirectToAppropriateLocation();
            }

        } catch (error) {
            console.error('Station dashboard setup error:', error);
            this.showErrorState('Failed to initialize station: ' + error.message);
        }
    }

    async verifyAccess() {
        console.debug('Verifying access...');

        if (!window.sitesAPI?.isAuthenticated()) {
            console.warn('User not authenticated, redirecting to home');
            window.location.href = '/';
            return;
        }

        this.currentUser = window.sitesAPI.getUser();
        console.debug('Current user:', this.currentUser);
        console.debug('Requesting station:', this.stationAcronym);

        // Check if station user has access to this station
        if (this.currentUser.role === 'station' &&
            this.currentUser.station_acronym !== this.stationAcronym) {
            console.warn(`Station user can only access their own station. User station: ${this.currentUser.station_acronym}, Requested: ${this.stationAcronym}`);
            window.location.href = `/station.html?station=${this.currentUser.station_acronym}`;
            return;
        }

        console.debug('Access verification passed');
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

        // Expose currentUser globally for backward compatibility with embedded functions
        window.currentUser = this.currentUser;

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
            console.debug(`Loading station data for: ${this.stationAcronym}`);

            // Load station details by acronym with detailed error handling
            let response;
            try {
                response = await window.sitesAPI.getStations();
            } catch (error) {
                throw new Error(`Failed to fetch stations list: ${error.message}`);
            }

            const stations = Array.isArray(response) ? response : (response.stations || []);
            console.debug(`Found ${stations.length} stations in system:`, stations);
            console.debug(`Looking for station with acronym: '${this.stationAcronym}'`);

            // Enhanced debugging: log each station's acronym and comparison
            stations.forEach((station, index) => {
                console.debug(`Station ${index}: acronym='${station.acronym}' (matches: ${station.acronym === this.stationAcronym})`);
            });

            this.stationData = stations.find(s => s.acronym === this.stationAcronym);

            if (!this.stationData) {
                const availableStations = stations.map(s => s.acronym).join(', ');
                console.error('Station not found details:', {
                    searchingFor: this.stationAcronym,
                    availableStations: stations.map(s => ({ acronym: s.acronym, id: s.id, normalized_name: s.normalized_name })),
                    currentUser: this.currentUser
                });
                throw new Error(`Station '${this.stationAcronym}' not found. Available stations: ${availableStations || 'none'}`);
            }

            console.debug(`Loaded station data:`, this.stationData);

            // Load platforms and instruments with proper error handling
            await Promise.all([
                this.loadPlatformsAndInstruments(),
                this.updateStationDisplay()
            ]);

        } catch (error) {
            console.error('Error loading station data:', error);
            throw new Error(`Failed to load station data: ${error.message}`);
        }
    }

    async loadPlatformsAndInstruments() {
        try {
            // Prevent multiple simultaneous loads
            if (this.isLoadingPlatforms) {
                console.debug('Platform loading already in progress, skipping...');
                return;
            }
            this.isLoadingPlatforms = true;

            console.debug(`Loading platforms and instruments for station: ${this.stationData.acronym}`);

            // Load platforms for this station - try acronym first, then normalized_name if needed
            let platformsResponse;
            try {
                console.debug(`Station data available:`, {
                    acronym: this.stationData.acronym,
                    normalized_name: this.stationData.normalized_name,
                    id: this.stationData.id
                });

                console.debug(`Making API call to get platforms for station: ${this.stationData.acronym}`);
                platformsResponse = await window.sitesAPI.getPlatforms(this.stationData.acronym);
                console.debug(`Raw platforms response:`, platformsResponse);

                this.platforms = Array.isArray(platformsResponse) ?
                    platformsResponse :
                    (platformsResponse.platforms || []);
                console.debug(`Processed platforms array (${this.platforms.length} items):`, this.platforms);

                // If no platforms found with acronym, try normalized_name
                if (this.platforms.length === 0 && this.stationData.normalized_name && this.stationData.normalized_name !== this.stationData.acronym) {
                    console.debug(`No platforms found with acronym '${this.stationData.acronym}', trying normalized_name '${this.stationData.normalized_name}'`);
                    platformsResponse = await window.sitesAPI.getPlatforms(this.stationData.normalized_name);
                    console.debug(`Raw platforms response with normalized_name:`, platformsResponse);

                    this.platforms = Array.isArray(platformsResponse) ?
                        platformsResponse :
                        (platformsResponse.platforms || []);
                    console.debug(`Processed platforms array with normalized_name (${this.platforms.length} items):`, this.platforms);
                }

                if (this.platforms.length === 0) {
                    console.warn(`No platforms found for station ${this.stationData.acronym}/${this.stationData.normalized_name}. Final response was:`, platformsResponse);
                }
            } catch (error) {
                console.error(`Failed to load platforms for station ${this.stationData.acronym}:`, error);
                this.platforms = [];
                this.showError(`Failed to load platforms: ${error.message}`);
                // Don't throw here, continue to try loading instruments
            }

            // Load all instruments for this station using station acronym
            try {
                const instrumentsResponse = await window.sitesAPI.getInstruments(this.stationData.acronym);
                this.instruments = Array.isArray(instrumentsResponse) ?
                    instrumentsResponse :
                    (instrumentsResponse.instruments || []);
                console.debug(`Loaded ${this.instruments.length} instruments`);
            } catch (error) {
                console.error(`Failed to load instruments for station ${this.stationData.acronym}:`, error);
                this.instruments = [];
                this.showError(`Failed to load instruments: ${error.message}`);
                // Don't throw here, platforms might still be loaded
            }

            // Update displays even if some data failed to load
            try {
                this.renderPlatforms();
                this.updateMapMarkers();
                console.debug('Successfully updated platform and instrument displays');
            } catch (error) {
                console.error('Error updating displays:', error);
                this.showError(`Failed to update display: ${error.message}`);
            }

        } catch (error) {
            console.error('Critical error loading platforms and instruments:', error);
            this.showError(`Critical error loading station data: ${error.message}`);
        } finally {
            this.isLoadingPlatforms = false;
        }
    }

    updateStationDisplay() {
        if (!this.stationData) return;

        // Update page title
        document.title = `${this.stationData.display_name} - SITES Spectral`;

        // Update station header - main elements
        const stationNameEl = document.getElementById('station-name');
        if (stationNameEl) {
            stationNameEl.textContent = this.stationData.display_name;
        }

        const stationAcronymEl = document.getElementById('station-acronym');
        if (stationAcronymEl && this.stationData.acronym) {
            stationAcronymEl.textContent = `(${this.stationData.acronym})`;
            stationAcronymEl.style.display = 'inline';
        }

        const stationDescEl = document.getElementById('station-description');
        if (stationDescEl && this.stationData.description) {
            stationDescEl.textContent = this.stationData.description;
            stationDescEl.style.display = 'block';
        }

        // Update optional metadata
        const organizationEl = document.getElementById('station-organization');
        if (organizationEl && this.stationData.organization) {
            organizationEl.innerHTML = `<strong>Organization:</strong> ${this.stationData.organization}`;
            organizationEl.style.display = 'block';
        }

        const coordinatesEl = document.getElementById('station-coordinates');
        if (coordinatesEl) {
            const coords = this.formatCoordinates();
            if (coords !== 'No coordinates') {
                coordinatesEl.innerHTML = `<strong>Coordinates:</strong> ${coords}`;
                coordinatesEl.style.display = 'block';
            }
        }

        // Update counts
        this.updateCounts();

        // Expose stationData globally for backward compatibility with embedded functions
        window.stationData = this.stationData;
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

        const platformCountEl = document.getElementById('platforms-count');
        const instrumentCountEl = document.getElementById('instruments-count');

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
        console.debug(`renderPlatforms() called with ${this.platforms.length} platforms:`, this.platforms);

        const platformsContainer = document.getElementById('platforms-grid');
        if (!platformsContainer) {
            console.error('platforms-grid container not found!');
            return;
        }
        console.debug('Found platforms-grid container:', platformsContainer);

        if (this.platforms.length === 0) {
            console.debug('No platforms to render, showing empty state');
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

        console.debug(`Rendering ${this.platforms.length} platform cards...`);

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
        if (!form) {
            this.showError('Create platform form not found');
            return;
        }

        const formData = new FormData(form);
        const platformData = {
            station_id: this.stationData.id,
            display_name: formData.get('display_name'),
            ecosystem_code: formData.get('ecosystem_code'),
            location_code: formData.get('location_code'),
            latitude: formData.get('latitude') ? parseFloat(formData.get('latitude')) : null,
            longitude: formData.get('longitude') ? parseFloat(formData.get('longitude')) : null
        };

        // Validate required fields
        if (!platformData.display_name?.trim()) {
            this.showError('Platform name is required');
            return;
        }

        try {
            console.debug('Creating platform with data:', platformData);

            if (typeof showNotification === 'function') {
                showNotification('Creating platform...', 'info');
            }

            await window.sitesAPI.createPlatform(platformData);

            if (typeof showNotification === 'function') {
                showNotification('Platform created successfully', 'success');
            }

            if (typeof closeModal === 'function') {
                closeModal('create-platform-modal');
            }

            // Reload platforms with error handling
            try {
                await this.loadPlatformsAndInstruments();
            } catch (reloadError) {
                console.warn('Failed to reload platforms after creation:', reloadError);
                this.showError('Platform created but failed to refresh data. Please refresh the page.');
            }

        } catch (error) {
            console.error('Error creating platform:', error);
            this.showError(`Failed to create platform: ${error.message}`);
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

    // Page state management
    showLoadingState() {
        const loadingEl = document.getElementById('loading-state');
        const errorEl = document.getElementById('error-state');
        const welcomeEl = document.getElementById('welcome-content');
        const dashboardEl = document.getElementById('dashboard-section');

        if (loadingEl) loadingEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
        if (welcomeEl) welcomeEl.style.display = 'none';
        if (dashboardEl) dashboardEl.style.display = 'none';
    }

    showSuccessState() {
        const loadingEl = document.getElementById('loading-state');
        const errorEl = document.getElementById('error-state');
        const welcomeEl = document.getElementById('welcome-content');
        const dashboardEl = document.getElementById('dashboard-section');

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (welcomeEl) welcomeEl.style.display = 'block';
        if (dashboardEl) dashboardEl.style.display = 'block';
    }

    showErrorState(message) {
        const loadingEl = document.getElementById('loading-state');
        const errorEl = document.getElementById('error-state');
        const welcomeEl = document.getElementById('welcome-content');
        const dashboardEl = document.getElementById('dashboard-section');
        const errorMessageEl = document.getElementById('error-message');

        console.error('Showing error state:', message);

        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        if (welcomeEl) welcomeEl.style.display = 'none';
        if (dashboardEl) dashboardEl.style.display = 'none';
        if (errorMessageEl) {
            errorMessageEl.textContent = message;

            // Add retry button if not already present
            const retryBtn = errorMessageEl.querySelector('.retry-btn');
            if (!retryBtn) {
                const retryButton = document.createElement('button');
                retryButton.className = 'btn btn-primary retry-btn';
                retryButton.innerHTML = '<i class="fas fa-redo"></i> Retry';
                retryButton.style.marginTop = '1rem';
                retryButton.onclick = () => this.retryLoadingData();
                errorMessageEl.appendChild(retryButton);
            }
        }

        // Also show notification with more context
        const notification = typeof showNotification === 'function' ?
            showNotification(message, 'error') :
            console.error('showNotification not available:', message);
    }

    showError(message) {
        console.error('Station dashboard error:', message);
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            // Fallback if notification system not available
            console.error('Notification system not available, error was:', message);
            alert(`Error: ${message}`);
        }
    }

    // Retry loading data after an error
    async retryLoadingData() {
        console.debug('Retrying to load station data...');
        try {
            this.showLoadingState();
            await this.loadStationData();
            this.showSuccessState();
        } catch (error) {
            console.error('Retry failed:', error);
            this.showErrorState(`Retry failed: ${error.message}`);
        }
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

// Export class to global scope
window.SitesStationDashboard = SitesStationDashboard;

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

// Global logout function for onclick handlers
function logout() {
    if (window.sitesStationDashboard) {
        return window.sitesStationDashboard.logout();
    } else {
        // Fallback if module not loaded
        window.sitesAPI?.clearAuth();
        window.location.href = '/';
    }
}