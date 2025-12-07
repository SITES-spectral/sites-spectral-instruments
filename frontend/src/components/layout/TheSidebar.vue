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
    const response = await fetch(`/api/v10/stations/${station.id}/platforms`);
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
    const response = await fetch(`/api/v10/platforms/${platformId}/instruments`);
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

// Platform type icons
function getPlatformIcon(type) {
  const icons = {
    fixed: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    uav: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
    satellite: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  };
  return icons[type] || icons.fixed;
}

// Instrument type icons
function getInstrumentIcon(type) {
  const typeKey = type?.toLowerCase() || '';
  if (typeKey.includes('phenocam') || typeKey.includes('camera')) {
    return 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z';
  }
  if (typeKey.includes('multispectral')) {
    return 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253';
  }
  // Default sensor icon
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
                  <span class="truncate">{{ platform.normalized_name?.split('_').slice(-1)[0] || platform.display_name }}</span>
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
                    <span class="truncate">{{ instrument.normalized_name?.split('_').slice(-1)[0] || instrument.display_name }}</span>
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
