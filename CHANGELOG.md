# Changelog

All notable changes to the SITES Spectral Stations & Instruments Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Legacy Versions**: For changelog entries v11.x and earlier, see [[docs/legacy/CHANGELOG_V11_AND_EARLIER|Legacy Changelog]].

---

## [Unreleased]

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
