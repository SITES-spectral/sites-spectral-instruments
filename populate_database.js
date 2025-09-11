// Database population script for SITES Spectral instruments
// This script reads YAML files and populates the D1 database

import yaml from 'js-yaml';
import fs from 'fs';

// Read and parse YAML files
const phenocamsYaml = fs.readFileSync('/home/jobelund/lu2024-12-46/SITES/Spectral/apps/stations_dev/stations.yaml', 'utf8');
const mspectralYaml = fs.readFileSync('/home/jobelund/lu2024-12-46/SITES/Spectral/apps/stations_dev/stations_mspectral.yaml', 'utf8');

const phenocamsData = yaml.load(phenocamsYaml);
const mspectralData = yaml.load(mspectralYaml);

// Station acronym mapping to resolve SKC/SKG conflict
const stationMapping = {
  'ANS': 1, // Abisko
  'GRI': 2, // Grimsö
  'LON': 3, // Lönnstorp
  'RBD': 4, // Röbäcksdalen
  'SKC': 5, // Skogaryd (phenocams use SKC)
  'SKG': 5, // Skogaryd (mspectral uses SKG, same station)
  'SVB': 6, // Svartberget
  'ASA': 7, // Asa
  'HTM': 8, // Hyltemossa
  'TAR': 9  // Tarfala
};

// Generate SQL INSERT statements
function generateInstrumentSQL() {
  const instruments = [];
  
  // Process phenocams data
  console.log('Processing phenocams data...');
  for (const [stationKey, stationData] of Object.entries(phenocamsData.stations)) {
    const stationId = stationMapping[stationData.acronym];
    if (!stationId) {
      console.warn(`Station ${stationData.acronym} not found in mapping`);
      continue;
    }
    
    if (stationData.phenocams && stationData.phenocams.platforms) {
      for (const [platformKey, platformData] of Object.entries(stationData.phenocams.platforms)) {
        if (platformData.instruments) {
          for (const [instrumentKey, instrument] of Object.entries(platformData.instruments)) {
            instruments.push({
              station_id: stationId,
              canonical_id: instrument.id,
              legacy_name: instrument.legacy_acronym || null,
              instrument_type: 'phenocam',
              ecosystem: instrument.ecosystem,
              platform_code: instrument.location,
              instrument_number: instrument.instrument_number,
              status: instrument.status,
              deployment_date: instrument.deployment_date,
              platform_mounting_structure: instrument.platform_mounting_structure,
              platform_height_m: instrument.platform_height_in_meters_above_ground,
              instrument_height_m: instrument.instrument_height_in_meters_above_ground,
              viewing_direction: instrument.instrument_viewing_direction,
              azimuth_degrees: instrument.instrument_azimuth_in_degrees,
              degrees_from_nadir: instrument.instrument_degrees_from_nadir,
              latitude: instrument.geolocation?.point?.latitude_dd,
              longitude: instrument.geolocation?.point?.longitude_dd,
              geolocation_notes: instrument.geolocation?.point?.notes || null
            });
          }
        }
      }
    }
  }
  
  // Process multispectral data
  console.log('Processing multispectral data...');
  for (const [stationKey, stationData] of Object.entries(mspectralData.stations)) {
    const stationId = stationMapping[stationData.acronym];
    if (!stationId) {
      console.warn(`Station ${stationData.acronym} not found in mapping`);
      continue;
    }
    
    if (stationData.multispectral && stationData.multispectral.instruments) {
      for (const [instrumentKey, instrument] of Object.entries(stationData.multispectral.instruments)) {
        instruments.push({
          station_id: stationId,
          canonical_id: instrument.id,
          legacy_name: instrument.legacy_name || null,
          instrument_type: 'fixed_sensor',
          ecosystem: instrument.ecosystem,
          platform_code: instrument.location,
          instrument_number: 'MS01', // Default for multispectral
          status: instrument.status,
          deployment_date: instrument.deployment_date,
          platform_mounting_structure: null, // Not provided in mspectral data
          platform_height_m: null,
          instrument_height_m: null,
          viewing_direction: null,
          azimuth_degrees: null,
          degrees_from_nadir: null,
          latitude: null, // Missing geolocation data in mspectral
          longitude: null,
          geolocation_notes: null,
          sensor_type: instrument.sensor_type || null,
          wavelengths: instrument.wavelengths ? JSON.stringify(instrument.wavelengths) : null,
          sensor_pairs: instrument.sensor_pairs ? JSON.stringify(instrument.sensor_pairs) : null
        });
      }
    }
  }
  
  return instruments;
}

// Generate SQL INSERT statements
const instruments = generateInstrumentSQL();
console.log(`Found ${instruments.length} instruments total`);

// Generate the SQL commands
const insertCommands = [];

for (const instrument of instruments) {
  const values = [
    instrument.station_id,
    `'${instrument.canonical_id}'`,
    instrument.legacy_name ? `'${instrument.legacy_name}'` : 'NULL',
    `'${instrument.instrument_type}'`,
    `'${instrument.ecosystem}'`,
    instrument.platform_code ? `'${instrument.platform_code}'` : 'NULL',
    instrument.instrument_number ? `'${instrument.instrument_number}'` : 'NULL',
    `'${instrument.status}'`,
    instrument.deployment_date ? `'${instrument.deployment_date}'` : 'NULL',
    instrument.platform_mounting_structure ? `'${instrument.platform_mounting_structure.replace(/'/g, "''")}'` : 'NULL',
    instrument.platform_height_m || 'NULL',
    instrument.instrument_height_m || 'NULL',
    instrument.viewing_direction ? `'${instrument.viewing_direction.replace(/'/g, "''")}'` : 'NULL',
    instrument.azimuth_degrees || 'NULL',
    instrument.degrees_from_nadir || 'NULL',
    instrument.latitude || 'NULL',
    instrument.longitude || 'NULL',
    instrument.geolocation_notes ? `'${instrument.geolocation_notes.replace(/'/g, "''")}'` : 'NULL',
    instrument.sensor_type ? `'${instrument.sensor_type}'` : 'NULL',
    instrument.wavelengths ? `'${instrument.wavelengths}'` : 'NULL',
    instrument.sensor_pairs ? `'${instrument.sensor_pairs}'` : 'NULL'
  ];
  
  const insertSQL = `INSERT INTO instruments (station_id, canonical_id, legacy_name, instrument_type, ecosystem, platform_code, instrument_number, status, deployment_date, platform_mounting_structure, platform_height_m, instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, latitude, longitude, geolocation_notes, sensor_type, wavelengths, sensor_pairs) VALUES (${values.join(', ')});`;
  insertCommands.push(insertSQL);
}

// Write SQL commands to file
const sqlContent = insertCommands.join('\n\n');
fs.writeFileSync('/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/spectral-stations-instruments/instruments_data.sql', sqlContent);

console.log(`\nGenerated SQL file with ${insertCommands.length} INSERT statements`);
console.log('File saved as: instruments_data.sql');

// Summary by station and type
const summary = {};
for (const instrument of instruments) {
  const stationName = Object.entries(stationMapping).find(([k, v]) => v === instrument.station_id)?.[0];
  const key = `${stationName}_${instrument.instrument_type}`;
  summary[key] = (summary[key] || 0) + 1;
}

console.log('\nInstrument summary by station and type:');
for (const [key, count] of Object.entries(summary)) {
  console.log(`${key}: ${count}`);
}