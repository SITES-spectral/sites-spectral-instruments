<script setup>
/**
 * Station Map Component
 *
 * Interactive map displaying SITES Spectral stations.
 * Uses Leaflet for mapping functionality.
 */
import { ref, watch, onMounted, nextTick } from 'vue';
import { useMap } from '@composables/useMap';

const props = defineProps({
  stations: {
    type: Array,
    default: () => []
  },
  selectedStation: {
    type: String,
    default: null
  },
  height: {
    type: String,
    default: '400px'
  },
  showControls: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['station-click', 'map-ready']);

const {
  mapContainer,
  mapInstance,
  selectedStation: mapSelectedStation,
  isLoading,
  error,
  initMap,
  addStationMarkers,
  highlightStation,
  fitToMarkers,
  invalidateSize
} = useMap({
  center: [62.5, 17.5], // Center on Sweden
  zoom: 5
});

// Watch for station changes
watch(() => props.stations, (newStations) => {
  if (newStations && newStations.length > 0 && mapInstance.value) {
    addStationMarkers(newStations);
  }
}, { deep: true });

// Watch for selected station changes
watch(() => props.selectedStation, (acronym) => {
  if (acronym) {
    highlightStation(acronym);
  }
});

// Watch for map selection changes
watch(mapSelectedStation, (station) => {
  if (station) {
    emit('station-click', station);
  }
});

// Initialize map on mount
onMounted(async () => {
  await nextTick();
  await initMap();

  if (props.stations.length > 0) {
    addStationMarkers(props.stations);
  }

  emit('map-ready', mapInstance.value);
});

// Expose methods for parent components
defineExpose({
  highlightStation,
  fitToMarkers,
  invalidateSize
});
</script>

<template>
  <div class="station-map-wrapper relative">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-base-200/80 flex items-center justify-center z-10 rounded-lg"
    >
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      class="absolute inset-0 bg-error/10 flex items-center justify-center z-10 rounded-lg"
    >
      <div class="alert alert-error max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Map container -->
    <div
      ref="mapContainer"
      class="station-map rounded-lg"
      :style="{ height: height }"
    ></div>

    <!-- Map controls overlay -->
    <div v-if="showControls && !isLoading" class="absolute top-2 right-2 z-20 flex flex-col gap-2">
      <button
        class="btn btn-sm btn-circle bg-base-100 shadow"
        @click="fitToMarkers"
        title="Fit all stations"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>

    <!-- Legend -->
    <div v-if="stations.length > 0 && !isLoading" class="absolute bottom-2 left-2 z-20 bg-base-100/90 p-2 rounded-lg shadow text-xs">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 bg-primary rounded-full"></span>
        <span>{{ stations.length }} stations</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.station-map-wrapper {
  width: 100%;
}

.station-map {
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
}

:deep(.station-popup h3) {
  margin: 0 0 0.25rem 0;
}

:deep(.station-popup .badge) {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

:deep(.station-popup .badge-success) {
  background-color: oklch(var(--su));
  color: oklch(var(--suc));
}

:deep(.station-popup .badge-warning) {
  background-color: oklch(var(--wa));
  color: oklch(var(--wac));
}

/* Platform marker styling */
:deep(.platform-marker) {
  background: none;
  border: none;
}
</style>
