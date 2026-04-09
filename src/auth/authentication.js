// Authentication Module
// JWT authentication with HMAC-SHA256 signing, user verification, session management
// v15.0.0: Added Cloudflare Access JWT verification for subdomain architecture
//
// Architecture Credit: This subdomain-based architecture design is based on
// architectural knowledge shared by Flights for Biodiversity Sweden AB
// (https://github.com/flightsforbiodiversity)

import { SignJWT, jwtVerify } from 'jose';
import { createErrorResponse, createUnauthorizedResponse } from '../utils/responses.js';
import { logSecurityEvent } from '../utils/logging.js';
import { verifyPassword, needsRehash, hashPassword } from './password-hasher.js';
import { createAuthCookie, createLogoutCookie, getTokenFromCookie } from './cookie-utils.js';
import {
  authRateLimitMiddleware,
  recordAuthAttempt,
  getRateLimitHeaders
} from '../middleware/auth-rate-limiter.js';
import { Role } from '../domain/authorization/Role.js';

/**
 * Handle authentication endpoints
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - Path segments after /api/auth
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Authentication response
 */
export async function handleAuth(method, pathSegments, request, env) {
  const action = pathSegments[1];

  switch (action) {
    case 'login':
      if (method !== 'POST') {
        return createErrorResponse('Method not allowed', 405);
      }

      try {
        // Check rate limit before processing login
        const rateLimitResponse = await authRateLimitMiddleware('login', request, env);
        if (rateLimitResponse) {
          return rateLimitResponse; // 429 Too Many Requests
        }

        const { username, password } = await request.json();

        if (!username || !password) {
          return createErrorResponse('Username and password required', 400);
        }

        const user = await authenticateUser(username, password, env);
        if (!user) {
          // Record failed attempt for rate limiting
          const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
          await recordAuthAttempt(clientIP, 'login', false, username, env);

          // Log failed authentication attempt
          await logSecurityEvent('FAILED_LOGIN', { username }, request, env);
          return createUnauthorizedResponse();
        }

        // Record successful login (clears rate limit counter)
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        await recordAuthAttempt(clientIP, 'login', true, username, env);

        const token = await generateToken(user, env);

        // Log successful authentication
        await logSecurityEvent('SUCCESSFUL_LOGIN', user, request, env);

        // Set httpOnly cookie for secure token storage
        const authCookie = createAuthCookie(token, request);

        // Build response with rate limit headers
        const headers = new Headers({
          'Content-Type': 'application/json',
          'Set-Cookie': authCookie,
          ...getRateLimitHeaders(request)
        });

        // Note: Token is NOT returned in response body for security (httpOnly cookie only)
        // Frontend uses credentials: 'include' for all API requests
        return new Response(JSON.stringify({
          success: true,
          user: {
            username: user.username,
            role: user.role,
            station_id: user.station_id,
            station_acronym: user.station_acronym,
            station_normalized_name: user.station_normalized_name,
            edit_privileges: user.edit_privileges,
            permissions: user.permissions
          }
        }), {
          status: 200,
          headers
        });

      } catch (error) {
        console.error('Login error:', error);
        return createErrorResponse('Login failed', 500);
      }

    case 'me':
    case 'verify':
      if (method !== 'GET') {
        return createErrorResponse('Method not allowed', 405);
      }

      try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
          return createUnauthorizedResponse();
        }

        return new Response(JSON.stringify({
          success: true,
          valid: true,  // Added for frontend compatibility
          user: {
            username: user.username,
            email: user.email,
            role: user.role,
            station_acronym: user.station_acronym,
            station_normalized_name: user.station_normalized_name,
            station_id: user.station_id,
            edit_privileges: user.edit_privileges,
            permissions: user.permissions
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Token verification error:', error);
        return createUnauthorizedResponse();
      }

    case 'logout':
      if (method !== 'POST') {
        return createErrorResponse('Method not allowed', 405);
      }

      try {
        // Get user for logging (optional - don't fail if not authenticated)
        const user = await getUserFromRequest(request, env);
        if (user) {
          await logSecurityEvent('LOGOUT', user, request, env);
          // L1 audit fix: revoke the current session token on logout
          if (user.jti && env.DB) {
            await revokeToken(user.jti, user.username, env, 'logout');
          }
        }

        // Clear the httpOnly session cookie
        const logoutCookie = createLogoutCookie(request);

        // L2 audit fix: provide CF Access logout URL so frontend can
        // invalidate the CF_Authorization cookie (shared-device protection)
        const cfAccessTeamDomain = env.CF_ACCESS_TEAM_DOMAIN || 'sitesspectral.cloudflareaccess.com';
        const cfAccessLogoutUrl = `https://${cfAccessTeamDomain}/cdn-cgi/access/logout`;

        return new Response(JSON.stringify({
          success: true,
          message: 'Logged out successfully',
          cf_access_logout_url: user?.auth_provider === 'cloudflare_access' ? cfAccessLogoutUrl : null
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': logoutCookie
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
        // Still clear the cookie even if there's an error
        const logoutCookie = createLogoutCookie(request);
        return new Response(JSON.stringify({
          success: true,
          message: 'Logged out'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': logoutCookie
          }
        });
      }

    case 'refresh':
      if (method !== 'POST') {
        return createErrorResponse('Method not allowed', 405);
      }

      try {
        // L1 audit fix: refresh session token with revocation of old token
        const currentUser = await getUserFromRequest(request, env);
        if (!currentUser) {
          return createUnauthorizedResponse();
        }

        // v16.0.0 (H1): Enforce old token revocation before issuing new one
        if (currentUser.jti && env.DB) {
          try {
            await revokeToken(currentUser.jti, currentUser.username, env);
          } catch (revocationError) {
            console.error('Token revocation failed during refresh:', revocationError);
            return createErrorResponse('Session refresh failed - please log in again', 500);
          }
        }

        // Generate new token
        const newToken = await generateToken(currentUser, env);
        const refreshCookie = createAuthCookie(newToken, request);

        return new Response(JSON.stringify({
          success: true,
          message: 'Session refreshed'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': refreshCookie
          }
        });
      } catch (error) {
        console.error('Token refresh error:', error);
        return createErrorResponse('Session refresh failed', 500);
      }

    default:
      return createErrorResponse('Authentication endpoint not found', 404);
  }
}

/**
 * Authenticate user with username and password using database users table
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} User object or null if authentication fails
 */
export async function authenticateUser(username, password, env) {
  if (!username || !password) {
    console.warn('Authentication attempted with missing username or password');
    return null;
  }

  try {
    // Query user from database
    const user = await env.DB.prepare(`
      SELECT u.id, u.username, u.email, u.password_hash, u.role, u.full_name,
             u.organization, u.active, u.station_id,
             s.acronym as station_acronym, s.normalized_name as station_normalized_name
      FROM users u
      LEFT JOIN stations s ON u.station_id = s.id
      WHERE u.username = ? AND u.active = 1
    `).bind(username).first();

    if (!user) {
      console.warn(`User not found or inactive: ${username}`);
      return null;
    }

    // Verify password using secure comparison
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      console.warn(`Invalid password for user: ${username}`);
      return null;
    }

    // v16.0.0 (L1): Transparent rehash if using legacy iteration count
    if (needsRehash(user.password_hash)) {
      try {
        const newHash = await hashPassword(password);
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
          .bind(newHash, user.id).run();
        console.log(`Rehashed password for user ${username} (upgraded PBKDF2 iterations)`);
      } catch (rehashError) {
        // Non-fatal — user can still log in, will rehash next time
        console.warn(`Password rehash failed for ${username}:`, rehashError.message);
      }
    }

    // Use centralized role→permission mapping from domain layer
    const permissions = Role.getPermissions(user.role);
    const editPrivileges = Role.hasEditPrivileges(user.role);

    // Return authenticated user object
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      organization: user.organization,
      station_id: user.station_id,
      station_acronym: user.station_acronym,
      station_normalized_name: user.station_normalized_name,
      edit_privileges: editPrivileges,
      permissions: permissions
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Generate JWT token for authenticated user using HMAC-SHA256 signing
 * @param {Object} user - Authenticated user object
 * @param {Object} env - Environment variables and bindings
 * @returns {string} JWT token
 */
export async function generateToken(user, env) {
  try {
    // Get JWT secret directly from environment
    if (!env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment');
      throw new Error('JWT secret not available');
    }

    // Create secret key for HMAC-SHA256
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    // Generate unique JWT ID for revocation support (L1 audit fix)
    const jti = crypto.randomUUID();

    // Build JWT with proper signing using jose library
    // v16.0.0 (M9): username is carried exclusively in the 'sub' claim
    const jwt = await new SignJWT({
      role: user.role,
      station_acronym: user.station_acronym,
      station_normalized_name: user.station_normalized_name,
      station_id: user.station_id,
      edit_privileges: user.edit_privileges,
      permissions: user.permissions
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .setIssuer('sites-spectral')
      .setSubject(user.username)
      .setJti(jti)
      .sign(secret);

    return jwt;
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}

/**
 * Extract and validate user from request
 *
 * Authentication priority (v15.0.0):
 * 1. Cloudflare Access JWT (Cf-Access-Jwt-Assertion header)
 * 2. Request context (cfAccessUser set by worker)
 * 3. httpOnly cookie (legacy password auth)
 * 4. Authorization header (legacy API access)
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} User object or null if invalid
 */
export async function getUserFromRequest(request, env) {
  try {
    // Priority 1: Check for Cloudflare Access JWT (passwordless auth)
    const cfAccessUser = await getUserFromCFAccess(request, env);
    if (cfAccessUser) {
      return cfAccessUser;
    }

    // Priority 2: Check request context (set by worker subdomain routing)
    if (request.cfAccessUser) {
      return request.cfAccessUser;
    }

    // Priority 3-4: Legacy authentication (cookie or Bearer token)
    return await getUserFromLegacyAuth(request, env);

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get user from Cloudflare Access JWT
 *
 * Uses env.cfAccessAdapterFactory (injected by worker) to avoid importing
 * infrastructure layer directly (DIP compliance — A5 audit fix).
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} User object or null if not CF Access auth
 */
async function getUserFromCFAccess(request, env) {
  try {
    // Check for CF Access JWT header
    const cfAccessJwt = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!cfAccessJwt) {
      return null;
    }

    // Use adapter factory from env (injected by worker) to verify
    if (!env.cfAccessAdapterFactory) {
      console.warn('CF Access adapter not available — cfAccessAdapterFactory not injected');
      return null;
    }

    const cfAdapter = env.cfAccessAdapterFactory(env);
    const user = await cfAdapter.verifyAccessToken(request);

    if (user) {
      // Add auth provider for tracking
      user.auth_provider = 'cloudflare_access';
    }

    return user;

  } catch (error) {
    console.error('CF Access verification error:', error);
    return null;
  }
}

/**
 * Get user from legacy authentication (cookie or Bearer token)
 *
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} User object or null if invalid
 */
async function getUserFromLegacyAuth(request, env) {
  try {
    // First, try to get token from httpOnly cookie (preferred method)
    let token = getTokenFromCookie(request);

    // Fallback to Authorization header for backward compatibility
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      // No token found in cookie or header
      return null;
    }

    // Load JWT secret for verification
    const credentials = await loadCredentials(env);
    if (!credentials?.jwt_secret) {
      console.error('JWT secret not found for verification');
      return null;
    }

    const secret = new TextEncoder().encode(credentials.jwt_secret);

    // Verify JWT signature and expiration
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'sites-spectral'
    });

    // v16.0.0 (M9): username from 'sub' claim exclusively
    const username = payload.sub || payload.username;

    // Check required fields
    if (!username || !payload.role) {
      console.warn('Invalid token: missing required fields');
      return null;
    }

    // L1 audit fix: check if token has been revoked (e.g., after refresh)
    if (payload.jti && env.DB) {
      const revoked = await isTokenRevoked(payload.jti, env);
      if (revoked) {
        console.warn(`Revoked token used by ${username} (jti: ${payload.jti})`);
        return null;
      }
    }

    // Determine auth provider from payload
    const authProvider = payload.auth_provider || 'database';

    // Token validated successfully
    return {
      username,
      role: payload.role,
      station_acronym: payload.station_acronym,
      station_normalized_name: payload.station_normalized_name,
      station_id: payload.station_id,
      edit_privileges: payload.edit_privileges,
      permissions: payload.permissions,
      auth_provider: authProvider,
      magic_link_id: payload.magic_link_id,
      jti: payload.jti
    };
  } catch (error) {
    // Handle specific JWT errors
    if (error.code === 'ERR_JWT_EXPIRED') {
      console.warn('Token expired');
    } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.warn('Invalid token signature - possible tampering attempt');
    } else {
      console.error('Token validation error:', error);
    }
    return null;
  }
}

/**
 * Load credentials from environment variables
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Credentials object or null if failed
 */
async function loadCredentials(env) {
  try {
    // Load credentials from Cloudflare secrets
    if (env.USE_CLOUDFLARE_SECRETS === 'true') {
      const credentials = {
        admin: JSON.parse(env.ADMIN_CREDENTIALS || '{}'),
        sites_admin: null,
        stations: {},
        station_admins: {},
        jwt_secret: env.JWT_SECRET
      };

      // Load sites-admin credentials (global admin)
      if (env.SITES_ADMIN_CREDENTIALS) {
        try {
          credentials.sites_admin = JSON.parse(env.SITES_ADMIN_CREDENTIALS);
        } catch (parseError) {
          console.warn('Failed to parse sites-admin credentials:', parseError);
        }
      }

      // Load station credentials from individual secrets
      const stationNames = ['abisko', 'asa', 'bolmen', 'erken', 'grimso', 'lonnstorp', 'robacksdalen', 'skogaryd', 'svartberget'];

      for (const stationName of stationNames) {
        // Load regular station user credentials
        const secretName = `STATION_${stationName.toUpperCase()}_CREDENTIALS`;
        const stationSecret = env[secretName];
        if (stationSecret) {
          try {
            credentials.stations[stationName] = JSON.parse(stationSecret);
          } catch (parseError) {
            console.warn(`Failed to parse credentials for ${stationName}:`, parseError);
          }
        }

        // Load station-admin credentials
        const adminSecretName = `STATION_${stationName.toUpperCase()}_ADMIN_CREDENTIALS`;
        const adminSecret = env[adminSecretName];
        if (adminSecret) {
          try {
            credentials.station_admins[stationName] = JSON.parse(adminSecret);
          } catch (parseError) {
            console.warn(`Failed to parse admin credentials for ${stationName}:`, parseError);
          }
        }
      }

      return credentials;
    } else {
      // Fallback: try to load from database or return error
      console.error('No credential loading method configured');
      return null;
    }
  } catch (error) {
    console.error('Failed to load credentials:', error);
    return null;
  }
}

/**
 * Get station data by normalized name
 * @param {string} normalizedName - Station normalized name
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Station data or null
 */
/**
 * Check if a token has been revoked (L1 audit fix)
 * @param {string} jti - JWT ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<boolean>}
 */
async function isTokenRevoked(jti, env) {
  try {
    const result = await env.DB.prepare(
      'SELECT 1 FROM revoked_sessions WHERE jti = ?'
    ).bind(jti).first();
    return !!result;
  } catch (error) {
    // If table doesn't exist yet (migration not applied), allow the token
    console.warn('Revocation check failed (table may not exist):', error.message);
    return false;
  }
}

/**
 * Revoke a token by recording its JTI (L1 audit fix)
 * @param {string} jti - JWT ID to revoke
 * @param {string} username - Username for audit trail
 * @param {Object} env - Environment variables and bindings
 * @param {string} reason - Revocation reason
 */
async function revokeToken(jti, username, env, reason = 'refresh') {
  // v16.0.0 (H1): Let errors propagate — callers must handle revocation failures
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    'INSERT OR REPLACE INTO revoked_sessions (jti, user_id, expires_at, reason) VALUES (?, ?, ?, ?)'
  ).bind(jti, username, expiresAt, reason).run();
}

/**
 * Clean up expired revocation entries (can be called periodically)
 * @param {Object} env - Environment variables and bindings
 * @returns {Promise<number>} Number of entries cleaned
 */
export async function cleanupRevokedSessions(env) {
  try {
    const result = await env.DB.prepare(
      "DELETE FROM revoked_sessions WHERE expires_at < datetime('now')"
    ).run();
    return result.changes || 0;
  } catch (error) {
    console.warn('Revocation cleanup failed:', error.message);
    return 0;
  }
}

/**
 * Get station data by normalized name
 * @param {string} normalizedName - Station normalized name
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Station data or null
 */
async function getStationByNormalizedName(normalizedName, env) {
  try {
    const query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description
      FROM stations
      WHERE normalized_name = ?
    `;

    const result = await env.DB.prepare(query).bind(normalizedName).first();
    return result || null;
  } catch (error) {
    console.error('Database error in getStationByNormalizedName:', error);
    return null;
  }
}