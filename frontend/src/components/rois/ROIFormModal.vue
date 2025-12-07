<script setup>
/**
 * ROI Form Modal
 *
 * Modal for creating and editing ROIs.
 * Supports color selection, description, and basic metadata.
 * v10.0.0-alpha.17: Added interactive drawing canvas
 *
 * @component
 */
import { ref, computed, watch } from 'vue';
import BaseModal from '@components/modals/BaseModal.vue';
import ROIDrawingCanvas from './ROIDrawingCanvas.vue';

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
  },

  /**
   * Image URL for drawing canvas (v10.0.0-alpha.17)
   */
  imageUrl: {
    type: String,
    default: ''
  },

  /**
   * Existing ROIs to display on canvas (v10.0.0-alpha.17)
   */
  existingRois: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'submit']);

// Drawing canvas ref
const canvasRef = ref(null);

// Current step: 'draw' or 'details'
const currentStep = ref('draw');

// Drawn points (v10.0.0-alpha.17)
const drawnPoints = ref([]);

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

// Has valid polygon (at least 3 points)
const hasValidPolygon = computed(() => drawnPoints.value.length >= 3);

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
const modalTitle = computed(() => {
  if (isEditing.value) return `Edit ${props.roi.roi_name}`;
  return currentStep.value === 'draw' ? 'Draw ROI Polygon' : 'ROI Details';
});

// Show canvas when we have an image and not in edit mode with existing points
const showDrawingCanvas = computed(() => {
  return props.imageUrl && currentStep.value === 'draw';
});

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
  drawnPoints.value = [];
  currentStep.value = props.imageUrl ? 'draw' : 'details';
}

function selectColorPreset(preset) {
  formData.value.color_r = preset.r;
  formData.value.color_g = preset.g;
  formData.value.color_b = preset.b;
  // Update canvas color if ref is available
  if (canvasRef.value) {
    canvasRef.value.setColor(preset.r, preset.g, preset.b);
  }
}

function handleClose() {
  emit('update:modelValue', false);
}

// Handle points change from canvas
function handlePointsChange(points) {
  drawnPoints.value = points;
}

// Handle drawing complete from canvas
function handleDrawingComplete(polygonData) {
  drawnPoints.value = polygonData.points;
  formData.value.color_r = polygonData.color_r;
  formData.value.color_g = polygonData.color_g;
  formData.value.color_b = polygonData.color_b;
  formData.value.alpha = polygonData.alpha;
  formData.value.thickness = polygonData.thickness;
  // Move to details step
  currentStep.value = 'details';
}

// Handle drawing cancel
function handleDrawingCancel() {
  drawnPoints.value = [];
}

// Go back to drawing step
function goBackToDrawing() {
  currentStep.value = 'draw';
}

function handleSubmit() {
  const payload = {
    ...formData.value,
    instrument_id: parseInt(props.instrumentId),
    points: drawnPoints.value
  };

  // Preserve existing points when editing if no new points drawn
  if (isEditing.value && drawnPoints.value.length === 0 && props.roi.points) {
    payload.points = props.roi.points;
  }

  emit('submit', payload);
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="modalTitle"
    :size="showDrawingCanvas ? 'lg' : 'md'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #default>
      <!-- Step indicator (when creating with image) -->
      <div v-if="imageUrl && !isEditing" class="flex items-center justify-center gap-4 mb-4">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            :class="currentStep === 'draw' ? 'bg-primary text-primary-content' : 'bg-success text-success-content'"
          >
            {{ currentStep === 'draw' ? '1' : '✓' }}
          </div>
          <span :class="currentStep === 'draw' ? 'font-medium' : 'text-base-content/60'">Draw</span>
        </div>
        <div class="w-8 h-0.5 bg-base-300"></div>
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            :class="currentStep === 'details' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/60'"
          >
            2
          </div>
          <span :class="currentStep === 'details' ? 'font-medium' : 'text-base-content/60'">Details</span>
        </div>
      </div>

      <!-- Drawing Canvas Step (v10.0.0-alpha.17) -->
      <div v-if="showDrawingCanvas" class="space-y-4">
        <div class="alert alert-info py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">Click on the image to draw ROI points. Double-click or click the first point to close.</span>
        </div>

        <!-- Color presets for drawing -->
        <div class="flex flex-wrap gap-2">
          <span class="text-sm text-base-content/70">Color:</span>
          <button
            v-for="preset in colorPresets"
            :key="preset.name"
            type="button"
            class="w-6 h-6 rounded border-2 border-base-300 hover:border-primary transition-colors"
            :style="{ backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }"
            :title="preset.name"
            @click="selectColorPreset(preset)"
          ></button>
        </div>

        <ROIDrawingCanvas
          ref="canvasRef"
          :image-url="imageUrl"
          :existing-rois="existingRois"
          :editing-roi="isEditing ? roi : null"
          :height="400"
          :default-color="{ r: formData.color_r, g: formData.color_g, b: formData.color_b }"
          @points-change="handlePointsChange"
          @drawing-complete="handleDrawingComplete"
          @drawing-cancel="handleDrawingCancel"
        />
      </div>

      <!-- Details Form Step -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Instrument info -->
        <div class="alert alert-info py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">ROI for: <strong>{{ instrumentName }}</strong></span>
        </div>

        <!-- Points summary (when coming from drawing) -->
        <div v-if="hasValidPolygon" class="alert py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">Polygon drawn with {{ drawnPoints.length }} points</span>
          <button
            v-if="imageUrl"
            type="button"
            class="btn btn-ghost btn-xs"
            @click="goBackToDrawing"
          >
            Redraw
          </button>
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

      <!-- Back button when on details step -->
      <button
        v-if="currentStep === 'details' && imageUrl && !isEditing"
        type="button"
        class="btn btn-ghost"
        :disabled="loading"
        @click="goBackToDrawing"
      >
        Back
      </button>

      <button
        v-if="currentStep === 'details'"
        type="submit"
        class="btn btn-primary"
        :disabled="loading || (!hasValidPolygon && !isEditing)"
        @click="handleSubmit"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ isEditing ? 'Save Changes' : 'Create ROI' }}
      </button>
    </template>
  </BaseModal>
</template>
