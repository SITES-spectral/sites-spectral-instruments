/**
 * Platform Type Card Component
 * SITES Spectral v8.0.0 - Phase 7
 *
 * Renders a card for a platform type (Fixed, UAV, Satellite, Mobile)
 * with expandable platform list and instrument summaries.
 */

class PlatformTypeCard {
    /**
     * Create a PlatformTypeCard instance
     * @param {object} options - Configuration options
     * @param {string} options.type - Platform type code ('fixed', 'uav', 'satellite', 'mobile')
     * @param {HTMLElement} options.container - Container element to render into
     * @param {object} [options.config] - Optional config override (loads from YAML if not provided)
     */
    constructor(options) {
        this.type = options.type;
        this.container = options.container;
        this.config = options.config || null;
        this.element = null;
        this._unsubscribe = null;

        this._init();
    }

    async _init() {
        // Load config if not provided
        if (!this.config) {
            try {
                const dashboardConfig = await window.loadConfig('ui/dashboard.yaml');
                this.config = dashboardConfig.platform_type_cards[this.type];
            } catch (error) {
                console.error('PlatformTypeCard: Failed to load config:', error);
                this.config = this._getDefaultConfig();
            }
        }

        // Subscribe to state changes
        this._unsubscribe = window.DashboardState.subscribe(
            (state) => this._onStateChange(state),
            ['platformsByType', 'instruments', 'expandedPlatformTypes']
        );

        // Initial render
        this.render();
    }

    /**
     * Get default config - tries ConfigService first, then falls back to hardcoded defaults
     */
    _getDefaultConfig() {
        // Try ConfigService first (YAML-based)
        if (window.SitesConfig && window.SitesConfig.isLoaded()) {
            const config = window.SitesConfig.getPlatformType(this.type);
            if (config) {
                return config;
            }
        }

        // Fallback to hardcoded defaults
        const defaults = {
            fixed: {
                label: 'Fixed Platforms',
                icon: 'fa-tower-observation',
                color: '#2563eb',
                gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            },
            uav: {
                label: 'UAV Platforms',
                icon: 'fa-crosshairs',
                color: '#059669',
                gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            },
            satellite: {
                label: 'Satellite Platforms',
                icon: 'fa-satellite',
                color: '#7c3aed',
                gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
            },
            mobile: {
                label: 'Mobile Platforms',
                icon: 'fa-truck',
                color: '#f59e0b',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            }
        };
        return defaults[this.type] || defaults.fixed;
    }

    /**
     * Handle state changes
     */
    _onStateChange(state) {
        this.render();
    }

    /**
     * Render the card
     */
    render() {
        const state = window.DashboardState.getState();
        const platforms = state.platformsByType[this.type] || [];
        const instruments = state.instruments || [];
        const isExpanded = state.expandedPlatformTypes.has(this.type);
        const isAdmin = state.isAdmin;
        const canEdit = state.canEdit;

        // Get instrument counts for this platform type
        const platformIds = new Set(platforms.map(p => p.id));
        const typeInstruments = instruments.filter(i => platformIds.has(i.platform_id));
        const instrumentCounts = this._getInstrumentCounts(typeInstruments);

        const html = `
            <div class="platform-type-card" data-type="${this.type}">
                <div class="platform-type-header type-${this.type}"
                     onclick="window.DashboardState.togglePlatformType('${this.type}')"
                     style="background: ${this.config.gradient}">
                    <div class="platform-type-title">
                        <i class="fas ${this.config.icon}"></i>
                        <span>${this.config.label}</span>
                    </div>
                    <div class="platform-type-meta">
                        <span class="platform-type-count">${platforms.length}</span>
                        <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'} expand-icon"></i>
                    </div>
                </div>

                ${this._renderInstrumentSummary(instrumentCounts)}

                <div class="platform-type-content ${isExpanded ? 'expanded' : 'collapsed'}">
                    ${this._renderPlatformList(platforms, instruments, canEdit, isAdmin)}
                </div>
            </div>
        `;

        // Update or create element
        if (this.element) {
            this.element.outerHTML = html;
            this.element = this.container.querySelector(`[data-type="${this.type}"]`);
        } else {
            this.container.insertAdjacentHTML('beforeend', html);
            this.element = this.container.querySelector(`[data-type="${this.type}"]`);
        }

        // Attach event listeners
        this._attachEventListeners();
    }

    /**
     * Get instrument counts by category
     */
    _getInstrumentCounts(instruments) {
        const counts = {};

        for (const instrument of instruments) {
            const category = this._getInstrumentCategory(instrument.instrument_type);
            counts[category] = (counts[category] || 0) + 1;
        }

        return counts;
    }

    /**
     * Get instrument category from type string
     * Uses ConfigService for pattern matching, falls back to hardcoded logic
     */
    _getInstrumentCategory(type) {
        if (!type) return 'other';

        // Try ConfigService first (YAML-based patterns)
        if (window.SitesConfig && window.SitesConfig.isLoaded()) {
            return window.SitesConfig.detectInstrumentCategory(type);
        }

        // Fallback to hardcoded logic
        const t = type.toLowerCase();

        if (t.includes('phenocam')) return 'phenocam';
        if (t.includes('hyperspectral')) return 'hyperspectral';
        if (t.includes('multispectral') || t.includes('skye') || t.includes('decagon')) return 'multispectral';
        if (t.includes('par')) return 'par';
        if (t.includes('ndvi')) return 'ndvi';
        if (t.includes('pri')) return 'pri';

        return 'other';
    }

    /**
     * Render instrument summary badges
     */
    _renderInstrumentSummary(counts) {
        if (Object.keys(counts).length === 0) {
            return '';
        }

        const badges = Object.entries(counts)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => {
                const config = this._getInstrumentTypeConfig(type);
                return `
                    <span class="instrument-count-badge" style="color: ${config.color}; background: ${config.background}">
                        <i class="fas ${config.icon}"></i>
                        <span>${count}</span>
                    </span>
                `;
            })
            .join('');

        return `
            <div class="instrument-summary">
                ${badges}
            </div>
        `;
    }

    /**
     * Get config for instrument type
     * Uses ConfigService for YAML-based config, falls back to hardcoded defaults
     */
    _getInstrumentTypeConfig(type) {
        // Try ConfigService first (YAML-based)
        if (window.SitesConfig && window.SitesConfig.isLoaded()) {
            const config = window.SitesConfig.getInstrumentType(type);
            if (config) {
                return {
                    icon: config.icon,
                    color: config.color,
                    background: config.background
                };
            }
        }

        // Fallback to hardcoded defaults
        const configs = {
            phenocam: { icon: 'fa-camera', color: '#2563eb', background: '#dbeafe' },
            multispectral: { icon: 'fa-satellite-dish', color: '#7c3aed', background: '#ede9fe' },
            par: { icon: 'fa-sun', color: '#f59e0b', background: '#fef3c7' },
            ndvi: { icon: 'fa-leaf', color: '#059669', background: '#d1fae5' },
            pri: { icon: 'fa-microscope', color: '#ec4899', background: '#fce7f3' },
            hyperspectral: { icon: 'fa-rainbow', color: '#6366f1', background: '#e0e7ff' },
            other: { icon: 'fa-cube', color: '#6b7280', background: '#f3f4f6' }
        };
        return configs[type] || configs.other;
    }

    /**
     * Render platform list
     */
    _renderPlatformList(platforms, instruments, canEdit, isAdmin) {
        if (platforms.length === 0) {
            return `
                <div class="platform-list-empty">
                    <i class="fas fa-inbox"></i>
                    <span>No ${this.config.label.toLowerCase()} found</span>
                </div>
            `;
        }

        const items = platforms.map(platform => {
            // Use == to allow type coercion (platform_id may be string or number)
            const platformInstruments = instruments.filter(i => i.platform_id == platform.id);
            return this._renderPlatformItem(platform, platformInstruments, canEdit, isAdmin);
        }).join('');

        return `<div class="platform-list">${items}</div>`;
    }

    /**
     * Render a single platform item
     */
    _renderPlatformItem(platform, instruments, canEdit, isAdmin) {
        const instrumentDots = instruments.slice(0, 6).map(i => {
            const config = this._getInstrumentTypeConfig(this._getInstrumentCategory(i.instrument_type));
            return `<span class="instrument-dot" style="background: ${config.color}" title="${i.display_name || i.normalized_name}"></span>`;
        }).join('');

        const moreCount = instruments.length > 6 ? instruments.length - 6 : 0;

        return `
            <div class="platform-item"
                 data-platform-id="${platform.id}"
                 onclick="PlatformTypeCard.handlePlatformClick('${platform.id}')">
                <div class="platform-item-info">
                    <span class="platform-item-name">${platform.display_name || platform.normalized_name}</span>
                    <span class="platform-item-ecosystem">${platform.ecosystem_code || 'N/A'}</span>
                </div>
                <div class="platform-item-actions">
                    <div class="platform-item-instruments">
                        ${instrumentDots}
                        ${moreCount > 0 ? `<span class="instrument-more">+${moreCount}</span>` : ''}
                    </div>
                    ${isAdmin ? `
                        <button class="admin-delete-btn"
                                onclick="event.stopPropagation(); PlatformTypeCard.handleDeletePlatform(${platform.id}, '${platform.display_name || platform.normalized_name}')"
                                title="Delete Platform">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Event listeners are attached via onclick attributes for simplicity
        // In a more complex app, use event delegation
    }

    /**
     * Clean up
     */
    destroy() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
        if (this.element) {
            this.element.remove();
        }
    }

    // =========================================================================
    // STATIC METHODS (for onclick handlers)
    // =========================================================================

    static handlePlatformClick(platformId) {
        const state = window.DashboardState.getState();
        const allPlatforms = [
            ...state.platformsByType.fixed,
            ...state.platformsByType.uav,
            ...state.platformsByType.satellite,
            ...state.platformsByType.mobile
        ];

        // Use == for type coercion
        const platform = allPlatforms.find(p => p.id == platformId);
        if (platform) {
            window.DashboardState.selectPlatform(platform);
            // Navigate or open modal
            if (typeof showPlatformDetail === 'function') {
                showPlatformDetail(platform);
            }
        }
    }

    static handleDeletePlatform(platformId, platformName) {
        if (!window.DashboardState.canDelete()) {
            Utils.showToast('Only admins can delete platforms', 'error');
            return;
        }

        // Open delete confirmation modal
        window.DashboardState.openModal('delete-confirmation', {
            entityType: 'platform',
            entityId: platformId,
            entityName: platformName
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformTypeCard;
}
