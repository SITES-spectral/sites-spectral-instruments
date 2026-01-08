// SITES Spectral - AOI Manager
// Central management for Areas of Interest
// Version: 8.0.0-beta.2

/**
 * AOI Manager
 * Provides central management for loading, displaying, and managing AOIs
 */
class AOIManager {
    constructor(options = {}) {
        this.options = {
            apiClient: null,
            mapController: null,
            configLoader: null,
            onAOISelect: null,
            onAOICreate: null,
            onAOIUpdate: null,
            onAOIDelete: null,
            ...options
        };

        this.aois = new Map();
        this.layers = new Map();
        this.selectedAOI = null;
        this.modal = null;
        this.config = null;
    }

    /**
     * Initialize the AOI Manager
     */
    async initialize() {
        // Load config if loader provided
        if (this.options.configLoader) {
            try {
                this.config = await this.options.configLoader.load('aoi/aoi-config');
            } catch (e) {
                console.warn('Could not load AOI config:', e);
            }
        }

        // Initialize modal
        this.modal = new AOIModal({
            apiClient: this.options.apiClient,
            configLoader: this.options.configLoader,
            onSave: (result) => this.handleSave(result),
            onDelete: (aoi) => this.handleDelete(aoi)
        });
        await this.modal.initialize();
    }

    /**
     * Load AOIs for a station
     * @param {string} stationId - Station ID or acronym
     * @returns {Promise<Array>} Array of AOIs
     */
    async loadAOIsForStation(stationId) {
        try {
            const response = await this.fetchAPI(`/api/aois?station=${stationId}`);
            const data = await response.json();

            if (data.aois) {
                this.aois.clear();
                data.aois.forEach(aoi => {
                    this.aois.set(aoi.id, aoi);
                });
                return data.aois;
            }
            return [];
        } catch (error) {
            console.error('Error loading AOIs:', error);
            return [];
        }
    }

    /**
     * Load AOIs for a platform
     * @param {string} platformId - Platform ID
     * @returns {Promise<Array>} Array of AOIs
     */
    async loadAOIsForPlatform(platformId) {
        try {
            const response = await this.fetchAPI(`/api/aois?platform=${platformId}`);
            const data = await response.json();

            if (data.aois) {
                // Add to cache
                data.aois.forEach(aoi => {
                    this.aois.set(aoi.id, aoi);
                });
                return data.aois;
            }
            return [];
        } catch (error) {
            console.error('Error loading AOIs:', error);
            return [];
        }
    }

    /**
     * Load GeoJSON FeatureCollection for a station
     * @param {string} stationId - Station ID or acronym
     * @returns {Promise<Object>} GeoJSON FeatureCollection
     */
    async loadGeoJSON(stationId) {
        try {
            const response = await this.fetchAPI(`/api/aois/geojson/${stationId}`);
            return await response.json();
        } catch (error) {
            console.error('Error loading AOI GeoJSON:', error);
            return null;
        }
    }

    /**
     * Display AOIs on map
     * @param {L.Map} map - Leaflet map instance
     * @param {Array} aois - Array of AOIs to display
     * @param {Object} options - Display options
     */
    displayAOIsOnMap(map, aois, options = {}) {
        // Clear existing layers
        this.clearMapLayers(map);

        aois.forEach(aoi => {
            if (aoi.geometry_json) {
                try {
                    const geometry = typeof aoi.geometry_json === 'string'
                        ? JSON.parse(aoi.geometry_json)
                        : aoi.geometry_json;

                    const style = this.getStyleForAOI(aoi);
                    const layer = L.geoJSON(geometry, {
                        style: style,
                        onEachFeature: (feature, layer) => {
                            this.bindAOIEvents(layer, aoi, options);
                        }
                    });

                    layer.addTo(map);
                    this.layers.set(aoi.id, layer);
                } catch (e) {
                    console.warn(`Error displaying AOI ${aoi.id}:`, e);
                }
            }
        });
    }

    /**
     * Get style for AOI based on type
     * @param {Object} aoi - AOI object
     * @returns {Object} Leaflet style object
     */
    getStyleForAOI(aoi) {
        const styles = {
            flight_area: {
                color: '#059669',
                weight: 2,
                fillColor: '#059669',
                fillOpacity: 0.15,
                dashArray: null
            },
            coverage_area: {
                color: '#7c3aed',
                weight: 2,
                fillColor: '#7c3aed',
                fillOpacity: 0.10,
                dashArray: '10, 5'
            },
            study_site: {
                color: '#2563eb',
                weight: 2,
                fillColor: '#2563eb',
                fillOpacity: 0.20,
                dashArray: null
            },
            validation_site: {
                color: '#f59e0b',
                weight: 2,
                fillColor: '#f59e0b',
                fillOpacity: 0.15,
                dashArray: '5, 5'
            },
            reference_area: {
                color: '#6b7280',
                weight: 2,
                fillColor: '#6b7280',
                fillOpacity: 0.10,
                dashArray: null
            }
        };

        return styles[aoi.aoi_type] || styles.study_site;
    }

    /**
     * Bind events to AOI layer
     * @param {L.Layer} layer - Leaflet layer
     * @param {Object} aoi - AOI object
     * @param {Object} options - Options
     */
    bindAOIEvents(layer, aoi, options = {}) {
        // Popup
        const popup = this.createAOIPopup(aoi);
        layer.bindPopup(popup);

        // Tooltip
        layer.bindTooltip(aoi.name, {
            permanent: false,
            direction: 'top'
        });

        // Click handler
        layer.on('click', () => {
            this.selectAOI(aoi.id);
            if (this.options.onAOISelect) {
                this.options.onAOISelect(aoi);
            }
        });

        // Hover effects
        layer.on('mouseover', () => {
            layer.setStyle({
                weight: 3,
                fillOpacity: 0.3
            });
        });

        layer.on('mouseout', () => {
            if (this.selectedAOI !== aoi.id) {
                layer.setStyle(this.getStyleForAOI(aoi));
            }
        });
    }

    /**
     * Create popup HTML for AOI
     * @param {Object} aoi - AOI object
     * @returns {string} HTML string
     */
    createAOIPopup(aoi) {
        const typeLabels = {
            flight_area: 'Flight Area',
            coverage_area: 'Coverage Area',
            study_site: 'Study Site',
            validation_site: 'Validation Site',
            reference_area: 'Reference Area'
        };

        const purposeLabels = {
            mapping: 'Mapping',
            monitoring: 'Monitoring',
            validation: 'Validation',
            reference: 'Reference',
            research: 'Research'
        };

        return `
            <div class="aoi-popup" style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #059669; font-size: 14px;">
                    ${aoi.name}
                </h4>
                <div style="font-size: 12px; color: #6b7280;">
                    <p style="margin: 4px 0;"><strong>Type:</strong> ${typeLabels[aoi.aoi_type] || aoi.aoi_type}</p>
                    <p style="margin: 4px 0;"><strong>Purpose:</strong> ${purposeLabels[aoi.purpose] || aoi.purpose}</p>
                    ${aoi.area_m2 ? `<p style="margin: 4px 0;"><strong>Area:</strong> ${this.formatArea(aoi.area_m2)}</p>` : ''}
                    ${aoi.description ? `<p style="margin: 8px 0 4px 0; font-style: italic;">${aoi.description}</p>` : ''}
                </div>
                <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button onclick="window.aoiManager.viewAOI('${aoi.id}')"
                            style="padding: 4px 10px; font-size: 11px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        View Details
                    </button>
                    <button onclick="window.aoiManager.editAOI('${aoi.id}')"
                            style="padding: 4px 10px; font-size: 11px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">
                        Edit
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Format area for display
     * @param {number} area - Area in square meters
     * @returns {string} Formatted area
     */
    formatArea(area) {
        if (area < 10000) {
            return `${area.toFixed(1)} m2`;
        } else {
            return `${(area / 10000).toFixed(2)} ha`;
        }
    }

    /**
     * Select an AOI
     * @param {number} aoiId - AOI ID
     */
    selectAOI(aoiId) {
        // Deselect previous
        if (this.selectedAOI) {
            const prevLayer = this.layers.get(this.selectedAOI);
            const prevAOI = this.aois.get(this.selectedAOI);
            if (prevLayer && prevAOI) {
                prevLayer.setStyle(this.getStyleForAOI(prevAOI));
            }
        }

        // Select new
        this.selectedAOI = aoiId;
        const layer = this.layers.get(aoiId);
        if (layer) {
            layer.setStyle({
                color: '#2563eb',
                weight: 3,
                fillColor: '#2563eb',
                fillOpacity: 0.25
            });
        }
    }

    /**
     * Clear selection
     */
    clearSelection() {
        if (this.selectedAOI) {
            const layer = this.layers.get(this.selectedAOI);
            const aoi = this.aois.get(this.selectedAOI);
            if (layer && aoi) {
                layer.setStyle(this.getStyleForAOI(aoi));
            }
            this.selectedAOI = null;
        }
    }

    /**
     * Clear all AOI layers from map
     * @param {L.Map} map - Leaflet map instance
     */
    clearMapLayers(map) {
        this.layers.forEach(layer => {
            map.removeLayer(layer);
        });
        this.layers.clear();
    }

    /**
     * Open modal to create new AOI
     * @param {number} platformId - Platform ID
     * @param {number} stationId - Station ID
     * @param {Object} options - Additional options
     */
    createAOI(platformId, stationId, options = {}) {
        this.modal.openNew(platformId, stationId, options);
    }

    /**
     * Open modal to view AOI
     * @param {number} aoiId - AOI ID
     */
    async viewAOI(aoiId) {
        let aoi = this.aois.get(aoiId);

        if (!aoi) {
            // Fetch from API
            try {
                const response = await this.fetchAPI(`/api/aois/${aoiId}`);
                aoi = await response.json();
            } catch (e) {
                console.error('Error fetching AOI:', e);
                return;
            }
        }

        if (aoi) {
            this.modal.openView(aoi);
        }
    }

    /**
     * Open modal to edit AOI
     * @param {number} aoiId - AOI ID
     */
    async editAOI(aoiId) {
        let aoi = this.aois.get(aoiId);

        if (!aoi) {
            // Fetch from API
            try {
                const response = await this.fetchAPI(`/api/aois/${aoiId}`);
                aoi = await response.json();
            } catch (e) {
                console.error('Error fetching AOI:', e);
                return;
            }
        }

        if (aoi) {
            this.modal.openEdit(aoi);
        }
    }

    /**
     * Handle save from modal
     * @param {Object} result - Save result
     */
    handleSave(result) {
        // Refresh AOI in cache
        if (result.id) {
            this.fetchAPI(`/api/aois/${result.id}`)
                .then(response => response.json())
                .then(aoi => {
                    this.aois.set(aoi.id, aoi);

                    // Update map if displaying
                    if (this.layers.has(aoi.id) && this.options.mapController) {
                        const map = this.options.mapController.getMap();
                        if (map) {
                            // Refresh display
                            this.displayAOIsOnMap(map, Array.from(this.aois.values()));
                        }
                    }

                    if (this.options.onAOIUpdate) {
                        this.options.onAOIUpdate(aoi);
                    }
                })
                .catch(error => {
                    console.error('Failed to refresh AOI after save:', error);
                });
        }

        if (this.options.onAOICreate) {
            this.options.onAOICreate(result);
        }
    }

    /**
     * Handle delete from modal
     * @param {Object} aoi - Deleted AOI
     */
    handleDelete(aoi) {
        // Remove from cache
        this.aois.delete(aoi.id);

        // Remove from map
        const layer = this.layers.get(aoi.id);
        if (layer && this.options.mapController) {
            const map = this.options.mapController.getMap();
            if (map) {
                map.removeLayer(layer);
            }
        }
        this.layers.delete(aoi.id);

        if (this.options.onAOIDelete) {
            this.options.onAOIDelete(aoi);
        }
    }

    /**
     * Get AOI by ID
     * @param {number} aoiId - AOI ID
     * @returns {Object|null} AOI object or null
     */
    getAOI(aoiId) {
        return this.aois.get(aoiId) || null;
    }

    /**
     * Get all AOIs
     * @returns {Array} Array of all AOIs
     */
    getAllAOIs() {
        return Array.from(this.aois.values());
    }

    /**
     * Get AOIs by type
     * @param {string} type - AOI type
     * @returns {Array} Array of AOIs
     */
    getAOIsByType(type) {
        return this.getAllAOIs().filter(aoi => aoi.aoi_type === type);
    }

    /**
     * Fetch from API
     * @param {string} url - API URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async fetchAPI(url, options = {}) {
        if (this.options.apiClient) {
            return this.options.apiClient.get(url);
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        return fetch(url, {
            ...options,
            credentials: 'include',
            headers
        });
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.AOIManager = AOIManager;
}
