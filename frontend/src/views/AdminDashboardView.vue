<script setup>
/**
 * Admin Dashboard View
 *
 * Admin-only dashboard showing comprehensive analytics:
 * - Station update frequency and connection history
 * - User login activity tracking
 * - Weekly and yearly usage trends
 * - CRUD operation analytics (create, update, delete)
 * - Peak usage hours
 * - System health overview
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@stores/auth';
import { useAdminStore } from '@stores/admin';

const authStore = useAuthStore();
const adminStore = useAdminStore();

// Local state
const activeTab = ref('overview'); // 'overview', 'activity', 'users', 'trends'
const selectedStation = ref(null);
const showActivityDetails = ref(false);

// Computed from store
const loading = computed(() => adminStore.loading);
const error = computed(() => adminStore.error);

// Summary statistics
const summaryStats = computed(() => {
  const logs = adminStore.activityLogs;
  const users = adminStore.userSessions;
  const stations = adminStore.stationStats;

  return {
    totalStations: stations.length,
    activeStations: stations.filter(s => s.total_activity > 0).length,
    inactiveStations: stations.filter(s => s.total_activity === 0).length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.last_login).length,
    neverLoggedIn: users.filter(u => !u.last_login).length,
    totalOperations: logs.length,
    creates: logs.filter(l => l.action?.toLowerCase() === 'create').length,
    updates: logs.filter(l => l.action?.toLowerCase() === 'update').length,
    deletes: logs.filter(l => l.action?.toLowerCase() === 'delete').length
  };
});

// Weekly activity for bar chart visualization
const weeklyChartData = computed(() => {
  return adminStore.weeklyActivity;
});

// Monthly trends for long-term analysis
const monthlyTrendData = computed(() => {
  return adminStore.monthlyTrend.slice(-12); // Last 12 months
});

// Peak usage visualization
const peakHours = computed(() => {
  const hours = adminStore.peakUsageHours;
  const maxCount = Math.max(...hours.map(h => h.count), 1);
  return hours.map(h => ({
    ...h,
    percentage: (h.count / maxCount) * 100
  }));
});

// Station activity with trend indicators
const stationActivityList = computed(() => {
  return adminStore.activityByStation
    .map(station => {
      const total = station.activities.length;
      const lastWeek = station.activities.filter(a => {
        const date = new Date(a.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }).length;

      return {
        ...station,
        total,
        lastWeek,
        trend: lastWeek > total / 4 ? 'up' : lastWeek < total / 8 ? 'down' : 'stable'
      };
    })
    .sort((a, b) => b.total - a.total);
});

// User activity with login history
const userActivityList = computed(() => {
  return adminStore.userSessions.map(user => {
    const daysSinceLogin = user.last_login
      ? Math.floor((Date.now() - new Date(user.last_login)) / (1000 * 60 * 60 * 24))
      : Infinity;

    return {
      ...user,
      daysSinceLogin,
      status: !user.last_login ? 'never' : daysSinceLogin > 30 ? 'inactive' : daysSinceLogin > 7 ? 'occasional' : 'active'
    };
  });
});

// Functions
function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
}

function getActivityBadge(count) {
  if (count === 0) return 'badge-error';
  if (count < 5) return 'badge-warning';
  if (count < 20) return 'badge-info';
  return 'badge-success';
}

function getStatusColor(status) {
  switch (status) {
    case 'active': return 'text-success';
    case 'occasional': return 'text-info';
    case 'inactive': return 'text-warning';
    case 'never': return 'text-error';
    default: return 'text-base-content';
  }
}

function getTrendIcon(trend) {
  switch (trend) {
    case 'up': return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6';
    case 'down': return 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6';
    default: return 'M4 12h16';
  }
}

function getTrendColor(trend) {
  switch (trend) {
    case 'up': return 'text-success';
    case 'down': return 'text-error';
    default: return 'text-base-content/50';
  }
}

function viewStationDetails(station) {
  selectedStation.value = station;
  showActivityDetails.value = true;
}

async function refreshData() {
  await adminStore.fetchAllAdminData();
}

function changeTimeRange(range) {
  adminStore.setTimeRange(range);
}

onMounted(() => {
  refreshData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Admin Dashboard</h1>
        <p class="text-base-content/60">Station activity, user analytics, and usage trends</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="tabs tabs-boxed">
          <button
            class="tab"
            :class="{ 'tab-active': adminStore.timeRange === 'week' }"
            @click="changeTimeRange('week')"
          >
            Week
          </button>
          <button
            class="tab"
            :class="{ 'tab-active': adminStore.timeRange === 'month' }"
            @click="changeTimeRange('month')"
          >
            Month
          </button>
          <button
            class="tab"
            :class="{ 'tab-active': adminStore.timeRange === 'year' }"
            @click="changeTimeRange('year')"
          >
            Year
          </button>
        </div>
        <button class="btn btn-primary btn-sm" @click="refreshData" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs tabs-bordered">
      <button class="tab" :class="{ 'tab-active': activeTab === 'overview' }" @click="activeTab = 'overview'">
        Overview
      </button>
      <button class="tab" :class="{ 'tab-active': activeTab === 'activity' }" @click="activeTab = 'activity'">
        Station Activity
      </button>
      <button class="tab" :class="{ 'tab-active': activeTab === 'users' }" @click="activeTab = 'users'">
        User Logins
      </button>
      <button class="tab" :class="{ 'tab-active': activeTab === 'trends' }" @click="activeTab = 'trends'">
        Trends & Analytics
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Overview Tab -->
      <div v-show="activeTab === 'overview'" class="space-y-6">
        <!-- Summary Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-title">Total Stations</div>
            <div class="stat-value text-primary">{{ summaryStats.totalStations }}</div>
            <div class="stat-desc">{{ summaryStats.activeStations }} active</div>
          </div>
          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-title">Total Users</div>
            <div class="stat-value text-secondary">{{ summaryStats.totalUsers }}</div>
            <div class="stat-desc">{{ summaryStats.activeUsers }} logged in</div>
          </div>
          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-title">Total Operations</div>
            <div class="stat-value text-accent">{{ summaryStats.totalOperations }}</div>
            <div class="stat-desc">
              <span class="text-success">+{{ summaryStats.creates }}</span> /
              <span class="text-info">~{{ summaryStats.updates }}</span> /
              <span class="text-error">-{{ summaryStats.deletes }}</span>
            </div>
          </div>
          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-title">Attention Needed</div>
            <div class="stat-value" :class="summaryStats.inactiveStations + summaryStats.neverLoggedIn > 0 ? 'text-warning' : 'text-success'">
              {{ summaryStats.inactiveStations + summaryStats.neverLoggedIn }}
            </div>
            <div class="stat-desc">{{ summaryStats.inactiveStations }} stations, {{ summaryStats.neverLoggedIn }} users</div>
          </div>
        </div>

        <!-- Weekly Activity Chart -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Weekly Activity</h2>
            <div class="h-48 flex items-end gap-1 px-4">
              <div
                v-for="day in weeklyChartData"
                :key="day.day"
                class="flex-1 flex flex-col items-center"
              >
                <div class="flex-1 w-full flex flex-col justify-end gap-0.5">
                  <div
                    v-if="day.creates > 0"
                    class="bg-success rounded-t"
                    :style="{ height: Math.max(day.creates * 4, 2) + 'px' }"
                    :title="day.creates + ' creates'"
                  ></div>
                  <div
                    v-if="day.updates > 0"
                    class="bg-info"
                    :style="{ height: Math.max(day.updates * 4, 2) + 'px' }"
                    :title="day.updates + ' updates'"
                  ></div>
                  <div
                    v-if="day.deletes > 0"
                    class="bg-error"
                    :style="{ height: Math.max(day.deletes * 4, 2) + 'px' }"
                    :title="day.deletes + ' deletes'"
                  ></div>
                  <div
                    v-if="day.logins > 0"
                    class="bg-primary rounded-b"
                    :style="{ height: Math.max(day.logins * 4, 2) + 'px' }"
                    :title="day.logins + ' logins'"
                  ></div>
                </div>
                <div class="text-xs text-base-content/60 mt-2">{{ day.day }}</div>
              </div>
            </div>
            <div class="flex justify-center gap-4 mt-4">
              <span class="flex items-center gap-1 text-xs">
                <span class="w-3 h-3 bg-success rounded"></span> Creates
              </span>
              <span class="flex items-center gap-1 text-xs">
                <span class="w-3 h-3 bg-info rounded"></span> Updates
              </span>
              <span class="flex items-center gap-1 text-xs">
                <span class="w-3 h-3 bg-error rounded"></span> Deletes
              </span>
              <span class="flex items-center gap-1 text-xs">
                <span class="w-3 h-3 bg-primary rounded"></span> Logins
              </span>
            </div>
          </div>
        </div>

        <!-- Alerts Section -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Attention Required
            </h2>

            <div class="space-y-2">
              <div v-if="adminStore.neverLoggedInUsers.length > 0" class="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 class="font-bold">{{ adminStore.neverLoggedInUsers.length }} user(s) have never logged in</h3>
                  <div class="text-sm">
                    {{ adminStore.neverLoggedInUsers.map(u => u.username).join(', ') }}
                  </div>
                </div>
              </div>

              <div v-if="adminStore.leastActiveStations.length > 0" class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 class="font-bold">{{ adminStore.leastActiveStations.length }} station(s) with no recent activity</h3>
                  <div class="text-sm">
                    {{ adminStore.leastActiveStations.map(s => s.station_acronym || s.acronym).join(', ') }}
                  </div>
                </div>
              </div>

              <div v-if="adminStore.neverLoggedInUsers.length === 0 && adminStore.leastActiveStations.length === 0" class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>All systems operational. No issues detected.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Station Activity Tab -->
      <div v-show="activeTab === 'activity'" class="space-y-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Station Activity & Connection History</h2>
            <p class="text-sm text-base-content/60">Track when stations connect and perform CRUD operations</p>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Creates</th>
                    <th>Updates</th>
                    <th>Deletes</th>
                    <th>Last Week</th>
                    <th>Total</th>
                    <th>Trend</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="station in stationActivityList" :key="station.station_id">
                    <td>
                      <div class="font-bold">{{ station.station_acronym }}</div>
                    </td>
                    <td><span class="badge badge-success badge-sm">{{ station.create_count }}</span></td>
                    <td><span class="badge badge-info badge-sm">{{ station.update_count }}</span></td>
                    <td><span class="badge badge-error badge-sm">{{ station.delete_count }}</span></td>
                    <td>{{ station.lastWeek }}</td>
                    <td><span class="font-semibold">{{ station.total }}</span></td>
                    <td>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        :class="getTrendColor(station.trend)"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getTrendIcon(station.trend)" />
                      </svg>
                    </td>
                    <td>
                      <button class="btn btn-ghost btn-xs" @click="viewStationDetails(station)">
                        Details
                      </button>
                    </td>
                  </tr>
                  <tr v-if="stationActivityList.length === 0">
                    <td colspan="8" class="text-center text-base-content/60">No activity data available</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- User Logins Tab -->
      <div v-show="activeTab === 'users'" class="space-y-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">User Login Activity</h2>
            <p class="text-sm text-base-content/60">Track user connections and identify inactive accounts</p>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Station</th>
                    <th>Last Login</th>
                    <th>Days Since</th>
                    <th>Login Count</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in userActivityList"
                    :key="user.id"
                    :class="{ 'bg-warning/10': user.status === 'never' }"
                  >
                    <td>
                      <div class="font-bold">{{ user.username }}</div>
                    </td>
                    <td>
                      <span class="badge badge-ghost badge-sm">{{ user.role }}</span>
                    </td>
                    <td>{{ user.station_acronym || '-' }}</td>
                    <td class="text-sm">{{ formatDate(user.last_login) }}</td>
                    <td :class="getStatusColor(user.status)">
                      {{ user.status === 'never' ? 'Never' : user.daysSinceLogin + ' days' }}
                    </td>
                    <td>{{ user.login_count || 0 }}</td>
                    <td>
                      <span
                        class="badge badge-sm"
                        :class="{
                          'badge-success': user.status === 'active',
                          'badge-info': user.status === 'occasional',
                          'badge-warning': user.status === 'inactive',
                          'badge-error': user.status === 'never'
                        }"
                      >
                        {{ user.status === 'never' ? 'Never logged in' : user.status }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="userActivityList.length === 0">
                    <td colspan="7" class="text-center text-base-content/60">No user data available</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Trends Tab -->
      <div v-show="activeTab === 'trends'" class="space-y-6">
        <!-- Monthly Trend Chart -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Monthly Usage Trend</h2>
            <p class="text-sm text-base-content/60">Long-term activity patterns over the past year</p>

            <div class="overflow-x-auto">
              <div class="h-64 flex items-end gap-2 min-w-max px-4">
                <div
                  v-for="month in monthlyTrendData"
                  :key="month.month"
                  class="flex flex-col items-center"
                  style="width: 60px;"
                >
                  <div class="flex-1 w-full flex flex-col justify-end gap-0.5">
                    <div
                      class="bg-primary/80 rounded-t w-full"
                      :style="{ height: Math.max(month.total * 2, 4) + 'px' }"
                    ></div>
                  </div>
                  <div class="text-xs text-base-content/60 mt-2 text-center">
                    {{ month.month }}
                  </div>
                  <div class="text-xs font-semibold">{{ month.total }}</div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <template v-if="monthlyTrendData.length > 0">
                <div class="text-center p-3 bg-base-200 rounded-lg">
                  <div class="text-lg font-bold text-primary">
                    {{ monthlyTrendData[monthlyTrendData.length - 1]?.unique_users || 0 }}
                  </div>
                  <div class="text-xs text-base-content/60">Unique Users (Last Month)</div>
                </div>
                <div class="text-center p-3 bg-base-200 rounded-lg">
                  <div class="text-lg font-bold text-secondary">
                    {{ monthlyTrendData[monthlyTrendData.length - 1]?.unique_stations || 0 }}
                  </div>
                  <div class="text-xs text-base-content/60">Active Stations (Last Month)</div>
                </div>
                <div class="text-center p-3 bg-base-200 rounded-lg">
                  <div class="text-lg font-bold text-accent">
                    {{ Math.round(monthlyTrendData.reduce((sum, m) => sum + m.total, 0) / monthlyTrendData.length) }}
                  </div>
                  <div class="text-xs text-base-content/60">Avg. Monthly Operations</div>
                </div>
                <div class="text-center p-3 bg-base-200 rounded-lg">
                  <div class="text-lg font-bold">
                    {{ monthlyTrendData.reduce((sum, m) => sum + m.total, 0) }}
                  </div>
                  <div class="text-xs text-base-content/60">Total Operations (Year)</div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Peak Usage Hours -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Peak Usage Hours</h2>
            <p class="text-sm text-base-content/60">Identify when the platform is most frequently used</p>

            <div class="flex items-end gap-0.5 h-32">
              <div
                v-for="hour in peakHours"
                :key="hour.hour"
                class="flex-1 flex flex-col items-center"
              >
                <div
                  class="w-full bg-primary/70 hover:bg-primary transition-colors rounded-t cursor-pointer"
                  :style="{ height: hour.percentage + '%', minHeight: hour.count > 0 ? '4px' : '0' }"
                  :title="hour.label + ': ' + hour.count + ' operations'"
                ></div>
              </div>
            </div>
            <div class="flex justify-between text-xs text-base-content/60 px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>
        </div>

        <!-- Most Active Stations -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Most Active Stations</h2>

            <div class="space-y-3">
              <div
                v-for="(station, index) in adminStore.mostActiveStations.slice(0, 5)"
                :key="station.station_id"
                class="flex items-center gap-4"
              >
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {{ index + 1 }}
                </div>
                <div class="flex-1">
                  <div class="font-semibold">{{ station.station_acronym || station.acronym }}</div>
                  <div class="text-sm text-base-content/60">{{ station.total_activity || station.total || 0 }} operations</div>
                </div>
                <div class="w-32 bg-base-200 rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full"
                    :style="{ width: Math.min(((station.total_activity || station.total || 0) / (adminStore.mostActiveStations[0]?.total_activity || 1)) * 100, 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Station Details Modal -->
    <dialog :class="{ 'modal modal-open': showActivityDetails, 'modal': !showActivityDetails }">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg">
          {{ selectedStation?.station_acronym }} Activity Details
        </h3>
        <div v-if="selectedStation" class="py-4 space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Creates</div>
              <div class="stat-value text-success text-2xl">{{ selectedStation.create_count }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Updates</div>
              <div class="stat-value text-info text-2xl">{{ selectedStation.update_count }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title">Deletes</div>
              <div class="stat-value text-error text-2xl">{{ selectedStation.delete_count }}</div>
            </div>
          </div>

          <div class="divider">Recent Activity</div>

          <div class="max-h-64 overflow-y-auto">
            <table class="table table-xs">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Date</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="activity in selectedStation.activities?.slice(0, 20)" :key="activity.id">
                  <td>
                    <span
                      class="badge badge-xs"
                      :class="{
                        'badge-success': activity.action === 'create',
                        'badge-info': activity.action === 'update',
                        'badge-error': activity.action === 'delete'
                      }"
                    >
                      {{ activity.action }}
                    </span>
                  </td>
                  <td>{{ activity.entity_type }}</td>
                  <td class="text-xs">{{ formatShortDate(activity.created_at) }}</td>
                  <td>{{ activity.username || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" @click="showActivityDetails = false">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showActivityDetails = false">close</button>
      </form>
    </dialog>

    <!-- System Health (collapsible) -->
    <div v-if="adminStore.systemHealth" class="collapse collapse-arrow bg-base-100 shadow">
      <input type="checkbox" />
      <div class="collapse-title font-medium">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          System Health
          <span
            class="badge badge-sm"
            :class="adminStore.systemHealth.status === 'healthy' ? 'badge-success' : 'badge-error'"
          >
            {{ adminStore.systemHealth.status }}
          </span>
        </div>
      </div>
      <div class="collapse-content">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div class="text-center p-4 bg-base-200 rounded-lg">
            <div class="text-xl font-bold">{{ adminStore.systemHealth.version }}</div>
            <div class="text-sm text-base-content/60">Version</div>
          </div>
          <div class="text-center p-4 bg-base-200 rounded-lg">
            <div class="text-xl font-bold text-success">{{ adminStore.systemHealth.database }}</div>
            <div class="text-sm text-base-content/60">Database</div>
          </div>
          <div class="text-center p-4 bg-base-200 rounded-lg">
            <div class="text-xl font-bold">{{ adminStore.systemHealth.architecture }}</div>
            <div class="text-sm text-base-content/60">Architecture</div>
          </div>
          <div class="text-center p-4 bg-base-200 rounded-lg">
            <div class="text-xl font-bold">v11</div>
            <div class="text-sm text-base-content/60">API Version</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
