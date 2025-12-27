/**
 * API Contract Validation Middleware
 *
 * Validates requests against OpenAPI 3.0 schema contracts.
 * Part of Phase 7.6 API Contract-First Design.
 *
 * @module middleware/contract-validator
 * @version 13.4.0
 */

import { createErrorResponse } from '../utils/responses.js';

/**
 * Schema definitions for request validation
 * These match the OpenAPI specification in docs/openapi/openapi.yaml
 */
export const SCHEMAS = {
  // Platform types
  PlatformType: ['fixed', 'uav', 'satellite', 'mobile', 'usv', 'uuv'],

  // Mount type codes (v12.0.0+)
  MountTypeCode: ['TWR', 'BLD', 'GND', 'UAV', 'SAT', 'MOB', 'USV', 'UUV'],

  // Ecosystem codes
  EcosystemCode: ['FOR', 'AGR', 'GRA', 'HEA', 'MIR', 'ALP', 'LAK', 'CON', 'WET', 'DEC', 'MAR', 'PEA'],

  // Instrument types
  InstrumentType: ['phenocam', 'multispectral', 'par', 'ndvi', 'pri', 'hyperspectral', 'rgb', 'thermal', 'lidar', 'sar'],

  // Status values
  Status: ['Active', 'Inactive', 'Maintenance', 'Decommissioned'],

  // Maintenance status values
  MaintenanceStatus: ['scheduled', 'in_progress', 'completed', 'overdue'],

  // Calibration status values
  CalibrationStatus: ['current', 'expired', 'superseded'],

  // User roles
  UserRole: ['admin', 'station-admin', 'station', 'readonly'],

  // Permissions
  Permission: ['read', 'write', 'edit', 'delete', 'admin'],

  // Entity types for maintenance
  EntityType: ['platform', 'instrument']
};

/**
 * Validation rules for each endpoint
 */
export const ENDPOINT_CONTRACTS = {
  // Station endpoints
  'POST /stations': {
    required: ['acronym', 'display_name'],
    fields: {
      acronym: { type: 'string', minLength: 2, maxLength: 10 },
      display_name: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      latitude: { type: 'number', min: -90, max: 90 },
      longitude: { type: 'number', min: -180, max: 180 },
      website_url: { type: 'string', pattern: 'url' },
      contact_email: { type: 'string', pattern: 'email' }
    }
  },
  'PUT /stations/:id': {
    fields: {
      display_name: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      latitude: { type: 'number', min: -90, max: 90 },
      longitude: { type: 'number', min: -180, max: 180 },
      website_url: { type: 'string', pattern: 'url' },
      contact_email: { type: 'string', pattern: 'email' }
    }
  },

  // Platform endpoints
  'POST /platforms': {
    required: ['station_id', 'platform_type'],
    fields: {
      station_id: { type: 'integer', min: 1 },
      platform_type: { type: 'enum', values: SCHEMAS.PlatformType },
      ecosystem_code: { type: 'enum', values: SCHEMAS.EcosystemCode },
      mount_type_code: { type: 'enum', values: SCHEMAS.MountTypeCode },
      display_name: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      latitude: { type: 'number', min: -90, max: 90 },
      longitude: { type: 'number', min: -180, max: 180 },
      vendor: { type: 'string', maxLength: 100 },
      model: { type: 'string', maxLength: 100 },
      agency: { type: 'string', maxLength: 100 },
      satellite: { type: 'string', maxLength: 100 },
      sensor: { type: 'string', maxLength: 100 }
    }
  },
  'PUT /platforms/:id': {
    fields: {
      display_name: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      latitude: { type: 'number', min: -90, max: 90 },
      longitude: { type: 'number', min: -180, max: 180 },
      status: { type: 'enum', values: SCHEMAS.Status }
    }
  },

  // Instrument endpoints
  'POST /instruments': {
    required: ['platform_id', 'instrument_type'],
    fields: {
      platform_id: { type: 'integer', min: 1 },
      instrument_type: { type: 'enum', values: SCHEMAS.InstrumentType },
      normalized_name: { type: 'string', pattern: 'identifier', maxLength: 100 },
      display_name: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      status: { type: 'enum', values: SCHEMAS.Status },
      specifications: { type: 'object' }
    }
  },
  'PUT /instruments/:id': {
    fields: {
      display_name: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      status: { type: 'enum', values: SCHEMAS.Status },
      measurement_status: { type: 'string', maxLength: 100 },
      specifications: { type: 'object' }
    }
  },

  // Maintenance endpoints
  'POST /maintenance': {
    required: ['entity_type', 'entity_id', 'maintenance_type'],
    fields: {
      entity_type: { type: 'enum', values: SCHEMAS.EntityType },
      entity_id: { type: 'integer', min: 1 },
      maintenance_type: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 1000 },
      scheduled_date: { type: 'string', pattern: 'date' },
      notes: { type: 'string', maxLength: 2000 }
    }
  },
  'PUT /maintenance/:id': {
    fields: {
      maintenance_type: { type: 'string', maxLength: 100 },
      description: { type: 'string', maxLength: 1000 },
      scheduled_date: { type: 'string', pattern: 'date' },
      status: { type: 'enum', values: SCHEMAS.MaintenanceStatus },
      notes: { type: 'string', maxLength: 2000 }
    }
  },

  // Calibration endpoints
  'POST /calibrations': {
    required: ['instrument_id', 'calibration_date'],
    fields: {
      instrument_id: { type: 'integer', min: 1 },
      calibration_date: { type: 'string', pattern: 'date' },
      expiry_date: { type: 'string', pattern: 'date' },
      calibrator: { type: 'string', maxLength: 200 },
      panel_serial_number: { type: 'string', maxLength: 100 },
      quality_score: { type: 'number', min: 0, max: 100 },
      cloud_cover: { type: 'string', maxLength: 100 },
      solar_elevation: { type: 'number', min: 0, max: 90 },
      notes: { type: 'string', maxLength: 2000 }
    }
  },
  'PUT /calibrations/:id': {
    fields: {
      calibration_date: { type: 'string', pattern: 'date' },
      expiry_date: { type: 'string', pattern: 'date' },
      calibrator: { type: 'string', maxLength: 200 },
      panel_serial_number: { type: 'string', maxLength: 100 },
      quality_score: { type: 'number', min: 0, max: 100 },
      notes: { type: 'string', maxLength: 2000 }
    }
  },

  // ROI endpoints
  'POST /rois': {
    required: ['instrument_id', 'polygon_points'],
    fields: {
      instrument_id: { type: 'integer', min: 1 },
      roi_name: { type: 'string', pattern: 'roi_name', maxLength: 50 },
      polygon_points: { type: 'string' },
      color: { type: 'string', pattern: 'color' },
      description: { type: 'string', maxLength: 500 },
      vegetation_type: { type: 'string', maxLength: 100 }
    }
  },
  'PUT /rois/:id': {
    fields: {
      polygon_points: { type: 'string' },
      color: { type: 'string', pattern: 'color' },
      description: { type: 'string', maxLength: 500 },
      vegetation_type: { type: 'string', maxLength: 100 },
      is_legacy: { type: 'boolean' },
      legacy_reason: { type: 'string', maxLength: 500 }
    }
  },

  // Auth endpoints
  'POST /auth/login': {
    required: ['username', 'password'],
    fields: {
      username: { type: 'string', minLength: 1, maxLength: 100 },
      password: { type: 'string', minLength: 1, maxLength: 200 }
    }
  }
};

/**
 * Pattern validators
 */
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  identifier: /^[A-Z0-9_]+$/i,
  roi_name: /^ROI_\d{2}$/,
  color: /^#[0-9A-Fa-f]{6}$/
};

/**
 * Validate a value against a field definition
 *
 * @param {any} value - Value to validate
 * @param {Object} fieldDef - Field definition
 * @param {string} fieldName - Field name for error messages
 * @returns {{ valid: boolean, error?: string }}
 */
function validateField(value, fieldDef, fieldName) {
  // Allow undefined/null for optional fields
  if (value === undefined || value === null) {
    return { valid: true };
  }

  const { type, values, min, max, minLength, maxLength, pattern } = fieldDef;

  // Type validation
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: `${fieldName} must be a string` };
      }
      if (minLength !== undefined && value.length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
      }
      if (maxLength !== undefined && value.length > maxLength) {
        return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
      }
      if (pattern && PATTERNS[pattern] && !PATTERNS[pattern].test(value)) {
        return { valid: false, error: `${fieldName} has invalid format (expected ${pattern})` };
      }
      break;

    case 'integer':
      const intValue = parseInt(value, 10);
      if (isNaN(intValue) || !Number.isInteger(Number(value))) {
        return { valid: false, error: `${fieldName} must be an integer` };
      }
      if (min !== undefined && intValue < min) {
        return { valid: false, error: `${fieldName} must be at least ${min}` };
      }
      if (max !== undefined && intValue > max) {
        return { valid: false, error: `${fieldName} must be at most ${max}` };
      }
      break;

    case 'number':
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return { valid: false, error: `${fieldName} must be a number` };
      }
      if (min !== undefined && numValue < min) {
        return { valid: false, error: `${fieldName} must be at least ${min}` };
      }
      if (max !== undefined && numValue > max) {
        return { valid: false, error: `${fieldName} must be at most ${max}` };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: `${fieldName} must be a boolean` };
      }
      break;

    case 'enum':
      if (!values.includes(value)) {
        return { valid: false, error: `${fieldName} must be one of: ${values.join(', ')}` };
      }
      break;

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { valid: false, error: `${fieldName} must be an object` };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return { valid: false, error: `${fieldName} must be an array` };
      }
      break;
  }

  return { valid: true };
}

/**
 * Validate request body against contract
 *
 * @param {Object} body - Request body
 * @param {Object} contract - Endpoint contract
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBody(body, contract) {
  const errors = [];

  if (!contract) {
    return { valid: true, errors: [] };
  }

  // Check required fields
  if (contract.required) {
    for (const field of contract.required) {
      // Support both snake_case and camelCase
      const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (body[field] === undefined && body[camelField] === undefined) {
        errors.push(`${field} is required`);
      }
    }
  }

  // Validate field types and constraints
  if (contract.fields) {
    for (const [field, fieldDef] of Object.entries(contract.fields)) {
      // Support both snake_case and camelCase
      const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      const value = body[field] !== undefined ? body[field] : body[camelField];

      const result = validateField(value, fieldDef, field);
      if (!result.valid) {
        errors.push(result.error);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate query parameters against constraints
 *
 * @param {URLSearchParams} params - Query parameters
 * @param {Object} constraints - Parameter constraints
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateQueryParams(params, constraints = {}) {
  const errors = [];

  // Validate page parameter
  const page = params.get('page');
  if (page !== null) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('page must be a positive integer');
    }
  }

  // Validate limit parameter
  const limit = params.get('limit');
  if (limit !== null) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('limit must be between 1 and 100');
    }
  }

  // Validate sort_order parameter
  const sortOrder = params.get('sort_order');
  if (sortOrder !== null && !['asc', 'desc'].includes(sortOrder)) {
    errors.push('sort_order must be "asc" or "desc"');
  }

  // Custom constraints
  for (const [param, constraint] of Object.entries(constraints)) {
    const value = params.get(param);
    if (value !== null) {
      const result = validateField(value, constraint, param);
      if (!result.valid) {
        errors.push(result.error);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get contract key from method and path
 *
 * @param {string} method - HTTP method
 * @param {string[]} pathSegments - URL path segments
 * @returns {string} Contract key
 */
export function getContractKey(method, pathSegments) {
  const resource = pathSegments[0];
  const id = pathSegments[1];

  if (id && !['station', 'platform', 'type', 'instrument', 'timeline', 'pending', 'overdue', 'current', 'expired', 'expiring', 'active'].includes(id)) {
    return `${method} /${resource}/:id`;
  }

  return `${method} /${resource}`;
}

/**
 * Contract validation middleware
 *
 * @param {Request} request - Incoming request
 * @param {string[]} pathSegments - URL path segments
 * @param {URL} url - Parsed URL
 * @returns {Response|null} Error response or null if valid
 */
export async function contractValidationMiddleware(request, pathSegments, url) {
  const method = request.method;

  // Only validate state-changing requests
  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    // Validate query params for GET requests
    const queryResult = validateQueryParams(url.searchParams);
    if (!queryResult.valid) {
      return createErrorResponse(`Invalid query parameters: ${queryResult.errors.join('; ')}`, 400);
    }
    return null;
  }

  // Get contract for this endpoint
  const contractKey = getContractKey(method, pathSegments);
  const contract = ENDPOINT_CONTRACTS[contractKey];

  if (!contract) {
    // No contract defined - skip validation
    return null;
  }

  // Parse request body
  let body;
  try {
    const clonedRequest = request.clone();
    body = await clonedRequest.json();
  } catch (error) {
    return createErrorResponse('Invalid JSON in request body', 400);
  }

  // Validate body against contract
  const result = validateBody(body, contract);
  if (!result.valid) {
    return createErrorResponse(`Validation failed: ${result.errors.join('; ')}`, 400);
  }

  return null;
}

/**
 * Export schema values for use in validation
 */
export const SchemaValues = {
  platformTypes: SCHEMAS.PlatformType,
  mountTypeCodes: SCHEMAS.MountTypeCode,
  ecosystemCodes: SCHEMAS.EcosystemCode,
  instrumentTypes: SCHEMAS.InstrumentType,
  statusValues: SCHEMAS.Status,
  userRoles: SCHEMAS.UserRole,
  permissions: SCHEMAS.Permission
};
