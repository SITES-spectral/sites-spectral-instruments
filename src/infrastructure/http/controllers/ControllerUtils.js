/**
 * Controller Utilities
 *
 * Shared utilities for HTTP controllers including API validation integration.
 * Provides consistent input validation across all controllers.
 *
 * @module infrastructure/http/controllers/ControllerUtils
 * @version 15.6.6
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md
 */

import {
  validatePagination,
  sanitizePaginationParams,
  validateId,
  validateRequestBody,
  validateRequestSize,
  createValidationErrorResponse,
  PAGINATION_DEFAULTS,
  SIZE_LIMITS
} from '../../../utils/api-validation.js';
import { createErrorResponse } from '../../../utils/responses.js';

/**
 * Parse and validate pagination parameters from URL
 *
 * @param {URL} url - Request URL
 * @returns {{valid: boolean, error?: Response, pagination?: {page: number, limit: number, offset: number}}}
 */
export function parsePagination(url) {
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  // Sanitize string params to integers
  const { page, limit } = sanitizePaginationParams(pageParam, limitParam);

  // Validate the values
  const result = validatePagination({ page, limit });

  if (!result.valid) {
    return {
      valid: false,
      error: createValidationErrorResponse(
        `Invalid pagination: ${result.errors.join(', ')}`,
        400
      )
    };
  }

  // Calculate offset for database queries
  const offset = (result.sanitized.page - 1) * result.sanitized.limit;

  return {
    valid: true,
    pagination: {
      page: result.sanitized.page,
      limit: result.sanitized.limit,
      offset
    }
  };
}

/**
 * Parse and validate a path ID parameter
 *
 * @param {string} id - ID from path parameter
 * @param {string} [paramName='id'] - Name for error message
 * @returns {{valid: boolean, error?: Response, value?: number}}
 */
export function parsePathId(id, paramName = 'id') {
  const result = validateId(id);

  if (!result.valid) {
    return {
      valid: false,
      error: createValidationErrorResponse(
        `Invalid ${paramName}: ${result.error}`,
        400
      )
    };
  }

  return {
    valid: true,
    value: result.value
  };
}

/**
 * Parse and validate request body
 *
 * @param {Request} request - HTTP request
 * @returns {Promise<{valid: boolean, error?: Response, body?: object}>}
 */
export async function parseRequestBody(request) {
  // Check content-length for size limits
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const sizeResult = validateRequestSize(parseInt(contentLength, 10));
    if (!sizeResult.valid) {
      return {
        valid: false,
        error: createValidationErrorResponse(sizeResult.error, 413)
      };
    }
  }

  // Parse JSON
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return {
      valid: false,
      error: createErrorResponse('Invalid JSON in request body', 400)
    };
  }

  // Validate body is an object
  const bodyResult = validateRequestBody(body);
  if (!bodyResult.valid) {
    return {
      valid: false,
      error: createValidationErrorResponse(bodyResult.error, 400)
    };
  }

  return {
    valid: true,
    body
  };
}

/**
 * Parse sorting parameters from URL
 *
 * @param {URL} url - Request URL
 * @param {string[]} allowedFields - Allowed sort fields
 * @param {string} defaultField - Default sort field
 * @returns {{sortBy: string, sortOrder: 'asc' | 'desc'}}
 */
export function parseSorting(url, allowedFields, defaultField) {
  let sortBy = url.searchParams.get('sort_by') || defaultField;
  let sortOrder = url.searchParams.get('sort_order') || 'asc';

  // Validate sort field
  if (!allowedFields.includes(sortBy)) {
    sortBy = defaultField;
  }

  // Validate sort order
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    sortOrder = 'asc';
  }

  return { sortBy, sortOrder };
}

/**
 * Check if an ID is numeric
 *
 * @param {string} id - ID string to check
 * @returns {boolean}
 */
export function isNumericId(id) {
  return /^\d+$/.test(id);
}

/**
 * Parse optional ID that could be numeric or string (e.g., station acronym)
 *
 * @param {string} id - ID from path
 * @returns {{isNumeric: boolean, numericValue?: number, stringValue: string}}
 */
export function parseFlexibleId(id) {
  if (isNumericId(id)) {
    const result = validateId(id);
    if (result.valid) {
      return {
        isNumeric: true,
        numericValue: result.value,
        stringValue: id
      };
    }
  }

  return {
    isNumeric: false,
    stringValue: id
  };
}

/**
 * Export validation constants for reference
 */
export { PAGINATION_DEFAULTS, SIZE_LIMITS };
