// SITES Spectral - AOI Modal
// Modal for creating, viewing, and editing Areas of Interest
// Version: 8.0.0-beta.2

/**
 * AOI Modal Manager
 * Handles the modal interface for AOI CRUD operations
 */
class AOIModal {
    constructor(options = {}) {
        this.options = {
            apiClient: null,
            configLoader: null,
            onSave: null,
            onDelete: null,
            ...options
        };

        this.modal = null;
        this.map = null;
        this.drawingTools = null;
        this.currentAOI = null;
        this.isNew = false;
        this.config = null;
    }

    /**
     * Initialize modal with configuration
     */
    async initialize() {
        // Load config if loader provided
        if (this.options.configLoader) {
            this.config = await this.options.configLoader.load('aoi/aoi-config');
        }

        // Add styles
        this.addStyles();
    }

    /**
     * Add CSS styles for modal
     */
    addStyles() {
        if (document.getElementById('aoi-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'aoi-modal-styles';
        style.textContent = `
            .aoi-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .aoi-modal-overlay.visible {
                opacity: 1;
            }

            .aoi-modal-container {
                background: white;
                border-radius: 12px;
                width: 95%;
                max-width: 1200px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                transform: scale(0.95);
                transition: transform 0.2s ease;
                overflow: hidden;
            }

            .aoi-modal-overlay.visible .aoi-modal-container {
                transform: scale(1);
            }

            .aoi-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                border-bottom: 1px solid #e5e7eb;
                background: #f9fafb;
            }

            .aoi-modal-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .aoi-modal-title i {
                color: #059669;
            }

            .aoi-modal-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #6b7280;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.2s;
            }

            .aoi-modal-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .aoi-modal-body {
                display: flex;
                flex: 1;
                overflow: hidden;
            }

            .aoi-modal-form {
                width: 400px;
                padding: 24px;
                overflow-y: auto;
                border-right: 1px solid #e5e7eb;
            }

            .aoi-modal-map-container {
                flex: 1;
                position: relative;
                min-height: 400px;
            }

            .aoi-modal-map {
                width: 100%;
                height: 100%;
            }

            .aoi-form-section {
                margin-bottom: 24px;
            }

            .aoi-form-section-title {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .aoi-form-section-title i {
                color: #059669;
            }

            .aoi-form-group {
                margin-bottom: 16px;
            }

            .aoi-form-label {
                display: block;
                font-size: 13px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 6px;
            }

            .aoi-form-label .required {
                color: #dc2626;
                margin-left: 2px;
            }

            .aoi-form-input,
            .aoi-form-select,
            .aoi-form-textarea {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .aoi-form-input:focus,
            .aoi-form-select:focus,
            .aoi-form-textarea:focus {
                outline: none;
                border-color: #059669;
                box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
            }

            .aoi-form-input.error,
            .aoi-form-select.error {
                border-color: #dc2626;
            }

            .aoi-form-error {
                font-size: 12px;
                color: #dc2626;
                margin-top: 4px;
            }

            .aoi-form-help {
                font-size: 12px;
                color: #6b7280;
                margin-top: 4px;
            }

            .aoi-form-textarea {
                resize: vertical;
                min-height: 80px;
            }

            .aoi-form-readonly {
                background: #f9fafb;
                color: #6b7280;
            }

            .aoi-metrics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            .aoi-metric-card {
                background: #f9fafb;
                padding: 12px;
                border-radius: 6px;
            }

            .aoi-metric-label {
                font-size: 11px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .aoi-metric-value {
                font-size: 16px;
                font-weight: 600;
                color: #374151;
                margin-top: 4px;
            }

            .aoi-geojson-preview {
                background: #1f2937;
                color: #e5e7eb;
                padding: 12px;
                border-radius: 6px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 11px;
                max-height: 150px;
                overflow: auto;
                white-space: pre;
            }

            .aoi-modal-footer {
                display: flex;
                justify-content: space-between;
                padding: 16px 24px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
            }

            .aoi-footer-left {
                display: flex;
                gap: 12px;
            }

            .aoi-footer-right {
                display: flex;
                gap: 12px;
            }

            .aoi-btn {
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .aoi-btn-primary {
                background: #059669;
                color: white;
                border: none;
            }

            .aoi-btn-primary:hover {
                background: #047857;
            }

            .aoi-btn-primary:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }

            .aoi-btn-secondary {
                background: white;
                color: #374151;
                border: 1px solid #d1d5db;
            }

            .aoi-btn-secondary:hover {
                background: #f9fafb;
            }

            .aoi-btn-danger {
                background: white;
                color: #dc2626;
                border: 1px solid #dc2626;
            }

            .aoi-btn-danger:hover {
                background: #fef2f2;
            }

            @media (max-width: 900px) {
                .aoi-modal-body {
                    flex-direction: column;
                }

                .aoi-modal-form {
                    width: 100%;
                    max-height: 300px;
                    border-right: none;
                    border-bottom: 1px solid #e5e7eb;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Open modal for creating new AOI
     */
    openNew(platformId, stationId, options = {}) {
        this.isNew = true;
        this.currentAOI = {
            platform_id: platformId,
            station_id: stationId,
            name: '',
            normalized_name: '',
            description: '',
            geometry_type: 'Polygon',
            geometry_json: '',
            aoi_type: options.aoiType || 'flight_area',
            purpose: 'mapping',
            ecosystem_code: options.ecosystemCode || '',
            status: 'active',
            source: 'manual',
            centroid_lat: null,
            centroid_lon: null,
            area_m2: null,
            perimeter_m: null,
            bbox_json: ''
        };

        this.render();
    }

    /**
     * Open modal for editing existing AOI
     */
    openEdit(aoi) {
        this.isNew = false;
        this.currentAOI = { ...aoi };
        this.render();
    }

    /**
     * Open modal for viewing AOI (read-only)
     */
    openView(aoi) {
        this.isNew = false;
        this.currentAOI = { ...aoi };
        this.render(true);
    }

    /**
     * Render the modal
     */
    render(readOnly = false) {
        // Remove existing modal
        this.close();

        // Create modal HTML
        const modalHTML = `
            <div class="aoi-modal-overlay" id="aoi-modal-overlay">
                <div class="aoi-modal-container">
                    <div class="aoi-modal-header">
                        <h2 class="aoi-modal-title">
                            <i class="fas fa-draw-polygon"></i>
                            ${this.isNew ? 'Create Area of Interest' : (readOnly ? 'View Area of Interest' : 'Edit Area of Interest')}
                        </h2>
                        <button class="aoi-modal-close" id="aoi-modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="aoi-modal-body">
                        <div class="aoi-modal-form">
                            ${this.renderForm(readOnly)}
                        </div>
                        <div class="aoi-modal-map-container">
                            <div class="aoi-modal-map" id="aoi-modal-map"></div>
                        </div>
                    </div>
                    <div class="aoi-modal-footer">
                        <div class="aoi-footer-left">
                            ${!readOnly && !this.isNew ? `
                                <button class="aoi-btn aoi-btn-danger" id="aoi-delete-btn">
                                    <i class="fas fa-trash-alt"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                        <div class="aoi-footer-right">
                            <button class="aoi-btn aoi-btn-secondary" id="aoi-cancel-btn">
                                ${readOnly ? 'Close' : 'Cancel'}
                            </button>
                            ${!readOnly ? `
                                <button class="aoi-btn aoi-btn-primary" id="aoi-save-btn">
                                    <i class="fas fa-save"></i> ${this.isNew ? 'Create AOI' : 'Save Changes'}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('aoi-modal-overlay');

        // Initialize map
        this.initializeMap();

        // Bind events
        this.bindEvents(readOnly);

        // Show modal with animation
        requestAnimationFrame(() => {
            this.modal.classList.add('visible');
        });
    }

    /**
     * Render form fields
     */
    renderForm(readOnly) {
        const aoi = this.currentAOI;

        return `
            <!-- General Information -->
            <div class="aoi-form-section">
                <h3 class="aoi-form-section-title">
                    <i class="fas fa-info-circle"></i> General Information
                </h3>

                <div class="aoi-form-group">
                    <label class="aoi-form-label">
                        AOI Name <span class="required">*</span>
                    </label>
                    <input type="text" class="aoi-form-input ${readOnly ? 'aoi-form-readonly' : ''}"
                           id="aoi-name" value="${aoi.name || ''}"
                           placeholder="e.g., SVB Forest Flight Area 1"
                           ${readOnly ? 'readonly' : ''}>
                    <div class="aoi-form-help">Descriptive name for this area</div>
                </div>

                <div class="aoi-form-group">
                    <label class="aoi-form-label">Normalized ID</label>
                    <input type="text" class="aoi-form-input aoi-form-readonly"
                           id="aoi-normalized-name" value="${aoi.normalized_name || ''}" readonly>
                </div>

                <div class="aoi-form-group">
                    <label class="aoi-form-label">Description</label>
                    <textarea class="aoi-form-textarea ${readOnly ? 'aoi-form-readonly' : ''}"
                              id="aoi-description" rows="3"
                              placeholder="Describe the purpose and characteristics..."
                              ${readOnly ? 'readonly' : ''}>${aoi.description || ''}</textarea>
                </div>
            </div>

            <!-- Classification -->
            <div class="aoi-form-section">
                <h3 class="aoi-form-section-title">
                    <i class="fas fa-tags"></i> Classification
                </h3>

                <div class="aoi-form-group">
                    <label class="aoi-form-label">
                        AOI Type <span class="required">*</span>
                    </label>
                    <select class="aoi-form-select ${readOnly ? 'aoi-form-readonly' : ''}"
                            id="aoi-type" ${readOnly ? 'disabled' : ''}>
                        <option value="flight_area" ${aoi.aoi_type === 'flight_area' ? 'selected' : ''}>Flight Area</option>
                        <option value="coverage_area" ${aoi.aoi_type === 'coverage_area' ? 'selected' : ''}>Coverage Area</option>
                        <option value="study_site" ${aoi.aoi_type === 'study_site' ? 'selected' : ''}>Study Site</option>
                        <option value="validation_site" ${aoi.aoi_type === 'validation_site' ? 'selected' : ''}>Validation Site</option>
                        <option value="reference_area" ${aoi.aoi_type === 'reference_area' ? 'selected' : ''}>Reference Area</option>
                    </select>
                </div>

                <div class="aoi-form-group">
                    <label class="aoi-form-label">Purpose</label>
                    <select class="aoi-form-select ${readOnly ? 'aoi-form-readonly' : ''}"
                            id="aoi-purpose" ${readOnly ? 'disabled' : ''}>
                        <option value="mapping" ${aoi.purpose === 'mapping' ? 'selected' : ''}>Mapping</option>
                        <option value="monitoring" ${aoi.purpose === 'monitoring' ? 'selected' : ''}>Monitoring</option>
                        <option value="validation" ${aoi.purpose === 'validation' ? 'selected' : ''}>Validation</option>
                        <option value="reference" ${aoi.purpose === 'reference' ? 'selected' : ''}>Reference</option>
                        <option value="research" ${aoi.purpose === 'research' ? 'selected' : ''}>Research</option>
                    </select>
                </div>

                <div class="aoi-form-group">
                    <label class="aoi-form-label">Ecosystem</label>
                    <select class="aoi-form-select ${readOnly ? 'aoi-form-readonly' : ''}"
                            id="aoi-ecosystem" ${readOnly ? 'disabled' : ''}>
                        <option value="">-- Select Ecosystem --</option>
                        <option value="FOR" ${aoi.ecosystem_code === 'FOR' ? 'selected' : ''}>Forest</option>
                        <option value="AGR" ${aoi.ecosystem_code === 'AGR' ? 'selected' : ''}>Arable Land</option>
                        <option value="MIR" ${aoi.ecosystem_code === 'MIR' ? 'selected' : ''}>Mires</option>
                        <option value="LAK" ${aoi.ecosystem_code === 'LAK' ? 'selected' : ''}>Lake</option>
                        <option value="WET" ${aoi.ecosystem_code === 'WET' ? 'selected' : ''}>Wetland</option>
                        <option value="GRA" ${aoi.ecosystem_code === 'GRA' ? 'selected' : ''}>Grassland</option>
                        <option value="HEA" ${aoi.ecosystem_code === 'HEA' ? 'selected' : ''}>Heathland</option>
                        <option value="ALP" ${aoi.ecosystem_code === 'ALP' ? 'selected' : ''}>Alpine Forest</option>
                    </select>
                </div>

                <div class="aoi-form-group">
                    <label class="aoi-form-label">Status</label>
                    <select class="aoi-form-select ${readOnly ? 'aoi-form-readonly' : ''}"
                            id="aoi-status" ${readOnly ? 'disabled' : ''}>
                        <option value="active" ${aoi.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${aoi.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="archived" ${aoi.status === 'archived' ? 'selected' : ''}>Archived</option>
                    </select>
                </div>
            </div>

            <!-- Geometry Metrics -->
            <div class="aoi-form-section">
                <h3 class="aoi-form-section-title">
                    <i class="fas fa-ruler-combined"></i> Geometry Metrics
                </h3>

                <div class="aoi-metrics-grid">
                    <div class="aoi-metric-card">
                        <div class="aoi-metric-label">Area</div>
                        <div class="aoi-metric-value" id="aoi-metric-area">
                            ${aoi.area_m2 ? this.formatArea(aoi.area_m2) : '--'}
                        </div>
                    </div>
                    <div class="aoi-metric-card">
                        <div class="aoi-metric-label">Perimeter</div>
                        <div class="aoi-metric-value" id="aoi-metric-perimeter">
                            ${aoi.perimeter_m ? this.formatDistance(aoi.perimeter_m) : '--'}
                        </div>
                    </div>
                    <div class="aoi-metric-card">
                        <div class="aoi-metric-label">Centroid Lat</div>
                        <div class="aoi-metric-value" id="aoi-metric-lat">
                            ${aoi.centroid_lat ? aoi.centroid_lat.toFixed(6) : '--'}
                        </div>
                    </div>
                    <div class="aoi-metric-card">
                        <div class="aoi-metric-label">Centroid Lon</div>
                        <div class="aoi-metric-value" id="aoi-metric-lon">
                            ${aoi.centroid_lon ? aoi.centroid_lon.toFixed(6) : '--'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- GeoJSON Preview -->
            <div class="aoi-form-section">
                <h3 class="aoi-form-section-title">
                    <i class="fas fa-code"></i> GeoJSON Geometry
                </h3>
                <div class="aoi-geojson-preview" id="aoi-geojson-preview">
                    ${aoi.geometry_json ? JSON.stringify(JSON.parse(aoi.geometry_json), null, 2) : 'No geometry defined. Use the map to draw an area.'}
                </div>
            </div>
        `;
    }

    /**
     * Initialize map in modal
     */
    initializeMap() {
        // Wait for map container to be ready
        setTimeout(() => {
            const mapContainer = document.getElementById('aoi-modal-map');
            if (!mapContainer) return;

            // Default center (Sweden)
            let center = [63.0, 16.0];
            let zoom = 5;

            // If we have existing geometry, center on it
            if (this.currentAOI.centroid_lat && this.currentAOI.centroid_lon) {
                center = [this.currentAOI.centroid_lat, this.currentAOI.centroid_lon];
                zoom = 14;
            }

            // Create map
            this.map = L.map('aoi-modal-map', {
                center: center,
                zoom: zoom,
                zoomControl: true
            });

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                crossOrigin: 'anonymous'
            }).addTo(this.map);

            // If we have existing geometry, display it
            if (this.currentAOI.geometry_json) {
                try {
                    const geometry = JSON.parse(this.currentAOI.geometry_json);
                    const layer = L.geoJSON(geometry, {
                        style: {
                            color: '#059669',
                            weight: 2,
                            fillColor: '#059669',
                            fillOpacity: 0.2
                        }
                    }).addTo(this.map);

                    this.map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                } catch (e) {
                    console.error('Error parsing geometry:', e);
                }
            }

            // Initialize drawing tools if not read-only
            if (!document.querySelector('.aoi-form-readonly')) {
                this.drawingTools = new AOIDrawingTools(this.map, {
                    onComplete: (data) => this.handleDrawingComplete(data),
                    onChange: (data) => this.handleDrawingChange(data)
                });
                this.drawingTools.initialize();
            }

            // Fix map size after modal animation
            setTimeout(() => {
                this.map.invalidateSize();
            }, 300);
        }, 100);
    }

    /**
     * Handle drawing complete
     */
    handleDrawingComplete(data) {
        this.updateGeometryData(data);
    }

    /**
     * Handle drawing change
     */
    handleDrawingChange(data) {
        this.updateGeometryData(data);
    }

    /**
     * Update geometry data in form
     */
    updateGeometryData(data) {
        // Update current AOI
        this.currentAOI.geometry_json = JSON.stringify(data.geojson);
        this.currentAOI.area_m2 = data.area;
        this.currentAOI.perimeter_m = data.perimeter;
        this.currentAOI.centroid_lat = data.centroid[0];
        this.currentAOI.centroid_lon = data.centroid[1];
        this.currentAOI.bbox_json = JSON.stringify(data.bbox);

        // Update display
        document.getElementById('aoi-metric-area').textContent = this.formatArea(data.area);
        document.getElementById('aoi-metric-perimeter').textContent = this.formatDistance(data.perimeter);
        document.getElementById('aoi-metric-lat').textContent = data.centroid[0].toFixed(6);
        document.getElementById('aoi-metric-lon').textContent = data.centroid[1].toFixed(6);

        // Update GeoJSON preview
        document.getElementById('aoi-geojson-preview').textContent =
            JSON.stringify(data.geojson, null, 2);
    }

    /**
     * Format area for display
     */
    formatArea(area) {
        if (area < 10000) {
            return `${area.toFixed(1)} m2`;
        } else {
            return `${(area / 10000).toFixed(2)} ha`;
        }
    }

    /**
     * Format distance for display
     */
    formatDistance(distance) {
        if (distance < 1000) {
            return `${distance.toFixed(1)} m`;
        } else {
            return `${(distance / 1000).toFixed(2)} km`;
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents(readOnly) {
        // Close button
        document.getElementById('aoi-modal-close').addEventListener('click', () => this.close());

        // Cancel button
        document.getElementById('aoi-cancel-btn').addEventListener('click', () => this.close());

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', this.handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });

        if (!readOnly) {
            // Save button
            document.getElementById('aoi-save-btn').addEventListener('click', () => this.save());

            // Delete button
            const deleteBtn = document.getElementById('aoi-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.confirmDelete());
            }

            // Auto-generate normalized name from name
            document.getElementById('aoi-name').addEventListener('input', (e) => {
                const normalized = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_|_$/g, '');
                document.getElementById('aoi-normalized-name').value = normalized;
            });
        }
    }

    /**
     * Collect form data
     */
    collectFormData() {
        return {
            name: document.getElementById('aoi-name').value.trim(),
            normalized_name: document.getElementById('aoi-normalized-name').value.trim(),
            description: document.getElementById('aoi-description').value.trim(),
            aoi_type: document.getElementById('aoi-type').value,
            purpose: document.getElementById('aoi-purpose').value,
            ecosystem_code: document.getElementById('aoi-ecosystem').value,
            status: document.getElementById('aoi-status').value,
            geometry_json: this.currentAOI.geometry_json,
            geometry_type: this.currentAOI.geometry_json ? 'Polygon' : null,
            centroid_lat: this.currentAOI.centroid_lat,
            centroid_lon: this.currentAOI.centroid_lon,
            area_m2: this.currentAOI.area_m2,
            perimeter_m: this.currentAOI.perimeter_m,
            bbox_json: this.currentAOI.bbox_json,
            source: this.currentAOI.source || 'manual',
            station_id: this.currentAOI.station_id,
            platform_id: this.currentAOI.platform_id
        };
    }

    /**
     * Validate form data
     */
    validate(data) {
        const errors = [];

        if (!data.name || data.name.length < 3) {
            errors.push({ field: 'name', message: 'Name must be at least 3 characters' });
        }

        if (!data.geometry_json) {
            errors.push({ field: 'geometry', message: 'Please draw an area on the map' });
        }

        return errors;
    }

    /**
     * Save AOI
     */
    async save() {
        const data = this.collectFormData();

        // Validate
        const errors = this.validate(data);
        if (errors.length > 0) {
            this.showErrors(errors);
            return;
        }

        // Show loading
        const saveBtn = document.getElementById('aoi-save-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            let result;

            if (this.options.apiClient) {
                if (this.isNew) {
                    result = await this.options.apiClient.post('/api/aois', data);
                } else {
                    result = await this.options.apiClient.put(`/api/aois/${this.currentAOI.id}`, data);
                }
            } else {
                // Direct fetch if no API client
                const endpoint = this.isNew ? '/api/aois' : `/api/aois/${this.currentAOI.id}`;
                const method = this.isNew ? 'POST' : 'PUT';

                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(data)
                });

                result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Failed to save AOI');
                }
            }

            // Success callback
            if (this.options.onSave) {
                this.options.onSave(result);
            }

            // Show success toast
            if (window.Toast) {
                window.Toast.success(this.isNew ? 'AOI created successfully' : 'AOI updated successfully');
            }

            this.close();

        } catch (error) {
            console.error('Error saving AOI:', error);

            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="fas fa-save"></i> ${this.isNew ? 'Create AOI' : 'Save Changes'}`;

            if (window.Toast) {
                window.Toast.error(error.message || 'Failed to save AOI');
            }
        }
    }

    /**
     * Show validation errors
     */
    showErrors(errors) {
        // Clear existing errors
        document.querySelectorAll('.aoi-form-error').forEach(el => el.remove());
        document.querySelectorAll('.aoi-form-input.error').forEach(el => el.classList.remove('error'));

        errors.forEach(error => {
            if (error.field === 'name') {
                const input = document.getElementById('aoi-name');
                input.classList.add('error');
                input.insertAdjacentHTML('afterend', `<div class="aoi-form-error">${error.message}</div>`);
            } else if (error.field === 'geometry') {
                const preview = document.getElementById('aoi-geojson-preview');
                preview.insertAdjacentHTML('afterend', `<div class="aoi-form-error">${error.message}</div>`);
            }
        });

        if (window.Toast) {
            window.Toast.error('Please fix the errors before saving');
        }
    }

    /**
     * Confirm delete
     */
    confirmDelete() {
        if (confirm('Are you sure you want to delete this AOI? This action cannot be undone.')) {
            this.delete();
        }
    }

    /**
     * Delete AOI
     */
    async delete() {
        const deleteBtn = document.getElementById('aoi-delete-btn');
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

        try {
            if (this.options.apiClient) {
                await this.options.apiClient.delete(`/api/aois/${this.currentAOI.id}`);
            } else {
                const response = await fetch(`/api/aois/${this.currentAOI.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.message || 'Failed to delete AOI');
                }
            }

            if (this.options.onDelete) {
                this.options.onDelete(this.currentAOI);
            }

            if (window.Toast) {
                window.Toast.success('AOI deleted successfully');
            }

            this.close();

        } catch (error) {
            console.error('Error deleting AOI:', error);

            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';

            if (window.Toast) {
                window.Toast.error(error.message || 'Failed to delete AOI');
            }
        }
    }

    /**
     * Close modal
     */
    close() {
        if (!this.modal) return;

        // Remove escape listener
        if (this.handleEscape) {
            document.removeEventListener('keydown', this.handleEscape);
        }

        // Destroy drawing tools
        if (this.drawingTools) {
            this.drawingTools.destroy();
            this.drawingTools = null;
        }

        // Destroy map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        // Animate out
        this.modal.classList.remove('visible');

        setTimeout(() => {
            if (this.modal) {
                this.modal.remove();
                this.modal = null;
            }
        }, 200);
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.AOIModal = AOIModal;
}
