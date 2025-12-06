<script setup>
/**
 * Root Application Component
 *
 * Provides the main layout structure with navbar,
 * sidebar (optional), and content area.
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import TheNavbar from '@components/layout/TheNavbar.vue';
import TheSidebar from '@components/layout/TheSidebar.vue';
import NotificationToast from '@components/layout/NotificationToast.vue';
import { useAuthStore } from '@stores/auth';

const route = useRoute();
const authStore = useAuthStore();

// Hide sidebar on login page
const showSidebar = computed(() => {
  return authStore.isAuthenticated && route.name !== 'login';
});

// Show navbar always except on login page
const showNavbar = computed(() => {
  return route.name !== 'login';
});
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Global Notifications -->
    <NotificationToast />

    <!-- Navbar -->
    <TheNavbar v-if="showNavbar" />

    <!-- Main content area -->
    <div class="flex">
      <!-- Sidebar -->
      <TheSidebar v-if="showSidebar" />

      <!-- Page content -->
      <main
        class="flex-1 p-4 lg:p-6"
        :class="{ 'ml-64': showSidebar }"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
