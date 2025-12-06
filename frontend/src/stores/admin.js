/**
 * Admin Store
 *
 * Manages admin analytics, activity logs, and system health.
 * Provides station activity tracking, user login history, and trend analysis.
 *
 * @module stores/admin
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@services/api';

export const useAdminStore = defineStore('admin', () => {
  // State
  const activityLogs = ref([]);
  const userSessions = ref([]);
  const stationStats = ref([]);
  const systemHealth = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Time range for analytics
  const timeRange = ref('week'); // 'day', 'week', 'month', 'year'

  // Getters

  /**
   * Group activity by action type
   */
  const activityByAction = computed(() => {
    const grouped = {
      create: [],
      update: [],
      delete: [],
      login: [],
      logout: []
    };
    activityLogs.value.forEach(log => {
      const action = log.action?.toLowerCase() || 'unknown';
      if (grouped[action]) {
        grouped[action].push(log);
      }
    });
    return grouped;
  });

  /**
   * Group activity by station
   */
  const activityByStation = computed(() => {
    const grouped = {};
    activityLogs.value.forEach(log => {
      const stationId = log.station_id || 'system';
      if (!grouped[stationId]) {
        grouped[stationId] = {
          station_id: stationId,
          station_acronym: log.station_acronym || 'System',
          activities: [],
          create_count: 0,
          update_count: 0,
          delete_count: 0
        };
      }
      grouped[stationId].activities.push(log);
      const action = log.action?.toLowerCase();
      if (action === 'create') grouped[stationId].create_count++;
      if (action === 'update') grouped[stationId].update_count++;
      if (action === 'delete') grouped[stationId].delete_count++;
    });
    return Object.values(grouped);
  });

  /**
   * Weekly activity summary
   */
  const weeklyActivity = computed(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Group by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const summary = days.map(day => ({
      day,
      logins: 0,
      creates: 0,
      updates: 0,
      deletes: 0,
      total: 0
    }));

    activityLogs.value
      .filter(log => new Date(log.created_at) >= weekAgo)
      .forEach(log => {
        const dayIndex = new Date(log.created_at).getDay();
        const action = log.action?.toLowerCase();

        if (action === 'login') summary[dayIndex].logins++;
        if (action === 'create') summary[dayIndex].creates++;
        if (action === 'update') summary[dayIndex].updates++;
        if (action === 'delete') summary[dayIndex].deletes++;
        summary[dayIndex].total++;
      });

    return summary;
  });

  /**
   * Monthly activity for trend analysis
   */
  const monthlyTrend = computed(() => {
    const months = {};

    activityLogs.value.forEach(log => {
      const date = new Date(log.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[key]) {
        months[key] = {
          month: key,
          logins: 0,
          creates: 0,
          updates: 0,
          deletes: 0,
          total: 0,
          unique_users: new Set(),
          unique_stations: new Set()
        };
      }

      const action = log.action?.toLowerCase();
      if (action === 'login') months[key].logins++;
      if (action === 'create') months[key].creates++;
      if (action === 'update') months[key].updates++;
      if (action === 'delete') months[key].deletes++;
      months[key].total++;

      if (log.user_id) months[key].unique_users.add(log.user_id);
      if (log.station_id) months[key].unique_stations.add(log.station_id);
    });

    // Convert Sets to counts
    return Object.values(months)
      .map(m => ({
        ...m,
        unique_users: m.unique_users.size,
        unique_stations: m.unique_stations.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  });

  /**
   * Users who never logged in
   */
  const neverLoggedInUsers = computed(() => {
    return userSessions.value.filter(u => !u.last_login);
  });

  /**
   * Most active stations
   */
  const mostActiveStations = computed(() => {
    return [...stationStats.value]
      .sort((a, b) => b.total_activity - a.total_activity)
      .slice(0, 10);
  });

  /**
   * Least active stations (potential issues)
   */
  const leastActiveStations = computed(() => {
    return [...stationStats.value]
      .filter(s => s.total_activity === 0 || !s.last_activity)
      .sort((a, b) => {
        if (!a.last_activity) return -1;
        if (!b.last_activity) return 1;
        return new Date(a.last_activity) - new Date(b.last_activity);
      });
  });

  /**
   * Peak usage hours
   */
  const peakUsageHours = computed(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      count: 0
    }));

    activityLogs.value.forEach(log => {
      const hour = new Date(log.created_at).getHours();
      hours[hour].count++;
    });

    return hours;
  });

  // Actions

  /**
   * Fetch activity logs with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<void>}
   */
  async function fetchActivityLogs(filters = {}) {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams();
      if (filters.station_id) params.append('station_id', filters.station_id);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.action) params.append('action', filters.action);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.limit) params.append('limit', filters.limit);

      const query = params.toString();
      const url = `/admin/activity-logs${query ? '?' + query : ''}`;

      const response = await api.get(url);
      if (response.success) {
        activityLogs.value = response.data || [];
      } else {
        error.value = response.error || 'Failed to fetch activity logs';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch user session/login history
   * @returns {Promise<void>}
   */
  async function fetchUserSessions() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/admin/user-sessions');
      if (response.success) {
        userSessions.value = response.data || [];
      } else {
        error.value = response.error || 'Failed to fetch user sessions';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch station activity statistics
   * @returns {Promise<void>}
   */
  async function fetchStationStats() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/admin/station-stats');
      if (response.success) {
        stationStats.value = response.data || [];
      } else {
        error.value = response.error || 'Failed to fetch station stats';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch system health metrics
   * @returns {Promise<void>}
   */
  async function fetchSystemHealth() {
    try {
      const response = await api.get('/admin/health');
      if (response.success) {
        systemHealth.value = response.data;
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  }

  /**
   * Fetch all admin data
   * @returns {Promise<void>}
   */
  async function fetchAllAdminData() {
    loading.value = true;
    error.value = null;

    try {
      await Promise.all([
        fetchActivityLogs({ limit: 1000 }),
        fetchUserSessions(),
        fetchStationStats(),
        fetchSystemHealth()
      ]);
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set time range for analytics
   * @param {string} range - Time range ('day', 'week', 'month', 'year')
   */
  function setTimeRange(range) {
    timeRange.value = range;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (range) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Refresh data with new range
    fetchActivityLogs({
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      limit: 10000
    });
  }

  /**
   * Get activity summary for a specific station
   * @param {number} stationId - Station ID
   * @returns {Object}
   */
  function getStationActivitySummary(stationId) {
    const stationLogs = activityLogs.value.filter(log => log.station_id === stationId);

    return {
      total: stationLogs.length,
      creates: stationLogs.filter(l => l.action?.toLowerCase() === 'create').length,
      updates: stationLogs.filter(l => l.action?.toLowerCase() === 'update').length,
      deletes: stationLogs.filter(l => l.action?.toLowerCase() === 'delete').length,
      lastActivity: stationLogs.length > 0
        ? stationLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        : null
    };
  }

  /**
   * Clear all admin data
   */
  function clearAdminData() {
    activityLogs.value = [];
    userSessions.value = [];
    stationStats.value = [];
    systemHealth.value = null;
    error.value = null;
  }

  return {
    // State
    activityLogs,
    userSessions,
    stationStats,
    systemHealth,
    loading,
    error,
    timeRange,

    // Getters
    activityByAction,
    activityByStation,
    weeklyActivity,
    monthlyTrend,
    neverLoggedInUsers,
    mostActiveStations,
    leastActiveStations,
    peakUsageHours,

    // Actions
    fetchActivityLogs,
    fetchUserSessions,
    fetchStationStats,
    fetchSystemHealth,
    fetchAllAdminData,
    setTimeRange,
    getStationActivitySummary,
    clearAdminData
  };
});
