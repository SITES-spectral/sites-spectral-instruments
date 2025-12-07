<script setup>
/**
 * ROI Drawing Canvas Component
 *
 * Interactive canvas for drawing and editing ROI polygons.
 * Combines the ROIViewer display with interactive drawing functionality.
 *
 * Controls:
 * - Click: Add vertex
 * - Double-click: Close polygon
 * - Right-click: Remove last vertex
 * - Escape: Cancel drawing
 * - Drag vertex: Move vertex (edit mode)
 * - Click near first vertex: Close polygon
 *
 * v10.0.0-alpha.17
 *
 * @component
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useROIDrawing, DRAWING_MODES } from '@composables/useROIDrawing';

const props = defineProps({
  /**
   * Image URL to display as background
   */
  imageUrl: {
    type: String,
    default: ''
  },

  /**
   * Existing ROIs to display (non-editable)
   */
  existingRois: {
    type: Array,
    default: () => []
  },

  /**
   * ROI data to edit (if editing existing ROI)
   */
  editingRoi: {
    type: Object,
    default: null
  },

  /**
   * Whether drawing is disabled
   */
  disabled: {
    type: Boolean,
    default: false
  },

  /**
   * Canvas height
   */
  height: {
    type: [Number, String],
    default: 400
  },

  /**
   * Default color for new ROIs
   */
  defaultColor: {
    type: Object,
    default: () => ({ r: 255, g: 100, b: 100 })
  }
});

const emit = defineEmits([
  'points-change',
  'drawing-complete',
  'drawing-cancel',
  'roi-click'
]);

// Use ROI drawing composable
const drawing = useROIDrawing();

// Refs
const containerRef = ref(null);
const canvasRef = ref(null);
const imageLoaded = ref(false);
const imageError = ref(false);

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

// Cursor style based on mode
const cursorStyle = computed(() => {
  if (props.disabled) return 'not-allowed';
  if (drawing.isDrawing.value) return 'crosshair';
  if (drawing.draggingVertexIndex.value >= 0) return 'grabbing';
  if (drawing.hoveredVertexIndex.value >= 0) return 'grab';
  if (drawing.isEditing.value) return 'default';
  return 'crosshair';
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
 * Find existing ROI at canvas position
 */
function findExistingROIAtPosition(canvasX, canvasY) {
  const imagePoint = inverseTransformPoint(canvasX, canvasY);

  for (const roi of props.existingRois) {
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

  // Draw existing ROIs (dimmed)
  props.existingRois.forEach(roi => {
    if (!roi.points || roi.points.length < 3) return;

    ctx.beginPath();
    const firstPoint = transformPoint(roi.points[0].x, roi.points[0].y);
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < roi.points.length; i++) {
      const point = transformPoint(roi.points[i].x, roi.points[i].y);
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();

    // Fill (dimmed)
    ctx.fillStyle = getROIColor(roi, 0.15);
    ctx.fill();

    // Stroke (dimmed)
    ctx.lineWidth = roi.thickness ?? 2;
    ctx.strokeStyle = getROIColor(roi, 0.5);
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    if (roi.roi_name) {
      const points = roi.points;
      let centroidX = 0;
      let centroidY = 0;
      points.forEach(p => {
        centroidX += p.x;
        centroidY += p.y;
      });
      centroidX /= points.length;
      centroidY /= points.length;

      const labelPos = transformPoint(centroidX, centroidY);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roi.roi_name, labelPos.x, labelPos.y);
    }
  });

  // Draw current drawing polygon
  const drawingPoints = drawing.points.value;
  if (drawingPoints.length > 0) {
    ctx.beginPath();
    const firstPoint = transformPoint(drawingPoints[0].x, drawingPoints[0].y);
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < drawingPoints.length; i++) {
      const point = transformPoint(drawingPoints[i].x, drawingPoints[i].y);
      ctx.lineTo(point.x, point.y);
    }

    // If editing, close the polygon
    if (drawing.isEditing.value && drawingPoints.length >= 3) {
      ctx.closePath();
      ctx.fillStyle = `rgba(${drawing.color.r}, ${drawing.color.g}, ${drawing.color.b}, ${drawing.alpha.value})`;
      ctx.fill();
    }

    // Stroke
    ctx.lineWidth = drawing.thickness.value;
    ctx.strokeStyle = `rgba(${drawing.color.r}, ${drawing.color.g}, ${drawing.color.b}, 1)`;
    ctx.stroke();

    // Draw line to cursor while drawing
    if (drawing.isDrawing.value && drawingPoints.length > 0) {
      const lastPoint = transformPoint(
        drawingPoints[drawingPoints.length - 1].x,
        drawingPoints[drawingPoints.length - 1].y
      );
      const cursorPos = transformPoint(
        drawing.cursorPosition.value.x,
        drawing.cursorPosition.value.y
      );

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(cursorPos.x, cursorPos.y);
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw line from cursor to first point if near closing
      if (drawing.isNearFirstVertex.value) {
        ctx.beginPath();
        ctx.moveTo(cursorPos.x, cursorPos.y);
        ctx.lineTo(firstPoint.x, firstPoint.y);
        ctx.strokeStyle = `rgba(${drawing.color.r}, ${drawing.color.g}, ${drawing.color.b}, 0.5)`;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw vertices
    drawingPoints.forEach((point, index) => {
      const transformed = transformPoint(point.x, point.y);
      const isHovered = index === drawing.hoveredVertexIndex.value;
      const isDragging = index === drawing.draggingVertexIndex.value;
      const isFirst = index === 0 && drawing.isDrawing.value;

      // Highlight first vertex when near closing
      const highlightFirst = isFirst && drawing.isNearFirstVertex.value;

      ctx.beginPath();
      ctx.arc(
        transformed.x,
        transformed.y,
        highlightFirst ? drawing.vertexRadius * 1.5 : drawing.vertexRadius,
        0,
        Math.PI * 2
      );

      // Fill
      if (isDragging || highlightFirst) {
        ctx.fillStyle = `rgba(${drawing.color.r}, ${drawing.color.g}, ${drawing.color.b}, 1)`;
      } else if (isHovered) {
        ctx.fillStyle = `rgba(${drawing.color.r}, ${drawing.color.g}, ${drawing.color.b}, 0.8)`;
      } else {
        ctx.fillStyle = 'white';
      }
      ctx.fill();

      // Stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(${drawing.color.r}, ${drawing.color.g}, ${drawing.color.b}, 1)`;
      ctx.stroke();
    });
  }

  // Draw instructions overlay
  if (drawing.isDrawing.value) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, height - 30, 300, 20);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    let instruction = 'Click to add points';
    if (drawingPoints.length >= 3) {
      if (drawing.isNearFirstVertex.value) {
        instruction = 'Click to close polygon';
      } else {
        instruction = 'Double-click or click first point to close';
      }
    }
    ctx.fillText(instruction + ' | Right-click: undo | Esc: cancel', 15, height - 16);
  } else if (drawing.isEditing.value) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, height - 30, 250, 20);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText('Drag vertices to edit | Esc: cancel', 15, height - 16);
  }
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
 * Handle mouse down
 */
function handleMouseDown(e) {
  if (props.disabled) return;

  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;

  // Check for vertex drag in edit mode
  if (drawing.isEditing.value && e.button === 0) {
    const vertexIndex = drawing.findVertexAtPosition(canvasX, canvasY, transformPoint);
    if (vertexIndex >= 0) {
      drawing.startDragVertex(vertexIndex);
      return;
    }
  }

  // Pan with middle button or when not in drawing mode
  if (e.button === 1 || (!drawing.isActive.value && e.button === 0)) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
}

/**
 * Handle mouse move
 */
function handleMouseMove(e) {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  const imagePoint = inverseTransformPoint(canvasX, canvasY);

  if (isDragging) {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    offsetX.value += deltaX;
    offsetY.value += deltaY;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    draw();
  } else if (drawing.isActive.value) {
    drawing.handleMouseMove(imagePoint.x, imagePoint.y, canvasX, canvasY, transformPoint);
    draw();
  }
}

/**
 * Handle mouse up
 */
function handleMouseUp() {
  isDragging = false;
  if (drawing.draggingVertexIndex.value >= 0) {
    drawing.stopDragVertex();
    emit('points-change', [...drawing.points.value]);
  }
}

/**
 * Handle click
 */
function handleClick(e) {
  if (props.disabled) return;
  if (e.button !== 0) return;

  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  const imagePoint = inverseTransformPoint(canvasX, canvasY);

  // If not in drawing mode, check for existing ROI click
  if (!drawing.isActive.value) {
    const roi = findExistingROIAtPosition(canvasX, canvasY);
    if (roi) {
      emit('roi-click', roi);
      return;
    }
    // Start drawing
    startDrawing();
  }

  if (drawing.isDrawing.value) {
    const closed = drawing.handleClick(imagePoint.x, imagePoint.y);
    if (closed) {
      emit('drawing-complete', drawing.getPolygonData());
    } else {
      emit('points-change', [...drawing.points.value]);
    }
    draw();
  }
}

/**
 * Handle double-click
 */
function handleDoubleClick(e) {
  if (props.disabled) return;
  if (!drawing.isDrawing.value) return;

  e.preventDefault();
  const closed = drawing.handleDoubleClick();
  if (closed) {
    emit('drawing-complete', drawing.getPolygonData());
  }
  draw();
}

/**
 * Handle right-click (context menu)
 */
function handleContextMenu(e) {
  e.preventDefault();
  if (props.disabled) return;

  if (drawing.isDrawing.value) {
    drawing.removeLastPoint();
    emit('points-change', [...drawing.points.value]);
    draw();
  }
}

/**
 * Handle key press
 */
function handleKeyDown(e) {
  if (e.key === 'Escape' && drawing.isActive.value) {
    cancelDrawing();
  }
}

/**
 * Start drawing mode
 */
function startDrawing() {
  drawing.startDrawing();
  drawing.setColor(props.defaultColor.r, props.defaultColor.g, props.defaultColor.b);
  draw();
}

/**
 * Start editing mode with existing ROI
 */
function startEditing(roiData) {
  drawing.loadPolygonData(roiData);
  draw();
}

/**
 * Cancel drawing/editing
 */
function cancelDrawing() {
  drawing.cancel();
  emit('drawing-cancel');
  draw();
}

/**
 * Confirm editing and get result
 */
function confirmEditing() {
  if (!drawing.isValidPolygon.value) return null;
  const result = drawing.getPolygonData();
  drawing.reset();
  draw();
  return result;
}

/**
 * Set color for current drawing
 */
function setColor(r, g, b) {
  drawing.setColor(r, g, b);
  draw();
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

    // If editing existing ROI, load it
    if (props.editingRoi) {
      startEditing(props.editingRoi);
    }
  });

  window.addEventListener('resize', handleResize);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('keydown', handleKeyDown);
});

// Watch for changes
watch(() => props.imageUrl, loadImage);
watch(() => props.existingRois, draw, { deep: true });
watch(() => props.editingRoi, (newVal) => {
  if (newVal) {
    startEditing(newVal);
  }
}, { deep: true });

// Expose methods
defineExpose({
  fitToCanvas,
  draw,
  startDrawing,
  startEditing,
  cancelDrawing,
  confirmEditing,
  setColor,
  isDrawing: drawing.isDrawing,
  isEditing: drawing.isEditing,
  isActive: drawing.isActive,
  isValidPolygon: drawing.isValidPolygon,
  points: drawing.points
});
</script>

<template>
  <div
    ref="containerRef"
    class="roi-drawing-container relative w-full bg-base-300 rounded-lg overflow-hidden"
  >
    <canvas
      ref="canvasRef"
      :style="{ height: `${canvasHeight}px`, cursor: cursorStyle }"
      class="w-full"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @contextmenu="handleContextMenu"
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

    <!-- Mode indicator -->
    <div
      v-if="drawing.isActive.value"
      class="absolute top-2 left-2 badge"
      :class="drawing.isDrawing.value ? 'badge-primary' : 'badge-secondary'"
    >
      {{ drawing.isDrawing.value ? 'Drawing' : 'Editing' }}
    </div>

    <!-- Point count -->
    <div
      v-if="drawing.points.value.length > 0"
      class="absolute bottom-2 left-2 badge badge-neutral"
    >
      {{ drawing.points.value.length }} point{{ drawing.points.value.length !== 1 ? 's' : '' }}
    </div>

    <!-- Action buttons when drawing -->
    <div
      v-if="drawing.isActive.value"
      class="absolute bottom-2 right-2 flex gap-2"
    >
      <button
        class="btn btn-sm btn-ghost bg-base-100/80"
        @click="cancelDrawing"
      >
        Cancel
      </button>
      <button
        v-if="drawing.isEditing.value || drawing.isValidPolygon.value"
        class="btn btn-sm btn-primary"
        :disabled="!drawing.isValidPolygon.value"
        @click="() => {
          if (drawing.isDrawing.value) {
            drawing.closePolygon();
            emit('drawing-complete', drawing.getPolygonData());
          } else {
            emit('drawing-complete', confirmEditing());
          }
        }"
      >
        Confirm
      </button>
    </div>
  </div>
</template>

<style scoped>
.roi-drawing-container {
  min-height: 200px;
  user-select: none;
}
</style>
