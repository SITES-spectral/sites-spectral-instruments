<script setup>
/**
 * ROI Viewer Component
 *
 * Canvas-based viewer for displaying ROI polygons overlaid on an instrument image.
 * Supports zoom, pan, and ROI highlighting.
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
  }
});

const emit = defineEmits(['roi-click', 'roi-hover']);

// Refs
const containerRef = ref(null);
const canvasRef = ref(null);
const imageLoaded = ref(false);
const imageError = ref(false);
const hoveredRoiId = ref(null);

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

  for (const roi of props.rois) {
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

  // Draw ROIs
  props.rois.forEach(roi => {
    if (!roi.points || roi.points.length < 3) return;

    const isSelected = roi.id === props.selectedRoiId;
    const isHovered = roi.id === hoveredRoiId.value;
    const alpha = roi.alpha ?? 0.3;

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

    // Stroke
    ctx.lineWidth = isSelected ? 3 : (isHovered ? 2 : roi.thickness ?? 2);
    ctx.strokeStyle = getROIColor(roi, 1);
    ctx.stroke();

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
      ctx.font = 'bold 12px sans-serif';
      const labelText = roi.roi_name;
      const textMetrics = ctx.measureText(labelText);
      const padding = 4;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        labelPos.x - textMetrics.width / 2 - padding,
        labelPos.y - 8 - padding,
        textMetrics.width + padding * 2,
        16 + padding
      );

      // Draw label text
      ctx.fillStyle = '#fff';
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

    <!-- ROI count badge -->
    <div class="absolute bottom-2 left-2 badge badge-neutral">
      {{ rois.length }} ROI{{ rois.length !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<style scoped>
.roi-viewer-container {
  min-height: 200px;
}
</style>
