// SITES Spectral - Marker Manager
// Manages station, platform, and instrument markers with clustering support

class MarkerManager {
    constructor(config) {
        this.config = config || window.mapConfig;
        this.markers = new Map();
        this.markerGroups = new Map();
        this.clusterGroup = null;
    }

    /**
     * Create a custom marker icon
     * @param {string} type - Type of marker (station, platform, phenocam, etc.)
     * @param {Object} customOptions - Custom options to override defaults
     * @returns {L.DivIcon} Leaflet div icon
     */
    createMarkerIcon(type = 'station', customOptions = {}) {
        const iconConfig = this.config.getMarkerConfig(type);
        const options = { ...iconConfig, ...customOptions };

        const html = `
            <div style="position: relative; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <svg width="${options.size[0]}" height="${options.size[1]}" viewBox="0 0 ${options.size[0]} ${options.size[1]}" xmlns="http://www.w3.org/2000/svg">
                    <path d="M${options.size[0]/2} 0C${options.size[0]*0.225} 0 0 ${options.size[0]*0.225} 0 ${options.size[0]/2}c0 ${options.size[0]*0.275} ${options.size[0]/2} ${options.size[1]*0.6} ${options.size[0]/2} ${options.size[1]*0.6}s${options.size[0]/2}-${options.size[1]*0.325} ${options.size[0]/2}-${options.size[1]*0.6}C${options.size[0]} ${options.size[0]*0.225} ${options.size[0]*0.775} 0 ${options.size[0]/2} 0z"
                          fill="${options.color}"
                          stroke="white"
                          stroke-width="1.5"/>
                    <circle cx="${options.size[0]/2}" cy="${options.size[0]/2}" r="${options.size[0]*0.25}" fill="white"/>
                </svg>
                <i class="fas fa-${options.icon}" style="font-size: ${options.size[0]*0.3}px; position: absolute; top: ${options.size[0]*0.25}px; left: 50%; transform: translateX(-50%); color: ${options.color};"></i>
            </div>
        `;

        return L.divIcon({
            html: html,
            className: `${type}-marker-icon`,
            iconSize: options.size,
            iconAnchor: options.anchor,
            popupAnchor: options.popupAnchor
        });
    }

    /**
     * Create station marker
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} data - Station data
     * @returns {L.Marker} Leaflet marker
     */
    createStationMarker(lat, lng, data = {}) {
        if (!this.config.isValidSwedishCoordinate(lat, lng)) {
            console.warn(`Station coordinates ${lat}, ${lng} are outside Swedish bounds`);
        }

        const icon = this.createMarkerIcon('station');
        const marker = L.marker([lat, lng], { icon });

        if (data.display_name || data.acronym) {
            const popup = this.createStationPopup(data);
            marker.bindPopup(popup);
        }

        // Store reference
        const id = data.id || `station_${Date.now()}`;
        this.markers.set(id, marker);

        return marker;
    }

    /**
     * Create platform marker
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} data - Platform data
     * @returns {L.Marker} Leaflet marker
     */
    createPlatformMarker(lat, lng, data = {}) {
        if (!this.config.isValidSwedishCoordinate(lat, lng)) {
            console.warn(`Platform coordinates ${lat}, ${lng} are outside Swedish bounds`);
        }

        const icon = this.createMarkerIcon('platform');
        const marker = L.marker([lat, lng], { icon });

        if (data.display_name || data.normalized_name) {
            const popup = this.createPlatformPopup(data);
            marker.bindPopup(popup);
        }

        // Store reference
        const id = data.id || `platform_${Date.now()}`;
        this.markers.set(id, marker);

        return marker;
    }

    /**
     * Create instrument marker
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} data - Instrument data
     * @returns {L.Marker} Leaflet marker
     */
    createInstrumentMarker(lat, lng, data = {}) {
        if (!this.config.isValidSwedishCoordinate(lat, lng)) {
            console.warn(`Instrument coordinates ${lat}, ${lng} are outside Swedish bounds`);
        }

        // Determine instrument type for icon
        const type = this.getInstrumentType(data.instrument_type);
        const icon = this.createMarkerIcon(type);
        const marker = L.marker([lat, lng], { icon });

        if (data.normalized_name || data.name) {
            const popup = this.createInstrumentPopup(data);
            marker.bindPopup(popup);
        }

        // Store reference
        const id = data.id || `instrument_${Date.now()}`;
        this.markers.set(id, marker);

        return marker;
    }

    /**
     * Determine instrument type from instrument_type string
     * @param {string} instrumentType - Instrument type string
     * @returns {string} Icon type
     */
    getInstrumentType(instrumentType) {
        if (!instrumentType) return 'phenocam';

        const type = instrumentType.toLowerCase();
        if (type.includes('phenocam')) return 'phenocam';
        if (type.includes('multispectral') || type.includes('ms')) return 'multispectral';
        if (type.includes('par')) return 'par';
        if (type.includes('ndvi')) return 'ndvi';
        if (type.includes('pri')) return 'pri';
        if (type.includes('hyperspectral') || type.includes('hyp')) return 'hyperspectral';

        return 'phenocam'; // Default
    }

    /**
     * Create station popup HTML
     * @param {Object} data - Station data
     * @returns {string} HTML string
     */
    createStationPopup(data) {
        return `
            <div class="map-popup station-popup">
                <h4 style="margin: 0 0 8px 0; color: #059669; font-size: 16px;">${data.display_name || 'Station'}</h4>
                ${data.acronym ? `<p style="margin: 4px 0;"><strong>Acronym:</strong> ${data.acronym}</p>` : ''}
                ${data.description ? `<p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${data.description}</p>` : ''}
                ${data.latitude && data.longitude ?
                    `<p style="margin: 4px 0; font-size: 12px; color: #9ca3af;"><strong>Coordinates:</strong> ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}</p>` : ''}
                ${data.acronym ?
                    `<button onclick="sitesMap.navigateToStation('${data.acronym}')" class="btn btn-primary btn-sm" style="margin-top: 8px;">
                        View Station Details
                    </button>` : ''}
            </div>
        `;
    }

    /**
     * Create platform popup HTML
     * @param {Object} data - Platform data
     * @returns {string} HTML string
     */
    createPlatformPopup(data) {
        const instrumentCount = data.instrument_count || 0;
        return `
            <div class="map-popup platform-popup">
                <h5 style="margin: 0 0 8px 0; color: #4285F4; font-size: 14px;">${data.display_name || data.normalized_name || 'Platform'}</h5>
                ${data.normalized_name && data.normalized_name !== data.display_name ?
                    `<p style="margin: 4px 0;"><small style="opacity: 0.7; color: #059669; font-family: 'Courier New', monospace; font-weight: 600;">${data.normalized_name}</small></p>` : ''}
                ${data.ecosystem_code ? `<p style="margin: 4px 0;"><strong>Ecosystem:</strong> ${data.ecosystem_code}</p>` : ''}
                ${data.location_code ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${data.location_code}</p>` : ''}
                <p style="margin: 4px 0;"><strong>Instruments:</strong> ${instrumentCount}</p>
                ${data.description ? `<p style="margin: 4px 0; color: #6b7280; font-size: 13px;">${data.description}</p>` : ''}
            </div>
        `;
    }

    /**
     * Create instrument popup HTML
     * @param {Object} data - Instrument data
     * @returns {string} HTML string
     */
    createInstrumentPopup(data) {
        const instrumentName = data.normalized_name || data.name || 'Instrument';
        const status = data.status || '';

        const getStatusBadge = (status) => {
            if (!status) return '';
            const statusLower = status.toLowerCase();

            let badgeStyle = 'display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;';

            if (statusLower === 'active') {
                badgeStyle += ' background: rgba(34, 197, 94, 0.1); color: #16a34a;';
            } else if (statusLower === 'inactive') {
                badgeStyle += ' background: rgba(239, 68, 68, 0.1); color: #dc2626;';
            } else if (statusLower === 'maintenance') {
                badgeStyle += ' background: rgba(249, 115, 22, 0.1); color: #ea580c;';
            } else if (statusLower === 'testing') {
                badgeStyle += ' background: rgba(245, 158, 11, 0.1); color: #d97706;';
            } else if (statusLower === 'decommissioned') {
                badgeStyle += ' background: rgba(55, 65, 81, 0.1); color: #374151;';
            } else {
                badgeStyle += ' background: rgba(55, 65, 81, 0.1); color: #374151;';
            }

            return `<span style="${badgeStyle}">${status}</span>`;
        };

        return `
            <div class="map-popup instrument-popup">
                <p style="margin: 0 0 4px 0;"><strong>Instrument:</strong> <span style="color: #f59e0b; font-family: 'Courier New', monospace; font-weight: 600;">${instrumentName}</span></p>
                ${data.legacy_acronym ? `<p style="margin: 4px 0;"><strong>Legacy Name:</strong> ${data.legacy_acronym}</p>` : ''}
                ${data.instrument_type ? `<p style="margin: 4px 0;"><strong>Type:</strong> ${data.instrument_type}</p>` : ''}
                ${status ? `<p style="margin: 4px 0;"><strong>Status:</strong> ${getStatusBadge(status)}</p>` : ''}
            </div>
        `;
    }

    /**
     * Add multiple markers to map with optional clustering
     * @param {L.Map} map - Leaflet map instance
     * @param {Array} items - Array of items with lat, lng, and data
     * @param {string} type - Type of markers (station, platform, instrument)
     * @param {boolean} cluster - Whether to use clustering
     * @returns {Array} Array of created markers
     */
    addMarkers(map, items, type = 'station', cluster = false) {
        const markers = [];

        items.forEach(item => {
            if (item.latitude && item.longitude) {
                let marker;
                if (type === 'station') {
                    marker = this.createStationMarker(item.latitude, item.longitude, item);
                } else if (type === 'platform') {
                    marker = this.createPlatformMarker(item.latitude, item.longitude, item);
                } else if (type === 'instrument') {
                    marker = this.createInstrumentMarker(item.latitude, item.longitude, item);
                }

                if (marker) {
                    markers.push(marker);
                }
            }
        });

        // Add to map with or without clustering
        if (cluster && typeof L.markerClusterGroup !== 'undefined') {
            if (!this.clusterGroup) {
                this.clusterGroup = L.markerClusterGroup(this.config.clusterConfig);
                map.addLayer(this.clusterGroup);
            }
            this.clusterGroup.addLayers(markers);
        } else {
            markers.forEach(marker => marker.addTo(map));
        }

        // Store in group
        this.markerGroups.set(type, markers);

        return markers;
    }

    /**
     * Clear markers of a specific type
     * @param {L.Map} map - Leaflet map instance
     * @param {string} type - Type of markers to clear
     */
    clearMarkers(map, type) {
        const markers = this.markerGroups.get(type);
        if (markers) {
            markers.forEach(marker => {
                if (this.clusterGroup && this.clusterGroup.hasLayer(marker)) {
                    this.clusterGroup.removeLayer(marker);
                } else {
                    map.removeLayer(marker);
                }
            });
            this.markerGroups.delete(type);
        }
    }

    /**
     * Clear all markers
     * @param {L.Map} map - Leaflet map instance
     */
    clearAllMarkers(map) {
        this.markerGroups.forEach((markers, type) => {
            this.clearMarkers(map, type);
        });

        if (this.clusterGroup) {
            this.clusterGroup.clearLayers();
        }

        this.markers.clear();
    }

    /**
     * Get marker by ID
     * @param {string} id - Marker ID
     * @returns {L.Marker|null} Marker or null
     */
    getMarker(id) {
        return this.markers.get(id) || null;
    }

    /**
     * Fit map to show all markers of a type
     * @param {L.Map} map - Leaflet map instance
     * @param {string} type - Type of markers
     * @param {Object} options - Fit bounds options
     */
    fitToMarkers(map, type, options = { padding: [50, 50] }) {
        const markers = this.markerGroups.get(type);
        if (markers && markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds(), options);
        }
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.MarkerManager = MarkerManager;
}
