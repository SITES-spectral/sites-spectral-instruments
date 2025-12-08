<template>
  <div class="maintenance-timeline">
    <div class="timeline-header">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Maintenance History
      </h3>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="btn-primary text-sm"
      >
        <i class="fas fa-plus mr-1"></i>
        Schedule Maintenance
      </button>
    </div>

    <!-- Summary Stats -->
    <div v-if="summary" class="summary-stats">
      <div class="stat-card">
        <span class="stat-value">{{ summary.total }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-card">
        <span class="stat-value text-yellow-600">{{ summary.scheduled }}</span>
        <span class="stat-label">Scheduled</span>
      </div>
      <div class="stat-card">
        <span class="stat-value text-green-600">{{ summary.completed }}</span>
        <span class="stat-label">Completed</span>
      </div>
      <div class="stat-card" v-if="summary.overdue > 0">
        <span class="stat-value text-red-600">{{ summary.overdue }}</span>
        <span class="stat-label">Overdue</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
      <p class="text-gray-500 mt-2">Loading maintenance records...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="records.length === 0" class="empty-state">
      <i class="fas fa-tools text-4xl text-gray-300"></i>
      <p class="text-gray-500 mt-2">No maintenance records yet</p>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="btn-secondary mt-4"
      >
        Schedule First Maintenance
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
          <i :class="getTypeIcon(record.type)"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-header-row">
            <span class="timeline-title">{{ record.title }}</span>
            <span class="timeline-date">{{ formatDate(record.scheduled_date) }}</span>
          </div>
          <div class="timeline-meta">
            <span class="badge" :class="getTypeBadgeClass(record.type)">
              {{ formatType(record.type) }}
            </span>
            <span class="badge" :class="getStatusBadgeClass(record.status)">
              {{ formatStatus(record.status) }}
            </span>
            <span class="badge" :class="getPriorityBadgeClass(record.priority)">
              {{ record.priority }}
            </span>
          </div>
          <p v-if="record.description" class="timeline-description">
            {{ record.description }}
          </p>
          <div v-if="record.performed_by" class="timeline-performer">
            <i class="fas fa-user text-gray-400 mr-1"></i>
            {{ record.performed_by }}
          </div>
          <div class="timeline-actions" v-if="canEdit">
            <button
              v-if="record.status === 'scheduled'"
              @click="completeRecord(record)"
              class="btn-sm btn-success"
            >
              <i class="fas fa-check mr-1"></i>
              Complete
            </button>
            <button @click="editRecord(record)" class="btn-sm btn-secondary">
              <i class="fas fa-edit mr-1"></i>
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <MaintenanceFormModal
      v-if="showCreateModal || editingRecord"
      :record="editingRecord"
      :entity-type="entityType"
      :entity-id="entityId"
      :station-id="stationId"
      @close="closeModal"
      @saved="onRecordSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { maintenanceApi } from '../../services/api';
import MaintenanceFormModal from './MaintenanceFormModal.vue';

const props = defineProps({
  entityType: {
    type: String,
    required: true,
    validator: (value) => ['platform', 'instrument'].includes(value)
  },
  entityId: {
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
const showCreateModal = ref(false);
const editingRecord = ref(null);

// Fetch timeline data
async function fetchTimeline() {
  loading.value = true;
  try {
    const response = await maintenanceApi.timeline(props.entityType, props.entityId);
    records.value = response.data || [];
    summary.value = response.summary || null;
  } catch (error) {
    console.error('Failed to fetch maintenance timeline:', error);
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
    preventive: 'Preventive',
    corrective: 'Corrective',
    inspection: 'Inspection',
    cleaning: 'Cleaning',
    calibration: 'Calibration',
    upgrade: 'Upgrade',
    repair: 'Repair',
    replacement: 'Replacement',
    installation: 'Installation',
    decommissioning: 'Decommissioning'
  };
  return types[type] || type;
}

function formatStatus(status) {
  const statuses = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    deferred: 'Deferred'
  };
  return statuses[status] || status;
}

function getTypeIcon(type) {
  const icons = {
    preventive: 'fas fa-shield-alt',
    corrective: 'fas fa-wrench',
    inspection: 'fas fa-search',
    cleaning: 'fas fa-broom',
    calibration: 'fas fa-sliders-h',
    upgrade: 'fas fa-arrow-up',
    repair: 'fas fa-tools',
    replacement: 'fas fa-exchange-alt',
    installation: 'fas fa-plug',
    decommissioning: 'fas fa-power-off'
  };
  return icons[type] || 'fas fa-wrench';
}

function getStatusClass(status) {
  const classes = {
    scheduled: 'status-scheduled',
    in_progress: 'status-in-progress',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    deferred: 'status-deferred'
  };
  return classes[status] || '';
}

function getTypeBadgeClass(type) {
  return 'badge-type-' + type;
}

function getStatusBadgeClass(status) {
  const classes = {
    scheduled: 'badge-yellow',
    in_progress: 'badge-blue',
    completed: 'badge-green',
    cancelled: 'badge-gray',
    deferred: 'badge-orange'
  };
  return classes[status] || 'badge-gray';
}

function getPriorityBadgeClass(priority) {
  const classes = {
    low: 'badge-gray',
    normal: 'badge-blue',
    high: 'badge-orange',
    critical: 'badge-red'
  };
  return classes[priority] || 'badge-gray';
}

// Actions
async function completeRecord(record) {
  try {
    await maintenanceApi.complete(record.id, {
      completed_date: new Date().toISOString().split('T')[0]
    });
    await fetchTimeline();
    emit('updated');
  } catch (error) {
    console.error('Failed to complete maintenance:', error);
    alert('Failed to complete maintenance: ' + error.message);
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

// Watch for entity changes
watch(
  () => [props.entityType, props.entityId],
  () => fetchTimeline(),
  { immediate: false }
);

onMounted(() => {
  fetchTimeline();
});
</script>

<style scoped>
.maintenance-timeline {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow p-4;
}

.timeline-header {
  @apply flex justify-between items-center mb-4;
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
  @apply flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300;
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

.timeline-date {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.timeline-meta {
  @apply flex flex-wrap gap-2 mt-2;
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
.status-completed .timeline-marker {
  @apply bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300;
}

.status-cancelled .timeline-marker {
  @apply bg-gray-100 dark:bg-gray-600 text-gray-500;
}

.status-in-progress .timeline-marker {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300;
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

.badge-blue {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
}

.badge-orange {
  @apply bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200;
}

.badge-red {
  @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

.badge-gray {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200;
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

.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700;
}
</style>
