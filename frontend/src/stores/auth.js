/**
 * Authentication Store
 *
 * Manages user authentication state, tokens, and permissions.
 *
 * @module stores/auth
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@services/api';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const token = ref(localStorage.getItem('auth_token'));
  const redirectPath = ref('/');

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isStationUser = computed(() => user.value?.role === 'station');
  const userRole = computed(() => user.value?.role || 'readonly');
  const userStation = computed(() => user.value?.station_id || null);

  /**
   * Check if user can edit a specific station
   * @param {number} stationId - Station ID to check
   * @returns {boolean}
   */
  function canEditStation(stationId) {
    if (isAdmin.value) return true;
    if (isStationUser.value && userStation.value === stationId) return true;
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
    isStationUser,
    userRole,
    userStation,

    // Actions
    canEditStation,
    login,
    logout,
    initialize,
    setRedirectPath,
    getRedirectPath
  };
});
