<script setup>
/**
 * Station Card Component
 *
 * Displays a station summary with key metrics.
 */
import { computed } from 'vue';

const props = defineProps({
  station: {
    type: Object,
    required: true
  }
});

// Status badge class
const statusClass = computed(() => {
  const status = props.station.status;
  return {
    'badge-success': status === 'Active',
    'badge-warning': status === 'Inactive',
    'badge-error': status === 'Decommissioned'
  };
});

// Format coordinates
const coordinates = computed(() => {
  const { latitude, longitude } = props.station;
  if (latitude && longitude) {
    return `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
  }
  return 'Not set';
});
</script>

<template>
  <router-link
    :to="`/stations/${station.acronym}`"
    class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-200 cursor-pointer"
  >
    <div class="card-body">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h3 class="card-title text-lg">
            {{ station.display_name }}
          </h3>
          <span class="badge badge-outline badge-sm mt-1">
            {{ station.acronym }}
          </span>
        </div>
        <span :class="['badge', statusClass]">
          {{ station.status }}
        </span>
      </div>

      <!-- Description -->
      <p
        v-if="station.description"
        class="text-sm text-base-content/60 line-clamp-2 mt-2"
      >
        {{ station.description }}
      </p>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-base-200">
        <div class="text-center">
          <div class="text-2xl font-bold text-primary">
            {{ station.platform_count || 0 }}
          </div>
          <div class="text-xs text-base-content/60">Platforms</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-secondary">
            {{ station.instrument_count || 0 }}
          </div>
          <div class="text-xs text-base-content/60">Instruments</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-accent">
            {{ station.roi_count || 0 }}
          </div>
          <div class="text-xs text-base-content/60">ROIs</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between mt-4 pt-2 text-xs text-base-content/50">
        <span>{{ coordinates }}</span>
        <span class="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          View details
        </span>
      </div>
    </div>
  </router-link>
</template>
