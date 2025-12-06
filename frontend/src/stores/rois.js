/**
 * ROIs Store
 *
 * Manages Regions of Interest (ROI) state and operations.
 *
 * @module stores/rois
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@services/api';

export const useROIsStore = defineStore('rois', () => {
  // State
  const rois = ref([]);
  const currentROI = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const roiCount = computed(() => rois.value.length);

  const roisByInstrument = computed(() => {
    const grouped = {};
    rois.value.forEach(roi => {
      const instrumentId = roi.instrument_id;
      if (!grouped[instrumentId]) {
        grouped[instrumentId] = [];
      }
      grouped[instrumentId].push(roi);
    });
    return grouped;
  });

  /**
   * Parse ROI points from JSON if needed
   * @param {Object} roi - ROI object
   * @returns {Object} ROI with parsed points
   */
  function parseROIPoints(roi) {
    if (!roi) return roi;

    // Parse points_json if it's a string
    if (roi.points_json && typeof roi.points_json === 'string') {
      try {
        roi.points = JSON.parse(roi.points_json);
      } catch {
        roi.points = [];
      }
    } else if (roi.points_json && Array.isArray(roi.points_json)) {
      roi.points = roi.points_json;
    } else if (!roi.points) {
      roi.points = [];
    }

    return roi;
  }

  /**
   * Fetch ROIs for an instrument
   * @param {number} instrumentId - Instrument ID
   * @returns {Promise<void>}
   */
  async function fetchROIsByInstrument(instrumentId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/rois', { instrument: instrumentId });
      if (response.success) {
        rois.value = (response.data?.rois || []).map(parseROIPoints);
      } else {
        error.value = response.error || 'Failed to fetch ROIs';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch ROIs for a station
   * @param {string} stationAcronym - Station acronym
   * @returns {Promise<void>}
   */
  async function fetchROIsByStation(stationAcronym) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/rois', { station: stationAcronym });
      if (response.success) {
        rois.value = (response.data?.rois || []).map(parseROIPoints);
      } else {
        error.value = response.error || 'Failed to fetch ROIs';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch single ROI by ID
   * @param {number} id - ROI ID
   * @returns {Promise<Object|null>}
   */
  async function fetchROI(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/rois/${id}`);
      if (response.success) {
        currentROI.value = parseROIPoints(response.data);
        return currentROI.value;
      } else {
        error.value = response.error || 'ROI not found';
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
   * Create a new ROI
   * @param {Object} roiData - ROI data
   * @returns {Promise<Object|null>}
   */
  async function createROI(roiData) {
    loading.value = true;
    error.value = null;

    try {
      // Serialize points if needed
      const payload = { ...roiData };
      if (payload.points && Array.isArray(payload.points)) {
        payload.points_json = JSON.stringify(payload.points);
        delete payload.points;
      }

      const response = await api.post('/rois', payload);
      if (response.success) {
        // Refetch ROIs for the instrument
        if (roiData.instrument_id) {
          await fetchROIsByInstrument(roiData.instrument_id);
        }
        return response.data;
      } else {
        error.value = response.error || 'Failed to create ROI';
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
   * Update an ROI
   * @param {number} id - ROI ID
   * @param {Object} roiData - Updated ROI data
   * @returns {Promise<Object|null>}
   */
  async function updateROI(id, roiData) {
    loading.value = true;
    error.value = null;

    try {
      // Serialize points if needed
      const payload = { ...roiData };
      if (payload.points && Array.isArray(payload.points)) {
        payload.points_json = JSON.stringify(payload.points);
        delete payload.points;
      }

      const response = await api.put(`/rois/${id}`, payload);
      if (response.success) {
        const index = rois.value.findIndex(r => r.id === id);
        if (index !== -1) {
          rois.value[index] = parseROIPoints({ ...rois.value[index], ...roiData });
        }
        if (currentROI.value?.id === id) {
          currentROI.value = parseROIPoints({ ...currentROI.value, ...roiData });
        }
        return response.data;
      } else {
        error.value = response.error || 'Failed to update ROI';
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
   * Delete an ROI
   * @param {number} id - ROI ID
   * @returns {Promise<boolean>}
   */
  async function deleteROI(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.delete(`/rois/${id}`);
      if (response.success) {
        rois.value = rois.value.filter(r => r.id !== id);
        if (currentROI.value?.id === id) {
          currentROI.value = null;
        }
        return true;
      } else {
        error.value = response.error || 'Failed to delete ROI';
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
   * Clear current ROI
   */
  function clearCurrentROI() {
    currentROI.value = null;
  }

  /**
   * Clear all ROIs
   */
  function clearROIs() {
    rois.value = [];
    currentROI.value = null;
  }

  return {
    // State
    rois,
    currentROI,
    loading,
    error,

    // Getters
    roiCount,
    roisByInstrument,

    // Actions
    fetchROIsByInstrument,
    fetchROIsByStation,
    fetchROI,
    createROI,
    updateROI,
    deleteROI,
    clearCurrentROI,
    clearROIs
  };
});
