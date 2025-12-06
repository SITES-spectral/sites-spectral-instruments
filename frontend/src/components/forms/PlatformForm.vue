<script setup>
/**
 * Platform Form Component
 *
 * Form for creating/editing platforms.
 * Supports Fixed, UAV, and Satellite platform types.
 */
import { ref, computed, watch } from 'vue';

const props = defineProps({
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
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

// Platform types configuration
const platformTypes = [
  { value: 'fixed', label: 'Fixed Platform', icon: '🗼' },
  { value: 'uav', label: 'UAV Platform', icon: '🚁' },
  { value: 'satellite', label: 'Satellite Platform', icon: '🛰️' }
];

// Mount type codes for fixed platforms
const mountTypeCodes = [
  { value: 'PL', label: 'Pole/Tower/Mast', description: 'Elevated structures (>1.5m)' },
  { value: 'BL', label: 'Building', description: 'Rooftop or facade mounted' },
  { value: 'GL', label: 'Ground Level', description: 'Below 1.5m height' }
];

// Ecosystem codes
const ecosystemCodes = [
  { value: 'FOR', label: 'Forest' },
  { value: 'AGR', label: 'Arable Land' },
  { value: 'MIR', label: 'Mires' },
  { value: 'LAK', label: 'Lake' },
  { value: 'WET', label: 'Wetland' },
  { value: 'MAR', label: 'Marshland' },
  { value: 'GRA', label: 'Grassland' },
  { value: 'HEA', label: 'Heathland' },
  { value: 'ALP', label: 'Alpine' },
  { value: 'CON', label: 'Coniferous' },
  { value: 'DEC', label: 'Deciduous' },
  { value: 'PEA', label: 'Peatland' }
];

// UAV vendors and models
const uavVendors = [
  { value: 'DJI', label: 'DJI', models: ['M3M', 'P4M', 'M30T', 'M300', 'M350'] },
  { value: 'MicaSense', label: 'MicaSense', models: ['RedEdge-MX', 'Altum-PT'] },
  { value: 'Parrot', label: 'Parrot', models: ['Sequoia+'] },
  { value: 'Headwall', label: 'Headwall', models: ['Nano-Hyperspec'] }
];

// Satellite agencies and satellites
const satelliteSpecs = [
  { agency: 'ESA', satellites: [
    { value: 'S2A', label: 'Sentinel-2A', sensors: ['MSI'] },
    { value: 'S2B', label: 'Sentinel-2B', sensors: ['MSI'] },
    { value: 'S3A', label: 'Sentinel-3A', sensors: ['OLCI', 'SLSTR'] },
    { value: 'S3B', label: 'Sentinel-3B', sensors: ['OLCI', 'SLSTR'] }
  ]},
  { agency: 'NASA', satellites: [
    { value: 'LANDSAT8', label: 'Landsat 8', sensors: ['OLI', 'TIRS'] },
    { value: 'LANDSAT9', label: 'Landsat 9', sensors: ['OLI-2', 'TIRS-2'] },
    { value: 'MODIS', label: 'MODIS Terra/Aqua', sensors: ['MODIS'] }
  ]}
];

// Form state
const isEdit = computed(() => !!props.platform);
const form = ref({
  platform_type: 'fixed',
  ecosystem_code: '',
  mount_type_prefix: 'PL',
  display_name: '',
  description: '',
  latitude: null,
  longitude: null,
  // UAV specific
  vendor: '',
  model: '',
  // Satellite specific
  agency: '',
  satellite: '',
  sensor: ''
});

// Initialize form with existing platform data
watch(() => props.platform, (platform) => {
  if (platform) {
    form.value = {
      platform_type: platform.platform_type || 'fixed',
      ecosystem_code: platform.ecosystem_code || '',
      mount_type_prefix: platform.mount_type_code?.substring(0, 2) || 'PL',
      display_name: platform.display_name || '',
      description: platform.description || '',
      latitude: platform.latitude,
      longitude: platform.longitude,
      vendor: platform.vendor || '',
      model: platform.model || '',
      agency: platform.agency || '',
      satellite: platform.satellite || '',
      sensor: platform.sensor || ''
    };
  }
}, { immediate: true });

// Computed values
const availableModels = computed(() => {
  const vendor = uavVendors.find(v => v.value === form.value.vendor);
  return vendor?.models || [];
});

const availableSatellites = computed(() => {
  const agencySpec = satelliteSpecs.find(a => a.agency === form.value.agency);
  return agencySpec?.satellites || [];
});

const availableSensors = computed(() => {
  const satellite = availableSatellites.value.find(s => s.value === form.value.satellite);
  return satellite?.sensors || [];
});

// Preview name
const previewName = computed(() => {
  const station = props.stationAcronym;
  switch (form.value.platform_type) {
    case 'fixed':
      if (!form.value.ecosystem_code) return `${station}_???_${form.value.mount_type_prefix}##`;
      return `${station}_${form.value.ecosystem_code}_${form.value.mount_type_prefix}##`;
    case 'uav':
      if (!form.value.vendor || !form.value.model) return `${station}_???_???_UAV##`;
      return `${station}_${form.value.vendor}_${form.value.model}_UAV##`;
    case 'satellite':
      if (!form.value.agency || !form.value.satellite || !form.value.sensor) return `${station}_???_???_???`;
      return `${station}_${form.value.agency}_${form.value.satellite}_${form.value.sensor}`;
    default:
      return '';
  }
});

// Validation
const isValid = computed(() => {
  switch (form.value.platform_type) {
    case 'fixed':
      return !!form.value.ecosystem_code && !!form.value.mount_type_prefix;
    case 'uav':
      return !!form.value.vendor && !!form.value.model;
    case 'satellite':
      return !!form.value.agency && !!form.value.satellite && !!form.value.sensor;
    default:
      return false;
  }
});

function handleSubmit() {
  if (!isValid.value) return;

  const data = {
    station_id: props.stationId,
    platform_type: form.value.platform_type,
    display_name: form.value.display_name || undefined,
    description: form.value.description || undefined,
    latitude: form.value.latitude || undefined,
    longitude: form.value.longitude || undefined
  };

  // Add type-specific fields
  switch (form.value.platform_type) {
    case 'fixed':
      data.ecosystem_code = form.value.ecosystem_code;
      // Mount type code will be generated by backend
      break;
    case 'uav':
      data.vendor = form.value.vendor;
      data.model = form.value.model;
      break;
    case 'satellite':
      data.agency = form.value.agency;
      data.satellite = form.value.satellite;
      data.sensor = form.value.sensor;
      break;
  }

  emit('submit', data);
}

function handleCancel() {
  emit('cancel');
}

// Reset type-specific fields when platform type changes
watch(() => form.value.platform_type, () => {
  form.value.ecosystem_code = '';
  form.value.vendor = '';
  form.value.model = '';
  form.value.agency = '';
  form.value.satellite = '';
  form.value.sensor = '';
});
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Platform Type Selection -->
    <div class="form-control" v-if="!isEdit">
      <label class="label">
        <span class="label-text font-medium">Platform Type</span>
      </label>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="type in platformTypes"
          :key="type.value"
          class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors"
          :class="form.platform_type === type.value ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'"
        >
          <input
            type="radio"
            v-model="form.platform_type"
            :value="type.value"
            class="radio radio-primary radio-sm"
          />
          <span class="text-xl">{{ type.icon }}</span>
          <span>{{ type.label }}</span>
        </label>
      </div>
    </div>

    <!-- Fixed Platform Fields -->
    <template v-if="form.platform_type === 'fixed'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Ecosystem -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Ecosystem *</span>
          </label>
          <select v-model="form.ecosystem_code" class="select select-bordered w-full" required>
            <option value="">Select ecosystem...</option>
            <option v-for="eco in ecosystemCodes" :key="eco.value" :value="eco.value">
              {{ eco.value }} - {{ eco.label }}
            </option>
          </select>
        </div>

        <!-- Mount Type -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Mount Type *</span>
          </label>
          <select v-model="form.mount_type_prefix" class="select select-bordered w-full" required>
            <option v-for="mt in mountTypeCodes" :key="mt.value" :value="mt.value">
              {{ mt.value }} - {{ mt.label }}
            </option>
          </select>
          <label class="label">
            <span class="label-text-alt">{{ mountTypeCodes.find(m => m.value === form.mount_type_prefix)?.description }}</span>
          </label>
        </div>
      </div>
    </template>

    <!-- UAV Platform Fields -->
    <template v-if="form.platform_type === 'uav'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Vendor -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Vendor *</span>
          </label>
          <select v-model="form.vendor" class="select select-bordered w-full" required>
            <option value="">Select vendor...</option>
            <option v-for="vendor in uavVendors" :key="vendor.value" :value="vendor.value">
              {{ vendor.label }}
            </option>
          </select>
        </div>

        <!-- Model -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Model *</span>
          </label>
          <select v-model="form.model" class="select select-bordered w-full" required :disabled="!form.vendor">
            <option value="">Select model...</option>
            <option v-for="model in availableModels" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
        </div>
      </div>

      <div class="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>UAV instruments will be auto-created based on the selected model.</span>
      </div>
    </template>

    <!-- Satellite Platform Fields -->
    <template v-if="form.platform_type === 'satellite'">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Agency -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Agency *</span>
          </label>
          <select v-model="form.agency" class="select select-bordered w-full" required>
            <option value="">Select agency...</option>
            <option v-for="spec in satelliteSpecs" :key="spec.agency" :value="spec.agency">
              {{ spec.agency }}
            </option>
          </select>
        </div>

        <!-- Satellite -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Satellite *</span>
          </label>
          <select v-model="form.satellite" class="select select-bordered w-full" required :disabled="!form.agency">
            <option value="">Select satellite...</option>
            <option v-for="sat in availableSatellites" :key="sat.value" :value="sat.value">
              {{ sat.label }}
            </option>
          </select>
        </div>

        <!-- Sensor -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Sensor *</span>
          </label>
          <select v-model="form.sensor" class="select select-bordered w-full" required :disabled="!form.satellite">
            <option value="">Select sensor...</option>
            <option v-for="sensor in availableSensors" :key="sensor" :value="sensor">
              {{ sensor }}
            </option>
          </select>
        </div>
      </div>
    </template>

    <!-- Name Preview -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium">Platform Name Preview</span>
      </label>
      <div class="bg-base-200 px-4 py-3 rounded-lg font-mono text-lg">
        {{ previewName }}
      </div>
    </div>

    <!-- Optional Fields -->
    <div class="collapse collapse-arrow bg-base-200">
      <input type="checkbox" />
      <div class="collapse-title font-medium">
        Optional Fields
      </div>
      <div class="collapse-content space-y-4">
        <!-- Display Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Display Name</span>
          </label>
          <input
            v-model="form.display_name"
            type="text"
            class="input input-bordered w-full"
            placeholder="Human-readable name"
          />
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Description</span>
          </label>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered w-full"
            rows="2"
            placeholder="Platform description..."
          ></textarea>
        </div>

        <!-- Coordinates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Latitude</span>
            </label>
            <input
              v-model.number="form.latitude"
              type="number"
              step="0.000001"
              class="input input-bordered w-full"
              placeholder="e.g., 64.256"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Longitude</span>
            </label>
            <input
              v-model.number="form.longitude"
              type="number"
              step="0.000001"
              class="input input-bordered w-full"
              placeholder="e.g., 19.775"
            />
          </div>
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
        {{ isEdit ? 'Update Platform' : 'Create Platform' }}
      </button>
    </div>
  </form>
</template>
