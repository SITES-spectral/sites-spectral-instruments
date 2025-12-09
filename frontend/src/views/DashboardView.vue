<script setup>
/**
 * Dashboard View
 *
 * Main dashboard showing station overview and statistics.
 * Includes interactive station map and data export.
 * For station users: shows quick access to platforms/instruments
 * For admins: shows all research stations
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStationsStore } from '@stores/stations';
import { usePlatformsStore } from '@stores/platforms';
import { useAuthStore } from '@stores/auth';
import { useNotifications } from '@composables/useNotifications';
import StationCard from '@components/cards/StationCard.vue';
import { StationMap } from '@components/map';
import { ExportModal, PlatformFormModal } from '@components/modals';

// Map view toggle
const showMap = ref(true);

// Show all platforms toggle (dimmed for non-selected stations)
const showAllPlatforms = ref(false);

// All platforms from all stations (for map display when toggle enabled)
const allStationsPlatforms = ref([]);
const loadingAllPlatforms = ref(false);

// Map component ref for hover interactivity
const stationMapRef = ref(null);

// Export modal
const showExportModal = ref(false);
const notifications = useNotifications();

function handleExported(result) {
  notifications.success(`Exported ${result.type} as ${result.format.toUpperCase()}`);
}

// Platform card hover handlers for map interactivity
function handlePlatformHover(platform) {
  // Only highlight fixed platforms with coordinates
  if (platform.platform_type === 'fixed' && platform.latitude && platform.longitude) {
    stationMapRef.value?.highlightPlatform(platform.id);
  }
}

function handlePlatformLeave() {
  stationMapRef.value?.clearHighlight();
}

const router = useRouter();
const stationsStore = useStationsStore();
const platformsStore = usePlatformsStore();
const authStore = useAuthStore();

// Quick access data for station users
const platforms = ref([]);
const loadingPlatforms = ref(false);

// Platform creation modal state
const showPlatformModal = ref(false);

// Can user edit their station?
const canEdit = computed(() => {
  if (!userStation.value) return false;
  return authStore.canEditStation(userStation.value.id);
});

// Platform creation handlers
function openCreatePlatformModal() {
  showPlatformModal.value = true;
}

async function handlePlatformSubmit(formData) {
  const result = await platformsStore.createPlatform(formData);
  if (result) {
    notifications.success('Platform created successfully');
    showPlatformModal.value = false;
    // Refresh platforms list
    if (userStation.value) {
      loadingPlatforms.value = true;
      try {
        const response = await fetch(`/api/v11/platforms/station/${userStation.value.id}`);
        if (response.ok) {
          const data = await response.json();
          platforms.value = data.data || [];
        }
        await loadPlatformsForStation(userStation.value.id);
      } finally {
        loadingPlatforms.value = false;
      }
    }
  } else {
    notifications.error(platformsStore.error || 'Failed to create platform');
  }
}

// Platforms for selected station on map (fixed platforms with coordinates)
const selectedStationPlatforms = ref([]);

// Load stations on mount
onMounted(async () => {
  await stationsStore.fetchStations();
});

// Load platforms for a specific station (for map display)
async function loadPlatformsForStation(stationId) {
  if (!stationId) {
    selectedStationPlatforms.value = [];
    return;
  }

  try {
    const response = await fetch(`/api/v11/platforms/station/${stationId}`);
    if (response.ok) {
      const result = await response.json();
      // Filter to only fixed platforms with coordinates
      selectedStationPlatforms.value = (result.data || []).filter(p =>
        p.platform_type === 'fixed' &&
        p.latitude != null &&
        p.longitude != null
      );
    }
  } catch (error) {
    console.error('Failed to load platforms for station:', error);
    selectedStationPlatforms.value = [];
  }
}

// Load all platforms from all stations (for showing other stations dimmed)
async function loadAllPlatforms() {
  if (loadingAllPlatforms.value) return;

  loadingAllPlatforms.value = true;
  try {
    // Fetch all platforms with high limit
    const response = await fetch('/api/v11/platforms?limit=500');
    if (response.ok) {
      const result = await response.json();
      // Filter to only fixed platforms with coordinates
      allStationsPlatforms.value = (result.data || []).filter(p =>
        p.platform_type === 'fixed' &&
        p.latitude != null &&
        p.longitude != null
      );
    }
  } catch (error) {
    console.error('Failed to load all platforms:', error);
    allStationsPlatforms.value = [];
  } finally {
    loadingAllPlatforms.value = false;
  }
}

// Compute platforms for other stations (exclude selected station)
const otherStationsPlatforms = computed(() => {
  if (!showAllPlatforms.value) return [];
  // If user has a home station, exclude it; otherwise show all
  if (userStation.value) {
    return allStationsPlatforms.value.filter(p =>
      p.station_id !== userStation.value.id
    );
  }
  // For admins: show all platforms from all stations
  return allStationsPlatforms.value;
});

// Watch showAllPlatforms toggle - load all platforms when enabled
watch(showAllPlatforms, async (enabled) => {
  if (enabled && allStationsPlatforms.value.length === 0) {
    await loadAllPlatforms();
  }
});

// Filter stations based on user role
const visibleStations = computed(() => {
  // Super admins see all stations
  if (authStore.isAdmin) {
    return stationsStore.stations;
  }

  // Station admins and users - get their station from various sources
  let userStationKey = null;

  // Try station_normalized_name first
  if (authStore.user?.station_normalized_name) {
    userStationKey = authStore.user.station_normalized_name;
  }
  // For station-admins, extract station from username (e.g., "lonnstorp-admin" -> "lonnstorp")
  else if (authStore.isStationAdmin && authStore.userStationFromUsername) {
    userStationKey = authStore.userStationFromUsername;
  }
  // For regular station users, try username as station name
  else if (authStore.isStationUser && authStore.user?.username) {
    userStationKey = authStore.user.username;
  }

  // Filter to user's station if found
  if (userStationKey) {
    const key = userStationKey.toLowerCase();
    return stationsStore.stations.filter(s =>
      s.normalized_name?.toLowerCase() === key ||
      s.acronym?.toLowerCase() === key
    );
  }

  // Default: show all (for safety)
  return stationsStore.stations;
});

// Check if user is a station user or station admin (single station access)
const isStationUser = computed(() => {
  // Not a super admin, and has exactly one visible station
  return !authStore.isAdmin && visibleStations.value.length === 1;
});

// Get the user's station (for station users)
const userStation = computed(() => {
  return isStationUser.value ? visibleStations.value[0] : null;
});

// Load platforms when station user's station is available
watch(userStation, async (station) => {
  if (station) {
    loadingPlatforms.value = true;
    try {
      const response = await fetch(`/api/v11/platforms/station/${station.id}`);
      if (response.ok) {
        const result = await response.json();
        platforms.value = result.data || [];
      }
      // Also load platforms for map display
      await loadPlatformsForStation(station.id);
    } catch (error) {
      console.error('Failed to load platforms:', error);
    } finally {
      loadingPlatforms.value = false;
    }
  }
}, { immediate: true });

// Platform type icons - matching useTypes.js definitions
function getPlatformIcon(type) {
  const icons = {
    // Fixed: Generic tower (used as fallback)
    fixed: 'M12 2v20M8 22h8M8 6l4 16 4-16M10 12h4',
    // UAV: Drone with propellers
    uav: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    // Satellite: Orbital satellite with panels
    satellite: 'M13 7L9 3 5 7l4 4M17 11l4 4-4 4-4-4M8 12l4 4 4-4-4-4-4 4zM16 8l3-3M5 16l3 3',
    // Mobile: Truck
    mobile: 'M8 17h.01M14 17h.01M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-4a1 1 0 011-1h1V9a1 1 0 011-1h8a1 1 0 011 1v3h2a1 1 0 011 1v4h-2',
    // USV: Ship/boat
    usv: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    // UUV: Water/submarine
    uuv: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  };
  return icons[type] || icons.fixed;
}

// Get the best icon for a platform - mount-type specific for fixed platforms
function getPlatformDisplayIcon(platform) {
  // For fixed platforms, use mount-type specific icons
  if (platform.platform_type === 'fixed' && platform.mount_type_code) {
    const mountIcon = getMountTypeIcon(platform.mount_type_code);
    if (mountIcon) return mountIcon;
  }
  // For non-fixed platforms or no mount type, use platform type icon
  return getPlatformIcon(platform.platform_type);
}

// Get background color class for platform card
function getPlatformBgClass(platform) {
  if (platform.platform_type === 'fixed' && platform.mount_type_code) {
    const prefix = platform.mount_type_code.match(/^([A-Z]+)/)?.[1];
    const classes = {
      PL: 'bg-info/10',      // Tower - blue
      BL: 'bg-secondary/10', // Building - purple
      GL: 'bg-success/10'    // Ground - green
    };
    return classes[prefix] || 'bg-primary/10';
  }
  // Non-fixed platform types
  const typeClasses = {
    uav: 'bg-warning/10',
    satellite: 'bg-accent/10',
    mobile: 'bg-neutral/10'
  };
  return typeClasses[platform.platform_type] || 'bg-primary/10';
}

// Get text color class for platform card icon
function getPlatformTextClass(platform) {
  if (platform.platform_type === 'fixed' && platform.mount_type_code) {
    const prefix = platform.mount_type_code.match(/^([A-Z]+)/)?.[1];
    const classes = {
      PL: 'text-info',      // Tower - blue
      BL: 'text-secondary', // Building - purple
      GL: 'text-success'    // Ground - green
    };
    return classes[prefix] || 'text-primary';
  }
  // Non-fixed platform types
  const typeClasses = {
    uav: 'text-warning',
    satellite: 'text-accent',
    mobile: 'text-neutral'
  };
  return typeClasses[platform.platform_type] || 'text-primary';
}

// Mount type icons - PL (pole/tower), BL (building), GL (ground level)
function getMountTypeIcon(mountTypeCode) {
  if (!mountTypeCode) return null;
  const prefix = mountTypeCode.match(/^([A-Z]+)/)?.[1];

  const icons = {
    // PL: Tower - lattice transmission tower
    PL: 'M12 2v20M8 22h8M8 6l4 16 4-16M10 12h4',
    // BL: Building - multi-story with windows and door
    BL: 'M3 21h18M5 21V8l7-6 7 6v13M9 12h2v2H9M13 12h2v2h-2M11 21v-4h2v4',
    // GL: Flower - plant at ground level
    GL: 'M12 22v-7M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 7V4M8 9l-2-2M16 9l2-2'
  };

  return icons[prefix] || null;
}

// Mount type color class
function getMountTypeColor(mountTypeCode) {
  if (!mountTypeCode) return 'text-base-content/40';
  const prefix = mountTypeCode.match(/^([A-Z]+)/)?.[1];

  const colors = {
    PL: 'text-info',
    BL: 'text-secondary',
    GL: 'text-success'
  };

  return colors[prefix] || 'text-base-content/40';
}

// Welcome name - prefer display_name from station data
const welcomeName = computed(() => {
  // Try to get display name from user's station if they're a station user
  const userStation = authStore.user?.station_normalized_name;
  if (userStation && !authStore.isAdmin) {
    const station = stationsStore.stations.find(s =>
      s.normalized_name === userStation
    );
    if (station?.display_name) {
      return station.display_name;
    }
  }
  // Fallback to username
  return authStore.user?.username || 'User';
});

// Statistics - use visible stations
const stats = computed(() => {
  const stations = visibleStations.value;
  let totalPlatforms = 0;
  let totalInstruments = 0;

  stations.forEach(s => {
    totalPlatforms += s.platform_count || 0;
    totalInstruments += s.instrument_count || 0;
  });

  return {
    stations: stations.length,
    platforms: totalPlatforms,
    instruments: totalInstruments,
    active: stations.filter(s => s.status === 'Active').length
  };
});
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <p class="text-base-content/60">
          Welcome back, {{ welcomeName }}
        </p>
      </div>
      <button
        class="btn btn-outline btn-sm"
        @click="showExportModal = true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export Data
      </button>
    </div>

    <!-- Statistics cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="stat bg-base-100 rounded-lg shadow">
        <div class="stat-figure text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </div>
        <div class="stat-title">Stations</div>
        <div class="stat-value text-primary">{{ stats.stations }}</div>
        <div class="stat-desc">{{ stats.active }} active</div>
      </div>

      <div class="stat bg-base-100 rounded-lg shadow">
        <div class="stat-figure text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div class="stat-title">Platforms</div>
        <div class="stat-value text-secondary">{{ stats.platforms }}</div>
        <div class="stat-desc">Fixed, UAV, Satellite</div>
      </div>

      <div class="stat bg-base-100 rounded-lg shadow">
        <div class="stat-figure text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <div class="stat-title">Instruments</div>
        <div class="stat-value text-accent">{{ stats.instruments }}</div>
        <div class="stat-desc">Across all platforms</div>
      </div>

      <div class="stat bg-base-100 rounded-lg shadow">
        <div class="stat-figure text-info">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="stat-title">Status</div>
        <div class="stat-value text-info">OK</div>
        <div class="stat-desc">All systems operational</div>
      </div>
    </div>

    <!-- Station Map Section -->
    <div class="bg-base-100 rounded-lg shadow-lg p-4 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Station Locations
        </h2>
        <div class="flex items-center gap-4">
          <!-- Show all platforms toggle - always visible -->
          <label class="label cursor-pointer gap-2">
            <span class="label-text text-xs text-base-content/60">Show all platforms</span>
            <input
              v-model="showAllPlatforms"
              type="checkbox"
              class="toggle toggle-xs"
              :disabled="loadingAllPlatforms"
            />
            <span v-if="loadingAllPlatforms" class="loading loading-spinner loading-xs"></span>
          </label>
          <!-- Show map toggle -->
          <label class="label cursor-pointer gap-2">
            <span class="label-text text-sm">Show map</span>
            <input
              v-model="showMap"
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
            />
          </label>
        </div>
      </div>

      <!-- Map -->
      <div v-show="showMap">
        <StationMap
          ref="stationMapRef"
          v-if="!stationsStore.loading && stationsStore.stations.length > 0"
          :stations="stationsStore.stations"
          :platforms="selectedStationPlatforms"
          :other-platforms="otherStationsPlatforms"
          :show-platforms="true"
          :height="350"
          :clickable="true"
          :selected-id="userStation?.id"
        />
        <div v-else-if="stationsStore.loading" class="h-[350px] flex items-center justify-center bg-base-200 rounded-lg">
          <span class="loading loading-spinner loading-md"></span>
        </div>
        <div v-else class="h-[350px] flex items-center justify-center bg-base-200 rounded-lg text-base-content/60">
          No stations to display
        </div>
      </div>
    </div>

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

    <!-- Quick Access for Station Users -->
    <div v-else-if="isStationUser">
      <!-- Section header with action buttons -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Access - {{ userStation?.display_name || userStation?.acronym }}
        </h2>

        <!-- Action buttons -->
        <div class="flex gap-2">
          <!-- Create Platform button (if user can edit) -->
          <button
            v-if="canEdit"
            class="btn btn-primary btn-sm"
            @click="openCreatePlatformModal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Platform
          </button>

          <!-- View Station link -->
          <router-link
            v-if="userStation"
            :to="`/stations/${userStation.acronym}`"
            class="btn btn-outline btn-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Station
          </router-link>
        </div>
      </div>

      <!-- Loading platforms -->
      <div v-if="loadingPlatforms" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md"></span>
      </div>

      <!-- Platforms grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          v-for="platform in platforms"
          :key="platform.id"
          :to="`/platforms/${platform.id}`"
          class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
          @mouseenter="handlePlatformHover(platform)"
          @mouseleave="handlePlatformLeave"
        >
          <div class="card-body p-4">
            <div class="flex items-start gap-3">
              <!-- Platform icon - mount-type specific for fixed platforms -->
              <div
                class="p-2.5 rounded-lg"
                :class="getPlatformBgClass(platform)"
                :title="platform.mount_type_code || platform.platform_type"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  :class="getPlatformTextClass(platform)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getPlatformDisplayIcon(platform)" />
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm truncate font-mono">{{ platform.normalized_name }}</h3>
                <p class="text-xs text-base-content/60 truncate">{{ platform.display_name }}</p>

                <!-- Instrument count -->
                <div class="flex items-center gap-1 mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <span class="text-xs font-medium">{{ platform.instrument_count || 0 }} instruments</span>
                </div>
              </div>

              <!-- Status badge -->
              <span :class="[
                'badge badge-xs',
                platform.status === 'Active' ? 'badge-success' : 'badge-ghost'
              ]">
                {{ platform.status }}
              </span>
            </div>
          </div>
        </router-link>

        <!-- Empty state -->
        <div v-if="platforms.length === 0" class="col-span-full text-center py-8 text-base-content/50">
          No platforms found
        </div>
      </div>
    </div>

    <!-- Station cards grid (for admins) -->
    <div v-else>
      <h2 class="text-lg font-semibold mb-4">Research Stations</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <StationCard
          v-for="station in visibleStations"
          :key="station.id"
          :station="station"
        />
      </div>
    </div>

    <!-- Export Modal -->
    <ExportModal
      v-model="showExportModal"
      default-type="stations"
      @exported="handleExported"
    />

    <!-- Platform Form Modal (for station users) -->
    <PlatformFormModal
      v-if="userStation"
      v-model="showPlatformModal"
      :station-id="userStation.id"
      :station-acronym="userStation.acronym || ''"
      @submit="handlePlatformSubmit"
    />
  </div>
</template>
