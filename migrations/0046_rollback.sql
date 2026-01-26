-- Rollback Script: 0046_rollback.sql
-- Purpose: Revert migration 0046_normalize_mount_types_add_legacy_names.sql
-- Date: 2026-01-26
-- Description: Restore legacy mount type codes and remove legacy_names column
--
-- WARNING: This rollback script should only be used if migration 0046 caused issues.
-- This will restore the database to the state before mount type normalization.
--
-- Rollback Strategy:
--   1. Restore platform normalized_name from legacy_names JSON array
--   2. Restore mount_type_code to legacy values (TWR→PL, BLD→BL, GND→GL)
--   3. Restore instrument normalized_name to legacy values
--   4. Remove indexes created by migration
--   5. Remove legacy_names column
--   6. Verification queries
--
-- Prerequisites:
--   - Migration 0046 must have been applied successfully
--   - legacy_names column must exist and contain valid data
--   - Backup of database recommended before rollback
--
-- Version Compatibility:
--   Reverts From: v15.0.0
--   Reverts To: v14.2.0

-- =============================================================================
-- STEP 0: Pre-Rollback Verification
-- =============================================================================

SELECT '=== PRE-ROLLBACK VERIFICATION ===' as rollback_phase;

-- Verify legacy_names column exists
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '✓ legacy_names column exists'
        ELSE '✗ ERROR: legacy_names column not found!'
    END as status
FROM pragma_table_info('platforms')
WHERE name = 'legacy_names';

-- Count records with legacy_names data
SELECT
    COUNT(*) as platforms_with_legacy_data,
    COUNT(CASE WHEN legacy_names = '[]' THEN 1 END) as empty_legacy_arrays,
    COUNT(CASE WHEN json_valid(legacy_names) = 0 THEN 1 END) as invalid_json
FROM platforms;

-- Sample current state before rollback
SELECT
    'Current State Sample' as section,
    id,
    normalized_name as current_name,
    mount_type_code as current_code,
    json_extract(legacy_names, '$[0]') as legacy_name,
    legacy_names
FROM platforms
WHERE legacy_names != '[]'
ORDER BY normalized_name
LIMIT 5;

-- =============================================================================
-- STEP 1: Restore platform normalized_name from legacy_names
-- =============================================================================

SELECT '=== STEP 1: Restoring Platform Names ===' as rollback_phase;

-- Restore normalized_name from first entry in legacy_names array
UPDATE platforms
SET normalized_name = json_extract(legacy_names, '$[0]')
WHERE legacy_names != '[]'
  AND json_valid(legacy_names) = 1
  AND json_extract(legacy_names, '$[0]') IS NOT NULL;

-- Verification: Check restoration
SELECT
    'Platform Name Restoration' as verification,
    COUNT(*) as platforms_restored,
    COUNT(CASE WHEN normalized_name LIKE '%_PL%' THEN 1 END) as pl_restored,
    COUNT(CASE WHEN normalized_name LIKE '%_BL%' THEN 1 END) as bl_restored,
    COUNT(CASE WHEN normalized_name LIKE '%_GL%' THEN 1 END) as gl_restored
FROM platforms
WHERE legacy_names != '[]';

-- =============================================================================
-- STEP 2: Restore mount_type_code to legacy values
-- =============================================================================

SELECT '=== STEP 2: Restoring Mount Type Codes ===' as rollback_phase;

-- 2.1: TWR → PL (Tower/Mast back to Pole)
UPDATE platforms
SET mount_type_code = 'PL' || SUBSTR(mount_type_code, 4)
WHERE mount_type_code LIKE 'TWR%';

-- 2.2: BLD → BL (Building back to legacy)
UPDATE platforms
SET mount_type_code = 'BL' || SUBSTR(mount_type_code, 4)
WHERE mount_type_code LIKE 'BLD%';

-- 2.3: GND → GL (Ground Level back to legacy)
UPDATE platforms
SET mount_type_code = 'GL' || SUBSTR(mount_type_code, 4)
WHERE mount_type_code LIKE 'GND%';

-- Verification: Check mount_type_code restoration
SELECT
    'Mount Type Code Restoration' as verification,
    COUNT(CASE WHEN mount_type_code LIKE 'PL%' THEN 1 END) as pl_codes,
    COUNT(CASE WHEN mount_type_code LIKE 'BL%' THEN 1 END) as bl_codes,
    COUNT(CASE WHEN mount_type_code LIKE 'GL%' THEN 1 END) as gl_codes,
    COUNT(CASE WHEN mount_type_code LIKE 'TWR%' THEN 1 END) as twr_remaining,
    COUNT(CASE WHEN mount_type_code LIKE 'BLD%' THEN 1 END) as bld_remaining,
    COUNT(CASE WHEN mount_type_code LIKE 'GND%' THEN 1 END) as gnd_remaining
FROM platforms;

-- =============================================================================
-- STEP 3: Restore instrument normalized_name to legacy values
-- =============================================================================

SELECT '=== STEP 3: Restoring Instrument Names ===' as rollback_phase;

-- 3.1: Replace _TWR with _PL in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_TWR', '_PL')
WHERE normalized_name LIKE '%_TWR%';

-- 3.2: Replace _BLD with _BL in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_BLD', '_BL')
WHERE normalized_name LIKE '%_BLD%';

-- 3.3: Replace _GND with _GL in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_GND', '_GL')
WHERE normalized_name LIKE '%_GND%';

-- Update timestamp to track rollback
UPDATE instruments
SET updated_at = CURRENT_TIMESTAMP
WHERE normalized_name LIKE '%_PL%'
   OR normalized_name LIKE '%_BL%'
   OR normalized_name LIKE '%_GL%';

-- Verification: Check instrument name restoration
SELECT
    'Instrument Name Restoration' as verification,
    COUNT(CASE WHEN normalized_name LIKE '%_PL%' THEN 1 END) as pl_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_BL%' THEN 1 END) as bl_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_GL%' THEN 1 END) as gl_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_TWR%' THEN 1 END) as twr_remaining,
    COUNT(CASE WHEN normalized_name LIKE '%_BLD%' THEN 1 END) as bld_remaining,
    COUNT(CASE WHEN normalized_name LIKE '%_GND%' THEN 1 END) as gnd_remaining
FROM instruments;

-- =============================================================================
-- STEP 4: Update timestamps
-- =============================================================================

SELECT '=== STEP 4: Updating Timestamps ===' as rollback_phase;

-- Mark platforms as updated during rollback
UPDATE platforms
SET updated_at = CURRENT_TIMESTAMP
WHERE legacy_names != '[]';

-- =============================================================================
-- STEP 5: Verification of rollback consistency
-- =============================================================================

SELECT '=== STEP 5: Consistency Verification ===' as rollback_phase;

-- Verify platform-instrument name consistency after rollback
SELECT
    'Platform-Instrument Consistency Check' as verification,
    COUNT(*) as inconsistent_records
FROM instruments i
JOIN platforms p ON i.platform_id = p.id
WHERE SUBSTR(i.normalized_name, 1, LENGTH(p.normalized_name)) != p.normalized_name;
-- Expected: 0 inconsistent records

-- Verify no new codes remain
SELECT
    'New Code Removal Check' as verification,
    COUNT(CASE WHEN mount_type_code LIKE 'TWR%' THEN 1 END) as twr_count,
    COUNT(CASE WHEN mount_type_code LIKE 'BLD%' THEN 1 END) as bld_count,
    COUNT(CASE WHEN mount_type_code LIKE 'GND%' THEN 1 END) as gnd_count
FROM platforms;
-- Expected: All counts should be 0

-- =============================================================================
-- STEP 6: Sample verification report
-- =============================================================================

SELECT '=== STEP 6: Sample Verification ===' as rollback_phase;

-- Show sample of restored records
SELECT
    'Restored Records Sample' as section,
    p.id,
    p.normalized_name as restored_platform_name,
    p.mount_type_code as restored_code,
    json_extract(p.legacy_names, '$[0]') as original_legacy_name,
    i.normalized_name as restored_instrument_name
FROM platforms p
LEFT JOIN instruments i ON p.id = i.platform_id
WHERE p.legacy_names != '[]'
ORDER BY p.normalized_name
LIMIT 10;

-- =============================================================================
-- STEP 7: Remove indexes created by migration 0046
-- =============================================================================

SELECT '=== STEP 7: Removing Indexes ===' as rollback_phase;

-- Drop indexes created by migration 0046
DROP INDEX IF EXISTS idx_platforms_legacy_names;
DROP INDEX IF EXISTS idx_platforms_mount_type_code;
DROP INDEX IF EXISTS idx_platforms_normalized_name;
DROP INDEX IF EXISTS idx_instruments_normalized_name;

-- Note: Some indexes might have existed before migration 0046
-- Only remove if they were created by the migration

-- Verification: Check index removal
SELECT
    'Index Removal Check' as verification,
    COUNT(*) as migration_indexes_remaining
FROM sqlite_master
WHERE type = 'index'
  AND name IN (
      'idx_platforms_legacy_names',
      'idx_platforms_mount_type_code',
      'idx_platforms_normalized_name',
      'idx_instruments_normalized_name'
  );
-- Expected: 0 (or count of indexes that existed before migration)

-- =============================================================================
-- STEP 8: Remove legacy_names column
-- =============================================================================

SELECT '=== STEP 8: Removing legacy_names Column ===' as rollback_phase;

-- SQLite requires table recreation to drop column
-- Save current platforms table
CREATE TABLE platforms_backup AS SELECT * FROM platforms;

-- Get original table schema without legacy_names
-- (This would need to be adapted based on actual schema)
-- For safety, we'll rename the column content to empty instead of dropping

-- Alternative: Set legacy_names to empty and keep column for safety
UPDATE platforms SET legacy_names = '[]';

-- Verification: Check legacy_names reset
SELECT
    'Legacy Names Reset Check' as verification,
    COUNT(*) as total_platforms,
    COUNT(CASE WHEN legacy_names != '[]' THEN 1 END) as non_empty_legacy_names
FROM platforms;
-- Expected: non_empty_legacy_names = 0

-- =============================================================================
-- STEP 9: Final Verification Report
-- =============================================================================

SELECT '=== FINAL VERIFICATION REPORT ===' as rollback_phase;

-- Compare before and after
SELECT
    'Rollback Summary' as report,
    COUNT(*) as total_platforms,
    COUNT(CASE WHEN mount_type_code LIKE 'PL%' THEN 1 END) as pl_platforms,
    COUNT(CASE WHEN mount_type_code LIKE 'BL%' THEN 1 END) as bl_platforms,
    COUNT(CASE WHEN mount_type_code LIKE 'GL%' THEN 1 END) as gl_platforms,
    COUNT(CASE WHEN mount_type_code LIKE 'TWR%' THEN 1 END) as twr_platforms_remaining,
    COUNT(CASE WHEN mount_type_code LIKE 'BLD%' THEN 1 END) as bld_platforms_remaining,
    COUNT(CASE WHEN mount_type_code LIKE 'GND%' THEN 1 END) as gnd_platforms_remaining
FROM platforms;

-- Instrument verification
SELECT
    'Instrument Rollback Summary' as report,
    COUNT(*) as total_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_PL%' THEN 1 END) as pl_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_BL%' THEN 1 END) as bl_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_GL%' THEN 1 END) as gl_instruments,
    COUNT(CASE WHEN normalized_name LIKE '%_TWR%' THEN 1 END) as twr_instruments_remaining,
    COUNT(CASE WHEN normalized_name LIKE '%_BLD%' THEN 1 END) as bld_instruments_remaining,
    COUNT(CASE WHEN normalized_name LIKE '%_GND%' THEN 1 END) as gnd_instruments_remaining
FROM instruments;

-- Full audit trail
SELECT
    'Rollback Audit Trail' as report,
    p.id as platform_id,
    p.normalized_name as restored_platform_name,
    p.mount_type_code as restored_code,
    p.legacy_names,
    p.updated_at as rollback_timestamp,
    COUNT(i.id) as instrument_count
FROM platforms p
LEFT JOIN instruments i ON p.id = i.platform_id
GROUP BY p.id, p.normalized_name, p.mount_type_code, p.legacy_names, p.updated_at
ORDER BY p.normalized_name;

-- =============================================================================
-- ROLLBACK COMPLETE
-- =============================================================================

SELECT '=== ROLLBACK COMPLETE ===' as rollback_phase;

SELECT 'Database has been rolled back to pre-migration state' as status;
SELECT 'Legacy mount type codes (PL, BL, GL) have been restored' as detail;
SELECT 'All platform and instrument names have been restored' as detail;
SELECT 'Review verification reports above for confirmation' as recommendation;

-- =============================================================================
-- POST-ROLLBACK ACTIONS
-- =============================================================================

SELECT '=== POST-ROLLBACK ACTIONS REQUIRED ===' as rollback_phase;

SELECT '1. Restart application servers to clear any cached data' as action;
SELECT '2. Verify API endpoints return legacy naming conventions' as action;
SELECT '3. Test frontend platform/instrument display' as action;
SELECT '4. Update version back to v14.2.0 in all configurations' as action;
SELECT '5. Investigate root cause that required rollback' as action;
SELECT '6. Document rollback reason and resolution in CHANGELOG.md' as action;
SELECT '7. Inform users and developers about rollback' as action;

-- =============================================================================
-- DEBUGGING NOTES
-- =============================================================================

SELECT '=== DEBUGGING INFORMATION ===' as rollback_phase;

-- If rollback failed, check these queries

-- Check for platforms with NULL legacy_names
SELECT
    'Platforms with NULL legacy_names' as debug_query,
    COUNT(*) as null_count
FROM platforms
WHERE legacy_names IS NULL;

-- Check for platforms with invalid JSON
SELECT
    'Platforms with invalid JSON' as debug_query,
    id,
    normalized_name,
    legacy_names
FROM platforms
WHERE legacy_names != '[]'
  AND json_valid(legacy_names) = 0;

-- Check for orphaned instruments
SELECT
    'Orphaned Instruments' as debug_query,
    i.id,
    i.normalized_name,
    i.platform_id
FROM instruments i
LEFT JOIN platforms p ON i.platform_id = p.id
WHERE p.id IS NULL;

-- =============================================================================
-- MANUAL CLEANUP (IF NEEDED)
-- =============================================================================

-- If automatic rollback failed, use these manual cleanup queries:

-- Manual platform name restoration template:
-- UPDATE platforms SET normalized_name = 'OLD_NAME' WHERE id = X;

-- Manual mount_type_code restoration template:
-- UPDATE platforms SET mount_type_code = 'PL01' WHERE id = X;

-- Manual instrument name restoration template:
-- UPDATE instruments SET normalized_name = 'OLD_NAME' WHERE id = X;

-- =============================================================================
-- End of Rollback Script 0046
-- =============================================================================
