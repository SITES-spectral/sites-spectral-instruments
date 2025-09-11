// Multispectral sensors database population script
// Combines YAML data with detailed CSV metadata

import yaml from 'js-yaml';
import fs from 'fs';

// Read and parse YAML file
const mspectralYaml = fs.readFileSync('/home/jobelund/lu2024-12-46/SITES/Spectral/apps/stations_dev/stations_mspectral.yaml', 'utf8');
const mspectralData = yaml.load(mspectralYaml);

// Read and parse CSV metadata
const csvData = fs.readFileSync('/home/jobelund/lu2024-12-46/SITES/Spectral/apps/stations_dev/metadata_shared_svartvergets_2025-04-17.csv', 'utf8');
const csvLines = csvData.split('\n');
const csvHeaders = csvLines[0].split(',').map(h => h.trim());

// Parse CSV data
const csvRecords = [];
for (let i = 1; i < csvLines.length; i++) {
  if (csvLines[i].trim()) {
    const values = csvLines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const record = {};
    csvHeaders.forEach((header, index) => {
      record[header] = values[index] || null;
    });
    csvRecords.push(record);
  }
}

console.log(`Parsed ${csvRecords.length} CSV records`);

// Station acronym mapping
const stationMapping = {
  'ANS': 1, // Abisko
  'GRI': 2, // Grimsö
  'LON': 3, // Lönnstorp
  'RBD': 4, // Röbäcksdalen
  'SKG': 5, // Skogaryd (note: mspectral uses SKG)
  'SVB': 6, // Svartberget
  'ASA': 7, // Asa
  'HTM': 8, // Hyltemossa
  'TAR': 9  // Tarfala
};

// Function to clean and escape SQL strings
function escapeSQL(str) {
  if (!str || str === 'null') return 'NULL';
  if (typeof str === 'string') {
    // Clean special characters and escape quotes
    const cleaned = str.replace(/"/g, '').replace(/'/g, "''").replace(/�/g, '');
    return `'${cleaned}'`;
  }
  return str;
}

// Function to convert value to SQL format
function toSQL(value) {
  if (value === null || value === undefined || value === '' || value === 'null') return 'NULL';
  if (typeof value === 'string') {
    // Try to parse as number first
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
    return escapeSQL(value);
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'object') return escapeSQL(JSON.stringify(value));
  return escapeSQL(String(value));
}

// Generate multispectral sensors data
function generateMspectralSQL() {
  const sensors = [];
  
  console.log('Processing multispectral YAML data...');
  
  // Process basic YAML data first
  for (const [stationKey, stationData] of Object.entries(mspectralData.stations)) {
    const stationId = stationMapping[stationData.acronym];
    if (!stationId) {
      console.warn(`Station ${stationData.acronym} not found in mapping`);
      continue;
    }
    
    console.log(`Processing station: ${stationData.name} (${stationData.acronym})`);
    
    if (stationData.multispectral && stationData.multispectral.instruments) {
      for (const [instrumentKey, instrument] of Object.entries(stationData.multispectral.instruments)) {
        console.log(`  - Processing instrument: ${instrument.id}`);
        
        // Find matching CSV records for this instrument
        const matchingCsvRecords = csvRecords.filter(csv => {
          // Try to match by legacy name or canonical ID
          return csv['Filename (SITES Convention)'] && 
                 (csv['Filename (SITES Convention)'].includes(instrument.legacy_name) ||
                  csv['Filename (SITES Convention)'].includes(instrument.id));
        });
        
        console.log(`    Found ${matchingCsvRecords.length} matching CSV records`);
        
        // If we have CSV data, create entries for each wavelength/parameter
        if (matchingCsvRecords.length > 0) {
          matchingCsvRecords.forEach((csvRecord, index) => {
            sensors.push({
              station_id: stationId,
              canonical_id: `${instrument.id}_${index + 1}`, // Add suffix for multiple wavelengths
              legacy_name: instrument.legacy_name,
              sensor_type: instrument.type,
              ecosystem: instrument.ecosystem,
              location: instrument.location,
              status: instrument.status,
              deployment_date: instrument.deployment_date,
              
              // From CSV metadata
              latitude: csvRecord['Lat (�)'] ? parseFloat(csvRecord['Lat (�)']) : null,
              longitude: csvRecord['Long (�)'] ? parseFloat(csvRecord['Long (�)']) : null,
              elevation_m: csvRecord['Height (m)'] ? parseFloat(csvRecord['Height (m)']) : null,
              
              brand: csvRecord['Brand'],
              model: csvRecord['Model'],
              serial_number: csvRecord['Serial number'],
              cable_length: csvRecord['Cable length'],
              honxiao_number: csvRecord['Honxiao number'],
              
              center_wavelength_nm: csvRecord['Centre wavelength (nm)'] ? parseFloat(csvRecord['Centre wavelength (nm)']) : null,
              bandwidth_nm: csvRecord['Bandwith (nm)'] ? parseFloat(csvRecord['Bandwith (nm)']) : null,
              field_of_view_degrees: csvRecord['Field of View (�)'] ? parseFloat(csvRecord['Field of View (�)']) : null,
              
              azimuth_degrees: csvRecord['Azimuth (�)'] ? parseFloat(csvRecord['Azimuth (�)']) : null,
              degrees_from_nadir: csvRecord['From nadir (�)'] ? parseFloat(csvRecord['From nadir (�)']) : null,
              measurement_type: csvRecord['Type'], // outgoing, incoming, etc.
              
              usage_type: csvRecord['Usage'], // PRI, NDVI, PAR, etc.
              parameter_names: csvRecord['Parameter names'],
              
              // From YAML
              wavelengths_nm: instrument.wavelengths ? JSON.stringify(instrument.wavelengths) : null,
              sensor_pairs: instrument.sensor_pairs ? JSON.stringify(instrument.sensor_pairs) : null,
              
              comments: csvRecord['Comments']
            });
          });
        } else {
          // No CSV data, just use YAML data
          sensors.push({
            station_id: stationId,
            canonical_id: instrument.id,
            legacy_name: instrument.legacy_name,
            sensor_type: instrument.type,
            ecosystem: instrument.ecosystem,
            location: instrument.location,
            status: instrument.status,
            deployment_date: instrument.deployment_date,
            
            // YAML-only fields
            wavelengths_nm: instrument.wavelengths ? JSON.stringify(instrument.wavelengths) : null,
            sensor_pairs: instrument.sensor_pairs ? JSON.stringify(instrument.sensor_pairs) : null,
            
            // NULL for missing CSV fields
            latitude: null,
            longitude: null,
            elevation_m: null,
            brand: null,
            model: null,
            serial_number: null,
            cable_length: null,
            honxiao_number: null,
            center_wavelength_nm: null,
            bandwidth_nm: null,
            field_of_view_degrees: null,
            azimuth_degrees: null,
            degrees_from_nadir: null,
            measurement_type: null,
            usage_type: null,
            parameter_names: null,
            comments: null
          });
        }
      }
    }
  }
  
  return sensors;
}

// Generate SQL INSERT statements
const sensors = generateMspectralSQL();
console.log(`\nFound ${sensors.length} multispectral sensor records total`);

// Generate the SQL commands
const insertCommands = [];

for (const sensor of sensors) {
  const insertSQL = `INSERT INTO mspectral_sensors (
    station_id, canonical_id, legacy_name, sensor_type, ecosystem, location, status, deployment_date,
    latitude, longitude, elevation_m, brand, model, serial_number, cable_length, honxiao_number,
    center_wavelength_nm, bandwidth_nm, field_of_view_degrees, azimuth_degrees, degrees_from_nadir,
    measurement_type, usage_type, parameter_names, wavelengths_nm, sensor_pairs, comments
  ) VALUES (
    ${sensor.station_id},
    ${toSQL(sensor.canonical_id)},
    ${toSQL(sensor.legacy_name)},
    ${toSQL(sensor.sensor_type)},
    ${toSQL(sensor.ecosystem)},
    ${toSQL(sensor.location)},
    ${toSQL(sensor.status)},
    ${toSQL(sensor.deployment_date)},
    ${sensor.latitude || 'NULL'},
    ${sensor.longitude || 'NULL'},
    ${sensor.elevation_m || 'NULL'},
    ${toSQL(sensor.brand)},
    ${toSQL(sensor.model)},
    ${toSQL(sensor.serial_number)},
    ${toSQL(sensor.cable_length)},
    ${toSQL(sensor.honxiao_number)},
    ${sensor.center_wavelength_nm || 'NULL'},
    ${sensor.bandwidth_nm || 'NULL'},
    ${sensor.field_of_view_degrees || 'NULL'},
    ${sensor.azimuth_degrees || 'NULL'},
    ${sensor.degrees_from_nadir || 'NULL'},
    ${toSQL(sensor.measurement_type)},
    ${toSQL(sensor.usage_type)},
    ${toSQL(sensor.parameter_names)},
    ${toSQL(sensor.wavelengths_nm)},
    ${toSQL(sensor.sensor_pairs)},
    ${toSQL(sensor.comments)}
  );`;
  
  insertCommands.push(insertSQL);
}

// Write SQL commands to file
const sqlContent = insertCommands.join('\n\n');
fs.writeFileSync('/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/spectral-stations-instruments/mspectral_data.sql', sqlContent);

console.log(`\nGenerated SQL file with ${insertCommands.length} INSERT statements`);
console.log('File saved as: mspectral_data.sql');

// Summary by station
const summary = {};
const usageTypes = {};
for (const sensor of sensors) {
  const stationName = Object.entries(stationMapping).find(([k, v]) => v === sensor.station_id)?.[0];
  summary[stationName] = (summary[stationName] || 0) + 1;
  
  if (sensor.usage_type) {
    usageTypes[sensor.usage_type] = (usageTypes[sensor.usage_type] || 0) + 1;
  }
}

console.log('\nMultispectral sensor summary by station:');
for (const [station, count] of Object.entries(summary)) {
  console.log(`${station}: ${count} sensors`);
}

console.log('\nUsage type distribution:');
for (const [usage, count] of Object.entries(usageTypes)) {
  console.log(`${usage}: ${count}`);
}