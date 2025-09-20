-- Import standardized station data from stations.yaml vundefined
-- Generated: 2025-09-20T08:52:39.675Z
-- Schema: Standardized with nested geolocation structure

-- Clear existing data first
DELETE FROM instruments;
DELETE FROM platforms;
DELETE FROM stations;

-- Ecosystems are already defined in the database

-- Insert stations
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES
(1, 'abisko', 'Abisko', 'ANS', 'Active', 'Sweden', 68.35431844762302, 18.81577182723506, NULL, 'Abisko Scientific Research Station'),
(2, 'asa', 'Asa', 'ASA', 'Active', 'Sweden', 57.16457057264239, 14.78266887117808, NULL, 'Asa Research Station'),
(3, 'grimso', 'Grimsö', 'GRI', 'Active', 'Sweden', 59.72893957481183, 15.472279444503267, NULL, 'Grimsö Wildlife Research Station'),
(4, 'lonnstorp', 'Lönnstorp', 'LON', 'Active', 'Sweden', 55.66915120680076, 13.102841729711757, NULL, 'Lönnstorp Agricultural Research Station'),
(5, 'robacksdalen', 'Röbäcksdalen', 'RBD', 'Active', 'Sweden', 63.81101813533398, 20.23857775473176, NULL, 'Röbäcksdalen Research Station'),
(6, 'skogaryd', 'Skogaryd', 'SKC', 'Active', 'Sweden', 58.36489314691996, 12.144947284525392, NULL, 'Skogaryd Research Catchment'),
(7, 'svartberget', 'Svartberget', 'SVB', 'Active', 'Sweden', 64.24433725317064, 19.76638029816108, NULL, 'Svartberget Research Station');

-- Insert platforms
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description, operation_programs) VALUES
(1, 1, 'ANS_FOR_BL01', 'Abisko Meteorological Station', 'BL01', 'Building RoofTop', 4.5, 'Active', 68.35368325999725, 18.816555032266894, NULL, 'Forest phenocam platform on meteorological station building Rooftop locking at Montain Forest', '["Swedish Polar Research Secretariat","SITES","ICOS"]'),
(2, 2, 'ASA_FOR_PL01', 'Asa Nybigget Tower 01', 'PL01', 'Tower', 7.5, 'Decommissioned', 57.149034, 14.738967, NULL, 'Decommisioned in 2023', '["SLU","SITES","ICOS"]'),
(3, 2, 'ASA_FOR_PL02', 'Asa Nybigget Tower 02', 'PL02', 'Tower', 30, 'Testing', 57.150215997341355, 14.735910292294493, NULL, 'New testing platform in Nybbyget forest', '["SLU","SITES","ICOS"]'),
(4, 3, 'GRI_FOR_BL01', 'Grimsö Forest Building 01', 'BL01', 'Building Wall', 4, 'Active', 59.72868, 15.47249, NULL, 'Forest phenocam platform mounted on building wall', '["SLU","SITES"]'),
(5, 4, 'LON_AGR_PL01', 'Lönnstorp Agriculture Platform 01', 'PL01', 'Mast', 10, 'Active', 55.66852797461607, 13.11002468545483, NULL, 'Agricultural phenocam platform on 10m mast', '["SLU","SITES","ICOS"]'),
(6, 5, 'RBD_AGR_PL01', 'RBD AGR Platform 01', 'PL01', 'Mast', 10, 'Active', 63.80633652088793, 20.23278887845085, NULL, '', '["SITES","ICOS"]'),
(7, 5, 'RBD_AGR_PL02', 'RBD AGR Platform 02', 'PL02', 'Mast', 4, 'Active', 63.80887623165294, 20.239035233753672, NULL, '', '["SITES","ICOS"]'),
(8, 6, 'SKC_CEM_FOR_PL01', 'SKC CEM Platform OR', 'PL01', 'Tower', 38, 'Active', 56.779249462109675, 13.539626992981868, NULL, '', '["Goteborg University","SITES","ICOS"]'),
(9, 6, 'SKC_CEM_FOR_PL02', 'SKC CEM Platform OR', 'PL02', 'Mast', 3, 'Active', 58.363759, 12.149442, NULL, '', '["Goteborg University","SITES","ICOS"]'),
(10, 6, 'SKC_CEM_FOR_PL03', 'SKC CEM Platform OR', 'PL03', 'Mast', 3, 'Active', 58.363596, 12.149933, NULL, '', '["Goteborg University","SITES","ICOS"]'),
(11, 6, 'SKC_LAK_PL01', 'SKC LAK Platform 01', 'PL01', 'Mast', 38, 'Active', 58.37109394956773, 12.161222928836889, NULL, 'Ersjön Lake', '["Goteborg University","SITES","ICOS"]'),
(12, 6, 'STM_FOR_PL01', 'STM FOR Platform 01', 'PL01', 'Mast', NULL, 'Active', 58.381090921121576, 12.144717670820102, NULL, 'Stordalen Mire', '["SLU","SITES","ICOS"]'),
(13, 6, 'SKC_MAD_WET_PL01', 'SKC MAD Platform ET', 'PL01', 'Mast', NULL, 'Active', NULL, NULL, NULL, '', '["Goteborg University","SITES","ICOS"]'),
(14, 6, 'SKC_MAD_FOR_PL02', 'SKC MAD Platform OR', 'PL02', 'Mast', NULL, 'Active', 58.368601, 12.145319, NULL, '', '["Goteborg University","SITES","ICOS"]'),
(15, 6, 'SKC_SRC_FOL_WET_PL01', 'SKC SRC Platform OL', 'PL01', 'Mast', NULL, 'Active', 58.36498107448048, 12.169814044307167, NULL, 'Mycklemossen Wetland', '["Goteborg University","SITES","ICOS"]'),
(16, 6, 'SKC_SRC_FOL_WET_PL02', 'SKC SRC Platform OL', 'PL02', 'Mast', NULL, 'Active', 58.36509643482043, 12.170527511904256, NULL, '', '["Goteborg University","SITES","ICOS"]'),
(17, 7, 'SVB_MIR_PL01', 'SVB MIR Platform 01', 'PL01', '', 17.5, 'Active', 64.18258503808431, 19.558028904903516, NULL, '', '["SITES","ICOS"]'),
(18, 7, 'SVB_MIR_PL02', 'SVB MIR Platform 02', 'PL02', 'Mast', 3.3, 'Active', 64.18201, 19.556576, NULL, '', '["SITES","ICOS"]'),
(19, 7, 'SVB_MIR_PL03', 'SVB MIR Platform 03', 'PL03', 'Mast', 17.5, 'Active', 64.182536, 19.558045, NULL, '', '["SITES","ICOS"]'),
(20, 7, 'SVB_FOR_PL01', 'SVB FOR Platform 01', 'PL01', 'Flagpole and Tower', 70, 'Active', 64.256342, 19.771621, NULL, '', '["SITES","ICOS"]');

-- Insert instruments
INSERT INTO instruments (id, platform_id, normalized_name, display_name, instrument_type, ecosystem_code, instrument_number, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, status, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, description, installation_notes, maintenance_notes) VALUES
(1, 1, 'ANS_FOR_BL01_PHE01', 'Abisko Meteorological Station Phenocam 01', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 68.35368325999725, 18.816555032266894, 4.5, '', NULL, 'Forest ecosystem monitoring phenocam', 'Mounted on meteorological building rooftop facing west', ''),
(2, 2, 'ASA_FOR_PL01_PHE01', 'Nybygget Tower Phenocam 01', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', NULL, NULL, 30, '', NULL, 'Forest ecosystem monitoring phenocam', '', 'Decommisioned in 2019'),
(3, 3, 'ASA_FOR_PL02_PHE01', 'Asa Nybigget Tower 02 Phenocam 01', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Testing', 57.150215997341355, 14.735910292294493, 30, '', NULL, 'Forest ecosystem monitoring phenocam', 'Mounted on a 30 meter Tower in Nybbyget forest', 'New installation, testing phase'),
(4, 4, 'GRI_FOR_BL01_PHE01', 'Grimsö Forest Building 01 Phenocam 01', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 59.72868, 15.47249, 3.5, '', NULL, 'Forest ecosystem monitoring phenocam', 'Wall-mounted phenocam', ''),
(5, 5, 'LON_AGR_PL01_PHE01', 'Lönnstorp Agriculture Platform 01 Phenocam 01', 'phenocam', 'AGR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 55.66852797461607, 13.11002468545483, 10, '', NULL, 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing WNW', ''),
(6, 5, 'LON_AGR_PL01_PHE02', 'LON AGR PL01 PHE02', 'phenocam', 'AGR', 'PHE02', '', '', '', '', NULL, NULL, 'Active', 'Active', 55.66852797461607, 13.11002468545483, 10, '', NULL, 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing XX', ''),
(7, 5, 'LON_AGR_PL01_PHE03', 'LON AGR PL01 PHE03', 'phenocam', 'AGR', 'PHE03', '', '', '', '', NULL, NULL, 'Active', 'Active', 55.66852797461607, 13.11002468545483, 10, '', NULL, 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing East', ''),
(8, 6, 'RBD_AGR_PL01_PHE01', 'RBD AGR PL01 PHE01', 'phenocam', 'AGR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 63.80633652088793, 20.23278887845085, 10, '', NULL, 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West', ''),
(9, 7, 'RBD_AGR_PL02_PHE01', 'RBD AGR PL02 PHE01', 'phenocam', 'AGR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 63.80887623165294, 20.239035233753672, 4, '', NULL, 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West', ''),
(10, 8, 'SKC_CEM_FOR_PL01_PHE01', 'SKC CEM FOR PL01', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 56.779249462109675, 13.539626992981868, 38, '', NULL, 'Forest ecosystem monitoring phenocam', 'Tower-mounted phenocam viewing South', ''),
(11, 9, 'SKC_CEM_FOR_PL02_PHE01', 'SKC CEM FOR PL02', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 58.363759, 12.149442, 3, '', NULL, 'Forest ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West', ''),
(12, 10, 'SKC_CEM_FOR_PL03_PHE01', 'SKC CEM FOR PL03', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 58.363596, 12.149933, 3, '', NULL, 'Forest ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West', ''),
(13, 11, 'SKC_LAK_PL01_PHE01', 'SKC LAK PL01 PHE01', 'phenocam', 'LAK', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 58.37109394956773, 12.161222928836889, 38, '', NULL, 'Lake ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South', ''),
(14, 12, 'STM_FOR_PL01_PHE01', 'STM FOR PL01 PHE01', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 58.381090921121576, 12.144717670820102, NULL, '', NULL, 'Forest ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South', ''),
(15, 13, 'SKC_MAD_WET_PL01_PHE01', 'SKC MAD WET PL01', 'phenocam', 'WET', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 58.364975447137176, 12.16983550197926, NULL, '', NULL, 'Wetland ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South', ''),
(16, 14, 'SKC_MAD_FOR_PL02_PHE01', 'SKC MAD FOR PL02', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 58.368601, 12.145319, NULL, '', NULL, 'Forest ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South', ''),
(17, 15, 'SKC_SRC_FOL_WET_PL01_PHE01', 'SKC SRC FOL WET', 'phenocam', 'WET', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 58.36498107448048, 12.169814044307167, NULL, '', NULL, 'Wetland ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing East', ''),
(18, 16, 'SKC_SRC_FOL_WET_PL02_PHE01', 'SKC SRC FOL WET', 'phenocam', 'WET', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 58.36509643482043, 12.170527511904256, NULL, '', NULL, 'Wetland ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing East', ''),
(19, 17, 'SVB_MIR_PL01_PHE01', 'SVB MIR PL01 PHE01', 'phenocam', 'MIR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 64.18258503808431, 19.558028904903516, 17.5, '', NULL, 'Mire ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing North-NorthEast', ''),
(20, 18, 'SVB_MIR_PL02_PHE01', 'SVB MIR PL02 PHE01', 'phenocam', 'MIR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 64.18201, 19.556576, 3.3, '', NULL, 'Mire ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing North', ''),
(21, 19, 'SVB_MIR_PL03_PHE01', 'SVB MIR PL03 PHE01', 'phenocam', 'MIR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Active', 64.182536, 19.558045, 17.5, '', NULL, 'Mire ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing North-NorthEast', ''),
(22, 20, 'SVB_FOR_PL01_PHE01', 'SVB FOR PL01 PHE01', 'phenocam', 'FOR', 'PHE01', '', '', '', '', NULL, NULL, 'Active', 'Inactive', 64.256342, 19.771621, 70, '', NULL, 'Forest ecosystem monitoring phenocam', 'Tower-mounted phenocam viewing North-West', ''),
(23, 20, 'SVB_FOR_PL01_PHE02', 'SVB FOR PL01 PHE02', 'phenocam', 'FOR', 'PHE02', '', '', '', '', NULL, NULL, 'Active', 'Active', 64.256342, 19.771621, 70, '', NULL, 'Forest ecosystem monitoring phenocam', 'Tower-mounted phenocam viewing North-West', '');

-- Summary:
-- Stations: 7
-- Platforms: 20
-- Instruments: 23
