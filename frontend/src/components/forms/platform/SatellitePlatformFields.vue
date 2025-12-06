<script setup>
/**
 * Satellite Platform Fields Component
 *
 * Type-specific form fields for satellite platforms.
 * Uses TypeRegistry for field definitions.
 *
 * Shows: agency, satellite, sensor
 * Does NOT show: ecosystem, coordinates, height, mounting structure, vendor, model
 *
 * @module components/forms/platform/SatellitePlatformFields
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

// Get satellite strategy from registry
const satelliteStrategy = computed(() => PLATFORM_TYPE_STRATEGIES.satellite);

// Agency options
const agencyOptions = computed(() => {
  return satelliteStrategy.value.fields.agency.options.map(a => ({
    value: a,
    label: a
  }));
});

// Satellite options based on selected agency
const satelliteOptions = computed(() => {
  const agency = props.modelValue.agency;
  if (!agency) return [];

  const satellites = satelliteStrategy.value.fields.satellite.optionsByParent[agency] || [];
  return satellites.map(s => ({
    value: s,
    label: s
  }));
});

// Sensor options based on selected satellite
const sensorOptions = computed(() => {
  const satellite = props.modelValue.satellite;
  if (!satellite) return [];

  const sensors = satelliteStrategy.value.fields.sensor.optionsByParent[satellite] || [];
  return sensors.map(s => ({
    value: s,
    label: s
  }));
});

// Preview name
const previewName = computed(() => {
  const station = props.stationAcronym;
  const agency = props.modelValue.agency || '???';
  const satellite = props.modelValue.satellite || '???';
  const sensor = props.modelValue.sensor || '???';
  return `${station}_${agency}_${satellite}_${sensor}`;
});

// Update field
function updateField(field, value) {
  const update = { ...props.modelValue, [field]: value };

  // Reset dependent fields
  if (field === 'agency') {
    update.satellite = '';
    update.sensor = '';
  }
  if (field === 'satellite') {
    update.sensor = '';
  }

  emit('update:modelValue', update);
}

// Satellite info for display
const satelliteInfo = {
  S2A: { name: 'Sentinel-2A', launch: '2015', orbit: 'Sun-synchronous' },
  S2B: { name: 'Sentinel-2B', launch: '2017', orbit: 'Sun-synchronous' },
  S3A: { name: 'Sentinel-3A', launch: '2016', orbit: 'Sun-synchronous' },
  S3B: { name: 'Sentinel-3B', launch: '2018', orbit: 'Sun-synchronous' },
  S1A: { name: 'Sentinel-1A', launch: '2014', orbit: 'Sun-synchronous' },
  S1B: { name: 'Sentinel-1B', launch: '2016', orbit: 'Sun-synchronous' },
  L8: { name: 'Landsat 8', launch: '2013', orbit: 'Sun-synchronous' },
  L9: { name: 'Landsat 9', launch: '2021', orbit: 'Sun-synchronous' }
};

const selectedSatelliteInfo = computed(() => {
  return satelliteInfo[props.modelValue.satellite] || null;
});

const sensorInfo = {
  MSI: { name: 'MultiSpectral Instrument', bands: 13, resolution: '10-60m' },
  OLCI: { name: 'Ocean and Land Colour Instrument', bands: 21, resolution: '300m' },
  SLSTR: { name: 'Sea and Land Surface Temperature Radiometer', bands: 11, resolution: '500m-1km' },
  SAR: { name: 'Synthetic Aperture Radar', bands: 'C-band', resolution: '5-40m' },
  OLI: { name: 'Operational Land Imager', bands: 9, resolution: '15-30m' },
  TIRS: { name: 'Thermal Infrared Sensor', bands: 2, resolution: '100m' }
};

const selectedSensorInfo = computed(() => {
  return sensorInfo[props.modelValue.sensor] || null;
});
</script>

<template>
  <div class="space-y-4">
    <!-- Agency, Satellite, Sensor -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Agency -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Space Agency <span class="text-error">*</span></span>
        </label>
        <select
          :value="modelValue.agency"
          @change="updateField('agency', $event.target.value)"
          class="select select-bordered w-full"
          required
        >
          <option value="">Select agency...</option>
          <option
            v-for="agency in agencyOptions"
            :key="agency.value"
            :value="agency.value"
          >
            {{ agency.label }}
          </option>
        </select>
      </div>

      <!-- Satellite -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Satellite <span class="text-error">*</span></span>
        </label>
        <select
          :value="modelValue.satellite"
          @change="updateField('satellite', $event.target.value)"
          class="select select-bordered w-full"
          required
          :disabled="!modelValue.agency"
        >
          <option value="">Select satellite...</option>
          <option
            v-for="sat in satelliteOptions"
            :key="sat.value"
            :value="sat.value"
          >
            {{ sat.label }}
          </option>
        </select>
      </div>

      <!-- Sensor -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Sensor <span class="text-error">*</span></span>
        </label>
        <select
          :value="modelValue.sensor"
          @change="updateField('sensor', $event.target.value)"
          class="select select-bordered w-full"
          required
          :disabled="!modelValue.satellite"
        >
          <option value="">Select sensor...</option>
          <option
            v-for="sensor in sensorOptions"
            :key="sensor.value"
            :value="sensor.value"
          >
            {{ sensor.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Satellite/Sensor Info -->
    <div v-if="selectedSatelliteInfo || selectedSensorInfo" class="bg-base-200 p-4 rounded-lg">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <!-- Satellite Info -->
        <div v-if="selectedSatelliteInfo">
          <div class="font-medium text-accent mb-1">{{ selectedSatelliteInfo.name }}</div>
          <div class="text-base-content/60">
            Launch: {{ selectedSatelliteInfo.launch }} | {{ selectedSatelliteInfo.orbit }}
          </div>
        </div>

        <!-- Sensor Info -->
        <div v-if="selectedSensorInfo">
          <div class="font-medium text-secondary mb-1">{{ selectedSensorInfo.name }}</div>
          <div class="text-base-content/60">
            {{ selectedSensorInfo.bands }} bands | {{ selectedSensorInfo.resolution }}
          </div>
        </div>
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
          Format: {STATION}_{AGENCY}_{SATELLITE}_{SENSOR}
        </span>
      </label>
    </div>

    <!-- Note about virtual platform -->
    <div class="alert">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Satellite platforms are virtual - they represent satellite data coverage over the station area.</span>
    </div>
  </div>
</template>
