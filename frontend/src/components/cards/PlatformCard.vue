<script setup>
/**
 * Platform Card Component
 *
 * Displays platform summary with type indicator, mount type,
 * ecosystem, and instrument count.
 *
 * @module components/cards/PlatformCard
 */
import { computed } from 'vue';
import { getPlatformType, getMountType, getStatus } from '@composables/useTypes';

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

// Platform type configuration
const platformTypeConfig = computed(() => getPlatformType(props.platform.platform_type));

// Mount type configuration
const mountTypeConfig = computed(() => {
  const mtc = props.platform.mount_type_code || props.platform.location_code;
  return getMountType(mtc);
});

// Status configuration
const statusConfig = computed(() => getStatus(props.platform.status));

// Instrument count
const instrumentCount = computed(() => {
  return props.platform.instrument_count || props.platform.instruments?.length || 0;
});

// Format coordinates
const coordinates = computed(() => {
  const { latitude, longitude } = props.platform;
  if (latitude && longitude) {
    return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
  }
  return null;
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
            :class="['p-2.5 rounded-lg flex-shrink-0', platformTypeConfig.bgClass]"
            :title="platformTypeConfig.name"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              :class="platformTypeConfig.textClass"
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
          <span :class="['badge badge-sm', statusConfig.badgeClass]">
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

      <!-- Info Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
        <!-- Platform Type -->
        <div>
          <span class="text-xs text-base-content/50 block">Type</span>
          <span :class="['badge badge-sm mt-1', platformTypeConfig.badgeClass]">
            {{ platformTypeConfig.name }}
          </span>
        </div>

        <!-- Mount Type -->
        <div v-if="mountTypeConfig">
          <span class="text-xs text-base-content/50 block">Mount</span>
          <div
            class="tooltip tooltip-right"
            :data-tip="mountTypeConfig.description"
          >
            <span class="badge badge-sm badge-outline mt-1 font-mono cursor-help">
              {{ platform.mount_type_code || platform.location_code }}
            </span>
          </div>
        </div>

        <!-- Ecosystem (for fixed platforms) -->
        <div v-if="platform.ecosystem_code">
          <span class="text-xs text-base-content/50 block">Ecosystem</span>
          <span class="font-medium">{{ platform.ecosystem_code }}</span>
        </div>

        <!-- Instruments -->
        <div>
          <span class="text-xs text-base-content/50 block">Instruments</span>
          <span class="font-semibold text-secondary">{{ instrumentCount }}</span>
        </div>
      </div>

      <!-- Optional: Height & Coordinates -->
      <div
        v-if="platform.platform_height_m || coordinates"
        class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-base-content/50"
      >
        <span v-if="platform.platform_height_m">
          Height: {{ platform.platform_height_m }}m
        </span>
        <span v-if="coordinates">
          {{ coordinates }}
        </span>
      </div>

      <!-- Description -->
      <p
        v-if="platform.description"
        class="text-sm text-base-content/60 mt-2 line-clamp-2"
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
      <div class="card-actions justify-end mt-2 pt-2 border-t border-base-200">
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
