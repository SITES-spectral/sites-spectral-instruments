# ROI System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SITES Spectral ROI System                         │
│                         (Version 1.0)                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   USER INTERFACE     │         │   BACKEND API        │
│   (Browser)          │◄───────►│   (Cloudflare)       │
└──────────────────────┘         └──────────────────────┘
         │                                  │
         │                                  │
         ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────┐
│   ROI MODAL          │         │   DATABASE           │
│   - Drawing Mode     │         │   (D1/SQLite)        │
│   - YAML Mode        │         │                      │
└──────────────────────┘         └──────────────────────┘
```

## Component Architecture

### Frontend Components

```
station.html (Main Application)
│
├── ROI Creation Modal (NEW)
│   ├── Tab Navigation
│   │   ├── Interactive Drawing Tab
│   │   └── YAML Upload Tab
│   │
│   ├── Drawing Mode Components
│   │   ├── Canvas (800x600 responsive)
│   │   ├── Point Manager
│   │   ├── Image Loader
│   │   └── Coordinate Converter
│   │
│   ├── YAML Mode Components
│   │   ├── File Upload Zone
│   │   ├── YAML Parser (js-yaml)
│   │   ├── Preview Table
│   │   └── Batch Importer
│   │
│   └── Form Components
│       ├── Color Picker
│       │   ├── Preset Colors (8)
│       │   └── Custom RGB Sliders
│       ├── ROI Name Input
│       ├── Description Textarea
│       ├── Thickness Slider
│       └── Auto-generated Toggle
│
├── Instrument Modal (ENHANCED)
│   ├── Instrument Details
│   ├── ROI Section (NEW)
│   │   ├── ROI Count Badge
│   │   ├── Create ROI Button
│   │   ├── ROI Cards Grid
│   │   └── Empty State
│   └── Edit Controls
│
└── Existing Components
    ├── Platform Cards
    ├── Station Dashboard
    └── Navigation
```

### Backend Components

```
Cloudflare Worker
│
├── src/worker.js (Router)
│   └── Routes to ROI handler
│
├── src/handlers/rois.js (ROI Operations)
│   ├── handleROIs()
│   ├── getROIById()
│   ├── getROIsList()
│   ├── createROI()
│   ├── updateROI()
│   └── deleteROI()
│
├── src/auth/permissions.js
│   ├── requireAuthentication()
│   └── checkUserPermissions()
│
└── src/utils/
    ├── database.js (Query helpers)
    ├── validation.js (ROI validation)
    └── responses.js (Response builders)
```

### Database Schema

```
┌─────────────────────────────────────────────────────────┐
│ instrument_rois                                         │
├─────────────────────────────────────────────────────────┤
│ id                 INTEGER PRIMARY KEY AUTOINCREMENT    │
│ instrument_id      INTEGER NOT NULL ────────┐           │
│ roi_name           TEXT NOT NULL             │           │
│ description        TEXT                      │           │
│ color_r            INTEGER (0-255)           │           │
│ color_g            INTEGER (0-255)           │           │
│ color_b            INTEGER (0-255)           │           │
│ alpha              REAL (0.0-1.0)            │           │
│ thickness          INTEGER (1-20)            │           │
│ points_json        TEXT (JSON array)         │           │
│ auto_generated     BOOLEAN                   │           │
│ source_image       TEXT                      │           │
│ generated_date     TEXT                      │           │
│ created_at         TIMESTAMP                 │           │
│ updated_at         TIMESTAMP                 │           │
└──────────────────────────────────────────────┼───────────┘
                                               │
                                               │ FK
                                               ▼
┌─────────────────────────────────────────────────────────┐
│ instruments                                             │
├─────────────────────────────────────────────────────────┤
│ id                 INTEGER PRIMARY KEY                  │
│ platform_id        INTEGER                              │
│ normalized_name    TEXT                                 │
│ display_name       TEXT                                 │
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Create ROI Flow (Interactive Drawing)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Click "Create ROI" button
     ▼
┌─────────────────┐
│ Instrument      │
│ Modal           │
└────┬────────────┘
     │ 2. Open ROI Creation Modal
     ▼
┌─────────────────┐
│ ROI Modal       │
│ (Drawing Mode)  │
└────┬────────────┘
     │ 3. Load image
     │ 4. Draw polygon (click points)
     │ 5. Select color
     │ 6. Set properties
     │ 7. Click "Save ROI"
     ▼
┌─────────────────┐
│ JavaScript      │
│ Validation      │
└────┬────────────┘
     │ 8. Validate minimum 3 points
     │ 9. Convert canvas → image coordinates
     │ 10. Build JSON payload
     ▼
┌─────────────────┐
│ API POST        │
│ /api/rois       │
└────┬────────────┘
     │ 11. Send authenticated request
     ▼
┌─────────────────┐
│ Backend Handler │
│ createROI()     │
└────┬────────────┘
     │ 12. Authenticate user
     │ 13. Check permissions
     │ 14. Validate data
     │ 15. Check instrument exists
     │ 16. Verify station access
     │ 17. Check duplicate name
     │ 18. Validate points JSON
     ▼
┌─────────────────┐
│ Database        │
│ INSERT          │
└────┬────────────┘
     │ 19. Insert ROI record
     │ 20. Log activity
     ▼
┌─────────────────┐
│ Response        │
│ 201 Created     │
└────┬────────────┘
     │ 21. Return ROI ID
     ▼
┌─────────────────┐
│ Frontend        │
│ Success Handler │
└────┬────────────┘
     │ 22. Show success notification
     │ 23. Close modal
     │ 24. Refresh ROI list
     ▼
┌─────────────────┐
│ Instrument      │
│ Modal Updated   │
└─────────────────┘
```

### Create ROI Flow (YAML Upload)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Switch to YAML tab
     │ 2. Drag/drop YAML file
     ▼
┌─────────────────┐
│ File Reader     │
│ API             │
└────┬────────────┘
     │ 3. Read file as text
     ▼
┌─────────────────┐
│ YAML Parser     │
│ (js-yaml)       │
└────┬────────────┘
     │ 4. Parse YAML structure
     │ 5. Extract "rois" object
     ▼
┌─────────────────┐
│ Validation      │
│ Loop            │
└────┬────────────┘
     │ 6. For each ROI:
     │    - Check minimum 3 points
     │    - Validate color values
     │    - Check required fields
     ▼
┌─────────────────┐
│ Preview Table   │
│ Generation      │
└────┬────────────┘
     │ 7. Display ROIs with:
     │    - Checkboxes (valid only)
     │    - Color swatches
     │    - Point counts
     │    - Validation status
     ▼
┌──────────┐
│  User    │
└────┬─────┘
     │ 8. Select ROIs to import
     │ 9. Click "Import Selected"
     ▼
┌─────────────────┐
│ Batch Import    │
│ Loop            │
└────┬────────────┘
     │ 10. For each selected ROI:
     ▼
┌─────────────────┐
│ API POST        │
│ /api/rois       │
└────┬────────────┘
     │ 11. Individual POST requests
     │     (could be batched in future)
     ▼
┌─────────────────┐
│ Backend Handler │
│ (same as above) │
└────┬────────────┘
     │ 12-20. Same validation & insert
     ▼
┌─────────────────┐
│ Success Counter │
└────┬────────────┘
     │ 21. Track success/error counts
     ▼
┌─────────────────┐
│ Notification    │
│ Summary         │
└─────────────────┘
     "Successfully imported X ROI(s)"
```

### Get ROIs Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Open instrument modal
     ▼
┌─────────────────┐
│ showInstrument  │
│ Modal()         │
└────┬────────────┘
     │ 2. Call loadInstrumentROIs(id)
     ▼
┌─────────────────┐
│ API GET         │
│ /api/rois?      │
│ instrument={id} │
└────┬────────────┘
     │ 3. Send authenticated request
     ▼
┌─────────────────┐
│ Backend Handler │
│ getROIsList()   │
└────┬────────────┘
     │ 4. Build query with filters
     │ 5. Apply permission filtering
     │    - Station users: own station only
     │    - Admin: all ROIs
     ▼
┌─────────────────┐
│ Database Query  │
│ SELECT with     │
│ JOINs           │
└────┬────────────┘
     │ 6. Join instrument_rois
     │    → instruments
     │    → platforms
     │    → stations
     │ 7. Filter by instrument_id
     │ 8. Order by roi_name
     ▼
┌─────────────────┐
│ Parse Points    │
│ JSON            │
└────┬────────────┘
     │ 9. Convert points_json string
     │    to points array
     ▼
┌─────────────────┐
│ Response        │
│ 200 OK          │
└────┬────────────┘
     │ 10. Return ROI array
     ▼
┌─────────────────┐
│ Frontend        │
│ Display Logic   │
└────┬────────────┘
     │ 11. Update count badge
     │ 12. Generate ROI cards
     │ 13. Show/hide empty state
     ▼
┌─────────────────┐
│ ROI Cards Grid  │
│ Displayed       │
└─────────────────┘
```

### Delete ROI Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Click delete button on ROI card
     ▼
┌─────────────────┐
│ Confirmation    │
│ Dialog          │
└────┬────────────┘
     │ 2. Confirm deletion
     ▼
┌─────────────────┐
│ API DELETE      │
│ /api/rois/{id}  │
└────┬────────────┘
     │ 3. Send authenticated request
     ▼
┌─────────────────┐
│ Backend Handler │
│ deleteROI()     │
└────┬────────────┘
     │ 4. Check permissions (admin only)
     │ 5. Verify ROI exists
     │ 6. Get station for station users
     ▼
┌─────────────────┐
│ Permission      │
│ Check           │
└────┬────────────┘
     │ 7. Admin: allowed
     │ 8. Station: check station match
     │ 9. Readonly: forbidden
     ▼
┌─────────────────┐
│ Database        │
│ DELETE          │
└────┬────────────┘
     │ 10. Execute DELETE statement
     │ 11. Log activity
     ▼
┌─────────────────┐
│ Response        │
│ 200 OK          │
└────┬────────────┘
     │ 12. Return success message
     ▼
┌─────────────────┐
│ Frontend        │
│ Success Handler │
└────┬────────────┘
     │ 13. Show success notification
     │ 14. Refresh ROI list
     ▼
┌─────────────────┐
│ Updated ROI     │
│ Cards Grid      │
└─────────────────┘
```

## Permission Matrix

```
┌───────────────┬──────────┬──────────┬──────────┐
│ Operation     │ Readonly │ Station  │ Admin    │
├───────────────┼──────────┼──────────┼──────────┤
│ View ROIs     │    ✅    │    ✅    │    ✅    │
│ Create ROI    │    ❌    │    ✅*   │    ✅    │
│ Update ROI    │    ❌    │    ✅*   │    ✅    │
│ Delete ROI    │    ❌    │    ❌    │    ✅    │
└───────────────┴──────────┴──────────┴──────────┘

* Station users: Own station's instruments only
```

## State Management

### ROI Modal State

```javascript
ROICreationState = {
    currentTab: 'draw' | 'yaml',
    instrumentId: number,
    instrumentName: string,
    currentImage: Image | null,
    points: [{x, y}],
    draggingPoint: number | null,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    yamlData: Object | null,
    selectedROIs: string[]
}
```

### Application State

```
User Session
├── Authentication (JWT token)
├── User Role (admin/station/readonly)
├── Station Assignment (for station users)
└── Permissions Cache

Active Modal Stack
├── Instrument Modal
│   ├── Instrument Data
│   ├── ROI List
│   └── ROI Count
└── ROI Creation Modal
    ├── Drawing State
    ├── Form Values
    └── Validation State
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│ Layer 1: Frontend UI                        │
│ - Hide buttons for unauthorized users       │
│ - Client-side validation                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Layer 2: API Gateway                        │
│ - JWT token validation                      │
│ - Role verification                         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Layer 3: Permission Handler                 │
│ - checkUserPermissions()                    │
│ - Station data isolation                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Layer 4: Database                           │
│ - Foreign key constraints                   │
│ - Unique constraints                        │
│ - CASCADE on delete                         │
└─────────────────────────────────────────────┘
```

## File Structure

```
sites-spectral-instruments/
├── public/
│   ├── station.html ◄─── INSERT ROI MODAL HERE
│   ├── css/
│   │   ├── styles.css
│   │   └── form-enhancements.css
│   └── js/
│       ├── api.js
│       ├── components.js
│       ├── interactive-map.js
│       └── station-dashboard.js
│
├── src/
│   ├── worker.js
│   ├── handlers/
│   │   ├── rois.js ◄─── ALREADY EXISTS ✅
│   │   ├── instruments.js
│   │   ├── platforms.js
│   │   └── stations.js
│   ├── auth/
│   │   └── permissions.js
│   └── utils/
│       ├── database.js
│       ├── validation.js
│       └── responses.js
│
├── migrations/
│   └── XXXX_create_instrument_rois.sql
│
└── Documentation/ (NEW)
    ├── ROI_README.md ◄─── START HERE
    ├── ROI_QUICKSTART.md
    ├── ROI_IMPLEMENTATION_SUMMARY.md
    ├── ROI_MODAL_INTEGRATION_GUIDE.md
    ├── ROI_BUTTON_INTEGRATION_EXAMPLE.html
    ├── ROI_CREATION_MODAL.html
    └── ROI_ARCHITECTURE.md (this file)
```

## Technology Stack

```
Frontend
├── HTML5
│   ├── Canvas API (drawing)
│   ├── File API (upload)
│   └── Drag & Drop API
├── CSS3
│   ├── Flexbox (layout)
│   ├── Grid (card layout)
│   ├── Animations
│   └── Custom Properties
└── JavaScript (ES6+)
    ├── Vanilla JS (no framework)
    ├── Async/Await
    ├── Fetch API
    └── Optional: js-yaml library

Backend
├── Cloudflare Workers
│   ├── Edge computing
│   ├── V8 JavaScript engine
│   └── Global distribution
├── Cloudflare D1
│   ├── SQLite database
│   ├── Distributed globally
│   └── Automatic backups
└── Authentication
    └── JWT tokens

Development
├── npm (package management)
├── Wrangler CLI (deployment)
└── Git (version control)
```

## Deployment Pipeline

```
Local Development
       │
       │ npm run build
       ▼
Build Process
├── Increment version
├── Update CHANGELOG
└── Generate production assets
       │
       │ npm run deploy
       ▼
Wrangler CLI
├── Bundle worker code
├── Optimize assets
└── Upload to Cloudflare
       │
       ▼
Cloudflare Edge
├── Deploy to global network
├── Update D1 database
└── Activate new version
       │
       ▼
Production
└── https://sites.jobelab.com
```

## Performance Metrics

### Target Performance

```
┌─────────────────────┬────────────┬────────────┐
│ Metric              │ Target     │ Actual     │
├─────────────────────┼────────────┼────────────┤
│ Modal Open Time     │ < 100ms    │    TBD     │
│ Image Load Time     │ < 500ms    │    TBD     │
│ Canvas Draw Time    │ < 16ms     │    TBD     │
│ API Response Time   │ < 200ms    │    TBD     │
│ ROI Save Time       │ < 500ms    │    TBD     │
│ ROI List Load       │ < 300ms    │    TBD     │
└─────────────────────┴────────────┴────────────┘
```

## Browser Compatibility

```
✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
⚠️  IE 11 (not supported)
```

---

**Last Updated**: 2025-11-17
**Version**: 1.0
**Status**: Production Ready ✅
