<script setup>
/**
 * ROI List Component
 *
 * Displays a list of ROIs with selection, editing, and deletion support.
 * v10.0.0-alpha.17: Added Active/Legacy tabs for legacy ROI system
 *
 * @component
 */
import { ref, computed } from 'vue';
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
  },

  /**
   * Whether to show legacy tabs (v10.0.0-alpha.17)
   */
  showLegacyTabs: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['select', 'edit', 'delete', 'create']);

// Current tab: 'active' or 'legacy'
const currentTab = ref('active');

// Active ROIs (not marked as legacy)
const activeRois = computed(() => {
  return props.rois.filter(roi => !roi.is_legacy);
});

// Legacy ROIs (marked as legacy)
const legacyRois = computed(() => {
  return props.rois.filter(roi => roi.is_legacy);
});

// Has legacy ROIs
const hasLegacyRois = computed(() => legacyRois.value.length > 0);

// Show tabs only if we have legacy ROIs
const showTabs = computed(() => props.showLegacyTabs && hasLegacyRois.value);

// Sorted ROIs based on current tab
const sortedROIs = computed(() => {
  const roisToSort = showTabs.value
    ? (currentTab.value === 'legacy' ? legacyRois.value : activeRois.value)
    : props.rois;

  return [...roisToSort].sort((a, b) => {
    // Sort by ROI name (ROI_01, ROI_02, etc.)
    return (a.roi_name || '').localeCompare(b.roi_name || '', undefined, { numeric: true });
  });
});

// Current tab ROI count
const currentTabCount = computed(() => {
  if (!showTabs.value) return props.rois.length;
  return currentTab.value === 'legacy' ? legacyRois.value.length : activeRois.value.length;
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
        v-if="canEdit && currentTab === 'active'"
        class="btn btn-primary btn-sm"
        @click="handleCreate"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add ROI
      </button>
    </div>

    <!-- Active/Legacy Tabs (v10.0.0-alpha.17) -->
    <div v-if="showTabs" class="tabs tabs-boxed mb-3 bg-base-200">
      <button
        class="tab"
        :class="{ 'tab-active': currentTab === 'active' }"
        @click="currentTab = 'active'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Active
        <span class="badge badge-sm ml-1">{{ activeRois.length }}</span>
      </button>
      <button
        class="tab"
        :class="{ 'tab-active': currentTab === 'legacy' }"
        @click="currentTab = 'legacy'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Legacy
        <span class="badge badge-sm badge-ghost ml-1">{{ legacyRois.length }}</span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="currentTabCount === 0" class="text-center py-8 text-base-content/60">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <template v-if="currentTab === 'legacy'">
        <p>No legacy ROIs</p>
        <p class="text-sm mt-1">Legacy ROIs are preserved for historical data integrity</p>
      </template>
      <template v-else>
        <p>No ROIs defined</p>
        <p v-if="canEdit" class="text-sm mt-1">Click "Add ROI" to create one</p>
      </template>
    </div>

    <!-- ROI list -->
    <div v-else class="space-y-2" :style="containerStyle">
      <ROICard
        v-for="roi in sortedROIs"
        :key="roi.id"
        :roi="roi"
        :selected="roi.id === selectedId"
        :can-edit="canEdit && !roi.is_legacy"
        :compact="compact"
        :is-legacy="roi.is_legacy"
        @select="handleSelect"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Legacy info banner (when on legacy tab) -->
    <div v-if="showTabs && currentTab === 'legacy' && legacyRois.length > 0" class="mt-3">
      <div class="alert alert-info py-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm">
          Legacy ROIs are preserved for L2/L3 historical product consistency.
          They cannot be edited or deleted.
        </span>
      </div>
    </div>
  </div>
</template>
