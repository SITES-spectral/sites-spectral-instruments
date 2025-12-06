<script setup>
/**
 * Confirm Modal Component
 *
 * Modal for confirmation dialogs (delete, etc.)
 */
import BaseModal from './BaseModal.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  variant: {
    type: String,
    default: 'warning', // warning, error, info
    validator: (v) => ['warning', 'error', 'info'].includes(v)
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const variantClasses = {
  warning: 'btn-warning',
  error: 'btn-error',
  info: 'btn-info'
};

const variantIcons = {
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
};

function close() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
  close();
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    :persistent="loading"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="flex flex-col items-center text-center">
      <!-- Icon -->
      <div class="mb-4" :class="`text-${variant}`">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="variantIcons[variant]" />
        </svg>
      </div>

      <!-- Message -->
      <p class="text-base-content/80">{{ message }}</p>
    </div>

    <template #footer>
      <button
        class="btn btn-ghost"
        :disabled="loading"
        @click="handleCancel"
      >
        {{ cancelText }}
      </button>
      <button
        class="btn"
        :class="variantClasses[variant]"
        :disabled="loading"
        @click="handleConfirm"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ confirmText }}
      </button>
    </template>
  </BaseModal>
</template>
