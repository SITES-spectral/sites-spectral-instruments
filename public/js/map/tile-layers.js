// SITES Spectral - Tile Layer Manager
// Manages base map tile layers with error handling and crossOrigin support

class TileLayerManager {
    constructor(config) {
        this.config = config || window.mapConfig;
        this.activeLayers = new Map();
        this.errorCount = new Map();
    }

    /**
     * Create a tile layer with error handling
     * @param {string} layerKey - Key for the tile layer (osm, satellite, topographic)
     * @param {Object} customOptions - Additional options to override defaults
     * @returns {L.TileLayer} Leaflet tile layer
     */
    createTileLayer(layerKey = 'osm', customOptions = {}) {
        const layerConfig = this.config.getTileLayer(layerKey);
        if (!layerConfig) {
            console.error(`Tile layer configuration not found: ${layerKey}`);
            return null;
        }

        const options = {
            ...layerConfig.options,
            ...customOptions
        };

        const tileLayer = L.tileLayer(layerConfig.url, options);

        // Add error handling
        this.setupErrorHandling(tileLayer, layerKey);

        return tileLayer;
    }

    /**
     * Setup error handling for a tile layer
     * @param {L.TileLayer} tileLayer - The tile layer to add error handling to
     * @param {string} layerKey - Key identifier for the layer
     */
    setupErrorHandling(tileLayer, layerKey) {
        // Initialize error count
        this.errorCount.set(layerKey, 0);

        // Handle tile load errors
        tileLayer.on('tileerror', (error) => {
            const count = this.errorCount.get(layerKey) || 0;
            this.errorCount.set(layerKey, count + 1);

            // Log error (but not too many to avoid spam)
            if (count < 5) {
                console.warn(`Tile load error for ${layerKey}:`, error);
            } else if (count === 5) {
                console.warn(`Multiple tile errors for ${layerKey}. Further errors will be suppressed.`);
            }

            // Replace failed tile with error tile
            if (error.tile) {
                error.tile.src = this.config.getErrorTileUrl();
            }
        });

        // Handle successful tile load
        tileLayer.on('tileload', () => {
            // Reset error count on successful loads
            const count = this.errorCount.get(layerKey) || 0;
            if (count > 0) {
                this.errorCount.set(layerKey, Math.max(0, count - 1));
            }
        });

        // Handle loading start
        tileLayer.on('loading', () => {
            this.emit('loading', { layerKey });
        });

        // Handle loading complete
        tileLayer.on('load', () => {
            this.emit('loaded', { layerKey });
        });
    }

    /**
     * Create all base layers for layer control
     * @returns {Object} Object with layer names as keys and L.TileLayer as values
     */
    createBaseLayers() {
        const baseLayers = {};

        // Create OSM layer
        baseLayers['OpenStreetMap'] = this.createTileLayer('osm');

        // Create satellite layer
        baseLayers['Satellite'] = this.createTileLayer('satellite');

        // Create topographic layer
        baseLayers['Topographic'] = this.createTileLayer('topographic');

        return baseLayers;
    }

    /**
     * Add base layers to a map with layer control
     * @param {L.Map} map - Leaflet map instance
     * @param {string} defaultLayer - Key for the default layer to show
     * @returns {L.Control.Layers} Layer control instance
     */
    addBaseLayersToMap(map, defaultLayer = 'osm') {
        const baseLayers = this.createBaseLayers();

        // Add default layer to map
        const defaultLayerName = this.getLayerName(defaultLayer);
        if (baseLayers[defaultLayerName]) {
            baseLayers[defaultLayerName].addTo(map);
        } else {
            // Fallback to first available layer
            const firstLayer = Object.values(baseLayers)[0];
            if (firstLayer) {
                firstLayer.addTo(map);
            }
        }

        // Create layer control
        const layerControl = L.control.layers(baseLayers, null, {
            position: 'topright',
            collapsed: true
        });

        layerControl.addTo(map);

        // Store references
        map._baseLayers = baseLayers;
        map._layerControl = layerControl;

        return layerControl;
    }

    /**
     * Get display name for layer key
     * @param {string} layerKey - Layer key
     * @returns {string} Display name
     */
    getLayerName(layerKey) {
        const names = {
            'osm': 'OpenStreetMap',
            'satellite': 'Satellite',
            'topographic': 'Topographic'
        };
        return names[layerKey] || 'OpenStreetMap';
    }

    /**
     * Switch active base layer
     * @param {L.Map} map - Leaflet map instance
     * @param {string} layerKey - Key for the layer to switch to
     */
    switchBaseLayer(map, layerKey) {
        if (!map._baseLayers) {
            console.error('Base layers not initialized on map');
            return;
        }

        const layerName = this.getLayerName(layerKey);
        const targetLayer = map._baseLayers[layerName];

        if (!targetLayer) {
            console.error(`Layer not found: ${layerName}`);
            return;
        }

        // Remove all base layers
        Object.values(map._baseLayers).forEach(layer => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });

        // Add target layer
        targetLayer.addTo(map);
    }

    /**
     * Get error count for a layer
     * @param {string} layerKey - Layer key
     * @returns {number} Error count
     */
    getErrorCount(layerKey) {
        return this.errorCount.get(layerKey) || 0;
    }

    /**
     * Reset error count for a layer
     * @param {string} layerKey - Layer key
     */
    resetErrorCount(layerKey) {
        this.errorCount.set(layerKey, 0);
    }

    /**
     * Simple event emitter
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        const customEvent = new CustomEvent(`tileLayer:${event}`, {
            detail: data
        });
        window.dispatchEvent(customEvent);
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.TileLayerManager = TileLayerManager;
}
