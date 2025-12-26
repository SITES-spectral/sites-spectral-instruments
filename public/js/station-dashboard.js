/**
 * SITES Spectral Instruments - Station Dashboard Module (V3 API)
 *
 * Station-specific management functionality with V3 API integration.
 * Features platform type filtering, pagination, campaigns, and products panels.
 *
 * @module station-dashboard-v3
 * @version 12.0.10
 * @requires api-v3.js (sitesAPIv3)
 * @requires dashboard/platform-renderer.js (PlatformRenderer)
 * @requires platforms/platform-type-filter.js (PlatformTypeFilter)
 * @requires ui/pagination-controls.js (PaginationControls)
 * @requires core/config-service.js (SitesConfig)
 * @requires core/debug.js (Debug)
 */

(function(global) {
    'use strict';

    // ========================================
    // Debug Logger
    // ========================================

    const logger = global.Debug?.withCategory('StationDashboard') || {
        log: () => {},
        info: () => {},
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    // ========================================
    // Constants
    // ========================================

    /** Default pagination settings */
    const DEFAULT_PAGE_SIZE = 20;

    /** Platform type to ecosystem mapping hint */
    const PLATFORM_TYPE_DEFAULTS = {
        fixed: 'Fixed observation platform',
        uav: 'Uncrewed Aerial Vehicle',
        satellite: 'Satellite-based remote sensing',
        mobile: 'Mobile measurement platform'
    };

    // ========================================
    // Utility Functions
    // ========================================

    /**
     * Escape HTML to prevent XSS
     * Delegates to centralized security module (v12.0.9)
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        // Use global escapeHtml from core/security.js if available
        if (typeof global.SitesSecurity !== 'undefined') {
            return global.SitesSecurity.escapeHtml(text);
        }
        // Fallback for backwards compatibility
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Create safe element with textContent
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string} [textContent] - Text content
     * @returns {HTMLElement}
     */
    function createElement(tag, attributes = {}, textContent = null) {
        const el = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        if (textContent !== null) {
            el.textContent = textContent;
        }
        return el;
    }

    // ========================================
    // Station Dashboard Class (V3)
    // ========================================

    /**
     * SitesStationDashboardV3 Class
     *
     * Main dashboard controller for station view with V3 API integration.
     * Manages platforms, instruments, campaigns, and products for a single station.
     */
    class SitesStationDashboardV3 {
        /**
         * Create a new SitesStationDashboardV3 instance
         */
        constructor() {
            // ---- Authentication & User ----
            /** @type {Object|null} Current authenticated user */
            this.currentUser = null;

            /** @type {boolean} Whether user can edit */
            this.canEdit = false;

            // ---- Station Data ----
            /** @type {Object|null} Current station data */
            this.stationData = null;

            /** @type {string|null} Station acronym from URL */
            this.stationAcronym = null;

            // ---- Platforms & Instruments ----
            /** @type {Array} All platforms for this station */
            this.platforms = [];

            /** @type {Array} All instruments for this station */
            this.instruments = [];

            /** @type {string} Currently selected platform type filter */
            this.currentPlatformType = 'all';

            /** @type {number} Current platform page */
            this.platformPage = 1;

            /** @type {number} Platform page size */
            this.platformPageSize = DEFAULT_PAGE_SIZE;

            // ---- Campaigns ----
            /** @type {Array} Campaigns for this station */
            this.campaigns = [];

            /** @type {number} Current campaign page */
            this.campaignPage = 1;

            // ---- Products ----
            /** @type {Array} Products for this station */
            this.products = [];

            /** @type {number} Current product page */
            this.productPage = 1;

            // ---- UI Components ----
            /** @type {PlatformTypeFilter|null} Platform type filter component */
            this.platformTypeFilter = null;

            /** @type {PaginationControls|null} Platform pagination component */
            this.platformPagination = null;

            /** @type {PaginationControls|null} Campaign pagination component */
            this.campaignPagination = null;

            /** @type {PaginationControls|null} Product pagination component */
            this.productPagination = null;

            // ---- State Flags ----
            /** @type {boolean} Whether platforms are currently loading */
            this.isLoadingPlatforms = false;

            /** @type {number|null} Currently open platform ID */
            this.currentOpenPlatformId = null;

            /** @type {Object|null} Image manifest for instruments */
            this.imageManifest = null;

            // ---- Map ----
            /** @type {Object|null} Leaflet map instance */
            this.stationMap = null;

            // Initialize
            this._init();
        }

        // ========================================
        // Initialization
        // ========================================

        /**
         * Initialize the dashboard
         * @private
         */
        async _init() {
            // Get station acronym from URL
            const urlParams = new URLSearchParams(global.location.search);
            this.stationAcronym = urlParams.get('station');

            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._setupDashboard());
            } else {
                await this._setupDashboard();
            }
        }

        /**
         * Set up the dashboard after DOM is ready
         * @private
         */
        async _setupDashboard() {
            try {
                // Show loading state
                this._showLoadingState();

                // Ensure config service is loaded
                await this._ensureConfigLoaded();

                // Verify authentication
                await this._verifyAccess();

                // Load station data
                if (this.stationAcronym) {
                    // Set up UI components BEFORE loading data so counters update correctly
                    this._setupPlatformTypeFilter();
                    this._setupEventListeners();

                    await this._loadStationData();
                    await this._loadImageManifest();

                    // Show success state
                    this._showSuccessState();

                    // Initialize map after container is visible
                    this._setupMap();

                    // Force map to recalculate size
                    if (global.sitesMap && this.stationMap) {
                        setTimeout(() => {
                            global.sitesMap.invalidateSize('station-map');
                        }, 100);
                    }
                } else {
                    this._redirectToAppropriateLocation();
                }
            } catch (error) {
                logger.error('Dashboard setup error:', error);
                this._showErrorState('Failed to initialize station: ' + error.message);
            }
        }

        /**
         * Ensure configuration service is loaded
         * @private
         */
        async _ensureConfigLoaded() {
            this._updateLoadingMessage('Loading configuration...');

            // Wait for SitesConfig to be available (max 3 seconds)
            const maxWait = 3000;
            const startTime = Date.now();

            while (!global.SitesConfig && (Date.now() - startTime) < maxWait) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (global.SitesConfig) {
                if (!global.SitesConfig.isLoaded()) {
                    try {
                        await global.SitesConfig.init();
                        logger.log('ConfigService initialized successfully');
                    } catch (error) {
                        logger.warn('ConfigService initialization failed, using defaults:', error);
                    }
                } else {
                    logger.log('ConfigService already loaded');
                }
            } else {
                logger.warn('SitesConfig not available, using built-in defaults');
            }

            this._updateLoadingMessage('Loading station data...');
        }

        /**
         * Update loading message
         * @private
         * @param {string} message - Loading message to display
         */
        _updateLoadingMessage(message) {
            const loadingEl = document.getElementById('loading-state');
            if (loadingEl) {
                const pEl = loadingEl.querySelector('p');
                if (pEl) {
                    pEl.textContent = message;
                }
            }
        }

        // ========================================
        // Authentication & Access Control
        // ========================================

        /**
         * Verify user has access to this station
         * @private
         */
        async _verifyAccess() {
            logger.log('Verifying access...');

            // Check V1 API first (backward compatible), then V3
            const api = global.sitesAPI || global.sitesAPIv3;

            if (!api?.isAuthenticated()) {
                logger.warn('User not authenticated, redirecting to home');
                global.location.href = '/';
                return;
            }

            // Get user from V1 API (storage)
            this.currentUser = global.sitesAPI?.getUser() || null;
            logger.log('Current user:', this.currentUser);
            logger.log('Requesting station:', this.stationAcronym);

            // Check station access for station users
            if (this.currentUser?.role === 'station' &&
                this.currentUser.station_acronym !== this.stationAcronym) {
                logger.warn(`Station user can only access their own station`);
                global.location.href = `/station.html?station=${this.currentUser.station_acronym}`;
                return;
            }

            // Set edit permission
            this.canEdit = this.currentUser && (
                this.currentUser.role === 'admin' ||
                this.currentUser.role === 'station'
            );
            logger.log('User edit permission:', this.canEdit);

            this._updateUserDisplay();
        }

        /**
         * Redirect to appropriate location based on user role
         * @private
         */
        _redirectToAppropriateLocation() {
            if (this.currentUser?.role === 'admin') {
                global.location.href = '/dashboard.html';
            } else {
                global.location.href = '/';
            }
        }

        /**
         * Update user display in header
         * @private
         */
        _updateUserDisplay() {
            const userNameEl = document.getElementById('user-name');
            const userRoleEl = document.getElementById('user-role');

            if (userNameEl && this.currentUser) {
                userNameEl.textContent = this.currentUser.username;
            }

            if (userRoleEl && this.currentUser) {
                userRoleEl.textContent = this.currentUser.role.charAt(0).toUpperCase() +
                    this.currentUser.role.slice(1);
            }

            // Expose for backward compatibility
            global.currentUser = this.currentUser;

            this._toggleAdminControls();
        }

        /**
         * Toggle admin-only UI elements
         * @private
         */
        _toggleAdminControls() {
            const isAdmin = this.currentUser?.role === 'admin';
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = isAdmin ? '' : 'none';
            });
        }

        // ========================================
        // Data Loading - V3 API Integration
        // ========================================

        /**
         * Load station data using V3 API
         * @private
         */
        async _loadStationData() {
            try {
                logger.log(`Loading station data for: ${this.stationAcronym}`);

                // Use V3 API if available, fall back to V1
                const api = global.sitesAPIv3 || global.sitesAPI;

                if (global.sitesAPIv3) {
                    // V3 API: Get station with summary
                    const response = await global.sitesAPIv3.getStation(this.stationAcronym);
                    this.stationData = response.data;
                } else {
                    // V1 fallback
                    const response = await global.sitesAPI.getStations();
                    const stations = Array.isArray(response) ? response : (response.stations || []);
                    this.stationData = stations.find(s => s.acronym === this.stationAcronym);
                }

                if (!this.stationData) {
                    throw new Error(`Station '${this.stationAcronym}' not found`);
                }

                logger.log('Loaded station data:', this.stationData);

                // Load platforms and instruments
                await this._loadPlatformsAndInstruments();

                // Load campaigns and products (V3 only)
                if (global.sitesAPIv3) {
                    // Use Promise.allSettled to handle partial failures gracefully
                    const results = await Promise.allSettled([
                        this._loadCampaigns(),
                        this._loadProducts()
                    ]);

                    results.forEach((result, index) => {
                        if (result.status === 'rejected') {
                            const operation = index === 0 ? '_loadCampaigns' : '_loadProducts';
                            logger.error(`${operation} failed:`, result.reason);
                        }
                    });
                }

                // Update display
                await this._updateStationDisplay();

            } catch (error) {
                logger.error('Error loading station data:', error);
                throw new Error(`Failed to load station data: ${error.message}`);
            }
        }

        /**
         * Load platforms and instruments
         * @private
         */
        async _loadPlatformsAndInstruments() {
            if (this.isLoadingPlatforms) {
                logger.log('Platform loading already in progress, skipping...');
                return;
            }
            this.isLoadingPlatforms = true;

            try {
                logger.log(`Loading platforms for station: ${this.stationData.acronym}`);

                // Build filter based on current platform type
                const filters = {
                    station: this.stationData.acronym
                };
                if (this.currentPlatformType !== 'all') {
                    filters.type = this.currentPlatformType;
                }

                // Load platforms using V3 API
                if (global.sitesAPIv3) {
                    const response = await global.sitesAPIv3.getPlatforms(
                        filters,
                        this.platformPage,
                        this.platformPageSize
                    );

                    this.platforms = Array.isArray(response.data) ? response.data : [];

                    // Update pagination if component exists
                    if (this.platformPagination && response.meta) {
                        this.platformPagination.render(response.meta, response.links);
                    }

                    logger.log(`Loaded ${this.platforms.length} platforms (page ${this.platformPage})`);
                } else {
                    // V1 fallback
                    const platformsResponse = await global.sitesAPI.getPlatforms(this.stationData.acronym);
                    this.platforms = Array.isArray(platformsResponse) ?
                        platformsResponse :
                        (platformsResponse.platforms || []);
                }

                // Load instruments
                if (global.sitesAPIv3) {
                    const instResponse = await global.sitesAPIv3.getInstruments(
                        { station: this.stationData.acronym },
                        1,
                        100 // Get more instruments per page
                    );
                    this.instruments = Array.isArray(instResponse.data) ? instResponse.data : [];
                } else {
                    const instrumentsResponse = await global.sitesAPI.getInstruments(this.stationData.acronym);
                    this.instruments = Array.isArray(instrumentsResponse) ?
                        instrumentsResponse :
                        (instrumentsResponse.instruments || []);
                }

                logger.log(`Loaded ${this.instruments.length} instruments`);

                // Render platforms
                this._renderPlatforms();

                // Update map markers
                this._updateMapMarkers();

                // Update counts
                this._updateCounts();

                // Update platform type filter counts
                this._updatePlatformTypeCounts();

            } catch (error) {
                logger.error('Error loading platforms/instruments:', error);
                this._showNotification(`Failed to load platforms: ${error.message}`, 'error');
            } finally {
                this.isLoadingPlatforms = false;
            }
        }

        /**
         * Load campaigns for this station (V3 only)
         * @private
         */
        async _loadCampaigns() {
            if (!global.sitesAPIv3) return;

            try {
                logger.log('Loading campaigns...');

                const response = await global.sitesAPIv3.getStationCampaigns(
                    this.stationData.acronym,
                    { page: this.campaignPage }
                );

                this.campaigns = Array.isArray(response.data) ? response.data : [];

                // Update pagination
                if (this.campaignPagination && response.meta) {
                    this.campaignPagination.render(response.meta, response.links);
                }

                // Render campaigns panel
                this._renderCampaigns();

                logger.log(`Loaded ${this.campaigns.length} campaigns`);

            } catch (error) {
                logger.warn('Failed to load campaigns:', error);
                this.campaigns = [];
            }
        }

        /**
         * Load products for this station (V3 only)
         * @private
         */
        async _loadProducts() {
            if (!global.sitesAPIv3) return;

            try {
                logger.log('Loading products...');

                const response = await global.sitesAPIv3.getStationProducts(
                    this.stationData.acronym,
                    { page: this.productPage }
                );

                this.products = Array.isArray(response.data) ? response.data : [];

                // Update pagination
                if (this.productPagination && response.meta) {
                    this.productPagination.render(response.meta, response.links);
                }

                // Render products panel
                this._renderProducts();

                logger.log(`Loaded ${this.products.length} products`);

            } catch (error) {
                logger.warn('Failed to load products:', error);
                this.products = [];
            }
        }

        /**
         * Load image manifest for instrument thumbnails
         * @private
         */
        async _loadImageManifest() {
            try {
                const response = await fetch('/images/stations/instrument-images-manifest.json');
                if (response.ok) {
                    this.imageManifest = await response.json();
                    logger.log('Image manifest loaded');
                } else {
                    this.imageManifest = null;
                }
            } catch (error) {
                logger.warn('Failed to load image manifest:', error);
                this.imageManifest = null;
            }
        }

        // ========================================
        // UI Component Setup
        // ========================================

        /**
         * Set up platform type filter component
         * @private
         */
        _setupPlatformTypeFilter() {
            // Try new PlatformTypeFilter component first
            const filterContainer = document.getElementById('platform-type-filter');
            if (filterContainer && global.PlatformTypeFilter) {
                // Create PlatformTypeFilter component
                this.platformTypeFilter = new global.PlatformTypeFilter('platform-type-filter', {
                    showAllOption: true,
                    initialType: 'all',
                    showCounts: true,
                    onTypeChange: (type, prevType) => {
                        logger.log(`Platform type changed: ${prevType} -> ${type}`);
                        this.currentPlatformType = type;
                        this.platformPage = 1; // Reset to first page
                        this._loadPlatformsAndInstruments();
                    }
                });
            } else {
                // Fall back to legacy tabs structure
                logger.log('Using legacy platform type tabs');
                this._useLegacyTabs = true;
            }

            // Set up platform pagination
            const paginationContainer = document.getElementById('platform-pagination');
            if (paginationContainer && global.PaginationControls) {
                this.platformPagination = new global.PaginationControls({
                    container: paginationContainer,
                    onPageChange: (page) => {
                        this.platformPage = page;
                        this._loadPlatformsAndInstruments();
                    },
                    onPageSizeChange: (limit) => {
                        this.platformPageSize = limit;
                        this.platformPage = 1;
                        this._loadPlatformsAndInstruments();
                    }
                });
            }

            // Set up campaign pagination
            const campaignPaginationContainer = document.getElementById('campaign-pagination');
            if (campaignPaginationContainer && global.PaginationControls) {
                this.campaignPagination = new global.PaginationControls({
                    container: campaignPaginationContainer,
                    onPageChange: (page) => {
                        this.campaignPage = page;
                        this._loadCampaigns();
                    }
                });
            }

            // Set up product pagination
            const productPaginationContainer = document.getElementById('product-pagination');
            if (productPaginationContainer && global.PaginationControls) {
                this.productPagination = new global.PaginationControls({
                    container: productPaginationContainer,
                    onPageChange: (page) => {
                        this.productPage = page;
                        this._loadProducts();
                    }
                });
            }
        }

        /**
         * Set up event listeners
         * @private
         */
        _setupEventListeners() {
            // Refresh button
            const refreshBtn = document.getElementById('refresh-data');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this._loadPlatformsAndInstruments();
                    if (global.sitesAPIv3) {
                        this._loadCampaigns();
                        this._loadProducts();
                    }
                });
            }

            // Back to dashboard (admin only)
            const backBtn = document.getElementById('back-to-dashboard');
            if (backBtn && this.currentUser?.role === 'admin') {
                backBtn.addEventListener('click', () => {
                    global.location.href = '/dashboard.html';
                });
            }

            // Logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this._logout());
            }
        }

        // ========================================
        // Display Updates
        // ========================================

        /**
         * Update station display elements
         * @private
         */
        async _updateStationDisplay() {
            if (!this.stationData) return;

            // Update page title
            document.title = `${this.stationData.display_name} - SITES Spectral`;

            // Update station header
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

            // Update organization
            const organizationEl = document.getElementById('station-organization');
            if (organizationEl && this.stationData.organization) {
                organizationEl.innerHTML = `<strong>Organization:</strong> ${escapeHtml(this.stationData.organization)}`;
                organizationEl.style.display = 'block';
            }

            // Update coordinates
            const coordinatesEl = document.getElementById('station-coordinates');
            if (coordinatesEl) {
                const coords = this._formatCoordinates();
                if (coords !== 'No coordinates') {
                    coordinatesEl.innerHTML = `<strong>Coordinates:</strong> ${escapeHtml(coords)}`;
                    coordinatesEl.style.display = 'block';
                }
            }

            // Update counts
            this._updateCounts();

            // Expose for backward compatibility
            global.stationData = this.stationData;
        }

        /**
         * Format coordinates for display
         * @private
         * @returns {string} Formatted coordinates
         */
        _formatCoordinates() {
            if (this.stationData?.latitude && this.stationData?.longitude) {
                return `${this.stationData.latitude.toFixed(4)}, ${this.stationData.longitude.toFixed(4)}`;
            }
            return 'No coordinates';
        }

        /**
         * Update count displays
         * @private
         */
        _updateCounts() {
            const platformCountEl = document.getElementById('platforms-count');
            const instrumentCountEl = document.getElementById('instruments-count');
            const coordinatesEl = document.getElementById('coordinates');

            if (platformCountEl) {
                platformCountEl.textContent = this.platforms.length;
            }

            if (instrumentCountEl) {
                instrumentCountEl.textContent = this.instruments.length;
            }

            if (coordinatesEl && this.stationData) {
                const coords = this._formatCoordinates();
                coordinatesEl.textContent = coords !== 'No coordinates' ? coords : '-';
            }

            // Update extended stats
            this._updateExtendedStats();
        }

        /**
         * Update extended statistics
         * @private
         */
        _updateExtendedStats() {
            // Count active instruments
            const activeInstruments = this.instruments.filter(
                i => i.status === 'active' || i.status === 'Active'
            ).length;

            // Count by platform type
            const platformTypes = {};
            this.platforms.forEach(p => {
                const type = p.platform_type || 'fixed';
                platformTypes[type] = (platformTypes[type] || 0) + 1;
            });

            // Count by ecosystem
            const ecosystems = {};
            this.platforms.forEach(p => {
                const eco = p.ecosystem_code || 'unknown';
                ecosystems[eco] = (ecosystems[eco] || 0) + 1;
            });

            // Update active count
            const activeCountEl = document.getElementById('active-instruments-count');
            if (activeCountEl) {
                activeCountEl.textContent = activeInstruments;
            }

            // Update platform type breakdown with badges
            const platformTypesEl = document.getElementById('platform-types-breakdown');
            if (platformTypesEl) {
                const typeConfig = {
                    fixed: { label: 'Fixed', icon: 'fa-tower-observation', color: '#3b82f6' },
                    uav: { label: 'UAV', icon: 'fa-drone', color: '#10b981' },
                    satellite: { label: 'Satellite', icon: 'fa-satellite', color: '#8b5cf6' },
                    mobile: { label: 'Mobile', icon: 'fa-truck', color: '#f59e0b' }
                };

                const badges = Object.entries(platformTypes).map(([type, count]) => {
                    const config = typeConfig[type] || { label: type, icon: 'fa-cube', color: '#6b7280' };
                    return `<span class="summary-badge" style="background: ${config.color}20; color: ${config.color}; border: 1px solid ${config.color}40;">
                        <i class="fas ${config.icon}"></i> ${config.label} <strong>${count}</strong>
                    </span>`;
                }).join('');

                platformTypesEl.innerHTML = badges || '<span class="text-muted">None</span>';
            }

            // Update ecosystem breakdown with badges
            const ecosystemsEl = document.getElementById('ecosystems-breakdown');
            if (ecosystemsEl) {
                const ecoConfig = global.SitesConfig?.getEcosystems?.() || {};

                const badges = Object.entries(ecosystems).map(([eco, count]) => {
                    const config = ecoConfig[eco] || {};
                    const label = config.label || eco;
                    const icon = config.icon || 'fa-globe';
                    const color = config.color || '#6b7280';
                    return `<span class="summary-badge" style="background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
                        <i class="fas ${icon}"></i> ${label} <strong>${count}</strong>
                    </span>`;
                }).join('');

                ecosystemsEl.innerHTML = badges || '<span class="text-muted">None</span>';
            }
        }

        /**
         * Update platform type filter counts
         * @private
         */
        _updatePlatformTypeCounts() {
            const counts = {
                fixed: 0,
                uav: 0,
                satellite: 0,
                mobile: 0
            };

            this.platforms.forEach(p => {
                const type = (p.platform_type || 'fixed').toLowerCase();
                if (counts[type] !== undefined) {
                    counts[type]++;
                }
            });

            // Update PlatformTypeFilter component if available
            if (this.platformTypeFilter) {
                this.platformTypeFilter.updateCounts(counts);
                return;
            }

            // Update legacy tabs if using that structure
            if (this._useLegacyTabs) {
                const total = counts.fixed + counts.uav + counts.satellite + counts.mobile;

                // Update individual tab counts
                const fixedCount = document.getElementById('tab-count-fixed');
                const uavCount = document.getElementById('tab-count-uav');
                const satelliteCount = document.getElementById('tab-count-satellite');
                const mobileCount = document.getElementById('tab-count-mobile');
                const allCount = document.getElementById('tab-count-all');

                if (fixedCount) fixedCount.textContent = counts.fixed;
                if (uavCount) uavCount.textContent = counts.uav;
                if (satelliteCount) satelliteCount.textContent = counts.satellite;
                if (mobileCount) mobileCount.textContent = counts.mobile;
                if (allCount) allCount.textContent = total;
            }
        }

        // ========================================
        // Platform Rendering
        // ========================================

        /**
         * Render platforms grid
         * @private
         */
        _renderPlatforms() {
            const container = document.getElementById('platforms-grid');
            if (!container) {
                logger.error('platforms-grid container not found');
                return;
            }

            if (this.platforms.length === 0) {
                container.innerHTML = this._createEmptyPlatformsHTML();
                return;
            }

            // Render platform cards
            container.innerHTML = this.platforms.map(p => this._createPlatformCardHTML(p)).join('');

            // Load instrument images asynchronously
            this._loadAllInstrumentImages();
        }

        /**
         * Create empty platforms HTML
         * @private
         * @returns {string} HTML string
         */
        _createEmptyPlatformsHTML() {
            const typeLabel = this.currentPlatformType === 'all'
                ? 'platforms'
                : `${this.currentPlatformType} platforms`;

            const addButton = this.currentUser?.role === 'admin' ? `
                <button onclick="sitesStationDashboard.showCreatePlatformModal()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Create First Platform
                </button>
            ` : '';

            return `
                <div class="empty-state">
                    <i class="fas fa-building fa-3x"></i>
                    <h3>No ${typeLabel} found</h3>
                    <p>This station doesn't have any ${typeLabel} yet.</p>
                    ${addButton}
                </div>
            `;
        }

        /**
         * Create platform card HTML
         * @private
         * @param {Object} platform - Platform data
         * @returns {string} HTML string
         */
        _createPlatformCardHTML(platform) {
            // Use == to allow type coercion (platform_id may be string or number)
            const instruments = this.instruments.filter(inst => inst.platform_id == platform.id);
            const instrumentCount = instruments.length;
            const platformType = (platform.platform_type || 'fixed').toLowerCase();

            // Get type config from YAML
            const typeConfig = global.SitesConfig?.getPlatformType(platformType) || {};
            const typeIcon = typeConfig.icon || 'fa-cube';
            const typeColor = typeConfig.color || '#6b7280';
            const typeGradient = typeConfig.gradient || `linear-gradient(135deg, ${typeColor} 0%, ${typeColor} 100%)`;

            // Get ecosystem config from YAML
            let ecosystemBadgeHTML = '';
            if (platform.ecosystem_code) {
                const ecoConfig = global.SitesConfig?.getEcosystem?.(platform.ecosystem_code) || {};
                const ecoLabel = ecoConfig.label || platform.ecosystem_code;
                const ecoIcon = ecoConfig.icon || 'fa-globe';
                const ecoColor = ecoConfig.color || '#6b7280';
                // Darken color for gradient end
                const ecoColorDark = this._darkenColor(ecoColor, 15);

                ecosystemBadgeHTML = `
                    <span class="ecosystem-badge" style="--eco-color: ${ecoColor}; --eco-color-dark: ${ecoColorDark}; background: linear-gradient(135deg, ${ecoColor} 0%, ${ecoColorDark} 100%);">
                        <i class="fas ${ecoIcon}"></i>
                        ${escapeHtml(ecoLabel)}
                    </span>
                `;
            }

            // Create platform type badge with icon
            const platformTypeBadgeHTML = `
                <span class="platform-type-badge" style="background-color: ${typeColor}20; color: ${typeColor}; border-color: ${typeColor}40;">
                    <i class="fas ${typeIcon}"></i>
                    ${platformType.toUpperCase()}
                </span>
            `;

            // Create instrument type dots
            const instrumentTypeDots = this._createInstrumentTypeDots(instruments);

            const locationDisplay = platform.normalized_name ||
                (platform.latitude && platform.longitude
                    ? `${platform.latitude.toFixed(4)}, ${platform.longitude.toFixed(4)}`
                    : 'No location');

            return `
                <div class="platform-card" data-platform-id="${platform.id}" data-platform-type="${platformType}">
                    <div class="platform-header" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); --primary-color: ${typeColor};">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                            <div class="platform-type-indicator" style="background: ${typeGradient};">
                                <i class="fas ${typeIcon}"></i>
                            </div>
                            <h4 style="margin: 0; flex: 1;">${escapeHtml(platform.display_name)}</h4>
                        </div>
                        <div class="platform-normalized-name">
                            <span>platform:</span>
                            <span>${platform.normalized_name || 'N/A'}</span>
                        </div>
                        <div class="platform-meta">
                            ${platformTypeBadgeHTML}
                            ${ecosystemBadgeHTML}
                        </div>
                    </div>

                    <div class="platform-body">
                        <div class="platform-info">
                            <div class="info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${escapeHtml(locationDisplay)}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-camera"></i>
                                <div class="instrument-count-display">
                                    <span>${instrumentCount} instrument${instrumentCount !== 1 ? 's' : ''}</span>
                                    ${instrumentTypeDots}
                                </div>
                            </div>
                        </div>

                        ${instrumentCount > 0 ? this._createInstrumentTabsHTML(instruments, platform.id) : `
                            <div class="no-instruments">
                                <i class="fas fa-camera"></i>
                                <span>No instruments configured</span>
                            </div>
                        `}
                    </div>

                    <div class="platform-actions">
                        <button class="btn btn-primary btn-sm" onclick="sitesStationDashboard.viewPlatformDetails('${platform.id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>

                        ${this.canEdit ? `
                            <button class="btn btn-success btn-sm" onclick="sitesStationDashboard.showCreateInstrumentModal('${platform.id}')" title="Add New Instrument">
                                <i class="fas fa-plus"></i> <i class="fas fa-camera"></i> Instrument
                            </button>
                        ` : ''}

                        ${this.currentUser?.role === 'admin' ? `
                            <button class="btn btn-secondary btn-sm" onclick="sitesStationDashboard.editPlatform('${platform.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="sitesStationDashboard.deletePlatform('${platform.id}', '${escapeHtml(platform.normalized_name || platform.display_name)}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Create instrument type indicator dots
         * @private
         * @param {Array} instruments - Instruments array
         * @returns {string} HTML string with colored dots
         */
        _createInstrumentTypeDots(instruments) {
            if (!Array.isArray(instruments) || instruments.length === 0) {
                return '';
            }

            // Count instruments by category
            const categoryCounts = {};
            instruments.forEach(inst => {
                if (!inst?.instrument_type) return;

                let category = 'other';
                if (global.SitesConfig) {
                    category = global.SitesConfig.detectInstrumentCategory(inst.instrument_type);
                } else {
                    const type = inst.instrument_type.toLowerCase();
                    if (type.includes('phenocam')) category = 'phenocam';
                    else if (type.includes('multispectral')) category = 'multispectral';
                    else if (type.includes('par')) category = 'par';
                    else if (type.includes('ndvi')) category = 'ndvi';
                    else if (type.includes('pri')) category = 'pri';
                    else if (type.includes('hyperspectral')) category = 'hyperspectral';
                    else if (type.includes('thermal')) category = 'thermal';
                    else if (type.includes('lidar')) category = 'lidar';
                }

                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            // Create dots (max 5 types shown)
            const dots = Object.entries(categoryCounts)
                .slice(0, 5)
                .map(([category, count]) => {
                    const title = `${count} ${category} instrument${count !== 1 ? 's' : ''}`;
                    return `<span class="instrument-type-dot" data-type="${category}" title="${title}"></span>`;
                })
                .join('');

            return dots ? `<div class="instrument-type-dots">${dots}</div>` : '';
        }

        /**
         * Darken a hex color by a percentage
         * Delegates to PlatformRenderer utility (v12.0.9)
         * @private
         * @param {string} color - Hex color (e.g., '#2563eb')
         * @param {number} percent - Percentage to darken (0-100)
         * @returns {string} Darkened hex color
         */
        _darkenColor(color, percent) {
            // Delegate to extracted PlatformRenderer module
            if (global.PlatformRenderer?.darkenColor) {
                return global.PlatformRenderer.darkenColor(color, percent);
            }
            // Fallback for backwards compatibility
            let hex = (color || '#6b7280').replace('#', '');
            let r = parseInt(hex.substring(0, 2), 16);
            let g = parseInt(hex.substring(2, 4), 16);
            let b = parseInt(hex.substring(4, 6), 16);
            r = Math.max(0, Math.floor(r * (1 - percent / 100)));
            g = Math.max(0, Math.floor(g * (1 - percent / 100)));
            b = Math.max(0, Math.floor(b * (1 - percent / 100)));
            const toHex = (n) => n.toString(16).padStart(2, '0');
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }

        /**
         * Group instruments by type category
         * @private
         * @param {Array} instruments - Instruments array
         * @returns {Object} Grouped instruments
         */
        _groupInstrumentsByType(instruments) {
            if (!Array.isArray(instruments)) return {};

            // Get all categories from YAML config, or use defaults
            const categories = {};

            if (global.SitesConfig && global.SitesConfig.isLoaded()) {
                const types = global.SitesConfig.getInstrumentTypes();
                for (const [key, config] of Object.entries(types)) {
                    categories[key] = {
                        label: config.plural || config.label || key,
                        icon: config.icon || 'fa-cube',
                        color: config.color || '#6b7280',
                        instruments: []
                    };
                }
            } else {
                // Fallback to comprehensive defaults
                Object.assign(categories, {
                    phenocam: { label: 'Phenocams', icon: 'fa-camera', color: '#2563eb', instruments: [] },
                    multispectral: { label: 'MS Sensors', icon: 'fa-satellite-dish', color: '#7c3aed', instruments: [] },
                    par: { label: 'PAR Sensors', icon: 'fa-sun', color: '#f59e0b', instruments: [] },
                    ndvi: { label: 'NDVI Sensors', icon: 'fa-leaf', color: '#059669', instruments: [] },
                    pri: { label: 'PRI Sensors', icon: 'fa-microscope', color: '#ec4899', instruments: [] },
                    hyperspectral: { label: 'Hyperspectral', icon: 'fa-rainbow', color: '#6366f1', instruments: [] },
                    thermal: { label: 'Thermal', icon: 'fa-temperature-high', color: '#ef4444', instruments: [] },
                    lidar: { label: 'LiDAR', icon: 'fa-crosshairs', color: '#14b8a6', instruments: [] },
                    other: { label: 'Other', icon: 'fa-cube', color: '#6b7280', instruments: [] }
                });
            }

            // Ensure 'other' category exists
            if (!categories.other) {
                categories.other = { label: 'Other', icon: 'fa-cube', color: '#6b7280', instruments: [] };
            }

            instruments.forEach(inst => {
                if (!inst?.instrument_type) return;

                // Reliable pattern matching for instrument type detection
                // This ensures correct categorization regardless of ConfigService state
                const type = inst.instrument_type.toLowerCase();
                let category = 'other';

                // Primary pattern matching (most reliable)
                if (type.includes('phenocam') || type === 'phe') {
                    category = 'phenocam';
                } else if (type.includes('multispectral') || type.includes('ms sensor')) {
                    category = 'multispectral';
                } else if (type.includes('par sensor') || type.includes('par')) {
                    category = 'par';
                } else if (type.includes('ndvi')) {
                    category = 'ndvi';
                } else if (type.includes('pri sensor') || type.includes('pri')) {
                    category = 'pri';
                } else if (type.includes('hyperspectral')) {
                    category = 'hyperspectral';
                } else if (type.includes('thermal') || type.includes('infrared')) {
                    category = 'thermal';
                } else if (type.includes('lidar') || type.includes('laser')) {
                    category = 'lidar';
                }

                // Secondary: Try ConfigService if still 'other' and config is loaded
                if (category === 'other' && global.SitesConfig && global.SitesConfig.isLoaded()) {
                    const configCategory = global.SitesConfig.detectInstrumentCategory(inst.instrument_type);
                    if (configCategory !== 'other') {
                        category = configCategory;
                    }
                }

                if (categories[category]) {
                    categories[category].instruments.push(inst);
                } else {
                    categories.other.instruments.push(inst);
                }
            });

            // Sort instruments within each category: Active first, then by status
            const statusOrder = {
                'Active': 0,
                'Operational': 1,
                'Maintenance': 2,
                'Pending Installation': 3,
                'Inactive': 4,
                'Decommissioned': 5
            };

            Object.values(categories).forEach(cat => {
                cat.instruments.sort((a, b) => {
                    const orderA = statusOrder[a.status] ?? 10;
                    const orderB = statusOrder[b.status] ?? 10;
                    if (orderA !== orderB) return orderA - orderB;
                    // Secondary sort by name
                    return (a.display_name || '').localeCompare(b.display_name || '');
                });
            });

            // Filter out empty categories
            return Object.fromEntries(
                Object.entries(categories).filter(([_, cat]) => cat.instruments.length > 0)
            );
        }

        /**
         * Create instrument tabs HTML
         * @private
         * @param {Array} instruments - Instruments array
         * @param {number} platformId - Platform ID
         * @returns {string} HTML string
         */
        _createInstrumentTabsHTML(instruments, platformId) {
            if (!Array.isArray(instruments) || instruments.length === 0) {
                return '';
            }

            const grouped = this._groupInstrumentsByType(instruments);
            const categoryKeys = Object.keys(grouped);

            if (categoryKeys.length === 0) {
                return '';
            }

            // Simple list for single category with few instruments
            if (categoryKeys.length === 1 && instruments.length <= 3) {
                return `
                    <div class="instruments-preview">
                        <h5 style="margin: 8px 0 4px 0; font-size: 0.9em; color: #374151;">
                            <i class="fas ${grouped[categoryKeys[0]].icon}"></i>
                            ${grouped[categoryKeys[0]].label} (${instruments.length})
                        </h5>
                        ${instruments.map(inst => this._createInstrumentCardHTML(inst)).join('')}
                    </div>
                `;
            }

            // Tabbed interface
            const tabsHeader = categoryKeys.map((key, index) => {
                const cat = grouped[key];
                const isActive = index === 0 ? 'active' : '';
                const catColor = cat.color || '#6b7280';
                return `
                    <button class="instrument-tab-btn ${isActive}"
                            data-tab="${key}"
                            data-platform="${platformId}"
                            data-color="${catColor}"
                            style="${isActive ? `background: ${catColor}; color: white;` : ''}"
                            onclick="sitesStationDashboard.switchInstrumentTab('${platformId}', '${key}')">
                        <i class="fas ${cat.icon} tab-icon"></i>
                        <span>${cat.label}</span>
                        <span class="tab-count">${cat.instruments.length}</span>
                    </button>
                `;
            }).join('');

            const tabsContent = categoryKeys.map((key, index) => {
                const cat = grouped[key];
                const isActive = index === 0 ? 'active' : '';
                return `
                    <div class="instrument-tab-content ${isActive}"
                         data-tab-content="${key}"
                         data-platform="${platformId}">
                        <div class="instruments-list">
                            ${cat.instruments.map(inst => this._createInstrumentCardHTML(inst)).join('')}
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
         * Create instrument card HTML
         * @private
         * @param {Object} instrument - Instrument data
         * @returns {string} HTML string
         */
        _createInstrumentCardHTML(instrument) {
            const imageUrl = this._getInstrumentImageUrl(instrument);
            const statusConfig = global.SitesConfig?.getStatus(instrument.status) || {};
            const statusIcon = statusConfig.icon || 'fa-question-circle';
            const statusColor = statusConfig.color || '#6b7280';

            // Get instrument type icon and color for fallback
            const typeIcon = this._getInstrumentTypeIcon(instrument.instrument_type);
            const typeColor = this._getInstrumentTypeColor(instrument.instrument_type);

            const thumbnailHTML = imageUrl ? `
                <div style="width: 40px; height: 40px; border-radius: 4px; overflow: hidden; flex-shrink: 0; background: #f3f4f6;">
                    <img src="${imageUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy"
                         data-fallback="true" data-type-icon="${typeIcon}" data-type-color="${typeColor}">
                </div>
            ` : `
                <div class="instrument-type-placeholder" style="width: 40px; height: 40px; border-radius: 4px; background: linear-gradient(135deg, ${typeColor}15 0%, ${typeColor}25 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid ${typeColor}40;">
                    <i class="fas ${typeIcon}" style="font-size: 18px; color: ${typeColor};"></i>
                </div>
            `;

            return `
                <div class="instrument-card-compact" style="margin: 4px 0; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${thumbnailHTML}
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 0.85em; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${escapeHtml(instrument.display_name || instrument.name || 'Unnamed')}
                            </div>
                            <div style="font-size: 0.75em; color: #6b7280;">
                                <span style="font-weight: 500;">instrument:</span>
                                <span style="font-family: 'Courier New', monospace;">${instrument.normalized_name || 'No ID'}</span>
                            </div>
                            ${instrument.legacy_acronym ? `
                                <div style="font-size: 0.7em; color: #6b7280; margin-top: 2px;">
                                    <span style="font-weight: 500;">legacy:</span>
                                    <span style="font-family: 'Courier New', monospace;">${instrument.legacy_acronym}</span>
                                </div>
                            ` : ''}
                            ${instrument.status ? `
                                <div style="font-size: 0.7em; margin-top: 2px;">
                                    <i class="fas ${statusIcon}" style="color: ${statusColor};"></i> ${instrument.status}
                                </div>
                            ` : ''}
                        </div>
                        <div style="flex-shrink: 0;">
                            <button onclick="event.stopPropagation(); sitesStationDashboard.viewInstrumentDetails('${instrument.id}')" class="btn btn-primary btn-sm" style="padding: 6px 8px; font-size: 0.75em;">
                                <i class="fas fa-eye" style="font-size: 10px;"></i>
                                <span>Details</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Get instrument image URL
         * @private
         * @param {Object} instrument - Instrument data
         * @returns {string|null} Image URL or null
         */
        _getInstrumentImageUrl(instrument) {
            if (!instrument?.normalized_name) return null;

            // Check manifest
            if (this.imageManifest?.instruments) {
                const entry = this.imageManifest.instruments.find(
                    img => img.instrumentId === instrument.normalized_name && img.success === true
                );
                if (!entry) return null;
            }

            return `/assets/instruments/${instrument.normalized_name}.jpg`;
        }

        /**
         * Get instrument type icon based on type
         * Delegates to PlatformRenderer utility (v12.0.9)
         * @private
         * @param {string} instrumentType - Instrument type
         * @returns {string} Font Awesome icon class
         */
        _getInstrumentTypeIcon(instrumentType) {
            // Delegate to extracted PlatformRenderer module
            if (global.PlatformRenderer?.getInstrumentTypeIcon) {
                return global.PlatformRenderer.getInstrumentTypeIcon(instrumentType);
            }
            // Fallback
            if (!instrumentType) return 'fa-cube';
            const type = instrumentType.toLowerCase();
            if (type.includes('phenocam')) return 'fa-camera';
            if (type.includes('multispectral')) return 'fa-satellite-dish';
            if (type.includes('par')) return 'fa-sun';
            if (type.includes('ndvi')) return 'fa-leaf';
            if (type.includes('pri')) return 'fa-microscope';
            if (type.includes('hyperspectral')) return 'fa-rainbow';
            if (type.includes('thermal')) return 'fa-temperature-high';
            if (type.includes('lidar')) return 'fa-crosshairs';
            return 'fa-cube';
        }

        /**
         * Get instrument type color based on type
         * Delegates to PlatformRenderer utility (v12.0.9)
         * @private
         * @param {string} instrumentType - Instrument type
         * @returns {string} Hex color code
         */
        _getInstrumentTypeColor(instrumentType) {
            // Delegate to extracted PlatformRenderer module
            if (global.PlatformRenderer?.getInstrumentTypeColor) {
                return global.PlatformRenderer.getInstrumentTypeColor(instrumentType);
            }
            // Fallback
            if (!instrumentType) return '#6b7280';
            const type = instrumentType.toLowerCase();
            if (type.includes('phenocam')) return '#2563eb';
            if (type.includes('multispectral')) return '#7c3aed';
            if (type.includes('par')) return '#f59e0b';
            if (type.includes('ndvi')) return '#059669';
            if (type.includes('pri')) return '#ec4899';
            if (type.includes('hyperspectral')) return '#6366f1';
            if (type.includes('thermal')) return '#ef4444';
            if (type.includes('lidar')) return '#14b8a6';
            return '#6b7280';
        }

        /**
         * Load all instrument images asynchronously
         * @private
         */
        async _loadAllInstrumentImages() {
            for (const instrument of this.instruments) {
                if (typeof global.loadInstrumentImage === 'function') {
                    await global.loadInstrumentImage(instrument.id);
                }
            }
        }

        /**
         * Switch instrument tab
         * @param {number} platformId - Platform ID
         * @param {string} tabKey - Tab key
         */
        switchInstrumentTab(platformId, tabKey) {
            try {
                const platformCard = document.querySelector(`.platform-card[data-platform-id="${platformId}"]`);
                if (!platformCard) return;

                // Update tab buttons with color styling
                platformCard.querySelectorAll(`.instrument-tab-btn[data-platform="${platformId}"]`).forEach(btn => {
                    const isActive = btn.dataset.tab === tabKey;
                    btn.classList.toggle('active', isActive);

                    // Apply or remove color styling
                    if (isActive) {
                        const color = btn.dataset.color || '#6b7280';
                        btn.style.background = color;
                        btn.style.color = 'white';
                    } else {
                        btn.style.background = '';
                        btn.style.color = '';
                    }
                });

                // Update tab content
                platformCard.querySelectorAll(`.instrument-tab-content[data-platform="${platformId}"]`).forEach(content => {
                    content.classList.toggle('active', content.dataset.tabContent === tabKey);
                });
            } catch (error) {
                logger.error('Error switching instrument tab:', error);
            }
        }

        // ========================================
        // Campaign Rendering
        // ========================================

        /**
         * Render campaigns panel
         * @private
         */
        _renderCampaigns() {
            const container = document.getElementById('campaigns-list');
            if (!container) return;

            if (this.campaigns.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-small">
                        <i class="fas fa-calendar-alt"></i>
                        <p>No campaigns for this station</p>
                        ${this.canEdit ? `
                            <button class="btn btn-primary btn-sm" onclick="sitesStationDashboard.showCreateCampaignModal()">
                                <i class="fas fa-plus"></i> Create Campaign
                            </button>
                        ` : ''}
                    </div>
                `;
                return;
            }

            container.innerHTML = this.campaigns.map(c => this._createCampaignCardHTML(c)).join('');
        }

        /**
         * Create campaign card HTML
         * @private
         * @param {Object} campaign - Campaign data
         * @returns {string} HTML string
         */
        _createCampaignCardHTML(campaign) {
            const startDate = campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A';
            const endDate = campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing';
            const statusClass = (campaign.status || 'pending').toLowerCase();

            return `
                <div class="campaign-card" data-campaign-id="${campaign.id}">
                    <div class="campaign-header">
                        <h5>${escapeHtml(campaign.name)}</h5>
                        <span class="campaign-status status-${statusClass}">${campaign.status || 'Pending'}</span>
                    </div>
                    <div class="campaign-dates">
                        <span><i class="fas fa-calendar-day"></i> ${startDate}</span>
                        <span><i class="fas fa-arrow-right"></i></span>
                        <span>${endDate}</span>
                    </div>
                    ${campaign.description ? `<p class="campaign-description">${escapeHtml(campaign.description)}</p>` : ''}
                    <div class="campaign-actions">
                        <button class="btn btn-sm" onclick="sitesStationDashboard.viewCampaignDetails('${campaign.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            `;
        }

        // ========================================
        // Product Rendering
        // ========================================

        /**
         * Render products panel
         * @private
         */
        _renderProducts() {
            const container = document.getElementById('products-list');
            if (!container) return;

            if (this.products.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-small">
                        <i class="fas fa-box"></i>
                        <p>No products for this station</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.products.map(p => this._createProductCardHTML(p)).join('');
        }

        /**
         * Create product card HTML
         * @private
         * @param {Object} product - Product data
         * @returns {string} HTML string
         */
        _createProductCardHTML(product) {
            const levelBadge = product.level ? `<span class="product-level">${product.level}</span>` : '';
            const date = product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A';

            return `
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-header">
                        ${levelBadge}
                        <h5>${escapeHtml(product.name || product.type || 'Product')}</h5>
                    </div>
                    <div class="product-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        ${product.instrument_name ? `<span><i class="fas fa-camera"></i> ${escapeHtml(product.instrument_name)}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-sm" onclick="sitesStationDashboard.viewProductDetails('${product.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${product.download_url ? `
                            <a href="${product.download_url}" class="btn btn-sm btn-success" download>
                                <i class="fas fa-download"></i> Download
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // ========================================
        // Map Management
        // ========================================

        /**
         * Set up the station map
         * @private
         */
        _setupMap() {
            if (!this.stationData || !global.sitesMap) return;

            const mapContainer = document.getElementById('station-map');
            if (!mapContainer) return;

            const lat = this.stationData.latitude || 59.8586;
            const lng = this.stationData.longitude || 17.6389;

            this.stationMap = global.sitesMap.initializeMap('station-map', {
                center: [lat, lng],
                zoom: 12
            });

            // Add station marker
            global.sitesMap.addStation(this.stationMap, lat, lng, this.stationData);

            // Add platform markers
            this._updateMapMarkers();
        }

        /**
         * Update map markers
         * @private
         */
        _updateMapMarkers() {
            if (!this.stationMap || !global.sitesMap) return;

            const stationCoords = {
                lat: this.stationData?.latitude || 59.8586,
                lng: this.stationData?.longitude || 17.6389
            };

            global.sitesMap.addPlatformMarkers(this.stationMap, this.platforms, stationCoords);
        }

        // ========================================
        // Modal & Action Methods (Public API)
        // ========================================

        /**
         * View platform details
         * @param {string|number} platformId - Platform ID
         */
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
                    this._populatePlatformModal(platform);
                    this.currentOpenPlatformId = platformId;
                    document.getElementById('platform-modal')?.classList.add('show');
                } else {
                    this._showNotification('Failed to load platform details', 'error');
                }
            } catch (error) {
                logger.error('Error fetching platform details:', error);
                this._showNotification('Error loading platform details', 'error');
            }
        }

        /**
         * View instrument details
         * @param {string|number} instrumentId - Instrument ID
         */
        viewInstrumentDetails(instrumentId) {
            const instrument = this.instruments.find(i => i.id == instrumentId);
            if (instrument) {
                this._showInstrumentDetailsModal(instrument);
            }
        }

        /**
         * View campaign details
         * @param {string|number} campaignId - Campaign ID
         */
        async viewCampaignDetails(campaignId) {
            if (!global.sitesAPIv3) {
                this._showNotification('V3 API required for campaign details', 'warning');
                return;
            }

            try {
                const response = await global.sitesAPIv3.getCampaign(campaignId);
                if (response.data && typeof CampaignModal !== 'undefined') {
                    CampaignModal.show(response.data, {
                        canEdit: this.canEdit,
                        onSave: () => this.loadCampaigns()
                    });
                } else {
                    logger.error('CampaignModal not loaded or no data');
                    this._showNotification('Campaign modal not available', 'error');
                }
            } catch (error) {
                logger.error('Error fetching campaign details:', error);
                this._showNotification('Error loading campaign details', 'error');
            }
        }

        /**
         * View product details
         * @param {string|number} productId - Product ID
         */
        async viewProductDetails(productId) {
            if (!global.sitesAPIv3) {
                this._showNotification('V3 API required for product details', 'warning');
                return;
            }

            try {
                const response = await global.sitesAPIv3.getProduct(productId);
                if (response.data && typeof ProductModal !== 'undefined') {
                    ProductModal.show(response.data, {
                        canEdit: this.canEdit,
                        onSave: () => this.loadProducts()
                    });
                } else {
                    logger.error('ProductModal not loaded or no data');
                    this._showNotification('Product modal not available', 'error');
                }
            } catch (error) {
                logger.error('Error fetching product details:', error);
                this._showNotification('Error loading product details', 'error');
            }
        }

        /**
         * Show create platform modal
         */
        showCreatePlatformModal() {
            if (!this.canEdit) {
                this._showNotification('Edit privileges required', 'error');
                return;
            }

            // Use global function from station.html
            if (typeof global.openCreatePlatformForm === 'function') {
                global.openCreatePlatformForm(this.stationData?.id);
            } else {
                logger.error('openCreatePlatformForm function not found');
                this._showNotification('Platform creation form not available', 'error');
            }
        }

        /**
         * Show create instrument modal
         * @param {string|number} platformId - Platform ID
         */
        showCreateInstrumentModal(platformId) {
            if (!this.canEdit) {
                this._showNotification('Edit privileges required', 'error');
                return;
            }

            // Use global function from station.html
            if (typeof global.addInstrument === 'function') {
                global.addInstrument(platformId);
            } else {
                logger.error('addInstrument function not found');
                this._showNotification('Instrument creation not available', 'error');
            }
        }

        /**
         * Show create campaign modal
         */
        showCreateCampaignModal() {
            if (!this.canEdit) {
                this._showNotification('Edit privileges required', 'error');
                return;
            }

            if (typeof CampaignModal !== 'undefined') {
                CampaignModal.showCreate({
                    stationId: this.stationData?.id,
                    onSave: () => this.loadCampaigns()
                });
            } else {
                logger.error('CampaignModal not loaded');
                this._showNotification('Campaign modal not available', 'error');
            }
        }

        /**
         * Edit platform
         * @param {string|number} platformId - Platform ID
         */
        editPlatform(platformId) {
            if (!this.canEdit) {
                this._showNotification('Edit privileges required', 'error');
                return;
            }

            // Use == for type coercion
            const platform = this.platforms.find(p => p.id == platformId);
            if (platform) {
                // Use global function from station-dashboard.html
                if (typeof global.openEditPlatformForm === 'function') {
                    global.openEditPlatformForm(platform);
                } else {
                    logger.error('openEditPlatformForm function not found');
                    this._showNotification('Platform edit form not available', 'error');
                }
            }
        }

        /**
         * Edit instrument
         * @param {string|number} instrumentId - Instrument ID
         */
        editInstrument(instrumentId) {
            if (!this.canEdit) {
                this._showNotification('Edit privileges required', 'error');
                return;
            }

            const instrument = this.instruments.find(i => i.id == instrumentId);
            if (instrument) {
                this._transitionToEditMode(instrument);
            }
        }

        /**
         * Delete platform
         * @param {string|number} platformId - Platform ID
         * @param {string} platformName - Platform name for confirmation
         */
        deletePlatform(platformId, platformName) {
            if (this.currentUser?.role !== 'admin') {
                this._showNotification('Admin privileges required', 'error');
                return;
            }

            const message = `Are you sure you want to delete the platform "${platformName}"? This will also delete all associated instruments.`;

            if (typeof global.showConfirmDialog === 'function') {
                global.showConfirmDialog(message, async () => {
                    await this._performPlatformDeletion(platformId, platformName);
                });
            } else if (confirm(message)) {
                this._performPlatformDeletion(platformId, platformName);
            }
        }

        /**
         * Delete instrument
         * @param {string|number} instrumentId - Instrument ID
         * @param {string} instrumentName - Instrument name for confirmation
         */
        deleteInstrument(instrumentId, instrumentName) {
            if (!this.canEdit) {
                this._showNotification('Delete privileges required', 'error');
                return;
            }

            const message = `Are you sure you want to delete the instrument "${instrumentName}"? This action cannot be undone.`;

            if (!confirm(message)) return;

            this._performInstrumentDeletion(instrumentId);
        }

        // ========================================
        // Private Modal Methods
        // ========================================

        /**
         * Populate platform modal with data
         * @private
         * @param {Object} platform - Platform data
         */
        _populatePlatformModal(platform) {
            const detailsContainer = document.getElementById('platform-details');
            if (!detailsContainer) return;

            const canEdit = this.canEdit;
            const modalHeader = document.querySelector('#platform-modal .modal-header-large');

            if (modalHeader) {
                modalHeader.innerHTML = `
                    <h3><i class="fas fa-tower-observation"></i> Platform Details</h3>
                    <div class="modal-header-actions">
                        ${canEdit ? `
                            <button class="modal-edit-btn" onclick="sitesStationDashboard.editPlatform('${platform.id}')" title="Edit Platform">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        ` : ''}
                        <button class="modal-close-large" onclick="closePlatformModal()">&times;</button>
                    </div>
                `;
            }

            detailsContainer.innerHTML = `
                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> General Information</h4>
                    <div class="detail-field">
                        <span class="detail-label">Platform Name</span>
                        <span class="detail-value">${escapeHtml(platform.display_name || 'N/A')}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Normalized ID</span>
                        <span class="detail-value monospace">${platform.normalized_name || 'N/A'}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Platform Type</span>
                        <span class="detail-value">${(platform.platform_type || 'fixed').toUpperCase()}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">${this._getStatusIcon(platform.status)} ${platform.status || 'Unknown'}</span>
                    </div>
                </div>
                <div class="detail-section">
                    <h4><i class="fas fa-map-marker-alt"></i> Location</h4>
                    <div class="detail-field">
                        <span class="detail-label">Latitude</span>
                        <span class="detail-value monospace">${platform.latitude?.toFixed(6) || 'N/A'}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Longitude</span>
                        <span class="detail-value monospace">${platform.longitude?.toFixed(6) || 'N/A'}</span>
                    </div>
                    <div class="detail-field">
                        <span class="detail-label">Height</span>
                        <span class="detail-value">${platform.platform_height_m ? platform.platform_height_m + 'm' : 'N/A'}</span>
                    </div>
                </div>
                ${this._renderInstrumentsSection(platform.id, canEdit)}
            `;
        }

        /**
         * Render instruments section for platform modal
         * @private
         * @param {number} platformId - Platform ID
         * @param {boolean} canEdit - Whether user can edit
         * @returns {string} HTML string
         */
        _renderInstrumentsSection(platformId, canEdit) {
            // Use == to allow type coercion (platform_id may be string or number)
            const platformInstruments = this.instruments.filter(inst => inst.platform_id == platformId);

            return `
                <div class="detail-section" style="grid-column: 1 / -1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4><i class="fas fa-camera"></i> Instruments (${platformInstruments.length})</h4>
                        ${canEdit ? `
                            <button class="btn btn-success btn-sm" onclick="sitesStationDashboard.showCreateInstrumentModal('${platformId}')">
                                <i class="fas fa-plus"></i> Add Instrument
                            </button>
                        ` : ''}
                    </div>
                    ${platformInstruments.length > 0 ? `
                        <div class="instruments-modal-list">
                            ${platformInstruments.map(inst => this._createInstrumentModalRowHTML(inst, canEdit)).join('')}
                        </div>
                    ` : `
                        <div class="empty-state-inline">
                            <i class="fas fa-camera" style="font-size: 2rem; opacity: 0.3;"></i>
                            <span>No instruments configured</span>
                            ${canEdit ? `
                                <button class="btn btn-primary" onclick="sitesStationDashboard.showCreateInstrumentModal('${platformId}')">
                                    <i class="fas fa-plus-circle"></i> Add First Instrument
                                </button>
                            ` : ''}
                        </div>
                    `}
                </div>
            `;
        }

        /**
         * Create instrument modal row HTML
         * @private
         * @param {Object} instrument - Instrument data
         * @param {boolean} canEdit - Whether user can edit
         * @returns {string} HTML string
         */
        _createInstrumentModalRowHTML(instrument, canEdit) {
            const imageUrl = this._getInstrumentImageUrl(instrument);
            const typeIcon = this._getInstrumentTypeIcon(instrument.instrument_type);
            const typeColor = this._getInstrumentTypeColor(instrument.instrument_type);

            return `
                <div class="instrument-modal-row">
                    <div class="instrument-thumbnail">
                        ${imageUrl ? `
                            <img src="${imageUrl}" alt="${escapeHtml(instrument.display_name)}" data-fallback="true"
                                 data-type-icon="${typeIcon}" data-type-color="${typeColor}">
                        ` : `
                            <div class="instrument-placeholder" style="background: linear-gradient(135deg, ${typeColor}15 0%, ${typeColor}25 100%); border: 1px solid ${typeColor}40;">
                                <i class="fas ${typeIcon}" style="color: ${typeColor};"></i>
                            </div>
                        `}
                    </div>
                    <div class="instrument-info">
                        <div class="instrument-name">${escapeHtml(instrument.display_name)}</div>
                        <div class="instrument-meta">
                            <span><i class="fas fa-tag"></i> ${instrument.normalized_name || 'No ID'}</span>
                            <span class="status-badge">${this._getStatusIcon(instrument.status)} ${instrument.status || 'Unknown'}</span>
                        </div>
                    </div>
                    <div class="instrument-actions">
                        <button onclick="sitesStationDashboard.viewInstrumentDetails('${instrument.id}')" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${canEdit ? `
                            <button onclick="sitesStationDashboard.editInstrument('${instrument.id}')" class="btn btn-secondary btn-sm">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="sitesStationDashboard.deleteInstrument('${instrument.id}', '${escapeHtml(instrument.display_name)}')" class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Show instrument details modal
         * @private
         * @param {Object} instrument - Instrument data
         */
        _showInstrumentDetailsModal(instrument) {
            // Close any existing modal
            const existingModal = document.getElementById('instrument-details-modal');
            if (existingModal) existingModal.remove();

            const modal = createElement('div', {
                className: 'instrument-modal show',
                id: 'instrument-details-modal'
            });

            const isPhenocam = instrument.instrument_type === 'Phenocam';
            const typeConfig = global.SitesConfig?.getInstrumentType(
                global.SitesConfig.detectInstrumentCategory(instrument.instrument_type)
            ) || {};

            modal.innerHTML = `
                <div class="modal-content-large">
                    <div class="modal-header-large">
                        <h3><i class="fas ${typeConfig.icon || 'fa-camera'}" style="color: ${typeConfig.color || '#10b981'}"></i> ${escapeHtml(instrument.display_name || 'Instrument Details')}</h3>
                        <button class="modal-close-large" onclick="closeInstrumentDetailsModal()">&times;</button>
                    </div>
                    <div class="modal-body-large">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Display Name:</strong> ${escapeHtml(instrument.display_name || 'N/A')}
                                </div>
                                <div class="detail-item">
                                    <strong>Normalized Name:</strong> <code>${instrument.normalized_name || 'N/A'}</code>
                                </div>
                                <div class="detail-item">
                                    <strong>Type:</strong> ${escapeHtml(instrument.instrument_type || 'N/A')}
                                </div>
                                <div class="detail-item">
                                    <strong>Status:</strong> ${this._getStatusIcon(instrument.status)} ${instrument.status || 'N/A'}
                                </div>
                            </div>
                        </div>

                        ${isPhenocam ? `
                            <div class="detail-section">
                                <h4>Phenocam Image</h4>
                                <div class="phenocam-image-container">
                                    ${this._getPhenocamImageHTML(instrument)}
                                </div>
                            </div>
                        ` : ''}

                        <div class="detail-section">
                            <h4>Location & Orientation</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Coordinates:</strong> ${instrument.latitude && instrument.longitude
                                        ? `${instrument.latitude.toFixed(6)}, ${instrument.longitude.toFixed(6)}`
                                        : 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Height:</strong> ${instrument.instrument_height_m ? `${instrument.instrument_height_m}m` : 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <strong>Viewing Direction:</strong> ${escapeHtml(instrument.viewing_direction || 'N/A')}
                                </div>
                            </div>
                        </div>

                        ${this.canEdit ? `
                            <div class="modal-actions">
                                <button class="btn btn-primary" onclick="sitesStationDashboard.editInstrument('${instrument.id}')">
                                    <i class="fas fa-edit"></i> Edit Instrument
                                </button>
                                <button class="btn btn-danger" onclick="sitesStationDashboard.deleteInstrument('${instrument.id}', '${escapeHtml(instrument.display_name)}')">
                                    <i class="fas fa-trash"></i> Delete Instrument
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        /**
         * Get phenocam image HTML
         * @private
         * @param {Object} instrument - Instrument data
         * @returns {string} HTML string
         */
        _getPhenocamImageHTML(instrument) {
            const imageUrl = this._getInstrumentImageUrl(instrument);

            if (!imageUrl) {
                return `
                    <div class="phenocam-placeholder">
                        <img src="/images/SITES_spectral_LOGO.png" alt="SITES Spectral" style="width: 80px; height: auto; opacity: 0.6;">
                        <p>No phenocam image available</p>
                    </div>
                `;
            }

            return `
                <div class="phenocam-image-wrapper">
                    <img src="${imageUrl}" alt="Phenocam view for ${escapeHtml(instrument.display_name)}" class="phenocam-image" onclick="this.classList.toggle('zoomed')" data-fallback="true">
                    <div class="phenocam-image-info">
                        <small><i class="fas fa-info-circle"></i> Click image to zoom</small>
                    </div>
                </div>
            `;
        }

        /**
         * Transition to edit mode from details modal
         * @private
         * @param {Object} instrument - Instrument data
         */
        _transitionToEditMode(instrument) {
            const detailsModal = document.getElementById('instrument-details-modal');
            if (detailsModal) {
                detailsModal.style.transition = 'opacity 0.2s ease-out';
                detailsModal.style.opacity = '0';
                setTimeout(() => detailsModal.remove(), 200);
            }

            setTimeout(() => {
                this._showEditInstrumentModal(instrument);
            }, 150);
        }

        /**
         * Show edit instrument modal
         * @private
         * @param {Object} instrument - Instrument data
         */
        _showEditInstrumentModal(instrument) {
            // Use global function from station-dashboard.html
            if (typeof global.openEditInstrumentForm === 'function') {
                global.openEditInstrumentForm(instrument);
            } else {
                logger.error('openEditInstrumentForm function not found');
                this._showNotification('Instrument edit form not available', 'error');
            }
        }

        /**
         * Show edit platform modal
         * @private
         * @param {Object} platform - Platform data
         */
        _showEditPlatformModal(platform) {
            const modal = document.getElementById('platform-edit-modal');
            const formContainer = document.getElementById('platform-edit-form');

            if (!modal || !formContainer) {
                logger.error('Platform edit modal elements not found');
                return;
            }

            // Similar to edit instrument - implementation delegated to station.html
            formContainer.innerHTML = `
                <form id="edit-platform-form" class="modal-form">
                    <p>Edit form for ${escapeHtml(platform.display_name)}</p>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closePlatformEditModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            `;

            modal.classList.add('show');
        }

        // ========================================
        // Deletion Operations
        // ========================================

        /**
         * Perform platform deletion
         * @private
         * @param {string|number} platformId - Platform ID
         * @param {string} platformName - Platform name
         */
        async _performPlatformDeletion(platformId, platformName) {
            try {
                this._showNotification(`Deleting platform "${platformName}"...`, 'info');

                await global.sitesAPI.deletePlatform(platformId);

                this._showNotification(`Platform "${platformName}" deleted successfully`, 'success');

                await this._loadPlatformsAndInstruments();
            } catch (error) {
                logger.error('Error deleting platform:', error);
                this._showNotification(`Failed to delete platform: ${error.message}`, 'error');
            }
        }

        /**
         * Perform instrument deletion
         * @private
         * @param {string|number} instrumentId - Instrument ID
         */
        async _performInstrumentDeletion(instrumentId) {
            try {
                const response = await global.sitesAPI.deleteInstrument(instrumentId);

                if (response.success) {
                    this._showNotification('Instrument deleted successfully', 'success');

                    // Close modal
                    const modal = document.getElementById('instrument-details-modal');
                    if (modal) modal.remove();

                    await this._loadPlatformsAndInstruments();
                } else {
                    throw new Error(response.error || 'Failed to delete instrument');
                }
            } catch (error) {
                logger.error('Error deleting instrument:', error);
                this._showNotification(`Failed to delete instrument: ${error.message}`, 'error');
            }
        }

        // ========================================
        // Utility Methods
        // ========================================

        /**
         * Get status icon HTML
         * @private
         * @param {string} status - Status value
         * @returns {string} HTML string
         */
        _getStatusIcon(status) {
            const config = global.SitesConfig?.getStatus(status);

            if (config) {
                return `<i class="fas ${config.icon}" style="color: ${config.color};"></i>`;
            }

            // Fallback icons
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
         * Show notification
         * @private
         * @param {string} message - Notification message
         * @param {string} type - Notification type (info, success, warning, error)
         */
        _showNotification(message, type = 'info') {
            if (typeof global.showNotification === 'function') {
                global.showNotification(message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }

        // ========================================
        // Page State Management
        // ========================================

        /**
         * Show loading state
         * @private
         */
        _showLoadingState() {
            const loadingEl = document.getElementById('loading-state');
            const errorEl = document.getElementById('error-state');
            const welcomeEl = document.getElementById('welcome-content');
            const dashboardEl = document.getElementById('dashboard-section');

            if (loadingEl) loadingEl.style.display = 'block';
            if (errorEl) errorEl.style.display = 'none';
            if (welcomeEl) welcomeEl.style.display = 'none';
            if (dashboardEl) dashboardEl.style.display = 'none';
        }

        /**
         * Show success state
         * @private
         */
        _showSuccessState() {
            const loadingEl = document.getElementById('loading-state');
            const errorEl = document.getElementById('error-state');
            const welcomeEl = document.getElementById('welcome-content');
            const dashboardEl = document.getElementById('dashboard-section');

            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';
            if (welcomeEl) welcomeEl.style.display = 'block';
            if (dashboardEl) dashboardEl.style.display = 'block';

            // Show admin/station user controls based on role
            this._showUserControls();
        }

        /**
         * Show appropriate user controls based on role
         * @private
         */
        _showUserControls() {
            const adminPlatformControls = document.getElementById('admin-platform-controls');
            const exportBtn = document.getElementById('export-csv-btn');

            // Platform controls for admin OR station users
            if (adminPlatformControls) {
                if (this.canEdit && this.stationData?.id) {
                    adminPlatformControls.style.display = 'block';
                    logger.log('Platform controls shown for user with edit permission');
                } else {
                    adminPlatformControls.style.display = 'none';
                    logger.log('Platform controls hidden - canEdit:', this.canEdit, 'stationData.id:', this.stationData?.id);
                }
            }

            // Export button for all authenticated users
            if (exportBtn) {
                exportBtn.style.display = 'flex';
            }
        }

        /**
         * Show error state
         * @private
         * @param {string} message - Error message
         */
        _showErrorState(message) {
            const loadingEl = document.getElementById('loading-state');
            const errorEl = document.getElementById('error-state');
            const welcomeEl = document.getElementById('welcome-content');
            const dashboardEl = document.getElementById('dashboard-section');
            const errorMessageEl = document.getElementById('error-message');

            logger.error('Showing error state:', message);

            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'block';
            if (welcomeEl) welcomeEl.style.display = 'none';
            if (dashboardEl) dashboardEl.style.display = 'none';

            if (errorMessageEl) {
                errorMessageEl.textContent = message;

                // Add retry button
                const existingRetry = errorMessageEl.querySelector('.retry-btn');
                if (!existingRetry) {
                    const retryBtn = createElement('button', {
                        className: 'btn btn-primary retry-btn',
                        style: 'margin-top: 1rem;',
                        onClick: () => this._retryLoadingData()
                    });
                    retryBtn.innerHTML = '<i class="fas fa-redo"></i> Retry';
                    errorMessageEl.appendChild(retryBtn);
                }
            }

            this._showNotification(message, 'error');
        }

        /**
         * Retry loading data after error
         * @private
         */
        async _retryLoadingData() {
            logger.log('Retrying to load station data...');
            try {
                this._showLoadingState();
                await this._loadStationData();
                this._showSuccessState();
            } catch (error) {
                logger.error('Retry failed:', error);
                this._showErrorState(`Retry failed: ${error.message}`);
            }
        }

        /**
         * Logout user
         * @private
         */
        async _logout() {
            try {
                await global.sitesAPI.logout();
            } catch (error) {
                logger.error('Logout error:', error);
                global.sitesAPI?.clearAuth();
                global.location.href = '/';
            }
        }

        // ========================================
        // Public Getters
        // ========================================

        /**
         * Get current platforms
         * @returns {Array}
         */
        getPlatforms() {
            return [...this.platforms];
        }

        /**
         * Get current instruments
         * @returns {Array}
         */
        getInstruments() {
            return [...this.instruments];
        }

        /**
         * Get current campaigns
         * @returns {Array}
         */
        getCampaigns() {
            return [...this.campaigns];
        }

        /**
         * Get current products
         * @returns {Array}
         */
        getProducts() {
            return [...this.products];
        }

        /**
         * Reload all data
         */
        async refresh() {
            await this._loadPlatformsAndInstruments();
            if (global.sitesAPIv3) {
                // Use Promise.allSettled to handle partial failures gracefully
                const results = await Promise.allSettled([
                    this._loadCampaigns(),
                    this._loadProducts()
                ]);

                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        const operation = index === 0 ? '_loadCampaigns' : '_loadProducts';
                        logger.error(`refresh ${operation} failed:`, result.reason);
                    }
                });
            }
        }
    }

    // ========================================
    // Global Exports
    // ========================================

    // Export class
    global.SitesStationDashboardV3 = SitesStationDashboardV3;

    // Create and export instance
    global.sitesStationDashboard = new SitesStationDashboardV3();

    // ========================================
    // Global Convenience Functions
    // ========================================

    /**
     * Reload platforms and instruments
     * @global
     */
    global.loadPlatformsAndInstruments = function() {
        return global.sitesStationDashboard?._loadPlatformsAndInstruments();
    };

    /**
     * Save new platform (legacy support)
     * @global
     */
    global.saveNewPlatform = function() {
        return global.sitesStationDashboard?.saveNewPlatform?.();
    };

    /**
     * Refresh open modals (legacy support)
     * @global
     */
    global.refreshOpenModals = function() {
        return Promise.resolve();
    };

    /**
     * Close instrument details modal
     * @global
     */
    global.closeInstrumentDetailsModal = function() {
        const modal = document.getElementById('instrument-details-modal');
        if (modal) modal.remove();
    };

    /**
     * Close instrument edit modal
     * @global
     */
    global.closeInstrumentEditModal = function() {
        const modal = document.getElementById('instrument-edit-modal');
        if (modal) modal.classList.remove('show');
    };

    /**
     * Close ROI details modal
     * @global
     */
    global.closeRoiDetailsModal = function() {
        const modal = document.getElementById('roi-details-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    };

    /**
     * Logout function
     * @global
     */
    global.logout = function() {
        if (global.sitesStationDashboard) {
            return global.sitesStationDashboard._logout();
        } else {
            global.sitesAPI?.clearAuth();
            global.location.href = '/';
        }
    };

    /**
     * Filter platforms by type (for legacy tab onclick handlers)
     * @global
     * @param {string} type - Platform type (fixed, uav, satellite, mobile, all)
     */
    global.filterPlatformsByType = function(type) {
        if (!global.sitesStationDashboard) {
            logger.warn('Station dashboard not initialized');
            return;
        }

        logger.log(`Filtering platforms by type: ${type}`);

        // Update active tab styling
        const tabs = document.querySelectorAll('.platform-type-tab');
        tabs.forEach(tab => {
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update dashboard state and reload
        const dashboard = global.sitesStationDashboard;
        dashboard.currentPlatformType = type;
        dashboard.platformPage = 1;
        dashboard._loadPlatformsAndInstruments();
    };

    logger.log('SITES Spectral Station Dashboard V3 initialized');

})(typeof window !== 'undefined' ? window : global);
