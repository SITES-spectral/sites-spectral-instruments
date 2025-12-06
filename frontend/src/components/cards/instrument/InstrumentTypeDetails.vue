<script setup>
/**
 * Instrument Type Details Component
 *
 * Dynamic component that renders type-specific fields
 * based on the InstrumentTypeRegistry schema.
 *
 * Only shows fields that:
 * 1. Are defined in the type's schema
 * 2. Have values in the instrument's specifications
 *
 * @module components/cards/instrument/InstrumentTypeDetails
 */
import { computed } from 'vue';
import {
  getInstrumentTypeConfig,
  getInstrumentSummaryFields,
  formatFieldValue
} from '@composables/useTypeRegistry';

const props = defineProps({
  instrument: {
    type: Object,
    required: true
  },
  showAllFields: {
    type: Boolean,
    default: false
  }
});

// Get type configuration
const typeConfig = computed(() => {
  return getInstrumentTypeConfig(props.instrument.instrument_type);
});

// Get specifications from instrument
const specifications = computed(() => {
  // Specifications may be in a nested object or at top level
  if (props.instrument.specifications && typeof props.instrument.specifications === 'object') {
    return props.instrument.specifications;
  }
  // Or try to parse if it's a JSON string
  if (typeof props.instrument.specifications === 'string') {
    try {
      return JSON.parse(props.instrument.specifications);
    } catch {
      return {};
    }
  }
  // Otherwise look for fields directly on the instrument
  return props.instrument;
});

// Get fields to display
const fieldsToDisplay = computed(() => {
  if (!typeConfig.value?.fields) return [];

  const schema = typeConfig.value.fields;
  const summaryFields = getInstrumentSummaryFields(props.instrument.instrument_type);
  const fieldsToShow = props.showAllFields ? Object.keys(schema) : summaryFields;

  return fieldsToShow
    .map(fieldKey => {
      const fieldConfig = schema[fieldKey];
      if (!fieldConfig) return null;

      // Get value from specifications or directly from instrument
      const value = specifications.value[fieldKey] ?? props.instrument[fieldKey];

      return {
        key: fieldKey,
        label: fieldConfig.label,
        value: value,
        config: fieldConfig,
        hasValue: value !== null && value !== undefined && value !== ''
      };
    })
    .filter(field => field !== null);
});

// Fields with values
const fieldsWithValues = computed(() => {
  return fieldsToDisplay.value.filter(field => field.hasValue);
});

// Check if we have any fields to show
const hasFields = computed(() => fieldsWithValues.value.length > 0);
</script>

<template>
  <div v-if="hasFields" class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
    <div
      v-for="field in fieldsWithValues"
      :key="field.key"
      class="min-w-0"
    >
      <span class="text-xs text-base-content/50 block truncate">
        {{ field.label }}
      </span>
      <span class="font-medium block truncate" :title="String(field.value)">
        {{ formatFieldValue(field.value, field.config) }}
      </span>
    </div>
  </div>

  <div v-else class="text-xs text-base-content/50 italic">
    No specifications recorded
  </div>
</template>
