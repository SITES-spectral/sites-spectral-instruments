<script setup>
/**
 * Station Card Component
 *
 * Displays a station summary with key metrics and status indicators.
 * Used in dashboard view and station listings.
 *
 * @module components/cards/StationCard
 */
import { computed } from 'vue';
import { getStatus } from '@composables/useTypes';

const props = defineProps({
  station: {
    type: Object,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  }
});

// Status configuration
const statusConfig = computed(() => getStatus(props.station.status));

// Format coordinates
const coordinates = computed(() => {
  const { latitude, longitude } = props.station;
  if (latitude && longitude) {
    const lat = Number(latitude).toFixed(4);
    const lon = Number(longitude).toFixed(4);
    return `${lat}°N, ${lon}°E`;
  }
  return null;
});

// Platform breakdown by type
const platformBreakdown = computed(() => {
  const breakdown = [];
  if (props.station.fixed_count) {
    breakdown.push({ type: 'Fixed', count: props.station.fixed_count, color: 'text-info' });
  }
  if (props.station.uav_count) {
    breakdown.push({ type: 'UAV', count: props.station.uav_count, color: 'text-warning' });
  }
  if (props.station.satellite_count) {
    breakdown.push({ type: 'Satellite', count: props.station.satellite_count, color: 'text-accent' });
  }
  return breakdown;
});
</script>

<template>
  <router-link
    :to="`/stations/${station.acronym}`"
    class="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border border-base-200 hover:border-primary/30"
  >
    <div class="card-body" :class="compact ? 'p-4' : 'p-5'">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="card-title text-lg truncate">
              {{ station.display_name }}
            </h3>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="badge badge-outline badge-sm font-mono">
              {{ station.acronym }}
            </span>
            <span
              v-if="coordinates"
              class="text-xs text-base-content/50 hidden sm:inline"
            >
              {{ coordinates }}
            </span>
          </div>
        </div>

        <!-- Status badge -->
        <div class="flex-shrink-0">
          <span :class="['badge badge-sm', statusConfig.badgeClass]">
            {{ station.status }}
          </span>
        </div>
      </div>

      <!-- Description -->
      <p
        v-if="station.description && !compact"
        class="text-sm text-base-content/60 line-clamp-2 mt-2"
      >
        {{ station.description }}
      </p>

      <!-- Stats Grid -->
      <div
        class="grid gap-2 mt-4 pt-4 border-t border-base-200"
        :class="compact ? 'grid-cols-2' : 'grid-cols-3'"
      >
        <!-- Platforms -->
        <div class="text-center">
          <div class="text-2xl font-bold text-primary">
            {{ station.platform_count || 0 }}
          </div>
          <div class="text-xs text-base-content/60">Platforms</div>
          <!-- Platform type breakdown -->
          <div v-if="platformBreakdown.length > 0" class="flex justify-center gap-1 mt-1">
            <span
              v-for="item in platformBreakdown"
              :key="item.type"
              :class="['text-xs', item.color]"
              :title="item.type"
            >
              {{ item.count }}
            </span>
          </div>
        </div>

        <!-- Instruments -->
        <div class="text-center">
          <div class="text-2xl font-bold text-secondary">
            {{ station.instrument_count || 0 }}
          </div>
          <div class="text-xs text-base-content/60">Instruments</div>
        </div>

        <!-- ROIs (hide in compact mode) -->
        <div v-if="!compact" class="text-center">
          <div class="text-2xl font-bold text-accent">
            {{ station.roi_count || 0 }}
          </div>
          <div class="text-xs text-base-content/60">ROIs</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between mt-3 pt-2 text-xs text-base-content/50">
        <span v-if="station.updated_at" class="truncate">
          Updated {{ new Date(station.updated_at).toLocaleDateString() }}
        </span>
        <span v-else></span>
        <span class="flex items-center gap-1 text-primary flex-shrink-0">
          View details
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  </router-link>
</template>
