<script setup>
/**
 * Instrument Card Component
 *
 * Displays instrument summary.
 */
import { computed } from 'vue';

const props = defineProps({
  instrument: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete', 'view']);

// Instrument type styling
const typeStyles = computed(() => {
  const type = props.instrument.instrument_type?.toLowerCase() || '';

  if (type.includes('phenocam') || type.includes('camera')) {
    return { color: 'text-blue-500', bg: 'bg-blue-50', icon: 'camera' };
  }
  if (type.includes('multispectral')) {
    return { color: 'text-purple-500', bg: 'bg-purple-50', icon: 'layer-group' };
  }
  if (type.includes('par')) {
    return { color: 'text-yellow-500', bg: 'bg-yellow-50', icon: 'sun' };
  }
  if (type.includes('ndvi')) {
    return { color: 'text-green-500', bg: 'bg-green-50', icon: 'leaf' };
  }
  if (type.includes('pri')) {
    return { color: 'text-cyan-500', bg: 'bg-cyan-50', icon: 'microscope' };
  }
  if (type.includes('hyperspectral')) {
    return { color: 'text-pink-500', bg: 'bg-pink-50', icon: 'rainbow' };
  }
  if (type.includes('thermal')) {
    return { color: 'text-red-500', bg: 'bg-red-50', icon: 'fire' };
  }
  if (type.includes('lidar')) {
    return { color: 'text-teal-500', bg: 'bg-teal-50', icon: 'wave-square' };
  }
  if (type.includes('radar') || type.includes('sar')) {
    return { color: 'text-indigo-500', bg: 'bg-indigo-50', icon: 'satellite-dish' };
  }

  return { color: 'text-gray-500', bg: 'bg-gray-50', icon: 'cube' };
});

// Status styling
const statusClass = computed(() => {
  const status = props.instrument.status;
  return {
    'badge-success': status === 'Active',
    'badge-warning': status === 'Inactive',
    'badge-info': status === 'Maintenance',
    'badge-error': status === 'Decommissioned'
  };
});

// Measurement status styling
const measurementClass = computed(() => {
  const status = props.instrument.measurement_status;
  return {
    'text-success': status === 'Operational',
    'text-warning': status === 'Degraded',
    'text-error': status === 'Failed',
    'text-base-content/50': status === 'Unknown'
  };
});
</script>

<template>
  <div class="card bg-base-100 shadow-sm border border-base-200 hover:border-primary/30 transition-colors">
    <div class="card-body p-3">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <!-- Type icon -->
          <div :class="['w-8 h-8 rounded flex items-center justify-center', typeStyles.bg]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              :class="typeStyles.color"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <div>
            <h5 class="font-medium text-sm">{{ instrument.display_name }}</h5>
            <code class="text-xs text-base-content/50">
              {{ instrument.normalized_name }}
            </code>
          </div>
        </div>

        <span :class="['badge badge-xs', statusClass]">
          {{ instrument.status }}
        </span>
      </div>

      <!-- Metadata -->
      <div class="flex items-center gap-4 mt-2 text-xs">
        <span class="text-base-content/60">
          {{ instrument.instrument_type }}
        </span>
        <span :class="measurementClass" class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
          {{ instrument.measurement_status || 'Unknown' }}
        </span>
      </div>

      <!-- Actions -->
      <div v-if="canEdit" class="flex justify-end gap-1 mt-2">
        <button
          @click="emit('edit', instrument)"
          class="btn btn-ghost btn-xs"
        >
          Edit
        </button>
        <button
          @click="emit('view', instrument)"
          class="btn btn-ghost btn-xs"
        >
          View
        </button>
      </div>
    </div>
  </div>
</template>
