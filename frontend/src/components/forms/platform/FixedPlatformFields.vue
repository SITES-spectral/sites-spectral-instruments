<script setup>
/**
 * Fixed Platform Fields Component
 *
 * Type-specific form fields for fixed platforms.
 * Uses TypeRegistry for field definitions.
 *
 * Shows: ecosystem, mount type (PL/BL/GL), height, mounting structure
 * Does NOT show: vendor, model, agency, satellite, sensor
 *
 * @module components/forms/platform/FixedPlatformFields
 */
import { computed } from 'vue';
import { ECOSYSTEM_CODES, MOUNT_TYPE_CODES } from '@composables/useTypeRegistry';

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

// Ecosystem options from registry
const ecosystemOptions = computed(() => {
  return Object.values(ECOSYSTEM_CODES).map(eco => ({
    value: eco.code,
    label: `${eco.code} - ${eco.name}`,
    description: eco.description
  }));
});

// Mount type options (only fixed-compatible)
const mountTypeOptions = computed(() => {
  return Object.values(MOUNT_TYPE_CODES)
    .filter(mt => mt.platformTypes.includes('fixed'))
    .map(mt => ({
      value: mt.code,
      label: `${mt.code} - ${mt.name}`,
      description: mt.description
    }));
});

// Current mount type info
const selectedMountType = computed(() => {
  const prefix = props.modelValue.mount_type_prefix;
  return MOUNT_TYPE_CODES[prefix] || null;
});

// Preview name
const previewName = computed(() => {
  const station = props.stationAcronym;
  const eco = props.modelValue.ecosystem_code || '???';
  const mt = props.modelValue.mount_type_prefix || 'PL';
  return `${station}_${eco}_${mt}##`;
});

// Update field
function updateField(field, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  });
}
</script>

<template>
  <div class="space-y-4">
    <!-- Required Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Ecosystem -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Ecosystem <span class="text-error">*</span></span>
        </label>
        <select
          :value="modelValue.ecosystem_code"
          @change="updateField('ecosystem_code', $event.target.value)"
          class="select select-bordered w-full"
          required
        >
          <option value="">Select ecosystem...</option>
          <option
            v-for="eco in ecosystemOptions"
            :key="eco.value"
            :value="eco.value"
          >
            {{ eco.label }}
          </option>
        </select>
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            The ecosystem type being monitored at this platform
          </span>
        </label>
      </div>

      <!-- Mount Type -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Mount Type <span class="text-error">*</span></span>
        </label>
        <select
          :value="modelValue.mount_type_prefix"
          @change="updateField('mount_type_prefix', $event.target.value)"
          class="select select-bordered w-full"
          required
        >
          <option
            v-for="mt in mountTypeOptions"
            :key="mt.value"
            :value="mt.value"
          >
            {{ mt.label }}
          </option>
        </select>
        <label v-if="selectedMountType" class="label">
          <span class="label-text-alt text-base-content/60">
            {{ selectedMountType.description }}
          </span>
        </label>
      </div>
    </div>

    <!-- Optional Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Platform Height -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Platform Height (m)</span>
        </label>
        <input
          type="number"
          :value="modelValue.platform_height_m"
          @input="updateField('platform_height_m', $event.target.value ? Number($event.target.value) : null)"
          class="input input-bordered w-full"
          placeholder="e.g., 30"
          min="0"
          max="500"
          step="0.1"
        />
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            Height above ground in meters
          </span>
        </label>
      </div>

      <!-- Mounting Structure -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Mounting Structure</span>
        </label>
        <input
          type="text"
          :value="modelValue.mounting_structure"
          @input="updateField('mounting_structure', $event.target.value)"
          class="input input-bordered w-full"
          placeholder="e.g., Steel lattice tower"
        />
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            Description of the physical mounting structure
          </span>
        </label>
      </div>
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
          Format: {STATION}_{ECOSYSTEM}_{MOUNT_TYPE}##
        </span>
      </label>
    </div>
  </div>
</template>
