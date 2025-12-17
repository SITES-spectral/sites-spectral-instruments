-- Migration: 0042_normalize_mount_type_codes.sql
-- Description: Normalize mount type codes to consistent 3-letter format
-- Version: 12.0.0 (BREAKING CHANGE)
-- Date: 2025-12-17
--
-- Rationale:
--   Current codes are inconsistent: PL, BL, GL (2 letters) vs UAV, SAT, MOB (3 letters)
--   Normalizing to 3 letters provides:
--   - Consistent code length across all mount types
--   - Industry-standard abbreviations (TWR=Tower, BLD=Building, GND=Ground)
--   - Better alignment with international vocabularies
--
-- Changes:
--   PL -> TWR (Tower/Mast - standard aviation/infrastructure abbreviation)
--   BL -> BLD (Building - common abbreviation)
--   GL -> GND (Ground - standard abbreviation)
--
-- Impact:
--   - Updates mount_type_code column values
--   - Updates normalized_name column to reflect new codes
--   - Backward compatible: old codes can be mapped in application layer

-- ============================================================
-- Step 1: Update mount_type_code values
-- ============================================================

-- PL -> TWR (Pole/Tower/Mast)
UPDATE platforms
SET mount_type_code = REPLACE(mount_type_code, 'PL', 'TWR')
WHERE mount_type_code LIKE 'PL%';

-- BL -> BLD (Building)
UPDATE platforms
SET mount_type_code = REPLACE(mount_type_code, 'BL', 'BLD')
WHERE mount_type_code LIKE 'BL%';

-- GL -> GND (Ground Level)
UPDATE platforms
SET mount_type_code = REPLACE(mount_type_code, 'GL', 'GND')
WHERE mount_type_code LIKE 'GL%';

-- ============================================================
-- Step 2: Update normalized_name to match new codes
-- ============================================================

-- For fixed platforms: {STATION}_{ECOSYSTEM}_{MOUNT_TYPE_CODE}
-- Example: SVB_FOR_PL01 -> SVB_FOR_TWR01

-- PL -> TWR in normalized_name
UPDATE platforms
SET normalized_name = REPLACE(normalized_name, '_PL', '_TWR')
WHERE platform_type = 'fixed' AND normalized_name LIKE '%_PL%';

-- BL -> BLD in normalized_name
UPDATE platforms
SET normalized_name = REPLACE(normalized_name, '_BL', '_BLD')
WHERE platform_type = 'fixed' AND normalized_name LIKE '%_BL%';

-- GL -> GND in normalized_name
UPDATE platforms
SET normalized_name = REPLACE(normalized_name, '_GL', '_GND')
WHERE platform_type = 'fixed' AND normalized_name LIKE '%_GL%';

-- ============================================================
-- Step 3: Update instrument normalized_name (references platform)
-- ============================================================

-- Instruments follow pattern: {PLATFORM_NAME}_{TYPE}{##}
-- Example: SVB_FOR_PL01_PHE01 -> SVB_FOR_TWR01_PHE01

-- PL -> TWR in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_PL', '_TWR')
WHERE normalized_name LIKE '%_PL%';

-- BL -> BLD in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_BL', '_BLD')
WHERE normalized_name LIKE '%_BL%';

-- GL -> GND in instrument normalized_name
UPDATE instruments
SET normalized_name = REPLACE(normalized_name, '_GL', '_GND')
WHERE normalized_name LIKE '%_GL%';

-- ============================================================
-- Step 4: Verify migration success
-- ============================================================

-- This should return 0 rows after migration (no legacy codes remaining)
-- SELECT COUNT(*) as legacy_mount_codes FROM platforms
-- WHERE mount_type_code LIKE 'PL%' OR mount_type_code LIKE 'BL%' OR mount_type_code LIKE 'GL%';

-- This should return 0 rows after migration
-- SELECT COUNT(*) as legacy_platform_names FROM platforms
-- WHERE normalized_name LIKE '%_PL%' OR normalized_name LIKE '%_BL%' OR normalized_name LIKE '%_GL%';
