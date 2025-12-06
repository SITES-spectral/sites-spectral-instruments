<script setup>
/**
 * UAV Platform Details Component
 *
 * Type-specific details for UAV platforms.
 * Shows: vendor, model, position ID
 * Does NOT show: ecosystem, platform height, mounting structure
 *
 * @module components/cards/platform/UAVPlatformDetails
 */
import { computed } from 'vue';

const props = defineProps({
  platform: {
    type: Object,
    required: true
  }
});

// Parse vendor and model from normalized_name if not in separate fields
// UAV naming: {STATION}_{VENDOR}_{MODEL}_{UAV##}
const parsedInfo = computed(() => {
  const name = props.platform.normalized_name || '';
  const parts = name.split('_');

  // If we have separate fields, use them
  if (props.platform.vendor && props.platform.model) {
    return {
      vendor: props.platform.vendor,
      model: props.platform.model,
      positionId: props.platform.mount_type_code || props.platform.location_code
    };
  }

  // Otherwise parse from normalized_name
  // Format: STATION_VENDOR_MODEL_UAV##
  if (parts.length >= 4) {
    return {
      vendor: parts[1],
      model: parts[2],
      positionId: parts[3]
    };
  }

  return {
    vendor: props.platform.vendor || null,
    model: props.platform.model || null,
    positionId: props.platform.mount_type_code || props.platform.location_code
  };
});

// Known UAV vendors with display info
const vendorInfo = {
  DJI: { name: 'DJI', color: 'text-orange-500' },
  MicaSense: { name: 'MicaSense', color: 'text-green-500' },
  Parrot: { name: 'Parrot', color: 'text-blue-500' },
  Headwall: { name: 'Headwall', color: 'text-purple-500' },
  senseFly: { name: 'senseFly', color: 'text-red-500' }
};

const getVendorDisplay = (vendor) => {
  return vendorInfo[vendor] || { name: vendor, color: 'text-base-content' };
};
</script>

<template>
  <div class="grid grid-cols-3 gap-3 text-sm">
    <!-- Vendor -->
    <div v-if="parsedInfo.vendor">
      <span class="text-xs text-base-content/50 block">Vendor</span>
      <span
        class="font-semibold mt-0.5 block"
        :class="getVendorDisplay(parsedInfo.vendor).color"
      >
        {{ getVendorDisplay(parsedInfo.vendor).name }}
      </span>
    </div>

    <!-- Model -->
    <div v-if="parsedInfo.model">
      <span class="text-xs text-base-content/50 block">Model</span>
      <span class="font-semibold mt-0.5 block">{{ parsedInfo.model }}</span>
    </div>

    <!-- Position ID -->
    <div v-if="parsedInfo.positionId">
      <span class="text-xs text-base-content/50 block">Position</span>
      <span class="badge badge-sm badge-warning badge-outline font-mono mt-0.5">
        {{ parsedInfo.positionId }}
      </span>
    </div>

    <!-- Auto-instruments indicator -->
    <div class="col-span-3">
      <div class="flex items-center gap-2 text-xs text-base-content/60 mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>Instruments auto-created based on UAV model</span>
      </div>
    </div>
  </div>
</template>
