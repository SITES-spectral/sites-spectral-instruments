-- Migration 0044: Add Alnarp & Hyltemossa stations with management tracking
-- Both stations have platforms managed by different institutions (SITES Spectral/MGeo, ICOS, etc.)
-- This migration adds fields to easily identify SITES member stations and track platform management

-- ============================================================================
-- PART 1: Add SITES membership and management tracking fields
-- ============================================================================

-- Add SITES membership flag to stations table for easy filtering
ALTER TABLE stations ADD COLUMN sites_member BOOLEAN DEFAULT false;

-- Add SITES thematic programs to stations (JSON array or comma-separated)
-- e.g., "SITES Spectral, SITES Water, SITES AquaNet"
ALTER TABLE stations ADD COLUMN sites_thematic_programs TEXT;

-- Add ICOS membership information
ALTER TABLE stations ADD COLUMN icos_member BOOLEAN DEFAULT false;
ALTER TABLE stations ADD COLUMN icos_class TEXT;  -- 'Class 1', 'Class 2', 'Associated'

-- Managing institution for platforms (e.g., "Lund University", "SLU")
ALTER TABLE platforms ADD COLUMN managing_institution TEXT;

-- Managing department (e.g., "Department of Earth and Environmental Sciences (MGeo)")
ALTER TABLE platforms ADD COLUMN managing_department TEXT;

-- Primary contact email for the platform
ALTER TABLE platforms ADD COLUMN contact_email TEXT;

-- Thematic program affiliation (e.g., "SITES Spectral", "ICOS Sweden", "SITES Water")
ALTER TABLE platforms ADD COLUMN thematic_program TEXT;

-- ============================================================================
-- PART 2: Update existing SITES stations with membership flags
-- ============================================================================

-- All current 7 stations are SITES members
UPDATE stations SET sites_member = true WHERE acronym IN ('ANS', 'ASA', 'GRI', 'LON', 'RBD', 'SKC', 'SVB');

-- Set SITES thematic programs for existing stations
UPDATE stations SET sites_thematic_programs = 'SITES Spectral' WHERE acronym IN ('ANS', 'ASA', 'GRI', 'LON', 'RBD', 'SKC', 'SVB');

-- Set ICOS membership for existing stations
UPDATE stations SET icos_member = true, icos_class = 'Class 1' WHERE acronym IN ('SVB', 'SKC');
UPDATE stations SET icos_member = true, icos_class = 'Class 2' WHERE acronym = 'ANS';
UPDATE stations SET icos_member = true WHERE acronym IN ('GRI', 'LON', 'RBD');

-- ============================================================================
-- PART 3: Add Alnarp station (ALN)
-- ============================================================================

INSERT INTO stations (
    normalized_name,
    display_name,
    acronym,
    status,
    country,
    latitude,
    longitude,
    elevation_m,
    description,
    station_type,
    sites_member,
    sites_thematic_programs,
    icos_member,
    dwc_location_id,
    dwc_geodetic_datum,
    dwc_country_code,
    dwc_state_province,
    dwc_locality
) VALUES (
    'alnarp',
    'Alnarp',
    'ALN',
    'Active',
    'Sweden',
    55.6594,
    13.0822,
    10.0,
    'Alnarp Research Station - SLU campus. 5 platforms: 3 managed by MGeo/Lund University (SITES Spectral), 2 by ICOS Sweden',
    'TER',
    true,
    'SITES Spectral',
    true,
    'urn:sites:station:ALN',
    'EPSG:4326',
    'SE',
    'Skane',
    'Alnarp, Lomma Municipality'
);

-- ============================================================================
-- PART 4: Add Hyltemossa station (HYL)
-- ============================================================================

INSERT INTO stations (
    normalized_name,
    display_name,
    acronym,
    status,
    country,
    latitude,
    longitude,
    elevation_m,
    description,
    station_type,
    sites_member,
    sites_thematic_programs,
    icos_member,
    icos_class,
    dwc_location_id,
    dwc_geodetic_datum,
    dwc_country_code,
    dwc_state_province,
    dwc_locality
) VALUES (
    'hyltemossa',
    'Hyltemossa',
    'HYL',
    'Active',
    'Sweden',
    56.0976,
    13.4189,
    115.0,
    'Hyltemossa ICOS/SITES station - Mixed coniferous forest ecosystem with flux tower and spectral observations',
    'TER',
    true,
    'SITES Spectral',
    true,
    'Class 1',
    'urn:sites:station:HYL',
    'EPSG:4326',
    'SE',
    'Skane',
    'Hyltemossa, Perstorp Municipality'
);

-- ============================================================================
-- PART 5: Add Alnarp platforms (4 total: 2 SITES Spectral/MGeo, 2 ICOS)
-- ============================================================================

-- Platform 1: SITES Spectral / MGeo - Fixed tower
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    platform_type,
    mounting_structure,
    status,
    ecosystem_code,
    operation_programs,
    managing_institution,
    managing_department,
    thematic_program,
    description,
    latitude,
    longitude
) SELECT
    id,
    'ALN_AGR_TWR01',
    'Alnarp Agricultural Tower 01 (SITES Spectral)',
    'TWR',
    'fixed',
    'Tower',
    'Planned',
    'AGR',
    'SITES, SITES Spectral',
    'Lund University',
    'Department of Earth and Environmental Sciences (MGeo)',
    'SITES Spectral Thematic Program',
    'Fixed tower managed by MGeo/Lund University for SITES Spectral - PLACEHOLDER: coordinates and specifications TBD',
    NULL,
    NULL
FROM stations WHERE acronym = 'ALN';

-- Platform 2: SITES Spectral / MGeo - UAV (DJI M3M)
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    platform_type,
    status,
    ecosystem_code,
    operation_programs,
    managing_institution,
    managing_department,
    thematic_program,
    description,
    latitude,
    longitude
) SELECT
    id,
    'ALN_DJI_M3M_UAV01',
    'Alnarp DJI Mavic 3 Multispectral (SITES Spectral)',
    'UAV',
    'uav',
    'Active',
    'AGR',
    'SITES, SITES Spectral',
    'Lund University',
    'Department of Earth and Environmental Sciences (MGeo)',
    'SITES Spectral Thematic Program',
    'DJI Mavic 3 Multispectral UAV - test flights 2023-05-21, operational for agricultural monitoring',
    55.6594,
    13.0822
FROM stations WHERE acronym = 'ALN';

-- Platform 3: ICOS - Tower 01
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    platform_type,
    mounting_structure,
    status,
    ecosystem_code,
    operation_programs,
    managing_institution,
    thematic_program,
    description,
    latitude,
    longitude
) SELECT
    id,
    'ALN_AGR_TWR02',
    'Alnarp ICOS Tower 01',
    'TWR',
    'fixed',
    'Tower',
    'Planned',
    'AGR',
    'ICOS, ICOS Sweden',
    NULL,
    'ICOS Sweden',
    'ICOS Sweden flux tower at Alnarp - PLACEHOLDER: all details TBD',
    NULL,
    NULL
FROM stations WHERE acronym = 'ALN';

-- Platform 4: ICOS - Tower 02
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    platform_type,
    mounting_structure,
    status,
    ecosystem_code,
    operation_programs,
    managing_institution,
    thematic_program,
    description,
    latitude,
    longitude
) SELECT
    id,
    'ALN_AGR_TWR03',
    'Alnarp ICOS Tower 02',
    'TWR',
    'fixed',
    'Tower',
    'Planned',
    'AGR',
    'ICOS, ICOS Sweden',
    NULL,
    'ICOS Sweden',
    'ICOS Sweden second tower at Alnarp - PLACEHOLDER: all details TBD',
    NULL,
    NULL
FROM stations WHERE acronym = 'ALN';

-- Platform 5: Satellite platform (Sentinel-2)
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    platform_type,
    status,
    ecosystem_code,
    operation_programs,
    managing_institution,
    managing_department,
    thematic_program,
    description,
    latitude,
    longitude
) SELECT
    id,
    'ALN_ESA_S2A_SAT01',
    'Alnarp Sentinel-2A',
    'SAT',
    'satellite',
    'Active',
    'AGR',
    'SITES, SITES Spectral, Copernicus',
    'Lund University',
    'Department of Earth and Environmental Sciences (MGeo)',
    'SITES Spectral Thematic Program',
    'ESA Sentinel-2A MSI imagery for Alnarp agricultural upscaling and validation',
    55.6594,
    13.0822
FROM stations WHERE acronym = 'ALN';

-- ============================================================================
-- PART 6: Add Hyltemossa platforms (PLACEHOLDER - details TBD)
-- ============================================================================

-- Platform 1: Hyltemossa main flux tower (ICOS)
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    platform_type,
    mounting_structure,
    status,
    ecosystem_code,
    operation_programs,
    managing_institution,
    thematic_program,
    description,
    latitude,
    longitude
) SELECT
    id,
    'HYL_FOR_TWR01',
    'Hyltemossa Flux Tower (ICOS)',
    'TWR',
    'fixed',
    'Tower',
    'Planned',
    'FOR',
    'ICOS, ICOS Sweden, SITES Spectral',
    NULL,
    'ICOS Sweden',
    'Hyltemossa main flux tower - ICOS Class 1 station - PLACEHOLDER: all details TBD',
    56.0976,
    13.4189
FROM stations WHERE acronym = 'HYL';

-- Platform 2: Hyltemossa SITES Spectral tower
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    platform_type,
    mounting_structure,
    status,
    ecosystem_code,
    operation_programs,
    managing_institution,
    managing_department,
    thematic_program,
    description,
    latitude,
    longitude
) SELECT
    id,
    'HYL_FOR_TWR02',
    'Hyltemossa SITES Spectral Tower',
    'TWR',
    'fixed',
    'Tower',
    'Planned',
    'FOR',
    'SITES, SITES Spectral',
    NULL,
    NULL,
    'SITES Spectral Thematic Program',
    'Hyltemossa SITES Spectral phenocam/multispectral tower - PLACEHOLDER: all details TBD',
    NULL,
    NULL
FROM stations WHERE acronym = 'HYL';

-- ============================================================================
-- PART 7: Add UAV instruments for Alnarp DJI M3M
-- ============================================================================

INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    description
) SELECT
    id,
    'ALN_DJI_M3M_UAV01_MS01',
    'Alnarp M3M Multispectral Sensor',
    'multispectral',
    'AGR',
    'MS01',
    'Active',
    'DJI M3M integrated 4-band multispectral sensor (Green 560nm, Red 650nm, Red Edge 730nm, NIR 860nm)'
FROM platforms WHERE normalized_name = 'ALN_DJI_M3M_UAV01';

INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    description
) SELECT
    id,
    'ALN_DJI_M3M_UAV01_RGB01',
    'Alnarp M3M RGB Camera',
    'rgb_camera',
    'AGR',
    'RGB01',
    'Active',
    'DJI M3M integrated 20MP RGB camera (4/3 CMOS, Hasselblad)'
FROM platforms WHERE normalized_name = 'ALN_DJI_M3M_UAV01';

-- ============================================================================
-- PART 7b: Add instruments for Alnarp Fixed Tower (ALN_AGR_TWR01)
-- ============================================================================

-- Phenocam on fixed tower
INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    description
) SELECT
    id,
    'ALN_AGR_TWR01_PHE01',
    'Alnarp Agricultural Phenocam 01',
    'phenocam',
    'AGR',
    'PHE01',
    'Planned',
    'Phenocam for agricultural vegetation monitoring at Alnarp - PLACEHOLDER: camera specs TBD'
FROM platforms WHERE normalized_name = 'ALN_AGR_TWR01';

-- Multispectral sensor on fixed tower
INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    description
) SELECT
    id,
    'ALN_AGR_TWR01_MS01',
    'Alnarp Tower Multispectral Sensor 01',
    'multispectral',
    'AGR',
    'MS01',
    'Planned',
    'Fixed multispectral sensor for continuous vegetation monitoring - PLACEHOLDER: sensor specs TBD'
FROM platforms WHERE normalized_name = 'ALN_AGR_TWR01';

-- ============================================================================
-- PART 7c: Add instruments for Alnarp Satellite Platform (ALN_ESA_S2A_SAT01)
-- ============================================================================

-- Sentinel-2 MSI instrument
INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    description
) SELECT
    id,
    'ALN_ESA_S2A_SAT01_MSI01',
    'Alnarp Sentinel-2A MSI',
    'multispectral',
    'AGR',
    'MSI01',
    'Active',
    'ESA Sentinel-2A Multispectral Instrument (MSI) - 13 spectral bands, 10m-60m resolution, 5-day revisit'
FROM platforms WHERE normalized_name = 'ALN_ESA_S2A_SAT01';

-- ============================================================================
-- PART 8: Backfill existing platforms with management tracking
-- ============================================================================

-- Svartberget - SLU managed
UPDATE platforms SET
    managing_institution = 'Swedish University of Agricultural Sciences (SLU)',
    thematic_program = 'SITES Spectral Thematic Program'
WHERE normalized_name LIKE 'SVB_%' AND managing_institution IS NULL;

-- Lönnstorp - Lund University / MGeo managed
UPDATE platforms SET
    managing_institution = 'Lund University',
    managing_department = 'Department of Earth and Environmental Sciences (MGeo)',
    thematic_program = 'SITES Spectral Thematic Program'
WHERE normalized_name LIKE 'LON_%' AND managing_institution IS NULL;

-- Abisko - Swedish Polar Research Secretariat
UPDATE platforms SET
    managing_institution = 'Swedish Polar Research Secretariat',
    thematic_program = 'SITES Spectral Thematic Program'
WHERE normalized_name LIKE 'ANS_%' AND managing_institution IS NULL;

-- Grimsö - SLU managed
UPDATE platforms SET
    managing_institution = 'Swedish University of Agricultural Sciences (SLU)',
    thematic_program = 'SITES Spectral Thematic Program'
WHERE normalized_name LIKE 'GRI_%' AND managing_institution IS NULL;

-- Röbäcksdalen - SLU managed
UPDATE platforms SET
    managing_institution = 'Swedish University of Agricultural Sciences (SLU)',
    thematic_program = 'SITES Spectral Thematic Program'
WHERE normalized_name LIKE 'RBD_%' AND managing_institution IS NULL;

-- Skogaryd - University of Gothenburg managed
UPDATE platforms SET
    managing_institution = 'University of Gothenburg',
    thematic_program = 'SITES Spectral Thematic Program'
WHERE normalized_name LIKE 'SKC_%' AND managing_institution IS NULL;

-- Asa - SLU managed
UPDATE platforms SET
    managing_institution = 'Swedish University of Agricultural Sciences (SLU)',
    thematic_program = 'SITES Spectral Thematic Program'
WHERE normalized_name LIKE 'ASA_%' AND managing_institution IS NULL;

-- ============================================================================
-- PART 9: Create indexes for efficient querying
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_stations_sites_member ON stations(sites_member);
CREATE INDEX IF NOT EXISTS idx_stations_icos_member ON stations(icos_member);
CREATE INDEX IF NOT EXISTS idx_platforms_managing_institution ON platforms(managing_institution);
CREATE INDEX IF NOT EXISTS idx_platforms_thematic_program ON platforms(thematic_program);

-- ============================================================================
-- USEFUL QUERIES (examples for documentation)
-- ============================================================================
-- Count SITES member stations:
--   SELECT COUNT(*) FROM stations WHERE sites_member = true;
--
-- List all SITES Spectral platforms:
--   SELECT s.acronym, p.normalized_name, p.managing_institution
--   FROM platforms p
--   JOIN stations s ON p.station_id = s.id
--   WHERE p.thematic_program LIKE '%SITES Spectral%';
--
-- Find platforms needing management info (placeholders):
--   SELECT normalized_name FROM platforms WHERE managing_institution IS NULL;
