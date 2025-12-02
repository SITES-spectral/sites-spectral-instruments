// Instruments Handler - Utility Functions
// Helper functions for instrument operations

import { executeQueryFirst } from '../../utils/database.js';

/**
 * Get instrument type code (acronym) for SITES Spectral instruments
 * Maps full instrument type names to standardized acronyms
 * @param {string} instrumentType - Full instrument type name
 * @returns {string} Instrument type code/acronym
 */
export function getInstrumentTypeCode(instrumentType) {
  // SITES Spectral specific instrument type mappings
  const typeMapping = {
    // Phenocams
    'Phenocam': 'PHE',

    // Multispectral Sensors (Fixed Platform) - All use MS acronym
    'SKYE MultiSpectral Sensor (Uplooking)': 'MS',
    'SKYE MultiSpectral Sensor (Downlooking)': 'MS',
    'Decagon Sensor (Uplooking)': 'MS',
    'Decagon Sensor (Downlooking)': 'MS',
    'Apogee MS': 'MS',

    // PRI Sensors
    'PRI Sensor (2-band ~530nm/~570nm)': 'PRI',

    // NDVI Sensors
    'NDVI Sensor': 'NDVI',
    'Apogee NDVI': 'NDVI',

    // PAR Sensors
    'PAR Sensor': 'PAR',
    'Apogee PAR': 'PAR',

    // Legacy types (for backward compatibility)
    'Multispectral Sensor': 'MS',
    'Hyperspectral Sensor': 'HYP'
  };

  // Return mapped code if exists, otherwise generate from first 3 uppercase letters
  if (typeMapping[instrumentType]) {
    return typeMapping[instrumentType];
  }

  // Fallback: extract first 3 uppercase letters
  return instrumentType.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
}

/**
 * Extract brand acronym from sensor brand or model
 * Used for multispectral sensor naming convention
 * @param {string} sensorBrand - Sensor brand name
 * @param {string} sensorModel - Sensor model name (fallback)
 * @returns {string} Brand acronym (e.g., SKYE, APOGEE, DECAGON, LICOR, PP)
 */
export function extractBrandAcronym(sensorBrand, sensorModel) {
  if (!sensorBrand && !sensorModel) {
    return 'MS'; // Fallback to generic MS
  }

  const brand = (sensorBrand || sensorModel || '').toUpperCase();

  // Known brand mappings
  const brandMappings = {
    'SKYE': 'SKYE',
    'APOGEE': 'APOGEE',
    'DECAGON': 'DECAGON',
    'METER': 'METER',
    'LICOR': 'LICOR',
    'LI-COR': 'LICOR',
    'PPSYSTEMS': 'PP',
    'PP SYSTEMS': 'PP',
    'PP': 'PP'
  };

  // Check for exact match
  if (brandMappings[brand]) {
    return brandMappings[brand];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(brandMappings)) {
    if (brand.includes(key)) {
      return value;
    }
  }

  // Fallback: use first word in uppercase
  const firstWord = brand.split(/\s+/)[0];
  return firstWord || 'MS';
}

/**
 * Get next available instrument number for platform
 * @param {number} platformId - Platform ID
 * @param {Object} env - Environment variables and bindings
 * @returns {string} Next instrument number (01, 02, etc.)
 */
export async function getNextInstrumentNumber(platformId, env) {
  const query = `
    SELECT instrument_number
    FROM instruments
    WHERE platform_id = ?
    ORDER BY instrument_number DESC
    LIMIT 1
  `;

  const result = await executeQueryFirst(env, query, [platformId], 'getNextInstrumentNumber');

  if (!result || !result.instrument_number) {
    return '01';
  }

  // Extract numeric suffix from instrument_number (e.g., "PHE01" -> "01", "MSP02" -> "02")
  const match = result.instrument_number.match(/(\d+)$/);
  if (!match) {
    // If no numeric suffix found, start from 01
    return '01';
  }

  // Increment number
  const number = parseInt(match[1], 10) + 1;
  return number.toString().padStart(2, '0');
}

/**
 * Helper function to get instrument and verify user access
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Instrument if found and accessible, null otherwise
 */
export async function getInstrumentForUser(id, user, env) {
  const query = `
    SELECT i.id, i.normalized_name, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  const instrument = await executeQueryFirst(env, query, [id], 'getInstrumentForUser');

  if (!instrument) {
    return null;
  }

  // Check permissions
  if (user.role === 'admin') {
    return instrument;
  }

  if (user.role === 'station' && user.station_normalized_name === instrument.station_normalized_name) {
    return instrument;
  }

  if (user.role === 'readonly') {
    return instrument;
  }

  return null; // No access
}

/**
 * Helper function to round coordinates to exactly 6 decimal places
 * @param {*} value - The value to round
 * @returns {number|null} Rounded value or null
 */
export function roundCoordinate(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  // Round to 6 decimal places: multiply by 1000000, round, divide by 1000000
  return Math.round(num * 1000000) / 1000000;
}
