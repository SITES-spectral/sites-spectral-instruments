/**
 * Campaign Modal
 * SITES Spectral v11.0.0-alpha.36
 *
 * Modal for viewing and editing campaign details:
 * - Campaign information (name, description, type)
 * - Timeline (start/end dates, status)
 * - Participants and objectives
 * - Funding information
 * - CRUD operations
 *
 * Security: All user input is escaped via _escapeHtml() before DOM insertion
 */

class CampaignModal {
    /**
     * Campaign types with labels
     */
    static CAMPAIGN_TYPES = {
        field_campaign: 'Field Campaign',
        continuous_monitoring: 'Continuous Monitoring',
        calibration: 'Calibration Campaign',
        validation: 'Validation Campaign',
        experimental: 'Experimental'
    };

    /**
     * Campaign statuses with styling
     */
    static STATUSES = {
        planned: { label: 'Planned', class: 'badge-info', icon: 'calendar-alt' },
        active: { label: 'Active', class: 'badge-success', icon: 'play-circle' },
        completed: { label: 'Completed', class: 'badge-secondary', icon: 'check-circle' },
        cancelled: { label: 'Cancelled', class: 'badge-danger', icon: 'times-circle' },
        on_hold: { label: 'On Hold', class: 'badge-warning', icon: 'pause-circle' }
    };

    /**
     * Show campaign details modal
     * @param {Object} campaign - Campaign data
     * @param {Object} options - Display options
     */
    static show(campaign, options = {}) {
        const canEdit = options.canEdit || false;
        CampaignModal._renderDetailsModal(campaign, canEdit);
    }

    /**
     * Show create campaign modal
     * @param {number} stationId - Station ID
     * @param {Object} options - Options (platformId, aoiId)
     */
    static showCreate(stationId, options = {}) {
        CampaignModal._renderFormModal({
            title: 'Create Campaign',
            stationId: stationId,
            platformId: options.platformId || null,
            aoiId: options.aoiId || null,
            isNew: true
        });
    }

    /**
     * Show edit campaign modal
     * @param {Object} campaign - Campaign data
     */
    static showEdit(campaign) {
        CampaignModal._renderFormModal({
            title: 'Edit Campaign',
            ...campaign,
            isNew: false
        });
    }

    /**
     * Render details modal using safe DOM methods
     * @private
     */
    static _renderDetailsModal(campaign, canEdit) {
        const statusConfig = CampaignModal.STATUSES[campaign.status] || CampaignModal.STATUSES.planned;
        const typeLabel = CampaignModal.CAMPAIGN_TYPES[campaign.campaignType] || campaign.campaignType;

        // Remove existing modal
        const existing = document.getElementById('campaign-modal-container');
        if (existing) existing.remove();

        // Create modal container
        const container = document.createElement('div');
        container.id = 'campaign-modal-container';

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) CampaignModal.close();
        });

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'modal-content modal-campaign modal-lg';
        modal.addEventListener('click', (e) => e.stopPropagation());

        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const headerTitle = document.createElement('h5');
        const headerIcon = document.createElement('i');
        headerIcon.className = 'fas fa-flag';
        headerTitle.appendChild(headerIcon);
        headerTitle.appendChild(document.createTextNode(' Campaign Details'));
        
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'modal-close';
        closeBtn.addEventListener('click', () => CampaignModal.close());
        const closeIcon = document.createElement('i');
        closeIcon.className = 'fas fa-times';
        closeBtn.appendChild(closeIcon);
        
        header.appendChild(headerTitle);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';

        // Campaign header
        const campaignHeader = document.createElement('div');
        campaignHeader.className = 'campaign-header mb-4';
        
        const titleRow = document.createElement('div');
        titleRow.className = 'd-flex justify-content-between align-items-start';
        
        const titleDiv = document.createElement('div');
        const campaignTitle = document.createElement('h4');
        campaignTitle.className = 'mb-1';
        campaignTitle.textContent = campaign.name;
        titleDiv.appendChild(campaignTitle);
        
        const statusBadge = document.createElement('span');
        statusBadge.className = 'badge ' + statusConfig.class;
        const statusIcon = document.createElement('i');
        statusIcon.className = 'fas fa-' + statusConfig.icon;
        statusBadge.appendChild(statusIcon);
        statusBadge.appendChild(document.createTextNode(' ' + statusConfig.label));
        titleDiv.appendChild(statusBadge);
        
        const typeBadge = document.createElement('span');
        typeBadge.className = 'badge badge-outline-primary ml-2';
        typeBadge.textContent = typeLabel;
        titleDiv.appendChild(typeBadge);
        
        titleRow.appendChild(titleDiv);
        
        if (canEdit) {
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'btn btn-outline-primary btn-sm';
            editBtn.addEventListener('click', () => CampaignModal.showEdit(campaign));
            const editIcon = document.createElement('i');
            editIcon.className = 'fas fa-edit';
            editBtn.appendChild(editIcon);
            editBtn.appendChild(document.createTextNode(' Edit'));
            titleRow.appendChild(editBtn);
        }
        
        campaignHeader.appendChild(titleRow);
        
        if (campaign.description) {
            const descP = document.createElement('p');
            descP.className = 'text-muted mt-2 mb-0';
            descP.textContent = campaign.description;
            campaignHeader.appendChild(descP);
        }
        
        body.appendChild(campaignHeader);

        // Timeline section
        body.appendChild(CampaignModal._createSection('Timeline', 'calendar-alt', [
            { label: 'Start Date', value: CampaignModal._formatDate(campaign.startDate) },
            { label: 'End Date', value: campaign.endDate ? CampaignModal._formatDate(campaign.endDate) : 'Ongoing' },
            { label: 'Duration', value: CampaignModal._getDurationInfo(campaign) },
            { label: 'Status', value: statusConfig.label, badge: statusConfig.class }
        ]));

        // Objectives section
        const objectivesSection = CampaignModal._createListSection('Objectives', 'bullseye', 
            campaign.objectives, 'No objectives defined');
        body.appendChild(objectivesSection);

        // Expected Outcomes section
        const outcomesSection = CampaignModal._createListSection('Expected Outcomes', 'tasks', 
            campaign.expectedOutcomes, 'No expected outcomes defined');
        body.appendChild(outcomesSection);

        // Participants section
        const participantsSection = CampaignModal._createListSection('Participants', 'users', 
            campaign.participants, 'No participants assigned');
        body.appendChild(participantsSection);

        // Funding section
        if (campaign.fundingSource || campaign.budget) {
            const fundingItems = [];
            if (campaign.fundingSource) {
                fundingItems.push({ label: 'Funding Source', value: campaign.fundingSource });
            }
            if (campaign.budget) {
                fundingItems.push({ label: 'Budget', value: CampaignModal._formatBudget(campaign.budget) });
            }
            body.appendChild(CampaignModal._createSection('Funding', 'money-bill-wave', fundingItems));
        }

        // Metadata section
        body.appendChild(CampaignModal._createSection('Metadata', 'info-circle', [
            { label: 'Campaign ID', value: String(campaign.id), monospace: true },
            { label: 'Created', value: CampaignModal._formatDate(campaign.createdAt) },
            { label: 'Last Updated', value: CampaignModal._formatDate(campaign.updatedAt) }
        ]));

        // Footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn btn-secondary';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => CampaignModal.close());
        footer.appendChild(closeButton);

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        container.appendChild(overlay);
        document.body.appendChild(container);
    }

    /**
     * Create a detail section
     * @private
     */
    static _createSection(title, icon, items) {
        const section = document.createElement('div');
        section.className = 'detail-section';
        
        const sectionTitle = document.createElement('h6');
        sectionTitle.className = 'section-title';
        const titleIcon = document.createElement('i');
        titleIcon.className = 'fas fa-' + icon;
        sectionTitle.appendChild(titleIcon);
        sectionTitle.appendChild(document.createTextNode(' ' + title));
        section.appendChild(sectionTitle);
        
        const grid = document.createElement('div');
        grid.className = 'detail-grid';
        
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'detail-item';
            
            const label = document.createElement('label');
            label.textContent = item.label;
            itemDiv.appendChild(label);
            
            if (item.badge) {
                const badge = document.createElement('span');
                badge.className = 'badge ' + item.badge;
                badge.textContent = item.value;
                itemDiv.appendChild(badge);
            } else {
                const span = document.createElement('span');
                if (item.monospace) span.className = 'font-monospace';
                span.textContent = item.value;
                itemDiv.appendChild(span);
            }
            
            grid.appendChild(itemDiv);
        });
        
        section.appendChild(grid);
        return section;
    }

    /**
     * Create a list section
     * @private
     */
    static _createListSection(title, icon, items, emptyMessage) {
        const section = document.createElement('div');
        section.className = 'detail-section';
        
        const sectionTitle = document.createElement('h6');
        sectionTitle.className = 'section-title';
        const titleIcon = document.createElement('i');
        titleIcon.className = 'fas fa-' + icon;
        sectionTitle.appendChild(titleIcon);
        sectionTitle.appendChild(document.createTextNode(' ' + title));
        section.appendChild(sectionTitle);
        
        if (!items || items.length === 0) {
            const emptyP = document.createElement('p');
            emptyP.className = 'text-muted';
            emptyP.textContent = emptyMessage;
            section.appendChild(emptyP);
        } else {
            const ul = document.createElement('ul');
            ul.className = 'list-styled';
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                ul.appendChild(li);
            });
            section.appendChild(ul);
        }
        
        return section;
    }

    /**
     * Render form modal using safe DOM methods
     * @private
     */
    static _renderFormModal(data) {
        // Remove existing modal
        const existing = document.getElementById('campaign-modal-container');
        if (existing) existing.remove();

        // Create modal container
        const container = document.createElement('div');
        container.id = 'campaign-modal-container';

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) CampaignModal.close();
        });

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'modal-content modal-campaign modal-lg';
        modal.addEventListener('click', (e) => e.stopPropagation());

        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const headerTitle = document.createElement('h5');
        const headerIcon = document.createElement('i');
        headerIcon.className = 'fas fa-flag';
        headerTitle.appendChild(headerIcon);
        headerTitle.appendChild(document.createTextNode(' ' + data.title));
        
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'modal-close';
        closeBtn.addEventListener('click', () => CampaignModal.close());
        const closeIcon = document.createElement('i');
        closeIcon.className = 'fas fa-times';
        closeBtn.appendChild(closeIcon);
        
        header.appendChild(headerTitle);
        header.appendChild(closeBtn);

        // Form
        const form = document.createElement('form');
        form.id = 'campaign-form';
        form.addEventListener('submit', (e) => CampaignModal.save(e));

        // Hidden fields
        const hiddenFields = [
            { name: 'id', value: data.id || '' },
            { name: 'station_id', value: data.stationId || '' },
            { name: 'platform_id', value: data.platformId || '' },
            { name: 'aoi_id', value: data.aoiId || '' },
            { name: 'is_new', value: data.isNew }
        ];
        hiddenFields.forEach(field => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = field.name;
            input.value = field.value;
            form.appendChild(input);
        });

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';

        // Basic Info Section
        body.appendChild(CampaignModal._createFormSectionTitle('Basic Information', 'info-circle'));

        // Campaign Name
        const nameGroup = CampaignModal._createFormGroup('campaign-name', 'Campaign Name *', 'text', {
            value: data.name || '',
            placeholder: 'e.g., Summer 2025 Field Campaign',
            required: true
        });
        body.appendChild(nameGroup);

        // Type and Status row
        const typeStatusRow = document.createElement('div');
        typeStatusRow.className = 'form-row';

        const typeGroup = CampaignModal._createFormGroup('campaign-type', 'Campaign Type *', 'select', {
            options: Object.entries(CampaignModal.CAMPAIGN_TYPES).map(([v, l]) => ({ value: v, label: l })),
            value: data.campaignType || '',
            required: true,
            placeholder: 'Select type...'
        });
        typeGroup.className = 'form-group col-md-6';
        typeStatusRow.appendChild(typeGroup);

        const statusGroup = CampaignModal._createFormGroup('campaign-status', 'Status', 'select', {
            options: Object.entries(CampaignModal.STATUSES).map(([v, c]) => ({ value: v, label: c.label })),
            value: data.status || 'planned'
        });
        statusGroup.className = 'form-group col-md-6';
        typeStatusRow.appendChild(statusGroup);
        body.appendChild(typeStatusRow);

        // Description
        const descGroup = CampaignModal._createFormGroup('campaign-description', 'Description', 'textarea', {
            value: data.description || '',
            placeholder: 'Describe the campaign purpose and scope...',
            rows: 3
        });
        body.appendChild(descGroup);

        // Timeline Section
        body.appendChild(CampaignModal._createFormSectionTitle('Timeline', 'calendar-alt', 'mt-4'));

        const dateRow = document.createElement('div');
        dateRow.className = 'form-row';

        const startGroup = CampaignModal._createFormGroup('campaign-start', 'Start Date *', 'date', {
            value: data.startDate ? data.startDate.split('T')[0] : '',
            required: true
        });
        startGroup.className = 'form-group col-md-6';
        dateRow.appendChild(startGroup);

        const endGroup = CampaignModal._createFormGroup('campaign-end', 'End Date', 'date', {
            value: data.endDate ? data.endDate.split('T')[0] : '',
            helpText: 'Leave empty for ongoing campaigns'
        });
        endGroup.className = 'form-group col-md-6';
        dateRow.appendChild(endGroup);
        body.appendChild(dateRow);

        // Objectives Section
        body.appendChild(CampaignModal._createFormSectionTitle('Objectives', 'bullseye', 'mt-4'));

        const objectives = Array.isArray(data.objectives) ? data.objectives.join('\n') : '';
        const objGroup = CampaignModal._createFormGroup('campaign-objectives', 'Campaign Objectives', 'textarea', {
            value: objectives,
            placeholder: 'Enter each objective on a new line...',
            rows: 4,
            helpText: 'One objective per line'
        });
        body.appendChild(objGroup);

        const outcomes = Array.isArray(data.expectedOutcomes) ? data.expectedOutcomes.join('\n') : '';
        const outGroup = CampaignModal._createFormGroup('campaign-outcomes', 'Expected Outcomes', 'textarea', {
            value: outcomes,
            placeholder: 'Enter each expected outcome on a new line...',
            rows: 3,
            helpText: 'One outcome per line'
        });
        body.appendChild(outGroup);

        // Funding Section
        body.appendChild(CampaignModal._createFormSectionTitle('Funding (Optional)', 'money-bill-wave', 'mt-4'));

        const fundingRow = document.createElement('div');
        fundingRow.className = 'form-row';

        const fundingGroup = CampaignModal._createFormGroup('campaign-funding', 'Funding Source', 'text', {
            value: data.fundingSource || '',
            placeholder: 'e.g., Swedish Research Council'
        });
        fundingGroup.className = 'form-group col-md-8';
        fundingRow.appendChild(fundingGroup);

        const budgetGroup = CampaignModal._createFormGroup('campaign-budget', 'Budget (SEK)', 'number', {
            value: data.budget || '',
            placeholder: 'e.g., 500000'
        });
        budgetGroup.className = 'form-group col-md-4';
        fundingRow.appendChild(budgetGroup);
        body.appendChild(fundingRow);

        form.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => CampaignModal.close());
        footer.appendChild(cancelBtn);
        
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary';
        const saveIcon = document.createElement('i');
        saveIcon.className = 'fas fa-save';
        submitBtn.appendChild(saveIcon);
        submitBtn.appendChild(document.createTextNode(' ' + (data.isNew ? 'Create Campaign' : 'Save Changes')));
        footer.appendChild(submitBtn);

        form.appendChild(footer);

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(form);
        overlay.appendChild(modal);
        container.appendChild(overlay);
        document.body.appendChild(container);

        // Focus first input
        setTimeout(() => {
            const firstInput = container.querySelector('input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Create form section title
     * @private
     */
    static _createFormSectionTitle(text, icon, extraClass = '') {
        const title = document.createElement('h6');
        title.className = 'section-title ' + extraClass;
        const iconEl = document.createElement('i');
        iconEl.className = 'fas fa-' + icon;
        title.appendChild(iconEl);
        title.appendChild(document.createTextNode(' ' + text));
        return title;
    }

    /**
     * Create form group
     * @private
     */
    static _createFormGroup(id, labelText, type, options = {}) {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = labelText;
        group.appendChild(label);

        let input;
        if (type === 'select') {
            input = document.createElement('select');
            input.className = 'form-control';
            if (options.placeholder) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = options.placeholder;
                input.appendChild(opt);
            }
            if (options.options) {
                options.options.forEach(o => {
                    const opt = document.createElement('option');
                    opt.value = o.value;
                    opt.textContent = o.label;
                    if (options.value === o.value) opt.selected = true;
                    input.appendChild(opt);
                });
            }
        } else if (type === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'form-control';
            input.rows = options.rows || 3;
            input.value = options.value || '';
            if (options.placeholder) input.placeholder = options.placeholder;
        } else {
            input = document.createElement('input');
            input.type = type;
            input.className = 'form-control';
            input.value = options.value || '';
            if (options.placeholder) input.placeholder = options.placeholder;
        }

        input.id = id;
        input.name = id.replace('campaign-', '').replace(/-/g, '_');
        if (options.required) input.required = true;
        group.appendChild(input);

        if (options.helpText) {
            const small = document.createElement('small');
            small.className = 'form-text';
            small.textContent = options.helpText;
            group.appendChild(small);
        }

        return group;
    }

    /**
     * Save campaign (create or update)
     * @param {Event} event - Form submit event
     */
    static async save(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const isNew = formData.get('is_new') === 'true';

        // Parse objectives and outcomes from textarea (one per line)
        const objectivesText = formData.get('objectives') || '';
        const outcomesText = formData.get('outcomes') || '';

        const data = {
            name: formData.get('name'),
            description: formData.get('description') || null,
            campaignType: formData.get('type'),
            status: formData.get('status') || 'planned',
            startDate: formData.get('start'),
            endDate: formData.get('end') || null,
            stationId: parseInt(formData.get('station_id')),
            platformId: formData.get('platform_id') ? parseInt(formData.get('platform_id')) : null,
            aoiId: formData.get('aoi_id') ? parseInt(formData.get('aoi_id')) : null,
            objectives: objectivesText.split('\n').map(s => s.trim()).filter(s => s),
            expectedOutcomes: outcomesText.split('\n').map(s => s.trim()).filter(s => s),
            fundingSource: formData.get('funding') || null,
            budget: formData.get('budget') ? parseFloat(formData.get('budget')) : null
        };

        try {
            if (isNew) {
                await window.sitesAPIv3.createCampaign(data);
                CampaignModal._showNotification('Campaign created successfully', 'success');
            } else {
                const id = parseInt(formData.get('id'));
                await window.sitesAPIv3.updateCampaign(id, data);
                CampaignModal._showNotification('Campaign updated successfully', 'success');
            }

            CampaignModal.close();

            // Refresh dashboard if available
            if (window.stationDashboard && typeof window.stationDashboard.refresh === 'function') {
                await window.stationDashboard.refresh();
            }
        } catch (error) {
            console.error('Failed to save campaign:', error);
            CampaignModal._showNotification('Failed to save: ' + error.message, 'error');
        }
    }

    /**
     * Close modal
     */
    static close() {
        const container = document.getElementById('campaign-modal-container');
        if (container) container.remove();
    }

    /**
     * Get duration info string
     * @private
     */
    static _getDurationInfo(campaign) {
        if (!campaign.endDate) {
            const start = new Date(campaign.startDate);
            const now = new Date();
            if (now < start) {
                const days = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
                return 'Starts in ' + days + ' days';
            }
            const days = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
            return days + ' days (ongoing)';
        }

        const start = new Date(campaign.startDate);
        const end = new Date(campaign.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return days + ' days';
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
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Format budget
     * @private
     */
    static _formatBudget(budget) {
        if (!budget) return 'N/A';
        return new Intl.NumberFormat('sv-SE', {
            style: 'currency',
            currency: 'SEK',
            minimumFractionDigits: 0
        }).format(budget);
    }

    /**
     * Show notification
     * @private
     */
    static _showNotification(message, type) {
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }

        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const notification = document.createElement('div');
        notification.className = 'alert ' + alertClass + ' notification-toast';
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 250px;';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-' + (type === 'success' ? 'check' : 'exclamation') + '-circle';
        notification.appendChild(icon);
        notification.appendChild(document.createTextNode(' ' + message));

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Export for module systems and make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampaignModal;
}
if (typeof window !== 'undefined') {
    window.CampaignModal = CampaignModal;
}
