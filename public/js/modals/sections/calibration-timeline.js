/**
 * Calibration Timeline Section
 * SITES Spectral v11.0.0-alpha.32
 *
 * Displays and manages calibration records for multispectral/hyperspectral instruments:
 * - Timeline visualization with expiry warnings
 * - Quality scoring and panel tracking
 * - CRUD operations for calibration records
 * - Permission-aware editing (station admins, global admins)
 */

class CalibrationTimelineSection {
    /**
     * Render calibration timeline section
     * @param {Object} instrument - Instrument data
     * @param {Object} [options={}] - Configuration options
     * @param {boolean} [options.canEdit=false] - Whether user can edit
     * @returns {string} HTML string
     */
    static render(instrument, options = {}) {
        const canEdit = options.canEdit || false;

        // Check if instrument type requires calibration
        const calibratableTypes = [
            'multispectral', 'hyperspectral', 'ms', 'hyp',
            'Multispectral Sensor', 'Hyperspectral', 'Multispectral'
        ];

        const needsCalibration = calibratableTypes.some(type =>
            instrument.instrument_type?.toLowerCase().includes(type.toLowerCase())
        );

        if (!needsCalibration) {
            return ''; // Skip section for non-calibratable instruments
        }

        return `
            <div class="form-section" data-section="calibration-timeline">
                <h4 class="form-section-header" onclick="toggleSection(this)">
                    <i class="fas fa-crosshairs" aria-hidden="true"></i>
                    <span>Calibration Timeline</span>
                    <i class="fas fa-chevron-down section-toggle-icon" aria-hidden="true"></i>
                </h4>
                <div class="form-section-content">
                    <div id="calibration-timeline-container"
                         data-instrument-id="${instrument.id}"
                         data-can-edit="${canEdit}">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Loading calibration history...</span>
                        </div>
                    </div>
                    ${canEdit ? CalibrationTimelineSection._renderAddButton() : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render add calibration button
     * @private
     */
    static _renderAddButton() {
        return `
            <div class="form-group full-width mt-3">
                <button type="button"
                        class="btn btn-outline-primary"
                        onclick="CalibrationTimelineSection.showAddModal()">
                    <i class="fas fa-plus"></i> Add Calibration Record
                </button>
            </div>
        `;
    }

    /**
     * Initialize section after DOM is ready
     * Loads calibration timeline from API
     */
    static async init() {
        const container = document.getElementById('calibration-timeline-container');
        if (!container) return;

        const instrumentId = container.dataset.instrumentId;
        const canEdit = container.dataset.canEdit === 'true';

        if (!instrumentId) {
            container.innerHTML = '<p class="text-muted">No instrument ID provided</p>';
            return;
        }

        try {
            const response = await window.sitesAPIv3.getCalibrationTimeline(instrumentId);
            const records = response.data || [];

            CalibrationTimelineSection._renderTimeline(container, records, canEdit);
        } catch (error) {
            console.error('Failed to load calibration timeline:', error);
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Unable to load calibration history: ${error.message}</span>
                </div>
            `;
        }
    }

    /**
     * Render timeline content
     * @private
     */
    static _renderTimeline(container, records, canEdit) {
        if (!records || records.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-check fa-2x text-muted"></i>
                    <p class="mt-2 text-muted">No calibration records found</p>
                    ${canEdit ? '<p class="text-muted small">Click "Add Calibration Record" to log a calibration</p>' : ''}
                </div>
            `;
            return;
        }

        // Sort by date, newest first
        const sortedRecords = records.sort((a, b) =>
            new Date(b.calibration_date) - new Date(a.calibration_date)
        );

        // Find current (most recent non-expired) calibration
        const currentCalibration = sortedRecords.find(r =>
            r.status !== 'expired' && !CalibrationTimelineSection._isExpired(r)
        );

        const timelineHtml = sortedRecords.map((record, index) =>
            CalibrationTimelineSection._renderRecord(record, canEdit, index === 0)
        ).join('');

        const warningHtml = CalibrationTimelineSection._renderExpiryWarning(currentCalibration);

        container.innerHTML = `
            ${warningHtml}
            <div class="calibration-timeline">
                ${timelineHtml}
            </div>
        `;
    }

    /**
     * Render expiry warning if applicable
     * @private
     */
    static _renderExpiryWarning(currentCalibration) {
        if (!currentCalibration) {
            return `
                <div class="alert alert-danger mb-3">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>No Valid Calibration</strong>
                    <p class="mb-0">This instrument has no current calibration. Please add a calibration record.</p>
                </div>
            `;
        }

        const daysUntilExpiry = CalibrationTimelineSection._getDaysUntilExpiry(currentCalibration);

        if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
            const alertClass = daysUntilExpiry <= 0 ? 'alert-danger' : 'alert-warning';
            const message = daysUntilExpiry <= 0
                ? 'Calibration has expired!'
                : `Calibration expires in ${daysUntilExpiry} days`;

            return `
                <div class="alert ${alertClass} mb-3">
                    <i class="fas fa-${daysUntilExpiry <= 0 ? 'exclamation-circle' : 'clock'}"></i>
                    <strong>${message}</strong>
                    <p class="mb-0">Schedule recalibration to maintain data quality.</p>
                </div>
            `;
        }

        return '';
    }

    /**
     * Render single calibration record
     * @private
     */
    static _renderRecord(record, canEdit, isCurrent) {
        const statusBadge = CalibrationTimelineSection._getStatusBadge(record);
        const qualityBadge = CalibrationTimelineSection._getQualityBadge(record.quality_score);
        const isExpired = CalibrationTimelineSection._isExpired(record);
        const currentBadge = isCurrent && !isExpired
            ? '<span class="badge badge-primary">CURRENT</span>'
            : '';

        const expiryInfo = record.expiration_date
            ? `<span class="text-muted">Expires: ${CalibrationTimelineSection._formatDate(record.expiration_date)}</span>`
            : '';

        const actions = canEdit && !isExpired
            ? `
                <div class="calibration-record-actions">
                    <button type="button"
                            class="btn btn-sm btn-outline-secondary"
                            onclick="CalibrationTimelineSection.showEditModal(${record.id})"
                            title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `
            : '';

        return `
            <div class="calibration-record ${isExpired ? 'calibration-record--expired' : ''}"
                 data-record-id="${record.id}">
                <div class="calibration-record-header">
                    <div class="calibration-record-badges">
                        ${currentBadge}
                        ${statusBadge}
                        ${qualityBadge}
                    </div>
                    ${actions}
                </div>
                <div class="calibration-record-content">
                    <div class="calibration-record-date">
                        <i class="fas fa-calendar"></i>
                        <strong>${CalibrationTimelineSection._formatDate(record.calibration_date)}</strong>
                        ${expiryInfo}
                    </div>
                    ${record.method ? `
                        <div class="calibration-record-method">
                            <i class="fas fa-flask"></i>
                            <span>${CalibrationTimelineSection._escapeHtml(record.method)}</span>
                        </div>
                    ` : ''}
                    ${record.certificate_number ? `
                        <div class="calibration-record-certificate">
                            <i class="fas fa-certificate"></i>
                            <span>Certificate: ${CalibrationTimelineSection._escapeHtml(record.certificate_number)}</span>
                        </div>
                    ` : ''}
                    ${record.performed_by ? `
                        <div class="calibration-record-performer">
                            <i class="fas fa-user"></i>
                            <span>${CalibrationTimelineSection._escapeHtml(record.performed_by)}</span>
                        </div>
                    ` : ''}
                    ${CalibrationTimelineSection._renderPanelInfo(record)}
                    ${CalibrationTimelineSection._renderAmbientConditions(record)}
                    ${record.notes ? `
                        <div class="calibration-record-notes">
                            <i class="fas fa-sticky-note"></i>
                            <span>${CalibrationTimelineSection._escapeHtml(record.notes)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render panel info (Spectralon panel tracking)
     * @private
     */
    static _renderPanelInfo(record) {
        if (!record.panel_serial_number && !record.panel_condition) {
            return '';
        }

        return `
            <div class="calibration-record-panel">
                <i class="fas fa-square"></i>
                <span>
                    Panel: ${CalibrationTimelineSection._escapeHtml(record.panel_serial_number || 'Unknown')}
                    ${record.panel_condition ? ` (${record.panel_condition})` : ''}
                </span>
            </div>
        `;
    }

    /**
     * Render ambient conditions
     * @private
     */
    static _renderAmbientConditions(record) {
        const conditions = [];

        if (record.cloud_cover) {
            conditions.push(`Cloud: ${record.cloud_cover}`);
        }
        if (record.solar_elevation !== null && record.solar_elevation !== undefined) {
            conditions.push(`Solar: ${record.solar_elevation}`);
        }
        if (record.temperature !== null && record.temperature !== undefined) {
            conditions.push(`Temp: ${record.temperature}C`);
        }

        if (conditions.length === 0) {
            return '';
        }

        return `
            <div class="calibration-record-conditions">
                <i class="fas fa-cloud-sun"></i>
                <span>${conditions.join(' | ')}</span>
            </div>
        `;
    }

    /**
     * Get status badge HTML
     * @private
     */
    static _getStatusBadge(record) {
        const isExpired = CalibrationTimelineSection._isExpired(record);

        if (isExpired || record.status === 'expired') {
            return '<span class="badge badge-secondary">Expired</span>';
        }

        const daysUntilExpiry = CalibrationTimelineSection._getDaysUntilExpiry(record);
        if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
            return '<span class="badge badge-warning">Expiring Soon</span>';
        }

        return '<span class="badge badge-success">Valid</span>';
    }

    /**
     * Get quality score badge
     * @private
     */
    static _getQualityBadge(qualityScore) {
        if (qualityScore === null || qualityScore === undefined) {
            return '';
        }

        let badgeClass = 'badge-secondary';
        let label = 'Unknown';

        if (qualityScore >= 90) {
            badgeClass = 'badge-success';
            label = 'Excellent';
        } else if (qualityScore >= 75) {
            badgeClass = 'badge-info';
            label = 'Good';
        } else if (qualityScore >= 50) {
            badgeClass = 'badge-warning';
            label = 'Fair';
        } else {
            badgeClass = 'badge-danger';
            label = 'Poor';
        }

        return `<span class="badge ${badgeClass}">${label} (${qualityScore}%)</span>`;
    }

    /**
     * Check if calibration is expired
     * @private
     */
    static _isExpired(record) {
        if (record.status === 'expired') {
            return true;
        }

        if (!record.expiration_date) {
            return false;
        }

        const expirationDate = new Date(record.expiration_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return expirationDate < today;
    }

    /**
     * Get days until expiry
     * @private
     */
    static _getDaysUntilExpiry(record) {
        if (!record.expiration_date) {
            return null;
        }

        const expirationDate = new Date(record.expiration_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diff = expirationDate - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Format date for display
     * @private
     */
    static _formatDate(dateString) {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-SE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     * @see core/security.js - Delegates to central implementation
     */
    static _escapeHtml(str) {
        return window.SitesSecurity?.escapeHtml?.(str) ?? (str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
    }

    /**
     * Show add calibration modal
     */
    static showAddModal() {
        const container = document.getElementById('calibration-timeline-container');
        if (!container) return;

        const instrumentId = container.dataset.instrumentId;

        const modalHtml = CalibrationTimelineSection._buildFormModal({
            title: 'Add Calibration Record',
            instrument_id: instrumentId,
            isNew: true
        });

        CalibrationTimelineSection._showModal(modalHtml);
    }

    /**
     * Show edit calibration modal
     * @param {number} recordId - Calibration record ID
     */
    static async showEditModal(recordId) {
        try {
            const response = await window.sitesAPIv3.getCalibrationRecord(recordId);
            const record = response.data;

            const modalHtml = CalibrationTimelineSection._buildFormModal({
                title: 'Edit Calibration Record',
                ...record,
                isNew: false
            });

            CalibrationTimelineSection._showModal(modalHtml);
        } catch (error) {
            console.error('Failed to load calibration record:', error);
            CalibrationTimelineSection._showNotification(`Failed to load: ${error.message}`, 'error');
        }
    }

    /**
     * Build form modal HTML
     * @private
     */
    static _buildFormModal(data) {
        const methods = [
            { value: 'spectralon_panel', label: 'Spectralon Panel Reference' },
            { value: 'tarp_target', label: 'Calibration Tarp Target' },
            { value: 'cross_calibration', label: 'Cross-Calibration' },
            { value: 'laboratory', label: 'Laboratory Calibration' },
            { value: 'vicarious', label: 'Vicarious Calibration' },
            { value: 'other', label: 'Other Method' }
        ];

        const panelConditions = [
            { value: 'new', label: 'New/Excellent' },
            { value: 'good', label: 'Good' },
            { value: 'fair', label: 'Fair - Minor Wear' },
            { value: 'poor', label: 'Poor - Needs Replacement' }
        ];

        const cloudCoverOptions = [
            { value: 'clear', label: 'Clear (0-10%)' },
            { value: 'few', label: 'Few Clouds (10-25%)' },
            { value: 'scattered', label: 'Scattered (25-50%)' },
            { value: 'broken', label: 'Broken (50-90%)' },
            { value: 'overcast', label: 'Overcast (90-100%)' },
            { value: 'intermittent', label: 'Intermittent' }
        ];

        const methodOptions = methods.map(m =>
            `<option value="${m.value}" ${data.method === m.value ? 'selected' : ''}>${m.label}</option>`
        ).join('');

        const conditionOptions = panelConditions.map(c =>
            `<option value="${c.value}" ${data.panel_condition === c.value ? 'selected' : ''}>${c.label}</option>`
        ).join('');

        const cloudOptions = cloudCoverOptions.map(c =>
            `<option value="${c.value}" ${data.cloud_cover === c.value ? 'selected' : ''}>${c.label}</option>`
        ).join('');

        return `
            <div class="modal-overlay" onclick="CalibrationTimelineSection.closeModal(event)">
                <div class="modal-content modal-calibration modal-lg" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h5><i class="fas fa-crosshairs"></i> ${data.title}</h5>
                        <button type="button" class="modal-close" onclick="CalibrationTimelineSection.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="calibration-form" onsubmit="CalibrationTimelineSection.saveRecord(event)">
                        <input type="hidden" name="id" value="${data.id || ''}">
                        <input type="hidden" name="instrument_id" value="${data.instrument_id}">
                        <input type="hidden" name="is_new" value="${data.isNew}">

                        <div class="modal-body">
                            <!-- Basic Info Section -->
                            <h6 class="section-title"><i class="fas fa-info-circle"></i> Basic Information</h6>

                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="calibration-date">Calibration Date *</label>
                                    <input type="date"
                                           id="calibration-date"
                                           name="calibration_date"
                                           class="form-control"
                                           value="${data.calibration_date || ''}"
                                           required>
                                </div>
                                <div class="form-group col-md-6">
                                    <label for="expiration-date">Expiration Date</label>
                                    <input type="date"
                                           id="expiration-date"
                                           name="expiration_date"
                                           class="form-control"
                                           value="${data.expiration_date || ''}">
                                    <small class="form-text">Typically 1-2 years after calibration</small>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="method">Calibration Method</label>
                                    <select id="method" name="method" class="form-control">
                                        <option value="">Select method...</option>
                                        ${methodOptions}
                                    </select>
                                </div>
                                <div class="form-group col-md-6">
                                    <label for="certificate-number">Certificate Number</label>
                                    <input type="text"
                                           id="certificate-number"
                                           name="certificate_number"
                                           class="form-control"
                                           placeholder="e.g., CAL-2025-001"
                                           value="${data.certificate_number || ''}">
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="performed-by">Performed By</label>
                                    <input type="text"
                                           id="performed-by"
                                           name="performed_by"
                                           class="form-control"
                                           placeholder="Name or organization"
                                           value="${data.performed_by || ''}">
                                </div>
                                <div class="form-group col-md-6">
                                    <label for="quality-score">Quality Score (0-100)</label>
                                    <input type="number"
                                           id="quality-score"
                                           name="quality_score"
                                           class="form-control"
                                           min="0"
                                           max="100"
                                           placeholder="e.g., 95"
                                           value="${data.quality_score || ''}">
                                </div>
                            </div>

                            <!-- Panel Info Section -->
                            <h6 class="section-title mt-3"><i class="fas fa-square"></i> Reference Panel</h6>

                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="panel-serial">Panel Serial Number</label>
                                    <input type="text"
                                           id="panel-serial"
                                           name="panel_serial_number"
                                           class="form-control"
                                           placeholder="e.g., SRT-99-A-1234"
                                           value="${data.panel_serial_number || ''}">
                                </div>
                                <div class="form-group col-md-6">
                                    <label for="panel-condition">Panel Condition</label>
                                    <select id="panel-condition" name="panel_condition" class="form-control">
                                        <option value="">Select condition...</option>
                                        ${conditionOptions}
                                    </select>
                                </div>
                            </div>

                            <!-- Ambient Conditions Section -->
                            <h6 class="section-title mt-3"><i class="fas fa-cloud-sun"></i> Ambient Conditions</h6>

                            <div class="form-row">
                                <div class="form-group col-md-4">
                                    <label for="cloud-cover">Cloud Cover</label>
                                    <select id="cloud-cover" name="cloud_cover" class="form-control">
                                        <option value="">Select...</option>
                                        ${cloudOptions}
                                    </select>
                                </div>
                                <div class="form-group col-md-4">
                                    <label for="solar-elevation">Solar Elevation</label>
                                    <input type="number"
                                           id="solar-elevation"
                                           name="solar_elevation"
                                           class="form-control"
                                           min="0"
                                           max="90"
                                           step="0.1"
                                           placeholder="30-60 optimal"
                                           value="${data.solar_elevation || ''}">
                                </div>
                                <div class="form-group col-md-4">
                                    <label for="temperature">Temperature (C)</label>
                                    <input type="number"
                                           id="temperature"
                                           name="temperature"
                                           class="form-control"
                                           step="0.1"
                                           placeholder="e.g., 20"
                                           value="${data.temperature || ''}">
                                </div>
                            </div>

                            <!-- Notes Section -->
                            <div class="form-group mt-3">
                                <label for="notes">Notes</label>
                                <textarea id="notes"
                                          name="notes"
                                          class="form-control"
                                          rows="3"
                                          placeholder="Additional observations, issues, or comments...">${data.notes || ''}</textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="CalibrationTimelineSection.closeModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Save calibration record
     * @param {Event} event - Form submit event
     */
    static async saveRecord(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const isNew = formData.get('is_new') === 'true';

        const data = {
            instrument_id: parseInt(formData.get('instrument_id')),
            calibration_date: formData.get('calibration_date'),
            expiration_date: formData.get('expiration_date') || null,
            method: formData.get('method') || null,
            certificate_number: formData.get('certificate_number') || null,
            performed_by: formData.get('performed_by') || null,
            quality_score: formData.get('quality_score') ? parseInt(formData.get('quality_score')) : null,
            panel_serial_number: formData.get('panel_serial_number') || null,
            panel_condition: formData.get('panel_condition') || null,
            cloud_cover: formData.get('cloud_cover') || null,
            solar_elevation: formData.get('solar_elevation') ? parseFloat(formData.get('solar_elevation')) : null,
            temperature: formData.get('temperature') ? parseFloat(formData.get('temperature')) : null,
            notes: formData.get('notes') || null
        };

        try {
            if (isNew) {
                await window.sitesAPIv3.createCalibrationRecord(data);
                CalibrationTimelineSection._showNotification('Calibration record created successfully', 'success');
            } else {
                const id = parseInt(formData.get('id'));
                await window.sitesAPIv3.updateCalibrationRecord(id, data);
                CalibrationTimelineSection._showNotification('Calibration record updated successfully', 'success');
            }

            CalibrationTimelineSection.closeModal();
            await CalibrationTimelineSection.init();
        } catch (error) {
            console.error('Failed to save calibration:', error);
            CalibrationTimelineSection._showNotification(`Failed to save: ${error.message}`, 'error');
        }
    }

    /**
     * Show modal
     * @private
     */
    static _showModal(html) {
        // Remove existing modal
        const existing = document.getElementById('calibration-modal-container');
        if (existing) existing.remove();

        // Create new modal container
        const container = document.createElement('div');
        container.id = 'calibration-modal-container';
        container.innerHTML = html;
        document.body.appendChild(container);

        // Focus first input
        setTimeout(() => {
            const firstInput = container.querySelector('input[type="date"], input[type="text"], select');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Close modal
     * @param {Event} [event] - Click event
     */
    static closeModal(event) {
        if (event && event.target !== event.currentTarget) return;

        const container = document.getElementById('calibration-modal-container');
        if (container) container.remove();
    }

    /**
     * Show notification
     * @private
     */
    static _showNotification(message, type) {
        // Use existing notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }

        // Simple fallback
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} notification-toast`;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i> ${message}`;
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 250px;';

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Export for module systems and make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalibrationTimelineSection;
}
if (typeof window !== 'undefined') {
    window.CalibrationTimelineSection = CalibrationTimelineSection;
}
