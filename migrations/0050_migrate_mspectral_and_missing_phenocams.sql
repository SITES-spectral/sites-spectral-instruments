-- Migration 0050: Migrate mspectral instruments and missing phenocams from legacy DB
-- Source: backups/2025-12-07/ (sites.jobelab.com)
-- Date: 2026-03-12
--
-- Changes:
--   1. Add 7 missing Planned platforms (ANS, LON, RBD, SKC sub-areas)
--   2. Add 3 missing phenocams on existing platforms
--   3. Add 6 mspectral/PAR instruments on existing SVB platforms
--   4. Add 7 planned phenocams on the newly inserted platforms

-- =============================================================================
-- PART 1: Missing Planned Platforms
-- (from old DB platforms 23-29, were not migrated to new DB)
-- =============================================================================

INSERT INTO platforms (station_id, normalized_name, display_name, mount_type_code, status, latitude, longitude, description, created_at, updated_at)
VALUES
  -- ANS: Stordalen Birch Forest (old id 23, ANS_SBF_FOR_PL01)
  (1, 'ANS_SBF_FOR_TWR01', 'Abisko Stordalen Birch Forest', 'TWR01', 'Planned',
   68.34980602492992, 19.04258100806418,
   'Platform at Stordalen birch forest area - planned installation',
   '2025-09-23T01:24:51.000Z', '2026-03-12T00:00:00.000Z'),

  -- ANS: Miellejokka Heath (old id 24, ANS_MJH_PL01)
  (1, 'ANS_MJH_HEA_TWR01', 'Abisko Miellejokka Heath', 'TWR01', 'Planned',
   68.311722, 18.91527,
   'Platform at Miellejokka heath area - planned installation',
   '2025-09-23T01:25:00.000Z', '2026-03-12T00:00:00.000Z'),

  -- LON: Agriculture Platform 02 (old id 25, LON_AGR_PL02)
  (4, 'LON_AGR_TWR02', 'Lönnstorp Agriculture Platform 02', 'TWR02', 'Planned',
   NULL, NULL,
   'Planned agriculture platform at Lönnstorp station',
   '2025-09-23T06:37:28.000Z', '2026-03-12T00:00:00.000Z'),

  -- RBD: Agriculture Platform 03 (old id 26, RBD_AGR_PL03)
  (5, 'RBD_AGR_TWR03', 'Röbäcksdalen Agriculture Platform 03', 'TWR03', 'Planned',
   NULL, NULL,
   'Planned agriculture platform at Röbäcksdalen station',
   '2025-09-23T06:38:21.000Z', '2026-03-12T00:00:00.000Z'),

  -- SKC: Skogaryd III Forest (old id 27, SKC_III_FOR_PL01)
  (6, 'SKC_III_FOR_TWR01', 'Skogaryd III Forest Platform 01', 'TWR01', 'Planned',
   NULL, NULL,
   'Planned forest platform at Skogaryd III area',
   '2025-09-23T06:39:49.000Z', '2026-03-12T00:00:00.000Z'),

  -- SKC: Skogaryd III Mire (old id 28, SKC_III_MIR_PL01)
  (6, 'SKC_III_MIR_TWR01', 'Skogaryd III Mire Platform 01', 'TWR01', 'Planned',
   NULL, NULL,
   'Planned mire platform at Skogaryd III area',
   '2025-09-23T06:39:49.000Z', '2026-03-12T00:00:00.000Z'),

  -- SKC: Skogaryd III Fen on Lake (old id 29, SKC_III_FOL_PL01)
  (6, 'SKC_III_FOL_TWR01', 'Skogaryd III Fen on Lake Platform 01', 'TWR01', 'Planned',
   NULL, NULL,
   'Planned fen on lake platform at Skogaryd III area',
   '2025-09-23T06:39:49.000Z', '2026-03-12T00:00:00.000Z');

-- =============================================================================
-- PART 2: Missing Phenocams on Existing Platforms
-- =============================================================================

INSERT INTO instruments (platform_id, normalized_name, display_name, instrument_type, status, created_at, updated_at)
VALUES
  -- ANS_FOR_BLD01_PHE02: second phenocam on Abisko building (old: ANS_FOR_BL01_PHE02, platform 1)
  (1, 'ANS_FOR_BLD01_PHE02', 'ANS FOR BLD01 Phenocam 2', 'phenocam', 'Active',
   '2025-09-20T19:12:58.000Z', '2026-03-12T00:00:00.000Z'),

  -- SVB_MIR_TWR01_PHE02: second phenocam on SVB mirror flag pole (old: SVB_MIR_PL01_PHE02, platform 17)
  (17, 'SVB_MIR_TWR01_PHE02', 'SVB MIR TWR01 Phenocam 2', 'phenocam', 'Active',
   '2025-09-20T19:12:58.000Z', '2026-03-12T00:00:00.000Z'),

  -- SVB_FOR_TWR03_PHE01: phenocam on SVB below-canopy CPEC (old: SVB_FOR_PL03_PHE01, platform 32 → new id 24)
  (24, 'SVB_FOR_TWR03_PHE01', 'SVB FOR TWR03 Phenocam', 'phenocam', 'Active',
   '2025-09-20T19:12:58.000Z', '2026-03-12T00:00:00.000Z');

-- =============================================================================
-- PART 3: Multispectral and PAR Instruments on Existing SVB Platforms
-- =============================================================================

INSERT INTO instruments (platform_id, normalized_name, display_name, instrument_type, instrument_number, status, instrument_height_m, legacy_acronym, created_at, updated_at)
VALUES
  -- Skye multispectral at top of 150m tower (old: SVB_FOR_PL01_SKYE_MS01_NB02, Removed → Inactive)
  (20, 'SVB_FOR_TWR01_MS01', 'SVB FOR TWR01 Skye Multispectral', 'multispectral', 'MS01', 'Inactive',
   150, 'SWE-SVB-SVB-FOR-F01',
   '2025-11-24T07:13:08.000Z', '2026-03-12T00:00:00.000Z'),

  -- Skye multispectral below-canopy north (old: SVB_FOR_PL02_SKYE_MS01_NB01, Pending → Planned)
  (23, 'SVB_FOR_TWR02_MS01', 'SVB FOR TWR02 Skye Multispectral', 'multispectral', 'MS01', 'Planned',
   2, NULL,
   '2025-11-24T07:13:08.000Z', '2026-03-12T00:00:00.000Z'),

  -- Skye multispectral on flag pole (old: SVB_MIR_PL01_SKYE_MS01_NB02, Inactive)
  (17, 'SVB_MIR_TWR01_MS01', 'SVB MIR TWR01 Skye Multispectral', 'multispectral', 'MS01', 'Inactive',
   17.5, 'SWE-SVB-DEG-MIR-F01',
   '2025-11-24T07:13:08.000Z', '2026-03-12T00:00:00.000Z'),

  -- Decagon multispectral on flag pole (old: SVB_MIR_PL01_DECAGON_MS01_NB01, Removed → Inactive)
  (17, 'SVB_MIR_TWR01_MS02', 'SVB MIR TWR01 Decagon Multispectral', 'multispectral', 'MS02', 'Inactive',
   17.5, 'SWE-SVB-DEG-MIR-F01',
   '2025-11-24T07:13:08.000Z', '2026-03-12T00:00:00.000Z'),

  -- Licor PAR on dry pole (old: SVB_MIR_PL03_LICOR_PAR01, Active)
  (19, 'SVB_MIR_TWR03_PAR01', 'SVB MIR TWR03 Licor PAR', 'par_sensor', 'PAR01', 'Active',
   NULL, 'SWE-SVB-DEG-MIR-F01',
   '2025-11-24T07:13:08.000Z', '2026-03-12T00:00:00.000Z'),

  -- Licor PAR on wet pole (old: SVB_MIR_PL04_LICOR_PAR01, Active)
  (25, 'SVB_MIR_TWR04_PAR01', 'SVB MIR TWR04 Licor PAR', 'par_sensor', 'PAR01', 'Active',
   NULL, 'SWE-SVB-DEG-MIR-F01',
   '2025-11-24T07:13:08.000Z', '2026-03-12T00:00:00.000Z');

-- =============================================================================
-- PART 4: Planned Phenocams on the Newly Inserted Platforms
-- =============================================================================

INSERT INTO instruments (platform_id, normalized_name, display_name, instrument_type, instrument_number, status, created_at, updated_at)
VALUES
  ((SELECT id FROM platforms WHERE normalized_name = 'ANS_SBF_FOR_TWR01' LIMIT 1),
   'ANS_SBF_FOR_TWR01_PHE01', 'ANS SBF FOR TWR01 Phenocam', 'phenocam', 'PHE01', 'Planned',
   '2025-09-23T01:24:51.000Z', '2026-03-12T00:00:00.000Z'),

  ((SELECT id FROM platforms WHERE normalized_name = 'ANS_MJH_HEA_TWR01' LIMIT 1),
   'ANS_MJH_HEA_TWR01_PHE01', 'ANS MJH HEA TWR01 Phenocam', 'phenocam', 'PHE01', 'Planned',
   '2025-09-23T01:25:00.000Z', '2026-03-12T00:00:00.000Z'),

  ((SELECT id FROM platforms WHERE normalized_name = 'LON_AGR_TWR02' LIMIT 1),
   'LON_AGR_TWR02_PHE01', 'LON AGR TWR02 Phenocam', 'phenocam', 'PHE01', 'Planned',
   '2025-09-23T06:37:28.000Z', '2026-03-12T00:00:00.000Z'),

  ((SELECT id FROM platforms WHERE normalized_name = 'RBD_AGR_TWR03' LIMIT 1),
   'RBD_AGR_TWR03_PHE01', 'RBD AGR TWR03 Phenocam', 'phenocam', 'PHE01', 'Planned',
   '2025-09-23T06:38:21.000Z', '2026-03-12T00:00:00.000Z'),

  ((SELECT id FROM platforms WHERE normalized_name = 'SKC_III_FOR_TWR01' LIMIT 1),
   'SKC_III_FOR_TWR01_PHE01', 'SKC III FOR TWR01 Phenocam', 'phenocam', 'PHE01', 'Planned',
   '2025-09-23T06:39:49.000Z', '2026-03-12T00:00:00.000Z'),

  ((SELECT id FROM platforms WHERE normalized_name = 'SKC_III_MIR_TWR01' LIMIT 1),
   'SKC_III_MIR_TWR01_PHE01', 'SKC III MIR TWR01 Phenocam', 'phenocam', 'PHE01', 'Planned',
   '2025-09-23T06:39:49.000Z', '2026-03-12T00:00:00.000Z'),

  ((SELECT id FROM platforms WHERE normalized_name = 'SKC_III_FOL_TWR01' LIMIT 1),
   'SKC_III_FOL_TWR01_PHE01', 'SKC III FOL TWR01 Phenocam', 'phenocam', 'PHE01', 'Planned',
   '2025-09-23T06:39:49.000Z', '2026-03-12T00:00:00.000Z');
