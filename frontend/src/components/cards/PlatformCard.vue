<script setup>
/**
 * Platform Card Component
 *
 * Type-aware platform card that renders type-specific details.
 * Uses Strategy pattern - delegates to type-specific components.
 *
 * @module components/cards/PlatformCard
 */
import { computed } from 'vue';
import { getStatus } from '@composables/useTypes';
import { getPlatformTypeStrategy } from '@composables/useTypeRegistry';
import FixedPlatformDetails from './platform/FixedPlatformDetails.vue';
import UAVPlatformDetails from './platform/UAVPlatformDetails.vue';
import SatellitePlatformDetails from './platform/SatellitePlatformDetails.vue';

const props = defineProps({
  platform: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  showStation: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete']);

// Platform type strategy
const typeStrategy = computed(() => {
  return getPlatformTypeStrategy(props.platform.platform_type) || getPlatformTypeStrategy('fixed');
});

// Status configuration
const statusConfig = computed(() => getStatus(props.platform.status));

// Instrument count
const instrumentCount = computed(() => {
  return props.platform.instrument_count || props.platform.instruments?.length || 0;
});

// Get the appropriate detail component based on platform type
const detailComponent = computed(() => {
  switch (props.platform.platform_type) {
    case 'uav':
      return UAVPlatformDetails;
    case 'satellite':
      return SatellitePlatformDetails;
    case 'fixed':
    default:
      return FixedPlatformDetails;
  }
});

// Badge class based on type
const typeBadgeClass = computed(() => {
  const classes = {
    fixed: 'badge-info',
    uav: 'badge-warning',
    satellite: 'badge-accent'
  };
  return classes[props.platform.platform_type] || 'badge-info';
});

// Background class based on type
const typeBgClass = computed(() => {
  const classes = {
    fixed: 'bg-info/10',
    uav: 'bg-warning/10',
    satellite: 'bg-accent/10'
  };
  return classes[props.platform.platform_type] || 'bg-info/10';
});

// Text class based on type
const typeTextClass = computed(() => {
  const classes = {
    fixed: 'text-info',
    uav: 'text-warning',
    satellite: 'text-accent'
  };
  return classes[props.platform.platform_type] || 'text-info';
});

// Get SVG path for platform type icon
const typeIconPath = computed(() => {
  const paths = {
    fixed: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    uav: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
    satellite: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  };
  return paths[props.platform.platform_type] || paths.fixed;
});
</script>

<template>
  <div class="card bg-base-100 shadow border border-base-200 hover:border-primary/20 transition-colors">
    <div class="card-body p-4">
      <!-- Header Row -->
      <div class="flex items-start justify-between gap-2">
        <!-- Left: Icon + Names -->
        <div class="flex items-start gap-3 min-w-0 flex-1">
          <!-- Platform type icon -->
          <div
            :class="['p-2.5 rounded-lg flex-shrink-0', typeBgClass]"
            :title="typeStrategy.name"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              :class="typeTextClass"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="typeIconPath"
              />
            </svg>
          </div>

          <!-- Names and identifier -->
          <div class="min-w-0 flex-1">
            <h4 class="font-semibold truncate">
              {{ platform.display_name }}
            </h4>
            <code class="text-xs text-base-content/60 font-mono">
              {{ platform.normalized_name }}
            </code>
          </div>
        </div>

        <!-- Right: Status + Actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <span :class="['badge badge-xs sm:badge-sm whitespace-nowrap', statusConfig.badgeClass]">
            {{ platform.status }}
          </span>

          <!-- Edit dropdown -->
          <div v-if="canEdit" class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40 border border-base-200">
              <li><a @click="emit('edit', platform)">Edit</a></li>
              <li><a class="text-error" @click="emit('delete', platform)">Delete</a></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Platform Type Badge + Instrument Count -->
      <div class="flex items-center justify-between mt-3 gap-2">
        <span :class="['badge badge-xs sm:badge-sm whitespace-nowrap', typeBadgeClass]">
          {{ typeStrategy.name }}
        </span>
        <span class="text-xs sm:text-sm whitespace-nowrap">
          <span class="font-semibold text-secondary">{{ instrumentCount }}</span>
          <span class="text-base-content/60 ml-1 hidden xs:inline">instrument{{ instrumentCount !== 1 ? 's' : '' }}</span>
        </span>
      </div>

      <!-- Type-Specific Details -->
      <div class="mt-3 pt-3 border-t border-base-200">
        <component
          :is="detailComponent"
          :platform="platform"
        />
      </div>

      <!-- Description -->
      <p
        v-if="platform.description"
        class="text-sm text-base-content/60 mt-3 line-clamp-2"
      >
        {{ platform.description }}
      </p>

      <!-- Station link (when showing across stations) -->
      <div v-if="showStation && platform.station_acronym" class="mt-2">
        <router-link
          :to="`/stations/${platform.station_acronym}`"
          class="text-xs text-primary hover:underline"
        >
          {{ platform.station_acronym }}
        </router-link>
      </div>

      <!-- View Details -->
      <div class="card-actions justify-end mt-3 pt-2 border-t border-base-200">
        <router-link
          :to="`/platforms/${platform.id}`"
          class="btn btn-ghost btn-xs text-primary"
        >
          View Details
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>
