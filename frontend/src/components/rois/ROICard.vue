<script setup>
/**
 * ROI Card Component
 *
 * Displays a single ROI with color preview, name, and actions.
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
  }
});

const emit = defineEmits(['select', 'edit', 'delete']);

// Computed color style
const colorStyle = computed(() => {
  const r = props.roi.color_r ?? 255;
  const g = props.roi.color_g ?? 0;
  const b = props.roi.color_b ?? 0;
  return {
    backgroundColor: `rgb(${r}, ${g}, ${b})`
  };
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
    :class="[
      'roi-card flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
      'border border-base-300 hover:border-primary/50',
      selected ? 'bg-primary/10 border-primary' : 'bg-base-100 hover:bg-base-200'
    ]"
    @click="handleClick"
  >
    <!-- Color indicator -->
    <div
      class="w-4 h-4 rounded flex-shrink-0 border border-base-300"
      :style="colorStyle"
    ></div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="font-medium truncate">
        {{ roi.roi_name }}
      </div>
      <div v-if="!compact" class="text-xs text-base-content/60">
        {{ pointCount }} points
        <span v-if="roi.auto_generated" class="badge badge-xs badge-ghost ml-1">auto</span>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="canEdit" class="flex gap-1 flex-shrink-0">
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
  </div>
</template>
