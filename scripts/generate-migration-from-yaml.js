#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Path configuration
const projectRoot = path.dirname(__dirname);
const secureDir = path.join(projectRoot, '.secure');
const yamlsDir = path.join(projectRoot, 'yamls');
const migrationsDir = path.join(projectRoot, 'migrations');

// Output migration file
const migrationFile = path.join(migrationsDir, '0020_rebuild_from_real_yaml_data.sql');

console.log('🏗️  Generating database migration from YAML data...');

try {
    // Load YAML files
    console.log('📁 Loading YAML files...');

    const stationsYaml = fs.readFileSync(path.join(secureDir, 'stations.yaml'), 'utf8');
    const ecosystemsYaml = fs.readFileSync(path.join(yamlsDir, 'ecosystems.yaml'), 'utf8');
    const statusYaml = fs.readFileSync(path.join(yamlsDir, 'status.yaml'), 'utf8');

    const stationsData = yaml.load(stationsYaml);
    const ecosystemsData = yaml.load(ecosystemsYaml);
    const statusData = yaml.load(statusYaml);

    console.log(`📊 Loaded ${Object.keys(stationsData.stations).length} stations`);
    console.log(`🌿 Loaded ${Object.keys(ecosystemsData).length} ecosystems`);
    console.log(`📈 Loaded ${Object.keys(statusData).length} status types`);

    // Generate SQL migration
    let sql = `-- Migration: Rebuild database with real YAML data
-- Generated: ${new Date().toISOString()}
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
`;

    // Add ecosystems
    console.log('🌿 Processing ecosystems...');
    for (const [code, ecosystem] of Object.entries(ecosystemsData)) {
        const description = ecosystem.description || '';
        sql += `INSERT INTO ecosystems (code, name, description) VALUES ('${code}', '${description}', '${description}');\n`;
    }

    // Add stations, platforms, and instruments
    console.log('🏗️  Processing stations...');
    let stationId = 1;
    let platformId = 1;
    let instrumentId = 1;

    for (const [stationKey, station] of Object.entries(stationsData.stations)) {
        // Insert station
        const stationName = station.display_name || station.normalized_name || stationKey;
        const stationAcronym = station.acronym || stationKey.toUpperCase();
        const stationStatus = station.status || 'Active';
        const stationCountry = station.country || 'Sweden';
        const stationLat = station.latitude || 'NULL';
        const stationLng = station.longitude || 'NULL';
        const stationElev = station.elevation_m || 'NULL';
        const stationDesc = (station.description || '').replace(/'/g, "''");

        sql += `\n-- Station: ${stationName}\n`;
        sql += `INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES (${stationId}, '${station.normalized_name}', '${stationName}', '${stationAcronym}', '${stationStatus}', '${stationCountry}', ${stationLat}, ${stationLng}, ${stationElev}, '${stationDesc}');\n`;

        // Process platforms
        if (station.phenocams && station.phenocams.platforms) {
            for (const [platformKey, platform] of Object.entries(station.phenocams.platforms)) {
                const platformName = platform.display_name || platformKey;
                const platformNormalized = platform.normalized_name || platformKey;
                const locationCode = platform.location_code || platformKey.split('_').pop() || 'PL01';
                const mountingStructure = platform.mounting_structure || '';
                const platformHeight = platform.platform_height_m || 'NULL';
                const platformStatus = platform.status || 'Active';
                const platformLat = platform.latitude || stationLat;
                const platformLng = platform.longitude || stationLng;
                const deploymentDate = platform.deployment_date ? `'${platform.deployment_date}'` : 'NULL';
                const platformDesc = (platform.description || '').replace(/'/g, "''");

                sql += `INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (${platformId}, ${stationId}, '${platformNormalized}', '${platformName}', '${locationCode}', '${mountingStructure}', ${platformHeight}, '${platformStatus}', ${platformLat}, ${platformLng}, ${deploymentDate}, '${platformDesc}');\n`;

                // Process instruments
                if (platform.instruments) {
                    for (const [instrumentKey, instrument] of Object.entries(platform.instruments)) {
                        const instrumentName = instrument.display_name || instrumentKey;
                        const instrumentNormalized = instrument.normalized_name || instrumentKey;
                        const legacyAcronym = instrument.legacy_acronym || '';
                        const instrumentType = instrument.instrument_type || instrument.type || 'phenocam';
                        const ecosystemCode = instrument.ecosystem_code || instrument.ecosystem || '';
                        const instrumentNumber = instrument.instrument_number || '';
                        const instrumentStatus = instrument.status || 'Active';
                        const instrumentDeploymentDate = instrument.deployment_date ? `'${instrument.deployment_date}'` : 'NULL';
                        const instrumentLat = instrument.latitude || platformLat;
                        const instrumentLng = instrument.longitude || platformLng;
                        const instrumentHeight = instrument.instrument_height_m || 'NULL';
                        const viewingDirection = instrument.viewing_direction || '';
                        const azimuthDegrees = instrument.azimuth_degrees || 'NULL';
                        const degreesFromNadir = instrument.degrees_from_nadir || 'NULL';

                        // Camera specifications
                        const cameraBrand = instrument.camera_specifications?.brand || '';
                        const cameraModel = instrument.camera_specifications?.model || '';
                        const cameraResolution = instrument.camera_specifications?.resolution || '';
                        const cameraSerial = instrument.camera_specifications?.serial_number || '';

                        // Measurement timeline
                        const firstMeasurementYear = instrument.measurement_timeline?.first_measurement_year || 'NULL';
                        const lastMeasurementYear = instrument.measurement_timeline?.last_measurement_year || 'NULL';
                        const measurementStatus = instrument.measurement_timeline?.status || '';

                        const instrumentDesc = (instrument.description || '').replace(/'/g, "''");

                        sql += `INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description) VALUES (${instrumentId}, ${platformId}, '${instrumentNormalized}', '${instrumentName}', '${legacyAcronym}', '${instrumentType}', '${ecosystemCode}', '${instrumentNumber}', '${instrumentStatus}', ${instrumentDeploymentDate}, ${instrumentLat}, ${instrumentLng}, ${instrumentHeight}, '${viewingDirection}', ${azimuthDegrees}, ${degreesFromNadir}, '${cameraBrand}', '${cameraModel}', '${cameraResolution}', '${cameraSerial}', ${firstMeasurementYear}, ${lastMeasurementYear}, '${measurementStatus}', '${instrumentDesc}');\n`;

                        instrumentId++;
                    }
                }
                platformId++;
            }
        }
        stationId++;
    }

    // Add default admin user and permissions
    sql += `\n-- Default admin user
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
`;

    // Write migration file
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
    }

    fs.writeFileSync(migrationFile, sql);

    console.log(`✅ Migration generated: ${migrationFile}`);
    console.log(`📊 Generated data for:`);
    console.log(`   - ${stationId - 1} stations`);
    console.log(`   - ${platformId - 1} platforms`);
    console.log(`   - ${instrumentId - 1} instruments`);
    console.log(`   - ${Object.keys(ecosystemsData).length} ecosystems`);

} catch (error) {
    console.error('❌ Error generating migration:', error);
    process.exit(1);
}