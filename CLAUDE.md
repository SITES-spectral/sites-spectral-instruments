# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: For detailed version history and legacy documentation, see [CLAUDE_LEGACY.md](./CLAUDE_LEGACY.md)

---

## ARCHITECTURE REQUIREMENTS (MANDATORY)

**All new code MUST follow SOLID principles and Hexagonal Architecture.**

### SOLID Principles (Enforced)

| Principle | Requirement |
|-----------|-------------|
| **S**ingle Responsibility | Each class/module has ONE reason to change |
| **O**pen/Closed | Open for extension, closed for modification |
| **L**iskov Substitution | Subtypes must be substitutable for base types |
| **I**nterface Segregation | Many specific interfaces over one general |
| **D**ependency Inversion | Depend on abstractions, not concretions |

### Hexagonal Architecture (Ports & Adapters)

```
src/
├── domain/           # Core business logic (NO external dependencies)
│   ├── station/      # Station entities, services, repository ports
│   ├── platform/     # Platform entities, type strategies
│   └── instrument/   # Instrument entities, type registry
│
├── application/      # Use cases (orchestration layer)
│   ├── commands/     # Write operations (CreatePlatform, DeleteInstrument)
│   └── queries/      # Read operations (GetStationDashboard, ListPlatforms)
│
└── infrastructure/   # External adapters (framework-specific)
    ├── persistence/  # Database adapters (D1Repository implementations)
    ├── http/         # API routes, controllers, middleware
    └── auth/         # Authentication adapters
```

### Type System Patterns

| Entity | Pattern | Reason |
|--------|---------|--------|
| **Platform Types** | Strategy (code-based) | Different behavior (naming, auto-creation) |
| **Instrument Types** | Registry (config-driven) | Different data schemas (load from YAML) |

### Code Rules

1. **Domain layer has ZERO external dependencies** - no database, HTTP, or framework code
2. **Repository interfaces (ports) live in domain** - implementations (adapters) in infrastructure
3. **Use cases orchestrate domain logic** - never put business logic in controllers
4. **Config-driven over code-driven** - use YAML for instrument types, validation rules
5. **No monolithic files** - split into focused, single-responsibility modules

---

## Current Version: 9.0.28 - Platform Delete Fix (2025-12-05)

**✅ STATUS: PRODUCTION-READY - V3 API**
**🌐 Production URL:** https://sites.jobelab.com
**🔗 Worker URL:** https://sites-spectral-instruments.jose-e5f.workers.dev
**📅 Last Updated:** 2025-12-05
**🚀 API Version:** V3 (default) | V1 (legacy/deprecated)
**🔒 Security Features:** CSRF Protection, Input Sanitization, JWT HMAC-SHA256

### What's New in v9.0.27

- **Platform Forms Refactor (SOLID Architecture)**: Complete rewrite of platform creation forms
- **Dedicated Form Generators**: Each platform type (Fixed, UAV, Satellite) has its own form
- **Enforced Naming Conventions**: UAV and Satellite never use ecosystem code in names
- **New Module**: `PlatformForms` in `/js/platform-forms/index.js`

### What's New in v9.0.24-v9.0.26

- **Locked Platform Type Selection (v9.0.25)**: Platform type read-only after initial selection
- **Delete Platform Button Fix (v9.0.24)**: `showModal()` accepts both string IDs and element objects
- **Platform Naming Fix (v9.0.24)**: UAV/Satellite platforms use correct naming conventions

### What's New in v9.0.17-v9.0.23

- **Phenocam Image Loading (v9.0.20-v9.0.23)**: Image path and loading state fixes
- **Delete Modal & Platform Fixes (v9.0.17-v9.0.19)**: Various modal and platform updates
- **Simplified Admin Controls (v9.0.16)**: Single source of truth for platform creation

### What's New in v9.0.11-v9.0.15

- **Full Edit Modals (v9.0.11)**: Type-specific edit forms for all instruments
- **Platform Controls Visibility (v9.0.12)**: Create Platform button properly shows for admin/station users
- **Permission Check Fix (v9.0.13)**: Dashboard instance used as primary source for user permissions
- **Platform Normalized Name Fix (v9.0.14)**: UAV platforms correctly use station acronym
- **Station Acronym Validation (v9.0.15)**: Strict validation - no 'STA' fallback allowed

### What's New in v9.0.0

- **V3 API Default**: All `/api/` endpoints now use V3 routing with pagination
- **Campaign Management**: Full CRUD for acquisition campaigns
- **Product Catalog**: Browse and filter data products
- **Modern Frontend**: New components with YAML-driven configuration
- **Legacy API Deprecated**: V1 available at `/api/v1/` (removal in v10.0.0)

---

## Quick Reference

### Supported Platform Types (v8.4.0)

| Type | Code | Icon | Status | Description |
|------|------|------|--------|-------------|
| Fixed | `fixed` | `fa-tower-observation` | Active | Towers, masts, permanent installations |
| UAV | `uav` | `fa-crosshairs` | Active | Drones with auto-instrument creation |
| Satellite | `satellite` | `fa-satellite` | Active | Earth observation platforms |
| Mobile | `mobile` | `fa-truck` | Coming Soon | Portable sensors, temporal deployments |
| USV | `usv` | `fa-ship` | Coming Soon | Surface vehicles for aquatic surveys |
| UUV | `uuv` | `fa-water` | Coming Soon | Underwater vehicles |

### UAV Auto-Instrument Creation (v8.3.0+)

When creating UAV platforms, instruments are auto-created with known specifications:

| Vendor | Models | Type |
|--------|--------|------|
| DJI | M3M, P4M, M30T, M300, M350 | Multispectral/RGB/Thermal |
| MicaSense | RedEdge-MX, Altum-PT | Multispectral |
| Parrot | Sequoia+ | Multispectral |
| Headwall | Nano-Hyperspec | Hyperspectral |

### Future Platform Types

See `docs/FUTURE_PLATFORM_TYPES.md` for detailed specifications:
- **Mobile**: Portable NDVI, LAI, hyperspectral, LiDAR with temporal deployment tracking
- **USV**: Autonomous boats for lake/coastal surveys
- **UUV**: ROVs/AUVs for underwater surveys

### Supported Instrument Types

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
    ├── api.js                  # API communication with auth
    ├── navigation.js           # Breadcrumbs with URL sanitization
    ├── station-dashboard.js    # Dashboard logic
    ├── core/
    │   ├── app.js              # App initialization, image error handler
    │   ├── config-service.js   # YAML configuration loader
    │   ├── debug.js            # Environment-aware debug utilities (v8.5.6)
    │   └── rate-limit.js       # Debounce/throttle/submission guard (v8.5.6)
    ├── instruments/
    │   ├── phenocam/
    │   │   └── phenocam-card.js  # XSS-safe card rendering
    │   └── ms/
    │       └── ms-card.js        # Multispectral card rendering
    └── aoi/
        └── aoi-drawing-tools.js  # AOI polygon drawing

src/
├── worker.js               # Cloudflare Worker entry
├── auth.js                 # JWT HMAC-SHA256 authentication (v8.5.4)
├── api-handler.js          # API routing with CSRF protection (v8.5.7)
├── utils/
│   ├── validation.js       # Input sanitization framework (v8.5.7)
│   ├── csrf.js             # CSRF protection middleware (v8.5.7)
│   ├── responses.js        # Standardized API responses
│   ├── database.js         # D1 database utilities
│   ├── logging.js          # Request logging
│   └── rate-limiting.js    # Server-side rate limiting
└── handlers/
    ├── stations.js         # Station CRUD
    ├── platforms.js        # Platform CRUD with sanitization
    ├── instruments/
    │   ├── index.js        # Instrument router
    │   ├── get.js          # Read operations
    │   ├── mutate.js       # Create/Update with sanitization
    │   └── utils.js        # Instrument utilities
    ├── rois.js             # ROI management with sanitization
    └── export.js           # Data export

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
| Platform (Fixed) | `{STATION}_{ECOSYSTEM}_{MOUNT_TYPE}` | SVB_FOR_PL01 |
| Platform (UAV) | `{STATION}_{VENDOR}_{MODEL}_{MOUNT_TYPE}` | SVB_DJI_M3M_UAV01 |
| Platform (Satellite) | `{STATION}_{AGENCY}_{SATELLITE}_{SENSOR}` | SVB_ESA_S2A_MSI |
| Instrument | `{PLATFORM}_{TYPE}{##}` | SVB_FOR_PL01_PHE01 |
| ROI | `ROI_##` | ROI_01, ROI_02 |

### Mount Type Codes (v10.0.0+)

The `mount_type_code` field describes the **physical mounting structure type** (not geographic location):

| Code | Name | Description | Platform Types |
|------|------|-------------|----------------|
| **PL** | Pole/Tower/Mast | Elevated structures (>1.5m height) | fixed |
| **BL** | Building | Rooftop or facade mounted | fixed |
| **GL** | Ground Level | Installations below 1.5m height | fixed |
| **UAV** | UAV Position | Drone flight position identifier | uav |
| **SAT** | Satellite | Virtual position for satellite data | satellite |
| **MOB** | Mobile | Portable platform position | mobile |
| **USV** | Surface Vehicle | Unmanned surface vehicle position | usv |
| **UUV** | Underwater Vehicle | Unmanned underwater vehicle position | uuv |

> **Note**: In v9.x and earlier, this field was called `location_code`. The rename to `mount_type_code` in v10.0.0 provides semantic clarity - the field describes mounting structure type, not geographic location.

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
platforms (id, station_id, normalized_name, display_name, ecosystem_code, mount_type_code, ...)
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

## Security Architecture (v8.5.3-8.5.7)

### Authentication & Authorization
- **JWT with HMAC-SHA256**: Secure token signing (v8.5.4)
- **Role-based access control (RBAC)**: admin, station, readonly roles
- **Session management**: Token expiration and refresh
- **Activity logging**: Full audit trail for all operations

### CSRF Protection (v8.5.7)
Located in `src/utils/csrf.js`:
```javascript
import { csrfProtect, createCSRFErrorResponse } from './utils/csrf.js';

// Validates Origin/Referer headers for state-changing requests
const csrfResult = csrfProtect(request);
if (!csrfResult.isValid) {
    return createCSRFErrorResponse(csrfResult.error);
}
```

**Features:**
- Origin/Referer header validation
- Whitelist of allowed origins (production + development)
- Form submission content-type detection
- Automatic bypass for auth/health endpoints

### Input Sanitization Framework (v8.5.7)
Located in `src/utils/validation.js`:

| Function | Purpose | Example |
|----------|---------|---------|
| `sanitizeString()` | Remove control chars, trim, max length | `sanitizeString(input, { maxLength: 200 })` |
| `sanitizeInteger()` | Validate and bound integers | `sanitizeInteger(value, { min: 1, max: 100 })` |
| `sanitizeFloat()` | Validate floats with precision | `sanitizeFloat(value, { decimals: 6 })` |
| `sanitizeCoordinate()` | Lat/lon with 6 decimal precision | `sanitizeCoordinate(lat, 'latitude')` |
| `sanitizeIdentifier()` | Alphanumeric + underscores | `sanitizeIdentifier(name)` |
| `sanitizeAcronym()` | Uppercase 2-10 chars | `sanitizeAcronym('SVB')` |
| `sanitizeJSON()` | Safe JSON parsing | `sanitizeJSON(pointsData)` |
| `sanitizeEnum()` | Whitelist validation | `sanitizeEnum(status, ['Active', 'Inactive'])` |
| `sanitizeDate()` | ISO date format | `sanitizeDate('2025-01-15')` |
| `sanitizeURL()` | Protocol-restricted URLs | `sanitizeURL(websiteUrl)` |

**Schema-based Sanitization:**
```javascript
import { sanitizeRequestBody, PLATFORM_SCHEMA } from './utils/validation.js';

// Sanitize entire request body using predefined schema
const sanitizedData = sanitizeRequestBody(rawData, PLATFORM_SCHEMA);
```

**Pre-defined Schemas:**
- `STATION_SCHEMA` - Station fields
- `PLATFORM_SCHEMA` - Platform fields
- `INSTRUMENT_SCHEMA` - Instrument fields
- `ROI_SCHEMA` - ROI fields

### XSS Prevention (v8.5.5-8.5.6)

**Event Delegation Pattern:**
```javascript
// BAD: Inline onerror handler (XSS vulnerable)
<img onerror="this.parentElement.classList.add('no-image')">

// GOOD: Data attribute + event delegation (v8.5.6)
<img data-fallback="true">

// In app.js - capture phase listener
window.addEventListener('error', (event) => {
    if (event.target?.tagName === 'IMG' && event.target.dataset.fallback === 'true') {
        event.target.parentElement?.classList.add('no-image');
        event.target.style.display = 'none';
    }
}, true);
```

**Safe DOM Methods:**
```javascript
// BAD: innerHTML with user data
element.innerHTML = `<a href="${userUrl}">${userName}</a>`;

// GOOD: createElement + textContent (v8.5.6)
const link = document.createElement('a');
link.href = sanitizeUrl(userUrl);
link.textContent = userName;  // Safe - auto-escapes
element.appendChild(link);
```

**URL Sanitization:**
```javascript
// Prevent javascript: protocol injection
function _sanitizeUrl(url) {
    if (!url) return '/';
    if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return '/';
}
```

### Debug Utilities (v8.5.6)
Located in `public/js/core/debug.js`:
```javascript
// Environment-aware logging - only logs in development
Debug.log('Processing data:', data);      // Only in dev
Debug.warn('Deprecated function');        // Always shows
Debug.error('Critical failure', error);   // Always shows

// Category-based logging
const apiDebug = Debug.withCategory('API');
apiDebug.log('Request sent');  // [API] Request sent

// Performance timing
Debug.time('dataLoad');
// ... operation
Debug.timeEnd('dataLoad');  // dataLoad: 145.23ms
```

### Rate Limiting (v8.5.6)
Located in `public/js/core/rate-limit.js`:
```javascript
// Debounce for input fields
const debouncedSearch = debounce(searchFunction, 300);

// Throttle for scroll/resize
const throttledUpdate = throttle(updateFunction, 1000);

// Form submission guard (prevents double-clicks)
const guardedSubmit = RateLimit.submissionGuard.guard(
    'instrument-form',
    submitFunction,
    'Please wait before submitting again'
);
```

### Code Quality
- Prefer clean, functional code over backward compatibility
- Use absolute imports
- Always bump version and update changelog before commit
- Use git worktrees for parallel development
- Remove console.log statements before production (57 removed in v8.5.6)

### Data Integrity
- Input validation on all user inputs (schema-based)
- Foreign key constraints with CASCADE (v8.5.5)
- JSON parsing with try-catch error handling
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
| `docs/FUTURE_PLATFORM_TYPES.md` | Mobile, USV, UUV platform specifications |
| `docs/roi/ROI_README.md` | ROI system documentation |
| `docs/deprecated/` | Archived documentation |

### Security Documentation in CHANGELOG.md

| Version | Security Focus |
|---------|----------------|
| v8.5.7 | Input Sanitization Framework, CSRF Protection |
| v8.5.6 | XSS Prevention, Debug Utilities, Rate Limiting |
| v8.5.5 | Database CASCADE Fixes, Card XSS Fixes |
| v8.5.4 | JWT HMAC-SHA256, AOI Authentication |
| v8.5.3 | Modal Null Checks, Loading States |

---

## YAML Configuration System (v8.5.0)

All hardcoded configurations have been moved to YAML files:

| Config File | Purpose |
|-------------|---------|
| `yamls/ui/platform-types.yaml` | Platform icons, colors, gradients |
| `yamls/ui/instrument-types.yaml` | Instrument icons, colors, patterns |
| `yamls/ui/status-indicators.yaml` | Status codes with styling |
| `yamls/ui/sensor-orientations.yaml` | Sensor orientations |
| `yamls/sensors/uav-sensors.yaml` | UAV sensor specifications |
| `yamls/core/ecosystems.yaml` | Ecosystem codes |
| `yamls/core/validation-rules.yaml` | Validation constraints |

Access via `window.SitesConfig`:
```javascript
SitesConfig.getPlatformType('uav')
SitesConfig.getStatusColor('Active')
SitesConfig.detectInstrumentCategory('Phenocam')
```

---

## Production Information

| Property | Value |
|----------|-------|
| Production URL | https://sites.jobelab.com |
| Worker URL | https://sites-spectral-instruments.jose-e5f.workers.dev |
| Current Version | 9.0.27 |
| Last Deployed | 2025-12-05 |
| Status | Production-Ready - V3 API |
| Environment | Cloudflare Workers + D1 Database |
| Active Platform Types | Fixed, UAV, Satellite |
| Coming Soon | Mobile, USV, UUV |

### Security Features (v8.5.3-8.5.7)

| Feature | Version | Status |
|---------|---------|--------|
| JWT HMAC-SHA256 Signing | v8.5.4 | ✅ Active |
| XSS Prevention (Event Delegation) | v8.5.6 | ✅ Active |
| XSS Prevention (DOM Methods) | v8.5.6 | ✅ Active |
| CSRF Protection | v8.5.7 | ✅ Active |
| Input Sanitization Framework | v8.5.7 | ✅ Active |
| Debug Utilities | v8.5.6 | ✅ Active |
| Rate Limiting | v8.5.6 | ✅ Active |
| CASCADE Constraints | v8.5.5 | ✅ Active |
