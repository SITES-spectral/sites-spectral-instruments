/**
 * Magic Links Handler
 * Token-based authentication for station internal users
 *
 * Provides passwordless, time-limited access for internal station users
 * who need read-only access to station data.
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module handlers/magic-links
 * @version 15.0.0
 */

import { getUserFromRequest } from '../auth/authentication.js';
import { createErrorResponse, createUnauthorizedResponse, createForbiddenResponse } from '../utils/responses.js';
import { logSecurityEvent } from '../utils/logging.js';
import { createAuthCookie } from '../auth/cookie-utils.js';
import { SignJWT } from 'jose';
import { authRateLimitMiddleware, recordAuthAttempt } from '../middleware/auth-rate-limiter.js';
import { sanitizeString, sanitizeInteger, sanitizeEnum } from '../utils/validation.js';
import { sendMagicLinkEmail } from '../services/email-service.js';

/**
 * Default expiry duration for magic links (7 days in milliseconds)
 */
const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate a cryptographically secure random token
 *
 * @param {number} length - Token length in bytes (default: 32 = 256 bits)
 * @returns {string} Hex-encoded token
 */
function generateToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a token for secure storage
 * Uses SHA-256 for consistent, secure hashing
 *
 * @param {string} token - Raw token
 * @returns {Promise<string>} Hex-encoded hash
 */
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Validate magic link creation input (ML-002)
 *
 * @param {Object} body - Request body
 * @returns {Object} { valid: boolean, errors: string[], sanitized: Object }
 */
function validateMagicLinkInput(body) {
  const errors = [];
  const sanitized = {};

  // Body must be an object (not array, not null)
  if (body === null || Array.isArray(body) || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'], sanitized: {} };
  }

  // Required: station_id
  const stationId = sanitizeInteger(body.station_id, { min: 1 });
  if (!stationId) {
    errors.push('station_id is required and must be a positive integer');
  } else {
    sanitized.station_id = stationId;
  }

  // Optional: label (max 200 chars)
  if (body.label !== undefined && body.label !== null && body.label !== '') {
    const label = sanitizeString(body.label, { maxLength: 200 });
    if (label === null && body.label) {
      errors.push('label must be a valid string (max 200 characters)');
    } else {
      sanitized.label = label;
    }
  }

  // Optional: description (max 1000 chars)
  if (body.description !== undefined && body.description !== null && body.description !== '') {
    const desc = sanitizeString(body.description, { maxLength: 1000 });
    if (desc === null && body.description) {
      errors.push('description must be a valid string (max 1000 characters)');
    } else {
      sanitized.description = desc;
    }
  }

  // Optional: expires_in_days (1-365)
  if (body.expires_in_days !== undefined) {
    const days = sanitizeInteger(body.expires_in_days, { min: 1, max: 365 });
    if (days === null) {
      errors.push('expires_in_days must be between 1 and 365');
    } else {
      sanitized.expires_in_days = days;
    }
  } else {
    sanitized.expires_in_days = 7; // default
  }

  // Optional: single_use (boolean)
  sanitized.single_use = body.single_use === true || body.single_use === 'true' || body.single_use === 1;

  // Optional: role (readonly or station-internal)
  if (body.role !== undefined) {
    const role = sanitizeEnum(body.role, ['readonly', 'station-internal']);
    if (!role) {
      errors.push('role must be "readonly" or "station-internal"');
    } else {
      sanitized.role = role;
    }
  } else {
    sanitized.role = 'readonly'; // default
  }

  // Optional: recipient_email (for sending magic link via email)
  if (body.recipient_email !== undefined && body.recipient_email !== null && body.recipient_email !== '') {
    const email = sanitizeString(body.recipient_email, { maxLength: 254 });
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('recipient_email must be a valid email address');
      } else {
        sanitized.recipient_email = email.toLowerCase();
      }
    } else {
      errors.push('recipient_email must be a valid string');
    }
  }

  // Optional: recipient_name (for email personalization)
  if (body.recipient_name !== undefined && body.recipient_name !== null && body.recipient_name !== '') {
    const name = sanitizeString(body.recipient_name, { maxLength: 100 });
    if (name === null && body.recipient_name) {
      errors.push('recipient_name must be a valid string (max 100 characters)');
    } else {
      sanitized.recipient_name = name;
    }
  }

  // Optional: send_email (default true if recipient_email provided)
  sanitized.send_email = body.send_email !== false; // Default to true

  // Optional: ip_pinning (default false) - ML-006
  sanitized.ip_pinning_enabled = body.ip_pinning === true || body.ip_pinning === 'true' || body.ip_pinning === 1;

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Handle magic link endpoints
 *
 * @param {string} method - HTTP method
 * @param {string[]} pathSegments - Path segments after /api/v11/magic-links
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
export async function handleMagicLinks(method, pathSegments, request, env) {
  const action = pathSegments[0];

  switch (action) {
    case 'create':
      if (method !== 'POST') {
        return createErrorResponse('Method not allowed', 405);
      }
      return await createMagicLink(request, env);

    case 'validate':
      if (method !== 'GET') {
        return createErrorResponse('Method not allowed', 405);
      }
      return await validateMagicLink(request, env);

    case 'revoke':
      if (method !== 'POST') {
        return createErrorResponse('Method not allowed', 405);
      }
      return await revokeMagicLink(request, env);

    case 'list':
      if (method !== 'GET') {
        return createErrorResponse('Method not allowed', 405);
      }
      return await listMagicLinks(request, env);

    default:
      return createErrorResponse('Magic link endpoint not found', 404);
  }
}

/**
 * Create a new magic link
 * Only station admins and global admins can create magic links
 *
 * ML-001: Rate limiting applied (5 per hour)
 * ML-002: Input validation with sanitization
 * ML-003: JWT_SECRET validation
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function createMagicLink(request, env) {
  // ML-001: Apply rate limiting
  const rateLimitResponse = await authRateLimitMiddleware('magic_link_create', request, env);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // ML-003: Validate JWT_SECRET is configured
  if (!env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET not configured');
    return createErrorResponse('Authentication service unavailable', 500);
  }

  // Authenticate user
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return createUnauthorizedResponse();
  }

  // Check permissions - only admins can create magic links
  const canCreate = ['admin', 'sites-admin', 'station-admin'].includes(user.role);
  if (!canCreate) {
    return createForbiddenResponse('Only admins can create magic links');
  }

  try {
    const body = await request.json();

    // ML-002: Validate and sanitize input
    const validation = validateMagicLinkInput(body);
    if (!validation.valid) {
      return createErrorResponse(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }

    const {
      station_id,
      label,
      description,
      expires_in_days,
      single_use,
      role,
      recipient_email,
      recipient_name,
      send_email,
      ip_pinning_enabled
    } = validation.sanitized;

    // Station admins can only create links for their own station
    if (user.role === 'station-admin' && user.station_id !== station_id) {
      return createForbiddenResponse('You can only create magic links for your own station');
    }

    // Generate token
    const token = generateToken(32);
    const tokenHash = await hashToken(token);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000);

    // Insert into database (including ip_pinning_enabled for ML-006)
    const result = await env.DB.prepare(`
      INSERT INTO magic_link_tokens (
        token, token_hash, station_id, created_by_user_id,
        label, description, role, expires_at, single_use, ip_pinning_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      token.substring(0, 8) + '...', // Store truncated token for display only
      tokenHash,
      station_id,
      user.id,
      label || null,
      description || null,
      role,
      expiresAt.toISOString(),
      single_use ? 1 : 0,
      ip_pinning_enabled ? 1 : 0
    ).run();

    // Get station acronym for URL
    const station = await env.DB.prepare(`
      SELECT acronym FROM stations WHERE id = ?
    `).bind(station_id).first();

    // Build magic link URL
    const baseUrl = `https://${station?.acronym?.toLowerCase() || 'station'}.sitesspectral.work`;
    const magicLinkUrl = `${baseUrl}/auth/magic?token=${token}`;

    // Log the event
    await logSecurityEvent('MAGIC_LINK_CREATED', {
      creator_id: user.id,
      creator_username: user.username,
      station_id,
      token_id: result.lastRowId,
      expires_at: expiresAt.toISOString(),
      recipient_email: recipient_email || null
    }, request, env);

    // Send email if recipient_email is provided and send_email is true
    let emailResult = null;
    if (recipient_email && send_email) {
      // Get station display name
      const stationDetails = await env.DB.prepare(`
        SELECT display_name FROM stations WHERE id = ?
      `).bind(station_id).first();

      emailResult = await sendMagicLinkEmail({
        recipientEmail: recipient_email,
        recipientName: recipient_name,
        magicLinkUrl,
        stationName: stationDetails?.display_name || station?.acronym || 'Unknown Station',
        stationAcronym: station?.acronym || 'UNKNOWN',
        expiresAt: expiresAt.toISOString(),
        label,
        createdBy: user.username
      }, env);

      // Log email sending result
      await logSecurityEvent(
        emailResult.success ? 'MAGIC_LINK_EMAIL_SENT' : 'MAGIC_LINK_EMAIL_FAILED',
        {
          token_id: result.lastRowId,
          recipient_email,
          error: emailResult.error || null
        },
        request,
        env
      );
    }

    // Build response - only include token/URL if email was NOT sent successfully
    // This ensures the link is either emailed OR returned, not both (security best practice)
    const response = {
      success: true,
      magic_link: {
        id: result.lastRowId,
        station_id,
        station_acronym: station?.acronym,
        label,
        role,
        expires_at: expiresAt.toISOString(),
        single_use
      }
    };

    if (recipient_email && send_email) {
      // Email was requested
      if (emailResult?.success) {
        response.message = `Magic link sent successfully to ${recipient_email}`;
        response.email_sent = true;
        // Don't include token/URL in response when email is sent (security)
      } else {
        // Email failed - return token so admin can share manually
        response.magic_link.token = token;
        response.magic_link.url = magicLinkUrl;
        response.message = `Magic link created but email failed to send. Share this URL securely: ${emailResult?.error || 'Unknown error'}`;
        response.email_sent = false;
        response.email_error = emailResult?.error;
      }
    } else {
      // No email requested - return token for manual sharing
      response.magic_link.token = token;
      response.magic_link.url = magicLinkUrl;
      response.message = 'Magic link created. Share this URL securely - it cannot be retrieved again.';
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating magic link:', error);
    return createErrorResponse('Failed to create magic link', 500);
  }
}

/**
 * Log magic link usage to audit trail (ML-005)
 *
 * @param {Object} env - Environment bindings
 * @param {number} tokenId - Magic link token ID
 * @param {string} clientIP - Client IP address
 * @param {string} userAgent - Client user agent
 * @param {boolean} success - Whether the validation succeeded
 * @param {string|null} failureReason - Reason for failure if not successful
 * @param {string|null} sessionJwtHash - Hash of issued JWT (for session correlation)
 */
async function logMagicLinkUsage(env, tokenId, clientIP, userAgent, success, failureReason = null, sessionJwtHash = null) {
  try {
    await env.DB.prepare(`
      INSERT INTO magic_link_usage_log (
        token_id, client_ip, user_agent, session_jwt_hash, success, failure_reason
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      tokenId,
      clientIP,
      userAgent,
      sessionJwtHash,
      success ? 1 : 0,
      failureReason
    ).run();
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to log magic link usage:', error);
  }
}

/**
 * Validate a magic link and issue a session
 *
 * ML-001: Rate limiting applied (10 per minute)
 * ML-003: JWT_SECRET validation
 * ML-005: Multi-use token audit trail
 * ML-006: IP pinning validation
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function validateMagicLink(request, env) {
  // ML-001: Apply rate limiting to prevent brute force
  const rateLimitResponse = await authRateLimitMiddleware('magic_link_validate', request, env);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // ML-003: Validate JWT_SECRET is configured
  if (!env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET not configured');
    return createErrorResponse('Authentication service unavailable', 500);
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';

  if (!token) {
    // Record failed attempt for rate limiting
    await recordAuthAttempt(
      clientIP,
      'magic_link_validate',
      false,
      'no_token',
      env
    );
    return createErrorResponse('Token is required', 400);
  }

  try {
    // Hash the provided token
    const tokenHash = await hashToken(token);

    // Look up the token (including IP pinning and use count fields)
    const magicLink = await env.DB.prepare(`
      SELECT ml.*, s.acronym as station_acronym, s.normalized_name as station_normalized_name
      FROM magic_link_tokens ml
      JOIN stations s ON ml.station_id = s.id
      WHERE ml.token_hash = ?
    `).bind(tokenHash).first();

    if (!magicLink) {
      await logSecurityEvent('MAGIC_LINK_INVALID', { token_prefix: token.substring(0, 8) }, request, env);
      return createUnauthorizedResponse('Invalid or expired magic link');
    }

    // Check if revoked
    if (magicLink.revoked_at) {
      await logMagicLinkUsage(env, magicLink.id, clientIP, userAgent, false, 'revoked');
      await logSecurityEvent('MAGIC_LINK_REVOKED_USE_ATTEMPT', { token_id: magicLink.id }, request, env);
      return createUnauthorizedResponse('This magic link has been revoked');
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      await logMagicLinkUsage(env, magicLink.id, clientIP, userAgent, false, 'expired');
      await logSecurityEvent('MAGIC_LINK_EXPIRED_USE_ATTEMPT', { token_id: magicLink.id }, request, env);
      return createUnauthorizedResponse('This magic link has expired');
    }

    // Check if single-use and already used
    if (magicLink.single_use && magicLink.used_at) {
      await logMagicLinkUsage(env, magicLink.id, clientIP, userAgent, false, 'already_used');
      await logSecurityEvent('MAGIC_LINK_REUSE_ATTEMPT', { token_id: magicLink.id }, request, env);
      return createUnauthorizedResponse('This magic link has already been used');
    }

    // ML-006: IP pinning validation for multi-use tokens
    if (!magicLink.single_use && magicLink.ip_pinning_enabled && magicLink.first_use_ip) {
      if (magicLink.first_use_ip !== clientIP) {
        await logMagicLinkUsage(env, magicLink.id, clientIP, userAgent, false, 'ip_mismatch');
        await logSecurityEvent('MAGIC_LINK_IP_MISMATCH', {
          token_id: magicLink.id,
          expected_ip: magicLink.first_use_ip,
          actual_ip: clientIP
        }, request, env);
        return createUnauthorizedResponse('This magic link is locked to a different IP address');
      }
    }

    // Update token: mark as used, increment use count, and capture first use IP
    const isFirstUse = !magicLink.used_at;
    const newUseCount = (magicLink.use_count || 0) + 1;

    if (isFirstUse) {
      // First use - set used_at and first_use_ip
      await env.DB.prepare(`
        UPDATE magic_link_tokens
        SET used_at = CURRENT_TIMESTAMP,
            used_by_ip = ?,
            used_by_user_agent = ?,
            first_use_ip = ?,
            use_count = ?
        WHERE id = ?
      `).bind(clientIP, userAgent, clientIP, newUseCount, magicLink.id).run();
    } else {
      // Subsequent use - just update used_by fields and increment count
      await env.DB.prepare(`
        UPDATE magic_link_tokens
        SET used_by_ip = ?,
            used_by_user_agent = ?,
            use_count = ?
        WHERE id = ?
      `).bind(clientIP, userAgent, newUseCount, magicLink.id).run();
    }

    // Create a session for this magic link user
    const sessionUser = {
      username: `magic_${magicLink.station_acronym.toLowerCase()}_${magicLink.id}`,
      role: magicLink.role,
      station_id: magicLink.station_id,
      station_acronym: magicLink.station_acronym,
      station_normalized_name: magicLink.station_normalized_name,
      auth_provider: 'magic_link',
      magic_link_id: magicLink.id,
      edit_privileges: false,
      permissions: ['read']
    };

    // Generate JWT for this session
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const jwt = await new SignJWT({
      ...sessionUser,
      magic_link_id: magicLink.id
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('8h') // Magic link sessions expire after 8 hours
      .setIssuer('sites-spectral')
      .setSubject(sessionUser.username)
      .sign(secret);

    // ML-005: Log successful use to audit trail with JWT hash for session correlation
    const jwtHash = await hashToken(jwt);
    await logMagicLinkUsage(env, magicLink.id, clientIP, userAgent, true, null, jwtHash.substring(0, 32));

    // Log successful use
    await logSecurityEvent('MAGIC_LINK_USED', {
      token_id: magicLink.id,
      station_id: magicLink.station_id,
      role: magicLink.role,
      use_count: newUseCount,
      is_first_use: isFirstUse
    }, request, env);

    // Set auth cookie
    const authCookie = createAuthCookie(jwt, request);

    return new Response(JSON.stringify({
      success: true,
      user: sessionUser,
      message: 'Magic link validated successfully',
      redirect: `/station-dashboard.html?station=${magicLink.station_acronym}`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': authCookie
      }
    });

  } catch (error) {
    console.error('Error validating magic link:', error);
    return createErrorResponse('Failed to validate magic link', 500);
  }
}

/**
 * Revoke a magic link
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function revokeMagicLink(request, env) {
  // Authenticate user
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return createUnauthorizedResponse();
  }

  // Check permissions
  const canRevoke = ['admin', 'sites-admin', 'station-admin'].includes(user.role);
  if (!canRevoke) {
    return createForbiddenResponse('Only admins can revoke magic links');
  }

  try {
    const body = await request.json();
    const { token_id, reason } = body;

    if (!token_id) {
      return createErrorResponse('token_id is required', 400);
    }

    // Get the magic link
    const magicLink = await env.DB.prepare(`
      SELECT * FROM magic_link_tokens WHERE id = ?
    `).bind(token_id).first();

    if (!magicLink) {
      return createErrorResponse('Magic link not found', 404);
    }

    // Station admins can only revoke links for their own station
    if (user.role === 'station-admin' && user.station_id !== magicLink.station_id) {
      return createForbiddenResponse('You can only revoke magic links for your own station');
    }

    // Revoke the link
    await env.DB.prepare(`
      UPDATE magic_link_tokens
      SET revoked_at = CURRENT_TIMESTAMP,
          revoked_by_user_id = ?,
          revoke_reason = ?
      WHERE id = ?
    `).bind(user.id, reason || null, token_id).run();

    // Log the event
    await logSecurityEvent('MAGIC_LINK_REVOKED', {
      revoker_id: user.id,
      revoker_username: user.username,
      token_id,
      reason
    }, request, env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Magic link revoked successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error revoking magic link:', error);
    return createErrorResponse('Failed to revoke magic link', 500);
  }
}

/**
 * List magic links for a station
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function listMagicLinks(request, env) {
  // Authenticate user
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return createUnauthorizedResponse();
  }

  // Check permissions
  const canList = ['admin', 'sites-admin', 'station-admin'].includes(user.role);
  if (!canList) {
    return createForbiddenResponse('Only admins can list magic links');
  }

  try {
    const url = new URL(request.url);
    const stationId = url.searchParams.get('station_id');
    const includeRevoked = url.searchParams.get('include_revoked') === 'true';
    const includeExpired = url.searchParams.get('include_expired') === 'true';

    // Build query
    let query = `
      SELECT ml.id, ml.label, ml.description, ml.role, ml.expires_at,
             ml.single_use, ml.used_at, ml.revoked_at, ml.created_at,
             ml.station_id, s.acronym as station_acronym,
             u.username as created_by_username
      FROM magic_link_tokens ml
      JOIN stations s ON ml.station_id = s.id
      JOIN users u ON ml.created_by_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Station admins can only see their own station's links
    if (user.role === 'station-admin') {
      query += ' AND ml.station_id = ?';
      params.push(user.station_id);
    } else if (stationId) {
      query += ' AND ml.station_id = ?';
      params.push(stationId);
    }

    if (!includeRevoked) {
      query += ' AND ml.revoked_at IS NULL';
    }

    if (!includeExpired) {
      query += ' AND ml.expires_at > CURRENT_TIMESTAMP';
    }

    query += ' ORDER BY ml.created_at DESC';

    const statement = env.DB.prepare(query);
    const result = await statement.bind(...params).all();

    return new Response(JSON.stringify({
      success: true,
      magic_links: result.results.map(link => ({
        ...link,
        is_expired: new Date(link.expires_at) < new Date(),
        is_revoked: !!link.revoked_at,
        is_used: !!link.used_at
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error listing magic links:', error);
    return createErrorResponse('Failed to list magic links', 500);
  }
}

export default handleMagicLinks;
