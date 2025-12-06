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
const iconPaths = {
  camera: [
    'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
    'M15 13a3 3 0 11-6 0 3 3 0 016 0z'
  ],
  'layer-group': [
    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  ],
  sun: [
    'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
  ],
  leaf: [
    'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
  ],
  microscope: [
    'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
  ],
  rainbow: [
    'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
  ],
  'temperature-high': [
    'M9 19c-4.3 1.4-6-2.7-6-7 0-4.3 1.7-8.4 6-7m0 14V5m0 14a5 5 0 005-5 5 5 0 00-5-5'
  ],
  'wave-square': [
    'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
  ],
  'satellite-dish': [
    'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0'
  ],
  cube: [
    'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
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
      <div class="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
        <!-- Instrument type with code -->
        <span class="font-medium" :class="typeTextClass">
          {{ typeConfig?.name || instrument.instrument_type }}
          <span v-if="typeConfig?.code" class="text-base-content/50 ml-1">
            ({{ typeConfig.code }})
          </span>
        </span>

        <!-- Measurement status with dot indicator -->
        <span :class="[measurementConfig.textClass, 'flex items-center gap-1']">
          <span :class="['w-1.5 h-1.5 rounded-full', measurementConfig.dotClass]"></span>
          {{ instrument.measurement_status || 'Unknown' }}
        </span>

        <!-- ROI count -->
        <span v-if="roiCount > 0" class="text-accent">
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
        <button
          @click="emit('view', instrument)"
          class="btn btn-ghost btn-xs"
        >
          View
        </button>
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
        <button
          @click="emit('view', instrument)"
          class="btn btn-ghost btn-xs text-primary"
        >
          View Details
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
