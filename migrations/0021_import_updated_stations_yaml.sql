-- Migration: Import updated stations.yaml data (2025-09-19)
-- Generated for updated stations.yaml with mixed field structures
-- Source: .secure/stations.yaml, yamls/ecosystems.yaml, yamls/status.yaml

-- Clear existing data
DELETE FROM activity_log;
DELETE FROM user_sessions;
DELETE FROM user_field_permissions;
DELETE FROM instruments;
DELETE FROM platforms;
DELETE FROM stations;
DELETE FROM users;
DELETE FROM ecosystems;

-- Insert ecosystems data
INSERT INTO ecosystems (code, name, description) VALUES ('HEA', 'Heathland', 'Heathland');
INSERT INTO ecosystems (code, name, description) VALUES ('AGR', 'Arable Land', 'Arable Land');
INSERT INTO ecosystems (code, name, description) VALUES ('MIR', 'Mires', 'Mires');
INSERT INTO ecosystems (code, name, description) VALUES ('LAK', 'Lake', 'Lake');
INSERT INTO ecosystems (code, name, description) VALUES ('WET', 'Wetland', 'Wetland');
INSERT INTO ecosystems (code, name, description) VALUES ('GRA', 'Grassland', 'Grassland');
INSERT INTO ecosystems (code, name, description) VALUES ('FOR', 'Forest', 'Forest');
INSERT INTO ecosystems (code, name, description) VALUES ('ALP', 'Alpine Forest', 'Alpine Forest');
INSERT INTO ecosystems (code, name, description) VALUES ('CON', 'Coniferous Forest', 'Coniferous Forest');
INSERT INTO ecosystems (code, name, description) VALUES ('DEC', 'Deciduous Forest', 'Deciduous Forest');
INSERT INTO ecosystems (code, name, description) VALUES ('MAR', 'Marshland', 'Marshland');
INSERT INTO ecosystems (code, name, description) VALUES ('PEA', 'Peatland', 'Peatland');

-- Station: Abisko
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (1, 'abisko', 'Abisko', 'ANS', 'Active', 'Sweden', 68.35431844762302, 18.81577182723506, NULL, 'Abisko Scientific Research Station');

-- Platform: ANS_FOR_BL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (1, 1, 'ANS_FOR_BL01', 'Abisko Forest Building 01', 'BL01', 'Building RoofTop', 4.5, 'Active', 68.35368325999725, 18.816555032266894, NULL, 'Forest phenocam platform on research station building');

-- Instrument: ANS_FOR_BL01_PHE01
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (1, 1, 'ANS_FOR_BL01_PHE01', 'Abisko Meteorological Station Phenocam 01', 'ANS-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 68.35368325999725, 18.816555032266894, 4.5, 'West', 270, 90, 'Nikon', 'NIKON D300S DSLR', '4288x2848', NULL, 2010, 2025, 'Active', 'Forest ecosystem monitoring phenocam', 'Mounted on meteorological building rooftop facing west', NULL);

-- Station: Asa
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (2, 'asa', 'Asa', 'ASA', 'Active', 'Sweden', 57.16457057264239, 14.78266887117808, NULL, 'Asa Research Station');

-- Platform: ASA_FOR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (2, 2, 'ASA_FOR_PL01', 'Asa Nybigget Tower 01', 'PL01', 'Tower', 7.5, 'Decommissioned', 57.149034, 14.738967, NULL, 'Decommisioned in 2023');

-- Instrument: ASA_FOR_PL01_PHE01
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (2, 2, 'ASA_FOR_PL01_PHE01', 'Nybygget Tower Phenocam 01', NULL, 'phenocam', 'FOR', 'PHE01', 'Active', '2025-06-01', NULL, NULL, 30, 'West', 270, 90, 'Mobotix', 'Mobotix M25 IP', NULL, NULL, 2015, 2019, 'Decommissioned', 'Forest ecosystem monitoring phenocam', NULL, 'Decommisioned in 2019');

-- Instrument: ASA_FOR_PL02_PHE01
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (3, 2, 'ASA_FOR_PL02_PHE01', 'Asa Nybigget Tower Phenocam 01', NULL, 'phenocam', 'FOR', 'PHE01', 'Testing', '2025-04-23', 57.150215997341355, 14.735910292294493, 30, NULL, NULL, NULL, 'Mobotix', 'Mobotix M25 IP', '3072x2048', NULL, 2025, 2025, 'Testing', 'Forest ecosystem monitoring phenocam', 'Mounted on a 30 meter Tower in Nybbyget forest', 'New installation, testing phase');

-- Station: Grimsö
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (3, 'grimso', 'Grimsö', 'GRI', 'Active', 'Sweden', 59.72893957481183, 15.472279444503267, NULL, 'Grimsö Wildlife Research Station');

-- Platform: GRI_FOR_BL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (3, 3, 'GRI_FOR_BL01', 'Grimsö Forest Building 01', 'BL01', 'Building Wall', 4.0, 'Active', 59.72868, 15.47249, NULL, 'Forest phenocam platform mounted on building wall');

-- Instrument: GRI_FOR_BL01_PHE01
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (4, 3, 'GRI_FOR_BL01_PHE01', 'Grimsö Forest Building 01 Phenocam 01', 'GRI-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 59.72868, 15.47249, 3.5, NULL, NULL, 90, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, 2020, 2025, 'Active', 'Forest ecosystem monitoring phenocam', 'Wall-mounted phenocam', NULL);

-- Station: Lönnstorp
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (4, 'lonnstorp', 'Lönnstorp', 'LON', 'Active', 'Sweden', 55.66915120680076, 13.102841729711757, NULL, 'Lönnstorp Agricultural Research Station');

-- Platform: LON_AGR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (4, 4, 'LON_AGR_PL01', 'Lönnstorp Agriculture Platform 01', 'PL01', 'Mast', 10, 'Active', 55.66852797461607, 13.11002468545483, NULL, 'Agricultural phenocam platform on 10m mast');

-- Instrument: LON_AGR_PL01_PHE01
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (5, 4, 'LON_AGR_PL01_PHE01', 'Lönnstorp Agriculture Platform 01 Phenocam 01', 'SFA-AGR-P01', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, 55.66852797461607, 13.11002468545483, 10, 'West-North-West', 293, 58, 'Mobotix', 'Mobotix M16 IP', '3072x2048', NULL, 2018, 2025, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing WNW', NULL);

-- Instrument: LON_AGR_PL01_PHE02 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (6, 4, 'LON_AGR_PL01_PHE02', 'LON_AGR_PL01_PHE02', 'SFA-AGR-P02', 'phenocam', 'AGR', 'PHE02', 'Active', NULL, 55.66852797461607, 13.11002468545483, 10, 'North', 12, 58, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, 2019, 2025, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing XX', NULL);

-- Instrument: LON_AGR_PL01_PHE03 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (7, 4, 'LON_AGR_PL01_PHE03', 'LON_AGR_PL01_PHE03', 'SFA-AGR-P03', 'phenocam', 'AGR', 'PHE03', 'Active', NULL, 55.66852797461607, 13.11002468545483, 10, 'East', 85, 58, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, 2019, 2025, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing East', NULL);

-- Station: Röbäcksdalen
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (5, 'robacksdalen', 'Röbäcksdalen', 'RBD', 'Active', 'Sweden', 63.81101813533398, 20.23857775473176, NULL, 'Röbäcksdalen Research Station');

-- Platform: RBD_AGR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (5, 5, 'RBD_AGR_PL01', 'RBD_AGR_PL01', 'PL01', 'Mast', 10, 'Active', 63.80633652088793, 20.23278887845085, NULL, NULL);

-- Instrument: RBD_AGR_PL01_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (8, 5, 'RBD_AGR_PL01_PHE01', 'RBD_AGR_PL01_PHE01', 'RBD-AGR-P01', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, 63.80633652088793, 20.23278887845085, 10, 'West', 265, 59, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, 2018, 2025, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West', NULL);

-- Platform: RBD_AGR_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (6, 5, 'RBD_AGR_PL02', 'RBD_AGR_PL02', 'PL02', 'Mast', 4, 'Active', 63.80887623165294, 20.239035233753672, NULL, NULL);

-- Instrument: RBD_AGR_PL02_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (9, 6, 'RBD_AGR_PL02_PHE01', 'RBD_AGR_PL02_PHE01', 'RBD-AGR-P02', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, 63.80887623165294, 20.239035233753672, 4, 'West', 305, 59, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, 2018, 2025, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West', NULL);

-- Station: Skogaryd
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (6, 'skogaryd', 'Skogaryd', 'SKC', 'Active', 'Sweden', 58.36489314691996, 12.144947284525392, NULL, 'Skogaryd Research Catchment');

-- Platform: SKC_CEM_FOR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (7, 6, 'SKC_CEM_FOR_PL01', 'SKC_CEM_FOR_PL01', 'PL01', 'Tower', 38, 'Active', 56.779249462109675, 13.539626992981868, NULL, NULL);

-- Instrument: SKC_CEM_FOR_PL01_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (10, 7, 'SKC_CEM_FOR_PL01_PHE01', 'SKC_CEM_FOR_PL01_PHE01', 'CEM01-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 56.779249462109675, 13.539626992981868, 38, 'South', 185, 38, 'Mobotix', 'Mobotix M25 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'Tower-mounted phenocam viewing South', NULL);

-- Platform: SKC_CEM_FOR_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (8, 6, 'SKC_CEM_FOR_PL02', 'SKC_CEM_FOR_PL02', 'PL02', 'Mast', 3, 'Active', 58.363759, 12.149442, NULL, NULL);

-- Instrument: SKC_CEM_FOR_PL02_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (11, 8, 'SKC_CEM_FOR_PL02_PHE01', 'SKC_CEM_FOR_PL02_PHE01', 'CEM02-FOR-P02', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.363759, 12.149442, 3, 'West', 270, 47, 'Mobotix', 'Mobotix M25 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West', NULL);

-- Platform: SKC_CEM_FOR_PL03
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (9, 6, 'SKC_CEM_FOR_PL03', 'SKC_CEM_FOR_PL03', 'PL03', 'Mast', 3, 'Active', 58.363596, 12.149933, NULL, NULL);

-- Instrument: SKC_CEM_FOR_PL03_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (12, 9, 'SKC_CEM_FOR_PL03_PHE01', 'SKC_CEM_FOR_PL03_PHE01', 'CEM03-FOR-P03', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.363596, 12.149933, 3, 'West?', 270, 42, 'Mobotix', 'Mobotix M25 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West', NULL);

-- Platform: SKC_LAK_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (10, 6, 'SKC_LAK_PL01', 'SKC_LAK_PL01', 'PL01', 'Mast', 38, 'Active', 58.37109394956773, 12.161222928836889, NULL, 'Ersjön Lake');

-- Instrument: SKC_LAK_PL01_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (13, 10, 'SKC_LAK_PL01_PHE01', 'SKC_LAK_PL01_PHE01', 'ERS-LAK-P01', 'phenocam', 'LAK', 'PHE01', 'Active', NULL, 58.37109394956773, 12.161222928836889, 38, 'South', 185, 38, 'Mobotix', 'Mobotix M25 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Lake ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South', NULL);

-- Platform: STM_FOR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (11, 6, 'STM_FOR_PL01', 'STM_FOR_PL01', 'PL01', 'Mast', NULL, 'Active', 58.381090921121576, 12.144717670820102, NULL, 'Stordalen Mire');

-- Instrument: STM_FOR_PL01_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (14, 11, 'STM_FOR_PL01_PHE01', 'STM_FOR_PL01_PHE01', 'STM-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.381090921121576, 12.144717670820102, NULL, NULL, NULL, NULL, 'Mobotix', 'Mobotix M16 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South', NULL);

-- Platform: SKC_MAD_WET_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (12, 6, 'SKC_MAD_WET_PL01', 'SKC_MAD_WET_PL01', 'PL01', 'Mast', NULL, 'Active', NULL, NULL, NULL, NULL);

-- Instrument: SKC_MAD_WET_PL01_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (15, 12, 'SKC_MAD_WET_PL01_PHE01', 'SKC_MAD_WET_PL01_PHE01', 'MAD-WET-P01', 'phenocam', 'WET', 'PHE01', 'Active', NULL, 58.364975447137176, 12.16983550197926, NULL, NULL, NULL, NULL, 'Mobotix', 'Mobotix M16 IP', '1024x768', NULL, NULL, NULL, 'Active', 'Wetland ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South', NULL);

-- Platform: SKC_MAD_FOR_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (13, 6, 'SKC_MAD_FOR_PL02', 'SKC_MAD_FOR_PL02', 'PL02', 'Mast', NULL, 'Active', 58.368601, 12.145319, NULL, NULL);

-- Instrument: SKC_MAD_FOR_PL02_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (16, 13, 'SKC_MAD_FOR_PL02_PHE01', 'SKC_MAD_FOR_PL02_PHE01', 'MAD-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.368601, 12.145319, NULL, NULL, NULL, NULL, 'Mobotix', 'Mobotix M16 IP', '1024x768', NULL, NULL, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South', NULL);

-- Platform: SKC_SRC_FOL_WET_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (14, 6, 'SKC_SRC_FOL_WET_PL01', 'SKC_SRC_FOL_WET_PL01', 'PL01', 'Mast', NULL, 'Active', 58.36498107448048, 12.169814044307167, NULL, 'Mycklemossen Wetland');

-- Instrument: SKC_SRC_FOL_WET_PL01_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (17, 14, 'SKC_SRC_FOL_WET_PL01_PHE01', 'SKC_SRC_FOL_WET_PL01_PHE01', 'FOL-WET-P01', 'phenocam', 'WET', 'PHE01', 'Active', NULL, 58.36498107448048, 12.169814044307167, NULL, NULL, NULL, NULL, 'Mobotix', 'Mobotix M16 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Wetland ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing East', NULL);

-- Platform: SKC_SRC_FOL_WET_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (15, 6, 'SKC_SRC_FOL_WET_PL02', 'SKC_SRC_FOL_WET_PL02', 'PL02', 'Mast', NULL, 'Active', 58.36509643482043, 12.170527511904256, NULL, NULL);

-- Instrument: SKC_SRC_FOL_WET_PL02_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (18, 15, 'SKC_SRC_FOL_WET_PL02_PHE01', 'SKC_SRC_FOL_WET_PL02_PHE01', 'FOL-WET-P02', 'phenocam', 'WET', 'PHE01', 'Active', NULL, 58.36509643482043, 12.170527511904256, NULL, NULL, NULL, NULL, 'Mobotix', 'Mobotix M16 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Wetland ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing East', NULL);

-- Station: Svartberget
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (7, 'svartberget', 'Svartberget', 'SVB', 'Active', 'Sweden', 64.24433725317064, 19.76638029816108, NULL, 'Svartberget Research Station');

-- Platform: SVB_MIR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (16, 7, 'SVB_MIR_PL01', 'SVB_MIR_PL01', 'PL01', NULL, 17.5, 'Active', 64.18258503808431, 19.558028904903516, NULL, NULL);

-- Instrument: SVB_MIR_PL01_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (19, 16, 'SVB_MIR_PL01_PHE01', 'SVB_MIR_PL01_PHE01', 'DEG-MIR-P01', 'phenocam', 'MIR', 'PHE01', 'Active', NULL, 64.18258503808431, 19.558028904903516, 17.5, 'North-NorthEast', 317, 81, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Mire ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing North-NorthEast', NULL);

-- Platform: SVB_MIR_PL02
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (17, 7, 'SVB_MIR_PL02', 'SVB_MIR_PL02', 'PL02', 'Mast', 3.3, 'Active', 64.18201, 19.556576, NULL, NULL);

-- Instrument: SVB_MIR_PL02_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (20, 17, 'SVB_MIR_PL02_PHE01', 'SVB_MIR_PL02_PHE01', 'DEG-MIR-P02', 'phenocam', 'MIR', 'PHE01', 'Active', NULL, 64.18201, 19.556576, 3.3, 'North', 343, 82, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Mire ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing North', NULL);

-- Platform: SVB_MIR_PL03
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (18, 7, 'SVB_MIR_PL03', 'SVB_MIR_PL03', 'PL03', 'Mast', 17.5, 'Active', 64.182536, 19.558045, NULL, NULL);

-- Instrument: SVB_MIR_PL03_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (21, 18, 'SVB_MIR_PL03_PHE01', 'SVB_MIR_PL03_PHE01', 'DEG-MIR-P03', 'phenocam', 'MIR', 'PHE01', 'Active', '2024-10-29', 64.182536, 19.558045, 17.5, 'North-NorthEast', 317, 81, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Mire ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing North-NorthEast', NULL);

-- Platform: SVB_FOR_PL01
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (19, 7, 'SVB_FOR_PL01', 'SVB_FOR_PL01', 'PL01', 'Flagpole and Tower', 70, 'Active', 64.256342, 19.771621, NULL, NULL);

-- Instrument: SVB_FOR_PL01_PHE01 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (22, 19, 'SVB_FOR_PL01_PHE01', 'SVB_FOR_PL01_PHE01', 'SVB-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Inactive', NULL, 64.256342, 19.771621, 70, 'North-West', 280, 45, 'Mobotix', 'Mobotix M15 IP', '3072x2048', NULL, NULL, NULL, 'Inactive', 'Forest ecosystem monitoring phenocam', 'Tower-mounted phenocam viewing North-West', NULL);

-- Instrument: SVB_FOR_PL01_PHE02 (mixed field structure)
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes) VALUES (23, 19, 'SVB_FOR_PL01_PHE02', 'SVB_FOR_PL01_PHE02', 'SVB-FOR-P02', 'phenocam', 'FOR', 'PHE02', 'Active', '2024-10-29', 64.256342, 19.771621, 70, 'North-West', 280, 45, 'Mobotix', 'Mobotix M25 IP', '3072x2048', NULL, NULL, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'Tower-mounted phenocam viewing North-West', NULL);

-- Default admin user and permissions
INSERT INTO users (username, email, password_hash, role, full_name, organization, active) VALUES ('admin', 'admin@sites.se', '72b302bf297a228a75730123efef7c41', 'admin', 'System Administrator', 'SITES Spectral', 1);

-- User field permissions
INSERT INTO user_field_permissions (user_role, permission_type, table_name, field_name) VALUES
('admin', 'write', 'stations', '*'),
('admin', 'write', 'platforms', '*'),
('admin', 'write', 'instruments', '*'),
('station', 'write', 'platforms', 'display_name'),
('station', 'write', 'platforms', 'mounting_structure'),
('station', 'write', 'platforms', 'platform_height_m'),
('station', 'write', 'platforms', 'latitude'),
('station', 'write', 'platforms', 'longitude'),
('station', 'write', 'instruments', 'display_name'),
('station', 'write', 'instruments', 'camera_brand'),
('station', 'write', 'instruments', 'camera_model'),
('station', 'write', 'instruments', 'camera_resolution'),
('station', 'write', 'instruments', 'viewing_direction'),
('station', 'write', 'instruments', 'azimuth_degrees'),
('station', 'write', 'instruments', 'latitude'),
('station', 'write', 'instruments', 'longitude'),
('readonly', 'read', 'stations', '*'),
('readonly', 'read', 'platforms', '*'),
('readonly', 'read', 'instruments', '*');