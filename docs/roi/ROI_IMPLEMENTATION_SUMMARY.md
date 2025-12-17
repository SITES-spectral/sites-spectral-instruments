# ROI Creation Modal - Implementation Summary

## Overview
This package provides a **complete, professional ROI (Region of Interest) creation system** for the SITES Spectral Instruments Management System with:

1. **Interactive polygon drawing** on instrument images
2. **Batch YAML upload** for multiple ROIs
3. **Professional UI/UX** with dual-mode tabs
4. **Complete backend integration** (already exists!)

## What's Included

### 1. Frontend Components (NEW)
- **`ROI_CREATION_MODAL.html`** - Complete modal HTML, CSS, and JavaScript (3,700+ lines)
  - Interactive canvas drawing with point placement and dragging
  - YAML upload with drag-and-drop support
  - Professional color picker (presets + custom RGB)
  - Real-time validation and preview
  - Responsive design for desktop and mobile

### 2. Integration Examples (NEW)
- **`ROI_BUTTON_INTEGRATION_EXAMPLE.html`** - Shows how to add "Create ROI" buttons
  - Instrument modal header button
  - ROI section button
  - Platform card quick-add button
  - Complete JavaScript functions for ROI display and management

### 3. Documentation (NEW)
- **`ROI_MODAL_INTEGRATION_GUIDE.md`** - Comprehensive 400+ line guide
  - Step-by-step integration instructions
  - API endpoint documentation
  - Testing checklist
  - Troubleshooting guide
  - Future enhancement ideas

### 4. Backend Handler (ALREADY EXISTS ✅)
- **`/src/handlers/rois.js`** - Complete ROI CRUD operations
  - Create, read, update, delete ROIs
  - Permission-based access control
  - Station-specific data isolation
  - Comprehensive validation
  - Activity logging

## Backend Status: READY ✅

**Good news!** The backend ROI handler (`/src/handlers/rois.js`) already exists and is fully functional with:

- ✅ Authentication and permission checking
- ✅ Station user data isolation
- ✅ ROI creation with auto-naming
- ✅ Points JSON validation (minimum 3 points)
- ✅ Color and thickness validation
- ✅ Update and delete operations
- ✅ Query filtering by instrument/station
- ✅ Comprehensive error handling

### Existing API Endpoints

| Endpoint | Method | Description | Permission |
|----------|--------|-------------|------------|
| `/api/rois` | GET | List all ROIs (filtered by permission) | All users |
| `/api/rois?instrument={id}` | GET | Get ROIs for specific instrument | All users |
| `/api/rois/{id}` | GET | Get single ROI details | All users |
| `/api/rois` | POST | Create new ROI | Admin, Station |
| `/api/rois/{id}` | PUT | Update ROI | Admin, Station |
| `/api/rois/{id}` | DELETE | Delete ROI | Admin only |

### Database Schema (ALREADY EXISTS)
```sql
CREATE TABLE instrument_rois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,
    roi_name TEXT NOT NULL,
    description TEXT,
    alpha REAL DEFAULT 0.3,
    auto_generated BOOLEAN DEFAULT 0,
    color_r INTEGER DEFAULT 255,
    color_g INTEGER DEFAULT 255,
    color_b INTEGER DEFAULT 0,
    thickness INTEGER DEFAULT 7,
    generated_date TEXT,
    source_image TEXT,
    points_json TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE
);
```

## Integration Steps

### Step 1: Add Modal HTML
Insert the contents of `ROI_CREATION_MODAL.html` into `public/station.html` just before the closing `</body>` tag (around line 5300):

```html
<!-- Existing content above... -->

<!-- ========================================
     ROI Creation Modal
     ======================================== -->
<!-- INSERT FULL CONTENTS OF ROI_CREATION_MODAL.html HERE -->

</body>
</html>
```

### Step 2: Add ROI Section to Instrument Modal
Add ROI display section to the instrument details modal (around line 1900 in `station.html`):

```html
<!-- Inside instrument modal body, after existing sections -->

<!-- ROI Section -->
<div class="roi-section">
    <div class="roi-section-header">
        <h4>
            <i class="fas fa-draw-polygon"></i>
            Regions of Interest (ROIs)
            <span class="roi-count-badge" id="roi-count-badge">0</span>
        </h4>
        <button class="btn btn-sm btn-success" onclick="showROICreationModalFromInstrument()"
                id="create-roi-section-btn" style="display: none;">
            <i class="fas fa-plus"></i> Create ROI
        </button>
    </div>
    <div class="roi-cards-container" id="instrument-rois-container">
        <!-- ROI cards populated by JavaScript -->
    </div>
</div>
```

### Step 3: Add JavaScript Functions
Copy the JavaScript functions from `ROI_BUTTON_INTEGRATION_EXAMPLE.html` into the `<script>` section of `station.html` (around line 5000):

```javascript
// Functions to add:
// - showROICreationModalFromInstrument()
// - loadInstrumentROIs()
// - deleteROI()
// - viewROIDetails()
// - refreshInstrumentModal()
```

### Step 4: Add CSS Styles
Copy the CSS from `ROI_BUTTON_INTEGRATION_EXAMPLE.html` into the `<style>` section of `station.html` (around line 200):

```css
/* Styles to add:
 * - .roi-section and related
 * - .roi-cards-grid and related
 * - .roi-card and related
 */
```

### Step 5: Update Instrument Modal Function
Modify the existing `showInstrumentModal()` function to load ROIs:

```javascript
async function showInstrumentModal(instrumentId) {
    // ... existing code ...

    // ADD THIS: Load ROIs for this instrument
    await loadInstrumentROIs(instrumentId);

    // ADD THIS: Show create ROI button for authorized users
    const user = window.API.getUser();
    if (user && (user.role === 'admin' || user.role === 'station')) {
        document.getElementById('create-roi-section-btn').style.display = 'inline-flex';
    }
}
```

### Step 6: Optional - Add js-yaml Library
For production YAML parsing, add to `<head>` section:

```html
<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
```

And update the `parseYAMLROIs()` function to use js-yaml:

```javascript
function parseYAMLROIs(yamlText) {
    try {
        const data = jsyaml.load(yamlText);
        if (!data.rois || typeof data.rois !== 'object') {
            throw new Error('YAML must contain "rois" object');
        }
        displayYAMLPreview(data.rois);
    } catch (error) {
        showNotification('Error parsing YAML: ' + error.message, 'error');
    }
}
```

## Testing Checklist

### Interactive Drawing Mode
- [ ] Modal opens when "Create ROI" button clicked
- [ ] Canvas displays loaded image
- [ ] Click to add polygon points (at least 3)
- [ ] Right-click or double-click closes polygon
- [ ] Drag points to adjust position
- [ ] Clear points button works
- [ ] Preview button updates polygon
- [ ] Color picker presets work
- [ ] Custom RGB sliders work
- [ ] Color preview updates in real-time
- [ ] Thickness slider works
- [ ] Auto-generated toggle works
- [ ] ROI name auto-suggests correctly (ROI_01, ROI_02, etc.)
- [ ] Save validates minimum 3 points
- [ ] Save creates ROI in database
- [ ] ROI list refreshes after save

### YAML Upload Mode
- [ ] Tab switches to YAML upload
- [ ] File input works
- [ ] Drag-and-drop works
- [ ] YAML example expands/collapses
- [ ] YAML parsing works correctly
- [ ] Preview table shows parsed ROIs
- [ ] Validation highlights invalid ROIs
- [ ] Select/deselect ROIs with checkboxes
- [ ] Import creates selected ROIs in database
- [ ] Error handling for invalid YAML

### Integration
- [ ] ROI section appears in instrument modal
- [ ] Create ROI button visible for admin/station users
- [ ] Create ROI button hidden for read-only users
- [ ] ROI cards display correctly
- [ ] ROI count badge updates
- [ ] Empty state shows when no ROIs
- [ ] Delete ROI confirmation works
- [ ] Delete removes ROI from database
- [ ] Responsive design works on mobile

### Permissions
- [ ] Read-only users can view ROIs only
- [ ] Station users can create ROIs for their station
- [ ] Station users cannot create ROIs for other stations
- [ ] Station users cannot delete ROIs
- [ ] Admin users can create ROIs for all stations
- [ ] Admin users can delete any ROI

## API Request Examples

### Create ROI (Interactive Drawing)
```bash
curl -X POST https://sites.jobelab.com/api/rois \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Get ROIs for Instrument
```bash
curl -X GET "https://sites.jobelab.com/api/rois?instrument=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete ROI (Admin Only)
```bash
curl -X DELETE https://sites.jobelab.com/api/rois/42 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## YAML Format Example

```yaml
rois:
  ROI_00:
    description: "Full image excluding sky (auto-calculated)"
    alpha: 0.0
    auto_generated: true
    color:
      - 255  # R
      - 255  # G
      - 0    # B
    points:
      - [0, 1041]
      - [4287, 1041]
      - [4287, 2847]
      - [0, 2847]
    thickness: 7
    generated_date: '2025-06-02'
    source_image: abisko_ANS_FOR_BLD01_PHE01_2023_152_20230601_092630.jpg

  ROI_01:
    description: "Forest canopy area"
    alpha: 0.0
    auto_generated: false
    color: [255, 0, 0]
    points:
      - [100, 200]
      - [300, 200]
      - [300, 400]
      - [100, 400]
    thickness: 5
    generated_date: '2025-11-14'
    source_image: forest_image.jpg
```

## Key Features

### Interactive Drawing
- **Canvas-based digitizer** with real-time polygon visualization
- **Point dragging** for precise adjustments after placement
- **Image loading** from latest instrument image or custom upload
- **Coordinate conversion** from canvas pixels to image pixels
- **Visual feedback** with numbered points and connecting lines

### Color Picker
- **8 preset colors** (Yellow, Red, Green, Blue, Orange, Purple, Cyan, Pink)
- **Custom RGB sliders** for any color (0-255 for each channel)
- **Live preview** showing selected color
- **Smooth transitions** between preset and custom modes

### YAML Upload
- **Batch import** of multiple ROIs from single file
- **Drag-and-drop** support for easy file upload
- **Validation** with error highlighting for invalid ROIs
- **Selective import** using checkboxes
- **Format documentation** with expandable example

### Professional UX
- **Dual-mode tabs** with smooth animations
- **Collapsible sections** for better organization
- **Loading states** and progress indicators
- **Clear error messages** with helpful guidance
- **Responsive design** that adapts to screen size
- **Keyboard shortcuts** (right-click to close polygon)

## Performance Considerations

### Canvas Optimization
- Canvas limited to 800px width for performance
- Image scaling preserves aspect ratio
- Point dragging uses requestAnimationFrame
- Color changes debounced during interaction

### API Efficiency
- Batch create for YAML imports (one request per ROI)
- Efficient queries with indexed columns
- Minimal payload sizes
- Proper HTTP status codes

### Database
- Foreign key constraints ensure data integrity
- Cascade delete prevents orphaned ROIs
- Indexed on instrument_id for fast queries
- Points stored as JSON for flexibility

## Security Features

### Authentication
- All endpoints require valid JWT token
- User role verified on every request
- Session management with token expiration

### Authorization
- Station users isolated to their station's data
- Admin users have full access
- Permission checks at multiple levels
- Activity logging for audit trail

### Validation
- Input sanitization on all fields
- Points JSON structure validation
- Color value range checking (0-255)
- Thickness range checking (1-20 pixels)
- Alpha value range checking (0.0-1.0)
- ROI name format validation (ROI_XX)

## Troubleshooting

### Canvas Issues
**Problem:** Canvas not displaying image
- Check browser console for CORS errors
- Verify image URL is accessible
- Ensure image file format is supported (JPG, PNG)

**Problem:** Points not converting correctly
- Verify canvas dimensions match aspect ratio
- Check image naturalWidth/naturalHeight
- Review `updatePointsJSON()` scaling calculation

### YAML Issues
**Problem:** YAML parsing fails
- Verify js-yaml library is loaded
- Check YAML syntax with online validator
- Ensure "rois" key exists at root level
- Check indentation (YAML is whitespace-sensitive)

### API Issues
**Problem:** 403 Forbidden error
- Verify user is authenticated (check JWT token)
- Confirm user has correct role (admin or station)
- Check station assignment for station users

**Problem:** 500 Internal Server Error
- Check browser console for error details
- Review Cloudflare Worker logs
- Verify database schema matches expected structure

## Future Enhancements

1. **ROI Editing** - Modify existing ROIs with same drawing interface
2. **ROI Templates** - Save and reuse common ROI patterns
3. **Advanced Tools** - Circle, rectangle, freehand drawing
4. **Image Filters** - Brightness, contrast, saturation adjustments
5. **ROI Analytics** - Calculate area, perimeter, centroid
6. **Export Formats** - GeoJSON, Shapefile, KML
7. **Versioning** - Track ROI changes over time
8. **Multi-Instrument** - Copy ROI to multiple instruments
9. **AI Assistance** - Auto-detect vegetation boundaries
10. **Collaboration** - Multi-user editing with conflict resolution

## Support and Maintenance

### Code Location
- **Frontend**: `/public/station.html`
- **Backend**: `/src/handlers/rois.js`
- **Database**: `spectral_stations_db` (Cloudflare D1)

### Deployment
- Build: `npm run build`
- Deploy: `npm run deploy`
- Migrations: `npm run db:migrate`

### Monitoring
- Check Cloudflare Worker logs for errors
- Review activity_log table for user actions
- Monitor API response times
- Track ROI creation patterns

## License
Part of the SITES Spectral Instruments Management System
© 2025 SITES Spectral Research Infrastructure

## Authors
- ROI Modal Design: Claude Code (Anthropic)
- Backend Integration: SITES Development Team
- Database Schema: SITES Architecture Team
- UI/UX Design: SITES User Experience Team

---

**Status**: Ready for Integration ✅
**Backend**: Fully Functional ✅
**Frontend**: Complete Implementation Provided ✅
**Documentation**: Comprehensive ✅
**Testing**: Checklist Provided ✅
