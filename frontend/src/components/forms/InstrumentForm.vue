<script setup>
/**
 * Instrument Form Component
 *
 * Registry-driven form for creating/editing instruments.
 * Dynamically generates fields based on INSTRUMENT_TYPE_REGISTRY.
 *
 * SOLID Compliance:
 * - Open/Closed: Add new instrument types by updating registry config
 * - Single Responsibility: Form handles layout, DynamicFieldGroup handles fields
 * - Dependency Inversion: Depends on TypeRegistry abstraction
 *
 * @module components/forms/InstrumentForm
 */
import { ref, computed, watch } from 'vue';
import {
  INSTRUMENT_TYPE_REGISTRY,
  getInstrumentTypeConfig,
  getInstrumentTypeCode
} from '@composables/useTypeRegistry';
import { DynamicFieldGroup } from './fields';
import { InstrumentIcon } from '@components/common';

const props = defineProps({
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
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

// Get available instrument types from registry
const instrumentTypes = computed(() => {
  return Object.entries(INSTRUMENT_TYPE_REGISTRY)
    .filter(([key, config]) => {
      // Filter by platform compatibility if specified
      if (config.platformCompatibility) {
        return config.platformCompatibility.includes(props.platformType);
      }
      return true;
    })
    .map(([key, config]) => ({
      value: key,
      label: config.name,
      code: config.code,
      icon: config.icon
    }));
});

// Status options from registry or defaults
const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Decommissioned'];
const measurementStatusOptions = ['active', 'paused', 'stopped', 'error'];

// Form state
const isEdit = computed(() => !!props.instrument);
const selectedType = ref('phenocam');
const specifications = ref({});
const commonData = ref({
  display_name: '',
  description: '',
  status: 'Active',
  measurement_status: 'active'
});

// Current type config from registry
const currentTypeConfig = computed(() => {
  return getInstrumentTypeConfig(selectedType.value);
});

// Specification fields schema from registry
const specificationSchema = computed(() => {
  const config = currentTypeConfig.value;
  if (!config?.fields) return {};

  // Transform registry fields to DynamicFieldGroup schema format
  const schema = {};
  Object.entries(config.fields).forEach(([key, fieldConfig]) => {
    schema[key] = {
      type: fieldConfig.type || 'text',
      label: fieldConfig.label,
      required: fieldConfig.required || false,
      placeholder: fieldConfig.placeholder,
      options: fieldConfig.options,
      min: fieldConfig.min,
      max: fieldConfig.max,
      step: fieldConfig.step,
      unit: fieldConfig.unit,
      defaultValue: fieldConfig.defaultValue
    };
  });
  return schema;
});

// Preview name
const previewName = computed(() => {
  const code = getInstrumentTypeCode(selectedType.value) || 'XXX';
  return `${props.platformName}_${code}##`;
});

// Initialize form with existing instrument data
watch(() => props.instrument, (instrument) => {
  if (instrument) {
    // Get type key from instrument_type string
    const typeKey = Object.keys(INSTRUMENT_TYPE_REGISTRY).find(
      key => INSTRUMENT_TYPE_REGISTRY[key].name === instrument.instrument_type ||
             key === instrument.instrument_type.toLowerCase().replace(/\s+/g, '')
    ) || 'phenocam';

    selectedType.value = typeKey;

    commonData.value = {
      display_name: instrument.display_name || '',
      description: instrument.description || '',
      status: instrument.status || 'Active',
      measurement_status: instrument.measurement_status || 'active'
    };

    // Initialize specifications from instrument data
    specifications.value = instrument.specifications || {};
  }
}, { immediate: true });

// Reset specifications when type changes (for new instruments only)
watch(selectedType, (newType, oldType) => {
  if (newType !== oldType && !isEdit.value) {
    // Initialize with default values from registry
    const config = INSTRUMENT_TYPE_REGISTRY[newType];
    const defaults = {};

    if (config?.fields) {
      Object.entries(config.fields).forEach(([key, fieldConfig]) => {
        if (fieldConfig.defaultValue !== undefined) {
          defaults[key] = fieldConfig.defaultValue;
        }
      });
    }

    specifications.value = defaults;
  }
});

// Validation
const isValid = computed(() => {
  if (!selectedType.value) return false;

  const config = currentTypeConfig.value;
  if (!config?.fields) return true;

  // Check all required fields have values
  for (const [fieldKey, fieldConfig] of Object.entries(config.fields)) {
    if (fieldConfig.required) {
      const value = specifications.value[fieldKey];
      if (value === undefined || value === null || value === '') {
        return false;
      }
    }
  }

  return true;
});

function handleSubmit() {
  if (!isValid.value) return;

  const config = currentTypeConfig.value;

  const data = {
    platform_id: props.platformId,
    instrument_type: config?.name || selectedType.value,
    display_name: commonData.value.display_name || undefined,
    description: commonData.value.description || undefined,
    status: commonData.value.status,
    measurement_status: commonData.value.measurement_status,
    specifications: { ...specifications.value }
  };

  // Clean up undefined/empty values
  Object.keys(data).forEach(key => {
    if (data[key] === undefined || data[key] === '') {
      delete data[key];
    }
  });

  // Clean up specifications
  Object.keys(data.specifications).forEach(key => {
    if (data.specifications[key] === undefined || data.specifications[key] === '') {
      delete data.specifications[key];
    }
  });

  emit('submit', data);
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Instrument Type Selection (only for new instruments) -->
    <div class="form-control" v-if="!isEdit">
      <label class="label">
        <span class="label-text font-medium">Instrument Type *</span>
      </label>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <label
          v-for="type in instrumentTypes"
          :key="type.value"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm"
          :class="selectedType === type.value ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'"
        >
          <input
            type="radio"
            v-model="selectedType"
            :value="type.value"
            class="radio radio-primary radio-sm"
          />
          <InstrumentIcon
            :icon="type.icon"
            :size="18"
            :stroke-width="2"
            :color="type.color"
          />
          <span>{{ type.label }}</span>
        </label>
      </div>
    </div>

    <!-- Name Preview -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Instrument Name Preview</span>
      </label>
      <div class="bg-base-200 px-4 py-3 rounded-lg font-mono">
        {{ previewName }}
      </div>
      <label class="label">
        <span class="label-text-alt text-base-content/60">
          Auto-generated based on platform and instrument type
        </span>
      </label>
    </div>

    <!-- Status Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Status</span>
        </label>
        <select v-model="commonData.status" class="select select-bordered w-full">
          <option v-for="status in statusOptions" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Measurement Status</span>
        </label>
        <select v-model="commonData.measurement_status" class="select select-bordered w-full">
          <option v-for="status in measurementStatusOptions" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </div>
    </div>

    <!-- Type-Specific Specifications (Registry-Driven) -->
    <div class="form-control" v-if="Object.keys(specificationSchema).length > 0">
      <label class="label">
        <span class="label-text font-medium">
          {{ currentTypeConfig?.name || 'Instrument' }} Specifications
        </span>
      </label>
      <div class="bg-base-200 p-4 rounded-lg">
        <DynamicFieldGroup
          v-model="specifications"
          :schema="specificationSchema"
          :columns="2"
          size="sm"
        />
      </div>
    </div>

    <!-- No specifications message -->
    <div v-else class="alert">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>No additional specifications required for this instrument type.</span>
    </div>

    <!-- Optional Fields -->
    <div class="collapse collapse-arrow bg-base-200">
      <input type="checkbox" />
      <div class="collapse-title font-medium">
        Optional Fields
      </div>
      <div class="collapse-content space-y-4">
        <div class="form-control">
          <label class="label"><span class="label-text">Display Name</span></label>
          <input
            v-model="commonData.display_name"
            type="text"
            class="input input-bordered"
            placeholder="Human-readable name"
          />
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">Description</span></label>
          <textarea
            v-model="commonData.description"
            class="textarea textarea-bordered"
            rows="2"
            placeholder="Instrument description..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-4">
      <button type="button" class="btn btn-ghost" @click="handleCancel" :disabled="loading">
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" :disabled="!isValid || loading">
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ isEdit ? 'Update Instrument' : 'Create Instrument' }}
      </button>
    </div>
  </form>
</template>
