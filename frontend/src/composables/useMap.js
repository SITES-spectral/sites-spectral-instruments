/**
 * Map Composable
 *
 * Provides map functionality using Leaflet.
 * Handles map initialization, markers, and interactions.
 *
 * @module composables/useMap
 */

import { ref, onMounted, onUnmounted, watch } from 'vue';

/**
 * Create a map instance with station markers
 * @param {Object} options - Map options
 * @returns {Object} Map controls and state
 */
export function useMap(options = {}) {
  const {
    center = [62.5, 17.5], // Default center on Sweden
    zoom = 5,
    minZoom = 3,
    maxZoom = 18
  } = options;

  const mapContainer = ref(null);
  const mapInstance = ref(null);
  const markers = ref([]);
  const selectedStation = ref(null);
  const isLoading = ref(true);
  const error = ref(null);

  // Leaflet instance (loaded dynamically)
  let L = null;

  /**
   * Initialize the map
   */
  async function initMap() {
    if (!mapContainer.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      // Dynamic import of Leaflet
      L = await import('leaflet');

      // Import Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Create map instance
      mapInstance.value = L.map(mapContainer.value, {
        center,
        zoom,
        minZoom,
        maxZoom,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.value);

      // Fix Leaflet icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });

      isLoading.value = false;
    } catch (err) {
      error.value = 'Failed to initialize map: ' + err.message;
      isLoading.value = false;
    }
  }

  /**
   * Add station markers to the map
   * @param {Array} stations - Array of station objects with lat/lon
   */
  function addStationMarkers(stations) {
    if (!mapInstance.value || !L) return;

    // Clear existing markers
    clearMarkers();

    stations.forEach(station => {
      if (station.latitude && station.longitude) {
        const marker = L.marker([station.latitude, station.longitude], {
          title: station.acronym
        });

        // Create popup content
        const popupContent = `
          <div class="station-popup">
            <h3 class="font-bold text-lg">${station.acronym}</h3>
            <p class="text-sm">${station.display_name || ''}</p>
            <p class="text-xs text-gray-500">
              ${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}
            </p>
            <div class="mt-2">
              <span class="badge ${station.status === 'Active' ? 'badge-success' : 'badge-warning'} badge-sm">
                ${station.status || 'Unknown'}
              </span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Click handler
        marker.on('click', () => {
          selectedStation.value = station;
        });

        marker.addTo(mapInstance.value);
        markers.value.push({ marker, station });
      }
    });

    // Fit bounds to show all markers
    if (markers.value.length > 0) {
      const group = L.featureGroup(markers.value.map(m => m.marker));
      mapInstance.value.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Add platform markers to the map
   * @param {Array} platforms - Array of platform objects
   * @param {Object} options - Marker options
   */
  function addPlatformMarkers(platforms, options = {}) {
    if (!mapInstance.value || !L) return;

    const { clearExisting = true, color = '#3b82f6' } = options;

    if (clearExisting) {
      clearMarkers();
    }

    platforms.forEach(platform => {
      if (platform.latitude && platform.longitude) {
        // Create custom icon based on platform type
        const icon = createPlatformIcon(platform.platform_type, color);

        const marker = L.marker([platform.latitude, platform.longitude], {
          icon,
          title: platform.normalized_name
        });

        const popupContent = `
          <div class="platform-popup">
            <h3 class="font-bold">${platform.normalized_name}</h3>
            <p class="text-sm">${platform.display_name || ''}</p>
            <p class="text-xs">Type: ${platform.platform_type}</p>
            <p class="text-xs text-gray-500">
              ${platform.latitude.toFixed(6)}, ${platform.longitude.toFixed(6)}
            </p>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(mapInstance.value);
        markers.value.push({ marker, platform });
      }
    });
  }

  /**
   * Create a custom icon for platform type
   * @param {string} platformType - Platform type (fixed, uav, satellite)
   * @param {string} color - Icon color
   * @returns {Object} Leaflet icon
   */
  function createPlatformIcon(platformType, color) {
    if (!L) return null;

    const iconSvg = {
      fixed: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
      uav: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>`,
      satellite: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/></svg>`
    };

    const svg = iconSvg[platformType] || iconSvg.fixed;

    return L.divIcon({
      html: svg,
      className: 'platform-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }

  /**
   * Clear all markers from the map
   */
  function clearMarkers() {
    markers.value.forEach(({ marker }) => {
      marker.remove();
    });
    markers.value = [];
  }

  /**
   * Pan to a specific location
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} zoomLevel - Optional zoom level
   */
  function panTo(lat, lon, zoomLevel) {
    if (!mapInstance.value) return;
    mapInstance.value.setView([lat, lon], zoomLevel || mapInstance.value.getZoom());
  }

  /**
   * Fit the map to show all markers
   */
  function fitToMarkers() {
    if (!mapInstance.value || !L || markers.value.length === 0) return;

    const group = L.featureGroup(markers.value.map(m => m.marker));
    mapInstance.value.fitBounds(group.getBounds().pad(0.1));
  }

  /**
   * Highlight a specific station marker
   * @param {string} stationAcronym - Station acronym to highlight
   */
  function highlightStation(stationAcronym) {
    markers.value.forEach(({ marker, station }) => {
      if (station?.acronym === stationAcronym) {
        marker.openPopup();
        panTo(station.latitude, station.longitude, 10);
      }
    });
  }

  /**
   * Get current map bounds
   * @returns {Object} Bounds object
   */
  function getBounds() {
    if (!mapInstance.value) return null;
    const bounds = mapInstance.value.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  }

  /**
   * Invalidate map size (use after container resize)
   */
  function invalidateSize() {
    if (mapInstance.value) {
      mapInstance.value.invalidateSize();
    }
  }

  /**
   * Destroy the map instance
   */
  function destroyMap() {
    if (mapInstance.value) {
      mapInstance.value.remove();
      mapInstance.value = null;
    }
    clearMarkers();
  }

  // Cleanup on unmount
  onUnmounted(() => {
    destroyMap();
  });

  return {
    // Refs
    mapContainer,
    mapInstance,
    markers,
    selectedStation,
    isLoading,
    error,

    // Methods
    initMap,
    addStationMarkers,
    addPlatformMarkers,
    clearMarkers,
    panTo,
    fitToMarkers,
    highlightStation,
    getBounds,
    invalidateSize,
    destroyMap
  };
}
