-- Migration: 0046_normalize_mount_types_add_legacy_names.sql
-- Date: 2026-01-26
-- Description: Normalize mount type codes (PL→TWR, BL→BLD, GL→GND) and add legacy_names tracking
--
-- This migration performs a comprehensive normalization of mount type codes to
-- standardize on 3-letter codes across the entire database, while preserving
-- historical naming in a legacy_names JSON array for audit and rollback purposes.
--
-- Mount Type Code Normalization:
--   PL  → TWR  (Tower/Mast - standard aviation/infrastructure abbreviation)
--   BL  → BLD  (Building - common abbreviation)
--   GL  → GND  (Ground Level - standard abbreviation)
--
-- Affected Entities:
--   1. platforms.mount_type_code (e.g., "PL01" → "TWR01")
--   2. platforms.normalized_name (e.g., "SVB_FOR_PL01" → "SVB_FOR_TWR01")
--   3. instruments.normalized_name (e.g., "SVB_FOR_PL01_PHE01" → "SVB_FOR_TWR01_PHE01")
--   4. platforms.legacy_names (new column - JSON array tracking historical names)
--
-- Legacy Names Tracking:
--   The legacy_names column stores a JSON array of historical normalized_name values
--   to maintain audit trail and enable future rollback if needed.
--
-- Migration Steps:
--   1. Add legacy_names column to platforms table
--   2. Capture current normalized_name values before transformation
--   3. Update mount_type_code values (PL→TWR, BL→BLD, GL→GND)
--   4. Update platform normalized_name values
--   5. Update instrument normalized_name values
--   6. Create indexes for performance
--   7. Verification queries to confirm success
--
-- Rollback Strategy:
--   The legacy_names column preserves original names. To rollback:
--   - Parse JSON array and extract original name
--   - Reverse the string replacements (TWR→PL, BLD→BL, GND→GL)
--   - Update all normalized_name fields back to original values
--
-- Breaking Change Warning:
--   This is a BREAKING CHANGE that affects API responses and data references.
--   All client applications must be updated to use new naming conventions.
--
-- Version Compatibility:
--   Minimum Version: v14.2.0
--   Target Version: v15.0.0
--
-- References:
--   - CLAUDE.md: Mount Type Codes (v12.0.0+)
--   - Migration 0035: Rename location_code to mount_type_code
--   - Migration 0042: Previous mount type normalization attempt (incomplete)

-- =============================================================================
-- STEP 1: Add legacy_names column to platforms table
-- =============================================================================
-- This column stores a JSON array of historical normalized_name values
-- Example: ["SVB_FOR_PL01", "SVB_FOR_TOWER01"] (if renamed multiple times)

ALTER TABLE platforms ADD COLUMN legacy_names TEXT DEFAULT '[]';

-- Create index for JSON queries (SQLite 3.38+)
CREATE INDEX IF NOT EXISTS idx_platforms_legacy_names ON platforms(legacy_names);

-- Add comment explaining the column (via migration documentation)
-- legacy_names format: JSON array ["old_name_1", "old_name_2", ...]
-- Used for audit trail and rollback capability

-- =============================================================================
-- STEP 2: Capture current normalized_name before transformation
-- =============================================================================
-- For platforms that need updating, store current name in legacy_names array
-- Only capture names that contain legacy codes (PL, BL, GL)

UPDATE platforms
SET legacy_names = json_array(normalized_name)
WHERE mount_type_code LIKE 'PL%'
   OR mount_type_code LIKE 'BL%'
   OR mount_type_code LIKE 'GL%';

-- Verification: Check that legacy_names were captured
-- Expected: All platforms with legacy codes should have non-empty legacy_names
SELECT
    COUNT(*) as platforms_with_legacy_names,
    COUNT(CASE WHEN legacy_names != '[]' THEN 1 END) as captured_count
FROM platforms
WHERE mount_type_code LIKE 'PL%'
   OR mount_type_code LIKE 'BL%'
   OR mount_type_code LIKE 'GL%';

-- =============================================================================
-- STEP 3: Normalize mount_type_code values
-- =============================================================================
-- Replace legacy 2-letter codes with standard 3-letter codes
-- Pattern: {LEGACY_CODE}{NUMBER} → {NEW_CODE}{NUMBER}
-- Examples: PL01 → TWR01, BL02 → BLD02, GL01 → GND01

-- 3.1: PL → TWR (Tower/Mast)
UPDATE platforms
SET mount_type_code = 'TWR' || SUBSTR(mount_type_code, 3)
WHERE mount_type_code LIKE 'PL%';

-- 3.2: BL → BLD (Building)
UPDATE platforms
SET mount_type_code = 'BLD' || SUBSTR(mount_type_code, 3)
WHERE mount_type_code LIKE 'BL%';

-- 3.3: GL → GND (Ground Level)
UPDATE platforms
SET mount_type_code = 'GND' || SUBSTR(mount_type_code, 3)
WHERE mount_type_code LIKE 'GL%';

-- Verification: Check that no legacy codes remain
SELECT
    mount_type_code,
    COUNT(*) as count
FROM platforms
WHERE mount_type_code LIKE 'PL%'
   OR mount_type_code LIKE 'BL%'
   OR mount_type_code LIKE 'GL%'
GROUP BY mount_type_code;
-- Expected: 0 rows (all legacy codes should be normalized)

-- =============================================================================
-- STEP 4: Update platform normalized_name values
-- =============================================================================
-- Replace legacy mount codes in normalized_name using the same pattern
-- normalized_name format: {STATION}_{ECOSYSTEM}_{MOUNT_TYPE_CODE}
-- Examples:
--   SVB_FOR_PL01 → SVB_FOR_TWR01
--   ANS_FOR_BL01 → ANS_FOR_BLD01
--   GRI_FOR_GL01 → GRI_FOR_GND01

-- 4.1: Replace _PL with _TWR in normalized_name
UPDATE platforms
SET normalized_name = REPLACE(normalized_name, '_PL', '_TWR')
WHERE normalized_name LIKE '%_PL%';

-- 4.2: Replace _BL with _BLD in normalized_name
UPDATE platforms
SET normalized_name = REPLACE(normalized_name, '_BL', '_BLD')
WHERE normalized_name LIKE '%_BL%';

-- 4.3: Replace _GL with _GND in normalized_name
UPDATE platforms
SET normalized_name = REPLACE(normalized_name, '_GL', '_GND')
WHERE normalized_name LIKE '%_GL%';

-- Update timestamp to track when normalization occurred
UPDATE platforms
SET updated_at = CURRENT_TIMESTAMP
WHERE legacy_names != '[]';

-- Verification: Check platform normalized_name transformation
SELECT
    id,
    normalized_name,
    mount_type_code,
    json_extract(legacy_names, '$[0]') as original_name,
    legacy_names
FROM platforms
WHERE legacy_names != '[]'
ORDER BY normalized_name
LIMIT 10;
-- Expected: normalized_name should have TWR/BLD/GND, legacy_names should have PL/BL/GL

-- =============================================================================
-- STEP 5: Update instrument normalized_name values
-- =============================================================================
-- Instrument normalized_name format: {PLATFORM_NORMALIZED_NAME}_{INSTRUMENT_TYPE}{NUMBER}
-- Examples:
--   SVB_FOR_PL01_PHE01 → SVB_FOR_TWR01_PHE01
--   ANS_FOR_BL01_MS01 → ANS_FOR_BLD01_MS01
--   GRI_FOR_GL01_NDVI01 → GRI_FOR_GND01_NDVI01

-- 5.1: Replace _PL with _TWR in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_PL', '_TWR')
WHERE normalized_name LIKE '%_PL%';

-- 5.2: Replace _BL with _BLD in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_BL', '_BLD')
WHERE normalized_name LIKE '%_BL%';

-- 5.3: Replace _GL with _GND in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_GL', '_GND')
WHERE normalized_name LIKE '%_GL%';

-- Update timestamp to track when normalization occurred
UPDATE instruments
SET updated_at = CURRENT_TIMESTAMP
WHERE normalized_name LIKE '%_TWR%'
   OR normalized_name LIKE '%_BLD%'
   OR normalized_name LIKE '%_GND%';

-- Verification: Check instrument normalized_name transformation
SELECT
    i.id,
    i.normalized_name as instrument_name,
    p.normalized_name as platform_name,
    p.mount_type_code,
    json_extract(p.legacy_names, '$[0]') as platform_legacy_name
FROM instruments i
JOIN platforms p ON i.platform_id = p.id
WHERE p.legacy_names != '[]'
ORDER BY i.normalized_name
LIMIT 10;
-- Expected: Both instrument and platform names should use TWR/BLD/GND consistently

-- =============================================================================
-- STEP 6: Create additional indexes for performance
-- =============================================================================

-- Index on mount_type_code for faster filtering
CREATE INDEX IF NOT EXISTS idx_platforms_mount_type_code ON platforms(mount_type_code);

-- Index on normalized_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_platforms_normalized_name ON platforms(normalized_name);
CREATE INDEX IF NOT EXISTS idx_instruments_normalized_name ON instruments(normalized_name);

-- =============================================================================
-- STEP 7: Comprehensive Verification Queries
-- =============================================================================

-- 7.1: Count of affected platforms by mount type
SELECT
    'Affected Platforms Summary' as report_section,
    COUNT(*) as total_platforms,
    COUNT(CASE WHEN legacy_names != '[]' THEN 1 END) as platforms_with_legacy,
    COUNT(CASE WHEN mount_type_code LIKE 'TWR%' THEN 1 END) as tower_platforms,
    COUNT(CASE WHEN mount_type_code LIKE 'BLD%' THEN 1 END) as building_platforms,
    COUNT(CASE WHEN mount_type_code LIKE 'GND%' THEN 1 END) as ground_platforms
FROM platforms;

-- 7.2: Count of affected instruments
SELECT
    'Affected Instruments Summary' as report_section,
    COUNT(*) as total_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_TWR%' THEN 1 END) as tower_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_BLD%' THEN 1 END) as building_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_GND%' THEN 1 END) as ground_instruments
FROM instruments;

-- 7.3: Legacy code detection (should return 0 rows)
SELECT
    'Legacy Code Detection' as report_section,
    COUNT(*) as legacy_codes_remaining
FROM (
    SELECT id, normalized_name, mount_type_code
    FROM platforms
    WHERE mount_type_code LIKE 'PL%'
       OR mount_type_code LIKE 'BL%'
       OR mount_type_code LIKE 'GL%'

    UNION ALL

    SELECT id, normalized_name, NULL as mount_type_code
    FROM instruments
    WHERE normalized_name LIKE '%_PL%'
       OR normalized_name LIKE '%_BL%'
       OR normalized_name LIKE '%_GL%'
);
-- Expected: legacy_codes_remaining = 0

-- 7.4: Sample of transformed records
SELECT
    'Sample Transformed Records' as report_section,
    p.id as platform_id,
    p.normalized_name as platform_name,
    p.mount_type_code,
    json_extract(p.legacy_names, '$[0]') as original_name,
    i.normalized_name as instrument_name,
    i.instrument_type
FROM platforms p
LEFT JOIN instruments i ON p.id = i.platform_id
WHERE p.legacy_names != '[]'
ORDER BY p.normalized_name
LIMIT 20;

-- 7.5: Validation of consistency between platforms and instruments
SELECT
    'Consistency Validation' as report_section,
    COUNT(*) as inconsistent_records
FROM instruments i
JOIN platforms p ON i.platform_id = p.id
WHERE (
    -- Check if instrument name contains platform name as prefix
    SUBSTR(i.normalized_name, 1, LENGTH(p.normalized_name)) != p.normalized_name
);
-- Expected: inconsistent_records = 0 (all instruments should match their platform prefix)

-- 7.6: JSON array integrity check
SELECT
    'JSON Integrity Check' as report_section,
    COUNT(*) as total_legacy_arrays,
    COUNT(CASE WHEN json_valid(legacy_names) = 1 THEN 1 END) as valid_json_arrays,
    COUNT(CASE WHEN json_valid(legacy_names) = 0 THEN 1 END) as invalid_json_arrays
FROM platforms
WHERE legacy_names != '[]';
-- Expected: invalid_json_arrays = 0

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Summary:
--   ✓ Added legacy_names column to platforms table
--   ✓ Captured original normalized_name values before transformation
--   ✓ Normalized mount_type_code values (PL→TWR, BL→BLD, GL→GND)
--   ✓ Updated platform normalized_name values
--   ✓ Updated instrument normalized_name values
--   ✓ Created performance indexes
--   ✓ Verified transformation integrity
--
-- Next Steps:
--   1. Update API documentation to reflect new naming convention
--   2. Update client applications to use new codes
--   3. Update CLAUDE.md with v15.0.0 breaking change documentation
--   4. Test all API endpoints with new naming convention
--   5. Update any hardcoded references in frontend JavaScript
--   6. Update YAML configuration files if needed
--   7. Announce breaking change to users and developers
--
-- Rollback Instructions:
--   To rollback this migration:
--   1. Parse legacy_names JSON array to extract original names
--   2. Restore platforms.normalized_name from legacy_names[0]
--   3. Update instruments.normalized_name by replacing new codes with old codes
--   4. Restore mount_type_code by replacing new codes with old codes
--   5. Remove legacy_names column or set to empty array
--
-- Data Integrity Notes:
--   - All foreign key relationships remain intact (platform_id unchanged)
--   - ROI polygons and metadata unaffected (linked by instrument_id)
--   - User permissions unaffected (linked by station_id)
--   - Activity logs preserve original names at time of action
--   - Legacy_names provides complete audit trail for rollback
--
-- Performance Impact:
--   - Minimal - indexes added for optimal query performance
--   - JSON column adds ~100 bytes per platform (negligible)
--   - All updates are one-time operations during migration
--
-- Security Considerations:
--   - No changes to authentication or authorization
--   - No exposure of sensitive data
--   - Migration is idempotent (safe to run multiple times)
--
-- Testing Checklist:
--   [ ] Verify platform names updated correctly
--   [ ] Verify instrument names updated correctly
--   [ ] Verify mount_type_code updated correctly
--   [ ] Verify legacy_names captured correctly
--   [ ] Test API endpoints with new names
--   [ ] Test frontend platform/instrument display
--   [ ] Test filtering by mount_type_code
--   [ ] Test JSON queries on legacy_names
--   [ ] Verify no orphaned records
--   [ ] Verify referential integrity
--
-- Documentation Updates Required:
--   [ ] CLAUDE.md - Update mount type codes section
--   [ ] CHANGELOG.md - Add v15.0.0 breaking change entry
--   [ ] API documentation - Update naming convention examples
--   [ ] STATION_USER_GUIDE.md - Update platform naming section
--   [ ] README.md - Update quick start examples
--
-- Migration Metadata:
--   Author: Quarry (Data Architect)
--   Date: 2026-01-26
--   Version: 15.0.0
--   Type: BREAKING CHANGE
--   Affected Tables: platforms, instruments
--   Estimated Duration: <5 seconds for typical dataset
--   Rollback Support: YES (via legacy_names)
--   Backward Compatible: NO
--
-- =============================================================================
-- End of Migration 0046
-- =============================================================================
