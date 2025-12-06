<script setup>
/**
 * Station Form Modal
 *
 * Modal wrapper for StationForm.
 * Handles create and edit flows.
 */
import { computed, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import StationForm from '@components/forms/StationForm.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  station: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'submit']);

// Loading state
const loading = ref(false);

// Modal title
const modalTitle = computed(() =>
  props.station ? 'Edit Station' : 'Create Station'
);

// Handle form submission
async function handleSubmit(formData) {
  loading.value = true;
  try {
    emit('submit', formData);
  } finally {
    loading.value = false;
  }
}

// Handle cancel
function handleCancel() {
  emit('update:modelValue', false);
}

// Reset loading when modal closes
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    loading.value = false;
  }
});
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="modalTitle"
    size="lg"
  >
    <StationForm
      :station="station"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </BaseModal>
</template>
