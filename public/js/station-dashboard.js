// SITES Spectral Instruments - Station Dashboard Module
// Station-specific management functionality

class SitesStationDashboard {
    constructor() {
        this.currentUser = null;
        this.canEdit = false; // Will be set after authentication in verifyAccess()
        this.stationData = null;
        this.stationMap = null;
        this.platforms = [];
        this.instruments = [];
        this.selectedPlatform = null;
        this.selectedInstrument = null;
        this.stationAcronym = null;
        this.isLoadingPlatforms = false;
        this.currentOpenPlatformId = null;
        this.imageManifest = null;
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
                await this.loadImageManifest();
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

        // Set canEdit property based on user role (admin and station users can edit)
        this.canEdit = this.currentUser && (
            this.currentUser.role === 'admin' ||
            this.currentUser.role === 'station'
        );
        console.debug('User edit permission:', this.canEdit);

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

            // Load platforms and instruments, then update display
            // IMPORTANT: Must load data BEFORE updating display to ensure counts are correct
            await this.loadPlatformsAndInstruments();
            await this.updateStationDisplay();

        } catch (error) {
            console.error('Error loading station data:', error);
            throw new Error(`Failed to load station data: ${error.message}`);
        }
    }

    async loadImageManifest() {
        try {
            console.debug('Loading image manifest...');
            const response = await fetch('/images/stations/instrument-images-manifest.json');
            if (response.ok) {
                this.imageManifest = await response.json();
                console.debug('Image manifest loaded:', this.imageManifest);
            } else {
                console.warn('Image manifest not found, using fallback image detection');
                this.imageManifest = null;
            }
        } catch (error) {
            console.warn('Failed to load image manifest:', error);
            this.imageManifest = null;
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
            } catch (error) {
                console.error('Error rendering platforms:', error);
                this.showError(`Failed to render platforms: ${error.message}`);
            }

            // Always try to update map, even if platform rendering failed
            try {
                this.updateMapMarkers();
                console.debug('Map markers updated successfully');
            } catch (error) {
                console.error('Error updating map markers:', error);
                // Don't show error to user for map issues, just log it
            }

            // Update counts after data is loaded - ensures correct counts are shown
            try {
                this.updateCounts();
                console.debug('Successfully updated counts');
            } catch (error) {
                console.error('Error updating counts:', error);
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

        // Load images asynchronously after rendering
        this.loadAllInstrumentImages();
    }

    async loadAllInstrumentImages() {
        // Load images for all instruments using the new API endpoint
        for (const instrument of this.instruments) {
            if (typeof window.loadInstrumentImage === 'function') {
                await window.loadInstrumentImage(instrument.id);
            }
        }
    }

    createPlatformCard(platform) {
        const instruments = this.instruments.filter(inst => inst.platform_id === platform.id);
        const instrumentCount = instruments.length;

        const locationDisplay = platform.normalized_name ||
            (platform.latitude && platform.longitude ? `${platform.latitude.toFixed(4)}, ${platform.longitude.toFixed(4)}` : 'No location');

        return `
            <div class="platform-card" data-platform-id="${platform.id}">
                <div class="platform-header">
                    <h4>${this.escapeHtml(platform.display_name)}</h4>
                    <div class="platform-normalized-name">
                        <span style="font-size: 0.75em; color: #6b7280; font-weight: 500;">platform:</span>
                        <span style="color: #059669; font-family: 'Courier New', monospace; font-weight: 600;">${platform.normalized_name || 'N/A'}</span>
                    </div>
                    <div class="platform-meta">
                        ${platform.ecosystem_code ? `<span class="ecosystem-badge">${platform.ecosystem_code}</span>` : ''}
                    </div>
                </div>

                <div class="platform-body">
                    <div class="platform-info">
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${locationDisplay}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-camera"></i>
                            <span>${instrumentCount} instruments</span>
                        </div>
                    </div>

                    ${instrumentCount > 0 ? this.createInstrumentTabs(instruments, platform.id) : `
                        <div class="no-instruments">
                            <i class="fas fa-camera" style="opacity: 0.3;"></i>
                            <span style="opacity: 0.6;">No instruments configured</span>
                        </div>
                    `}
                </div>

                <div class="platform-actions">
                    <button class="btn btn-primary btn-sm" onclick="sitesStationDashboard.viewPlatformDetails('${platform.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>

                    ${this.canEdit ? `
                        <button class="btn btn-success btn-sm" onclick="sitesStationDashboard.showCreateInstrumentModal(${platform.id})" title="Add New Instrument to this Platform">
                            <i class="fas fa-plus"></i> <i class="fas fa-camera"></i> Instrument
                        </button>
                    ` : ''}

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

    // Instrument management
    showCreateInstrumentModal(platformId) {
        if (!this.canEdit) {
            showNotification('Edit privileges required', 'error');
            return;
        }

        // Call the global addInstrument function from station.html
        if (typeof addInstrument === 'function') {
            addInstrument(platformId);
        } else {
            console.error('addInstrument function not found');
            showNotification('Error: Instrument creation not available', 'error');
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

    async viewPlatformDetails(platformId) {
        const token = localStorage.getItem('sites_spectral_token');
        if (!token) return;

        try {
            const response = await fetch(`/api/platforms/${platformId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const platform = await response.json();
                this.populatePlatformModal(platform);
                this.trackPlatformModal(platformId);
                document.getElementById('platform-modal').classList.add('show');
            } else {
                console.error('Failed to fetch platform details');
                showNotification('Failed to load platform details', 'error');
            }
        } catch (error) {
            console.error('Error fetching platform details:', error);
            showNotification('Error loading platform details', 'error');
        }
    }

    populatePlatformModal(platform) {
        const detailsContainer = document.getElementById('platform-details');

        // Update modal header with edit button if user has permissions
        const modalHeader = document.querySelector('#platform-modal .modal-header-large');
        const canEdit = this.currentUser && (this.currentUser.role === 'admin' ||
            (this.currentUser.role === 'station' && this.currentUser.station_normalized_name === this.stationData?.normalized_name));

        modalHeader.innerHTML = `
            <h3><i class="fas fa-tower-observation"></i> Platform Details</h3>
            <div class="modal-header-actions">
                ${canEdit ? `
                    <button class="modal-edit-btn" onclick="sitesStationDashboard.editPlatform(${platform.id})" title="Edit Platform">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <small style="margin-left: 8px; opacity: 0.7; font-size: 0.75em;">Click to modify platform details</small>
                ` : ''}
                <button class="modal-close-large" onclick="closePlatformModal()">&times;</button>
            </div>
        `;

        detailsContainer.innerHTML = `
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> General Information</h4>
                <div class="detail-field">
                    <span class="detail-label">Platform Name</span>
                    <span class="detail-value">${platform.display_name || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">Normalized ID</span>
                    <span class="detail-value monospace">${platform.normalized_name || 'N/A'}</span>
                </div>
                ${platform.legacy_name ? `
                <div class="detail-field">
                    <span class="detail-label">Legacy Name</span>
                    <span class="detail-value">${platform.legacy_name}</span>
                </div>
                ` : ''}
                <div class="detail-field">
                    <span class="detail-label">Status</span>
                    <span class="detail-value status-${platform.status?.toLowerCase() || 'unknown'}">${this.getStatusIcon(platform.status)} ${platform.status || 'Unknown'}</span>
                </div>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-map-marker-alt"></i> Location & Positioning</h4>
                <div class="detail-field">
                    <span class="detail-label">Latitude</span>
                    <span class="detail-value monospace">${platform.latitude ? platform.latitude.toFixed(6) : 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">Longitude</span>
                    <span class="detail-value monospace">${platform.longitude ? platform.longitude.toFixed(6) : 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">Platform Height</span>
                    <span class="detail-value">${platform.platform_height_m ? platform.platform_height_m + 'm' : 'N/A'}</span>
                </div>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-cogs"></i> Technical Specifications</h4>
                <div class="detail-field">
                    <span class="detail-label">Mounting Structure</span>
                    <span class="detail-value">${platform.mounting_structure || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">Deployment Date</span>
                    <span class="detail-value">${platform.deployment_date || 'N/A'}</span>
                </div>
                <div class="detail-field">
                    <span class="detail-label">Station</span>
                    <span class="detail-value">${platform.station_name || 'N/A'} (${platform.station_acronym || 'N/A'})</span>
                </div>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-users"></i> Research Programs</h4>
                <div class="detail-field">
                    <span class="detail-label">Operation Programs</span>
                    <span class="detail-value">${platform.operation_programs ? this.formatOperationPrograms(platform.operation_programs) : 'Not specified'}</span>
                </div>
            </div>
            <div class="detail-section">
                <h4><i class="fas fa-sticky-note"></i> Additional Information</h4>
                <div class="detail-field">
                    <span class="detail-label">Description</span>
                    <span class="detail-value">${platform.description || 'No description provided'}</span>
                </div>
            </div>
            ${this.renderInstrumentsSection(platform.id, canEdit)}
        `;
    }

    renderInstrumentsSection(platformId, canEdit) {
        // Get instruments for this platform
        const platformInstruments = this.instruments.filter(inst => inst.platform_id === platformId);

        return `
            <div class="detail-section" style="grid-column: 1 / -1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4><i class="fas fa-camera"></i> Instruments (${platformInstruments.length})</h4>
                    ${canEdit ? `
                        <button class="btn btn-success btn-sm" onclick="sitesStationDashboard.showCreateInstrumentModal(${platformId})" title="Add New Instrument to this Platform">
                            <i class="fas fa-plus"></i> Add Instrument
                        </button>
                    ` : ''}
                </div>

                ${platformInstruments.length > 0 ? `
                    <div class="instruments-modal-list">
                        ${platformInstruments.map(inst => this.createInstrumentModalRow(inst, canEdit)).join('')}
                    </div>
                ` : `
                    <div class="empty-state-inline" style="padding: 2rem; text-align: center; background: #f9fafb; border-radius: 8px; border: 2px dashed #e5e7eb;">
                        <i class="fas fa-camera" style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem; display: block;"></i>
                        <span style="color: #6b7280; font-size: 0.95rem;">No instruments configured for this platform</span>
                        ${canEdit ? `
                            <p style="margin-top: 1rem;">
                                <button class="btn btn-primary" onclick="sitesStationDashboard.showCreateInstrumentModal(${platformId})">
                                    <i class="fas fa-plus-circle"></i> Add Your First Instrument
                                </button>
                            </p>
                        ` : ''}
                    </div>
                `}
            </div>
        `;
    }

    createInstrumentModalRow(instrument, canEdit) {
        const imageUrl = this.getLatestPhenocamImage(instrument.id, true);
        const statusClass = instrument.status ? instrument.status.toLowerCase().replace(/\s+/g, '-') : 'unknown';

        return `
            <div class="instrument-modal-row" style="display: flex; align-items: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; background: #fafdfb; transition: all 0.2s;">

                <!-- Thumbnail -->
                <div class="instrument-thumbnail" style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; margin-right: 12px; flex-shrink: 0; background: #f3f4f6;">
                    ${imageUrl ? `
                        <img src="${imageUrl}" alt="${this.escapeHtml(instrument.display_name)}"
                             style="width: 100%; height: 100%; object-fit: cover;">
                    ` : `
                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);">
                            <i class="fas fa-camera" style="color: #9ca3af; font-size: 20px;"></i>
                        </div>
                    `}
                </div>

                <!-- Instrument Info -->
                <div class="instrument-info" style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 0.95rem; color: #1f2937; margin-bottom: 4px;">
                        ${this.escapeHtml(instrument.display_name)}
                    </div>
                    <div style="display: flex; gap: 12px; font-size: 0.8rem; color: #6b7280; flex-wrap: wrap;">
                        <span><i class="fas fa-tag"></i> ${instrument.normalized_name || 'No ID'}</span>
                        ${instrument.legacy_acronym ? `<span><i class="fas fa-history"></i> ${instrument.legacy_acronym}</span>` : ''}
                        <span class="status-badge status-${statusClass}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">
                            ${this.getStatusIcon(instrument.status)} ${instrument.status || 'Unknown'}
                        </span>
                    </div>
                </div>

                <!-- Actions -->
                <div class="instrument-actions" style="display: flex; gap: 6px; flex-shrink: 0; margin-left: 12px;">
                    <button onclick="sitesStationDashboard.viewInstrumentDetails('${instrument.id}')"
                            class="btn btn-primary btn-sm"
                            title="View Details"
                            style="min-width: 32px; padding: 6px 10px;">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${canEdit ? `
                        <button onclick="sitesStationDashboard.editInstrument('${instrument.id}')"
                                class="btn btn-secondary btn-sm"
                                title="Edit Instrument"
                                style="min-width: 32px; padding: 6px 10px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="sitesStationDashboard.deleteInstrument('${instrument.id}', '${this.escapeHtml(instrument.display_name)}')"
                                class="btn btn-danger btn-sm"
                                title="Delete Instrument"
                                style="min-width: 32px; padding: 6px 10px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    trackPlatformModal(platformId) {
        this.currentOpenPlatformId = platformId;
    }

    formatOperationPrograms(programs) {
        if (!programs) return 'Not specified';
        if (typeof programs === 'string') {
            try {
                programs = JSON.parse(programs);
            } catch {
                return programs;
            }
        }
        if (Array.isArray(programs)) {
            return programs.join(', ');
        }
        return programs.toString();
    }

    getStatusIcon(status) {
        const statusIcons = {
            'Active': '<i class="fas fa-check-circle" style="color: #10b981;"></i>',
            'Inactive': '<i class="fas fa-times-circle" style="color: #ef4444;"></i>',
            'Maintenance': '<i class="fas fa-tools" style="color: #f59e0b;"></i>',
            'Planned': '<i class="fas fa-clock" style="color: #6b7280;"></i>',
            'Decommissioned': '<i class="fas fa-archive" style="color: #9ca3af;"></i>'
        };
        return statusIcons[status] || '<i class="fas fa-question-circle" style="color: #6b7280;"></i>';
    }

    /**
     * Get icon and color for instrument type
     * @param {string} instrumentType - The instrument type string
     * @returns {Object} Object with icon class and color
     */
    getInstrumentTypeIcon(instrumentType) {
        const typeIcons = {
            'Phenocam': { icon: 'fa-camera', color: '#10b981' },
            'Multispectral Sensor': { icon: 'fa-wave-square', color: '#6366f1' },
            'PAR Sensor': { icon: 'fa-sun', color: '#eab308' },
            'NDVI Sensor': { icon: 'fa-leaf', color: '#22c55e' },
            'PRI Sensor': { icon: 'fa-microscope', color: '#8b5cf6' },
            'Hyperspectral Sensor': { icon: 'fa-rainbow', color: '#ec4899' }
        };
        return typeIcons[instrumentType] || { icon: 'fa-microchip', color: '#6b7280' };
    }

    /**
     * Groups instruments by their type category for tabbed display
     * @param {Array} instruments - Array of instrument objects
     * @returns {Object} Object with category keys and arrays of instruments
     */
    groupInstrumentsByType(instruments) {
        if (!Array.isArray(instruments)) {
            console.warn('groupInstrumentsByType: instruments is not an array', instruments);
            return {};
        }

        const categories = {
            phenocam: { label: 'Phenocams', icon: 'fa-camera', instruments: [] },
            multispectral: { label: 'MS Sensors', icon: 'fa-satellite', instruments: [] },
            other: { label: 'Other', icon: 'fa-microchip', instruments: [] }
        };

        instruments.forEach(inst => {
            if (!inst || !inst.instrument_type) {
                console.warn('Invalid instrument object:', inst);
                return;
            }
            const type = (inst.instrument_type || '').toLowerCase();
            if (type.includes('phenocam') || type === 'phenocam') {
                categories.phenocam.instruments.push(inst);
            } else if (type.includes('multispectral') || type.includes('ms sensor')) {
                categories.multispectral.instruments.push(inst);
            } else {
                // PAR, Hyperspectral, and any other types go here
                categories.other.instruments.push(inst);
            }
        });

        // Filter out empty categories
        return Object.fromEntries(
            Object.entries(categories).filter(([_, cat]) => cat.instruments.length > 0)
        );
    }

    /**
     * Creates the tabbed instrument interface HTML for a platform card
     * @param {Array} instruments - Array of instruments for this platform
     * @param {number} platformId - The platform ID for unique tab IDs
     * @returns {string} HTML string for the tabbed interface
     */
    createInstrumentTabs(instruments, platformId) {
        if (!Array.isArray(instruments) || instruments.length === 0) {
            return '';
        }

        const grouped = this.groupInstrumentsByType(instruments);
        const categoryKeys = Object.keys(grouped);

        if (categoryKeys.length === 0) {
            return '';
        }

        // If only one category with few instruments, use simple list instead of tabs
        if (categoryKeys.length === 1 && instruments.length <= 3) {
            return `
                <div class="instruments-preview">
                    <h5 style="margin: 8px 0 4px 0; font-size: 0.9em; color: #374151;">
                        <i class="fas ${grouped[categoryKeys[0]].icon}"></i>
                        ${grouped[categoryKeys[0]].label} (${instruments.length})
                    </h5>
                    ${instruments.map(inst => this.createInstrumentCard(inst)).join('')}
                </div>
            `;
        }

        // Build tabs header
        const tabsHeader = categoryKeys.map((key, index) => {
            const cat = grouped[key];
            const isActive = index === 0 ? 'active' : '';
            return `
                <button class="instrument-tab-btn ${isActive}"
                        data-tab="${key}"
                        data-platform="${platformId}"
                        onclick="sitesStationDashboard.switchInstrumentTab('${platformId}', '${key}')">
                    <i class="fas ${cat.icon} tab-icon"></i>
                    <span>${cat.label}</span>
                    <span class="tab-count">${cat.instruments.length}</span>
                </button>
            `;
        }).join('');

        // Build tabs content
        const tabsContent = categoryKeys.map((key, index) => {
            const cat = grouped[key];
            const isActive = index === 0 ? 'active' : '';
            return `
                <div class="instrument-tab-content ${isActive}"
                     data-tab-content="${key}"
                     data-platform="${platformId}">
                    <div class="instruments-list">
                        ${cat.instruments.map(inst => this.createInstrumentCard(inst)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="instrument-tabs">
                <div class="instrument-tabs-header">
                    ${tabsHeader}
                </div>
                ${tabsContent}
            </div>
        `;
    }

    /**
     * Switches the active tab in the instrument tabs interface
     * @param {number} platformId - The platform ID
     * @param {string} tabKey - The tab key to switch to
     */
    switchInstrumentTab(platformId, tabKey) {
        try {
            // Find the platform card
            const platformCard = document.querySelector(`.platform-card[data-platform-id="${platformId}"]`);
            if (!platformCard) {
                console.warn(`Platform card not found for ID: ${platformId}`);
                return;
            }

            // Update tab buttons
            const tabBtns = platformCard.querySelectorAll(`.instrument-tab-btn[data-platform="${platformId}"]`);
            tabBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabKey);
            });

            // Update tab content
            const tabContents = platformCard.querySelectorAll(`.instrument-tab-content[data-platform="${platformId}"]`);
            tabContents.forEach(content => {
                content.classList.toggle('active', content.dataset.tabContent === tabKey);
            });
        } catch (error) {
            console.error('Error switching instrument tab:', error);
        }
    }

    createInstrumentCard(instrument) {
        // Get the latest image URL optimized for thumbnails
        const imageUrl = this.getLatestPhenocamImage(instrument.id, true);

        return `
            <div class="instrument-card-compact" style="margin: 4px 0; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${imageUrl ? `
                        <div style="width: 40px; height: 40px; border-radius: 4px; overflow: hidden; flex-shrink: 0; background: #f3f4f6;">
                            <img src="${imageUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" loading="lazy" onerror="this.parentElement.innerHTML='<div style=\\'width: 100%; height: 100%; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); display: flex; align-items: center; justify-content: center; border: 1px solid #d1d5db;\\'>  <i class=\\'fas fa-camera\\' style=\\'color: #6b7280; font-size: 14px;\\'></i></div>'">
                        </div>
                    ` : `
                        <div class="phenocam-placeholder-icon" style="width: 40px; height: 40px; border-radius: 4px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); display: flex !important; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #d1d5db;">
                            <img src="/images/SITES_spectral_LOGO.png" alt="SITES Spectral" style="width: 28px; height: auto; opacity: 0.7;">
                        </div>
                    `}
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.85em; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(instrument.display_name || instrument.name || 'Unnamed')}</div>
                        <div style="font-size: 0.75em; color: #6b7280;">
                            <span style="font-weight: 500;">instrument:</span>
                            <span style="font-family: 'Courier New', monospace;">${instrument.normalized_name || 'No ID'}</span>
                        </div>
                        ${instrument.legacy_acronym ? `<div style="font-size: 0.7em; color: #6b7280; margin-top: 2px;"><span style="font-weight: 500;">legacy name:</span> <span style="font-family: 'Courier New', monospace;">${instrument.legacy_acronym}</span></div>` : ''}
                        ${instrument.status ? `<div style="font-size: 0.7em; margin-top: 2px;">${this.getStatusIcon(instrument.status)} ${instrument.status}</div>` : ''}
                    </div>
                    <div style="flex-shrink: 0;">
                        <button onclick="event.stopPropagation(); sitesStationDashboard.viewInstrumentDetails('${instrument.id}')" style="background: #059669; color: white; border: none; border-radius: 4px; padding: 6px 8px; font-size: 0.75em; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 4px;" onmouseover="this.style.background='#047857'" onmouseout="this.style.background='#059669'">
                            <i class="fas fa-eye" style="font-size: 10px;"></i>
                            <span>Details</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getLatestPhenocamImage(instrumentId, thumbnail = false) {
        // Find the instrument by ID to get its normalized name
        const instrument = this.instruments.find(i => i.id == instrumentId);
        if (!instrument || !instrument.normalized_name) {
            return null;
        }

        // Check manifest for image availability
        if (this.imageManifest && this.imageManifest.instruments) {
            const manifestEntry = this.imageManifest.instruments.find(
                img => img.instrumentId === instrument.normalized_name && img.success === true
            );
            if (!manifestEntry) {
                return null; // Image not available according to manifest
            }
        }

        // Return thumbnail or full image path
        if (thumbnail) {
            return `/assets/instruments/${instrument.normalized_name}.jpg`; // For now, same as full image but with CSS optimization
        } else {
            return `/assets/instruments/${instrument.normalized_name}.jpg`;
        }
    }

    getInstrumentImageUrl(instrument) {
        // Helper function to get image URL for an instrument object
        if (!instrument || !instrument.normalized_name) {
            return null;
        }

        // Check manifest for image availability
        if (this.imageManifest && this.imageManifest.instruments) {
            const manifestEntry = this.imageManifest.instruments.find(
                img => img.instrumentId === instrument.normalized_name && img.success === true
            );
            if (!manifestEntry) {
                return null; // Image not available according to manifest
            }
        }

        return `/assets/instruments/${instrument.normalized_name}.jpg`;
    }

    getPhenocamImageHtml(instrument) {
        const imageUrl = this.getInstrumentImageUrl(instrument);
        if (!imageUrl) {
            return `
                <div class="phenocam-placeholder">
                    <img src="/images/SITES_spectral_LOGO.png" alt="SITES Spectral" style="width: 80px; height: auto; opacity: 0.6; margin-bottom: 8px;">
                    <p>No phenocam image available</p>
                </div>
            `;
        }

        return `
            <div class="phenocam-image-wrapper">
                <img
                    src="${imageUrl}"
                    alt="Phenocam view for ${this.escapeHtml(instrument.display_name || instrument.normalized_name)}"
                    class="phenocam-image"
                    onclick="this.classList.toggle('zoomed')"
                    onerror="this.parentElement.innerHTML = '<div class=\\'phenocam-error\\'><i class=\\'fas fa-exclamation-triangle\\'></i><p>Image not found</p></div>'"
                    onload="this.style.opacity = '1'"
                />
                <div class="phenocam-image-info">
                    <small><i class="fas fa-info-circle"></i> Click image to zoom</small>
                </div>
            </div>
        `;
    }

    getRoiCardsHtml(instrument) {
        // ⚠️ DEMO DATA: Using mock ROI examples for demonstration. Replace with real API data.
        const mockRois = [
            {
                id: 'ROI_00',
                name: 'ROI_00',
                description: 'Full image excluding sky (auto-calculated)',
                color: [255, 255, 255],
                points: [[0, 1041], [4287, 1041], [4287, 2847], [0, 2847]],
                auto_generated: true,
                thickness: 7
            },
            {
                id: 'ROI_01',
                name: 'ROI_01',
                description: 'Canopy vegetation monitoring area',
                color: [0, 255, 0],
                points: [[100, 1800], [2700, 1550], [2500, 2700], [100, 2700]],
                auto_generated: false,
                thickness: 7
            },
            {
                id: 'ROI_02',
                name: 'ROI_02',
                description: 'Upper canopy research zone',
                color: [0, 0, 255],
                points: [[100, 930], [3700, 1050], [3700, 1150], [100, 1300]],
                auto_generated: false,
                thickness: 7
            }
        ];

        // Check if instrument has ROI data (mock check)
        const hasRois = instrument.normalized_name && instrument.normalized_name.includes('PHE');
        const rois = hasRois ? mockRois : [];

        if (rois.length === 0) {
            const canEdit = this.currentUser && (this.currentUser.role === 'admin' ||
                (this.currentUser.role === 'station' && this.currentUser.station_normalized_name === this.stationData?.normalized_name));

            return `
                <div class="roi-empty-state">
                    <i class="fas fa-vector-square empty-icon"></i>
                    <div class="empty-title">No ROIs Defined</div>
                    <div class="empty-message">
                        Regions of Interest (ROIs) help define specific areas for vegetation analysis in phenocam images.
                        ${canEdit ? 'Create your first ROI to start monitoring specific areas.' : ''}
                    </div>
                    ${canEdit ? `
                        <button class="empty-action" onclick="sitesStationDashboard.createROI('${instrument.id}')">
                            <i class="fas fa-plus"></i> Create First ROI
                        </button>
                    ` : ''}
                </div>
            `;
        }

        return `
            <div style="background: #fef3cd; border: 1px solid #fbbf24; border-radius: 6px; padding: 8px; margin-bottom: 12px; font-size: 0.85em;">
                <i class="fas fa-exclamation-triangle" style="color: #f59e0b; margin-right: 6px;"></i>
                <strong>Demo Data:</strong> Showing example ROIs for demonstration. Replace with real ROI data from API.
            </div>
            <div class="roi-cards-grid">
                ${rois.map(roi => this.createRoiCard(roi, instrument)).join('')}
            </div>
        `;
    }

    createRoiCard(roi, instrument) {
        const colorStyle = `background-color: rgb(${roi.color.join(',')})`;
        const isAutoGenerated = roi.auto_generated || roi.name === 'ROI_00';
        const pointsCount = roi.points ? roi.points.length : 0;

        return `
            <div class="roi-card ${isAutoGenerated ? 'roi-auto' : ''}" onclick="sitesStationDashboard.viewRoiDetails('${roi.id}', '${instrument.id}')">
                <div class="roi-card-header">
                    <div class="roi-name">${this.escapeHtml(roi.name)}</div>
                    <div class="roi-color-indicator" style="${colorStyle}"></div>
                </div>
                <div class="roi-type-indicator ${isAutoGenerated ? 'roi-type-auto' : 'roi-type-manual'}">
                    ${isAutoGenerated ? '🤖 Auto-Generated' : 'Manual'}
                </div>
                <div class="roi-description">
                    ${this.escapeHtml(roi.description || 'No description available')}
                </div>
                <div class="roi-metadata">
                    <div class="roi-meta-item">
                        <i class="fas fa-draw-polygon"></i>
                        <span class="roi-points-count">${pointsCount}</span> points
                    </div>
                    <div class="roi-meta-item">
                        <i class="fas fa-palette"></i>
                        RGB(${roi.color.join(',')})
                    </div>
                    ${roi.thickness ? `
                        <div class="roi-meta-item">
                            <i class="fas fa-ruler"></i>
                            ${roi.thickness}px thick
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getMaintenanceLogHtml(instrument) {
        // Mock maintenance data based on maintenance_notes field
        const maintenanceEntries = [];

        if (instrument.maintenance_notes) {
            // Parse maintenance notes or create entry from existing notes
            maintenanceEntries.push({
                date: instrument.deployment_date || new Date().toISOString().split('T')[0],
                type: 'routine',
                description: instrument.maintenance_notes
            });
        }

        // ⚠️ DEMO DATA: Mock historical entries for demonstration purposes
        if (instrument.normalized_name && instrument.normalized_name.includes('PHE')) {
            maintenanceEntries.push(
                {
                    date: '2024-06-15',
                    type: 'routine',
                    description: 'Regular cleaning and lens inspection performed. All systems operational.'
                },
                {
                    date: '2024-03-20',
                    type: 'repair',
                    description: 'Replaced weatherproof housing seal due to minor water ingress.'
                },
                {
                    date: '2023-11-10',
                    type: 'upgrade',
                    description: 'Updated firmware to latest version for improved image quality.'
                }
            );
        }

        return `
            <div class="maintenance-log">
                <div class="maintenance-header">
                    <i class="fas fa-tools"></i>
                    <h4>Maintenance History</h4>
                </div>
                <div class="maintenance-timeline">
                    ${maintenanceEntries.length > 0 ?
                        maintenanceEntries.map(entry => this.createMaintenanceEntry(entry)).join('') :
                        this.getMaintenanceEmptyState()
                    }
                </div>
            </div>
        `;
    }

    createMaintenanceEntry(entry) {
        const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="maintenance-entry">
                <div class="maintenance-date">${formattedDate}</div>
                <div class="maintenance-type ${entry.type}">${entry.type}</div>
                <div class="maintenance-description">${this.escapeHtml(entry.description)}</div>
            </div>
        `;
    }

    getMaintenanceEmptyState() {
        return `
            <div class="maintenance-empty">
                <i class="fas fa-clipboard-list empty-icon"></i>
                <div class="empty-title">No Maintenance Records</div>
                <div class="empty-message">
                    No maintenance activities have been logged for this instrument yet.
                </div>
            </div>
        `;
    }

    viewRoiDetails(roiId, instrumentId) {
        // ⚠️ DEMO DATA: Mock ROI details for demonstration. Replace with API data.
        const mockRoiDetails = {
            'ROI_00': {
                id: 'ROI_00',
                name: 'ROI_00',
                description: 'Full image excluding sky (auto-calculated)',
                color: [255, 255, 255],
                points: [[0, 1041], [4287, 1041], [4287, 2847], [0, 2847]],
                auto_generated: true,
                thickness: 7,
                alpha: 0.0,
                generated_date: '2025-06-02',
                source_image: 'abisko_ANS_FOR_BL01_PHE01_2023_152_20230601_092630.jpg'
            },
            'ROI_01': {
                id: 'ROI_01',
                name: 'ROI_01',
                description: 'Canopy vegetation monitoring area',
                color: [0, 255, 0],
                points: [[100, 1800], [2700, 1550], [2500, 2700], [100, 2700]],
                auto_generated: false,
                thickness: 7,
                alpha: 0.5
            },
            'ROI_02': {
                id: 'ROI_02',
                name: 'ROI_02',
                description: 'Upper canopy research zone',
                color: [0, 0, 255],
                points: [[100, 930], [3700, 1050], [3700, 1150], [100, 1300]],
                auto_generated: false,
                thickness: 7,
                alpha: 0.5
            }
        };

        const roi = mockRoiDetails[roiId];
        if (!roi) {
            console.error('ROI not found:', roiId);
            return;
        }

        this.showRoiDetailsModal(roi, instrumentId);
    }

    showRoiDetailsModal(roi, instrumentId) {
        const modal = document.createElement('div');
        modal.className = 'roi-modal';
        modal.id = 'roi-details-modal';

        const colorStyle = `background-color: rgb(${roi.color.join(',')})`;
        const isAutoGenerated = roi.auto_generated || roi.name === 'ROI_00';

        modal.innerHTML = `
            <div class="roi-modal-content">
                <div class="roi-modal-header">
                    <h3><i class="fas fa-vector-square"></i> ${this.escapeHtml(roi.name)} Details</h3>
                    <button class="roi-modal-close" onclick="closeRoiDetailsModal()">&times;</button>
                </div>
                <div class="roi-modal-body">
                    <div class="roi-color-display">
                        <div class="roi-color-swatch" style="${colorStyle}"></div>
                        <div>
                            <div class="roi-color-values">RGB(${roi.color.join(', ')})</div>
                            <div style="font-size: 0.8rem; color: #6b7280; margin-top: 4px;">
                                ${isAutoGenerated ? '🤖 Auto-Generated ROI' : 'Manual ROI'}
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>ROI Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Name:</strong> ${this.escapeHtml(roi.name)}
                            </div>
                            <div class="detail-item">
                                <strong>Description:</strong> ${this.escapeHtml(roi.description || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Type:</strong> ${isAutoGenerated ? 'Auto-Generated (Sky Detection)' : 'Manual'}
                            </div>
                            <div class="detail-item">
                                <strong>Points:</strong> ${roi.points ? roi.points.length : 0} coordinates
                            </div>
                            ${roi.thickness ? `
                                <div class="detail-item">
                                    <strong>Thickness:</strong> ${roi.thickness}px
                                </div>
                            ` : ''}
                            ${roi.alpha !== undefined ? `
                                <div class="detail-item">
                                    <strong>Alpha:</strong> ${roi.alpha} (transparency)
                                </div>
                            ` : ''}
                            ${roi.generated_date ? `
                                <div class="detail-item">
                                    <strong>Generated:</strong> ${roi.generated_date}
                                </div>
                            ` : ''}
                            ${roi.source_image ? `
                                <div class="detail-item">
                                    <strong>Source Image:</strong> ${this.escapeHtml(roi.source_image)}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${roi.points && roi.points.length > 0 ? `
                        <div class="detail-section">
                            <h4>Polygon Coordinates</h4>
                            <div style="background: #f9fafb; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">
                                ${roi.points.map((point, index) =>
                                    `<div style="margin-bottom: 4px;">Point ${index + 1}: [${point[0]}, ${point[1]}]</div>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${this.currentUser && (this.currentUser.role === 'admin' ||
                        (this.currentUser.role === 'station' && this.currentUser.station_normalized_name === this.stationData?.normalized_name)) ? `
                        <div class="modal-actions">
                            <button class="btn btn-primary" onclick="sitesStationDashboard.editROI('${roi.id}', '${instrumentId}')">
                                <i class="fas fa-edit"></i> Edit ROI
                            </button>
                            ${!isAutoGenerated ? `
                                <button class="btn btn-danger" onclick="sitesStationDashboard.deleteROI('${roi.id}', '${roi.name}', '${instrumentId}')">
                                    <i class="fas fa-trash"></i> Delete ROI
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    createROI(instrumentId) {
        // Placeholder for ROI creation
        console.log('Create ROI for instrument:', instrumentId);
        showNotification('ROI creation functionality will be implemented in future version', 'info');
    }

    editROI(roiId, instrumentId) {
        // Placeholder for ROI editing
        console.log('Edit ROI:', roiId, 'for instrument:', instrumentId);
        showNotification('ROI editing functionality will be implemented in future version', 'info');
    }

    deleteROI(roiId, roiName, instrumentId) {
        // Placeholder for ROI deletion
        console.log('Delete ROI:', roiId, roiName, 'for instrument:', instrumentId);
        showNotification('ROI deletion functionality will be implemented in future version', 'info');
    }

    viewInstrumentDetails(instrumentId) {
        const instrument = this.instruments.find(i => i.id == instrumentId);
        if (instrument) {
            this.showInstrumentDetailsModal(instrument);
        }
    }

    showInstrumentDetailsModal(instrument) {
        // Create and show a modal with instrument details and edit/delete options
        const modal = document.createElement('div');
        modal.className = 'instrument-modal show';
        modal.id = 'instrument-details-modal';

        // Check permissions for edit/delete buttons
        const canEdit = this.currentUser?.role === 'admin' || this.currentUser?.role === 'station';

        // Determine instrument type for icon and sections
        const instrumentType = instrument.instrument_type || 'Unknown';
        const isPhenocam = instrumentType === 'Phenocam';
        const typeIcon = this.getInstrumentTypeIcon(instrumentType);

        modal.innerHTML = `
            <div class="modal-content-large">
                <div class="modal-header-large">
                    <h3><i class="fas ${typeIcon.icon}" style="color: ${typeIcon.color}"></i> ${this.escapeHtml(instrument.display_name || 'Instrument Details')}</h3>
                    <button class="modal-close-large" onclick="closeInstrumentDetailsModal()">&times;</button>
                </div>
                <div class="modal-body-large">
                    <div class="detail-section">
                        <h4>Basic Information</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Display Name:</strong> ${this.escapeHtml(instrument.display_name || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Normalized Name:</strong> <code>${instrument.normalized_name || 'N/A'}</code>
                            </div>
                            ${instrument.legacy_acronym ? `
                            <div class="detail-item">
                                <strong>Legacy Name:</strong> <code>${instrument.legacy_acronym}</code>
                            </div>
                            ` : ''}
                            <div class="detail-item">
                                <strong>Type:</strong> ${this.escapeHtml(instrument.instrument_type || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Status:</strong> ${this.getStatusIcon(instrument.status)} ${instrument.status || 'N/A'}
                            </div>
                        </div>
                    </div>

                    ${isPhenocam ? `
                    <div class="detail-section">
                        <h4>Phenocam Image</h4>
                        <div class="phenocam-image-container">
                            ${this.getPhenocamImageHtml(instrument)}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Camera Specifications</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Brand:</strong> ${this.escapeHtml(instrument.camera_brand || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Model:</strong> ${this.escapeHtml(instrument.camera_model || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Resolution:</strong> ${this.escapeHtml(instrument.camera_resolution || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Serial Number:</strong> ${this.escapeHtml(instrument.camera_serial_number || 'N/A')}
                            </div>
                            ${instrument.camera_aperture ? `
                                <div class="detail-item">
                                    <strong>Aperture:</strong> ${this.escapeHtml(instrument.camera_aperture)}
                                </div>
                            ` : ''}
                            ${instrument.camera_exposure_time ? `
                                <div class="detail-item">
                                    <strong>Exposure Time:</strong> ${this.escapeHtml(instrument.camera_exposure_time)}
                                </div>
                            ` : ''}
                            ${instrument.camera_focal_length_mm ? `
                                <div class="detail-item">
                                    <strong>Focal Length:</strong> ${instrument.camera_focal_length_mm}mm
                                </div>
                            ` : ''}
                            ${instrument.camera_iso ? `
                                <div class="detail-item">
                                    <strong>ISO:</strong> ${instrument.camera_iso}
                                </div>
                            ` : ''}
                            ${instrument.camera_lens ? `
                                <div class="detail-item">
                                    <strong>Lens:</strong> ${this.escapeHtml(instrument.camera_lens)}
                                </div>
                            ` : ''}
                            ${instrument.camera_white_balance ? `
                                <div class="detail-item">
                                    <strong>White Balance:</strong> ${this.escapeHtml(instrument.camera_white_balance)}
                                </div>
                            ` : ''}
                            ${instrument.camera_mega_pixels ? `
                                <div class="detail-item">
                                    <strong>Mega Pixels:</strong> ${instrument.camera_mega_pixels}MP
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : `
                    <div class="detail-section">
                        <h4><i class="fas ${typeIcon.icon}" style="color: ${typeIcon.color}"></i> Sensor Specifications</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Brand:</strong> ${this.escapeHtml(instrument.sensor_brand || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Model:</strong> ${this.escapeHtml(instrument.sensor_model || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Serial Number:</strong> ${this.escapeHtml(instrument.sensor_serial_number || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Orientation:</strong> ${this.escapeHtml(instrument.orientation || 'N/A')}
                            </div>
                            ${instrument.number_of_channels ? `
                                <div class="detail-item">
                                    <strong>Channels:</strong> ${instrument.number_of_channels}
                                </div>
                            ` : ''}
                            ${instrument.field_of_view_degrees ? `
                                <div class="detail-item">
                                    <strong>Field of View:</strong> ${instrument.field_of_view_degrees}°
                                </div>
                            ` : ''}
                            ${instrument.datalogger_type ? `
                                <div class="detail-item">
                                    <strong>Datalogger:</strong> ${this.escapeHtml(instrument.datalogger_type)}
                                </div>
                            ` : ''}
                            ${instrument.cable_length_m ? `
                                <div class="detail-item">
                                    <strong>Cable Length:</strong> ${instrument.cable_length_m}m
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    `}

                    <div class="detail-section">
                        <h4>Location & Orientation</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Coordinates:</strong> ${instrument.latitude && instrument.longitude ?
                                    `${instrument.latitude.toFixed(6)}, ${instrument.longitude.toFixed(6)}` : 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Height:</strong> ${instrument.instrument_height_m ? `${instrument.instrument_height_m}m` : 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Viewing Direction:</strong> ${this.escapeHtml(instrument.viewing_direction || 'N/A')}
                            </div>
                            <div class="detail-item">
                                <strong>Azimuth:</strong> ${instrument.azimuth_degrees ? `${instrument.azimuth_degrees}°` : 'N/A'}
                            </div>
                        </div>
                    </div>

                    ${instrument.description ? `
                        <div class="detail-section">
                            <h4>Description</h4>
                            <p>${this.escapeHtml(instrument.description)}</p>
                        </div>
                    ` : ''}

                    <div class="detail-section roi-section">
                        <h4><i class="fas fa-vector-square"></i> Regions of Interest (ROIs)</h4>
                        <div id="roi-container-${instrument.id}">
                            ${this.getRoiCardsHtml(instrument)}
                        </div>
                    </div>

                    <div class="detail-section maintenance-section">
                        ${this.getMaintenanceLogHtml(instrument)}
                    </div>

                    ${canEdit ? `
                        <div class="modal-actions">
                            <button class="btn btn-primary" onclick="sitesStationDashboard.editInstrument('${instrument.id}')">
                                <i class="fas fa-edit"></i> Edit Instrument
                            </button>
                            <button class="btn btn-danger" onclick="sitesStationDashboard.deleteInstrument('${instrument.id}', '${this.escapeHtml(instrument.display_name)}')">
                                <i class="fas fa-trash"></i> Delete Instrument
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    editInstrument(instrumentId) {
        // Station users can edit their own instruments, admin can edit all
        if (this.currentUser?.role !== 'admin' && this.currentUser?.role !== 'station') {
            showNotification('Edit privileges required', 'error');
            return;
        }

        const instrument = this.instruments.find(i => i.id == instrumentId);
        if (instrument) {
            // UX Enhancement: Smooth modal transition from view to edit
            this.transitionToEditMode(instrument);
        }
    }

    /**
     * UX-optimized transition from view modal to edit modal
     * Provides smooth user flow with proper modal management
     */
    transitionToEditMode(instrument) {
        // 1. Close details modal with smooth transition
        const detailsModal = document.getElementById('instrument-details-modal');
        if (detailsModal) {
            detailsModal.style.transition = 'opacity 0.2s ease-out';
            detailsModal.style.opacity = '0';

            setTimeout(() => {
                detailsModal.remove();
            }, 200);
        }

        // 2. Brief pause for smooth transition
        setTimeout(() => {
            this.showEditInstrumentModal(instrument);

            // 3. Focus on first form field for immediate editing
            setTimeout(() => {
                const firstInput = document.getElementById('edit-instrument-display-name');
                if (firstInput) {
                    firstInput.focus();
                    firstInput.select(); // Pre-select text for easy editing
                }
            }, 100);
        }, 150);
    }

    deleteInstrument(instrumentId, instrumentName) {
        // Station users can delete their own instruments, admin can delete all
        if (this.currentUser?.role !== 'admin' && this.currentUser?.role !== 'station') {
            showNotification('Delete privileges required', 'error');
            return;
        }

        const message = `Are you sure you want to delete the instrument "${instrumentName}"? This action cannot be undone.`;

        if (!confirm(message)) {
            return;
        }

        this.performInstrumentDeletion(instrumentId);
    }

    async performInstrumentDeletion(instrumentId) {
        try {
            const response = await window.sitesAPI.deleteInstrument(instrumentId);

            if (response.success) {
                showNotification('Instrument deleted successfully', 'success');

                // Close any open modals
                const modal = document.getElementById('instrument-details-modal');
                if (modal) {
                    modal.remove();
                }

                // Reload data
                await this.loadPlatformsAndInstruments();
            } else {
                throw new Error(response.error || 'Failed to delete instrument');
            }

        } catch (error) {
            console.error('Error deleting instrument:', error);
            showNotification(`Failed to delete instrument: ${error.message}`, 'error');
        }
    }

    showEditInstrumentModal(instrument) {
        const modal = document.getElementById('instrument-edit-modal');
        const formContainer = document.getElementById('instrument-edit-form');

        if (!modal || !formContainer) {
            console.error('Instrument edit modal elements not found');
            return;
        }

        // Determine instrument type for conditional form fields
        const instrumentType = instrument.instrument_type || 'Unknown';
        const isPhenocam = instrumentType === 'Phenocam';

        // Populate the edit form with instrument data
        formContainer.innerHTML = `
            <form id="edit-instrument-form" class="modal-form" data-instrument-type="${instrumentType}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-display-name">Instrument Name</label>
                        <input type="text" id="edit-instrument-display-name" class="form-input"
                               value="${this.escapeHtml(instrument.display_name || '')}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-type">Instrument Type</label>
                        <select id="edit-instrument-type" class="form-select" required>
                            <option value="">Select Type</option>
                            <option value="Phenocam" ${instrument.instrument_type === 'Phenocam' ? 'selected' : ''}>Phenocam</option>
                            <option value="Multispectral Sensor" ${instrument.instrument_type === 'Multispectral Sensor' ? 'selected' : ''}>Multispectral Sensor</option>
                            <option value="SKYE MS" ${instrument.instrument_type === 'SKYE MS' ? 'selected' : ''}>SKYE MS Sensor</option>
                            <option value="Decagon MS" ${instrument.instrument_type === 'Decagon MS' ? 'selected' : ''}>Decagon MS Sensor</option>
                            <option value="Apogee MS" ${instrument.instrument_type === 'Apogee MS' ? 'selected' : ''}>Apogee MS Sensor</option>
                            <option value="PAR Sensor" ${instrument.instrument_type === 'PAR Sensor' ? 'selected' : ''}>PAR Sensor</option>
                            <option value="NDVI Sensor" ${instrument.instrument_type === 'NDVI Sensor' ? 'selected' : ''}>NDVI Sensor</option>
                            <option value="PRI Sensor" ${instrument.instrument_type === 'PRI Sensor' ? 'selected' : ''}>PRI Sensor</option>
                            <option value="Hyperspectral Sensor" ${instrument.instrument_type === 'Hyperspectral Sensor' ? 'selected' : ''}>Hyperspectral Sensor</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-status">Status</label>
                        <select id="edit-instrument-status" class="form-select">
                            <option value="Active" ${instrument.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${instrument.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Maintenance" ${instrument.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-deployment">Deployment Date</label>
                        <input type="date" id="edit-instrument-deployment" class="form-input"
                               value="${instrument.deployment_date || ''}">
                    </div>
                </div>

                ${isPhenocam ? `
                <h4>Camera Specifications</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-camera-brand">Camera Brand</label>
                        <input type="text" id="edit-instrument-camera-brand" class="form-input"
                               value="${this.escapeHtml(instrument.camera_brand || '')}">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-camera-model">Camera Model</label>
                        <input type="text" id="edit-instrument-camera-model" class="form-input"
                               value="${this.escapeHtml(instrument.camera_model || '')}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-camera-resolution">Camera Resolution</label>
                        <input type="text" id="edit-instrument-camera-resolution" class="form-input"
                               value="${this.escapeHtml(instrument.camera_resolution || '')}"
                               placeholder="e.g., 2048x1536">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-camera-serial">Serial Number</label>
                        <input type="text" id="edit-instrument-camera-serial" class="form-input"
                               value="${this.escapeHtml(instrument.camera_serial_number || '')}">
                    </div>
                </div>
                ` : `
                <h4>Sensor Specifications</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-sensor-brand">Sensor Brand</label>
                        <input type="text" id="edit-instrument-sensor-brand" class="form-input"
                               value="${this.escapeHtml(instrument.sensor_brand || '')}">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-sensor-model">Sensor Model</label>
                        <input type="text" id="edit-instrument-sensor-model" class="form-input"
                               value="${this.escapeHtml(instrument.sensor_model || '')}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-sensor-serial">Serial Number</label>
                        <input type="text" id="edit-instrument-sensor-serial" class="form-input"
                               value="${this.escapeHtml(instrument.sensor_serial_number || '')}">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-orientation">Orientation</label>
                        <select id="edit-instrument-orientation" class="form-select">
                            <option value="">Select Orientation</option>
                            <option value="uplooking" ${instrument.orientation === 'uplooking' ? 'selected' : ''}>Uplooking</option>
                            <option value="downlooking" ${instrument.orientation === 'downlooking' ? 'selected' : ''}>Downlooking</option>
                            <option value="horizontal" ${instrument.orientation === 'horizontal' ? 'selected' : ''}>Horizontal</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-channels">Number of Channels</label>
                        <input type="number" id="edit-instrument-channels" class="form-input"
                               value="${instrument.number_of_channels || ''}" min="1" max="20">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-fov">Field of View (degrees)</label>
                        <input type="number" id="edit-instrument-fov" class="form-input"
                               value="${instrument.field_of_view_degrees || ''}" step="0.1" min="0" max="180">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-datalogger">Datalogger Type</label>
                        <input type="text" id="edit-instrument-datalogger" class="form-input"
                               value="${this.escapeHtml(instrument.datalogger_type || '')}"
                               placeholder="e.g., Campbell Scientific CR1000X">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-cable">Cable Length (m)</label>
                        <input type="number" id="edit-instrument-cable" class="form-input"
                               value="${instrument.cable_length_m || ''}" step="0.1" min="0">
                    </div>
                </div>
                `}

                <h4>Location & Orientation</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-latitude">Latitude</label>
                        <input type="number" id="edit-instrument-latitude" class="form-input"
                               value="${instrument.latitude || ''}" step="0.000001" min="-90" max="90">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-longitude">Longitude</label>
                        <input type="number" id="edit-instrument-longitude" class="form-input"
                               value="${instrument.longitude || ''}" step="0.000001" min="-180" max="180">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-height">Instrument Height (m)</label>
                        <input type="number" id="edit-instrument-height" class="form-input"
                               value="${instrument.instrument_height_m || ''}" step="0.1" min="0">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-viewing">Viewing Direction</label>
                        <select id="edit-instrument-viewing" class="form-select">
                            <option value="">Select Direction</option>
                            <option value="North" ${instrument.viewing_direction === 'North' ? 'selected' : ''}>North</option>
                            <option value="South" ${instrument.viewing_direction === 'South' ? 'selected' : ''}>South</option>
                            <option value="East" ${instrument.viewing_direction === 'East' ? 'selected' : ''}>East</option>
                            <option value="West" ${instrument.viewing_direction === 'West' ? 'selected' : ''}>West</option>
                            <option value="Northeast" ${instrument.viewing_direction === 'Northeast' ? 'selected' : ''}>Northeast</option>
                            <option value="Northwest" ${instrument.viewing_direction === 'Northwest' ? 'selected' : ''}>Northwest</option>
                            <option value="Southeast" ${instrument.viewing_direction === 'Southeast' ? 'selected' : ''}>Southeast</option>
                            <option value="Southwest" ${instrument.viewing_direction === 'Southwest' ? 'selected' : ''}>Southwest</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-instrument-azimuth">Azimuth (degrees)</label>
                        <input type="number" id="edit-instrument-azimuth" class="form-input"
                               value="${instrument.azimuth_degrees || ''}" step="0.1" min="0" max="360">
                    </div>
                    <div class="form-group">
                        <label for="edit-instrument-nadir">Degrees from Nadir</label>
                        <input type="number" id="edit-instrument-nadir" class="form-input"
                               value="${instrument.degrees_from_nadir || ''}" step="0.1" min="0" max="90">
                    </div>
                </div>

                <div class="form-group">
                    <label for="edit-instrument-description">Description</label>
                    <textarea id="edit-instrument-description" class="form-textarea" rows="3">${this.escapeHtml(instrument.description || '')}</textarea>
                </div>

                <div class="form-group">
                    <label for="edit-instrument-installation">Installation Notes</label>
                    <textarea id="edit-instrument-installation" class="form-textarea" rows="2">${this.escapeHtml(instrument.installation_notes || '')}</textarea>
                </div>

                <div class="form-group">
                    <label for="edit-instrument-maintenance">Maintenance Notes</label>
                    <textarea id="edit-instrument-maintenance" class="form-textarea" rows="2" placeholder="Record maintenance activities, repairs, and service history...">${this.escapeHtml(instrument.maintenance_notes || '')}</textarea>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-edit-btn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" id="save-instrument-btn">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        `;

        // Add form submit handler
        const form = document.getElementById('edit-instrument-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveInstrumentEdit(instrument.id);
        });

        // Add cancel button handler
        const cancelBtn = document.getElementById('cancel-edit-btn');
        cancelBtn.addEventListener('click', () => {
            this.cancelInstrumentEdit(instrument);
        });

        // Show the modal with enhanced UX
        modal.classList.add('show');

        // Add visual indicator that we're in edit mode
        modal.setAttribute('data-mode', 'edit');

        // Improve accessibility
        modal.setAttribute('aria-label', `Edit instrument: ${instrument.display_name}`);

        // Add escape key handler for this specific modal
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.cancelInstrumentEdit(instrument);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * UX-optimized cancel behavior for instrument editing
     * Provides clear path back to view mode with data preservation options
     */
    cancelInstrumentEdit(instrument) {
        const modal = document.getElementById('instrument-edit-modal');
        if (!modal) return;

        // Check if form has been modified
        const form = document.getElementById('edit-instrument-form');
        const hasChanges = this.formHasChanges(form, instrument);

        if (hasChanges) {
            // Show confirmation dialog for unsaved changes
            const message = 'You have unsaved changes. Would you like to return to the instrument details or discard changes?';

            if (confirm(message)) {
                // User wants to keep working
                return;
            }
        }

        // Close edit modal
        modal.classList.remove('show');

        // Option to return to details view
        setTimeout(() => {
            if (confirm('Would you like to return to the instrument details view?')) {
                this.showInstrumentDetailsModal(instrument);
            }
        }, 300);
    }

    /**
     * Check if form has been modified from original values
     */
    formHasChanges(form, originalData) {
        if (!form || !originalData) return false;

        const currentValues = {
            display_name: document.getElementById('edit-instrument-display-name')?.value || '',
            instrument_type: document.getElementById('edit-instrument-type')?.value || '',
            status: document.getElementById('edit-instrument-status')?.value || '',
            camera_brand: document.getElementById('edit-instrument-camera-brand')?.value || '',
            camera_model: document.getElementById('edit-instrument-camera-model')?.value || '',
            description: document.getElementById('edit-instrument-description')?.value || ''
        };

        // Compare key fields
        return (
            currentValues.display_name !== (originalData.display_name || '') ||
            currentValues.instrument_type !== (originalData.instrument_type || '') ||
            currentValues.status !== (originalData.status || '') ||
            currentValues.camera_brand !== (originalData.camera_brand || '') ||
            currentValues.camera_model !== (originalData.camera_model || '') ||
            currentValues.description !== (originalData.description || '')
        );
    }

    async saveInstrumentEdit(instrumentId) {
        try {
            // Show loading state
            const submitBtn = document.getElementById('save-instrument-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // Get instrument type to determine which fields to collect
            const instrumentType = document.getElementById('edit-instrument-type').value;
            const isPhenocam = instrumentType === 'Phenocam';

            // Base form data (common to all instrument types)
            const formData = {
                display_name: document.getElementById('edit-instrument-display-name').value.trim(),
                instrument_type: instrumentType,
                status: document.getElementById('edit-instrument-status').value,
                deployment_date: document.getElementById('edit-instrument-deployment').value || null,
                latitude: parseFloat(document.getElementById('edit-instrument-latitude').value) || null,
                longitude: parseFloat(document.getElementById('edit-instrument-longitude').value) || null,
                instrument_height_m: parseFloat(document.getElementById('edit-instrument-height').value) || null,
                viewing_direction: document.getElementById('edit-instrument-viewing').value || null,
                azimuth_degrees: parseFloat(document.getElementById('edit-instrument-azimuth').value) || null,
                degrees_from_nadir: parseFloat(document.getElementById('edit-instrument-nadir').value) || null,
                description: document.getElementById('edit-instrument-description').value.trim() || null,
                installation_notes: document.getElementById('edit-instrument-installation').value.trim() || null,
                maintenance_notes: document.getElementById('edit-instrument-maintenance').value.trim() || null
            };

            // Add type-specific fields
            if (isPhenocam) {
                // Camera fields for Phenocams
                formData.camera_brand = document.getElementById('edit-instrument-camera-brand')?.value.trim() || null;
                formData.camera_model = document.getElementById('edit-instrument-camera-model')?.value.trim() || null;
                formData.camera_resolution = document.getElementById('edit-instrument-camera-resolution')?.value.trim() || null;
                formData.camera_serial_number = document.getElementById('edit-instrument-camera-serial')?.value.trim() || null;
            } else {
                // Sensor fields for non-Phenocam instruments
                formData.sensor_brand = document.getElementById('edit-instrument-sensor-brand')?.value.trim() || null;
                formData.sensor_model = document.getElementById('edit-instrument-sensor-model')?.value.trim() || null;
                formData.sensor_serial_number = document.getElementById('edit-instrument-sensor-serial')?.value.trim() || null;
                formData.orientation = document.getElementById('edit-instrument-orientation')?.value || null;
                formData.number_of_channels = parseInt(document.getElementById('edit-instrument-channels')?.value) || null;
                formData.field_of_view_degrees = parseFloat(document.getElementById('edit-instrument-fov')?.value) || null;
                formData.datalogger_type = document.getElementById('edit-instrument-datalogger')?.value.trim() || null;
                formData.cable_length_m = parseFloat(document.getElementById('edit-instrument-cable')?.value) || null;
            }

            // Validation
            if (!formData.display_name) {
                showNotification('Instrument name is required', 'error');
                return;
            }

            if (!formData.instrument_type) {
                showNotification('Instrument type is required', 'error');
                return;
            }

            // Update loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // Make API call
            const response = await window.sitesAPI.updateInstrument(instrumentId, formData);

            if (response.success) {
                showNotification('Instrument updated successfully', 'success');
                closeInstrumentEditModal();

                // Reload data to show changes
                await this.loadPlatformsAndInstruments();

                // UX Enhancement: Return to updated details view
                setTimeout(() => {
                    const updatedInstrument = this.instruments.find(i => i.id == instrumentId);
                    if (updatedInstrument) {
                        this.showInstrumentDetailsModal(updatedInstrument);
                    }
                }, 500);
            } else {
                throw new Error(response.error || 'Failed to update instrument');
            }

        } catch (error) {
            console.error('Error saving instrument edit:', error);
            showNotification(`Failed to update instrument: ${error.message}`, 'error');

            // Restore button state
            const submitBtn = document.getElementById('save-instrument-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }
        }
    }

    editPlatform(platformId) {
        // Station users can edit their own platforms, admin can edit all
        if (this.currentUser?.role !== 'admin' && this.currentUser?.role !== 'station') {
            showNotification('Edit privileges required', 'error');
            return;
        }

        const platform = this.platforms.find(p => p.id === platformId);
        if (platform) {
            this.showEditPlatformModal(platform);
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

    showEditPlatformModal(platform) {
        const modal = document.getElementById('platform-edit-modal');
        const formContainer = document.getElementById('platform-edit-form');

        if (!modal || !formContainer) {
            console.error('Platform edit modal elements not found');
            return;
        }

        // Populate the edit form with platform data
        formContainer.innerHTML = `
            <form id="edit-platform-form" class="modal-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-platform-display-name">Platform Name</label>
                        <input type="text" id="edit-platform-display-name" class="form-input"
                               value="${this.escapeHtml(platform.display_name || '')}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-platform-status">Status</label>
                        <select id="edit-platform-status" class="form-select">
                            <option value="Active" ${platform.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Inactive" ${platform.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="Maintenance" ${platform.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-platform-latitude">Latitude</label>
                        <input type="number" id="edit-platform-latitude" class="form-input"
                               value="${platform.latitude || ''}" step="0.000001" min="-90" max="90">
                    </div>
                    <div class="form-group">
                        <label for="edit-platform-longitude">Longitude</label>
                        <input type="number" id="edit-platform-longitude" class="form-input"
                               value="${platform.longitude || ''}" step="0.000001" min="-180" max="180">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-platform-height">Platform Height (m)</label>
                        <input type="number" id="edit-platform-height" class="form-input"
                               value="${platform.platform_height_m || ''}" step="0.1" min="0">
                    </div>
                    <div class="form-group">
                        <label for="edit-platform-mounting">Mounting Structure</label>
                        <input type="text" id="edit-platform-mounting" class="form-input"
                               value="${this.escapeHtml(platform.mounting_structure || '')}">
                    </div>
                </div>

                <div class="form-group">
                    <label for="edit-platform-deployment">Deployment Date</label>
                    <input type="date" id="edit-platform-deployment" class="form-input"
                           value="${platform.deployment_date || ''}">
                </div>

                <div class="form-group">
                    <label for="edit-platform-description">Description</label>
                    <textarea id="edit-platform-description" class="form-textarea" rows="3">${this.escapeHtml(platform.description || '')}</textarea>
                </div>

                <div class="form-group">
                    <label for="edit-platform-programs">Operation Programs</label>
                    <div id="edit-platform-programs" class="multiselect-container"></div>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closePlatformEditModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        `;

        // Initialize multiselect for operation programs
        const operationProgramOptions = [
            'SITES',
            'ICOS',
            'Polar Portal',
            'Phenocam Network',
            'FLUXNET',
            'eLTER',
            'Research Infrastructure',
            'University Research',
            'Regional Monitoring',
            'International Collaboration'
        ];

        // Parse existing operation programs
        let selectedPrograms = [];
        if (platform.operation_programs) {
            try {
                if (typeof platform.operation_programs === 'string') {
                    selectedPrograms = JSON.parse(platform.operation_programs);
                } else if (Array.isArray(platform.operation_programs)) {
                    selectedPrograms = platform.operation_programs;
                }
            } catch (e) {
                console.warn('Failed to parse operation programs:', e);
                selectedPrograms = [];
            }
        }

        this.platformProgramsMultiselect = new MultiselectComponent('edit-platform-programs', operationProgramOptions, selectedPrograms, 'Select operation programs...');

        // Add form submit handler
        const form = document.getElementById('edit-platform-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.savePlatformEdit(platform.id);
        });

        // Show the modal
        modal.classList.add('show');
    }

    async savePlatformEdit(platformId) {
        try {
            const formData = {
                display_name: document.getElementById('edit-platform-display-name').value.trim(),
                status: document.getElementById('edit-platform-status').value,
                latitude: parseFloat(document.getElementById('edit-platform-latitude').value) || null,
                longitude: parseFloat(document.getElementById('edit-platform-longitude').value) || null,
                platform_height_m: parseFloat(document.getElementById('edit-platform-height').value) || null,
                mounting_structure: document.getElementById('edit-platform-mounting').value.trim() || null,
                deployment_date: document.getElementById('edit-platform-deployment').value || null,
                description: document.getElementById('edit-platform-description').value.trim() || null,
                operation_programs: JSON.stringify(this.platformProgramsMultiselect ? this.platformProgramsMultiselect.getSelectedValues() : [])
            };

            // Validation
            if (!formData.display_name) {
                showNotification('Platform name is required', 'error');
                return;
            }

            // Show loading state
            const submitBtn = document.querySelector('#edit-platform-form button[type="submit"]');
            const originalContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // Make API call
            const response = await window.sitesAPI.updatePlatform(platformId, formData);

            if (response.success) {
                showNotification('Platform updated successfully', 'success');
                closePlatformEditModal();

                // Reload data to show changes
                await this.loadPlatformsAndInstruments();
            } else {
                throw new Error(response.error || 'Failed to update platform');
            }

        } catch (error) {
            console.error('Error saving platform edit:', error);
            showNotification(`Failed to update platform: ${error.message}`, 'error');

            // Restore button state
            const submitBtn = document.querySelector('#edit-platform-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }
        }
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

// DISABLED: This global override was conflicting with inline implementation in station.html
// The inline version (station.html lines 4886+) accepts stationId parameter and generates form HTML
// This module version expects pre-existing form, causing button click failures
// function showCreatePlatformModal() {
//     return window.sitesStationDashboard.showCreatePlatformModal();
// }

function saveNewPlatform() {
    return window.sitesStationDashboard.saveNewPlatform();
}

// Streamlit-style Multiselect Component
class MultiselectComponent {
    constructor(containerId, options, selectedValues = [], placeholder = 'Select options...') {
        this.containerId = containerId;
        this.options = options;
        this.selectedValues = new Set(selectedValues);
        this.placeholder = placeholder;
        this.isOpen = false;

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Multiselect container not found:', this.containerId);
            return;
        }

        this.render(container);
        this.bindEvents();
    }

    render(container) {
        container.innerHTML = `
            <div class="multiselect-selection" id="${this.containerId}-selection">
                ${this.renderSelectedTags()}
                ${this.selectedValues.size === 0 ? `<span class="multiselect-placeholder">${this.placeholder}</span>` : ''}
            </div>
            <div class="multiselect-dropdown" id="${this.containerId}-dropdown">
                ${this.renderOptions()}
            </div>
        `;
    }

    renderSelectedTags() {
        return Array.from(this.selectedValues).map(value => `
            <div class="multiselect-tag">
                <span class="multiselect-tag-text">${this.escapeHtml(value)}</span>
                <button class="multiselect-tag-remove" onclick="this.closest('.multiselect-container').multiselectInstance.removeValue('${this.escapeHtml(value)}')">
                    ×
                </button>
            </div>
        `).join('');
    }

    renderOptions() {
        return this.options.map(option => `
            <div class="multiselect-option ${this.selectedValues.has(option) ? 'selected' : ''}"
                 data-value="${this.escapeHtml(option)}"
                 onclick="this.closest('.multiselect-container').multiselectInstance.toggleOption('${this.escapeHtml(option)}')">
                <div class="multiselect-option-checkbox">
                    ${this.selectedValues.has(option) ? '✓' : ''}
                </div>
                <span class="multiselect-option-text">${this.escapeHtml(option)}</span>
            </div>
        `).join('');
    }

    bindEvents() {
        const container = document.getElementById(this.containerId);
        const selection = document.getElementById(`${this.containerId}-selection`);
        const dropdown = document.getElementById(`${this.containerId}-dropdown`);

        // Store reference to this instance on the container
        container.multiselectInstance = this;

        // Toggle dropdown on selection click
        selection.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Prevent dropdown close when clicking inside dropdown
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
        const selection = document.getElementById(`${this.containerId}-selection`);
        const dropdown = document.getElementById(`${this.containerId}-dropdown`);

        if (this.isOpen) {
            selection.classList.add('open');
            dropdown.classList.add('open');
        } else {
            selection.classList.remove('open');
            dropdown.classList.remove('open');
        }
    }

    closeDropdown() {
        this.isOpen = false;
        const selection = document.getElementById(`${this.containerId}-selection`);
        const dropdown = document.getElementById(`${this.containerId}-dropdown`);

        selection.classList.remove('open');
        dropdown.classList.remove('open');
    }

    toggleOption(value) {
        if (this.selectedValues.has(value)) {
            this.selectedValues.delete(value);
        } else {
            this.selectedValues.add(value);
        }
        this.updateDisplay();
    }

    removeValue(value) {
        this.selectedValues.delete(value);
        this.updateDisplay();
    }

    updateDisplay() {
        const container = document.getElementById(this.containerId);
        this.render(container);
        this.bindEvents();
    }

    getSelectedValues() {
        return Array.from(this.selectedValues);
    }

    setSelectedValues(values) {
        this.selectedValues = new Set(values);
        this.updateDisplay();
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

function refreshOpenModals() {
    // Placeholder for modal refresh functionality
    return Promise.resolve();
}

// Global modal helper functions
function closeInstrumentDetailsModal() {
    const modal = document.getElementById('instrument-details-modal');
    if (modal) {
        modal.remove();
    }
}

function closeInstrumentEditModal() {
    const modal = document.getElementById('instrument-edit-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function closeRoiDetailsModal() {
    const modal = document.getElementById('roi-details-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
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