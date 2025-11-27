// SITES Spectral - Map Configuration
// Centralized configuration for all map-related settings

class MapConfig {
    constructor() {
        // Default map settings
        this.defaults = {
            center: [59.8586, 17.6389], // Uppsala, Sweden
            zoom: 8,
            minZoom: 3,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: true
        };

        // Swedish coordinate system bounds [west, south, east, north]
        this.swedenBounds = [10.03, 55.36, 24.17, 69.07];

        // Tile layer configurations
        this.tileLayers = {
            osm: {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                options: {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                    crossOrigin: 'anonymous',
                    errorTileUrl: this.getErrorTileUrl()
                }
            },
            satellite: {
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                options: {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                    maxZoom: 19,
                    crossOrigin: 'anonymous',
                    errorTileUrl: this.getErrorTileUrl()
                }
            },
            topographic: {
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                options: {
                    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
                    maxZoom: 17,
                    crossOrigin: 'anonymous',
                    errorTileUrl: this.getErrorTileUrl()
                }
            }
        };

        // Marker icon configurations
        this.markerIcons = {
            station: {
                size: [32, 40],
                anchor: [16, 40],
                popupAnchor: [0, -40],
                color: '#059669',
                icon: 'broadcast-tower'
            },
            platform: {
                size: [24, 30],
                anchor: [12, 30],
                popupAnchor: [0, -30],
                color: '#4285F4',
                icon: 'building'
            },
            phenocam: {
                size: [20, 25],
                anchor: [10, 25],
                popupAnchor: [0, -25],
                color: '#f59e0b',
                icon: 'camera'
            },
            multispectral: {
                size: [20, 25],
                anchor: [10, 25],
                popupAnchor: [0, -25],
                color: '#8b5cf6',
                icon: 'satellite-dish'
            },
            par: {
                size: [20, 25],
                anchor: [10, 25],
                popupAnchor: [0, -25],
                color: '#f59e0b',
                icon: 'sun'
            },
            ndvi: {
                size: [20, 25],
                anchor: [10, 25],
                popupAnchor: [0, -25],
                color: '#22c55e',
                icon: 'leaf'
            },
            pri: {
                size: [20, 25],
                anchor: [10, 25],
                popupAnchor: [0, -25],
                color: '#06b6d4',
                icon: 'microscope'
            },
            hyperspectral: {
                size: [20, 25],
                anchor: [10, 25],
                popupAnchor: [0, -25],
                color: '#ec4899',
                icon: 'rainbow'
            }
        };

        // GeoJSON style configurations
        this.geojsonStyles = {
            default: {
                color: '#3388ff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.2
            },
            aoi: {
                color: '#059669',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.1
            },
            roi: {
                color: '#f59e0b',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.15
            },
            highlight: {
                color: '#ef4444',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.3
            }
        };

        // Clustering configuration
        this.clusterConfig = {
            enabled: true,
            maxClusterRadius: 60,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 15
        };
    }

    // Generate error tile as data URL (gray tile with error icon)
    getErrorTileUrl() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Gray background
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, 256, 256);

        // Error message
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Tile Error', 128, 128);

        return canvas.toDataURL();
    }

    // Validate coordinates are within Sweden bounds
    isValidSwedishCoordinate(lat, lng) {
        return lng >= this.swedenBounds[0] &&
               lat >= this.swedenBounds[1] &&
               lng <= this.swedenBounds[2] &&
               lat <= this.swedenBounds[3];
    }

    // Get tile layer configuration by key
    getTileLayer(key = 'osm') {
        return this.tileLayers[key] || this.tileLayers.osm;
    }

    // Get marker icon configuration by type
    getMarkerConfig(type = 'station') {
        return this.markerIcons[type] || this.markerIcons.station;
    }

    // Get GeoJSON style by type
    getGeoJSONStyle(type = 'default') {
        return this.geojsonStyles[type] || this.geojsonStyles.default;
    }

    // Get map initialization options
    getMapOptions(customOptions = {}) {
        return {
            ...this.defaults,
            ...customOptions
        };
    }
}

// Export singleton instance
if (typeof window !== 'undefined') {
    window.MapConfig = MapConfig;
    window.mapConfig = new MapConfig();
}
