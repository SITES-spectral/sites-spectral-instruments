// SITES Spectral - AOI Drawing Tools
// Interactive polygon drawing for Areas of Interest
// Version: 8.5.7
//
// SECURITY NOTE: This module uses innerHTML for UI templates. This is safe because:
// 1. All HTML is static/hardcoded - no user data is interpolated
// 2. Dynamic content (measurements, coordinates) uses textContent, not innerHTML
// 3. User-uploaded GeoJSON is parsed and validated, never rendered as HTML

/**
 * AOI Drawing Tools Manager
 * Provides polygon drawing, editing, and GeoJSON import/export functionality
 */
class AOIDrawingTools {
    constructor(map, options = {}) {
        this.map = map;
        this.options = {
            onComplete: null,
            onCancel: null,
            onChange: null,
            ...options
        };

        // Drawing state
        this.isDrawing = false;
        this.isEditing = false;
        this.currentPoints = [];
        this.currentPolygon = null;
        this.currentMarkers = [];
        this.tempLine = null;

        // Style configuration
        this.styles = {
            vertex: {
                radius: 6,
                color: '#059669',
                fillColor: '#ffffff',
                fillOpacity: 1,
                weight: 2
            },
            edge: {
                color: '#059669',
                weight: 2,
                dashArray: '5, 5'
            },
            polygon: {
                color: '#059669',
                weight: 2,
                fillColor: '#059669',
                fillOpacity: 0.2
            },
            hover: {
                color: '#059669',
                weight: 3,
                fillColor: '#059669',
                fillOpacity: 0.3
            }
        };

        // DOM elements
        this.controlsContainer = null;
        this.infoPanel = null;

        // Bind methods
        this.handleMapClick = this.handleMapClick.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Initialize drawing tools with UI controls
     */
    initialize() {
        this.createControlsUI();
        this.createInfoPanel();
    }

    /**
     * Create drawing controls UI
     */
    createControlsUI() {
        // Create controls container
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.className = 'aoi-drawing-controls';
        this.controlsContainer.innerHTML = `
            <div class="aoi-controls-header">
                <span class="aoi-controls-title">
                    <i class="fas fa-draw-polygon"></i> AOI Drawing
                </span>
                <button class="aoi-controls-close" title="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="aoi-controls-body">
                <div class="aoi-controls-buttons">
                    <button class="aoi-btn aoi-btn-draw" data-action="draw" title="Draw Polygon">
                        <i class="fas fa-pencil-alt"></i>
                        <span>Draw</span>
                    </button>
                    <button class="aoi-btn aoi-btn-import" data-action="import" title="Import GeoJSON">
                        <i class="fas fa-file-import"></i>
                        <span>Import</span>
                    </button>
                    <button class="aoi-btn aoi-btn-clear" data-action="clear" title="Clear" disabled>
                        <i class="fas fa-trash-alt"></i>
                        <span>Clear</span>
                    </button>
                </div>
                <div class="aoi-controls-status">
                    <span class="status-text">Click Draw to start</span>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();

        // Attach event listeners
        this.controlsContainer.querySelector('.aoi-controls-close').addEventListener('click', () => {
            this.cancel();
        });

        this.controlsContainer.querySelectorAll('.aoi-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleControlAction(action);
            });
        });

        // Add to map container
        const mapContainer = this.map.getContainer();
        mapContainer.appendChild(this.controlsContainer);
    }

    /**
     * Create info panel for displaying coordinates and measurements
     */
    createInfoPanel() {
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'aoi-info-panel';
        this.infoPanel.style.display = 'none';
        this.infoPanel.innerHTML = `
            <div class="aoi-info-row">
                <span class="label">Points:</span>
                <span class="value" id="aoi-point-count">0</span>
            </div>
            <div class="aoi-info-row">
                <span class="label">Area:</span>
                <span class="value" id="aoi-area">0 m2</span>
            </div>
            <div class="aoi-info-row">
                <span class="label">Perimeter:</span>
                <span class="value" id="aoi-perimeter">0 m</span>
            </div>
        `;

        const mapContainer = this.map.getContainer();
        mapContainer.appendChild(this.infoPanel);
    }

    /**
     * Add CSS styles for drawing tools
     */
    addStyles() {
        if (document.getElementById('aoi-drawing-styles')) return;

        const style = document.createElement('style');
        style.id = 'aoi-drawing-styles';
        style.textContent = `
            .aoi-drawing-controls {
                position: absolute;
                top: 10px;
                right: 10px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                min-width: 200px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .aoi-controls-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid #e5e7eb;
                background: #f9fafb;
                border-radius: 8px 8px 0 0;
            }

            .aoi-controls-title {
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }

            .aoi-controls-title i {
                color: #059669;
                margin-right: 8px;
            }

            .aoi-controls-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #6b7280;
                padding: 4px;
                border-radius: 4px;
            }

            .aoi-controls-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .aoi-controls-body {
                padding: 12px 16px;
            }

            .aoi-controls-buttons {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }

            .aoi-btn {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 8px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 12px;
            }

            .aoi-btn i {
                font-size: 16px;
            }

            .aoi-btn:hover:not(:disabled) {
                border-color: #059669;
                background: #f0fdf4;
            }

            .aoi-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .aoi-btn.active {
                background: #059669;
                color: white;
                border-color: #059669;
            }

            .aoi-btn-draw i { color: #059669; }
            .aoi-btn-import i { color: #2563eb; }
            .aoi-btn-clear i { color: #dc2626; }
            .aoi-btn.active i { color: white; }

            .aoi-controls-status {
                text-align: center;
                padding: 8px;
                background: #f9fafb;
                border-radius: 4px;
                font-size: 12px;
                color: #6b7280;
            }

            .aoi-info-panel {
                position: absolute;
                bottom: 30px;
                left: 10px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                padding: 12px 16px;
                min-width: 150px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .aoi-info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
                font-size: 12px;
            }

            .aoi-info-row:last-child {
                margin-bottom: 0;
            }

            .aoi-info-row .label {
                color: #6b7280;
            }

            .aoi-info-row .value {
                color: #374151;
                font-weight: 500;
            }

            .aoi-import-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }

            .aoi-import-content {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .aoi-import-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .aoi-import-header h3 {
                margin: 0;
                font-size: 18px;
                color: #374151;
            }

            .aoi-import-dropzone {
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 32px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
            }

            .aoi-import-dropzone:hover,
            .aoi-import-dropzone.dragover {
                border-color: #059669;
                background: #f0fdf4;
            }

            .aoi-import-dropzone i {
                font-size: 32px;
                color: #9ca3af;
                margin-bottom: 12px;
            }

            .aoi-import-dropzone p {
                margin: 0;
                color: #6b7280;
            }

            .aoi-import-preview {
                margin-top: 16px;
                padding: 12px;
                background: #f9fafb;
                border-radius: 6px;
                font-family: monospace;
                font-size: 12px;
                max-height: 150px;
                overflow: auto;
            }

            .aoi-import-actions {
                display: flex;
                gap: 12px;
                margin-top: 20px;
                justify-content: flex-end;
            }

            .aoi-import-btn {
                padding: 8px 16px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }

            .aoi-import-btn-cancel {
                background: #f3f4f6;
                color: #374151;
            }

            .aoi-import-btn-cancel:hover {
                background: #e5e7eb;
            }

            .aoi-import-btn-confirm {
                background: #059669;
                color: white;
            }

            .aoi-import-btn-confirm:hover {
                background: #047857;
            }

            .aoi-import-btn-confirm:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Handle control button actions
     */
    handleControlAction(action) {
        switch (action) {
            case 'draw':
                this.startDrawing();
                break;
            case 'import':
                this.showImportModal();
                break;
            case 'clear':
                this.clearDrawing();
                break;
        }
    }

    /**
     * Start polygon drawing mode
     */
    startDrawing() {
        if (this.isDrawing) {
            this.finishDrawing();
            return;
        }

        this.isDrawing = true;
        this.currentPoints = [];

        // Update UI
        const drawBtn = this.controlsContainer.querySelector('[data-action="draw"]');
        drawBtn.classList.add('active');
        drawBtn.querySelector('span').textContent = 'Finish';

        this.updateStatus('Click on map to add points. Double-click or press Enter to finish.');
        this.infoPanel.style.display = 'block';

        // Enable clear button
        this.controlsContainer.querySelector('[data-action="clear"]').disabled = false;

        // Add map event listeners
        this.map.on('click', this.handleMapClick);
        this.map.on('mousemove', this.handleMouseMove);
        document.addEventListener('keydown', this.handleKeyDown);

        // Change cursor
        this.map.getContainer().style.cursor = 'crosshair';
    }

    /**
     * Handle map click during drawing
     */
    handleMapClick(e) {
        if (!this.isDrawing) return;

        const point = [e.latlng.lat, e.latlng.lng];
        this.currentPoints.push(point);

        // Add vertex marker
        const marker = L.circleMarker(e.latlng, this.styles.vertex);
        marker.addTo(this.map);
        this.currentMarkers.push(marker);

        // Update polygon
        this.updatePolygon();

        // Update info panel
        this.updateInfoPanel();
    }

    /**
     * Handle mouse move during drawing
     */
    handleMouseMove(e) {
        if (!this.isDrawing || this.currentPoints.length === 0) return;

        // Remove existing temp line
        if (this.tempLine) {
            this.map.removeLayer(this.tempLine);
        }

        // Draw line from last point to cursor
        const lastPoint = this.currentPoints[this.currentPoints.length - 1];
        this.tempLine = L.polyline([lastPoint, [e.latlng.lat, e.latlng.lng]], {
            ...this.styles.edge,
            dashArray: '5, 5'
        }).addTo(this.map);
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(e) {
        if (!this.isDrawing) return;

        if (e.key === 'Enter') {
            this.finishDrawing();
        } else if (e.key === 'Escape') {
            this.cancel();
        } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            this.undoLastPoint();
        }
    }

    /**
     * Undo last added point
     */
    undoLastPoint() {
        if (this.currentPoints.length === 0) return;

        this.currentPoints.pop();

        // Remove last marker
        const marker = this.currentMarkers.pop();
        if (marker) {
            this.map.removeLayer(marker);
        }

        // Update polygon
        this.updatePolygon();
        this.updateInfoPanel();
    }

    /**
     * Update polygon display
     */
    updatePolygon() {
        // Remove existing polygon
        if (this.currentPolygon) {
            this.map.removeLayer(this.currentPolygon);
        }

        if (this.currentPoints.length >= 3) {
            // Close the polygon
            const closedPoints = [...this.currentPoints, this.currentPoints[0]];
            this.currentPolygon = L.polygon(closedPoints, this.styles.polygon).addTo(this.map);
        } else if (this.currentPoints.length >= 2) {
            // Draw line
            this.currentPolygon = L.polyline(this.currentPoints, this.styles.edge).addTo(this.map);
        }
    }

    /**
     * Update info panel with measurements
     */
    updateInfoPanel() {
        const pointCountEl = document.getElementById('aoi-point-count');
        const areaEl = document.getElementById('aoi-area');
        const perimeterEl = document.getElementById('aoi-perimeter');

        if (pointCountEl) pointCountEl.textContent = this.currentPoints.length;

        if (this.currentPoints.length >= 3) {
            const area = this.calculateArea(this.currentPoints);
            const perimeter = this.calculatePerimeter(this.currentPoints);

            if (areaEl) areaEl.textContent = this.formatArea(area);
            if (perimeterEl) perimeterEl.textContent = this.formatDistance(perimeter);
        } else {
            if (areaEl) areaEl.textContent = '0 m2';
            if (perimeterEl) perimeterEl.textContent = '0 m';
        }
    }

    /**
     * Calculate polygon area in square meters
     */
    calculateArea(points) {
        if (points.length < 3) return 0;

        // Use Shoelace formula with geodetic correction
        let area = 0;
        const n = points.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const lat1 = points[i][0] * Math.PI / 180;
            const lat2 = points[j][0] * Math.PI / 180;
            const lon1 = points[i][1] * Math.PI / 180;
            const lon2 = points[j][1] * Math.PI / 180;

            area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
        }

        // Earth radius in meters
        const R = 6371000;
        area = Math.abs(area * R * R / 2);

        return area;
    }

    /**
     * Calculate polygon perimeter in meters
     */
    calculatePerimeter(points) {
        if (points.length < 2) return 0;

        let perimeter = 0;
        const n = points.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            perimeter += this.haversineDistance(points[i], points[j]);
        }

        return perimeter;
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    haversineDistance(point1, point2) {
        const R = 6371000; // Earth radius in meters
        const lat1 = point1[0] * Math.PI / 180;
        const lat2 = point2[0] * Math.PI / 180;
        const dLat = (point2[0] - point1[0]) * Math.PI / 180;
        const dLon = (point2[1] - point1[1]) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
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
     * Finish drawing and return GeoJSON
     */
    finishDrawing() {
        if (!this.isDrawing) return null;

        if (this.currentPoints.length < 3) {
            this.updateStatus('Need at least 3 points to create a polygon');
            return null;
        }

        // Create GeoJSON
        const geojson = this.toGeoJSON();

        // Calculate metrics
        const area = this.calculateArea(this.currentPoints);
        const perimeter = this.calculatePerimeter(this.currentPoints);
        const centroid = this.calculateCentroid(this.currentPoints);
        const bbox = this.calculateBBox(this.currentPoints);

        // Reset drawing state
        this.isDrawing = false;
        this.map.off('click', this.handleMapClick);
        this.map.off('mousemove', this.handleMouseMove);
        document.removeEventListener('keydown', this.handleKeyDown);

        // Remove temp line
        if (this.tempLine) {
            this.map.removeLayer(this.tempLine);
            this.tempLine = null;
        }

        // Update UI
        const drawBtn = this.controlsContainer.querySelector('[data-action="draw"]');
        drawBtn.classList.remove('active');
        drawBtn.querySelector('span').textContent = 'Draw';
        this.map.getContainer().style.cursor = '';

        this.updateStatus('Drawing complete. Click Draw to modify or Clear to start over.');

        // Callback
        if (this.options.onComplete) {
            this.options.onComplete({
                geojson,
                points: this.currentPoints,
                area,
                perimeter,
                centroid,
                bbox
            });
        }

        return { geojson, area, perimeter, centroid, bbox };
    }

    /**
     * Convert current points to GeoJSON
     */
    toGeoJSON() {
        if (this.currentPoints.length < 3) return null;

        // Close the ring and convert to [lng, lat] format for GeoJSON
        const coordinates = this.currentPoints.map(p => [p[1], p[0]]);
        coordinates.push(coordinates[0]); // Close ring

        return {
            type: 'Polygon',
            coordinates: [coordinates]
        };
    }

    /**
     * Calculate centroid of polygon
     */
    calculateCentroid(points) {
        if (points.length === 0) return [0, 0];

        let latSum = 0;
        let lngSum = 0;

        points.forEach(p => {
            latSum += p[0];
            lngSum += p[1];
        });

        return [latSum / points.length, lngSum / points.length];
    }

    /**
     * Calculate bounding box
     */
    calculateBBox(points) {
        if (points.length === 0) return [0, 0, 0, 0];

        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        points.forEach(p => {
            minLat = Math.min(minLat, p[0]);
            maxLat = Math.max(maxLat, p[0]);
            minLng = Math.min(minLng, p[1]);
            maxLng = Math.max(maxLng, p[1]);
        });

        return [minLng, minLat, maxLng, maxLat];
    }

    /**
     * Clear current drawing
     */
    clearDrawing() {
        // Remove markers
        this.currentMarkers.forEach(m => this.map.removeLayer(m));
        this.currentMarkers = [];

        // Remove polygon
        if (this.currentPolygon) {
            this.map.removeLayer(this.currentPolygon);
            this.currentPolygon = null;
        }

        // Remove temp line
        if (this.tempLine) {
            this.map.removeLayer(this.tempLine);
            this.tempLine = null;
        }

        // Reset state
        this.currentPoints = [];
        this.isDrawing = false;
        this.isEditing = false;

        // Update UI
        const drawBtn = this.controlsContainer.querySelector('[data-action="draw"]');
        drawBtn.classList.remove('active');
        drawBtn.querySelector('span').textContent = 'Draw';
        this.controlsContainer.querySelector('[data-action="clear"]').disabled = true;

        this.map.off('click', this.handleMapClick);
        this.map.off('mousemove', this.handleMouseMove);
        document.removeEventListener('keydown', this.handleKeyDown);

        this.map.getContainer().style.cursor = '';
        this.infoPanel.style.display = 'none';

        this.updateStatus('Click Draw to start');
    }

    /**
     * Cancel drawing
     */
    cancel() {
        this.clearDrawing();

        if (this.options.onCancel) {
            this.options.onCancel();
        }
    }

    /**
     * Update status text
     */
    updateStatus(text) {
        const statusEl = this.controlsContainer.querySelector('.status-text');
        if (statusEl) {
            statusEl.textContent = text;
        }
    }

    /**
     * Show import modal
     */
    showImportModal() {
        const modal = document.createElement('div');
        modal.className = 'aoi-import-modal';
        modal.innerHTML = `
            <div class="aoi-import-content">
                <div class="aoi-import-header">
                    <h3><i class="fas fa-file-import"></i> Import GeoJSON</h3>
                    <button class="aoi-controls-close" onclick="this.closest('.aoi-import-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="aoi-import-dropzone" id="aoi-dropzone">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop a GeoJSON file here</p>
                    <p><small>or click to browse</small></p>
                    <input type="file" accept=".geojson,.json" style="display: none" id="aoi-file-input">
                </div>
                <div class="aoi-import-preview" id="aoi-preview" style="display: none"></div>
                <div class="aoi-import-actions">
                    <button class="aoi-import-btn aoi-import-btn-cancel" onclick="this.closest('.aoi-import-modal').remove()">
                        Cancel
                    </button>
                    <button class="aoi-import-btn aoi-import-btn-confirm" id="aoi-import-confirm" disabled>
                        Import
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup drag and drop
        const dropzone = modal.querySelector('#aoi-dropzone');
        const fileInput = modal.querySelector('#aoi-file-input');
        const preview = modal.querySelector('#aoi-preview');
        const confirmBtn = modal.querySelector('#aoi-import-confirm');

        let importedGeojson = null;

        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) processFile(file);
        });

        const processFile = (file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const geojson = JSON.parse(e.target.result);
                    importedGeojson = this.extractPolygon(geojson);

                    if (importedGeojson) {
                        preview.style.display = 'block';
                        preview.textContent = JSON.stringify(importedGeojson, null, 2).substring(0, 500) + '...';
                        confirmBtn.disabled = false;
                    } else {
                        preview.style.display = 'block';
                        preview.textContent = 'Error: No valid polygon found in GeoJSON';
                        confirmBtn.disabled = true;
                    }
                } catch (err) {
                    preview.style.display = 'block';
                    preview.textContent = 'Error parsing GeoJSON: ' + err.message;
                    confirmBtn.disabled = true;
                }
            };
            reader.readAsText(file);
        };

        confirmBtn.addEventListener('click', () => {
            if (importedGeojson) {
                this.loadFromGeoJSON(importedGeojson);
                modal.remove();
            }
        });
    }

    /**
     * Extract polygon from GeoJSON (handles Feature, FeatureCollection, Geometry)
     */
    extractPolygon(geojson) {
        if (!geojson) return null;

        if (geojson.type === 'FeatureCollection') {
            // Find first polygon feature
            const feature = geojson.features.find(f =>
                f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
            );
            return feature ? feature.geometry : null;
        }

        if (geojson.type === 'Feature') {
            return geojson.geometry;
        }

        if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
            return geojson;
        }

        return null;
    }

    /**
     * Load polygon from GeoJSON geometry
     */
    loadFromGeoJSON(geometry) {
        // Clear existing
        this.clearDrawing();

        if (!geometry || !geometry.coordinates) return;

        let coordinates;

        if (geometry.type === 'Polygon') {
            // Get outer ring (first array)
            coordinates = geometry.coordinates[0];
        } else if (geometry.type === 'MultiPolygon') {
            // Get first polygon's outer ring
            coordinates = geometry.coordinates[0][0];
        } else {
            return;
        }

        // Convert from [lng, lat] to [lat, lng] and remove closing point
        this.currentPoints = coordinates.slice(0, -1).map(c => [c[1], c[0]]);

        // Add markers
        this.currentPoints.forEach(point => {
            const marker = L.circleMarker(point, this.styles.vertex);
            marker.addTo(this.map);
            this.currentMarkers.push(marker);
        });

        // Draw polygon
        this.updatePolygon();

        // Enable clear button
        this.controlsContainer.querySelector('[data-action="clear"]').disabled = false;

        // Fit map to polygon
        if (this.currentPolygon) {
            this.map.fitBounds(this.currentPolygon.getBounds(), { padding: [50, 50] });
        }

        // Show info panel
        this.infoPanel.style.display = 'block';
        this.updateInfoPanel();

        this.updateStatus('GeoJSON imported. Click Draw to edit or Clear to start over.');

        // Trigger change callback
        if (this.options.onChange) {
            this.options.onChange({
                geojson: this.toGeoJSON(),
                points: this.currentPoints,
                area: this.calculateArea(this.currentPoints),
                perimeter: this.calculatePerimeter(this.currentPoints),
                centroid: this.calculateCentroid(this.currentPoints),
                bbox: this.calculateBBox(this.currentPoints)
            });
        }
    }

    /**
     * Get current GeoJSON geometry
     */
    getGeoJSON() {
        return this.toGeoJSON();
    }

    /**
     * Get all metrics
     */
    getMetrics() {
        return {
            points: this.currentPoints,
            area: this.calculateArea(this.currentPoints),
            perimeter: this.calculatePerimeter(this.currentPoints),
            centroid: this.calculateCentroid(this.currentPoints),
            bbox: this.calculateBBox(this.currentPoints)
        };
    }

    /**
     * Show drawing tools
     */
    show() {
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'block';
        }
    }

    /**
     * Hide drawing tools
     */
    hide() {
        this.clearDrawing();
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'none';
        }
        if (this.infoPanel) {
            this.infoPanel.style.display = 'none';
        }
    }

    /**
     * Destroy and clean up
     */
    destroy() {
        this.clearDrawing();

        if (this.controlsContainer) {
            this.controlsContainer.remove();
        }
        if (this.infoPanel) {
            this.infoPanel.remove();
        }
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.AOIDrawingTools = AOIDrawingTools;
}
