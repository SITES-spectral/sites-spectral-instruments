<script setup>
/**
 * Station View
 *
 * Displays station details and its platforms/instruments.
 * Supports platform CRUD operations via modals.
 */
import { computed, ref, onMounted, watch } from 'vue';
import { useStationsStore } from '@stores/stations';
import { usePlatformsStore } from '@stores/platforms';
import { useAuthStore } from '@stores/auth';
import PlatformCard from '@components/cards/PlatformCard.vue';
import { StationFormModal, PlatformFormModal, ConfirmModal, ExportModal } from '@components/modals';
import { useNotifications } from '@composables/useNotifications';

// Export modal
const showExportModal = ref(false);

function handleExported(result) {
  notifications.success(`Exported ${result.type} as ${result.format.toUpperCase()}`);
}

const props = defineProps({
  acronym: {
    type: String,
    required: true
  }
});
const stationsStore = useStationsStore();
const platformsStore = usePlatformsStore();
const authStore = useAuthStore();
const notifications = useNotifications();

// Current station
const station = computed(() => stationsStore.currentStation);

// Can user edit this station?
const canEdit = computed(() => {
  if (!station.value) return false;
  return authStore.canEditStation(station.value.id);
});

// Platforms grouped by type
const platformsByType = computed(() => platformsStore.platformsByType);

// Modal states
const showStationEditModal = ref(false);
const showPlatformModal = ref(false);
const showDeleteModal = ref(false);
const selectedPlatform = ref(null);
const platformToDelete = ref(null);

// Load station data
async function loadStation() {
  const stationData = await stationsStore.fetchStation(props.acronym);
  if (stationData) {
    await platformsStore.fetchPlatformsByStation(stationData.id);
  }
}

// Load on mount and when acronym changes
onMounted(loadStation);
watch(() => props.acronym, loadStation);

// Station edit handlers
function openEditStationModal() {
  showStationEditModal.value = true;
}

async function handleStationSubmit(formData) {
  const result = await stationsStore.updateStation(station.value.id, formData);
  if (result) {
    notifications.success('Station updated successfully');
    showStationEditModal.value = false;
  } else {
    notifications.error(stationsStore.error || 'Failed to update station');
  }
}

// Platform CRUD handlers
function openCreatePlatformModal() {
  selectedPlatform.value = null;
  showPlatformModal.value = true;
}

function openEditPlatformModal(platform) {
  selectedPlatform.value = platform;
  showPlatformModal.value = true;
}

function openDeletePlatformModal(platform) {
  platformToDelete.value = platform;
  showDeleteModal.value = true;
}

async function handlePlatformSubmit(formData) {
  let result;

  if (selectedPlatform.value) {
    // Update existing platform
    result = await platformsStore.updatePlatform(selectedPlatform.value.id, formData);
    if (result) {
      notifications.success('Platform updated successfully');
    }
  } else {
    // Create new platform
    result = await platformsStore.createPlatform(formData);
    if (result) {
      notifications.success('Platform created successfully');
    }
  }

  if (result) {
    showPlatformModal.value = false;
    selectedPlatform.value = null;
  } else {
    notifications.error(platformsStore.error || 'Failed to save platform');
  }
}

async function handleDeletePlatform() {
  if (!platformToDelete.value) return;

  const success = await platformsStore.deletePlatform(platformToDelete.value.id);
  if (success) {
    notifications.success('Platform deleted successfully');
    showDeleteModal.value = false;
    platformToDelete.value = null;
  } else {
    notifications.error(platformsStore.error || 'Failed to delete platform');
  }
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="stationsStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error state -->
    <div v-else-if="stationsStore.error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ stationsStore.error }}</span>
    </div>

    <!-- Station content -->
    <div v-else-if="station">
      <!-- Station header -->
      <div class="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold">{{ station.display_name }}</h1>
              <span class="badge badge-primary badge-lg">{{ station.acronym }}</span>
            </div>
            <p v-if="station.description" class="text-base-content/60 mt-2">
              {{ station.description }}
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2">
            <button
              class="btn btn-outline btn-sm"
              @click="showExportModal = true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              v-if="canEdit"
              class="btn btn-outline btn-sm"
              @click="openEditStationModal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

        <!-- Station metadata -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-base-200">
          <div>
            <div class="text-sm text-base-content/60">Location</div>
            <div class="font-medium">
              {{ station.latitude?.toFixed(4) }}, {{ station.longitude?.toFixed(4) }}
            </div>
          </div>
          <div>
            <div class="text-sm text-base-content/60">Platforms</div>
            <div class="font-medium">{{ platformsStore.platformCount }}</div>
          </div>
          <div>
            <div class="text-sm text-base-content/60">Status</div>
            <div>
              <span :class="station.status === 'Active' ? 'badge-success' : 'badge-warning'" class="badge">
                {{ station.status }}
              </span>
            </div>
          </div>
          <div>
            <div class="text-sm text-base-content/60">Website</div>
            <a
              v-if="station.website_url"
              :href="station.website_url"
              target="_blank"
              class="link link-primary"
            >
              Visit site
            </a>
            <span v-else class="text-base-content/40">-</span>
          </div>
        </div>
      </div>

      <!-- Create platform button -->
      <div v-if="canEdit" class="flex justify-end mb-4">
        <button class="btn btn-primary" @click="openCreatePlatformModal">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Platform
        </button>
      </div>

      <!-- Platforms by type -->
      <div class="space-y-6">
        <!-- Fixed Platforms -->
        <div v-if="platformsByType.fixed.length > 0">
          <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
            <span class="badge badge-info">Fixed</span>
            <span class="text-base-content/60 text-sm font-normal">
              {{ platformsByType.fixed.length }} platforms
            </span>
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PlatformCard
              v-for="platform in platformsByType.fixed"
              :key="platform.id"
              :platform="platform"
              :can-edit="canEdit"
              @edit="openEditPlatformModal"
              @delete="openDeletePlatformModal"
            />
          </div>
        </div>

        <!-- UAV Platforms -->
        <div v-if="platformsByType.uav.length > 0">
          <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
            <span class="badge badge-warning">UAV</span>
            <span class="text-base-content/60 text-sm font-normal">
              {{ platformsByType.uav.length }} platforms
            </span>
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PlatformCard
              v-for="platform in platformsByType.uav"
              :key="platform.id"
              :platform="platform"
              :can-edit="canEdit"
              @edit="openEditPlatformModal"
              @delete="openDeletePlatformModal"
            />
          </div>
        </div>

        <!-- Satellite Platforms -->
        <div v-if="platformsByType.satellite.length > 0">
          <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
            <span class="badge badge-secondary">Satellite</span>
            <span class="text-base-content/60 text-sm font-normal">
              {{ platformsByType.satellite.length }} platforms
            </span>
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PlatformCard
              v-for="platform in platformsByType.satellite"
              :key="platform.id"
              :platform="platform"
              :can-edit="canEdit"
              @edit="openEditPlatformModal"
              @delete="openDeletePlatformModal"
            />
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="platformsStore.platformCount === 0 && !platformsStore.loading"
          class="text-center py-12 bg-base-100 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p class="mt-4 text-base-content/60">No platforms found</p>
          <button v-if="canEdit" class="btn btn-primary mt-4" @click="openCreatePlatformModal">
            Create First Platform
          </button>
        </div>
      </div>
    </div>

    <!-- Station Edit Modal -->
    <StationFormModal
      v-if="station"
      v-model="showStationEditModal"
      :station="station"
      @submit="handleStationSubmit"
    />

    <!-- Platform Form Modal -->
    <PlatformFormModal
      v-model="showPlatformModal"
      :platform="selectedPlatform"
      :station-id="station?.id"
      :station-acronym="station?.acronym || ''"
      @submit="handlePlatformSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Delete Platform"
      :message="`Are you sure you want to delete '${platformToDelete?.normalized_name || platformToDelete?.display_name}'? This action cannot be undone.`"
      confirm-text="Delete"
      variant="error"
      :loading="platformsStore.loading"
      @confirm="handleDeletePlatform"
    />

    <!-- Export Modal -->
    <ExportModal
      v-if="station"
      v-model="showExportModal"
      default-type="instruments"
      :scope="{ stationId: station.id, stationAcronym: station.acronym }"
      @exported="handleExported"
    />
  </div>
</template>
