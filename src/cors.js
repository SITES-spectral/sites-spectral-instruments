// CORS handling for the SITES Spectral application
import { ALLOWED_ORIGINS, isAllowedOrigin, getAllowedOrigin } from './config/allowed-origins.js';

/**
 * Create CORS headers and handler with origin validation
 * @param {Request} request - The incoming request (optional, for dynamic origin)
 * @returns {Object} - corsHeaders object and handleCors function
 */
export function createCors(request = null) {
  const origin = request?.headers?.get('Origin') || null;
  const allowedOrigin = getAllowedOrigin(origin);

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin', // Important for caching with dynamic origins
  };

  const handleCors = () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  };

  return { corsHeaders, handleCors };
}

/**
 * Validate that a request's origin is allowed
 * Returns true if allowed, false if blocked
 * @param {Request} request - The incoming request
 * @returns {boolean}
 */
export function validateCorsOrigin(request) {
  const origin = request.headers.get('Origin');
  return isAllowedOrigin(origin);
}

/**
 * Create a CORS error response for blocked origins
 * @param {string} origin - The blocked origin
 * @returns {Response}
 */
export function createCorsErrorResponse(origin) {
  return new Response(
    JSON.stringify({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: origin || 'unknown'
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
      }
    }
  );
}

// Re-export for convenience
export { ALLOWED_ORIGINS, isAllowedOrigin, getAllowedOrigin };