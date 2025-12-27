/**
 * SITES Spectral - Product Panel Component
 *
 * Renders product cards for the station dashboard using safe DOM methods.
 * Extracted from station-dashboard.js for modularity.
 *
 * @module dashboard/product-panel
 * @version 13.16.0
 */

(function(global) {
    'use strict';

    const logger = global.Debug?.withCategory('ProductPanel') || {
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
            } else if (key === 'href' || key === 'download') {
                el.setAttribute(key, value);
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
     * @param {string} iconClass - FontAwesome icon class
     * @returns {HTMLElement}
     */
    function createIcon(iconClass) {
        const icon = document.createElement('i');
        icon.className = `fas ${iconClass}`;
        return icon;
    }

    /**
     * ProductPanel - Manages product rendering
     */
    class ProductPanel {
        /**
         * @param {Object} options
         * @param {string} options.containerId - Container element ID
         * @param {boolean} options.canEdit - Whether user can edit
         * @param {Function} options.onViewClick - Callback when view is clicked
         */
        constructor(options = {}) {
            this.containerId = options.containerId || 'products-list';
            this.canEdit = options.canEdit || false;
            this.onViewClick = options.onViewClick || (() => {});
            this.products = [];
        }

        /**
         * Update products data
         * @param {Array} products - Product data array
         */
        setProducts(products) {
            this.products = products || [];
        }

        /**
         * Update edit permission
         * @param {boolean} canEdit
         */
        setCanEdit(canEdit) {
            this.canEdit = canEdit;
        }

        /**
         * Render the products panel
         */
        render() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                logger.warn(`Container #${this.containerId} not found`);
                return;
            }

            // Clear container
            container.textContent = '';

            if (this.products.length === 0) {
                container.appendChild(this._createEmptyState());
                return;
            }

            this.products.forEach(product => {
                container.appendChild(this._createProductCard(product));
            });
        }

        /**
         * Create empty state element
         * @private
         * @returns {HTMLElement}
         */
        _createEmptyState() {
            const wrapper = createElement('div', { className: 'empty-state-small' });

            wrapper.appendChild(createIcon('fa-box'));

            const message = createElement('p', {}, 'No products for this station');
            wrapper.appendChild(message);

            return wrapper;
        }

        /**
         * Create product card element
         * @private
         * @param {Object} product - Product data
         * @returns {HTMLElement}
         */
        _createProductCard(product) {
            const card = createElement('div', {
                className: 'product-card',
                'data-product-id': String(product.id)
            });

            // Header
            const header = createElement('div', { className: 'product-header' });

            if (product.level) {
                const levelBadge = createElement('span', { className: 'product-level' }, product.level);
                header.appendChild(levelBadge);
            }

            const title = createElement('h5', {}, product.name || product.type || 'Product');
            header.appendChild(title);
            card.appendChild(header);

            // Meta info
            const meta = createElement('div', { className: 'product-meta' });

            const dateSpan = createElement('span');
            dateSpan.appendChild(createIcon('fa-calendar'));
            const dateText = product.created_at
                ? new Date(product.created_at).toLocaleDateString()
                : 'N/A';
            dateSpan.appendChild(document.createTextNode(' ' + dateText));
            meta.appendChild(dateSpan);

            if (product.instrument_name) {
                const instrSpan = createElement('span');
                instrSpan.appendChild(createIcon('fa-camera'));
                instrSpan.appendChild(document.createTextNode(' ' + product.instrument_name));
                meta.appendChild(instrSpan);
            }

            card.appendChild(meta);

            // Actions
            const actions = createElement('div', { className: 'product-actions' });

            const viewBtn = createElement('button', { className: 'btn btn-sm' });
            viewBtn.appendChild(createIcon('fa-eye'));
            viewBtn.appendChild(document.createTextNode(' View'));
            viewBtn.addEventListener('click', () => this.onViewClick(product.id));
            actions.appendChild(viewBtn);

            if (product.download_url) {
                const downloadLink = createElement('a', {
                    className: 'btn btn-sm btn-success',
                    href: product.download_url,
                    download: ''
                });
                downloadLink.appendChild(createIcon('fa-download'));
                downloadLink.appendChild(document.createTextNode(' Download'));
                actions.appendChild(downloadLink);
            }

            card.appendChild(actions);

            return card;
        }
    }

    // Export
    global.ProductPanel = ProductPanel;

    logger.log('ProductPanel module loaded');

})(typeof window !== 'undefined' ? window : global);
