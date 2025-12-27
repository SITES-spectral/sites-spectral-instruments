/**
 * SITES Spectral - Campaign Panel Component
 *
 * Renders campaign cards for the station dashboard using safe DOM methods.
 * Extracted from station-dashboard.js for modularity.
 *
 * @module dashboard/campaign-panel
 * @version 13.16.0
 */

(function(global) {
    'use strict';

    const logger = global.Debug?.withCategory('CampaignPanel') || {
        log: () => {},
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    /**
     * Create element with attributes and optional text content
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Attributes to set
     * @param {string} [text] - Optional text content
     * @returns {HTMLElement}
     */
    function createElement(tag, attrs = {}, text = null) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key.startsWith('data-')) {
                el.setAttribute(key, value);
            } else {
                el.setAttribute(key, value);
            }
        });
        if (text !== null) {
            el.textContent = text;
        }
        return el;
    }

    /**
     * Create icon element
     * @param {string} iconClass - FontAwesome icon class (e.g., 'fa-calendar-alt')
     * @returns {HTMLElement}
     */
    function createIcon(iconClass) {
        const icon = document.createElement('i');
        icon.className = `fas ${iconClass}`;
        return icon;
    }

    /**
     * CampaignPanel - Manages campaign rendering
     */
    class CampaignPanel {
        /**
         * @param {Object} options
         * @param {string} options.containerId - Container element ID
         * @param {boolean} options.canEdit - Whether user can edit
         * @param {Function} options.onCreateClick - Callback when create is clicked
         * @param {Function} options.onViewClick - Callback when view is clicked
         */
        constructor(options = {}) {
            this.containerId = options.containerId || 'campaigns-list';
            this.canEdit = options.canEdit || false;
            this.onCreateClick = options.onCreateClick || (() => {});
            this.onViewClick = options.onViewClick || (() => {});
            this.campaigns = [];
        }

        /**
         * Update campaigns data
         * @param {Array} campaigns - Campaign data array
         */
        setCampaigns(campaigns) {
            this.campaigns = campaigns || [];
        }

        /**
         * Update edit permission
         * @param {boolean} canEdit
         */
        setCanEdit(canEdit) {
            this.canEdit = canEdit;
        }

        /**
         * Render the campaigns panel
         */
        render() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                logger.warn(`Container #${this.containerId} not found`);
                return;
            }

            // Clear container
            container.textContent = '';

            if (this.campaigns.length === 0) {
                container.appendChild(this._createEmptyState());
                return;
            }

            this.campaigns.forEach(campaign => {
                container.appendChild(this._createCampaignCard(campaign));
            });
        }

        /**
         * Create empty state element
         * @private
         * @returns {HTMLElement}
         */
        _createEmptyState() {
            const wrapper = createElement('div', { className: 'empty-state-small' });

            wrapper.appendChild(createIcon('fa-calendar-alt'));

            const message = createElement('p', {}, 'No campaigns for this station');
            wrapper.appendChild(message);

            if (this.canEdit) {
                const btn = createElement('button', {
                    className: 'btn btn-primary btn-sm'
                });
                btn.appendChild(createIcon('fa-plus'));
                btn.appendChild(document.createTextNode(' Create Campaign'));
                btn.addEventListener('click', () => this.onCreateClick());
                wrapper.appendChild(btn);
            }

            return wrapper;
        }

        /**
         * Create campaign card element
         * @private
         * @param {Object} campaign - Campaign data
         * @returns {HTMLElement}
         */
        _createCampaignCard(campaign) {
            const card = createElement('div', {
                className: 'campaign-card',
                'data-campaign-id': String(campaign.id)
            });

            // Header
            const header = createElement('div', { className: 'campaign-header' });
            const title = createElement('h5', {}, campaign.name || 'Untitled Campaign');
            const statusClass = (campaign.status || 'pending').toLowerCase();
            const status = createElement('span', {
                className: `campaign-status status-${statusClass}`
            }, campaign.status || 'Pending');
            header.appendChild(title);
            header.appendChild(status);
            card.appendChild(header);

            // Dates
            const dates = createElement('div', { className: 'campaign-dates' });

            const startSpan = createElement('span');
            startSpan.appendChild(createIcon('fa-calendar-day'));
            const startDate = campaign.start_date
                ? new Date(campaign.start_date).toLocaleDateString()
                : 'N/A';
            startSpan.appendChild(document.createTextNode(' ' + startDate));
            dates.appendChild(startSpan);

            const arrowSpan = createElement('span');
            arrowSpan.appendChild(createIcon('fa-arrow-right'));
            dates.appendChild(arrowSpan);

            const endDate = campaign.end_date
                ? new Date(campaign.end_date).toLocaleDateString()
                : 'Ongoing';
            dates.appendChild(createElement('span', {}, endDate));
            card.appendChild(dates);

            // Description (optional)
            if (campaign.description) {
                const desc = createElement('p', { className: 'campaign-description' }, campaign.description);
                card.appendChild(desc);
            }

            // Actions
            const actions = createElement('div', { className: 'campaign-actions' });
            const viewBtn = createElement('button', { className: 'btn btn-sm' });
            viewBtn.appendChild(createIcon('fa-eye'));
            viewBtn.appendChild(document.createTextNode(' View'));
            viewBtn.addEventListener('click', () => this.onViewClick(campaign.id));
            actions.appendChild(viewBtn);
            card.appendChild(actions);

            return card;
        }
    }

    // Export
    global.CampaignPanel = CampaignPanel;

    logger.log('CampaignPanel module loaded');

})(typeof window !== 'undefined' ? window : global);
