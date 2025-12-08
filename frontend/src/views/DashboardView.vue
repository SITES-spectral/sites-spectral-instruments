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
import { useStationsStore } from '@stores/stations';
import { useAuthStore } from '@stores/auth';
import { useNotifications } from '@composables/useNotifications';
import StationCard from '@components/cards/StationCard.vue';
import { StationMap } from '@components/map';
import { ExportModal } from '@components/modals';

// Map view toggle
const showMap = ref(true);

// Export modal
const showExportModal = ref(false);
const notifications = useNotifications();

function handleExported(result) {
  notifications.success(`Exported ${result.type} as ${result.format.toUpperCase()}`);
}

const stationsStore = useStationsStore();
const authStore = useAuthStore();

// Quick access data for station users
const platforms = ref([]);
const loadingPlatforms = ref(false);

// All platforms for map display (fixed platforms with coordinates)
const allPlatforms = ref([]);

// Load stations on mount
onMounted(async () => {
  await stationsStore.fetchStations();
  // Load all platforms for map markers
  await loadAllPlatforms();
});

// Load all platforms with coordinates for map display
async function loadAllPlatforms() {
  try {
    const response = await fetch('/api/v11/platforms');
    if (response.ok) {
      const result = await response.json();
      // Filter to only fixed platforms with coordinates
      allPlatforms.value = (result.data || []).filter(p =>
        p.platform_type === 'fixed' &&
        p.latitude != null &&
        p.longitude != null
      );
    }
  } catch (error) {
    console.error('Failed to load platforms for map:', error);
  }
}

// Filter stations based on user role
const visibleStations = computed(() => {
  // Admins see all stations
  if (authStore.isAdmin) {
    return stationsStore.stations;
  }

  // Station users see only their station
  const userStation = authStore.user?.station_normalized_name;
  if (userStation) {
    return stationsStore.stations.filter(s =>
      s.normalized_name === userStation ||
      s.acronym?.toLowerCase() === userStation.toLowerCase()
    );
  }

  // Default: show all (for safety)
  return stationsStore.stations;
});

// Check if user is a station user (single station access)
const isStationUser = computed(() => {
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
    // Fixed: Observation tower/mast structure
    fixed: 'M12 2v20M8 22h8M8 6l4 16 4-16M10 12h4',
    // UAV: Drone/quadcopter
    uav: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM12 12m-3 0a3 3 0 106 0 3 3 0 00-6 0',
    // Satellite: Orbital satellite
    satellite: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    // Mobile: Truck
    mobile: 'M8 17h.01M14 17h.01M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM5 17H3v-4a1 1 0 011-1h1V9a1 1 0 011-1h8a1 1 0 011 1v3h2a1 1 0 011 1v4h-2',
    // USV: Ship/boat
    usv: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    // UUV: Water/submarine
    uuv: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  };
  return icons[type] || icons.fixed;
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
        <label class="label cursor-pointer gap-2">
          <span class="label-text text-sm">Show map</span>
          <input
            v-model="showMap"
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
          />
        </label>
      </div>

      <!-- Map -->
      <div v-show="showMap">
        <StationMap
          v-if="!stationsStore.loading && stationsStore.stations.length > 0"
          :stations="stationsStore.stations"
          :platforms="allPlatforms"
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
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Access - {{ userStation?.display_name || userStation?.acronym }}
      </h2>

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
        >
          <div class="card-body p-4">
            <div class="flex items-start gap-3">
              <!-- Platform type + Mount type icons -->
              <div class="flex flex-col items-center gap-1">
                <!-- Platform type icon -->
                <div class="p-2 rounded-lg bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getPlatformIcon(platform.platform_type)" />
                  </svg>
                </div>
                <!-- Mount type icon (PL/BL/GL) -->
                <svg
                  v-if="getMountTypeIcon(platform.mount_type_code)"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  :class="getMountTypeColor(platform.mount_type_code)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  :title="platform.mount_type_code"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getMountTypeIcon(platform.mount_type_code)" />
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
  </div>
</template>
