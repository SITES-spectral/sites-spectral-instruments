#!/usr/bin/env node

/**
 * SITES Spectral Instrument Images Updater
 *
 * This script finds the latest L1 processed phenocam images and copies them
 * to the web application assets folder for display in instrument cards and modals.
 *
 * Usage:
 *   node scripts/update-instrument-images.js
 *   node scripts/update-instrument-images.js --station=abisko
 *   npm run update-images
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const CONFIG = {
    dataBasePath: '/home/jobelund/lu2024-12-46/SITES/Spectral/data',
    webAssetsPath: path.join(__dirname, '..', 'public', 'images', 'stations'),
    stationsYamlPath: path.join(__dirname, '..', '.secure', 'stations.yaml'),
    logLevel: 'info' // 'debug', 'info', 'warn', 'error'
};

// Station name mapping from acronym to data directory name
const STATION_MAPPING = {
    'ANS': 'abisko',
    'ASA': 'asa',
    'GRI': 'grimso',
    'LON': 'lonnstorp',
    'RBD': 'robacksdalen',
    'SKC': 'skogaryd',
    'SVB': 'svartberget'
};

// Reverse mapping from data directory to normalized name
const STATION_REVERSE_MAPPING = {
    'abisko': 'abisko',
    'asa': 'asa',
    'grimso': 'grimso',
    'lonnstorp': 'lonnstorp',
    'robacksdalen': 'robacksdalen',
    'skogaryd': 'skogaryd',
    'svartberget': 'svartberget'
};

// Logger
const logger = {
    debug: (msg) => CONFIG.logLevel === 'debug' && console.log(`[DEBUG] ${msg}`),
    info: (msg) => ['debug', 'info'].includes(CONFIG.logLevel) && console.log(`[INFO] ${msg}`),
    warn: (msg) => ['debug', 'info', 'warn'].includes(CONFIG.logLevel) && console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
};

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        station: null,
        dryRun: false
    };

    args.forEach(arg => {
        if (arg.startsWith('--station=')) {
            options.station = arg.split('=')[1];
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        }
    });

    return options;
}

/**
 * Get all phenocam instruments from database using the audit findings
 */
function getAllPhenocamInstruments(filterStation = null) {
    // Based on the audit report, these are all instruments in the database
    const DATABASE_INSTRUMENTS = [
        { normalized_name: "ANS_FOR_BL01_PHE01", station: "ANS" },
        { normalized_name: "ASA_FOR_PL01_PHE01", station: "ASA" },
        { normalized_name: "ASA_FOR_PL02_PHE01", station: "ASA" },
        { normalized_name: "GRI_FOR_BL01_PHE01", station: "GRI" },
        { normalized_name: "LON_AGR_PL01_PHE01", station: "LON" },
        { normalized_name: "LON_AGR_PL01_PHE02", station: "LON" },
        { normalized_name: "LON_AGR_PL01_PHE03", station: "LON" },
        { normalized_name: "RBD_AGR_PL01_PHE01", station: "RBD" },
        { normalized_name: "RBD_AGR_PL02_PHE01", station: "RBD" },
        { normalized_name: "SKC_CEM_FOR_PL01_PHE01", station: "SKC" },
        { normalized_name: "SKC_CEM_FOR_PL02_PHE01", station: "SKC" },
        { normalized_name: "SKC_CEM_FOR_PL03_PHE01", station: "SKC" },
        { normalized_name: "SKC_LAK_PL01_PHE01", station: "SKC" },
        { normalized_name: "SKC_MAD_FOR_PL02_PHE01", station: "SKC" },
        { normalized_name: "SKC_MAD_WET_PL01_PHE01", station: "SKC" },
        { normalized_name: "SKC_SRC_FOL_WET_PL01_PHE01", station: "SKC" },
        { normalized_name: "SKC_SRC_FOL_WET_PL02_PHE01", station: "SKC" },
        { normalized_name: "STM_FOR_PL01_PHE01", station: "SKC" },
        { normalized_name: "SVB_FOR_PL01_PHE01", station: "SVB" },
        { normalized_name: "SVB_FOR_PL01_PHE02", station: "SVB" },
        { normalized_name: "SVB_MIR_PL01_PHE01", station: "SVB" },
        { normalized_name: "SVB_MIR_PL02_PHE01", station: "SVB" },
        { normalized_name: "SVB_MIR_PL03_PHE01", station: "SVB" }
    ];

    const instruments = DATABASE_INSTRUMENTS
        .filter(instrument => {
            // Skip station if filter is applied
            if (filterStation && instrument.station.toLowerCase() !== filterStation.toLowerCase()) {
                return false;
            }
            return true;
        })
        .map(instrument => ({
            instrumentId: instrument.normalized_name,
            stationAcronym: instrument.station,
            stationNormalized: STATION_REVERSE_MAPPING[STATION_MAPPING[instrument.station]] || instrument.station.toLowerCase(),
            displayName: instrument.normalized_name,
            status: 'Active'
        }));

    logger.info(`Found ${instruments.length} phenocam instruments${filterStation ? ` for station ${filterStation}` : ''}`);
    return instruments;
}

/**
 * Find the latest L1 image for an instrument
 */
function findLatestL1Image(instrument) {
    const stationDataDir = STATION_MAPPING[instrument.stationAcronym];
    if (!stationDataDir) {
        logger.warn(`No data directory mapping for station ${instrument.stationAcronym}`);
        return null;
    }

    const instrumentDataPath = path.join(
        CONFIG.dataBasePath,
        stationDataDir,
        'phenocams',
        'products',
        instrument.instrumentId,
        'L1'
    );

    logger.debug(`Checking instrument data path: ${instrumentDataPath}`);

    if (!fs.existsSync(instrumentDataPath)) {
        logger.warn(`Data path does not exist: ${instrumentDataPath}`);
        return null;
    }

    // Find the latest year directory
    const yearDirs = fs.readdirSync(instrumentDataPath)
        .filter(dir => /^\d{4}$/.test(dir))
        .sort((a, b) => parseInt(b) - parseInt(a));

    if (yearDirs.length === 0) {
        logger.warn(`No year directories found in ${instrumentDataPath}`);
        return null;
    }

    const latestYear = yearDirs[0];
    const yearPath = path.join(instrumentDataPath, latestYear);

    logger.debug(`Using latest year: ${latestYear}`);

    // Find all images and get the latest one
    try {
        const imageFiles = fs.readdirSync(yearPath)
            .filter(file => file.endsWith('.jpg'))
            .sort((a, b) => {
                // Extract day of year and timestamp for comparison
                const aMatch = a.match(/_(\d{4})_(\d{3})_(\d{8}_\d{6})\.jpg$/);
                const bMatch = b.match(/_(\d{4})_(\d{3})_(\d{8}_\d{6})\.jpg$/);

                if (!aMatch || !bMatch) return 0;

                const aDayOfYear = parseInt(aMatch[2]);
                const bDayOfYear = parseInt(bMatch[2]);

                if (aDayOfYear !== bDayOfYear) {
                    return bDayOfYear - aDayOfYear; // Latest day first
                }

                return bMatch[3].localeCompare(aMatch[3]); // Latest time first
            });

        if (imageFiles.length === 0) {
            logger.warn(`No image files found in ${yearPath}`);
            return null;
        }

        const latestImage = imageFiles[0];
        const latestImagePath = path.join(yearPath, latestImage);

        logger.debug(`Latest image: ${latestImage}`);

        // Parse timestamp from filename: station_instrument_YYYY_DDD_YYYYMMDD_HHMMSS.jpg
        const timestampMatch = latestImage.match(/_(\d{4})_(\d{3})_(\d{8})_(\d{6})\.jpg$/);
        let timestamp = null;
        let dayOfYear = null;
        let imageDate = null;

        if (timestampMatch) {
            const year = timestampMatch[1];
            dayOfYear = parseInt(timestampMatch[2]);
            const dateStr = timestampMatch[3]; // YYYYMMDD
            const timeStr = timestampMatch[4]; // HHMMSS

            // Parse date and time
            const yyyy = dateStr.substring(0, 4);
            const mm = dateStr.substring(4, 6);
            const dd = dateStr.substring(6, 8);
            const hh = timeStr.substring(0, 2);
            const min = timeStr.substring(2, 4);
            const ss = timeStr.substring(4, 6);

            imageDate = `${yyyy}-${mm}-${dd}`;
            timestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        }

        return {
            sourcePath: latestImagePath,
            sourceFilename: latestImage,
            year: latestYear,
            timestamp: timestamp,
            imageDate: imageDate,
            dayOfYear: dayOfYear
        };

    } catch (error) {
        logger.error(`Error reading directory ${yearPath}: ${error.message}`);
        return null;
    }
}

/**
 * Copy image to web assets directory
 */
function copyImageToAssets(instrument, imageInfo, dryRun = false) {
    const targetFilename = `${instrument.instrumentId}.jpg`;
    const targetDir = path.join(CONFIG.webAssetsPath, instrument.stationNormalized, 'instruments');
    const targetPath = path.join(targetDir, targetFilename);

    logger.debug(`Target path: ${targetPath}`);

    if (dryRun) {
        logger.info(`[DRY RUN] Would copy ${imageInfo.sourceFilename} to ${targetPath}`);
        return { success: true, dryRun: true };
    }

    try {
        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
            logger.debug(`Created directory: ${targetDir}`);
        }

        // Copy the file
        fs.copyFileSync(imageInfo.sourcePath, targetPath);

        const stats = fs.statSync(targetPath);
        logger.info(`✓ Copied ${instrument.instrumentId}: ${imageInfo.sourceFilename} (${Math.round(stats.size / 1024)}KB)`);

        return {
            success: true,
            targetPath,
            sourceFilename: imageInfo.sourceFilename,
            year: imageInfo.year,
            timestamp: imageInfo.timestamp,
            imageDate: imageInfo.imageDate,
            dayOfYear: imageInfo.dayOfYear,
            sizeKB: Math.round(stats.size / 1024)
        };

    } catch (error) {
        logger.error(`Failed to copy image for ${instrument.instrumentId}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Generate update manifest
 */
function generateManifest(results) {
    const manifest = {
        generated: new Date().toISOString(),
        totalInstruments: results.length,
        successCount: results.filter(r => r.success).length,
        failedCount: results.filter(r => !r.success).length,
        instruments: results.map(result => ({
            instrumentId: result.instrumentId,
            stationAcronym: result.stationAcronym,
            success: result.success,
            sourceFilename: result.sourceFilename || null,
            year: result.year || null,
            timestamp: result.timestamp || null,
            imageDate: result.imageDate || null,
            dayOfYear: result.dayOfYear || null,
            sizeKB: result.sizeKB || null,
            error: result.error || null
        }))
    };

    const manifestPath = path.join(CONFIG.webAssetsPath, 'instrument-images-manifest.json');

    try {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        logger.info(`Generated manifest: ${manifestPath}`);
    } catch (error) {
        logger.error(`Failed to write manifest: ${error.message}`);
    }

    return manifest;
}

/**
 * Main execution function
 */
async function main() {
    const options = parseArgs();

    logger.info('SITES Spectral Instrument Images Updater');
    logger.info('=========================================');

    if (options.dryRun) {
        logger.info('DRY RUN MODE - No files will be copied');
    }

    if (options.station) {
        logger.info(`Filtering for station: ${options.station}`);
    }

    // Get all phenocam instruments from database
    const instruments = getAllPhenocamInstruments(options.station);

    if (instruments.length === 0) {
        logger.warn('No phenocam instruments found');
        return;
    }

    // Process each instrument
    const results = [];

    for (const instrument of instruments) {
        logger.debug(`\nProcessing: ${instrument.instrumentId} (${instrument.stationAcronym})`);

        // Find latest L1 image
        const imageInfo = findLatestL1Image(instrument);

        if (!imageInfo) {
            results.push({
                instrumentId: instrument.instrumentId,
                stationAcronym: instrument.stationAcronym,
                success: false,
                error: 'No L1 images found'
            });
            continue;
        }

        // Copy image to assets
        const copyResult = copyImageToAssets(instrument, imageInfo, options.dryRun);

        results.push({
            instrumentId: instrument.instrumentId,
            stationAcronym: instrument.stationAcronym,
            ...copyResult
        });
    }

    // Generate summary
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    logger.info(`\nSummary:`);
    logger.info(`✓ Successfully processed: ${successCount}`);
    if (failedCount > 0) {
        logger.warn(`✗ Failed: ${failedCount}`);
        results.filter(r => !r.success).forEach(r => {
            logger.warn(`  - ${r.instrumentId}: ${r.error}`);
        });
    }

    // Generate manifest (only if not dry run)
    if (!options.dryRun) {
        generateManifest(results);
    }

    logger.info('Done!');
}

// Execute if called directly
if (require.main === module) {
    main().catch(error => {
        logger.error(`Script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main, parseArgs, getAllPhenocamInstruments };