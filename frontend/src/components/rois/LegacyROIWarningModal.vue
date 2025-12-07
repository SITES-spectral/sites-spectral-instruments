<script setup>
/**
 * Legacy ROI Warning Modal
 *
 * Shown to station users when they attempt to edit an active ROI.
 * Explains that the edit will mark the current ROI as legacy and
 * create a new replacement ROI to preserve time series data integrity.
 *
 * v10.0.0-alpha.17
 *
 * @component
 */
import { ref, computed } from 'vue';

const props = defineProps({
  /**
   * Whether the modal is visible
   */
  visible: {
    type: Boolean,
    default: false
  },

  /**
   * The ROI being edited
   */
  roi: {
    type: Object,
    default: null
  },

  /**
   * Loading state for the action
   */
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'confirm', 'cancel']);

// Reason for marking as legacy
const reason = ref('');

// Computed
const roiName = computed(() => props.roi?.roi_name || 'Unknown ROI');
const roiId = computed(() => props.roi?.id || '');

/**
 * Handle confirm action
 */
function handleConfirm() {
  emit('confirm', {
    roi: props.roi,
    reason: reason.value || 'Replaced with updated ROI'
  });
}

/**
 * Handle cancel action
 */
function handleCancel() {
  reason.value = '';
  emit('cancel');
}

/**
 * Handle close action
 */
function handleClose() {
  reason.value = '';
  emit('close');
}
</script>

<template>
  <dialog
    class="modal"
    :class="{ 'modal-open': visible }"
    @click.self="handleClose"
  >
    <div class="modal-box max-w-lg">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <div class="p-3 bg-warning/20 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-lg">ROI Edit Protection</h3>
          <p class="text-sm text-base-content/70">Time series data preservation</p>
        </div>
      </div>

      <!-- Close button -->
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="handleClose"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Content -->
      <div class="py-4">
        <div class="alert alert-warning mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span class="text-sm">
            Editing <strong>{{ roiName }}</strong> will create a new ROI to preserve time series data.
          </span>
        </div>

        <div class="space-y-4">
          <div class="bg-base-200 rounded-lg p-4">
            <h4 class="font-semibold text-sm mb-2">What will happen:</h4>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start gap-2">
                <span class="text-warning mt-0.5">1.</span>
                <span>
                  <strong>{{ roiName }}</strong> will be marked as <em>legacy</em>
                  (preserved for historical L2/L3 products)
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-0.5">2.</span>
                <span>A new ROI with the next available number will be created with your changes</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-success mt-0.5">3.</span>
                <span>Future processing will use the new ROI while historical data remains intact</span>
              </li>
            </ul>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Reason for change (optional)</span>
            </label>
            <textarea
              v-model="reason"
              class="textarea textarea-bordered h-20"
              placeholder="e.g., Adjusted boundaries to better match vegetation area..."
              :disabled="loading"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button
          class="btn btn-ghost"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="handleConfirm"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <template v-else>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New ROI
          </template>
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="handleClose">close</button>
    </form>
  </dialog>
</template>

<style scoped>
.modal-box {
  overflow-y: auto;
  max-height: calc(100vh - 5em);
}
</style>
