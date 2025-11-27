/**
 * SITES Spectral V3 API Test Database Setup
 * Initialize test database with schema and mock data
 */

import {
  mockStations,
  mockPlatformTypes,
  mockPlatforms,
  mockInstruments,
  mockAOIs,
  mockCampaigns,
  mockProducts,
  mockUAVPlatforms,
  mockUsers,
} from '../fixtures/mock-data.js';

/**
 * SQL statements to create the database schema
 */
const SCHEMA_SQL = `
-- Platform types table
CREATE TABLE IF NOT EXISTS platform_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    description TEXT,
    supports_instruments TEXT,
    requires_location INTEGER DEFAULT 1,
    requires_aoi INTEGER DEFAULT 0,
    config_schema TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    acronym TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    latitude REAL,
    longitude REAL,
    altitude_m REAL,
    timezone TEXT DEFAULT 'Europe/Stockholm',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Platforms table
CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    normalized_name TEXT NOT NULL,
    display_name TEXT,
    platform_type TEXT DEFAULT 'fixed',
    ecosystem_code TEXT,
    mounting_structure TEXT,
    platform_height_m REAL,
    latitude REAL,
    longitude REAL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

-- Instruments table
CREATE TABLE IF NOT EXISTS instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL,
    normalized_name TEXT NOT NULL,
    display_name TEXT,
    instrument_type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    camera_brand TEXT,
    camera_model TEXT,
    resolution TEXT,
    number_of_channels INTEGER,
    orientation TEXT,
    latitude REAL,
    longitude REAL,
    height_m REAL,
    viewing_direction TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Areas of Interest table
CREATE TABLE IF NOT EXISTS areas_of_interest (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    platform_id INTEGER,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    description TEXT,
    geometry_type TEXT NOT NULL,
    geometry_json TEXT NOT NULL,
    bbox_json TEXT,
    centroid_lat REAL,
    centroid_lon REAL,
    area_m2 REAL,
    perimeter_m REAL,
    ecosystem_code TEXT,
    purpose TEXT,
    aoi_type TEXT,
    status TEXT DEFAULT 'active',
    source TEXT,
    source_file TEXT,
    source_crs TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE SET NULL
);

-- Acquisition campaigns table
CREATE TABLE IF NOT EXISTS acquisition_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    platform_id INTEGER NOT NULL,
    aoi_id INTEGER,
    campaign_name TEXT NOT NULL,
    campaign_type TEXT,
    description TEXT,
    planned_start_datetime TEXT,
    planned_end_datetime TEXT,
    actual_start_datetime TEXT,
    actual_end_datetime TEXT,
    status TEXT DEFAULT 'planned',
    flight_altitude_m REAL,
    flight_speed_ms REAL,
    overlap_frontal_pct INTEGER,
    overlap_side_pct INTEGER,
    gsd_cm REAL,
    weather_conditions TEXT,
    wind_speed_ms REAL,
    cloud_cover_pct INTEGER,
    images_collected INTEGER,
    data_size_gb REAL,
    quality_score REAL,
    quality_notes TEXT,
    processing_status TEXT,
    products_generated TEXT,
    metadata_json TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (aoi_id) REFERENCES areas_of_interest(id) ON DELETE SET NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    platform_id INTEGER,
    campaign_id INTEGER,
    aoi_id INTEGER,
    product_type TEXT NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT,
    source_platform_type TEXT,
    source_date TEXT,
    source_datetime TEXT,
    bbox_json TEXT,
    center_lat REAL,
    center_lon REAL,
    resolution_m REAL,
    crs TEXT,
    file_path TEXT,
    file_format TEXT,
    file_size_bytes INTEGER,
    min_value REAL,
    max_value REAL,
    mean_value REAL,
    std_value REAL,
    nodata_percent REAL,
    quality_flag TEXT,
    cloud_cover_pct INTEGER,
    processing_level TEXT,
    algorithm_version TEXT,
    status TEXT DEFAULT 'available',
    metadata_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (platform_id) REFERENCES platforms(id),
    FOREIGN KEY (campaign_id) REFERENCES acquisition_campaigns(id),
    FOREIGN KEY (aoi_id) REFERENCES areas_of_interest(id)
);

-- UAV platforms table
CREATE TABLE IF NOT EXISTS uav_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL UNIQUE,
    uav_model TEXT,
    manufacturer TEXT,
    serial_number TEXT,
    registration_number TEXT,
    max_flight_time_min INTEGER,
    max_payload_kg REAL,
    max_range_km REAL,
    max_altitude_m INTEGER,
    max_speed_ms REAL,
    navigation_system TEXT,
    rtk_capable INTEGER DEFAULT 0,
    ppk_capable INTEGER DEFAULT 0,
    rtk_module TEXT,
    positioning_accuracy_cm REAL,
    rgb_camera TEXT,
    multispectral_camera TEXT,
    thermal_camera TEXT,
    lidar_sensor TEXT,
    home_location_lat REAL,
    home_location_lon REAL,
    operating_temp_min_c INTEGER,
    operating_temp_max_c INTEGER,
    wind_resistance_ms REAL,
    total_flight_hours REAL,
    last_maintenance_date TEXT,
    firmware_version TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Satellite platforms table
CREATE TABLE IF NOT EXISTS satellite_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL UNIQUE,
    satellite_name TEXT,
    satellite_id TEXT,
    operator TEXT,
    program TEXT,
    constellation TEXT,
    orbit_type TEXT,
    altitude_km REAL,
    inclination_deg REAL,
    repeat_cycle_days INTEGER,
    revisit_days INTEGER,
    local_time TEXT,
    swath_width_km REAL,
    native_resolution_m REAL,
    radiometric_resolution_bits INTEGER,
    sensor_name TEXT,
    num_spectral_bands INTEGER,
    spectral_bands_json TEXT,
    coverage_lat_min REAL,
    coverage_lat_max REAL,
    data_provider TEXT,
    data_access_url TEXT,
    data_format TEXT,
    processing_levels TEXT,
    launch_date TEXT,
    end_of_life_date TEXT,
    operational_status TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'readonly',
    station_id INTEGER,
    station_acronym TEXT,
    email TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    entity_name TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_platforms_station ON platforms(station_id);
CREATE INDEX IF NOT EXISTS idx_platforms_type ON platforms(platform_type);
CREATE INDEX IF NOT EXISTS idx_instruments_platform ON instruments(platform_id);
CREATE INDEX IF NOT EXISTS idx_aoi_station ON areas_of_interest(station_id);
CREATE INDEX IF NOT EXISTS idx_aoi_status ON areas_of_interest(status);
CREATE INDEX IF NOT EXISTS idx_campaign_station ON acquisition_campaigns(station_id);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON acquisition_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_product_station ON products(station_id);
CREATE INDEX IF NOT EXISTS idx_product_type ON products(product_type);
`;

/**
 * Initialize test database with schema
 * @param {D1Database} db - D1 database instance
 */
export async function initializeTestDatabase(db) {
  // Execute schema creation
  const statements = SCHEMA_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await db.prepare(statement).run();
    } catch (error) {
      // Ignore errors for IF NOT EXISTS statements
      if (!error.message.includes('already exists')) {
        console.error('Schema error:', error.message);
      }
    }
  }
}

/**
 * Seed test database with mock data
 * @param {D1Database} db - D1 database instance
 */
export async function seedTestDatabase(db) {
  // Insert platform types
  for (const pt of mockPlatformTypes) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO platform_types (code, name, icon, color, description, supports_instruments, requires_location, requires_aoi, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        pt.code,
        pt.name,
        pt.icon,
        pt.color,
        pt.description,
        pt.supports_instruments,
        pt.requires_location,
        pt.requires_aoi,
        pt.sort_order
      )
      .run();
  }

  // Insert stations
  for (const station of mockStations) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO stations (acronym, display_name, description, latitude, longitude, altitude_m, timezone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        station.acronym,
        station.display_name,
        station.description,
        station.latitude,
        station.longitude,
        station.altitude_m,
        station.timezone,
        station.status
      )
      .run();
  }

  // Insert platforms
  for (const platform of mockPlatforms) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO platforms (station_id, normalized_name, display_name, platform_type, ecosystem_code, mounting_structure, platform_height_m, latitude, longitude, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        platform.station_id,
        platform.normalized_name,
        platform.display_name,
        platform.platform_type,
        platform.ecosystem_code,
        platform.mounting_structure,
        platform.platform_height_m,
        platform.latitude,
        platform.longitude,
        platform.status
      )
      .run();
  }

  // Insert instruments
  for (const inst of mockInstruments) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO instruments (platform_id, normalized_name, display_name, instrument_type, status, camera_brand, camera_model, resolution, number_of_channels, orientation, latitude, longitude, height_m, viewing_direction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        inst.platform_id,
        inst.normalized_name,
        inst.display_name,
        inst.instrument_type,
        inst.status,
        inst.camera_brand,
        inst.camera_model,
        inst.resolution,
        inst.number_of_channels,
        inst.orientation,
        inst.latitude,
        inst.longitude,
        inst.height_m,
        inst.viewing_direction
      )
      .run();
  }

  // Insert AOIs
  for (const aoi of mockAOIs) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO areas_of_interest (station_id, platform_id, name, normalized_name, description, geometry_type, geometry_json, bbox_json, centroid_lat, centroid_lon, area_m2, perimeter_m, ecosystem_code, purpose, aoi_type, status, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        aoi.station_id,
        aoi.platform_id,
        aoi.name,
        aoi.normalized_name,
        aoi.description,
        aoi.geometry_type,
        aoi.geometry_json,
        aoi.bbox_json,
        aoi.centroid_lat,
        aoi.centroid_lon,
        aoi.area_m2,
        aoi.perimeter_m,
        aoi.ecosystem_code,
        aoi.purpose,
        aoi.aoi_type,
        aoi.status,
        aoi.source
      )
      .run();
  }

  // Insert campaigns
  for (const campaign of mockCampaigns) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO acquisition_campaigns (station_id, platform_id, aoi_id, campaign_name, campaign_type, description, planned_start_datetime, planned_end_datetime, actual_start_datetime, actual_end_datetime, status, flight_altitude_m, flight_speed_ms, overlap_frontal_pct, overlap_side_pct, gsd_cm, weather_conditions, wind_speed_ms, cloud_cover_pct, images_collected, data_size_gb, quality_score, processing_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        campaign.station_id,
        campaign.platform_id,
        campaign.aoi_id,
        campaign.campaign_name,
        campaign.campaign_type,
        campaign.description,
        campaign.planned_start_datetime,
        campaign.planned_end_datetime,
        campaign.actual_start_datetime,
        campaign.actual_end_datetime,
        campaign.status,
        campaign.flight_altitude_m,
        campaign.flight_speed_ms,
        campaign.overlap_frontal_pct,
        campaign.overlap_side_pct,
        campaign.gsd_cm,
        campaign.weather_conditions,
        campaign.wind_speed_ms,
        campaign.cloud_cover_pct,
        campaign.images_collected,
        campaign.data_size_gb,
        campaign.quality_score,
        campaign.processing_status
      )
      .run();
  }

  // Insert products
  for (const product of mockProducts) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO products (station_id, platform_id, campaign_id, aoi_id, product_type, product_name, description, source_platform_type, source_date, source_datetime, bbox_json, center_lat, center_lon, resolution_m, crs, file_format, file_size_bytes, min_value, max_value, mean_value, std_value, quality_flag, cloud_cover_pct, processing_level, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        product.station_id,
        product.platform_id,
        product.campaign_id,
        product.aoi_id,
        product.product_type,
        product.product_name,
        product.description,
        product.source_platform_type,
        product.source_date,
        product.source_datetime,
        product.bbox_json,
        product.center_lat,
        product.center_lon,
        product.resolution_m,
        product.crs,
        product.file_format,
        product.file_size_bytes,
        product.min_value,
        product.max_value,
        product.mean_value,
        product.std_value,
        product.quality_flag,
        product.cloud_cover_pct,
        product.processing_level,
        product.status
      )
      .run();
  }

  // Insert UAV platforms
  for (const uav of mockUAVPlatforms) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO uav_platforms (platform_id, uav_model, manufacturer, serial_number, registration_number, max_flight_time_min, max_payload_kg, max_range_km, max_altitude_m, max_speed_ms, navigation_system, rtk_capable, ppk_capable, rtk_module, positioning_accuracy_cm, rgb_camera, multispectral_camera, home_location_lat, home_location_lon, operating_temp_min_c, operating_temp_max_c, wind_resistance_ms, total_flight_hours, firmware_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        uav.platform_id,
        uav.uav_model,
        uav.manufacturer,
        uav.serial_number,
        uav.registration_number,
        uav.max_flight_time_min,
        uav.max_payload_kg,
        uav.max_range_km,
        uav.max_altitude_m,
        uav.max_speed_ms,
        uav.navigation_system,
        uav.rtk_capable,
        uav.ppk_capable,
        uav.rtk_module,
        uav.positioning_accuracy_cm,
        uav.rgb_camera,
        uav.multispectral_camera,
        uav.home_location_lat,
        uav.home_location_lon,
        uav.operating_temp_min_c,
        uav.operating_temp_max_c,
        uav.wind_resistance_ms,
        uav.total_flight_hours,
        uav.firmware_version
      )
      .run();
  }

  // Insert users
  for (const user of mockUsers) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO users (username, role, station_id, station_acronym, email)
       VALUES (?, ?, ?, ?, ?)`
      )
      .bind(user.username, user.role, user.station_id, user.station_acronym, user.email)
      .run();
  }
}

/**
 * Clear all test data from the database
 * @param {D1Database} db - D1 database instance
 */
export async function clearTestDatabase(db) {
  const tables = [
    'activity_log',
    'products',
    'acquisition_campaigns',
    'uav_platforms',
    'satellite_platforms',
    'areas_of_interest',
    'instruments',
    'platforms',
    'stations',
    'platform_types',
    'users',
  ];

  for (const table of tables) {
    try {
      await db.prepare(`DELETE FROM ${table}`).run();
    } catch (error) {
      // Ignore errors for non-existent tables
    }
  }
}

/**
 * Reset database to initial test state
 * @param {D1Database} db - D1 database instance
 */
export async function resetTestDatabase(db) {
  await clearTestDatabase(db);
  await initializeTestDatabase(db);
  await seedTestDatabase(db);
}
