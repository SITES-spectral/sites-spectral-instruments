-- Migration: Rebuild database with real YAML data
-- Generated: 2025-09-19T04:12:01.222Z
-- Source: stations.yaml, ecosystems.yaml, status.yaml

-- Create tables first
CREATE TABLE IF NOT EXISTS ecosystems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    acronym TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    country TEXT DEFAULT 'Sweden',
    latitude REAL,
    longitude REAL,
    elevation_m REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    normalized_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    location_code TEXT NOT NULL,
    mounting_structure TEXT,
    platform_height_m REAL,
    status TEXT NOT NULL DEFAULT 'Active',
    latitude REAL,
    longitude REAL,
    deployment_date DATE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL,
    normalized_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    legacy_acronym TEXT,
    instrument_type TEXT NOT NULL DEFAULT 'phenocam',
    ecosystem_code TEXT,
    instrument_number TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    deployment_date DATE,
    latitude REAL,
    longitude REAL,
    instrument_height_m REAL,
    viewing_direction TEXT,
    azimuth_degrees REAL,
    degrees_from_nadir REAL,
    camera_brand TEXT,
    camera_model TEXT,
    camera_resolution TEXT,
    camera_serial_number TEXT,
    first_measurement_year INTEGER,
    last_measurement_year INTEGER,
    measurement_status TEXT,
    description TEXT,
    installation_notes TEXT,
    maintenance_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'readonly',
    full_name TEXT,
    organization TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    station_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations (id)
);

CREATE TABLE IF NOT EXISTS user_field_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_role TEXT NOT NULL,
    permission_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    station_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations (id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

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
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (1, 'abisko', 'Abisko', 'ANS', 'Active', 'Sweden', 68.353729, 18.816522, NULL, 'Abisko Scientific Research Station');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (1, 1, 'ANS_FOR_BL01', 'Abisko Forest Building 01', 'BL01', 'Building RoofTop', 4.5, 'Active', 68.353729, 18.816522, NULL, 'Forest phenocam platform on research station building');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (1, 1, 'ANS_FOR_BL01_PHE01', 'Abisko Forest Building 01 Phenocam 01', 'ANS-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 68.353729, 18.816522, 4.5, 'West', 270, 90, 'Mobotix', 'M16B', '4096x3072', '', 2023, NULL, '', 'Forest ecosystem monitoring phenocam');

-- Station: Asa
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (2, 'asa', 'Asa', 'ASA', 'Active', 'Sweden', NULL, NULL, NULL, 'Asa Research Station');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (2, 2, 'ASA_FOR_PL01', 'Asa Forest Platform 01', 'PL01', 'Tower', 30, 'Active', NULL, NULL, 'Sun Jun 01 2025 02:00:00 GMT+0200 (Central European Summer Time)', 'New tower built June 2025');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (2, 2, 'ASA_FOR_PL01_PHE01', 'Asa Forest Platform 01 Phenocam 01', '', 'phenocam', 'FOR', 'PHE01', 'Active', 'Sun Jun 01 2025 02:00:00 GMT+0200 (Central European Summer Time)', NULL, NULL, 30, 'West', 270, 90, 'Mobotix', 'M16B', '4096x3072', '', 2025, NULL, '', 'Forest ecosystem monitoring phenocam');

-- Station: Grimsö
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (3, 'grimso', 'Grimsö', 'GRI', 'Active', 'Sweden', 59.72868, 15.47249, NULL, 'Grimsö Wildlife Research Station');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (3, 3, 'GRI_FOR_BL01', 'Grimsö Forest Building 01', 'BL01', 'Building Wall', 4, 'Active', 59.72868, 15.47249, NULL, 'Forest phenocam platform mounted on building wall');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (3, 3, 'GRI_FOR_BL01_PHE01', 'Grimsö Forest Building 01 Phenocam 01', 'GRI-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, 59.72868, 15.47249, 3.5, '', NULL, 90, 'Mobotix', 'M16A', '3072x2048', '', 2020, NULL, '', 'Forest ecosystem monitoring phenocam');

-- Station: Lönnstorp
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (4, 'lonnstorp', 'Lönnstorp', 'LON', 'Active', 'Sweden', 55.668731, 13.108632, NULL, 'Lönnstorp Agricultural Research Station');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (4, 4, 'LON_AGR_PL01', 'Lönnstorp Agriculture Platform 01', 'PL01', 'Mast', 10, 'Active', 55.668731, 13.108632, NULL, 'Agricultural phenocam platform on 10m mast');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (4, 4, 'LON_AGR_PL01_PHE01', 'Lönnstorp Agriculture Platform 01 Phenocam 01', 'SFA-AGR-P01', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, 55.668731, 13.108632, 10, 'West-North-West', 293, 58, 'Mobotix', 'M16B', '4096x3072', '', 2019, NULL, '', 'Agricultural ecosystem monitoring phenocam');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (5, 4, 'LON_AGR_PL01_PHE02', 'LON_AGR_PL01_PHE02', 'SFA-AGR-P02', 'phenocam', 'AGR', 'PHE02', 'Active', NULL, 55.668731, 13.108632, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (6, 4, 'LON_AGR_PL01_PHE03', 'LON_AGR_PL01_PHE03', 'SFA-AGR-P03', 'phenocam', 'AGR', 'PHE03', 'Active', NULL, 55.668731, 13.108632, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');

-- Station: robacksdalen
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (5, 'robacksdalen', 'robacksdalen', 'RBD', 'Active', 'Sweden', NULL, NULL, NULL, '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (5, 5, 'RBD_AGR_PL01', 'RBD_AGR_PL01', 'PL01', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (7, 5, 'RBD_AGR_PL01_PHE01', 'RBD_AGR_PL01_PHE01', 'RBD-AGR-P01', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (6, 5, 'RBD_AGR_PL02', 'RBD_AGR_PL02', 'PL02', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (8, 6, 'RBD_AGR_PL02_PHE01', 'RBD_AGR_PL02_PHE01', 'RBD-AGR-P02', 'phenocam', 'AGR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');

-- Station: skogaryd
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (6, 'skogaryd', 'skogaryd', 'SKC', 'Active', 'Sweden', NULL, NULL, NULL, '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (7, 6, 'SKC_CEM_FOR_PL01', 'SKC_CEM_FOR_PL01', 'PL01', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (9, 7, 'SKC_CEM_FOR_PL01_PHE01', 'SKC_CEM_FOR_PL01_PHE01', 'CEM01-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (8, 6, 'SKC_CEM_FOR_PL02', 'SKC_CEM_FOR_PL02', 'PL02', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (10, 8, 'SKC_CEM_FOR_PL02_PHE01', 'SKC_CEM_FOR_PL02_PHE01', 'CEM02-FOR-P02', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (9, 6, 'SKC_CEM_FOR_PL03', 'SKC_CEM_FOR_PL03', 'PL03', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (11, 9, 'SKC_CEM_FOR_PL03_PHE01', 'SKC_CEM_FOR_PL03_PHE01', 'CEM03-FOR-P03', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (10, 6, 'SKC_LAK_PL01', 'SKC_LAK_PL01', 'PL01', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (12, 10, 'SKC_LAK_PL01_PHE01', 'SKC_LAK_PL01_PHE01', 'ERS-LAK-P01', 'phenocam', 'LAK', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (11, 6, 'STM_FOR_PL01', 'STM_FOR_PL01', 'PL01', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (13, 11, 'STM_FOR_PL01_PHE01', 'STM_FOR_PL01_PHE01', 'STM-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (12, 6, 'SKC_MAD_WET_PL01', 'SKC_MAD_WET_PL01', 'PL01', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (14, 12, 'SKC_MAD_WET_PL01_PHE01', 'SKC_MAD_WET_PL01_PHE01', 'MAD-WET-P01', 'phenocam', 'WET', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (13, 6, 'SKC_MAD_FOR_PL02', 'SKC_MAD_FOR_PL02', 'PL02', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (15, 13, 'SKC_MAD_FOR_PL02_PHE01', 'SKC_MAD_FOR_PL02_PHE01', 'MAD-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (14, 6, 'SKC_SRC_FOL_WET_PL01', 'SKC_SRC_FOL_WET_PL01', 'PL01', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (16, 14, 'SKC_SRC_FOL_WET_PL01_PHE01', 'SKC_SRC_FOL_WET_PL01_PHE01', 'FOL-WET-P01', 'phenocam', 'WET', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (15, 6, 'SKC_SRC_FOL_WET_PL02', 'SKC_SRC_FOL_WET_PL02', 'PL02', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (17, 15, 'SKC_SRC_FOL_WET_PL02_PHE01', 'SKC_SRC_FOL_WET_PL02_PHE01', 'FOL-WET-P02', 'phenocam', 'WET', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');

-- Station: svartberget
INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (7, 'svartberget', 'svartberget', 'SVB', 'Active', 'Sweden', NULL, NULL, NULL, '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (16, 7, 'SVB_MIR_PL01', 'SVB_MIR_PL01', 'PL01', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (18, 16, 'SVB_MIR_PL01_PHE01', 'SVB_MIR_PL01_PHE01', 'DEG-MIR-P01', 'phenocam', 'MIR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (17, 7, 'SVB_MIR_PL02', 'SVB_MIR_PL02', 'PL02', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (19, 17, 'SVB_MIR_PL02_PHE01', 'SVB_MIR_PL02_PHE01', 'DEG-MIR-P02', 'phenocam', 'MIR', 'PHE01', 'Active', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (18, 7, 'SVB_MIR_PL03', 'SVB_MIR_PL03', 'PL03', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (20, 18, 'SVB_MIR_PL03_PHE01', 'SVB_MIR_PL03_PHE01', 'DEG-MIR-P03', 'phenocam', 'MIR', 'PHE01', 'Active', 'Tue Oct 29 2024 01:00:00 GMT+0100 (Central European Standard Time)', NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (19, 7, 'SVB_FOR_PL01', 'SVB_FOR_PL01', 'PL01', '', NULL, 'Active', NULL, NULL, NULL, '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (21, 19, 'SVB_FOR_PL01_PHE01', 'SVB_FOR_PL01_PHE01', 'SVB-FOR-P01', 'phenocam', 'FOR', 'PHE01', 'Inactive', NULL, NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');
INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (22, 19, 'SVB_FOR_PL01_PHE02', 'SVB_FOR_PL01_PHE02', 'SVB-FOR-P02', 'phenocam', 'FOR', 'PHE02', 'Active', 'Tue Oct 29 2024 01:00:00 GMT+0100 (Central European Standard Time)', NULL, NULL, NULL, '', NULL, NULL, '', '', '', '', NULL, NULL, '', '');

-- Default admin user
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
