/**
 * Instruments Store
 *
 * Manages instruments state and operations.
 *
 * @module stores/instruments
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@services/api';

export const useInstrumentsStore = defineStore('instruments', () => {
  // State
  const instruments = ref([]);
  const currentInstrument = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const instrumentCount = computed(() => instruments.value.length);

  const instrumentsByType = computed(() => {
    const grouped = {};
    instruments.value.forEach(i => {
      const type = i.instrument_type || 'Unknown';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(i);
    });
    return grouped;
  });

  const activeInstruments = computed(() =>
    instruments.value.filter(i => i.status === 'Active')
  );

  const operationalInstruments = computed(() =>
    instruments.value.filter(i => i.measurement_status === 'Operational')
  );

  /**
   * Fetch instruments for a platform
   * @param {number} platformId - Platform ID
   * @returns {Promise<void>}
   */
  async function fetchInstrumentsByPlatform(platformId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/platforms/${platformId}/instruments`);
      if (response.success) {
        instruments.value = response.data || [];
      } else {
        error.value = response.error || 'Failed to fetch instruments';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch instruments for a station (all platforms)
   * @param {number} stationId - Station ID
   * @returns {Promise<void>}
   */
  async function fetchInstrumentsByStation(stationId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/stations/${stationId}/instruments`);
      if (response.success) {
        instruments.value = response.data || [];
      } else {
        error.value = response.error || 'Failed to fetch instruments';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch single instrument by ID
   * @param {number} id - Instrument ID
   * @returns {Promise<Object|null>}
   */
  async function fetchInstrument(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/instruments/${id}`);
      if (response.success) {
        currentInstrument.value = response.data;
        return response.data;
      } else {
        error.value = response.error || 'Instrument not found';
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
   * Create a new instrument
   * @param {Object} instrumentData - Instrument data
   * @returns {Promise<Object|null>}
   */
  async function createInstrument(instrumentData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/instruments', instrumentData);
      if (response.success) {
        instruments.value.push(response.data);
        return response.data;
      } else {
        error.value = response.error || 'Failed to create instrument';
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
   * Update an instrument
   * @param {number} id - Instrument ID
   * @param {Object} instrumentData - Updated instrument data
   * @returns {Promise<Object|null>}
   */
  async function updateInstrument(id, instrumentData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/instruments/${id}`, instrumentData);
      if (response.success) {
        const index = instruments.value.findIndex(i => i.id === id);
        if (index !== -1) {
          instruments.value[index] = response.data;
        }
        if (currentInstrument.value?.id === id) {
          currentInstrument.value = response.data;
        }
        return response.data;
      } else {
        error.value = response.error || 'Failed to update instrument';
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
   * Delete an instrument
   * @param {number} id - Instrument ID
   * @returns {Promise<boolean>}
   */
  async function deleteInstrument(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.delete(`/instruments/${id}`);
      if (response.success) {
        instruments.value = instruments.value.filter(i => i.id !== id);
        if (currentInstrument.value?.id === id) {
          currentInstrument.value = null;
        }
        return true;
      } else {
        error.value = response.error || 'Failed to delete instrument';
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
   * Clear current instrument
   */
  function clearCurrentInstrument() {
    currentInstrument.value = null;
  }

  /**
   * Clear all instruments
   */
  function clearInstruments() {
    instruments.value = [];
    currentInstrument.value = null;
  }

  return {
    // State
    instruments,
    currentInstrument,
    loading,
    error,

    // Getters
    instrumentCount,
    instrumentsByType,
    activeInstruments,
    operationalInstruments,

    // Actions
    fetchInstrumentsByPlatform,
    fetchInstrumentsByStation,
    fetchInstrument,
    createInstrument,
    updateInstrument,
    deleteInstrument,
    clearCurrentInstrument,
    clearInstruments
  };
});
