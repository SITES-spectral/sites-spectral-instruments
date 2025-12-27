/**
 * Product Modal - SITES Spectral v11.0.0
 * 
 * Displays and manages product details with safe DOM methods.
 * Follows hexagonal architecture patterns.
 */

const ProductModal = {
    // Processing level display names and colors
    PROCESSING_LEVELS: {
        'L0': { name: 'L0 - Raw', color: '#6c757d', description: 'Raw sensor data' },
        'L1': { name: 'L1 - Corrected', color: '#17a2b8', description: 'Geometrically corrected' },
        'L2': { name: 'L2 - Derived', color: '#28a745', description: 'Derived products' },
        'L3': { name: 'L3 - Aggregated', color: '#ffc107', description: 'Spatially/temporally aggregated' },
        'L4': { name: 'L4 - Model', color: '#dc3545', description: 'Model output' }
    },

    // Product type display
    PRODUCT_TYPES: {
        'image': { name: 'Image', icon: 'fa-image' },
        'timeseries': { name: 'Time Series', icon: 'fa-chart-line' },
        'vegetation_index': { name: 'Vegetation Index', icon: 'fa-leaf' },
        'spectral_data': { name: 'Spectral Data', icon: 'fa-wave-square' },
        'composite': { name: 'Composite', icon: 'fa-layer-group' },
        'calibration': { name: 'Calibration', icon: 'fa-bullseye' },
        'derived': { name: 'Derived', icon: 'fa-calculator' }
    },

    // Quality control levels
    QUALITY_LEVELS: {
        'raw': { name: 'Raw', color: '#6c757d' },
        'quality_controlled': { name: 'Quality Controlled', color: '#17a2b8' },
        'validated': { name: 'Validated', color: '#28a745' },
        'research_grade': { name: 'Research Grade', color: '#6f42c1' }
    },

    // License options
    LICENSES: {
        'CC-BY-4.0': 'Creative Commons Attribution 4.0',
        'CC-BY-SA-4.0': 'Creative Commons Attribution-ShareAlike 4.0',
        'CC0-1.0': 'Creative Commons Zero 1.0',
        'proprietary': 'Proprietary'
    },

    /**
     * Show product details modal (view mode)
     */
    show(product, options = {}) {
        const overlay = this._createOverlay();
        const modal = this._createModal();
        
        // Header
        const header = this._createHeader(product, false);
        modal.appendChild(header);
        
        // Content
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.cssText = 'padding: 20px; max-height: 70vh; overflow-y: auto;';
        
        // Basic Information Section
        content.appendChild(this._createSection('Basic Information', [
            { label: 'Name', value: product.name },
            { label: 'Description', value: product.description || 'No description' },
            { label: 'Type', value: this._getProductTypeDisplay(product.type) },
            { label: 'Processing Level', value: this._getProcessingLevelBadge(product.processingLevel) },
            { label: 'Format', value: product.format || 'Not specified' }
        ]));
        
        // Quality & Metadata Section
        content.appendChild(this._createSection('Quality & Metadata', [
            { label: 'Quality Score', value: this._getQualityScoreDisplay(product.qualityScore) },
            { label: 'Quality Control', value: this._getQualityControlBadge(product.qualityControlLevel) },
            { label: 'Version', value: product.version || '1.0' },
            { label: 'Public', value: product.isPublic ? 'Yes' : 'No' }
        ]));
        
        // Dates Section
        content.appendChild(this._createSection('Dates', [
            { label: 'Product Date', value: this._formatDate(product.productDate) },
            { label: 'Processing Date', value: this._formatDate(product.processingDate) },
            { label: 'Created', value: this._formatDate(product.createdAt) },
            { label: 'Updated', value: this._formatDate(product.updatedAt) }
        ]));
        
        // Resolution Section
        if (product.spatialResolution || product.temporalResolution) {
            content.appendChild(this._createSection('Resolution', [
                { label: 'Spatial Resolution', value: product.spatialResolution || 'Not specified' },
                { label: 'Temporal Resolution', value: product.temporalResolution || 'Not specified' }
            ]));
        }
        
        // Data Access Section
        if (product.dataPath || product.dataUrl) {
            content.appendChild(this._createSection('Data Access', [
                { label: 'Data Path', value: product.dataPath || 'Not specified' },
                { label: 'Data URL', value: product.dataUrl ? this._createLink(product.dataUrl) : 'Not available' },
                { label: 'File Size', value: product.fileSize ? this._formatFileSize(product.fileSize) : 'Unknown' },
                { label: 'Checksum', value: product.checksum || 'Not available' }
            ]));
        }
        
        // Citation Section
        if (product.doi || product.citation) {
            content.appendChild(this._createSection('Citation', [
                { label: 'DOI', value: product.doi ? this._createLink(`https://doi.org/${product.doi}`, product.doi) : 'Not assigned' },
                { label: 'Citation', value: product.citation || 'Not available' },
                { label: 'License', value: this.LICENSES[product.dataLicense] || product.dataLicense || 'Not specified' }
            ]));
        }
        
        // Keywords
        if (product.keywords && product.keywords.length > 0) {
            content.appendChild(this._createKeywordsSection(product.keywords));
        }
        
        modal.appendChild(content);
        
        // Footer with actions
        const footer = this._createFooter(product, options);
        modal.appendChild(footer);
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Store reference for closing
        this._currentOverlay = overlay;
    },

    /**
     * Show create product form
     */
    showCreate(options = {}) {
        const overlay = this._createOverlay();
        const modal = this._createModal();
        
        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #dee2e6; background: linear-gradient(135deg, #28a745, #20c997);';
        
        const title = document.createElement('h3');
        title.id = 'product-modal-title';
        title.style.cssText = 'margin: 0; color: white; font-size: 1.25rem;';
        title.textContent = 'Create New Product';
        
        const closeBtn = this._createCloseButton();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        modal.appendChild(header);
        
        // Form content
        const form = this._createForm(null, options);
        modal.appendChild(form);
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this._currentOverlay = overlay;
    },

    /**
     * Show edit product form
     */
    showEdit(product, options = {}) {
        const overlay = this._createOverlay();
        const modal = this._createModal();
        
        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #dee2e6; background: linear-gradient(135deg, #ffc107, #fd7e14);';
        
        const title = document.createElement('h3');
        title.id = 'product-modal-title';
        title.style.cssText = 'margin: 0; color: white; font-size: 1.25rem;';
        title.textContent = 'Edit Product: ' + product.name;
        
        const closeBtn = this._createCloseButton();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        modal.appendChild(header);
        
        // Form content
        const form = this._createForm(product, options);
        modal.appendChild(form);
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this._currentOverlay = overlay;
    },

    /**
     * Create the form for create/edit
     */
    _createForm(product, options) {
        const form = document.createElement('form');
        form.id = 'product-form';
        form.style.cssText = 'padding: 20px; max-height: 70vh; overflow-y: auto;';
        
        // Basic Information
        const basicSection = document.createElement('div');
        basicSection.className = 'form-section';
        basicSection.style.cssText = 'margin-bottom: 20px;';
        
        const basicTitle = document.createElement('h4');
        basicTitle.style.cssText = 'margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        basicTitle.textContent = 'Basic Information';
        basicSection.appendChild(basicTitle);
        
        basicSection.appendChild(this._createFormGroup('name', 'Product Name', 'text', product?.name, true));
        basicSection.appendChild(this._createFormGroup('description', 'Description', 'textarea', product?.description));
        basicSection.appendChild(this._createSelectGroup('type', 'Product Type', this.PRODUCT_TYPES, product?.type, true));
        basicSection.appendChild(this._createSelectGroup('processingLevel', 'Processing Level', this.PROCESSING_LEVELS, product?.processingLevel, true));
        basicSection.appendChild(this._createFormGroup('format', 'Format', 'text', product?.format, false, 'e.g., GeoTIFF, NetCDF, CSV'));
        
        form.appendChild(basicSection);
        
        // Associations
        const assocSection = document.createElement('div');
        assocSection.className = 'form-section';
        assocSection.style.cssText = 'margin-bottom: 20px;';
        
        const assocTitle = document.createElement('h4');
        assocTitle.style.cssText = 'margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        assocTitle.textContent = 'Associations';
        assocSection.appendChild(assocTitle);
        
        assocSection.appendChild(this._createFormGroup('instrumentId', 'Instrument ID', 'number', product?.instrumentId));
        assocSection.appendChild(this._createFormGroup('campaignId', 'Campaign ID', 'number', product?.campaignId));
        
        form.appendChild(assocSection);
        
        // Quality Section
        const qualitySection = document.createElement('div');
        qualitySection.className = 'form-section';
        qualitySection.style.cssText = 'margin-bottom: 20px;';
        
        const qualityTitle = document.createElement('h4');
        qualityTitle.style.cssText = 'margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        qualityTitle.textContent = 'Quality';
        qualitySection.appendChild(qualityTitle);
        
        qualitySection.appendChild(this._createFormGroup('qualityScore', 'Quality Score (0-100)', 'number', product?.qualityScore, false, '0-100'));
        qualitySection.appendChild(this._createSelectGroup('qualityControlLevel', 'Quality Control Level', this.QUALITY_LEVELS, product?.qualityControlLevel));
        
        form.appendChild(qualitySection);
        
        // Dates Section
        const datesSection = document.createElement('div');
        datesSection.className = 'form-section';
        datesSection.style.cssText = 'margin-bottom: 20px;';
        
        const datesTitle = document.createElement('h4');
        datesTitle.style.cssText = 'margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        datesTitle.textContent = 'Dates';
        datesSection.appendChild(datesTitle);
        
        datesSection.appendChild(this._createFormGroup('productDate', 'Product Date', 'date', product?.productDate ? product.productDate.split('T')[0] : ''));
        datesSection.appendChild(this._createFormGroup('processingDate', 'Processing Date', 'date', product?.processingDate ? product.processingDate.split('T')[0] : ''));
        
        form.appendChild(datesSection);
        
        // Resolution Section
        const resSection = document.createElement('div');
        resSection.className = 'form-section';
        resSection.style.cssText = 'margin-bottom: 20px;';
        
        const resTitle = document.createElement('h4');
        resTitle.style.cssText = 'margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        resTitle.textContent = 'Resolution';
        resSection.appendChild(resTitle);
        
        resSection.appendChild(this._createFormGroup('spatialResolution', 'Spatial Resolution', 'text', product?.spatialResolution, false, 'e.g., 10m, 30m'));
        resSection.appendChild(this._createFormGroup('temporalResolution', 'Temporal Resolution', 'text', product?.temporalResolution, false, 'e.g., daily, hourly'));
        
        form.appendChild(resSection);
        
        // Data Access Section
        const dataSection = document.createElement('div');
        dataSection.className = 'form-section';
        dataSection.style.cssText = 'margin-bottom: 20px;';
        
        const dataTitle = document.createElement('h4');
        dataTitle.style.cssText = 'margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        dataTitle.textContent = 'Data Access';
        dataSection.appendChild(dataTitle);
        
        dataSection.appendChild(this._createFormGroup('dataPath', 'Data Path', 'text', product?.dataPath));
        dataSection.appendChild(this._createFormGroup('dataUrl', 'Data URL', 'url', product?.dataUrl));
        dataSection.appendChild(this._createFormGroup('fileSize', 'File Size (bytes)', 'number', product?.fileSize));
        dataSection.appendChild(this._createFormGroup('checksum', 'Checksum', 'text', product?.checksum));
        
        form.appendChild(dataSection);
        
        // Citation Section
        const citeSection = document.createElement('div');
        citeSection.className = 'form-section';
        citeSection.style.cssText = 'margin-bottom: 20px;';
        
        const citeTitle = document.createElement('h4');
        citeTitle.style.cssText = 'margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        citeTitle.textContent = 'Citation & Licensing';
        citeSection.appendChild(citeTitle);
        
        citeSection.appendChild(this._createFormGroup('doi', 'DOI', 'text', product?.doi, false, 'e.g., 10.1234/example'));
        citeSection.appendChild(this._createFormGroup('citation', 'Citation', 'textarea', product?.citation));
        citeSection.appendChild(this._createSelectGroup('dataLicense', 'Data License', this.LICENSES, product?.dataLicense));
        citeSection.appendChild(this._createFormGroup('keywords', 'Keywords', 'text', product?.keywords?.join(', '), false, 'Comma-separated'));
        
        form.appendChild(citeSection);
        
        // Settings Section
        const settingsSection = document.createElement('div');
        settingsSection.className = 'form-section';
        settingsSection.style.cssText = 'margin-bottom: 20px;';
        
        const settingsTitle = document.createElement('h4');
        settingsTitle.style.cssText = 'margin: 0 0 15px 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        settingsTitle.textContent = 'Settings';
        settingsSection.appendChild(settingsTitle);
        
        settingsSection.appendChild(this._createFormGroup('version', 'Version', 'text', product?.version || '1.0'));
        settingsSection.appendChild(this._createCheckboxGroup('isPublic', 'Public Access', product?.isPublic ?? true));
        
        form.appendChild(settingsSection);
        
        // Footer with buttons
        const footer = document.createElement('div');
        footer.style.cssText = 'padding: 15px 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 10px;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; background: #6c757d; color: white;';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => this.close();
        
        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.className = 'btn btn-primary';
        saveBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white;';
        saveBtn.textContent = product ? 'Update Product' : 'Create Product';
        
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        
        // Form submission
        form.onsubmit = async (e) => {
            e.preventDefault();
            await this.save(form, product?.id, options);
        };
        
        // Append footer to form's parent after form is added
        const wrapper = document.createElement('div');
        wrapper.appendChild(form);
        wrapper.appendChild(footer);
        
        return wrapper;
    },

    /**
     * Save product via API
     */
    async save(form, productId, options = {}) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            type: formData.get('type'),
            processingLevel: formData.get('processingLevel'),
            format: formData.get('format'),
            instrumentId: formData.get('instrumentId') ? parseInt(formData.get('instrumentId')) : null,
            campaignId: formData.get('campaignId') ? parseInt(formData.get('campaignId')) : null,
            qualityScore: formData.get('qualityScore') ? parseFloat(formData.get('qualityScore')) : null,
            qualityControlLevel: formData.get('qualityControlLevel'),
            productDate: formData.get('productDate') || null,
            processingDate: formData.get('processingDate') || null,
            spatialResolution: formData.get('spatialResolution'),
            temporalResolution: formData.get('temporalResolution'),
            dataPath: formData.get('dataPath'),
            dataUrl: formData.get('dataUrl'),
            fileSize: formData.get('fileSize') ? parseInt(formData.get('fileSize')) : null,
            checksum: formData.get('checksum'),
            doi: formData.get('doi'),
            citation: formData.get('citation'),
            dataLicense: formData.get('dataLicense'),
            keywords: formData.get('keywords') ? formData.get('keywords').split(',').map(k => k.trim()).filter(k => k) : [],
            version: formData.get('version'),
            isPublic: formData.get('isPublic') === 'on'
        };
        
        try {
            // v12.0.4: Use /api/latest for automatic version resolution
            const url = productId
                ? `/api/latest/products/${productId}`
                : '/api/latest/products';
            const method = productId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save product');
            }
            
            this.close();
            
            if (options.onSave) {
                options.onSave(await response.json());
            }
            
            // Show success notification
            if (window.showNotification) {
                window.showNotification(productId ? 'Product updated successfully' : 'Product created successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            if (window.showNotification) {
                window.showNotification(error.message, 'error');
            }
        }
    },

    /**
     * Close modal
     */
    close() {
        if (this._currentOverlay) {
            this._currentOverlay.remove();
            this._currentOverlay = null;
        }
    },

    // ============ Helper Methods ============

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.onclick = (e) => {
            if (e.target === overlay) this.close();
        };
        return overlay;
    },

    _createModal() {
        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.style.cssText = 'background: white; border-radius: 8px; width: 90%; max-width: 700px; max-height: 90vh; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2);';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'product-modal-title');
        return modal;
    },

    _createHeader(product, isEdit) {
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const level = this.PROCESSING_LEVELS[product.processingLevel] || { color: '#6c757d' };
        header.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #dee2e6; background: linear-gradient(135deg, ${level.color}, ${this._adjustColor(level.color, 20)});`;
        
        const titleArea = document.createElement('div');
        
        const title = document.createElement('h3');
        title.id = 'product-modal-title';
        title.style.cssText = 'margin: 0; color: white; font-size: 1.25rem;';
        title.textContent = product.name;
        titleArea.appendChild(title);
        
        const subtitle = document.createElement('div');
        subtitle.style.cssText = 'color: rgba(255,255,255,0.8); font-size: 0.875rem; margin-top: 4px;';
        subtitle.textContent = this._getProductTypeDisplay(product.type);
        titleArea.appendChild(subtitle);
        
        const closeBtn = this._createCloseButton();
        
        header.appendChild(titleArea);
        header.appendChild(closeBtn);
        
        return header;
    },

    _createCloseButton() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Close modal');
        btn.style.cssText = 'background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1.25rem; display: flex; align-items: center; justify-content: center;';
        btn.textContent = '×';
        btn.onclick = () => this.close();
        return btn;
    },

    _createSection(title, items) {
        const section = document.createElement('div');
        section.className = 'detail-section';
        section.style.cssText = 'margin-bottom: 20px;';
        
        const sectionTitle = document.createElement('h4');
        sectionTitle.style.cssText = 'margin: 0 0 12px 0; color: #495057; font-size: 1rem; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        sectionTitle.textContent = title;
        section.appendChild(sectionTitle);
        
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;';
        
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            
            const label = document.createElement('div');
            label.style.cssText = 'font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;';
            label.textContent = item.label;
            itemDiv.appendChild(label);
            
            const value = document.createElement('div');
            value.style.cssText = 'font-size: 0.9rem; color: #212529; margin-top: 2px;';
            
            if (typeof item.value === 'string' || typeof item.value === 'number') {
                value.textContent = item.value;
            } else if (item.value instanceof HTMLElement) {
                value.appendChild(item.value);
            } else {
                value.textContent = item.value || '-';
            }
            
            itemDiv.appendChild(value);
            grid.appendChild(itemDiv);
        });
        
        section.appendChild(grid);
        return section;
    },

    _createKeywordsSection(keywords) {
        const section = document.createElement('div');
        section.className = 'detail-section';
        section.style.cssText = 'margin-bottom: 20px;';
        
        const title = document.createElement('h4');
        title.style.cssText = 'margin: 0 0 12px 0; color: #495057; font-size: 1rem; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;';
        title.textContent = 'Keywords';
        section.appendChild(title);
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';
        
        keywords.forEach(keyword => {
            const badge = document.createElement('span');
            badge.style.cssText = 'background: #e9ecef; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; color: #495057;';
            badge.textContent = keyword;
            container.appendChild(badge);
        });
        
        section.appendChild(container);
        return section;
    },

    _createFooter(product, options) {
        const footer = document.createElement('div');
        footer.style.cssText = 'padding: 15px 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 10px;';
        
        if (options.canEdit) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary';
            editBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white;';
            editBtn.textContent = 'Edit';
            editBtn.onclick = () => {
                this.close();
                this.showEdit(product, options);
            };
            footer.appendChild(editBtn);
        }
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary';
        closeBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 4px; cursor: pointer; background: #6c757d; color: white;';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => this.close();
        footer.appendChild(closeBtn);
        
        return footer;
    },

    _createFormGroup(name, label, type, value, required = false, placeholder = '') {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.cssText = 'margin-bottom: 15px;';
        
        const labelEl = document.createElement('label');
        labelEl.style.cssText = 'display: block; margin-bottom: 5px; font-weight: 500; color: #495057;';
        labelEl.textContent = label;
        if (required) {
            const asterisk = document.createElement('span');
            asterisk.style.color = '#dc3545';
            asterisk.textContent = ' *';
            labelEl.appendChild(asterisk);
        }
        group.appendChild(labelEl);
        
        let input;
        if (type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = type;
        }
        
        input.name = name;
        input.id = name;
        input.value = value || '';
        input.required = required;
        if (placeholder) input.placeholder = placeholder;
        input.style.cssText = 'width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;';
        
        group.appendChild(input);
        return group;
    },

    _createSelectGroup(name, label, options, value, required = false) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.cssText = 'margin-bottom: 15px;';
        
        const labelEl = document.createElement('label');
        labelEl.style.cssText = 'display: block; margin-bottom: 5px; font-weight: 500; color: #495057;';
        labelEl.textContent = label;
        if (required) {
            const asterisk = document.createElement('span');
            asterisk.style.color = '#dc3545';
            asterisk.textContent = ' *';
            labelEl.appendChild(asterisk);
        }
        group.appendChild(labelEl);
        
        const select = document.createElement('select');
        select.name = name;
        select.id = name;
        select.required = required;
        select.style.cssText = 'width: 100%; padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9rem; box-sizing: border-box;';
        
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Select --';
        select.appendChild(emptyOption);
        
        Object.entries(options).forEach(([key, opt]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = typeof opt === 'string' ? opt : opt.name;
            if (key === value) option.selected = true;
            select.appendChild(option);
        });
        
        group.appendChild(select);
        return group;
    },

    _createCheckboxGroup(name, label, checked) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.cssText = 'margin-bottom: 15px; display: flex; align-items: center; gap: 10px;';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = name;
        input.id = name;
        input.checked = checked;
        input.style.cssText = 'width: 18px; height: 18px;';
        
        const labelEl = document.createElement('label');
        labelEl.htmlFor = name;
        labelEl.style.cssText = 'font-weight: 500; color: #495057; cursor: pointer;';
        labelEl.textContent = label;
        
        group.appendChild(input);
        group.appendChild(labelEl);
        return group;
    },

    _getProductTypeDisplay(type) {
        const typeInfo = this.PRODUCT_TYPES[type];
        if (!typeInfo) return type || 'Unknown';
        return typeInfo.name;
    },

    _getProcessingLevelBadge(level) {
        const levelInfo = this.PROCESSING_LEVELS[level];
        if (!levelInfo) return level || 'Unknown';
        
        const badge = document.createElement('span');
        badge.style.cssText = `background: ${levelInfo.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;`;
        badge.textContent = levelInfo.name;
        badge.title = levelInfo.description;
        return badge;
    },

    _getQualityScoreDisplay(score) {
        if (score === null || score === undefined) return '-';
        
        let color = '#dc3545'; // red
        if (score >= 80) color = '#28a745'; // green
        else if (score >= 60) color = '#ffc107'; // yellow
        else if (score >= 40) color = '#fd7e14'; // orange
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        
        const bar = document.createElement('div');
        bar.style.cssText = 'flex: 1; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;';
        
        const fill = document.createElement('div');
        fill.style.cssText = `width: ${score}%; height: 100%; background: ${color};`;
        bar.appendChild(fill);
        
        const text = document.createElement('span');
        text.style.cssText = 'font-weight: 500; min-width: 40px;';
        text.textContent = score + '%';
        
        container.appendChild(bar);
        container.appendChild(text);
        return container;
    },

    _getQualityControlBadge(level) {
        const levelInfo = this.QUALITY_LEVELS[level];
        if (!levelInfo) return level || 'Unknown';
        
        const badge = document.createElement('span');
        badge.style.cssText = `background: ${levelInfo.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;`;
        badge.textContent = levelInfo.name;
        return badge;
    },

    _createLink(url, text = null) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.cssText = 'color: #007bff; text-decoration: none;';
        link.textContent = text || url;
        return link;
    },

    _formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    },

    _formatFileSize(bytes) {
        if (!bytes) return '-';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let unitIndex = 0;
        let size = bytes;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    },

    _adjustColor(color, percent) {
        // Lighten or darken a hex color
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductModal;
}
