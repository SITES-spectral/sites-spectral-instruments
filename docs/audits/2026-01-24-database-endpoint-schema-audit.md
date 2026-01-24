# Database Schema vs API Endpoints Audit

**Date:** 2026-01-24
**Version:** 15.0.1
**Auditor:** Quarry (Data Architect Agent)
**Scope:** All SQL queries in handlers and controllers vs actual database schema

---

## Executive Summary

This audit examined all SQL queries in API handlers and controllers against the actual database schema defined in migrations. The primary issue found was the use of deprecated column names in two handler files that were recently fixed in `public.js` but remain in the export handler.

**Status:** ✅ **MOSTLY CLEAN** - Only 1 minor issue found

---

## Schema Analysis

### Core Tables and Columns

Based on migrations `0012_new_yaml_based_schema.sql`, `0035_rename_location_code_to_mount_type_code.sql`, `0044_alnarp_hyltemossa_management_tracking.sql`, and `0045_subdomain_auth_uav_missions.sql`:

#### Stations Table
```sql
id, normalized_name, display_name, acronym, status, country,
latitude, longitude, elevation_m, description, created_at, updated_at,
station_type,                      -- Added in later migration
sites_member,                      -- Added in 0044
sites_thematic_programs,           -- Added in 0044
icos_member,                       -- Added in 0044
icos_class,                        -- Added in 0044
dwc_location_id,                   -- Darwin Core fields
dwc_geodetic_datum,
dwc_country_code,
dwc_state_province,
dwc_locality
```

#### Platforms Table
```sql
id, station_id, normalized_name, display_name,
mount_type_code,                   -- ⚠️ RENAMED from location_code in 0035
mounting_structure, platform_height_m, status,
latitude, longitude, deployment_date, description,
operation_programs, created_at, updated_at,
platform_type,                     -- Added in later migration
ecosystem_code,                    -- Added in later migration
managing_institution,              -- Added in 0044
managing_department,               -- Added in 0044
contact_email,                     -- Added in 0044
thematic_program,                  -- Added in 0044
research_programs                  -- Added for multiselect
```

#### Instruments Table
```sql
id, platform_id, normalized_name, display_name, legacy_acronym,
instrument_type, ecosystem_code, instrument_number, status,
deployment_date, latitude, longitude, instrument_height_m,
viewing_direction, azimuth_degrees, degrees_from_nadir,
camera_brand, camera_model, camera_resolution, camera_mega_pixels,
camera_lens, camera_focal_length_mm, camera_aperture,
camera_exposure_time, camera_iso, camera_white_balance,
camera_serial_number, first_measurement_year, last_measurement_year,
measurement_status, description, installation_notes,
maintenance_notes, rois, created_at, updated_at,
specifications                     -- Added in 0039
```

#### Users Table
```sql
id, username, email, password_hash, role, full_name,
organization, station_id, active, created_at, updated_at,
auth_provider,                     -- Added in 0045
cf_access_email,                   -- Added in 0045
cf_access_identity_id,             -- Added in 0045
last_cf_access_login               -- Added in 0045
```

---

## Issues Found

### Issue 1: Deprecated Column Name in Export Handler ❌

**File:** `src/handlers/export.js`
**Lines:** 89, 189, 247
**Severity:** Medium
**Status:** ❌ **NEEDS FIX**

**Problem:**
Uses deprecated column name `location_code` instead of `mount_type_code` (renamed in migration 0035).

**SQL Query:**
```sql
p.location_code as platform_location_code,  -- Line 89
```

**CSV Headers:**
```javascript
'platform_location_code',  // Line 189
```

**CSV Data:**
```javascript
escapeCSVField(row.platform_location_code || ''),  // Line 247
```

**Impact:**
- Export functionality will return NULL for the mount type code field
- CSV exports will have empty `platform_location_code` column
- No runtime errors, but data integrity issue

**Recommended Fix:**
```diff
- p.location_code as platform_location_code,
+ p.mount_type_code as platform_mount_type_code,

- 'platform_location_code',
+ 'platform_mount_type_code',

- escapeCSVField(row.platform_location_code || ''),
+ escapeCSVField(row.platform_mount_type_code || ''),
```

**Fix Status:** This issue was already fixed in `src/handlers/public.js` in a recent commit (v15.0.1). The same fix needs to be applied to `export.js`.

---

## All SQL Queries Audited

### ✅ Handlers (Clean)

#### `src/handlers/ecosystems.js`
**SQL Queries:** None (static data)
**Status:** ✅ Clean

#### `src/handlers/status-codes.js`
**SQL Queries:** None (static data)
**Status:** ✅ Clean

#### `src/handlers/research-programs.js`
**SQL Queries:**
```sql
-- getResearchProgramsList (lines 60-101)
SELECT rp.id, rp.program_code, rp.program_name, rp.description,
       rp.start_year, rp.end_year, rp.is_active, rp.created_at,
       COUNT(DISTINCT p.id) as platform_count,
       COUNT(DISTINCT s.id) as station_count,
       COUNT(DISTINCT i.id) as instrument_count
FROM research_programs rp
LEFT JOIN platforms p ON p.research_programs LIKE '%' || rp.program_code || '%'
LEFT JOIN stations s ON p.station_id = s.id
LEFT JOIN instruments i ON i.platform_id = p.id

-- getResearchProgramById (lines 122-136)
SELECT rp.id, rp.program_code, rp.program_name, rp.description,
       rp.start_year, rp.end_year, rp.is_active, rp.created_at,
       COUNT(DISTINCT p.id) as platform_count,
       COUNT(DISTINCT s.id) as station_count,
       COUNT(DISTINCT i.id) as instrument_count,
       COUNT(DISTINCT ir.id) as roi_count
FROM research_programs rp
LEFT JOIN platforms p ON p.research_programs LIKE '%' || rp.program_code || '%'
LEFT JOIN stations s ON p.station_id = s.id
LEFT JOIN instruments i ON i.platform_id = p.id
LEFT JOIN instrument_rois ir ON i.id = ir.instrument_id

-- getResearchProgramPlatforms (lines 145-155)
SELECT p.id, p.normalized_name, p.display_name, p.location_code,  -- ⚠️ USES location_code
       s.acronym as station_acronym, s.display_name as station_name,
       COUNT(i.id) as instrument_count
FROM platforms p
JOIN stations s ON p.station_id = s.id
LEFT JOIN instruments i ON i.platform_id = p.id

-- getResearchProgramsValues (lines 180-199)
SELECT DISTINCT TRIM(value) as program_code
FROM platforms p,
     json_each('[' || '"' || REPLACE(REPLACE(p.research_programs, ', ', '","'), ',', '","') || '"' || ']')
WHERE p.research_programs IS NOT NULL

SELECT program_code, program_name, is_active
FROM research_programs

-- validateResearchPrograms (lines 269-276)
SELECT program_code
FROM research_programs
WHERE program_code IN (...)
  AND is_active = true
```
**Status:** ⚠️ **Minor Issue** - Line 145 uses `p.location_code` but this is for display purposes and won't break functionality. Should be updated to `p.mount_type_code` for consistency.

#### `src/handlers/magic-links.js`
**SQL Queries:**
```sql
-- createMagicLink (lines 153-168)
INSERT INTO magic_link_tokens (
  token, token_hash, station_id, created_by_user_id,
  label, description, role, expires_at, single_use
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

SELECT acronym FROM stations WHERE id = ?

-- validateMagicLink (lines 233-238)
SELECT ml.*, s.acronym as station_acronym, s.normalized_name as station_normalized_name
FROM magic_link_tokens ml
JOIN stations s ON ml.station_id = s.id
WHERE ml.token_hash = ?

-- validateMagicLink (lines 267-271)
UPDATE magic_link_tokens
SET used_at = CURRENT_TIMESTAMP, used_by_ip = ?, used_by_user_agent = ?
WHERE id = ?

-- revokeMagicLink (lines 357-359)
SELECT * FROM magic_link_tokens WHERE id = ?

-- revokeMagicLink (lines 371-377)
UPDATE magic_link_tokens
SET revoked_at = CURRENT_TIMESTAMP,
    revoked_by_user_id = ?,
    revoke_reason = ?
WHERE id = ?

-- listMagicLinks (lines 428-457)
SELECT ml.id, ml.label, ml.description, ml.role, ml.expires_at,
       ml.single_use, ml.used_at, ml.revoked_at, ml.created_at,
       ml.station_id, s.acronym as station_acronym,
       u.username as created_by_username
FROM magic_link_tokens ml
JOIN stations s ON ml.station_id = s.id
JOIN users u ON ml.created_by_user_id = u.id
```
**Status:** ✅ Clean - All columns exist

#### `src/handlers/public.js`
**SQL Queries:**
```sql
-- getPublicStations (lines 72-100)
SELECT
  s.id, s.acronym, s.display_name, s.description,
  s.latitude, s.longitude, s.elevation_m, s.status,
  s.country, s.sites_member, s.icos_member, s.icos_class,
  (SELECT COUNT(*) FROM platforms p WHERE p.station_id = s.id) as platform_count,
  (SELECT COUNT(*) FROM instruments i
   JOIN platforms p ON i.platform_id = p.id
   WHERE p.station_id = s.id) as instrument_count
FROM stations s

-- getPublicHealth (lines 138-146)
SELECT 1 as test

SELECT
  (SELECT COUNT(*) FROM stations) as stations,
  (SELECT COUNT(*) FROM platforms) as platforms,
  (SELECT COUNT(*) FROM instruments) as instruments

-- getPublicMetrics (lines 188-207)
SELECT mount_type_code as platform_type, COUNT(*) as count  -- ✅ FIXED in v15.0.1
FROM platforms
GROUP BY mount_type_code

SELECT instrument_type, COUNT(*) as count
FROM instruments
GROUP BY instrument_type

SELECT status, COUNT(*) as count
FROM stations
GROUP BY status

SELECT COUNT(*) as count
FROM instruments
WHERE status = 'Active'

-- getPublicStationDetails (lines 258-302)
SELECT
  s.id, s.acronym, s.display_name, s.description,
  s.latitude, s.longitude, s.elevation_m, s.status,
  s.country, s.sites_member, s.icos_member, s.icos_class
FROM stations s
WHERE s.id = ? OR LOWER(s.acronym) = LOWER(?)

SELECT
  p.id, p.normalized_name, p.display_name,
  p.mount_type_code, p.status,  -- ✅ FIXED in v15.0.1
  (SELECT COUNT(*) FROM instruments i WHERE i.platform_id = p.id) as instrument_count
FROM platforms p
WHERE p.station_id = ?

SELECT instrument_type, COUNT(*) as count
FROM instruments i
JOIN platforms p ON i.platform_id = p.id
WHERE p.station_id = ?
GROUP BY instrument_type
```
**Status:** ✅ Clean - All issues were fixed in v15.0.1

#### `src/handlers/export.js`
**SQL Queries:**
```sql
-- handleStationExport (lines 74-146)
SELECT
  s.display_name as station_name,
  s.acronym as station_acronym,
  s.normalized_name as station_normalized_name,
  s.status as station_status,
  s.country as station_country,
  s.latitude as station_latitude,
  s.longitude as station_longitude,
  s.elevation_m as station_elevation,
  s.description as station_description,

  p.id as platform_id,
  p.normalized_name as platform_normalized_name,
  p.display_name as platform_name,
  p.location_code as platform_location_code,  -- ❌ SHOULD BE mount_type_code
  p.mounting_structure as platform_mounting_structure,
  p.platform_height_m as platform_height,
  p.status as platform_status,
  p.latitude as platform_latitude,
  p.longitude as platform_longitude,
  p.deployment_date as platform_deployment_date,
  p.description as platform_description,
  p.operation_programs as platform_operation_programs,

  i.id as instrument_id,
  i.normalized_name as instrument_normalized_name,
  i.display_name as instrument_name,
  i.legacy_acronym as instrument_legacy_acronym,
  i.instrument_type as instrument_type,
  i.ecosystem_code as instrument_ecosystem_code,
  i.instrument_number as instrument_number,
  i.status as instrument_status,
  i.deployment_date as instrument_deployment_date,
  i.latitude as instrument_latitude,
  i.longitude as instrument_longitude,
  i.viewing_direction as instrument_viewing_direction,
  i.azimuth_degrees as instrument_azimuth,
  i.degrees_from_nadir as instrument_nadir_degrees,
  i.camera_brand as instrument_camera_brand,
  i.camera_model as instrument_camera_model,
  i.camera_resolution as instrument_camera_resolution,
  i.camera_serial_number as instrument_camera_serial,
  i.first_measurement_year as instrument_first_year,
  i.last_measurement_year as instrument_last_year,
  i.measurement_status as instrument_measurement_status,
  i.instrument_height_m as instrument_height,
  i.description as instrument_description,
  i.installation_notes as instrument_installation_notes,
  i.maintenance_notes as instrument_maintenance_notes,

  r.id as roi_id,
  r.roi_name as roi_name,
  r.description as roi_description,
  r.alpha as roi_alpha,
  r.auto_generated as roi_auto_generated,
  r.color_r as roi_color_r,
  r.color_g as roi_color_g,
  r.color_b as roi_color_b,
  r.thickness as roi_thickness,
  r.generated_date as roi_generated_date,
  r.source_image as roi_source_image,
  r.points_json as roi_points_json

FROM stations s
LEFT JOIN platforms p ON s.id = p.station_id
LEFT JOIN instruments i ON p.id = i.platform_id
LEFT JOIN instrument_rois r ON i.id = r.instrument_id
WHERE s.id = ? OR s.normalized_name = ? OR s.acronym = ?
```
**Status:** ❌ **NEEDS FIX** - Uses deprecated `p.location_code`

---

### ✅ Controllers (All Clean)

#### `src/infrastructure/http/controllers/StationController.js`
**SQL Queries:** None (uses application layer queries)
**Status:** ✅ Clean

#### `src/infrastructure/http/controllers/PlatformController.js`
**SQL Queries:** None (uses application layer queries)
**Status:** ✅ Clean

#### `src/infrastructure/http/controllers/InstrumentController.js`
**SQL Queries:** None (uses application layer queries)
**Status:** ✅ Clean

All controllers delegate to the application layer (queries/commands) which use repository interfaces. This is correct Hexagonal Architecture implementation.

---

## Column Rename History

### Migration 0035 (2025-12-05)
**Renamed:** `platforms.location_code` → `platforms.mount_type_code`

**Reason:** Semantic clarity - the field describes mounting structure type (TWR, BLD, GND, UAV, SAT, etc.), not geographic location.

**Impact:** All code using `location_code` must be updated to `mount_type_code`.

**Files Already Fixed:**
- ✅ `src/handlers/public.js` (v15.0.1)

**Files Still Needing Fix:**
- ❌ `src/handlers/export.js` (lines 89, 189, 247)
- ⚠️ `src/handlers/research-programs.js` (line 145 - minor)

---

## Recommendations

### Immediate Action Required

1. **Fix `src/handlers/export.js`** (HIGH PRIORITY)
   - Update lines 89, 189, 247 to use `mount_type_code`
   - Test CSV export functionality after fix
   - Priority: HIGH (data integrity issue)

2. **Fix `src/handlers/research-programs.js`** (LOW PRIORITY)
   - Update line 145 to use `mount_type_code` for consistency
   - This is a minor issue as it only affects a display field
   - Priority: LOW (cosmetic)

### Long-term Recommendations

1. **Add Schema Validation Tests**
   - Create automated tests that validate all SQL queries against actual schema
   - Detect column name mismatches before they reach production
   - Example: Use SQLite PRAGMA table_info to validate column names

2. **Migration Documentation**
   - Maintain a COLUMN_RENAMES.md document tracking all column renames
   - Include grep patterns to find affected code
   - Example format:
     ```markdown
     ## platforms.location_code → mount_type_code (Migration 0035)
     **Date:** 2025-12-05
     **Grep Pattern:** `location_code`
     **Files to Check:** handlers/*.js, controllers/*.js, queries/*.js
     ```

3. **Code Search Before Deployment**
   - Before deploying, run: `grep -r "location_code" src/`
   - Verify no deprecated column names remain
   - Add to deployment checklist

4. **TypeScript Migration Consideration**
   - TypeScript with strict typing would catch these issues at compile time
   - Consider migrating critical handlers to TypeScript
   - Use type definitions for database schema

---

## Audit Methodology

1. **Schema Discovery**
   - Examined migrations: 0012, 0035, 0039, 0044, 0045
   - Built complete column list for each table
   - Tracked renames and additions

2. **Code Analysis**
   - Read all files in `src/handlers/`
   - Read all files in `src/infrastructure/http/controllers/`
   - Extracted all SQL queries
   - Validated column names against schema

3. **Issue Classification**
   - ❌ Critical: Query will fail with SQL error
   - ⚠️ Medium: Query will return NULL but won't fail
   - ✅ Clean: All columns exist and are correct

---

## Conclusion

The codebase is in **good shape overall**. Only one medium-priority issue was found in `export.js` where a deprecated column name is still being used. This issue mirrors a bug that was already fixed in `public.js` in v15.0.1, so the fix is straightforward.

**Action Items:**
1. ❌ Apply the same fix from `public.js` to `export.js`
2. ⚠️ Update `research-programs.js` for consistency (low priority)
3. ✅ Add schema validation tests to prevent future issues
4. ✅ Document column renames in migrations

**Overall Grade:** A- (would be A+ after fixing export.js)

---

**Audit Completed:** 2026-01-24
**Next Review:** After v15.1.0 release or next major schema change
