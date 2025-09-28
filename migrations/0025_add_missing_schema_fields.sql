-- Migration 0025: Add Missing Schema Fields for Complete YAML-to-Database Mapping
-- Zero-downtime enhancement with backward compatibility
-- Generated: 2025-09-28
-- Priority: HIGH - Essential for complete data model coverage

-- Add missing fields to instruments table
-- These fields enhance instrument metadata for scientific accuracy
ALTER TABLE instruments ADD COLUMN instrument_deployment_date DATE;
ALTER TABLE instruments ADD COLUMN instrument_degrees_from_nadir REAL;
ALTER TABLE instruments ADD COLUMN legacy_acronym TEXT;
ALTER TABLE instruments ADD COLUMN camera_aperture TEXT;
ALTER TABLE instruments ADD COLUMN camera_exposure_time TEXT;
ALTER TABLE instruments ADD COLUMN camera_focal_length_mm REAL;
ALTER TABLE instruments ADD COLUMN camera_iso TEXT;
ALTER TABLE instruments ADD COLUMN camera_lens TEXT;
ALTER TABLE instruments ADD COLUMN camera_mega_pixels TEXT;
ALTER TABLE instruments ADD COLUMN camera_white_balance TEXT;
ALTER TABLE instruments ADD COLUMN epsg_code TEXT DEFAULT 'EPSG:4326';

-- Add EPSG code to all tables for proper geospatial reference
ALTER TABLE stations ADD COLUMN epsg_code TEXT DEFAULT 'EPSG:4326';
ALTER TABLE platforms ADD COLUMN epsg_code TEXT DEFAULT 'EPSG:4326';

-- Add comment field to ROI table for enhanced documentation
ALTER TABLE instrument_rois ADD COLUMN comment TEXT;

-- Create indexes for performance optimization on new fields
CREATE INDEX IF NOT EXISTS idx_instruments_deployment_date ON instruments(instrument_deployment_date);
CREATE INDEX IF NOT EXISTS idx_instruments_legacy_acronym ON instruments(legacy_acronym);
CREATE INDEX IF NOT EXISTS idx_instruments_epsg_code ON instruments(epsg_code);
CREATE INDEX IF NOT EXISTS idx_stations_epsg_code ON stations(epsg_code);
CREATE INDEX IF NOT EXISTS idx_platforms_epsg_code ON platforms(epsg_code);

-- Create metadata table for migration tracking
CREATE TABLE IF NOT EXISTS migration_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_number TEXT NOT NULL UNIQUE,
    description TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    fields_added INTEGER,
    performance_impact TEXT,
    backward_compatible BOOLEAN DEFAULT true
);

-- Record this migration
INSERT INTO migration_metadata (migration_number, description, fields_added, performance_impact, backward_compatible)
VALUES ('0025', 'Added missing schema fields for complete YAML mapping', 14, 'Minimal - indexed appropriately', true);

-- Summary:
-- Fields Added: 14 total
-- - Instruments: 11 new fields (deployment_date, degrees_from_nadir, legacy_acronym, camera_*)
-- - All tables: epsg_code for geospatial reference
-- - ROIs: comment field for documentation
-- Indexes Created: 5 performance optimization indexes
-- Backward Compatibility: 100% maintained
-- Zero Downtime: All ALTER TABLE operations are non-blocking