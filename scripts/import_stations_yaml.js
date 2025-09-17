#!/usr/bin/env node

// Import stations data from enhanced .secure/stations.yaml
// This script populates the new normalized database schema

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const YAML_FILE_PATH = path.join(__dirname, '../.secure/stations.yaml');
const SQL_OUTPUT_PATH = path.join(__dirname, '../migrations/0011_import_stations_data.sql');

// Utility functions
function escapeSQL(str) {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str.toString();
    if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
    return `'${str.toString().replace(/'/g, "''")}'`;
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === null) return 'NULL';
    return escapeSQL(dateStr);
}

function formatCoordinate(coord) {
    if (coord === null || coord === undefined || coord === '') return 'NULL';
    return parseFloat(coord);
}

function generateSQL() {
    console.log('Reading stations.yaml file...');

    // Read and parse YAML file
    let yamlData;
    try {
        const yamlContent = fs.readFileSync(YAML_FILE_PATH, 'utf8');
        yamlData = yaml.load(yamlContent);
    } catch (error) {
        console.error('Error reading YAML file:', error.message);
        process.exit(1);
    }

    const sqlStatements = [];

    // Add header comment
    sqlStatements.push('-- Import Stations Data from Enhanced YAML');
    sqlStatements.push('-- Generated: ' + new Date().toISOString());
    sqlStatements.push('-- Source: .secure/stations.yaml');
    sqlStatements.push('');

    // Clear existing data
    sqlStatements.push('-- Clear existing data (cascading deletes will handle related tables)');
    sqlStatements.push('DELETE FROM stations;');
    sqlStatements.push('');

    // Reset auto-increment counters
    sqlStatements.push('-- Reset auto-increment counters');
    sqlStatements.push('DELETE FROM sqlite_sequence WHERE name IN (\'stations\', \'platforms\', \'instruments\', \'instrument_rois\');');
    sqlStatements.push('');

    let stationIdCounter = 1;
    let platformIdCounter = 1;
    let instrumentIdCounter = 1;
    let roiIdCounter = 1;

    // Process each station
    const stations = yamlData.stations || {};

    for (const [stationKey, stationData] of Object.entries(stations)) {
        console.log(`Processing station: ${stationKey}`);

        // Insert station
        const stationSQL = `INSERT INTO stations (id, normalized_name, display_name, acronym, status, country, latitude, longitude, description) VALUES (
            ${stationIdCounter},
            ${escapeSQL(stationData.normalized_name)},
            ${escapeSQL(stationData.display_name || stationData.name)},
            ${escapeSQL(stationData.acronym)},
            ${escapeSQL(stationData.status || 'Active')},
            ${escapeSQL(stationData.country || 'Sweden')},
            ${formatCoordinate(stationData.latitude)},
            ${formatCoordinate(stationData.longitude)},
            ${escapeSQL(stationData.description)}
        );`;

        sqlStatements.push(`-- Station: ${stationData.display_name || stationData.name} (${stationData.acronym})`);
        sqlStatements.push(stationSQL);
        sqlStatements.push('');

        // Process phenocam platforms and instruments
        const phenocams = stationData.phenocams || {};
        const platforms = phenocams.platforms || {};

        for (const [platformKey, platformData] of Object.entries(platforms)) {
            console.log(`  Processing platform: ${platformKey}`);

            // Insert platform
            const platformSQL = `INSERT INTO platforms (id, station_id, normalized_name, display_name, location_code, mounting_structure, platform_height_m, status, latitude, longitude, deployment_date, description) VALUES (
                ${platformIdCounter},
                ${stationIdCounter},
                ${escapeSQL(platformData.normalized_name || platformKey)},
                ${escapeSQL(platformData.display_name)},
                ${escapeSQL(platformData.location_code || platformData.location)},
                ${escapeSQL(platformData.mounting_structure || platformData.platform_mounting_structure)},
                ${formatCoordinate(platformData.platform_height_m || platformData.platform_height_in_meters_above_ground)},
                ${escapeSQL(platformData.status || 'Active')},
                ${formatCoordinate(platformData.latitude || (platformData.geolocation && platformData.geolocation.point && platformData.geolocation.point.latitude_dd))},
                ${formatCoordinate(platformData.longitude || (platformData.geolocation && platformData.geolocation.point && platformData.geolocation.point.longitude_dd))},
                ${formatDate(platformData.deployment_date || platformData.platform_deployment_date)},
                ${escapeSQL(platformData.description || platformData.platform_description)}
            );`;

            sqlStatements.push(`-- Platform: ${platformData.display_name || platformKey}`);
            sqlStatements.push(platformSQL);
            sqlStatements.push('');

            // Process instruments on this platform
            const instruments = platformData.instruments || {};

            for (const [instrumentKey, instrumentData] of Object.entries(instruments)) {
                console.log(`    Processing instrument: ${instrumentKey}`);

                // Extract camera specifications
                const cameraSpecs = instrumentData.camera_specifications || {};
                const timeline = instrumentData.measurement_timeline || {};

                // Insert instrument
                const instrumentSQL = `INSERT INTO instruments (
                    id, platform_id, normalized_name, display_name, legacy_acronym,
                    instrument_type, ecosystem_code, instrument_number,
                    camera_brand, camera_model, camera_resolution, camera_serial_number,
                    first_measurement_year, last_measurement_year, measurement_status,
                    status, deployment_date, removal_date,
                    latitude, longitude, instrument_height_m,
                    viewing_direction, azimuth_degrees, degrees_from_nadir,
                    description, installation_notes, maintenance_notes
                ) VALUES (
                    ${instrumentIdCounter},
                    ${platformIdCounter},
                    ${escapeSQL(instrumentData.normalized_name || instrumentData.id || instrumentKey)},
                    ${escapeSQL(instrumentData.display_name)},
                    ${escapeSQL(instrumentData.legacy_acronym)},
                    ${escapeSQL(instrumentData.instrument_type || instrumentData.type || 'phenocam')},
                    ${escapeSQL(instrumentData.ecosystem_code || instrumentData.ecosystem)},
                    ${escapeSQL(instrumentData.instrument_number)},
                    ${escapeSQL(cameraSpecs.brand || 'Mobotix')},
                    ${escapeSQL(cameraSpecs.model)},
                    ${escapeSQL(cameraSpecs.resolution)},
                    ${escapeSQL(cameraSpecs.serial_number)},
                    ${timeline.first_measurement_year || 'NULL'},
                    ${timeline.last_measurement_year || 'NULL'},
                    ${escapeSQL(timeline.measurement_status || 'Active')},
                    ${escapeSQL(instrumentData.status || 'Active')},
                    ${formatDate(instrumentData.deployment_date)},
                    ${formatDate(instrumentData.removal_date)},
                    ${formatCoordinate(instrumentData.latitude || (instrumentData.geolocation && instrumentData.geolocation.point && instrumentData.geolocation.point.latitude_dd))},
                    ${formatCoordinate(instrumentData.longitude || (instrumentData.geolocation && instrumentData.geolocation.point && instrumentData.geolocation.point.longitude_dd))},
                    ${formatCoordinate(instrumentData.instrument_height_m || instrumentData.instrument_height_in_meters_above_ground)},
                    ${escapeSQL(instrumentData.viewing_direction || instrumentData.instrument_viewing_direction)},
                    ${formatCoordinate(instrumentData.azimuth_degrees || instrumentData.instrument_azimuth_in_degrees)},
                    ${formatCoordinate(instrumentData.degrees_from_nadir || instrumentData.instrument_degrees_from_nadir)},
                    ${escapeSQL(instrumentData.description)},
                    ${escapeSQL(instrumentData.installation_notes)},
                    ${escapeSQL(instrumentData.maintenance_notes)}
                );`;

                sqlStatements.push(`-- Instrument: ${instrumentData.display_name || instrumentKey}`);
                sqlStatements.push(instrumentSQL);
                sqlStatements.push('');

                // Process ROIs for this instrument
                const rois = instrumentData.rois || {};

                for (const [roiName, roiData] of Object.entries(rois)) {
                    if (!roiData || roiData === null) continue;

                    console.log(`      Processing ROI: ${roiName}`);

                    // Convert ROI points to JSON string
                    let roiPointsJSON = 'NULL';
                    if (roiData.points && Array.isArray(roiData.points)) {
                        roiPointsJSON = escapeSQL(JSON.stringify(roiData.points));
                    }

                    // Convert color to JSON string
                    let colorJSON = 'NULL';
                    if (roiData.color && Array.isArray(roiData.color)) {
                        colorJSON = escapeSQL(JSON.stringify(roiData.color));
                    }

                    const roiSQL = `INSERT INTO instrument_rois (
                        id, instrument_id, roi_name, roi_points, color_rgb,
                        thickness, alpha, auto_generated, description,
                        source_image, generated_date, active
                    ) VALUES (
                        ${roiIdCounter},
                        ${instrumentIdCounter},
                        ${escapeSQL(roiName)},
                        ${roiPointsJSON},
                        ${colorJSON},
                        ${roiData.thickness || 7},
                        ${roiData.alpha || 1.0},
                        ${roiData.auto_generated ? 'TRUE' : 'FALSE'},
                        ${escapeSQL(roiData.description)},
                        ${escapeSQL(roiData.source_image)},
                        ${formatDate(roiData.generated_date)},
                        ${roiData.active !== false ? 'TRUE' : 'FALSE'}
                    );`;

                    sqlStatements.push(`-- ROI: ${roiName}`);
                    sqlStatements.push(roiSQL);
                    sqlStatements.push('');

                    roiIdCounter++;
                }

                instrumentIdCounter++;
            }

            platformIdCounter++;
        }

        stationIdCounter++;
    }

    // Add final statistics
    sqlStatements.push('-- Import Statistics');
    sqlStatements.push(`-- Stations: ${stationIdCounter - 1}`);
    sqlStatements.push(`-- Platforms: ${platformIdCounter - 1}`);
    sqlStatements.push(`-- Instruments: ${instrumentIdCounter - 1}`);
    sqlStatements.push(`-- ROIs: ${roiIdCounter - 1}`);

    return sqlStatements.join('\n');
}

// Main execution
function main() {
    console.log('SITES Spectral Stations YAML Import Script');
    console.log('===========================================');

    try {
        const sql = generateSQL();

        // Write SQL file
        fs.writeFileSync(SQL_OUTPUT_PATH, sql, 'utf8');

        console.log('\n✅ Import SQL generated successfully!');
        console.log(`📄 Output file: ${SQL_OUTPUT_PATH}`);
        console.log('\nNext steps:');
        console.log('1. Review the generated SQL file');
        console.log('2. Run: wrangler d1 migrations apply spectral_stations_db --local');
        console.log('3. Test the imported data');

    } catch (error) {
        console.error('❌ Error generating import SQL:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { generateSQL, escapeSQL, formatDate, formatCoordinate };