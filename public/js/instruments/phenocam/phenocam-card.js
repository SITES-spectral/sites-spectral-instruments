/**
 * Phenocam Card - Instrument Card Renderer for Phenocam Instruments
 * SITES Spectral v8.0.0-alpha.2
 *
 * Renders compact instrument cards for platform view with:
 * - Image preview (if available)
 * - Status indicator
 * - Quick actions
 * - ROI count badge
 *
 * @module instruments/phenocam/phenocam-card
 * @version 8.0.0-alpha.2
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CONSTANTS (with ConfigService fallbacks)
    // =========================================================================

    /**
     * Get status color from ConfigService or fallback
     */
    function getStatusColor(status) {
        if (window.SitesConfig && window.SitesConfig.isLoaded()) {
            return window.SitesConfig.getStatusColor(status);
        }
        // Fallback
        const colors = {
            'Active': '#22c55e',
            'Inactive': '#94a3b8',
            'Testing': '#f59e0b',
            'Maintenance': '#ef4444',
            'Decommissioned': '#64748b',
            'Planned': '#3b82f6'
        };
        return colors[status] || '#94a3b8';
    }

    /**
     * Get status icon from ConfigService or fallback
     */
    function getStatusIcon(status) {
        if (window.SitesConfig && window.SitesConfig.isLoaded()) {
            return window.SitesConfig.getStatusIcon(status);
        }
        // Fallback
        const icons = {
            'Active': 'fa-check-circle',
            'Inactive': 'fa-pause-circle',
            'Testing': 'fa-flask',
            'Maintenance': 'fa-tools',
            'Decommissioned': 'fa-archive',
            'Planned': 'fa-calendar'
        };
        return icons[status] || 'fa-question-circle';
    }

    // =========================================================================
    // PHENOCAM CARD CLASS
    // =========================================================================

    /**
     * Phenocam card renderer
     */
    class PhenocamCard {
        /**
         * Create phenocam card instance
         * @param {InstrumentManager} manager - Parent manager
         */
        constructor(manager) {
            /** @private - Manager reference */
            this._manager = manager;
        }

        /**
         * Render phenocam card
         * @param {Object} instrument - Instrument data
         * @param {Object} options - Render options
         * @returns {string} Card HTML
         */
        render(instrument, options = {}) {
            const {
                showPreview = true,
                showActions = true,
                compact = false,
                onClick = null
            } = options;

            const status = instrument.status || 'Unknown';
            const statusColor = getStatusColor(status);
            const statusIcon = getStatusIcon(status);

            const roiCount = instrument.roi_count || 0;
            const hasImage = instrument.preview_image_url || instrument.latest_image_url;
            const imageProcessing = instrument.image_processing_enabled;

            const cardClass = compact ? 'instrument-card compact' : 'instrument-card';
            // SECURITY FIX: Pass only instrument ID to prevent XSS via JSON in onclick
            const clickHandler = onClick ? `onclick="${onClick}"` : `onclick="showInstrumentEditModal(${instrument.id})"`;

            return `
            <div class="${cardClass}" data-instrument-id="${instrument.id}" ${clickHandler}
                 role="button" tabindex="0" aria-label="Edit ${this._escapeHtml(instrument.display_name)}"
                 onkeydown="if(event.key==='Enter')this.click()">
                ${showPreview ? this._renderPreview(instrument, hasImage) : ''}
                <div class="instrument-card-content">
                    <div class="instrument-card-header">
                        <span class="instrument-icon">
                            <i class="fas fa-camera" aria-hidden="true"></i>
                        </span>
                        <h4 class="instrument-name" title="${this._escapeHtml(instrument.display_name)}">
                            ${this._escapeHtml(instrument.display_name)}
                        </h4>
                        <span class="status-indicator" style="background-color: ${statusColor};"
                              title="${status}" aria-label="Status: ${status}">
                            <i class="fas ${statusIcon}" aria-hidden="true"></i>
                        </span>
                    </div>
                    <div class="instrument-card-meta">
                        <span class="instrument-type">
                            <i class="fas fa-camera" aria-hidden="true"></i>
                            Phenocam
                        </span>
                        ${this._renderMetaBadges(instrument, roiCount, imageProcessing)}
                    </div>
                    ${!compact ? this._renderDetails(instrument) : ''}
                </div>
                ${showActions ? this._renderActions(instrument) : ''}
            </div>
            `;
        }

        /**
         * Render compact list item
         * @param {Object} instrument - Instrument data
         * @returns {string} List item HTML
         */
        renderListItem(instrument) {
            const status = instrument.status || 'Unknown';
            const statusColor = STATUS_COLORS[status] || '#94a3b8';

            return `
            <div class="instrument-list-item" data-instrument-id="${instrument.id}"
                 onclick="showInstrumentEditModal(${instrument.id})"
                 role="button" tabindex="0" aria-label="Edit ${this._escapeHtml(instrument.display_name)}">
                <span class="status-dot" style="background-color: ${statusColor};" aria-hidden="true"></span>
                <span class="instrument-icon"><i class="fas fa-camera" aria-hidden="true"></i></span>
                <span class="instrument-name">${this._escapeHtml(instrument.display_name)}</span>
                <span class="instrument-id">${this._escapeHtml(instrument.normalized_name)}</span>
            </div>
            `;
        }

        /**
         * Render table row
         * @param {Object} instrument - Instrument data
         * @returns {string} Table row HTML
         */
        renderTableRow(instrument) {
            const status = instrument.status || 'Unknown';
            const statusColor = STATUS_COLORS[status] || '#94a3b8';
            const roiCount = instrument.roi_count || 0;

            // SECURITY FIX: Pass only instrument ID to prevent XSS via JSON in onclick
            return `
            <tr data-instrument-id="${instrument.id}" class="clickable-row"
                onclick="showInstrumentEditModal(${instrument.id})">
                <td>
                    <span class="status-dot" style="background-color: ${statusColor};" aria-hidden="true"></span>
                </td>
                <td>
                    <i class="fas fa-camera" aria-hidden="true"></i>
                    ${this._escapeHtml(instrument.display_name)}
                </td>
                <td><code>${this._escapeHtml(instrument.normalized_name)}</code></td>
                <td>${status}</td>
                <td>${instrument.camera_brand || '-'} ${instrument.camera_model || ''}</td>
                <td>${instrument.camera_resolution || '-'}</td>
                <td>
                    <span class="badge badge-secondary">${roiCount} ROI${roiCount !== 1 ? 's' : ''}</span>
                </td>
                <td>
                    <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); editInstrument('${instrument.id}')"
                            aria-label="Edit instrument">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                </td>
            </tr>
            `;
        }

        // =====================================================================
        // PRIVATE METHODS
        // =====================================================================

        /**
         * Render image preview
         * @private
         */
        _renderPreview(instrument, hasImage) {
            if (!hasImage) {
                return `
                <div class="instrument-card-preview no-image">
                    <i class="fas fa-camera" aria-hidden="true"></i>
                    <span>No preview</span>
                </div>
                `;
            }

            const imageUrl = instrument.preview_image_url || instrument.latest_image_url;

            // SECURITY FIX: Use data attribute instead of inline onerror to prevent XSS
            return `
            <div class="instrument-card-preview">
                <img src="${this._escapeHtml(imageUrl)}"
                     alt="Preview image for ${this._escapeHtml(instrument.display_name)}"
                     loading="lazy"
                     data-fallback="true"
                     class="preview-image">
            </div>
            `;
        }

        /**
         * Render meta badges
         * @private
         */
        _renderMetaBadges(instrument, roiCount, imageProcessing) {
            const badges = [];

            // ROI badge
            if (roiCount > 0) {
                badges.push(`
                    <span class="meta-badge" title="${roiCount} Region(s) of Interest">
                        <i class="fas fa-vector-square" aria-hidden="true"></i>
                        ${roiCount}
                    </span>
                `);
            }

            // Processing badge
            if (imageProcessing) {
                badges.push(`
                    <span class="meta-badge active" title="Image processing enabled">
                        <i class="fas fa-cog fa-spin" aria-hidden="true"></i>
                    </span>
                `);
            }

            return `<div class="meta-badges">${badges.join('')}</div>`;
        }

        /**
         * Render instrument details
         * @private
         */
        _renderDetails(instrument) {
            const details = [];

            if (instrument.camera_brand || instrument.camera_model) {
                const camera = [instrument.camera_brand, instrument.camera_model]
                    .filter(Boolean).join(' ');
                details.push(`
                    <div class="detail-item">
                        <i class="fas fa-tag" aria-hidden="true"></i>
                        <span>${this._escapeHtml(camera)}</span>
                    </div>
                `);
            }

            if (instrument.camera_resolution) {
                details.push(`
                    <div class="detail-item">
                        <i class="fas fa-expand" aria-hidden="true"></i>
                        <span>${this._escapeHtml(instrument.camera_resolution)}</span>
                    </div>
                `);
            }

            if (instrument.viewing_direction) {
                details.push(`
                    <div class="detail-item">
                        <i class="fas fa-compass" aria-hidden="true"></i>
                        <span>${this._escapeHtml(instrument.viewing_direction)}</span>
                    </div>
                `);
            }

            if (details.length === 0) {
                return '';
            }

            return `<div class="instrument-card-details">${details.join('')}</div>`;
        }

        /**
         * Render action buttons
         * @private
         */
        _renderActions(instrument) {
            return `
            <div class="instrument-card-actions">
                <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); editInstrument('${instrument.id}')"
                        aria-label="Edit instrument" title="Edit">
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
                <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); manageROIs('${instrument.id}')"
                        aria-label="Manage ROIs" title="ROIs">
                    <i class="fas fa-vector-square" aria-hidden="true"></i>
                </button>
                <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); viewImages('${instrument.id}')"
                        aria-label="View images" title="Images">
                    <i class="fas fa-images" aria-hidden="true"></i>
                </button>
            </div>
            `;
        }

        /**
         * Escape HTML to prevent XSS
         * @private
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
    }

    // =========================================================================
    // EXPORTS
    // =========================================================================

    // Export for ES6 modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PhenocamCard;
    }

    // Export for browser global
    global.PhenocamCard = PhenocamCard;

})(typeof window !== 'undefined' ? window : global);
