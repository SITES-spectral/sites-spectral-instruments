-- SITES Spectral v8.2.0 Migration
-- USV and UUV Platform Types and Extension Tables
-- Date: 2025-11-28

-- ============================================================
-- ADD NEW PLATFORM TYPES
-- ============================================================

INSERT OR IGNORE INTO platform_types (code, name, icon, color, description, supports_instruments, requires_location, requires_aoi, sort_order) VALUES
('usv', 'USV Platform', 'fa-ship', '#0891b2',
 'Unmanned Surface Vehicles - autonomous boats and surface drones for water surveys',
 '["phenocam", "multispectral", "hyperspectral", "sonar", "water_quality", "weather"]',
 0, 1, 5),

('uuv', 'UUV Platform', 'fa-water', '#1e40af',
 'Unmanned Underwater Vehicles - ROVs and AUVs for underwater surveys and monitoring',
 '["camera", "sonar", "multibeam", "water_quality", "fluorometer"]',
 0, 1, 6);

-- ============================================================
-- USV PLATFORMS EXTENSION TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS usv_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL UNIQUE,

    -- USV Identification
    usv_model TEXT,                         -- Model name
    manufacturer TEXT,                      -- Manufacturer
    serial_number TEXT,
    registration_number TEXT,               -- Maritime registration
    hull_type TEXT,                         -- 'monohull', 'catamaran', 'trimaran', 'other'

    -- Physical Specifications
    length_m REAL,                          -- Length overall
    beam_m REAL,                            -- Width/beam
    draft_m REAL,                           -- Draft (depth below waterline)
    displacement_kg REAL,                   -- Weight/displacement
    max_payload_kg REAL,                    -- Payload capacity

    -- Propulsion
    propulsion_type TEXT,                   -- 'electric', 'fuel', 'hybrid', 'solar'
    motor_power_w REAL,                     -- Motor power in watts
    battery_capacity_wh REAL,               -- Battery capacity
    fuel_capacity_l REAL,                   -- Fuel tank capacity

    -- Performance
    max_speed_knots REAL,                   -- Maximum speed
    cruise_speed_knots REAL,                -- Cruise speed
    endurance_hours REAL,                   -- Operating endurance
    range_nm REAL,                          -- Range in nautical miles
    max_wave_height_m REAL,                 -- Max operating wave height
    max_wind_speed_ms REAL,                 -- Max operating wind speed

    -- Navigation & Control
    navigation_system TEXT,                 -- 'GPS', 'GPS+GLONASS', etc.
    autopilot_system TEXT,                  -- Autopilot model
    control_mode TEXT,                      -- 'autonomous', 'remote', 'hybrid'
    communication_system TEXT,              -- Radio/satellite link
    rtk_capable INTEGER DEFAULT 0,

    -- Sensors
    primary_sensor TEXT,
    sensors_json TEXT,                      -- JSON array of all sensors
    sonar_system TEXT,                      -- Sonar/echo sounder
    water_quality_sensors TEXT,             -- Water quality sensor suite

    -- Safety
    collision_avoidance INTEGER DEFAULT 0,  -- Has collision avoidance
    ais_equipped INTEGER DEFAULT 0,         -- Has AIS transponder
    emergency_recovery TEXT,                -- Recovery method

    -- Maintenance
    total_hours REAL,
    total_distance_nm REAL,
    last_maintenance_date TEXT,
    firmware_version TEXT,

    -- Metadata
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- ============================================================
-- UUV PLATFORMS EXTENSION TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS uuv_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL UNIQUE,

    -- UUV Identification
    uuv_model TEXT,                         -- Model name
    manufacturer TEXT,                      -- Manufacturer
    serial_number TEXT,
    uuv_type TEXT,                          -- 'rov' (tethered), 'auv' (autonomous), 'hybrid'

    -- Physical Specifications
    length_m REAL,                          -- Length
    width_m REAL,                           -- Width
    height_m REAL,                          -- Height
    weight_air_kg REAL,                     -- Weight in air
    weight_water_kg REAL,                   -- Weight in water (buoyancy)
    max_payload_kg REAL,

    -- Depth Rating
    max_depth_m REAL,                       -- Maximum operating depth
    crush_depth_m REAL,                     -- Structural limit
    typical_depth_m REAL,                   -- Typical operating depth

    -- Propulsion
    propulsion_type TEXT,                   -- 'thruster', 'propeller', 'glider'
    num_thrusters INTEGER,                  -- Number of thrusters
    motor_power_w REAL,
    battery_capacity_wh REAL,

    -- Performance
    max_speed_knots REAL,
    cruise_speed_knots REAL,
    endurance_hours REAL,
    range_km REAL,

    -- Navigation & Control
    navigation_system TEXT,                 -- 'DVL', 'USBL', 'INS', etc.
    positioning_method TEXT,                -- 'acoustic', 'inertial', 'hybrid'
    control_mode TEXT,                      -- 'tethered', 'autonomous', 'hybrid'
    tether_length_m REAL,                   -- For ROVs - tether length

    -- Communication
    tether_communication TEXT,              -- For ROVs - fiber/copper
    acoustic_modem TEXT,                    -- Acoustic communication
    surface_communication TEXT,             -- When surfaced

    -- Sensors
    primary_camera TEXT,                    -- Main camera
    cameras_json TEXT,                      -- JSON array of cameras
    sonar_system TEXT,                      -- Sonar type
    multibeam_sonar TEXT,                   -- Multibeam if equipped
    scanning_sonar TEXT,                    -- Scanning sonar if equipped
    sensors_json TEXT,                      -- All other sensors

    -- Lighting
    lighting_system TEXT,                   -- Lighting description
    total_lumens INTEGER,                   -- Total light output

    -- Manipulator (for ROVs)
    manipulator_type TEXT,                  -- 'grabber', 'arm', 'none'
    manipulator_reach_m REAL,
    manipulator_payload_kg REAL,

    -- Maintenance
    total_hours REAL,
    total_dives INTEGER,
    last_maintenance_date TEXT,
    firmware_version TEXT,

    -- Metadata
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usv_platform ON usv_platforms(platform_id);
CREATE INDEX IF NOT EXISTS idx_uuv_platform ON uuv_platforms(platform_id);

-- ============================================================
-- NAMING CONVENTIONS
-- ============================================================
--
-- USV: {STATION}_{ECO}_USV##
--   Examples:
--     ANS_LAK_USV01  - Abisko Lake USV 01
--     SVB_WET_USV01  - Svartberget Wetland USV 01
--
-- UUV: {STATION}_{ECO}_UUV##
--   Examples:
--     ANS_LAK_UUV01  - Abisko Lake UUV 01
--     GRI_LAK_UUV01  - Grimsö Lake UUV 01

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Version: 8.2.0
-- Date: 2025-11-28
