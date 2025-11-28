/**
 * PAR Card - Instrument Card Renderer for PAR Sensors
 * SITES Spectral v8.0.0-alpha.2
 *
 * Renders compact instrument cards for platform view with:
 * - Status indicator
 * - Orientation badge
 * - Spectral range display
 * - Quick actions
 *
 * @module instruments/par/par-card
 * @version 8.0.0-alpha.2
 */

(function(global) {
    'use strict';

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    const STATUS_COLORS = {
        'Active': '#22c55e',
        'Inactive': '#94a3b8',
        'Testing': '#f59e0b',
        'Maintenance': '#ef4444',
        'Decommissioned': '#64748b',
        'Planned': '#3b82f6'
    };

    const STATUS_ICONS = {
        'Active': 'fa-check-circle',
        'Inactive': 'fa-pause-circle',
        'Testing': 'fa-flask',
        'Maintenance': 'fa-tools',
        'Decommissioned': 'fa-archive',
        'Planned': 'fa-calendar'
    };

    const ORIENTATION_LABELS = {
        'uplooking': 'Incoming PAR',
        'downlooking': 'Reflected PAR'
    };

    // =========================================================================
    // PAR CARD CLASS
    // =========================================================================

    /**
     * PAR sensor card renderer
     */
    class PARCard {
        /**
         * Create PAR card instance
         * @param {InstrumentManager} manager - Parent manager
         */
        constructor(manager) {
            /** @private - Manager reference */
            this._manager = manager;
        }

        /**
         * Render PAR sensor card
         * @param {Object} instrument - Instrument data
         * @param {Object} options - Render options
         * @returns {string} Card HTML
         */
        render(instrument, options = {}) {
            const {
                showActions = true,
                compact = false,
                onClick = null
            } = options;

            const status = instrument.status || 'Unknown';
            const statusColor = STATUS_COLORS[status] || '#94a3b8';
            const statusIcon = STATUS_ICONS[status] || 'fa-question-circle';

            const orientation = instrument.orientation || '';
            const orientationLabel = ORIENTATION_LABELS[orientation] || '';
            const spectralRange = instrument.spectral_range || '400-700';

            const cardClass = compact ? 'instrument-card compact' : 'instrument-card';
            const clickHandler = onClick ? `onclick="${onClick}"` : `onclick="showInstrumentEditModal(${JSON.stringify(instrument).replace(/"/g, '&quot;')})"`;

            return `
            <div class="${cardClass}" data-instrument-id="${instrument.id}" ${clickHandler}
                 role="button" tabindex="0" aria-label="Edit ${this._escapeHtml(instrument.display_name)}"
                 onkeydown="if(event.key==='Enter')this.click()">
                <div class="instrument-card-content">
                    <div class="instrument-card-header">
                        <span class="instrument-icon par-icon">
                            <i class="fas fa-sun" aria-hidden="true"></i>
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
                            <i class="fas fa-sun" aria-hidden="true"></i>
                            PAR Sensor
                        </span>
                        ${this._renderMetaBadges(instrument, spectralRange, orientationLabel)}
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
                 onclick="showInstrumentEditModal(${JSON.stringify(instrument).replace(/"/g, '&quot;')})"
                 role="button" tabindex="0">
                <span class="status-dot" style="background-color: ${statusColor};" aria-hidden="true"></span>
                <span class="instrument-icon"><i class="fas fa-sun" aria-hidden="true"></i></span>
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
            const spectralRange = instrument.spectral_range || '400-700';

            return `
            <tr data-instrument-id="${instrument.id}" class="clickable-row"
                onclick="showInstrumentEditModal(${JSON.stringify(instrument).replace(/"/g, '&quot;')})">
                <td>
                    <span class="status-dot" style="background-color: ${statusColor};" aria-hidden="true"></span>
                </td>
                <td>
                    <i class="fas fa-sun" aria-hidden="true"></i>
                    ${this._escapeHtml(instrument.display_name)}
                </td>
                <td><code>${this._escapeHtml(instrument.normalized_name)}</code></td>
                <td>${status}</td>
                <td>${instrument.sensor_brand || '-'} ${instrument.sensor_model || ''}</td>
                <td>${spectralRange} nm</td>
                <td>${ORIENTATION_LABELS[instrument.orientation] || '-'}</td>
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
         * Render meta badges
         * @private
         */
        _renderMetaBadges(instrument, spectralRange, orientationLabel) {
            const badges = [];

            // Spectral range badge
            badges.push(`
                <span class="meta-badge" title="Spectral range: ${spectralRange} nm">
                    <i class="fas fa-wave-square" aria-hidden="true"></i>
                    ${spectralRange} nm
                </span>
            `);

            // Orientation badge
            if (orientationLabel) {
                badges.push(`
                    <span class="meta-badge" title="${orientationLabel}">
                        <i class="fas fa-arrow-${instrument.orientation === 'uplooking' ? 'up' : 'down'}" aria-hidden="true"></i>
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

            if (instrument.sensor_brand || instrument.sensor_model) {
                const sensor = [instrument.sensor_brand, instrument.sensor_model]
                    .filter(Boolean).join(' ');
                details.push(`
                    <div class="detail-item">
                        <i class="fas fa-tag" aria-hidden="true"></i>
                        <span>${this._escapeHtml(sensor)}</span>
                    </div>
                `);
            }

            if (instrument.calibration_coefficient) {
                details.push(`
                    <div class="detail-item">
                        <i class="fas fa-sliders-h" aria-hidden="true"></i>
                        <span>Cal: ${instrument.calibration_coefficient}</span>
                    </div>
                `);
            }

            if (instrument.datalogger_type) {
                details.push(`
                    <div class="detail-item">
                        <i class="fas fa-microchip" aria-hidden="true"></i>
                        <span>${this._escapeHtml(instrument.datalogger_type)}</span>
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
                <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); viewCalibration('${instrument.id}')"
                        aria-label="View calibration" title="Calibration">
                    <i class="fas fa-chart-line" aria-hidden="true"></i>
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
        module.exports = PARCard;
    }

    // Export for browser global
    global.PARCard = PARCard;

})(typeof window !== 'undefined' ? window : global);
