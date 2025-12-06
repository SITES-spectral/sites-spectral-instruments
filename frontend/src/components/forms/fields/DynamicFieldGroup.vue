<script setup>
/**
 * Dynamic Field Group Component
 *
 * Renders a group of form fields based on a schema from TypeRegistry.
 * Automatically lays out fields in a responsive grid.
 *
 * @module components/forms/fields/DynamicFieldGroup
 */
import { computed } from 'vue';
import DynamicField from './DynamicField.vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  schema: {
    type: Object,
    required: true
  },
  columns: {
    type: Number,
    default: 2
  },
  size: {
    type: String,
    default: 'sm'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

// Get visible fields (not hidden type)
const visibleFields = computed(() => {
  return Object.entries(props.schema).filter(
    ([, config]) => config.type !== 'hidden'
  );
});

// Get hidden fields
const hiddenFields = computed(() => {
  return Object.entries(props.schema).filter(
    ([, config]) => config.type === 'hidden'
  );
});

// Grid class based on columns
const gridClass = computed(() => {
  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };
  return cols[props.columns] || cols[2];
});

// Update a single field value
function updateField(fieldKey, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [fieldKey]: value
  });
}

// Get field value with default
function getFieldValue(fieldKey, config) {
  const value = props.modelValue[fieldKey];
  if (value !== undefined && value !== null) return value;
  return config.defaultValue ?? null;
}
</script>

<template>
  <div>
    <!-- Hidden fields (rendered but not visible) -->
    <DynamicField
      v-for="[fieldKey, config] in hiddenFields"
      :key="fieldKey"
      :field-key="fieldKey"
      :config="config"
      :model-value="getFieldValue(fieldKey, config)"
      @update:model-value="updateField(fieldKey, $event)"
    />

    <!-- Visible fields in grid -->
    <div :class="['grid gap-4', gridClass]">
      <DynamicField
        v-for="[fieldKey, config] in visibleFields"
        :key="fieldKey"
        :field-key="fieldKey"
        :config="config"
        :model-value="getFieldValue(fieldKey, config)"
        :size="size"
        :disabled="disabled"
        @update:model-value="updateField(fieldKey, $event)"
      />
    </div>
  </div>
</template>
