/**
 * Platform Type Filter Component
 * SITES Spectral v9.0.0
 *
 * Tab-based filter for platform types with count badges.
 * Integrates with YAML configuration and V3 API.
 *
 * @module platforms/platform-type-filter
 * @version 9.0.0
 */

(function(global) {
    'use strict';

    /**
     * Platform Type Filter Class
     *
     * Creates a horizontal tab-based filter for platform types (fixed, uav, satellite, mobile).
     * Features:
     * - Tab buttons with icons and colors from YAML config
     * - Active state highlighting with smooth transitions
     * - Count badges showing number of platforms per type
     * - "All" option to show all platform types
     * - Responsive design with horizontal scroll on mobile
     *
     * @example
     * const filter = new PlatformTypeFilter('filter-container', {
     *     showAllOption: true,
     *     initialType: 'all',
     *     onTypeChange: (type) => console.log('Selected:', type)
     * });
     */
    class PlatformTypeFilter {
        /**
         * Create a PlatformTypeFilter instance
         * @param {string} containerId - ID of the container element
         * @param {Object} options - Configuration options
         * @param {boolean} [options.showAllOption=true] - Show "All" tab option
         * @param {string} [options.initialType='all'] - Initially selected type
         * @param {Function} [options.onTypeChange] - Callback when type changes
         * @param {boolean} [options.showCounts=true] - Show count badges
         * @param {boolean} [options.includeInactive=false] - Include inactive platform types
         * @param {string} [options.apiVersion='v3'] - API version to use
         */
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.container = document.getElementById(containerId);

            if (!this.container) {
                console.error(`PlatformTypeFilter: Container '${containerId}' not found`);
                return;
            }

            // Options with defaults
            this.options = {
                showAllOption: true,
                initialType: 'all',
                onTypeChange: null,
                showCounts: true,
                includeInactive: false,
                apiVersion: 'v3',
                ...options
            };

            // State
            this.activeType = this.options.initialType;
            this.platformTypes = {};
            this.counts = {};
            this.changeCallbacks = [];

            // Store callback from options
            if (this.options.onTypeChange && typeof this.options.onTypeChange === 'function') {
                this.changeCallbacks.push(this.options.onTypeChange);
            }

            // Initialize
            this._init();
        }

        /**
         * Initialize the component
         * @private
         */
        async _init() {
            // Add loading state
            this.container.classList.add('platform-type-filter-loading');
            this._renderLoading();

            try {
                // Load platform types from config
                await this._loadPlatformTypes();

                // Render initial UI
                this.render(this.counts);
            } catch (error) {
                console.error('PlatformTypeFilter: Initialization error:', error);
                this._renderError('Failed to load platform types');
            } finally {
                this.container.classList.remove('platform-type-filter-loading');
            }
        }

        /**
         * Load platform types from YAML configuration
         * @private
         */
        async _loadPlatformTypes() {
            // Try ConfigService first (YAML-based)
            if (global.SitesConfig && global.SitesConfig.isLoaded()) {
                this.platformTypes = this.options.includeInactive
                    ? global.SitesConfig.getPlatformTypes()
                    : global.SitesConfig.getActivePlatformTypes();
            } else {
                // Wait for ConfigService to initialize
                if (global.SitesConfig && typeof global.SitesConfig.init === 'function') {
                    await global.SitesConfig.init();
                    this.platformTypes = this.options.includeInactive
                        ? global.SitesConfig.getPlatformTypes()
                        : global.SitesConfig.getActivePlatformTypes();
                } else {
                    // Fallback to ConfigLoader directly
                    try {
                        const config = await global.ConfigLoader.get('platforms/platform-types');
                        this.platformTypes = config || {};
                    } catch (error) {
                        console.warn('PlatformTypeFilter: Failed to load config, using defaults');
                        this.platformTypes = this._getDefaultPlatformTypes();
                    }
                }
            }

            // Initialize counts
            Object.keys(this.platformTypes).forEach(type => {
                this.counts[type] = 0;
            });
        }

        /**
         * Get default platform types (fallback)
         * @private
         */
        _getDefaultPlatformTypes() {
            return {
                fixed: {
                    name: 'Fixed Platform',
                    icon: 'fa-tower-observation',
                    color: '#2563eb'
                },
                uav: {
                    name: 'UAV Platform',
                    icon: 'fa-helicopter',
                    color: '#059669'
                },
                satellite: {
                    name: 'Satellite Platform',
                    icon: 'fa-satellite',
                    color: '#7c3aed'
                },
                mobile: {
                    name: 'Mobile Platform',
                    icon: 'fa-truck',
                    color: '#f59e0b'
                }
            };
        }

        /**
         * Render loading state
         * @private
         */
        _renderLoading() {
            this.container.innerHTML = `
                <div class="platform-type-filter" role="tablist" aria-label="Platform type filter">
                    <div class="platform-type-filter-loading-indicator">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Loading platform types...</span>
                    </div>
                </div>
            `;
        }

        /**
         * Render error state
         * @private
         * @param {string} message - Error message
         */
        _renderError(message) {
            this.container.innerHTML = `
                <div class="platform-type-filter platform-type-filter-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${this._escapeHtml(message)}</span>
                </div>
            `;
        }

        /**
         * Render tabs with platform counts
         * @param {Object} [platformCounts={}] - Object with counts per platform type
         */
        render(platformCounts = {}) {
            // Update counts
            this.counts = { ...this.counts, ...platformCounts };

            // Calculate total
            const total = Object.values(this.counts).reduce((sum, count) => sum + count, 0);

            // Build tabs HTML
            let tabsHTML = '';

            // "All" option
            if (this.options.showAllOption) {
                const isAllActive = this.activeType === 'all';
                tabsHTML += this._renderTab({
                    type: 'all',
                    name: 'All Platforms',
                    icon: 'fa-layer-group',
                    color: '#64748b',
                    count: total,
                    isActive: isAllActive
                });
            }

            // Platform type tabs
            Object.entries(this.platformTypes).forEach(([type, config]) => {
                const isActive = this.activeType === type;
                const count = this.counts[type] || 0;

                tabsHTML += this._renderTab({
                    type,
                    name: config.name || this._formatTypeName(type),
                    icon: config.icon || 'fa-cube',
                    color: config.color || '#6b7280',
                    count,
                    isActive
                });
            });

            // Render complete filter
            this.container.innerHTML = `
                <div class="platform-type-filter" role="tablist" aria-label="Platform type filter">
                    <div class="platform-type-filter-tabs">
                        ${tabsHTML}
                    </div>
                </div>
            `;

            // Inject styles if not already present
            this._injectStyles();

            // Attach event listeners
            this._attachEventListeners();
        }

        /**
         * Render a single tab
         * @private
         * @param {Object} config - Tab configuration
         * @returns {string} Tab HTML
         */
        _renderTab({ type, name, icon, color, count, isActive }) {
            const activeClass = isActive ? 'active' : '';
            const tabId = `platform-type-tab-${type}`;
            const panelId = `platform-type-panel-${type}`;

            // Generate gradient from color
            const gradient = this._generateGradient(color);

            // Short name for mobile
            const shortName = this._getShortName(name);

            return `
                <button
                    class="platform-type-tab ${activeClass}"
                    data-type="${type}"
                    id="${tabId}"
                    role="tab"
                    aria-selected="${isActive}"
                    aria-controls="${panelId}"
                    tabindex="${isActive ? '0' : '-1'}"
                    style="--tab-color: ${color}; --tab-gradient: ${gradient};"
                >
                    <span class="platform-type-tab-icon" style="color: ${color};">
                        <i class="fas ${icon}"></i>
                    </span>
                    <span class="platform-type-tab-label">
                        <span class="platform-type-tab-name">${this._escapeHtml(name)}</span>
                        <span class="platform-type-tab-name-short">${this._escapeHtml(shortName)}</span>
                    </span>
                    ${this.options.showCounts ? `
                        <span class="platform-type-tab-count" style="background-color: ${isActive ? color : 'var(--bg-tertiary)'}; color: ${isActive ? 'white' : 'var(--text-secondary)'};">
                            ${count}
                        </span>
                    ` : ''}
                </button>
            `;
        }

        /**
         * Generate gradient from base color
         * @private
         * @param {string} color - Base color
         * @returns {string} CSS gradient
         */
        _generateGradient(color) {
            // Darken the color slightly for gradient end
            return `linear-gradient(135deg, ${color} 0%, ${this._darkenColor(color, 15)} 100%)`;
        }

        /**
         * Darken a hex color by percentage
         * @private
         * @param {string} color - Hex color
         * @param {number} percent - Percentage to darken
         * @returns {string} Darkened hex color
         */
        _darkenColor(color, percent) {
            const hex = color.replace('#', '');
            const num = parseInt(hex, 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max((num >> 16) - amt, 0);
            const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
            const B = Math.max((num & 0x0000FF) - amt, 0);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        /**
         * Get short name for mobile display
         * @private
         * @param {string} name - Full name
         * @returns {string} Short name
         */
        _getShortName(name) {
            const shortNames = {
                'All Platforms': 'All',
                'Fixed Platform': 'Fixed',
                'UAV Platform': 'UAV',
                'Satellite Platform': 'Sat',
                'Mobile Platform': 'Mobile'
            };
            return shortNames[name] || name.split(' ')[0];
        }

        /**
         * Format type name from code
         * @private
         * @param {string} type - Type code
         * @returns {string} Formatted name
         */
        _formatTypeName(type) {
            return type.charAt(0).toUpperCase() + type.slice(1) + ' Platform';
        }

        /**
         * Escape HTML to prevent XSS
         * @private
         * @param {string} text - Text to escape
         * @returns {string} Escaped text
         */
        _escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Attach event listeners
         * @private
         */
        _attachEventListeners() {
            const tabs = this.container.querySelectorAll('.platform-type-tab');

            tabs.forEach(tab => {
                // Click handler
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    const type = tab.dataset.type;
                    this.setActiveType(type);
                });

                // Keyboard navigation
                tab.addEventListener('keydown', (e) => {
                    this._handleKeyboardNav(e, tabs);
                });
            });
        }

        /**
         * Handle keyboard navigation
         * @private
         * @param {KeyboardEvent} event - Keyboard event
         * @param {NodeList} tabs - Tab elements
         */
        _handleKeyboardNav(event, tabs) {
            const tabArray = Array.from(tabs);
            const currentIndex = tabArray.indexOf(event.target);

            let newIndex = currentIndex;

            switch (event.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    newIndex = currentIndex > 0 ? currentIndex - 1 : tabArray.length - 1;
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    newIndex = currentIndex < tabArray.length - 1 ? currentIndex + 1 : 0;
                    break;
                case 'Home':
                    event.preventDefault();
                    newIndex = 0;
                    break;
                case 'End':
                    event.preventDefault();
                    newIndex = tabArray.length - 1;
                    break;
                default:
                    return;
            }

            const newTab = tabArray[newIndex];
            newTab.focus();
            this.setActiveType(newTab.dataset.type);
        }

        /**
         * Set active type programmatically
         * @param {string} type - Platform type to activate ('all', 'fixed', 'uav', 'satellite', 'mobile')
         */
        setActiveType(type) {
            if (this.activeType === type) return;

            const prevType = this.activeType;
            this.activeType = type;

            // Update UI
            this._updateActiveTab(type);

            // Notify callbacks
            this._notifyTypeChange(type, prevType);
        }

        /**
         * Update active tab visuals
         * @private
         * @param {string} type - Active type
         */
        _updateActiveTab(type) {
            const tabs = this.container.querySelectorAll('.platform-type-tab');

            tabs.forEach(tab => {
                const isActive = tab.dataset.type === type;
                const color = tab.style.getPropertyValue('--tab-color');

                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive);
                tab.setAttribute('tabindex', isActive ? '0' : '-1');

                // Update count badge color
                const countBadge = tab.querySelector('.platform-type-tab-count');
                if (countBadge) {
                    countBadge.style.backgroundColor = isActive ? color : 'var(--bg-tertiary)';
                    countBadge.style.color = isActive ? 'white' : 'var(--text-secondary)';
                }
            });
        }

        /**
         * Register type change callback
         * @param {Function} callback - Callback function(type, prevType)
         */
        onTypeChange(callback) {
            if (typeof callback === 'function') {
                this.changeCallbacks.push(callback);
            }
        }

        /**
         * Notify all registered callbacks
         * @private
         * @param {string} type - New type
         * @param {string} prevType - Previous type
         */
        _notifyTypeChange(type, prevType) {
            this.changeCallbacks.forEach(callback => {
                try {
                    callback(type, prevType);
                } catch (error) {
                    console.error('PlatformTypeFilter: Callback error:', error);
                }
            });
        }

        /**
         * Update count badges
         * @param {Object} counts - Object with counts per platform type
         */
        updateCounts(counts) {
            this.counts = { ...this.counts, ...counts };

            // Calculate total
            const total = Object.values(this.counts).reduce((sum, count) => sum + count, 0);

            // Update "All" count
            const allTab = this.container.querySelector('[data-type="all"] .platform-type-tab-count');
            if (allTab) {
                allTab.textContent = total;
            }

            // Update individual type counts
            Object.entries(counts).forEach(([type, count]) => {
                const tab = this.container.querySelector(`[data-type="${type}"] .platform-type-tab-count`);
                if (tab) {
                    tab.textContent = count;
                }
            });
        }

        /**
         * Get current active type
         * @returns {string} Active platform type
         */
        getActiveType() {
            return this.activeType;
        }

        /**
         * Get current counts
         * @returns {Object} Platform counts
         */
        getCounts() {
            return { ...this.counts };
        }

        /**
         * Fetch platforms by type from V3 API
         * @param {string} type - Platform type (or 'all')
         * @returns {Promise<Array>} Platforms array
         */
        async fetchPlatformsByType(type) {
            const apiVersion = this.options.apiVersion;

            try {
                let url;
                if (type === 'all') {
                    url = `/api/${apiVersion}/platforms`;
                } else {
                    url = `/api/${apiVersion}/platforms/type/${type}`;
                }

                // Use authenticated fetch if available
                const fetchFn = global.sitesAPI
                    ? global.sitesAPI.fetchWithAuth.bind(global.sitesAPI)
                    : fetch;

                const response = await fetchFn(url);
                const data = await response.json();

                return data.platforms || data || [];
            } catch (error) {
                console.error(`PlatformTypeFilter: Failed to fetch platforms for type '${type}':`, error);
                throw error;
            }
        }

        /**
         * Inject component styles
         * @private
         */
        _injectStyles() {
            const styleId = 'platform-type-filter-styles';
            if (document.getElementById(styleId)) return;

            const styles = document.createElement('style');
            styles.id = styleId;
            styles.textContent = `
                /* Platform Type Filter - Base */
                .platform-type-filter {
                    background: var(--bg-primary, #ffffff);
                    border-radius: var(--radius-lg, 0.75rem);
                    padding: 0.5rem;
                    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
                    border: 1px solid var(--border-color, #e2e8f0);
                }

                .platform-type-filter-tabs {
                    display: flex;
                    gap: 0.5rem;
                    overflow-x: auto;
                    scrollbar-width: thin;
                    scrollbar-color: var(--border-color, #e2e8f0) transparent;
                    -webkit-overflow-scrolling: touch;
                    padding-bottom: 0.25rem;
                }

                .platform-type-filter-tabs::-webkit-scrollbar {
                    height: 4px;
                }

                .platform-type-filter-tabs::-webkit-scrollbar-track {
                    background: transparent;
                }

                .platform-type-filter-tabs::-webkit-scrollbar-thumb {
                    background-color: var(--border-color, #e2e8f0);
                    border-radius: 4px;
                }

                /* Tab Button */
                .platform-type-tab {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: var(--radius-md, 0.5rem);
                    background: var(--bg-secondary, #f8fafc);
                    color: var(--text-secondary, #64748b);
                    font-size: 0.875rem;
                    font-weight: 500;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .platform-type-tab:hover {
                    background: var(--bg-tertiary, #f1f5f9);
                    border-color: var(--border-hover, #cbd5e1);
                    color: var(--text-primary, #1e293b);
                }

                .platform-type-tab:focus {
                    outline: 2px solid var(--tab-color, var(--primary-color, #2563eb));
                    outline-offset: 2px;
                }

                .platform-type-tab.active {
                    background: var(--tab-gradient, var(--tab-color, #2563eb));
                    border-color: transparent;
                    color: white;
                    box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
                }

                .platform-type-tab.active .platform-type-tab-icon {
                    color: white !important;
                }

                /* Tab Icon */
                .platform-type-tab-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 1.25rem;
                    height: 1.25rem;
                    font-size: 1rem;
                    transition: color 0.2s ease;
                }

                /* Tab Label */
                .platform-type-tab-label {
                    display: flex;
                    flex-direction: column;
                }

                .platform-type-tab-name {
                    display: block;
                }

                .platform-type-tab-name-short {
                    display: none;
                }

                /* Tab Count Badge */
                .platform-type-tab-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 1.5rem;
                    height: 1.5rem;
                    padding: 0 0.375rem;
                    border-radius: var(--radius-sm, 0.375rem);
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }

                /* Loading State */
                .platform-type-filter-loading-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    color: var(--text-secondary, #64748b);
                    font-size: 0.875rem;
                }

                .platform-type-filter-loading-indicator i {
                    font-size: 1rem;
                }

                /* Error State */
                .platform-type-filter-error {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    color: var(--danger-color, #dc2626);
                    font-size: 0.875rem;
                }

                .platform-type-filter-error i {
                    font-size: 1rem;
                }

                /* Responsive - Tablet */
                @media (max-width: 768px) {
                    .platform-type-tab {
                        padding: 0.5rem 0.75rem;
                    }

                    .platform-type-tab-name {
                        display: none;
                    }

                    .platform-type-tab-name-short {
                        display: block;
                    }
                }

                /* Responsive - Mobile */
                @media (max-width: 480px) {
                    .platform-type-filter {
                        padding: 0.25rem;
                    }

                    .platform-type-filter-tabs {
                        gap: 0.25rem;
                    }

                    .platform-type-tab {
                        padding: 0.5rem;
                        gap: 0.25rem;
                    }

                    .platform-type-tab-label {
                        display: none;
                    }

                    .platform-type-tab-count {
                        min-width: 1.25rem;
                        height: 1.25rem;
                        font-size: 0.625rem;
                    }
                }
            `;

            document.head.appendChild(styles);
        }

        /**
         * Destroy the component and clean up
         */
        destroy() {
            // Clear callbacks
            this.changeCallbacks = [];

            // Clear container
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    }

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PlatformTypeFilter;
    }

    // Export for browser global
    global.PlatformTypeFilter = PlatformTypeFilter;

})(typeof window !== 'undefined' ? window : global);
