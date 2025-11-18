/**
 * Seed Sensor Models Script
 *
 * Pre-populates the sensor_models table with common multispectral sensors
 * used in SITES Spectral network.
 *
 * Usage: node scripts/seed_sensor_models.js
 */

import { execSync } from 'child_process';

/**
 * Common sensor models in SITES Spectral network
 */
const sensorModels = [
  {
    manufacturer: 'SKYE',
    model_number: 'SKR 1800',
    model_name: 'SKR 1800 2-4 Channel Light Sensor',
    sensor_type: 'Multispectral',
    wavelength_range_min_nm: 400,
    wavelength_range_max_nm: 1050,
    available_channels_config: JSON.stringify([
      [645, 850],          // 2-channel config: Red, NIR
      [530, 645, 850],     // 3-channel config: Green, Red, NIR
      [450, 530, 645, 850] // 4-channel config: Blue, Green, Red, NIR
    ]),
    field_of_view_degrees: 180,
    angular_response: 'Cosine corrected',
    cosine_response: 'f2 < 3% (0-70°)',
    spectral_sensitivity_curve: null,
    temperature_coefficient: -0.05,
    calibration_procedure: 'Factory calibration against reference standard',
    factory_calibration_interval_months: 24,
    recalibration_requirements: 'Recommended every 2 years or after significant environmental exposure',
    typical_calibration_coefficients: null,
    dimensions_mm: JSON.stringify({ diameter: 100, height: 35 }),
    weight_grams: 250,
    cable_types: '4-core screened cable',
    connector_type: 'IP68 waterproof connector',
    power_requirements: null,
    ip_rating: 'IP68',
    operating_temp_min_c: -40,
    operating_temp_max_c: 70,
    manufacturer_website_url: 'https://www.skyeinstruments.com',
    specification_sheet_url: 'https://www.alliance-technologies.net/app/uploads/2019/04/2-CHANNEL-LIGHT-SENSOR-SKR-1800-v21.pdf',
    user_manual_url: null,
    notes: 'Popular 2-4 channel multispectral sensor. Bandwidth options: 10nm (narrow), 40nm (wide).'
  },
  {
    manufacturer: 'SKYE',
    model_number: 'SKR 110',
    model_name: 'SKR 110 PAR Quantum Sensor',
    sensor_type: 'PAR',
    wavelength_range_min_nm: 400,
    wavelength_range_max_nm: 700,
    available_channels_config: JSON.stringify([[400, 700]]), // Single PAR channel
    field_of_view_degrees: 180,
    angular_response: 'Cosine corrected',
    cosine_response: 'f2 < 3% (0-70°)',
    spectral_sensitivity_curve: null,
    temperature_coefficient: null,
    calibration_procedure: 'Factory calibration against quantum standard',
    factory_calibration_interval_months: 24,
    recalibration_requirements: 'Recommended every 2 years',
    typical_calibration_coefficients: null,
    dimensions_mm: JSON.stringify({ diameter: 24, height: 25 }),
    weight_grams: 100,
    cable_types: '2-core screened cable',
    connector_type: 'IP68 waterproof connector',
    power_requirements: null,
    ip_rating: 'IP68',
    operating_temp_min_c: -40,
    operating_temp_max_c: 70,
    manufacturer_website_url: 'https://www.skyeinstruments.com',
    specification_sheet_url: null,
    user_manual_url: null,
    notes: 'PAR (Photosynthetically Active Radiation) sensor, 400-700nm range.'
  },
  {
    manufacturer: 'PP Systems',
    model_number: 'SRS-NR',
    model_name: 'Red/Far-Red Sensor',
    sensor_type: 'Multispectral',
    wavelength_range_min_nm: 660,
    wavelength_range_max_nm: 730,
    available_channels_config: JSON.stringify([[660, 730]]), // Red and Far-Red
    field_of_view_degrees: 180,
    angular_response: 'Cosine corrected',
    cosine_response: null,
    spectral_sensitivity_curve: null,
    temperature_coefficient: null,
    calibration_procedure: 'Factory calibration',
    factory_calibration_interval_months: 24,
    recalibration_requirements: 'Recommended every 2 years',
    typical_calibration_coefficients: null,
    dimensions_mm: null,
    weight_grams: null,
    cable_types: null,
    connector_type: null,
    power_requirements: '12V DC',
    ip_rating: null,
    operating_temp_min_c: -20,
    operating_temp_max_c: 50,
    manufacturer_website_url: 'https://ppsystems.com',
    specification_sheet_url: 'https://ppsystems.com/wp-content/uploads/RedFarRedSensor.pdf',
    user_manual_url: null,
    notes: '2-channel sensor for Red (~660nm) and Far-Red (~730nm) measurements. Used for phytochrome studies.'
  },
  {
    manufacturer: 'DECAGON',
    model_number: 'SRS-NR',
    model_name: 'SRS NDVI Sensor',
    sensor_type: 'NDVI',
    wavelength_range_min_nm: 650,
    wavelength_range_max_nm: 810,
    available_channels_config: JSON.stringify([[650, 810]]), // Red and NIR
    field_of_view_degrees: 36,
    angular_response: null,
    cosine_response: null,
    spectral_sensitivity_curve: null,
    temperature_coefficient: null,
    calibration_procedure: 'Factory calibration',
    factory_calibration_interval_months: 24,
    recalibration_requirements: 'Recommended every 2 years',
    typical_calibration_coefficients: null,
    dimensions_mm: JSON.stringify({ length: 100, width: 60, height: 40 }),
    weight_grams: 150,
    cable_types: '3.5mm stereo plug',
    connector_type: '3.5mm stereo plug',
    power_requirements: null,
    ip_rating: 'IP68',
    operating_temp_min_c: -40,
    operating_temp_max_c: 60,
    manufacturer_website_url: 'https://www.metergroup.com',
    specification_sheet_url: null,
    user_manual_url: null,
    notes: 'NDVI sensor with Red (650nm) and NIR (810nm) channels. Now part of METER Group.'
  },
  {
    manufacturer: 'APOGEE',
    model_number: 'SRS-NR',
    model_name: 'SRS NDVI Sensor',
    sensor_type: 'NDVI',
    wavelength_range_min_nm: 650,
    wavelength_range_max_nm: 810,
    available_channels_config: JSON.stringify([[650, 810]]), // Red and NIR
    field_of_view_degrees: 36,
    angular_response: null,
    cosine_response: null,
    spectral_sensitivity_curve: null,
    temperature_coefficient: null,
    calibration_procedure: 'Factory calibration',
    factory_calibration_interval_months: 24,
    recalibration_requirements: 'Recommended every 2 years',
    typical_calibration_coefficients: null,
    dimensions_mm: JSON.stringify({ length: 100, diameter: 24 }),
    weight_grams: 90,
    cable_types: 'Shielded twisted pair',
    connector_type: 'Pigtail leads',
    power_requirements: null,
    ip_rating: 'IP68',
    operating_temp_min_c: -40,
    operating_temp_max_c: 70,
    manufacturer_website_url: 'https://www.apogeeinstruments.com',
    specification_sheet_url: null,
    user_manual_url: null,
    notes: 'NDVI sensor for vegetation monitoring. Red (650nm ±10nm) and NIR (810nm ±10nm).'
  },
  {
    manufacturer: 'APOGEE',
    model_number: 'SQ-500',
    model_name: 'SQ-500 Full Spectrum Quantum Sensor',
    sensor_type: 'PAR',
    wavelength_range_min_nm: 389,
    wavelength_range_max_nm: 692,
    available_channels_config: JSON.stringify([[389, 692]]), // Full spectrum PAR
    field_of_view_degrees: 180,
    angular_response: 'Cosine corrected',
    cosine_response: '± 5% at 75° zenith angle',
    spectral_sensitivity_curve: null,
    temperature_coefficient: null,
    calibration_procedure: 'Factory calibration against NIST-traceable standard',
    factory_calibration_interval_months: 24,
    recalibration_requirements: 'Recommended every 2 years',
    typical_calibration_coefficients: null,
    dimensions_mm: JSON.stringify({ diameter: 24, height: 27 }),
    weight_grams: 90,
    cable_types: 'Shielded twisted pair',
    connector_type: 'Pigtail leads',
    power_requirements: null,
    ip_rating: 'IP68',
    operating_temp_min_c: -40,
    operating_temp_max_c: 70,
    manufacturer_website_url: 'https://www.apogeeinstruments.com',
    specification_sheet_url: null,
    user_manual_url: null,
    notes: 'Full spectrum quantum sensor for PAR measurements. Improved spectral response compared to traditional PAR sensors.'
  },
  {
    manufacturer: 'APOGEE',
    model_number: 'SRS-PRI',
    model_name: 'SRS PRI Sensor',
    sensor_type: 'PRI',
    wavelength_range_min_nm: 531,
    wavelength_range_max_nm: 570,
    available_channels_config: JSON.stringify([[531, 570]]), // PRI channels
    field_of_view_degrees: 28,
    angular_response: null,
    cosine_response: null,
    spectral_sensitivity_curve: null,
    temperature_coefficient: null,
    calibration_procedure: 'Factory calibration',
    factory_calibration_interval_months: 24,
    recalibration_requirements: 'Recommended every 2 years',
    typical_calibration_coefficients: null,
    dimensions_mm: JSON.stringify({ length: 100, diameter: 24 }),
    weight_grams: 90,
    cable_types: 'Shielded twisted pair',
    connector_type: 'Pigtail leads',
    power_requirements: null,
    ip_rating: 'IP68',
    operating_temp_min_c: -40,
    operating_temp_max_c: 70,
    manufacturer_website_url: 'https://www.apogeeinstruments.com',
    specification_sheet_url: null,
    user_manual_url: null,
    notes: 'Photochemical Reflectance Index (PRI) sensor with 531nm and 570nm channels for stress detection.'
  },
  {
    manufacturer: 'LICOR',
    model_number: 'LI-190R',
    model_name: 'LI-190R Quantum Sensor',
    sensor_type: 'PAR',
    wavelength_range_min_nm: 400,
    wavelength_range_max_nm: 700,
    available_channels_config: JSON.stringify([[400, 700]]), // PAR range
    field_of_view_degrees: 180,
    angular_response: 'Cosine corrected',
    cosine_response: '± 1% at 0-80° zenith angle',
    spectral_sensitivity_curve: null,
    temperature_coefficient: null,
    calibration_procedure: 'Factory calibration against NIST-traceable standard',
    factory_calibration_interval_months: 24,
    recalibration_requirements: 'Recommended every 2 years',
    typical_calibration_coefficients: null,
    dimensions_mm: JSON.stringify({ diameter: 24, height: 27 }),
    weight_grams: 110,
    cable_types: 'Shielded cable',
    connector_type: 'BNC connector',
    power_requirements: null,
    ip_rating: 'IP68',
    operating_temp_min_c: -40,
    operating_temp_max_c: 65,
    manufacturer_website_url: 'https://www.licor.com',
    specification_sheet_url: null,
    user_manual_url: null,
    notes: 'High-quality PAR sensor with excellent cosine response. Industry standard for light measurements.'
  }
];

/**
 * Execute SQL command via wrangler
 */
function executeSql(sql) {
  try {
    const command = `npx wrangler d1 execute spectral_stations_db --remote --command="${sql.replace(/"/g, '\\"')}"`;
    const result = execSync(command, { encoding: 'utf-8' });
    return result;
  } catch (error) {
    console.error('SQL Error:', error.message);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedSensorModels() {
  console.log('🌱 Starting sensor models seed...\n');

  let inserted = 0;
  let skipped = 0;

  for (const model of sensorModels) {
    console.log(`Processing ${model.manufacturer} ${model.model_number}...`);

    // Check if model already exists
    const checkSql = `SELECT id FROM sensor_models WHERE model_number = '${model.model_number.replace(/'/g, "''")}' AND manufacturer = '${model.manufacturer}';`;

    try {
      const existing = executeSql(checkSql);

      if (existing.includes('Results')) {
        // Parse result to see if we got rows
        const hasResults = !existing.includes('Rows: 0');

        if (hasResults) {
          console.log(`  ⏭️  Skipped (already exists)\n`);
          skipped++;
          continue;
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Error checking existence, attempting insert anyway...`);
    }

    // Build INSERT statement
    const insertSql = `
      INSERT INTO sensor_models (
        manufacturer, model_number, model_name, sensor_type,
        wavelength_range_min_nm, wavelength_range_max_nm,
        available_channels_config, field_of_view_degrees,
        angular_response, cosine_response, spectral_sensitivity_curve,
        temperature_coefficient, calibration_procedure,
        factory_calibration_interval_months, recalibration_requirements,
        typical_calibration_coefficients, dimensions_mm, weight_grams,
        cable_types, connector_type, power_requirements, ip_rating,
        operating_temp_min_c, operating_temp_max_c,
        manufacturer_website_url, specification_sheet_url,
        user_manual_url, notes,
        created_at, updated_at
      ) VALUES (
        '${sqlEscape(model.manufacturer)}',
        '${sqlEscape(model.model_number)}',
        ${sqlValue(model.model_name)},
        ${sqlValue(model.sensor_type)},
        ${model.wavelength_range_min_nm},
        ${model.wavelength_range_max_nm},
        ${sqlValue(model.available_channels_config)},
        ${model.field_of_view_degrees},
        ${sqlValue(model.angular_response)},
        ${sqlValue(model.cosine_response)},
        ${sqlValue(model.spectral_sensitivity_curve)},
        ${model.temperature_coefficient || 'NULL'},
        ${sqlValue(model.calibration_procedure)},
        ${model.factory_calibration_interval_months},
        ${sqlValue(model.recalibration_requirements)},
        ${sqlValue(model.typical_calibration_coefficients)},
        ${sqlValue(model.dimensions_mm)},
        ${model.weight_grams || 'NULL'},
        ${sqlValue(model.cable_types)},
        ${sqlValue(model.connector_type)},
        ${sqlValue(model.power_requirements)},
        ${sqlValue(model.ip_rating)},
        ${model.operating_temp_min_c || 'NULL'},
        ${model.operating_temp_max_c || 'NULL'},
        ${sqlValue(model.manufacturer_website_url)},
        ${sqlValue(model.specification_sheet_url)},
        ${sqlValue(model.user_manual_url)},
        ${sqlValue(model.notes)},
        datetime('now'),
        datetime('now')
      );
    `.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    try {
      executeSql(insertSql);
      console.log(`  ✅ Inserted successfully\n`);
      inserted++;
    } catch (error) {
      console.error(`  ❌ Failed to insert: ${error.message}\n`);
    }
  }

  console.log('\n📊 Seed Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   📦 Total:    ${sensorModels.length}\n`);
}

/**
 * Helper: Escape single quotes for SQL
 */
function sqlEscape(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/'/g, "''");
}

/**
 * Helper: Format value for SQL
 */
function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${sqlEscape(value)}'`;
}

// Run the seed
seedSensorModels().catch(console.error);
