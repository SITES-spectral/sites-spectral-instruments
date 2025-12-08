<script setup>
/**
 * Station Map Component
 *
 * Displays stations on an interactive Leaflet map.
 * Supports marker clustering and click navigation.
 *
 * @component
 */
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  /**
   * Array of station objects with lat/lon
   */
  stations: {
    type: Array,
    default: () => []
  },

  /**
   * Array of platform objects with lat/lon (for selected station)
   */
  platforms: {
    type: Array,
    default: () => []
  },

  /**
   * Array of platform objects from other stations (dimmed display)
   */
  otherPlatforms: {
    type: Array,
    default: () => []
  },

  /**
   * Show platform markers (fixed platforms with coordinates)
   */
  showPlatforms: {
    type: Boolean,
    default: true
  },

  /**
   * Map height
   */
  height: {
    type: [Number, String],
    default: 400
  },

  /**
   * Enable click to navigate
   */
  clickable: {
    type: Boolean,
    default: true
  },

  /**
   * Initial zoom level
   */
  zoom: {
    type: Number,
    default: 5
  },

  /**
   * Center coordinates [lat, lon]
   */
  center: {
    type: Array,
    default: () => [62.0, 16.0]  // Sweden center
  },

  /**
   * Currently selected station ID
   */
  selectedId: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['station-click', 'station-hover', 'platform-click']);

const router = useRouter();
const mapContainer = ref(null);

// Map instance
let map = null;
let markers = [];
let platformMarkers = [];
let platformMarkerMap = new Map(); // Map of platform ID to marker
let otherPlatformMarkers = [];

// Height style
const heightStyle = computed(() => {
  const h = typeof props.height === 'number' ? `${props.height}px` : props.height;
  return { height: h };
});

/**
 * Create custom marker icon
 */
function createMarkerIcon(station, isSelected = false) {
  const color = isSelected ? '#7c3aed' : '#3b82f6';  // Purple if selected, blue otherwise
  const size = isSelected ? 14 : 10;

  return L.divIcon({
    className: 'station-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

/**
 * Create platform marker icon based on mount type
 * @param {Object} platform - Platform object
 * @param {boolean} dimmed - Whether to show dimmed (for other stations)
 */
function createPlatformMarkerIcon(platform, dimmed = false) {
  // Mount type colors: PL=tower(orange), BL=building(teal), GL=ground(green)
  const mountType = platform.mount_type_code?.match(/^([A-Z]+)/)?.[1] || 'PL';
  const colors = {
    PL: '#f97316',  // Orange - tower/mast
    BL: '#14b8a6',  // Teal - building
    GL: '#22c55e'   // Green - ground level
  };
  const color = colors[mountType] || '#f97316';

  // Dimmed markers are smaller and more transparent
  const size = dimmed ? { left: 4, right: 4, bottom: 8 } : { left: 6, right: 6, bottom: 12 };
  const opacity = dimmed ? 0.35 : 1;
  const shadow = dimmed ? 'none' : 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))';

  // Triangle/tower shape for platforms
  return L.divIcon({
    className: dimmed ? 'platform-marker-dimmed' : 'platform-marker',
    html: `
      <div style="
        width: 0;
        height: 0;
        border-left: ${size.left}px solid transparent;
        border-right: ${size.right}px solid transparent;
        border-bottom: ${size.bottom}px solid ${color};
        opacity: ${opacity};
        filter: ${shadow};
        cursor: ${dimmed ? 'default' : 'pointer'};
      "></div>
    `,
    iconSize: [size.left * 2, size.bottom],
    iconAnchor: [size.left, size.bottom]
  });
}

/**
 * Create popup content for platform
 */
function createPlatformPopupContent(platform) {
  const mountType = platform.mount_type_code?.match(/^([A-Z]+)/)?.[1] || '?';
  const mountNames = { PL: 'Tower/Mast', BL: 'Building', GL: 'Ground Level' };

  return `
    <div style="min-width: 200px; font-family: system-ui, sans-serif;">
      <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
        <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 2px;">
          ${platform.normalized_name || platform.display_name}
        </code>
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
        ${platform.display_name || ''}
      </div>
      <div style="font-size: 11px; color: #888; margin-bottom: 4px;">
        <strong>Mount:</strong> ${mountNames[mountType] || mountType} (${platform.mount_type_code || '?'})
      </div>
      <div style="font-size: 11px; color: #888; margin-bottom: 4px;">
        <strong>Ecosystem:</strong> ${platform.ecosystem_code || 'N/A'}
      </div>
      <div style="font-size: 11px; color: #888;">
        ${platform.latitude?.toFixed(5) || '?'}, ${platform.longitude?.toFixed(5) || '?'}
      </div>
    </div>
  `;
}

/**
 * Create popup content for station
 */
function createPopupContent(station) {
  const statusClass = station.status === 'Active' ? 'color: #22c55e' : 'color: #ef4444';
  return `
    <div style="min-width: 180px; font-family: system-ui, sans-serif;">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
        ${station.display_name || station.acronym}
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
        <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 2px;">
          ${station.acronym}
        </code>
      </div>
      <div style="font-size: 12px; margin-bottom: 4px;">
        <span style="${statusClass}">●</span> ${station.status || 'Unknown'}
      </div>
      <div style="font-size: 11px; color: #888;">
        ${station.latitude?.toFixed(4) || '?'}, ${station.longitude?.toFixed(4) || '?'}
      </div>
    </div>
  `;
}

/**
 * Initialize the map
 */
function initMap() {
  if (!mapContainer.value || map) return;

  // Create map
  map = L.map(mapContainer.value, {
    center: props.center,
    zoom: props.zoom,
    zoomControl: true,
    attributionControl: true
  });

  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map);

  // Add markers
  updateMarkers();
}

/**
 * Update markers on the map
 */
function updateMarkers() {
  if (!map) return;

  // Clear existing markers
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  // Add new markers
  props.stations.forEach(station => {
    if (station.latitude == null || station.longitude == null) return;

    const isSelected = station.id === props.selectedId;
    const marker = L.marker(
      [station.latitude, station.longitude],
      { icon: createMarkerIcon(station, isSelected) }
    );

    // Popup
    marker.bindPopup(createPopupContent(station));

    // Events
    marker.on('click', () => {
      emit('station-click', station);
      if (props.clickable) {
        router.push({ name: 'station', params: { acronym: station.acronym } });
      }
    });

    marker.on('mouseover', () => {
      emit('station-hover', station);
      marker.openPopup();
    });

    marker.addTo(map);
    markers.push(marker);
  });

  // Update platform markers too
  updatePlatformMarkers();

  // Fit bounds if we have stations or platforms
  const allMarkers = [...markers, ...platformMarkers];
  if (allMarkers.length > 0) {
    const group = L.featureGroup(allMarkers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

/**
 * Update platform markers on the map
 */
function updatePlatformMarkers() {
  if (!map) return;

  // Clear existing platform markers
  platformMarkers.forEach(marker => map.removeLayer(marker));
  platformMarkers = [];
  platformMarkerMap.clear();

  // Only show if showPlatforms is enabled
  if (!props.showPlatforms) return;

  // Add new platform markers (only fixed platforms with coordinates)
  props.platforms.forEach(platform => {
    // Skip if no coordinates
    if (platform.latitude == null || platform.longitude == null) return;

    // Only show fixed platforms (not UAV/satellite)
    if (platform.platform_type !== 'fixed') return;

    const marker = L.marker(
      [platform.latitude, platform.longitude],
      { icon: createPlatformMarkerIcon(platform, false) }
    );

    // Popup
    marker.bindPopup(createPlatformPopupContent(platform));

    // Events
    marker.on('click', () => {
      emit('platform-click', platform);
      if (props.clickable) {
        router.push({ name: 'platform', params: { id: platform.id } });
      }
    });

    marker.on('mouseover', () => {
      marker.openPopup();
    });

    marker.addTo(map);
    platformMarkers.push(marker);
    platformMarkerMap.set(platform.id, marker);
  });
}

/**
 * Update other platforms markers (dimmed, from other stations)
 */
function updateOtherPlatformMarkers() {
  if (!map) return;

  // Clear existing other platform markers
  otherPlatformMarkers.forEach(marker => map.removeLayer(marker));
  otherPlatformMarkers = [];

  // Only show if showPlatforms is enabled and we have other platforms
  if (!props.showPlatforms || !props.otherPlatforms?.length) return;

  // Add dimmed platform markers for other stations
  props.otherPlatforms.forEach(platform => {
    // Skip if no coordinates
    if (platform.latitude == null || platform.longitude == null) return;

    // Only show fixed platforms (not UAV/satellite)
    if (platform.platform_type !== 'fixed') return;

    const marker = L.marker(
      [platform.latitude, platform.longitude],
      { icon: createPlatformMarkerIcon(platform, true) }
    );

    // Simpler popup for other stations' platforms
    marker.bindPopup(`
      <div style="min-width: 150px; font-family: system-ui, sans-serif; opacity: 0.8;">
        <div style="font-weight: 500; font-size: 12px; color: #888;">
          <code style="background: #f1f5f9; padding: 1px 4px; border-radius: 2px;">
            ${platform.normalized_name || platform.display_name}
          </code>
        </div>
        <div style="font-size: 11px; color: #aaa; margin-top: 4px;">
          Other station platform
        </div>
      </div>
    `);

    // Only hover events for dimmed markers (no click navigation)
    marker.on('mouseover', () => {
      marker.openPopup();
    });

    marker.addTo(map);
    otherPlatformMarkers.push(marker);
  });
}

/**
 * Destroy the map
 */
function destroyMap() {
  if (map) {
    map.remove();
    map = null;
    markers = [];
    platformMarkers = [];
    platformMarkerMap.clear();
    otherPlatformMarkers = [];
  }
}

// Lifecycle
onMounted(() => {
  initMap();
});

onUnmounted(() => {
  destroyMap();
});

// Watch for changes
watch(() => props.stations, updateMarkers, { deep: true });
watch(() => props.selectedId, updateMarkers);
watch(() => props.platforms, updatePlatformMarkers, { deep: true });
watch(() => props.showPlatforms, () => {
  updatePlatformMarkers();
  updateOtherPlatformMarkers();
});
watch(() => props.otherPlatforms, updateOtherPlatformMarkers, { deep: true });
watch(() => props.center, (newCenter) => {
  if (map) {
    map.setView(newCenter, props.zoom);
  }
});

// Expose methods
defineExpose({
  fitBounds: () => {
    const allMarkers = [...markers, ...platformMarkers, ...otherPlatformMarkers];
    if (map && allMarkers.length > 0) {
      const group = L.featureGroup(allMarkers);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  },
  setView: (center, zoom) => {
    if (map) {
      map.setView(center, zoom || props.zoom);
    }
  },
  /**
   * Highlight a platform marker by platform ID - centers map and opens popup
   * @param {number|string} platformId - Platform ID to highlight
   */
  highlightPlatform: (platformId) => {
    if (!map || !platformId) return;

    // Try both number and string versions of ID
    const numId = typeof platformId === 'string' ? parseInt(platformId, 10) : platformId;
    const marker = platformMarkerMap.get(platformId) || platformMarkerMap.get(numId);
    if (!marker) return;

    // Find the platform for coordinates
    const platform = props.platforms.find(p => p.id === platformId || p.id === numId);
    if (!platform || platform.latitude == null || platform.longitude == null) return;

    // Pan smoothly to the platform and open popup
    map.setView([platform.latitude, platform.longitude], 14, { animate: true });
    marker.openPopup();
  },
  /**
   * Clear highlight (close popups and reset view)
   */
  clearHighlight: () => {
    if (map) {
      map.closePopup();
      // Fit back to all markers
      const allMarkers = [...markers, ...platformMarkers, ...otherPlatformMarkers];
      if (allMarkers.length > 0) {
        const group = L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.2), { animate: true });
      }
    }
  }
});
</script>

<template>
  <div class="station-map-container rounded-lg overflow-hidden border border-base-300">
    <div
      ref="mapContainer"
      class="w-full"
      :style="heightStyle"
    ></div>

    <!-- Legend -->
    <div class="absolute bottom-3 left-3 bg-base-100/90 rounded-lg p-2 shadow-md z-[1000]">
      <div class="flex flex-wrap items-center gap-3 text-xs">
        <!-- Station markers -->
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></span>
          <span>Station</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-white shadow"></span>
          <span>Selected</span>
        </div>
        <!-- Platform markers (when shown) -->
        <template v-if="showPlatforms && platforms.length > 0">
          <span class="text-base-content/40">|</span>
          <div class="flex items-center gap-1">
            <span class="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-orange-500"></span>
            <span>Tower</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-teal-500"></span>
            <span>Building</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-green-500"></span>
            <span>Ground</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Station count -->
    <div class="absolute top-3 right-3 bg-base-100/90 rounded-lg px-3 py-1 shadow-md z-[1000]">
      <span class="text-sm font-medium">{{ stations.length }} station{{ stations.length !== 1 ? 's' : '' }}</span>
    </div>
  </div>
</template>

<style scoped>
.station-map-container {
  position: relative;
  min-height: 200px;
}

/* Fix Leaflet z-index issues */
:deep(.leaflet-pane) {
  z-index: 400;
}

:deep(.leaflet-control) {
  z-index: 800;
}

:deep(.leaflet-top),
:deep(.leaflet-bottom) {
  z-index: 999;
}
</style>
