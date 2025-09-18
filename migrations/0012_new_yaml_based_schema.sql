-- Create new simplified schema based on stations.yaml structure
-- Version 3.2.0 - Dashboard rebuild from stations.yaml

-- Users table for authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'station', 'readonly')),
    full_name TEXT,
    organization TEXT,
    station_id TEXT, -- For station users, links to stations.normalized_name
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stations table - matches stations.yaml structure
CREATE TABLE stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_name TEXT NOT NULL UNIQUE, -- abisko, asa, etc.
    display_name TEXT NOT NULL,          -- Abisko, Asa, etc.
    acronym TEXT NOT NULL UNIQUE,        -- ANS, ASA, etc.
    status TEXT NOT NULL DEFAULT 'Active',
    country TEXT DEFAULT 'Sweden',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    elevation_m REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Platforms table - matches platforms structure in stations.yaml
CREATE TABLE platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,   -- ANS_FOR_BL01, LON_AGR_PL01, etc.
    display_name TEXT NOT NULL,             -- Abisko Forest Building 01
    location_code TEXT NOT NULL,            -- BL01, PL01, etc.
    mounting_structure TEXT,                -- Building RoofTop, Mast, Tower, etc.
    platform_height_m REAL,
    status TEXT NOT NULL DEFAULT 'Active',
    latitude REAL,
    longitude REAL,
    deployment_date DATE,
    description TEXT,
    operation_programs TEXT,                -- JSON array of programs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

-- Instruments table - matches instruments structure in stations.yaml
CREATE TABLE instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,   -- ANS_FOR_BL01_PHE01, etc.
    display_name TEXT NOT NULL,             -- Abisko Forest Building 01 Phenocam 01
    legacy_acronym TEXT,                    -- ANS-FOR-P01, etc.
    instrument_type TEXT NOT NULL DEFAULT 'phenocam',
    ecosystem_code TEXT NOT NULL,           -- FOR, AGR, MIR, LAK, WET, etc.
    instrument_number TEXT NOT NULL,        -- PHE01, PHE02, etc.
    status TEXT NOT NULL DEFAULT 'Active',
    deployment_date DATE,
    latitude REAL,
    longitude REAL,
    instrument_height_m REAL,
    viewing_direction TEXT,
    azimuth_degrees REAL,
    degrees_from_nadir REAL,

    -- Camera specifications (JSON stored as TEXT)
    camera_brand TEXT,
    camera_model TEXT,
    camera_resolution TEXT,
    camera_mega_pixels REAL,
    camera_lens TEXT,
    camera_focal_length_mm REAL,
    camera_aperture TEXT,
    camera_exposure_time TEXT,
    camera_iso INTEGER,
    camera_white_balance TEXT,
    camera_serial_number TEXT,

    -- Measurement timeline
    first_measurement_year INTEGER,
    last_measurement_year INTEGER,
    measurement_status TEXT DEFAULT 'Active',

    -- Notes and descriptions
    description TEXT,
    installation_notes TEXT,
    maintenance_notes TEXT,

    -- ROI data as JSON
    rois TEXT, -- JSON containing all ROI definitions

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Ecosystems reference table
CREATE TABLE ecosystems (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    acronym TEXT NOT NULL
);

-- User sessions for authentication
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log for audit trail
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_platforms_station_id ON platforms(station_id);
CREATE INDEX idx_instruments_platform_id ON instruments(platform_id);
CREATE INDEX idx_instruments_ecosystem ON instruments(ecosystem_code);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp);

-- Insert ecosystem reference data
INSERT INTO ecosystems (code, description, acronym) VALUES
('FOR', 'Forest', 'FOR'),
('AGR', 'Arable Land', 'AGR'),
('MIR', 'Mires', 'MIR'),
('LAK', 'Lake', 'LAK'),
('WET', 'Wetland', 'WET'),
('GRA', 'Grassland', 'GRA'),
('HEA', 'Heathland', 'HEA'),
('ALP', 'Alpine Forest', 'ALP'),
('CON', 'Coniferous Forest', 'CON'),
('DEC', 'Deciduous Forest', 'DEC'),
('MAR', 'Marshland', 'MAR'),
('PEA', 'Peatland', 'PEA'),
('CEM', 'Cemetery', 'CEM');

-- Create default admin user
INSERT INTO users (username, email, password_hash, role, full_name, organization, active) VALUES
('admin', 'admin@sites.se', '72b302bf297a228a75730123efef7c41', 'admin', 'System Administrator', 'SITES Spectral', 1);