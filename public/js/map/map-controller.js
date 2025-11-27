// SITES Spectral - Map Controller
// Main controller orchestrating all map functionality

class MapController {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = null;
        this.map = null;
        this.config = window.mapConfig || new MapConfig();
        this.tileLayerManager = new TileLayerManager(this.config);
        this.markerManager = new MarkerManager(this.config);
        this.geojsonManager = new GeoJSONLayerManager(this.config);
        this.options = options;
        this.initialized = false;
        this.eventListeners = new Map();
    }

    /**
     * Initialize the map
     * @param {Object} customOptions - Custom map options
     * @returns {Promise<L.Map>} Promise resolving to Leaflet map instance
     */
    async initialize(customOptions = {}) {
        try {
            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }

            // Get container
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                throw new Error(`Map container not found: ${this.containerId}`);
            }

            // Merge options
            const mapOptions = this.config.getMapOptions({
                ...this.options,
                ...customOptions
            });

            // Create map
            this.map = L.map(this.containerId, mapOptions);

            // Add base layers
            this.tileLayerManager.addBaseLayersToMap(this.map, customOptions.defaultLayer || 'osm');

            // Setup event handlers
            this.setupEventHandlers();

            this.initialized = true;
            this.emit('initialized', { map: this.map });

            return this.map;
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showError(error.message);
            throw error;
        }
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        if (!this.map) return;

        // Map events
        this.map.on('zoomend', () => {
            this.emit('zoom', { zoom: this.map.getZoom() });
        });

        this.map.on('moveend', () => {
            this.emit('move', { center: this.map.getCenter() });
        });

        this.map.on('click', (e) => {
            this.emit('click', { latlng: e.latlng });
        });

        // Layer events
        this.map.on('baselayerchange', (e) => {
            this.emit('layerchange', { layer: e.name });
        });
    }

    /**
     * Add station marker
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} data - Station data
     * @returns {L.Marker} Marker instance
     */
    addStationMarker(lat, lng, data = {}) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return null;
        }

        const marker = this.markerManager.createStationMarker(lat, lng, data);
        marker.addTo(this.map);
        return marker;
    }

    /**
     * Add platform markers
     * @param {Array} platforms - Array of platform objects
     * @param {Object} options - Options including clustering
     * @returns {Array} Array of markers
     */
    addPlatformMarkers(platforms, options = {}) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return [];
        }

        return this.markerManager.addMarkers(
            this.map,
            platforms,
            'platform',
            options.cluster || false
        );
    }

    /**
     * Add instrument markers
     * @param {Array} instruments - Array of instrument objects
     * @param {Object} options - Options including clustering
     * @returns {Array} Array of markers
     */
    addInstrumentMarkers(instruments, options = {}) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return [];
        }

        return this.markerManager.addMarkers(
            this.map,
            instruments,
            'instrument',
            options.cluster || false
        );
    }

    /**
     * Add GeoJSON layer
     * @param {Object|Array} geojsonData - GeoJSON data
     * @param {Object} options - Layer options
     * @returns {L.GeoJSON} GeoJSON layer
     */
    addGeoJSONLayer(geojsonData, options = {}) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return null;
        }

        return this.geojsonManager.addGeoJSONLayer(this.map, geojsonData, options);
    }

    /**
     * Load GeoJSON from URL
     * @param {string} url - URL to GeoJSON file
     * @param {Object} options - Options
     * @returns {Promise<L.GeoJSON>} Promise resolving to layer
     */
    async loadGeoJSON(url, options = {}) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return null;
        }

        return await this.geojsonManager.loadGeoJSONFromURL(url, {
            ...options,
            map: this.map,
            addToMap: options.addToMap !== false
        });
    }

    /**
     * Add ROI layers
     * @param {Array} rois - Array of ROI objects
     * @param {Object} options - Layer options
     * @returns {Array} Array of layers
     */
    addROILayers(rois, options = {}) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return [];
        }

        return this.geojsonManager.addROILayers(this.map, rois, options);
    }

    /**
     * Center map on coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} zoom - Optional zoom level
     */
    centerOn(lat, lng, zoom = null) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return;
        }

        if (zoom !== null) {
            this.map.setView([lat, lng], zoom);
        } else {
            this.map.panTo([lat, lng]);
        }
    }

    /**
     * Fit map to markers of a type
     * @param {string} type - Marker type (station, platform, instrument)
     * @param {Object} options - Fit bounds options
     */
    fitToMarkers(type, options = {}) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return;
        }

        this.markerManager.fitToMarkers(this.map, type, options);
    }

    /**
     * Fit map to bounds
     * @param {Array} bounds - Bounds [[south, west], [north, east]]
     * @param {Object} options - Fit bounds options
     */
    fitToBounds(bounds, options = {}) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return;
        }

        this.map.fitBounds(bounds, options);
    }

    /**
     * Switch base layer
     * @param {string} layerKey - Layer key (osm, satellite, topographic)
     */
    switchBaseLayer(layerKey) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return;
        }

        this.tileLayerManager.switchBaseLayer(this.map, layerKey);
    }

    /**
     * Clear markers of a type
     * @param {string} type - Marker type to clear
     */
    clearMarkers(type) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return;
        }

        this.markerManager.clearMarkers(this.map, type);
    }

    /**
     * Clear all markers
     */
    clearAllMarkers() {
        if (!this.initialized) {
            console.error('Map not initialized');
            return;
        }

        this.markerManager.clearAllMarkers(this.map);
    }

    /**
     * Clear GeoJSON layers
     * @param {string} groupId - Optional group ID to clear specific group
     */
    clearGeoJSONLayers(groupId = null) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return;
        }

        if (groupId) {
            this.geojsonManager.removeLayerGroup(this.map, groupId);
        } else {
            this.geojsonManager.clearAllLayers(this.map);
        }
    }

    /**
     * Toggle layer group visibility
     * @param {string} groupId - Group ID
     */
    toggleLayerGroup(groupId) {
        if (!this.initialized) {
            console.error('Map not initialized');
            return;
        }

        this.geojsonManager.toggleLayerGroup(this.map, groupId);
    }

    /**
     * Invalidate map size (call after container resize)
     */
    invalidateSize() {
        if (!this.initialized || !this.map) {
            return;
        }

        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);
    }

    /**
     * Get current map bounds
     * @returns {L.LatLngBounds|null} Map bounds or null
     */
    getBounds() {
        if (!this.initialized || !this.map) {
            return null;
        }

        return this.map.getBounds();
    }

    /**
     * Get current map center
     * @returns {L.LatLng|null} Map center or null
     */
    getCenter() {
        if (!this.initialized || !this.map) {
            return null;
        }

        return this.map.getCenter();
    }

    /**
     * Get current zoom level
     * @returns {number|null} Zoom level or null
     */
    getZoom() {
        if (!this.initialized || !this.map) {
            return null;
        }

        return this.map.getZoom();
    }

    /**
     * Get map instance
     * @returns {L.Map|null} Map instance or null
     */
    getMap() {
        return this.map;
    }

    /**
     * Check if map is initialized
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (!this.container) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'map-error-message';
        errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fee;
            color: #c00;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #c00;
            z-index: 1000;
            max-width: 400px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h4 style="margin: 0 0 10px 0;">Map Error</h4>
            <p style="margin: 0;">${message}</p>
        `;

        this.container.appendChild(errorDiv);
    }

    /**
     * Event emitter
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data = {}) {
        const customEvent = new CustomEvent(`map:${event}`, {
            detail: { ...data, controller: this }
        });
        window.dispatchEvent(customEvent);

        // Call registered listeners
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }

    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Unregister event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Destroy map and cleanup
     */
    destroy() {
        if (this.map) {
            this.clearAllMarkers();
            this.clearGeoJSONLayers();
            this.map.remove();
            this.map = null;
        }

        this.initialized = false;
        this.eventListeners.clear();
        this.emit('destroyed');
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.MapController = MapController;
}
