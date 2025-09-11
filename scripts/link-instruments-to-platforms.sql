-- Link existing instruments to platforms or create unknown platforms where needed
-- Based on analysis of YAML structure vs official platform IDs

-- Update phenocams to link them to known platforms where possible
-- For instruments that don't match the official platform IDs, create "UNKNOWN" platforms

-- First, let's link the instruments that we can match to official platforms:

-- Abisko: ANS_FOR_BL01_PHE01 -> P_RTBH_1 (need to check location field)
UPDATE phenocams 
SET platform_id = 1 
WHERE canonical_id = 'ANS_FOR_BL01_PHE01' 
AND station_id = 1;

-- Grimsö: GRI_FOR_BL01_PHE01 -> P_GRI_FOR_1  
UPDATE phenocams 
SET platform_id = 3 
WHERE canonical_id = 'GRI_FOR_BL01_PHE01' 
AND station_id = 2;

-- Lönnstorp: LON_AGR_PL01_PHE01/02/03 -> P_SAFEA_AGR_1/2/3
UPDATE phenocams 
SET platform_id = 4 
WHERE canonical_id = 'LON_AGR_PL01_PHE01' 
AND station_id = 3;

UPDATE phenocams 
SET platform_id = 5 
WHERE canonical_id = 'LON_AGR_PL01_PHE02' 
AND station_id = 3;

UPDATE phenocams 
SET platform_id = 6 
WHERE canonical_id = 'LON_AGR_PL01_PHE03' 
AND station_id = 3;

-- For remaining instruments, create UNKNOWN platforms that require urgent attention

-- Röbäcksdalen instruments - Create UNKNOWN platforms
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  status, description, thematic_program, created_at, updated_at
) VALUES 
  (4, 'UNKNOWN_PL01', 'RBD_AGR_UNKNOWN_PL01', 'UNKNOWN Platform - Needs Mapping to P_RBD_AGR_1', 'ground',
   'URGENT: Requires mapping to official platform P_RBD_AGR_1', 
   'SITES_Spectral', datetime('now'), datetime('now')),
  (4, 'UNKNOWN_PL02', 'RBD_AGR_UNKNOWN_PL02', 'UNKNOWN Platform - Needs Mapping to P_RBD_AGR_2', 'ground',
   'URGENT: Requires mapping to official platform P_RBD_AGR_2', 
   'SITES_Spectral', datetime('now'), datetime('now'));

-- Link Röbäcksdalen instruments to unknown platforms
UPDATE phenocams 
SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_PL01' AND station_id = 4)
WHERE canonical_id = 'RBD_AGR_PL01_PHE01' AND station_id = 4;

UPDATE phenocams 
SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_PL02' AND station_id = 4)
WHERE canonical_id = 'RBD_AGR_PL02_PHE01' AND station_id = 4;

-- Skogaryd instruments - Create UNKNOWN platforms for complex mapping
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  status, description, thematic_program, created_at, updated_at
) VALUES 
  (5, 'UNKNOWN_CEM_PL01', 'SKC_FOR_UNKNOWN_CEM_PL01', 'UNKNOWN Platform - Needs Mapping to P_CEM01_FOR_1', 'tower',
   'URGENT: Requires mapping to official platforms', 
   'SITES_Spectral', datetime('now'), datetime('now')),
  (5, 'UNKNOWN_CEM_PL02', 'SKC_FOR_UNKNOWN_CEM_PL02', 'UNKNOWN Platform - Needs Mapping to P_CEM02_FOR_1', 'unknown',
   'Urgent: Requires mapping to official platforms', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (5, 'UNKNOWN_CEM_PL03', 'SKC_FOR_UNKNOWN_CEM_PL03', 'UNKNOWN Platform - Needs Mapping to P_CEM03_FOR_1', 'unknown',
   'Urgent: Requires mapping to official platforms', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (5, 'UNKNOWN_LAK_PL01', 'SKC_LAK_UNKNOWN_LAK_PL01', 'UNKNOWN Platform - Needs Mapping to P_ERS_LAK_1', 'unknown',
   'Urgent: Requires mapping to official platforms', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (5, 'UNKNOWN_STM_PL01', 'SKC_FOR_UNKNOWN_STM_PL01', 'UNKNOWN Platform - Needs Mapping to P_MAD_FOR_1', 'unknown',
   'Urgent: Requires mapping to official platforms', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (5, 'UNKNOWN_WET_PL02', 'SKC_WET_UNKNOWN_WET_PL02', 'UNKNOWN Platform - Needs Mapping to P_MAD_WET_1', 'unknown',
   'Urgent: Requires mapping to official platforms', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now'));

-- Link Skogaryd instruments to unknown platforms (best guess mapping)
UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_CEM_PL01' AND station_id = 5)
WHERE canonical_id = 'SKC_CEM_FOR_PL01_PHE01' AND station_id = 5;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_CEM_PL02' AND station_id = 5)
WHERE canonical_id = 'SKC_CEM_FOR_PL02_PHE01' AND station_id = 5;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_CEM_PL03' AND station_id = 5)
WHERE canonical_id = 'SKC_CEM_FOR_PL03_PHE01' AND station_id = 5;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_LAK_PL01' AND station_id = 5)
WHERE canonical_id = 'SKC_LAK_PL01_PHE01' AND station_id = 5;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_STM_PL01' AND station_id = 5)
WHERE canonical_id = 'STM_FOR_PL01_PHE01' AND station_id = 5;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_WET_PL02' AND station_id = 5)
WHERE canonical_id = 'SKC_MAD_WET_PL01_PHE01' AND station_id = 5;

-- Additional Skogaryd instruments need individual unknown platforms
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  status, notes, thematic_program, created_at, updated_at
) VALUES 
  (5, 'UNKNOWN_MAD_PL04', 'SKC_FOR_UNKNOWN_MAD_PL04', 'UNKNOWN Platform - Complex Mapping Required', 'unknown',
   'Urgent: Requires detailed analysis and mapping', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (5, 'UNKNOWN_SRC_PL03', 'SKC_WET_UNKNOWN_SRC_PL03', 'UNKNOWN Platform - Complex Mapping Required', 'unknown',
   'Urgent: Requires detailed analysis and mapping', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (5, 'UNKNOWN_SRC_PL04', 'SKC_WET_UNKNOWN_SRC_PL04', 'UNKNOWN Platform - Complex Mapping Required', 'unknown',
   'Urgent: Requires detailed analysis and mapping', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now'));

-- Link remaining Skogaryd instruments
UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_MAD_PL04' AND station_id = 5)
WHERE canonical_id = 'SKC_MAD_FOR_PL02_PHE01' AND station_id = 5;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_SRC_PL03' AND station_id = 5)
WHERE canonical_id = 'SKC_SRC_FOL_WET_PL01_PHE01' AND station_id = 5;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_SRC_PL04' AND station_id = 5)
WHERE canonical_id = 'SKC_SRC_FOL_WET_PL02_PHE01' AND station_id = 5;

-- Svartberget instruments - Create UNKNOWN platforms  
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  status, notes, thematic_program, created_at, updated_at
) VALUES 
  (6, 'UNKNOWN_MIR_PL01', 'SVB_MIR_UNKNOWN_MIR_PL01', 'UNKNOWN Platform - Needs Mapping to P_DEG_MIR_1', 'unknown',
   'Urgent: Requires mapping to official platform P_DEG_MIR_1', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (6, 'UNKNOWN_MIR_PL02', 'SVB_MIR_UNKNOWN_MIR_PL02', 'UNKNOWN Platform - Needs Mapping to P_DEG_MIR_2', 'unknown',
   'Urgent: Requires mapping to official platform P_DEG_MIR_2', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (6, 'UNKNOWN_MIR_PL03', 'SVB_MIR_UNKNOWN_MIR_PL03', 'UNKNOWN Platform - Needs Mapping to P_DEG_MIR_3', 'unknown',
   'Urgent: Requires mapping to official platform P_DEG_MIR_3', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now')),
  (6, 'UNKNOWN_FOR_PL01', 'SVB_FOR_UNKNOWN_FOR_PL01', 'UNKNOWN Platform - Needs Mapping to P_SVB_FOR_1', 'unknown',
   'Urgent: Requires mapping to official platform P_SVB_FOR_1', 
   'NEEDS_PLATFORM_MAPPING', 'SITES_Spectral', datetime('now'), datetime('now'));

-- Link Svartberget instruments
UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_MIR_PL01' AND station_id = 6)
WHERE canonical_id = 'SVB_MIR_PL01_PHE01' AND station_id = 6;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_MIR_PL02' AND station_id = 6)
WHERE canonical_id = 'SVB_MIR_PL02_PHE01' AND station_id = 6;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_MIR_PL03' AND station_id = 6)
WHERE canonical_id = 'SVB_MIR_PL03_PHE01' AND station_id = 6;

UPDATE phenocams SET platform_id = (SELECT id FROM platforms WHERE platform_id = 'UNKNOWN_FOR_PL01' AND station_id = 6)
WHERE canonical_id IN ('SVB_FOR_PL01_PHE01', 'SVB_FOR_PL01_PHE02') AND station_id = 6;