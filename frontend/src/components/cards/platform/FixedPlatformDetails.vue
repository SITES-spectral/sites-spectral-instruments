<script setup>
/**
 * Fixed Platform Details Component
 *
 * Type-specific details for fixed platforms.
 * Shows: ecosystem, mount type (PL/BL/GL), height, mounting structure
 *
 * @module components/cards/platform/FixedPlatformDetails
 */
import { computed } from 'vue';
import { getMountTypeInfo, getEcosystemInfo } from '@composables/useTypeRegistry';

const props = defineProps({
  platform: {
    type: Object,
    required: true
  }
});

// Mount type information
const mountInfo = computed(() => {
  const code = props.platform.mount_type_code || props.platform.location_code;
  return getMountTypeInfo(code);
});

// Ecosystem information
const ecosystemInfo = computed(() => {
  return getEcosystemInfo(props.platform.ecosystem_code);
});

// Format height display
const heightDisplay = computed(() => {
  const height = props.platform.platform_height_m;
  if (height === null || height === undefined) return null;
  return `${height}m`;
});
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
    <!-- Ecosystem -->
    <div v-if="platform.ecosystem_code">
      <span class="text-xs text-base-content/50 block">Ecosystem</span>
      <div class="flex items-center gap-1.5 mt-0.5">
        <span class="font-semibold">{{ platform.ecosystem_code }}</span>
        <span
          v-if="ecosystemInfo"
          class="text-xs text-base-content/60"
        >
          {{ ecosystemInfo.name }}
        </span>
      </div>
    </div>

    <!-- Mount Type -->
    <div v-if="mountInfo">
      <span class="text-xs text-base-content/50 block">Mount Type</span>
      <div
        class="tooltip tooltip-bottom"
        :data-tip="mountInfo.description"
      >
        <div class="flex items-center gap-1.5 mt-0.5 cursor-help">
          <span class="badge badge-sm badge-outline font-mono">
            {{ platform.mount_type_code || platform.location_code }}
          </span>
          <span class="text-xs text-base-content/60">
            {{ mountInfo.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Height -->
    <div v-if="heightDisplay">
      <span class="text-xs text-base-content/50 block">Height</span>
      <span class="font-medium mt-0.5 block">{{ heightDisplay }}</span>
    </div>

    <!-- Mounting Structure -->
    <div v-if="platform.mounting_structure" class="col-span-2 sm:col-span-3">
      <span class="text-xs text-base-content/50 block">Mounting Structure</span>
      <span class="text-sm mt-0.5 block">{{ platform.mounting_structure }}</span>
    </div>

    <!-- Coordinates -->
    <div v-if="platform.latitude && platform.longitude" class="col-span-2 sm:col-span-3">
      <span class="text-xs text-base-content/50 block">Location</span>
      <span class="font-mono text-xs mt-0.5 block">
        {{ Number(platform.latitude).toFixed(6) }}°N, {{ Number(platform.longitude).toFixed(6) }}°E
      </span>
    </div>
  </div>
</template>
