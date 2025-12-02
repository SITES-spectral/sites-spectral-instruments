/**
 * Product Browser Component
 * SITES Spectral v9.0.0
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
 * @module products/product-browser
 * @version 9.0.0
 * @requires api-v3.js (window.sitesAPIv3)
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
    // FALLBACK PRODUCT TYPES (from YAML config)
    // =========================================================================

    const FALLBACK_PRODUCT_TYPES = {
        orthomosaic: {
            name: 'Orthomosaic',
            icon: 'fa-image',
            color: '#2563eb',
            background: '#dbeafe'
        },
        ndvi_map: {
            name: 'NDVI Map',
            icon: 'fa-leaf',
            color: '#22c55e',
            background: '#d1fae5'
        },
        point_cloud: {
            name: 'Point Cloud',
            icon: 'fa-cubes',
            color: '#8b5cf6',
            background: '#ede9fe'
        },
        thermal_map: {
            name: 'Thermal Map',
            icon: 'fa-temperature-high',
            color: '#ef4444',
            background: '#fee2e2'
        },
        dem: {
            name: 'Digital Elevation Model',
            icon: 'fa-mountain',
            color: '#78716c',
            background: '#f5f5f4'
        },
        dsm: {
            name: 'Digital Surface Model',
            icon: 'fa-layer-group',
            color: '#06b6d4',
            background: '#cffafe'
        },
        reflectance: {
            name: 'Surface Reflectance',
            icon: 'fa-adjust',
            color: '#7c3aed',
            background: '#ede9fe'
        },
        classification_map: {
            name: 'Classification Map',
            icon: 'fa-map',
            color: '#f59e0b',
            background: '#fef3c7'
        }
    };

    // =========================================================================
    // FALLBACK PROCESSING LEVELS
    // =========================================================================

    const FALLBACK_PROCESSING_LEVELS = {
        L0: {
            name: 'Raw Data',
            icon: 'fa-database',
            color: '#6b7280',
            description: 'Unprocessed sensor data'
        },
        L1: {
            name: 'Processed',
            icon: 'fa-cogs',
            color: '#3b82f6',
            description: 'Geometrically and radiometrically corrected'
        },
        L2: {
            name: 'Validated',
            icon: 'fa-check-double',
            color: '#22c55e',
            description: 'Quality controlled and validated'
        },
        L3: {
            name: 'Published',
            icon: 'fa-globe',
            color: '#7c3aed',
            description: 'Final product ready for distribution'
        }
    };

    // =========================================================================
    // SORT OPTIONS
    // =========================================================================

    const SORT_OPTIONS = {
        date: { label: 'Date', icon: 'fa-calendar' },
        name: { label: 'Name', icon: 'fa-font' },
        type: { label: 'Type', icon: 'fa-tag' },
        size: { label: 'Size', icon: 'fa-weight' }
    };

    // =========================================================================
    // CSS STYLES
    // =========================================================================

    const PRODUCT_BROWSER_STYLES = `
        /* Product Browser - Container */
        .product-browser {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            background: var(--bg-primary, #ffffff);
            border-radius: var(--radius-lg, 0.75rem);
            border: 1px solid var(--border-color, #e2e8f0);
            overflow: hidden;
        }

        .product-browser--loading {
            opacity: 0.7;
            pointer-events: none;
        }

        /* Header / Toolbar */
        .product-browser__header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 1rem 1.25rem;
            background: var(--bg-secondary, #f8fafc);
            border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .product-browser__title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary, #1e293b);
            margin: 0;
        }

        .product-browser__count {
            font-size: 0.875rem;
            color: var(--text-secondary, #64748b);
            margin-left: 0.5rem;
        }

        .product-browser__controls {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        /* View Mode Toggle */
        .product-browser__view-toggle {
            display: flex;
            background: var(--bg-tertiary, #f1f5f9);
            border-radius: var(--radius-md, 0.5rem);
            padding: 0.25rem;
        }

        .product-browser__view-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border: none;
            background: transparent;
            color: var(--text-secondary, #64748b);
            border-radius: var(--radius-sm, 0.375rem);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .product-browser__view-btn:hover {
            color: var(--text-primary, #1e293b);
            background: var(--bg-primary, #ffffff);
        }

        .product-browser__view-btn--active {
            background: var(--bg-primary, #ffffff);
            color: var(--primary-color, #2563eb);
            box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
        }

        /* Sort Control */
        .product-browser__sort {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .product-browser__sort-label {
            font-size: 0.875rem;
            color: var(--text-secondary, #64748b);
        }

        .product-browser__sort-select {
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

        .product-browser__sort-order {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--bg-primary, #ffffff);
            color: var(--text-secondary, #64748b);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .product-browser__sort-order:hover {
            border-color: var(--primary-color, #2563eb);
            color: var(--primary-color, #2563eb);
        }

        /* Filters Section */
        .product-browser__filters {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1.25rem;
            background: var(--bg-secondary, #f8fafc);
            border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .product-browser__filter-group {
            display: flex;
            align-items: center;
            gap: 0.375rem;
        }

        .product-browser__filter-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-secondary, #64748b);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .product-browser__filter-select,
        .product-browser__filter-input {
            padding: 0.375rem 0.75rem;
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--bg-primary, #ffffff);
            color: var(--text-primary, #1e293b);
            font-size: 0.875rem;
            min-width: 120px;
        }

        .product-browser__filter-input[type="date"] {
            min-width: 140px;
        }

        .product-browser__filter-reset {
            padding: 0.375rem 0.75rem;
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--bg-primary, #ffffff);
            color: var(--text-secondary, #64748b);
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .product-browser__filter-reset:hover {
            background: var(--bg-tertiary, #f1f5f9);
            color: var(--text-primary, #1e293b);
        }

        /* Content Area */
        .product-browser__content {
            padding: 1.25rem;
            min-height: 300px;
        }

        /* Grid View */
        .product-browser__grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
        }

        /* List View */
        .product-browser__list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        /* Product Card (Grid) */
        .product-card {
            display: flex;
            flex-direction: column;
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-md, 0.5rem);
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .product-card:hover {
            border-color: var(--primary-color, #2563eb);
            box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
            transform: translateY(-2px);
        }

        .product-card:focus {
            outline: 2px solid var(--primary-color, #2563eb);
            outline-offset: 2px;
        }

        .product-card__thumbnail {
            position: relative;
            width: 100%;
            height: 160px;
            background: var(--bg-tertiary, #f1f5f9);
            overflow: hidden;
        }

        .product-card__thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .product-card:hover .product-card__thumbnail img {
            transform: scale(1.05);
        }

        .product-card__thumbnail--placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            color: var(--text-muted, #94a3b8);
        }

        .product-card__thumbnail--placeholder i {
            font-size: 2rem;
        }

        .product-card__thumbnail--placeholder span {
            font-size: 0.75rem;
        }

        .product-card__level-badge {
            position: absolute;
            top: 0.5rem;
            left: 0.5rem;
            padding: 0.25rem 0.5rem;
            font-size: 0.625rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-radius: var(--radius-sm, 0.375rem);
            color: white;
        }

        .product-card__type-badge {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            color: white;
        }

        .product-card__body {
            padding: 1rem;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .product-card__header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 0.5rem;
        }

        .product-card__name {
            font-size: 0.9375rem;
            font-weight: 600;
            color: var(--text-primary, #1e293b);
            margin: 0;
            line-height: 1.3;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .product-card__type {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.8125rem;
            color: var(--text-secondary, #64748b);
        }

        .product-card__type i {
            font-size: 0.75rem;
        }

        .product-card__meta {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            font-size: 0.75rem;
            color: var(--text-secondary, #64748b);
            margin-top: auto;
        }

        .product-card__meta-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .product-card__meta-item i {
            font-size: 0.6875rem;
            opacity: 0.7;
        }

        .product-card__actions {
            display: flex;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: var(--bg-secondary, #f8fafc);
            border-top: 1px solid var(--border-color, #e2e8f0);
        }

        .product-card__action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.375rem;
            padding: 0.5rem;
            border: none;
            border-radius: var(--radius-sm, 0.375rem);
            background: transparent;
            color: var(--text-secondary, #64748b);
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .product-card__action-btn:hover {
            background: var(--bg-tertiary, #f1f5f9);
            color: var(--primary-color, #2563eb);
        }

        .product-card__action-btn--primary {
            background: var(--primary-color, #2563eb);
            color: white;
        }

        .product-card__action-btn--primary:hover {
            background: var(--primary-dark, #1e40af);
            color: white;
        }

        /* Product List Item */
        .product-list-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.875rem 1rem;
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-md, 0.5rem);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .product-list-item:hover {
            border-color: var(--primary-color, #2563eb);
            background: var(--bg-secondary, #f8fafc);
        }

        .product-list-item:focus {
            outline: 2px solid var(--primary-color, #2563eb);
            outline-offset: 2px;
        }

        .product-list-item__thumbnail {
            width: 60px;
            height: 60px;
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--bg-tertiary, #f1f5f9);
            overflow: hidden;
            flex-shrink: 0;
        }

        .product-list-item__thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .product-list-item__thumbnail--placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted, #94a3b8);
        }

        .product-list-item__content {
            flex: 1;
            min-width: 0;
        }

        .product-list-item__name {
            font-size: 0.9375rem;
            font-weight: 600;
            color: var(--text-primary, #1e293b);
            margin: 0 0 0.25rem 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .product-list-item__meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            font-size: 0.8125rem;
            color: var(--text-secondary, #64748b);
        }

        .product-list-item__meta-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .product-list-item__badges {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        .product-list-item__badge {
            padding: 0.25rem 0.5rem;
            font-size: 0.6875rem;
            font-weight: 600;
            border-radius: var(--radius-sm, 0.375rem);
            color: white;
        }

        .product-list-item__actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        .product-list-item__action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--bg-primary, #ffffff);
            color: var(--text-secondary, #64748b);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .product-list-item__action-btn:hover {
            border-color: var(--primary-color, #2563eb);
            color: var(--primary-color, #2563eb);
        }

        /* Empty State */
        .product-browser__empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1.5rem;
            text-align: center;
        }

        .product-browser__empty-icon {
            font-size: 3rem;
            color: var(--text-muted, #94a3b8);
            margin-bottom: 1rem;
        }

        .product-browser__empty-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary, #1e293b);
            margin: 0 0 0.5rem 0;
        }

        .product-browser__empty-message {
            font-size: 0.9375rem;
            color: var(--text-secondary, #64748b);
            margin: 0;
        }

        /* Loading State */
        .product-browser__loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1.5rem;
            color: var(--text-secondary, #64748b);
        }

        .product-browser__loading-spinner {
            font-size: 2rem;
            margin-bottom: 1rem;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Error State */
        .product-browser__error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1.5rem;
            text-align: center;
        }

        .product-browser__error-icon {
            font-size: 3rem;
            color: var(--danger-color, #dc2626);
            margin-bottom: 1rem;
        }

        .product-browser__error-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary, #1e293b);
            margin: 0 0 0.5rem 0;
        }

        .product-browser__error-message {
            font-size: 0.9375rem;
            color: var(--text-secondary, #64748b);
            margin: 0 0 1rem 0;
        }

        .product-browser__error-btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--primary-color, #2563eb);
            color: white;
            font-size: 0.875rem;
            cursor: pointer;
        }

        /* Footer / Pagination */
        .product-browser__footer {
            padding: 1rem 1.25rem;
            border-top: 1px solid var(--border-color, #e2e8f0);
            background: var(--bg-secondary, #f8fafc);
        }

        /* Product Detail Modal */
        .product-detail-modal {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.5);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .product-detail-modal--visible {
            opacity: 1;
            visibility: visible;
        }

        .product-detail-modal__content {
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            background: var(--bg-primary, #ffffff);
            border-radius: var(--radius-lg, 0.75rem);
            overflow: hidden;
            transform: scale(0.95);
            transition: transform 0.3s ease;
        }

        .product-detail-modal--visible .product-detail-modal__content {
            transform: scale(1);
        }

        .product-detail-modal__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .product-detail-modal__title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary, #1e293b);
            margin: 0;
        }

        .product-detail-modal__close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border: none;
            border-radius: var(--radius-sm, 0.375rem);
            background: transparent;
            color: var(--text-secondary, #64748b);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .product-detail-modal__close:hover {
            background: var(--bg-tertiary, #f1f5f9);
            color: var(--text-primary, #1e293b);
        }

        .product-detail-modal__body {
            padding: 1.25rem;
            overflow-y: auto;
            max-height: calc(90vh - 140px);
        }

        .product-detail-modal__preview {
            width: 100%;
            height: 300px;
            background: var(--bg-tertiary, #f1f5f9);
            border-radius: var(--radius-md, 0.5rem);
            overflow: hidden;
            margin-bottom: 1.5rem;
        }

        .product-detail-modal__preview img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .product-detail-modal__metadata {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }

        .product-detail-modal__meta-item {
            padding: 0.75rem;
            background: var(--bg-secondary, #f8fafc);
            border-radius: var(--radius-sm, 0.375rem);
        }

        .product-detail-modal__meta-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-secondary, #64748b);
            text-transform: uppercase;
            margin-bottom: 0.25rem;
        }

        .product-detail-modal__meta-value {
            font-size: 0.9375rem;
            color: var(--text-primary, #1e293b);
        }

        .product-detail-modal__footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            border-top: 1px solid var(--border-color, #e2e8f0);
            background: var(--bg-secondary, #f8fafc);
        }

        .product-detail-modal__btn {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color, #e2e8f0);
            border-radius: var(--radius-sm, 0.375rem);
            background: var(--bg-primary, #ffffff);
            color: var(--text-primary, #1e293b);
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .product-detail-modal__btn:hover {
            background: var(--bg-tertiary, #f1f5f9);
        }

        .product-detail-modal__btn--primary {
            background: var(--primary-color, #2563eb);
            border-color: var(--primary-color, #2563eb);
            color: white;
        }

        .product-detail-modal__btn--primary:hover {
            background: var(--primary-dark, #1e40af);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .product-browser__header {
                flex-direction: column;
                align-items: stretch;
            }

            .product-browser__controls {
                justify-content: space-between;
            }

            .product-browser__filters {
                flex-direction: column;
                align-items: stretch;
            }

            .product-browser__filter-group {
                flex-wrap: wrap;
            }

            .product-browser__grid {
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            }

            .product-list-item {
                flex-wrap: wrap;
            }

            .product-list-item__badges,
            .product-list-item__actions {
                width: 100%;
                justify-content: flex-start;
            }

            .product-detail-modal__metadata {
                grid-template-columns: 1fr;
            }
        }
    `;

    /** Track if styles have been injected */
    let stylesInjected = false;

    /**
     * Inject styles into the document
     * @private
     */
    function injectStyles() {
        if (stylesInjected) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'product-browser-styles';
        styleEl.textContent = PRODUCT_BROWSER_STYLES;
        document.head.appendChild(styleEl);
        stylesInjected = true;
    }

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
         * @private
         * @param {number} bytes - Size in bytes
         * @returns {string} Formatted size
         */
        _formatFileSize(bytes) {
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
         * @private
         * @param {string|Date} date - Date to format
         * @returns {string} Formatted date
         */
        _formatDate(date) {
            if (!date) return null;

            try {
                const d = new Date(date);
                if (isNaN(d.getTime())) return null;

                return d.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            } catch (error) {
                return null;
            }
        }

        /**
         * Escape HTML to prevent XSS
         * @private
         * @param {string} str - String to escape
         * @returns {string} Escaped string
         */
        _escapeHtml(str) {
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
