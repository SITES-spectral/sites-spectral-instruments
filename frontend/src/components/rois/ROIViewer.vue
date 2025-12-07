<script setup>
/**
 * ROI Viewer Component
 *
 * Canvas-based viewer for displaying ROI polygons overlaid on an instrument image.
 * Supports zoom, pan, and ROI highlighting.
 * v10.0.0-alpha.17: Added legacy ROI toggle and dimmed display
 *
 * @component
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
  /**
   * Image URL to display as background
   */
  imageUrl: {
    type: String,
    default: ''
  },

  /**
   * Array of ROI objects with points, color, and name
   */
  rois: {
    type: Array,
    default: () => []
  },

  /**
   * Currently selected ROI ID (highlights it)
   */
  selectedRoiId: {
    type: [Number, String],
    default: null
  },

  /**
   * Show ROI labels
   */
  showLabels: {
    type: Boolean,
    default: true
  },

  /**
   * Canvas height
   */
  height: {
    type: [Number, String],
    default: 400
  },

  /**
   * Show legacy toggle (v10.0.0-alpha.17)
   */
  showLegacyToggle: {
    type: Boolean,
    default: true
  },

  /**
   * Initial show legacy state
   */
  initialShowLegacy: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['roi-click', 'roi-hover', 'toggle-legacy']);

// Refs
const containerRef = ref(null);
const canvasRef = ref(null);
const imageLoaded = ref(false);
const imageError = ref(false);
const hoveredRoiId = ref(null);

// Legacy ROI toggle state (v10.0.0-alpha.17)
const showLegacy = ref(props.initialShowLegacy);

// Computed: Has legacy ROIs
const hasLegacyRois = computed(() => {
  return props.rois.some(roi => roi.is_legacy);
});

// Computed: Filtered ROIs based on legacy toggle
const visibleRois = computed(() => {
  if (showLegacy.value) {
    return props.rois;
  }
  return props.rois.filter(roi => !roi.is_legacy);
});

// Count of legacy ROIs
const legacyRoiCount = computed(() => {
  return props.rois.filter(roi => roi.is_legacy).length;
});

// Count of active ROIs
const activeRoiCount = computed(() => {
  return props.rois.filter(roi => !roi.is_legacy).length;
});

// Toggle legacy visibility
function toggleLegacy() {
  showLegacy.value = !showLegacy.value;
  emit('toggle-legacy', showLegacy.value);
  draw();
}

// Image object
let image = null;

// Canvas state
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

// Drag state for panning
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Computed canvas dimensions
const canvasHeight = computed(() => {
  return typeof props.height === 'number' ? props.height : parseInt(props.height) || 400;
});

/**
 * Get RGB color from ROI
 */
function getROIColor(roi, alpha = 1) {
  const r = roi.color_r ?? 255;
  const g = roi.color_g ?? 0;
  const b = roi.color_b ?? 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Transform point from image coordinates to canvas coordinates
 */
function transformPoint(x, y) {
  return {
    x: x * scale.value + offsetX.value,
    y: y * scale.value + offsetY.value
  };
}

/**
 * Inverse transform point from canvas to image coordinates
 */
function inverseTransformPoint(x, y) {
  return {
    x: (x - offsetX.value) / scale.value,
    y: (y - offsetY.value) / scale.value
  };
}

/**
 * Check if point is inside a polygon
 */
function pointInPolygon(x, y, points) {
  if (!points || points.length < 3) return false;

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Find ROI at canvas position
 */
function findROIAtPosition(canvasX, canvasY) {
  const imagePoint = inverseTransformPoint(canvasX, canvasY);

  // Only find from visible ROIs
  for (const roi of visibleRois.value) {
    if (roi.points && pointInPolygon(imagePoint.x, imagePoint.y, roi.points)) {
      return roi;
    }
  }
  return null;
}

/**
 * Draw the canvas
 */
function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  // Draw image if loaded
  if (image && imageLoaded.value) {
    ctx.save();
    ctx.translate(offsetX.value, offsetY.value);
    ctx.scale(scale.value, scale.value);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  } else if (!props.imageUrl) {
    // No image placeholder
    ctx.fillStyle = '#4a4a6a';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No image available', width / 2, height / 2);
  } else if (imageError.value) {
    // Error placeholder
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Failed to load image', width / 2, height / 2);
  } else {
    // Loading placeholder
    ctx.fillStyle = '#888';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading image...', width / 2, height / 2);
  }

  // Draw ROIs (v10.0.0-alpha.17: legacy styling support)
  visibleRois.value.forEach(roi => {
    if (!roi.points || roi.points.length < 3) return;

    const isSelected = roi.id === props.selectedRoiId;
    const isHovered = roi.id === hoveredRoiId.value;
    const isLegacy = roi.is_legacy;
    const baseAlpha = roi.alpha ?? 0.3;
    // Legacy ROIs are more transparent
    const alpha = isLegacy ? baseAlpha * 0.5 : baseAlpha;

    ctx.beginPath();
    const firstPoint = transformPoint(roi.points[0].x, roi.points[0].y);
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < roi.points.length; i++) {
      const point = transformPoint(roi.points[i].x, roi.points[i].y);
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();

    // Fill
    const fillAlpha = isSelected ? alpha + 0.2 : (isHovered ? alpha + 0.1 : alpha);
    ctx.fillStyle = getROIColor(roi, fillAlpha);
    ctx.fill();

    // Stroke (legacy ROIs use dashed lines)
    ctx.lineWidth = isSelected ? 3 : (isHovered ? 2 : roi.thickness ?? 2);
    const strokeAlpha = isLegacy ? 0.6 : 1;
    ctx.strokeStyle = getROIColor(roi, strokeAlpha);
    if (isLegacy) {
      ctx.setLineDash([4, 4]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    if (props.showLabels && roi.roi_name) {
      // Calculate centroid
      let centroidX = 0;
      let centroidY = 0;
      roi.points.forEach(p => {
        centroidX += p.x;
        centroidY += p.y;
      });
      centroidX /= roi.points.length;
      centroidY /= roi.points.length;

      const labelPos = transformPoint(centroidX, centroidY);

      // Draw label background
      ctx.font = isLegacy ? '11px sans-serif' : 'bold 12px sans-serif';
      const labelText = isLegacy ? `${roi.roi_name} (legacy)` : roi.roi_name;
      const textMetrics = ctx.measureText(labelText);
      const padding = 4;

      ctx.fillStyle = isLegacy ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        labelPos.x - textMetrics.width / 2 - padding,
        labelPos.y - 8 - padding,
        textMetrics.width + padding * 2,
        16 + padding
      );

      // Draw label text
      ctx.fillStyle = isLegacy ? 'rgba(255, 255, 255, 0.7)' : '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, labelPos.x, labelPos.y);
    }
  });
}

/**
 * Fit image to canvas
 */
function fitToCanvas() {
  if (!image || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const scaleX = canvas.width / image.width;
  const scaleY = canvas.height / image.height;

  scale.value = Math.min(scaleX, scaleY) * 0.95;
  offsetX.value = (canvas.width - image.width * scale.value) / 2;
  offsetY.value = (canvas.height - image.height * scale.value) / 2;

  draw();
}

/**
 * Handle zoom with mouse wheel
 */
function handleWheel(e) {
  e.preventDefault();

  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.1, Math.min(5, scale.value * zoomFactor));

  // Zoom toward mouse position
  const imagePoint = inverseTransformPoint(mouseX, mouseY);
  scale.value = newScale;
  offsetX.value = mouseX - imagePoint.x * newScale;
  offsetY.value = mouseY - imagePoint.y * newScale;

  draw();
}

/**
 * Handle mouse down for panning
 */
function handleMouseDown(e) {
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

/**
 * Handle mouse move for panning and hover
 */
function handleMouseMove(e) {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (isDragging) {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    offsetX.value += deltaX;
    offsetY.value += deltaY;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    draw();
  } else {
    // Check for ROI hover
    const roi = findROIAtPosition(mouseX, mouseY);
    const newHoveredId = roi?.id || null;

    if (newHoveredId !== hoveredRoiId.value) {
      hoveredRoiId.value = newHoveredId;
      emit('roi-hover', roi);
      draw();
    }

    // Update cursor
    canvas.style.cursor = roi ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
  }
}

/**
 * Handle mouse up
 */
function handleMouseUp() {
  isDragging = false;
}

/**
 * Handle click on ROI
 */
function handleClick(e) {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const roi = findROIAtPosition(mouseX, mouseY);
  if (roi) {
    emit('roi-click', roi);
  }
}

/**
 * Handle canvas resize
 */
function handleResize() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  canvas.width = container.clientWidth;
  canvas.height = canvasHeight.value;

  if (imageLoaded.value) {
    fitToCanvas();
  } else {
    draw();
  }
}

/**
 * Load image
 */
function loadImage() {
  if (!props.imageUrl) {
    imageLoaded.value = false;
    imageError.value = false;
    draw();
    return;
  }

  image = new Image();
  image.crossOrigin = 'anonymous';

  image.onload = () => {
    imageLoaded.value = true;
    imageError.value = false;
    fitToCanvas();
  };

  image.onerror = () => {
    imageLoaded.value = false;
    imageError.value = true;
    draw();
  };

  image.src = props.imageUrl;
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    handleResize();
    loadImage();
  });

  window.addEventListener('resize', handleResize);
  window.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mouseup', handleMouseUp);
});

// Watch for changes
watch(() => props.imageUrl, loadImage);
watch(() => props.rois, draw, { deep: true });
watch(() => props.selectedRoiId, draw);
watch(() => props.showLabels, draw);

// Expose methods
defineExpose({
  fitToCanvas,
  draw
});
</script>

<template>
  <div
    ref="containerRef"
    class="roi-viewer-container relative w-full bg-base-300 rounded-lg overflow-hidden"
  >
    <canvas
      ref="canvasRef"
      :style="{ height: `${canvasHeight}px` }"
      class="w-full cursor-grab"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @click="handleClick"
    ></canvas>

    <!-- Controls overlay -->
    <div class="absolute top-2 right-2 flex gap-1">
      <!-- Legacy toggle (v10.0.0-alpha.17) -->
      <button
        v-if="showLegacyToggle && hasLegacyRois"
        class="btn btn-sm btn-ghost bg-base-100/80 hover:bg-base-100 gap-1"
        :class="{ 'btn-active': showLegacy }"
        :title="showLegacy ? 'Hide legacy ROIs' : 'Show legacy ROIs'"
        @click="toggleLegacy"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-xs">{{ legacyRoiCount }}</span>
      </button>
      <button
        class="btn btn-sm btn-square btn-ghost bg-base-100/80 hover:bg-base-100"
        title="Fit to view"
        @click="fitToCanvas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>

    <!-- ROI count badge (v10.0.0-alpha.17: shows active/total) -->
    <div class="absolute bottom-2 left-2 flex gap-1">
      <div class="badge badge-xs sm:badge-sm badge-neutral whitespace-nowrap">
        {{ activeRoiCount }} <span class="hidden sm:inline">active</span>
      </div>
      <div v-if="showLegacy && legacyRoiCount > 0" class="badge badge-xs sm:badge-sm badge-warning badge-outline whitespace-nowrap">
        {{ legacyRoiCount }} <span class="hidden sm:inline">legacy</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roi-viewer-container {
  min-height: 200px;
}
</style>
