<script setup>
/**
 * Platform Map Component
 *
 * Interactive map displaying platforms for a specific station.
 * Shows fixed, UAV, and satellite platform locations.
 */
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import { useMap } from '@composables/useMap';

const props = defineProps({
  platforms: {
    type: Array,
    default: () => []
  },
  stationCenter: {
    type: Object,
    default: null // { latitude, longitude }
  },
  selectedPlatform: {
    type: Number,
    default: null
  },
  height: {
    type: String,
    default: '300px'
  },
  showLegend: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['platform-click', 'map-ready']);

const {
  mapContainer,
  mapInstance,
  isLoading,
  error,
  initMap,
  addPlatformMarkers,
  panTo,
  fitToMarkers,
  invalidateSize,
  clearMarkers
} = useMap({
  center: props.stationCenter
    ? [props.stationCenter.latitude, props.stationCenter.longitude]
    : [62.5, 17.5],
  zoom: 12
});

// Platform type colors
const platformColors = {
  fixed: '#10b981',    // Green
  uav: '#3b82f6',      // Blue
  satellite: '#8b5cf6' // Purple
};

// Platform type icons
const platformIcons = {
  fixed: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  uav: 'M12 2v4M12 18v4M2 12h4M18 12h4M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83',
  satellite: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z'
};

// Count platforms by type
const platformCounts = computed(() => {
  const counts = { fixed: 0, uav: 0, satellite: 0 };
  props.platforms.forEach(p => {
    const type = p.platform_type || 'fixed';
    if (counts[type] !== undefined) {
      counts[type]++;
    }
  });
  return counts;
});

// Watch for platform changes
watch(() => props.platforms, (newPlatforms) => {
  if (newPlatforms && mapInstance.value) {
    updateMarkers();
  }
}, { deep: true });

// Watch for selected platform changes
watch(() => props.selectedPlatform, (platformId) => {
  if (platformId && props.platforms.length > 0) {
    const platform = props.platforms.find(p => p.id === platformId);
    if (platform?.latitude && platform?.longitude) {
      panTo(platform.latitude, platform.longitude, 15);
    }
  }
});

function updateMarkers() {
  clearMarkers();

  // Group platforms by type and add with appropriate colors
  ['fixed', 'uav', 'satellite'].forEach(type => {
    const typePlatforms = props.platforms.filter(p => p.platform_type === type);
    if (typePlatforms.length > 0) {
      addPlatformMarkers(typePlatforms, {
        clearExisting: false,
        color: platformColors[type]
      });
    }
  });

  // Fit to markers if we have any with coordinates
  const hasCoords = props.platforms.some(p => p.latitude && p.longitude);
  if (hasCoords) {
    fitToMarkers();
  }
}

// Initialize map on mount
onMounted(async () => {
  await nextTick();
  await initMap();

  if (props.platforms.length > 0) {
    updateMarkers();
  }

  emit('map-ready', mapInstance.value);
});

// Expose methods for parent components
defineExpose({
  fitToMarkers,
  invalidateSize,
  panTo
});
</script>

<template>
  <div class="platform-map-wrapper relative">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-base-200/80 flex items-center justify-center z-10 rounded-lg"
    >
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      class="absolute inset-0 bg-error/10 flex items-center justify-center z-10 rounded-lg"
    >
      <div class="text-error text-sm text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {{ error }}
      </div>
    </div>

    <!-- No coordinates message -->
    <div
      v-if="!isLoading && !error && platforms.length > 0 && !platforms.some(p => p.latitude && p.longitude)"
      class="absolute inset-0 bg-base-200/80 flex items-center justify-center z-10 rounded-lg"
    >
      <div class="text-base-content/60 text-sm text-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        No platform coordinates available
      </div>
    </div>

    <!-- Map container -->
    <div
      ref="mapContainer"
      class="platform-map rounded-lg"
      :style="{ height: height }"
    ></div>

    <!-- Legend -->
    <div
      v-if="showLegend && !isLoading && platforms.length > 0"
      class="absolute bottom-2 left-2 z-20 bg-base-100/90 p-2 rounded-lg shadow"
    >
      <div class="text-xs font-semibold mb-1">Platform Types</div>
      <div class="flex flex-col gap-1">
        <div v-if="platformCounts.fixed > 0" class="flex items-center gap-2 text-xs">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: platformColors.fixed }"></span>
          <span>Fixed ({{ platformCounts.fixed }})</span>
        </div>
        <div v-if="platformCounts.uav > 0" class="flex items-center gap-2 text-xs">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: platformColors.uav }"></span>
          <span>UAV ({{ platformCounts.uav }})</span>
        </div>
        <div v-if="platformCounts.satellite > 0" class="flex items-center gap-2 text-xs">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: platformColors.satellite }"></span>
          <span>Satellite ({{ platformCounts.satellite }})</span>
        </div>
      </div>
    </div>

    <!-- Zoom controls -->
    <div class="absolute top-2 right-2 z-20 flex flex-col gap-1">
      <button
        class="btn btn-xs btn-circle bg-base-100 shadow"
        @click="fitToMarkers"
        title="Fit all platforms"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.platform-map-wrapper {
  width: 100%;
}

.platform-map {
  width: 100%;
  z-index: 0;
}

/* Override Leaflet z-index for controls */
:deep(.leaflet-control-container) {
  z-index: 10;
}

:deep(.leaflet-pane) {
  z-index: 1;
}

:deep(.leaflet-top),
:deep(.leaflet-bottom) {
  z-index: 10;
}

/* Custom popup styling */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.5rem;
  padding: 0.5rem;
}

:deep(.leaflet-popup-content) {
  margin: 0.5rem;
}

:deep(.platform-popup h3) {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

:deep(.platform-popup p) {
  margin: 0.125rem 0;
}

/* Platform marker styling */
:deep(.platform-marker) {
  background: none;
  border: none;
}

:deep(.platform-marker svg) {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}
</style>
