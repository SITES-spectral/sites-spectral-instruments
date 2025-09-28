// SITES Spectral Instruments - Interactive Map Module
// Leaflet-based mapping functionality with Swedish coordinate system support

class SitesInteractiveMap {
    constructor() {
        this.maps = new Map();
        this.markers = new Map();
        this.platformMarkers = [];
        this.currentMap = null;
        this.defaultCenter = [59.8586, 17.6389]; // Uppsala, Sweden
        this.defaultZoom = 8;

        // Swedish coordinate systems (will be initialized when Leaflet is available)
        this.swerefProjection = null;
    }

    // Initialize Swedish coordinate system (call when Leaflet is loaded)
    initializeSwedishProjection() {
        if (typeof L !== 'undefined' && !this.swerefProjection) {
            this.swerefProjection = {
                name: 'SWEREF99 TM',
                crs: L.CRS.EPSG3857, // Web Mercator for Leaflet compatibility
                bounds: [10.03, 55.36, 24.17, 69.07] // Sweden bounds [west, south, east, north]
            };
        }
    }

    // Initialize map in a container
    initializeMap(containerId, options = {}) {
        // Initialize Swedish projection system if not done yet
        this.initializeSwedishProjection();

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Map container ${containerId} not found`);
            return null;
        }

        const defaultOptions = {
            center: this.defaultCenter,
            zoom: this.defaultZoom,
            zoomControl: true,
            attributionControl: true,
            maxZoom: 18,
            minZoom: 3
        };

        const mapOptions = { ...defaultOptions, ...options };
        const map = L.map(containerId, mapOptions);

        // Add base layers
        this.addBaseLayers(map);

        // Store map reference
        this.maps.set(containerId, map);
        this.currentMap = map;

        return map;
    }

    // Add base layers (OSM and Satellite)
    addBaseLayers(map) {
        // OpenStreetMap layer
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });

        // Satellite layer (using Esri World Imagery)
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
        });

        // Add default layer
        osmLayer.addTo(map);

        // Create layer control
        const baseLayers = {
            'OpenStreetMap': osmLayer,
            'Satellite': satelliteLayer
        };

        L.control.layers(baseLayers).addTo(map);

        // Store layer references
        map.osmLayer = osmLayer;
        map.satelliteLayer = satelliteLayer;
    }

    // Validate Swedish coordinates
    isValidSwedishCoordinate(lat, lng) {
        const bounds = this.swerefProjection.bounds;
        return lng >= bounds[0] && lat >= bounds[1] && lng <= bounds[2] && lat <= bounds[3];
    }

    // Create station marker
    createStationMarker(lat, lng, stationData = {}) {
        if (!this.isValidSwedishCoordinate(lat, lng)) {
            console.warn(`Coordinates ${lat}, ${lng} are outside Swedish bounds`);
        }

        const stationIcon = L.divIcon({
            html: `
                <div style="position: relative;">
                    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z" fill="#059669"/>
                        <circle cx="16" cy="16" r="8" fill="white"/>
                        <i class="fas fa-broadcast-tower" style="font-size: 12px; position: absolute; top: 8px; left: 50%; transform: translateX(-50%); color: #059669;"></i>
                    </svg>
                </div>
            `,
            className: 'station-marker-icon',
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -40]
        });

        const marker = L.marker([lat, lng], { icon: stationIcon });

        // Add popup if station data provided
        if (stationData.display_name) {
            const popupContent = this.createStationPopup(stationData);
            marker.bindPopup(popupContent);
        }

        return marker;
    }

    // Create platform marker
    createPlatformMarker(lat, lng, platformData = {}) {
        if (!this.isValidSwedishCoordinate(lat, lng)) {
            console.warn(`Platform coordinates ${lat}, ${lng} are outside Swedish bounds`);
        }

        const platformIcon = L.divIcon({
            html: `
                <div style="position: relative;">
                    <svg width="24" height="30" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.4 0 0 5.4 0 12c0 6.6 12 18 12 18s12-11.4 12-18C24 5.4 18.6 0 12 0z" fill="#4285F4"/>
                        <circle cx="12" cy="12" r="6" fill="white"/>
                        <i class="fas fa-building" style="font-size: 8px; position: absolute; top: 6px; left: 50%; transform: translateX(-50%); color: #4285F4;"></i>
                    </svg>
                </div>
            `,
            className: 'platform-marker-icon',
            iconSize: [24, 30],
            iconAnchor: [12, 30],
            popupAnchor: [0, -30]
        });

        const marker = L.marker([lat, lng], { icon: platformIcon });

        // Add popup if platform data provided
        if (platformData.display_name) {
            const popupContent = this.createPlatformPopup(platformData);
            marker.bindPopup(popupContent);
        }

        return marker;
    }

    // Create instrument marker
    createInstrumentMarker(lat, lng, instrumentData = {}) {
        const instrumentIcon = L.divIcon({
            html: `
                <div style="position: relative;">
                    <svg width="20" height="25" viewBox="0 0 20 25" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 0C4.5 0 0 4.5 0 10c0 5.5 10 15 10 15s10-9.5 10-15C20 4.5 15.5 0 10 0z" fill="#f59e0b"/>
                        <circle cx="10" cy="10" r="5" fill="white"/>
                        <i class="fas fa-camera" style="font-size: 6px; position: absolute; top: 5px; left: 50%; transform: translateX(-50%); color: #f59e0b;"></i>
                    </svg>
                </div>
            `,
            className: 'instrument-marker-icon',
            iconSize: [20, 25],
            iconAnchor: [10, 25],
            popupAnchor: [0, -25]
        });

        const marker = L.marker([lat, lng], { icon: instrumentIcon });

        // Add popup if instrument data provided
        if (instrumentData.name) {
            const popupContent = this.createInstrumentPopup(instrumentData);
            marker.bindPopup(popupContent);
        }

        return marker;
    }

    // Create station popup content
    createStationPopup(stationData) {
        return `
            <div class="map-popup station-popup">
                <h4>${stationData.display_name || 'Station'}</h4>
                ${stationData.acronym ? `<p><strong>Acronym:</strong> ${stationData.acronym}</p>` : ''}
                ${stationData.description ? `<p>${stationData.description}</p>` : ''}
                ${stationData.latitude && stationData.longitude ?
                    `<p><strong>Coordinates:</strong> ${stationData.latitude.toFixed(4)}, ${stationData.longitude.toFixed(4)}</p>` : ''}
                ${stationData.id ?
                    `<button onclick="sitesMap.navigateToStation('${stationData.acronym}')" class="btn btn-primary btn-sm">
                        View Station Details
                    </button>` : ''}
            </div>
        `;
    }

    // Create platform popup content
    createPlatformPopup(platformData) {
        const instrumentCount = platformData.instrument_count || 0;
        return `
            <div class="map-popup platform-popup">
                <h5>${platformData.display_name || platformData.normalized_name || 'Platform'}</h5>
                ${platformData.normalized_name && platformData.normalized_name !== platformData.display_name ?
                    `<p><small style="opacity: 0.7; color: #059669; font-family: 'Courier New', monospace; font-weight: 600;">${platformData.normalized_name}</small></p>` : ''}
                ${platformData.ecosystem_code ? `<p><strong>Ecosystem:</strong> ${platformData.ecosystem_code}</p>` : ''}
                ${platformData.location_code ? `<p><strong>Location:</strong> ${platformData.location_code}</p>` : ''}
                <p><strong>Instruments:</strong> ${instrumentCount}</p>
                ${platformData.description ? `<p><strong>Description:</strong> ${platformData.description}</p>` : ''}
            </div>
        `;
    }

    // Create instrument popup content
    createInstrumentPopup(instrumentData) {
        return `
            <div class="map-popup instrument-popup">
                <h6>${instrumentData.name || 'Instrument'}</h6>
                ${instrumentData.type ? `<p><strong>Type:</strong> ${instrumentData.type}</p>` : ''}
                ${instrumentData.serial_number ? `<p><strong>Serial:</strong> ${instrumentData.serial_number}</p>` : ''}
                ${instrumentData.status ? `<p><strong>Status:</strong>
                    <span class="status-badge status-${instrumentData.status.toLowerCase()}">${instrumentData.status}</span>
                </p>` : ''}
            </div>
        `;
    }

    // Add station to map
    addStation(map, lat, lng, stationData = {}) {
        const marker = this.createStationMarker(lat, lng, stationData);
        marker.addTo(map);

        const markerId = `station-${stationData.id || Date.now()}`;
        this.markers.set(markerId, marker);

        return marker;
    }

    // Add platform markers to map
    addPlatformMarkers(map, platforms = [], stationCoords = null) {
        // Clear existing platform markers
        this.clearPlatformMarkers(map);

        if (!platforms || platforms.length === 0) {
            return [];
        }

        const newMarkers = [];

        platforms.forEach((platform, index) => {
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

    // Clear platform markers
    clearPlatformMarkers(map) {
        this.platformMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        this.platformMarkers = [];
    }

    // Add instrument markers
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

    // Center map on coordinates
    centerMap(map, lat, lng, zoom = null) {
        if (zoom !== null) {
            map.setView([lat, lng], zoom);
        } else {
            map.panTo([lat, lng]);
        }
    }

    // Fit map to markers
    fitToMarkers(map, markers = []) {
        if (markers.length === 0) return;

        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    // Get map by container ID
    getMap(containerId) {
        return this.maps.get(containerId);
    }

    // Update map size (call after container resize)
    invalidateSize(containerId) {
        const map = this.getMap(containerId);
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    }

    // Navigation helper
    navigateToStation(stationAcronym) {
        if (stationAcronym) {
            window.location.href = `/station.html?station=${stationAcronym}`;
        }
    }

    // Cleanup
    destroyMap(containerId) {
        const map = this.getMap(containerId);
        if (map) {
            map.remove();
            this.maps.delete(containerId);
        }
    }

    // Utility: Calculate distance between two points (Haversine formula)
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

    degreesToRadians(degrees) {
        return degrees * (Math.PI/180);
    }
}

// Global instance
window.sitesMap = new SitesInteractiveMap();

// Backward compatibility functions
function initializeMap(containerId, options = {}) {
    return window.sitesMap.initializeMap(containerId, options);
}

function addStationMarker(map, lat, lng, stationData = {}) {
    return window.sitesMap.addStation(map, lat, lng, stationData);
}

function addPlatformMarkers(map, platforms = [], stationCoords = null) {
    return window.sitesMap.addPlatformMarkers(map, platforms, stationCoords);
}

function clearPlatformMarkers(map) {
    return window.sitesMap.clearPlatformMarkers(map);
}

function centerMapOnCoordinates(map, lat, lng, zoom = null) {
    return window.sitesMap.centerMap(map, lat, lng, zoom);
}