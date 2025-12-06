<script setup>
/**
 * Satellite Platform Details Component
 *
 * Type-specific details for satellite platforms.
 * Shows: agency, satellite, sensor
 * Does NOT show: ecosystem, coordinates, height, mounting structure
 *
 * @module components/cards/platform/SatellitePlatformDetails
 */
import { computed } from 'vue';

const props = defineProps({
  platform: {
    type: Object,
    required: true
  }
});

// Parse agency, satellite, and sensor from normalized_name if not in separate fields
// Satellite naming: {STATION}_{AGENCY}_{SATELLITE}_{SENSOR}
const parsedInfo = computed(() => {
  const name = props.platform.normalized_name || '';
  const parts = name.split('_');

  // If we have separate fields, use them
  if (props.platform.agency && props.platform.satellite) {
    return {
      agency: props.platform.agency,
      satellite: props.platform.satellite,
      sensor: props.platform.sensor
    };
  }

  // Otherwise parse from normalized_name
  // Format: STATION_AGENCY_SATELLITE_SENSOR
  if (parts.length >= 4) {
    return {
      agency: parts[1],
      satellite: parts[2],
      sensor: parts[3]
    };
  }

  return {
    agency: null,
    satellite: null,
    sensor: null
  };
});

// Space agency info
const agencyInfo = {
  ESA: {
    name: 'European Space Agency',
    shortName: 'ESA',
    color: 'text-blue-500',
    missions: ['Sentinel-1', 'Sentinel-2', 'Sentinel-3']
  },
  NASA: {
    name: 'National Aeronautics and Space Administration',
    shortName: 'NASA',
    color: 'text-red-500',
    missions: ['Landsat', 'MODIS']
  },
  JAXA: {
    name: 'Japan Aerospace Exploration Agency',
    shortName: 'JAXA',
    color: 'text-purple-500',
    missions: ['ALOS']
  },
  ISRO: {
    name: 'Indian Space Research Organisation',
    shortName: 'ISRO',
    color: 'text-orange-500',
    missions: ['ResourceSat']
  },
  CSA: {
    name: 'Canadian Space Agency',
    shortName: 'CSA',
    color: 'text-red-400',
    missions: ['RADARSAT']
  }
};

// Satellite/sensor info for display
const satelliteInfo = {
  S2A: { name: 'Sentinel-2A', type: 'Optical', resolution: '10m' },
  S2B: { name: 'Sentinel-2B', type: 'Optical', resolution: '10m' },
  S3A: { name: 'Sentinel-3A', type: 'Ocean/Land', resolution: '300m' },
  S3B: { name: 'Sentinel-3B', type: 'Ocean/Land', resolution: '300m' },
  S1A: { name: 'Sentinel-1A', type: 'SAR', resolution: '5m' },
  S1B: { name: 'Sentinel-1B', type: 'SAR', resolution: '5m' },
  L8: { name: 'Landsat 8', type: 'Optical', resolution: '30m' },
  L9: { name: 'Landsat 9', type: 'Optical', resolution: '30m' }
};

const sensorInfo = {
  MSI: { name: 'MultiSpectral Instrument', bands: 13 },
  OLCI: { name: 'Ocean and Land Colour Instrument', bands: 21 },
  SLSTR: { name: 'Sea and Land Surface Temperature Radiometer', bands: 11 },
  SAR: { name: 'Synthetic Aperture Radar', bands: 1 },
  OLI: { name: 'Operational Land Imager', bands: 9 },
  TIRS: { name: 'Thermal Infrared Sensor', bands: 2 }
};

const getAgencyDisplay = (agency) => {
  return agencyInfo[agency] || { name: agency, shortName: agency, color: 'text-base-content' };
};

const getSatelliteDisplay = (sat) => {
  return satelliteInfo[sat] || { name: sat };
};

const getSensorDisplay = (sensor) => {
  return sensorInfo[sensor] || { name: sensor };
};
</script>

<template>
  <div class="grid grid-cols-3 gap-3 text-sm">
    <!-- Agency -->
    <div v-if="parsedInfo.agency">
      <span class="text-xs text-base-content/50 block">Agency</span>
      <div
        class="tooltip tooltip-bottom"
        :data-tip="getAgencyDisplay(parsedInfo.agency).name"
      >
        <span
          class="font-bold mt-0.5 block cursor-help"
          :class="getAgencyDisplay(parsedInfo.agency).color"
        >
          {{ getAgencyDisplay(parsedInfo.agency).shortName }}
        </span>
      </div>
    </div>

    <!-- Satellite -->
    <div v-if="parsedInfo.satellite">
      <span class="text-xs text-base-content/50 block">Satellite</span>
      <div class="mt-0.5">
        <span class="font-semibold">{{ parsedInfo.satellite }}</span>
        <span
          v-if="getSatelliteDisplay(parsedInfo.satellite).resolution"
          class="text-xs text-base-content/60 ml-1"
        >
          ({{ getSatelliteDisplay(parsedInfo.satellite).resolution }})
        </span>
      </div>
    </div>

    <!-- Sensor -->
    <div v-if="parsedInfo.sensor">
      <span class="text-xs text-base-content/50 block">Sensor</span>
      <div
        class="tooltip tooltip-bottom"
        :data-tip="getSensorDisplay(parsedInfo.sensor).name"
      >
        <span class="badge badge-sm badge-accent badge-outline font-mono mt-0.5 cursor-help">
          {{ parsedInfo.sensor }}
        </span>
      </div>
    </div>

    <!-- Satellite info row -->
    <div
      v-if="getSatelliteDisplay(parsedInfo.satellite).type"
      class="col-span-3"
    >
      <div class="flex items-center gap-2 text-xs text-base-content/60 mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>
          {{ getSatelliteDisplay(parsedInfo.satellite).type }} sensor
          <span v-if="getSensorDisplay(parsedInfo.sensor).bands">
            with {{ getSensorDisplay(parsedInfo.sensor).bands }} bands
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
