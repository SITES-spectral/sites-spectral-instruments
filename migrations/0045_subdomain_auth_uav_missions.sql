-- Migration: 0045_subdomain_auth_uav_missions.sql
-- SITES Spectral v15.0.0 - Subdomain Architecture with Cloudflare Access
--
-- This migration adds support for:
-- 1. Cloudflare Access authentication (passwordless via email OTP)
-- 2. Magic link tokens for station internal users
-- 3. UAV pilot registration and mission tracking
-- 4. Flight logs and battery tracking
--
-- Architecture Credit: This subdomain-based architecture design is based on
-- architectural knowledge shared by Flights for Biodiversity Sweden AB
-- (https://github.com/flightsforbiodiversity)

-- ============================================================================
-- SECTION 1: User Authentication Extensions
-- ============================================================================

-- Add authentication provider columns to users table
-- Supports: 'database' (legacy), 'cloudflare_access', 'magic_link'
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'database' CHECK (auth_provider IN ('database', 'cloudflare_access', 'magic_link'));
ALTER TABLE users ADD COLUMN cf_access_email TEXT;
ALTER TABLE users ADD COLUMN cf_access_identity_id TEXT;
ALTER TABLE users ADD COLUMN last_cf_access_login DATETIME;

-- Create index for CF Access email lookup
CREATE INDEX IF NOT EXISTS idx_users_cf_access_email ON users(cf_access_email);

-- ============================================================================
-- SECTION 2: Magic Link Tokens
-- ============================================================================

-- Magic link tokens for station internal users (read-only access)
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Token identification
    token TEXT NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,

    -- Association
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Token properties
    label TEXT,                              -- Optional friendly name for the link
    description TEXT,                        -- Purpose of the link

    -- Access control
    role TEXT DEFAULT 'readonly' CHECK (role IN ('readonly', 'station-internal')),
    permissions TEXT DEFAULT '["read"]',     -- JSON array of permissions

    -- Lifecycle
    expires_at DATETIME NOT NULL,
    single_use BOOLEAN DEFAULT false,
    used_at DATETIME,
    used_by_ip TEXT,
    used_by_user_agent TEXT,

    -- Status
    revoked_at DATETIME,
    revoked_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    revoke_reason TEXT,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for magic link tokens
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token_hash ON magic_link_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_station_id ON magic_link_tokens(station_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_created_by ON magic_link_tokens(created_by_user_id);

-- ============================================================================
-- SECTION 3: UAV Pilots Registry
-- ============================================================================

-- UAV pilots with certification and station assignments
CREATE TABLE IF NOT EXISTS uav_pilots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Identity (linked to users table if they have account)
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Pilot information
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    organization TEXT,

    -- Certification (Swedish Transport Agency requirements)
    pilot_certificate_number TEXT,
    certificate_type TEXT CHECK (certificate_type IN ('A1/A3', 'A2', 'STS-01', 'STS-02', 'national')),
    certificate_issued_date DATE,
    certificate_expiry_date DATE,

    -- Insurance
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry_date DATE,

    -- Competency
    flight_hours_total REAL DEFAULT 0,
    flight_hours_sites_spectral REAL DEFAULT 0,
    last_flight_date DATE,

    -- Station access (JSON array of station IDs they can fly at)
    authorized_stations TEXT DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),

    -- Metadata
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for UAV pilots
CREATE INDEX IF NOT EXISTS idx_uav_pilots_email ON uav_pilots(email);
CREATE INDEX IF NOT EXISTS idx_uav_pilots_user_id ON uav_pilots(user_id);
CREATE INDEX IF NOT EXISTS idx_uav_pilots_status ON uav_pilots(status);
CREATE INDEX IF NOT EXISTS idx_uav_pilots_certificate_expiry ON uav_pilots(certificate_expiry_date);

-- ============================================================================
-- SECTION 4: UAV Missions
-- ============================================================================

-- UAV missions (planned and executed data collection flights)
CREATE TABLE IF NOT EXISTS uav_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Mission identification
    mission_code TEXT NOT NULL UNIQUE,       -- e.g., SVB_2026-01-24_001
    display_name TEXT,

    -- Location
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,

    -- Planning
    planned_date DATE NOT NULL,
    planned_start_time TIME,
    planned_end_time TIME,
    planned_area_hectares REAL,
    planned_altitude_m REAL,
    planned_flight_pattern TEXT CHECK (planned_flight_pattern IN ('grid', 'crosshatch', 'perimeter', 'point_of_interest', 'custom')),
    planned_overlap_side REAL,               -- Side overlap percentage
    planned_overlap_front REAL,              -- Front overlap percentage

    -- Mission objectives (JSON array)
    objectives TEXT DEFAULT '[]',
    target_products TEXT DEFAULT '[]',       -- Expected data products

    -- Execution
    status TEXT DEFAULT 'planned' CHECK (status IN ('draft', 'planned', 'approved', 'in_progress', 'completed', 'aborted', 'cancelled')),
    actual_start_time DATETIME,
    actual_end_time DATETIME,

    -- Weather conditions at execution
    weather_conditions TEXT,                 -- JSON: temp, wind_speed, wind_direction, cloud_cover, precipitation
    weather_source TEXT,                     -- Where weather data came from

    -- Area definition (GeoJSON polygon)
    flight_area_geojson TEXT,

    -- Approvals
    approved_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at DATETIME,
    approval_notes TEXT,

    -- Results
    data_collected_gb REAL,
    images_captured INTEGER,
    coverage_achieved_percent REAL,
    quality_score REAL CHECK (quality_score BETWEEN 0 AND 100),

    -- Metadata
    notes TEXT,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for UAV missions
CREATE INDEX IF NOT EXISTS idx_uav_missions_mission_code ON uav_missions(mission_code);
CREATE INDEX IF NOT EXISTS idx_uav_missions_station_id ON uav_missions(station_id);
CREATE INDEX IF NOT EXISTS idx_uav_missions_platform_id ON uav_missions(platform_id);
CREATE INDEX IF NOT EXISTS idx_uav_missions_status ON uav_missions(status);
CREATE INDEX IF NOT EXISTS idx_uav_missions_planned_date ON uav_missions(planned_date);

-- ============================================================================
-- SECTION 5: Mission Pilots (Junction Table)
-- ============================================================================

-- Links pilots to missions (supports multiple pilots per mission)
CREATE TABLE IF NOT EXISTS mission_pilots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER NOT NULL REFERENCES uav_missions(id) ON DELETE CASCADE,
    pilot_id INTEGER NOT NULL REFERENCES uav_pilots(id) ON DELETE CASCADE,

    -- Role in mission
    role TEXT DEFAULT 'pilot' CHECK (role IN ('pilot_in_command', 'pilot', 'observer', 'ground_crew')),

    -- Metadata
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Ensure unique pilot per mission
    UNIQUE(mission_id, pilot_id)
);

-- Indexes for mission pilots
CREATE INDEX IF NOT EXISTS idx_mission_pilots_mission_id ON mission_pilots(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_pilots_pilot_id ON mission_pilots(pilot_id);

-- ============================================================================
-- SECTION 6: UAV Flight Logs
-- ============================================================================

-- Individual flight logs within a mission (each battery swap = new flight)
CREATE TABLE IF NOT EXISTS uav_flight_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Association
    mission_id INTEGER NOT NULL REFERENCES uav_missions(id) ON DELETE CASCADE,
    pilot_id INTEGER NOT NULL REFERENCES uav_pilots(id) ON DELETE CASCADE,
    platform_id INTEGER NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,

    -- Flight identification
    flight_number INTEGER NOT NULL,          -- Sequential within mission

    -- Timing
    takeoff_time DATETIME NOT NULL,
    landing_time DATETIME NOT NULL,
    flight_duration_seconds INTEGER,

    -- Position (takeoff location)
    takeoff_latitude REAL,
    takeoff_longitude REAL,
    takeoff_altitude_m REAL,

    -- Flight parameters
    max_altitude_agl_m REAL,                 -- Above ground level
    max_distance_m REAL,
    total_distance_m REAL,
    average_speed_ms REAL,

    -- Battery used
    battery_id INTEGER REFERENCES uav_batteries(id) ON DELETE SET NULL,
    battery_start_percent REAL,
    battery_end_percent REAL,

    -- Data collected
    images_captured INTEGER DEFAULT 0,
    data_size_mb REAL DEFAULT 0,

    -- Telemetry log file reference
    telemetry_file_path TEXT,
    telemetry_file_hash TEXT,

    -- Incidents
    had_incident BOOLEAN DEFAULT false,
    incident_description TEXT,
    incident_severity TEXT CHECK (incident_severity IN (NULL, 'minor', 'moderate', 'major', 'critical')),

    -- Notes
    notes TEXT,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Computed duration check
    CHECK (landing_time > takeoff_time)
);

-- Indexes for flight logs
CREATE INDEX IF NOT EXISTS idx_uav_flight_logs_mission_id ON uav_flight_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_uav_flight_logs_pilot_id ON uav_flight_logs(pilot_id);
CREATE INDEX IF NOT EXISTS idx_uav_flight_logs_platform_id ON uav_flight_logs(platform_id);
CREATE INDEX IF NOT EXISTS idx_uav_flight_logs_takeoff_time ON uav_flight_logs(takeoff_time);

-- ============================================================================
-- SECTION 7: UAV Batteries
-- ============================================================================

-- Battery inventory and cycle tracking
CREATE TABLE IF NOT EXISTS uav_batteries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Identification
    serial_number TEXT NOT NULL UNIQUE,
    display_name TEXT,

    -- Specifications
    manufacturer TEXT,
    model TEXT,
    capacity_mah INTEGER,
    cell_count INTEGER,                      -- e.g., 4S, 6S
    chemistry TEXT CHECK (chemistry IN ('LiPo', 'LiHV', 'LiIon', 'other')),

    -- Assignment
    station_id INTEGER REFERENCES stations(id) ON DELETE SET NULL,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,

    -- Lifecycle
    purchase_date DATE,
    first_use_date DATE,
    last_use_date DATE,
    cycle_count INTEGER DEFAULT 0,

    -- Health
    health_percent REAL DEFAULT 100,
    internal_resistance_mohm REAL,
    last_health_check_date DATE,

    -- Status
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'charging', 'storage', 'maintenance', 'retired', 'damaged')),
    storage_voltage_v REAL,

    -- Notes
    notes TEXT,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for batteries
CREATE INDEX IF NOT EXISTS idx_uav_batteries_serial_number ON uav_batteries(serial_number);
CREATE INDEX IF NOT EXISTS idx_uav_batteries_station_id ON uav_batteries(station_id);
CREATE INDEX IF NOT EXISTS idx_uav_batteries_platform_id ON uav_batteries(platform_id);
CREATE INDEX IF NOT EXISTS idx_uav_batteries_status ON uav_batteries(status);

-- ============================================================================
-- SECTION 8: Update Triggers
-- ============================================================================

-- Trigger to update updated_at timestamp for magic_link_tokens
CREATE TRIGGER IF NOT EXISTS trg_magic_link_tokens_updated_at
AFTER UPDATE ON magic_link_tokens
BEGIN
    UPDATE magic_link_tokens SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp for uav_pilots
CREATE TRIGGER IF NOT EXISTS trg_uav_pilots_updated_at
AFTER UPDATE ON uav_pilots
BEGIN
    UPDATE uav_pilots SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp for uav_missions
CREATE TRIGGER IF NOT EXISTS trg_uav_missions_updated_at
AFTER UPDATE ON uav_missions
BEGIN
    UPDATE uav_missions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp for uav_flight_logs
CREATE TRIGGER IF NOT EXISTS trg_uav_flight_logs_updated_at
AFTER UPDATE ON uav_flight_logs
BEGIN
    UPDATE uav_flight_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp for uav_batteries
CREATE TRIGGER IF NOT EXISTS trg_uav_batteries_updated_at
AFTER UPDATE ON uav_batteries
BEGIN
    UPDATE uav_batteries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to calculate flight duration on insert
CREATE TRIGGER IF NOT EXISTS trg_uav_flight_logs_duration
AFTER INSERT ON uav_flight_logs
BEGIN
    UPDATE uav_flight_logs
    SET flight_duration_seconds = CAST((julianday(landing_time) - julianday(takeoff_time)) * 86400 AS INTEGER)
    WHERE id = NEW.id;
END;

-- Trigger to increment battery cycle count when flight completed
CREATE TRIGGER IF NOT EXISTS trg_uav_flight_logs_battery_cycle
AFTER INSERT ON uav_flight_logs
WHEN NEW.battery_id IS NOT NULL
BEGIN
    UPDATE uav_batteries
    SET cycle_count = cycle_count + 1,
        last_use_date = DATE(NEW.landing_time)
    WHERE id = NEW.battery_id;
END;

-- Trigger to update pilot flight hours
CREATE TRIGGER IF NOT EXISTS trg_uav_flight_logs_pilot_hours
AFTER INSERT ON uav_flight_logs
BEGIN
    UPDATE uav_pilots
    SET flight_hours_sites_spectral = flight_hours_sites_spectral + (NEW.flight_duration_seconds / 3600.0),
        last_flight_date = DATE(NEW.landing_time)
    WHERE id = NEW.pilot_id;
END;
