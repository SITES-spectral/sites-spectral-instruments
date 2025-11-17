# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: For detailed version history and legacy documentation, see [CLAUDE_LEGACY.md](./CLAUDE_LEGACY.md)

## Current Version: 5.2.43 - MAJOR FEATURE: Dual-Mode ROI Creation Modal (2025-11-17)
**✅ STATUS: SUCCESSFULLY IMPLEMENTED**
**🌐 Production URL:** https://sites.jobelab.com
**📅 Last Updated:** 2025-11-17

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

### 🆕 Recent Updates (v5.2.39-43)

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

### ⚠️ Known Issues
- **Platform Creation Button**: Ongoing investigation of button functionality. **Workaround**: Use direct database operations via wrangler CLI for platform management.

### 🔥 Recent Critical Fixes (v5.2.32-37)
- **v5.2.37**: Fixed platform creation button function conflicts and data loading race conditions
- **v5.2.36**: Added platform creation button safety wrapper and form field debugging
- **v5.2.33**: Fixed instrument naming (resolved NaN in normalized names)
- **v5.2.32**: Fixed SQL column/value mismatch blocking instrument creation

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
