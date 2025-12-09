<script setup>
/**
 * Platform Mini Map Component
 *
 * Compact Leaflet map showing a platform in context with other station platforms.
 * The selected platform is highlighted while siblings are shown in muted colors.
 *
 * SOLID Compliance:
 * - Single Responsibility: Displays platform location with station context
 * - Dependency Inversion: Takes platform object, fetches siblings via API
 * - Interface Segregation: Minimal props, focused interface
 *
 * @module components/maps/PlatformMiniMap
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { api } from '@services/api';

const props = defineProps({
  platform: {
    type: Object,
    required: true
  },
  height: {
    type: Number,
    default: 200
  },
  zoom: {
    type: Number,
    default: 14
  },
  interactive: {
    type: Boolean,
    default: false
  },
  showPopup: {
    type: Boolean,
    default: false
  },
  showSiblings: {
    type: Boolean,
    default: true
  }
});

// Map state
const mapContainer = ref(null);
const isLoading = ref(true);
const error = ref(null);
const siblingPlatforms = ref([]);
let mapInstance = null;
let L = null;

// Check if platform has valid coordinates
const hasCoordinates = computed(() => {
  return props.platform?.latitude != null && props.platform?.longitude != null;
});

// Selected platform highlight color (bright cyan/teal for visibility)
const SELECTED_COLOR = '#06b6d4';  // Cyan-500 - stands out from other colors

// Mount type colors for sibling platforms (muted versions)
const MOUNT_TYPE_COLORS = {
  PL: '#fb923c',  // Orange-400 - tower/mast
  BL: '#2dd4bf',  // Teal-400 - building
  GL: '#4ade80',  // Green-400 - ground level
  UAV: '#facc15', // Yellow-400 - UAV
  SAT: '#a78bfa'  // Violet-400 - satellite
};

// Muted colors for siblings (lower opacity appearance)
const SIBLING_COLORS = {
  PL: '#fdba74',  // Orange-300
  BL: '#5eead4',  // Teal-300
  GL: '#86efac',  // Green-300
  UAV: '#fde047', // Yellow-300
  SAT: '#c4b5fd'  // Violet-300
};

/**
 * Get marker color based on mount type (for siblings)
 */
function getSiblingMarkerColor(platform) {
  const mountCode = platform.mount_type_code?.match(/^([A-Z]+)/)?.[1] || 'PL';
  return SIBLING_COLORS[mountCode] || SIBLING_COLORS.PL;
}

/**
 * Create platform marker icon (triangle pointing up)
 * @param {Object} platform - Platform object
 * @param {boolean} isSelected - Whether this is the selected platform
 */
function createPlatformMarkerIcon(platform, isSelected = false) {
  if (!L) return null;

  const color = isSelected ? SELECTED_COLOR : getSiblingMarkerColor(platform);
  const size = isSelected ? { width: 10, height: 16 } : { width: 6, height: 10 };
  const shadow = isSelected
    ? 'filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));'
    : 'filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));';

  return L.divIcon({
    className: `platform-mini-marker ${isSelected ? 'selected' : 'sibling'}`,
    html: `
      <div style="
        width: 0;
        height: 0;
        border-left: ${size.width}px solid transparent;
        border-right: ${size.width}px solid transparent;
        border-bottom: ${size.height}px solid ${color};
        ${shadow}
      "></div>
    `,
    iconSize: [size.width * 2, size.height],
    iconAnchor: [size.width, size.height],
    popupAnchor: [0, -size.height]
  });
}

/**
 * Create popup content for marker
 */
function createPopupContent(platform, isSelected = false) {
  const name = platform.display_name || platform.normalized_name || 'Platform';
  const mountCode = platform.mount_type_code || platform.location_code || '';
  const selectedBadge = isSelected
    ? '<span class="text-[10px] bg-cyan-100 text-cyan-700 px-1 rounded ml-1">Current</span>'
    : '';

  return `
    <div class="platform-mini-popup text-sm">
      <div class="font-semibold">${name}${selectedBadge}</div>
      ${mountCode ? `<div class="text-xs text-gray-500">${mountCode}</div>` : ''}
      <div class="text-xs text-gray-400 mt-1">
        ${Number(platform.latitude).toFixed(5)}°N<br>
        ${Number(platform.longitude).toFixed(5)}°E
      </div>
    </div>
  `;
}

/**
 * Fetch sibling platforms from the same station
 */
async function fetchSiblingPlatforms() {
  if (!props.showSiblings) return [];

  const stationId = props.platform?.station_id;
  if (!stationId) return [];

  try {
    const response = await api.get(`/platforms/station/${stationId}`);
    const platforms = response.data || [];

    // Filter to only platforms with coordinates, excluding current
    return platforms.filter(p =>
      p.id !== props.platform.id &&
      p.latitude != null &&
      p.longitude != null
    );
  } catch (err) {
    console.warn('Failed to fetch sibling platforms:', err);
    return [];
  }
}

/**
 * Calculate bounds to fit all platforms
 */
function calculateBounds(platforms) {
  if (!L || platforms.length === 0) return null;

  const coords = platforms
    .filter(p => p.latitude != null && p.longitude != null)
    .map(p => [p.latitude, p.longitude]);

  if (coords.length === 0) return null;
  if (coords.length === 1) return null; // Single point, use default zoom

  return L.latLngBounds(coords);
}

/**
 * Initialize the map
 */
async function initMap() {
  if (!mapContainer.value || !hasCoordinates.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    // Dynamic import of Leaflet
    L = await import('leaflet');

    // Ensure Leaflet CSS is loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Fetch sibling platforms
    siblingPlatforms.value = await fetchSiblingPlatforms();

    const center = [props.platform.latitude, props.platform.longitude];

    // Create map instance
    mapInstance = L.map(mapContainer.value, {
      center,
      zoom: props.zoom,
      zoomControl: true,
      dragging: props.interactive,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: false,
      keyboard: false,
      attributionControl: false
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(mapInstance);

    // Add scale control
    L.control.scale({
      metric: true,
      imperial: false,
      maxWidth: 100,
      position: 'bottomleft'
    }).addTo(mapInstance);

    // Add sibling platform markers first (so they appear behind selected)
    siblingPlatforms.value.forEach(siblingPlatform => {
      const siblingMarker = L.marker(
        [siblingPlatform.latitude, siblingPlatform.longitude],
        { icon: createPlatformMarkerIcon(siblingPlatform, false) }
      ).addTo(mapInstance);

      siblingMarker.bindPopup(createPopupContent(siblingPlatform, false));
    });

    // Add selected platform marker (on top)
    const selectedMarker = L.marker(center, {
      icon: createPlatformMarkerIcon(props.platform, true),
      zIndexOffset: 1000  // Ensure it's on top
    }).addTo(mapInstance);

    selectedMarker.bindPopup(createPopupContent(props.platform, true));

    if (props.showPopup) {
      selectedMarker.openPopup();
    }

    // Fit bounds if we have multiple platforms
    if (siblingPlatforms.value.length > 0) {
      const allPlatforms = [props.platform, ...siblingPlatforms.value];
      const bounds = calculateBounds(allPlatforms);
      if (bounds) {
        mapInstance.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 16  // Don't zoom in too close
        });
      }
    }

    isLoading.value = false;
  } catch (err) {
    console.error('Failed to initialize mini map:', err);
    error.value = 'Failed to load map';
    isLoading.value = false;
  }
}

/**
 * Destroy map instance and cleanup
 */
function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
}

// Initialize on mount
onMounted(async () => {
  await nextTick();
  if (hasCoordinates.value) {
    await initMap();
  } else {
    isLoading.value = false;
  }
});

// Cleanup on unmount
onUnmounted(() => {
  destroyMap();
});

// Watch for platform changes
watch(() => props.platform, async (newPlatform, oldPlatform) => {
  if (newPlatform?.id !== oldPlatform?.id ||
      newPlatform?.latitude !== oldPlatform?.latitude ||
      newPlatform?.longitude !== oldPlatform?.longitude) {
    destroyMap();
    await nextTick();
    if (hasCoordinates.value) {
      await initMap();
    }
  }
}, { deep: true });
</script>

<template>
  <div class="platform-mini-map-wrapper">
    <!-- Map with coordinates -->
    <div
      v-if="hasCoordinates"
      class="platform-mini-map rounded-lg overflow-hidden border border-base-200 relative"
    >
      <!-- Loading overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-base-200/80 flex items-center justify-center z-10"
      >
        <span class="loading loading-spinner loading-sm"></span>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="absolute inset-0 bg-error/10 flex items-center justify-center z-10 text-xs text-error"
      >
        {{ error }}
      </div>

      <!-- Map container -->
      <div
        ref="mapContainer"
        class="w-full"
        :style="{ height: `${height}px` }"
      ></div>

      <!-- Legend (compact) -->
      <div
        v-if="siblingPlatforms.length > 0"
        class="absolute top-2 left-2 bg-white/90 rounded px-2 py-1 text-[10px] z-20 shadow-sm"
      >
        <div class="flex items-center gap-1">
          <span class="inline-block w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-cyan-500"></span>
          <span class="text-gray-600">Current</span>
        </div>
        <div class="flex items-center gap-1 mt-0.5">
          <span class="inline-block w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-gray-400"></span>
          <span class="text-gray-500">{{ siblingPlatforms.length }} other{{ siblingPlatforms.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Attribution overlay (compact) -->
      <div class="absolute bottom-0.5 right-1 text-[8px] text-base-content/30 z-20">
        OSM
      </div>
    </div>

    <!-- No coordinates fallback -->
    <div
      v-else
      class="text-xs text-base-content/40 italic p-2 bg-base-200 rounded-lg text-center"
      :style="{ minHeight: '60px' }"
    >
      No coordinates available
    </div>
  </div>
</template>

<style scoped>
.platform-mini-map-wrapper {
  width: 100%;
}

.platform-mini-map {
  background: #f3f4f6;
}

/* Override Leaflet z-index for compact view */
:deep(.leaflet-control-container) {
  z-index: 10;
}

:deep(.leaflet-pane) {
  z-index: 1;
}

/* Custom marker styling */
:deep(.platform-mini-marker) {
  background: none !important;
  border: none !important;
}

:deep(.platform-mini-marker.selected) {
  z-index: 1000 !important;
}

/* Popup styling */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.375rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

:deep(.leaflet-popup-content) {
  margin: 8px 10px;
}

:deep(.platform-mini-popup) {
  line-height: 1.4;
}

/* Compact zoom controls for mini map */
:deep(.leaflet-control-zoom) {
  border: none !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
  border-radius: 4px !important;
  margin: 8px !important;
}

:deep(.leaflet-control-zoom a) {
  width: 24px !important;
  height: 24px !important;
  line-height: 22px !important;
  font-size: 14px !important;
}

/* Compact scale control */
:deep(.leaflet-control-scale) {
  margin-left: 6px !important;
  margin-bottom: 6px !important;
}

:deep(.leaflet-control-scale-line) {
  font-size: 9px !important;
  padding: 1px 4px !important;
  border-width: 1px !important;
  background: rgba(255,255,255,0.8) !important;
}
</style>
