<script setup>
/**
 * ROI List Component
 *
 * Displays a list of ROIs with selection, editing, and deletion support.
 *
 * @component
 */
import { computed } from 'vue';
import ROICard from './ROICard.vue';

const props = defineProps({
  /**
   * Array of ROI objects
   */
  rois: {
    type: Array,
    default: () => []
  },

  /**
   * Currently selected ROI ID
   */
  selectedId: {
    type: [Number, String],
    default: null
  },

  /**
   * Whether user can edit ROIs
   */
  canEdit: {
    type: Boolean,
    default: false
  },

  /**
   * Loading state
   */
  loading: {
    type: Boolean,
    default: false
  },

  /**
   * Compact mode for cards
   */
  compact: {
    type: Boolean,
    default: false
  },

  /**
   * Maximum height before scrolling
   */
  maxHeight: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['select', 'edit', 'delete', 'create']);

// Sorted ROIs
const sortedROIs = computed(() => {
  return [...props.rois].sort((a, b) => {
    // Sort by ROI name (ROI_01, ROI_02, etc.)
    return (a.roi_name || '').localeCompare(b.roi_name || '', undefined, { numeric: true });
  });
});

// Container style
const containerStyle = computed(() => {
  if (props.maxHeight) {
    const height = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
    return { maxHeight: height, overflowY: 'auto' };
  }
  return {};
});

function handleSelect(roi) {
  emit('select', roi);
}

function handleEdit(roi) {
  emit('edit', roi);
}

function handleDelete(roi) {
  emit('delete', roi);
}

function handleCreate() {
  emit('create');
}
</script>

<template>
  <div class="roi-list">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="font-medium">ROIs</span>
        <span class="badge badge-sm">{{ rois.length }}</span>
      </div>
      <button
        v-if="canEdit"
        class="btn btn-primary btn-sm"
        @click="handleCreate"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add ROI
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="rois.length === 0" class="text-center py-8 text-base-content/60">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p>No ROIs defined</p>
      <p v-if="canEdit" class="text-sm mt-1">Click "Add ROI" to create one</p>
    </div>

    <!-- ROI list -->
    <div v-else class="space-y-2" :style="containerStyle">
      <ROICard
        v-for="roi in sortedROIs"
        :key="roi.id"
        :roi="roi"
        :selected="roi.id === selectedId"
        :can-edit="canEdit"
        :compact="compact"
        @select="handleSelect"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>
