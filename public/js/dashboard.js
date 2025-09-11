// SITES Spectral - Dashboard JavaScript
// Main dashboard functionality

class Dashboard {
    constructor() {
        this.stations = [];
        this.phenocams = [];
        this.mspectralSensors = [];
        this.stats = {};
        this.init();
    }

    async init() {
        try {
            await this.loadDashboardData();
            this.renderStations();
            this.setupEventListeners();
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            Utils.showToast('Failed to load dashboard data', 'error');
        }
    }

    async loadDashboardData() {
        try {
            // Load stations, instruments, and network stats in parallel
            const [stationsData, phenocamsData, mspectralData, networkStats] = await Promise.all([
                API.getStations(),
                API.getPhenocams(),
                API.getMspectralSensors(),
                API.getNetworkStats()
            ]);

            this.stations = stationsData.stations || stationsData || [];
            this.phenocams = phenocamsData.phenocams || [];
            this.mspectralSensors = mspectralData.mspectral_sensors || [];

            // Calculate instrument counts per station
            this.calculateStationInstrumentCounts();

            this.stats = networkStats || {};
            this.stats.total_instruments = this.phenocams.length + this.mspectralSensors.length;
            this.stats.active_instruments = this.countActiveInstruments();

            // Update hero stats
            this.updateHeroStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            throw error;
        }
    }

    calculateStationInstrumentCounts() {
        // Reset counts for all stations
        this.stations.forEach(station => {
            station.phenocam_count = 0;
            station.sensor_count = 0;
            station.instrument_count = 0;
            station.active_instruments = 0;
        });

        // Count phenocams per station
        this.phenocams.forEach(phenocam => {
            const station = this.stations.find(s => s.id === phenocam.station_id);
            if (station) {
                station.phenocam_count++;
                station.instrument_count++;
                if (phenocam.status === 'Active') {
                    station.active_instruments++;
                }
            }
        });

        // Count multispectral sensors per station
        this.mspectralSensors.forEach(sensor => {
            const station = this.stations.find(s => s.id === sensor.station_id);
            if (station) {
                station.sensor_count++;
                station.instrument_count++;
                if (sensor.status === 'Active') {
                    station.active_instruments++;
                }
            }
        });
    }

    countActiveInstruments() {
        const activePhenocams = this.phenocams.filter(p => p.status === 'Active').length;
        const activeSensors = this.mspectralSensors.filter(s => s.status === 'Active').length;
        return activePhenocams + activeSensors;
    }

    updateHeroStats() {
        const totalStationsEl = document.getElementById('total-stations');
        const totalInstrumentsEl = document.getElementById('total-instruments');
        const activeInstrumentsEl = document.getElementById('active-instruments');

        if (totalStationsEl) {
            totalStationsEl.textContent = this.stats.total_stations || this.stations.length;
        }
        
        if (totalInstrumentsEl) {
            totalInstrumentsEl.textContent = this.stats.total_instruments || 0;
        }
        
        if (activeInstrumentsEl) {
            activeInstrumentsEl.textContent = this.stats.active_instruments || 0;
        }
    }

    renderStations() {
        const stationsGrid = document.getElementById('stations-grid');
        if (!stationsGrid) return;

        if (!this.stations || this.stations.length === 0) {
            stationsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>No stations found</h3>
                    <p>No research stations have been added yet.</p>
                    <button class="btn btn-primary" onclick="window.location.href='/stations.html?action=add'">
                        <i class="fas fa-plus"></i> Add Station
                    </button>
                </div>
            `;
            return;
        }

        stationsGrid.innerHTML = this.stations.map(station => this.createStationCard(station)).join('');
    }

    createStationCard(station) {
        const instrumentCount = station.instrument_count || 0;
        const activeCount = station.active_instruments || 0;
        const phenocamCount = station.phenocam_count || 0;
        const sensorCount = station.sensor_count || 0;

        return `
            <div class="station-card" onclick="window.location.href='/station.html?id=${station.id}'">
                <div class="station-header">
                    <div>
                        <div class="station-name">${Utils.sanitizeHtml(station.display_name || station.name)}</div>
                        <div class="station-acronym">${Utils.sanitizeHtml(station.acronym)}</div>
                    </div>
                    <div class="station-status">
                        <i class="fas fa-circle ${activeCount > 0 ? 'text-success' : 'text-secondary'}"></i>
                    </div>
                </div>
                
                <div class="station-info">
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${this.formatLocation(station)}</span>
                    </div>
                    ${station.region ? `
                        <div class="info-item">
                            <i class="fas fa-globe"></i>
                            <span>${Utils.sanitizeHtml(Utils.capitalize(station.region))}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="station-stats">
                    <div class="stat-item">
                        <div class="number">${instrumentCount}</div>
                        <div class="label">Total Instruments</div>
                    </div>
                    <div class="stat-item">
                        <div class="number">${activeCount}</div>
                        <div class="label">Active</div>
                    </div>
                    <div class="stat-item">
                        <div class="number">${phenocamCount}</div>
                        <div class="label">Phenocams</div>
                    </div>
                    <div class="stat-item">
                        <div class="number">${sensorCount}</div>
                        <div class="label">Sensors</div>
                    </div>
                </div>
            </div>
        `;
    }

    formatLocation(station) {
        if (station.latitude && station.longitude) {
            return `${Utils.formatCoordinate(station.latitude, 'lat')}, ${Utils.formatCoordinate(station.longitude, 'lon')}`;
        }
        return 'Coordinates not set';
    }

    async loadRecentActivity() {
        try {
            const activityData = await API.getRecentActivity(5);
            this.renderRecentActivity(activityData.activities || activityData || []);
        } catch (error) {
            console.error('Error loading recent activity:', error);
            this.renderRecentActivityError();
        }
    }

    renderRecentActivity(activities) {
        const activityFeed = document.getElementById('activity-feed');
        if (!activityFeed) return;

        if (!activities || activities.length === 0) {
            activityFeed.innerHTML = `
                <div class="empty-activity">
                    <i class="fas fa-history"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        activityFeed.innerHTML = activities.map(activity => this.createActivityItem(activity)).join('');
    }

    createActivityItem(activity) {
        const iconClass = this.getActivityIcon(activity.change_type || activity.type);
        const timeAgo = this.getTimeAgo(activity.created_at || activity.date);

        return `
            <div class="activity-item">
                <div class="activity-icon ${activity.change_type || activity.type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${Utils.sanitizeHtml(activity.description || activity.title)}</div>
                    <div class="activity-meta">
                        ${activity.station_name ? `${Utils.sanitizeHtml(activity.station_name)} • ` : ''}
                        ${timeAgo}
                        ${activity.performed_by ? ` • ${Utils.sanitizeHtml(activity.performed_by)}` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            'Installation': 'fa-plus-circle',
            'Removal': 'fa-minus-circle',
            'Maintenance': 'fa-tools',
            'Upgrade': 'fa-arrow-up',
            'Relocation': 'fa-arrows-alt',
            'Status Change': 'fa-exchange-alt',
            'Configuration': 'fa-cog',
            'add': 'fa-plus',
            'edit': 'fa-edit',
            'delete': 'fa-trash'
        };
        return icons[type] || 'fa-info-circle';
    }

    getTimeAgo(dateString) {
        if (!dateString) return '';
        
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return Utils.formatDate(date);
    }

    renderRecentActivityError() {
        const activityFeed = document.getElementById('activity-feed');
        if (!activityFeed) return;

        activityFeed.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to load recent activity</p>
                <button class="btn btn-outline" onclick="dashboard.loadRecentActivity()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenu = document.getElementById('mobile-menu');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenu && navMenu) {
            mobileMenu.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Search functionality (if search input exists)
        const searchInput = document.getElementById('station-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filterStations(e.target.value);
            }, 300));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }
    }

    filterStations(query) {
        if (!query.trim()) {
            this.renderStations();
            return;
        }

        const filtered = this.stations.filter(station => {
            const searchText = `${station.display_name} ${station.acronym} ${station.normalized_name} ${station.region || ''}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        const stationsGrid = document.getElementById('stations-grid');
        if (stationsGrid) {
            if (filtered.length === 0) {
                stationsGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No stations found</h3>
                        <p>No stations match your search criteria.</p>
                        <button class="btn btn-outline" onclick="document.getElementById('station-search').value=''; dashboard.renderStations();">
                            Clear Search
                        </button>
                    </div>
                `;
            } else {
                stationsGrid.innerHTML = filtered.map(station => this.createStationCard(station)).join('');
            }
        }
    }

    async refreshDashboard() {
        try {
            // Show loading state
            const refreshBtn = document.getElementById('refresh-dashboard');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
                refreshBtn.disabled = true;
            }

            await this.loadDashboardData();
            this.renderStations();
            await this.loadRecentActivity();

            Utils.showToast('Dashboard refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            Utils.showToast('Failed to refresh dashboard', 'error');
        } finally {
            const refreshBtn = document.getElementById('refresh-dashboard');
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
    }
}

// Global functions for modal handling
window.showStatusModal = async function() {
    const modal = document.getElementById('status-modal');
    if (!modal) return;

    try {
        const stats = await API.getInstrumentStats();
        renderStatusModal(stats);
        modal.classList.add('show');
    } catch (error) {
        console.error('Error loading status data:', error);
        Utils.showToast('Failed to load status data', 'error');
    }
};

window.closeStatusModal = function() {
    const modal = document.getElementById('status-modal');
    if (modal) {
        modal.classList.remove('show');
    }
};

function renderStatusModal(stats) {
    const statusGrid = document.getElementById('status-grid');
    if (!statusGrid) return;

    const statusItems = [
        { label: 'Active', count: stats.active || 0, class: 'active' },
        { label: 'Inactive', count: stats.inactive || 0, class: 'inactive' },
        { label: 'Maintenance', count: stats.maintenance || 0, class: 'maintenance' },
        { label: 'Removed', count: stats.removed || 0, class: 'removed' }
    ];

    statusGrid.innerHTML = statusItems.map(item => `
        <div class="status-item ${item.class}">
            <div class="count">${item.count}</div>
            <div class="label">${item.label}</div>
        </div>
    `).join('');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('status-modal');
    if (modal && modal.classList.contains('show') && e.target === modal) {
        closeStatusModal();
    }
});

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});