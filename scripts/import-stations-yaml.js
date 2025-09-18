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

// Create SQL output
let sql = `-- Import real station data from stations.yaml
-- Generated: ${new Date().toISOString()}

-- Insert ecosystems
INSERT INTO ecosystems (code, description, acronym) VALUES
('FOR', 'Forest ecosystem monitoring', 'FOR'),
('AGR', 'Agricultural ecosystem monitoring', 'AGR'),
('MIR', 'Mire/bog ecosystem monitoring', 'MIR'),
('LAK', 'Lake ecosystem monitoring', 'LAK'),
('WET', 'Wetland ecosystem monitoring', 'WET'),
('HEA', 'Heath ecosystem monitoring', 'HEA'),
('SFO', 'Sub-forest ecosystem monitoring', 'SFO'),
('CEM', 'Cemetery ecosystem monitoring', 'CEM');

`;

let stationInserts = [];
let platformInserts = [];
let instrumentInserts = [];
let roiInserts = [];

let stationId = 1;
let platformId = 1;
let instrumentId = 1;

for (const [stationKey, station] of Object.entries(stationsData.stations)) {
  // Insert station - use default coordinates for missing data (Sweden center: 62.0, 15.0)
  const lat = station.latitude || 62.0;
  const lng = station.longitude || 15.0;
  const description = escapeSql(station.description || '');
  const displayName = escapeSql(station.display_name || station.name || stationKey);
  const status = escapeSql(station.status || 'Active');
  const country = escapeSql(station.country || 'Sweden');

  stationInserts.push(`(${stationId}, '${escapeSql(station.normalized_name)}', '${displayName}', '${escapeSql(station.acronym)}', '${status}', '${country}', ${lat}, ${lng}, NULL, '${description}')`);

  // Process platforms
  if (station.phenocams && station.phenocams.platforms) {
    for (const [platformKey, platform] of Object.entries(station.phenocams.platforms)) {
      let platLat = 'NULL';
      let platLng = 'NULL';

      // Handle different coordinate formats
      if (platform.latitude && platform.longitude) {
        platLat = platform.latitude;
        platLng = platform.longitude;
      } else if (platform.geolocation && platform.geolocation.point) {
        platLat = platform.geolocation.point.latitude_dd || 'NULL';
        platLng = platform.geolocation.point.longitude_dd || 'NULL';
      }

      const platformHeight = platform.platform_height_m || platform.platform_height_in_meters_above_ground || 'NULL';
      const mountingStructure = escapeSql(platform.mounting_structure || platform.platform_mounting_structure || '');
      const deploymentDate = platform.deployment_date || platform.platform_deployment_date || 'NULL';
      const platformStatus = escapeSql(platform.status || 'Active');
      const locationCode = escapeSql(platform.location_code || platform.location || '');
      const displayName = escapeSql(platform.display_name || platform.given_name || platformKey);
      const description = escapeSql(platform.description || platform.platform_description || '');

      const normalizedName = escapeSql(platform.normalized_name || platformKey);
      platformInserts.push(`(${platformId}, ${stationId}, '${normalizedName}', '${displayName}', '${locationCode}', '${mountingStructure}', ${platformHeight}, '${platformStatus}', ${platLat}, ${platLng}, ${deploymentDate === 'NULL' ? 'NULL' : `'${deploymentDate}'`}, '${description}')`);

      // Process instruments
      if (platform.instruments) {
        for (const [instrumentKey, instrument] of Object.entries(platform.instruments)) {
          let instLat = 'NULL';
          let instLng = 'NULL';

          // Handle different coordinate formats
          if (instrument.latitude && instrument.longitude) {
            instLat = instrument.latitude;
            instLng = instrument.longitude;
          } else if (instrument.geolocation && instrument.geolocation.point) {
            instLat = instrument.geolocation.point.latitude_dd || 'NULL';
            instLng = instrument.geolocation.point.longitude_dd || 'NULL';
          }

          const instrumentHeight = instrument.instrument_height_m || instrument.instrument_height_in_meters_above_ground || 'NULL';
          const viewingDirection = escapeSql(instrument.viewing_direction || instrument.instrument_viewing_direction || '');
          let azimuth = instrument.azimuth_degrees || instrument.instrument_azimuth_in_degrees || 'NULL';
          if (azimuth !== 'NULL' && azimuth.toString().includes('?')) {
            azimuth = 'NULL';
          }
          const ecosystemCode = escapeSql(instrument.ecosystem_code || instrument.ecosystem || '');
          const instrumentStatus = escapeSql(instrument.status || 'Active');
          const deployDate = instrument.deployment_date || 'NULL';
          const displayName = escapeSql(instrument.display_name || instrumentKey);
          const description = escapeSql(instrument.description || '');
          const installationNotes = escapeSql(instrument.installation_notes || '');
          const maintenanceNotes = escapeSql(instrument.maintenance_notes || '');
          const instrumentNumber = escapeSql(instrument.instrument_number || '');

          // Camera specifications
          let cameraBrand = '';
          let cameraModel = '';
          let cameraResolution = '';
          let cameraSerial = '';

          if (instrument.camera_specifications) {
            cameraBrand = escapeSql(instrument.camera_specifications.brand || '');
            cameraModel = escapeSql(instrument.camera_specifications.model || '');
            cameraResolution = escapeSql(instrument.camera_specifications.resolution || '');
            cameraSerial = escapeSql(instrument.camera_specifications.serial_number || '');
          }

          // Measurement timeline
          let firstYear = 'NULL';
          let lastYear = 'NULL';
          let measurementStatus = '';

          if (instrument.measurement_timeline) {
            firstYear = instrument.measurement_timeline.first_measurement_year || 'NULL';
            lastYear = instrument.measurement_timeline.last_measurement_year || 'NULL';
            measurementStatus = escapeSql(instrument.measurement_timeline.measurement_status || '');
          }

          const normalizedName = escapeSql(instrument.normalized_name || instrumentKey);
          const instrumentType = escapeSql(instrument.instrument_type || instrument.type || 'phenocam');
          instrumentInserts.push(`(${instrumentId}, ${platformId}, '${normalizedName}', '${displayName}', '${instrument.legacy_acronym || ''}', '${instrumentType}', '${ecosystemCode}', '${instrumentNumber}', '${instrumentStatus}', ${deployDate === 'NULL' ? 'NULL' : `'${deployDate}'`}, ${instLat}, ${instLng}, ${instrumentHeight}, '${viewingDirection}', ${azimuth}, NULL, '${cameraBrand}', '${cameraModel}', '${cameraResolution}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '${cameraSerial}', ${firstYear}, ${lastYear}, '${measurementStatus}', '${description}', '${installationNotes}', '${maintenanceNotes}', NULL)`);

          instrumentId++;
        }
      }

      platformId++;
    }
  }

  stationId++;
}

// Generate SQL
sql += `-- Insert stations\n`;
sql += `INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description) VALUES\n`;
sql += stationInserts.join(',\n') + ';\n\n';

sql += `-- Insert platforms\n`;
sql += `INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES\n`;
sql += platformInserts.join(',\n') + ';\n\n';

sql += `-- Insert instruments\n`;
sql += `INSERT INTO instruments (id, platform_id, normalized_name, display_name, legacy_acronym, instrument_type, ecosystem_code, instrument_number, status, deployment_date, latitude, longitude, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, camera_brand, camera_model, camera_resolution, camera_mega_pixels, camera_lens, camera_focal_length_mm, camera_aperture, camera_exposure_time, camera_iso, camera_white_balance, camera_serial_number, first_measurement_year, last_measurement_year, measurement_status, description, installation_notes, maintenance_notes, rois) VALUES\n`;
sql += instrumentInserts.join(',\n') + ';\n\n';

// Write to file
const outputPath = path.join(__dirname, '../migrations/import_real_stations_data.sql');
fs.writeFileSync(outputPath, sql);

console.log(`Generated SQL migration: ${outputPath}`);
console.log(`Stations: ${stationInserts.length}`);
console.log(`Platforms: ${platformInserts.length}`);
console.log(`Instruments: ${instrumentInserts.length}`);