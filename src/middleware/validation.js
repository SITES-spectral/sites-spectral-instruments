// Input Validation Middleware for SITES Spectral API v2
// Enhanced request validation with proper error handling

import { createErrorResponse } from '../utils/responses.js';

/**
 * Maximum request body size (1MB)
 */
const MAX_BODY_SIZE = 1024 * 1024;

/**
 * Validate Content-Type header for JSON requests
 * @param {Request} request - The incoming request
 * @returns {Response|null} Error response if invalid, null if valid
 */
export function validateContentType(request) {
  const method = request.method;

  // Only check Content-Type for methods that have a body
  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    return null;
  }

  const contentType = request.headers.get('Content-Type');

  if (!contentType) {
    return createErrorResponse('Content-Type header is required for this request', 400);
  }

  if (!contentType.includes('application/json')) {
    return createErrorResponse('Content-Type must be application/json', 415);
  }

  return null;
}

/**
 * Safely parse JSON from request body with error handling
 * @param {Request} request - The incoming request
 * @returns {Promise<{data: Object|null, error: Response|null}>}
 */
export async function safeParseJSON(request) {
  try {
    // Check Content-Length if available
    const contentLength = request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return {
        data: null,
        error: createErrorResponse('Request body too large', 413)
      };
    }

    const text = await request.text();

    // Check actual body size
    if (text.length > MAX_BODY_SIZE) {
      return {
        data: null,
        error: createErrorResponse('Request body too large', 413)
      };
    }

    // Empty body is valid for some requests
    if (!text.trim()) {
      return { data: {}, error: null };
    }

    const data = JSON.parse(text);
    return { data, error: null };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return {
        data: null,
        error: createErrorResponse(`Invalid JSON: ${e.message}`, 400)
      };
    }
    return {
      data: null,
      error: createErrorResponse('Failed to parse request body', 400)
    };
  }
}

/**
 * Validate required fields are present
 * @param {Object} data - The parsed data object
 * @param {Array<string>} requiredFields - List of required field names
 * @returns {Response|null} Error response if validation fails, null if valid
 */
export function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    return createErrorResponse(
      `Missing required fields: ${missing.join(', ')}`,
      400
    );
  }

  return null;
}

/**
 * Validate field types match expected types
 * @param {Object} data - The parsed data object
 * @param {Object} schema - Schema defining field types { fieldName: 'string'|'number'|'boolean'|'array'|'object' }
 * @returns {Response|null} Error response if validation fails, null if valid
 */
export function validateFieldTypes(data, schema) {
  const errors = [];

  for (const [field, expectedType] of Object.entries(schema)) {
    const value = data[field];

    // Skip undefined/null (use validateRequiredFields for required fields)
    if (value === undefined || value === null) {
      continue;
    }

    let actualType = typeof value;
    if (Array.isArray(value)) {
      actualType = 'array';
    }

    if (actualType !== expectedType) {
      errors.push(`${field} must be ${expectedType}, got ${actualType}`);
    }
  }

  if (errors.length > 0) {
    return createErrorResponse(
      `Type validation failed: ${errors.join('; ')}`,
      400
    );
  }

  return null;
}

/**
 * Validate numeric value is within range
 * @param {number} value - The value to check
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {string} fieldName - Name of the field for error message
 * @returns {Response|null} Error response if validation fails, null if valid
 */
export function validateRange(value, min, max, fieldName) {
  if (typeof value !== 'number' || isNaN(value)) {
    return createErrorResponse(`${fieldName} must be a number`, 400);
  }

  if (value < min || value > max) {
    return createErrorResponse(
      `${fieldName} must be between ${min} and ${max}`,
      400
    );
  }

  return null;
}

/**
 * Validate coordinates are within valid ranges
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {Response|null} Error response if validation fails, null if valid
 */
export function validateCoordinates(latitude, longitude) {
  if (latitude !== undefined && latitude !== null) {
    const latError = validateRange(latitude, -90, 90, 'latitude');
    if (latError) return latError;
  }

  if (longitude !== undefined && longitude !== null) {
    const lonError = validateRange(longitude, -180, 180, 'longitude');
    if (lonError) return lonError;
  }

  return null;
}

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - The input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
