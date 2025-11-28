-- Migration 0031: Add ecosystem_code to platforms table
-- SITES Spectral v8.0.0-rc.5
-- Date: 2025-11-28
-- Purpose: Fix ecosystems display showing "unknown" by adding ecosystem_code column

-- ============================================================================
-- PHASE 1: Add ecosystem_code column
-- ============================================================================

ALTER TABLE platforms ADD COLUMN ecosystem_code TEXT;

-- ============================================================================
-- PHASE 2: Populate ecosystem_code from normalized_name
-- Pattern: {STATION}_{ECOSYSTEM}_{LOCATION} or {STATION}_{SUB}_{ECOSYSTEM}_{LOCATION}
-- The ecosystem code is the 3-letter segment immediately before the location code
-- ============================================================================

-- For standard patterns like SVB_MIR_PL01, ANS_FOR_BL01, LON_AGR_PL01
-- Extract the segment just before location_code
UPDATE platforms
SET ecosystem_code = CASE
    -- Handle standard 3-part names: STATION_ECO_LOCATION
    WHEN length(normalized_name) - length(location_code) - 1 > 0 THEN
        substr(
            replace(normalized_name, '_' || location_code, ''),
            length(replace(normalized_name, '_' || location_code, '')) - 2,
            3
        )
    ELSE NULL
END
WHERE ecosystem_code IS NULL;

-- Manual fixes for any edge cases that didn't parse correctly
-- Based on known ecosystem codes: FOR, MIR, AGR, LAK, WET, CEM, MAD, SRC, FOL, NYB

-- Create index for ecosystem queries
CREATE INDEX IF NOT EXISTS idx_platforms_ecosystem_code ON platforms(ecosystem_code);

-- ============================================================================
-- PHASE 3: Record migration (if table exists)
-- ============================================================================

-- Create migration_metadata table if not exists
CREATE TABLE IF NOT EXISTS migration_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_number TEXT NOT NULL UNIQUE,
    description TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    fields_added INTEGER,
    performance_impact TEXT,
    backward_compatible BOOLEAN DEFAULT true
);

INSERT OR IGNORE INTO migration_metadata (migration_number, description, fields_added, performance_impact, backward_compatible)
VALUES ('0031', 'Added ecosystem_code column to platforms table for Station Overview display', 1, 'Minimal - single column with index', true);

-- ============================================================================
-- Summary:
-- - Added ecosystem_code TEXT column to platforms table
-- - Populated from normalized_name pattern extraction
-- - Created index for query performance
-- ============================================================================
