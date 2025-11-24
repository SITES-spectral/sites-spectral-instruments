# ROI Creation Modal - Integration Guide

## Overview
This guide explains how to integrate the professional ROI (Region of Interest) Creation Modal into the SITES Spectral Instruments Management System.

## Features

### Interactive Drawing Mode
- **Canvas-based polygon digitizer** over instrument images
- **Click to place points** (minimum 3 points required)
- **Right-click or double-click** to close polygon
- **Drag points** to adjust after placement
- **Real-time preview** with selected color and thickness
- **Image loading**: Load latest instrument image or upload custom image
- **Coordinate conversion**: Automatic conversion from canvas to image coordinates

### YAML Upload Mode
- **Batch import** following stations.yaml format
- **Drag-and-drop** zone for easy file upload
- **Parse validation** with error highlighting
- **Preview table** showing all ROIs before import
- **Selective import** with checkboxes
- **Format documentation** with expandable example

### Professional UI/UX
- **Dual-mode tabs** with smooth transitions
- **Color picker** with preset colors and custom RGB sliders
- **Live preview** of selected color
- **Toggle switches** for boolean options
- **Range sliders** with real-time value display
- **Responsive design** that works on desktop and mobile
- **Collapsible sections** for better organization

## Integration Steps

### Step 1: Add Modal HTML to station.html

Insert the entire contents of `ROI_CREATION_MODAL.html` into `public/station.html` just before the closing `</body>` tag (around line 5300):

```html
<!-- Existing modals above... -->

<!-- ROI Creation Modal - INSERT HERE -->
<div id="roi-creation-modal" class="platform-modal" style="display: none;">
    <!-- Full modal HTML from ROI_CREATION_MODAL.html -->
</div>

</body>
</html>
```

### Step 2: Add API Endpoint for ROI Creation

Create or update `/src/handlers/rois.js`:

```javascript
// ROI Handler
export async function handleROI(request, env, path, method) {
    if (method === 'POST' && path === '/api/rois') {
        return await createROI(request, env);
    }

    if (method === 'GET' && path.match(/^\/api\/instruments\/\d+\/rois$/)) {
        const instrumentId = parseInt(path.split('/')[3]);
        return await getInstrumentROIs(request, env, instrumentId);
    }

    if (method === 'DELETE' && path.match(/^\/api\/rois\/\d+$/)) {
        const roiId = parseInt(path.split('/')[3]);
        return await deleteROI(request, env, roiId);
    }

    return new Response('Not found', { status: 404 });
}

async function createROI(request, env) {
    try {
        const user = request.user;
        const data = await request.json();

        // Validate required fields
        const required = ['instrument_id', 'roi_name', 'points_json'];
        for (const field of required) {
            if (!data[field]) {
                return new Response(JSON.stringify({
                    error: `Missing required field: ${field}`
                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
        }

        // Verify user has permission to add ROIs to this instrument
        const instrument = await env.DB.prepare(
            'SELECT * FROM instruments WHERE id = ?'
        ).bind(data.instrument_id).first();

        if (!instrument) {
            return new Response(JSON.stringify({
                error: 'Instrument not found'
            }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        // Check permissions (admin or station user for this station)
        if (user.role !== 'admin' && user.role !== 'station') {
            return new Response(JSON.stringify({
                error: 'Insufficient permissions'
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // Validate points JSON
        let points;
        try {
            points = JSON.parse(data.points_json);
            if (!Array.isArray(points) || points.length < 3) {
                throw new Error('Points must be an array with at least 3 points');
            }
        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Invalid points_json: ' + error.message
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Insert ROI
        const result = await env.DB.prepare(`
            INSERT INTO instrument_rois (
                instrument_id, roi_name, description,
                color_r, color_g, color_b, alpha, thickness,
                points_json, auto_generated, source_image, generated_date,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
            data.instrument_id,
            data.roi_name,
            data.description || null,
            data.color_r || 255,
            data.color_g || 255,
            data.color_b || 0,
            data.alpha || 0.0,
            data.thickness || 7,
            data.points_json,
            data.auto_generated ? 1 : 0,
            data.source_image || null,
            data.generated_date || new Date().toISOString().split('T')[0]
        ).run();

        // Log activity
        await env.DB.prepare(`
            INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'create', 'roi', ?, ?)
        `).bind(
            user.id,
            result.meta.last_row_id,
            JSON.stringify({ roi_name: data.roi_name, instrument_id: data.instrument_id })
        ).run();

        return new Response(JSON.stringify({
            success: true,
            roi_id: result.meta.last_row_id,
            message: `ROI "${data.roi_name}" created successfully`
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating ROI:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Failed to create ROI'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

async function getInstrumentROIs(request, env, instrumentId) {
    try {
        const rois = await env.DB.prepare(`
            SELECT * FROM instrument_rois
            WHERE instrument_id = ?
            ORDER BY roi_name ASC
        `).bind(instrumentId).all();

        return new Response(JSON.stringify(rois.results || []), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching ROIs:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch ROIs'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

async function deleteROI(request, env, roiId) {
    try {
        const user = request.user;

        // Only admin can delete ROIs
        if (user.role !== 'admin') {
            return new Response(JSON.stringify({
                error: 'Only administrators can delete ROIs'
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // Delete ROI
        await env.DB.prepare('DELETE FROM instrument_rois WHERE id = ?')
            .bind(roiId).run();

        // Log activity
        await env.DB.prepare(`
            INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
            VALUES (?, 'delete', 'roi', ?, ?)
        `).bind(user.id, roiId, JSON.stringify({ deleted: true })).run();

        return new Response(JSON.stringify({
            success: true,
            message: 'ROI deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error deleting ROI:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete ROI'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
```

### Step 3: Update API Router in worker.js

Add ROI handler to the main router in `src/worker.js`:

```javascript
import { handleROI } from './handlers/rois.js';

// In the main request handler
if (path.startsWith('/api/rois') || path.match(/\/api\/instruments\/\d+\/rois/)) {
    return await handleROI(request, env, path, method);
}
```

### Step 4: Add "Create ROI" Button to Instrument Details

In the instrument details modal (around line 1840 in station.html), add a button to trigger ROI creation:

```html
<!-- Inside instrument modal, after ROI section header -->
<div class="roi-section-header">
    <h4><i class="fas fa-draw-polygon"></i> Regions of Interest (ROIs)</h4>
    <button class="btn btn-sm btn-success" onclick="showROICreationModal(instrument.id, instrument.normalized_name)">
        <i class="fas fa-plus"></i> Create ROI
    </button>
</div>
```

### Step 5: Add YAML Parsing Library (Optional)

For production use with YAML upload, add js-yaml library to the HTML head:

```html
<head>
    <!-- Other scripts... -->
    <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
</head>
```

Then update the `parseYAMLROIs` function to use js-yaml:

```javascript
function parseYAMLROIs(yamlText) {
    try {
        const data = jsyaml.load(yamlText);

        if (!data.rois || typeof data.rois !== 'object') {
            throw new Error('YAML must contain "rois" object at root level');
        }

        displayYAMLPreview(data.rois);
    } catch (error) {
        showNotification('Error parsing YAML: ' + error.message, 'error');
    }
}
```

## Usage Examples

### Example 1: Creating ROI via Interactive Drawing

```javascript
// User clicks "Create ROI" button on instrument details
showROICreationModal(instrumentId, 'SVB_FOR_PL01_PHE01');

// Modal opens with:
// - Empty canvas ready for drawing
// - Default color: Yellow (255, 255, 0)
// - Default thickness: 7px
// - Auto-suggested ROI name: ROI_01

// User workflow:
// 1. Click "Load Latest" or "Upload Image"
// 2. Click on canvas to place polygon points
// 3. Right-click or double-click to close polygon
// 4. Adjust points by dragging if needed
// 5. Select color (preset or custom RGB)
// 6. Adjust thickness slider
// 7. Enter description (optional)
// 8. Click "Save ROI"
```

### Example 2: Batch Import via YAML

```javascript
// User switches to "YAML Upload" tab
switchROITab('yaml');

// User drags YAML file to drop zone or clicks "Browse Files"

// YAML file content:
/*
rois:
  ROI_01:
    description: "Forest canopy area"
    color: [255, 0, 0]
    points:
      - [100, 200]
      - [300, 200]
      - [300, 400]
      - [100, 400]
    thickness: 5
    auto_generated: false
  ROI_02:
    description: "Sky exclusion zone"
    color: [0, 255, 0]
    points:
      - [0, 0]
      - [800, 0]
      - [800, 100]
      - [0, 100]
    thickness: 7
*/

// System:
// 1. Parses YAML
// 2. Validates each ROI (minimum 3 points)
// 3. Shows preview table
// 4. User selects which ROIs to import (checkboxes)
// 5. Clicks "Import Selected ROIs"
// 6. System creates all selected ROIs in database
```

## Database Schema

The modal expects the following database table structure:

```sql
CREATE TABLE IF NOT EXISTS instrument_rois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,
    roi_name TEXT NOT NULL,
    description TEXT,
    color_r INTEGER DEFAULT 255,
    color_g INTEGER DEFAULT 255,
    color_b INTEGER DEFAULT 0,
    alpha REAL DEFAULT 0.0,
    thickness INTEGER DEFAULT 7,
    points_json TEXT NOT NULL,  -- JSON array of [x, y] coordinates
    auto_generated INTEGER DEFAULT 0,
    source_image TEXT,
    generated_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    UNIQUE(instrument_id, roi_name)
);

CREATE INDEX IF NOT EXISTS idx_rois_instrument ON instrument_rois(instrument_id);
```

## API Endpoints

### POST /api/rois
Create a new ROI

**Request Body:**
```json
{
    "instrument_id": 1,
    "roi_name": "ROI_01",
    "description": "Forest canopy area",
    "color_r": 255,
    "color_g": 0,
    "color_b": 0,
    "alpha": 0.0,
    "thickness": 7,
    "points_json": "[[100,200],[300,200],[300,400],[100,400]]",
    "auto_generated": false,
    "source_image": "instrument_image_2024.jpg",
    "generated_date": "2025-11-14"
}
```

**Response:**
```json
{
    "success": true,
    "roi_id": 42,
    "message": "ROI \"ROI_01\" created successfully"
}
```

### GET /api/instruments/{id}/rois
Get all ROIs for an instrument

**Response:**
```json
[
    {
        "id": 42,
        "instrument_id": 1,
        "roi_name": "ROI_01",
        "description": "Forest canopy area",
        "color_r": 255,
        "color_g": 0,
        "color_b": 0,
        "alpha": 0.0,
        "thickness": 7,
        "points_json": "[[100,200],[300,200],[300,400],[100,400]]",
        "auto_generated": 0,
        "source_image": "instrument_image_2024.jpg",
        "generated_date": "2025-11-14",
        "created_at": "2025-11-14 10:30:00",
        "updated_at": "2025-11-14 10:30:00"
    }
]
```

### DELETE /api/rois/{id}
Delete an ROI (admin only)

**Response:**
```json
{
    "success": true,
    "message": "ROI deleted successfully"
}
```

## Styling and Customization

### Colors
The modal uses SITES Spectral brand colors:
- **Primary Green**: `#059669`
- **Dark Green**: `#047857`
- **Success**: `#10b981`
- **Error**: `#ef4444`
- **Warning**: `#f59e0b`

### Responsive Breakpoints
- **Desktop**: > 768px (two-column layout)
- **Mobile**: ≤ 768px (single-column layout)

### CSS Variables
You can customize the modal by overriding CSS variables:

```css
:root {
    --roi-primary-color: #059669;
    --roi-secondary-color: #047857;
    --roi-canvas-bg: #f3f4f6;
    --roi-border-color: #e5e7eb;
}
```

## Testing Checklist

- [ ] Modal opens when "Create ROI" button clicked
- [ ] Tab switching works (Draw ↔ YAML)
- [ ] Image upload works (both file select and drag-drop)
- [ ] Canvas drawing: click to add points
- [ ] Canvas drawing: right-click/double-click to close polygon
- [ ] Canvas drawing: drag points to adjust
- [ ] Color picker: preset colors work
- [ ] Color picker: custom RGB sliders work
- [ ] Color preview updates in real-time
- [ ] Thickness slider works
- [ ] Auto-generated toggle works
- [ ] Next ROI name auto-suggests correctly
- [ ] Save ROI validates minimum 3 points
- [ ] Save ROI sends correct data to API
- [ ] YAML upload: file selection works
- [ ] YAML upload: drag-and-drop works
- [ ] YAML preview shows parsed ROIs
- [ ] YAML validation highlights errors
- [ ] Import selected ROIs creates records
- [ ] Modal closes on cancel
- [ ] Responsive design works on mobile

## Troubleshooting

### Canvas not displaying image
- Check that image URL is correct
- Verify CORS headers allow image loading
- Check browser console for image load errors

### Points not converting correctly
- Verify canvas dimensions match image aspect ratio
- Check `updatePointsJSON()` function for scaling calculation
- Ensure image naturalWidth/naturalHeight are accessible

### YAML parsing fails
- Verify js-yaml library is loaded
- Check YAML syntax is valid (use online validator)
- Ensure "rois" key exists at root level

### API returns 403 Forbidden
- Verify user is authenticated (JWT token valid)
- Check user has correct role (admin or station)
- Confirm user has permission for this instrument's station

## Performance Optimization

### Canvas Performance
- Limit canvas size to max 1200px width
- Use requestAnimationFrame for smooth dragging
- Debounce color/thickness updates during dragging

### YAML Parsing
- Limit file size to 1MB max
- Stream large files instead of loading entirely
- Use Web Workers for parsing large YAML files

### API Optimization
- Batch create multiple ROIs in single request
- Use database transactions for multiple inserts
- Add indexes on instrument_id for faster queries

## Future Enhancements

1. **ROI Editing**: Add ability to edit existing ROIs
2. **ROI Templates**: Save and load ROI templates
3. **Advanced Drawing**: Add circle, rectangle, freehand tools
4. **Image Filters**: Add brightness, contrast adjustments
5. **ROI Analytics**: Show area, perimeter calculations
6. **Export ROIs**: Export to YAML, GeoJSON, Shapefile
7. **ROI Versioning**: Track ROI changes over time
8. **Multi-Image ROI**: Copy ROI to multiple instruments
9. **AI-Assisted**: Auto-detect vegetation boundaries
10. **Collaboration**: Multi-user ROI editing with conflict resolution

## Support

For issues or questions:
- Check browser console for JavaScript errors
- Verify API endpoints are responding correctly
- Review database logs for SQL errors
- Contact SITES Spectral development team

## License

This ROI Creation Modal is part of the SITES Spectral Instruments Management System.
© 2025 SITES Spectral Research Infrastructure
