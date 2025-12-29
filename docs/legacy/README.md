# Legacy Documentation

This folder contains archived documentation and changelogs from SITES Spectral versions prior to v13.0.0, as well as superseded implementation documentation.

**Current Active Version**: v13.26.0+ (Production Ready Codebase)

---

## Contents

### Changelog Archive

| File | Description |
|------|-------------|
| [[CHANGELOG_V11_AND_EARLIER|CHANGELOG_V11_AND_EARLIER.md]] | Complete changelog for v11.x and earlier versions |

### v13.25 Instrument Types Archive (`v13.25-instrument-types/`)

Documentation for superseded hardcoded instrument types implementation:

| File | Description |
|------|-------------|
| `HARDCODED_INSTRUMENT_TYPES.md` | Original hardcoded implementation (replaced by YAML config in v13.26.0) |

### V1-V10 Archive (`v1-v10/`)

Documentation from pre-V11 versions:

| Folder/File | Description |
|-------------|-------------|
| `v3/` | V3 API documentation and references |
| `v1-api/` | V1 API documentation (deprecated) |
| `guides/` | Legacy user guides |
| `platform-guides/` | Platform type guides (V8.x) |
| `user-guides/` | User workflow documentation |
| `CLAUDE_LEGACY.md` | Historical CLAUDE.md content |
| `*.md` | Various legacy documentation files |

---

## Version History Summary

| Version | Period | Key Milestone |
|---------|--------|---------------|
| **v13.26.0** | Dec 2025 | Config-Driven Instrument Types (YAML) |
| **v13.0.0** | Dec 2025 | Production Ready - 653 tests, Phase 4-6 complete |
| **v12.0.0** | Dec 2025 | Normalized Mount Type Codes (BREAKING) |
| **v11.0.0** | Dec 2025 | Hexagonal Architecture + Domain Authorization |
| **v10.0.0** | Nov-Dec 2025 | ROI Drawing, Admin Panel, Map Integration |
| **v8.x-v9.x** | Sep-Nov 2025 | UAV Platform, Calibration, Security |
| **v1.x-v7.x** | Early 2025 | Initial development |

---

## Migration History

### v13.26.0 Config-Driven Instrument Types
- Instrument types moved from hardcoded JS to YAML configuration
- Build-time code generation via `scripts/build.js`
- Source of truth: `yamls/instruments/instrument-types.yaml`
- No breaking changes (registry interface unchanged)

### v12.0.0 Breaking Changes
- Mount type codes normalized: `PL` → `TWR`, `BL` → `BLD`, `GL` → `GND`
- Platform/Instrument `normalized_name` values changed

### v11.0.0 Architecture Migration
1. **Hexagonal Architecture** (Ports & Adapters)
2. **CQRS Pattern** (Commands/Queries separation)
3. **Domain Authorization** (Role-based access control)
4. **Standard Vocabularies** (Darwin Core, ICOS, Copernicus alignment)

---

## Current Documentation

For current documentation, see the main project:

- [[../../CHANGELOG|CHANGELOG.md]] - Current version history (v12+)
- [[../../CLAUDE|CLAUDE.md]] - Architecture requirements, API reference
- [[../VOCABULARY_MAPPING|VOCABULARY_MAPPING.md]] - Standard vocabulary alignment
- [[../STATION_USER_GUIDE|STATION_USER_GUIDE.md]] - End-user guide
- [[../PRODUCTION_SYNC_GUIDE|PRODUCTION_SYNC_GUIDE.md]] - Deployment procedures

---

**Last Updated**: 2025-12-29
**Archived By**: v13.26.0 Release
