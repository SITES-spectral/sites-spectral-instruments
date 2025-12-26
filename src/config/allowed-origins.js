// Allowed origins for CORS
// Only these origins can make cross-origin requests to the API

export const ALLOWED_ORIGINS = [
  // Production
  'https://sites.jobelab.com',

  // Cloudflare Workers dev URLs
  'https://sites-spectral-instruments.jose-e5f.workers.dev',

  // Local development
  'http://localhost:8787',
  'http://127.0.0.1:8787',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * Check if an origin is allowed for CORS
 * @param {string|null} origin - The origin header from the request
 * @returns {boolean} - True if origin is allowed
 */
export function isAllowedOrigin(origin) {
  if (!origin) {
    // No origin header - could be same-origin request or server-to-server
    return true;
  }
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get the appropriate Access-Control-Allow-Origin value
 * @param {string|null} origin - The origin header from the request
 * @returns {string} - The allowed origin or the first allowed origin as fallback
 */
export function getAllowedOrigin(origin) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // Return first allowed origin as fallback (for error responses)
  return ALLOWED_ORIGINS[0];
}
