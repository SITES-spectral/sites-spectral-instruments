#!/usr/bin/env node

/**
 * SITES Spectral Missing Images Audit
 *
 * This script audits all instruments in the database to identify which ones
 * have missing L1 images and potential naming mismatches.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    dataBasePath: '/home/jobelund/lu2024-12-46/SITES/Spectral/data'
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

// Mock database instruments (from the previous query)
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

// Actual L1 data directories found (from manual audit)
const ACTUAL_L1_INSTRUMENTS = [
    "ANS_FOR_BL01_PHE01",
    "GRI_FOR_BL01_PHE01",
    "LON_AGR_PL01_PHE01",
    "LON_AGR_PL01_PHE02",
    "LON_AGR_PL01_PHE03",
    "RBD_AGR_PL01_PHE01",
    "RBD_AGR_PL02_PHE01",
    "SKC_CEM_FOR_PL01_PHE01",
    "SKC_CEM_FOR_PL02_PHE01",
    "SKC_CEM_FOR_PL03_PHE01",
    "SKC_LAK_PL01_PHE01",
    "SKC_MAD_FOR_PL02_PHE01",
    "SKC_MAD_WET_PL01_PHE01",
    "SKC_SRC_FOL_WET_PL01_PHE01",
    "SKC_SRC_FOL_WET_PL02_PHE01",
    "STM_FOR_PL01_PHE01",
    "SVB_FOR_PL01_PHE01",
    "SVB_FOR_PL01_PHE02",
    "SVB_MIR_PL01_PHE01",
    "SVB_MIR_PL02_PHE01"
];

function auditInstruments() {
    console.log('SITES Spectral Missing Images Audit');
    console.log('===================================\n');

    const results = {
        total: DATABASE_INSTRUMENTS.length,
        found: 0,
        missing: [],
        missingStation: [],
        foundInData: 0
    };

    console.log(`Total instruments in database: ${results.total}`);
    console.log(`Total instruments with L1 data: ${ACTUAL_L1_INSTRUMENTS.length}\n`);

    DATABASE_INSTRUMENTS.forEach(instrument => {
        const stationDataDir = STATION_MAPPING[instrument.station];
        const hasL1Data = ACTUAL_L1_INSTRUMENTS.includes(instrument.normalized_name);

        if (hasL1Data) {
            results.found++;
            console.log(`✅ ${instrument.normalized_name} (${instrument.station}) - L1 data exists`);
        } else {
            if (!stationDataDir || !fs.existsSync(path.join(CONFIG.dataBasePath, stationDataDir))) {
                results.missingStation.push({
                    instrument: instrument.normalized_name,
                    station: instrument.station,
                    issue: 'Station data directory missing'
                });
                console.log(`❌ ${instrument.normalized_name} (${instrument.station}) - Station directory missing`);
            } else {
                results.missing.push({
                    instrument: instrument.normalized_name,
                    station: instrument.station,
                    issue: 'Instrument L1 data missing'
                });
                console.log(`⚠️  ${instrument.normalized_name} (${instrument.station}) - Instrument L1 data missing`);
            }
        }
    });

    // Check for instruments in L1 data but not in database
    console.log('\n=== INSTRUMENTS IN L1 DATA BUT NOT IN DATABASE ===');
    const dbInstrumentNames = DATABASE_INSTRUMENTS.map(i => i.normalized_name);
    ACTUAL_L1_INSTRUMENTS.forEach(instrumentName => {
        if (!dbInstrumentNames.includes(instrumentName)) {
            console.log(`🔍 ${instrumentName} - In L1 data but not in database`);
        }
    });

    console.log('\n=== SUMMARY ===');
    console.log(`✅ Instruments with L1 data: ${results.found}`);
    console.log(`❌ Missing station directories: ${results.missingStation.length}`);
    console.log(`⚠️  Missing instrument L1 data: ${results.missing.length}`);

    if (results.missingStation.length > 0) {
        console.log('\n=== MISSING STATION DIRECTORIES ===');
        results.missingStation.forEach(item => {
            console.log(`- ${item.instrument} (${item.station}): ${item.issue}`);
        });
    }

    if (results.missing.length > 0) {
        console.log('\n=== MISSING INSTRUMENT L1 DATA ===');
        results.missing.forEach(item => {
            console.log(`- ${item.instrument} (${item.station}): ${item.issue}`);
        });
    }

    console.log('\n=== STATION BREAKDOWN ===');
    const stationBreakdown = {};
    DATABASE_INSTRUMENTS.forEach(instrument => {
        if (!stationBreakdown[instrument.station]) {
            stationBreakdown[instrument.station] = { total: 0, found: 0 };
        }
        stationBreakdown[instrument.station].total++;
        if (ACTUAL_L1_INSTRUMENTS.includes(instrument.normalized_name)) {
            stationBreakdown[instrument.station].found++;
        }
    });

    Object.entries(stationBreakdown).forEach(([station, stats]) => {
        const percentage = ((stats.found / stats.total) * 100).toFixed(1);
        console.log(`${station}: ${stats.found}/${stats.total} (${percentage}%) instruments have L1 data`);
    });
}

// Execute audit
auditInstruments();