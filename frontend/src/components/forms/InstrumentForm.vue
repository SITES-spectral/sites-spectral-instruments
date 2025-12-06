<script setup>
/**
 * Instrument Form Component
 *
 * Form for creating/editing instruments.
 * Supports multiple instrument types with type-specific fields.
 */
import { ref, computed, watch } from 'vue';

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
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

// Instrument types configuration
const instrumentTypes = [
  { value: 'Phenocam', code: 'PHE', label: 'Phenocam', icon: '📷' },
  { value: 'Multispectral', code: 'MS', label: 'Multispectral', icon: '📡' },
  { value: 'PAR Sensor', code: 'PAR', label: 'PAR Sensor', icon: '☀️' },
  { value: 'NDVI Sensor', code: 'NDVI', label: 'NDVI Sensor', icon: '🌿' },
  { value: 'PRI Sensor', code: 'PRI', label: 'PRI Sensor', icon: '🔬' },
  { value: 'Hyperspectral', code: 'HYP', label: 'Hyperspectral', icon: '🌈' },
  { value: 'LiDAR', code: 'LID', label: 'LiDAR', icon: '📐' },
  { value: 'Thermal', code: 'THM', label: 'Thermal', icon: '🌡️' },
  { value: 'RGB Camera', code: 'RGB', label: 'RGB Camera', icon: '🎥' }
];

// Status options
const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Decommissioned'];
const measurementStatusOptions = ['active', 'paused', 'stopped', 'error'];

// Form state
const isEdit = computed(() => !!props.instrument);
const form = ref({
  instrument_type: 'Phenocam',
  display_name: '',
  description: '',
  status: 'Active',
  measurement_status: 'active',
  specifications: {}
});

// Type-specific specification templates
const specificationTemplates = {
  Phenocam: {
    camera_brand: '',
    camera_model: '',
    resolution: '',
    interval_minutes: 30,
    viewing_direction: '',
    azimuth_degrees: null,
    fov_degrees: null
  },
  Multispectral: {
    number_of_channels: 5,
    spectral_range: '',
    resolution_nm: null,
    orientation: 'downward',
    datalogger: ''
  },
  'PAR Sensor': {
    spectral_range: '400-700nm',
    calibration_coefficient: null,
    manufacturer: '',
    model: ''
  },
  'NDVI Sensor': {
    red_wavelength_nm: 650,
    nir_wavelength_nm: 810,
    manufacturer: '',
    model: ''
  },
  'PRI Sensor': {
    band1_wavelength_nm: 531,
    band2_wavelength_nm: 570,
    manufacturer: '',
    model: ''
  },
  Hyperspectral: {
    spectral_range_start_nm: 350,
    spectral_range_end_nm: 2500,
    spectral_resolution_nm: 3,
    spatial_resolution_m: null,
    manufacturer: '',
    model: ''
  },
  LiDAR: {
    wavelength_nm: 905,
    range_m: 100,
    accuracy_cm: 2,
    manufacturer: '',
    model: ''
  },
  Thermal: {
    spectral_range: '8-14μm',
    resolution_pixels: '',
    accuracy_c: 2,
    manufacturer: '',
    model: ''
  },
  'RGB Camera': {
    resolution_mp: 12,
    focal_length_mm: 24,
    manufacturer: '',
    model: ''
  }
};

// Initialize form with existing instrument data
watch(() => props.instrument, (instrument) => {
  if (instrument) {
    form.value = {
      instrument_type: instrument.instrument_type || 'Phenocam',
      display_name: instrument.display_name || '',
      description: instrument.description || '',
      status: instrument.status || 'Active',
      measurement_status: instrument.measurement_status || 'active',
      specifications: instrument.specifications || {}
    };
  }
}, { immediate: true });

// Reset specifications when type changes
watch(() => form.value.instrument_type, (type) => {
  if (!isEdit.value) {
    form.value.specifications = { ...specificationTemplates[type] };
  }
});

// Computed values
const selectedTypeConfig = computed(() => {
  return instrumentTypes.find(t => t.value === form.value.instrument_type);
});

const previewName = computed(() => {
  const code = selectedTypeConfig.value?.code || 'XXX';
  return `${props.platformName}_${code}##`;
});

// Validation
const isValid = computed(() => {
  return !!form.value.instrument_type;
});

function handleSubmit() {
  if (!isValid.value) return;

  const data = {
    platform_id: props.platformId,
    instrument_type: form.value.instrument_type,
    display_name: form.value.display_name || undefined,
    description: form.value.description || undefined,
    status: form.value.status,
    specifications: form.value.specifications
  };

  emit('submit', data);
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Instrument Type Selection -->
    <div class="form-control" v-if="!isEdit">
      <label class="label">
        <span class="label-text font-medium">Instrument Type *</span>
      </label>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <label
          v-for="type in instrumentTypes"
          :key="type.value"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm"
          :class="form.instrument_type === type.value ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'"
        >
          <input
            type="radio"
            v-model="form.instrument_type"
            :value="type.value"
            class="radio radio-primary radio-sm"
          />
          <span>{{ type.icon }}</span>
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
    </div>

    <!-- Status Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Status</span>
        </label>
        <select v-model="form.status" class="select select-bordered w-full">
          <option v-for="status in statusOptions" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Measurement Status</span>
        </label>
        <select v-model="form.measurement_status" class="select select-bordered w-full">
          <option v-for="status in measurementStatusOptions" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </div>
    </div>

    <!-- Type-Specific Specifications -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">{{ selectedTypeConfig?.label }} Specifications</span>
      </label>
      <div class="bg-base-200 p-4 rounded-lg space-y-4">
        <!-- Phenocam Specs -->
        <template v-if="form.instrument_type === 'Phenocam'">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Camera Brand</span></label>
              <input v-model="form.specifications.camera_brand" type="text" class="input input-bordered input-sm" placeholder="e.g., NetCam" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Camera Model</span></label>
              <input v-model="form.specifications.camera_model" type="text" class="input input-bordered input-sm" placeholder="e.g., SC5" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Resolution</span></label>
              <input v-model="form.specifications.resolution" type="text" class="input input-bordered input-sm" placeholder="e.g., 2592x1944" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Interval (min)</span></label>
              <input v-model.number="form.specifications.interval_minutes" type="number" class="input input-bordered input-sm" />
            </div>
          </div>
        </template>

        <!-- Multispectral Specs -->
        <template v-if="form.instrument_type === 'Multispectral'">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Number of Channels</span></label>
              <input v-model.number="form.specifications.number_of_channels" type="number" class="input input-bordered input-sm" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Spectral Range</span></label>
              <input v-model="form.specifications.spectral_range" type="text" class="input input-bordered input-sm" placeholder="e.g., 400-900nm" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Orientation</span></label>
              <select v-model="form.specifications.orientation" class="select select-bordered select-sm">
                <option value="upward">Upward</option>
                <option value="downward">Downward</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Datalogger</span></label>
              <input v-model="form.specifications.datalogger" type="text" class="input input-bordered input-sm" placeholder="e.g., CR1000" />
            </div>
          </div>
        </template>

        <!-- Generic specs for other types -->
        <template v-if="!['Phenocam', 'Multispectral'].includes(form.instrument_type)">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control" v-for="(value, key) in form.specifications" :key="key">
              <label class="label">
                <span class="label-text">{{ key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }}</span>
              </label>
              <input
                v-model="form.specifications[key]"
                :type="typeof value === 'number' ? 'number' : 'text'"
                class="input input-bordered input-sm"
              />
            </div>
          </div>
        </template>
      </div>
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
          <input v-model="form.display_name" type="text" class="input input-bordered" placeholder="Human-readable name" />
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">Description</span></label>
          <textarea v-model="form.description" class="textarea textarea-bordered" rows="2" placeholder="Instrument description..."></textarea>
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
