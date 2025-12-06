<script setup>
/**
 * UAV Platform Fields Component
 *
 * Type-specific form fields for UAV platforms.
 * Uses TypeRegistry for field definitions.
 *
 * Shows: vendor, model, position ID
 * Does NOT show: ecosystem, height, mounting structure, agency, satellite, sensor
 *
 * @module components/forms/platform/UAVPlatformFields
 */
import { computed } from 'vue';
import { PLATFORM_TYPE_STRATEGIES } from '@composables/useTypeRegistry';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  stationAcronym: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

// Get UAV strategy from registry
const uavStrategy = computed(() => PLATFORM_TYPE_STRATEGIES.uav);

// Vendor options from registry
const vendorOptions = computed(() => {
  return uavStrategy.value.fields.vendor.options.map(v => ({
    value: v,
    label: v
  }));
});

// Model options based on selected vendor
const modelOptions = computed(() => {
  const vendor = props.modelValue.vendor;
  if (!vendor) return [];

  const models = uavStrategy.value.fields.model.optionsByParent[vendor] || [];
  return models.map(m => ({
    value: m,
    label: m
  }));
});

// Preview name
const previewName = computed(() => {
  const station = props.stationAcronym;
  const vendor = props.modelValue.vendor || '???';
  const model = props.modelValue.model || '???';
  return `${station}_${vendor}_${model}_UAV##`;
});

// Update field
function updateField(field, value) {
  const update = { ...props.modelValue, [field]: value };

  // Reset model when vendor changes
  if (field === 'vendor') {
    update.model = '';
  }

  emit('update:modelValue', update);
}

// Known instrument specs for UAV models (for info display)
const modelInstruments = {
  M3M: ['Multispectral (4 bands + RGB)', 'RGB Camera'],
  P4M: ['Multispectral (5 bands)', 'RGB Camera'],
  M30T: ['RGB Camera', 'Thermal Camera', 'Laser Rangefinder'],
  M300: ['Payload Mount (customizable)'],
  M350: ['Payload Mount (customizable)'],
  'RedEdge-MX': ['Multispectral (5 bands)'],
  'Altum-PT': ['Multispectral (5 bands)', 'Thermal Camera', 'Panchromatic'],
  'Sequoia+': ['Multispectral (4 bands)', 'RGB Camera'],
  'Nano-Hyperspec': ['Hyperspectral (270 bands)']
};

const selectedModelInstruments = computed(() => {
  return modelInstruments[props.modelValue.model] || [];
});
</script>

<template>
  <div class="space-y-4">
    <!-- Vendor & Model -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Vendor -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Vendor <span class="text-error">*</span></span>
        </label>
        <select
          :value="modelValue.vendor"
          @change="updateField('vendor', $event.target.value)"
          class="select select-bordered w-full"
          required
        >
          <option value="">Select vendor...</option>
          <option
            v-for="vendor in vendorOptions"
            :key="vendor.value"
            :value="vendor.value"
          >
            {{ vendor.label }}
          </option>
        </select>
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            UAV or sensor manufacturer
          </span>
        </label>
      </div>

      <!-- Model -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Model <span class="text-error">*</span></span>
        </label>
        <select
          :value="modelValue.model"
          @change="updateField('model', $event.target.value)"
          class="select select-bordered w-full"
          required
          :disabled="!modelValue.vendor"
        >
          <option value="">Select model...</option>
          <option
            v-for="model in modelOptions"
            :key="model.value"
            :value="model.value"
          >
            {{ model.label }}
          </option>
        </select>
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            UAV or sensor model
          </span>
        </label>
      </div>
    </div>

    <!-- Auto-instruments Info -->
    <div v-if="selectedModelInstruments.length > 0" class="alert alert-info">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <div class="font-medium">Auto-created instruments for {{ modelValue.model }}:</div>
        <ul class="list-disc list-inside mt-1 text-sm">
          <li v-for="inst in selectedModelInstruments" :key="inst">{{ inst }}</li>
        </ul>
      </div>
    </div>

    <div v-else class="alert alert-warning">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>UAV instruments will be auto-created based on the selected model.</span>
    </div>

    <!-- Name Preview -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Platform Name Preview</span>
      </label>
      <div class="bg-base-200 px-4 py-3 rounded-lg font-mono text-lg">
        {{ previewName }}
      </div>
      <label class="label">
        <span class="label-text-alt">
          Format: {STATION}_{VENDOR}_{MODEL}_UAV##
        </span>
      </label>
    </div>
  </div>
</template>
