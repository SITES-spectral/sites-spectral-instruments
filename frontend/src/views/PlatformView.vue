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

// Active tab for instrument types
const activeInstrumentTab = ref('all');

// Instrument type definitions with icons and colors
const instrumentTypes = {
  all: {
    key: 'all',
    name: 'All',
    icon: 'M4 6h16M4 12h16M4 18h16',
    bgClass: 'bg-base-300',
    textClass: 'text-base-content',
    borderClass: 'border-base-content'
  },
  Phenocam: {
    key: 'Phenocam',
    name: 'Phenocams',
    icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500'
  },
  'Multispectral Sensor': {
    key: 'Multispectral Sensor',
    name: 'Multispectral',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500'
  },
  'PAR Sensor': {
    key: 'PAR Sensor',
    name: 'PAR Sensors',
    icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500'
  },
  'NDVI Sensor': {
    key: 'NDVI Sensor',
    name: 'NDVI Sensors',
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-500',
    borderClass: 'border-green-500'
  },
  'PRI Sensor': {
    key: 'PRI Sensor',
    name: 'PRI Sensors',
    icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-500',
    borderClass: 'border-cyan-500'
  },
  Hyperspectral: {
    key: 'Hyperspectral',
    name: 'Hyperspectral',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
    bgClass: 'bg-pink-500/10',
    textClass: 'text-pink-500',
    borderClass: 'border-pink-500'
  },
  Thermal: {
    key: 'Thermal',
    name: 'Thermal',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500',
    borderClass: 'border-red-500'
  },
  LiDAR: {
    key: 'LiDAR',
    name: 'LiDAR',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    bgClass: 'bg-teal-500/10',
    textClass: 'text-teal-500',
    borderClass: 'border-teal-500'
  },
  'Radar (SAR)': {
    key: 'Radar (SAR)',
    name: 'Radar/SAR',
    icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
    bgClass: 'bg-indigo-500/10',
    textClass: 'text-indigo-500',
    borderClass: 'border-indigo-500'
  }
};

// Available tabs (only show types that have instruments)
const availableInstrumentTabs = computed(() => {
  const tabs = [instrumentTypes.all];
  for (const [typeName, instruments] of Object.entries(instrumentsByType.value)) {
    if (instruments.length > 0 && instrumentTypes[typeName]) {
      tabs.push(instrumentTypes[typeName]);
    }
  }
  return tabs;
});

// Get count for an instrument type
function getInstrumentTypeCount(typeKey) {
  if (typeKey === 'all') return instrumentsStore.instrumentCount;
  return instrumentsByType.value[typeKey]?.length || 0;
}

// Filtered instruments based on active tab
const filteredInstruments = computed(() => {
  if (activeInstrumentTab.value === 'all') {
    return Object.values(instrumentsByType.value).flat();
  }
  return instrumentsByType.value[activeInstrumentTab.value] || [];
});

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
        <!-- Header with tabs and add button -->
        <div class="flex flex-col gap-4 mb-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Instruments
              <span class="badge badge-lg ml-2">{{ instrumentsStore.instrumentCount }}</span>
            </h2>

            <button v-if="canEdit" class="btn btn-primary btn-sm" @click="openCreateInstrumentModal">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Instrument
            </button>
          </div>

          <!-- Instrument Type Tabs -->
          <div v-if="instrumentsStore.instrumentCount > 0" class="flex flex-wrap gap-2">
            <button
              v-for="tab in availableInstrumentTabs"
              :key="tab.key"
              class="btn btn-sm gap-2 transition-all"
              :class="[
                activeInstrumentTab === tab.key
                  ? `${tab.bgClass} ${tab.textClass} border-2 ${tab.borderClass}`
                  : 'btn-ghost border border-base-300'
              ]"
              @click="activeInstrumentTab = tab.key"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
              </svg>
              <span>{{ tab.name }}</span>
              <span class="badge badge-sm" :class="activeInstrumentTab === tab.key ? 'badge-neutral' : 'badge-ghost'">
                {{ getInstrumentTypeCount(tab.key) }}
              </span>
            </button>
          </div>
        </div>

        <!-- Instruments grid -->
        <div v-if="filteredInstruments.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InstrumentCard
            v-for="instrument in filteredInstruments"
            :key="instrument.id"
            :instrument="instrument"
            :can-edit="canEdit"
            @edit="openEditInstrumentModal"
            @delete="openDeleteInstrumentModal"
          />
        </div>

        <!-- Empty state -->
        <div v-else-if="!instrumentsStore.loading" class="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <p class="mt-4 text-base-content/60">No instruments found</p>
          <button v-if="canEdit" class="btn btn-primary mt-4" @click="openCreateInstrumentModal">
            Add First Instrument
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="instrumentsStore.loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
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
