-- Import real station data from stations.yaml
-- Generated: 2025-09-18T23:12:39.356Z

-- Insert ecosystems
INSERT INTO ecosystems (code, description, acronym) VALUES
('FOR', 'Forest ecosystem monitoring', 'FOR'),
('AGR', 'Agricultural ecosystem monitoring', 'AGR'),
('MIR', 'Mire/bog ecosystem monitoring', 'MIR'),
('LAK', 'Lake ecosystem monitoring', 'LAK'),
('WET', 'Wetland ecosystem monitoring', 'WET'),
('HEA', 'Heath ecosystem monitoring', 'HEA'),
('SFO', 'Sub-forest ecosystem monitoring', 'SFO'),
('CEM', 'Cemetery ecosystem monitoring', 'CEM');

-- Insert stations
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES
(1, 'abisko', 'Abisko', 'ANS', 'Active', 'Sweden', 68.353729, 18.816522, NULL, 'Abisko Scientific Research Station'),
(2, 'asa', 'Asa', 'ASA', 'Active', 'Sweden', 62, 15, NULL, 'Asa Research Station'),
(3, 'grimso', 'Grimsö', 'GRI', 'Active', 'Sweden', 59.72868, 15.47249, NULL, 'Grimsö Wildlife Research Station'),
(4, 'lonnstorp', 'Lönnstorp', 'LON', 'Active', 'Sweden', 55.668731, 13.108632, NULL, 'Lönnstorp Agricultural Research Station'),
(5, 'robacksdalen', 'Röbäcksdalen', 'RBD', 'Active', 'Sweden', 62, 15, NULL, ''),
(6, 'skogaryd', 'Skogaryd', 'SKC', 'Active', 'Sweden', 62, 15, NULL, ''),
(7, 'svartberget', 'Svartberget', 'SVB', 'Active', 'Sweden', 62, 15, NULL, '');

-- Insert platforms
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES
(1, 1, 'ANS_FOR_BL01', 'Abisko Forest Building 01', 'BL01', 'Building RoofTop', 4.5, 'Active', 68.353729, 18.816522, NULL, 'Forest phenocam platform on research station building'),
(2, 2, 'ASA_FOR_PL01', 'Asa Forest Platform 01', 'PL01', 'Tower', 30, 'Active', NULL, NULL, 'Sun Jun 01 2025 02:00:00 GMT+0200 (Central European Summer Time)', 'New tower built June 2025'),
(3, 3, 'GRI_FOR_BL01', 'Grimsö Forest Building 01', 'BL01', 'Building Wall', 4, 'Active', 59.72868, 15.47249, NULL, 'Forest phenocam platform mounted on building wall'),
(4, 4, 'LON_AGR_PL01', 'Lönnstorp Agriculture Platform 01', 'PL01', 'Mast', 10, 'Active', 55.668731, 13.108632, NULL, 'Agricultural phenocam platform on 10m mast'),
(5, 5, 'RBD_AGR_PL01', 'RBD_AGR_PL01', 'PL01', 'Mast', 10, 'Active', 63.806642, 20.229243, NULL, ''),
(6, 5, 'RBD_AGR_PL02', 'RBD_AGR_PL02', 'PL02', 'Mast', 4, 'Active', 63.809992, 20.238822, NULL, ''),
(7, 6, 'SKC_CEM_FOR_PL01', 'SKC_CEM_FOR_PL01', 'PL01', 'Tower', 38, 'Active', 58.363865, 12.149763, NULL, ''),
(8, 6, 'SKC_CEM_FOR_PL02', 'SKC_CEM_FOR_PL02', 'PL02', 'Mast', 3, 'Active', 58.363759, 12.149442, NULL, ''),
(9, 6, 'SKC_CEM_FOR_PL03', 'SKC_CEM_FOR_PL03', 'PL03', 'Mast', 3, 'Active', 58.363596, 12.149933, NULL, ''),
(10, 6, 'SKC_LAK_PL01', 'SKC_LAK_PL01', 'PL01', 'Mast', 38, 'Active', 58.363058, 12.14965, NULL, ''),
(11, 6, 'STM_FOR_PL01', 'STM_FOR_PL01', 'PL01', 'Mast', NULL, 'Active', 58.368601, 12.145319, NULL, ''),
(12, 6, 'SKC_MAD_WET_PL01', 'SKC_MAD_WET_PL01', 'PL01', 'Mast', NULL, 'Active', 58.368601, 12.145319, NULL, ''),
(13, 6, 'SKC_MAD_FOR_PL02', 'SKC_MAD_FOR_PL02', 'PL02', 'Mast', NULL, 'Active', 58.368601, 12.145319, NULL, ''),
(14, 6, 'SKC_SRC_FOL_WET_PL01', 'SKC_SRC_FOL_WET_PL01', 'PL01', 'Mast', NULL, 'Active', 58.375661, 12.154016, NULL, ''),
(15, 6, 'SKC_SRC_FOL_WET_PL02', 'SKC_SRC_FOL_WET_PL02', 'PL02', 'Mast', NULL, 'Active', 58.375854, 12.154016, NULL, ''),
(16, 7, 'SVB_MIR_PL01', 'SVB_MIR_PL01', 'PL01', '', 17.5, 'Active', 64.182536, NULL, NULL, ''),
(17, 7, 'SVB_MIR_PL02', 'SVB_MIR_PL02', 'PL02', 'Mast', 3.3, 'Active', 64.18201, 19.556576, NULL, ''),
(18, 7, 'SVB_MIR_PL03', 'SVB_MIR_PL03', 'PL03', 'Mast', 17.5, 'Active', 64.182536, 19.558045, NULL, ''),
(19, 7, 'SVB_FOR_PL01', 'SVB_FOR_PL01', 'PL01', 'Flagpole and Tower', 70, 'Active', 64.256342, 19.771621, NULL, '');

-- Insert instruments
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_mega_pixels, camera_lens, camera_focal_length_mm, camera_aperture, camera_exposure_time, camera_iso, camera_white_balance, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes, rois) VALUES
(1, 1, 'ANS_FOR_BL01_PHE01', 'Abisko Forest Building 01 Phenocam 01', 'ANS-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 68.353729, 18.816522, 4.5, 'West', 270, NULL, 'Mobotix', 'M16B', '4096x3072', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 2023, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'Mounted on building rooftop facing west', '', NULL),
(2, 2, 'ASA_FOR_PL01_PHE01', 'Asa Forest Platform 01 Phenocam 01', '', 'phenocam', 'FOR', 'PHE01', 'Active', 'Sun Jun 01 2025 02:00:00 GMT+0200 (Central European Summer Time)', NULL, NULL, 30, 'West', 270, NULL, 'Mobotix', 'M16B', '4096x3072', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 2025, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'New installation on tower', '', NULL),
(3, 3, 'GRI_FOR_BL01_PHE01', 'Grimsö Forest Building 01 Phenocam 01', 'GRI-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 59.72868, 15.47249, 3.5, '', NULL, NULL, 'Mobotix', 'M16A', '3072x2048', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 2020, NULL, 'Active', 'Forest ecosystem monitoring phenocam', 'Wall-mounted phenocam', '', NULL),
(4, 4, 'LON_AGR_PL01_PHE01', 'Lönnstorp Agriculture Platform 01 Phenocam 01', 'SFA-AGR-P01', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, 55.668731, 13.108632, 10, 'West-North-West', 293, NULL, 'Mobotix', 'M16B', '4096x3072', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', 2019, NULL, 'Active', 'Agricultural ecosystem monitoring phenocam', 'Mast-mounted phenocam viewing WNW', '', NULL),
(5, 4, 'LON_AGR_PL01_PHE02', 'LON_AGR_PL01_PHE02', 'SFA-AGR-P02', 'phenocam', 'AGR', 'PHE02', 'Active', NULL, 55.669186, 13.11036, 10, 'North', 12, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(6, 4, 'LON_AGR_PL01_PHE03', 'LON_AGR_PL01_PHE03', 'SFA-AGR-P03', 'phenocam', 'AGR', 'PHE03', 'Active', NULL, 55.668549, 13.110535, 10, 'East', 85, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(7, 5, 'RBD_AGR_PL01_PHE01', 'RBD_AGR_PL01_PHE01', 'RBD-AGR-P01', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, 63.806642, 20.229243, 10, 'West', 265, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(8, 6, 'RBD_AGR_PL02_PHE01', 'RBD_AGR_PL02_PHE01', 'RBD-AGR-P02', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, 63.809992, 20.238822, 4, 'West', 305, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(9, 7, 'SKC_CEM_FOR_PL01_PHE01', 'SKC_CEM_FOR_PL01_PHE01', 'CEM01-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.363865, 12.149763, 38, 'South', 185, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(10, 8, 'SKC_CEM_FOR_PL02_PHE01', 'SKC_CEM_FOR_PL02_PHE01', 'CEM02-FOR-P02', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.363759, 12.149442, 3, 'West', 270, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(11, 9, 'SKC_CEM_FOR_PL03_PHE01', 'SKC_CEM_FOR_PL03_PHE01', 'CEM03-FOR-P03', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.363596, 12.149933, 3, 'West', NULL, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(12, 10, 'SKC_LAK_PL01_PHE01', 'SKC_LAK_PL01_PHE01', 'ERS-LAK-P01', 'phenocam', 'LAK', 'PHE01', 'Active', NULL, 58.363058, 12.14965, 38, 'South', 185, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(13, 11, 'STM_FOR_PL01_PHE01', 'STM_FOR_PL01_PHE01', 'STM-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.368601, 12.145319, NULL, '', NULL, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(14, 12, 'SKC_MAD_WET_PL01_PHE01', 'SKC_MAD_WET_PL01_PHE01', 'MAD-WET-P01', 'phenocam', 'WET', 'PHE01', 'Active', NULL, 58.368601, 12.145319, NULL, '', NULL, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(15, 13, 'SKC_MAD_FOR_PL02_PHE01', 'SKC_MAD_FOR_PL02_PHE01', 'MAD-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 58.368601, 12.145319, NULL, '', NULL, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(16, 14, 'SKC_SRC_FOL_WET_PL01_PHE01', 'SKC_SRC_FOL_WET_PL01_PHE01', 'FOL-WET-P01', 'phenocam', 'WET', 'PHE01', 'Active', NULL, 58.375661, 12.154016, NULL, '', NULL, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(17, 15, 'SKC_SRC_FOL_WET_PL02_PHE01', 'SKC_SRC_FOL_WET_PL02_PHE01', 'FOL-WET-P02', 'phenocam', 'WET', 'PHE01', 'Active', NULL, 58.375854, 12.154016, NULL, '', NULL, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(18, 16, 'SVB_MIR_PL01_PHE01', 'SVB_MIR_PL01_PHE01', 'DEG-MIR-P01', 'phenocam', 'MIR', 'PHE01', 'Active', NULL, 64.182536, 19.558045, 17.5, 'North-NorthEast', 317, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(19, 17, 'SVB_MIR_PL02_PHE01', 'SVB_MIR_PL02_PHE01', 'DEG-MIR-P02', 'phenocam', 'MIR', 'PHE01', 'Active', NULL, 64.18201, 19.556576, 3.3, 'North', 343, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(20, 18, 'SVB_MIR_PL03_PHE01', 'SVB_MIR_PL03_PHE01', 'DEG-MIR-P03', 'phenocam', 'MIR', 'PHE01', 'Active', 'Tue Oct 29 2024 01:00:00 GMT+0100 (Central European Standard Time)', 64.182536, 19.558045, 17.5, 'North-NorthEast', 317, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(21, 19, 'SVB_FOR_PL01_PHE01', 'SVB_FOR_PL01_PHE01', 'SVB-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Inactive', NULL, 64.256342, 19.771621, 70, 'North-West', 280, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL),
(22, 19, 'SVB_FOR_PL01_PHE02', 'SVB_FOR_PL01_PHE02', 'SVB-FOR-P02', 'phenocam', 'FOR', 'PHE02', 'Active', 'Tue Oct 29 2024 01:00:00 GMT+0100 (Central European Standard Time)', 64.256342, 19.771621, 70, 'North-West', 280, NULL, '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL);

