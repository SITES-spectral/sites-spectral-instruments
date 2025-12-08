<template>
  <BaseModal
    :title="isEditing ? 'Edit Calibration' : 'Add Calibration'"
    size="large"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Section: Calibration Type -->
      <div class="form-section">
        <h4 class="form-section-title">Calibration Details</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Calibration Type *</label>
            <select v-model="form.calibration_type" required class="form-select">
              <option value="field">Field</option>
              <option value="factory">Factory</option>
              <option value="laboratory">Laboratory</option>
              <option value="cross_calibration">Cross-Calibration</option>
              <option value="vicarious">Vicarious</option>
              <option value="radiometric">Radiometric</option>
              <option value="spectral">Spectral</option>
              <option value="geometric">Geometric</option>
              <option value="dark_current">Dark Current</option>
              <option value="flat_field">Flat Field</option>
            </select>
          </div>
          <div>
            <label class="form-label">Timing</label>
            <select v-model="form.calibration_timing" class="form-select">
              <option value="not_applicable">Not Applicable</option>
              <option value="before_cleaning">Before Cleaning</option>
              <option value="after_cleaning">After Cleaning</option>
              <option value="both">Both (Full Session)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label class="form-label">Calibration Date *</label>
            <input v-model="form.calibration_date" type="date" required class="form-input" />
          </div>
          <div>
            <label class="form-label">Start Time</label>
            <input v-model="form.calibration_start_time" type="time" class="form-input" />
          </div>
          <div>
            <label class="form-label">End Time</label>
            <input v-model="form.calibration_end_time" type="time" class="form-input" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label class="form-label">Valid Until</label>
            <input v-model="form.valid_until" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">Duration (minutes)</label>
            <input v-model.number="form.duration_minutes" type="number" min="0" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Section: Panel Details -->
      <div class="form-section">
        <h4 class="form-section-title">Reflectance Panel</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Panel Type</label>
            <select v-model="form.panel_type" class="form-select">
              <option value="">Not specified</option>
              <option value="spectralon_99">Spectralon 99%</option>
              <option value="spectralon_50">Spectralon 50%</option>
              <option value="gray_18">Gray 18%</option>
              <option value="white_reference">White Reference</option>
              <option value="black_reference">Black Reference</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label class="form-label">Panel Serial Number</label>
            <input v-model="form.panel_serial_number" type="text" class="form-input" placeholder="e.g., SP-2024-001" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label class="form-label">Panel Condition</label>
            <select v-model="form.panel_condition" class="form-select">
              <option value="">Not specified</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label class="form-label">Panel Calibration Date</label>
            <input v-model="form.panel_calibration_date" type="date" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Section: Ambient Conditions -->
      <div class="form-section">
        <h4 class="form-section-title">Ambient Conditions</h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="form-label">Cloud Cover</label>
            <select v-model="form.cloud_cover" class="form-select">
              <option value="">Not specified</option>
              <option value="clear">Clear</option>
              <option value="mostly_clear">Mostly Clear</option>
              <option value="partly_cloudy">Partly Cloudy</option>
              <option value="mostly_cloudy">Mostly Cloudy</option>
              <option value="overcast">Overcast</option>
              <option value="intermittent">Intermittent</option>
            </select>
          </div>
          <div>
            <label class="form-label">Solar Zenith Angle (°)</label>
            <input v-model.number="form.solar_zenith_angle" type="number" min="0" max="90" step="0.1" class="form-input" />
          </div>
          <div>
            <label class="form-label">Solar Azimuth Angle (°)</label>
            <input v-model.number="form.solar_azimuth_angle" type="number" min="0" max="360" step="0.1" class="form-input" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label class="form-label">Temperature (°C)</label>
            <input v-model.number="form.temperature_celsius" type="number" step="0.1" class="form-input" />
          </div>
          <div>
            <label class="form-label">Humidity (%)</label>
            <input v-model.number="form.humidity_percent" type="number" min="0" max="100" class="form-input" />
          </div>
          <div>
            <label class="form-label">Wind Speed (m/s)</label>
            <input v-model.number="form.wind_speed_ms" type="number" min="0" step="0.1" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Section: Cleaning -->
      <div class="form-section">
        <h4 class="form-section-title">Sensor Cleaning</h4>
        <div class="flex items-center gap-4 mb-4">
          <label class="flex items-center">
            <input v-model="form.cleaning_performed" type="checkbox" class="form-checkbox" />
            <span class="ml-2">Cleaning performed</span>
          </label>
        </div>
        <div v-if="form.cleaning_performed" class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Cleaning Method</label>
            <select v-model="form.cleaning_method" class="form-select">
              <option value="">Not specified</option>
              <option value="dry_wipe">Dry Wipe</option>
              <option value="compressed_air">Compressed Air</option>
              <option value="wet_clean">Wet Clean</option>
              <option value="ultrasonic">Ultrasonic</option>
            </select>
          </div>
          <div>
            <label class="form-label">Cleaning Solution</label>
            <input v-model="form.cleaning_solution" type="text" class="form-input" placeholder="If wet cleaning" />
          </div>
        </div>
        <div v-if="form.cleaning_performed" class="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label class="form-label">State Before</label>
            <select v-model="form.cleanliness_state_before" class="form-select">
              <option value="">Not specified</option>
              <option value="clean">Clean</option>
              <option value="dusty">Dusty</option>
              <option value="dirty">Dirty</option>
              <option value="contaminated">Contaminated</option>
            </select>
          </div>
          <div>
            <label class="form-label">State After</label>
            <select v-model="form.cleanliness_state_after" class="form-select">
              <option value="">Not specified</option>
              <option value="clean">Clean</option>
              <option value="dusty">Dusty</option>
              <option value="dirty">Dirty</option>
              <option value="contaminated">Contaminated</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Section: Quality Metrics -->
      <div class="form-section">
        <h4 class="form-section-title">Quality Metrics</h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="flex items-center">
              <input v-model="form.quality_passed" type="checkbox" class="form-checkbox" />
              <span class="ml-2">Quality Passed</span>
            </label>
          </div>
          <div>
            <label class="form-label">Quality Score (0-100)</label>
            <input v-model.number="form.quality_score" type="number" min="0" max="100" class="form-input" />
          </div>
          <div>
            <label class="form-label">Deviation from Reference (%)</label>
            <input v-model.number="form.deviation_from_reference" type="number" min="0" step="0.1" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Section: Personnel -->
      <div class="form-section">
        <h4 class="form-section-title">Personnel & Documentation</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Performed By</label>
            <input v-model="form.performed_by" type="text" class="form-input" placeholder="Technician name" />
          </div>
          <div>
            <label class="form-label">Laboratory</label>
            <input v-model="form.laboratory" type="text" class="form-input" placeholder="Lab or facility name" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label class="form-label">Certificate Number</label>
            <input v-model="form.certificate_number" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label">Certificate URL</label>
            <input v-model="form.certificate_url" type="url" class="form-input" placeholder="https://..." />
          </div>
        </div>
      </div>

      <!-- Section: Notes -->
      <div>
        <label class="form-label">Notes</label>
        <textarea v-model="form.notes" rows="3" class="form-textarea" placeholder="Additional notes..."></textarea>
      </div>

      <!-- Submit -->
      <div class="flex justify-end gap-3 pt-4 border-t">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Cancel
        </button>
        <button type="submit" :disabled="saving" class="btn-primary">
          <i v-if="saving" class="fas fa-spinner fa-spin mr-1"></i>
          {{ isEditing ? 'Update' : 'Save' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { calibrationApi } from '../../services/api';
import BaseModal from '../modals/BaseModal.vue';

const props = defineProps({
  record: {
    type: Object,
    default: null
  },
  instrumentId: {
    type: [Number, String],
    required: true
  },
  stationId: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const saving = ref(false);
const isEditing = computed(() => !!props.record?.id);

const form = ref({
  calibration_type: 'field',
  calibration_timing: 'not_applicable',
  calibration_date: new Date().toISOString().split('T')[0],
  calibration_start_time: '',
  calibration_end_time: '',
  duration_minutes: null,
  valid_until: '',
  panel_type: '',
  panel_serial_number: '',
  panel_condition: '',
  panel_calibration_date: '',
  cloud_cover: '',
  solar_zenith_angle: null,
  solar_azimuth_angle: null,
  temperature_celsius: null,
  humidity_percent: null,
  wind_speed_ms: null,
  cleaning_performed: false,
  cleaning_method: '',
  cleaning_solution: '',
  cleanliness_state_before: '',
  cleanliness_state_after: '',
  quality_passed: false,
  quality_score: null,
  deviation_from_reference: null,
  performed_by: '',
  laboratory: '',
  certificate_number: '',
  certificate_url: '',
  notes: ''
});

onMounted(() => {
  if (props.record) {
    // Map snake_case from API to form
    form.value = {
      calibration_type: props.record.calibration_type || 'field',
      calibration_timing: props.record.calibration_timing || 'not_applicable',
      calibration_date: props.record.calibration_date || '',
      calibration_start_time: props.record.calibration_start_time || '',
      calibration_end_time: props.record.calibration_end_time || '',
      duration_minutes: props.record.duration_minutes,
      valid_until: props.record.valid_until || '',
      panel_type: props.record.panel_type || '',
      panel_serial_number: props.record.panel_serial_number || '',
      panel_condition: props.record.panel_condition || '',
      panel_calibration_date: props.record.panel_calibration_date || '',
      cloud_cover: props.record.cloud_cover || '',
      solar_zenith_angle: props.record.solar_zenith_angle,
      solar_azimuth_angle: props.record.solar_azimuth_angle,
      temperature_celsius: props.record.temperature_celsius,
      humidity_percent: props.record.humidity_percent,
      wind_speed_ms: props.record.wind_speed_ms,
      cleaning_performed: props.record.cleaning_performed || false,
      cleaning_method: props.record.cleaning_method || '',
      cleaning_solution: props.record.cleaning_solution || '',
      cleanliness_state_before: props.record.cleanliness_state_before || '',
      cleanliness_state_after: props.record.cleanliness_state_after || '',
      quality_passed: props.record.quality_passed || false,
      quality_score: props.record.quality_score,
      deviation_from_reference: props.record.deviation_from_reference,
      performed_by: props.record.performed_by || '',
      laboratory: props.record.laboratory || '',
      certificate_number: props.record.certificate_number || '',
      certificate_url: props.record.certificate_url || '',
      notes: props.record.notes || ''
    };
  }
});

async function handleSubmit() {
  saving.value = true;
  try {
    const data = {
      ...form.value,
      instrument_id: Number(props.instrumentId),
      station_id: props.stationId ? Number(props.stationId) : null
    };

    // Clean up empty strings to null
    Object.keys(data).forEach(key => {
      if (data[key] === '') data[key] = null;
    });

    if (isEditing.value) {
      await calibrationApi.update(props.record.id, data);
    } else {
      await calibrationApi.create(data);
    }

    emit('saved');
  } catch (error) {
    console.error('Failed to save calibration:', error);
    alert('Failed to save: ' + error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.form-section {
  @apply bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4;
}

.form-section-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select,
.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.form-checkbox {
  @apply rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500;
}

.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 transition-colors;
}
</style>
