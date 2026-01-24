// CSRF Protection Utilities
// Provides CSRF token generation, validation, and request origin checking
// SECURITY: Protects against Cross-Site Request Forgery attacks
//
// v15.0.0: Synchronized with CORS allowed origins (SEC-001 audit fix)

import { isAllowedOrigin } from '../config/allowed-origins.js';

/**
 * Validate the origin of a request
 * Checks both Origin and Referer headers against allowed list
 * SECURITY: Uses centralized isAllowedOrigin from config/allowed-origins.js
 * v15.0.0: Synchronized with CORS configuration for consistency
 * @param {Request} request - The incoming request
 * @returns {Object} Validation result with isValid and origin
 */
export function validateRequestOrigin(request) {
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');

    // For same-origin requests, Origin might not be set
    // In that case, check Referer
    if (origin) {
        // v15.0.0: Use centralized isAllowedOrigin which supports:
        // - Static list of allowed origins
        // - Dynamic subdomain matching for *.sitesspectral.work
        // - Workers.dev subdomains for development
        const isValid = isAllowedOrigin(origin);
        return { isValid, origin, source: 'origin' };
    }

    if (referer) {
        try {
            const refererUrl = new URL(referer);
            const refererOrigin = refererUrl.origin;
            // v15.0.0: Use centralized isAllowedOrigin
            const isValid = isAllowedOrigin(refererOrigin);
            return { isValid, origin: refererOrigin, source: 'referer' };
        } catch (e) {
            return { isValid: false, origin: null, source: 'referer', error: 'Invalid referer URL' };
        }
    }

    // No origin or referer - could be a direct API call or same-origin
    // For browser requests, at least one should be present
    // We'll be lenient here but log for monitoring
    return { isValid: true, origin: null, source: 'none', warning: 'No origin or referer header' };
}

/**
 * Generate a CSRF token
 * Creates a secure random token for CSRF protection
 * @returns {string} A secure CSRF token
 */
export function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token from request header
 * @param {Request} request - The incoming request
 * @param {string} expectedToken - The expected CSRF token
 * @returns {boolean} Whether the token is valid
 */
export function validateCSRFToken(request, expectedToken) {
    if (!expectedToken) return false;

    // CSRF token can be in X-CSRF-Token header or _csrf query parameter
    const headerToken = request.headers.get('X-CSRF-Token');
    if (headerToken && headerToken === expectedToken) {
        return true;
    }

    // Check query parameter as fallback (useful for some form submissions)
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('_csrf');
    if (queryToken && queryToken === expectedToken) {
        return true;
    }

    return false;
}

/**
 * Check if a request method requires CSRF protection
 * @param {string} method - The HTTP method
 * @returns {boolean} Whether CSRF protection is required
 */
export function requiresCSRFProtection(method) {
    // State-changing methods require CSRF protection
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

/**
 * CSRF Protection Middleware
 * Validates request origin for state-changing requests
 * @param {Request} request - The incoming request
 * @returns {Object} Validation result with isValid and error message if invalid
 */
export function csrfProtect(request) {
    const method = request.method.toUpperCase();

    // Skip CSRF check for safe methods
    if (!requiresCSRFProtection(method)) {
        return { isValid: true };
    }

    // Validate request origin
    const originValidation = validateRequestOrigin(request);

    if (!originValidation.isValid) {
        return {
            isValid: false,
            error: `CSRF validation failed: Invalid origin '${originValidation.origin}'`,
            status: 403
        };
    }

    // Additional check: Ensure request is not from a different site via form submission
    const contentType = request.headers.get('Content-Type') || '';

    // Form submissions from malicious sites would have application/x-www-form-urlencoded
    // Our API expects application/json, so reject form-encoded data from cross-origin
    if (contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('multipart/form-data')) {

        // If it's a form submission, we need stricter origin checking
        if (!originValidation.origin || originValidation.source === 'none') {
            return {
                isValid: false,
                error: 'CSRF validation failed: Form submissions require Origin header',
                status: 403
            };
        }
    }

    return { isValid: true, origin: originValidation.origin };
}

/**
 * Create CSRF error response
 * @param {string} message - Error message
 * @returns {Response} 403 Forbidden response
 */
export function createCSRFErrorResponse(message = 'CSRF validation failed') {
    return new Response(JSON.stringify({
        error: message,
        code: 'CSRF_VALIDATION_FAILED'
    }), {
        status: 403,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

/**
 * Add CSRF token to response headers
 * @param {Response} response - The response to modify
 * @param {string} token - The CSRF token
 * @returns {Response} Response with CSRF token header
 */
export function addCSRFTokenToResponse(response, token) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-CSRF-Token', token);
    return newResponse;
}
