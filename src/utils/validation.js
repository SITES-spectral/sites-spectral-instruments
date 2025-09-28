// Validation Utilities
// Input validation, Swedish compliance, and ecosystem codes

import { executeQuery, executeQueryFirst } from './database.js';

// Valid ecosystem codes for Swedish research stations
const VALID_ECOSYSTEMS = ['HEA', 'AGR', 'MIR', 'LAK', 'WET', 'GRA', 'FOR', 'ALP', 'CON', 'DEC', 'MAR', 'PEA', 'GEN'];

/**
 * Validate station creation data
 * @param {Object} data - Station data to validate
 * @returns {Object} Validation result with errors
 */
export function validateStationData(data) {
  const errors = [];

  if (!data.display_name || data.display_name.trim().length === 0) {
    errors.push('Display name is required');
  }

  if (!data.acronym || data.acronym.trim().length === 0) {
    errors.push('Acronym is required');
  } else if (!/^[A-Z0-9]{2,10}$/.test(data.acronym)) {
    errors.push('Acronym must be 2-10 uppercase letters/numbers');
  }

  if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (data.elevation_m && (data.elevation_m < -500 || data.elevation_m > 10000)) {
    errors.push('Elevation must be between -500 and 10000 meters');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate station update data (allows partial updates)
 * @param {Object} data - Station data to validate
 * @returns {Object} Validation result with errors
 */
export function validateStationUpdateData(data) {
  const errors = [];

  if (data.display_name !== undefined && data.display_name.trim().length === 0) {
    errors.push('Display name cannot be empty');
  }

  if (data.acronym !== undefined) {
    if (data.acronym.trim().length === 0) {
      errors.push('Acronym cannot be empty');
    } else if (!/^[A-Z0-9]{2,10}$/.test(data.acronym)) {
      errors.push('Acronym must be 2-10 uppercase letters/numbers');
    }
  }

  if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate platform data
 * @param {Object} data - Platform data to validate
 * @returns {Object} Validation result with errors
 */
export function validatePlatformData(data) {
  const errors = [];

  if (!data.station_id) {
    errors.push('Station ID is required');
  }

  if (!data.display_name || data.display_name.trim().length === 0) {
    errors.push('Display name is required');
  }

  if (!data.location_code || !/^[A-Z]{2,3}\d{2}$/.test(data.location_code)) {
    errors.push('Location code must follow format like HEA01, GRA02, etc.');
  }

  if (data.ecosystem_code && !VALID_ECOSYSTEMS.includes(data.ecosystem_code)) {
    errors.push(`Ecosystem code must be one of: ${VALID_ECOSYSTEMS.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate instrument data
 * @param {Object} data - Instrument data to validate
 * @returns {Object} Validation result with errors
 */
export function validateInstrumentData(data) {
  const errors = [];

  if (!data.platform_id) {
    errors.push('Platform ID is required');
  }

  if (!data.display_name || data.display_name.trim().length === 0) {
    errors.push('Display name is required');
  }

  if (!data.instrument_type || data.instrument_type.trim().length === 0) {
    errors.push('Instrument type is required');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate ROI data
 * @param {Object} data - ROI data to validate
 * @returns {Object} Validation result with errors
 */
export function validateROIData(data) {
  const errors = [];

  if (!data.instrument_id) {
    errors.push('Instrument ID is required');
  }

  if (!data.roi_name || data.roi_name.trim().length === 0) {
    errors.push('ROI name is required');
  }

  if (data.points_json) {
    try {
      const points = JSON.parse(data.points_json);
      if (!Array.isArray(points) || points.length < 3) {
        errors.push('ROI must have at least 3 points');
      }
    } catch (e) {
      errors.push('Invalid points JSON format');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate Swedish coordinates (SWEREF 99 TM or similar)
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Object} Validation result
 */
export function validateSwedishCoordinates(latitude, longitude) {
  const errors = [];

  // Sweden roughly spans 55°-69°N and 11°-24°E
  if (latitude && (latitude < 55 || latitude > 70)) {
    errors.push('Latitude appears to be outside Sweden (55°-70°N)');
  }

  if (longitude && (longitude < 10 || longitude > 25)) {
    errors.push('Longitude appears to be outside Sweden (10°-25°E)');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: errors.length > 0 ? ['Coordinates may be outside Sweden'] : []
  };
}

/**
 * Generate normalized name from display name
 * @param {string} displayName - Display name to normalize
 * @returns {string} Normalized name
 */
export function generateNormalizedName(displayName) {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[åä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate alternative normalized name to avoid conflicts
 * @param {string} baseName - Base normalized name
 * @param {Object} env - Environment variables and bindings
 * @returns {string} Alternative normalized name
 */
export async function generateAlternativeNormalizedName(baseName, env) {
  const query = `
    SELECT normalized_name FROM stations
    WHERE normalized_name LIKE ?
    ORDER BY normalized_name
  `;

  const existing = await executeQuery(env, query, [`${baseName}%`], 'generateAlternativeNormalizedName');
  const existingNames = existing?.results?.map(r => r.normalized_name) || [];

  let counter = 1;
  let candidateName = baseName;

  while (existingNames.includes(candidateName)) {
    candidateName = `${baseName}_${counter.toString().padStart(2, '0')}`;
    counter++;
  }

  return candidateName;
}

/**
 * Generate alternative acronym to avoid conflicts
 * @param {string} baseAcronym - Base acronym
 * @param {Object} env - Environment variables and bindings
 * @returns {string} Alternative acronym
 */
export async function generateAlternativeAcronym(baseAcronym, env) {
  const query = `
    SELECT acronym FROM stations
    WHERE acronym LIKE ?
    ORDER BY acronym
  `;

  const existing = await executeQuery(env, query, [`${baseAcronym}%`], 'generateAlternativeAcronym');
  const existingAcronyms = existing?.results?.map(r => r.acronym) || [];

  let counter = 1;
  let candidateAcronym = baseAcronym;

  while (existingAcronyms.includes(candidateAcronym)) {
    candidateAcronym = `${baseAcronym}${counter.toString().padStart(2, '0')}`;
    counter++;
  }

  return candidateAcronym;
}

/**
 * Check platform conflicts within a station
 * @param {number} stationId - Station ID
 * @param {string} normalizedName - Platform normalized name to check
 * @param {string} locationCode - Platform location code to check
 * @param {Object} env - Environment variables and bindings
 * @returns {Array} Array of conflicts found
 */
export async function checkPlatformConflicts(stationId, normalizedName, locationCode, env) {
  const query = `
    SELECT normalized_name, location_code FROM platforms
    WHERE station_id = ? AND (normalized_name = ? OR location_code = ?)
  `;

  const result = await executeQuery(env, query, [stationId, normalizedName, locationCode], 'checkPlatformConflicts');

  return (result?.results || []).map(r => ({
    field: r.normalized_name === normalizedName ? 'normalized_name' : 'location_code',
    value: r.normalized_name === normalizedName ? r.normalized_name : r.location_code
  }));
}

/**
 * Generate platform alternatives to resolve conflicts
 * @param {string} normalizedName - Platform normalized name
 * @param {string} locationCode - Platform location code
 * @param {number} stationId - Station ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Object} Alternative names and codes
 */
export async function generatePlatformAlternatives(normalizedName, locationCode, stationId, env) {
  const existingQuery = `
    SELECT normalized_name, location_code FROM platforms
    WHERE station_id = ?
  `;

  const existing = await executeQuery(env, existingQuery, [stationId], 'generatePlatformAlternatives');
  const existingNames = existing?.results?.map(r => r.normalized_name) || [];
  const existingCodes = existing?.results?.map(r => r.location_code) || [];

  return {
    normalized_name: generateAlternativeNormalizedNameSync(normalizedName, existingNames),
    location_code: generateNextLocationCode(locationCode, existingCodes)
  };
}

/**
 * Generate next available location code
 * @param {string} baseCode - Base location code (e.g., "HEA01")
 * @param {Array} existingCodes - Array of existing location codes
 * @returns {string} Next available location code
 */
function generateNextLocationCode(baseCode, existingCodes) {
  const prefix = baseCode.replace(/\d+$/, '');
  let counter = 1;

  while (existingCodes.includes(`${prefix}${counter.toString().padStart(2, '0')}`)) {
    counter++;
  }

  return `${prefix}${counter.toString().padStart(2, '0')}`;
}

/**
 * Generate alternative normalized name from existing list
 * @param {string} baseName - Base normalized name
 * @param {Array} existingNames - Array of existing names
 * @returns {string} Alternative normalized name
 */
function generateAlternativeNormalizedNameSync(baseName, existingNames) {
  let counter = 1;
  let candidateName = baseName;

  while (existingNames.includes(candidateName)) {
    candidateName = `${baseName}_${counter.toString().padStart(2, '0')}`;
    counter++;
  }

  return candidateName;
}

/**
 * Get list of valid ecosystem codes
 * @returns {Array} Array of valid ecosystem codes
 */
export function getValidEcosystemCodes() {
  return [...VALID_ECOSYSTEMS];
}