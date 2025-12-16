-- Migration: 0041_coordinate_validation_triggers.sql
-- Date: 2025-12-16
-- Description: Re-apply coordinate validation triggers
-- Status: APPLIED MANUALLY (triggers created via wrangler d1 execute)
--
-- D1 SQLite requires simpler trigger syntax - WHEN clause handles the condition,
-- RAISE() is called directly in BEGIN...END block.
--
-- 12 triggers created (lat/lon × insert/update × 3 tables):
-- - validate_station_lat_insert, validate_station_lon_insert
-- - validate_station_lat_update, validate_station_lon_update
-- - validate_platform_lat_insert, validate_platform_lon_insert
-- - validate_platform_lat_update, validate_platform_lon_update
-- - validate_instrument_lat_insert, validate_instrument_lon_insert
-- - validate_instrument_lat_update, validate_instrument_lon_update

-- Drop any old-style triggers
DROP TRIGGER IF EXISTS validate_station_coordinates_insert;
DROP TRIGGER IF EXISTS validate_station_coordinates_update;
DROP TRIGGER IF EXISTS validate_platform_coordinates_insert;
DROP TRIGGER IF EXISTS validate_platform_coordinates_update;
DROP TRIGGER IF EXISTS validate_instrument_coordinates_insert;
DROP TRIGGER IF EXISTS validate_instrument_coordinates_update;

-- Station coordinate validation triggers
CREATE TRIGGER validate_station_lat_insert BEFORE INSERT ON stations FOR EACH ROW WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) BEGIN SELECT RAISE(ABORT, 'Station latitude must be between -90 and 90'); END;
CREATE TRIGGER validate_station_lon_insert BEFORE INSERT ON stations FOR EACH ROW WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) BEGIN SELECT RAISE(ABORT, 'Station longitude must be between -180 and 180'); END;
CREATE TRIGGER validate_station_lat_update BEFORE UPDATE ON stations FOR EACH ROW WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) BEGIN SELECT RAISE(ABORT, 'Station latitude must be between -90 and 90'); END;
CREATE TRIGGER validate_station_lon_update BEFORE UPDATE ON stations FOR EACH ROW WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) BEGIN SELECT RAISE(ABORT, 'Station longitude must be between -180 and 180'); END;

-- Platform coordinate validation triggers
CREATE TRIGGER validate_platform_lat_insert BEFORE INSERT ON platforms FOR EACH ROW WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) BEGIN SELECT RAISE(ABORT, 'Platform latitude must be between -90 and 90'); END;
CREATE TRIGGER validate_platform_lon_insert BEFORE INSERT ON platforms FOR EACH ROW WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) BEGIN SELECT RAISE(ABORT, 'Platform longitude must be between -180 and 180'); END;
CREATE TRIGGER validate_platform_lat_update BEFORE UPDATE ON platforms FOR EACH ROW WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) BEGIN SELECT RAISE(ABORT, 'Platform latitude must be between -90 and 90'); END;
CREATE TRIGGER validate_platform_lon_update BEFORE UPDATE ON platforms FOR EACH ROW WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) BEGIN SELECT RAISE(ABORT, 'Platform longitude must be between -180 and 180'); END;

-- Instrument coordinate validation triggers
CREATE TRIGGER validate_instrument_lat_insert BEFORE INSERT ON instruments FOR EACH ROW WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) BEGIN SELECT RAISE(ABORT, 'Instrument latitude must be between -90 and 90'); END;
CREATE TRIGGER validate_instrument_lon_insert BEFORE INSERT ON instruments FOR EACH ROW WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) BEGIN SELECT RAISE(ABORT, 'Instrument longitude must be between -180 and 180'); END;
CREATE TRIGGER validate_instrument_lat_update BEFORE UPDATE ON instruments FOR EACH ROW WHEN NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) BEGIN SELECT RAISE(ABORT, 'Instrument latitude must be between -90 and 90'); END;
CREATE TRIGGER validate_instrument_lon_update BEFORE UPDATE ON instruments FOR EACH ROW WHEN NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) BEGIN SELECT RAISE(ABORT, 'Instrument longitude must be between -180 and 180'); END;
