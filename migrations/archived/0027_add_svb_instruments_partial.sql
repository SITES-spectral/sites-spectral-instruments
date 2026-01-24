-- Migration: Add Svartberget (SVB) Instruments from Excel Metadata
-- Version: 5.2.58
-- Date: 2025-11-21
-- Status: PARTIAL MIGRATION - 10 of 19 expected instruments
-- WARNING: See SVB_CRITICAL_DISCREPANCY_ALERT.md before executing

-- =============================================================================
-- IMPORTANT NOTES
-- =============================================================================
-- This migration contains only 10 instruments from the generated YAML.
-- The summary document claims 19 instruments should exist.
-- 9 instruments are missing from generated YAML and need investigation.
--
-- See documentation:
-- - docs/migrations/SVB_CRITICAL_DISCREPANCY_ALERT.md
-- - docs/migrations/SVB_INSTRUMENT_MIGRATION_SUMMARY.md
-- =============================================================================

-- Platform ID Mappings (from production database):
-- SVB_FOR_PL01 (150m tower) = 28
-- SVB_FOR_PL02 (Below canopy north) = 30
-- SVB_FOR_PL03 (Below canopy CPEC) = 32
-- SVB_MIR_PL01 (Degerö flag pole W) = 26
-- SVB_MIR_PL02 (Degerö ICOS mast) = 27
-- SVB_MIR_PL03 (Degerö dry PAR pole) = 29
-- SVB_MIR_PL04 (Degerö wet PAR pole) = 31

-- Station ID: SVB = 7

-- =============================================================================
-- INSTRUMENT 1: SVB_FOR_PL01_PHE01
-- =============================================================================
-- Phenocam at 150m tower
-- Status: Active
INSERT INTO instruments (
    platform_id, normalized_name, display_name, legacy_acronym,
    instrument_type, ecosystem_code, instrument_number, status,
    instrument_height_m,
    camera_brand, camera_model, camera_serial_number,
    installation_notes, calibration_date,
    created_at, updated_at
) VALUES (
    28, -- SVB_FOR_PL01
    'SVB_FOR_PL01_PHE01',
    'SVB FOR PL01 Phenocam',
    'SWE-SVB-SVB-FOR-P01',
    'Phenocam',
    'FOR',
    'PHE01',
    'Active',
    52.0,
    'Mobotix',
    'MX-M25-D061',
    '10.20.84.196',
    'Mounted on tall tower',
    '-',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 2: SVB_FOR_PL01_SKYE_MS01_NB02
-- =============================================================================
-- Multispectral sensor (2-channel GREEN) - REMOVED
-- Status: Removed 2022-10-31
INSERT INTO instruments (
    platform_id, normalized_name, display_name, legacy_acronym,
    instrument_type, ecosystem_code, instrument_number, status,
    instrument_height_m,
    description, installation_notes,
    created_at, updated_at
) VALUES (
    28, -- SVB_FOR_PL01
    'SVB_FOR_PL01_SKYE_MS01_NB02',
    'SVB FOR PL01 SKYE MS Sensor 1',
    'SWE-SVB-SVB-FOR-F01',
    'Multispectral Sensor',
    'FOR',
    'MS01',
    'Removed',
    150.0,
    'SKYE SKR1860 - 2 channels (GREEN 531nm, GREEN 530nm)',
    'Removed 2022-10-31, because of suspicious data, but the flooded junction box might be the reason',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 3: SVB_FOR_PL01_SKYE_MS05_NB01
-- =============================================================================
-- Multispectral sensor (1-channel RED) - PENDING INSTALLATION
-- NOTE: Numbered MS05 in YAML but should probably be MS02 or MS03
-- Status: Pending Installation, calibrated 2025-10-09
INSERT INTO instruments (
    platform_id, normalized_name, display_name,
    instrument_type, ecosystem_code, instrument_number, status,
    instrument_height_m,
    description, installation_notes, calibration_date,
    created_at, updated_at
) VALUES (
    28, -- SVB_FOR_PL01
    'SVB_FOR_PL01_SKYE_MS05_NB01',
    'SVB FOR PL01 SKYE MS Sensor 5',
    'Multispectral Sensor',
    'FOR',
    'MS05',
    'Pending Installation',
    50.0,
    'SKYE SKR1860D/A/LT Serial: 53916 - 1 channel (RED 671nm, BW 42.4nm)',
    'calibrated, not installed yet',
    '2025-10-09',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 4: SVB_FOR_PL02_SKYE_MS01_NB01
-- =============================================================================
-- Multispectral sensor (1-channel RED) - PENDING INSTALLATION
-- Status: Pending Installation, calibrated 2024-07-17
INSERT INTO instruments (
    platform_id, normalized_name, display_name,
    instrument_type, ecosystem_code, instrument_number, status,
    instrument_height_m,
    description, installation_notes, calibration_date,
    created_at, updated_at
) VALUES (
    30, -- SVB_FOR_PL02
    'SVB_FOR_PL02_SKYE_MS01_NB01',
    'SVB FOR PL02 SKYE MS Sensor 1',
    'Multispectral Sensor',
    'FOR',
    'MS01',
    'Pending Installation',
    2.0,
    'SKYE SKR1840D/LT Serial: 53914 - 1 channel (RED 670nm)',
    'calibrated, not installed yet, // decagon, towards W (or east if easier)',
    '2024-07-17',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 5: SVB_FOR_PL03_PHE01
-- =============================================================================
-- Phenocam at below canopy CPEC tripod
-- Status: Active
INSERT INTO instruments (
    platform_id, normalized_name, display_name, legacy_acronym,
    instrument_type, ecosystem_code, instrument_number, status,
    instrument_height_m,
    camera_brand, camera_model, camera_serial_number,
    installation_notes, calibration_date,
    created_at, updated_at
) VALUES (
    32, -- SVB_FOR_PL03
    'SVB_FOR_PL03_PHE01',
    'SVB FOR PL03 Phenocam',
    'SWE-SVB-SVB-FOR-P02',
    'Phenocam',
    'FOR',
    'PHE01',
    'Active',
    3.22,
    'Mobotix',
    'MX-M25-D061',
    '10.29.45.241',
    'Mounted in a small tower below canopy, SW of tall tower, 19/12/2024',
    '-',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 6: SVB_MIR_PL01_SKYE_MS01_NB02
-- =============================================================================
-- Multispectral sensor (2-channel GREEN) - INACTIVE (old sensor)
-- Status: Inactive
INSERT INTO instruments (
    platform_id, normalized_name, display_name, legacy_acronym,
    instrument_type, ecosystem_code, instrument_number, status,
    instrument_height_m,
    description, installation_notes, calibration_date,
    created_at, updated_at
) VALUES (
    26, -- SVB_MIR_PL01
    'SVB_MIR_PL01_SKYE_MS01_NB02',
    'SVB MIR PL01 SKYE MS Sensor 1',
    'SWE-SVB-DEG-MIR-F01',
    'Multispectral Sensor',
    'MIR',
    'MS01',
    'Inactive',
    17.5,
    'SKYE SKR1850 - 2 channels (GREEN 531nm up/down)',
    'old',
    'todo',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 7: SVB_MIR_PL01_SKYE_MS06_NB01
-- =============================================================================
-- Multispectral sensor (1-channel RED) - PENDING INSTALLATION
-- NOTE: Numbered MS06 in YAML but should probably be MS02 or MS03
-- Status: Pending Installation, calibrated 2025-10-11
INSERT INTO instruments (
    platform_id, normalized_name, display_name,
    instrument_type, ecosystem_code, instrument_number, status,
    description, installation_notes, calibration_date,
    created_at, updated_at
) VALUES (
    26, -- SVB_MIR_PL01
    'SVB_MIR_PL01_SKYE_MS06_NB01',
    'SVB MIR PL01 SKYE MS Sensor 6',
    'Multispectral Sensor',
    'MIR',
    'MS06',
    'Pending Installation',
    'SKYE SKR1860ND/A/LT Serial: 53919 - 1 channel (RED 671nm)',
    'calibated, not installed 2025-10-24',
    '2025-10-11',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 8: SVB_MIR_PL01_DECAGON_MS01_NB01
-- =============================================================================
-- Multispectral sensor (1-channel GREEN) - REMOVED
-- Status: Removed 2025-09-30
INSERT INTO instruments (
    platform_id, normalized_name, display_name, legacy_acronym,
    instrument_type, ecosystem_code, instrument_number, status,
    instrument_height_m,
    description, installation_notes,
    created_at, updated_at
) VALUES (
    26, -- SVB_MIR_PL01
    'SVB_MIR_PL01_DECAGON_MS01_NB01',
    'SVB MIR PL01 Decagon MS Sensor 1',
    'SWE-SVB-DEG-MIR-F01',
    'Multispectral Sensor',
    'MIR',
    'MS01',
    'Removed',
    17.5,
    'Decagon SRS-Pr - 1 channel (GREEN 532nm)',
    'stopped working, dismounted 30/09/2025',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 9: SVB_MIR_PL03_LICOR_PAR01
-- =============================================================================
-- PAR Sensor at dry PAR pole
-- Status: Active
-- NOTE: instrument_type in YAML has typo "Par Sensor" - corrected to "PAR Sensor"
INSERT INTO instruments (
    platform_id, normalized_name, display_name, legacy_acronym,
    instrument_type, ecosystem_code, instrument_number, status,
    description, installation_notes,
    created_at, updated_at
) VALUES (
    29, -- SVB_MIR_PL03
    'SVB_MIR_PL03_LICOR_PAR01',
    'SVB MIR PL03 Licor PAR',
    'SWE-SVB-DEG-MIR-F01',
    'PAR Sensor',
    'MIR',
    'PAR01',
    'Active',
    'Licor PAR Sensor - wavelength range: 400-700nm',
    'installed in 2024-04-19',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- INSTRUMENT 10: SVB_MIR_PL04_LICOR_PAR01
-- =============================================================================
-- PAR Sensor at wet PAR pole
-- Status: Active
-- NOTE: instrument_type in YAML has typo "Par Sensor" - corrected to "PAR Sensor"
INSERT INTO instruments (
    platform_id, normalized_name, display_name, legacy_acronym,
    instrument_type, ecosystem_code, instrument_number, status,
    description, installation_notes,
    created_at, updated_at
) VALUES (
    31, -- SVB_MIR_PL04
    'SVB_MIR_PL04_LICOR_PAR01',
    'SVB MIR PL04 Licor PAR',
    'SWE-SVB-DEG-MIR-F01',
    'PAR Sensor',
    'MIR',
    'PAR01',
    'Active',
    'Licor PAR Sensor - wavelength range: 400-700nm',
    'installed in 2024-04-18',
    datetime('now'),
    datetime('now')
);

-- =============================================================================
-- MIGRATION SUMMARY
-- =============================================================================
-- Total instruments added: 10
-- Platforms affected: 5
--   - SVB_FOR_PL01: 3 instruments (1 Phenocam, 2 Multispectral)
--   - SVB_FOR_PL02: 1 instrument (1 Multispectral)
--   - SVB_FOR_PL03: 1 instrument (1 Phenocam)
--   - SVB_MIR_PL01: 3 instruments (3 Multispectral)
--   - SVB_MIR_PL03: 1 instrument (1 PAR)
--   - SVB_MIR_PL04: 1 instrument (1 PAR)
--
-- Instrument types:
--   - Phenocam: 2
--   - Multispectral Sensor: 6
--   - PAR Sensor: 2
--
-- Status distribution:
--   - Active: 4 instruments
--   - Inactive: 1 instrument
--   - Removed: 2 instruments
--   - Pending Installation: 3 instruments
--
-- =============================================================================
-- KNOWN ISSUES
-- =============================================================================
-- 1. Missing 9 instruments from summary document (see alert document)
-- 2. Instrument numbering inconsistency (MS01, MS05, MS06 gaps)
-- 3. Spectral channel data not stored (current schema limitation)
-- 4. Sensor specifications stored in description field (not normalized)
-- =============================================================================

-- Verification query
SELECT
    p.normalized_name AS platform,
    i.normalized_name AS instrument,
    i.instrument_type,
    i.status
FROM instruments i
JOIN platforms p ON i.platform_id = p.id
WHERE p.normalized_name LIKE 'SVB_%'
ORDER BY p.normalized_name, i.normalized_name;
