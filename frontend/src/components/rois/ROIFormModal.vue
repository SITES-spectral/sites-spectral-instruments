<script setup>
/**
 * ROI Form Modal
 *
 * Modal for creating and editing ROIs.
 * Supports color selection, description, and basic metadata.
 *
 * @component
 */
import { ref, computed, watch } from 'vue';
import BaseModal from '@components/modals/BaseModal.vue';

const props = defineProps({
  /**
   * Show/hide modal (v-model)
   */
  modelValue: {
    type: Boolean,
    default: false
  },

  /**
   * Existing ROI to edit (null for create)
   */
  roi: {
    type: Object,
    default: null
  },

  /**
   * Instrument ID for new ROIs
   */
  instrumentId: {
    type: [Number, String],
    required: true
  },

  /**
   * Instrument name for display
   */
  instrumentName: {
    type: String,
    default: ''
  },

  /**
   * Loading state
   */
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'submit']);

// Form data
const formData = ref({
  roi_name: '',
  description: '',
  color_r: 255,
  color_g: 0,
  color_b: 0,
  alpha: 0.3,
  thickness: 2
});

// Predefined colors
const colorPresets = [
  { name: 'Red', r: 255, g: 0, b: 0 },
  { name: 'Green', r: 0, g: 200, b: 0 },
  { name: 'Blue', r: 0, g: 100, b: 255 },
  { name: 'Yellow', r: 255, g: 220, b: 0 },
  { name: 'Magenta', r: 255, g: 0, b: 200 },
  { name: 'Cyan', r: 0, g: 200, b: 200 },
  { name: 'Orange', r: 255, g: 140, b: 0 },
  { name: 'Purple', r: 128, g: 0, b: 255 }
];

// Is editing mode
const isEditing = computed(() => !!props.roi?.id);

// Modal title
const modalTitle = computed(() =>
  isEditing.value ? `Edit ${props.roi.roi_name}` : 'Create New ROI'
);

// Color preview style
const colorPreviewStyle = computed(() => ({
  backgroundColor: `rgb(${formData.value.color_r}, ${formData.value.color_g}, ${formData.value.color_b})`
}));

// Reset form when ROI changes
watch(() => props.roi, (newROI) => {
  if (newROI) {
    formData.value = {
      roi_name: newROI.roi_name || '',
      description: newROI.description || '',
      color_r: newROI.color_r ?? 255,
      color_g: newROI.color_g ?? 0,
      color_b: newROI.color_b ?? 0,
      alpha: newROI.alpha ?? 0.3,
      thickness: newROI.thickness ?? 2
    };
  } else {
    resetForm();
  }
}, { immediate: true });

// Reset form when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && !props.roi) {
    resetForm();
  }
});

function resetForm() {
  formData.value = {
    roi_name: '',
    description: '',
    color_r: 255,
    color_g: 0,
    color_b: 0,
    alpha: 0.3,
    thickness: 2
  };
}

function selectColorPreset(preset) {
  formData.value.color_r = preset.r;
  formData.value.color_g = preset.g;
  formData.value.color_b = preset.b;
}

function handleClose() {
  emit('update:modelValue', false);
}

function handleSubmit() {
  const payload = {
    ...formData.value,
    instrument_id: parseInt(props.instrumentId)
  };

  // Preserve existing points when editing
  if (isEditing.value && props.roi.points) {
    payload.points = props.roi.points;
  }

  emit('submit', payload);
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="modalTitle"
    size="md"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #default>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Instrument info -->
        <div class="alert alert-info py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">ROI for: <strong>{{ instrumentName }}</strong></span>
        </div>

        <!-- ROI Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">ROI Name</span>
            <span class="label-text-alt text-base-content/60">e.g., ROI_01</span>
          </label>
          <input
            v-model="formData.roi_name"
            type="text"
            class="input input-bordered"
            placeholder="Leave empty for auto-generated name"
            :disabled="isEditing"
          />
          <label v-if="!isEditing" class="label">
            <span class="label-text-alt">Auto-generated if left empty</span>
          </label>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Description</span>
          </label>
          <textarea
            v-model="formData.description"
            class="textarea textarea-bordered"
            rows="2"
            placeholder="Optional description of this ROI..."
          ></textarea>
        </div>

        <!-- Color Selection -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Color</span>
          </label>

          <!-- Color presets -->
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="preset in colorPresets"
              :key="preset.name"
              type="button"
              class="w-8 h-8 rounded-lg border-2 border-base-300 hover:border-primary transition-colors"
              :style="{ backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }"
              :title="preset.name"
              @click="selectColorPreset(preset)"
            ></button>
          </div>

          <!-- Custom RGB -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="label py-0">
                <span class="label-text text-xs">Red</span>
              </label>
              <input
                v-model.number="formData.color_r"
                type="number"
                min="0"
                max="255"
                class="input input-bordered input-sm w-full"
              />
            </div>
            <div>
              <label class="label py-0">
                <span class="label-text text-xs">Green</span>
              </label>
              <input
                v-model.number="formData.color_g"
                type="number"
                min="0"
                max="255"
                class="input input-bordered input-sm w-full"
              />
            </div>
            <div>
              <label class="label py-0">
                <span class="label-text text-xs">Blue</span>
              </label>
              <input
                v-model.number="formData.color_b"
                type="number"
                min="0"
                max="255"
                class="input input-bordered input-sm w-full"
              />
            </div>
          </div>

          <!-- Color preview -->
          <div class="flex items-center gap-3 mt-3">
            <div
              class="w-12 h-12 rounded-lg border border-base-300"
              :style="colorPreviewStyle"
            ></div>
            <span class="text-sm text-base-content/60">Color preview</span>
          </div>
        </div>

        <!-- Alpha (Opacity) -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Opacity</span>
            <span class="label-text-alt">{{ Math.round(formData.alpha * 100) }}%</span>
          </label>
          <input
            v-model.number="formData.alpha"
            type="range"
            min="0.1"
            max="0.8"
            step="0.1"
            class="range range-primary range-sm"
          />
        </div>

        <!-- Thickness -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Border Thickness</span>
            <span class="label-text-alt">{{ formData.thickness }}px</span>
          </label>
          <input
            v-model.number="formData.thickness"
            type="range"
            min="1"
            max="10"
            step="1"
            class="range range-sm"
          />
        </div>
      </form>
    </template>

    <template #actions>
      <button
        type="button"
        class="btn btn-ghost"
        :disabled="loading"
        @click="handleClose"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="loading"
        @click="handleSubmit"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ isEditing ? 'Save Changes' : 'Create ROI' }}
      </button>
    </template>
  </BaseModal>
</template>
