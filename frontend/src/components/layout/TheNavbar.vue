<script setup>
/**
 * Main Navigation Bar
 *
 * Displays logo, breadcrumbs, user menu, and theme toggle.
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@stores/auth';
import { useStationsStore } from '@stores/stations';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const stationsStore = useStationsStore();

// Build breadcrumbs from route
const breadcrumbs = computed(() => {
  const crumbs = [{ name: 'Home', path: '/' }];

  if (route.params.acronym) {
    crumbs.push({
      name: route.params.acronym,
      path: `/stations/${route.params.acronym}`
    });
  }

  return crumbs;
});

// User display name - prefer station display_name for station users
const userName = computed(() => {
  const userStation = authStore.user?.station_normalized_name;

  // Station users show their station's display name
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

// User role badge
const userRoleBadge = computed(() => {
  const role = authStore.userRole;
  const badges = {
    admin: 'badge-primary',
    station: 'badge-secondary',
    readonly: 'badge-ghost'
  };
  return badges[role] || 'badge-ghost';
});

// Logout handler
async function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <nav class="navbar bg-base-100 shadow-lg sticky top-0 z-50">
    <!-- Logo and brand -->
    <div class="navbar-start">
      <router-link to="/" class="btn btn-ghost normal-case text-xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
        SITES Spectral
      </router-link>
    </div>

    <!-- Breadcrumbs (center) -->
    <div class="navbar-center hidden lg:flex">
      <div class="breadcrumbs text-sm">
        <ul>
          <li v-for="crumb in breadcrumbs" :key="crumb.path">
            <router-link :to="crumb.path" class="hover:text-primary">
              {{ crumb.name }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- User menu (end) -->
    <div class="navbar-end">
      <!-- Theme toggle -->
      <label class="swap swap-rotate btn btn-ghost btn-circle mr-2">
        <input type="checkbox" class="theme-controller" value="dark" />
        <svg class="swap-on fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
        </svg>
        <svg class="swap-off fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>
      </label>

      <!-- Admin Menu (only for admins) -->
      <div v-if="authStore.isAdmin" class="dropdown dropdown-end mr-2">
        <div
          tabindex="0"
          role="button"
          class="btn btn-ghost btn-sm"
          :class="{ 'btn-active': route.path.startsWith('/admin') }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="hidden md:inline">Admin</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <ul
          tabindex="0"
          class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52"
        >
          <li>
            <router-link to="/admin" :class="{ 'active': route.path === '/admin' }">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </router-link>
          </li>
          <li>
            <router-link to="/admin/settings" :class="{ 'active': route.path === '/admin/settings' }">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users & Settings
            </router-link>
          </li>
        </ul>
      </div>

      <!-- User dropdown -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost gap-2">
          <div class="avatar placeholder">
            <div class="bg-neutral text-neutral-content rounded-full w-8">
              <span class="text-xs">{{ userName.charAt(0).toUpperCase() }}</span>
            </div>
          </div>
          <span class="hidden sm:inline">{{ userName }}</span>
          <span :class="['badge badge-sm', userRoleBadge]">
            {{ authStore.userRole }}
          </span>
        </div>
        <ul
          tabindex="0"
          class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52"
        >
          <li v-if="authStore.isAdmin">
            <router-link to="/admin">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Admin Dashboard
            </router-link>
          </li>
          <li v-if="authStore.isAdmin">
            <router-link to="/admin/settings">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users & Settings
            </router-link>
          </li>
          <li>
            <a class="justify-between">
              Profile
              <span class="badge badge-sm badge-outline">Coming soon</span>
            </a>
          </li>
          <li class="divider"></li>
          <li>
            <button @click="handleLogout" class="text-error">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
