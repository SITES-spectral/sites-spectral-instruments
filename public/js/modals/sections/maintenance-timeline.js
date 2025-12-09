/**
 * Maintenance Timeline Section
 * SITES Spectral v11.0.0-alpha.32
 *
 * Displays and manages maintenance records for platforms and instruments:
 * - Timeline visualization with status badges
 * - Quick-complete actions for pending maintenance
 * - CRUD operations for maintenance records
 * - Permission-aware editing (station admins, global admins)
 */

class MaintenanceTimelineSection {
    /**
     * Render maintenance timeline section
     * @param {Object} entity - Platform or instrument data
     * @param {string} entityType - 'platform' or 'instrument'
     * @param {Object} [options={}] - Configuration options
     * @param {boolean} [options.canEdit=false] - Whether user can edit
     * @returns {string} HTML string
     */
    static render(entity, entityType, options = {}) {
        const canEdit = options.canEdit || false;

        return `
            <div class="form-section" data-section="maintenance-timeline">
                <h4 class="form-section-header" onclick="toggleSection(this)">
                    <i class="fas fa-tools" aria-hidden="true"></i>
                    <span>Maintenance Timeline</span>
                    <i class="fas fa-chevron-down section-toggle-icon" aria-hidden="true"></i>
                </h4>
                <div class="form-section-content">
                    <div id="maintenance-timeline-container"
                         data-entity-type="${entityType}"
                         data-entity-id="${entity.id}"
                         data-can-edit="${canEdit}">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Loading maintenance history...</span>
                        </div>
                    </div>
                    ${canEdit ? MaintenanceTimelineSection._renderAddButton() : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render add maintenance button
     * @private
     */
    static _renderAddButton() {
        return `
            <div class="form-group full-width mt-3">
                <button type="button"
                        class="btn btn-outline-primary"
                        onclick="MaintenanceTimelineSection.showAddModal()">
                    <i class="fas fa-plus"></i> Schedule Maintenance
                </button>
            </div>
        `;
    }

    /**
     * Initialize section after DOM is ready
     * Loads maintenance timeline from API
     */
    static async init() {
        const container = document.getElementById('maintenance-timeline-container');
        if (!container) return;

        const entityType = container.dataset.entityType;
        const entityId = container.dataset.entityId;
        const canEdit = container.dataset.canEdit === 'true';

        if (!entityId) {
            container.innerHTML = '<p class="text-muted">No entity ID provided</p>';
            return;
        }

        try {
            const response = await window.sitesAPIv3.getMaintenanceTimeline(entityType, entityId);
            const records = response.data || [];

            MaintenanceTimelineSection._renderTimeline(container, records, canEdit);
        } catch (error) {
            console.error('Failed to load maintenance timeline:', error);
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Unable to load maintenance history: ${error.message}</span>
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
                    <p class="mt-2 text-muted">No maintenance records found</p>
                    ${canEdit ? '<p class="text-muted small">Click "Schedule Maintenance" to add the first record</p>' : ''}
                </div>
            `;
            return;
        }

        const timelineHtml = records.map(record => MaintenanceTimelineSection._renderRecord(record, canEdit)).join('');

        container.innerHTML = `
            <div class="maintenance-timeline">
                ${timelineHtml}
            </div>
        `;
    }

    /**
     * Render single maintenance record
     * @private
     */
    static _renderRecord(record, canEdit) {
        const statusBadge = MaintenanceTimelineSection._getStatusBadge(record.status);
        const priorityBadge = MaintenanceTimelineSection._getPriorityBadge(record.priority);
        const isOverdue = MaintenanceTimelineSection._isOverdue(record);
        const overdueClass = isOverdue ? 'maintenance-record--overdue' : '';

        const dateDisplay = record.completed_date
            ? `Completed: ${MaintenanceTimelineSection._formatDate(record.completed_date)}`
            : record.scheduled_date
                ? `Scheduled: ${MaintenanceTimelineSection._formatDate(record.scheduled_date)}`
                : 'No date';

        const actions = canEdit && record.status !== 'completed'
            ? `
                <div class="maintenance-record-actions">
                    <button type="button"
                            class="btn btn-sm btn-success"
                            onclick="MaintenanceTimelineSection.quickComplete(${record.id})"
                            title="Mark as completed">
                        <i class="fas fa-check"></i>
                    </button>
                    <button type="button"
                            class="btn btn-sm btn-outline-secondary"
                            onclick="MaintenanceTimelineSection.showEditModal(${record.id})"
                            title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `
            : '';

        return `
            <div class="maintenance-record ${overdueClass}" data-record-id="${record.id}">
                <div class="maintenance-record-header">
                    <div class="maintenance-record-badges">
                        ${statusBadge}
                        ${priorityBadge}
                        ${isOverdue ? '<span class="badge badge-danger">OVERDUE</span>' : ''}
                    </div>
                    ${actions}
                </div>
                <div class="maintenance-record-content">
                    <div class="maintenance-record-type">
                        <i class="fas fa-wrench"></i>
                        <strong>${MaintenanceTimelineSection._escapeHtml(record.maintenance_type || 'Maintenance')}</strong>
                    </div>
                    <div class="maintenance-record-date">
                        <i class="fas fa-calendar"></i>
                        <span>${dateDisplay}</span>
                    </div>
                    ${record.description ? `
                        <div class="maintenance-record-description">
                            ${MaintenanceTimelineSection._escapeHtml(record.description)}
                        </div>
                    ` : ''}
                    ${record.performed_by ? `
                        <div class="maintenance-record-performer">
                            <i class="fas fa-user"></i>
                            <span>${MaintenanceTimelineSection._escapeHtml(record.performed_by)}</span>
                        </div>
                    ` : ''}
                    ${record.notes ? `
                        <div class="maintenance-record-notes">
                            <i class="fas fa-sticky-note"></i>
                            <span>${MaintenanceTimelineSection._escapeHtml(record.notes)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get status badge HTML
     * @private
     */
    static _getStatusBadge(status) {
        const statusConfig = {
            pending: { class: 'badge-warning', icon: 'clock', label: 'Pending' },
            in_progress: { class: 'badge-info', icon: 'spinner fa-spin', label: 'In Progress' },
            completed: { class: 'badge-success', icon: 'check-circle', label: 'Completed' },
            cancelled: { class: 'badge-secondary', icon: 'times-circle', label: 'Cancelled' }
        };

        const config = statusConfig[status] || statusConfig.pending;

        return `<span class="badge ${config.class}"><i class="fas fa-${config.icon}"></i> ${config.label}</span>`;
    }

    /**
     * Get priority badge HTML
     * @private
     */
    static _getPriorityBadge(priority) {
        const priorityConfig = {
            low: { class: 'badge-light', label: 'Low' },
            normal: { class: 'badge-secondary', label: 'Normal' },
            high: { class: 'badge-warning', label: 'High' },
            critical: { class: 'badge-danger', label: 'Critical' }
        };

        const config = priorityConfig[priority] || priorityConfig.normal;

        return `<span class="badge ${config.class}">${config.label}</span>`;
    }

    /**
     * Check if maintenance is overdue
     * @private
     */
    static _isOverdue(record) {
        if (record.status === 'completed' || record.status === 'cancelled') {
            return false;
        }

        if (!record.scheduled_date) {
            return false;
        }

        const scheduledDate = new Date(record.scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return scheduledDate < today;
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
     */
    static _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Quick-complete a maintenance record
     * @param {number} recordId - Maintenance record ID
     */
    static async quickComplete(recordId) {
        if (!confirm('Mark this maintenance as completed?')) {
            return;
        }

        try {
            await window.sitesAPIv3.completeMaintenanceRecord(recordId, {
                completed_date: new Date().toISOString().split('T')[0]
            });

            // Reload timeline
            await MaintenanceTimelineSection.init();

            // Show success notification
            MaintenanceTimelineSection._showNotification('Maintenance marked as completed', 'success');
        } catch (error) {
            console.error('Failed to complete maintenance:', error);
            MaintenanceTimelineSection._showNotification(`Failed to complete: ${error.message}`, 'error');
        }
    }

    /**
     * Show add maintenance modal
     */
    static showAddModal() {
        const container = document.getElementById('maintenance-timeline-container');
        if (!container) return;

        const entityType = container.dataset.entityType;
        const entityId = container.dataset.entityId;

        const modalHtml = MaintenanceTimelineSection._buildFormModal({
            title: 'Schedule Maintenance',
            entity_type: entityType,
            entity_id: entityId,
            isNew: true
        });

        MaintenanceTimelineSection._showModal(modalHtml);
    }

    /**
     * Show edit maintenance modal
     * @param {number} recordId - Maintenance record ID
     */
    static async showEditModal(recordId) {
        try {
            const response = await window.sitesAPIv3.getMaintenanceRecord(recordId);
            const record = response.data;

            const modalHtml = MaintenanceTimelineSection._buildFormModal({
                title: 'Edit Maintenance',
                ...record,
                isNew: false
            });

            MaintenanceTimelineSection._showModal(modalHtml);
        } catch (error) {
            console.error('Failed to load maintenance record:', error);
            MaintenanceTimelineSection._showNotification(`Failed to load: ${error.message}`, 'error');
        }
    }

    /**
     * Build form modal HTML
     * @private
     */
    static _buildFormModal(data) {
        const maintenanceTypes = [
            { value: 'routine', label: 'Routine Inspection' },
            { value: 'cleaning', label: 'Cleaning' },
            { value: 'repair', label: 'Repair' },
            { value: 'replacement', label: 'Part Replacement' },
            { value: 'firmware_update', label: 'Firmware Update' },
            { value: 'recalibration', label: 'Recalibration' },
            { value: 'other', label: 'Other' }
        ];

        const priorities = [
            { value: 'low', label: 'Low' },
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' }
        ];

        const typeOptions = maintenanceTypes.map(t =>
            `<option value="${t.value}" ${data.maintenance_type === t.value ? 'selected' : ''}>${t.label}</option>`
        ).join('');

        const priorityOptions = priorities.map(p =>
            `<option value="${p.value}" ${data.priority === p.value ? 'selected' : ''}>${p.label}</option>`
        ).join('');

        return `
            <div class="modal-overlay" onclick="MaintenanceTimelineSection.closeModal(event)">
                <div class="modal-content modal-maintenance" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h5><i class="fas fa-tools"></i> ${data.title}</h5>
                        <button type="button" class="modal-close" onclick="MaintenanceTimelineSection.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="maintenance-form" onsubmit="MaintenanceTimelineSection.saveRecord(event)">
                        <input type="hidden" name="id" value="${data.id || ''}">
                        <input type="hidden" name="entity_type" value="${data.entity_type}">
                        <input type="hidden" name="entity_id" value="${data.entity_id}">
                        <input type="hidden" name="is_new" value="${data.isNew}">

                        <div class="modal-body">
                            <div class="form-group">
                                <label for="maintenance-type">Maintenance Type *</label>
                                <select id="maintenance-type" name="maintenance_type" class="form-control" required>
                                    <option value="">Select type...</option>
                                    ${typeOptions}
                                </select>
                            </div>

                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="scheduled-date">Scheduled Date</label>
                                    <input type="date"
                                           id="scheduled-date"
                                           name="scheduled_date"
                                           class="form-control"
                                           value="${data.scheduled_date || ''}">
                                </div>
                                <div class="form-group col-md-6">
                                    <label for="priority">Priority</label>
                                    <select id="priority" name="priority" class="form-control">
                                        ${priorityOptions}
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="description">Description</label>
                                <textarea id="description"
                                          name="description"
                                          class="form-control"
                                          rows="3"
                                          placeholder="Describe the maintenance work...">${data.description || ''}</textarea>
                            </div>

                            <div class="form-group">
                                <label for="performed-by">Performed By</label>
                                <input type="text"
                                       id="performed-by"
                                       name="performed_by"
                                       class="form-control"
                                       placeholder="Name of technician or team"
                                       value="${data.performed_by || ''}">
                            </div>

                            <div class="form-group">
                                <label for="notes">Notes</label>
                                <textarea id="notes"
                                          name="notes"
                                          class="form-control"
                                          rows="2"
                                          placeholder="Additional notes...">${data.notes || ''}</textarea>
                            </div>

                            ${!data.isNew ? `
                                <div class="form-group">
                                    <label for="completed-date">Completion Date</label>
                                    <input type="date"
                                           id="completed-date"
                                           name="completed_date"
                                           class="form-control"
                                           value="${data.completed_date || ''}">
                                    <small class="form-text">Set this to mark as completed</small>
                                </div>
                            ` : ''}
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="MaintenanceTimelineSection.closeModal()">
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
     * Save maintenance record
     * @param {Event} event - Form submit event
     */
    static async saveRecord(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const isNew = formData.get('is_new') === 'true';

        const data = {
            entity_type: formData.get('entity_type'),
            entity_id: parseInt(formData.get('entity_id')),
            maintenance_type: formData.get('maintenance_type'),
            scheduled_date: formData.get('scheduled_date') || null,
            priority: formData.get('priority') || 'normal',
            description: formData.get('description') || null,
            performed_by: formData.get('performed_by') || null,
            notes: formData.get('notes') || null
        };

        // If completion date is set, mark as completed
        const completedDate = formData.get('completed_date');
        if (completedDate) {
            data.completed_date = completedDate;
            data.status = 'completed';
        }

        try {
            if (isNew) {
                await window.sitesAPIv3.createMaintenanceRecord(data);
                MaintenanceTimelineSection._showNotification('Maintenance scheduled successfully', 'success');
            } else {
                const id = parseInt(formData.get('id'));
                await window.sitesAPIv3.updateMaintenanceRecord(id, data);
                MaintenanceTimelineSection._showNotification('Maintenance updated successfully', 'success');
            }

            MaintenanceTimelineSection.closeModal();
            await MaintenanceTimelineSection.init();
        } catch (error) {
            console.error('Failed to save maintenance:', error);
            MaintenanceTimelineSection._showNotification(`Failed to save: ${error.message}`, 'error');
        }
    }

    /**
     * Show modal
     * @private
     */
    static _showModal(html) {
        // Remove existing modal
        const existing = document.getElementById('maintenance-modal-container');
        if (existing) existing.remove();

        // Create new modal container
        const container = document.createElement('div');
        container.id = 'maintenance-modal-container';
        container.innerHTML = html;
        document.body.appendChild(container);

        // Focus first input
        setTimeout(() => {
            const firstInput = container.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Close modal
     * @param {Event} [event] - Click event
     */
    static closeModal(event) {
        if (event && event.target !== event.currentTarget) return;

        const container = document.getElementById('maintenance-modal-container');
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
    module.exports = MaintenanceTimelineSection;
}
if (typeof window !== 'undefined') {
    window.MaintenanceTimelineSection = MaintenanceTimelineSection;
}
