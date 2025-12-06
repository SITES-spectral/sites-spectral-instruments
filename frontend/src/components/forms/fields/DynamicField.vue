<script setup>
/**
 * Dynamic Field Component
 *
 * Renders form fields based on field schema from TypeRegistry.
 * Supports: text, number, select, date, textarea, hidden
 *
 * @module components/forms/fields/DynamicField
 */
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, null],
    default: null
  },
  fieldKey: {
    type: String,
    required: true
  },
  config: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
});

const emit = defineEmits(['update:modelValue']);

// Compute input class based on size
const inputClass = computed(() => {
  const base = 'w-full';
  const sizes = {
    sm: 'input-sm',
    md: '',
    lg: 'input-lg'
  };
  return `${base} ${sizes[props.size]}`;
});

// Handle value update
function updateValue(event) {
  let value = event.target.value;

  // Convert to number if field type is number
  if (props.config.type === 'number' && value !== '') {
    value = Number(value);
  }

  emit('update:modelValue', value);
}

// Get options for select fields
const selectOptions = computed(() => {
  if (!props.config.options) return [];

  return props.config.options.map(opt => {
    if (typeof opt === 'string') {
      // Check if there are custom labels
      const label = props.config.optionLabels?.[opt] || opt;
      return { value: opt, label };
    }
    return opt;
  });
});

// Check if field has dependent options
const hasDependentOptions = computed(() => {
  return !!props.config.dependsOn && !!props.config.optionsByParent;
});
</script>

<template>
  <!-- Hidden field -->
  <input
    v-if="config.type === 'hidden'"
    type="hidden"
    :value="modelValue ?? config.defaultValue"
  />

  <!-- Regular fields with label -->
  <div v-else class="form-control">
    <label class="label">
      <span class="label-text font-medium">
        {{ config.label }}
        <span v-if="config.required" class="text-error">*</span>
      </span>
    </label>

    <!-- Text input -->
    <input
      v-if="config.type === 'text' || config.type === 'string'"
      type="text"
      :value="modelValue"
      @input="updateValue"
      :class="['input input-bordered', inputClass]"
      :placeholder="config.placeholder || ''"
      :required="config.required"
      :disabled="disabled"
      :pattern="config.pattern"
    />

    <!-- Number input -->
    <input
      v-else-if="config.type === 'number'"
      type="number"
      :value="modelValue"
      @input="updateValue"
      :class="['input input-bordered', inputClass]"
      :placeholder="config.placeholder || ''"
      :required="config.required"
      :disabled="disabled"
      :min="config.min"
      :max="config.max"
      :step="config.step || 'any'"
    />

    <!-- Select input -->
    <select
      v-else-if="config.type === 'select'"
      :value="modelValue"
      @change="updateValue"
      :class="['select select-bordered', inputClass]"
      :required="config.required"
      :disabled="disabled"
    >
      <option value="">{{ config.placeholder || 'Select...' }}</option>
      <option
        v-for="opt in selectOptions"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>

    <!-- Date input -->
    <input
      v-else-if="config.type === 'date'"
      type="date"
      :value="modelValue"
      @input="updateValue"
      :class="['input input-bordered', inputClass]"
      :required="config.required"
      :disabled="disabled"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="config.type === 'textarea'"
      :value="modelValue"
      @input="updateValue"
      :class="['textarea textarea-bordered', inputClass]"
      :placeholder="config.placeholder || ''"
      :required="config.required"
      :disabled="disabled"
      :rows="config.rows || 3"
    ></textarea>

    <!-- Help text -->
    <label v-if="config.helpText" class="label">
      <span class="label-text-alt text-base-content/60">{{ config.helpText }}</span>
    </label>
  </div>
</template>
