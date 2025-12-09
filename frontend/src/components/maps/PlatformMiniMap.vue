<script setup>
/**
 * Platform Mini Map Component
 *
 * Compact Leaflet map focused on a single platform's location.
 * Designed to be embedded in platform cards.
 *
 * SOLID Compliance:
 * - Single Responsibility: Only displays platform location
 * - Dependency Inversion: Takes platform object, doesn't fetch data
 * - Interface Segregation: Minimal props, focused interface
 *
 * @module components/maps/PlatformMiniMap
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

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
  }
});

// Map state
const mapContainer = ref(null);
const isLoading = ref(true);
const error = ref(null);
let mapInstance = null;
let L = null;

// Check if platform has valid coordinates
const hasCoordinates = computed(() => {
  return props.platform?.latitude != null && props.platform?.longitude != null;
});

// Mount type colors (matching existing convention)
const MOUNT_TYPE_COLORS = {
  PL: '#f97316',  // Orange - tower/mast
  BL: '#14b8a6',  // Teal - building
  GL: '#22c55e',  // Green - ground level
  UAV: '#eab308', // Yellow - UAV
  SAT: '#8b5cf6'  // Purple - satellite
};

/**
 * Get marker color based on mount type
 */
function getMarkerColor(platform) {
  const mountCode = platform.mount_type_code?.match(/^([A-Z]+)/)?.[1] || 'PL';
  return MOUNT_TYPE_COLORS[mountCode] || MOUNT_TYPE_COLORS.PL;
}

/**
 * Create platform marker icon (triangle pointing up)
 */
function createPlatformMarkerIcon(platform) {
  if (!L) return null;

  const color = getMarkerColor(platform);

  return L.divIcon({
    className: 'platform-mini-marker',
    html: `
      <div style="
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 14px solid ${color};
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      "></div>
    `,
    iconSize: [16, 14],
    iconAnchor: [8, 14],
    popupAnchor: [0, -14]
  });
}

/**
 * Create popup content for marker
 */
function createPopupContent(platform) {
  const name = platform.display_name || platform.normalized_name || 'Platform';
  const mountCode = platform.mount_type_code || platform.location_code || '';

  return `
    <div class="platform-mini-popup text-sm">
      <div class="font-semibold">${name}</div>
      ${mountCode ? `<div class="text-xs text-gray-500">${mountCode}</div>` : ''}
      <div class="text-xs text-gray-400 mt-1">
        ${Number(platform.latitude).toFixed(5)}°N<br>
        ${Number(platform.longitude).toFixed(5)}°E
      </div>
    </div>
  `;
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
      // Wait a moment for CSS to load
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const center = [props.platform.latitude, props.platform.longitude];

    // Create map instance with compact settings
    // Always enable zoom control for better UX, but keep dragging optional
    mapInstance = L.map(mapContainer.value, {
      center,
      zoom: props.zoom,
      zoomControl: true,  // Always show zoom controls
      dragging: props.interactive,
      scrollWheelZoom: false,
      doubleClickZoom: true,  // Allow double-click zoom
      touchZoom: true,  // Allow pinch zoom on mobile
      boxZoom: false,
      keyboard: false,
      attributionControl: false
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(mapInstance);

    // Add scale control (metric only for compact display)
    L.control.scale({
      metric: true,
      imperial: false,
      maxWidth: 100,
      position: 'bottomleft'
    }).addTo(mapInstance);

    // Add platform marker
    const marker = L.marker(center, {
      icon: createPlatformMarkerIcon(props.platform)
    }).addTo(mapInstance);

    // Bind popup
    marker.bindPopup(createPopupContent(props.platform));

    // Open popup if requested
    if (props.showPopup) {
      marker.openPopup();
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
  if (newPlatform?.latitude !== oldPlatform?.latitude ||
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
