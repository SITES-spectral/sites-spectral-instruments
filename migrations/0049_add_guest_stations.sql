-- Migration: 0049_add_guest_stations.sql
-- Date: 2026-02-16
-- Description: Add guest stations: Alnarp (ALN), Hyltemossa (HYL), and Norunda (NOR)
--
-- These are "guest" stations - not core SITES Spectral stations but partners
-- that receive data processing support from SITES Spectral.
--
-- ALN - Alnarp: SITES member, SLU campus, UAV/Satellite for agricultural monitoring
-- HYL - Hyltemossa: ICOS Class 1 station, mixed coniferous forest
-- NOR - Norunda: ICOS Class 1 station, boreal forest (102m tower)
--
-- References:
-- - https://www.icos-sweden.se/norunda
-- - https://meta.icos-cp.eu/resources/stations/AS_NOR

-- ===========================================================================
-- Station: ALN (Alnarp)
-- ===========================================================================
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
    epsg_code,
    sites_member,
    icos_member,
    icos_class
) VALUES (
    'alnarp',
    'Alnarp',
    'ALN',
    'Active',
    'Sweden',
    55.6594,
    13.0822,
    15,
    'Alnarp Research Station - SLU campus. Guest station for SITES Spectral UAV/Satellite agricultural monitoring.',
    'EPSG:4326',
    1,  -- SITES member
    0,  -- Not ICOS member
    NULL
);

-- ALN Platforms
-- Get station_id for ALN
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    mounting_structure,
    platform_height_m,
    status,
    latitude,
    longitude,
    description,
    operation_programs,
    epsg_code
)
SELECT
    s.id,
    'ALN_AGR_TWR01',
    'Alnarp Agricultural Tower 01 (SITES Spectral)',
    'TWR01',
    'Tower',
    NULL,
    'Planned',
    NULL,
    NULL,
    'Fixed tower for SITES Spectral agricultural monitoring - coordinates TBD',
    '["SITES", "SITES Spectral"]',
    'EPSG:4326'
FROM stations s WHERE s.acronym = 'ALN';

INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    mounting_structure,
    platform_height_m,
    status,
    latitude,
    longitude,
    description,
    operation_programs,
    epsg_code
)
SELECT
    s.id,
    'ALN_DJI_M3M_UAV01',
    'Alnarp DJI Mavic 3 Multispectral',
    'UAV01',
    'UAV',
    NULL,
    'Active',
    55.6594,
    13.0822,
    'DJI Mavic 3 Multispectral UAV for agricultural monitoring',
    '["SITES", "SITES Spectral"]',
    'EPSG:4326'
FROM stations s WHERE s.acronym = 'ALN';

INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    mounting_structure,
    platform_height_m,
    status,
    latitude,
    longitude,
    description,
    operation_programs,
    epsg_code
)
SELECT
    s.id,
    'ALN_ESA_S2A_SAT01',
    'Alnarp Sentinel-2A',
    'SAT01',
    'Satellite',
    NULL,
    'Active',
    55.6594,
    13.0822,
    'ESA Sentinel-2A MSI imagery for Alnarp agricultural upscaling',
    '["SITES", "SITES Spectral", "Copernicus"]',
    'EPSG:4326'
FROM stations s WHERE s.acronym = 'ALN';

-- ALN Instruments
-- UAV Instruments
INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    latitude,
    longitude,
    description,
    epsg_code
)
SELECT
    p.id,
    'ALN_DJI_M3M_UAV01_MS01',
    'Alnarp M3M Multispectral Sensor',
    'multispectral',
    'AGR',
    'MS01',
    'Active',
    55.6594,
    13.0822,
    'DJI M3M integrated 4-band multispectral sensor (Green 560nm, Red 650nm, Red Edge 730nm, NIR 860nm)',
    'EPSG:4326'
FROM platforms p WHERE p.normalized_name = 'ALN_DJI_M3M_UAV01';

INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    latitude,
    longitude,
    description,
    epsg_code
)
SELECT
    p.id,
    'ALN_DJI_M3M_UAV01_RGB01',
    'Alnarp M3M RGB Camera',
    'rgb_camera',
    'AGR',
    'RGB01',
    'Active',
    55.6594,
    13.0822,
    'DJI M3M integrated 20MP RGB camera (4/3 CMOS, Hasselblad)',
    'EPSG:4326'
FROM platforms p WHERE p.normalized_name = 'ALN_DJI_M3M_UAV01';

-- Satellite Instruments
INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    latitude,
    longitude,
    description,
    epsg_code
)
SELECT
    p.id,
    'ALN_ESA_S2A_SAT01_MSI01',
    'Alnarp Sentinel-2A MSI',
    'multispectral',
    'AGR',
    'MSI01',
    'Active',
    55.6594,
    13.0822,
    'ESA Sentinel-2A Multispectral Instrument (MSI) - 13 spectral bands, 10m-60m resolution',
    'EPSG:4326'
FROM platforms p WHERE p.normalized_name = 'ALN_ESA_S2A_SAT01';

-- ===========================================================================
-- Station: HYL (Hyltemossa)
-- ===========================================================================
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
    epsg_code,
    sites_member,
    icos_member,
    icos_class
) VALUES (
    'hyltemossa',
    'Hyltemossa',
    'HYL',
    'Active',
    'Sweden',
    56.0976,
    13.4189,
    115,
    'Hyltemossa ICOS Class 1 station - Mixed coniferous forest. Guest station receiving SITES Spectral data processing support.',
    'EPSG:4326',
    0,  -- Not SITES member (guest)
    1,  -- ICOS member
    'Class 1'
);

-- HYL Platforms
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    mounting_structure,
    platform_height_m,
    status,
    latitude,
    longitude,
    description,
    operation_programs,
    epsg_code
)
SELECT
    s.id,
    'HYL_FOR_TWR01',
    'Hyltemossa Flux Tower (ICOS)',
    'TWR01',
    'Tower',
    NULL,
    'Planned',
    56.0976,
    13.4189,
    'Hyltemossa main flux tower - ICOS Class 1 station',
    '["ICOS", "ICOS Sweden"]',
    'EPSG:4326'
FROM stations s WHERE s.acronym = 'HYL';

-- ===========================================================================
-- Station: NOR (Norunda)
-- ===========================================================================
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
    epsg_code,
    sites_member,
    icos_member,
    icos_class
) VALUES (
    'norunda',
    'Norunda',
    'NOR',
    'Active',
    'Sweden',
    60.0864,
    17.4794,
    46,
    'Norunda ICOS Class 1 station - Boreal forest with 102m tower. Guest station receiving SITES Spectral data processing support.',
    'EPSG:4326',
    0,  -- Not SITES member (guest)
    1,  -- ICOS member
    'Class 1'
);

-- NOR Platforms
INSERT INTO platforms (
    station_id,
    normalized_name,
    display_name,
    mount_type_code,
    mounting_structure,
    platform_height_m,
    status,
    latitude,
    longitude,
    description,
    operation_programs,
    epsg_code
)
SELECT
    s.id,
    'NOR_FOR_TWR01',
    'Norunda Flux Tower (ICOS)',
    'TWR01',
    'Tower',
    102,
    'Planned',
    60.0864,
    17.4794,
    'Norunda main flux tower (102m) - ICOS Class 1 station, boreal forest',
    '["ICOS", "ICOS Sweden"]',
    'EPSG:4326'
FROM stations s WHERE s.acronym = 'NOR';
