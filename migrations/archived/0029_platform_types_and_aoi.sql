-- SITES Spectral v8.0.0-beta.1 Migration
-- Platform Types, AOI Support, UAV/Satellite Extensions
-- Date: 2025-11-27

-- ============================================================
-- 1. PLATFORM TYPES TABLE
-- ============================================================
-- Defines the different types of observation platforms:
-- fixed (towers, buildings), uav (drones), satellite

CREATE TABLE IF NOT EXISTS platform_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,              -- 'fixed', 'uav', 'satellite', 'mobile'
    name TEXT NOT NULL,                     -- Display name
    icon TEXT,                              -- FontAwesome icon class
    color TEXT,                             -- Hex color code
    description TEXT,
    supports_instruments TEXT,              -- JSON array of supported instrument types
    requires_location INTEGER DEFAULT 1,    -- 1 = requires lat/lon
    requires_aoi INTEGER DEFAULT 0,         -- 1 = requires Area of Interest
    config_schema TEXT,                     -- JSON schema for type-specific fields
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert default platform types
INSERT OR IGNORE INTO platform_types (code, name, icon, color, description, supports_instruments, requires_location, requires_aoi, sort_order) VALUES
('fixed', 'Fixed Platform', 'fa-tower-observation', '#2563eb',
 'Permanent installations such as towers, buildings, or poles with mounted instruments',
 '["phenocam", "multispectral", "par", "ndvi", "pri", "hyperspectral"]',
 1, 0, 1),

('uav', 'UAV Platform', 'fa-helicopter', '#059669',
 'Unmanned Aerial Vehicles (drones) for mapping and monitoring missions',
 '["phenocam", "multispectral", "hyperspectral", "lidar", "thermal"]',
 0, 1, 2),

('satellite', 'Satellite Platform', 'fa-satellite', '#7c3aed',
 'Earth observation satellites providing regional to global coverage',
 '["multispectral", "hyperspectral", "thermal", "sar"]',
 0, 1, 3),

('mobile', 'Mobile Platform', 'fa-truck', '#f59e0b',
 'Mobile ground-based platforms such as vehicles or boats',
 '["phenocam", "multispectral", "hyperspectral"]',
 0, 0, 4);

-- ============================================================
-- 2. ADD PLATFORM_TYPE TO PLATFORMS TABLE
-- ============================================================

-- Add platform_type column if not exists
ALTER TABLE platforms ADD COLUMN platform_type TEXT DEFAULT 'fixed';
ALTER TABLE platforms ADD COLUMN platform_type_id INTEGER REFERENCES platform_types(id);

-- Update existing platforms to have platform_type = 'fixed'
UPDATE platforms SET platform_type = 'fixed' WHERE platform_type IS NULL;

-- ============================================================
-- 3. AREAS OF INTEREST TABLE
-- ============================================================
-- Geographic AOIs for UAV flight areas and satellite coverage regions

CREATE TABLE IF NOT EXISTS areas_of_interest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    platform_id INTEGER,                    -- Optional link to specific platform

    -- Identification
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,          -- Lowercase, underscores
    description TEXT,

    -- Geometry (GeoJSON)
    geometry_type TEXT NOT NULL,            -- 'Polygon', 'MultiPolygon', 'Point'
    geometry_json TEXT NOT NULL,            -- GeoJSON geometry object
    bbox_json TEXT,                         -- Bounding box [minLon, minLat, maxLon, maxLat]
    centroid_lat REAL,                      -- Centroid latitude
    centroid_lon REAL,                      -- Centroid longitude
    area_m2 REAL,                           -- Calculated area in square meters
    perimeter_m REAL,                       -- Calculated perimeter in meters

    -- Classification
    ecosystem_code TEXT,                    -- FOR, AGR, MIR, etc.
    purpose TEXT,                           -- 'mapping', 'monitoring', 'validation', 'reference'
    aoi_type TEXT,                          -- 'flight_area', 'coverage_area', 'study_site'

    -- Status
    status TEXT DEFAULT 'active',           -- 'active', 'inactive', 'archived'

    -- Source
    source TEXT,                            -- 'manual', 'import', 'digitized'
    source_file TEXT,                       -- Original filename if imported
    source_crs TEXT,                        -- Original coordinate system

    -- Metadata
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE SET NULL
);

-- Indexes for AOI queries
CREATE INDEX IF NOT EXISTS idx_aoi_station ON areas_of_interest(station_id);
CREATE INDEX IF NOT EXISTS idx_aoi_platform ON areas_of_interest(platform_id);
CREATE INDEX IF NOT EXISTS idx_aoi_status ON areas_of_interest(status);
CREATE INDEX IF NOT EXISTS idx_aoi_type ON areas_of_interest(aoi_type);

-- ============================================================
-- 4. UAV PLATFORMS EXTENSION TABLE
-- ============================================================
-- Additional fields specific to UAV platforms

CREATE TABLE IF NOT EXISTS uav_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL UNIQUE,

    -- UAV Identification
    uav_model TEXT,                         -- 'Mavic 3 Multispectral', 'Phantom 4 MS'
    manufacturer TEXT,                      -- 'DJI', 'senseFly', etc.
    serial_number TEXT,
    registration_number TEXT,               -- Regulatory registration

    -- Flight Capabilities
    max_flight_time_min INTEGER,            -- Maximum flight time in minutes
    max_payload_kg REAL,                    -- Maximum payload capacity
    max_range_km REAL,                      -- Maximum range
    max_altitude_m INTEGER,                 -- Max operating altitude (AGL)
    max_speed_ms REAL,                      -- Max horizontal speed

    -- Positioning
    navigation_system TEXT,                 -- 'GPS', 'GPS+GLONASS', etc.
    rtk_capable INTEGER DEFAULT 0,          -- 1 = RTK enabled
    ppk_capable INTEGER DEFAULT 0,          -- 1 = PPK capable
    rtk_module TEXT,                        -- RTK module model
    positioning_accuracy_cm REAL,           -- Horizontal accuracy in cm

    -- Sensors
    rgb_camera TEXT,                        -- RGB camera model
    multispectral_camera TEXT,              -- MS camera model
    thermal_camera TEXT,                    -- Thermal camera if any
    lidar_sensor TEXT,                      -- LiDAR sensor if any

    -- Home Location
    home_location_lat REAL,                 -- Default launch point latitude
    home_location_lon REAL,                 -- Default launch point longitude

    -- Operational
    operating_temp_min_c INTEGER,           -- Min operating temperature
    operating_temp_max_c INTEGER,           -- Max operating temperature
    wind_resistance_ms REAL,                -- Max wind resistance

    -- Maintenance
    total_flight_hours REAL,                -- Total logged flight time
    last_maintenance_date TEXT,
    firmware_version TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. SATELLITE PLATFORMS EXTENSION TABLE
-- ============================================================
-- Additional fields specific to satellite platforms

CREATE TABLE IF NOT EXISTS satellite_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL UNIQUE,

    -- Satellite Identification
    satellite_name TEXT,                    -- 'Sentinel-2A', 'Landsat 9'
    satellite_id TEXT,                      -- Official satellite ID
    operator TEXT,                          -- 'ESA', 'NASA', 'USGS'
    program TEXT,                           -- 'Copernicus', 'Landsat'
    constellation TEXT,                     -- 'Sentinel-2', 'Landsat'

    -- Orbital Characteristics
    orbit_type TEXT,                        -- 'sun_synchronous', 'polar', 'geostationary'
    altitude_km REAL,                       -- Orbital altitude
    inclination_deg REAL,                   -- Orbital inclination
    repeat_cycle_days INTEGER,              -- Orbital repeat cycle
    revisit_days INTEGER,                   -- Actual revisit time for location
    local_time TEXT,                        -- Equator crossing time

    -- Imaging Characteristics
    swath_width_km REAL,                    -- Swath width
    native_resolution_m REAL,               -- Best spatial resolution
    radiometric_resolution_bits INTEGER,    -- Bit depth

    -- Spectral
    sensor_name TEXT,                       -- 'MSI', 'OLI', 'OLCI'
    num_spectral_bands INTEGER,             -- Number of bands
    spectral_bands_json TEXT,               -- JSON array of band info

    -- Coverage
    coverage_lat_min REAL,                  -- Southern latitude limit
    coverage_lat_max REAL,                  -- Northern latitude limit

    -- Data Access
    data_provider TEXT,                     -- Primary data source
    data_access_url TEXT,                   -- URL to data portal
    data_format TEXT,                       -- 'GeoTIFF', 'JP2', 'NetCDF'
    processing_levels TEXT,                 -- JSON array: ['L1C', 'L2A']

    -- Status
    launch_date TEXT,
    end_of_life_date TEXT,
    operational_status TEXT,                -- 'operational', 'decommissioned', 'planned'

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. ACQUISITION CAMPAIGNS TABLE
-- ============================================================
-- For UAV flight missions and satellite acquisition planning

CREATE TABLE IF NOT EXISTS acquisition_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    platform_id INTEGER NOT NULL,
    aoi_id INTEGER,                         -- Link to target AOI

    -- Campaign Info
    campaign_name TEXT NOT NULL,
    campaign_type TEXT,                     -- 'flight', 'acquisition', 'survey', 'monitoring'
    description TEXT,

    -- Timing
    planned_start_datetime TEXT,            -- Planned start
    planned_end_datetime TEXT,              -- Planned end
    actual_start_datetime TEXT,             -- Actual start
    actual_end_datetime TEXT,               -- Actual end

    -- Status
    status TEXT DEFAULT 'planned',          -- 'planned', 'in_progress', 'completed', 'cancelled', 'failed'

    -- Flight Parameters (UAV)
    flight_altitude_m REAL,                 -- Target flight altitude AGL
    flight_speed_ms REAL,                   -- Target flight speed
    overlap_frontal_pct INTEGER,            -- Frontal overlap %
    overlap_side_pct INTEGER,               -- Side overlap %
    gsd_cm REAL,                            -- Target Ground Sample Distance

    -- Weather Conditions
    weather_conditions TEXT,                -- Description of weather
    wind_speed_ms REAL,
    cloud_cover_pct INTEGER,

    -- Data Collection
    images_collected INTEGER,               -- Number of images
    data_size_gb REAL,                      -- Total data size

    -- Quality
    quality_score REAL,                     -- 0-100 quality assessment
    quality_notes TEXT,

    -- Processing
    processing_status TEXT,                 -- 'pending', 'processing', 'completed', 'failed'
    products_generated TEXT,                -- JSON array of generated products

    -- Metadata (JSON for flexible storage)
    metadata_json TEXT,                     -- Additional campaign parameters

    -- Audit
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (aoi_id) REFERENCES areas_of_interest(id) ON DELETE SET NULL
);

-- Indexes for campaign queries
CREATE INDEX IF NOT EXISTS idx_campaign_station ON acquisition_campaigns(station_id);
CREATE INDEX IF NOT EXISTS idx_campaign_platform ON acquisition_campaigns(platform_id);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON acquisition_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_dates ON acquisition_campaigns(planned_start_datetime);

-- ============================================================
-- 7. PRODUCTS TABLE
-- ============================================================
-- Track generated products from platforms

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    platform_id INTEGER,
    campaign_id INTEGER,
    aoi_id INTEGER,

    -- Product Info
    product_type TEXT NOT NULL,             -- 'ndvi', 'chlorophyll', 'orthomosaic', etc.
    product_name TEXT NOT NULL,
    description TEXT,

    -- Source
    source_platform_type TEXT,              -- 'fixed', 'uav', 'satellite'
    source_date TEXT,                       -- Acquisition date
    source_datetime TEXT,                   -- Full datetime if available

    -- Spatial Info
    bbox_json TEXT,                         -- Bounding box
    center_lat REAL,
    center_lon REAL,
    resolution_m REAL,                      -- Spatial resolution
    crs TEXT,                               -- Coordinate reference system

    -- Data
    file_path TEXT,                         -- Path to product file
    file_format TEXT,                       -- 'GeoTIFF', 'NetCDF', 'PNG'
    file_size_bytes INTEGER,

    -- Statistics
    min_value REAL,
    max_value REAL,
    mean_value REAL,
    std_value REAL,
    nodata_percent REAL,

    -- Quality
    quality_flag TEXT,                      -- 'good', 'moderate', 'poor', 'cloud_affected'
    cloud_cover_pct INTEGER,

    -- Processing
    processing_level TEXT,                  -- 'raw', 'L1', 'L2', 'L3'
    algorithm_version TEXT,

    -- Status
    status TEXT DEFAULT 'available',        -- 'available', 'archived', 'deleted'

    -- Metadata
    metadata_json TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (platform_id) REFERENCES platforms(id),
    FOREIGN KEY (campaign_id) REFERENCES acquisition_campaigns(id),
    FOREIGN KEY (aoi_id) REFERENCES areas_of_interest(id)
);

-- Indexes for product queries
CREATE INDEX IF NOT EXISTS idx_product_station ON products(station_id);
CREATE INDEX IF NOT EXISTS idx_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_product_date ON products(source_date);
CREATE INDEX IF NOT EXISTS idx_product_platform_type ON products(source_platform_type);

-- ============================================================
-- 8. ACTIVITY LOG ENHANCEMENT
-- ============================================================
-- Add support for new entity types in activity log

-- Ensure activity_log exists with proper columns
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,                   -- 'create', 'update', 'delete', 'view'
    entity_type TEXT NOT NULL,              -- 'station', 'platform', 'instrument', 'aoi', 'campaign'
    entity_id INTEGER,
    entity_name TEXT,
    details TEXT,                           -- JSON with change details
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);

-- ============================================================
-- 9. INSERT SAMPLE UAV PLATFORMS (Optional)
-- ============================================================
-- These can be used as templates or defaults

-- Note: Actual platform insertion should be done through the application
-- This is just for reference/testing

/*
-- Example: Insert Mavic 3 MS as a platform template
INSERT INTO platforms (station_id, normalized_name, display_name, platform_type, ecosystem_code, description)
SELECT id, 'svb_uav_mavic3', 'SVB UAV Mavic 3 MS', 'uav', 'FOR',
       'DJI Mavic 3 Multispectral for forest monitoring'
FROM stations WHERE acronym = 'SVB';
*/

-- ============================================================
-- 10. VIEWS FOR COMMON QUERIES
-- ============================================================

-- View: Platforms with type info
CREATE VIEW IF NOT EXISTS v_platforms_with_type AS
SELECT
    p.*,
    pt.name as platform_type_name,
    pt.icon as platform_type_icon,
    pt.color as platform_type_color,
    pt.requires_aoi,
    s.acronym as station_acronym,
    s.display_name as station_name
FROM platforms p
LEFT JOIN platform_types pt ON p.platform_type = pt.code
LEFT JOIN stations s ON p.station_id = s.id;

-- View: AOIs with station info
CREATE VIEW IF NOT EXISTS v_aoi_summary AS
SELECT
    a.*,
    s.acronym as station_acronym,
    s.display_name as station_name,
    p.display_name as platform_name,
    p.platform_type
FROM areas_of_interest a
LEFT JOIN stations s ON a.station_id = s.id
LEFT JOIN platforms p ON a.platform_id = p.id
WHERE a.status = 'active';

-- View: Recent campaigns
CREATE VIEW IF NOT EXISTS v_recent_campaigns AS
SELECT
    c.*,
    s.acronym as station_acronym,
    p.display_name as platform_name,
    p.platform_type,
    a.name as aoi_name
FROM acquisition_campaigns c
LEFT JOIN stations s ON c.station_id = s.id
LEFT JOIN platforms p ON c.platform_id = p.id
LEFT JOIN areas_of_interest a ON c.aoi_id = a.id
ORDER BY c.created_at DESC
LIMIT 100;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Version: 8.0.0-beta.1
-- Date: 2025-11-27
--
-- New Tables:
--   - platform_types
--   - areas_of_interest
--   - uav_platforms
--   - satellite_platforms
--   - acquisition_campaigns
--   - products
--
-- Modified Tables:
--   - platforms (added platform_type, platform_type_id)
--   - activity_log (enhanced for new entities)
--
-- New Views:
--   - v_platforms_with_type
--   - v_aoi_summary
--   - v_recent_campaigns
