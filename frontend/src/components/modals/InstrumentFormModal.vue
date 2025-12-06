<script setup>
/**
 * Instrument Form Modal
 *
 * Modal wrapper for InstrumentForm with create/edit support.
 * Uses BaseModal for consistent modal behavior.
 *
 * @module components/modals/InstrumentFormModal
 */
import { ref, computed } from 'vue';
import BaseModal from './BaseModal.vue';
import InstrumentForm from '@components/forms/InstrumentForm.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  instrument: {
    type: Object,
    default: null
  },
  platformId: {
    type: Number,
    required: true
  },
  platformName: {
    type: String,
    required: true
  },
  platformType: {
    type: String,
    default: 'fixed'
  }
});

const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);

// Loading state for submission
const loading = ref(false);

// Is this an edit operation?
const isEdit = computed(() => !!props.instrument);

// Modal title
const modalTitle = computed(() => {
  return isEdit.value ? 'Edit Instrument' : 'Create Instrument';
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
    <InstrumentForm
      :instrument="instrument"
      :platform-id="platformId"
      :platform-name="platformName"
      :platform-type="platformType"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </BaseModal>
</template>
