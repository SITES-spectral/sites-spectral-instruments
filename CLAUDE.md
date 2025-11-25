# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: For detailed version history and legacy documentation, see [CLAUDE_LEGACY.md](./CLAUDE_LEGACY.md)

## Current Version: 6.4.0 - PHASE 3: Complete MS Sensor Modal (2025-11-25)
**✅ STATUS: SUCCESSFULLY DEPLOYED AND OPERATIONAL**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Last Updated:** 2025-11-25

### ✅ Latest Update: MS Sensor Modal Complete (v6.4.0)

**🎯 Achievement**: Completed MS sensor edit modal with full 6-section interface, building on v6.3.0 modal architecture

#### **MS Sensor Modal - 100% Complete:**

**Status**: Fully functional and production-ready

**6 Sections Implemented:**
1. **General Information** (5 fields) - name, normalized_id, status, measurement status, legacy_acronym
2. **Sensor Specifications** (12 fields) - **MS-SPECIFIC SECTION**
   - sensor_brand, sensor_model, sensor_serial_number
   - orientation (uplooking/downlooking), number_of_channels, field_of_view_degrees
   - cable_length_m, datalogger_type, datalogger programs (normal/calibration)
   - end_date, calibration_logs
3. **Position & Orientation** (6 fields) - lat/lon, height, viewing direction, azimuth, nadir
4. **Timeline & Deployment** (7 fields) - type, ecosystem, deployment dates, calibration, measurement years
5. **System Configuration** (6 fields) - power, transmission, warranty, processing, quality score
6. **Documentation** (3 fields) - description, installation notes, maintenance notes

**Key Features:**
- ✅ Save button enabled - full edit functionality
- ✅ Clean separation from Phenocam modal (no camera fields)
- ✅ All 39 MS sensor fields properly mapped to save function
- ✅ Section 2B (Sensor Specifications) replaces Camera Specifications

#### **Files Modified:**
- `public/station.html` - buildMSSensorModalHTML() replaced (lines 6670-7041, +350 lines)
- `package.json` - Version 6.3.0 → 6.4.0

### Previous Update: Modal Architecture Refactoring (v6.3.0)

**🎯 Achievement**: Complete architectural refactoring - replaced monolithic conditional modals with clean, type-specific rendering functions

#### **Core Problem Solved:**
- **Before**: Single 5,000+ line modal with scattered conditionals (`if instrumentCategory === 'phenocam'`)
- **After**: Clean routing system with dedicated rendering functions for each instrument type
- **Result**: Zero conditionals within modals, easy debugging, scalable architecture

#### **New Architecture:**

**Router System** (`station.html:6190`):
```javascript
function showInstrumentEditModal(instrument) {
    const instrumentCategory = getInstrumentCategory(instrument.instrument_type);

    if (instrumentCategory === 'phenocam') {
        modalHTML = renderPhenocamEditForm(instrument, isAdmin);
    } else if (instrumentCategory === 'multispectral') {
        modalHTML = renderMSSensorEditForm(instrument, isAdmin);
    } else {
        showNotification('Instrument type not yet supported', 'warning');
    }
}
```

**Type-Specific Builders:**
- `buildPhenocamModalHTML()` (line 6249) - Complete with all 7 sections
- `buildMSSensorModalHTML()` (line 6670) - Placeholder for Phase 3 implementation

#### **Phenocam Modal - 100% Complete:**
**Status**: Production-ready, fully functional

**7 Sections:**
1. General Information (5 fields)
2. **Camera Specifications** (11 fields) - Phenocam-specific
3. Position & Orientation (6 fields)
4. Timeline & Deployment (7 fields)
5. System Configuration (6 fields)
6. **Phenocam Processing** (1 field) - Phenocam-specific
7. Documentation (3 fields)

**Quality Improvements:**
- ✅ Zero conditional display logic
- ✅ Removed Section 2B (Sensor Specs) - MS-specific
- ✅ Clean, focused code - easy to debug
- ✅ All 46 fields properly mapped

#### **MS Sensor Modal - Placeholder (Phase 2):**
**Status**: Routing functional, UI pending Phase 3

**Current Implementation:**
- Shows informational message
- Displays instrument type and normalized name
- Save button disabled with tooltip
- Clear explanation for users

**Phase 3 Requirements:**
- Copy sections 1, 3, 4, 5, 7 from Phenocam modal
- Add Section 2B: **Sensor Specifications** (12 MS-specific fields)
- Remove Section 2A (Camera) and Section 6 (Phenocam Processing)
- Enable save functionality

#### **Bug Fixes:**
1. **Instrument Edit Modal Close Button** - Fixed ID and method mismatch
2. **Platform Modal Close Button** - Removed duplicate function definitions
3. **Instrument Type Dropdown** (v6.2.1) - Removed unsupported types

#### **Files Modified:**
- `public/station.html`: Major refactoring (+150 lines, -200 lines conditionals)
- `public/js/instrument-modals.js`: New module created
- `public/js/station-dashboard.js`: Dropdown updated
- `package.json`: Version 6.2.1 → 6.3.0

#### **Benefits:**
✅ Separation of concerns - each type has dedicated function
✅ No conditionals - clean readable code
✅ Easy debugging - inspect one modal at a time
✅ Scalable - proven pattern for PAR, NDVI, PRI sensors
✅ Production ready - Phenocam editing fully operational

---

### Previous Update: Tabbed Instrument Interface (v6.1.4)

**🎯 Achievement**: Implemented tabbed interface in platform cards to organize instruments by type

#### **New Features:**
- Platform cards now show instruments organized by type in tabs
- Three categories: Phenocams, MS Sensors (Multispectral), Other (PAR, Hyperspectral, etc.)
- Only tabs with instruments are displayed (empty tabs hidden)
- Count badge shows number of instruments per category (e.g., "Phenocams (3)")
- Smart fallback: single category with few instruments shows simple list

#### **Files Modified:**
- `/public/js/station-dashboard.js`: Added groupInstrumentsByType(), createInstrumentTabs(), switchInstrumentTab()
- `/public/css/styles.css`: Added instrument-tabs CSS styling

### Previous Update: Data Quality Fixes & Export Tools (v6.1.1)

**🎯 Achievement**: Database cleanup, UNIQUE constraint, and YAML export tooling

#### **Data Quality Fixes:**
- Removed duplicate instrument (GRI_FOR_BL01_PHE01)
- Standardized instrument_type casing (17 records updated to "Phenocam")
- Added 7 missing SVB instruments from Excel metadata

#### **Database Integrity:**
- Added UNIQUE index on `instruments.normalized_name`
- Prevents future duplicate entries

#### **Export Tools:**
Export database to YAML using `scripts/export_db_to_yaml.py`:

```bash
npx wrangler d1 execute spectral_stations_db --remote --json --command="SELECT
  s.acronym, s.display_name as station_display,
  p.normalized_name as platform, p.display_name as platform_display,
  p.location_code, p.mounting_structure, p.platform_height_m,
  p.latitude as plat_lat, p.longitude as plat_lon,
  i.normalized_name as instrument, i.display_name as instr_display,
  i.instrument_type, i.instrument_number, i.status, i.legacy_acronym,
  i.instrument_height_m, i.deployment_date, i.camera_brand, i.camera_model,
  i.camera_serial_number, i.sensor_brand, i.sensor_model, i.installation_notes
FROM stations s
JOIN platforms p ON s.id = p.station_id
JOIN instruments i ON p.id = i.platform_id
ORDER BY s.acronym, p.normalized_name, i.normalized_name;" 2>/dev/null \
| python3 scripts/export_db_to_yaml.py > docs/migrations/instruments_export_$(date +%Y-%m-%d).yaml
```

### 🚀 Major Release: v6.1.0 - Complete Multispectral Sensor Frontend

Merged two feature branches with 26+ commits:
- Complete MS sensor backend (v6.0.0-6.0.1)
- Modular MS frontend (~2000 lines new JS)
- New handlers: analytics, channels, documentation, sensor-models, users
- ROI dual-mode creation (interactive + YAML)

### 🔬 Instrument Types for SITES Spectral

**New instrument types dropdown with SITES Spectral specific sensors:**
- **Phenocams** (PHE)
- **Multispectral Sensors - Fixed Platform** (MS): SKYE, Decagon, Apogee MS
- **PRI Sensors** (PRI): 2-band ~530nm/~570nm
- **NDVI Sensors** (NDVI): Apogee NDVI
- **PAR Sensors** (PAR): Apogee PAR

**Key Feature**: All multispectral fixed platform sensors share the **MS** acronym regardless of vendor.

### ✅ Previous Feature: ROI Name Validation System (v5.2.51)

**Comprehensive validation to enforce ROI naming conventions and prevent duplicates:**

#### **Validation Rules:**
1. **Format Enforcement**: ROI names must follow `ROI_XX` pattern (01-99 range)
   - Valid: `ROI_01`, `ROI_02`, `ROI_15`, `ROI_99`
   - Invalid: `ROI_1`, `ROI_100`, `MyROI`, `roi_01`
2. **Duplicate Prevention**: No two ROIs can have same name for same instrument
3. **Range Validation**: ROI number must be between 01 and 99

#### **Implementation:**
- **New Function**: `validateROIName(roiName, instrumentId, currentRoiId = null)`
- **Integration Points**:
  - `saveROI()` at line 7695 (create workflow)
  - `saveROIChanges(roiId)` at line 4115 (edit workflow)
- **Files Modified**: `/public/station.html`

#### **Error Messages:**
- Format: "ROI name must follow the format ROI_XX (e.g., ROI_01, ROI_02, ..., ROI_99)"
- Range: "ROI number must be between 01 and 99"
- Duplicate: "ROI name 'ROI_XX' already exists for this instrument. Please choose a different name."

#### **Benefits:**
- **Consistency**: All ROIs follow same naming convention
- **Organization**: Sequential numbering makes ROIs easy to reference
- **Data Integrity**: Prevents confusion from duplicate names
- **User Guidance**: Clear error messages help users understand requirements

### 🚨 Recent Critical Fixes: API Field Completeness (v5.2.49-50)

**Complete API audit revealed and fixed missing fields across all endpoints:**

#### **v5.2.49 - Instruments List API Fix**
- **Fixed**: 7 missing fields in `GET /api/instruments?station=XXX`
- **Fields Added**: deployment_date, calibration_date, camera_serial_number, instrument_height_m, degrees_from_nadir, description, instrument_deployment_date
- **Impact**: Edit modals now properly populate all fields with current database values

#### **v5.2.50 - Platforms List API Fix**
- **Fixed**: 3 missing fields in `GET /api/platforms?station=XXX`
- **Fields Added**: deployment_date, description, updated_at
- **Impact**: Platform modals now display deployment dates and descriptions

#### **Comprehensive Audit Results:**
- ✅ **Stations API**: Already complete (all 10 columns)
- ✅ **Platforms API**: FIXED in v5.2.50 (now returns all 15 columns)
- ✅ **Instruments API**: FIXED in v5.2.49 (returns all critical fields)

**Root Cause**: List endpoints were missing fields that detail endpoints returned, causing empty fields in edit modals even though data was saved in database.

**Resolution**: Updated SELECT queries in `src/handlers/instruments.js` and `src/handlers/platforms.js` to match database schemas.

### 🎨 Latest Major Feature: ROI Creation System

**Complete dual-mode ROI (Region of Interest) creation interface:**

1. **Interactive Drawing Mode**
   - HTML5 canvas-based polygon digitizer (800x600)
   - Click to place polygon points (minimum 3 required)
   - Drag points to adjust positions after placement
   - Right-click or double-click to close polygon
   - Real-time preview with numbered points
   - Professional color picker (8 presets + custom RGB sliders)
   - Auto-naming system (ROI_01, ROI_02, etc.)

2. **YAML Upload Mode**
   - Drag-and-drop batch import (.yaml/.yml files)
   - Automatic parsing and validation
   - Preview table with color swatches and validation indicators
   - Selective import with checkboxes
   - Batch create multiple ROIs in single operation

**Implementation Details:**
- **File**: `public/station.html` (+1,545 lines)
- **Modal HTML**: 291 lines (dual-tab interface)
- **CSS Styles**: 600 lines (animations, responsive design)
- **JavaScript**: 665 lines (31 new functions)
- **Documentation**: 7 comprehensive files (~4,200 total lines)

**Key Functions:**
- `showROICreationModal()`, `initializeCanvas()`, `handleCanvasClick()`, `saveROI()`
- `handleYAMLUpload()`, `parseYAMLROIs()`, `displayYAMLPreview()`, `importSelectedROIs()`
- `fetchNextROIName()`, `selectPresetColor()`, `updateColorPreview()`

**YAML Format for Import:**
```yaml
rois:
  ROI_01:
    description: "Forest canopy region"
    color: [0, 255, 0]  # RGB array
    points:              # x, y pixel coordinates
      - [100, 200]
      - [500, 200]
      - [500, 600]
      - [100, 600]
    thickness: 7
    auto_generated: false
```

### 📋 Recent Bug Fix Journey (v5.2.44-50)

**Complete resolution of deployment_date and API field completeness issues:**

1. **v5.2.44** - Svartberget cleanup: Deleted duplicate instrument, updated naming
2. **v5.2.45** - Fixed modal refresh: Added automatic modal reopen after save with fresh data
3. **v5.2.46** - Fixed dashboard counts and modal state management
4. **v5.2.47** - Fixed JavaScript const token redeclaration error
5. **v5.2.48** - Added diagnostic logging to track data flow
6. **v5.2.49** - 🎯 **ROOT CAUSE FIXED**: Instruments list API missing 7 fields
7. **v5.2.50** - 🎯 **AUDIT COMPLETE**: Platforms list API missing 3 fields

**Key Learning**: The issue was never frontend or database - it was backend API SELECT queries not returning all fields.

### 🆕 Database Updates (v5.2.38-39)

#### New Svartberget Platforms Added
- **SVB_MIR_PL04** - Degerö Wet PAR Pole (Database ID: 31)
- **SVB_FOR_PL03** - Below Canopy CPEC Tripod (Database ID: 32)

#### Naming Convention Standardization
- Fixed inconsistent naming: **SVB_FOR_P02** → **SVB_FOR_PL02**
- **Standard Format**: `{STATION}_{ECOSYSTEM}_PL##`
- **Location Codes**: Always use `PL##` (not `P##`)

### 📊 Complete Svartberget Platform Inventory (7 Platforms)

**Forest Ecosystem (FOR) - 3 Platforms:**
1. **SVB_FOR_PL01** - SVB PL01 150m tower (Tower, 70m)
2. **SVB_FOR_PL02** - SVB PL02 Below Canopy North (Tripod, 3.2m)
3. **SVB_FOR_PL03** - SVB P03 Below Canopy CPEC (Tripod, 3.22m)

**Mire Ecosystem (MIR) - 4 Platforms:**
4. **SVB_MIR_PL01** - DEG PL01 flag pole W (Pole, 17.5m)
5. **SVB_MIR_PL02** - DEG PL02 ICOS mast (Mast, 3.3m)
6. **SVB_MIR_PL03** - DEG PL03 dry PAR pole (Pole, 2m)
7. **SVB_MIR_PL04** - DEG PL04 wet PAR pole (Pole, 2m)

### ✅ Recently Resolved Issues
- ✅ **Platform Creation Button** (v5.2.37): Fixed function conflicts and data loading race conditions
- ✅ **Deployment Date Fields** (v5.2.49-50): Fixed API endpoints missing critical fields
- ✅ **Modal Refresh** (v5.2.45-46): Fixed edit modals not showing updated values
- ✅ **Instrument Naming** (v5.2.33): Resolved NaN in normalized names
- ✅ **SQL Column Mismatch** (v5.2.32): Fixed instrument creation blocking error

### ⚠️ Current Known Issues
- None currently reported - all major issues resolved as of v5.2.50

---

## System Architecture

### Authentication System
- **Role-Based Access**: Three user roles (admin, station, readonly) with granular permissions
- **JWT Authentication**: Secure token-based authentication with session management
- **Permission Matrix**: Field-level permissions controlled via `user_field_permissions` table
- **Important**: Do NOT use email/password for login - use Cloudflare username credentials

### Database Schema
- **Core Tables**: `stations`, `platforms`, `instruments`, `instrument_rois`
- **User Management**: `users`, `user_sessions`, `activity_log`
- **Normalized Design**: Proper relationships with foreign key constraints
- **Migration System**: Structured database evolution with numbered migrations

### Key Features
- **Complete CRUD Operations**: Full create/read/update/delete for all entities
- **Interactive Mapping**: Leaflet-based maps with Swedish coordinate system (SWEREF 99)
- **Professional UI**: Responsive design with comprehensive modal systems
- **ROI Management**: Complete Region of Interest functionality with visual editing
- **Export Capabilities**: Multi-format data export (CSV, TSV, JSON) with filtering options

---

## Development Workflow

### Build and Development
```bash
npm run dev                 # Start local development server
npm run build              # Build application
npm run build:bump         # Build with automatic version increment
```

### Database Operations
```bash
npm run db:migrate         # Apply migrations to remote database
npm run db:migrate:local   # Apply migrations to local database
npm run db:studio          # Open database studio interface

# Direct database operations
npx wrangler d1 migrations apply spectral_stations_db --remote
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM stations;"
```

### Deployment
```bash
npm run deploy             # Build and deploy to production
npm run deploy:bump        # Build with version bump and deploy
```

**Deployment Checklist:**
1. Always bump version before commit
2. Update CHANGELOG.md with changes
3. Use git worktrees for parallel sessions
4. Test locally before deploying to production

---

## File Structure

```
public/
├── index.html              # Login redirect page
├── login.html              # Main login portal
├── station.html            # Station details and management
└── css/, js/, images/      # Static assets

src/
├── worker.js               # Main Cloudflare Worker
├── auth.js                 # JWT authentication system
├── api-handler.js          # API routing with auth middleware
└── handlers/               # API endpoint handlers
    ├── stations.js
    ├── platforms.js
    ├── instruments.js
    └── export.js

migrations/
├── *.sql                   # Database schema and data migrations

yamls/
├── stations_latest_production.yaml  # Production data reference
```

---

## Important References

### Ecosystem Codes (12 Official Types)
- **FOR** - Forest
- **AGR** - Arable Land
- **MIR** - Mires
- **LAK** - Lake
- **WET** - Wetland
- **GRA** - Grassland
- **HEA** - Heathland
- **ALP** - Alpine Forest
- **CON** - Coniferous Forest
- **DEC** - Deciduous Forest
- **MAR** - Marshland
- **PEA** - Peatland

### SITES Spectral Instrument Types
1. **Phenocam** (default)
2. **Multispectral Sensor**
3. **Hyperspectral Sensor**
4. **PAR Sensor**

### Naming Conventions
- **Stations**: `{ACRONYM}` (e.g., SVB, ANS, LON)
- **Platforms**: `{STATION}_{ECOSYSTEM}_PL##` (e.g., SVB_FOR_PL01)
- **Instruments**: `{PLATFORM}_{TYPE_CODE}{NUMBER}` (e.g., SVB_FOR_PL01_PHE01)
- **Location Codes**: Always `PL##` format (not `P##`)
- **Instrument Numbers**: `{TYPE_CODE}{NUMBER}` (e.g., PHE01, MUL02, HYP03)

---

## Development Best Practices

### Security First
- All operations must check authentication and permissions
- No public access - all functionality requires user authentication
- Input sanitization on all user inputs
- Server-side validation of all permissions
- Complete audit trail via activity logging
- Never include actual server names or credentials in documentation

### Code Quality
- Prefer clean, functional, and robust code over backward compatibility
- Use absolute package imports over relative imports
- Always create enterprise-grade `.gitignore` files
- Use plain Python type conversions rather than package-specific casting
- Use git worktrees for parallel Claude sessions with separation of concerns

### Data Integrity
- Validate all inputs and maintain referential integrity
- Use efficient queries and minimize API calls
- Data-first architecture: if data exists and is not null/empty/NA, it should process when requested
- Proper cascade handling and foreign key constraint management

### User Experience
- Provide clear instructions and feedback at every step
- Professional modal design with loading states and error handling
- Real-time validation with helpful error messages
- Intelligent conflict resolution with smart suggestions

### Documentation
- Always bump version and update CHANGELOG.md before git commit
- Keep CLAUDE.md updated as features evolve
- Use descriptive commit messages with emojis for clarity

---

## Production Information

- **Production URL**: https://sites.jobelab.com
- **Worker URL**: https://sites-spectral-instruments.jose-e5f.workers.dev
- **Current Version**: 5.2.38
- **Last Deployed**: 2025-11-14
- **Status**: Fully operational
- **Environment**: Cloudflare Workers with D1 database

---

## Admin CRUD Operations

### Station Management (Admin Only)
- Create/delete stations via admin controls in station header
- Real-time validation with duplicate detection
- Automatic normalized name generation
- Comprehensive backup on deletion

### Platform Management (Admin Only)
- Create platforms via section header button
- Delete via platform card buttons (admin only)
- Smart naming following `{STATION}_{ECOSYSTEM}_PL##` format
- Dependency analysis and cascade deletion warnings

### Instrument Management (Admin + Station Users)
- Full CRUD operations from platform cards and modals
- Dual creation pathways for flexibility
- Automatic type-prefixed sequential numbering
- Complete ROI integration

### Data Safety
- All deletions include dependency analysis
- Optional comprehensive JSON backup generation
- Validation with intelligent name suggestions
- Complete audit trail in activity log

---

## Environment Setup Notes

- **No root access**: Plan everything to be local to user
- **Python**: Use `uv` for package management with Python 3.12.9
- **Virtual Environments**: Always source from project folder
- **Database Access**: Use Cloudflare API directly to query database remotely
- **Git Workflow**: Use worktrees for parallel sessions, always bump version before commit
- for temporal scripts, always use a tmp folder inside the project and add that to gitignore. Move previous scripts from ../../../../../../../../tmp/ to the new tmp folder, and use those scripts from the local tmp folder..