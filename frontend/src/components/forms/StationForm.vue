<script setup>
/**
 * Station Form
 *
 * Form for creating/editing stations.
 * Fields based on Station entity.
 */
import { computed, ref, watch } from 'vue';

const props = defineProps({
  station: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

// Form data
const form = ref({
  acronym: '',
  display_name: '',
  description: '',
  latitude: '',
  longitude: '',
  website_url: '',
  status: 'Active'
});

// Status options
const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Decommissioned'];

// Initialize form when station prop changes
watch(() => props.station, (station) => {
  if (station) {
    form.value = {
      acronym: station.acronym || '',
      display_name: station.display_name || '',
      description: station.description || '',
      latitude: station.latitude ?? '',
      longitude: station.longitude ?? '',
      website_url: station.website_url || '',
      status: station.status || 'Active'
    };
  } else {
    resetForm();
  }
}, { immediate: true });

// Computed for edit vs create mode
const isEditMode = computed(() => !!props.station?.id);

// Form title
const formTitle = computed(() =>
  isEditMode.value ? 'Edit Station' : 'Create Station'
);

// Validation
const errors = ref({});

function validateForm() {
  errors.value = {};

  // Acronym validation
  if (!form.value.acronym) {
    errors.value.acronym = 'Acronym is required';
  } else if (!/^[A-Z]{2,10}$/.test(form.value.acronym)) {
    errors.value.acronym = 'Acronym must be 2-10 uppercase letters';
  }

  // Display name validation
  if (!form.value.display_name) {
    errors.value.display_name = 'Display name is required';
  }

  // Latitude validation
  const lat = parseFloat(form.value.latitude);
  if (isNaN(lat)) {
    errors.value.latitude = 'Latitude is required';
  } else if (lat < -90 || lat > 90) {
    errors.value.latitude = 'Latitude must be between -90 and 90';
  }

  // Longitude validation
  const lon = parseFloat(form.value.longitude);
  if (isNaN(lon)) {
    errors.value.longitude = 'Longitude is required';
  } else if (lon < -180 || lon > 180) {
    errors.value.longitude = 'Longitude must be between -180 and 180';
  }

  return Object.keys(errors.value).length === 0;
}

function handleSubmit() {
  if (!validateForm()) return;

  emit('submit', {
    ...form.value,
    latitude: parseFloat(form.value.latitude),
    longitude: parseFloat(form.value.longitude)
  });
}

function handleCancel() {
  emit('cancel');
}

function resetForm() {
  form.value = {
    acronym: '',
    display_name: '',
    description: '',
    latitude: '',
    longitude: '',
    website_url: '',
    status: 'Active'
  };
  errors.value = {};
}

// Auto-uppercase acronym
function handleAcronymInput(event) {
  form.value.acronym = event.target.value.toUpperCase();
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Basic Information -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium border-b border-base-200 pb-2">
        Basic Information
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Acronym -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Acronym *</span>
          </label>
          <input
            type="text"
            v-model="form.acronym"
            @input="handleAcronymInput"
            class="input input-bordered"
            :class="{ 'input-error': errors.acronym }"
            placeholder="SVB"
            maxlength="10"
            :disabled="isEditMode"
          />
          <label v-if="errors.acronym" class="label">
            <span class="label-text-alt text-error">{{ errors.acronym }}</span>
          </label>
          <label v-else-if="isEditMode" class="label">
            <span class="label-text-alt text-base-content/50">Cannot change acronym</span>
          </label>
        </div>

        <!-- Display Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Display Name *</span>
          </label>
          <input
            type="text"
            v-model="form.display_name"
            class="input input-bordered"
            :class="{ 'input-error': errors.display_name }"
            placeholder="Svartberget Research Station"
          />
          <label v-if="errors.display_name" class="label">
            <span class="label-text-alt text-error">{{ errors.display_name }}</span>
          </label>
        </div>
      </div>

      <!-- Description -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Description</span>
        </label>
        <textarea
          v-model="form.description"
          class="textarea textarea-bordered h-24"
          placeholder="Station description..."
        ></textarea>
      </div>
    </div>

    <!-- Location -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium border-b border-base-200 pb-2">
        Location
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Latitude -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Latitude *</span>
          </label>
          <input
            type="number"
            v-model="form.latitude"
            class="input input-bordered"
            :class="{ 'input-error': errors.latitude }"
            step="0.000001"
            min="-90"
            max="90"
            placeholder="64.256111"
          />
          <label v-if="errors.latitude" class="label">
            <span class="label-text-alt text-error">{{ errors.latitude }}</span>
          </label>
        </div>

        <!-- Longitude -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Longitude *</span>
          </label>
          <input
            type="number"
            v-model="form.longitude"
            class="input input-bordered"
            :class="{ 'input-error': errors.longitude }"
            step="0.000001"
            min="-180"
            max="180"
            placeholder="19.774722"
          />
          <label v-if="errors.longitude" class="label">
            <span class="label-text-alt text-error">{{ errors.longitude }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Additional Information -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium border-b border-base-200 pb-2">
        Additional Information
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Website URL -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Website URL</span>
          </label>
          <input
            type="url"
            v-model="form.website_url"
            class="input input-bordered"
            placeholder="https://example.com"
          />
        </div>

        <!-- Status -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Status</span>
          </label>
          <select v-model="form.status" class="select select-bordered">
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-base-200">
      <button
        type="button"
        class="btn btn-ghost"
        @click="handleCancel"
        :disabled="loading"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="loading"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ isEditMode ? 'Save Changes' : 'Create Station' }}
      </button>
    </div>
  </form>
</template>
