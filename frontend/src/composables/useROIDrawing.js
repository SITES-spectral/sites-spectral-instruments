/**
 * ROI Drawing Composable
 *
 * Provides interactive polygon drawing functionality for ROI creation.
 * Extends the ROIViewer canvas patterns for drawing mode.
 *
 * Features:
 * - Click to add vertices
 * - Double-click to close polygon
 * - Right-click to remove last point
 * - Drag vertices to edit existing polygon
 * - Escape to cancel drawing
 * - Visual feedback with dashed line to cursor
 *
 * v10.0.0-alpha.17
 *
 * @module composables/useROIDrawing
 */

import { ref, computed, reactive } from 'vue';

/**
 * Drawing mode constants
 */
export const DRAWING_MODES = {
  IDLE: 'idle',
  DRAWING: 'drawing',
  EDITING: 'editing'
};

/**
 * ROI Drawing composable
 * @param {Object} options - Configuration options
 * @param {number} [options.minPoints=3] - Minimum points required for valid polygon
 * @param {number} [options.vertexRadius=8] - Radius for vertex handles in pixels
 * @param {number} [options.snapDistance=10] - Distance in pixels to snap to first vertex
 * @returns {Object} Drawing state and methods
 */
export function useROIDrawing(options = {}) {
  const {
    minPoints = 3,
    vertexRadius = 8,
    snapDistance = 10
  } = options;

  // Drawing state
  const mode = ref(DRAWING_MODES.IDLE);
  const points = ref([]);
  const cursorPosition = ref({ x: 0, y: 0 });
  const hoveredVertexIndex = ref(-1);
  const draggingVertexIndex = ref(-1);
  const isNearFirstVertex = ref(false);

  // Polygon properties
  const color = reactive({
    r: 255,
    g: 100,
    b: 100
  });
  const thickness = ref(2);
  const alpha = ref(0.3);

  /**
   * Check if polygon is valid (has minimum points)
   */
  const isValidPolygon = computed(() => {
    return points.value.length >= minPoints;
  });

  /**
   * Check if currently drawing
   */
  const isDrawing = computed(() => {
    return mode.value === DRAWING_MODES.DRAWING;
  });

  /**
   * Check if currently editing
   */
  const isEditing = computed(() => {
    return mode.value === DRAWING_MODES.EDITING;
  });

  /**
   * Check if in any active mode
   */
  const isActive = computed(() => {
    return mode.value !== DRAWING_MODES.IDLE;
  });

  /**
   * Calculate distance between two points
   */
  function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Start drawing a new polygon
   */
  function startDrawing() {
    mode.value = DRAWING_MODES.DRAWING;
    points.value = [];
    hoveredVertexIndex.value = -1;
    draggingVertexIndex.value = -1;
    isNearFirstVertex.value = false;
  }

  /**
   * Start editing an existing polygon
   * @param {Array} existingPoints - Array of {x, y} points
   */
  function startEditing(existingPoints) {
    if (!existingPoints || existingPoints.length < minPoints) {
      console.warn('Cannot edit polygon with fewer than', minPoints, 'points');
      return false;
    }
    mode.value = DRAWING_MODES.EDITING;
    points.value = existingPoints.map(p => ({ x: p.x, y: p.y }));
    hoveredVertexIndex.value = -1;
    draggingVertexIndex.value = -1;
    return true;
  }

  /**
   * Add a point to the polygon
   * @param {number} x - X coordinate in image space
   * @param {number} y - Y coordinate in image space
   */
  function addPoint(x, y) {
    if (mode.value !== DRAWING_MODES.DRAWING) return;
    points.value.push({ x, y });
  }

  /**
   * Remove the last point
   */
  function removeLastPoint() {
    if (points.value.length > 0) {
      points.value.pop();
    }
  }

  /**
   * Close the polygon (connect last point to first)
   * @returns {boolean} True if polygon was closed successfully
   */
  function closePolygon() {
    if (!isValidPolygon.value) {
      return false;
    }
    mode.value = DRAWING_MODES.IDLE;
    return true;
  }

  /**
   * Cancel drawing and clear points
   */
  function cancel() {
    mode.value = DRAWING_MODES.IDLE;
    points.value = [];
    hoveredVertexIndex.value = -1;
    draggingVertexIndex.value = -1;
    isNearFirstVertex.value = false;
  }

  /**
   * Finish editing and return to idle
   * @returns {Array} The edited points array
   */
  function finishEditing() {
    if (mode.value !== DRAWING_MODES.EDITING) return null;
    if (!isValidPolygon.value) return null;

    mode.value = DRAWING_MODES.IDLE;
    return [...points.value];
  }

  /**
   * Find vertex at canvas position (for hit testing)
   * @param {number} canvasX - X position on canvas
   * @param {number} canvasY - Y position on canvas
   * @param {Function} transformPoint - Function to transform image coords to canvas coords
   * @returns {number} Index of vertex or -1 if none found
   */
  function findVertexAtPosition(canvasX, canvasY, transformPoint) {
    for (let i = 0; i < points.value.length; i++) {
      const transformed = transformPoint(points.value[i].x, points.value[i].y);
      if (distance({ x: canvasX, y: canvasY }, transformed) <= vertexRadius) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Handle mouse move during drawing/editing
   * @param {number} imageX - X position in image coordinates
   * @param {number} imageY - Y position in image coordinates
   * @param {number} canvasX - X position on canvas (for vertex hit testing)
   * @param {number} canvasY - Y position on canvas
   * @param {Function} transformPoint - Function to transform image coords to canvas coords
   */
  function handleMouseMove(imageX, imageY, canvasX, canvasY, transformPoint) {
    cursorPosition.value = { x: imageX, y: imageY };

    if (mode.value === DRAWING_MODES.DRAWING && points.value.length > 0) {
      // Check if near first vertex for closing
      const firstPoint = transformPoint(points.value[0].x, points.value[0].y);
      isNearFirstVertex.value = distance({ x: canvasX, y: canvasY }, firstPoint) <= snapDistance;
    }

    if (draggingVertexIndex.value >= 0) {
      // Dragging a vertex - update its position
      points.value[draggingVertexIndex.value] = { x: imageX, y: imageY };
    } else if (mode.value === DRAWING_MODES.EDITING) {
      // Check for vertex hover
      hoveredVertexIndex.value = findVertexAtPosition(canvasX, canvasY, transformPoint);
    }
  }

  /**
   * Handle click during drawing
   * @param {number} imageX - X position in image coordinates
   * @param {number} imageY - Y position in image coordinates
   * @returns {boolean} True if polygon was closed
   */
  function handleClick(imageX, imageY) {
    if (mode.value !== DRAWING_MODES.DRAWING) return false;

    // If near first vertex and have enough points, close
    if (isNearFirstVertex.value && isValidPolygon.value) {
      return closePolygon();
    }

    // Otherwise add point
    addPoint(imageX, imageY);
    return false;
  }

  /**
   * Handle double-click to close polygon
   * @returns {boolean} True if polygon was closed
   */
  function handleDoubleClick() {
    if (mode.value !== DRAWING_MODES.DRAWING) return false;

    // Remove the extra point added by click before double-click
    if (points.value.length > minPoints) {
      removeLastPoint();
    }

    return closePolygon();
  }

  /**
   * Start dragging a vertex
   * @param {number} index - Index of vertex to drag
   */
  function startDragVertex(index) {
    if (mode.value !== DRAWING_MODES.EDITING) return;
    if (index < 0 || index >= points.value.length) return;
    draggingVertexIndex.value = index;
  }

  /**
   * Stop dragging vertex
   */
  function stopDragVertex() {
    draggingVertexIndex.value = -1;
  }

  /**
   * Move a vertex to new position
   * @param {number} index - Vertex index
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   */
  function moveVertex(index, x, y) {
    if (index < 0 || index >= points.value.length) return;
    points.value[index] = { x, y };
  }

  /**
   * Delete a vertex from the polygon
   * @param {number} index - Index of vertex to delete
   * @returns {boolean} True if deleted, false if would result in invalid polygon
   */
  function deleteVertex(index) {
    if (points.value.length <= minPoints) {
      return false;
    }
    if (index < 0 || index >= points.value.length) {
      return false;
    }
    points.value.splice(index, 1);
    hoveredVertexIndex.value = -1;
    return true;
  }

  /**
   * Insert a vertex between two existing vertices
   * @param {number} afterIndex - Index of vertex to insert after
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  function insertVertex(afterIndex, x, y) {
    if (afterIndex < 0 || afterIndex >= points.value.length) return;
    points.value.splice(afterIndex + 1, 0, { x, y });
  }

  /**
   * Set polygon color
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   */
  function setColor(r, g, b) {
    color.r = Math.max(0, Math.min(255, r));
    color.g = Math.max(0, Math.min(255, g));
    color.b = Math.max(0, Math.min(255, b));
  }

  /**
   * Get the polygon data for saving
   * @returns {Object} Polygon data with points, color, etc.
   */
  function getPolygonData() {
    return {
      points: [...points.value],
      color_r: color.r,
      color_g: color.g,
      color_b: color.b,
      thickness: thickness.value,
      alpha: alpha.value
    };
  }

  /**
   * Load polygon data for editing
   * @param {Object} data - Polygon data with points and color
   */
  function loadPolygonData(data) {
    if (data.points && Array.isArray(data.points)) {
      startEditing(data.points);
    }
    if (data.color_r !== undefined) color.r = data.color_r;
    if (data.color_g !== undefined) color.g = data.color_g;
    if (data.color_b !== undefined) color.b = data.color_b;
    if (data.thickness !== undefined) thickness.value = data.thickness;
    if (data.alpha !== undefined) alpha.value = data.alpha;
  }

  /**
   * Clear all state
   */
  function reset() {
    mode.value = DRAWING_MODES.IDLE;
    points.value = [];
    cursorPosition.value = { x: 0, y: 0 };
    hoveredVertexIndex.value = -1;
    draggingVertexIndex.value = -1;
    isNearFirstVertex.value = false;
  }

  return {
    // Constants
    DRAWING_MODES,
    vertexRadius,
    snapDistance,
    minPoints,

    // State
    mode,
    points,
    cursorPosition,
    hoveredVertexIndex,
    draggingVertexIndex,
    isNearFirstVertex,
    color,
    thickness,
    alpha,

    // Computed
    isValidPolygon,
    isDrawing,
    isEditing,
    isActive,

    // Methods
    startDrawing,
    startEditing,
    addPoint,
    removeLastPoint,
    closePolygon,
    cancel,
    finishEditing,
    findVertexAtPosition,
    handleMouseMove,
    handleClick,
    handleDoubleClick,
    startDragVertex,
    stopDragVertex,
    moveVertex,
    deleteVertex,
    insertVertex,
    setColor,
    getPolygonData,
    loadPolygonData,
    reset
  };
}

export default useROIDrawing;
