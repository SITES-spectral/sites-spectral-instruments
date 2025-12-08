<script setup>
/**
 * Station View
 *
 * Displays station details and its platforms/instruments.
 * Supports platform CRUD operations via modals.
 * Features tabbed navigation for platform types.
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

// Active tab for platform types
const activeTab = ref('all');

// Platform type definitions with icons and colors
const platformTypes = {
  all: {
    key: 'all',
    name: 'All Platforms',
    icon: 'M4 6h16M4 12h16M4 18h16',
    bgClass: 'bg-base-300',
    textClass: 'text-base-content',
    borderClass: 'border-base-content'
  },
  fixed: {
    key: 'fixed',
    name: 'Fixed Platforms',
    icon: 'M12 2v20M8 22h8M8 6l4 16 4-16M10 12h4',
    bgClass: 'bg-info/10',
    textClass: 'text-info',
    borderClass: 'border-info'
  },
  uav: {
    key: 'uav',
    name: 'UAV Platforms',
    icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
    bgClass: 'bg-warning/10',
    textClass: 'text-warning',
    borderClass: 'border-warning'
  },
  satellite: {
    key: 'satellite',
    name: 'Satellite Platforms',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    bgClass: 'bg-accent/10',
    textClass: 'text-accent',
    borderClass: 'border-accent'
  },
  mobile: {
    key: 'mobile',
    name: 'Mobile Platforms',
    icon: 'M8 17h.01M14 17h.01M5 17H3v-4a1 1 0 011-1h1V9a1 1 0 011-1h8a1 1 0 011 1v3h2a1 1 0 011 1v4h-2m-8 0a2 2 0 11-4 0m10 0a2 2 0 11-4 0',
    bgClass: 'bg-neutral/10',
    textClass: 'text-neutral',
    borderClass: 'border-neutral'
  }
};

// Available tabs (only show types that have platforms)
const availableTabs = computed(() => {
  const tabs = [platformTypes.all];
  if (platformsByType.value.fixed?.length > 0) tabs.push(platformTypes.fixed);
  if (platformsByType.value.uav?.length > 0) tabs.push(platformTypes.uav);
  if (platformsByType.value.satellite?.length > 0) tabs.push(platformTypes.satellite);
  if (platformsByType.value.mobile?.length > 0) tabs.push(platformTypes.mobile);
  return tabs;
});

// Get count for a platform type
function getTypeCount(typeKey) {
  if (typeKey === 'all') return platformsStore.platformCount;
  return platformsByType.value[typeKey]?.length || 0;
}

// Filtered platforms based on active tab
const filteredPlatforms = computed(() => {
  if (activeTab.value === 'all') {
    return [
      ...(platformsByType.value.fixed || []),
      ...(platformsByType.value.uav || []),
      ...(platformsByType.value.satellite || []),
      ...(platformsByType.value.mobile || [])
    ];
  }
  return platformsByType.value[activeTab.value] || [];
});

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

      <!-- Platforms Section with Tabs -->
      <div class="bg-base-100 rounded-lg shadow-lg p-6">
        <!-- Header with tabs and create button -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <!-- Platform Type Tabs -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tab in availableTabs"
              :key="tab.key"
              class="btn btn-sm gap-2 transition-all"
              :class="[
                activeTab === tab.key
                  ? `${tab.bgClass} ${tab.textClass} border-2 ${tab.borderClass}`
                  : 'btn-ghost border border-base-300'
              ]"
              @click="activeTab = tab.key"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
              </svg>
              <span class="hidden sm:inline">{{ tab.name }}</span>
              <span class="badge badge-sm" :class="activeTab === tab.key ? 'badge-neutral' : 'badge-ghost'">
                {{ getTypeCount(tab.key) }}
              </span>
            </button>
          </div>

          <!-- Create Platform Button -->
          <button v-if="canEdit" class="btn btn-primary btn-sm" @click="openCreatePlatformModal">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Platform
          </button>
        </div>

        <!-- Platform Grid -->
        <div v-if="filteredPlatforms.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlatformCard
            v-for="platform in filteredPlatforms"
            :key="platform.id"
            :platform="platform"
            :can-edit="canEdit"
            @edit="openEditPlatformModal"
            @delete="openDeletePlatformModal"
          />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!platformsStore.loading"
          class="text-center py-12"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v20M8 22h8M8 6l4 16 4-16M10 12h4" />
          </svg>
          <p class="mt-4 text-base-content/60">No platforms found</p>
          <button v-if="canEdit" class="btn btn-primary mt-4" @click="openCreatePlatformModal">
            Create First Platform
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="platformsStore.loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
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
