<script setup>
/**
 * Platform View
 *
 * Displays platform details and its instruments.
 * Supports full CRUD operations for instruments.
 *
 * Type-aware: Shows type-specific platform details and
 * compatible instrument types based on platform type.
 */
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePlatformsStore } from '@stores/platforms';
import { useInstrumentsStore } from '@stores/instruments';
import { useAuthStore } from '@stores/auth';
import { useNotifications } from '@composables/useNotifications';
import { getPlatformTypeStrategy } from '@composables/useTypeRegistry';

// Type-specific detail components
import FixedPlatformDetails from '@components/cards/platform/FixedPlatformDetails.vue';
import UAVPlatformDetails from '@components/cards/platform/UAVPlatformDetails.vue';
import SatellitePlatformDetails from '@components/cards/platform/SatellitePlatformDetails.vue';

// Card and modal components
import InstrumentCard from '@components/cards/InstrumentCard.vue';
import { PlatformFormModal, InstrumentFormModal, ConfirmModal } from '@components/modals';

const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  }
});

const router = useRouter();
const platformsStore = usePlatformsStore();
const instrumentsStore = useInstrumentsStore();
const authStore = useAuthStore();
const notifications = useNotifications();

// Current platform
const platform = computed(() => platformsStore.currentPlatform);

// Platform type strategy
const typeStrategy = computed(() => {
  return platform.value
    ? getPlatformTypeStrategy(platform.value.platform_type)
    : null;
});

// Get the appropriate detail component based on platform type
const detailComponent = computed(() => {
  switch (platform.value?.platform_type) {
    case 'uav':
      return UAVPlatformDetails;
    case 'satellite':
      return SatellitePlatformDetails;
    case 'fixed':
    default:
      return FixedPlatformDetails;
  }
});

// Can user edit this platform?
const canEdit = computed(() => {
  if (!platform.value) return false;
  return authStore.canEditStation(platform.value.station_id);
});

// Instruments grouped by type
const instrumentsByType = computed(() => instrumentsStore.instrumentsByType);

// Loading states
const isLoading = computed(() =>
  platformsStore.loading || instrumentsStore.loading
);

// Modal states
const showPlatformEditModal = ref(false);
const showInstrumentModal = ref(false);
const showDeletePlatformModal = ref(false);
const showDeleteInstrumentModal = ref(false);
const selectedInstrument = ref(null);
const instrumentToDelete = ref(null);

// Load platform and instruments
async function loadData() {
  const platformId = parseInt(props.id);
  const platformData = await platformsStore.fetchPlatform(platformId);
  if (platformData) {
    await instrumentsStore.fetchInstrumentsByPlatform(platformId);
  }
}

// Load on mount and when ID changes
onMounted(loadData);
watch(() => props.id, loadData);

// Platform CRUD handlers
function openEditPlatformModal() {
  showPlatformEditModal.value = true;
}

function openDeletePlatformModal() {
  showDeletePlatformModal.value = true;
}

async function handlePlatformSubmit(formData) {
  const result = await platformsStore.updatePlatform(platform.value.id, formData);
  if (result) {
    notifications.success('Platform updated successfully');
    showPlatformEditModal.value = false;
  } else {
    notifications.error(platformsStore.error || 'Failed to update platform');
  }
}

async function handleDeletePlatform() {
  const stationAcronym = platform.value.station_acronym;
  const success = await platformsStore.deletePlatform(platform.value.id);
  if (success) {
    notifications.success('Platform deleted successfully');
    showDeletePlatformModal.value = false;
    // Navigate back to station
    router.push({ name: 'station', params: { acronym: stationAcronym } });
  } else {
    notifications.error(platformsStore.error || 'Failed to delete platform');
  }
}

// Instrument CRUD handlers
function openCreateInstrumentModal() {
  selectedInstrument.value = null;
  showInstrumentModal.value = true;
}

function openEditInstrumentModal(instrument) {
  selectedInstrument.value = instrument;
  showInstrumentModal.value = true;
}

function openDeleteInstrumentModal(instrument) {
  instrumentToDelete.value = instrument;
  showDeleteInstrumentModal.value = true;
}

async function handleInstrumentSubmit(formData) {
  let result;

  if (selectedInstrument.value) {
    result = await instrumentsStore.updateInstrument(selectedInstrument.value.id, formData);
    if (result) {
      notifications.success('Instrument updated successfully');
    }
  } else {
    result = await instrumentsStore.createInstrument(formData);
    if (result) {
      notifications.success('Instrument created successfully');
    }
  }

  if (result) {
    showInstrumentModal.value = false;
    selectedInstrument.value = null;
  } else {
    notifications.error(instrumentsStore.error || 'Failed to save instrument');
  }
}

async function handleDeleteInstrument() {
  if (!instrumentToDelete.value) return;

  const success = await instrumentsStore.deleteInstrument(instrumentToDelete.value.id);
  if (success) {
    notifications.success('Instrument deleted successfully');
    showDeleteInstrumentModal.value = false;
    instrumentToDelete.value = null;
  } else {
    notifications.error(instrumentsStore.error || 'Failed to delete instrument');
  }
}

// Badge class based on type
const typeBadgeClass = computed(() => {
  const classes = {
    fixed: 'badge-info',
    uav: 'badge-warning',
    satellite: 'badge-accent'
  };
  return classes[platform.value?.platform_type] || 'badge-info';
});
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading && !platform" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error state -->
    <div v-else-if="platformsStore.error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ platformsStore.error }}</span>
    </div>

    <!-- Platform content -->
    <div v-else-if="platform">
      <!-- Breadcrumb -->
      <div class="text-sm breadcrumbs mb-4">
        <ul>
          <li>
            <router-link to="/dashboard">Dashboard</router-link>
          </li>
          <li>
            <router-link :to="`/stations/${platform.station_acronym}`">
              {{ platform.station_acronym }}
            </router-link>
          </li>
          <li>{{ platform.normalized_name }}</li>
        </ul>
      </div>

      <!-- Platform header -->
      <div class="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold">{{ platform.display_name || platform.normalized_name }}</h1>
              <span :class="['badge badge-lg', typeBadgeClass]">
                {{ typeStrategy?.name || platform.platform_type }}
              </span>
              <span :class="platform.status === 'Active' ? 'badge-success' : 'badge-warning'" class="badge">
                {{ platform.status }}
              </span>
            </div>
            <code class="text-sm text-base-content/60 font-mono mt-1 block">
              {{ platform.normalized_name }}
            </code>
            <p v-if="platform.description" class="text-base-content/60 mt-2">
              {{ platform.description }}
            </p>
          </div>

          <!-- Actions -->
          <div v-if="canEdit" class="flex gap-2">
            <button class="btn btn-outline btn-sm" @click="openEditPlatformModal">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button class="btn btn-outline btn-error btn-sm" @click="openDeletePlatformModal">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>

        <!-- Type-Specific Details -->
        <div class="mt-6 pt-4 border-t border-base-200">
          <component
            :is="detailComponent"
            :platform="platform"
          />
        </div>
      </div>

      <!-- Instruments Section -->
      <div class="bg-base-100 rounded-lg shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            Instruments
            <span class="badge badge-lg ml-2">{{ instrumentsStore.instrumentCount }}</span>
          </h2>

          <button v-if="canEdit" class="btn btn-primary btn-sm" @click="openCreateInstrumentModal">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Instrument
          </button>
        </div>

        <!-- Instruments by type -->
        <div v-if="instrumentsStore.instrumentCount > 0" class="space-y-6">
          <div v-for="(instruments, typeName) in instrumentsByType" :key="typeName">
            <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
              <span class="badge badge-secondary">{{ typeName }}</span>
              <span class="text-base-content/60 text-sm font-normal">
                {{ instruments.length }} instrument{{ instruments.length !== 1 ? 's' : '' }}
              </span>
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InstrumentCard
                v-for="instrument in instruments"
                :key="instrument.id"
                :instrument="instrument"
                :can-edit="canEdit"
                @edit="openEditInstrumentModal"
                @delete="openDeleteInstrumentModal"
              />
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <p class="mt-4 text-base-content/60">No instruments found</p>
          <button v-if="canEdit" class="btn btn-primary mt-4" @click="openCreateInstrumentModal">
            Add First Instrument
          </button>
        </div>
      </div>
    </div>

    <!-- Platform Edit Modal -->
    <PlatformFormModal
      v-if="platform"
      v-model="showPlatformEditModal"
      :platform="platform"
      :station-id="platform.station_id"
      :station-acronym="platform.station_acronym"
      @submit="handlePlatformSubmit"
    />

    <!-- Delete Platform Modal -->
    <ConfirmModal
      v-model="showDeletePlatformModal"
      title="Delete Platform"
      :message="`Are you sure you want to delete '${platform?.normalized_name}'? This will also delete all ${instrumentsStore.instrumentCount} instrument(s). This action cannot be undone.`"
      confirm-text="Delete Platform"
      variant="error"
      :loading="platformsStore.loading"
      @confirm="handleDeletePlatform"
    />

    <!-- Instrument Form Modal -->
    <InstrumentFormModal
      v-if="platform"
      v-model="showInstrumentModal"
      :instrument="selectedInstrument"
      :platform-id="platform.id"
      :platform-name="platform.normalized_name"
      :platform-type="platform.platform_type"
      @submit="handleInstrumentSubmit"
    />

    <!-- Delete Instrument Modal -->
    <ConfirmModal
      v-model="showDeleteInstrumentModal"
      title="Delete Instrument"
      :message="`Are you sure you want to delete '${instrumentToDelete?.normalized_name || instrumentToDelete?.display_name}'? This action cannot be undone.`"
      confirm-text="Delete"
      variant="error"
      :loading="instrumentsStore.loading"
      @confirm="handleDeleteInstrument"
    />
  </div>
</template>
