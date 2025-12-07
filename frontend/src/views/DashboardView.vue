<script setup>
/**
 * Dashboard View
 *
 * Main dashboard showing station overview and statistics.
 * Includes interactive station map and data export.
 */
import { computed, onMounted, ref } from 'vue';
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

// Load stations on mount
onMounted(async () => {
  await stationsStore.fetchStations();
});

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
          :height="350"
          :clickable="true"
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

    <!-- Station cards grid -->
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
