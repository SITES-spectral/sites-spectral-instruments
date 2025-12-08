-- SITES Spectral v11.0.0-alpha.1 Migration
-- Standard Vocabulary Alignment (Darwin Core, ICOS, Copernicus)
-- Date: 2025-12-08

-- ============================================================
-- 1. STATION DARWIN CORE FIELDS
-- ============================================================
-- Add Darwin Core location metadata fields

ALTER TABLE stations ADD COLUMN dwc_location_id TEXT;
ALTER TABLE stations ADD COLUMN dwc_geodetic_datum TEXT DEFAULT 'EPSG:4326';
ALTER TABLE stations ADD COLUMN dwc_coordinate_uncertainty_m REAL;
ALTER TABLE stations ADD COLUMN dwc_country_code TEXT DEFAULT 'SE';
ALTER TABLE stations ADD COLUMN dwc_state_province TEXT;
ALTER TABLE stations ADD COLUMN dwc_locality TEXT;

-- ICOS station type classification
ALTER TABLE stations ADD COLUMN station_type TEXT;  -- TER, ATM, AQA, INT

-- Create index for station type queries
CREATE INDEX IF NOT EXISTS idx_station_type ON stations(station_type);

-- ============================================================
-- 2. PLATFORM VOCABULARY ALIGNMENT
-- ============================================================
-- Standard mount type nomenclature

ALTER TABLE platforms ADD COLUMN mount_type_standard TEXT;  -- tower, building, ground, aerial, satellite
ALTER TABLE platforms ADD COLUMN measurement_objective TEXT;  -- vegetation_health, radiation_balance, etc.

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_platform_mount_type_standard ON platforms(mount_type_standard);
CREATE INDEX IF NOT EXISTS idx_platform_measurement_objective ON platforms(measurement_objective);

-- ============================================================
-- 3. PRODUCT LICENSE METADATA
-- ============================================================
-- Data license and DOI support for ICOS/SITES compatibility

ALTER TABLE products ADD COLUMN data_license TEXT DEFAULT 'CC-BY-4.0';
ALTER TABLE products ADD COLUMN license_url TEXT DEFAULT 'https://creativecommons.org/licenses/by/4.0/';
ALTER TABLE products ADD COLUMN associated_doi TEXT;
ALTER TABLE products ADD COLUMN quality_control_level TEXT DEFAULT 'raw';  -- raw, quality_controlled, validated, research_grade
ALTER TABLE products ADD COLUMN instrument_id INTEGER REFERENCES instruments(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_license ON products(data_license);
CREATE INDEX IF NOT EXISTS idx_product_qc_level ON products(quality_control_level);
CREATE INDEX IF NOT EXISTS idx_product_instrument ON products(instrument_id);

-- ============================================================
-- 4. ENHANCED AOI FIELDS FOR V11
-- ============================================================
-- Mission type and recurrence for geospatial features

ALTER TABLE areas_of_interest ADD COLUMN platform_type_code TEXT;  -- fixed, uav, satellite
ALTER TABLE areas_of_interest ADD COLUMN mission_type TEXT DEFAULT 'monitoring';  -- monitoring, survey, calibration
ALTER TABLE areas_of_interest ADD COLUMN mission_recurrence TEXT DEFAULT 'one_time';  -- daily, weekly, monthly, seasonal, one_time
ALTER TABLE areas_of_interest ADD COLUMN source_format TEXT DEFAULT 'manual';  -- manual, geojson, kml
ALTER TABLE areas_of_interest ADD COLUMN metadata_json TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_aoi_platform_type ON areas_of_interest(platform_type_code);
CREATE INDEX IF NOT EXISTS idx_aoi_mission_type ON areas_of_interest(mission_type);
CREATE INDEX IF NOT EXISTS idx_aoi_source_format ON areas_of_interest(source_format);

-- ============================================================
-- 5. ENHANCED CAMPAIGN FIELDS FOR V11
-- ============================================================
-- Additional fields for campaign management

ALTER TABLE acquisition_campaigns ADD COLUMN coordinator_id INTEGER;
ALTER TABLE acquisition_campaigns ADD COLUMN participants_json TEXT;  -- JSON array of user IDs
ALTER TABLE acquisition_campaigns ADD COLUMN objectives_json TEXT;  -- JSON array of objectives
ALTER TABLE acquisition_campaigns ADD COLUMN expected_outcomes_json TEXT;  -- JSON array
ALTER TABLE acquisition_campaigns ADD COLUMN funding_source TEXT;
ALTER TABLE acquisition_campaigns ADD COLUMN budget REAL;
ALTER TABLE acquisition_campaigns ADD COLUMN campaign_type_v11 TEXT DEFAULT 'field_campaign';  -- field_campaign, continuous_monitoring, calibration, validation, experimental

-- ============================================================
-- 6. VOCABULARY MAPPINGS TABLE (Optional Reference)
-- ============================================================
-- For storing standard vocabulary term mappings

CREATE TABLE IF NOT EXISTS vocabulary_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vocabulary_source TEXT NOT NULL,    -- 'darwin_core', 'icos', 'copernicus', 'sites'
    local_term TEXT NOT NULL,
    standard_term TEXT NOT NULL,
    standard_uri TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard vocabulary mappings
INSERT OR IGNORE INTO vocabulary_mappings (vocabulary_source, local_term, standard_term, standard_uri, description) VALUES
-- Darwin Core mappings
('darwin_core', 'latitude', 'decimalLatitude', 'http://rs.tdwg.org/dwc/terms/decimalLatitude', 'Latitude in decimal degrees'),
('darwin_core', 'longitude', 'decimalLongitude', 'http://rs.tdwg.org/dwc/terms/decimalLongitude', 'Longitude in decimal degrees'),
('darwin_core', 'acronym', 'locationID', 'http://rs.tdwg.org/dwc/terms/locationID', 'Stable unique identifier'),

-- ICOS station type mappings
('icos', 'TER', 'terrestrial_ecosystem', 'https://meta.icos-cp.eu/ontologies/cpmeta/', 'Land ecosystem monitoring'),
('icos', 'ATM', 'atmospheric', 'https://meta.icos-cp.eu/ontologies/cpmeta/', 'Atmospheric composition'),
('icos', 'AQA', 'aquatic', 'https://meta.icos-cp.eu/ontologies/cpmeta/', 'Aquatic monitoring'),
('icos', 'INT', 'integrated', 'https://meta.icos-cp.eu/ontologies/cpmeta/', 'Multi-domain observation'),

-- Mount type mappings (legacy to standard)
('icos', 'PL', 'tower', 'https://meta.icos-cp.eu/ontologies/cpmeta/', 'Flux tower or mast'),
('icos', 'BL', 'building', 'https://meta.icos-cp.eu/ontologies/cpmeta/', 'Building-mounted station'),
('icos', 'GL', 'ground', 'https://meta.icos-cp.eu/ontologies/cpmeta/', 'Ground-level installation'),

-- Copernicus processing level mappings
('copernicus', 'L0', 'Level-0', 'https://sentinel.esa.int/web/sentinel/technical-guides', 'Raw data'),
('copernicus', 'L1', 'Level-1C', 'https://sentinel.esa.int/web/sentinel/technical-guides', 'Top-of-atmosphere reflectance'),
('copernicus', 'L2', 'Level-2A', 'https://sentinel.esa.int/web/sentinel/technical-guides', 'Bottom-of-atmosphere reflectance'),
('copernicus', 'L3', 'Level-3', 'https://sentinel.esa.int/web/sentinel/technical-guides', 'Spatially/temporally aggregated'),

-- License mappings
('license', 'CC-BY-4.0', 'Creative Commons Attribution 4.0', 'https://creativecommons.org/licenses/by/4.0/', 'ICOS/SITES compatible'),
('license', 'CC-BY-SA-4.0', 'Creative Commons Attribution-ShareAlike 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'ShareAlike license'),
('license', 'CC0-1.0', 'Creative Commons Zero', 'https://creativecommons.org/publicdomain/zero/1.0/', 'Public domain');

-- Create index for vocabulary lookups
CREATE INDEX IF NOT EXISTS idx_vocab_source ON vocabulary_mappings(vocabulary_source);
CREATE INDEX IF NOT EXISTS idx_vocab_local ON vocabulary_mappings(local_term);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Version: 11.0.0-alpha.1
-- Date: 2025-12-08
--
-- New Columns:
--   - stations: dwc_*, station_type
--   - platforms: mount_type_standard, measurement_objective
--   - products: data_license, license_url, associated_doi, quality_control_level, instrument_id
--   - areas_of_interest: platform_type_code, mission_type, mission_recurrence, source_format, metadata_json
--   - acquisition_campaigns: coordinator_id, participants_json, objectives_json, expected_outcomes_json, funding_source, budget, campaign_type_v11
--
-- New Tables:
--   - vocabulary_mappings
--
-- Standards Aligned:
--   - Darwin Core (location metadata)
--   - ICOS (station types, measurement objectives)
--   - ESA Copernicus (processing levels)
--   - CC-BY-4.0 (default license for ICOS/SITES compatibility)
