/**
 * Skeleton Screen Utilities
 * SITES Spectral v13.12.0
 *
 * Provides utilities for creating and managing skeleton loading states.
 * Replaces spinner-based loading with content-shaped placeholders.
 * Uses safe DOM methods (no innerHTML) to prevent XSS vulnerabilities.
 *
 * @module core/skeleton
 */

(function(global) {
    'use strict';

    /**
     * Helper to create an element with classes
     * @private
     */
    function createElement(tag, classes) {
        const el = document.createElement(tag);
        if (Array.isArray(classes)) {
            classes.forEach(c => el.classList.add(c));
        } else if (classes) {
            classes.split(' ').forEach(c => {
                if (c) el.classList.add(c);
            });
        }
        return el;
    }

    /**
     * Skeleton utility object
     */
    const Skeleton = {
        /**
         * Create a skeleton text element
         * @param {Object} options - Configuration options
         * @param {string} options.size - Size: 'sm', 'md', 'lg', 'title'
         * @param {string} options.width - Custom width (CSS value)
         * @returns {HTMLElement}
         */
        text(options = {}) {
            const { size = 'md', width } = options;
            const el = createElement('div', `skeleton skeleton-text skeleton-text--${size}`);
            if (width) {
                el.style.width = width;
            }
            return el;
        },

        /**
         * Create a skeleton avatar element
         * @param {Object} options - Configuration options
         * @param {string} options.size - Size: 'sm', 'md', 'lg'
         * @returns {HTMLElement}
         */
        avatar(options = {}) {
            const { size = 'md' } = options;
            return createElement('div', `skeleton skeleton-avatar skeleton-avatar--${size}`);
        },

        /**
         * Create a skeleton image placeholder
         * @param {Object} options - Configuration options
         * @param {string} options.variant - Variant: 'default', 'square', 'thumbnail'
         * @returns {HTMLElement}
         */
        image(options = {}) {
            const { variant = 'default' } = options;
            const el = createElement('div', 'skeleton skeleton-image');
            if (variant !== 'default') {
                el.classList.add(`skeleton-image--${variant}`);
            }
            return el;
        },

        /**
         * Create a skeleton button placeholder
         * @param {Object} options - Configuration options
         * @param {string} options.size - Size: 'sm', 'md', 'lg'
         * @returns {HTMLElement}
         */
        button(options = {}) {
            const { size = 'md' } = options;
            const el = createElement('div', 'skeleton skeleton-button');
            if (size !== 'md') {
                el.classList.add(`skeleton-button--${size}`);
            }
            return el;
        },

        /**
         * Create a generic skeleton block
         * @param {Object} options - Configuration options
         * @param {string} options.width - Width (CSS value)
         * @param {string} options.height - Height (CSS value)
         * @param {string} options.borderRadius - Border radius (CSS value)
         * @returns {HTMLElement}
         */
        block(options = {}) {
            const { width = '100%', height = '1rem', borderRadius = '4px' } = options;
            const el = createElement('div', 'skeleton');
            el.style.width = width;
            el.style.height = height;
            el.style.borderRadius = borderRadius;
            return el;
        },

        /**
         * Create a station card skeleton
         * @returns {HTMLElement}
         */
        stationCard() {
            const card = createElement('div', 'skeleton-station-card');

            // Header
            const header = createElement('div', 'skeleton-station-card__header');
            header.appendChild(createElement('div', 'skeleton skeleton-station-card__icon'));

            const titleGroup = createElement('div', 'skeleton-station-card__title-group');
            titleGroup.appendChild(createElement('div', 'skeleton skeleton-station-card__title'));
            titleGroup.appendChild(createElement('div', 'skeleton skeleton-station-card__subtitle'));
            header.appendChild(titleGroup);

            card.appendChild(header);

            // Stats
            const stats = createElement('div', 'skeleton-station-card__stats');
            for (let i = 0; i < 3; i++) {
                stats.appendChild(createElement('div', 'skeleton skeleton-station-card__stat'));
            }
            card.appendChild(stats);

            return card;
        },

        /**
         * Create a platform card skeleton
         * @param {number} instrumentCount - Number of instrument placeholders
         * @returns {HTMLElement}
         */
        platformCard(instrumentCount = 3) {
            const card = createElement('div', 'skeleton-platform-card');

            // Header
            const header = createElement('div', 'skeleton-platform-card__header');
            header.appendChild(createElement('div', 'skeleton skeleton-platform-card__title'));
            header.appendChild(createElement('div', 'skeleton skeleton-platform-card__badge'));
            card.appendChild(header);

            // Instruments
            const instruments = createElement('div', 'skeleton-platform-card__instruments');
            for (let i = 0; i < instrumentCount; i++) {
                instruments.appendChild(createElement('div', 'skeleton skeleton-platform-card__instrument'));
            }
            card.appendChild(instruments);

            return card;
        },

        /**
         * Create a table row skeleton
         * @param {number} cellCount - Number of cells
         * @returns {HTMLElement}
         */
        tableRow(cellCount = 4) {
            const row = createElement('div', 'skeleton-table-row');

            for (let i = 0; i < cellCount; i++) {
                const cell = createElement('div', 'skeleton skeleton-table-row__cell');
                if (i === 0) {
                    cell.classList.add('skeleton-table-row__cell--id');
                } else if (i === 1) {
                    cell.classList.add('skeleton-table-row__cell--name');
                } else if (i === cellCount - 1) {
                    cell.classList.add('skeleton-table-row__cell--status');
                } else {
                    cell.style.flex = '1';
                }
                row.appendChild(cell);
            }

            return row;
        },

        /**
         * Create an instrument list item skeleton
         * @returns {HTMLElement}
         */
        instrumentItem() {
            const item = createElement('div', 'skeleton-instrument-item');

            item.appendChild(createElement('div', 'skeleton skeleton-instrument-item__icon'));

            const info = createElement('div', 'skeleton-instrument-item__info');
            info.appendChild(createElement('div', 'skeleton skeleton-instrument-item__name'));
            info.appendChild(createElement('div', 'skeleton skeleton-instrument-item__type'));
            item.appendChild(info);

            item.appendChild(createElement('div', 'skeleton skeleton-instrument-item__status'));

            return item;
        },

        /**
         * Create a stat card skeleton
         * @returns {HTMLElement}
         */
        statCard() {
            const card = createElement('div', 'skeleton-stat-card');
            card.appendChild(createElement('div', 'skeleton skeleton-stat-card__label'));
            card.appendChild(createElement('div', 'skeleton skeleton-stat-card__value'));
            return card;
        },

        /**
         * Create a chart skeleton
         * @returns {HTMLElement}
         */
        chart() {
            const chart = createElement('div', 'skeleton-chart');

            // Header
            const header = createElement('div', 'skeleton-chart__header');
            header.appendChild(createElement('div', 'skeleton skeleton-chart__title'));

            const legend = createElement('div', 'skeleton-chart__legend');
            legend.appendChild(createElement('div', 'skeleton skeleton-chart__legend-item'));
            legend.appendChild(createElement('div', 'skeleton skeleton-chart__legend-item'));
            header.appendChild(legend);

            chart.appendChild(header);
            chart.appendChild(createElement('div', 'skeleton skeleton-chart__area'));

            return chart;
        },

        /**
         * Create a form field skeleton
         * @returns {HTMLElement}
         */
        formField() {
            const field = createElement('div', 'skeleton-modal-content__field');
            field.appendChild(createElement('div', 'skeleton skeleton-modal-content__label'));
            field.appendChild(createElement('div', 'skeleton skeleton-modal-content__input'));
            return field;
        },

        /**
         * Replace element content with skeleton loading state
         * @param {HTMLElement} container - Container element
         * @param {Function} skeletonBuilder - Function that returns skeleton elements
         * @returns {Function} Restore function to call when loading is complete
         */
        showIn(container, skeletonBuilder) {
            // Store original children
            const originalChildren = [];
            while (container.firstChild) {
                originalChildren.push(container.removeChild(container.firstChild));
            }

            // Add skeleton classes
            container.classList.add('skeleton-container', 'is-loading');

            // Add skeleton content
            const skeleton = skeletonBuilder();
            if (skeleton instanceof HTMLElement) {
                container.appendChild(skeleton);
            } else if (skeleton instanceof DocumentFragment) {
                container.appendChild(skeleton);
            } else if (Array.isArray(skeleton)) {
                skeleton.forEach(el => container.appendChild(el));
            }

            // Return restore function
            return function restore(newContent) {
                // Clear skeleton
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
                container.classList.remove('skeleton-container', 'is-loading');

                if (newContent !== undefined) {
                    if (newContent instanceof HTMLElement) {
                        container.appendChild(newContent);
                    } else if (newContent instanceof DocumentFragment) {
                        container.appendChild(newContent);
                    } else if (Array.isArray(newContent)) {
                        newContent.forEach(el => container.appendChild(el));
                    }
                } else {
                    // Restore original content
                    originalChildren.forEach(child => container.appendChild(child));
                }
            };
        },

        /**
         * Create multiple skeleton elements
         * @param {Function} builder - Builder function
         * @param {number} count - Number of elements to create
         * @returns {DocumentFragment}
         */
        repeat(builder, count) {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < count; i++) {
                fragment.appendChild(builder());
            }
            return fragment;
        },

        /**
         * Create a station list skeleton
         * @param {number} count - Number of stations
         * @returns {DocumentFragment}
         */
        stationList(count = 6) {
            return this.repeat(() => this.stationCard(), count);
        },

        /**
         * Create a platform list skeleton
         * @param {number} count - Number of platforms
         * @returns {DocumentFragment}
         */
        platformList(count = 4) {
            return this.repeat(() => this.platformCard(), count);
        },

        /**
         * Create a table skeleton
         * @param {number} rowCount - Number of rows
         * @param {number} cellCount - Cells per row
         * @returns {HTMLElement}
         */
        table(rowCount = 5, cellCount = 4) {
            const container = createElement('div', 'skeleton-table');
            for (let i = 0; i < rowCount; i++) {
                container.appendChild(this.tableRow(cellCount));
            }
            return container;
        },

        /**
         * Create a stats grid skeleton
         * @param {number} count - Number of stat cards
         * @returns {HTMLElement}
         */
        statsGrid(count = 4) {
            const grid = createElement('div', 'skeleton-stats-grid');
            for (let i = 0; i < count; i++) {
                grid.appendChild(this.statCard());
            }
            return grid;
        },

        /**
         * Create a modal form skeleton
         * @param {number} fieldCount - Number of form fields
         * @returns {HTMLElement}
         */
        modalForm(fieldCount = 6) {
            const container = createElement('div', 'skeleton-modal-content');
            const section = createElement('div', 'skeleton-modal-content__section');

            section.appendChild(createElement('div', 'skeleton skeleton-modal-content__section-title'));

            for (let i = 0; i < fieldCount; i++) {
                section.appendChild(this.formField());
            }

            container.appendChild(section);
            return container;
        },

        /**
         * Create an instrument list skeleton
         * @param {number} count - Number of instruments
         * @returns {HTMLElement}
         */
        instrumentList(count = 5) {
            const list = createElement('div', 'skeleton-instrument-list');
            for (let i = 0; i < count; i++) {
                list.appendChild(this.instrumentItem());
            }
            return list;
        }
    };

    // Export for module systems and make globally available
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Skeleton;
    }
    if (typeof global !== 'undefined') {
        global.Skeleton = Skeleton;
    }

})(typeof window !== 'undefined' ? window : this);
