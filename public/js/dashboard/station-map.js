/**
 * SITES Spectral - Station Map Component
 *
 * Manages the Leaflet map for station dashboard.
 * Extracted from station-dashboard.js for modularity.
 *
 * @module dashboard/station-map
 * @version 13.16.0
 */

(function(global) {
    'use strict';

    const logger = global.Debug?.withCategory('StationMap') || {
        log: () => {},
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    /** Default coordinates (Uppsala, Sweden) */
    const DEFAULT_LAT = 59.8586;
    const DEFAULT_LNG = 17.6389;
    const DEFAULT_ZOOM = 12;

    /**
     * StationMap - Manages Leaflet map for station view
     */
    class StationMap {
        /**
         * @param {Object} options
         * @param {string} options.containerId - Map container element ID
         */
        constructor(options = {}) {
            this.containerId = options.containerId || 'station-map';
            this.map = null;
            this.stationData = null;
            this.platforms = [];
        }

        /**
         * Check if sitesMap library is available
         * @returns {boolean}
         */
        isAvailable() {
            return typeof global.sitesMap !== 'undefined';
        }

        /**
         * Initialize the map with station data
         * @param {Object} stationData - Station data with latitude/longitude
         */
        initialize(stationData) {
            if (!this.isAvailable()) {
                logger.warn('sitesMap library not available');
                return;
            }

            const container = document.getElementById(this.containerId);
            if (!container) {
                logger.warn(`Map container #${this.containerId} not found`);
                return;
            }

            this.stationData = stationData;

            const lat = stationData?.latitude || DEFAULT_LAT;
            const lng = stationData?.longitude || DEFAULT_LNG;

            try {
                this.map = global.sitesMap.initializeMap(this.containerId, {
                    center: [lat, lng],
                    zoom: DEFAULT_ZOOM
                });

                // Add station marker
                global.sitesMap.addStation(this.map, lat, lng, stationData);

                logger.log('Station map initialized');
            } catch (error) {
                logger.error('Failed to initialize map:', error);
            }
        }

        /**
         * Update platform markers on the map
         * @param {Array} platforms - Array of platform data
         */
        updatePlatformMarkers(platforms) {
            if (!this.map || !this.isAvailable()) {
                return;
            }

            this.platforms = platforms || [];

            const stationCoords = {
                lat: this.stationData?.latitude || DEFAULT_LAT,
                lng: this.stationData?.longitude || DEFAULT_LNG
            };

            try {
                global.sitesMap.addPlatformMarkers(this.map, this.platforms, stationCoords);
            } catch (error) {
                logger.error('Failed to update platform markers:', error);
            }
        }

        /**
         * Center map on station
         */
        centerOnStation() {
            if (!this.map || !this.stationData) {
                return;
            }

            const lat = this.stationData.latitude || DEFAULT_LAT;
            const lng = this.stationData.longitude || DEFAULT_LNG;

            try {
                this.map.setView([lat, lng], DEFAULT_ZOOM);
            } catch (error) {
                logger.error('Failed to center map:', error);
            }
        }

        /**
         * Get the Leaflet map instance
         * @returns {Object|null} Leaflet map or null
         */
        getMap() {
            return this.map;
        }

        /**
         * Destroy the map instance
         */
        destroy() {
            if (this.map) {
                try {
                    this.map.remove();
                } catch (error) {
                    logger.error('Error destroying map:', error);
                }
                this.map = null;
            }
        }
    }

    // Export
    global.StationMap = StationMap;

    logger.log('StationMap module loaded');

})(typeof window !== 'undefined' ? window : global);
