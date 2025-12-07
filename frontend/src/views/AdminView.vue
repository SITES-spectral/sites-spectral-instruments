<script setup>
/**
 * Admin View
 *
 * System administration panel for managing users, settings, and system configuration.
 * Only accessible to admin roles.
 */
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@stores/auth';
import { useRoles } from '@composables/useRoles';
import { UserManagement } from '@components/admin';

const router = useRouter();
const authStore = useAuthStore();
const { canManageUsers, canManageSettings, currentRoleDisplay, roleBadgeClass } = useRoles();

// Redirect if not admin
onMounted(() => {
  if (!authStore.isAdmin) {
    router.push('/');
  }
});

// Active tab
const activeTab = ref('users');

// Tabs configuration
const tabs = computed(() => {
  const allTabs = [
    { id: 'users', name: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', visible: canManageUsers.value },
    { id: 'settings', name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', visible: canManageSettings.value },
    { id: 'activity', name: 'Activity Log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', visible: canManageSettings.value }
  ];
  return allTabs.filter(tab => tab.visible);
});

// System stats (placeholder)
const systemStats = ref({
  totalUsers: 0,
  totalStations: 7,
  totalPlatforms: 0,
  totalInstruments: 0
});
</script>

<template>
  <div v-if="authStore.isAdmin">
    <!-- Header -->
    <div class="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Administration</h1>
          <p class="text-base-content/60 mt-1">
            Manage users, settings, and system configuration
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span :class="['badge', roleBadgeClass]">{{ currentRoleDisplay }}</span>
          <span class="text-sm text-base-content/60">{{ authStore.user?.username }}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-base-200">
        <div class="stat bg-base-200 rounded-lg p-4">
          <div class="stat-title text-xs">Users</div>
          <div class="stat-value text-2xl">{{ systemStats.totalUsers }}</div>
        </div>
        <div class="stat bg-base-200 rounded-lg p-4">
          <div class="stat-title text-xs">Stations</div>
          <div class="stat-value text-2xl">{{ systemStats.totalStations }}</div>
        </div>
        <div class="stat bg-base-200 rounded-lg p-4">
          <div class="stat-title text-xs">Platforms</div>
          <div class="stat-value text-2xl">{{ systemStats.totalPlatforms }}</div>
        </div>
        <div class="stat bg-base-200 rounded-lg p-4">
          <div class="stat-title text-xs">Instruments</div>
          <div class="stat-value text-2xl">{{ systemStats.totalInstruments }}</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs tabs-boxed bg-base-200 p-1 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { 'tab-active': activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
        </svg>
        {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="bg-base-100 rounded-lg shadow-lg p-6">
      <!-- Users Tab -->
      <UserManagement v-if="activeTab === 'users'" />

      <!-- Settings Tab -->
      <div v-else-if="activeTab === 'settings'" class="space-y-6">
        <h2 class="text-xl font-semibold">System Settings</h2>

        <div class="divider">Application</div>

        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-4">
            <input type="checkbox" class="toggle toggle-primary" checked />
            <div>
              <span class="label-text font-medium">Enable User Registration</span>
              <p class="text-xs text-base-content/60">Allow new users to self-register</p>
            </div>
          </label>
        </div>

        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-4">
            <input type="checkbox" class="toggle toggle-primary" checked />
            <div>
              <span class="label-text font-medium">Require Email Verification</span>
              <p class="text-xs text-base-content/60">New users must verify email before access</p>
            </div>
          </label>
        </div>

        <div class="divider">Security</div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Session Timeout (hours)</span>
          </label>
          <input type="number" class="input input-bordered w-32" value="24" min="1" max="168" />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Max Login Attempts</span>
          </label>
          <input type="number" class="input input-bordered w-32" value="5" min="3" max="10" />
        </div>

        <div class="divider">Maintenance</div>

        <div class="flex gap-4">
          <button class="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export Database
          </button>
          <button class="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear Cache
          </button>
        </div>
      </div>

      <!-- Activity Log Tab -->
      <div v-else-if="activeTab === 'activity'" class="space-y-4">
        <h2 class="text-xl font-semibold">Activity Log</h2>

        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="5" class="text-center text-base-content/60 py-8">
                  Activity log will be displayed here
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Access Denied -->
  <div v-else class="text-center py-12">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
    <h2 class="text-xl font-bold mt-4">Access Denied</h2>
    <p class="text-base-content/60 mt-2">You do not have permission to access this area.</p>
    <button class="btn btn-primary mt-4" @click="router.push('/')">
      Return to Dashboard
    </button>
  </div>
</template>
