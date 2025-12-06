<script setup>
/**
 * Instrument View
 *
 * Displays full instrument details with all specifications.
 * Supports edit/delete operations.
 * Placeholder for ROI management (future).
 *
 * Type-aware: Shows all fields defined in InstrumentTypeRegistry.
 */
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useInstrumentsStore } from '@stores/instruments';
import { usePlatformsStore } from '@stores/platforms';
import { useAuthStore } from '@stores/auth';
import { useNotifications } from '@composables/useNotifications';
import {
  getInstrumentTypeConfig,
  getInstrumentFields,
  formatFieldValue
} from '@composables/useTypeRegistry';
import { getStatus, getMeasurementStatus } from '@composables/useTypes';
import { InstrumentFormModal, ConfirmModal } from '@components/modals';

const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  }
});

const router = useRouter();
const instrumentsStore = useInstrumentsStore();
const platformsStore = usePlatformsStore();
const authStore = useAuthStore();
const notifications = useNotifications();

// Current instrument
const instrument = computed(() => instrumentsStore.currentInstrument);

// Related platform
const platform = computed(() => platformsStore.currentPlatform);

// Type configuration from registry
const typeConfig = computed(() => {
  return instrument.value
    ? getInstrumentTypeConfig(instrument.value.instrument_type)
    : null;
});

// All fields from registry
const allFields = computed(() => {
  return instrument.value
    ? getInstrumentFields(instrument.value.instrument_type)
    : {};
});

// Specifications (parsed if needed)
const specifications = computed(() => {
  if (!instrument.value) return {};

  const specs = instrument.value.specifications;
  if (specs && typeof specs === 'object') {
    return specs;
  }
  if (typeof specs === 'string') {
    try {
      return JSON.parse(specs);
    } catch {
      return {};
    }
  }
  return {};
});

// Fields with values for display
const fieldsToDisplay = computed(() => {
  if (!allFields.value) return [];

  return Object.entries(allFields.value).map(([key, config]) => {
    const value = specifications.value[key] ?? instrument.value?.[key];
    return {
      key,
      label: config.label,
      value,
      config,
      hasValue: value !== null && value !== undefined && value !== ''
    };
  });
});

// Status configurations
const statusConfig = computed(() =>
  instrument.value ? getStatus(instrument.value.status) : null
);

const measurementConfig = computed(() =>
  instrument.value ? getMeasurementStatus(instrument.value.measurement_status) : null
);

// Can user edit?
const canEdit = computed(() => {
  if (!platform.value) return false;
  return authStore.canEditStation(platform.value.station_id);
});

// Loading state
const isLoading = computed(() =>
  instrumentsStore.loading || platformsStore.loading
);

// Modal states
const showEditModal = ref(false);
const showDeleteModal = ref(false);

// Load instrument and related platform
async function loadData() {
  const instrumentId = parseInt(props.id);
  const instrumentData = await instrumentsStore.fetchInstrument(instrumentId);
  if (instrumentData) {
    await platformsStore.fetchPlatform(instrumentData.platform_id);
  }
}

// Load on mount and when ID changes
onMounted(loadData);
watch(() => props.id, loadData);

// Edit handler
function openEditModal() {
  showEditModal.value = true;
}

async function handleEditSubmit(formData) {
  const result = await instrumentsStore.updateInstrument(instrument.value.id, formData);
  if (result) {
    notifications.success('Instrument updated successfully');
    showEditModal.value = false;
  } else {
    notifications.error(instrumentsStore.error || 'Failed to update instrument');
  }
}

// Delete handler
function openDeleteModal() {
  showDeleteModal.value = true;
}

async function handleDelete() {
  const platformId = instrument.value.platform_id;
  const success = await instrumentsStore.deleteInstrument(instrument.value.id);
  if (success) {
    notifications.success('Instrument deleted successfully');
    showDeleteModal.value = false;
    // Navigate back to platform
    router.push({ name: 'platform', params: { id: platformId } });
  } else {
    notifications.error(instrumentsStore.error || 'Failed to delete instrument');
  }
}

// Type color classes
const typeColorClass = computed(() => {
  if (!typeConfig.value) return 'text-gray-500';

  const colors = {
    phenocam: 'text-blue-500',
    multispectral: 'text-purple-500',
    par_sensor: 'text-amber-500',
    ndvi_sensor: 'text-green-500',
    pri_sensor: 'text-cyan-500',
    hyperspectral: 'text-pink-500',
    thermal: 'text-red-500',
    lidar: 'text-teal-500',
    radar: 'text-indigo-500'
  };

  return colors[typeConfig.value.key] || 'text-gray-500';
});

const typeBgClass = computed(() => {
  if (!typeConfig.value) return 'bg-gray-500/10';

  const colors = {
    phenocam: 'bg-blue-500/10',
    multispectral: 'bg-purple-500/10',
    par_sensor: 'bg-amber-500/10',
    ndvi_sensor: 'bg-green-500/10',
    pri_sensor: 'bg-cyan-500/10',
    hyperspectral: 'bg-pink-500/10',
    thermal: 'bg-red-500/10',
    lidar: 'bg-teal-500/10',
    radar: 'bg-indigo-500/10'
  };

  return colors[typeConfig.value.key] || 'bg-gray-500/10';
});
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading && !instrument" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error state -->
    <div v-else-if="instrumentsStore.error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ instrumentsStore.error }}</span>
    </div>

    <!-- Instrument content -->
    <div v-else-if="instrument">
      <!-- Breadcrumb -->
      <div class="text-sm breadcrumbs mb-4">
        <ul>
          <li>
            <router-link to="/dashboard">Dashboard</router-link>
          </li>
          <li v-if="platform">
            <router-link :to="`/stations/${platform.station_acronym}`">
              {{ platform.station_acronym }}
            </router-link>
          </li>
          <li v-if="platform">
            <router-link :to="`/platforms/${platform.id}`">
              {{ platform.normalized_name }}
            </router-link>
          </li>
          <li>{{ instrument.normalized_name }}</li>
        </ul>
      </div>

      <!-- Instrument Header -->
      <div class="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <!-- Type Icon -->
            <div :class="['p-4 rounded-lg', typeBgClass]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                :class="['h-8 w-8', typeColorClass]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            <!-- Names and Info -->
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold">
                  {{ instrument.display_name || instrument.normalized_name }}
                </h1>
                <span :class="['badge', statusConfig?.badgeClass]">
                  {{ instrument.status }}
                </span>
              </div>
              <code class="text-sm text-base-content/60 font-mono block mt-1">
                {{ instrument.normalized_name }}
              </code>
              <div class="flex items-center gap-4 mt-2">
                <!-- Type -->
                <span :class="['font-medium', typeColorClass]">
                  {{ typeConfig?.name || instrument.instrument_type }}
                  <span v-if="typeConfig?.code" class="text-base-content/50 ml-1">
                    ({{ typeConfig.code }})
                  </span>
                </span>

                <!-- Measurement Status -->
                <span v-if="measurementConfig" :class="[measurementConfig.textClass, 'flex items-center gap-1']">
                  <span :class="['w-2 h-2 rounded-full', measurementConfig.dotClass]"></span>
                  {{ instrument.measurement_status }}
                </span>
              </div>
              <p v-if="instrument.description" class="text-base-content/60 mt-2">
                {{ instrument.description }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="canEdit" class="flex gap-2">
            <button class="btn btn-outline btn-sm" @click="openEditModal">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button class="btn btn-outline btn-error btn-sm" @click="openDeleteModal">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Specifications Section -->
      <div class="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">
          {{ typeConfig?.name || 'Instrument' }} Specifications
        </h2>

        <div v-if="fieldsToDisplay.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="field in fieldsToDisplay"
            :key="field.key"
            class="space-y-1"
          >
            <label class="text-sm text-base-content/60">{{ field.label }}</label>
            <div class="font-medium" :class="{ 'text-base-content/40 italic': !field.hasValue }">
              {{ field.hasValue ? formatFieldValue(field.value, field.config) : 'Not specified' }}
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-base-content/60">
          <p>No specifications defined for this instrument type.</p>
        </div>
      </div>

      <!-- Timeline / Deployment Info -->
      <div v-if="instrument.deployment_date || instrument.calibration_date" class="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Timeline</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-if="instrument.deployment_date">
            <label class="text-sm text-base-content/60">Deployment Date</label>
            <div class="font-medium">
              {{ new Date(instrument.deployment_date).toLocaleDateString() }}
            </div>
          </div>
          <div v-if="instrument.calibration_date">
            <label class="text-sm text-base-content/60">Last Calibration</label>
            <div class="font-medium">
              {{ new Date(instrument.calibration_date).toLocaleDateString() }}
            </div>
          </div>
          <div v-if="instrument.created_at">
            <label class="text-sm text-base-content/60">Added to System</label>
            <div class="font-medium">
              {{ new Date(instrument.created_at).toLocaleDateString() }}
            </div>
          </div>
        </div>
      </div>

      <!-- ROI Section (Placeholder) -->
      <div class="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            Regions of Interest (ROIs)
            <span class="badge badge-lg ml-2">{{ instrument.roi_count || 0 }}</span>
          </h2>
          <button v-if="canEdit" class="btn btn-primary btn-sm" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add ROI
          </button>
        </div>

        <!-- Placeholder -->
        <div class="alert">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="font-bold">ROI Management Coming Soon</h3>
            <div class="text-sm">ROI visualization and editing will be available in a future update.</div>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="bg-base-100 rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Metadata</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <label class="text-base-content/60">ID</label>
            <div class="font-mono">{{ instrument.id }}</div>
          </div>
          <div>
            <label class="text-base-content/60">Platform</label>
            <router-link
              v-if="platform"
              :to="`/platforms/${platform.id}`"
              class="link link-primary"
            >
              {{ platform.normalized_name }}
            </router-link>
          </div>
          <div>
            <label class="text-base-content/60">Created</label>
            <div>{{ instrument.created_at ? new Date(instrument.created_at).toLocaleString() : '-' }}</div>
          </div>
          <div>
            <label class="text-base-content/60">Last Updated</label>
            <div>{{ instrument.updated_at ? new Date(instrument.updated_at).toLocaleString() : '-' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <InstrumentFormModal
      v-if="instrument && platform"
      v-model="showEditModal"
      :instrument="instrument"
      :platform-id="instrument.platform_id"
      :platform-name="platform.normalized_name"
      :platform-type="platform.platform_type"
      @submit="handleEditSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Delete Instrument"
      :message="`Are you sure you want to delete '${instrument?.normalized_name}'? This will also delete all associated ROIs. This action cannot be undone.`"
      confirm-text="Delete Instrument"
      variant="error"
      :loading="instrumentsStore.loading"
      @confirm="handleDelete"
    />
  </div>
</template>
