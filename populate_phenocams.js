// Phenocams database population script
// Reads stations.yaml and populates the phenocams table

import yaml from 'js-yaml';
import fs from 'fs';

// Read and parse phenocams YAML file
const phenocamsYaml = fs.readFileSync('/home/jobelund/lu2024-12-46/SITES/Spectral/apps/stations_dev/stations.yaml', 'utf8');
const phenocamsData = yaml.load(phenocamsYaml);

// Station acronym mapping to database IDs
const stationMapping = {
  'ANS': 1, // Abisko
  'GRI': 2, // Grimsö
  'LON': 3, // Lönnstorp
  'RBD': 4, // Röbäcksdalen
  'SKC': 5, // Skogaryd
  'SVB': 6, // Svartberget
  'ASA': 7, // Asa
  'HTM': 8, // Hyltemossa
  'TAR': 9  // Tarfala
};

// Function to escape single quotes and clean SQL strings
function escapeSQL(str) {
  if (!str) return 'NULL';
  if (typeof str === 'string') {
    // Clean question marks and other problematic characters
    const cleaned = str.replace(/\?/g, '').replace(/'/g, "''");
    return `'${cleaned}'`;
  }
  return str;
}

// Function to convert value to SQL format
function toSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'string') {
    // Clean question marks from strings that might be numbers
    if (value.includes('?')) {
      const cleanValue = value.replace(/\?/g, '');
      // Check if it's a number after cleaning
      const num = parseFloat(cleanValue);
      if (!isNaN(num)) return num;
    }
    return escapeSQL(value);
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'object') return escapeSQL(JSON.stringify(value));
  return escapeSQL(String(value));
}

// Generate SQL INSERT statements for phenocams
function generatePhenocamSQL() {
  const phenocams = [];
  
  console.log('Processing phenocams data...');
  
  for (const [stationKey, stationData] of Object.entries(phenocamsData.stations)) {
    const stationId = stationMapping[stationData.acronym];
    if (!stationId) {
      console.warn(`Station ${stationData.acronym} not found in mapping`);
      continue;
    }
    
    console.log(`Processing station: ${stationData.name} (${stationData.acronym})`);
    
    if (stationData.phenocams && stationData.phenocams.platforms) {
      for (const [platformKey, platformData] of Object.entries(stationData.phenocams.platforms)) {
        if (platformData.instruments) {
          for (const [instrumentKey, instrument] of Object.entries(platformData.instruments)) {
            console.log(`  - Processing instrument: ${instrument.id}`);
            
            phenocams.push({
              station_id: stationId,
              canonical_id: instrument.id,
              legacy_acronym: instrument.legacy_acronym || null,
              ecosystem: instrument.ecosystem,
              location: instrument.location,
              instrument_number: instrument.instrument_number,
              status: instrument.status,
              deployment_date: instrument.deployment_date,
              platform_mounting_structure: instrument.platform_mounting_structure,
              platform_height_m: instrument.platform_height_in_meters_above_ground,
              latitude: instrument.geolocation?.point?.latitude_dd,
              longitude: instrument.geolocation?.point?.longitude_dd,
              epsg: instrument.geolocation?.point?.epsg || 'epsg:4326',
              geolocation_notes: instrument.geolocation?.point?.notes,
              instrument_height_m: instrument.instrument_height_in_meters_above_ground,
              viewing_direction: instrument.instrument_viewing_direction,
              azimuth_degrees: instrument.instrument_azimuth_in_degrees,
              degrees_from_nadir: instrument.instrument_degrees_from_nadir,
              rois_data: instrument.rois ? JSON.stringify(instrument.rois) : null,
              legacy_rois_data: instrument.legacy_phenocam_rois ? JSON.stringify(instrument.legacy_phenocam_rois) : null
            });
          }
        }
      }
    }
  }
  
  return phenocams;
}

// Generate SQL INSERT statements
const phenocams = generatePhenocamSQL();
console.log(`\nFound ${phenocams.length} phenocam instruments total`);

// Generate the SQL commands
const insertCommands = [];

for (const phenocam of phenocams) {
  const insertSQL = `INSERT INTO phenocams (
    station_id, canonical_id, legacy_acronym, ecosystem, location, instrument_number, status, deployment_date,
    platform_mounting_structure, platform_height_m, latitude, longitude, epsg, geolocation_notes,
    instrument_height_m, viewing_direction, azimuth_degrees, degrees_from_nadir, rois_data, legacy_rois_data
  ) VALUES (
    ${phenocam.station_id},
    ${toSQL(phenocam.canonical_id)},
    ${toSQL(phenocam.legacy_acronym)},
    ${toSQL(phenocam.ecosystem)},
    ${toSQL(phenocam.location)},
    ${toSQL(phenocam.instrument_number)},
    ${toSQL(phenocam.status)},
    ${toSQL(phenocam.deployment_date)},
    ${toSQL(phenocam.platform_mounting_structure)},
    ${phenocam.platform_height_m || 'NULL'},
    ${phenocam.latitude || 'NULL'},
    ${phenocam.longitude || 'NULL'},
    ${toSQL(phenocam.epsg)},
    ${toSQL(phenocam.geolocation_notes)},
    ${phenocam.instrument_height_m || 'NULL'},
    ${toSQL(phenocam.viewing_direction)},
    ${phenocam.azimuth_degrees || 'NULL'},
    ${phenocam.degrees_from_nadir || 'NULL'},
    ${toSQL(phenocam.rois_data)},
    ${toSQL(phenocam.legacy_rois_data)}
  );`;
  
  insertCommands.push(insertSQL);
}

// Write SQL commands to file
const sqlContent = insertCommands.join('\n\n');
fs.writeFileSync('/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/spectral-stations-instruments/phenocams_data.sql', sqlContent);

console.log(`\nGenerated SQL file with ${insertCommands.length} INSERT statements`);
console.log('File saved as: phenocams_data.sql');

// Summary by station
const summary = {};
for (const phenocam of phenocams) {
  const stationName = Object.entries(stationMapping).find(([k, v]) => v === phenocam.station_id)?.[0];
  summary[stationName] = (summary[stationName] || 0) + 1;
}

console.log('\nPhenocam summary by station:');
for (const [station, count] of Object.entries(summary)) {
  console.log(`${station}: ${count} phenocams`);
}

console.log('\nEcosystem distribution:');
const ecosystems = {};
for (const phenocam of phenocams) {
  ecosystems[phenocam.ecosystem] = (ecosystems[phenocam.ecosystem] || 0) + 1;
}
for (const [eco, count] of Object.entries(ecosystems)) {
  console.log(`${eco}: ${count}`);
}