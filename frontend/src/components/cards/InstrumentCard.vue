<script setup>
/**
 * Instrument Card Component
 *
 * Type-aware instrument card that renders type-specific details.
 * Uses Registry pattern - fields defined by InstrumentTypeRegistry.
 *
 * @module components/cards/InstrumentCard
 */
import { computed } from 'vue';
import { getStatus, getMeasurementStatus } from '@composables/useTypes';
import { getInstrumentTypeConfig } from '@composables/useTypeRegistry';
import InstrumentTypeDetails from './instrument/InstrumentTypeDetails.vue';

const props = defineProps({
  instrument: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  showPlatform: {
    type: Boolean,
    default: false
  },
  showAllSpecs: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete', 'view']);

// Get type configuration from registry
const typeConfig = computed(() => {
  return getInstrumentTypeConfig(props.instrument.instrument_type);
});

// Status configuration
const statusConfig = computed(() => getStatus(props.instrument.status));

// Measurement status configuration
const measurementConfig = computed(() => getMeasurementStatus(props.instrument.measurement_status));

// ROI count
const roiCount = computed(() => {
  return props.instrument.roi_count || props.instrument.rois?.length || 0;
});

// Type color for styling
const typeColor = computed(() => {
  return typeConfig.value?.color || '#6b7280';
});

// Type background class
const typeBgClass = computed(() => {
  if (!typeConfig.value) return 'bg-gray-500/10';

  // Map type keys to Tailwind classes
  const bgClasses = {
    phenocam: 'bg-blue-500/10',
    multispectral: 'bg-purple-500/10',
    par_sensor: 'bg-amber-500/10',
    ndvi_sensor: 'bg-green-500/10',
    pri_sensor: 'bg-cyan-500/10',
    hyperspectral: 'bg-pink-500/10',
    thermal: 'bg-red-500/10',
    lidar: 'bg-teal-500/10',
    radar: 'bg-indigo-500/10'
  };

  return bgClasses[typeConfig.value.key] || 'bg-gray-500/10';
});

// Type text class
const typeTextClass = computed(() => {
  if (!typeConfig.value) return 'text-gray-500';

  const textClasses = {
    phenocam: 'text-blue-500',
    multispectral: 'text-purple-500',
    par_sensor: 'text-amber-500',
    ndvi_sensor: 'text-green-500',
    pri_sensor: 'text-cyan-500',
    hyperspectral: 'text-pink-500',
    thermal: 'text-red-500',
    lidar: 'text-teal-500',
    radar: 'text-indigo-500'
  };

  return textClasses[typeConfig.value.key] || 'text-gray-500';
});

// SVG paths for different instrument types
// Using Lucide-style paths for consistency
const iconPaths = {
  // Camera icon - phenocam
  camera: [
    'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z',
    'M12 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
  ],
  // Layers icon - multispectral (stacked layers, NOT a book)
  'layer-group': [
    'M12 2L2 7l10 5 10-5-10-5z',
    'M2 17l10 5 10-5',
    'M2 12l10 5 10-5'
  ],
  // Sun icon - PAR sensor
  sun: [
    'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707',
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'
  ],
  // Leaf icon - NDVI sensor
  leaf: [
    'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z',
    'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'
  ],
  // Microscope icon - PRI sensor
  microscope: [
    'M6 18h8',
    'M3 22h18',
    'M14 22a7 7 0 1 0 0-14h-1',
    'M9 14h2',
    'M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2z',
    'M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3'
  ],
  // Rainbow icon - hyperspectral
  rainbow: [
    'M22 17a10 10 0 0 0-20 0',
    'M6 17a6 6 0 0 1 12 0',
    'M10 17a2 2 0 0 1 4 0'
  ],
  // Thermometer icon - thermal
  'temperature-high': [
    'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z'
  ],
  // Waves icon - LiDAR
  'wave-square': [
    'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    'M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    'M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1'
  ],
  // Radio/Radar icon - satellite-dish/multispectral alternate
  'satellite-dish': [
    'M4.9 19.1C1 15.2 1 8.8 4.9 4.9',
    'M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5',
    'M11 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0z',
    'M19.1 4.9C23 8.8 23 15.1 19.1 19',
    'M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5'
  ],
  // Cube icon - default/other
  cube: [
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'M3.27 6.96L12 12.01l8.73-5.05',
    'M12 22.08V12'
  ]
};

// Get SVG paths for current instrument type
const currentIconPaths = computed(() => {
  const icon = typeConfig.value?.icon || 'cube';
  return iconPaths[icon] || iconPaths.cube;
});
</script>

<template>
  <div
    class="card bg-base-100 shadow-sm border border-base-200 hover:border-primary/30 transition-colors"
    :class="{ 'card-compact': compact }"
  >
    <div class="card-body" :class="compact ? 'p-2' : 'p-3'">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <!-- Type icon with color -->
          <div
            :class="['flex-shrink-0 rounded flex items-center justify-center', typeBgClass]"
            :style="{ width: compact ? '28px' : '32px', height: compact ? '28px' : '32px' }"
            :title="typeConfig?.name || instrument.instrument_type"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              :class="[typeTextClass]"
              :style="{ width: compact ? '14px' : '16px', height: compact ? '14px' : '16px' }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                v-for="(path, idx) in currentIconPaths"
                :key="idx"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="path"
              />
            </svg>
          </div>

          <!-- Names -->
          <div class="min-w-0 flex-1">
            <h5 class="font-medium truncate" :class="compact ? 'text-xs' : 'text-sm'">
              {{ instrument.display_name }}
            </h5>
            <code class="text-xs text-base-content/50 font-mono truncate block">
              {{ instrument.normalized_name }}
            </code>
          </div>
        </div>

        <!-- Status badge -->
        <span :class="['badge', compact ? 'badge-xs' : 'badge-sm', statusConfig.badgeClass]">
          {{ instrument.status }}
        </span>
      </div>

      <!-- Type + Measurement Status Row -->
      <div class="flex items-center flex-wrap gap-2 mt-2 text-xs">
        <!-- Instrument type badge - responsive sizing -->
        <span :class="['badge badge-xs sm:badge-sm whitespace-nowrap', typeConfig?.badgeClass || 'badge-ghost']">
          {{ typeConfig?.name || instrument.instrument_type }}
          <span v-if="typeConfig?.code" class="opacity-70 ml-1 hidden sm:inline">
            ({{ typeConfig.code }})
          </span>
        </span>

        <!-- Measurement status with dot indicator -->
        <span :class="[measurementConfig.textClass, 'flex items-center gap-1 whitespace-nowrap']">
          <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', measurementConfig.dotClass]"></span>
          <span class="truncate">{{ instrument.measurement_status || 'Unknown' }}</span>
        </span>

        <!-- ROI count -->
        <span v-if="roiCount > 0" class="text-accent whitespace-nowrap">
          {{ roiCount }} ROI{{ roiCount !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Type-Specific Specifications (only in non-compact mode) -->
      <div v-if="!compact" class="mt-3 pt-2 border-t border-base-200">
        <InstrumentTypeDetails
          :instrument="instrument"
          :show-all-fields="showAllSpecs"
        />
      </div>

      <!-- Platform link (when showing across platforms) -->
      <div v-if="showPlatform && instrument.platform_name" class="mt-2">
        <router-link
          :to="`/platforms/${instrument.platform_id}`"
          class="text-xs text-primary hover:underline"
        >
          {{ instrument.platform_name }}
        </router-link>
      </div>

      <!-- Actions -->
      <div v-if="canEdit" class="flex justify-end gap-1 mt-2 pt-2 border-t border-base-200">
        <router-link
          :to="`/instruments/${instrument.id}`"
          class="btn btn-ghost btn-xs"
        >
          View
        </router-link>
        <button
          @click="emit('edit', instrument)"
          class="btn btn-ghost btn-xs text-primary"
        >
          Edit
        </button>
        <button
          @click="emit('delete', instrument)"
          class="btn btn-ghost btn-xs text-error"
        >
          Delete
        </button>
      </div>

      <!-- View only action for non-editors (and non-compact) -->
      <div v-else-if="!compact" class="flex justify-end mt-2 pt-2 border-t border-base-200">
        <router-link
          :to="`/instruments/${instrument.id}`"
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
