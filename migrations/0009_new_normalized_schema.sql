-- Complete New Database Schema: Normalized Names & User-Editable Geolocations
-- Created: 2025-09-17
-- Purpose: Fresh schema from scratch using stations.yaml as single source of truth
-- Focus: Phenocams with camera specifications and measurement timeline tracking

-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS data_quality_flags;
DROP TABLE IF EXISTS instrument_history;
DROP TABLE IF EXISTS instrument_rois;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS platforms;
DROP TABLE IF EXISTS mspectral_sensors;
DROP TABLE IF EXISTS phenocams;
DROP TABLE IF EXISTS instruments;
DROP TABLE IF EXISTS platform_types;
DROP TABLE IF EXISTS instrument_types;
DROP TABLE IF EXISTS ecosystems;
DROP TABLE IF EXISTS stations;

-- ============================================================================
-- 1. CORE REFERENCE TABLES
-- ============================================================================

-- Ecosystems reference table
CREATE TABLE ecosystems (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- ============================================================================
-- 2. MAIN DATA TABLES
-- ============================================================================

-- Stations table - main research stations
CREATE TABLE stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_name TEXT NOT NULL UNIQUE,  -- 'abisko', 'grimso', etc.
    display_name TEXT NOT NULL,            -- 'Abisko', 'Grimsö', etc.
    acronym TEXT NOT NULL UNIQUE,          -- 'ANS', 'GRI', etc.
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance')),
    country TEXT DEFAULT 'Sweden',
    latitude REAL,                         -- Station coordinates (decimal degrees)
    longitude REAL,                        -- Station coordinates (decimal degrees)
    elevation_m REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Platforms table - physical mounting structures
CREATE TABLE platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,  -- 'ANS_FOR_BL01', 'GRI_FOR_BL01'
    display_name TEXT,                     -- 'Abisko Forest Building 01'
    location_code TEXT,                    -- 'BL01', 'PL01', etc.
    mounting_structure TEXT,               -- 'Building RoofTop', 'Tower', 'Mast'
    platform_height_m REAL,               -- Height of platform structure
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance', 'Removed', 'Planned')),
    latitude REAL,                         -- Platform coordinates (user editable, decimal degrees)
    longitude REAL,                        -- Platform coordinates (user editable, decimal degrees)
    deployment_date DATE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

-- Instruments table - phenocams focus with camera specifications
CREATE TABLE instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,  -- 'ANS_FOR_BL01_PHE01'
    display_name TEXT,                     -- 'Abisko Forest Building 01 Phenocam 01'
    legacy_acronym TEXT,                   -- 'ANS-FOR-P01' for backward compatibility

    -- Instrument Classification
    instrument_type TEXT NOT NULL DEFAULT 'phenocam',
    ecosystem_code TEXT,                   -- 'FOR', 'AGR', 'MIR', etc.
    instrument_number TEXT,                -- 'PHE01', 'PHE02', etc.

    -- Camera Specifications (user editable)
    camera_brand TEXT NOT NULL DEFAULT 'Mobotix' CHECK (camera_brand IN ('Mobotix', 'RedDot', 'Canon', 'Nikon')),
    camera_model TEXT,                     -- 'M16B', 'D850', etc.
    camera_resolution TEXT,                -- '4096x3072', '2048x1536'
    camera_serial_number TEXT,

    -- Measurement Timeline (user editable)
    first_measurement_year INTEGER CHECK (first_measurement_year >= 1990 AND first_measurement_year <= 2030),
    last_measurement_year INTEGER CHECK (last_measurement_year >= 1990 AND last_measurement_year <= 2030),
    measurement_status TEXT NOT NULL DEFAULT 'Active' CHECK (measurement_status IN ('Active', 'Completed', 'Interrupted', 'Planned')),

    -- Status and Deployment (user editable)
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance', 'Removed', 'Planned', 'Unknown')),
    deployment_date DATE,
    removal_date DATE,

    -- Physical Position (user editable - inherits from platform but can override)
    latitude REAL,                         -- Inherits from platform, but user can override (decimal degrees)
    longitude REAL,                        -- Inherits from platform, but user can override (decimal degrees)
    instrument_height_m REAL,              -- Height above ground
    viewing_direction TEXT,                -- 'West', 'North-West', etc.
    azimuth_degrees REAL CHECK (azimuth_degrees >= 0 AND azimuth_degrees <= 360),
    degrees_from_nadir REAL CHECK (degrees_from_nadir >= 0 AND degrees_from_nadir <= 90),

    -- Metadata (user editable)
    description TEXT,
    installation_notes TEXT,
    maintenance_notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (ecosystem_code) REFERENCES ecosystems(code)
);

-- Instrument ROIs (Region of Interest) - user editable
CREATE TABLE instrument_rois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,
    roi_name TEXT NOT NULL,                -- 'ROI_00', 'ROI_01', etc.
    roi_points TEXT NOT NULL,              -- JSON array of coordinates
    color_rgb TEXT,                        -- JSON array [255,255,255]
    thickness INTEGER DEFAULT 7,
    alpha REAL DEFAULT 1.0,
    auto_generated BOOLEAN DEFAULT FALSE,
    description TEXT,
    source_image TEXT,
    generated_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
    UNIQUE(instrument_id, roi_name)
);

-- ============================================================================
-- 3. USER AUTHENTICATION AND PERMISSIONS
-- ============================================================================

-- User accounts for authentication system
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'station', 'readonly')),

    -- Station-specific access (NULL for admin users)
    station_id INTEGER, -- Station users can only access this station

    -- Account status
    active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,

    -- Profile information
    full_name TEXT,
    organization TEXT,
    phone TEXT,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,

    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- User field permissions - defines what fields each role can edit
CREATE TABLE user_field_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    table_name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    can_edit BOOLEAN DEFAULT FALSE,
    can_view BOOLEAN DEFAULT TRUE,
    UNIQUE(role, table_name, field_name)
);

-- User sessions for JWT token management
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log for audit trail
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete'
    resource_type TEXT NOT NULL, -- 'instrument', 'platform', 'station', 'user'
    resource_id INTEGER,
    old_values TEXT, -- JSON of old values for updates
    new_values TEXT, -- JSON of new values
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Station indexes
CREATE INDEX idx_stations_normalized_name ON stations(normalized_name);
CREATE INDEX idx_stations_acronym ON stations(acronym);
CREATE INDEX idx_stations_status ON stations(status);

-- Platform indexes
CREATE INDEX idx_platforms_station_id ON platforms(station_id);
CREATE INDEX idx_platforms_normalized_name ON platforms(normalized_name);
CREATE INDEX idx_platforms_status ON platforms(status);

-- Instrument indexes
CREATE INDEX idx_instruments_platform_id ON instruments(platform_id);
CREATE INDEX idx_instruments_normalized_name ON instruments(normalized_name);
CREATE INDEX idx_instruments_legacy_acronym ON instruments(legacy_acronym);
CREATE INDEX idx_instruments_status ON instruments(status);
CREATE INDEX idx_instruments_instrument_type ON instruments(instrument_type);
CREATE INDEX idx_instruments_ecosystem ON instruments(ecosystem_code);
CREATE INDEX idx_instruments_camera_brand ON instruments(camera_brand);
CREATE INDEX idx_instruments_measurement_status ON instruments(measurement_status);

-- ROI indexes
CREATE INDEX idx_rois_instrument_id ON instrument_rois(instrument_id);
CREATE INDEX idx_rois_active ON instrument_rois(active);

-- User indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_station_id ON users(station_id);
CREATE INDEX idx_users_active ON users(active);

-- Session indexes
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Activity log indexes
CREATE INDEX idx_activity_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp);
CREATE INDEX idx_activity_resource ON activity_log(resource_type, resource_id);

-- Permission indexes
CREATE INDEX idx_permissions_role ON user_field_permissions(role);
CREATE INDEX idx_permissions_table ON user_field_permissions(table_name);

-- ============================================================================
-- 5. TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Update timestamps on modification
CREATE TRIGGER update_stations_timestamp
    AFTER UPDATE ON stations
    BEGIN
        UPDATE stations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_platforms_timestamp
    AFTER UPDATE ON platforms
    BEGIN
        UPDATE platforms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_instruments_timestamp
    AFTER UPDATE ON instruments
    BEGIN
        UPDATE instruments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_users_timestamp
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Coordinate inheritance trigger - set instrument coordinates to platform coordinates if null
CREATE TRIGGER inherit_platform_coordinates
    AFTER INSERT ON instruments
    WHEN NEW.latitude IS NULL OR NEW.longitude IS NULL
    BEGIN
        UPDATE instruments
        SET latitude = (SELECT latitude FROM platforms WHERE id = NEW.platform_id),
            longitude = (SELECT longitude FROM platforms WHERE id = NEW.platform_id)
        WHERE id = NEW.id AND (latitude IS NULL OR longitude IS NULL);
    END;

-- Activity logging triggers
CREATE TRIGGER log_platform_updates
    AFTER UPDATE ON platforms
    BEGIN
        INSERT INTO activity_log (action_type, resource_type, resource_id, old_values, new_values)
        VALUES ('update', 'platform', NEW.id,
                json_object('status', OLD.status, 'latitude', OLD.latitude, 'longitude', OLD.longitude),
                json_object('status', NEW.status, 'latitude', NEW.latitude, 'longitude', NEW.longitude));
    END;

CREATE TRIGGER log_instrument_updates
    AFTER UPDATE ON instruments
    BEGIN
        INSERT INTO activity_log (action_type, resource_type, resource_id, old_values, new_values)
        VALUES ('update', 'instrument', NEW.id,
                json_object('status', OLD.status, 'camera_brand', OLD.camera_brand, 'latitude', OLD.latitude),
                json_object('status', NEW.status, 'camera_brand', NEW.camera_brand, 'latitude', NEW.latitude));
    END;

-- Clean up expired sessions
CREATE TRIGGER cleanup_expired_sessions
    AFTER INSERT ON user_sessions
    BEGIN
        DELETE FROM user_sessions WHERE expires_at < datetime('now');
    END;