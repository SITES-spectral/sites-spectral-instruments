/**
 * Product Browser Component
 * SITES Spectral v12.0.11
 *
 * Comprehensive product catalog browsing component with filtering, sorting,
 * pagination, and multiple view modes. Integrates with V3 API and YAML configuration.
 *
 * Features:
 * - Grid/list view toggle
 * - Multi-filter support (type, level, station, platform, date range)
 * - Sorting by date, name, type, size
 * - Product cards with thumbnails and metadata
 * - Product detail modal
 * - Download support
 * - Pagination integration
 *
 * CSS extracted to: /css/product-browser.css (v12.0.11)
 * Utilities extracted to: products/product-utils.js (v12.0.12)
 *
 * @module products/product-browser
 * @version 12.0.12
 * @requires api-v3.js (window.sitesAPIv3)
 * @requires products/product-utils.js (ProductUtils)
 * @requires ui/pagination-controls.js (PaginationControls)
 * @requires core/config-service.js (SitesConfig)
 * @requires core/debug.js (Debug)
 */

(function(global) {
    'use strict';

    // =========================================================================
    // LOGGER SETUP
    // =========================================================================

    const logger = global.Debug?.withCategory('ProductBrowser') || {
        log: () => {},
        info: () => {},
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    // =========================================================================
    // DEFAULT CONFIGURATION
    // =========================================================================

    const DEFAULT_CONFIG = {
        /** Default view mode */
        defaultViewMode: 'grid',
        /** Default sort field */
        defaultSortField: 'date',
        /** Default sort order */
        defaultSortOrder: 'desc',
        /** Default page size */
        defaultPageSize: 20,
        /** Grid columns (auto-adjusted) */
        gridColumns: 4,
        /** Show thumbnails */
        showThumbnails: true,
        /** Enable animations */
        enableAnimations: true,
        /** Date format for display */
        dateFormat: 'YYYY-MM-DD',
        /** Show file sizes */
        showFileSizes: true,
        /** Enable keyboard shortcuts */
        enableKeyboardShortcuts: true
    };

    // =========================================================================
    // CONFIGURATION REFERENCES (v12.0.12)
    // =========================================================================
    // Configuration constants moved to products/product-utils.js
    // Access via: global.ProductUtils.PRODUCT_TYPES, etc.

    /** Get product types (from ProductUtils or inline fallback) */
    const getProductTypes = () => global.ProductUtils?.PRODUCT_TYPES || {};

    /** Get processing levels (from ProductUtils or inline fallback) */
    const getProcessingLevels = () => global.ProductUtils?.PROCESSING_LEVELS || {};

    /** Get sort options (from ProductUtils or inline fallback) */
    const SORT_OPTIONS = global.ProductUtils?.SORT_OPTIONS || {
        date: { label: 'Date', icon: 'fa-calendar' },
        name: { label: 'Name', icon: 'fa-font' },
        type: { label: 'Type', icon: 'fa-tag' },
        size: { label: 'Size', icon: 'fa-weight' }
    };

    // =========================================================================
    // CSS STYLES - External File (v12.0.11)
    // =========================================================================
    // CSS has been extracted to: /css/product-browser.css
    // This reduces JS bundle size by ~790 lines and improves caching

    /** CSS file path for product browser styles */
    const PRODUCT_BROWSER_CSS_PATH = '/css/product-browser.css';

    /** Track if styles have been loaded */
    let stylesLoaded = false;

    /**
     * Load external CSS stylesheet
     * @private
     */
    function loadStyles() {
        if (stylesLoaded) return;
        if (document.getElementById('product-browser-styles')) {
            stylesLoaded = true;
            return;
        }

        const linkEl = document.createElement('link');
        linkEl.id = 'product-browser-styles';
        linkEl.rel = 'stylesheet';
        linkEl.href = PRODUCT_BROWSER_CSS_PATH + '?v=12.0.11';
        document.head.appendChild(linkEl);
        stylesLoaded = true;
    }

    // Legacy alias for backwards compatibility
    const injectStyles = loadStyles;

    // =========================================================================
    // PRODUCT BROWSER CLASS
    // =========================================================================

    /**
     * ProductBrowser Class
     *
     * Creates a comprehensive product browsing interface with filtering,
     * sorting, pagination, and multiple view modes.
     */
    class ProductBrowser {
        /**
         * Create a ProductBrowser instance
         * @param {string} containerId - ID of the container element
         * @param {Object} [options={}] - Configuration options
         * @param {string} [options.defaultViewMode='grid'] - Initial view mode ('grid' or 'list')
         * @param {string} [options.defaultSortField='date'] - Initial sort field
         * @param {string} [options.defaultSortOrder='desc'] - Initial sort order
         * @param {number} [options.defaultPageSize=20] - Items per page
         * @param {boolean} [options.showThumbnails=true] - Show product thumbnails
         * @param {Function} [options.onProductSelect] - Callback when product is selected
         * @param {Function} [options.onProductDownload] - Callback when download is requested
         * @param {Object} [options.initialFilters={}] - Initial filter values
         */
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.container = document.getElementById(containerId);

            if (!this.container) {
                logger.error(`ProductBrowser: Container '${containerId}' not found`);
                return;
            }

            // Merge options with defaults
            this.options = { ...DEFAULT_CONFIG, ...options };

            // State
            this.state = {
                viewMode: this.options.defaultViewMode,
                sortField: this.options.defaultSortField,
                sortOrder: this.options.defaultSortOrder,
                currentPage: 1,
                pageSize: this.options.defaultPageSize,
                totalItems: 0,
                totalPages: 0,
                isLoading: false,
                error: null,
                products: [],
                filters: {
                    type: '',
                    level: '',
                    station: '',
                    platform: '',
                    startDate: '',
                    endDate: '',
                    ...options.initialFilters
                }
            };

            // Configuration data (loaded from YAML)
            this.productTypes = {};
            this.processingLevels = {};
            this.stations = [];
            this.platforms = [];

            // Event callbacks
            this.onProductSelect = this.options.onProductSelect || null;
            this.onProductDownload = this.options.onProductDownload || null;

            // Component references
            this.paginationControls = null;
            this.detailModal = null;

            // Bound event handlers
            this._boundKeyHandler = this._handleKeydown.bind(this);

            // Initialize
            this._init();
        }

        // =====================================================================
        // INITIALIZATION
        // =====================================================================

        /**
         * Initialize the component
         * @private
         */
        async _init() {
            // Inject styles
            injectStyles();

            // Add loading state
            this.container.classList.add('product-browser--loading');

            try {
                // Load configuration
                await this._loadConfiguration();

                // Render initial structure
                this._render();

                // Setup pagination
                this._setupPagination();

                // Setup event listeners
                this._attachEventListeners();

                // Load initial data
                await this.loadProducts(this.state.filters, 1);

            } catch (error) {
                logger.error('ProductBrowser: Initialization error:', error);
                this._renderError('Failed to initialize product browser');
            } finally {
                this.container.classList.remove('product-browser--loading');
            }
        }

        /**
         * Load configuration from YAML config service
         * @private
         */
        async _loadConfiguration() {
            // Try to load from ConfigService
            if (global.SitesConfig) {
                // Wait for config to load if needed
                if (!global.SitesConfig.isLoaded() && typeof global.SitesConfig.init === 'function') {
                    await global.SitesConfig.init();
                }
            }

            // Load product types
            this.productTypes = await this._loadProductTypes();

            // Load processing levels
            this.processingLevels = await this._loadProcessingLevels();

            // Load stations for filter dropdown
            await this._loadStationsAndPlatforms();

            logger.log('ProductBrowser: Configuration loaded');
        }

        /**
         * Load product types from config
         * @private
         * @returns {Object} Product types configuration
         */
        async _loadProductTypes() {
            try {
                if (global.ConfigLoader) {
                    const config = await global.ConfigLoader.get('products/product-types');
                    if (config && config.product_types) {
                        return config.product_types;
                    }
                }
            } catch (error) {
                logger.warn('ProductBrowser: Failed to load product types config:', error);
            }
            return FALLBACK_PRODUCT_TYPES;
        }

        /**
         * Load processing levels from config
         * @private
         * @returns {Object} Processing levels configuration
         */
        async _loadProcessingLevels() {
            try {
                if (global.ConfigLoader) {
                    const config = await global.ConfigLoader.get('products/product-types');
                    if (config && config.processing_levels) {
                        // Convert to code-keyed object
                        const levels = {};
                        Object.entries(config.processing_levels).forEach(([key, value]) => {
                            levels[value.code] = value;
                        });
                        return levels;
                    }
                }
            } catch (error) {
                logger.warn('ProductBrowser: Failed to load processing levels config:', error);
            }
            return FALLBACK_PROCESSING_LEVELS;
        }

        /**
         * Load stations and platforms for filter dropdowns
         * @private
         */
        async _loadStationsAndPlatforms() {
            try {
                const api = global.sitesAPIv3 || global.sitesAPI;
                if (api) {
                    // Load stations
                    if (typeof api.getStations === 'function') {
                        const stationsResponse = await api.getStations({}, 1, 100);
                        this.stations = stationsResponse.data || [];
                    }

                    // Load platforms
                    if (typeof api.getPlatforms === 'function') {
                        const platformsResponse = await api.getPlatforms({}, 1, 100);
                        this.platforms = platformsResponse.data || [];
                    }
                }
            } catch (error) {
                logger.warn('ProductBrowser: Failed to load stations/platforms:', error);
                this.stations = [];
                this.platforms = [];
            }
        }

        // =====================================================================
        // RENDERING
        // =====================================================================

        /**
         * Render the complete component structure
         * @private
         */
        _render() {
            this.container.innerHTML = `
                <div class="product-browser">
                    ${this._renderHeader()}
                    ${this._renderFilters()}
                    <div class="product-browser__content" id="${this.containerId}-content">
                        ${this._renderLoadingState()}
                    </div>
                    <div class="product-browser__footer" id="${this.containerId}-pagination">
                    </div>
                </div>
                <div class="product-detail-modal" id="${this.containerId}-detail-modal">
                    <div class="product-detail-modal__content">
                        <div class="product-detail-modal__header">
                            <h3 class="product-detail-modal__title">Product Details</h3>
                            <button class="product-detail-modal__close" aria-label="Close modal">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="product-detail-modal__body" id="${this.containerId}-detail-body">
                        </div>
                        <div class="product-detail-modal__footer">
                            <button class="product-detail-modal__btn" data-action="close">
                                <i class="fas fa-times"></i>
                                Close
                            </button>
                            <button class="product-detail-modal__btn product-detail-modal__btn--primary" data-action="download">
                                <i class="fas fa-download"></i>
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render header with title and controls
         * @private
         * @returns {string} Header HTML
         */
        _renderHeader() {
            return `
                <div class="product-browser__header">
                    <div class="product-browser__title-wrapper">
                        <h3 class="product-browser__title">
                            Products
                            <span class="product-browser__count" id="${this.containerId}-count"></span>
                        </h3>
                    </div>
                    <div class="product-browser__controls">
                        <div class="product-browser__view-toggle" role="group" aria-label="View mode">
                            <button class="product-browser__view-btn ${this.state.viewMode === 'grid' ? 'product-browser__view-btn--active' : ''}"
                                    data-view="grid" aria-label="Grid view" title="Grid view">
                                <i class="fas fa-th"></i>
                            </button>
                            <button class="product-browser__view-btn ${this.state.viewMode === 'list' ? 'product-browser__view-btn--active' : ''}"
                                    data-view="list" aria-label="List view" title="List view">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                        <div class="product-browser__sort">
                            <span class="product-browser__sort-label">Sort by:</span>
                            <select class="product-browser__sort-select" id="${this.containerId}-sort-select" aria-label="Sort by">
                                ${Object.entries(SORT_OPTIONS).map(([key, option]) => `
                                    <option value="${key}" ${this.state.sortField === key ? 'selected' : ''}>
                                        ${option.label}
                                    </option>
                                `).join('')}
                            </select>
                            <button class="product-browser__sort-order" data-order="${this.state.sortOrder}"
                                    aria-label="Sort order: ${this.state.sortOrder === 'asc' ? 'ascending' : 'descending'}"
                                    title="${this.state.sortOrder === 'asc' ? 'Ascending' : 'Descending'}">
                                <i class="fas fa-sort-amount-${this.state.sortOrder === 'asc' ? 'up' : 'down'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Render filters section
         * @private
         * @returns {string} Filters HTML
         */
        _renderFilters() {
            return `
                <div class="product-browser__filters">
                    <div class="product-browser__filter-group">
                        <label class="product-browser__filter-label" for="${this.containerId}-filter-type">Type</label>
                        <select class="product-browser__filter-select" id="${this.containerId}-filter-type" data-filter="type">
                            <option value="">All Types</option>
                            ${Object.entries(this.productTypes).map(([key, config]) => `
                                <option value="${key}" ${this.state.filters.type === key ? 'selected' : ''}>
                                    ${this._escapeHtml(config.name || key)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="product-browser__filter-group">
                        <label class="product-browser__filter-label" for="${this.containerId}-filter-level">Level</label>
                        <select class="product-browser__filter-select" id="${this.containerId}-filter-level" data-filter="level">
                            <option value="">All Levels</option>
                            ${Object.entries(this.processingLevels).map(([code, config]) => `
                                <option value="${code}" ${this.state.filters.level === code ? 'selected' : ''}>
                                    ${code} - ${this._escapeHtml(config.name || code)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="product-browser__filter-group">
                        <label class="product-browser__filter-label" for="${this.containerId}-filter-station">Station</label>
                        <select class="product-browser__filter-select" id="${this.containerId}-filter-station" data-filter="station">
                            <option value="">All Stations</option>
                            ${this.stations.map(station => `
                                <option value="${station.acronym || station.id}" ${this.state.filters.station === (station.acronym || station.id) ? 'selected' : ''}>
                                    ${this._escapeHtml(station.display_name || station.acronym || station.name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="product-browser__filter-group">
                        <label class="product-browser__filter-label" for="${this.containerId}-filter-start">From</label>
                        <input type="date" class="product-browser__filter-input" id="${this.containerId}-filter-start"
                               data-filter="startDate" value="${this.state.filters.startDate || ''}">
                    </div>
                    <div class="product-browser__filter-group">
                        <label class="product-browser__filter-label" for="${this.containerId}-filter-end">To</label>
                        <input type="date" class="product-browser__filter-input" id="${this.containerId}-filter-end"
                               data-filter="endDate" value="${this.state.filters.endDate || ''}">
                    </div>
                    <button class="product-browser__filter-reset" id="${this.containerId}-filter-reset">
                        <i class="fas fa-undo"></i> Reset
                    </button>
                </div>
            `;
        }

        /**
         * Render loading state
         * @private
         * @returns {string} Loading HTML
         */
        _renderLoadingState() {
            return `
                <div class="product-browser__loading">
                    <i class="fas fa-spinner product-browser__loading-spinner"></i>
                    <span>Loading products...</span>
                </div>
            `;
        }

        /**
         * Render empty state
         * @private
         * @returns {string} Empty state HTML
         */
        _renderEmptyState() {
            return `
                <div class="product-browser__empty">
                    <i class="fas fa-box-open product-browser__empty-icon"></i>
                    <h4 class="product-browser__empty-title">No products found</h4>
                    <p class="product-browser__empty-message">Try adjusting your filters or search criteria.</p>
                </div>
            `;
        }

        /**
         * Render error state
         * @private
         * @param {string} message - Error message
         */
        _renderError(message) {
            const content = this.container.querySelector(`#${this.containerId}-content`);
            if (content) {
                content.innerHTML = `
                    <div class="product-browser__error">
                        <i class="fas fa-exclamation-triangle product-browser__error-icon"></i>
                        <h4 class="product-browser__error-title">Something went wrong</h4>
                        <p class="product-browser__error-message">${this._escapeHtml(message)}</p>
                        <button class="product-browser__error-btn" onclick="this.closest('.product-browser').querySelector('[data-action=retry]')?.click()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                    </div>
                `;
            }
        }

        /**
         * Render product card for grid view
         * @param {Object} product - Product data
         * @returns {string} Product card HTML
         */
        renderProductCard(product) {
            const type = product.type || 'unknown';
            const typeConfig = this.productTypes[type] || {};
            const level = product.processing_level || product.level || 'L1';
            const levelConfig = this.processingLevels[level] || {};

            const typeColor = typeConfig.color || '#6b7280';
            const typeBackground = typeConfig.background || '#f3f4f6';
            const typeIcon = typeConfig.icon || 'fa-file';
            const typeName = typeConfig.name || type;

            const levelColor = levelConfig.color || '#6b7280';
            const levelName = levelConfig.name || level;

            const thumbnail = product.thumbnail_url || product.preview_url || null;
            const fileSize = this._formatFileSize(product.file_size || product.size);
            const date = this._formatDate(product.created_at || product.date);

            return `
                <div class="product-card" data-product-id="${product.id}"
                     role="button" tabindex="0"
                     aria-label="View ${this._escapeHtml(product.name)} details"
                     onclick="window.ProductBrowserInstances?.['${this.containerId}']?.showProductDetail('${product.id}')">
                    <div class="product-card__thumbnail ${!thumbnail ? 'product-card__thumbnail--placeholder' : ''}">
                        ${thumbnail ? `
                            <img src="${this._escapeHtml(thumbnail)}"
                                 alt="${this._escapeHtml(product.name)}"
                                 loading="lazy"
                                 data-fallback="true">
                        ` : `
                            <i class="fas ${typeIcon}"></i>
                            <span>No preview</span>
                        `}
                        <span class="product-card__level-badge" style="background-color: ${levelColor};">
                            ${level}
                        </span>
                        <span class="product-card__type-badge" style="background-color: ${typeColor};"
                              title="${this._escapeHtml(typeName)}">
                            <i class="fas ${typeIcon}"></i>
                        </span>
                    </div>
                    <div class="product-card__body">
                        <div class="product-card__header">
                            <h4 class="product-card__name" title="${this._escapeHtml(product.name)}">
                                ${this._escapeHtml(product.name)}
                            </h4>
                        </div>
                        <div class="product-card__type">
                            <i class="fas ${typeIcon}" style="color: ${typeColor};"></i>
                            ${this._escapeHtml(typeName)}
                        </div>
                        <div class="product-card__meta">
                            ${date ? `
                                <span class="product-card__meta-item">
                                    <i class="fas fa-calendar"></i>
                                    ${date}
                                </span>
                            ` : ''}
                            ${fileSize ? `
                                <span class="product-card__meta-item">
                                    <i class="fas fa-weight"></i>
                                    ${fileSize}
                                </span>
                            ` : ''}
                            ${product.station ? `
                                <span class="product-card__meta-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${this._escapeHtml(product.station)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="product-card__actions">
                        <button class="product-card__action-btn"
                                onclick="event.stopPropagation(); window.ProductBrowserInstances?.['${this.containerId}']?.showProductDetail('${product.id}')"
                                title="View details">
                            <i class="fas fa-eye"></i>
                            Details
                        </button>
                        <button class="product-card__action-btn product-card__action-btn--primary"
                                onclick="event.stopPropagation(); window.ProductBrowserInstances?.['${this.containerId}']?._triggerDownload('${product.id}')"
                                title="Download product">
                            <i class="fas fa-download"></i>
                            Download
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Render product list item for list view
         * @param {Object} product - Product data
         * @returns {string} List item HTML
         */
        _renderProductListItem(product) {
            const type = product.type || 'unknown';
            const typeConfig = this.productTypes[type] || {};
            const level = product.processing_level || product.level || 'L1';
            const levelConfig = this.processingLevels[level] || {};

            const typeColor = typeConfig.color || '#6b7280';
            const typeIcon = typeConfig.icon || 'fa-file';
            const typeName = typeConfig.name || type;

            const levelColor = levelConfig.color || '#6b7280';

            const thumbnail = product.thumbnail_url || product.preview_url || null;
            const fileSize = this._formatFileSize(product.file_size || product.size);
            const date = this._formatDate(product.created_at || product.date);
            const format = product.file_format || product.format || '';

            return `
                <div class="product-list-item" data-product-id="${product.id}"
                     role="button" tabindex="0"
                     aria-label="View ${this._escapeHtml(product.name)} details"
                     onclick="window.ProductBrowserInstances?.['${this.containerId}']?.showProductDetail('${product.id}')">
                    <div class="product-list-item__thumbnail ${!thumbnail ? 'product-list-item__thumbnail--placeholder' : ''}">
                        ${thumbnail ? `
                            <img src="${this._escapeHtml(thumbnail)}"
                                 alt="${this._escapeHtml(product.name)}"
                                 loading="lazy"
                                 data-fallback="true">
                        ` : `
                            <i class="fas ${typeIcon}" style="color: ${typeColor};"></i>
                        `}
                    </div>
                    <div class="product-list-item__content">
                        <h4 class="product-list-item__name" title="${this._escapeHtml(product.name)}">
                            ${this._escapeHtml(product.name)}
                        </h4>
                        <div class="product-list-item__meta">
                            <span class="product-list-item__meta-item">
                                <i class="fas ${typeIcon}" style="color: ${typeColor};"></i>
                                ${this._escapeHtml(typeName)}
                            </span>
                            ${date ? `
                                <span class="product-list-item__meta-item">
                                    <i class="fas fa-calendar"></i>
                                    ${date}
                                </span>
                            ` : ''}
                            ${fileSize ? `
                                <span class="product-list-item__meta-item">
                                    <i class="fas fa-weight"></i>
                                    ${fileSize}
                                </span>
                            ` : ''}
                            ${format ? `
                                <span class="product-list-item__meta-item">
                                    <i class="fas fa-file-alt"></i>
                                    ${this._escapeHtml(format)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="product-list-item__badges">
                        <span class="product-list-item__badge" style="background-color: ${levelColor};">
                            ${level}
                        </span>
                    </div>
                    <div class="product-list-item__actions">
                        <button class="product-list-item__action-btn"
                                onclick="event.stopPropagation(); window.ProductBrowserInstances?.['${this.containerId}']?.showProductDetail('${product.id}')"
                                title="View details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="product-list-item__action-btn"
                                onclick="event.stopPropagation(); window.ProductBrowserInstances?.['${this.containerId}']?._triggerDownload('${product.id}')"
                                title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        /**
         * Render products in grid view
         * @param {Array} products - Products array
         * @returns {string} Grid HTML
         */
        renderProductGrid(products) {
            if (!products || products.length === 0) {
                return this._renderEmptyState();
            }

            return `
                <div class="product-browser__grid">
                    ${products.map(product => this.renderProductCard(product)).join('')}
                </div>
            `;
        }

        /**
         * Render products in list view
         * @param {Array} products - Products array
         * @returns {string} List HTML
         */
        renderProductList(products) {
            if (!products || products.length === 0) {
                return this._renderEmptyState();
            }

            return `
                <div class="product-browser__list">
                    ${products.map(product => this._renderProductListItem(product)).join('')}
                </div>
            `;
        }

        /**
         * Update content area with products
         * @private
         */
        _updateContent() {
            const content = this.container.querySelector(`#${this.containerId}-content`);
            if (!content) return;

            if (this.state.isLoading) {
                content.innerHTML = this._renderLoadingState();
                return;
            }

            if (this.state.error) {
                this._renderError(this.state.error);
                return;
            }

            if (this.state.viewMode === 'grid') {
                content.innerHTML = this.renderProductGrid(this.state.products);
            } else {
                content.innerHTML = this.renderProductList(this.state.products);
            }

            // Update count
            const countEl = this.container.querySelector(`#${this.containerId}-count`);
            if (countEl) {
                countEl.textContent = `(${this.state.totalItems})`;
            }
        }

        // =====================================================================
        // DATA LOADING
        // =====================================================================

        /**
         * Load products from API
         * @param {Object} [filters={}] - Filter parameters
         * @param {number} [page=1] - Page number
         * @returns {Promise<void>}
         */
        async loadProducts(filters = {}, page = 1) {
            this.state.isLoading = true;
            this.state.error = null;
            this.state.filters = { ...this.state.filters, ...filters };
            this.state.currentPage = page;

            this._updateContent();

            try {
                const api = global.sitesAPIv3;
                if (!api) {
                    throw new Error('V3 API not available');
                }

                // Build API filters
                const apiFilters = {};
                if (this.state.filters.type) apiFilters.type = this.state.filters.type;
                if (this.state.filters.level) apiFilters.level = this.state.filters.level;
                if (this.state.filters.station) apiFilters.station = this.state.filters.station;
                if (this.state.filters.platform) apiFilters.platform = this.state.filters.platform;
                if (this.state.filters.startDate) apiFilters.startDate = this.state.filters.startDate;
                if (this.state.filters.endDate) apiFilters.endDate = this.state.filters.endDate;

                // Add sorting
                apiFilters.sort = this.state.sortField;
                apiFilters.order = this.state.sortOrder;

                // Fetch products
                const response = await api.getProducts(apiFilters, page, this.state.pageSize);

                this.state.products = response.data || [];
                this.state.totalItems = response.getTotalCount();
                this.state.totalPages = response.getTotalPages();
                this.state.currentPage = response.getCurrentPage();

                // Update pagination
                if (this.paginationControls) {
                    this.paginationControls.render(response.meta, response.links);
                }

                logger.log(`ProductBrowser: Loaded ${this.state.products.length} products`);

            } catch (error) {
                logger.error('ProductBrowser: Failed to load products:', error);
                this.state.error = error.message || 'Failed to load products';
                this.state.products = [];
            } finally {
                this.state.isLoading = false;
                this._updateContent();
            }
        }

        // =====================================================================
        // FILTERING
        // =====================================================================

        /**
         * Filter products by type
         * @param {string} type - Product type to filter by
         */
        filterByType(type) {
            this.state.filters.type = type || '';
            this._updateFilterSelect('type', type);
            this.loadProducts(this.state.filters, 1);
        }

        /**
         * Filter products by processing level
         * @param {string} level - Processing level to filter by
         */
        filterByLevel(level) {
            this.state.filters.level = level || '';
            this._updateFilterSelect('level', level);
            this.loadProducts(this.state.filters, 1);
        }

        /**
         * Update filter select element value
         * @private
         * @param {string} filterName - Filter name
         * @param {string} value - Filter value
         */
        _updateFilterSelect(filterName, value) {
            const select = this.container.querySelector(`[data-filter="${filterName}"]`);
            if (select) {
                select.value = value || '';
            }
        }

        /**
         * Reset all filters
         */
        resetFilters() {
            this.state.filters = {
                type: '',
                level: '',
                station: '',
                platform: '',
                startDate: '',
                endDate: ''
            };

            // Update all filter inputs
            const filterInputs = this.container.querySelectorAll('[data-filter]');
            filterInputs.forEach(input => {
                input.value = '';
            });

            this.loadProducts({}, 1);
        }

        // =====================================================================
        // VIEW MODE
        // =====================================================================

        /**
         * Set view mode
         * @param {string} mode - View mode ('grid' or 'list')
         */
        setViewMode(mode) {
            if (mode !== 'grid' && mode !== 'list') {
                logger.warn('ProductBrowser: Invalid view mode:', mode);
                return;
            }

            if (this.state.viewMode === mode) return;

            this.state.viewMode = mode;

            // Update view toggle buttons
            const buttons = this.container.querySelectorAll('.product-browser__view-btn');
            buttons.forEach(btn => {
                const isActive = btn.dataset.view === mode;
                btn.classList.toggle('product-browser__view-btn--active', isActive);
            });

            // Re-render content
            this._updateContent();
        }

        // =====================================================================
        // SORTING
        // =====================================================================

        /**
         * Set sort field
         * @param {string} field - Sort field
         */
        setSortField(field) {
            if (!SORT_OPTIONS[field]) {
                logger.warn('ProductBrowser: Invalid sort field:', field);
                return;
            }

            this.state.sortField = field;
            this.loadProducts(this.state.filters, 1);
        }

        /**
         * Toggle sort order
         */
        toggleSortOrder() {
            this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';

            // Update sort order button
            const btn = this.container.querySelector('.product-browser__sort-order');
            if (btn) {
                btn.dataset.order = this.state.sortOrder;
                btn.innerHTML = `<i class="fas fa-sort-amount-${this.state.sortOrder === 'asc' ? 'up' : 'down'}"></i>`;
                btn.setAttribute('title', this.state.sortOrder === 'asc' ? 'Ascending' : 'Descending');
            }

            this.loadProducts(this.state.filters, 1);
        }

        // =====================================================================
        // PRODUCT DETAIL MODAL
        // =====================================================================

        /**
         * Show product detail modal
         * @param {string|number} productId - Product ID
         */
        async showProductDetail(productId) {
            const modal = this.container.parentElement.querySelector(`#${this.containerId}-detail-modal`);
            const body = this.container.parentElement.querySelector(`#${this.containerId}-detail-body`);

            if (!modal || !body) return;

            // Find product in current list or fetch it
            let product = this.state.products.find(p => String(p.id) === String(productId));

            if (!product) {
                try {
                    const api = global.sitesAPIv3;
                    if (api) {
                        const response = await api.getProduct(productId);
                        product = response.data;
                    }
                } catch (error) {
                    logger.error('ProductBrowser: Failed to load product details:', error);
                    return;
                }
            }

            if (!product) return;

            // Render product details
            body.innerHTML = this._renderProductDetailContent(product);

            // Show modal
            modal.classList.add('product-detail-modal--visible');
            modal.setAttribute('aria-hidden', 'false');

            // Store current product for download action
            this._currentDetailProduct = product;

            // Trigger callback
            if (this.onProductSelect && typeof this.onProductSelect === 'function') {
                this.onProductSelect(product);
            }
        }

        /**
         * Render product detail content
         * @private
         * @param {Object} product - Product data
         * @returns {string} Detail content HTML
         */
        _renderProductDetailContent(product) {
            const type = product.type || 'unknown';
            const typeConfig = this.productTypes[type] || {};
            const level = product.processing_level || product.level || 'L1';
            const levelConfig = this.processingLevels[level] || {};

            const thumbnail = product.thumbnail_url || product.preview_url || null;
            const typeIcon = typeConfig.icon || 'fa-file';
            const typeColor = typeConfig.color || '#6b7280';

            return `
                <div class="product-detail-modal__preview">
                    ${thumbnail ? `
                        <img src="${this._escapeHtml(thumbnail)}" alt="${this._escapeHtml(product.name)}">
                    ` : `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
                            <i class="fas ${typeIcon}" style="font-size: 4rem; color: ${typeColor};"></i>
                        </div>
                    `}
                </div>
                <div class="product-detail-modal__metadata">
                    <div class="product-detail-modal__meta-item">
                        <div class="product-detail-modal__meta-label">Name</div>
                        <div class="product-detail-modal__meta-value">${this._escapeHtml(product.name)}</div>
                    </div>
                    <div class="product-detail-modal__meta-item">
                        <div class="product-detail-modal__meta-label">Type</div>
                        <div class="product-detail-modal__meta-value">
                            <i class="fas ${typeIcon}" style="color: ${typeColor}; margin-right: 0.25rem;"></i>
                            ${this._escapeHtml(typeConfig.name || type)}
                        </div>
                    </div>
                    <div class="product-detail-modal__meta-item">
                        <div class="product-detail-modal__meta-label">Processing Level</div>
                        <div class="product-detail-modal__meta-value">
                            <span style="display: inline-block; padding: 0.125rem 0.375rem; background: ${levelConfig.color}; color: white; border-radius: 0.25rem; font-size: 0.75rem; margin-right: 0.25rem;">${level}</span>
                            ${this._escapeHtml(levelConfig.name || '')}
                        </div>
                    </div>
                    <div class="product-detail-modal__meta-item">
                        <div class="product-detail-modal__meta-label">Date Created</div>
                        <div class="product-detail-modal__meta-value">${this._formatDate(product.created_at || product.date) || 'N/A'}</div>
                    </div>
                    <div class="product-detail-modal__meta-item">
                        <div class="product-detail-modal__meta-label">File Size</div>
                        <div class="product-detail-modal__meta-value">${this._formatFileSize(product.file_size || product.size) || 'N/A'}</div>
                    </div>
                    <div class="product-detail-modal__meta-item">
                        <div class="product-detail-modal__meta-label">Format</div>
                        <div class="product-detail-modal__meta-value">${this._escapeHtml(product.file_format || product.format || 'N/A')}</div>
                    </div>
                    ${product.station ? `
                        <div class="product-detail-modal__meta-item">
                            <div class="product-detail-modal__meta-label">Station</div>
                            <div class="product-detail-modal__meta-value">${this._escapeHtml(product.station)}</div>
                        </div>
                    ` : ''}
                    ${product.platform ? `
                        <div class="product-detail-modal__meta-item">
                            <div class="product-detail-modal__meta-label">Platform</div>
                            <div class="product-detail-modal__meta-value">${this._escapeHtml(product.platform)}</div>
                        </div>
                    ` : ''}
                    ${product.description ? `
                        <div class="product-detail-modal__meta-item" style="grid-column: span 2;">
                            <div class="product-detail-modal__meta-label">Description</div>
                            <div class="product-detail-modal__meta-value">${this._escapeHtml(product.description)}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        /**
         * Hide product detail modal
         * @private
         */
        _hideDetailModal() {
            const modal = this.container.parentElement.querySelector(`#${this.containerId}-detail-modal`);
            if (modal) {
                modal.classList.remove('product-detail-modal--visible');
                modal.setAttribute('aria-hidden', 'true');
            }
            this._currentDetailProduct = null;
        }

        // =====================================================================
        // DOWNLOAD
        // =====================================================================

        /**
         * Trigger product download
         * @private
         * @param {string|number} productId - Product ID
         */
        _triggerDownload(productId) {
            const product = this.state.products.find(p => String(p.id) === String(productId)) ||
                           this._currentDetailProduct;

            if (!product) {
                logger.warn('ProductBrowser: Product not found for download:', productId);
                return;
            }

            // Trigger callback
            if (this.onProductDownload && typeof this.onProductDownload === 'function') {
                this.onProductDownload(product);
            } else if (product.download_url) {
                // Default: open download URL in new tab
                window.open(product.download_url, '_blank');
            } else {
                logger.warn('ProductBrowser: No download URL available for product:', productId);
            }
        }

        // =====================================================================
        // PAGINATION
        // =====================================================================

        /**
         * Setup pagination controls
         * @private
         */
        _setupPagination() {
            const paginationContainer = this.container.querySelector(`#${this.containerId}-pagination`);
            if (!paginationContainer) return;

            if (global.PaginationControls) {
                this.paginationControls = new global.PaginationControls({
                    container: paginationContainer,
                    onPageChange: (page) => {
                        this.loadProducts(this.state.filters, page);
                    },
                    onPageSizeChange: (limit) => {
                        this.state.pageSize = limit;
                        this.loadProducts(this.state.filters, 1);
                    }
                });
            }
        }

        // =====================================================================
        // EVENT HANDLERS
        // =====================================================================

        /**
         * Attach event listeners
         * @private
         */
        _attachEventListeners() {
            // View mode toggle
            const viewToggle = this.container.querySelector('.product-browser__view-toggle');
            if (viewToggle) {
                viewToggle.addEventListener('click', (e) => {
                    const btn = e.target.closest('.product-browser__view-btn');
                    if (btn && btn.dataset.view) {
                        this.setViewMode(btn.dataset.view);
                    }
                });
            }

            // Sort select
            const sortSelect = this.container.querySelector(`#${this.containerId}-sort-select`);
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.setSortField(e.target.value);
                });
            }

            // Sort order button
            const sortOrder = this.container.querySelector('.product-browser__sort-order');
            if (sortOrder) {
                sortOrder.addEventListener('click', () => {
                    this.toggleSortOrder();
                });
            }

            // Filter inputs
            const filterInputs = this.container.querySelectorAll('[data-filter]');
            filterInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    const filterName = e.target.dataset.filter;
                    this.state.filters[filterName] = e.target.value;
                    this.loadProducts(this.state.filters, 1);
                });
            });

            // Reset filters button
            const resetBtn = this.container.querySelector(`#${this.containerId}-filter-reset`);
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetFilters();
                });
            }

            // Detail modal events
            const modal = this.container.parentElement.querySelector(`#${this.containerId}-detail-modal`);
            if (modal) {
                // Close button
                modal.querySelector('.product-detail-modal__close')?.addEventListener('click', () => {
                    this._hideDetailModal();
                });

                // Footer buttons
                modal.addEventListener('click', (e) => {
                    const action = e.target.closest('[data-action]')?.dataset.action;
                    if (action === 'close') {
                        this._hideDetailModal();
                    } else if (action === 'download' && this._currentDetailProduct) {
                        this._triggerDownload(this._currentDetailProduct.id);
                    }
                });

                // Click outside to close
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this._hideDetailModal();
                    }
                });
            }

            // Keyboard shortcuts
            if (this.options.enableKeyboardShortcuts) {
                document.addEventListener('keydown', this._boundKeyHandler);
            }

            // Store instance for global access (used in onclick handlers)
            if (!global.ProductBrowserInstances) {
                global.ProductBrowserInstances = {};
            }
            global.ProductBrowserInstances[this.containerId] = this;
        }

        /**
         * Handle keyboard events
         * @private
         * @param {KeyboardEvent} event - Keyboard event
         */
        _handleKeydown(event) {
            // Escape key to close modal
            if (event.key === 'Escape') {
                const modal = this.container.parentElement.querySelector(`#${this.containerId}-detail-modal`);
                if (modal && modal.classList.contains('product-detail-modal--visible')) {
                    this._hideDetailModal();
                    event.preventDefault();
                }
            }
        }

        // =====================================================================
        // UTILITY METHODS
        // =====================================================================

        /**
         * Format file size for display
         * Delegates to ProductUtils (v12.0.12)
         * @private
         * @param {number} bytes - Size in bytes
         * @returns {string} Formatted size
         */
        _formatFileSize(bytes) {
            if (global.ProductUtils?.formatFileSize) {
                return global.ProductUtils.formatFileSize(bytes);
            }
            // Fallback
            if (!bytes || bytes === 0) return null;
            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            let size = bytes;
            let unitIndex = 0;
            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }
            return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
        }

        /**
         * Format date for display
         * Delegates to ProductUtils (v12.0.12)
         * @private
         * @param {string|Date} date - Date to format
         * @returns {string} Formatted date
         */
        _formatDate(date) {
            if (global.ProductUtils?.formatDate) {
                return global.ProductUtils.formatDate(date);
            }
            // Fallback
            if (!date) return null;
            try {
                const d = new Date(date);
                if (isNaN(d.getTime())) return null;
                return d.toLocaleDateString('en-CA');
            } catch (error) {
                return null;
            }
        }

        /**
         * Escape HTML to prevent XSS
         * Delegates to ProductUtils/SitesSecurity (v12.0.12)
         * @private
         * @param {string} str - String to escape
         * @returns {string} Escaped string
         */
        _escapeHtml(str) {
            if (global.ProductUtils?.escapeHtml) {
                return global.ProductUtils.escapeHtml(str);
            }
            if (global.SitesSecurity?.escapeHtml) {
                return global.SitesSecurity.escapeHtml(str);
            }
            // Fallback
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // =====================================================================
        // PUBLIC API
        // =====================================================================

        /**
         * Get current state
         * @returns {Object} Current state
         */
        getState() {
            return { ...this.state };
        }

        /**
         * Get current filters
         * @returns {Object} Current filters
         */
        getFilters() {
            return { ...this.state.filters };
        }

        /**
         * Get current products
         * @returns {Array} Products array
         */
        getProducts() {
            return [...this.state.products];
        }

        /**
         * Refresh products with current filters
         */
        refresh() {
            this.loadProducts(this.state.filters, this.state.currentPage);
        }

        /**
         * Destroy the component and clean up
         */
        destroy() {
            // Remove keyboard listener
            if (this.options.enableKeyboardShortcuts) {
                document.removeEventListener('keydown', this._boundKeyHandler);
            }

            // Destroy pagination
            if (this.paginationControls && typeof this.paginationControls.destroy === 'function') {
                this.paginationControls.destroy();
            }

            // Remove from global instances
            if (global.ProductBrowserInstances) {
                delete global.ProductBrowserInstances[this.containerId];
            }

            // Clear container
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    }

    // =========================================================================
    // EXPORTS
    // =========================================================================

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ProductBrowser;
    }

    // Export for browser global
    global.ProductBrowser = ProductBrowser;

    logger.log('ProductBrowser component loaded');

})(typeof window !== 'undefined' ? window : global);
