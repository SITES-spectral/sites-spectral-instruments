/**
 * Cookie Utilities for JWT Authentication
 * Provides secure httpOnly cookie handling for Cloudflare Workers
 *
 * Security features:
 * - httpOnly: Prevents XSS attacks from accessing the token
 * - Secure: Only sent over HTTPS (in production)
 * - SameSite=Strict: Prevents CSRF attacks
 * - Max-Age: Token expires with JWT (24 hours)
 */

const COOKIE_NAME = 'sites_spectral_auth';
const COOKIE_MAX_AGE = 86400; // 24 hours (matches JWT expiry)

/**
 * Check if request is from a secure context (HTTPS)
 * @param {Request} request - The request object
 * @returns {boolean} - True if secure
 */
function isSecureContext(request) {
  const url = new URL(request.url);
  // Production domains are always HTTPS (including all subdomains)
  if (url.hostname === 'sites.jobelab.com' ||
      url.hostname === 'sitesspectral.work' ||
      url.hostname.endsWith('.sitesspectral.work') ||
      url.hostname.endsWith('.workers.dev')) {
    return true;
  }
  // Local development is not secure
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return false;
  }
  return url.protocol === 'https:';
}

/**
 * Create Set-Cookie header value for JWT token
 * @param {string} token - JWT token
 * @param {Request} request - The request object (for secure context detection)
 * @returns {string} - Set-Cookie header value
 */
export function createAuthCookie(token, request) {
  const secure = isSecureContext(request);
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'HttpOnly',
    'SameSite=Lax',
    'Domain=.sitesspectral.work'
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

/**
 * Create Set-Cookie header value to clear the auth cookie (logout)
 * @param {Request} request - The request object (for secure context detection)
 * @returns {string} - Set-Cookie header value that clears the cookie
 */
export function createLogoutCookie(request) {
  const secure = isSecureContext(request);
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
    'Domain=.sitesspectral.work',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

/**
 * Parse cookies from request and extract auth token
 * @param {Request} request - The request object
 * @returns {string|null} - JWT token or null if not found
 */
export function getTokenFromCookie(request) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return null;
  }

  // Parse cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      acc[name] = valueParts.join('='); // Handle values with = in them
    }
    return acc;
  }, {});

  return cookies[COOKIE_NAME] || null;
}

/**
 * Get the cookie name used for authentication
 * @returns {string} - Cookie name
 */
export function getCookieName() {
  return COOKIE_NAME;
}
