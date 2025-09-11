-- Import real SITES Spectral platforms from official data
-- Based on Table 1. SITES Spectral Stations with active phenocam platforms

-- Abisko (ANS) - Station ID 1
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type, 
  latitude, longitude, thematic_program, status, created_at, updated_at
) VALUES (
  1, 'P_RTBH_1', 'ANS_FOR_P_RTBH_1', 'Abisko Forest Platform', 'building',
  68.353729, 18.816522, 'SITES_Spectral', 'Active', datetime('now'), datetime('now')
);

-- Asa (ASA) - Station ID 7  
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  thematic_program, status, created_at, updated_at
) VALUES (
  7, 'P_NYB_FOR_1', 'ASA_FOR_P_NYB_FOR_1', 'Asa Forest Platform', 'tower',
  'SITES_Spectral', 'Active', datetime('now'), datetime('now')
);

-- Grimsö (GRI) - Station ID 2
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  latitude, longitude, thematic_program, status, created_at, updated_at  
) VALUES (
  2, 'P_GRI_FOR_1', 'GRI_FOR_P_GRI_FOR_1', 'Grimsö Forest Platform', 'building',
  59.72868, 15.47249, 'SITES_Spectral', 'Active', datetime('now'), datetime('now')
);

-- Lönnstorp (LON) - Station ID 3 - Agricultural Platforms
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  latitude, longitude, thematic_program, status, created_at, updated_at
) VALUES 
  (3, 'P_SAFEA_AGR_1', 'LON_AGR_P_SAFEA_AGR_1', 'Lönnstorp Agricultural Platform 1', 'mast',
   55.668731, 13.108632, 'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (3, 'P_SAFEA_AGR_2', 'LON_AGR_P_SAFEA_AGR_2', 'Lönnstorp Agricultural Platform 2', 'mast', 
   55.669186, 13.11036, 'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (3, 'P_SAFEA_AGR_3', 'LON_AGR_P_SAFEA_AGR_3', 'Lönnstorp Agricultural Platform 3', 'mast',
   55.668549, 13.110535, 'SITES_Spectral', 'Active', datetime('now'), datetime('now'));

-- Röbäcksdalen (RBD) - Station ID 4 - Agricultural Platforms  
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  thematic_program, status, created_at, updated_at
) VALUES
  (4, 'P_RBD_AGR_1', 'RBD_AGR_P_RBD_AGR_1', 'Röbäcksdalen Agricultural Platform 1', 'mast',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (4, 'P_RBD_AGR_2', 'RBD_AGR_P_RBD_AGR_2', 'Röbäcksdalen Agricultural Platform 2', 'mast',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now'));

-- Skogaryd (SKC) - Station ID 5 - Multiple Ecosystem Platforms
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  thematic_program, status, created_at, updated_at
) VALUES
  (5, 'P_CEM01_FOR_1', 'SKC_FOR_P_CEM01_FOR_1', 'Skogaryd Forest Platform CEM01', 'tower',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (5, 'P_CEM02_FOR_1', 'SKC_FOR_P_CEM02_FOR_1', 'Skogaryd Forest Platform CEM02', 'tower', 
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (5, 'P_CEM03_FOR_1', 'SKC_FOR_P_CEM03_FOR_1', 'Skogaryd Forest Platform CEM03', 'tower',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (5, 'P_ERS_LAK_1', 'SKC_LAK_P_ERS_LAK_1', 'Skogaryd Lake Platform ERS', 'tower',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (5, 'P_MAD_FOR_1', 'SKC_FOR_P_MAD_FOR_1', 'Skogaryd Forest Platform MAD', 'tower',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (5, 'P_MAD_WET_1', 'SKC_WET_P_MAD_WET_1', 'Skogaryd Wetland Platform MAD', 'tower',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now'));

-- Svartberget (SVB) - Station ID 6 - Forest and Mire Platforms
INSERT INTO platforms (
  station_id, platform_id, canonical_id, name, type,
  thematic_program, status, created_at, updated_at
) VALUES
  (6, 'P_SVB_FOR_1', 'SVB_FOR_P_SVB_FOR_1', 'Svartberget Forest Platform', 'tower',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (6, 'P_DEG_MIR_1', 'SVB_MIR_P_DEG_MIR_1', 'Svartberget Mire Platform DEG1', 'tower',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (6, 'P_DEG_MIR_2', 'SVB_MIR_P_DEG_MIR_2', 'Svartberget Mire Platform DEG2', 'tower', 
   'SITES_Spectral', 'Active', datetime('now'), datetime('now')),
  (6, 'P_DEG_MIR_3', 'SVB_MIR_P_DEG_MIR_3', 'Svartberget Mire Platform DEG3', 'tower',
   'SITES_Spectral', 'Active', datetime('now'), datetime('now'));