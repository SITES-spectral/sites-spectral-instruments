-- Migration: 0047_add_svb_missing_platforms.sql
-- Date: 2026-02-16
-- Description: Add missing active platforms and instruments for Svartberget (SVB)
--
-- Missing platforms from audit:
-- - SVB_FOR_PL02 (Below canopy platform) with PHE01
-- - SVB_FOR_PL03 (Below Canopy CPEC) - no instruments
-- - SVB_MIR_PL04 (Degerö wet PAR pole) - no instruments (PAR sensor, not phenocam)

-- Add SVB_FOR_TWR02 (Below canopy platform)
-- Note: Using TWR02 naming convention (normalized from PL02)
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
    deployment_date,
    description,
    operation_programs,
    epsg_code
) VALUES (
    7,  -- SVB station_id
    'SVB_FOR_TWR02',
    'SVB Forest Below Canopy Platform 02',
    'TWR02',
    'Tripod',
    3.2,
    'Active',
    64.25586,
    19.773851,
    '2024-01-01',
    'Svartberget forest below canopy platform on tripod',
    '["SITES"]',
    'EPSG:4326'
);

-- Add SVB_FOR_TWR03 (Below Canopy CPEC)
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
    deployment_date,
    description,
    operation_programs,
    epsg_code
) VALUES (
    7,  -- SVB station_id
    'SVB_FOR_TWR03',
    'SVB Below Canopy CPEC',
    'TWR03',
    'Tripod',
    3.22,
    'Active',
    64.25586,
    19.773851,
    '2016-09-12',
    'Svartberget below canopy CPEC tripod',
    '["SITES"]',
    'EPSG:4326'
);

-- Add SVB_MIR_TWR04 (Degerö wet PAR pole)
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
    deployment_date,
    description,
    operation_programs,
    epsg_code
) VALUES (
    7,  -- SVB station_id
    'SVB_MIR_TWR04',
    'DEG PL04 wet PAR pole',
    'TWR04',
    'Pole',
    2.0,
    'Active',
    64.182779,
    19.557327,
    '2024-04-18',
    'Degerö wet PAR pole',
    '["SITES"]',
    'EPSG:4326'
);

-- Add instrument for SVB_FOR_TWR02 (Below canopy phenocam)
-- First get the platform_id for SVB_FOR_TWR02
INSERT INTO instruments (
    platform_id,
    normalized_name,
    display_name,
    instrument_type,
    ecosystem_code,
    instrument_number,
    status,
    deployment_date,
    latitude,
    longitude,
    instrument_height_m,
    viewing_direction,
    azimuth_degrees,
    degrees_from_nadir,
    camera_brand,
    camera_model,
    camera_serial_number,
    first_measurement_year,
    measurement_status,
    description,
    epsg_code
)
SELECT
    p.id,
    'SVB_FOR_TWR02_PHE01',
    'SVB Forest Below Canopy Phenocam 01',
    'phenocam',
    'FOR',
    'PHE01',
    'Active',
    '2024-01-01',
    64.25586,
    19.773851,
    3.2,
    'South',
    170.2,
    70.0,
    'Mobotix',
    'MX-M25-D061',
    '10.29.45.241',
    2024,
    'Active',
    'Phenocam at Svartberget forest below canopy platform, added in 2024',
    'EPSG:4326'
FROM platforms p
WHERE p.normalized_name = 'SVB_FOR_TWR02';
