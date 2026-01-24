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
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function createMagicLink(request, env) {
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
    const {
      station_id,
      label,
      description,
      expires_in_days = 7,
      single_use = false,
      role = 'readonly'
    } = body;

    // Validate station_id
    if (!station_id) {
      return createErrorResponse('station_id is required', 400);
    }

    // Station admins can only create links for their own station
    if (user.role === 'station-admin' && user.station_id !== station_id) {
      return createForbiddenResponse('You can only create magic links for your own station');
    }

    // Validate role
    const allowedRoles = ['readonly', 'station-internal'];
    if (!allowedRoles.includes(role)) {
      return createErrorResponse(`Invalid role. Must be one of: ${allowedRoles.join(', ')}`, 400);
    }

    // Generate token
    const token = generateToken(32);
    const tokenHash = await hashToken(token);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000);

    // Insert into database
    const result = await env.DB.prepare(`
      INSERT INTO magic_link_tokens (
        token, token_hash, station_id, created_by_user_id,
        label, description, role, expires_at, single_use
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      token.substring(0, 8) + '...', // Store truncated token for display only
      tokenHash,
      station_id,
      user.id,
      label || null,
      description || null,
      role,
      expiresAt.toISOString(),
      single_use ? 1 : 0
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
      expires_at: expiresAt.toISOString()
    }, request, env);

    return new Response(JSON.stringify({
      success: true,
      magic_link: {
        id: result.lastRowId,
        token: token, // Only returned once at creation
        url: magicLinkUrl,
        station_id,
        station_acronym: station?.acronym,
        label,
        role,
        expires_at: expiresAt.toISOString(),
        single_use
      },
      message: 'Magic link created. Share this URL securely - it cannot be retrieved again.'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating magic link:', error);
    return createErrorResponse('Failed to create magic link', 500);
  }
}

/**
 * Validate a magic link and issue a session
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<Response>}
 */
async function validateMagicLink(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return createErrorResponse('Token is required', 400);
  }

  try {
    // Hash the provided token
    const tokenHash = await hashToken(token);

    // Look up the token
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
      await logSecurityEvent('MAGIC_LINK_REVOKED_USE_ATTEMPT', { token_id: magicLink.id }, request, env);
      return createUnauthorizedResponse('This magic link has been revoked');
    }

    // Check if expired
    if (new Date(magicLink.expires_at) < new Date()) {
      await logSecurityEvent('MAGIC_LINK_EXPIRED_USE_ATTEMPT', { token_id: magicLink.id }, request, env);
      return createUnauthorizedResponse('This magic link has expired');
    }

    // Check if single-use and already used
    if (magicLink.single_use && magicLink.used_at) {
      await logSecurityEvent('MAGIC_LINK_REUSE_ATTEMPT', { token_id: magicLink.id }, request, env);
      return createUnauthorizedResponse('This magic link has already been used');
    }

    // Mark as used
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    await env.DB.prepare(`
      UPDATE magic_link_tokens
      SET used_at = CURRENT_TIMESTAMP, used_by_ip = ?, used_by_user_agent = ?
      WHERE id = ?
    `).bind(clientIP, userAgent, magicLink.id).run();

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

    // Log successful use
    await logSecurityEvent('MAGIC_LINK_USED', {
      token_id: magicLink.id,
      station_id: magicLink.station_id,
      role: magicLink.role
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
