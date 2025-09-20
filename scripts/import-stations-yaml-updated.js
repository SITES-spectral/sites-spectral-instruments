#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load YAML file
const yamlPath = path.join(__dirname, '../.secure/stations.yaml');
const stationsData = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

// Function to escape SQL strings
function escapeSql(str) {
  if (!str) return '';
  return str.toString().replace(/'/g, "''").replace(/[?]/g, '');
}

// Function to extract coordinates from nested geolocation structure
function extractCoordinates(entity) {
  if (entity.geolocation && entity.geolocation.point) {
    return {
      lat: entity.geolocation.point.latitude_dd || null,
      lng: entity.geolocation.point.longitude_dd || null
    };
  }
  // Fallback to direct properties (legacy)
  return {
    lat: entity.latitude_dd || entity.latitude || null,
    lng: entity.longitude_dd || entity.longitude || null
  };
}

// Create SQL output
let sql = `-- Import standardized station data from stations.yaml v${stationsData.version}
-- Generated: ${new Date().toISOString()}
-- Schema: Standardized with nested geolocation structure

-- Clear existing data first
DELETE FROM instruments;
DELETE FROM platforms;
DELETE FROM stations;

-- Ecosystems are already defined in the database

`;

let stationInserts = [];
let platformInserts = [];
let instrumentInserts = [];

let stationId = 1;
let platformId = 1;
let instrumentId = 1;

for (const [stationKey, station] of Object.entries(stationsData.stations)) {
  // Extract station coordinates
  const stationCoords = extractCoordinates(station);
  const lat = stationCoords.lat || 62.0; // Default to Sweden center
  const lng = stationCoords.lng || 15.0;

  const description = escapeSql(station.description || '');
  const displayName = escapeSql(station.display_name || station.name || stationKey);
  const status = escapeSql(station.status || 'Active');
  const country = escapeSql(station.country || 'Sweden');
  const elevation = station.elevation_m || 'NULL';

  stationInserts.push(`(${stationId}, '${escapeSql(station.normalized_name)}', '${displayName}', '${escapeSql(station.acronym)}', '${status}', '${country}', ${lat}, ${lng}, ${elevation}, '${description}')`);

  // Process platforms
  if (station.platforms) {
    for (const [platformKey, platform] of Object.entries(station.platforms)) {
      const platformCoords = extractCoordinates(platform);
      let platLat = platformCoords.lat ? platformCoords.lat : 'NULL';
      let platLng = platformCoords.lng ? platformCoords.lng : 'NULL';

      const platformHeight = platform.platform_height_m || 'NULL';
      const mountingStructure = escapeSql(platform.mounting_structure || '');
      const deploymentDate = platform.platform_deployment_date || 'NULL';
      const platformStatus = escapeSql(platform.status || 'Active');
      const locationCode = escapeSql(platform.location_code || '');
      const displayName = escapeSql(platform.display_name || platformKey);
      const description = escapeSql(platform.description || '');
      const operationPrograms = platform.operation_programs ? `'${escapeSql(JSON.stringify(platform.operation_programs))}'` : 'NULL';

      const normalizedName = escapeSql(platform.normalized_name || platformKey);
      platformInserts.push(`(${platformId}, ${stationId}, '${normalizedName}', '${displayName}', '${locationCode}', '${mountingStructure}', ${platformHeight}, '${platformStatus}', ${platLat}, ${platLng}, ${deploymentDate === 'NULL' ? 'NULL' : `'${deploymentDate}'`}, '${description}', ${operationPrograms})`);

      // Process instruments (phenocams)
      if (platform.instruments && platform.instruments.phenocams) {
        for (const [instrumentKey, instrument] of Object.entries(platform.instruments.phenocams)) {
          const instrumentCoords = extractCoordinates(instrument);
          let instLat = instrumentCoords.lat ? instrumentCoords.lat : 'NULL';
          let instLng = instrumentCoords.lng ? instrumentCoords.lng : 'NULL';

          const instrumentHeight = instrument.instrument_height_m || 'NULL';
          const viewingDirection = escapeSql(instrument.instrument_viewing_direction || instrument.viewing_direction || '');
          let azimuth = instrument.instrument_azimuth_degrees || instrument.azimuth_degrees || 'NULL';
          if (azimuth !== 'NULL' && azimuth.toString().includes('?')) {
            azimuth = 'NULL';
          }

          // Extract camera specifications from nested structure
          const cameraSpecs = instrument.camera_specifications || {};
          const cameraBrand = escapeSql(cameraSpecs.brand || '');
          const cameraModel = escapeSql(cameraSpecs.model || '');
          const cameraResolution = escapeSql(cameraSpecs.resolution || '');
          const cameraSerial = escapeSql(cameraSpecs.serial_number || '');

          // Extract measurement timeline from nested structure
          const timeline = instrument.measurement_timeline || {};
          const firstYear = timeline.first_measurement_year || 'NULL';
          const lastYear = timeline.last_measurement_year || 'NULL';
          const measurementStatus = escapeSql(timeline.measurement_status || instrument.measurement_status || 'Active');

          const ecosystemCode = escapeSql(instrument.ecosystem_code || '');
          const instrumentType = escapeSql(instrument.instrument_type || 'phenocam');
          const instrumentNumber = instrument.instrument_number ? `'${instrument.instrument_number}'` : 'NULL';
          const instrumentStatus = escapeSql(instrument.status || 'Active');
          const displayName = escapeSql(instrument.display_name || instrumentKey);
          const description = escapeSql(instrument.description || '');
          const installationNotes = escapeSql(instrument.installation_notes || '');
          const maintenanceNotes = escapeSql(instrument.maintenance_notes || '');

          // Get normalized name for instrument
          const normalizedName = escapeSql(instrument.normalized_name || instrumentKey);

          instrumentInserts.push(`(${instrumentId}, ${platformId}, '${normalizedName}', '${displayName}', '${instrumentType}', '${ecosystemCode}', ${instrumentNumber}, '${cameraBrand}', '${cameraModel}', '${cameraResolution}', '${cameraSerial}', ${firstYear}, ${lastYear}, '${measurementStatus}', '${instrumentStatus}', ${instLat}, ${instLng}, ${instrumentHeight}, '${viewingDirection}', ${azimuth}, '${description}', '${installationNotes}', '${maintenanceNotes}')`);

          instrumentId++;
        }
      }

      platformId++;
    }
  }

  stationId++;
}

// Build final SQL
if (stationInserts.length > 0) {
  sql += `-- Insert stations\nINSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES\n`;
  sql += stationInserts.join(',\n') + ';\n\n';
}

if (platformInserts.length > 0) {
  sql += `-- Insert platforms\nINSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description, operation_programs) VALUES\n`;
  sql += platformInserts.join(',\n') + ';\n\n';
}

if (instrumentInserts.length > 0) {
  sql += `-- Insert instruments\nINSERT INTO instruments (id, platform_id, normalized_name, display_name, instrument_type, ecosystem_code, instrument_number, camera_brand, camera_model, camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, status, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, description, installation_notes, maintenance_notes) VALUES\n`;
  sql += instrumentInserts.join(',\n') + ';\n\n';
}

// Add summary
sql += `-- Summary:\n-- Stations: ${stationInserts.length}\n-- Platforms: ${platformInserts.length}\n-- Instruments: ${instrumentInserts.length}\n`;

// Write to file
const outputPath = path.join(__dirname, '../migrations/0024_import_standardized_stations_data.sql');
fs.writeFileSync(outputPath, sql);

console.log(`Generated migration file: ${outputPath}`);
console.log(`Stations: ${stationInserts.length}, Platforms: ${platformInserts.length}, Instruments: ${instrumentInserts.length}`);