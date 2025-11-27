// SITES Spectral - GeoJSON Layer Manager
// Manages GeoJSON layers for AOI polygons, ROI boundaries, and other vector data

class GeoJSONLayerManager {
    constructor(config) {
        this.config = config || window.mapConfig;
        this.layers = new Map();
        this.layerGroups = new Map();
    }

    /**
     * Create GeoJSON layer from data
     * @param {Object|Array} geojsonData - GeoJSON data (Feature, FeatureCollection, or geometry)
     * @param {Object} options - Layer options
     * @returns {L.GeoJSON} Leaflet GeoJSON layer
     */
    createGeoJSONLayer(geojsonData, options = {}) {
        const defaultOptions = {
            style: this.config.getGeoJSONStyle(options.styleType || 'default'),
            onEachFeature: (feature, layer) => this.onEachFeature(feature, layer, options),
            pointToLayer: (feature, latlng) => this.pointToLayer(feature, latlng, options)
        };

        const layerOptions = {
            ...defaultOptions,
            ...options
        };

        const layer = L.geoJSON(geojsonData, layerOptions);

        // Store reference
        const id = options.id || `geojson_${Date.now()}`;
        this.layers.set(id, layer);

        return layer;
    }

    /**
     * Handle each feature in GeoJSON
     * @param {Object} feature - GeoJSON feature
     * @param {L.Layer} layer - Leaflet layer
     * @param {Object} options - Options
     */
    onEachFeature(feature, layer, options = {}) {
        // Add popup if properties exist
        if (feature.properties) {
            const popup = this.createFeaturePopup(feature, options);
            if (popup) {
                layer.bindPopup(popup);
            }
        }

        // Add tooltip if specified
        if (options.showTooltip && feature.properties) {
            const tooltip = this.createFeatureTooltip(feature, options);
            if (tooltip) {
                layer.bindTooltip(tooltip, {
                    permanent: options.permanentTooltip || false,
                    direction: 'top'
                });
            }
        }

        // Add click handler
        if (options.onClick) {
            layer.on('click', (e) => options.onClick(feature, layer, e));
        }

        // Add hover handlers
        if (options.onHover || options.highlightOnHover) {
            layer.on('mouseover', (e) => {
                if (options.highlightOnHover) {
                    layer.setStyle(this.config.getGeoJSONStyle('highlight'));
                }
                if (options.onHover) {
                    options.onHover(feature, layer, e);
                }
            });

            layer.on('mouseout', (e) => {
                if (options.highlightOnHover) {
                    const styleType = options.styleType || 'default';
                    layer.setStyle(this.config.getGeoJSONStyle(styleType));
                }
            });
        }
    }

    /**
     * Create marker for point features
     * @param {Object} feature - GeoJSON feature
     * @param {L.LatLng} latlng - Point coordinates
     * @param {Object} options - Options
     * @returns {L.Marker} Leaflet marker
     */
    pointToLayer(feature, latlng, options = {}) {
        if (options.customMarker) {
            return options.customMarker(feature, latlng);
        }

        // Default circle marker
        return L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#059669',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
    }

    /**
     * Create popup HTML for feature
     * @param {Object} feature - GeoJSON feature
     * @param {Object} options - Options
     * @returns {string|null} HTML string or null
     */
    createFeaturePopup(feature, options = {}) {
        if (options.customPopup) {
            return options.customPopup(feature);
        }

        const props = feature.properties;
        if (!props || Object.keys(props).length === 0) {
            return null;
        }

        let html = '<div class="map-popup geojson-popup">';

        // Add title if available
        if (props.name || props.title || props.id) {
            const title = props.name || props.title || props.id;
            html += `<h5 style="margin: 0 0 8px 0; color: #059669; font-size: 14px;">${title}</h5>`;
        }

        // Add description if available
        if (props.description || props.desc) {
            const desc = props.description || props.desc;
            html += `<p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${desc}</p>`;
        }

        // Add other properties
        const skipProps = ['name', 'title', 'id', 'description', 'desc', 'style', 'marker-color', 'marker-size', 'marker-symbol'];
        const otherProps = Object.entries(props).filter(([key]) => !skipProps.includes(key));

        if (otherProps.length > 0) {
            html += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">';
            otherProps.forEach(([key, value]) => {
                html += `<p style="margin: 2px 0; font-size: 12px;"><strong>${this.formatKey(key)}:</strong> ${value}</p>`;
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Create tooltip text for feature
     * @param {Object} feature - GeoJSON feature
     * @param {Object} options - Options
     * @returns {string|null} Tooltip text or null
     */
    createFeatureTooltip(feature, options = {}) {
        if (options.customTooltip) {
            return options.customTooltip(feature);
        }

        const props = feature.properties;
        if (!props) return null;

        return props.name || props.title || props.id || null;
    }

    /**
     * Format property key for display
     * @param {string} key - Property key
     * @returns {string} Formatted key
     */
    formatKey(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Add GeoJSON layer to map
     * @param {L.Map} map - Leaflet map instance
     * @param {Object|Array} geojsonData - GeoJSON data
     * @param {Object} options - Layer options
     * @returns {L.GeoJSON} Created layer
     */
    addGeoJSONLayer(map, geojsonData, options = {}) {
        const layer = this.createGeoJSONLayer(geojsonData, options);
        layer.addTo(map);
        return layer;
    }

    /**
     * Load GeoJSON from URL
     * @param {string} url - URL to GeoJSON file
     * @param {Object} options - Fetch and layer options
     * @returns {Promise<L.GeoJSON>} Promise resolving to layer
     */
    async loadGeoJSONFromURL(url, options = {}) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const geojsonData = await response.json();
            const layer = this.createGeoJSONLayer(geojsonData, options);

            if (options.addToMap && options.map) {
                layer.addTo(options.map);
            }

            return layer;
        } catch (error) {
            console.error(`Error loading GeoJSON from ${url}:`, error);
            throw error;
        }
    }

    /**
     * Create AOI polygon layer
     * @param {Array} coordinates - Polygon coordinates [[lat, lng], ...]
     * @param {Object} data - AOI metadata
     * @param {Object} options - Layer options
     * @returns {L.GeoJSON} GeoJSON layer
     */
    createAOILayer(coordinates, data = {}, options = {}) {
        // Convert coordinates to GeoJSON polygon format
        const geojson = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates.map(coord => [coord[1], coord[0]])] // Swap to [lng, lat]
            },
            properties: {
                name: data.name || 'AOI',
                description: data.description || '',
                type: 'aoi',
                ...data
            }
        };

        const layerOptions = {
            styleType: 'aoi',
            ...options
        };

        return this.createGeoJSONLayer(geojson, layerOptions);
    }

    /**
     * Create ROI polygon layer
     * @param {Array} coordinates - Polygon coordinates [[lat, lng], ...]
     * @param {Object} data - ROI metadata
     * @param {Object} options - Layer options
     * @returns {L.GeoJSON} GeoJSON layer
     */
    createROILayer(coordinates, data = {}, options = {}) {
        const geojson = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates.map(coord => [coord[1], coord[0]])] // Swap to [lng, lat]
            },
            properties: {
                name: data.roi_name || data.name || 'ROI',
                description: data.description || '',
                type: 'roi',
                color: data.color || '#f59e0b',
                ...data
            }
        };

        const layerOptions = {
            styleType: 'roi',
            style: (feature) => {
                const baseStyle = this.config.getGeoJSONStyle('roi');
                if (feature.properties.color) {
                    return {
                        ...baseStyle,
                        color: feature.properties.color,
                        fillColor: feature.properties.color
                    };
                }
                return baseStyle;
            },
            ...options
        };

        return this.createGeoJSONLayer(geojson, layerOptions);
    }

    /**
     * Add multiple ROI layers from array
     * @param {L.Map} map - Leaflet map instance
     * @param {Array} rois - Array of ROI objects
     * @param {Object} options - Layer options
     * @returns {Array} Array of created layers
     */
    addROILayers(map, rois, options = {}) {
        const layers = [];

        rois.forEach(roi => {
            if (roi.polygon_points && Array.isArray(roi.polygon_points)) {
                try {
                    const coordinates = JSON.parse(roi.polygon_points);
                    const layer = this.createROILayer(coordinates, roi, options);
                    layer.addTo(map);
                    layers.push(layer);
                } catch (error) {
                    console.error('Error parsing ROI polygon points:', error);
                }
            }
        });

        // Store in group
        const groupId = options.groupId || 'rois';
        this.layerGroups.set(groupId, layers);

        return layers;
    }

    /**
     * Remove layer by ID
     * @param {L.Map} map - Leaflet map instance
     * @param {string} id - Layer ID
     */
    removeLayer(map, id) {
        const layer = this.layers.get(id);
        if (layer) {
            map.removeLayer(layer);
            this.layers.delete(id);
        }
    }

    /**
     * Remove layer group
     * @param {L.Map} map - Leaflet map instance
     * @param {string} groupId - Group ID
     */
    removeLayerGroup(map, groupId) {
        const layers = this.layerGroups.get(groupId);
        if (layers) {
            layers.forEach(layer => map.removeLayer(layer));
            this.layerGroups.delete(groupId);
        }
    }

    /**
     * Clear all GeoJSON layers
     * @param {L.Map} map - Leaflet map instance
     */
    clearAllLayers(map) {
        this.layers.forEach(layer => map.removeLayer(layer));
        this.layers.clear();

        this.layerGroups.forEach(layers => {
            layers.forEach(layer => map.removeLayer(layer));
        });
        this.layerGroups.clear();
    }

    /**
     * Get layer by ID
     * @param {string} id - Layer ID
     * @returns {L.GeoJSON|null} Layer or null
     */
    getLayer(id) {
        return this.layers.get(id) || null;
    }

    /**
     * Get layer group
     * @param {string} groupId - Group ID
     * @returns {Array|null} Array of layers or null
     */
    getLayerGroup(groupId) {
        return this.layerGroups.get(groupId) || null;
    }

    /**
     * Toggle layer visibility
     * @param {L.Map} map - Leaflet map instance
     * @param {string} id - Layer ID
     */
    toggleLayer(map, id) {
        const layer = this.layers.get(id);
        if (layer) {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            } else {
                layer.addTo(map);
            }
        }
    }

    /**
     * Toggle layer group visibility
     * @param {L.Map} map - Leaflet map instance
     * @param {string} groupId - Group ID
     */
    toggleLayerGroup(map, groupId) {
        const layers = this.layerGroups.get(groupId);
        if (layers && layers.length > 0) {
            const firstLayer = layers[0];
            const isVisible = map.hasLayer(firstLayer);

            layers.forEach(layer => {
                if (isVisible) {
                    map.removeLayer(layer);
                } else {
                    layer.addTo(map);
                }
            });
        }
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.GeoJSONLayerManager = GeoJSONLayerManager;
}
