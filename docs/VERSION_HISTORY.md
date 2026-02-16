# Version History

> **Current Version**: 15.7.0
> **Last Updated**: 2026-02-16

For detailed changelog with all versions, see [CHANGELOG.md](../CHANGELOG.md).

---

## v15.7.0 - Database Audit & Guest Stations (2026-02-16)

**Comprehensive Database Audit & Data Migration**

Conducted full audit of production database against legacy YAML, identifying and resolving all critical gaps.

### New Guest Stations (3)

| Acronym | Name | Type | ICOS Class |
|---------|------|------|------------|
| **ALN** | Alnarp | SITES Guest | - |
| **HYL** | Hyltemossa | ICOS Guest | Class 1 |
| **NOR** | Norunda | ICOS Guest | Class 1 |

### Database Additions

| Category | Added | Total |
|----------|-------|-------|
| Stations | +3 | 12 |
| Platforms | +8 | 30 |
| Instruments | +4 | 29 |
| ROIs | +40 | 40 |

### Platform Types Added

- **UAV**: ALN_DJI_M3M_UAV01 (DJI Mavic 3 Multispectral)
- **Satellite**: ALN_ESA_S2A_SAT01 (Sentinel-2A)
- **Fixed**: SVB below-canopy platforms, HYL/NOR flux towers

### Migrations

- `0047_add_svb_missing_platforms.sql`
- `0048_add_phenocam_rois.sql`
- `0049_add_guest_stations.sql`

See: [Audit Report](./audits/2026-02-16-INSTRUMENT-PLATFORM-ROI-AUDIT.md)

---

## v15.6.x Series - Security Hardening

### v15.6.11 (2026-02-16)

**Session Persistence for CF Access Users (SEC-007)**

Fixed session persistence so admin users don't need to re-authenticate via OTP when CF Access JWT expires.

- When CF Access authentication succeeds, an internal session cookie is now issued
- Cookie persists for 24 hours across all subdomains (`Domain=.sitesspectral.work`)
- Uses the same httpOnly secure cookie mechanism as password and magic link auth

See: [Session Persistence Documentation](./security/SESSION_PERSISTENCE.md)

### v15.6.10 (2026-02-13)

**Security Audit Complete**

All remediation items from the 2026-02-11 comprehensive security audit implemented:

| Priority | Items | Description |
|----------|-------|-------------|
| **P0** | 5 items | Cookie security, magic link validation, race conditions |
| **P1** | 6 items | UAV authorization, API validation, pilot audit trail |
| **P2** | 2 items | Multi-use token audit trail, IP pinning |

---

## v15.0.0 - Subdomain Architecture (2026-01-24)

**Subdomain-Based Portal Architecture**

Migration from single-domain to subdomain-based architecture with Cloudflare Access authentication:

| Portal | Domain | Authentication |
|--------|--------|----------------|
| Public | `sitesspectral.work` | None (public dashboard) |
| Admin | `admin.sitesspectral.work` | CF Access OTP |
| Station | `{station}.sitesspectral.work` | CF Access / Magic Link |

**New Authentication Methods:**
- **Cloudflare Access JWT**: Passwordless email OTP
- **Magic Links**: Time-limited tokens for internal users
- **Dual-Auth**: CF Access priority, falls back to legacy cookies

**New Roles:**
- `uav-pilot` - UAV operators with mission/flight logging
- `station-internal` - Internal read-only via magic link

**UAV Management System:**
- Pilot registry with certifications
- Mission planning and execution
- Flight logging with telemetry
- Battery inventory tracking

See: [Subdomain Architecture](./architecture/SUBDOMAIN_ARCHITECTURE.md)

---

## v14.x Series - Station Management

### v14.1.0

**Alnarp & Hyltemossa Stations**

Added two new SITES stations with enhanced platform management tracking:

| Station | Acronym | Platforms | Notes |
|---------|---------|-----------|-------|
| Alnarp | ALN | 5 | MGeo managed |
| Hyltemossa | HYL | 2 | ICOS integrated |

### v14.0.3

**Duplicate Platform Prevention Dialog**

User-friendly confirmation when creating platforms that conflict with existing ones.

### v14.0.1

**Complete Role Matching in Redirect Logic**

Fixed infinite login loops for all user roles.

---

## v13.x Series - Production Ready

### v13.26.0

**Config-Driven Instrument Types**

Instrument type definitions moved from hardcoded JS to YAML configuration with build-time code generation.

### v13.0.0

**Production Ready Release**

| Phase | Description | Result |
|-------|-------------|--------|
| **Phase 4** | Test Coverage | 587 tests, 34 files |
| **Phase 5** | Code Quality | API version cleanup |
| **Phase 6** | Promise Handling | Global error handlers |

---

## v12.x Series - Code Normalization

### v12.0.0 (Breaking Change)

**Mount Type Codes Normalized**

All mount type codes normalized to consistent 3 letters:
- `PL` → `TWR` (Tower/Mast)
- `BL` → `BLD` (Building)
- `GL` → `GND` (Ground Level)

---

## v11.x Series - Authorization & Standards

### v11.0.0

- **Station Users Read-Only**: Regular station users can only view data
- **Station Admins CRUD**: Only `*-admin` users can create/update/delete
- **Vocabulary Mapping**: Darwin Core, ICOS, Copernicus alignment
- **Calibration Workflow**: 55+ field comprehensive calibration records

---

## v10.x Series - ROI System

### v10.0.0

- **ROI Drawing Tool**: Interactive canvas-based polygon drawing
- **Legacy ROI System**: Preserves ROI numbers for L2/L3 data integrity
- **Admin Panel**: Complete user management with role-based access
- **Map Integration**: Leaflet-based station mapping
- **Data Export**: CSV/JSON export with role-based access

---

## Legacy Versions (v1-v9)

See [Legacy Changelog](./legacy/CHANGELOG_V11_AND_EARLIER.md) for versions prior to v10.
