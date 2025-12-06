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

const emit = defineEmits(['station-click', 'station-hover']);

const router = useRouter();
const mapContainer = ref(null);

// Map instance
let map = null;
let markers = [];

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

  // Fit bounds if we have stations
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

/**
 * Destroy the map
 */
function destroyMap() {
  if (map) {
    map.remove();
    map = null;
    markers = [];
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
watch(() => props.center, (newCenter) => {
  if (map) {
    map.setView(newCenter, props.zoom);
  }
});

// Expose methods
defineExpose({
  fitBounds: () => {
    if (map && markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  },
  setView: (center, zoom) => {
    if (map) {
      map.setView(center, zoom || props.zoom);
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
      <div class="flex items-center gap-4 text-xs">
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></span>
          <span>Station</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-white shadow"></span>
          <span>Selected</span>
        </div>
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
