-- SITES Spectral v8.2.0 Migration
-- Mobile Platforms Extension Table
-- Date: 2025-11-28

-- ============================================================
-- MOBILE PLATFORMS EXTENSION TABLE
-- ============================================================
-- Additional fields specific to mobile platforms including:
-- vehicles, boats, rovers, backpack, bicycle carriers

CREATE TABLE IF NOT EXISTS mobile_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL UNIQUE,

    -- Carrier Classification
    carrier_type TEXT NOT NULL,             -- 'vehicle', 'boat', 'rover', 'backpack', 'bicycle', 'other'
    carrier_subtype TEXT,                   -- 'truck', 'car', 'atv', 'kayak', 'motorboat', etc.
    carrier_model TEXT,                     -- Model/description of carrier
    carrier_id TEXT,                        -- ID or registration number

    -- Operator Information (for human carriers)
    requires_operator INTEGER DEFAULT 1,    -- 1 = requires human operator
    operator_requirements TEXT,             -- JSON: required certifications, training
    min_operators INTEGER DEFAULT 1,        -- Minimum operators needed

    -- Mobility Characteristics
    typical_speed_kmh REAL,                 -- Typical survey speed
    max_speed_kmh REAL,                     -- Maximum speed
    range_km REAL,                          -- Range per survey/charge
    terrain_capability TEXT,                -- JSON array: ['road', 'trail', 'offroad', 'water', 'snow']
    weather_limitations TEXT,               -- JSON: weather restrictions

    -- Power System
    power_type TEXT,                        -- 'battery', 'fuel', 'human', 'solar', 'hybrid'
    battery_capacity_wh REAL,               -- For electric/battery powered
    runtime_hours REAL,                     -- Typical runtime
    charging_method TEXT,                   -- 'mains', 'solar', 'vehicle', 'n/a'

    -- Physical Specifications
    total_weight_kg REAL,                   -- Total weight including equipment
    payload_capacity_kg REAL,               -- Max additional payload
    dimensions_json TEXT,                   -- JSON: {length_m, width_m, height_m}

    -- Mounted Equipment
    primary_sensor TEXT,                    -- Main sensor type
    sensors_json TEXT,                      -- JSON array of all mounted sensors
    gps_model TEXT,                         -- GPS/GNSS receiver model
    data_logger TEXT,                       -- Data logger model
    communication_system TEXT,              -- Communication equipment

    -- Survey Method
    survey_method TEXT,                     -- 'transect', 'grid', 'opportunistic', 'route', 'manual'
    logging_interval_sec INTEGER,           -- Data logging interval
    geotagging_method TEXT,                 -- 'integrated', 'external', 'manual'

    -- Operating Area
    typical_operating_area TEXT,            -- Description of usual survey area
    base_location_lat REAL,                 -- Base/storage location
    base_location_lon REAL,

    -- Maintenance
    total_distance_km REAL,                 -- Total logged distance
    total_hours REAL,                       -- Total logged hours
    last_maintenance_date TEXT,
    maintenance_notes TEXT,

    -- Metadata
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_mobile_platform_carrier ON mobile_platforms(carrier_type);

-- ============================================================
-- UPDATE PLATFORM_TYPES TABLE
-- ============================================================
-- Update mobile platform description to include all carrier types

UPDATE platform_types
SET description = 'Mobile platforms including vehicles, boats, rovers, backpack systems, and bicycles for field surveys',
    supports_instruments = '["phenocam", "multispectral", "hyperspectral", "par", "gps", "weather"]'
WHERE code = 'mobile';

-- ============================================================
-- CARRIER TYPE REFERENCE
-- ============================================================
-- For reference - not a table, just documentation
--
-- Carrier Types:
--   VEH   - Vehicle (truck, car, ATV)
--   BOT   - Boat (kayak, motorboat, research vessel)
--   ROV   - Rover (autonomous/RC ground robot)
--   BPK   - Backpack (human walking with backpack)
--   BIC   - Bicycle (human cycling with equipment)
--   OTH   - Other (custom carrier type)
--
-- Naming Convention for Mobile Platforms:
--   {STATION}_{ECO}_{CARRIER}_MOB##
--   Examples:
--     SVB_FOR_BPK_MOB01  - Svartberget Forest Backpack Mobile 01
--     ANS_LAK_BOT_MOB01  - Abisko Lake Boat Mobile 01
--     LON_AGR_ROV_MOB01  - Lönnstorp Agricultural Rover Mobile 01
--     GRI_FOR_BIC_MOB01  - Grimsö Forest Bicycle Mobile 01

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Version: 8.2.0
-- Date: 2025-11-28
