<script setup>
/**
 * Admin Override Confirm Modal
 *
 * Double confirmation modal for super admins who want to directly edit
 * an active ROI. Requires typing 'CONFIRM' to proceed.
 *
 * This action will:
 * - Directly modify the ROI (breaking time series consistency)
 * - Set the timeseries_broken flag on the ROI
 *
 * v10.0.0-alpha.17
 *
 * @component
 */
import { ref, computed, watch } from 'vue';

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

// Confirmation text input
const confirmText = ref('');
const CONFIRM_WORD = 'CONFIRM';

// Computed
const roiName = computed(() => props.roi?.roi_name || 'Unknown ROI');
const isConfirmValid = computed(() => confirmText.value.toUpperCase() === CONFIRM_WORD);

// Reset on visibility change
watch(() => props.visible, (visible) => {
  if (!visible) {
    confirmText.value = '';
  }
});

/**
 * Handle confirm action
 */
function handleConfirm() {
  if (!isConfirmValid.value) return;
  emit('confirm', { roi: props.roi });
}

/**
 * Handle cancel action
 */
function handleCancel() {
  confirmText.value = '';
  emit('cancel');
}

/**
 * Handle close action
 */
function handleClose() {
  confirmText.value = '';
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
        <div class="p-3 bg-error/20 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-error"
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
          <h3 class="font-bold text-lg text-error">Admin Override</h3>
          <p class="text-sm text-base-content/70">This action will break time series consistency</p>
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
        <div class="alert alert-error mb-4">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span class="text-sm font-semibold">Warning: Irreversible Action</span>
            <p class="text-xs mt-1">
              Directly editing <strong>{{ roiName }}</strong> will break L2/L3 time series data consistency.
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-base-200 rounded-lg p-4">
            <h4 class="font-semibold text-sm mb-2 text-error">Consequences:</h4>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>The ROI boundaries will change for the same ROI number</span>
              </li>
              <li class="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Historical L2/L3 products will reference different boundaries</span>
              </li>
              <li class="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01" />
                </svg>
                <span>A <code class="bg-base-300 px-1 rounded">timeseries_broken</code> flag will be set</span>
              </li>
              <li class="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-info shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>This action is logged for audit purposes</span>
              </li>
            </ul>
          </div>

          <div class="divider text-xs text-base-content/50">CONFIRMATION REQUIRED</div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">
                Type <code class="bg-base-300 px-2 py-0.5 rounded font-bold">{{ CONFIRM_WORD }}</code> to proceed
              </span>
            </label>
            <input
              v-model="confirmText"
              type="text"
              class="input input-bordered"
              :class="{ 'input-error': confirmText.length > 0 && !isConfirmValid }"
              placeholder="Type CONFIRM"
              :disabled="loading"
              autocomplete="off"
              @keyup.enter="isConfirmValid && handleConfirm()"
            />
            <label v-if="confirmText.length > 0 && !isConfirmValid" class="label">
              <span class="label-text-alt text-error">
                Please type exactly: {{ CONFIRM_WORD }}
              </span>
            </label>
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
          class="btn btn-error"
          :disabled="loading || !isConfirmValid"
          @click="handleConfirm"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <template v-else>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Override &amp; Edit Directly
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
