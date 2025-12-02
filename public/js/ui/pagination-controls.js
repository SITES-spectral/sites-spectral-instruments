/**
 * Pagination Controls Component
 *
 * Reusable pagination UI component for SITES Spectral V3 API responses.
 * Parses V3 pagination meta and links objects to provide intuitive navigation.
 *
 * @module ui/pagination-controls
 * @version 9.0.0
 *
 * @example
 * // Create pagination controls
 * const pagination = new PaginationControls({
 *     container: document.getElementById('pagination-container'),
 *     onPageChange: (page) => fetchData(page),
 *     onPageSizeChange: (limit) => fetchData(1, limit)
 * });
 *
 * // Update with API response
 * pagination.render(response.meta, response.links);
 */

(function(global) {
    'use strict';

    /**
     * Default configuration values
     * These can be overridden via window.SitesConfig
     * @private
     */
    const DEFAULT_CONFIG = {
        /** Available page size options */
        pageSizeOptions: [10, 25, 50, 100],
        /** Default page size */
        defaultPageSize: 25,
        /** Maximum visible page buttons (excluding first/last) */
        maxVisiblePages: 5,
        /** Collapse page buttons on mobile width (pixels) */
        mobileBreakpoint: 768,
        /** Show page size selector */
        showPageSizeSelector: true,
        /** Show total count display */
        showTotalCount: true,
        /** Enable keyboard navigation */
        enableKeyboardNavigation: true
    };

    /**
     * CSS styles for the pagination component
     * Injected once when first instance is created
     * @private
     */
    const PAGINATION_STYLES = `
        .pagination-controls {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 1rem;
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-md, 0.5rem);
            font-family: var(--font-family, inherit);
        }

        .pagination-controls--loading {
            opacity: 0.6;
            pointer-events: none;
        }

        .pagination-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--text-secondary, #64748b);
            font-size: 0.875rem;
        }

        .pagination-info__count {
            white-space: nowrap;
        }

        .pagination-nav {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .pagination-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 2.25rem;
            height: 2.25rem;
            padding: 0 0.5rem;
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--bg-primary, #ffffff);
            color: var(--text-primary, #1e293b);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            text-decoration: none;
        }

        .pagination-btn:hover:not(:disabled):not(.pagination-btn--active) {
            background: var(--bg-tertiary, #f1f5f9);
            border-color: var(--border-hover, #cbd5e1);
        }

        .pagination-btn:focus {
            outline: none;
            box-shadow: 0 0 0 2px var(--primary-color, #1e40af);
        }

        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .pagination-btn--active {
            background: var(--primary-color, #1e40af);
            border-color: var(--primary-color, #1e40af);
            color: #ffffff;
        }

        .pagination-btn--icon {
            font-size: 0.75rem;
        }

        .pagination-ellipsis {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 2.25rem;
            height: 2.25rem;
            color: var(--text-muted, #94a3b8);
            font-size: 0.875rem;
        }

        .pagination-page-size {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .pagination-page-size__label {
            color: var(--text-secondary, #64748b);
            font-size: 0.875rem;
            white-space: nowrap;
        }

        .pagination-page-size__select {
            padding: 0.375rem 2rem 0.375rem 0.75rem;
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--bg-primary, #ffffff);
            color: var(--text-primary, #1e293b);
            font-size: 0.875rem;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.5rem center;
        }

        .pagination-page-size__select:focus {
            outline: none;
            border-color: var(--primary-color, #1e40af);
            box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.2);
        }

        /* Responsive: Mobile layout */
        @media (max-width: 768px) {
            .pagination-controls {
                flex-direction: column;
                gap: 0.75rem;
            }

            .pagination-info {
                order: 1;
                width: 100%;
                justify-content: center;
            }

            .pagination-nav {
                order: 2;
                width: 100%;
                justify-content: center;
            }

            .pagination-page-size {
                order: 3;
                width: 100%;
                justify-content: center;
            }

            .pagination-btn--page-number {
                display: none;
            }

            .pagination-btn--page-number.pagination-btn--active {
                display: inline-flex;
            }

            .pagination-ellipsis {
                display: none;
            }
        }
    `;

    /** @private Track if styles have been injected */
    let stylesInjected = false;

    /**
     * Inject pagination styles into the document
     * @private
     */
    function injectStyles() {
        if (stylesInjected) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'pagination-controls-styles';
        styleEl.textContent = PAGINATION_STYLES;
        document.head.appendChild(styleEl);
        stylesInjected = true;
    }

    /**
     * PaginationControls Class
     *
     * Creates a reusable pagination UI component that works with V3 API responses.
     */
    class PaginationControls {
        /**
         * Create a PaginationControls instance
         * @param {Object} options - Configuration options
         * @param {HTMLElement} options.container - Container element to render into
         * @param {Function} [options.onPageChange] - Callback when page changes: (page: number) => void
         * @param {Function} [options.onPageSizeChange] - Callback when page size changes: (limit: number) => void
         * @param {Object} [options.config] - Optional config override
         */
        constructor(options) {
            if (!options.container) {
                throw new Error('PaginationControls: container element is required');
            }

            /** @private */
            this.container = options.container;

            /** @private */
            this.onPageChange = options.onPageChange || (() => {});

            /** @private */
            this.onPageSizeChange = options.onPageSizeChange || (() => {});

            /** @private */
            this.config = this._loadConfig(options.config);

            /** @private Current pagination state */
            this.state = {
                total: 0,
                page: 1,
                limit: this.config.defaultPageSize,
                totalPages: 0,
                links: null,
                isLoading: false
            };

            /** @private Element reference */
            this.element = null;

            /** @private Bound event handlers for cleanup */
            this._boundKeyHandler = this._handleKeyNavigation.bind(this);

            // Initialize
            this._init();
        }

        /**
         * Initialize the component
         * @private
         */
        _init() {
            // Inject styles
            injectStyles();

            // Create container element
            this.element = document.createElement('div');
            this.element.className = 'pagination-controls';
            this.element.setAttribute('role', 'navigation');
            this.element.setAttribute('aria-label', 'Pagination');
            this.container.appendChild(this.element);

            // Setup keyboard navigation
            if (this.config.enableKeyboardNavigation) {
                document.addEventListener('keydown', this._boundKeyHandler);
            }

            // Initial render (empty state)
            this._render();
        }

        /**
         * Load configuration from YAML config service or use defaults
         * @private
         * @param {Object} [override] - Optional config override
         * @returns {Object} Merged configuration
         */
        _loadConfig(override) {
            let yamlConfig = {};

            // Try to get config from window.SitesConfig (YAML-based)
            if (global.SitesConfig && global.SitesConfig.isLoaded()) {
                const validationRules = global.SitesConfig.getValidationRules();
                if (validationRules && validationRules.pagination) {
                    yamlConfig = validationRules.pagination;
                }
            }

            // Merge: default -> yaml -> override
            return {
                ...DEFAULT_CONFIG,
                ...yamlConfig,
                ...override
            };
        }

        /**
         * Render pagination with V3 API response data
         * @param {Object} meta - V3 pagination meta object
         * @param {number} meta.total - Total number of items
         * @param {number} meta.page - Current page number
         * @param {number} meta.limit - Items per page
         * @param {number} meta.totalPages - Total number of pages
         * @param {Object} [links] - V3 pagination links object
         * @param {string} [links.first] - URL to first page
         * @param {string} [links.prev] - URL to previous page
         * @param {string} [links.next] - URL to next page
         * @param {string} [links.last] - URL to last page
         */
        render(meta, links) {
            if (!meta) {
                if (global.Debug) Debug.warn('PaginationControls: meta object is required');
                return;
            }

            this.state = {
                total: meta.total || 0,
                page: meta.page || 1,
                limit: meta.limit || this.config.defaultPageSize,
                totalPages: meta.totalPages || 0,
                links: links || null,
                isLoading: false
            };

            this._render();
        }

        /**
         * Update pagination state without full re-render
         * @param {Object} meta - V3 pagination meta object
         * @param {Object} [links] - V3 pagination links object
         */
        updateState(meta, links) {
            this.render(meta, links);
        }

        /**
         * Set current page programmatically
         * @param {number} page - Page number to set
         */
        setPage(page) {
            if (page < 1 || page > this.state.totalPages) {
                if (global.Debug) Debug.warn('PaginationControls: Invalid page number');
                return;
            }

            if (page !== this.state.page) {
                this.state.page = page;
                this.onPageChange(page);
            }
        }

        /**
         * Set loading state
         * @param {boolean} isLoading - Whether data is loading
         */
        setLoading(isLoading) {
            this.state.isLoading = isLoading;
            if (this.element) {
                this.element.classList.toggle('pagination-controls--loading', isLoading);
            }
        }

        /**
         * Internal render method
         * @private
         */
        _render() {
            if (!this.element) return;

            const { total, page, limit, totalPages } = this.state;

            // Calculate display range
            const start = total === 0 ? 0 : (page - 1) * limit + 1;
            const end = Math.min(page * limit, total);

            // Build HTML
            let html = '';

            // Total count display
            if (this.config.showTotalCount) {
                html += `
                    <div class="pagination-info">
                        <span class="pagination-info__count">
                            Showing ${start}-${end} of ${total}
                        </span>
                    </div>
                `;
            }

            // Navigation buttons
            html += this._renderNavigation(page, totalPages);

            // Page size selector
            if (this.config.showPageSizeSelector) {
                html += this._renderPageSizeSelector(limit);
            }

            this.element.innerHTML = html;

            // Attach event listeners
            this._attachEventListeners();
        }

        /**
         * Render navigation buttons
         * @private
         * @param {number} currentPage - Current page number
         * @param {number} totalPages - Total number of pages
         * @returns {string} HTML string
         */
        _renderNavigation(currentPage, totalPages) {
            if (totalPages <= 1) {
                return '<div class="pagination-nav"></div>';
            }

            const hasFirst = currentPage > 1;
            const hasPrev = currentPage > 1;
            const hasNext = currentPage < totalPages;
            const hasLast = currentPage < totalPages;

            let html = '<div class="pagination-nav">';

            // First page button
            html += `
                <button class="pagination-btn pagination-btn--icon"
                        data-action="first"
                        ${!hasFirst ? 'disabled' : ''}
                        aria-label="Go to first page"
                        title="First page">
                    <i class="fas fa-angles-left"></i>
                </button>
            `;

            // Previous page button
            html += `
                <button class="pagination-btn pagination-btn--icon"
                        data-action="prev"
                        ${!hasPrev ? 'disabled' : ''}
                        aria-label="Go to previous page"
                        title="Previous page">
                    <i class="fas fa-angle-left"></i>
                </button>
            `;

            // Page number buttons
            html += this._renderPageNumbers(currentPage, totalPages);

            // Next page button
            html += `
                <button class="pagination-btn pagination-btn--icon"
                        data-action="next"
                        ${!hasNext ? 'disabled' : ''}
                        aria-label="Go to next page"
                        title="Next page">
                    <i class="fas fa-angle-right"></i>
                </button>
            `;

            // Last page button
            html += `
                <button class="pagination-btn pagination-btn--icon"
                        data-action="last"
                        ${!hasLast ? 'disabled' : ''}
                        aria-label="Go to last page"
                        title="Last page">
                    <i class="fas fa-angles-right"></i>
                </button>
            `;

            html += '</div>';
            return html;
        }

        /**
         * Render page number buttons with ellipsis
         * @private
         * @param {number} currentPage - Current page number
         * @param {number} totalPages - Total number of pages
         * @returns {string} HTML string
         */
        _renderPageNumbers(currentPage, totalPages) {
            const maxVisible = this.config.maxVisiblePages;
            let html = '';

            // Calculate visible page range
            const pages = this._calculateVisiblePages(currentPage, totalPages, maxVisible);

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];

                if (page === 'ellipsis') {
                    html += '<span class="pagination-ellipsis" aria-hidden="true">...</span>';
                } else {
                    const isActive = page === currentPage;
                    html += `
                        <button class="pagination-btn pagination-btn--page-number ${isActive ? 'pagination-btn--active' : ''}"
                                data-action="page"
                                data-page="${page}"
                                ${isActive ? 'aria-current="page"' : ''}
                                aria-label="Go to page ${page}">
                            ${page}
                        </button>
                    `;
                }
            }

            return html;
        }

        /**
         * Calculate which page numbers to display
         * @private
         * @param {number} current - Current page
         * @param {number} total - Total pages
         * @param {number} max - Max visible pages
         * @returns {Array} Array of page numbers and 'ellipsis' markers
         */
        _calculateVisiblePages(current, total, max) {
            if (total <= max) {
                // Show all pages
                return Array.from({ length: total }, (_, i) => i + 1);
            }

            const pages = [];
            const half = Math.floor(max / 2);

            // Always show first page
            pages.push(1);

            // Calculate range around current page
            let start = Math.max(2, current - half + 1);
            let end = Math.min(total - 1, current + half - 1);

            // Adjust if at edges
            if (current <= half + 1) {
                end = max - 1;
            } else if (current >= total - half) {
                start = total - max + 2;
            }

            // Add ellipsis before range if needed
            if (start > 2) {
                pages.push('ellipsis');
            }

            // Add page numbers in range
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis after range if needed
            if (end < total - 1) {
                pages.push('ellipsis');
            }

            // Always show last page
            if (total > 1) {
                pages.push(total);
            }

            return pages;
        }

        /**
         * Render page size selector
         * @private
         * @param {number} currentLimit - Current page size
         * @returns {string} HTML string
         */
        _renderPageSizeSelector(currentLimit) {
            const options = this.config.pageSizeOptions
                .map(size => `
                    <option value="${size}" ${size === currentLimit ? 'selected' : ''}>
                        ${size}
                    </option>
                `)
                .join('');

            return `
                <div class="pagination-page-size">
                    <label class="pagination-page-size__label" for="pagination-page-size-select">
                        Per page:
                    </label>
                    <select class="pagination-page-size__select"
                            id="pagination-page-size-select"
                            data-action="page-size"
                            aria-label="Select number of items per page">
                        ${options}
                    </select>
                </div>
            `;
        }

        /**
         * Attach event listeners using event delegation
         * @private
         */
        _attachEventListeners() {
            if (!this.element) return;

            // Use event delegation for clicks
            this.element.onclick = (event) => {
                const target = event.target.closest('[data-action]');
                if (!target) return;

                const action = target.dataset.action;

                switch (action) {
                    case 'first':
                        this._goToPage(1);
                        break;
                    case 'prev':
                        this._goToPage(this.state.page - 1);
                        break;
                    case 'next':
                        this._goToPage(this.state.page + 1);
                        break;
                    case 'last':
                        this._goToPage(this.state.totalPages);
                        break;
                    case 'page':
                        const page = parseInt(target.dataset.page, 10);
                        if (!isNaN(page)) {
                            this._goToPage(page);
                        }
                        break;
                }
            };

            // Page size selector change
            const select = this.element.querySelector('[data-action="page-size"]');
            if (select) {
                select.onchange = (event) => {
                    const newLimit = parseInt(event.target.value, 10);
                    if (!isNaN(newLimit) && newLimit !== this.state.limit) {
                        this.state.limit = newLimit;
                        this.onPageSizeChange(newLimit);
                    }
                };
            }
        }

        /**
         * Navigate to a specific page
         * @private
         * @param {number} page - Page number
         */
        _goToPage(page) {
            if (page < 1 || page > this.state.totalPages || page === this.state.page) {
                return;
            }

            this.state.page = page;
            this.onPageChange(page);
        }

        /**
         * Handle keyboard navigation
         * @private
         * @param {KeyboardEvent} event - Keyboard event
         */
        _handleKeyNavigation(event) {
            // Only handle if pagination is focused or no specific element is focused
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'SELECT' ||
                activeElement.isContentEditable
            );

            if (isInputFocused) return;

            // Check if pagination element is visible
            if (!this.element || this.element.offsetParent === null) return;

            switch (event.key) {
                case 'ArrowLeft':
                    if (event.ctrlKey || event.metaKey) {
                        // Ctrl/Cmd + Left: Go to first page
                        this._goToPage(1);
                    } else {
                        // Left arrow: Previous page
                        this._goToPage(this.state.page - 1);
                    }
                    event.preventDefault();
                    break;

                case 'ArrowRight':
                    if (event.ctrlKey || event.metaKey) {
                        // Ctrl/Cmd + Right: Go to last page
                        this._goToPage(this.state.totalPages);
                    } else {
                        // Right arrow: Next page
                        this._goToPage(this.state.page + 1);
                    }
                    event.preventDefault();
                    break;
            }
        }

        /**
         * Get current pagination state
         * @returns {Object} Current state
         */
        getState() {
            return { ...this.state };
        }

        /**
         * Get current page
         * @returns {number} Current page number
         */
        getCurrentPage() {
            return this.state.page;
        }

        /**
         * Get current page size (limit)
         * @returns {number} Current page size
         */
        getPageSize() {
            return this.state.limit;
        }

        /**
         * Get total pages
         * @returns {number} Total number of pages
         */
        getTotalPages() {
            return this.state.totalPages;
        }

        /**
         * Get total items count
         * @returns {number} Total number of items
         */
        getTotalItems() {
            return this.state.total;
        }

        /**
         * Check if there is a next page
         * @returns {boolean} True if next page exists
         */
        hasNextPage() {
            return this.state.page < this.state.totalPages;
        }

        /**
         * Check if there is a previous page
         * @returns {boolean} True if previous page exists
         */
        hasPrevPage() {
            return this.state.page > 1;
        }

        /**
         * Show the pagination controls
         */
        show() {
            if (this.element) {
                this.element.style.display = '';
            }
        }

        /**
         * Hide the pagination controls
         */
        hide() {
            if (this.element) {
                this.element.style.display = 'none';
            }
        }

        /**
         * Clean up and destroy the component
         */
        destroy() {
            // Remove keyboard listener
            if (this.config.enableKeyboardNavigation) {
                document.removeEventListener('keydown', this._boundKeyHandler);
            }

            // Remove element
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }

            this.element = null;
            this.container = null;
        }
    }

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PaginationControls;
    }

    // Export for browser global
    global.PaginationControls = PaginationControls;

})(typeof window !== 'undefined' ? window : global);
