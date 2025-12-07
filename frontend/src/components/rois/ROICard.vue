<script setup>
/**
 * ROI Card Component
 *
 * Displays a single ROI with color preview, name, and actions.
 * v10.0.0-alpha.17: Added legacy ROI badge and styling
 *
 * @component
 */
import { computed } from 'vue';

const props = defineProps({
  /**
   * ROI object
   */
  roi: {
    type: Object,
    required: true
  },

  /**
   * Whether this ROI is selected
   */
  selected: {
    type: Boolean,
    default: false
  },

  /**
   * Whether to show edit/delete actions
   */
  canEdit: {
    type: Boolean,
    default: false
  },

  /**
   * Compact mode (smaller card)
   */
  compact: {
    type: Boolean,
    default: false
  },

  /**
   * Whether this is a legacy ROI (v10.0.0-alpha.17)
   */
  isLegacy: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'edit', 'delete']);

// Computed color style
const colorStyle = computed(() => {
  const r = props.roi.color_r ?? 255;
  const g = props.roi.color_g ?? 0;
  const b = props.roi.color_b ?? 0;
  const alpha = props.isLegacy ? 0.5 : 1;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`
  };
});

// Card classes based on legacy status
const cardClasses = computed(() => {
  const base = 'roi-card flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border';

  if (props.isLegacy) {
    return [
      base,
      'border-base-300 opacity-60',
      props.selected ? 'bg-base-200 border-base-content/30' : 'bg-base-100/50 hover:bg-base-200/50'
    ];
  }

  return [
    base,
    'border-base-300 hover:border-primary/50',
    props.selected ? 'bg-primary/10 border-primary' : 'bg-base-100 hover:bg-base-200'
  ];
});

// Point count
const pointCount = computed(() => {
  const points = props.roi.points || props.roi.points_json;
  if (Array.isArray(points)) {
    return points.length;
  }
  if (typeof points === 'string') {
    try {
      return JSON.parse(points).length;
    } catch {
      return 0;
    }
  }
  return 0;
});

function handleClick() {
  emit('select', props.roi);
}

function handleEdit(e) {
  e.stopPropagation();
  emit('edit', props.roi);
}

function handleDelete(e) {
  e.stopPropagation();
  emit('delete', props.roi);
}
</script>

<template>
  <div
    :class="cardClasses"
    @click="handleClick"
  >
    <!-- Color indicator -->
    <div
      class="w-4 h-4 rounded flex-shrink-0 border border-base-300"
      :style="colorStyle"
    ></div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium truncate" :class="{ 'line-through': isLegacy }">
          {{ roi.roi_name }}
        </span>
        <!-- Legacy badge (v10.0.0-alpha.17) -->
        <span v-if="isLegacy" class="badge badge-xs badge-warning gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Legacy
        </span>
        <!-- Timeseries broken badge -->
        <span v-if="roi.timeseries_broken" class="badge badge-xs badge-error gap-1" title="Time series data may be inconsistent">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
      </div>
      <div v-if="!compact" class="text-xs text-base-content/60">
        {{ pointCount }} points
        <span v-if="roi.auto_generated" class="badge badge-xs badge-ghost ml-1">auto</span>
        <!-- Legacy date info -->
        <span v-if="isLegacy && roi.legacy_date" class="ml-1">
          ({{ new Date(roi.legacy_date).toLocaleDateString() }})
        </span>
      </div>
    </div>

    <!-- Actions (only for non-legacy ROIs) -->
    <div v-if="canEdit && !isLegacy" class="flex gap-1 flex-shrink-0">
      <button
        class="btn btn-ghost btn-xs btn-square"
        title="Edit ROI"
        @click="handleEdit"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        class="btn btn-ghost btn-xs btn-square text-error"
        title="Delete ROI"
        @click="handleDelete"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- View-only indicator for legacy ROIs -->
    <div v-if="isLegacy" class="flex-shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
  </div>
</template>
