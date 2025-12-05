<script setup>
/**
 * Station View
 *
 * Displays station details and its platforms/instruments.
 */
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStationsStore } from '@stores/stations';
import { usePlatformsStore } from '@stores/platforms';
import { useAuthStore } from '@stores/auth';
import PlatformCard from '@components/cards/PlatformCard.vue';

const props = defineProps({
  acronym: {
    type: String,
    required: true
  }
});

const route = useRoute();
const stationsStore = useStationsStore();
const platformsStore = usePlatformsStore();
const authStore = useAuthStore();

// Current station
const station = computed(() => stationsStore.currentStation);

// Can user edit this station?
const canEdit = computed(() => {
  if (!station.value) return false;
  return authStore.canEditStation(station.value.id);
});

// Platforms grouped by type
const platformsByType = computed(() => platformsStore.platformsByType);

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

          <!-- Edit button -->
          <button
            v-if="canEdit"
            class="btn btn-outline btn-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
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
        <button class="btn btn-primary">
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
          <button v-if="canEdit" class="btn btn-primary mt-4">
            Create First Platform
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
