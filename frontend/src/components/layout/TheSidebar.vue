<script setup>
/**
 * Main Sidebar Navigation
 *
 * Displays station list and navigation options.
 */
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStationsStore } from '@stores/stations';
import { useAuthStore } from '@stores/auth';

const route = useRoute();
const stationsStore = useStationsStore();
const authStore = useAuthStore();

// Load stations on mount
onMounted(async () => {
  if (stationsStore.stations.length === 0) {
    await stationsStore.fetchStations();
  }
});

// Current station acronym
const currentAcronym = computed(() => route.params.acronym);

// Stations to display
const displayStations = computed(() => {
  return stationsStore.activeStations;
});

// Check if station is selected
function isSelected(acronym) {
  return currentAcronym.value === acronym;
}

// Platform type icon mapping
function getPlatformIcon(type) {
  const icons = {
    fixed: 'tower-observation',
    uav: 'crosshairs',
    satellite: 'satellite'
  };
  return icons[type] || 'cube';
}
</script>

<template>
  <aside class="w-64 bg-base-100 min-h-screen border-r border-base-200 fixed left-0 top-16 overflow-y-auto">
    <div class="p-4">
      <!-- Stations header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Stations</h2>
        <span class="badge badge-primary badge-sm">
          {{ displayStations.length }}
        </span>
      </div>

      <!-- Loading state -->
      <div v-if="stationsStore.loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-md"></span>
      </div>

      <!-- Error state -->
      <div v-else-if="stationsStore.error" class="alert alert-error text-sm">
        <span>{{ stationsStore.error }}</span>
      </div>

      <!-- Station list -->
      <ul v-else class="menu menu-sm bg-base-100 rounded-lg gap-1">
        <li v-for="station in displayStations" :key="station.acronym">
          <router-link
            :to="`/stations/${station.acronym}`"
            :class="{
              'active': isSelected(station.acronym),
              'bg-primary text-primary-content': isSelected(station.acronym)
            }"
            class="flex items-center gap-2 py-2"
          >
            <!-- Station icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>

            <!-- Station info -->
            <div class="flex-1 min-w-0">
              <div class="font-medium">{{ station.acronym }}</div>
              <div class="text-xs opacity-70 truncate">
                {{ station.display_name }}
              </div>
            </div>

            <!-- Platform count badge -->
            <span v-if="station.platform_count" class="badge badge-ghost badge-xs">
              {{ station.platform_count }}
            </span>
          </router-link>
        </li>
      </ul>

      <!-- Admin section -->
      <div v-if="authStore.isAdmin" class="mt-6 pt-4 border-t border-base-200">
        <h3 class="text-sm font-medium text-base-content/70 mb-2">Admin</h3>
        <ul class="menu menu-sm">
          <li>
            <a href="#" class="text-base-content/70">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Settings
            </a>
          </li>
          <li>
            <a href="#" class="text-base-content/70">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Users
            </a>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>
