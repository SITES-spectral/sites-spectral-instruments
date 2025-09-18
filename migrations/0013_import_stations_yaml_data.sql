-- Import data from stations.yaml into new schema
-- Version 3.2.0 - Dashboard rebuild from stations.yaml

-- Insert stations
INSERT INTO stations (normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES
('abisko', 'Abisko', 'ANS', 'Active', 'Sweden', 68.353729, 18.816522, 'Abisko Scientific Research Station'),
('asa', 'Asa', 'ASA', 'Active', 'Sweden', 57.1645, 14.7827, 'Asa Research Station'),
('grimso', 'Grimsö', 'GRI', 'Active', 'Sweden', 59.72868, 15.47249, 'Grimsö Wildlife Research Station'),
('lonnstorp', 'Lönnstorp', 'LON', 'Active', 'Sweden', 55.668731, 13.108632, 'Lönnstorp Agricultural Research Station'),
('robacksdalen', 'Röbäcksdalen', 'RBD', 'Active', 'Sweden', 63.806642, 20.229243, 'Röbäcksdalen Research Station'),
('skogaryd', 'Skogaryd', 'SKC', 'Active', 'Sweden', 58.363865, 12.149763, 'Skogaryd Research Station'),
('svartberget', 'Svartberget', 'SVB', 'Active', 'Sweden', 64.182536, 19.558045, 'Svartberget Research Station');

-- Insert platforms for Abisko
INSERT INTO platforms (station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, description, operation_programs) VALUES
(1, 'ANS_FOR_BL01', 'Abisko Forest Building 01', 'BL01', 'Building RoofTop', 4.5, 'Active', 68.353729, 18.816522, 'Forest phenocam platform on research station building', '["Abisko Scientific Research Station", "SITES", "ICOS"]');

-- Insert platforms for Asa
INSERT INTO platforms (station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description, operation_programs) VALUES
(2, 'ASA_FOR_PL01', 'Asa Nybigget Mast', 'PL01', 'Mast', 7.5, 'Decommissioned', 57.149034, 14.738967, '2025-06-01', 'New tower built June 2025', '["SLU", "SITES", "ICOS"]');

-- Insert platforms for Grimsö
INSERT INTO platforms (station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, description, operation_programs) VALUES
(3, 'GRI_FOR_BL01', 'Grimsö Forest Building 01', 'BL01', 'Building Wall', 4.0, 'Active', 59.72868, 15.47249, 'Forest phenocam platform mounted on building wall', '["SLU", "SITES"]');

-- Insert platforms for Lönnstorp
INSERT INTO platforms (station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, description, operation_programs) VALUES
(4, 'LON_AGR_PL01', 'Lönnstorp Agriculture Platform 01', 'PL01', 'Mast', 10, 'Active', 55.668731, 13.108632, 'Agricultural phenocam platform on 10m mast', '["SLU", "SITES", "ICOS"]');

-- Insert platforms for Röbäcksdalen
INSERT INTO platforms (station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, description, operation_programs) VALUES
(5, 'RBD_AGR_PL01', 'Röbäcksdalen Agriculture Platform 01', 'PL01', 'Mast', 10, 'Active', 63.806642, 20.229243, 'Agricultural phenocam platform on 10m mast', '["SITES", "ICOS"]'),
(5, 'RBD_AGR_PL02', 'Röbäcksdalen Agriculture Platform 02', 'PL02', 'Mast', 4, 'Active', 63.809992, 20.238822, 'Agricultural phenocam platform on 4m mast', '["SITES", "ICOS"]');

-- Insert platforms for Skogaryd (simplified - main ones)
INSERT INTO platforms (station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, description, operation_programs) VALUES
(6, 'SKC_CEM_FOR_PL01', 'Skogaryd Cemetery Forest Platform 01', 'PL01', 'Tower', 38, 'Active', 58.363865, 12.149763, 'Forest phenocam platform on 38m tower', '["Goteborg University", "SITES", "ICOS"]'),
(6, 'SKC_LAK_PL01', 'Skogaryd Lake Platform 01', 'PL01', 'Mast', 38, 'Active', 58.363058, 12.14965, 'Lake ecosystem monitoring platform', '["Goteborg University", "SITES", "ICOS"]');

-- Insert platforms for Svartberget
INSERT INTO platforms (station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, description, operation_programs) VALUES
(7, 'SVB_MIR_PL01', 'Svartberget Mire Platform 01', 'PL01', 'Mast', 17.5, 'Active', 64.182536, 19.558045, 'Mire ecosystem monitoring platform', '["SITES", "ICOS"]'),
(7, 'SVB_FOR_PL01', 'Svartberget Forest Platform 01', 'PL01', 'Flagpole and Tower', 70, 'Active', 64.256342, 19.771621, 'Forest ecosystem monitoring platform on 70m tower', '["SITES", "ICOS"]');

-- Insert key instruments for Abisko
INSERT INTO instruments (platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_mega_pixels, camera_lens, camera_focal_length_mm, camera_aperture, camera_exposure_time, camera_iso, camera_white_balance, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes) VALUES
(1, 'ANS_FOR_BL01_PHE01', 'Abisko Forest Building 01 Phenocam 01', 'ANS-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', 68.353729, 18.816522, 4.5, 'West', 270, 90, 'Nikon', 'NIKON D300S DSLR', '4288x2848', 12.3, 'AF-S DX NIKKOR 18-105mm f/3.5-5.6G ED VR', 18, 'f/3.5', '1/125 sec', 200, 'Auto', 2010, 2025, 'Active', 'Forest ecosystem monitoring phenocam', 'Mounted on meteorological building rooftop facing west');

-- Insert key instruments for Grimsö
INSERT INTO instruments (platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, latitude, longitude, instrument_height_m, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_mega_pixels, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes) VALUES
(3, 'GRI_FOR_BL01_PHE01', 'Grimsö Forest Building 01 Phenocam 01', 'GRI-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', 59.72868, 15.47249, 3.5, 90, 'Mobotix', 'Mobotix M15 IP', '3072x2048', 6, 2020, 2025, 'Active', 'Forest ecosystem monitoring phenocam', 'Wall-mounted phenocam');

-- Insert key instruments for Lönnstorp
INSERT INTO instruments (platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_mega_pixels, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes) VALUES
(4, 'LON_AGR_PL01_PHE01', 'Lönnstorp Agriculture Platform 01 Phenocam 01', 'SFA-AGR-P01', 'phenocam', 'AGR', 'PHE01', 'Active', 55.668731, 13.108632, 10, 'West-North-West', 293, 58, 'Mobotix', 'Mobotix M16 IP', '3072x2048', 6, 2018, 2025, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing WNW');

-- Insert key instruments for Röbäcksdalen
INSERT INTO instruments (platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_mega_pixels, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes) VALUES
(5, 'RBD_AGR_PL01_PHE01', 'Röbäcksdalen Agriculture Platform 01 Phenocam 01', 'RBD-AGR-P01', 'phenocam', 'AGR', 'PHE01', 'Active', 63.806642, 20.229243, 10, 'West', 265, 59, 'Mobotix', 'Mobotix M15 IP', '3072x2048', 6, 2018, 2025, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West'),
(6, 'RBD_AGR_PL02_PHE01', 'Röbäcksdalen Agriculture Platform 02 Phenocam 01', 'RBD-AGR-P02', 'phenocam', 'AGR', 'PHE01', 'Active', 63.809992, 20.238822, 4, 'West', 305, 59, 'Mobotix', 'Mobotix M15 IP', '3072x2048', 6, 2018, 2025, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing West');

-- Insert key instruments for Skogaryd
INSERT INTO instruments (platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_mega_pixels, measurement_status, description, installation_notes) VALUES
(7, 'SKC_CEM_FOR_PL01_PHE01', 'Skogaryd Cemetery Forest Platform 01 Phenocam 01', 'CEM01-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', 58.363865, 12.149763, 38, 'South', 185, 38, 'Mobotix', 'Mobotix M25 IP', '3072x2048', 6, 'Active', 'Forest ecosystem monitoring phenocam', 'Tower-mounted phenocam viewing South'),
(8, 'SKC_LAK_PL01_PHE01', 'Skogaryd Lake Platform 01 Phenocam 01', 'ERS-LAK-P01', 'phenocam', 'LAK', 'PHE01', 'Active', 58.363058, 12.14965, 38, 'South', 185, 38, 'Mobotix', 'Mobotix M25 IP', '3072x2048', 6, 'Active', 'Lake ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing South');

-- Insert key instruments for Svartberget
INSERT INTO instruments (platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_mega_pixels, measurement_status, description, installation_notes) VALUES
(9, 'SVB_MIR_PL01_PHE01', 'Svartberget Mire Platform 01 Phenocam 01', 'DEG-MIR-P01', 'phenocam', 'MIR', 'PHE01', 'Active', 64.182536, 19.558045, 17.5, 'North-NorthEast', 317, 81, 'Mobotix', 'Mobotix M15 IP', '3072x2048', 6, 'Active', 'Mire ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing North-NorthEast'),
(10, 'SVB_FOR_PL01_PHE02', 'Svartberget Forest Platform 01 Phenocam 02', 'SVB-FOR-P02', 'phenocam', 'FOR', 'PHE02', 'Active', 64.256342, 19.771621, 70, 'North-West', 280, 45, 'Mobotix', 'Mobotix M25 IP', '3072x2048', 6, 'Active', 'Forest ecosystem monitoring phenocam', 'Tower-mounted phenocam viewing North-West');