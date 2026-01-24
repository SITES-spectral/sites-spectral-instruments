-- Migration 0028: Schema Consolidation for v7.0.0
-- Consolidates redundant fields and adds data validation
-- Generated: 2025-11-26
-- Priority: HIGH - Part of v7.0.0 major refactoring

-- ============================================================================
-- PHASE 1: Data Consolidation
-- Sync data from redundant fields to primary fields where primary is NULL
-- ============================================================================

-- Sync instrument_deployment_date -> deployment_date (if deployment_date is NULL)
UPDATE instruments
SET deployment_date = instrument_deployment_date
WHERE deployment_date IS NULL AND instrument_deployment_date IS NOT NULL;

-- Sync instrument_degrees_from_nadir -> degrees_from_nadir (if degrees_from_nadir is NULL)
UPDATE instruments
SET degrees_from_nadir = instrument_degrees_from_nadir
WHERE degrees_from_nadir IS NULL AND instrument_degrees_from_nadir IS NOT NULL;

-- ============================================================================
-- PHASE 2: Deprecation Documentation
-- Mark redundant fields as deprecated in metadata
-- Note: SQLite doesn't support DROP COLUMN on existing tables without recreation
-- These fields are marked deprecated and should not be used in new code
-- ============================================================================

-- Create deprecation tracking table
CREATE TABLE IF NOT EXISTS schema_deprecations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    deprecated_in_version TEXT NOT NULL,
    replacement_column TEXT,
    migration_number TEXT NOT NULL,
    deprecation_date DATE DEFAULT CURRENT_DATE,
    removal_planned TEXT,
    notes TEXT,
    UNIQUE(table_name, column_name)
);

-- Record deprecated columns
INSERT OR IGNORE INTO schema_deprecations (table_name, column_name, deprecated_in_version, replacement_column, migration_number, removal_planned, notes)
VALUES
    ('instruments', 'instrument_deployment_date', '7.0.0', 'deployment_date', '0028', '8.0.0', 'Use deployment_date instead. Data synced in migration 0028.'),
    ('instruments', 'instrument_degrees_from_nadir', '7.0.0', 'degrees_from_nadir', '0028', '8.0.0', 'Use degrees_from_nadir instead. Data synced in migration 0028.');

-- ============================================================================
-- PHASE 3: Data Validation Triggers
-- Add triggers to validate coordinate ranges on INSERT/UPDATE
-- SQLite CHECK constraints can only be added during table creation
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS validate_station_coordinates_insert;
DROP TRIGGER IF EXISTS validate_station_coordinates_update;
DROP TRIGGER IF EXISTS validate_platform_coordinates_insert;
DROP TRIGGER IF EXISTS validate_platform_coordinates_update;
DROP TRIGGER IF EXISTS validate_instrument_coordinates_insert;
DROP TRIGGER IF EXISTS validate_instrument_coordinates_update;

-- Station coordinate validation triggers
CREATE TRIGGER validate_station_coordinates_insert
BEFORE INSERT ON stations
FOR EACH ROW
WHEN NEW.latitude IS NOT NULL OR NEW.longitude IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90)
        THEN RAISE(ABORT, 'Station latitude must be between -90 and 90')
        WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180)
        THEN RAISE(ABORT, 'Station longitude must be between -180 and 180')
    END;
END;

CREATE TRIGGER validate_station_coordinates_update
BEFORE UPDATE ON stations
FOR EACH ROW
WHEN NEW.latitude IS NOT NULL OR NEW.longitude IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90)
        THEN RAISE(ABORT, 'Station latitude must be between -90 and 90')
        WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180)
        THEN RAISE(ABORT, 'Station longitude must be between -180 and 180')
    END;
END;

-- Platform coordinate validation triggers
CREATE TRIGGER validate_platform_coordinates_insert
BEFORE INSERT ON platforms
FOR EACH ROW
WHEN NEW.latitude IS NOT NULL OR NEW.longitude IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90)
        THEN RAISE(ABORT, 'Platform latitude must be between -90 and 90')
        WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180)
        THEN RAISE(ABORT, 'Platform longitude must be between -180 and 180')
    END;
END;

CREATE TRIGGER validate_platform_coordinates_update
BEFORE UPDATE ON platforms
FOR EACH ROW
WHEN NEW.latitude IS NOT NULL OR NEW.longitude IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90)
        THEN RAISE(ABORT, 'Platform latitude must be between -90 and 90')
        WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180)
        THEN RAISE(ABORT, 'Platform longitude must be between -180 and 180')
    END;
END;

-- Instrument coordinate validation triggers
CREATE TRIGGER validate_instrument_coordinates_insert
BEFORE INSERT ON instruments
FOR EACH ROW
WHEN NEW.latitude IS NOT NULL OR NEW.longitude IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90)
        THEN RAISE(ABORT, 'Instrument latitude must be between -90 and 90')
        WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180)
        THEN RAISE(ABORT, 'Instrument longitude must be between -180 and 180')
    END;
END;

CREATE TRIGGER validate_instrument_coordinates_update
BEFORE UPDATE ON instruments
FOR EACH ROW
WHEN NEW.latitude IS NOT NULL OR NEW.longitude IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90)
        THEN RAISE(ABORT, 'Instrument latitude must be between -90 and 90')
        WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180)
        THEN RAISE(ABORT, 'Instrument longitude must be between -180 and 180')
    END;
END;

-- ============================================================================
-- PHASE 4: Performance Indexes
-- Ensure all commonly queried fields have indexes
-- ============================================================================

-- Add any missing indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_instruments_status ON instruments(status);
CREATE INDEX IF NOT EXISTS idx_instruments_instrument_type ON instruments(instrument_type);
CREATE INDEX IF NOT EXISTS idx_platforms_status ON platforms(status);
CREATE INDEX IF NOT EXISTS idx_stations_status ON stations(status);
CREATE INDEX IF NOT EXISTS idx_instrument_rois_instrument_id ON instrument_rois(instrument_id);

-- ============================================================================
-- PHASE 5: Record Migration
-- ============================================================================

INSERT INTO migration_metadata (migration_number, description, fields_added, performance_impact, backward_compatible)
VALUES ('0028', 'Schema consolidation for v7.0.0 - synced redundant fields, added coordinate validation triggers, marked deprecated columns', 0, 'Minimal - triggers add validation overhead', true);

-- ============================================================================
-- Summary:
-- Data Synced: instrument_deployment_date -> deployment_date, instrument_degrees_from_nadir -> degrees_from_nadir
-- Deprecated: 2 redundant columns marked for removal in v8.0.0
-- Validation: 6 triggers for coordinate range validation (lat: -90 to 90, lon: -180 to 180)
-- Indexes: 5 performance indexes added
-- Backward Compatibility: 100% maintained (deprecated columns still exist)
-- ============================================================================
