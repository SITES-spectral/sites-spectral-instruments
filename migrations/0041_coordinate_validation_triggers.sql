-- Migration: 0041_coordinate_validation_triggers.sql
-- Date: 2025-12-16
-- Description: Re-apply coordinate validation triggers
--
-- These triggers were originally defined in migration 0028 but may not have been applied.
-- This migration ensures they exist for data integrity.
--
-- Validates:
-- - Latitude: -90 to 90 degrees
-- - Longitude: -180 to 180 degrees
--
-- Applied to: stations, platforms, instruments tables

-- ============================================================================
-- COORDINATE VALIDATION TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist (idempotent)
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
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify triggers exist with:
-- SELECT name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'validate_%';
--
-- Expected results: 6 triggers
-- - validate_station_coordinates_insert
-- - validate_station_coordinates_update
-- - validate_platform_coordinates_insert
-- - validate_platform_coordinates_update
-- - validate_instrument_coordinates_insert
-- - validate_instrument_coordinates_update
