# SITES Spectral V3 Documentation

> [!INFO] Version 9.0.16
> This documentation covers the V3 API and associated frontend components for SITES Spectral.
> Last Updated: 2025-12-02

## Documentation Index

### API Documentation

| Document | Description |
|----------|-------------|
| [[API_REFERENCE]] | Complete V3 REST API reference with endpoints, parameters, and examples |
| [[PYTHON_DATABASE_ACCESS]] | Direct database access from Python for automation |

### Frontend Documentation

| Document | Description |
|----------|-------------|
| [[FRONTEND_COMPONENTS]] | Frontend component reference, edit modals, and usage |

### Supporting Resources

| Resource | Location |
|----------|----------|
| Python Scripts | [[../../scripts/python/README\|scripts/python/]] |
| YAML Configs | `yamls/` directory |
| Legacy Docs | [[../legacy/\|docs/legacy/]] |

---

## What's New in v9.0.x

### v9.0.16 - Simplified Admin Controls
- Removed duplicate station controls from header
- Single source of truth for platform controls

### v9.0.15 - Station Acronym Validation
- Strict validation - no 'STA' fallback allowed
- Prevents creation of invalid platforms/instruments

### v9.0.14 - Platform Normalized Name Fix
- UAV platforms now correctly use station acronym (e.g., `ANS_DJI_M3M_UAV01`)

### v9.0.13 - Permission Check Fix
- All permission checks use dashboard instance as primary source
- Fixes "admin privileges required" errors

### v9.0.12 - Platform Controls Visibility
- Platform creation button properly shows for admin/station users

### v9.0.11 - Full Edit Modals
- Complete reactive edit forms for platforms and instruments
- Type-specific instrument forms (Phenocam, Multispectral, PAR, NDVI, PRI, Hyperspectral)

---

## Quick Links

### API Endpoints

- **Stations**: `GET /api/v3/stations`
- **Platforms**: `GET /api/v3/platforms`
- **Instruments**: `GET /api/v3/instruments`
- **Campaigns**: `GET /api/v3/campaigns`
- **Products**: `GET /api/v3/products`

### Default API Version

As of v9.0.0, the default API is V3:
- `/api/stations` → V3 response format
- `/api/v1/stations` → Legacy V1 format (deprecated)

### Key Features

- Pagination with cursor/offset support
- Platform type filtering (fixed, uav, satellite)
- Spatial queries with bounding box
- Campaign management
- Product catalog
- Type-specific instrument edit forms
- Real-time permission checking

---

## Migration from V1

> [!WARNING] V1 Deprecation
> V1 API endpoints are deprecated and will be removed in v10.0.0. Please migrate to V3.

### Response Format Changes

**V1 Response:**
```json
[
  {"id": 1, "name": "Station A"},
  {"id": 2, "name": "Station B"}
]
```

**V3 Response:**
```json
{
  "stations": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  },
  "links": {
    "next": "/api/v3/stations?page=2"
  }
}
```

### Endpoint Mapping

| V1 Endpoint | V3 Endpoint |
|-------------|-------------|
| `GET /api/stations` | `GET /api/v3/stations` |
| `GET /api/platforms` | `GET /api/v3/platforms` |
| `GET /api/instruments` | `GET /api/v3/instruments` |
| `GET /api/rois` | `GET /api/v3/rois` |

---

## Related Documentation

- [[../../CLAUDE\|Project Guidelines (CLAUDE.md)]]
- [[../../CHANGELOG\|Changelog]]
- [[../../README\|Project README]]
