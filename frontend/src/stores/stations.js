/**
 * Stations Store
 *
 * Manages stations state and operations.
 *
 * @module stores/stations
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@services/api';

export const useStationsStore = defineStore('stations', () => {
  // State
  const stations = ref([]);
  const currentStation = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const stationCount = computed(() => stations.value.length);

  const activeStations = computed(() =>
    stations.value.filter(s => s.status === 'Active')
  );

  const getStationByAcronym = computed(() => {
    return (acronym) => stations.value.find(s => s.acronym === acronym);
  });

  /**
   * Fetch all stations
   * @returns {Promise<void>}
   */
  async function fetchStations() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/stations');
      if (response.success) {
        stations.value = response.data || [];
      } else {
        error.value = response.error || 'Failed to fetch stations';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch single station by acronym
   * @param {string} acronym - Station acronym
   * @returns {Promise<Object|null>}
   */
  async function fetchStation(acronym) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/stations/${acronym}`);
      if (response.success) {
        currentStation.value = response.data;
        return response.data;
      } else {
        error.value = response.error || 'Station not found';
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
   * Update station
   * @param {number} id - Station ID
   * @param {Object} data - Station data
   * @returns {Promise<Object|null>}
   */
  async function updateStation(id, data) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/stations/${id}`, data);
      if (response.success) {
        // Update current station
        currentStation.value = response.data;
        // Update in stations list
        const index = stations.value.findIndex(s => s.id === id);
        if (index !== -1) {
          stations.value[index] = response.data;
        }
        return response.data;
      } else {
        error.value = response.error || 'Failed to update station';
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
   * Clear current station
   */
  function clearCurrentStation() {
    currentStation.value = null;
  }

  return {
    // State
    stations,
    currentStation,
    loading,
    error,

    // Getters
    stationCount,
    activeStations,
    getStationByAcronym,

    // Actions
    fetchStations,
    fetchStation,
    updateStation,
    clearCurrentStation
  };
});
