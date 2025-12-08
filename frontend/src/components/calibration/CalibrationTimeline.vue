<template>
  <div class="calibration-timeline">
    <div class="timeline-header">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Calibration History
      </h3>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="btn-primary text-sm"
      >
        <i class="fas fa-plus mr-1"></i>
        Add Calibration
      </button>
    </div>

    <!-- Current Calibration Status -->
    <div v-if="currentCalibration" class="current-calibration">
      <div class="current-header">
        <i class="fas fa-check-circle text-green-500 mr-2"></i>
        <span class="font-medium">Current Valid Calibration</span>
      </div>
      <div class="current-details">
        <div class="detail-item">
          <span class="label">Type:</span>
          <span class="value">{{ formatType(currentCalibration.calibration_type) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Date:</span>
          <span class="value">{{ formatDate(currentCalibration.calibration_date) }}</span>
        </div>
        <div v-if="currentCalibration.valid_until" class="detail-item">
          <span class="label">Expires:</span>
          <span class="value" :class="getExpiryClass(currentCalibration)">
            {{ formatDate(currentCalibration.valid_until) }}
            <span v-if="currentCalibration.days_until_expiration !== null">
              ({{ currentCalibration.days_until_expiration }} days)
            </span>
          </span>
        </div>
        <div v-if="currentCalibration.quality_score" class="detail-item">
          <span class="label">Quality:</span>
          <span class="value">
            <span class="quality-badge" :class="getQualityClass(currentCalibration.quality_score)">
              {{ currentCalibration.quality_score }}%
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- Expiry Warning -->
    <div v-if="expiringCalibrations.length > 0" class="expiry-warning">
      <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
      <span>{{ expiringCalibrations.length }} calibration(s) expiring within 30 days</span>
    </div>

    <!-- Summary Stats -->
    <div v-if="summary" class="summary-stats">
      <div class="stat-card">
        <span class="stat-value">{{ summary.total }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-card">
        <span class="stat-value text-green-600">{{ summary.valid }}</span>
        <span class="stat-label">Valid</span>
      </div>
      <div class="stat-card">
        <span class="stat-value text-yellow-600">{{ summary.pending_review || 0 }}</span>
        <span class="stat-label">Pending</span>
      </div>
      <div class="stat-card">
        <span class="stat-value text-red-600">{{ summary.expired || 0 }}</span>
        <span class="stat-label">Expired</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
      <p class="text-gray-500 mt-2">Loading calibration records...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="records.length === 0" class="empty-state">
      <i class="fas fa-sliders-h text-4xl text-gray-300"></i>
      <p class="text-gray-500 mt-2">No calibration records yet</p>
      <p class="text-xs text-gray-400 mt-1">
        Calibration tracking is available for multispectral and hyperspectral instruments
      </p>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="btn-secondary mt-4"
      >
        Add First Calibration
      </button>
    </div>

    <!-- Timeline -->
    <div v-else class="timeline">
      <div
        v-for="record in records"
        :key="record.id"
        class="timeline-item"
        :class="getStatusClass(record.status)"
      >
        <div class="timeline-marker">
          <i :class="getTypeIcon(record.calibration_type)"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-header-row">
            <span class="timeline-title">
              {{ formatType(record.calibration_type) }}
              <span v-if="record.calibration_timing !== 'not_applicable'" class="timing-badge">
                {{ formatTiming(record.calibration_timing) }}
              </span>
            </span>
            <span class="timeline-date">{{ formatDate(record.calibration_date) }}</span>
          </div>

          <div class="timeline-meta">
            <span class="badge" :class="getStatusBadgeClass(record.status)">
              {{ formatStatus(record.status) }}
            </span>
            <span v-if="record.cloud_cover" class="badge badge-sky">
              <i class="fas fa-cloud mr-1"></i>
              {{ formatCloudCover(record.cloud_cover) }}
            </span>
            <span v-if="record.solar_zenith_angle" class="badge badge-sun">
              <i class="fas fa-sun mr-1"></i>
              {{ record.solar_zenith_angle.toFixed(1) }}°
            </span>
            <span v-if="record.quality_score" class="quality-badge-sm" :class="getQualityClass(record.quality_score)">
              {{ record.quality_score }}%
            </span>
          </div>

          <!-- Panel Info -->
          <div v-if="record.panel_type" class="panel-info">
            <i class="fas fa-square text-gray-400 mr-1"></i>
            {{ formatPanelType(record.panel_type) }}
            <span v-if="record.panel_serial_number" class="text-gray-400">
              ({{ record.panel_serial_number }})
            </span>
          </div>

          <!-- Cleaning Info -->
          <div v-if="record.cleaning_performed" class="cleaning-info">
            <i class="fas fa-broom text-blue-400 mr-1"></i>
            Cleaning performed
            <span v-if="record.cleaning_method">
              ({{ formatCleaningMethod(record.cleaning_method) }})
            </span>
          </div>

          <p v-if="record.notes" class="timeline-description">
            {{ record.notes }}
          </p>

          <div v-if="record.performed_by" class="timeline-performer">
            <i class="fas fa-user text-gray-400 mr-1"></i>
            {{ record.performed_by }}
            <span v-if="record.laboratory">@ {{ record.laboratory }}</span>
          </div>

          <div class="timeline-actions" v-if="canEdit">
            <button @click="editRecord(record)" class="btn-sm btn-secondary">
              <i class="fas fa-edit mr-1"></i>
              Edit
            </button>
            <button
              v-if="record.status === 'valid'"
              @click="expireRecord(record)"
              class="btn-sm btn-warning"
            >
              <i class="fas fa-clock mr-1"></i>
              Expire
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <CalibrationFormModal
      v-if="showCreateModal || editingRecord"
      :record="editingRecord"
      :instrument-id="instrumentId"
      :station-id="stationId"
      @close="closeModal"
      @saved="onRecordSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { calibrationApi } from '../../services/api';
import CalibrationFormModal from './CalibrationFormModal.vue';

const props = defineProps({
  instrumentId: {
    type: [Number, String],
    required: true
  },
  stationId: {
    type: [Number, String],
    default: null
  },
  canEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['updated']);

const loading = ref(true);
const records = ref([]);
const summary = ref(null);
const currentCalibration = ref(null);
const expiringCalibrations = ref([]);
const showCreateModal = ref(false);
const editingRecord = ref(null);

// Fetch timeline data
async function fetchTimeline() {
  loading.value = true;
  try {
    const [timelineRes, currentRes, expiringRes] = await Promise.all([
      calibrationApi.timeline(props.instrumentId),
      calibrationApi.current(props.instrumentId).catch(() => null),
      calibrationApi.expiring(30, { instrument_id: props.instrumentId }).catch(() => ({ data: [] }))
    ]);

    records.value = timelineRes.data || [];
    summary.value = timelineRes.summary || null;
    currentCalibration.value = currentRes?.data || null;
    expiringCalibrations.value = expiringRes?.data || [];
  } catch (error) {
    console.error('Failed to fetch calibration timeline:', error);
    records.value = [];
  } finally {
    loading.value = false;
  }
}

// Format helpers
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatType(type) {
  const types = {
    factory: 'Factory',
    field: 'Field',
    laboratory: 'Laboratory',
    cross_calibration: 'Cross-Calibration',
    vicarious: 'Vicarious',
    radiometric: 'Radiometric',
    spectral: 'Spectral',
    geometric: 'Geometric',
    dark_current: 'Dark Current',
    flat_field: 'Flat Field'
  };
  return types[type] || type;
}

function formatTiming(timing) {
  const timings = {
    before_cleaning: 'Before Cleaning',
    after_cleaning: 'After Cleaning',
    both: 'Full Session'
  };
  return timings[timing] || '';
}

function formatStatus(status) {
  const statuses = {
    valid: 'Valid',
    expired: 'Expired',
    superseded: 'Superseded',
    pending_review: 'Pending Review'
  };
  return statuses[status] || status;
}

function formatCloudCover(cover) {
  const covers = {
    clear: 'Clear',
    mostly_clear: 'Mostly Clear',
    partly_cloudy: 'Partly Cloudy',
    mostly_cloudy: 'Mostly Cloudy',
    overcast: 'Overcast',
    intermittent: 'Intermittent'
  };
  return covers[cover] || cover;
}

function formatPanelType(type) {
  const types = {
    spectralon_99: 'Spectralon 99%',
    spectralon_50: 'Spectralon 50%',
    gray_18: 'Gray 18%',
    white_reference: 'White Reference',
    black_reference: 'Black Reference',
    custom: 'Custom'
  };
  return types[type] || type;
}

function formatCleaningMethod(method) {
  const methods = {
    dry_wipe: 'Dry Wipe',
    compressed_air: 'Compressed Air',
    wet_clean: 'Wet Clean',
    ultrasonic: 'Ultrasonic'
  };
  return methods[method] || method;
}

function getTypeIcon(type) {
  const icons = {
    factory: 'fas fa-industry',
    field: 'fas fa-mountain',
    laboratory: 'fas fa-flask',
    cross_calibration: 'fas fa-exchange-alt',
    vicarious: 'fas fa-globe',
    radiometric: 'fas fa-radiation',
    spectral: 'fas fa-rainbow',
    geometric: 'fas fa-ruler-combined',
    dark_current: 'fas fa-moon',
    flat_field: 'fas fa-th'
  };
  return icons[type] || 'fas fa-sliders-h';
}

function getStatusClass(status) {
  const classes = {
    valid: 'status-valid',
    expired: 'status-expired',
    superseded: 'status-superseded',
    pending_review: 'status-pending'
  };
  return classes[status] || '';
}

function getStatusBadgeClass(status) {
  const classes = {
    valid: 'badge-green',
    expired: 'badge-red',
    superseded: 'badge-gray',
    pending_review: 'badge-yellow'
  };
  return classes[status] || 'badge-gray';
}

function getQualityClass(score) {
  if (score >= 90) return 'quality-excellent';
  if (score >= 70) return 'quality-good';
  if (score >= 50) return 'quality-fair';
  return 'quality-poor';
}

function getExpiryClass(record) {
  if (!record.days_until_expiration) return '';
  if (record.days_until_expiration <= 7) return 'text-red-600';
  if (record.days_until_expiration <= 30) return 'text-yellow-600';
  return 'text-green-600';
}

// Actions
async function expireRecord(record) {
  if (!confirm('Mark this calibration as expired?')) return;

  try {
    await calibrationApi.expire(record.id);
    await fetchTimeline();
    emit('updated');
  } catch (error) {
    console.error('Failed to expire calibration:', error);
    alert('Failed to expire calibration: ' + error.message);
  }
}

function editRecord(record) {
  editingRecord.value = record;
}

function closeModal() {
  showCreateModal.value = false;
  editingRecord.value = null;
}

function onRecordSaved() {
  closeModal();
  fetchTimeline();
  emit('updated');
}

// Watch for instrument changes
watch(
  () => props.instrumentId,
  () => fetchTimeline(),
  { immediate: false }
);

onMounted(() => {
  fetchTimeline();
});
</script>

<style scoped>
.calibration-timeline {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow p-4;
}

.timeline-header {
  @apply flex justify-between items-center mb-4;
}

.current-calibration {
  @apply bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4;
}

.current-header {
  @apply flex items-center text-green-700 dark:text-green-300 font-medium mb-2;
}

.current-details {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.detail-item {
  @apply text-sm;
}

.detail-item .label {
  @apply text-gray-500 dark:text-gray-400;
}

.detail-item .value {
  @apply font-medium text-gray-900 dark:text-white ml-1;
}

.expiry-warning {
  @apply flex items-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4 text-sm text-yellow-700 dark:text-yellow-300;
}

.summary-stats {
  @apply grid grid-cols-4 gap-4 mb-6;
}

.stat-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center;
}

.stat-value {
  @apply block text-2xl font-bold;
}

.stat-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.loading-state,
.empty-state {
  @apply flex flex-col items-center justify-center py-12;
}

.timeline {
  @apply space-y-4;
}

.timeline-item {
  @apply flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.timeline-marker {
  @apply flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300;
}

.timeline-content {
  @apply flex-1;
}

.timeline-header-row {
  @apply flex justify-between items-start;
}

.timeline-title {
  @apply font-semibold text-gray-900 dark:text-white;
}

.timing-badge {
  @apply ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded;
}

.timeline-date {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.timeline-meta {
  @apply flex flex-wrap gap-2 mt-2;
}

.panel-info,
.cleaning-info {
  @apply text-sm text-gray-600 dark:text-gray-300 mt-2;
}

.timeline-description {
  @apply text-sm text-gray-600 dark:text-gray-300 mt-2;
}

.timeline-performer {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-2;
}

.timeline-actions {
  @apply flex gap-2 mt-3;
}

/* Status classes */
.status-valid .timeline-marker {
  @apply bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300;
}

.status-expired .timeline-marker {
  @apply bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300;
}

.status-superseded .timeline-marker {
  @apply bg-gray-100 dark:bg-gray-600 text-gray-500;
}

/* Badge colors */
.badge {
  @apply px-2 py-0.5 text-xs font-medium rounded-full;
}

.badge-green {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.badge-yellow {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.badge-red {
  @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

.badge-gray {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200;
}

.badge-sky {
  @apply bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200;
}

.badge-sun {
  @apply bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200;
}

/* Quality badges */
.quality-badge,
.quality-badge-sm {
  @apply px-2 py-0.5 rounded-full font-medium;
}

.quality-badge {
  @apply text-sm;
}

.quality-badge-sm {
  @apply text-xs;
}

.quality-excellent {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.quality-good {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
}

.quality-fair {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.quality-poor {
  @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

/* Buttons */
.btn-primary {
  @apply px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors;
}

.btn-secondary {
  @apply px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors;
}

.btn-sm {
  @apply px-2 py-1 text-xs rounded;
}

.btn-warning {
  @apply bg-yellow-500 text-white hover:bg-yellow-600;
}
</style>
