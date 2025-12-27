/**
 * Campaign Manager Component
 * SITES Spectral v12.0.14
 *
 * Complete campaign CRUD operations with pagination, filtering, and modals.
 * Integrates with V3 API and YAML-based configuration.
 *
 * @module campaigns/campaign-manager
 * @version 12.0.14
 * @requires campaigns/campaign-utils.js (CampaignUtils)
 * @requires api-v3.js (window.sitesAPIv3)
 * @requires ui/pagination-controls.js (PaginationControls)
 * @requires core/config-service.js (SitesConfig)
 * @requires core/debug.js (Debug)
 */

(function(global) {
    'use strict';

    // Get debug logger
    const logger = global.Debug?.withCategory('CampaignManager') || {
        log: () => {},
        info: () => {},
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    // =========================================================================
    // CSS STYLES (External)
    // =========================================================================

    /** Path to external CSS file */
    const CAMPAIGN_MANAGER_CSS_PATH = '/css/campaign-manager.css';

    /** Track if styles have been loaded */
    let stylesLoaded = false;

    /**
     * Load campaign manager styles from external CSS file
     * @private
     */
    function loadStyles() {
        if (stylesLoaded) return;

        // Check if already loaded by another instance
        if (document.getElementById('campaign-manager-styles')) {
            stylesLoaded = true;
            return;
        }

        const linkEl = document.createElement('link');
        linkEl.id = 'campaign-manager-styles';
        linkEl.rel = 'stylesheet';
        linkEl.href = CAMPAIGN_MANAGER_CSS_PATH + '?v=12.0.13';
        document.head.appendChild(linkEl);
        stylesLoaded = true;
        logger.info('Campaign manager styles loaded');
    }

    /** @deprecated Use loadStyles() - kept for backwards compatibility */
    const injectStyles = loadStyles;

    // =========================================================================
    // CONFIGURATION HELPERS (Delegated to CampaignUtils)
    // =========================================================================

    /**
     * Get campaign type config - delegates to CampaignUtils
     * @private
     */
    function getCampaignTypeConfig(typeCode) {
        if (global.CampaignUtils) {
            return global.CampaignUtils.getCampaignTypeConfig(typeCode);
        }
        // Inline fallback if CampaignUtils not loaded
        return {
            name: typeCode || 'Unknown',
            icon: 'fa-calendar',
            color: '#6b7280',
            code: 'UNK'
        };
    }

    /**
     * Get campaign status config - delegates to CampaignUtils
     * @private
     */
    function getCampaignStatusConfig(statusCode) {
        if (global.CampaignUtils) {
            return global.CampaignUtils.getCampaignStatusConfig(statusCode);
        }
        // Inline fallback if CampaignUtils not loaded
        return {
            label: statusCode || 'Unknown',
            icon: 'fa-question-circle',
            color: '#6b7280',
            background: '#f3f4f6'
        };
    }

    /**
     * Get all campaign types - delegates to CampaignUtils
     * @private
     */
    function getAllCampaignTypes() {
        if (global.CampaignUtils) {
            return global.CampaignUtils.getAllCampaignTypes();
        }
        // Inline fallback if CampaignUtils not loaded
        return [
            { value: 'flight', label: 'Flight Mission' },
            { value: 'acquisition', label: 'Acquisition' },
            { value: 'survey', label: 'Survey' },
            { value: 'monitoring', label: 'Monitoring' },
            { value: 'calibration', label: 'Calibration' }
        ];
    }

    /**
     * Get all campaign statuses - delegates to CampaignUtils
     * @private
     */
    function getAllCampaignStatuses() {
        if (global.CampaignUtils) {
            return global.CampaignUtils.getAllCampaignStatuses();
        }
        // Inline fallback if CampaignUtils not loaded
        return [
            { value: 'planned', label: 'Planned' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'failed', label: 'Failed' }
        ];
    }

    // =========================================================================
    // CAMPAIGN MANAGER CLASS
    // =========================================================================

    /**
     * Campaign Manager Component
     */
    class CampaignManager {
        /**
         * Create Campaign Manager
         * @param {string} containerId - Container element ID
         * @param {Object} [options={}] - Configuration options
         * @param {Function} [options.onCampaignSelect] - Callback when campaign is selected
         * @param {Function} [options.onCampaignCreate] - Callback when campaign is created
         * @param {Function} [options.onCampaignUpdate] - Callback when campaign is updated
         * @param {Function} [options.onCampaignDelete] - Callback when campaign is deleted
         * @param {string} [options.stationFilter] - Pre-filter by station acronym
         * @param {boolean} [options.showCreateButton=true] - Show create button
         * @param {boolean} [options.canEdit=true] - Allow edit operations
         * @param {boolean} [options.canDelete=true] - Allow delete operations
         */
        constructor(containerId, options = {}) {
            /** @private */
            this.containerId = containerId;
            this.container = document.getElementById(containerId);

            if (!this.container) {
                throw new Error(`CampaignManager: Container element '${containerId}' not found`);
            }

            /** @private - Configuration options */
            this.options = {
                onCampaignSelect: options.onCampaignSelect || (() => {}),
                onCampaignCreate: options.onCampaignCreate || (() => {}),
                onCampaignUpdate: options.onCampaignUpdate || (() => {}),
                onCampaignDelete: options.onCampaignDelete || (() => {}),
                stationFilter: options.stationFilter || null,
                showCreateButton: options.showCreateButton !== false,
                canEdit: options.canEdit !== false,
                canDelete: options.canDelete !== false
            };

            /** @private - Current state */
            this.state = {
                campaigns: [],
                isLoading: false,
                filters: {
                    status: '',
                    type: '',
                    station: this.options.stationFilter || '',
                    startDate: '',
                    endDate: ''
                },
                sortBy: 'planned_start_datetime',
                sortOrder: 'desc',
                currentPage: 1,
                pageSize: 12
            };

            /** @private - Cached stations and platforms */
            this.cache = {
                stations: [],
                platforms: []
            };

            /** @private - Pagination controls */
            this.pagination = null;

            /** @private - Active modal */
            this.activeModal = null;

            // Initialize
            this._init();
        }

        /**
         * Initialize the component
         * @private
         */
        async _init() {
            injectStyles();

            // Build initial UI
            this._render();

            // Load cached data
            await this._loadCacheData();

            // Load campaigns
            await this.loadCampaigns();

            logger.log('CampaignManager initialized');
        }

        /**
         * Load cached station/platform data
         * @private
         */
        async _loadCacheData() {
            try {
                // Load stations
                if (global.sitesAPI) {
                    const stationsResponse = await global.sitesAPI.getStations();
                    this.cache.stations = stationsResponse.stations || stationsResponse || [];
                }
            } catch (error) {
                logger.warn('Failed to load stations for cache:', error);
            }
        }

        /**
         * Render the component
         * @private
         */
        _render() {
            this.container.innerHTML = `
                <div class="campaign-manager">
                    ${this._renderToolbar()}
                    <div id="${this.containerId}-content" class="campaign-content">
                        ${this._renderLoading()}
                    </div>
                    <div id="${this.containerId}-pagination"></div>
                </div>
            `;

            // Initialize pagination
            const paginationContainer = document.getElementById(`${this.containerId}-pagination`);
            if (paginationContainer && global.PaginationControls) {
                this.pagination = new global.PaginationControls({
                    container: paginationContainer,
                    onPageChange: (page) => this._handlePageChange(page),
                    onPageSizeChange: (limit) => this._handlePageSizeChange(limit)
                });
            }

            // Attach event listeners
            this._attachEventListeners();
        }

        /**
         * Render toolbar
         * @private
         */
        _renderToolbar() {
            const statuses = getAllCampaignStatuses();
            const types = getAllCampaignTypes();

            const statusOptions = statuses.map(s =>
                `<option value="${this._escapeHtml(s.value)}">${this._escapeHtml(s.label)}</option>`
            ).join('');

            const typeOptions = types.map(t =>
                `<option value="${this._escapeHtml(t.value)}">${this._escapeHtml(t.label)}</option>`
            ).join('');

            const stationOptions = this.cache.stations.map(s =>
                `<option value="${this._escapeHtml(s.acronym)}">${this._escapeHtml(s.acronym)} - ${this._escapeHtml(s.display_name)}</option>`
            ).join('');

            return `
                <div class="campaign-toolbar">
                    <div class="campaign-toolbar-left">
                        <select class="campaign-filter-select" id="${this.containerId}-filter-status"
                                aria-label="Filter by status">
                            <option value="">All Statuses</option>
                            ${statusOptions}
                        </select>
                        <select class="campaign-filter-select" id="${this.containerId}-filter-type"
                                aria-label="Filter by type">
                            <option value="">All Types</option>
                            ${typeOptions}
                        </select>
                        ${!this.options.stationFilter ? `
                            <select class="campaign-filter-select" id="${this.containerId}-filter-station"
                                    aria-label="Filter by station">
                                <option value="">All Stations</option>
                                ${stationOptions}
                            </select>
                        ` : ''}
                        <input type="date" class="campaign-date-input" id="${this.containerId}-filter-start"
                               aria-label="Start date filter" placeholder="From date">
                        <input type="date" class="campaign-date-input" id="${this.containerId}-filter-end"
                               aria-label="End date filter" placeholder="To date">
                        <select class="campaign-sort-select" id="${this.containerId}-sort"
                                aria-label="Sort campaigns">
                            <option value="planned_start_datetime:desc">Date (Newest)</option>
                            <option value="planned_start_datetime:asc">Date (Oldest)</option>
                            <option value="campaign_name:asc">Name (A-Z)</option>
                            <option value="campaign_name:desc">Name (Z-A)</option>
                            <option value="status:asc">Status</option>
                        </select>
                    </div>
                    <div class="campaign-toolbar-right">
                        ${this.options.showCreateButton ? `
                            <button class="btn-create-campaign" id="${this.containerId}-create-btn"
                                    aria-label="Create new campaign">
                                <i class="fas fa-plus" aria-hidden="true"></i>
                                New Campaign
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        /**
         * Render loading state
         * @private
         */
        _renderLoading() {
            return `
                <div class="campaign-loading">
                    <div class="campaign-loading-spinner" aria-label="Loading campaigns"></div>
                </div>
            `;
        }

        /**
         * Render empty state
         * @private
         */
        _renderEmptyState() {
            return `
                <div class="campaign-empty-state">
                    <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                    <h3>No campaigns found</h3>
                    <p>Create a new campaign to start organizing your data collection activities.</p>
                    ${this.options.showCreateButton ? `
                        <button class="btn-create-campaign" onclick="document.getElementById('${this.containerId}-create-btn')?.click()">
                            <i class="fas fa-plus" aria-hidden="true"></i>
                            Create Campaign
                        </button>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Attach event listeners
         * @private
         */
        _attachEventListeners() {
            // Status filter
            const statusFilter = document.getElementById(`${this.containerId}-filter-status`);
            if (statusFilter) {
                statusFilter.onchange = (e) => {
                    this.state.filters.status = e.target.value;
                    this.state.currentPage = 1;
                    this.loadCampaigns();
                };
            }

            // Type filter
            const typeFilter = document.getElementById(`${this.containerId}-filter-type`);
            if (typeFilter) {
                typeFilter.onchange = (e) => {
                    this.state.filters.type = e.target.value;
                    this.state.currentPage = 1;
                    this.loadCampaigns();
                };
            }

            // Station filter
            const stationFilter = document.getElementById(`${this.containerId}-filter-station`);
            if (stationFilter) {
                stationFilter.onchange = (e) => {
                    this.state.filters.station = e.target.value;
                    this.state.currentPage = 1;
                    this.loadCampaigns();
                };
            }

            // Date filters
            const startDate = document.getElementById(`${this.containerId}-filter-start`);
            if (startDate) {
                startDate.onchange = (e) => {
                    this.state.filters.startDate = e.target.value;
                    this.state.currentPage = 1;
                    this.loadCampaigns();
                };
            }

            const endDate = document.getElementById(`${this.containerId}-filter-end`);
            if (endDate) {
                endDate.onchange = (e) => {
                    this.state.filters.endDate = e.target.value;
                    this.state.currentPage = 1;
                    this.loadCampaigns();
                };
            }

            // Sort
            const sortSelect = document.getElementById(`${this.containerId}-sort`);
            if (sortSelect) {
                sortSelect.onchange = (e) => {
                    const [sortBy, sortOrder] = e.target.value.split(':');
                    this.state.sortBy = sortBy;
                    this.state.sortOrder = sortOrder;
                    this.state.currentPage = 1;
                    this.loadCampaigns();
                };
            }

            // Create button
            const createBtn = document.getElementById(`${this.containerId}-create-btn`);
            if (createBtn) {
                createBtn.onclick = () => this.showCreateModal();
            }
        }

        /**
         * Load campaigns from API
         * @param {Object} [filters] - Optional filter overrides
         * @param {number} [page] - Optional page number
         */
        async loadCampaigns(filters = null, page = null) {
            this.state.isLoading = true;
            const contentEl = document.getElementById(`${this.containerId}-content`);

            if (contentEl) {
                contentEl.innerHTML = this._renderLoading();
            }

            try {
                const api = global.sitesAPIv3;
                if (!api) {
                    throw new Error('V3 API client not available');
                }

                // Build filter parameters
                const filterParams = filters || {};
                if (this.state.filters.status) {
                    filterParams.status = this.state.filters.status;
                }
                if (this.state.filters.type) {
                    filterParams.type = this.state.filters.type;
                }
                if (this.state.filters.station) {
                    filterParams.station = this.state.filters.station;
                }
                if (this.state.filters.startDate) {
                    filterParams.from_date = this.state.filters.startDate;
                }
                if (this.state.filters.endDate) {
                    filterParams.to_date = this.state.filters.endDate;
                }
                filterParams.sort_by = this.state.sortBy;
                filterParams.sort_order = this.state.sortOrder;

                const currentPage = page || this.state.currentPage;
                const response = await api.getCampaigns(filterParams, currentPage, this.state.pageSize);

                this.state.campaigns = response.data || [];
                this.state.currentPage = currentPage;

                // Update pagination
                if (this.pagination && response.meta) {
                    this.pagination.render(response.meta, response.links);
                }

                // Render campaigns
                this.renderCampaignList(this.state.campaigns);

                logger.log(`Loaded ${this.state.campaigns.length} campaigns`);

            } catch (error) {
                logger.error('Failed to load campaigns:', error);
                if (contentEl) {
                    contentEl.innerHTML = `
                        <div class="campaign-empty-state">
                            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                            <h3>Failed to load campaigns</h3>
                            <p>${this._escapeHtml(error.message)}</p>
                            <button class="btn-create-campaign" onclick="window.campaignManagers?.['${this.containerId}']?.loadCampaigns()">
                                <i class="fas fa-redo" aria-hidden="true"></i>
                                Retry
                            </button>
                        </div>
                    `;
                }
            } finally {
                this.state.isLoading = false;
            }
        }

        /**
         * Render campaign list
         * @param {Array} campaigns - Campaigns to render
         */
        renderCampaignList(campaigns) {
            const contentEl = document.getElementById(`${this.containerId}-content`);
            if (!contentEl) return;

            if (!campaigns || campaigns.length === 0) {
                contentEl.innerHTML = this._renderEmptyState();
                return;
            }

            const cardsHtml = campaigns.map(campaign => this.renderCampaignCard(campaign)).join('');
            contentEl.innerHTML = `<div class="campaign-grid">${cardsHtml}</div>`;

            // Attach card event listeners
            this._attachCardEventListeners();
        }

        /**
         * Render a single campaign card
         * @param {Object} campaign - Campaign data
         * @returns {string} Card HTML
         */
        renderCampaignCard(campaign) {
            const typeConfig = getCampaignTypeConfig(campaign.campaign_type);
            const statusConfig = getCampaignStatusConfig(campaign.status);

            const startDate = campaign.planned_start_datetime
                ? this._formatDate(campaign.planned_start_datetime)
                : 'Not set';
            const endDate = campaign.planned_end_datetime
                ? this._formatDate(campaign.planned_end_datetime)
                : '';

            const dateDisplay = endDate ? `${startDate} - ${endDate}` : startDate;

            return `
                <div class="campaign-card" data-campaign-id="${campaign.id}"
                     role="button" tabindex="0"
                     aria-label="${this._escapeHtml(campaign.campaign_name)}">
                    <div class="campaign-card-header">
                        <div class="campaign-type-icon" style="background: ${typeConfig.color};"
                             title="${this._escapeHtml(typeConfig.name)}">
                            <i class="fas ${typeConfig.icon}" aria-hidden="true"></i>
                        </div>
                        <div class="campaign-card-title-section">
                            <h3 class="campaign-card-title" title="${this._escapeHtml(campaign.campaign_name)}">
                                ${this._escapeHtml(campaign.campaign_name)}
                            </h3>
                            <div class="campaign-card-type">${this._escapeHtml(typeConfig.name)}</div>
                        </div>
                        <span class="campaign-status-badge"
                              style="background: ${statusConfig.background}; color: ${statusConfig.color};">
                            <i class="fas ${statusConfig.icon}" aria-hidden="true"></i>
                            ${this._escapeHtml(statusConfig.label)}
                        </span>
                    </div>
                    <div class="campaign-card-body">
                        <div class="campaign-card-dates">
                            <i class="fas fa-calendar" aria-hidden="true"></i>
                            <span>${this._escapeHtml(dateDisplay)}</span>
                        </div>
                        <div class="campaign-card-meta">
                            ${campaign.station_acronym ? `
                                <span class="campaign-meta-tag">
                                    <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                                    ${this._escapeHtml(campaign.station_acronym)}
                                </span>
                            ` : ''}
                            ${campaign.platform_name ? `
                                <span class="campaign-meta-tag">
                                    <i class="fas fa-layer-group" aria-hidden="true"></i>
                                    ${this._escapeHtml(campaign.platform_name)}
                                </span>
                            ` : ''}
                            ${campaign.aoi_name ? `
                                <span class="campaign-meta-tag">
                                    <i class="fas fa-vector-square" aria-hidden="true"></i>
                                    ${this._escapeHtml(campaign.aoi_name)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="campaign-card-footer">
                        <span class="campaign-product-count">
                            <i class="fas fa-cube" aria-hidden="true"></i>
                            ${campaign.product_count || 0} product${(campaign.product_count || 0) !== 1 ? 's' : ''}
                        </span>
                        <div class="campaign-card-actions">
                            ${this.options.canEdit ? `
                                <button class="campaign-action-btn" data-action="edit" data-id="${campaign.id}"
                                        aria-label="Edit campaign" title="Edit">
                                    <i class="fas fa-edit" aria-hidden="true"></i>
                                </button>
                            ` : ''}
                            ${this.options.canDelete ? `
                                <button class="campaign-action-btn danger" data-action="delete" data-id="${campaign.id}"
                                        aria-label="Delete campaign" title="Delete">
                                    <i class="fas fa-trash" aria-hidden="true"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Attach event listeners to campaign cards
         * @private
         */
        _attachCardEventListeners() {
            const cards = this.container.querySelectorAll('.campaign-card');

            cards.forEach(card => {
                const campaignId = card.dataset.campaignId;

                // Card click for selection
                card.onclick = (e) => {
                    // Ignore if clicking action buttons
                    if (e.target.closest('.campaign-action-btn')) return;

                    const campaign = this.state.campaigns.find(c => String(c.id) === String(campaignId));
                    if (campaign) {
                        this.options.onCampaignSelect(campaign);
                    }
                };

                // Keyboard navigation
                card.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        card.click();
                    }
                };

                // Action buttons
                const editBtn = card.querySelector('[data-action="edit"]');
                if (editBtn) {
                    editBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.showEditModal(campaignId);
                    };
                }

                const deleteBtn = card.querySelector('[data-action="delete"]');
                if (deleteBtn) {
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        this._confirmDelete(campaignId);
                    };
                }
            });
        }

        /**
         * Handle page change
         * @private
         */
        _handlePageChange(page) {
            this.state.currentPage = page;
            this.loadCampaigns(null, page);
        }

        /**
         * Handle page size change
         * @private
         */
        _handlePageSizeChange(limit) {
            this.state.pageSize = limit;
            this.state.currentPage = 1;
            this.loadCampaigns();
        }

        /**
         * Show create campaign modal
         */
        showCreateModal() {
            this._showModal('Create Campaign', null);
        }

        /**
         * Show edit campaign modal
         * @param {number|string} campaignId - Campaign ID to edit
         */
        async showEditModal(campaignId) {
            try {
                const api = global.sitesAPIv3;
                if (!api) {
                    throw new Error('V3 API client not available');
                }

                const response = await api.getCampaign(campaignId);
                const campaign = response.data || response;

                this._showModal('Edit Campaign', campaign);
            } catch (error) {
                logger.error('Failed to load campaign for editing:', error);
                this._showToast('Failed to load campaign details', 'error');
            }
        }

        /**
         * Show modal for create/edit
         * @private
         */
        _showModal(title, campaign = null) {
            const isEdit = !!campaign;
            const types = getAllCampaignTypes();
            const statuses = getAllCampaignStatuses();

            const typeOptions = types.map(t =>
                `<option value="${this._escapeHtml(t.value)}" ${campaign?.campaign_type === t.value ? 'selected' : ''}>
                    ${this._escapeHtml(t.label)}
                </option>`
            ).join('');

            const statusOptions = statuses.map(s =>
                `<option value="${this._escapeHtml(s.value)}" ${campaign?.status === s.value ? 'selected' : ''}>
                    ${this._escapeHtml(s.label)}
                </option>`
            ).join('');

            const stationOptions = this.cache.stations.map(s =>
                `<option value="${s.id}" ${campaign?.station_id == s.id ? 'selected' : ''}>
                    ${this._escapeHtml(s.acronym)} - ${this._escapeHtml(s.display_name)}
                </option>`
            ).join('');

            const modalHtml = `
                <div class="campaign-modal-overlay" id="campaign-modal-overlay">
                    <div class="campaign-modal" role="dialog" aria-labelledby="campaign-modal-title">
                        <div class="campaign-modal-header">
                            <h2 class="campaign-modal-title" id="campaign-modal-title">${this._escapeHtml(title)}</h2>
                            <button class="campaign-modal-close" id="campaign-modal-close" aria-label="Close modal">
                                <i class="fas fa-times" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div class="campaign-modal-body">
                            <form id="campaign-form">
                                ${isEdit ? `<input type="hidden" name="id" value="${campaign.id}">` : ''}

                                <div class="campaign-form-group">
                                    <label class="campaign-form-label" for="campaign-name">
                                        Campaign Name <span class="required">*</span>
                                    </label>
                                    <input type="text" class="campaign-form-input" id="campaign-name" name="campaign_name"
                                           required minlength="3" maxlength="100"
                                           value="${this._escapeHtml(campaign?.campaign_name || '')}"
                                           placeholder="Enter campaign name">
                                </div>

                                <div class="campaign-form-row">
                                    <div class="campaign-form-group">
                                        <label class="campaign-form-label" for="campaign-type">
                                            Campaign Type <span class="required">*</span>
                                        </label>
                                        <select class="campaign-form-select" id="campaign-type" name="campaign_type" required>
                                            ${typeOptions}
                                        </select>
                                    </div>
                                    <div class="campaign-form-group">
                                        <label class="campaign-form-label" for="campaign-status">Status</label>
                                        <select class="campaign-form-select" id="campaign-status" name="status">
                                            ${statusOptions}
                                        </select>
                                    </div>
                                </div>

                                <div class="campaign-form-group">
                                    <label class="campaign-form-label" for="campaign-station">
                                        Station <span class="required">*</span>
                                    </label>
                                    <select class="campaign-form-select" id="campaign-station" name="station_id" required>
                                        <option value="">Select station...</option>
                                        ${stationOptions}
                                    </select>
                                </div>

                                <div class="campaign-form-group">
                                    <label class="campaign-form-label" for="campaign-platform">Platform</label>
                                    <select class="campaign-form-select" id="campaign-platform" name="platform_id">
                                        <option value="">Select platform...</option>
                                        ${campaign?.platform_id ? `<option value="${campaign.platform_id}" selected>${this._escapeHtml(campaign.platform_name || 'Platform ' + campaign.platform_id)}</option>` : ''}
                                    </select>
                                    <span class="campaign-form-hint">Select station first to load platforms</span>
                                </div>

                                <div class="campaign-form-row">
                                    <div class="campaign-form-group">
                                        <label class="campaign-form-label" for="campaign-start-date">
                                            Planned Start Date
                                        </label>
                                        <input type="datetime-local" class="campaign-form-input" id="campaign-start-date"
                                               name="planned_start_datetime"
                                               value="${campaign?.planned_start_datetime ? this._formatDateTimeLocal(campaign.planned_start_datetime) : ''}">
                                    </div>
                                    <div class="campaign-form-group">
                                        <label class="campaign-form-label" for="campaign-end-date">
                                            Planned End Date
                                        </label>
                                        <input type="datetime-local" class="campaign-form-input" id="campaign-end-date"
                                               name="planned_end_datetime"
                                               value="${campaign?.planned_end_datetime ? this._formatDateTimeLocal(campaign.planned_end_datetime) : ''}">
                                    </div>
                                </div>

                                <div class="campaign-form-group">
                                    <label class="campaign-form-label" for="campaign-description">Description</label>
                                    <textarea class="campaign-form-textarea" id="campaign-description" name="description"
                                              placeholder="Describe the campaign objectives and activities..."
                                              maxlength="1000">${this._escapeHtml(campaign?.description || '')}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="campaign-modal-footer">
                            <button class="campaign-modal-btn secondary" id="campaign-modal-cancel">Cancel</button>
                            <button class="campaign-modal-btn primary" id="campaign-modal-save">
                                ${isEdit ? 'Update' : 'Create'} Campaign
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            this._closeModal();

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            this.activeModal = document.getElementById('campaign-modal-overlay');

            // Attach modal event listeners
            this._attachModalEventListeners(isEdit ? campaign.id : null);

            // Focus first input
            const firstInput = document.getElementById('campaign-name');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }

        /**
         * Attach modal event listeners
         * @private
         */
        _attachModalEventListeners(campaignId = null) {
            const overlay = document.getElementById('campaign-modal-overlay');
            const closeBtn = document.getElementById('campaign-modal-close');
            const cancelBtn = document.getElementById('campaign-modal-cancel');
            const saveBtn = document.getElementById('campaign-modal-save');
            const form = document.getElementById('campaign-form');
            const stationSelect = document.getElementById('campaign-station');

            // Close handlers
            if (closeBtn) closeBtn.onclick = () => this._closeModal();
            if (cancelBtn) cancelBtn.onclick = () => this._closeModal();

            if (overlay) {
                overlay.onclick = (e) => {
                    if (e.target === overlay) this._closeModal();
                };
            }

            // Station change - load platforms
            if (stationSelect) {
                stationSelect.onchange = async (e) => {
                    await this._loadPlatformsForStation(e.target.value);
                };
            }

            // Save handler
            if (saveBtn && form) {
                saveBtn.onclick = async () => {
                    if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }

                    const formData = new FormData(form);
                    const data = {};

                    formData.forEach((value, key) => {
                        if (value !== '' && value !== null) {
                            data[key] = value;
                        }
                    });

                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

                    try {
                        if (campaignId) {
                            await this.updateCampaign(campaignId, data);
                        } else {
                            await this.createCampaign(data);
                        }
                        this._closeModal();
                    } catch (error) {
                        logger.error('Failed to save campaign:', error);
                        this._showToast(error.message || 'Failed to save campaign', 'error');
                    } finally {
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = campaignId ? 'Update Campaign' : 'Create Campaign';
                    }
                };
            }

            // Escape key
            document.addEventListener('keydown', this._handleModalKeydown);
        }

        /**
         * Handle modal keydown
         * @private
         */
        _handleModalKeydown = (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this._closeModal();
            }
        };

        /**
         * Load platforms for selected station
         * @private
         */
        async _loadPlatformsForStation(stationId) {
            const platformSelect = document.getElementById('campaign-platform');
            if (!platformSelect || !stationId) {
                if (platformSelect) {
                    platformSelect.innerHTML = '<option value="">Select platform...</option>';
                }
                return;
            }

            try {
                const station = this.cache.stations.find(s => String(s.id) === String(stationId));
                if (!station) return;

                const response = await global.sitesAPI.getPlatforms(station.acronym);
                const platforms = response.platforms || response || [];

                platformSelect.innerHTML = '<option value="">Select platform...</option>' +
                    platforms.map(p =>
                        `<option value="${p.id}">${this._escapeHtml(p.display_name || p.normalized_name)}</option>`
                    ).join('');

            } catch (error) {
                logger.warn('Failed to load platforms:', error);
            }
        }

        /**
         * Close modal
         * @private
         */
        _closeModal() {
            if (this.activeModal) {
                this.activeModal.remove();
                this.activeModal = null;
            }
            document.removeEventListener('keydown', this._handleModalKeydown);
        }

        /**
         * Create a new campaign
         * @param {Object} data - Campaign data
         */
        async createCampaign(data) {
            const api = global.sitesAPIv3;
            if (!api) {
                throw new Error('V3 API client not available');
            }

            const response = await api.createCampaign(data);

            this._showToast('Campaign created successfully', 'success');
            this.options.onCampaignCreate(response.data || response);
            await this.loadCampaigns();

            return response;
        }

        /**
         * Update an existing campaign
         * @param {number|string} id - Campaign ID
         * @param {Object} data - Updated campaign data
         */
        async updateCampaign(id, data) {
            const api = global.sitesAPIv3;
            if (!api) {
                throw new Error('V3 API client not available');
            }

            const response = await api.updateCampaign(id, data);

            this._showToast('Campaign updated successfully', 'success');
            this.options.onCampaignUpdate(response.data || response);
            await this.loadCampaigns();

            return response;
        }

        /**
         * Delete a campaign
         * @param {number|string} id - Campaign ID
         */
        async deleteCampaign(id) {
            const api = global.sitesAPIv3;
            if (!api) {
                throw new Error('V3 API client not available');
            }

            const response = await api.deleteCampaign(id);

            this._showToast('Campaign deleted successfully', 'success');
            this.options.onCampaignDelete({ id });
            await this.loadCampaigns();

            return response;
        }

        /**
         * Confirm delete action
         * @private
         */
        _confirmDelete(campaignId) {
            const campaign = this.state.campaigns.find(c => String(c.id) === String(campaignId));
            if (!campaign) return;

            const modalHtml = `
                <div class="campaign-modal-overlay" id="campaign-delete-modal">
                    <div class="campaign-modal" style="max-width: 400px;">
                        <div class="campaign-modal-header">
                            <h2 class="campaign-modal-title">Delete Campaign</h2>
                            <button class="campaign-modal-close" id="delete-modal-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="campaign-modal-body">
                            <p>Are you sure you want to delete <strong>${this._escapeHtml(campaign.campaign_name)}</strong>?</p>
                            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div class="campaign-modal-footer">
                            <button class="campaign-modal-btn secondary" id="delete-modal-cancel">Cancel</button>
                            <button class="campaign-modal-btn danger" id="delete-modal-confirm">Delete</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.getElementById('campaign-delete-modal');
            const closeBtn = document.getElementById('delete-modal-close');
            const cancelBtn = document.getElementById('delete-modal-cancel');
            const confirmBtn = document.getElementById('delete-modal-confirm');

            const closeDeleteModal = () => modal.remove();

            if (closeBtn) closeBtn.onclick = closeDeleteModal;
            if (cancelBtn) cancelBtn.onclick = closeDeleteModal;
            if (modal) modal.onclick = (e) => { if (e.target === modal) closeDeleteModal(); };

            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    confirmBtn.disabled = true;
                    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

                    try {
                        await this.deleteCampaign(campaignId);
                        closeDeleteModal();
                    } catch (error) {
                        logger.error('Failed to delete campaign:', error);
                        this._showToast(error.message || 'Failed to delete campaign', 'error');
                        confirmBtn.disabled = false;
                        confirmBtn.innerHTML = 'Delete';
                    }
                };
            }
        }

        /**
         * Show toast notification
         * @private
         */
        _showToast(message, type = 'info') {
            // Use existing toast system if available
            if (global.showToast) {
                global.showToast(message, type);
                return;
            }

            // Fallback simple toast
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#dc2626' : '#3b82f6'};
                color: white;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                z-index: 10001;
                animation: slideIn 0.3s ease;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => toast.remove(), 3000);
        }

        /**
         * Format date for display
         * @private
         */
        _formatDate(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
        }

        /**
         * Format date for datetime-local input
         * @private
         */
        _formatDateTimeLocal(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toISOString().slice(0, 16);
            } catch (e) {
                return '';
            }
        }

        /**
         * Escape HTML to prevent XSS
         * @private
         * @see core/security.js - Delegates to central implementation
         */
        _escapeHtml(str) {
            return global.SitesSecurity?.escapeHtml?.(str) ?? (str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
        }

        /**
         * Destroy the component
         */
        destroy() {
            this._closeModal();

            if (this.pagination) {
                this.pagination.destroy();
            }

            if (this.container) {
                this.container.innerHTML = '';
            }

            logger.log('CampaignManager destroyed');
        }
    }

    // =========================================================================
    // GLOBAL REGISTRY
    // =========================================================================

    /** Global registry for campaign manager instances */
    global.campaignManagers = global.campaignManagers || {};

    // =========================================================================
    // EXPORTS
    // =========================================================================

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CampaignManager;
    }

    // Export for browser global
    global.CampaignManager = CampaignManager;

    logger.log('CampaignManager module loaded');

})(typeof window !== 'undefined' ? window : global);
