<template>
  <BaseModal :title="isEditing ? 'Edit Maintenance' : 'Schedule Maintenance'" @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Title -->
      <div>
        <label class="form-label">Title *</label>
        <input
          v-model="form.title"
          type="text"
          required
          class="form-input"
          placeholder="Brief maintenance description"
        />
      </div>

      <!-- Type & Priority -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Type *</label>
          <select v-model="form.type" required class="form-select">
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="inspection">Inspection</option>
            <option value="cleaning">Cleaning</option>
            <option value="calibration">Calibration</option>
            <option value="upgrade">Upgrade</option>
            <option value="repair">Repair</option>
            <option value="replacement">Replacement</option>
            <option value="installation">Installation</option>
            <option value="decommissioning">Decommissioning</option>
          </select>
        </div>
        <div>
          <label class="form-label">Priority *</label>
          <select v-model="form.priority" required class="form-select">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <!-- Scheduled Date -->
      <div>
        <label class="form-label">Scheduled Date *</label>
        <input
          v-model="form.scheduled_date"
          type="date"
          required
          class="form-input"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="form-label">Description</label>
        <textarea
          v-model="form.description"
          rows="3"
          class="form-textarea"
          placeholder="Detailed description of maintenance work..."
        ></textarea>
      </div>

      <!-- Performed By (if completed) -->
      <div v-if="form.status === 'completed'">
        <label class="form-label">Performed By</label>
        <input
          v-model="form.performed_by"
          type="text"
          class="form-input"
          placeholder="Technician name"
        />
      </div>

      <!-- Work Performed (if completed) -->
      <div v-if="form.status === 'completed'">
        <label class="form-label">Work Performed</label>
        <textarea
          v-model="form.work_performed"
          rows="3"
          class="form-textarea"
          placeholder="Description of work done..."
        ></textarea>
      </div>

      <!-- Notes -->
      <div>
        <label class="form-label">Notes</label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="form-textarea"
          placeholder="Additional notes..."
        ></textarea>
      </div>

      <!-- Submit -->
      <div class="flex justify-end gap-3 pt-4 border-t">
        <button type="button" @click="$emit('close')" class="btn-secondary">
          Cancel
        </button>
        <button type="submit" :disabled="saving" class="btn-primary">
          <i v-if="saving" class="fas fa-spinner fa-spin mr-1"></i>
          {{ isEditing ? 'Update' : 'Schedule' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { maintenanceApi } from '../../services/api';
import BaseModal from '../modals/BaseModal.vue';

const props = defineProps({
  record: {
    type: Object,
    default: null
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
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
  title: '',
  type: 'preventive',
  priority: 'normal',
  scheduled_date: new Date().toISOString().split('T')[0],
  description: '',
  performed_by: '',
  work_performed: '',
  notes: '',
  status: 'scheduled'
});

onMounted(() => {
  if (props.record) {
    form.value = { ...props.record };
  }
});

async function handleSubmit() {
  saving.value = true;
  try {
    const data = {
      ...form.value,
      entity_type: props.entityType,
      entity_id: Number(props.entityId),
      station_id: props.stationId ? Number(props.stationId) : null
    };

    if (isEditing.value) {
      await maintenanceApi.update(props.record.id, data);
    } else {
      await maintenanceApi.create(data);
    }

    emit('saved');
  } catch (error) {
    console.error('Failed to save maintenance:', error);
    alert('Failed to save: ' + error.message);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select,
.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 transition-colors;
}
</style>
