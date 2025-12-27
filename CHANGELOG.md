# Changelog

All notable changes to the SITES Spectral Stations & Instruments Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Legacy Versions**: For changelog entries v11.x and earlier, see [[docs/legacy/CHANGELOG_V11_AND_EARLIER|Legacy Changelog]].

---

## [Unreleased]

---

## [13.19.0] - 2025-12-27

### WCAG 2.4.3 Focus Trap Implementation

Added accessible focus management for all modal dialogs to ensure keyboard-only users cannot Tab outside modal boundaries.

#### New Files

**Focus Trap Utility** (`public/js/core/focus-trap.js`)
- Reusable WCAG 2.4.3 compliant focus trap class
- Circular Tab/Shift+Tab navigation within containers
- Auto-focus first element on activation
- Return focus to trigger element on deactivation
- Tracks visible focusable elements dynamically
- Exported as `window.FocusTrap` and `window.SitesFocusTrap`

#### Updated Modal Systems

**BaseModal** (`modal-system.js`)
- Added `_focusTrap` property to constructor
- Activate focus trap on `open()` method
- Deactivate focus trap on `close()` method
- Fallback to basic focus management if FocusTrap not available

**SitesComponents** (`components.js`)
- Added `_focusTraps` Map for multiple modal tracking
- Focus trap activation in `showModal()`
- Focus trap cleanup in `closeModal()` and `closeAllModals()`

**AOIModal** (`aoi/aoi-modal.js`)
- Added `_focusTrap` property to constructor
- Focus trap activation after modal animation
- Focus trap cleanup before modal removal

#### WCAG Compliance

- **WCAG 2.4.3**: Focus Order - Focus trapped within modal dialogs
- **Keyboard Navigation**: Tab cycles through modal elements only
- **Shift+Tab**: Wraps from first element to last element
- **Focus Restoration**: Returns focus to trigger on close

#### Technical Details

```javascript
// FocusTrap class usage
const trap = new FocusTrap(modalContainer, {
    autoFocus: true,    // Focus first element on activate
    returnFocus: true   // Restore focus on deactivate
});
trap.activate();
// ... modal interaction
trap.deactivate();
```

---

## [13.18.0] - 2025-12-27

### Security Consolidation - escapeHtml Functions

Consolidated 24 duplicate `escapeHtml` implementations across the codebase to use the central `core/security.js` module.

#### Changes

All implementations now delegate to `SitesSecurity.escapeHtml` with a compact inline fallback:

**Files Updated (20 files):**
- `campaigns/campaign-manager.js` - Class method
- `components.js` - Utility method
- `dashboard.js` - Class method
- `instruments/*/` - All modal and card files (12 files)
- `modals/modal-base.js` - Base class method
- `modals/form-field.js` - Static method
- `modals/sections/` - Timeline and shared sections (3 files)
- `platforms/platform-type-filter.js` - Class method
- `utils/toast.js` - Class method

#### Pattern Applied

```javascript
// Before: Inline implementation (6-12 lines)
_escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        // ... more replacements
}

// After: Delegation with fallback (1 line)
_escapeHtml(str) {
    return global.SitesSecurity?.escapeHtml?.(str) ?? (str ? String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]) : '');
}
```

#### Benefits

- **Single Source of Truth**: All XSS protection logic in `core/security.js`
- **Consistent Behavior**: Same escaping algorithm everywhere
- **Backward Compatible**: Fallback if security.js not loaded
- **Reduced Code**: ~200 lines removed across codebase

---

## [13.17.0] - 2025-12-27

### CSS Extraction - AOI Modal

Separation of concerns: extracted inline CSS from AOI modal JavaScript to external stylesheet.

#### New Files

**AOI Modal Stylesheet** (`public/css/aoi-modal.css`)
- Extracted ~270 lines of CSS from aoi-modal.js
- Complete modal styling including overlay, container, form elements
- Responsive breakpoints for mobile (≤900px)
- Proper CSS organization with sections

#### Changes

- **aoi-modal.js**: Reduced from 1,008 to 715 lines
  - Removed inline CSS injection
  - Now loads external stylesheet via `<link>` element
  - Version-tagged stylesheet URL for cache busting

#### Code Quality

- **instrument-manager.js**: Reviewed (923 lines)
  - Already well-structured with proper patterns
  - Uses ConfigLoader for YAML-based configuration
  - Event-driven architecture with proper encapsulation
  - No refactoring needed

---

## [13.16.0] - 2025-12-27

### Frontend Modularization (Phase 3.4)

This release modularizes the station dashboard, extracting reusable components with XSS-safe DOM rendering.

#### New Dashboard Modules

**Campaign Panel** (`public/js/dashboard/campaign-panel.js`)
- Extracted from station-dashboard.js
- Self-contained component with callbacks for create/view actions
- XSS-safe rendering using createElement and textContent
- Empty state with conditional create button

**Product Panel** (`public/js/dashboard/product-panel.js`)
- Extracted from station-dashboard.js
- Self-contained component with view callback
- XSS-safe rendering using createElement
- Product level badges and download links

**Station Map** (`public/js/dashboard/station-map.js`)
- Extracted from station-dashboard.js
- Wrapper around sitesMap library
- Simplified API for station and platform markers
- Fallback support for direct Leaflet usage

#### Changes

- **station-dashboard.js**: Updated to use extracted panel components
  - Delegation pattern for campaigns, products, and map
  - Graceful fallback if components not loaded
  - Reduced coupling between dashboard and rendering logic
- **station-dashboard.html**: Added script references for new modules
- **spectral.html**: Added script references for new modules

---

## [13.15.0] - 2025-12-27

### ES6 Module Migration with Vite (Phase 9.5)

This release introduces ES6 module support using Vite as the build tool, enabling modern JavaScript features and better code organization.

#### Build System

**Vite Configuration** (`vite.config.js`)
- Multi-entry build (main, login, dashboard)
- Manual chunking for better caching:
  - `core.bundle.js` - Security, utilities, configuration
  - `api.bundle.js` - API client with V3Response
  - `components.bundle.js` - Toast, Modal, Skeleton
- Path aliases: @, @core, @api, @components, @utils
- Source maps for debugging
- ES2020 target for modern browsers
- Manifest generation for asset tracking

#### New ES6 Modules

**Core Modules** (`src/frontend/core/`)
- `security.js` - XSS-safe DOM utilities (escapeHtml, sanitizeUrl, createElement)
- `utils.js` - Utility functions (debounce, throttle, formatDate, etc.)
- `config.js` - Application configuration (PLATFORM_TYPES, INSTRUMENT_TYPES, STATUS_CONFIG)

**Component Modules** (`src/frontend/components/`)
- `toast.js` - Toast notification system using safe DOM methods
- `modal.js` - Modal dialog with focus trap (WCAG 2.4.3 compliant)
- `skeleton.js` - Skeleton loading components

**API Module** (`src/frontend/api/`)
- `client.js` - Full API client with authentication
  - V3Response class for pagination support
  - Station, Platform, Instrument, Campaign, Product APIs
  - Maintenance and Calibration timeline APIs
  - Spatial queries (bbox, near)

**Entry Points** (`src/frontend/`)
- `main.js` - Main application entry
- `login.js` - Login page entry (minimal bundle)
- `dashboard.js` - Dashboard entry (full bundle)

#### Backward Compatibility

- Global namespace `window.SitesSpectral` for gradual migration
- Existing IIFE scripts continue to work
- ES6 modules load alongside existing scripts

#### Build Output

```
public/dist/
├── main.bundle.js           (~1 KB gzip)
├── login.bundle.js          (~0.9 KB gzip)
├── dashboard.bundle.js      (~1 KB gzip)
└── chunks/
    ├── core.bundle.js       (~2.5 KB gzip)
    ├── api.bundle.js        (~2.6 KB gzip)
    └── components.bundle.js (~3 KB gzip)
```

#### NPM Scripts

- `npm run dev:frontend` - Vite development server
- `npm run build:frontend` - Build ES6 bundles
- `npm run deploy` - Build all and deploy (includes frontend)

#### HTML Updates

All HTML files updated to include ES6 module bundles:
- `index.html` - login.bundle.js
- `login.html` - login.bundle.js
- `sites-dashboard.html` - dashboard.bundle.js
- `station-dashboard.html` - dashboard.bundle.js
- `spectral.html` - main.bundle.js

#### Benefits

1. **Tree Shaking**: Unused code automatically removed
2. **Code Splitting**: Shared code in separate chunks
3. **Smaller Bundles**: ~28 KB total (vs ~50 KB unoptimized)
4. **Better Caching**: Stable chunk names with content hashing option
5. **Modern Syntax**: ES6 imports/exports, async/await
6. **Type Safety**: JSDoc annotations for IDE support
7. **Explicit Dependencies**: Clear import graph

---

## [13.14.0] - 2025-12-27

### Formal Design System (Phase 9.4)

This release introduces a formal design system with centralized design tokens for consistent styling across the application.

#### New File

**CSS Design Tokens** (`public/css/design-system.css`)
- Comprehensive design token foundation

#### Design Token Categories

**1. Color Palette**
- Brand colors (primary, primary-light, primary-dark, primary-bg)
- Semantic colors (success, warning, error, info) with light/dark variants
- Neutral gray scale (50-900)
- Background, text, and border color tokens

**2. Typography**
- Font families (sans-serif, monospace)
- Font sizes (modular scale 1.25): xs through 4xl
- Font weights: light through bold
- Line heights and letter spacing

**3. Spacing Scale**
- Base unit: 4px (0.25rem)
- Scale: space-0 through space-24
- Consistent padding/margin utilities

**4. Shadows & Elevation**
- xs through 2xl shadow tokens
- Focus ring shadow for accessibility

**5. Borders & Radii**
- Border widths (none, thin, medium, thick)
- Border radius (none through full)

**6. Transitions**
- Duration tokens (fast, normal, slow, slower)
- Easing functions (in, out, in-out, bounce)
- Common transition presets

**7. Z-Index Scale**
- Structured layering (behind, base, dropdown, sticky, fixed, modal, popover, tooltip, toast, max)

**8. Component Tokens**
- Buttons: padding, radius, min-height
- Inputs: padding, border, focus states
- Cards: padding, shadow, background
- Modals: padding, max-height, backdrop
- Badges, tables, navigation, toasts

#### Dark Mode Support

- Automatic dark mode via `prefers-color-scheme: dark`
- Overridden background, text, and border colors

#### BEM Utility Classes

- Typography utilities (.text--xs, .font--bold, etc.)
- Spacing utilities (.m-4, .p-6, .gap-3, etc.)
- Border radius utilities (.rounded--lg, .rounded--full, etc.)
- Shadow utilities (.shadow--md, .shadow--lg, etc.)
- Focus ring (.focus-ring)

#### BEM Component Blocks

- Card block (.card, .card__header, .card__body, .card__footer, .card--hover)
- Badge block (.badge, .badge--success, .badge--warning, etc.)
- Status indicator block (.status-indicator, .status-indicator--active, etc.)

#### Integration

- Added as first stylesheet to: index.html, login.html, sites-dashboard.html, station-dashboard.html, spectral.html
- Provides foundation for all other stylesheets

---

## [13.13.0] - 2025-12-27

### Mobile Responsive Enhancements (Phase 9.3)

This release adds comprehensive mobile responsiveness improvements for better user experience on tablets and mobile devices.

#### New File

**CSS Styles** (`public/css/mobile-enhancements.css`)
- Comprehensive mobile responsiveness stylesheet

#### Touch Target Sizing (WCAG 2.5.5)

- Minimum 44x44px touch targets for all buttons
- Enhanced form input sizing for mobile
- Larger tap areas for icon-only buttons
- Touch-friendly checkbox and radio inputs

#### Breakpoints

- **1024px (Tablet Landscape)**: Dashboard layout adjustments, 2-column grids, horizontal table scroll
- **768px (Mobile)**: Single column layouts, stacked form actions, horizontal tab scroll
- **480px (Small Mobile)**: Compact cards, stacked button groups

#### Modal Improvements

- `max-height: 90vh` / `90dvh` for modal content
- Sticky modal headers during scroll
- Bottom-drawer style modals on mobile
- Safe area insets for notched devices (iPhone X+)

#### Hamburger Navigation

- Mobile navigation toggle with animated icon
- Full-screen overlay navigation menu
- Smooth open/close transitions

#### Touch-Friendly Interactions

- Disabled hover effects on touch devices
- Active state feedback on touch
- Smooth scrolling for scrollable areas
- Landscape orientation optimizations

#### Safe Area Insets

- Support for devices with notches (iPhone X+)
- Proper padding for dashboard header
- Modal bottom padding for safe areas

#### Integration

- Added to all HTML files: index.html, login.html, sites-dashboard.html, station-dashboard.html, spectral.html

---

## [13.12.0] - 2025-12-27

### Skeleton Screen Components (Phase 9.2)

This release adds skeleton loading screen components for improved perceived performance during data loading. The skeleton screens provide content-shaped placeholders with shimmer/pulse animations.

#### New Files

**CSS Styles** (`public/css/skeleton.css`)
- Shimmer animation for standard motion preferences
- Pulse animation for reduced-motion accessibility (WCAG compliant)
- Dark mode support via `prefers-color-scheme: dark`
- Component patterns: station cards, platform cards, table rows, instrument items, stat cards, charts, modals

**JavaScript Utilities** (`public/js/core/skeleton.js`)
- XSS-safe implementation using DOM methods (no innerHTML)
- Factory methods for skeleton elements:
  - `Skeleton.text()` - Text line placeholders
  - `Skeleton.avatar()` - Circular avatar placeholders
  - `Skeleton.image()` - Image placeholders with aspect ratio
  - `Skeleton.button()` - Button placeholders
  - `Skeleton.block()` - Custom block placeholders
  - `Skeleton.stationCard()` - Complete station card skeleton
  - `Skeleton.platformCard()` - Platform card with instruments
  - `Skeleton.tableRow()` - Table row skeleton
  - `Skeleton.instrumentItem()` - Instrument list item skeleton
  - `Skeleton.statCard()` - Statistics card skeleton
  - `Skeleton.chart()` - Chart placeholder skeleton
  - `Skeleton.formField()` - Form field skeleton
  - `Skeleton.modalForm()` - Complete modal form skeleton
  - `Skeleton.showIn()` - Replace container with skeleton, returns restore function
  - `Skeleton.repeat()` - Create multiple skeleton elements
  - `Skeleton.stationList()` - Multiple station card skeletons
  - `Skeleton.platformList()` - Multiple platform card skeletons
  - `Skeleton.table()` - Table skeleton with rows
  - `Skeleton.statsGrid()` - Grid of stat cards
  - `Skeleton.instrumentList()` - List of instrument items

#### Integration

- Added skeleton.css to station-dashboard.html and sites-dashboard.html
- Added skeleton.js to station-dashboard.html and sites-dashboard.html
- Version parameter added for cache-busting (v13.12.0)

#### Accessibility

- Respects `prefers-reduced-motion` media query
- Uses subtle pulse animation instead of shimmer for motion-sensitive users
- High enough contrast for visibility
- Non-blocking loading indicators

---

## [13.11.0] - 2025-12-27

### Complete Platform Types (Phase 8.4)

This release implements full support for Mobile, USV, and UUV platform types.

#### New Platform Type Strategies

**MobilePlatformType** (`src/domain/platform/types/MobilePlatformType.js`)
- Naming pattern: `{STATION}_{ECOSYSTEM}_{CARRIER}_{MOUNT_TYPE_CODE}`
- Example: `SVB_FOR_BPK_MOB01`
- Carrier types: VEH (Vehicle), BPK (Backpack), BIC (Bicycle), BOT (Boat), ROV (Rover), OTH (Other)
- Fields: carrier_type, carrier_model, power_type, typical_speed_kmh, range_km, runtime_hours

**USVPlatformType** (`src/domain/platform/types/USVPlatformType.js`)
- Naming pattern: `{STATION}_{ECOSYSTEM}_{MOUNT_TYPE_CODE}`
- Example: `ANS_LAK_USV01`
- Hull types: monohull, catamaran, trimaran, inflatable
- Propulsion: electric, gasoline, hybrid, solar, jet
- Fields: usv_model, manufacturer, hull_type, propulsion_type, length_m, max_payload_kg, max_speed_knots, endurance_hours, navigation_system, control_mode

**UUVPlatformType** (`src/domain/platform/types/UUVPlatformType.js`)
- Naming pattern: `{STATION}_{ECOSYSTEM}_{MOUNT_TYPE_CODE}`
- Example: `ANS_LAK_UUV01`
- UUV types: rov (tethered), auv (autonomous), hybrid
- Navigation: DVL, USBL, INS, Visual SLAM, Combined
- Fields: uuv_type, uuv_model, manufacturer, max_depth_m, typical_depth_m, propulsion_type, num_thrusters, tether_length_m, lighting_lumens, has_manipulator

#### Frontend Form Generators

Added complete form generators for all three new platform types:
- `generateMobilePlatformForm()` - Carrier specifications section
- `generateUSVPlatformForm()` - USV specifications with hull and propulsion options
- `generateUUVPlatformForm()` - UUV specifications with depth ratings and ROV/AUV options

#### Platform Type Registry

Updated `src/domain/platform/types/index.js` to register all 6 platform types:
- Fixed (active)
- UAV (active)
- Satellite (active)
- Mobile (new)
- USV (new)
- UUV (new)

#### Architecture Compliance

All new platform types follow SOLID principles and Hexagonal Architecture:
- **Single Responsibility**: Each strategy handles one platform type
- **Open/Closed**: New types added without modifying existing code
- **Liskov Substitution**: All strategies implement PlatformTypeStrategy interface
- **Dependency Inversion**: Domain depends on abstractions, not concretions

---

## [13.10.0] - 2025-12-27

### Audit Log Endpoint (Phase 8.3)

This release implements the admin audit log endpoint for viewing activity history.

#### New Endpoint

**GET /api/admin/audit** - List audit logs with filtering and pagination

**Query Parameters:**
- `station_id` - Filter by station ID
- `user_id` - Filter by user ID
- `action` - Filter by action type (CREATE, UPDATE, DELETE, READ)
- `entity_type` - Filter by entity type (station, platform, instrument, etc.)
- `start_date` - Filter from date (ISO format)
- `end_date` - Filter to date (ISO format)
- `limit` - Results per page (default: 100, max: 500)
- `offset` - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": 1,
        "username": "admin",
        "action": "CREATE",
        "entity_type": "instrument",
        "entity_id": 42,
        "entity_name": "SVB_FOR_TWR01_PHE01",
        "station_id": 1,
        "station_acronym": "SVB",
        "details": {},
        "ip_address": "192.168.1.1",
        "created_at": "2025-12-27T14:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 100,
      "offset": 0,
      "has_more": true
    }
  }
}
```

**Features:**
- Role-based access (admin only)
- Automatic logging of audit access
- Integration with existing D1AdminRepository
- Proper error handling

---

## [13.9.0] - 2025-12-27

### D1 Repository Adapters Complete (Phase 8.2)

This release completes the D1 repository adapters to fully implement all port methods.

#### D1MaintenanceRepository

Added 10 missing methods:
- `findByEntity(entityType, entityId)` - Find records by entity type and ID
- `findByStatus(status)` - Find by maintenance status
- `findByType(maintenanceType)` - Find by maintenance type
- `findScheduled()` - Find all scheduled maintenance
- `findByDateRange(startDate, endDate)` - Find within date range
- `findNextScheduled(entityType, entityId)` - Get next scheduled maintenance
- `findLastCompleted(entityType, entityId)` - Get last completed maintenance
- `countByEntity(entityType, entityId)` - Count records for entity
- `existsById(id)` - Check if record exists
- `getStatistics(entityType, entityId)` - Get maintenance statistics

#### D1CalibrationRepository

Added 11 missing methods:
- `findByStationId(stationId)` - Find all calibrations for a station
- `findByType(calibrationType)` - Find by calibration type
- `findByStatus(status)` - Find by status
- `findExpiringSoon(days)` - Alias for findExpiringWithin
- `findByDateRange(startDate, endDate)` - Find within date range
- `findByLaboratory(laboratory)` - Find by laboratory name
- `findByCertificateNumber(certificateNumber)` - Find by certificate
- `findLastCalibration(instrumentId)` - Get most recent calibration
- `countByInstrumentId(instrumentId)` - Count calibrations for instrument
- `existsById(id)` - Check if record exists
- `supersedeOldCalibrations(instrumentId, newId)` - Mark old calibrations superseded

---

## [13.8.0] - 2025-12-27

### Frontend TODOs Complete (Phase 8.1)

This release completes pending frontend functionality.

#### MS Sensor Edit Form Population

**File:** `public/js/ms-sensor-modal.js`

Implemented `populateEditForm()` function to populate the 5-tab MS sensor edit modal:
- Basic info tab: display_name, instrument_type, sensor_brand, sensor_model, serial, orientation, channels
- Position tab: latitude, longitude, height, azimuth, nadir, field of view, ecosystem
- Datalogger tab: cable_length, datalogger_type, programs
- Calibration tab: dates and notes
- Notes tab: description, installation_notes

#### UAV Drone Model Dropdown

**File:** `public/js/platform-forms/index.js`

Implemented `updateDroneModels()` using safe DOM methods (no innerHTML):
- DJI: Multispectral (M3M, P4M), Enterprise (M30T, M300, M350), Consumer (M3P, AIR3)
- Parrot: Professional (ANAFI, BLUEGRASS), Legacy (SEQUOIA, DISCO-AG)
- Autel: EVO Series, Enterprise (DRAGONFISH)
- senseFly: eBee series, Cameras
- MicaSense: RedEdge-MX, RedEdge-P, Altum-PT, Altum
- Headwall: Nano-Hyperspec, Micro-Hyperspec, CO2 Mapper

#### Configuration Loader Documentation

**File:** `public/js/modals/example-integration.js`

Updated configuration loaders with clear documentation:
- Static data approach documented as intentional design choice
- Performance rationale: avoids API latency for rarely-changing config
- Migration path documented if dynamic config is needed

---

## [13.7.0] - 2025-12-27

### Architecture Visualization (Phase 7.9)

This release adds comprehensive architecture visualization documentation for developers.

#### New Documentation

**New File:** `docs/ARCHITECTURE_VISUALIZATION.md`

Visual representations of the SITES Spectral architecture including:

1. **Clean Architecture Rings**
   - Ring 1: Domain (Entities, Value Objects, Ports)
   - Ring 2: Application (Commands, Queries)
   - Ring 3: Interface Adapters (Controllers, Repositories)
   - Ring 4: Frameworks & Drivers (Cloudflare Workers, D1)

2. **Hexagonal Architecture Diagram**
   - Driving side (HTTP, Admin Console, CLI)
   - Inbound Ports (Use Cases)
   - Domain Core (Entities, Ports)
   - Outbound Ports (Repository interfaces)
   - Driven side (D1, EventBus, Metrics)

3. **Component Inventory**
   - 12 domain modules
   - 33 commands, 26+ queries
   - 13 controllers, 12 D1 repositories

4. **Data Flow Diagrams**
   - Read operation (Query) sequence
   - Write operation (Command) sequence
   - Dashboard aggregation pattern

5. **Additional Sections**
   - Directory structure reference
   - Port-Adapter mapping table
   - Platform Type Strategy pattern
   - CQRS pattern visualization
   - Key design decisions with ADR links

#### Updated Documentation

- Added architecture docs to CLAUDE.md Documentation Index
- Links to ADRs, OpenAPI spec, and port versioning docs

---

## [13.6.0] - 2025-12-27

### Architectural Decision Records (Phase 7.8)

This release adds formal ADRs to document the architectural decisions made during the refactoring effort.

#### New ADRs

**ADR-006: OpenAPI Contract-First Design**

Documents the adoption of OpenAPI 3.0 for API specification:
- Central specification as single source of truth
- Contract validation middleware for request validation
- Build-time spec validation in CI/CD
- Coverage: 33 paths, 51 operations, 49 schemas

**ADR-007: Port Versioning Strategy**

Documents the port versioning strategy for safe evolution:
- Version metadata and VersionedPort base class
- Port registry for version discovery
- Adapter migration factory for backward compatibility
- Multi-hop migration support

#### Updated Documentation

- Updated `docs/adr/README.md` with ADR-006 and ADR-007 in index
- Total ADRs now: 7 (ADR-001 through ADR-007)

#### ADR Coverage

| ADR | Topic | Status |
|-----|-------|--------|
| ADR-001 | Hexagonal Architecture Adoption | Accepted |
| ADR-002 | CQRS for Read/Write Separation | Accepted |
| ADR-003 | Legacy ROI System Preservation | Accepted |
| ADR-004 | Domain Events for Audit Trail | Accepted |
| ADR-005 | Security Ports Pattern | Accepted |
| ADR-006 | OpenAPI Contract-First Design | Accepted |
| ADR-007 | Port Versioning Strategy | Accepted |

---

## [13.5.0] - 2025-12-27

### Port Versioning Strategy (Phase 7.7)

This release implements a comprehensive port versioning strategy for safe evolution of port interfaces without breaking existing adapters.

#### Versioning Infrastructure

**New Files:**

- `src/domain/shared/versioning/PortVersion.js` - Version metadata, base classes, registry
- `src/domain/shared/versioning/VersionedPortAdapter.js` - Adapter wrapping, migration factory
- `src/domain/shared/versioning/index.js` - Module exports

**Key Classes:**

- `PortVersion` - Version metadata with deprecation support
- `VersionedPort` - Base class for versioned port interfaces
- `PortRegistry` - Registry for managing multiple port versions
- `VersionedPortAdapter` - Wrapper for migrating adapters between versions
- `AdapterMigrationFactory` - Factory for creating migration paths

#### Example Implementation

**User Repository Versions:**

- `src/domain/user/UserRepositoryV1.js` - Basic CRUD operations
- `src/domain/user/UserRepositoryV2.js` - Extended with email lookup, permissions, activity tracking
- `src/domain/user/UserRepositoryMigrations.js` - V1 -> V2 migration factory

**V2 New Methods:**
- `findByEmail(email)` - Look up users by email
- `findByStationWithPermissions(stationId)` - Get users with permission details
- `updateLastLogin(userId, timestamp)` - Track user login activity
- `hasPermission(userId, permission, context)` - Check specific permissions
- `findByPermission(permission, context)` - Find users with specific permission
- `getActivitySummary(userId, options)` - Get user activity summary
- `bulkCheckPermission(userIds, permission, context)` - Bulk permission check

#### Migration Support

```javascript
import { migrateUserRepositoryV1ToV2 } from './domain/user/index.js';

// Migrate V1 adapter to V2
const v2Adapter = migrateUserRepositoryV1ToV2(v1Adapter);
```

#### Documentation

**New File:** `docs/PORT_VERSIONING.md`

Comprehensive documentation covering:
- Versioning convention
- Backward compatibility rules
- Creating new port versions
- Migration paths
- Best practices

---

## [13.4.0] - 2025-12-27

### API Contract-First Design (Phase 7.6)

This release implements OpenAPI 3.0 specification and contract validation for the SITES Spectral API.

#### OpenAPI 3.0 Specification

**New File:** `docs/openapi/openapi.yaml`

Complete API specification covering:
- 50+ endpoint paths with full documentation
- 30+ schema definitions
- Authentication (Bearer JWT, Cookie)
- Response types and error formats
- Parameter validation rules
- Standards alignment (Darwin Core, ICOS, Copernicus)

**Endpoints Documented:**
- Authentication: login, verify, logout
- Stations: CRUD, dashboard
- Platforms: CRUD, by-station, by-type
- Instruments: CRUD, by-platform, by-station, details
- Maintenance: CRUD, timeline, pending, overdue, complete
- Calibrations: CRUD, timeline, current, expired, expiring, expire
- ROIs: CRUD with legacy system support
- System: health, info, version

#### Contract Validation Middleware

**New File:** `src/middleware/contract-validator.js`

Features:
- Request body validation against schemas
- Query parameter validation
- Enum value validation (platform types, status codes, etc.)
- Pattern validation (email, URL, date formats)
- Required field validation
- Type coercion and constraints

**Exported Schemas:**
```javascript
SCHEMAS = {
  PlatformType: ['fixed', 'uav', 'satellite', 'mobile', 'usv', 'uuv'],
  MountTypeCode: ['TWR', 'BLD', 'GND', 'UAV', 'SAT', 'MOB', 'USV', 'UUV'],
  EcosystemCode: ['FOR', 'AGR', 'GRA', ...],
  InstrumentType: ['phenocam', 'multispectral', 'par', ...],
  Status: ['Active', 'Inactive', 'Maintenance', 'Decommissioned'],
  // ... and more
}
```

#### OpenAPI Validator Script

**New File:** `scripts/validate-openapi.js`

Validates OpenAPI specification:
- Structure validation (required fields)
- Path and operation validation
- Schema reference validation
- Security scheme validation
- Generates detailed report

#### Build Integration

**New npm Scripts:**
- `npm run api:validate` - Validate OpenAPI specification
- `npm run api:docs` - Show OpenAPI spec location
- `prebuild` hook runs validation before build

**Dependencies:**
- Added `yaml` package for YAML parsing

---

## [13.3.0] - 2025-12-27

### Composition Root Enhancement (Phase 7.5)

This release centralizes all dependency injection wiring in a single Composition Root, following hexagonal architecture best practices.

#### Enhanced Container (`src/container.js`)

**Features:**
- Environment-based configuration (production, staging, development, test)
- Centralized port ↔ adapter wiring
- All 12 repositories properly wired
- Test container factory with mock dependencies

**Environment Configuration:**
```javascript
const EnvironmentConfig = {
  production: { logLevel: 'info', enableMetrics: true, enableEvents: true },
  staging: { logLevel: 'debug', enableMetrics: true, enableEvents: true },
  development: { logLevel: 'debug', enableMetrics: false, enableEvents: true },
  test: { logLevel: 'error', enableMetrics: false, enableEvents: false }
};
```

#### New Adapters

**Logging:**
- `src/infrastructure/logging/StructuredConsoleLogger.js`
- JSON structured output for Cloudflare Workers
- Log levels: debug, info, warn, error
- Child logger support with context

**Metrics:**
- `src/infrastructure/metrics/NoOpMetricsAdapter.js`
- Placeholder for future Cloudflare Analytics integration
- Counter, gauge, histogram support
- Timer utility for duration measurement

#### Infrastructure Exports

**Updated:** `src/infrastructure/index.js`
- Added ROI, Export, Analytics repositories
- Added InMemoryEventBus export
- Added StructuredConsoleLogger export
- Added NoOpMetricsAdapter export
- Added CloudflareCredentialsAdapter export

#### Container Structure

```
container = {
  environment: 'production',
  config: { logLevel, enableMetrics, enableEvents },
  ports: { logger, metrics, eventBus, credentials },
  repositories: { station, platform, instrument, ... },
  commands: { createStation, updatePlatform, ... },
  queries: { getStation, listPlatforms, ... }
}
```

#### Testing Support

**New Function:** `createTestContainer(overrides)`
- Creates container with mock dependencies
- Override specific repositories or ports
- Automatic mock repository generation

---

## [13.2.0] - 2025-12-27

### Dynamic Version Management

This release eliminates hardcoded version strings throughout the codebase with a centralized, build-time version management system.

#### Centralized Version Module

**New Files:**
- `src/version/index.js` - Auto-generated version module (single source of truth)
- `public/js/core/version.js` - Frontend version utility with caching

#### Version API Endpoint

**New Endpoint:** `GET /api/version`
- Returns application and API version info
- No authentication required (public endpoint)
- Cached for 60 seconds

```json
{
  "app": {
    "version": "13.2.0",
    "major": 13,
    "minor": 2,
    "patch": 0,
    "buildDate": "2025-12-27",
    "buildTimestamp": 1766835731246
  },
  "api": {
    "current": "v11",
    "aliases": { "latest": "v11", "stable": "v11" },
    "supported": ["v11", "v10"]
  }
}
```

#### Build Script Enhancements

**Updated:** `scripts/build.js`
- Auto-generates `src/version/index.js` from package.json
- Updates all HTML files with cache-busting version params
- Generates `public/version-manifest.json` for frontend cache control
- Updates package.json description with version

#### Frontend Version Utility

**Features:**
- `SitesVersion.getVersion()` - Async fetch with caching
- `SitesVersion.getVersionSync()` - Sync access from cache/meta tag
- `SitesVersion.versionUrl(url)` - Cache-busting URL generation
- `SitesVersion.displayVersion(selector)` - Auto-update UI elements
- `SitesVersion.hasVersionChanged()` - Detect version updates

#### Benefits

- **Single Source of Truth**: package.json is the only place to update version
- **Build-Time Generation**: No runtime file reads or hardcoded strings
- **Cache Busting**: All assets automatically versioned
- **API Access**: Frontend can fetch version info dynamically
- **Zero Hardcoding**: Version propagates automatically on build

---

## [13.1.0] - 2025-12-27

### Advanced Architecture Patterns (Phase 7)

This release introduces foundational architecture patterns for event-driven design, observability, and security.

#### Domain Events Infrastructure (Phase 7.1)

**New Files:**
- `src/domain/shared/events/DomainEvent.js` - Base class for all domain events
- `src/domain/shared/events/StationEvents.js` - StationCreated, StationUpdated, StationDeleted
- `src/domain/shared/events/InstrumentEvents.js` - InstrumentCalibrated, MaintenanceCompleted, InstrumentStatusChanged
- `src/domain/shared/events/ROIEvents.js` - ROIModified, ROIMarkedLegacy, TimeseriesBroken
- `src/domain/shared/ports/EventPublisherPort.js` - Port interface for event publishing
- `src/infrastructure/events/InMemoryEventBus.js` - In-memory event bus adapter

#### Observability Ports (Phase 7.2)

**New Files:**
- `src/domain/shared/ports/MetricsPort.js` - Counter, gauge, histogram abstractions
- `src/domain/shared/ports/LoggingPort.js` - Structured logging interface

#### Security Ports (Phase 7.3)

**New Files:**
- `src/domain/shared/ports/SecurityPort.js` - Authentication/authorization port
- Includes `Principal` class for representing authenticated users
- Includes `AuthenticationError` and `AuthorizationError` custom exceptions

#### Architectural Decision Records (Phase 7.8)

**New Files:**
- `docs/adr/README.md` - ADR index and documentation
- `docs/adr/template.md` - Template for new ADRs
- `docs/adr/ADR-001-hexagonal-architecture.md` - Hexagonal Architecture adoption
- `docs/adr/ADR-002-cqrs-pattern.md` - CQRS for read/write separation
- `docs/adr/ADR-003-legacy-roi-system.md` - Legacy ROI system preservation
- `docs/adr/ADR-004-domain-events.md` - Domain events for audit trail
- `docs/adr/ADR-005-security-ports.md` - Security ports pattern

#### Benefits

- **Decoupling**: Business logic separated from infrastructure concerns
- **Testability**: Mock ports for isolated testing
- **Extensibility**: Add new event listeners, metrics adapters without modifying core
- **Documentation**: ADRs capture architectural decisions and rationale

---

## [13.0.0] - 2025-12-27

### Major Release - Production Ready Codebase

This major release consolidates all improvements from the v12.x series and establishes a stable, production-ready codebase with comprehensive test coverage, robust error handling, and clean architecture.

#### Breaking Changes

None from v12.x - this release consolidates stability improvements.

#### Highlights

**Test Coverage (Phase 4)**
- 587 tests across 34 test files
- Application layer: 23 command/query files with full coverage
- Controllers: 14 controller files tested
- Repositories: D1 repository adapters fully tested
- Domain entities and value objects validated

**Code Quality (Phase 5)**
- All API references use `/api/latest` semantic alias
- Automatic version resolution - no hardcoded version numbers
- Legacy files archived in `public/js/archived/`
- Centralized security utilities (`escapeHtml` in `core/security.js`)

**Promise Error Handling (Phase 6)**
- Global `unhandledrejection` handler in `app.js`
- `Promise.allSettled` used for graceful partial failure handling
- Comprehensive `PromiseUtils` module with retry, timeout, pool utilities
- All promise chains have proper `.catch()` handlers

**Documentation**
- Changelog split: v12+ in main, v11 and earlier in legacy
- Obsidian-compatible markdown with wiki-style links
- Updated architecture documentation

#### Migration from v12.x

No migration required - v13.0.0 is fully compatible with v12.x data and APIs.

#### Files Changed

- `package.json`: Version bump to 13.0.0
- `CHANGELOG.md`: Split into current (v12+) and legacy (v11-)
- `docs/legacy/CHANGELOG_V11_AND_EARLIER.md`: New legacy changelog
- `docs/legacy/README.md`: Updated with changelog reference
- `CLAUDE.md`: Updated version references

---

## [12.0.23] - 2025-12-27

### Promise Error Handling (Phase 6)

**Fixed:** Improved promise error handling throughout the frontend to prevent unhandled rejections.

#### Changes

**export.js:**
- Updated `getStationExportData()` to use `Promise.allSettled` for graceful partial failure handling
- Updated `getPlatformExportData()` to use `Promise.allSettled` with proper error logging
- Updated `getInstrumentExportData()` to use `Promise.allSettled` with null/empty array defaults
- Added explicit error messages when primary entity fails to load

**config-loader.js:**
- Updated `preload()` to use `Promise.allSettled` - config loading continues even if some configs fail
- Added per-config failure logging for debugging

**config-service.js:**
- Updated `_loadAllConfigs()` to use `Promise.allSettled` - ensures all configs are attempted
- Added structured status tracking for each config load

**aoi-manager.js:**
- Added `.catch()` handler to `handleSave()` promise chain to prevent unhandled rejections

#### Pre-existing Error Handling
- Global `unhandledrejection` handler in `app.js` (already implemented)
- `PromiseUtils` module in `promise-utils.js` with `allSettledValues`, `safeAll`, `safe`, `withTimeout`, `retry`, `sequence`, `pool` utilities

#### Benefits
- Frontend gracefully handles partial API failures
- Config loading continues even if individual configs fail
- AOI operations properly log errors instead of silently failing
- Consistent error handling patterns across the codebase

---

## [12.0.22] - 2025-12-27

### API Version Cleanup (Phase 5)

**Fixed:** Ensure all frontend code uses `/api/latest` for automatic version resolution instead of hardcoded version numbers.

#### Changes

**platform-type-filter.js:**
- Changed default `apiVersion` from `'v3'` to `'latest'` for automatic version resolution
- Updated JSDoc to recommend using `'latest'`

**api-config.js:**
- Updated deprecated `getV3Path()` to return `/api/latest` instead of `/api/v3`
- Updated deprecated `getV10Path()` to return `/api/latest` instead of `/api/v10`
- Updated deprecation warnings to recommend `getBasePath()` for automatic version resolution

**config-service.js:**
- Changed default API version fallback from `'v3'` to `'latest'`

#### Benefits
- Frontend automatically uses the current API version without code changes
- Version bumps only require updating `yamls/api/api-versions.yaml`
- Eliminates manual version updates across frontend files
- Server-side alias resolution (`/api/latest` -> `/api/v11`) handles version mapping

#### Verified
- Legacy files already archived in `public/js/archived/`
- `escapeHtml` functions already delegate to centralized `core/security.js`
- All 587 tests passing

---

## [12.0.21] - 2025-12-27

### Repository Test Coverage (Phase 4.4)

**Added:** Comprehensive test coverage for D1 repository adapters (infrastructure layer).

#### Repository Tests (3 files, 81 tests)

**D1StationRepository.test.js (19 tests):**
- findById (found, not found)
- findByAcronym (found, uppercase normalization, invalid input)
- findAll (default options, pagination, sort whitelist, platform/instrument counts)
- count (total, null result)
- save (insert new, update existing, return saved)
- delete (success, not found)

**D1PlatformRepository.test.js (28 tests):**
- findById (with instrument count, not found)
- findByNormalizedName (found, uppercase normalization, invalid input)
- findByStationId (filters, sorting, pagination, counts)
- count (by station, total)
- save (insert new, update existing, generate normalized name)
- delete (success, not found)

**D1InstrumentRepository.test.js (34 tests):**
- findById (found, not found)
- findByNormalizedName (found, invalid input)
- findByPlatformId (filters, sorting, pagination)
- findByStationId (cross-platform aggregation)
- count (by platform, by station)
- save (insert, update, generate normalized name)
- delete (success, not found)

---

## [12.0.20] - 2025-12-27

### Controller Test Coverage (Phase 4.3)

**Added:** Comprehensive test coverage for HTTP controllers (driving adapters).

#### Controller Tests (4 files, 106 tests)

**StationController.test.js (28 tests):**
- GET /stations (list, pagination, sorting, error handling)
- GET /stations/:id (found, not found, invalid ID)
- POST /stations (create, validation, duplicate handling)
- PUT /stations/:id (update, partial, not found)
- DELETE /stations/:id (success, not found, forbidden)

**PlatformController.test.js (27 tests):**
- GET /stations/:stationId/platforms (list, filters, pagination)
- GET /platforms/:id (found, not found)
- POST /platforms (create, validation, FK constraint)
- PUT /platforms/:id (update, partial)
- DELETE /platforms/:id (success, cascade behavior)

**InstrumentController.test.js (26 tests):**
- GET /platforms/:platformId/instruments (list, type filter)
- GET /instruments/:id (found, not found)
- POST /instruments (create, validation, type-specific fields)
- PUT /instruments/:id (update, status changes)
- DELETE /instruments/:id (success, ROI cascade)

**AuthController.test.js (25 tests):**
- POST /auth/login (success, invalid credentials, locked account)
- POST /auth/logout (success, invalid token)
- GET /auth/verify (valid token, expired, malformed)
- POST /auth/refresh (success, expired refresh token)
- Authorization middleware (role checks, station access)

---

## [12.0.19] - 2025-12-26

### Application Layer Test Coverage (Phase 4.1-4.2)

**Added:** Comprehensive test coverage for application layer commands and queries.

#### Command Tests (12 files, 99 tests)

Covers all CRUD operations for:
- Stations (create, update, delete)
- Platforms (create, update, delete, type-specific behavior)
- Instruments (create, update, delete, type validation)
- Maintenance records
- Calibration records

#### Query Tests (11 files, 86 tests)

Covers all read operations for:
- Station dashboard aggregation
- Platform listings with filters
- Instrument listings by type
- Timeline queries for maintenance/calibration
- Analytics aggregations

---

## [12.0.0] - 2025-12-17

### Normalized Mount Type Codes (BREAKING CHANGE)

**BREAKING:** All mount type codes normalized to consistent 3 letters.

| Old Code | New Code | Name |
|----------|----------|------|
| `PL` | `TWR` | Tower/Mast |
| `BL` | `BLD` | Building |
| `GL` | `GND` | Ground Level |

#### Impact
- Platform `normalized_name` values change (e.g., `SVB_FOR_PL01` → `SVB_FOR_TWR01`)
- Instrument `normalized_name` values change (e.g., `SVB_FOR_PL01_PHE01` → `SVB_FOR_TWR01_PHE01`)
- API responses reflect new naming convention
- Database Migration 0042 applies changes automatically

---

> **For earlier versions**, see [[docs/legacy/CHANGELOG_V11_AND_EARLIER|Legacy Changelog (v11 and earlier)]].
