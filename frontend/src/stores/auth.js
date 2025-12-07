/**
 * Authentication Store
 *
 * Manages user authentication state, tokens, and permissions.
 *
 * Role Hierarchy:
 * - admin, spectral-admin, sites-admin, sites-spectral-admin: Full system access
 * - station-admin (e.g., abisko-admin): Full access to their station
 * - station (e.g., abisko): Limited edit access to their station
 * - readonly: View-only access
 *
 * @module stores/auth
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@services/api';

/**
 * Admin role identifiers (full system access)
 */
export const ADMIN_ROLES = ['admin', 'spectral-admin', 'sites-admin', 'sites-spectral-admin'];

/**
 * Admin usernames that get full access regardless of role field
 */
export const ADMIN_USERNAMES = ['admin', 'spectral-admin', 'sites-admin', 'sites-spectral-admin'];

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const token = ref(localStorage.getItem('auth_token'));
  const redirectPath = ref('/');

  // Check if user has admin privileges
  const isAdmin = computed(() => {
    if (!user.value) return false;
    // Check role
    if (ADMIN_ROLES.includes(user.value.role)) return true;
    // Check username for admin usernames
    if (ADMIN_USERNAMES.includes(user.value.username)) return true;
    return false;
  });

  // Check if user is a station admin (e.g., abisko-admin)
  const isStationAdmin = computed(() => {
    if (!user.value) return false;
    // Station admin role explicitly set
    if (user.value.role === 'station-admin') return true;
    // Username pattern: {station}-admin
    const username = user.value.username || '';
    return username.endsWith('-admin') && !ADMIN_USERNAMES.includes(username);
  });

  // Check if user is a regular station user
  const isStationUser = computed(() => {
    if (!user.value) return false;
    if (isAdmin.value) return false;
    if (isStationAdmin.value) return false;
    return user.value.role === 'station' || !!user.value.station_id;
  });

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => {
    if (isAdmin.value) return 'admin';
    if (isStationAdmin.value) return 'station-admin';
    if (isStationUser.value) return 'station';
    return user.value?.role || 'readonly';
  });
  const userStation = computed(() => user.value?.station_id || null);

  /**
   * Get station from username for station-admin users
   * e.g., "abisko-admin" -> "abisko"
   * @returns {string|null}
   */
  const userStationFromUsername = computed(() => {
    if (!user.value?.username) return null;
    const username = user.value.username;
    if (username.endsWith('-admin') && !ADMIN_USERNAMES.includes(username)) {
      return username.replace(/-admin$/, '');
    }
    // For regular station users, username might be the station
    if (isStationUser.value && !username.includes('-')) {
      return username;
    }
    return null;
  });

  /**
   * Check if user can edit a specific station
   * @param {number|string} stationIdOrAcronym - Station ID or acronym to check
   * @returns {boolean}
   */
  function canEditStation(stationIdOrAcronym) {
    if (isAdmin.value) return true;

    // Station admin can edit their station
    if (isStationAdmin.value) {
      const stationName = userStationFromUsername.value;
      // If passed an acronym, compare directly
      if (typeof stationIdOrAcronym === 'string') {
        return stationIdOrAcronym.toLowerCase() === stationName?.toLowerCase();
      }
      // If passed an ID, compare with userStation
      return userStation.value === stationIdOrAcronym;
    }

    // Regular station user can edit their assigned station
    if (isStationUser.value && userStation.value === stationIdOrAcronym) return true;
    return false;
  }

  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<boolean>}
   */
  async function login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });

      if (response.success) {
        token.value = response.token;
        user.value = response.user;
        localStorage.setItem('auth_token', response.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Initialize auth state from stored token
   * @returns {Promise<boolean>}
   */
  async function initialize() {
    if (!token.value) return false;

    try {
      const response = await api.get('/auth/me');
      if (response.success) {
        user.value = response.user;
        return true;
      }

      // Token invalid, clear it
      logout();
      return false;
    } catch (error) {
      logout();
      return false;
    }
  }

  /**
   * Set redirect path for after login
   * @param {string} path - Path to redirect to
   */
  function setRedirectPath(path) {
    redirectPath.value = path;
  }

  /**
   * Get and clear redirect path
   * @returns {string}
   */
  function getRedirectPath() {
    const path = redirectPath.value;
    redirectPath.value = '/';
    return path;
  }

  return {
    // State
    user,
    token,
    redirectPath,

    // Getters
    isAuthenticated,
    isAdmin,
    isStationAdmin,
    isStationUser,
    userRole,
    userStation,
    userStationFromUsername,

    // Actions
    canEditStation,
    login,
    logout,
    initialize,
    setRedirectPath,
    getRedirectPath
  };
});
