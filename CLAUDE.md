# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: For detailed version history and legacy documentation, see [CLAUDE_LEGACY.md](./CLAUDE_LEGACY.md)

## Current Version: 6.5.0 - Complete Sensor Type Modals (2025-11-26)

**✅ STATUS: PRODUCTION-READY - ALL INSTRUMENT TYPES SUPPORTED**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Last Updated:** 2025-11-26

---

## Quick Reference

### Supported Instrument Types (v6.5.0)

| Type | Icon | Modal Builder | Key Fields |
|------|------|---------------|------------|
| Phenocam | 📷 | `buildPhenocamModalHTML()` | camera_brand, camera_model, resolution, interval |
| Multispectral | 📡 | `buildMSSensorModalHTML()` | number_of_channels, orientation, datalogger |
| PAR Sensor | ☀️ | `buildPARSensorModalHTML()` | spectral_range, calibration_coefficient |
| NDVI Sensor | 🌿 | `buildNDVISensorModalHTML()` | red_wavelength_nm, nir_wavelength_nm |
| PRI Sensor | 🔬 | `buildPRISensorModalHTML()` | band1_wavelength_nm (~531), band2_wavelength_nm (~570) |
| Hyperspectral | 🌈 | `buildHyperspectralModalHTML()` | spectral_range_start/end_nm, spectral_resolution_nm |

### Modal Architecture

**Router Function** (`station.html`):
```javascript
function showInstrumentEditModal(instrument) {
    const category = getInstrumentCategory(instrument.instrument_type);

    if (category === 'phenocam') modalHTML = renderPhenocamEditForm(instrument, isAdmin);
    else if (category === 'multispectral') modalHTML = renderMSSensorEditForm(instrument, isAdmin);
    else if (category === 'par') modalHTML = renderPARSensorEditForm(instrument, isAdmin);
    else if (category === 'ndvi') modalHTML = renderNDVISensorEditForm(instrument, isAdmin);
    else if (category === 'pri') modalHTML = renderPRISensorEditForm(instrument, isAdmin);
    else if (category === 'hyperspectral') modalHTML = renderHyperspectralEditForm(instrument, isAdmin);
}
```

**Standard Modal Structure (6 Sections):**
1. **General Information** - name, normalized_id, status, measurement_status, legacy_acronym
2. **Type-Specific Specifications** - varies by instrument type
3. **Position & Orientation** - lat/lon, height, viewing_direction, azimuth, nadir
4. **Timeline & Deployment** - type, ecosystem, deployment_date, calibration_date, years
5. **System Configuration** - power_source, data_transmission, warranty, quality_score
6. **Documentation** - description, installation_notes, maintenance_notes

---

## Development Workflow

### Build and Deploy

```bash
npm run dev                 # Start local development server
npm run build              # Build application
npm run build:bump         # Build with automatic version increment
npm run deploy             # Build and deploy to production
npm run deploy:bump        # Build with version bump and deploy
```

### Database Operations

```bash
npm run db:migrate         # Apply migrations to remote database
npm run db:migrate:local   # Apply migrations to local database
npm run db:studio          # Open database studio interface

# Direct queries
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM stations;"
```

### Deployment Checklist

1. Bump version in `package.json`
2. Update `CHANGELOG.md`
3. Update `CLAUDE.md` if needed
4. Run `npm run deploy`
5. Commit with descriptive message

---

## File Structure

```
public/
├── index.html              # Login redirect
├── login.html              # Authentication portal
├── station.html            # Main application (instrument modals here)
├── css/styles.css          # Application styles
└── js/
    ├── station-dashboard.js    # Dashboard logic
    └── instrument-modals.js    # Modal utilities

src/
├── worker.js               # Cloudflare Worker entry
├── auth.js                 # JWT authentication
├── api-handler.js          # API routing
└── handlers/
    ├── stations.js         # Station CRUD
    ├── platforms.js        # Platform CRUD
    ├── instruments.js      # Instrument CRUD
    ├── rois.js            # ROI management
    └── export.js          # Data export

docs/
├── STATION_USER_GUIDE.md   # End-user documentation
├── PRODUCTION_SYNC_GUIDE.md # Sync procedures
├── roi/                    # ROI documentation
└── deprecated/             # Legacy documentation
```

---

## Naming Conventions

### Entity Naming

| Entity | Format | Example |
|--------|--------|---------|
| Station | `{ACRONYM}` | SVB, ANS, LON, GRI |
| Platform | `{STATION}_{ECOSYSTEM}_PL##` | SVB_FOR_PL01 |
| Instrument | `{PLATFORM}_{TYPE}{##}` | SVB_FOR_PL01_PHE01 |
| ROI | `ROI_##` | ROI_01, ROI_02 |

### Instrument Type Codes

| Code | Type | Example |
|------|------|---------|
| PHE | Phenocam | SVB_FOR_PL01_PHE01 |
| MS | Multispectral | SVB_FOR_PL01_MS01 |
| PAR | PAR Sensor | SVB_MIR_PL03_PAR01 |
| NDVI | NDVI Sensor | ANS_FOR_PL01_NDVI01 |
| PRI | PRI Sensor | LON_AGR_PL01_PRI01 |
| HYP | Hyperspectral | GRI_FOR_PL01_HYP01 |

### Ecosystem Codes (12 Types)

| Code | Ecosystem | Code | Ecosystem |
|------|-----------|------|-----------|
| FOR | Forest | GRA | Grassland |
| AGR | Arable Land | HEA | Heathland |
| MIR | Mires | ALP | Alpine Forest |
| LAK | Lake | CON | Coniferous Forest |
| WET | Wetland | DEC | Deciduous Forest |
| MAR | Marshland | PEA | Peatland |

---

## Database Schema

### Core Tables

```sql
stations (id, acronym, display_name, description, latitude, longitude, ...)
platforms (id, station_id, normalized_name, display_name, ecosystem_code, ...)
instruments (id, platform_id, normalized_name, instrument_type, status, ...)
instrument_rois (id, instrument_id, roi_name, polygon_points, color, ...)
```

### User Management

```sql
users (id, username, role, station_id, ...)
user_sessions (id, user_id, token, expires_at, ...)
activity_log (id, user_id, action, entity_type, entity_id, ...)
```

### Roles

| Role | Permissions |
|------|-------------|
| admin | Full access to all stations and features |
| station | Edit instruments/ROIs for assigned station |
| readonly | View-only access |

---

## Key Features

### Instrument Management
- **Type-Specific Modals**: Each instrument type has dedicated edit modal
- **Tabbed Interface**: Platform cards organize instruments by type
- **Full CRUD**: Create, read, update, delete for all entities
- **Validation**: Real-time input validation with helpful error messages

### ROI System
- **Interactive Drawing**: Canvas-based polygon digitizer
- **YAML Import**: Batch import from YAML files
- **Validation**: ROI_XX naming format enforced
- **Color Picker**: 8 presets + custom RGB

### Data Export
- **Formats**: CSV, TSV, JSON
- **Filtering**: By station, date range, instrument type
- **API**: `GET /api/export/station/{acronym}`

---

## Security & Best Practices

### Authentication
- JWT-based authentication with session management
- Role-based access control (RBAC)
- All API endpoints require authentication
- Activity logging for audit trail

### Code Quality
- Prefer clean, functional code over backward compatibility
- Use absolute imports
- Always bump version and update changelog before commit
- Use git worktrees for parallel development

### Data Integrity
- Input validation on all user inputs
- Foreign key constraints enforced
- Cascade deletion with dependency analysis
- Database backups before destructive operations

---

## Environment Setup

```bash
# No root access - everything local to user
# Python: Use uv with Python 3.12.9
# Always source virtual environment from project folder
# Use Cloudflare API directly for database queries
```

### Temporal Scripts
- Use `tmp/` folder inside project (gitignored)
- Never use system `/tmp/` for project scripts

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `CHANGELOG.md` | Version history and release notes |
| `CLAUDE_LEGACY.md` | Historical documentation (pre-v6.x) |
| `docs/STATION_USER_GUIDE.md` | End-user guide |
| `docs/roi/ROI_README.md` | ROI system documentation |
| `docs/deprecated/` | Archived documentation |

---

## Production Information

| Property | Value |
|----------|-------|
| Production URL | https://sites.jobelab.com |
| Worker URL | https://sites-spectral-instruments.jose-e5f.workers.dev |
| Current Version | 6.5.0 |
| Last Deployed | 2025-11-26 |
| Status | Fully Operational |
| Environment | Cloudflare Workers + D1 Database |
