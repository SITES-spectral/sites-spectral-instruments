/**
 * Platforms Store
 *
 * Manages platforms state and operations.
 *
 * @module stores/platforms
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@services/api';

export const usePlatformsStore = defineStore('platforms', () => {
  // State
  const platforms = ref([]);
  const currentPlatform = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const platformCount = computed(() => platforms.value.length);

  const platformsByType = computed(() => {
    const grouped = { fixed: [], uav: [], satellite: [] };
    platforms.value.forEach(p => {
      const type = p.platform_type || 'fixed';
      if (grouped[type]) {
        grouped[type].push(p);
      }
    });
    return grouped;
  });

  const activePlatforms = computed(() =>
    platforms.value.filter(p => p.status === 'Active')
  );

  /**
   * Fetch platforms for a station
   * @param {number} stationId - Station ID
   * @returns {Promise<void>}
   */
  async function fetchPlatformsByStation(stationId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/stations/${stationId}/platforms`);
      if (response.success) {
        platforms.value = response.data || [];
      } else {
        error.value = response.error || 'Failed to fetch platforms';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch single platform by ID
   * @param {number} id - Platform ID
   * @returns {Promise<Object|null>}
   */
  async function fetchPlatform(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/platforms/${id}`);
      if (response.success) {
        currentPlatform.value = response.data;
        return response.data;
      } else {
        error.value = response.error || 'Platform not found';
        return null;
      }
    } catch (err) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new platform
   * @param {Object} platformData - Platform data
   * @returns {Promise<Object|null>}
   */
  async function createPlatform(platformData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/platforms', platformData);
      if (response.success) {
        // Add to local state
        platforms.value.push(response.data);
        return response.data;
      } else {
        error.value = response.error || 'Failed to create platform';
        return null;
      }
    } catch (err) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update a platform
   * @param {number} id - Platform ID
   * @param {Object} platformData - Updated platform data
   * @returns {Promise<Object|null>}
   */
  async function updatePlatform(id, platformData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/platforms/${id}`, platformData);
      if (response.success) {
        // Update local state
        const index = platforms.value.findIndex(p => p.id === id);
        if (index !== -1) {
          platforms.value[index] = response.data;
        }
        if (currentPlatform.value?.id === id) {
          currentPlatform.value = response.data;
        }
        return response.data;
      } else {
        error.value = response.error || 'Failed to update platform';
        return null;
      }
    } catch (err) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a platform
   * @param {number} id - Platform ID
   * @returns {Promise<boolean>}
   */
  async function deletePlatform(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.delete(`/platforms/${id}`);
      if (response.success) {
        // Remove from local state
        platforms.value = platforms.value.filter(p => p.id !== id);
        if (currentPlatform.value?.id === id) {
          currentPlatform.value = null;
        }
        return true;
      } else {
        error.value = response.error || 'Failed to delete platform';
        return false;
      }
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear current platform
   */
  function clearCurrentPlatform() {
    currentPlatform.value = null;
  }

  /**
   * Clear all platforms
   */
  function clearPlatforms() {
    platforms.value = [];
    currentPlatform.value = null;
  }

  return {
    // State
    platforms,
    currentPlatform,
    loading,
    error,

    // Getters
    platformCount,
    platformsByType,
    activePlatforms,

    // Actions
    fetchPlatformsByStation,
    fetchPlatform,
    createPlatform,
    updatePlatform,
    deletePlatform,
    clearCurrentPlatform,
    clearPlatforms
  };
});
