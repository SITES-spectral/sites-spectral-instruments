// SITES Spectral - Map Integration Layer
// Provides backward compatibility with existing SitesInteractiveMap class

class SitesInteractiveMapV2 {
    constructor() {
        this.controllers = new Map();
        this.config = window.mapConfig || new MapConfig();
        this.currentController = null;
        this.defaultCenter = [59.8586, 17.6389]; // Uppsala, Sweden
        this.defaultZoom = 8;

        // Backward compatibility properties
        this.maps = new Map();
        this.markers = new Map();
        this.platformMarkers = [];
        this.currentMap = null;
        this.swerefProjection = null;

        // Initialize Swedish projection
        this.initializeSwedishProjection();
    }

    /**
     * Initialize Swedish coordinate system
     */
    initializeSwedishProjection() {
        if (typeof L !== 'undefined' && !this.swerefProjection) {
            this.swerefProjection = {
                name: 'SWEREF99 TM',
                crs: L.CRS.EPSG3857, // Web Mercator for Leaflet compatibility
                bounds: [10.03, 55.36, 24.17, 69.07] // Sweden bounds [west, south, east, north]
            };
        }
    }

    /**
     * Initialize map (backward compatible)
     * @param {string} containerId - Container element ID
     * @param {Object} options - Map options
     * @returns {L.Map} Leaflet map instance
     */
    initializeMap(containerId, options = {}) {
        try {
            // Create map controller
            const controller = new MapController(containerId, options);

            // Initialize map
            const map = controller.initialize(options);

            // Store references
            this.controllers.set(containerId, controller);
            this.maps.set(containerId, map);
            this.currentController = controller;
            this.currentMap = map;

            return map;
        } catch (error) {
            console.error('Error initializing map:', error);
            return null;
        }
    }

    /**
     * Validate Swedish coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} True if valid
     */
    isValidSwedishCoordinate(lat, lng) {
        return this.config.isValidSwedishCoordinate(lat, lng);
    }

    /**
     * Create station marker (backward compatible)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} data - Station data
     * @returns {L.Marker} Marker instance
     */
    createStationMarker(lat, lng, data = {}) {
        const markerManager = new MarkerManager(this.config);
        return markerManager.createStationMarker(lat, lng, data);
    }

    /**
     * Create platform marker (backward compatible)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} data - Platform data
     * @returns {L.Marker} Marker instance
     */
    createPlatformMarker(lat, lng, data = {}) {
        const markerManager = new MarkerManager(this.config);
        return markerManager.createPlatformMarker(lat, lng, data);
    }

    /**
     * Create instrument marker (backward compatible)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} data - Instrument data
     * @returns {L.Marker} Marker instance
     */
    createInstrumentMarker(lat, lng, data = {}) {
        const markerManager = new MarkerManager(this.config);
        return markerManager.createInstrumentMarker(lat, lng, data);
    }

    /**
     * Add station to map (backward compatible)
     * @param {L.Map} map - Leaflet map instance
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Object} data - Station data
     * @returns {L.Marker} Marker instance
     */
    addStation(map, lat, lng, data = {}) {
        const marker = this.createStationMarker(lat, lng, data);
        marker.addTo(map);

        const markerId = `station-${data.id || Date.now()}`;
        this.markers.set(markerId, marker);

        return marker;
    }

    /**
     * Add platform markers (backward compatible)
     * @param {L.Map} map - Leaflet map instance
     * @param {Array} platforms - Array of platforms
     * @param {Object} stationCoords - Station coordinates for fallback
     * @returns {Array} Array of markers
     */
    addPlatformMarkers(map, platforms = [], stationCoords = null) {
        // Clear existing platform markers
        this.clearPlatformMarkers(map);

        if (!platforms || platforms.length === 0) {
            return [];
        }

        const newMarkers = [];

        platforms.forEach((platform) => {
            let lat = platform.latitude;
            let lng = platform.longitude;

            // If no platform coordinates, offset from station
            if ((!lat || !lng) && stationCoords) {
                lat = stationCoords.lat + (Math.random() - 0.5) * 0.002;
                lng = stationCoords.lng + (Math.random() - 0.5) * 0.002;
            }

            if (lat && lng) {
                const marker = this.createPlatformMarker(lat, lng, platform);
                marker.addTo(map);
                newMarkers.push(marker);
            }
        });

        this.platformMarkers = newMarkers;
        return newMarkers;
    }

    /**
     * Clear platform markers (backward compatible)
     * @param {L.Map} map - Leaflet map instance
     */
    clearPlatformMarkers(map) {
        this.platformMarkers.forEach(marker => {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
        this.platformMarkers = [];
    }

    /**
     * Add instrument markers (backward compatible)
     * @param {L.Map} map - Leaflet map instance
     * @param {Array} instruments - Array of instruments
     * @returns {Array} Array of markers
     */
    addInstrumentMarkers(map, instruments = []) {
        const markers = [];

        instruments.forEach(instrument => {
            if (instrument.latitude && instrument.longitude) {
                const marker = this.createInstrumentMarker(
                    instrument.latitude,
                    instrument.longitude,
                    instrument
                );
                marker.addTo(map);
                markers.push(marker);
            }
        });

        return markers;
    }

    /**
     * Center map (backward compatible)
     * @param {L.Map} map - Leaflet map instance
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} zoom - Zoom level
     */
    centerMap(map, lat, lng, zoom = null) {
        if (zoom !== null) {
            map.setView([lat, lng], zoom);
        } else {
            map.panTo([lat, lng]);
        }
    }

    /**
     * Fit to markers (backward compatible)
     * @param {L.Map} map - Leaflet map instance
     * @param {Array} markers - Array of markers
     */
    fitToMarkers(map, markers = []) {
        if (markers.length === 0) return;

        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    /**
     * Get map by container ID
     * @param {string} containerId - Container ID
     * @returns {L.Map|null} Map instance or null
     */
    getMap(containerId) {
        return this.maps.get(containerId) || null;
    }

    /**
     * Get controller by container ID
     * @param {string} containerId - Container ID
     * @returns {MapController|null} Controller instance or null
     */
    getController(containerId) {
        return this.controllers.get(containerId) || null;
    }

    /**
     * Invalidate map size
     * @param {string} containerId - Container ID
     */
    invalidateSize(containerId) {
        const controller = this.getController(containerId);
        if (controller) {
            controller.invalidateSize();
        }
    }

    /**
     * Navigate to station
     * @param {string} stationAcronym - Station acronym
     */
    navigateToStation(stationAcronym) {
        if (stationAcronym) {
            window.location.href = `/station.html?station=${stationAcronym}`;
        }
    }

    /**
     * Destroy map
     * @param {string} containerId - Container ID
     */
    destroyMap(containerId) {
        const controller = this.getController(containerId);
        if (controller) {
            controller.destroy();
            this.controllers.delete(containerId);
        }

        const map = this.getMap(containerId);
        if (map) {
            this.maps.delete(containerId);
        }
    }

    /**
     * Calculate distance between two points (Haversine formula)
     * @param {number} lat1 - Latitude 1
     * @param {number} lng1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lng2 - Longitude 2
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLng = this.degreesToRadians(lng2 - lng1);
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees
     * @returns {number} Radians
     */
    degreesToRadians(degrees) {
        return degrees * (Math.PI/180);
    }

    /**
     * Create popup content (backward compatible)
     * @param {Object} data - Data object
     * @param {string} type - Type (station, platform, instrument)
     * @returns {string} HTML string
     */
    createStationPopup(data) {
        const markerManager = new MarkerManager(this.config);
        return markerManager.createStationPopup(data);
    }

    createPlatformPopup(data) {
        const markerManager = new MarkerManager(this.config);
        return markerManager.createPlatformPopup(data);
    }

    createInstrumentPopup(data) {
        const markerManager = new MarkerManager(this.config);
        return markerManager.createInstrumentPopup(data);
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    // Replace or augment existing sitesMap instance
    window.sitesMapV2 = new SitesInteractiveMapV2();

    // Backward compatibility functions
    window.initializeMap = function(containerId, options = {}) {
        return window.sitesMapV2.initializeMap(containerId, options);
    };

    window.addStationMarker = function(map, lat, lng, stationData = {}) {
        return window.sitesMapV2.addStation(map, lat, lng, stationData);
    };

    window.addPlatformMarkers = function(map, platforms = [], stationCoords = null) {
        return window.sitesMapV2.addPlatformMarkers(map, platforms, stationCoords);
    };

    window.clearPlatformMarkers = function(map) {
        return window.sitesMapV2.clearPlatformMarkers(map);
    };

    window.centerMapOnCoordinates = function(map, lat, lng, zoom = null) {
        return window.sitesMapV2.centerMap(map, lat, lng, zoom);
    };
}
