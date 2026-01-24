// SITES Spectral Instruments - Dashboard Module
// Admin dashboard functionality for station management

class SitesDashboard {
    constructor() {
        this.currentUser = null;
        this.stations = [];
        this.selectedStations = new Set();
        this.loadingState = false;
        this.sortConfig = { key: 'display_name', direction: 'asc' };
        this.searchTerm = '';
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupDashboard());
        } else {
            this.setupDashboard();
        }
    }

    async setupDashboard() {
        try {
            // Verify authentication and admin access
            await this.verifyAccess();

            // Setup UI components
            this.setupEventListeners();
            this.setupSearchAndFilter();

            // Load initial data
            await this.loadStations();

        } catch (error) {
            console.error('Dashboard setup error:', error);
            this.showError('Failed to initialize dashboard: ' + error.message);
        }
    }

    async verifyAccess() {
        if (!window.sitesAPI) {
            throw new Error('API module not loaded');
        }

        // Verify authentication with server (async)
        // This sends the httpOnly cookie and validates the session
        const isAuth = await window.sitesAPI.verifyAuth();
        if (!isAuth) {
            window.location.href = '/login.html';
            return;
        }

        // Verify admin access
        if (!window.sitesAPI.isAdmin()) {
            this.redirectBasedOnRole();
            return;
        }

        // Get current user
        this.currentUser = window.sitesAPI.getUser();
        this.updateUserDisplay();
    }

    redirectBasedOnRole() {
        const user = window.sitesAPI.getUser();
        // Valid roles: admin, sites-admin, station-admin, station, readonly

        // Station-admin with assigned station
        if (user?.role === 'station-admin' && user?.station_acronym) {
            window.location.href = `/station-dashboard.html?station=${user.station_acronym}`;
        }
        // Regular station user with assigned station
        else if (user?.role === 'station' && user?.station_acronym) {
            window.location.href = `/station-dashboard.html?station=${user.station_acronym}`;
        }
        // Readonly users can view sites-dashboard
        else if (user?.role === 'readonly') {
            // Stay on sites-dashboard (readonly access allowed)
            return;
        }
        // Invalid/unknown role - redirect to login
        else {
            window.location.href = '/login.html';
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

        // Show admin controls
        const adminControls = document.getElementById('admin-controls');
        if (adminControls) {
            adminControls.style.display = 'flex';
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('station-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterAndRenderStations();
            }, 300));
        }

        // Sort buttons
        this.setupSortListeners();

        // Refresh button
        const refreshBtn = document.getElementById('refresh-stations');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadStations());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    setupSortListeners() {
        const sortButtons = document.querySelectorAll('[data-sort]');
        sortButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const sortKey = e.target.dataset.sort;
                this.updateSort(sortKey);
            });
        });
    }

    setupSearchAndFilter() {
        // Filter by organization
        const orgFilter = document.getElementById('organization-filter');
        if (orgFilter) {
            orgFilter.addEventListener('change', () => this.filterAndRenderStations());
        }

        // Filter by ecosystem
        const ecosystemFilter = document.getElementById('ecosystem-filter');
        if (ecosystemFilter) {
            ecosystemFilter.addEventListener('change', () => this.filterAndRenderStations());
        }
    }

    async loadStations() {
        try {
            this.setLoadingState(true);

            const response = await window.sitesAPI.getStations();
            this.stations = Array.isArray(response) ? response : (response.stations || []);

            this.updateDashboardStats();
            this.filterAndRenderStations();

        } catch (error) {
            console.error('Error loading stations:', error);
            this.showError('Failed to load stations: ' + error.message);
            this.showEmptyState();
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        this.loadingState = loading;
        const loadingEl = document.getElementById('loading-state');
        const contentEl = document.getElementById('stations-grid');

        if (loadingEl) {
            loadingEl.style.display = loading ? 'block' : 'none';
        }

        if (contentEl) {
            contentEl.style.opacity = loading ? '0.5' : '1';
        }
    }

    filterAndRenderStations() {
        let filteredStations = [...this.stations];

        // Apply search filter
        if (this.searchTerm) {
            filteredStations = filteredStations.filter(station =>
                station.display_name?.toLowerCase().includes(this.searchTerm) ||
                station.acronym?.toLowerCase().includes(this.searchTerm) ||
                station.description?.toLowerCase().includes(this.searchTerm)
            );
        }

        // Apply organization filter
        const orgFilter = document.getElementById('organization-filter');
        if (orgFilter && orgFilter.value) {
            filteredStations = filteredStations.filter(station =>
                station.organization === orgFilter.value
            );
        }

        // Apply sorting
        filteredStations.sort((a, b) => this.compareStations(a, b));

        this.renderStations(filteredStations);
        this.updateStationCount(filteredStations.length, this.stations.length);
    }

    compareStations(a, b) {
        const { key, direction } = this.sortConfig;
        let valueA = a[key] || '';
        let valueB = b[key] || '';

        // Handle different data types
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        let result = 0;
        if (valueA < valueB) result = -1;
        if (valueA > valueB) result = 1;

        return direction === 'desc' ? -result : result;
    }

    updateSort(key) {
        if (this.sortConfig.key === key) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.key = key;
            this.sortConfig.direction = 'asc';
        }

        this.filterAndRenderStations();
        this.updateSortIndicators();
    }

    updateSortIndicators() {
        const sortButtons = document.querySelectorAll('[data-sort]');
        sortButtons.forEach(button => {
            const sortKey = button.dataset.sort;
            const icon = button.querySelector('i');

            if (sortKey === this.sortConfig.key) {
                button.classList.add('active');
                if (icon) {
                    icon.className = this.sortConfig.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
                }
            } else {
                button.classList.remove('active');
                if (icon) {
                    icon.className = 'fas fa-sort';
                }
            }
        });
    }

    renderStations(stations) {
        const gridContainer = document.getElementById('stations-grid');
        if (!gridContainer) return;

        if (stations.length === 0) {
            this.showEmptyState();
            return;
        }

        const stationCards = stations.map(station => this.createStationCard(station)).join('');
        gridContainer.innerHTML = stationCards;

        // Hide empty state
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    createStationCard(station) {
        const coordinates = station.latitude && station.longitude
            ? `${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`
            : 'No coordinates';

        const platformCount = station.platform_count || 0;
        const instrumentCount = station.instrument_count || 0;

        return `
            <div class="station-card" data-station-id="${station.id}">
                <div class="station-card-header">
                    <h3 class="station-name">${this.escapeHtml(station.display_name || 'Unnamed Station')}</h3>
                    <div class="station-acronym">${this.escapeHtml(station.acronym || 'N/A')}</div>
                </div>

                <div class="station-card-body">
                    <div class="station-info">
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${coordinates}</span>
                        </div>

                        ${station.organization ? `
                            <div class="info-item">
                                <i class="fas fa-building"></i>
                                <span>${this.escapeHtml(station.organization)}</span>
                            </div>
                        ` : ''}

                        <div class="station-stats">
                            <div class="stat-item">
                                <span class="stat-number">${platformCount}</span>
                                <span class="stat-label">Platforms</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${instrumentCount}</span>
                                <span class="stat-label">Instruments</span>
                            </div>
                        </div>

                        ${station.description ? `
                            <div class="station-description">
                                ${this.escapeHtml(station.description)}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="station-card-actions">
                    <button class="btn btn-primary" onclick="sitesDashboard.viewStation('${station.acronym}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>

                    <button class="btn btn-secondary" onclick="sitesDashboard.editStation('${station.id}', '${this.escapeHtml(station.display_name)}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>

                    <button class="btn btn-danger" onclick="sitesDashboard.showDeleteStationModal('${station.id}', '${this.escapeHtml(station.display_name)}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    showEmptyState() {
        const gridContainer = document.getElementById('stations-grid');
        const emptyState = document.getElementById('empty-state');

        if (gridContainer) {
            gridContainer.innerHTML = '';
        }

        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }

    updateDashboardStats() {
        if (!this.stations || !Array.isArray(this.stations)) {
            return;
        }

        const totalStations = this.stations.length;
        const totalPlatforms = this.stations.reduce((sum, station) => sum + (station.platform_count || 0), 0);
        const totalInstruments = this.stations.reduce((sum, station) => sum + (station.instrument_count || 0), 0);

        // Update dashboard stat counters
        const stationsCountEl = document.getElementById('stations-count');
        const platformsCountEl = document.getElementById('platforms-count');
        const instrumentsCountEl = document.getElementById('instruments-count');

        if (stationsCountEl) {
            stationsCountEl.textContent = totalStations;
        }

        if (platformsCountEl) {
            platformsCountEl.textContent = totalPlatforms;
        }

        if (instrumentsCountEl) {
            instrumentsCountEl.textContent = totalInstruments;
        }
    }

    updateStationCount(filtered, total) {
        const countElement = document.getElementById('station-count');
        if (countElement) {
            if (filtered === total) {
                countElement.textContent = `${total} stations`;
            } else {
                countElement.textContent = `${filtered} of ${total} stations`;
            }
        }
    }

    // Station actions
    viewStation(acronym) {
        if (acronym) {
            window.location.href = `/station-dashboard.html?station=${acronym}`;
        }
    }

    editStation(stationId, stationName) {
        // For now, navigate to the station page - edit modal could be added later
        showNotification(`Edit functionality for "${stationName}" coming soon`, 'info');
    }

    showDeleteStationModal(stationId, stationName) {
        const message = `Are you sure you want to delete the station "${stationName}"? This action cannot be undone and will remove all associated platforms and instruments.`;

        showConfirmDialog(message, async () => {
            await this.deleteStation(stationId, stationName);
        });
    }

    async deleteStation(stationId, stationName) {
        try {
            showNotification(`Deleting station "${stationName}"...`, 'info');

            await window.sitesAPI.deleteStation(stationId);

            showNotification(`Station "${stationName}" deleted successfully`, 'success');

            // Reload stations
            await this.loadStations();

        } catch (error) {
            console.error('Error deleting station:', error);
            showNotification(`Failed to delete station: ${error.message}`, 'error');
        }
    }

    // Station creation
    showCreateStationModal() {
        const modal = document.getElementById('create-station-modal');
        if (modal) {
            showModal('create-station-modal');
            this.resetCreateStationForm();
        }
    }

    resetCreateStationForm() {
        const form = document.getElementById('create-station-form');
        if (form) {
            form.reset();
            // Clear any validation errors
            const errorElements = form.querySelectorAll('.error-message');
            errorElements.forEach(el => el.remove());
        }
    }

    async saveNewStation() {
        const form = document.getElementById('create-station-form');
        if (!form) return;

        const formData = new FormData(form);
        const stationData = {
            display_name: formData.get('display_name'),
            acronym: formData.get('acronym'),
            description: formData.get('description'),
            organization: formData.get('organization'),
            latitude: formData.get('latitude') ? parseFloat(formData.get('latitude')) : null,
            longitude: formData.get('longitude') ? parseFloat(formData.get('longitude')) : null
        };

        try {
            showNotification('Creating station...', 'info');

            await window.sitesAPI.createStation(stationData);

            showNotification('Station created successfully', 'success');
            closeModal('create-station-modal');

            // Reload stations
            await this.loadStations();

        } catch (error) {
            console.error('Error creating station:', error);
            showNotification(`Failed to create station: ${error.message}`, 'error');
        }
    }

    // Utility functions - delegate to central security module
    escapeHtml(text) {
        return window.SitesSecurity?.escapeHtml?.(text) ?? (text ? String(text).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showError(message) {
        showNotification(message, 'error');
    }

    async logout() {
        try {
            await window.sitesAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API call fails
            window.sitesAPI.clearAuth();
            window.location.href = '/login.html';
        }
    }
}

// Global instance
window.sitesDashboard = new SitesDashboard();

// Global loadStations function for inline scripts
function loadStations() {
    return window.sitesDashboard.loadStations();
}