<script setup>
/**
 * Platform Form Modal
 *
 * Modal wrapper for PlatformForm with create/edit support.
 * Uses BaseModal for consistent modal behavior.
 *
 * @module components/modals/PlatformFormModal
 */
import { ref, computed, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import PlatformForm from '@components/forms/PlatformForm.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  platform: {
    type: Object,
    default: null
  },
  stationId: {
    type: Number,
    required: true
  },
  stationAcronym: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);

// Loading state for submission
const loading = ref(false);

// Is this an edit operation?
const isEdit = computed(() => !!props.platform);

// Modal title
const modalTitle = computed(() => {
  return isEdit.value ? 'Edit Platform' : 'Create Platform';
});

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
  emit('cancel');
}

// Close modal
function close() {
  emit('update:modelValue', false);
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="modalTitle"
    size="lg"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="close"
  >
    <PlatformForm
      :platform="platform"
      :station-id="stationId"
      :station-acronym="stationAcronym"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </BaseModal>
</template>
