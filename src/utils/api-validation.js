/**
 * API Input Validation Utilities
 *
 * Centralized validation for API edge cases including pagination,
 * ID validation, request body validation, and size limits.
 *
 * @module utils/api-validation
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md
 */

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 25,
  maxLimit: 100
};

/**
 * Default request size limits
 */
export const SIZE_LIMITS = {
  maxRequestSize: 1048576 // 1MB
};

/**
 * Sanitize pagination parameters from query strings
 *
 * @param {string|number|null} pageParam - Page parameter
 * @param {string|number|null} limitParam - Limit parameter
 * @returns {{page: number, limit: number}} Sanitized pagination values
 */
export function sanitizePaginationParams(pageParam, limitParam) {
  let page = PAGINATION_DEFAULTS.page;
  let limit = PAGINATION_DEFAULTS.limit;

  if (pageParam !== null && pageParam !== undefined && pageParam !== '') {
    const parsed = parseInt(String(pageParam), 10);
    if (!isNaN(parsed)) {
      page = parsed;
    }
  }

  if (limitParam !== null && limitParam !== undefined && limitParam !== '') {
    const parsed = parseInt(String(limitParam), 10);
    if (!isNaN(parsed)) {
      limit = parsed;
    }
  }

  return { page, limit };
}

/**
 * Validate pagination parameters
 *
 * @param {{page?: number, limit?: number}} params - Pagination parameters
 * @returns {{valid: boolean, errors?: string[], sanitized?: {page: number, limit: number}}}
 */
export function validatePagination(params) {
  const errors = [];
  let { page, limit } = params;

  // Use defaults if not provided
  if (page === undefined || page === null) {
    page = PAGINATION_DEFAULTS.page;
  }
  if (limit === undefined || limit === null) {
    limit = PAGINATION_DEFAULTS.limit;
  }

  // Validate page
  if (!Number.isFinite(page)) {
    errors.push('page must be a valid number');
  } else if (page < 1) {
    errors.push('page must be at least 1');
  }

  // Validate limit
  if (!Number.isFinite(limit)) {
    errors.push('limit must be a valid number');
  } else if (limit < 1) {
    errors.push('limit must be at least 1');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Cap limit at maximum
  const sanitizedLimit = Math.min(limit, PAGINATION_DEFAULTS.maxLimit);

  return {
    valid: true,
    sanitized: {
      page: Math.floor(page),
      limit: Math.floor(sanitizedLimit)
    }
  };
}

/**
 * Validate an ID parameter
 *
 * @param {string|number} id - ID to validate
 * @returns {{valid: boolean, value?: number, error?: string}}
 */
export function validateId(id) {
  // Parse if string
  let numId = typeof id === 'string' ? parseInt(id, 10) : id;

  // Check for valid finite positive integer
  if (!Number.isFinite(numId)) {
    return { valid: false, error: 'ID must be a positive integer' };
  }

  if (numId <= 0) {
    return { valid: false, error: 'ID must be a positive integer' };
  }

  if (!Number.isInteger(numId)) {
    return { valid: false, error: 'ID must be a positive integer' };
  }

  // Check for safe integer range
  if (numId > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: 'ID exceeds maximum safe integer' };
  }

  return { valid: true, value: numId };
}

/**
 * Validate request body is a plain object
 *
 * @param {any} body - Request body to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateRequestBody(body) {
  if (body === null) {
    return { valid: false, error: 'Request body must be an object, not null' };
  }

  if (Array.isArray(body)) {
    return { valid: false, error: 'Request body must be an object, not an array' };
  }

  if (typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' };
  }

  return { valid: true };
}

/**
 * Validate request size
 *
 * @param {number|null} contentLength - Content-Length header value
 * @param {{maxSize?: number}} options - Options
 * @returns {{valid: boolean, error?: string}}
 */
export function validateRequestSize(contentLength, options = {}) {
  const maxSize = options.maxSize || SIZE_LIMITS.maxRequestSize;

  // Allow missing content-length (will be validated by body parsing)
  if (contentLength === null || contentLength === undefined) {
    return { valid: true };
  }

  if (contentLength > maxSize) {
    const maxSizeMB = (maxSize / 1048576).toFixed(1);
    return {
      valid: false,
      error: `Request body too large. Maximum size is ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Create standardized error response for validation failures
 *
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
export function createValidationErrorResponse(message, status = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Middleware to validate common API request parameters
 *
 * @param {Request} request - Incoming request
 * @returns {{valid: boolean, error?: Response, pagination?: {page: number, limit: number}}}
 */
export function validateApiRequest(request) {
  const url = new URL(request.url);

  // Validate request size
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

  // Parse and validate pagination if present
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  if (pageParam || limitParam) {
    const { page, limit } = sanitizePaginationParams(pageParam, limitParam);
    const paginationResult = validatePagination({ page, limit });

    if (!paginationResult.valid) {
      return {
        valid: false,
        error: createValidationErrorResponse(
          `Invalid pagination: ${paginationResult.errors.join(', ')}`,
          400
        )
      };
    }

    return {
      valid: true,
      pagination: paginationResult.sanitized
    };
  }

  return { valid: true };
}

/**
 * Validate and parse request body
 *
 * @param {Request} request - Incoming request
 * @returns {Promise<{valid: boolean, body?: object, error?: Response}>}
 */
export async function validateAndParseBody(request) {
  try {
    const body = await request.json();
    const bodyResult = validateRequestBody(body);

    if (!bodyResult.valid) {
      return {
        valid: false,
        error: createValidationErrorResponse(bodyResult.error, 400)
      };
    }

    return { valid: true, body };
  } catch (e) {
    return {
      valid: false,
      error: createValidationErrorResponse('Invalid JSON in request body', 400)
    };
  }
}

/**
 * Validate path parameter ID
 *
 * @param {string} id - ID from path parameter
 * @param {string} paramName - Name of the parameter for error message
 * @returns {{valid: boolean, value?: number, error?: Response}}
 */
export function validatePathId(id, paramName = 'id') {
  const result = validateId(id);

  if (!result.valid) {
    return {
      valid: false,
      error: createValidationErrorResponse(`Invalid ${paramName}: ${result.error}`, 400)
    };
  }

  return { valid: true, value: result.value };
}
