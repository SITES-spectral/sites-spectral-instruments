// Validation Utilities
// Input validation, Swedish compliance, ecosystem codes, and input sanitization
// SECURITY: Provides centralized validation and sanitization for all API inputs

import { executeQuery, executeQueryFirst } from './database.js';

// ============================================================================
// Input Sanitization Functions
// ============================================================================

/**
 * Sanitize string input - removes control characters and trims whitespace
 * @param {*} value - Value to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string|null} Sanitized string or null
 */
export function sanitizeString(value, options = {}) {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') {
        value = String(value);
    }

    const { maxLength = 1000, allowEmpty = false } = options;

    // Remove control characters except newlines and tabs
    let sanitized = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Truncate if too long
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    // Return null for empty strings unless allowed
    if (!allowEmpty && sanitized.length === 0) {
        return null;
    }

    return sanitized;
}

/**
 * Sanitize and validate integer input
 * @param {*} value - Value to sanitize
 * @param {Object} options - Validation options
 * @returns {number|null} Sanitized integer or null
 */
export function sanitizeInteger(value, options = {}) {
    if (value === null || value === undefined || value === '') return null;

    const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return null;
    if (parsed < min || parsed > max) return null;

    return parsed;
}

/**
 * Sanitize and validate float input
 * @param {*} value - Value to sanitize
 * @param {Object} options - Validation options
 * @returns {number|null} Sanitized float or null
 */
export function sanitizeFloat(value, options = {}) {
    if (value === null || value === undefined || value === '') return null;

    const { min = -Number.MAX_VALUE, max = Number.MAX_VALUE, decimals = null } = options;

    const parsed = parseFloat(value);
    if (isNaN(parsed) || !isFinite(parsed)) return null;
    if (parsed < min || parsed > max) return null;

    // Round to specified decimals if provided
    if (decimals !== null && decimals >= 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(parsed * factor) / factor;
    }

    return parsed;
}

/**
 * Sanitize coordinate (latitude or longitude)
 * @param {*} value - Value to sanitize
 * @param {string} type - 'latitude' or 'longitude'
 * @returns {number|null} Sanitized coordinate or null
 */
export function sanitizeCoordinate(value, type = 'latitude') {
    const limits = type === 'latitude'
        ? { min: -90, max: 90 }
        : { min: -180, max: 180 };

    return sanitizeFloat(value, { ...limits, decimals: 6 });
}

/**
 * Sanitize identifier (alphanumeric with underscores)
 * @param {*} value - Value to sanitize
 * @param {Object} options - Validation options
 * @returns {string|null} Sanitized identifier or null
 */
export function sanitizeIdentifier(value, options = {}) {
    if (value === null || value === undefined) return null;

    const { maxLength = 100, allowDashes = false } = options;
    const str = String(value).trim();

    // Pattern: alphanumeric and underscores (optionally dashes)
    const pattern = allowDashes
        ? /^[a-zA-Z0-9_-]+$/
        : /^[a-zA-Z0-9_]+$/;

    if (!pattern.test(str)) return null;
    if (str.length > maxLength) return null;

    return str;
}

/**
 * Sanitize acronym (uppercase letters and numbers)
 * @param {*} value - Value to sanitize
 * @returns {string|null} Sanitized acronym or null
 */
export function sanitizeAcronym(value) {
    if (value === null || value === undefined) return null;

    const str = String(value).trim().toUpperCase();

    if (!/^[A-Z0-9]{2,10}$/.test(str)) return null;

    return str;
}

/**
 * Sanitize JSON input
 * @param {*} value - Value to sanitize (string or object)
 * @returns {Object|null} Parsed JSON or null
 */
export function sanitizeJSON(value) {
    if (value === null || value === undefined) return null;

    // If already an object, validate it's not an array (unless that's desired)
    if (typeof value === 'object' && value !== null) {
        return value;
    }

    // Try to parse string as JSON
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    }

    return null;
}

/**
 * Sanitize and validate enum value
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - List of allowed values
 * @returns {*} The value if allowed, null otherwise
 */
export function sanitizeEnum(value, allowedValues) {
    if (value === null || value === undefined) return null;
    if (!Array.isArray(allowedValues)) return null;

    const str = String(value).trim();
    return allowedValues.includes(str) ? str : null;
}

/**
 * Sanitize date string (ISO format)
 * @param {*} value - Value to sanitize
 * @returns {string|null} ISO date string or null
 */
export function sanitizeDate(value) {
    if (value === null || value === undefined || value === '') return null;

    const str = String(value).trim();

    // Check ISO date format (YYYY-MM-DD or full ISO)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (!isoDatePattern.test(str)) return null;

    // Validate it's a real date
    const date = new Date(str);
    if (isNaN(date.getTime())) return null;

    // Return date part only for simple dates
    if (str.length === 10) {
        return str;
    }

    return date.toISOString();
}

/**
 * Sanitize URL (basic validation)
 * @param {*} value - Value to sanitize
 * @returns {string|null} Valid URL string or null
 */
export function sanitizeURL(value) {
    if (value === null || value === undefined || value === '') return null;

    const str = String(value).trim();

    // Only allow http and https protocols
    if (!str.startsWith('http://') && !str.startsWith('https://')) {
        return null;
    }

    // Basic URL validation
    try {
        new URL(str);
        return str;
    } catch (e) {
        return null;
    }
}

// ============================================================================
// Request Body Sanitization
// ============================================================================

/**
 * Sanitize an entire request body object
 * @param {Object} body - Request body to sanitize
 * @param {Object} schema - Schema defining field types and constraints
 * @returns {Object} Sanitized body object
 */
export function sanitizeRequestBody(body, schema) {
    if (!body || typeof body !== 'object') {
        return {};
    }

    const sanitized = {};

    for (const [field, config] of Object.entries(schema)) {
        const value = body[field];

        switch (config.type) {
            case 'string':
                sanitized[field] = sanitizeString(value, config);
                break;
            case 'integer':
                sanitized[field] = sanitizeInteger(value, config);
                break;
            case 'float':
                sanitized[field] = sanitizeFloat(value, config);
                break;
            case 'coordinate':
                sanitized[field] = sanitizeCoordinate(value, config.coordType || 'latitude');
                break;
            case 'identifier':
                sanitized[field] = sanitizeIdentifier(value, config);
                break;
            case 'acronym':
                sanitized[field] = sanitizeAcronym(value);
                break;
            case 'json':
                sanitized[field] = sanitizeJSON(value);
                break;
            case 'enum':
                sanitized[field] = sanitizeEnum(value, config.values);
                break;
            case 'date':
                sanitized[field] = sanitizeDate(value);
                break;
            case 'url':
                sanitized[field] = sanitizeURL(value);
                break;
            case 'boolean':
                sanitized[field] = value === true || value === 'true' || value === 1;
                break;
            default:
                // Pass through unknown types with basic string sanitization
                sanitized[field] = sanitizeString(value);
        }
    }

    return sanitized;
}

// ============================================================================
// Field Schemas for Common Entities
// ============================================================================

/**
 * Station field schema for sanitization
 */
export const STATION_SCHEMA = {
    display_name: { type: 'string', maxLength: 200 },
    acronym: { type: 'acronym' },
    normalized_name: { type: 'identifier', maxLength: 100 },
    description: { type: 'string', maxLength: 2000 },
    latitude: { type: 'coordinate', coordType: 'latitude' },
    longitude: { type: 'coordinate', coordType: 'longitude' },
    elevation_m: { type: 'float', min: -500, max: 10000, decimals: 2 },
    timezone: { type: 'string', maxLength: 50 },
    organization: { type: 'string', maxLength: 200 },
    contact_email: { type: 'string', maxLength: 200 },
    website_url: { type: 'url' },
    status: { type: 'enum', values: ['Active', 'Inactive', 'Maintenance', 'Decommissioned'] }
};

/**
 * Platform field schema for sanitization
 */
export const PLATFORM_SCHEMA = {
    station_id: { type: 'integer', min: 1 },
    display_name: { type: 'string', maxLength: 200 },
    normalized_name: { type: 'identifier', maxLength: 100 },
    location_code: { type: 'identifier', maxLength: 20 },
    ecosystem_code: { type: 'enum', values: ['HEA', 'AGR', 'MIR', 'LAK', 'WET', 'GRA', 'FOR', 'ALP', 'CON', 'DEC', 'MAR', 'PEA', 'GEN'] },
    latitude: { type: 'coordinate', coordType: 'latitude' },
    longitude: { type: 'coordinate', coordType: 'longitude' },
    platform_height_m: { type: 'float', min: 0, max: 200, decimals: 2 },
    status: { type: 'enum', values: ['Active', 'Inactive', 'Maintenance', 'Decommissioned'] },
    mounting_structure: { type: 'string', maxLength: 200 },
    platform_type: { type: 'string', maxLength: 100 },
    deployment_date: { type: 'date' },
    description: { type: 'string', maxLength: 2000 },
    operation_programs: { type: 'string', maxLength: 500 }
};

/**
 * Instrument field schema for sanitization
 */
export const INSTRUMENT_SCHEMA = {
    platform_id: { type: 'integer', min: 1 },
    display_name: { type: 'string', maxLength: 200 },
    normalized_name: { type: 'identifier', maxLength: 100 },
    instrument_type: { type: 'string', maxLength: 100 },
    legacy_acronym: { type: 'identifier', maxLength: 50 },
    status: { type: 'enum', values: ['Active', 'Inactive', 'Maintenance', 'Decommissioned'] },
    measurement_status: { type: 'enum', values: ['Operational', 'Calibrating', 'Offline', 'Unknown'] },
    latitude: { type: 'coordinate', coordType: 'latitude' },
    longitude: { type: 'coordinate', coordType: 'longitude' },
    viewing_direction: { type: 'string', maxLength: 50 },
    azimuth_degrees: { type: 'float', min: 0, max: 360, decimals: 2 },
    nadir_degrees: { type: 'float', min: -90, max: 90, decimals: 2 },
    height_above_ground_m: { type: 'float', min: 0, max: 200, decimals: 2 },
    deployment_date: { type: 'date' },
    calibration_date: { type: 'date' },
    description: { type: 'string', maxLength: 2000 },
    installation_notes: { type: 'string', maxLength: 2000 },
    maintenance_notes: { type: 'string', maxLength: 2000 },
    quality_score: { type: 'float', min: 0, max: 100, decimals: 2 }
};

/**
 * ROI field schema for sanitization
 */
export const ROI_SCHEMA = {
    instrument_id: { type: 'integer', min: 1 },
    roi_name: { type: 'identifier', maxLength: 50 },
    display_name: { type: 'string', maxLength: 200 },
    points_json: { type: 'json' },
    color: { type: 'string', maxLength: 20 },
    description: { type: 'string', maxLength: 2000 },
    vegetation_type: { type: 'string', maxLength: 100 },
    status: { type: 'enum', values: ['Active', 'Inactive', 'Archived'] },
    // Legacy ROI fields (v10.0.0-alpha.17)
    is_legacy: { type: 'boolean' },
    legacy_date: { type: 'date' },
    replaced_by_roi_id: { type: 'integer', min: 1 },
    timeseries_broken: { type: 'boolean' },
    legacy_reason: { type: 'string', maxLength: 500 }
};

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