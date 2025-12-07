<script setup>
/**
 * Main Sidebar Navigation
 *
 * Hierarchical navigation: Stations → Platforms → Instruments
 * Collapsible tree structure for easy navigation.
 */
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStationsStore } from '@stores/stations';
import { usePlatformsStore } from '@stores/platforms';
import { useInstrumentsStore } from '@stores/instruments';
import { useAuthStore } from '@stores/auth';

const route = useRoute();
const stationsStore = useStationsStore();
const platformsStore = usePlatformsStore();
const instrumentsStore = useInstrumentsStore();
const authStore = useAuthStore();

// Expanded state tracking
const expandedStations = ref(new Set());
const expandedPlatforms = ref(new Set());

// Platform and instrument cache (keyed by station/platform id)
const platformsByStation = ref({});
const instrumentsByPlatform = ref({});

// Loading states
const loadingPlatforms = ref(new Set());
const loadingInstruments = ref(new Set());

// Load stations on mount
onMounted(async () => {
  if (stationsStore.stations.length === 0) {
    await stationsStore.fetchStations();
  }
});

// Current route info
const currentStationAcronym = computed(() => route.params.acronym);
const currentPlatformId = computed(() => route.params.id ? parseInt(route.params.id) : null);
const currentInstrumentId = computed(() => {
  if (route.name === 'instrument') {
    return route.params.id ? parseInt(route.params.id) : null;
  }
  return null;
});

// Auto-expand based on current route
watch([currentStationAcronym, currentPlatformId, currentInstrumentId], async () => {
  // Auto-expand current station
  if (currentStationAcronym.value) {
    expandedStations.value.add(currentStationAcronym.value);
    // Load platforms for this station if not loaded
    const station = displayStations.value.find(s => s.acronym === currentStationAcronym.value);
    if (station && !platformsByStation.value[station.id]) {
      await loadPlatformsForStation(station);
    }
  }

  // Auto-expand current platform's station and the platform itself
  if (currentPlatformId.value && platformsStore.currentPlatform) {
    const platform = platformsStore.currentPlatform;
    expandedStations.value.add(platform.station_acronym);
    expandedPlatforms.value.add(currentPlatformId.value);
    // Load instruments for this platform if not loaded
    if (!instrumentsByPlatform.value[currentPlatformId.value]) {
      await loadInstrumentsForPlatform(currentPlatformId.value);
    }
  }

  // Auto-expand instrument's platform and station
  if (currentInstrumentId.value && instrumentsStore.currentInstrument) {
    const instrument = instrumentsStore.currentInstrument;
    const platformId = instrument.platform_id;
    expandedPlatforms.value.add(platformId);
    // Load the platform to get station info
    if (!instrumentsByPlatform.value[platformId]) {
      await loadInstrumentsForPlatform(platformId);
    }
  }
}, { immediate: true });

// Stations to display - filtered for station users
const displayStations = computed(() => {
  const stations = stationsStore.activeStations;

  // Admins see all stations
  if (authStore.isAdmin) {
    return stations;
  }

  // Station users see only their station
  const userStation = authStore.user?.station_normalized_name;
  if (userStation) {
    return stations.filter(s =>
      s.normalized_name === userStation ||
      s.acronym?.toLowerCase() === userStation.toLowerCase()
    );
  }

  return stations;
});

// Toggle station expansion
async function toggleStation(station) {
  const acronym = station.acronym;
  if (expandedStations.value.has(acronym)) {
    expandedStations.value.delete(acronym);
  } else {
    expandedStations.value.add(acronym);
    // Load platforms if not already loaded
    if (!platformsByStation.value[station.id]) {
      await loadPlatformsForStation(station);
    }
  }
}

// Toggle platform expansion
async function togglePlatform(platformId) {
  if (expandedPlatforms.value.has(platformId)) {
    expandedPlatforms.value.delete(platformId);
  } else {
    expandedPlatforms.value.add(platformId);
    // Load instruments if not already loaded
    if (!instrumentsByPlatform.value[platformId]) {
      await loadInstrumentsForPlatform(platformId);
    }
  }
}

// Load platforms for a station
async function loadPlatformsForStation(station) {
  if (loadingPlatforms.value.has(station.id)) return;

  loadingPlatforms.value.add(station.id);
  try {
    // Correct endpoint: /api/v10/platforms/station/:stationId
    const response = await fetch(`/api/v10/platforms/station/${station.id}`);
    if (response.ok) {
      const result = await response.json();
      platformsByStation.value[station.id] = result.data || [];
    }
  } catch (error) {
    console.error('Failed to load platforms:', error);
  } finally {
    loadingPlatforms.value.delete(station.id);
  }
}

// Load instruments for a platform
async function loadInstrumentsForPlatform(platformId) {
  if (loadingInstruments.value.has(platformId)) return;

  loadingInstruments.value.add(platformId);
  try {
    // Correct endpoint: /api/v10/instruments/platform/:platformId
    const response = await fetch(`/api/v10/instruments/platform/${platformId}`);
    if (response.ok) {
      const result = await response.json();
      instrumentsByPlatform.value[platformId] = result.data || [];
    }
  } catch (error) {
    console.error('Failed to load instruments:', error);
  } finally {
    loadingInstruments.value.delete(platformId);
  }
}

// Get platforms for a station
function getPlatforms(stationId) {
  return platformsByStation.value[stationId] || [];
}

// Get instruments for a platform
function getInstruments(platformId) {
  return instrumentsByPlatform.value[platformId] || [];
}

// Check if items are selected
function isStationSelected(acronym) {
  return currentStationAcronym.value === acronym && !currentPlatformId.value;
}

function isPlatformSelected(platformId) {
  return currentPlatformId.value === platformId && !currentInstrumentId.value;
}

function isInstrumentSelected(instrumentId) {
  return currentInstrumentId.value === instrumentId;
}

// Platform type icons - SVG paths matching useTypes.js definitions
function getPlatformIcon(type) {
  const icons = {
    // Fixed: Tower/observation tower
    fixed: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
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

// Instrument type icons - SVG paths matching useTypes.js definitions
function getInstrumentIcon(type) {
  const typeKey = type?.toLowerCase() || '';

  // Phenocam: Camera icon
  if (typeKey.includes('phenocam') || typeKey.includes('camera')) {
    return 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z';
  }
  // Multispectral: Layer/stack icon
  if (typeKey.includes('multispectral')) {
    return 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253';
  }
  // PAR Sensor: Sun icon
  if (typeKey.includes('par')) {
    return 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
  }
  // NDVI Sensor: Leaf icon
  if (typeKey.includes('ndvi')) {
    return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
  }
  // PRI Sensor: Microscope/spectrum icon
  if (typeKey.includes('pri')) {
    return 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
  }
  // Hyperspectral: Rainbow/spectrum icon
  if (typeKey.includes('hyperspectral')) {
    return 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01';
  }
  // Thermal: Temperature icon
  if (typeKey.includes('thermal')) {
    return 'M9 19c-4.3 1.4-6-2.7-6-7 0-4.3 1.7-8.4 6-7m0 14V5m0 14a5 5 0 005-5 5 5 0 00-5-5';
  }
  // LiDAR: Wave/pulse icon
  if (typeKey.includes('lidar')) {
    return 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3';
  }
  // Radar/SAR: Satellite dish icon
  if (typeKey.includes('radar') || typeKey.includes('sar')) {
    return 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0';
  }
  // Default: Generic sensor/chip icon
  return 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z';
}
</script>

<template>
  <aside class="w-64 bg-base-100 min-h-screen border-r border-base-200 fixed left-0 top-16 overflow-y-auto pb-20">
    <div class="p-3">
      <!-- Stations header -->
      <div class="flex items-center justify-between mb-3 px-1">
        <h2 class="text-sm font-semibold text-base-content/70 uppercase tracking-wide">Navigation</h2>
        <span class="badge badge-primary badge-xs">
          {{ displayStations.length }}
        </span>
      </div>

      <!-- Loading state -->
      <div v-if="stationsStore.loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-sm"></span>
      </div>

      <!-- Error state -->
      <div v-else-if="stationsStore.error" class="alert alert-error text-xs p-2">
        <span>{{ stationsStore.error }}</span>
      </div>

      <!-- Hierarchical tree -->
      <ul v-else class="menu menu-xs bg-base-100 rounded-lg p-0 gap-0.5">
        <li v-for="station in displayStations" :key="station.acronym">
          <!-- Station item -->
          <div class="flex items-center gap-1 p-0">
            <!-- Expand/collapse button -->
            <button
              class="btn btn-ghost btn-xs btn-square"
              @click.stop="toggleStation(station)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3 transition-transform"
                :class="{ 'rotate-90': expandedStations.has(station.acronym) }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Station link -->
            <router-link
              :to="`/stations/${station.acronym}`"
              class="flex-1 flex items-center gap-2 py-1.5 px-1 rounded hover:bg-base-200 text-sm"
              :class="{
                'bg-primary/10 text-primary font-medium': isStationSelected(station.acronym)
              }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="font-medium">{{ station.acronym }}</span>
              <span class="text-xs text-base-content/50 truncate hidden lg:inline">{{ station.display_name }}</span>
            </router-link>
          </div>

          <!-- Platforms (expanded) -->
          <ul v-if="expandedStations.has(station.acronym)" class="ml-4 pl-2 border-l border-base-300">
            <!-- Loading platforms -->
            <li v-if="loadingPlatforms.has(station.id)" class="py-2 pl-2">
              <span class="loading loading-spinner loading-xs"></span>
            </li>

            <!-- Platform list -->
            <li v-for="platform in getPlatforms(station.id)" :key="platform.id" class="mt-0.5">
              <div class="flex items-center gap-1 p-0">
                <!-- Expand/collapse button -->
                <button
                  class="btn btn-ghost btn-xs btn-square"
                  @click.stop="togglePlatform(platform.id)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 transition-transform"
                    :class="{ 'rotate-90': expandedPlatforms.has(platform.id) }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <!-- Platform link -->
                <router-link
                  :to="`/platforms/${platform.id}`"
                  class="flex-1 flex items-center gap-2 py-1 px-1 rounded hover:bg-base-200 text-xs"
                  :class="{
                    'bg-primary/10 text-primary font-medium': isPlatformSelected(platform.id)
                  }"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 flex-shrink-0 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getPlatformIcon(platform.platform_type)" />
                  </svg>
                  <span class="truncate">{{ platform.normalized_name || platform.display_name }}</span>
                </router-link>
              </div>

              <!-- Instruments (expanded) -->
              <ul v-if="expandedPlatforms.has(platform.id)" class="ml-4 pl-2 border-l border-base-300">
                <!-- Loading instruments -->
                <li v-if="loadingInstruments.has(platform.id)" class="py-1 pl-2">
                  <span class="loading loading-spinner loading-xs"></span>
                </li>

                <!-- Instrument list -->
                <li v-for="instrument in getInstruments(platform.id)" :key="instrument.id" class="mt-0.5">
                  <router-link
                    :to="`/instruments/${instrument.id}`"
                    class="flex items-center gap-2 py-1 px-2 rounded hover:bg-base-200 text-xs"
                    :class="{
                      'bg-primary/10 text-primary font-medium': isInstrumentSelected(instrument.id)
                    }"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 flex-shrink-0 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getInstrumentIcon(instrument.instrument_type)" />
                    </svg>
                    <span class="truncate">{{ instrument.normalized_name || instrument.display_name }}</span>
                  </router-link>
                </li>

                <!-- No instruments -->
                <li v-if="!loadingInstruments.has(platform.id) && getInstruments(platform.id).length === 0" class="py-1 pl-2 text-xs text-base-content/40 italic">
                  No instruments
                </li>
              </ul>
            </li>

            <!-- No platforms -->
            <li v-if="!loadingPlatforms.has(station.id) && getPlatforms(station.id).length === 0" class="py-2 pl-2 text-xs text-base-content/40 italic">
              No platforms
            </li>
          </ul>
        </li>
      </ul>

      <!-- Admin section -->
      <div v-if="authStore.isAdmin" class="mt-6 pt-4 border-t border-base-200">
        <h3 class="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-2 px-1">Admin</h3>
        <ul class="menu menu-xs p-0">
          <li>
            <router-link to="/admin" class="text-base-content/70 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </router-link>
          </li>
          <li>
            <router-link to="/admin/settings" class="text-base-content/70 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users & Settings
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>
