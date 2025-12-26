/**
 * Auth Rate Limiter Middleware
 *
 * Implements sliding window rate limiting for authentication endpoints.
 * Uses D1 database to track failed login attempts across Worker isolates.
 *
 * Rate limits:
 * - Login: 5 attempts per minute per IP
 * - Other auth endpoints: 30 requests per minute per IP
 *
 * @module middleware/auth-rate-limiter
 * @version 12.0.8
 */

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000 // 5 minutes after limit exceeded
  },
  verify: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 60 * 1000 // 1 minute after limit exceeded
  }
};

/**
 * Get client IP from request
 * @param {Request} request
 * @returns {string}
 */
function getClientIP(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    request.headers.get('X-Real-IP') ||
    'unknown'
  );
}

/**
 * Create rate limit exceeded response
 * @param {number} retryAfter - Seconds until rate limit resets
 * @returns {Response}
 */
function createRateLimitResponse(retryAfter) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Too many attempts. Please try again later.',
    retry_after_seconds: retryAfter
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + retryAfter)
    }
  });
}

/**
 * Check if IP is rate limited for auth action
 * Uses D1 database for distributed rate limiting across Worker isolates.
 *
 * @param {string} clientIP - Client IP address
 * @param {string} action - Auth action (login, verify)
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>}
 */
export async function checkAuthRateLimit(clientIP, action, env) {
  const config = RATE_LIMITS[action] || RATE_LIMITS.verify;
  const windowStart = new Date(Date.now() - config.windowMs).toISOString();

  try {
    // Count recent attempts from this IP
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as attempt_count, MAX(timestamp) as last_attempt
      FROM auth_rate_limits
      WHERE client_ip = ? AND action = ? AND timestamp > ?
    `).bind(clientIP, action, windowStart).first();

    const attemptCount = result?.attempt_count || 0;
    const lastAttempt = result?.last_attempt ? new Date(result.last_attempt) : null;

    // Check if currently blocked
    if (attemptCount >= config.maxAttempts) {
      const blockEndsAt = lastAttempt
        ? new Date(lastAttempt.getTime() + config.blockDurationMs)
        : new Date(Date.now() + config.blockDurationMs);

      if (Date.now() < blockEndsAt.getTime()) {
        const retryAfter = Math.ceil((blockEndsAt.getTime() - Date.now()) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt: Math.ceil(blockEndsAt.getTime() / 1000),
          retryAfter
        };
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxAttempts - attemptCount),
      resetAt: Math.ceil((Date.now() + config.windowMs) / 1000)
    };

  } catch (error) {
    // If rate limit check fails (e.g., table doesn't exist), allow the request
    // but log the error for monitoring
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: config.maxAttempts, resetAt: 0 };
  }
}

/**
 * Record an auth attempt for rate limiting
 *
 * @param {string} clientIP - Client IP address
 * @param {string} action - Auth action (login, verify)
 * @param {boolean} success - Whether the attempt was successful
 * @param {string|null} username - Username attempted (for logging)
 * @param {Object} env - Cloudflare Worker environment
 */
export async function recordAuthAttempt(clientIP, action, success, username, env) {
  try {
    // Only record failed attempts for rate limiting (successful logins reset the counter)
    if (success) {
      // Clear previous failed attempts on successful login
      await env.DB.prepare(`
        DELETE FROM auth_rate_limits
        WHERE client_ip = ? AND action = ?
      `).bind(clientIP, action).run();
      return;
    }

    // Record failed attempt
    await env.DB.prepare(`
      INSERT INTO auth_rate_limits (client_ip, action, username, timestamp)
      VALUES (?, ?, ?, ?)
    `).bind(
      clientIP,
      action,
      username || 'unknown',
      new Date().toISOString()
    ).run();

    // Cleanup old entries (older than 1 hour) to prevent table bloat
    // Run occasionally (1 in 10 requests)
    if (Math.random() < 0.1) {
      const cleanupTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await env.DB.prepare(`
        DELETE FROM auth_rate_limits WHERE timestamp < ?
      `).bind(cleanupTime).run();
    }

  } catch (error) {
    console.error('Failed to record auth attempt:', error);
  }
}

/**
 * Auth rate limiter middleware
 * Wraps auth handlers with rate limiting protection.
 *
 * @param {string} action - Auth action being performed
 * @param {Request} request - Incoming request
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Promise<Response|null>} Rate limit response if exceeded, null otherwise
 */
export async function authRateLimitMiddleware(action, request, env) {
  const clientIP = getClientIP(request);

  const rateLimit = await checkAuthRateLimit(clientIP, action, env);

  if (!rateLimit.allowed) {
    // Log rate limit violation
    console.warn(`Rate limit exceeded for ${action} from IP: ${clientIP}`);

    return createRateLimitResponse(rateLimit.retryAfter);
  }

  // Add rate limit headers to be included in response
  request.rateLimitHeaders = {
    'X-RateLimit-Limit': String(RATE_LIMITS[action]?.maxAttempts || 30),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(rateLimit.resetAt)
  };

  return null; // Allow request to proceed
}

/**
 * Get rate limit headers to add to response
 * @param {Request} request
 * @returns {Object}
 */
export function getRateLimitHeaders(request) {
  return request.rateLimitHeaders || {};
}
