<script setup>
/**
 * Platform Card Component
 *
 * Displays platform summary with instruments.
 */
import { computed } from 'vue';

const props = defineProps({
  platform: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete']);

// Platform type styling
const typeStyles = computed(() => {
  const type = props.platform.platform_type;
  const styles = {
    fixed: {
      badge: 'badge-info',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    uav: {
      badge: 'badge-warning',
      icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
    },
    satellite: {
      badge: 'badge-secondary',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    }
  };
  return styles[type] || styles.fixed;
});

// Status badge class
const statusClass = computed(() => {
  const status = props.platform.status;
  return {
    'badge-success': status === 'Active',
    'badge-warning': status === 'Inactive',
    'badge-error': status === 'Decommissioned'
  };
});

// Instrument count
const instrumentCount = computed(() => {
  return props.platform.instrument_count || 0;
});
</script>

<template>
  <div class="card bg-base-100 shadow border border-base-200">
    <div class="card-body p-4">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <!-- Platform type icon -->
          <div :class="['p-2 rounded-lg', `bg-${platform.platform_type === 'uav' ? 'warning' : platform.platform_type === 'satellite' ? 'secondary' : 'info'}/10`]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              :class="`text-${platform.platform_type === 'uav' ? 'warning' : platform.platform_type === 'satellite' ? 'secondary' : 'info'}`"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="typeStyles.icon"
              />
            </svg>
          </div>

          <div>
            <h4 class="font-semibold">{{ platform.display_name }}</h4>
            <code class="text-xs text-base-content/60">
              {{ platform.normalized_name }}
            </code>
          </div>
        </div>

        <!-- Status and actions -->
        <div class="flex items-center gap-2">
          <span :class="['badge badge-sm', statusClass]">
            {{ platform.status }}
          </span>

          <!-- Edit dropdown -->
          <div v-if="canEdit" class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
              <li><a @click="emit('edit', platform)">Edit</a></li>
              <li><a class="text-error" @click="emit('delete', platform)">Delete</a></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="grid grid-cols-3 gap-2 mt-3 text-sm">
        <div>
          <span class="text-base-content/50">Type</span>
          <div :class="['badge badge-sm mt-1', typeStyles.badge]">
            {{ platform.platform_type }}
          </div>
        </div>
        <div v-if="platform.ecosystem_code">
          <span class="text-base-content/50">Ecosystem</span>
          <div class="font-medium">{{ platform.ecosystem_code }}</div>
        </div>
        <div>
          <span class="text-base-content/50">Instruments</span>
          <div class="font-medium">{{ instrumentCount }}</div>
        </div>
      </div>

      <!-- Description -->
      <p
        v-if="platform.description"
        class="text-sm text-base-content/60 mt-2 line-clamp-2"
      >
        {{ platform.description }}
      </p>

      <!-- View link -->
      <div class="card-actions justify-end mt-2">
        <router-link
          :to="`/platforms/${platform.id}`"
          class="btn btn-ghost btn-xs"
        >
          View Details
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>
