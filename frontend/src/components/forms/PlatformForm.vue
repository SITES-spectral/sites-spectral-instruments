<script setup>
/**
 * Platform Form Component
 *
 * Registry-driven form for creating/editing platforms.
 * Uses type-specific field components from TypeRegistry.
 *
 * SOLID Compliance:
 * - Open/Closed: Add new platform types by creating new field components
 * - Single Responsibility: Each field component handles one platform type
 * - Dependency Inversion: Depends on abstractions (TypeRegistry) not concretions
 *
 * @module components/forms/PlatformForm
 */
import { ref, computed, watch, shallowRef, markRaw } from 'vue';
import { PLATFORM_TYPE_STRATEGIES } from '@composables/useTypeRegistry';
import FixedPlatformFields from './platform/FixedPlatformFields.vue';
import UAVPlatformFields from './platform/UAVPlatformFields.vue';
import SatellitePlatformFields from './platform/SatellitePlatformFields.vue';

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

// Platform type component mapping (Strategy Pattern)
const platformFieldComponents = {
  fixed: markRaw(FixedPlatformFields),
  uav: markRaw(UAVPlatformFields),
  satellite: markRaw(SatellitePlatformFields)
};

// SVG paths for platform type icons (Lucide-style)
const platformIconPaths = {
  // Tower/observation - fixed platform default
  'tower-observation': [
    'M12 2v20',        // Vertical pole
    'M8 22h8',         // Base
    'M8 4l4 8 4-8',    // Tower structure (inverted V)
    'M6 12h12',        // Platform/observation deck
    'M9 12v4h6v-4'     // Cabin/housing
  ],
  // Drone/UAV - quadcopter style
  'drone': [
    'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
    'M12 2v4', 'M12 18v4',
    'M4.93 4.93l2.83 2.83', 'M16.24 16.24l2.83 2.83',
    'M2 12h4', 'M18 12h4',
    'M4.93 19.07l2.83-2.83', 'M16.24 7.76l2.83-2.83'
  ],
  // Satellite - orbital satellite with solar panels
  'satellite': [
    'M13 7L9 3 5 7l4 4',
    'M17 11l4 4-4 4-4-4',
    'M8 12l4 4 4-4-4-4-4 4z',
    'M16 8l3-3',
    'M5 16l3 3'
  ]
};

// Get available platform types from registry
const platformTypes = computed(() => {
  return Object.entries(PLATFORM_TYPE_STRATEGIES).map(([key, config]) => ({
    value: key,
    label: config.name,
    icon: config.icon,
    description: config.description
  }));
});

// Form state
const isEdit = computed(() => !!props.platform);
const selectedType = ref('fixed');
const typeSpecificData = ref({});
const commonData = ref({
  display_name: '',
  description: '',
  latitude: null,
  longitude: null
});

// Current fields component based on selected type
const currentFieldsComponent = computed(() => {
  return platformFieldComponents[selectedType.value] || platformFieldComponents.fixed;
});

// Get current type config from registry
const currentTypeConfig = computed(() => {
  return PLATFORM_TYPE_STRATEGIES[selectedType.value];
});

// Initialize form with existing platform data
watch(() => props.platform, (platform) => {
  if (platform) {
    selectedType.value = platform.platform_type || 'fixed';

    // Initialize common data
    commonData.value = {
      display_name: platform.display_name || '',
      description: platform.description || '',
      latitude: platform.latitude,
      longitude: platform.longitude
    };

    // Initialize type-specific data based on platform type
    initializeTypeSpecificData(platform);
  }
}, { immediate: true });

// Initialize type-specific data from platform
function initializeTypeSpecificData(platform) {
  const type = platform?.platform_type || selectedType.value;
  const strategy = PLATFORM_TYPE_STRATEGIES[type];

  if (!strategy) return;

  const data = {};

  // Extract fields defined in the strategy
  Object.keys(strategy.fields).forEach(fieldKey => {
    if (platform && platform[fieldKey] !== undefined) {
      data[fieldKey] = platform[fieldKey];
    }
  });

  // Handle mount_type_prefix from mount_type_code
  if (type === 'fixed' && platform?.mount_type_code) {
    data.mount_type_prefix = platform.mount_type_code.substring(0, 2);
  }

  typeSpecificData.value = data;
}

// Reset type-specific data when platform type changes
watch(selectedType, (newType, oldType) => {
  if (newType !== oldType && !isEdit.value) {
    // Reset to default values for new type
    const strategy = PLATFORM_TYPE_STRATEGIES[newType];
    const defaults = {};

    Object.entries(strategy.fields).forEach(([key, config]) => {
      defaults[key] = config.defaultValue ?? '';
    });

    typeSpecificData.value = defaults;
  }
});

// Validation - delegate to type strategy
const isValid = computed(() => {
  const strategy = currentTypeConfig.value;
  if (!strategy) return false;

  // Check all required fields have values
  for (const [fieldKey, fieldConfig] of Object.entries(strategy.fields)) {
    if (fieldConfig.required) {
      const value = typeSpecificData.value[fieldKey];
      if (value === undefined || value === null || value === '') {
        return false;
      }
    }
  }

  return true;
});

function handleSubmit() {
  if (!isValid.value) return;

  const data = {
    station_id: props.stationId,
    platform_type: selectedType.value,
    ...commonData.value
  };

  // Add type-specific data
  Object.entries(typeSpecificData.value).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      data[key] = value;
    }
  });

  // Clean up undefined values
  Object.keys(data).forEach(key => {
    if (data[key] === undefined || data[key] === '') {
      delete data[key];
    }
  });

  emit('submit', data);
}

function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Platform Type Selection (only for new platforms) -->
    <div class="form-control" v-if="!isEdit">
      <label class="label">
        <span class="label-text font-medium">Platform Type</span>
      </label>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="type in platformTypes"
          :key="type.value"
          class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors"
          :class="selectedType === type.value ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'"
        >
          <input
            type="radio"
            v-model="selectedType"
            :value="type.value"
            class="radio radio-primary radio-sm"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            :class="selectedType === type.value ? 'text-primary' : 'text-base-content/60'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              v-for="(path, idx) in platformIconPaths[type.icon]"
              :key="idx"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              :d="path"
            />
          </svg>
          <span>{{ type.label }}</span>
        </label>
      </div>
      <label v-if="currentTypeConfig?.description" class="label">
        <span class="label-text-alt text-base-content/60">
          {{ currentTypeConfig.description }}
        </span>
      </label>
    </div>

    <!-- Type-Specific Fields (Dynamic Component) -->
    <component
      :is="currentFieldsComponent"
      v-model="typeSpecificData"
      :station-acronym="stationAcronym"
    />

    <!-- Optional Common Fields -->
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
            v-model="commonData.display_name"
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
            v-model="commonData.description"
            class="textarea textarea-bordered w-full"
            rows="2"
            placeholder="Platform description..."
          ></textarea>
        </div>

        <!-- Coordinates (only for fixed platforms - UAV/Satellite don't have fixed coordinates) -->
        <div v-if="selectedType === 'fixed'" class="grid grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Latitude</span>
            </label>
            <input
              v-model.number="commonData.latitude"
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
              v-model.number="commonData.longitude"
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
