<script setup>
/**
 * Export Modal Component
 *
 * Modal for exporting data in various formats.
 * Supports stations, platforms, instruments, and ROIs.
 *
 * @component
 */
import { ref, computed, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import { useExport, EXPORT_TYPES, EXPORT_FORMATS } from '@composables/useExport';
import { useAuthStore } from '@stores/auth';

const props = defineProps({
  /**
   * Show/hide modal (v-model)
   */
  modelValue: {
    type: Boolean,
    default: false
  },

  /**
   * Pre-selected export type
   */
  defaultType: {
    type: String,
    default: 'instruments'
  },

  /**
   * Scope filter (station acronym, platform ID, etc.)
   */
  scope: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue', 'exported']);

const authStore = useAuthStore();
const { loading, error, exportStations, exportPlatforms, exportInstruments, exportROIs, exportFull } = useExport();

// Form state
const selectedType = ref(props.defaultType);
const selectedFormat = ref('csv');

// Is admin user
const isAdmin = computed(() => {
  const role = authStore.user?.role;
  return role === 'admin' || authStore.user?.username === 'spectral-admin';
});

// Available export types based on user role
const availableTypes = computed(() => {
  return Object.values(EXPORT_TYPES).filter(type => {
    if (type.adminOnly && !isAdmin.value) {
      return false;
    }
    return true;
  });
});

// Scope description
const scopeDescription = computed(() => {
  if (props.scope.stationAcronym) {
    return `Station: ${props.scope.stationAcronym}`;
  }
  if (props.scope.platformId) {
    return `Platform ID: ${props.scope.platformId}`;
  }
  if (props.scope.instrumentId) {
    return `Instrument ID: ${props.scope.instrumentId}`;
  }
  if (isAdmin.value) {
    return 'All data (admin access)';
  }
  return 'Your accessible data';
});

// Reset on open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedType.value = props.defaultType;
    selectedFormat.value = 'csv';
  }
});

function handleClose() {
  emit('update:modelValue', false);
}

async function handleExport() {
  const options = {
    format: selectedFormat.value,
    ...props.scope
  };

  let success = false;

  switch (selectedType.value) {
    case 'stations':
      success = await exportStations(options);
      break;
    case 'platforms':
      success = await exportPlatforms(options);
      break;
    case 'instruments':
      success = await exportInstruments(options);
      break;
    case 'rois':
      success = await exportROIs(options);
      break;
    case 'full':
      success = await exportFull(options);
      break;
  }

  if (success) {
    emit('exported', { type: selectedType.value, format: selectedFormat.value });
    handleClose();
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Export Data"
    size="md"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #default>
      <div class="space-y-6">
        <!-- Scope info -->
        <div class="alert alert-info py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">{{ scopeDescription }}</span>
        </div>

        <!-- Export Type Selection -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">What to export</span>
          </label>
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="type in availableTypes"
              :key="type.key"
              :class="[
                'cursor-pointer rounded-lg border-2 p-3 transition-all',
                selectedType === type.key
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 hover:border-primary/50'
              ]"
            >
              <input
                v-model="selectedType"
                type="radio"
                :value="type.key"
                class="hidden"
              />
              <div class="font-medium">{{ type.name }}</div>
              <div class="text-xs text-base-content/60">{{ type.description }}</div>
              <span
                v-if="type.adminOnly"
                class="badge badge-xs badge-warning mt-1"
              >
                Admin only
              </span>
            </label>
          </div>
        </div>

        <!-- Format Selection -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Format</span>
          </label>
          <div class="flex gap-4">
            <label
              v-for="format in Object.values(EXPORT_FORMATS)"
              :key="format.key"
              :class="[
                'cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                selectedFormat === format.key
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 hover:border-primary/50'
              ]"
            >
              <input
                v-model="selectedFormat"
                type="radio"
                :value="format.key"
                class="radio radio-primary radio-sm"
              />
              <span class="font-medium">{{ format.name }}</span>
            </label>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </div>
    </template>

    <template #actions>
      <button
        type="button"
        class="btn btn-ghost"
        :disabled="loading"
        @click="handleClose"
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="loading"
        @click="handleExport"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
    </template>
  </BaseModal>
</template>
