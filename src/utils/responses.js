// Response Utilities
// Centralized response formatting and error handling

/**
 * Create a successful JSON response
 * @param {any} data - The response data
 * @param {number} status - HTTP status code (default: 200)
 * @returns {Response} JSON response
 */
export function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create an error JSON response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 400)
 * @returns {Response} JSON error response
 */
export function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a validation error response with detailed field errors
 * @param {Array} errors - Array of validation errors
 * @returns {Response} JSON validation error response
 */
export function createValidationErrorResponse(errors) {
  return new Response(JSON.stringify({
    error: 'Validation failed',
    validation_errors: errors
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a method not allowed response
 * @returns {Response} 405 response
 */
export function createMethodNotAllowedResponse() {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create an unauthorized response
 * @returns {Response} 401 response
 */
export function createUnauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a forbidden response
 * @returns {Response} 403 response
 */
export function createForbiddenResponse() {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a not found response
 * @returns {Response} 404 response
 */
export function createNotFoundResponse() {
  return new Response(JSON.stringify({ error: 'Resource not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create an internal server error response
 * @param {Error} error - The error object
 * @returns {Response} 500 response
 */
export function createInternalServerErrorResponse(error) {
  console.error('Internal Server Error:', error);
  return new Response(JSON.stringify({
    error: 'Internal server error',
    message: error.message
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Create a rate limit exceeded response
 * @returns {Response} 429 response
 */
export function createRateLimitResponse() {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' }
  });
}