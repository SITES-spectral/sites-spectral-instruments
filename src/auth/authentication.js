// Authentication Module
// JWT authentication with HMAC-SHA256 signing, user verification, session management

import { SignJWT, jwtVerify } from 'jose';
import { createErrorResponse, createUnauthorizedResponse } from '../utils/responses.js';
import { logSecurityEvent } from '../utils/logging.js';
import { verifyPassword } from './password-hasher.js';
import { createAuthCookie, createLogoutCookie, getTokenFromCookie } from './cookie-utils.js';

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
        const { username, password } = await request.json();

        if (!username || !password) {
          return createErrorResponse('Username and password required', 400);
        }

        const user = await authenticateUser(username, password, env);
        if (!user) {
          // Log failed authentication attempt
          await logSecurityEvent('FAILED_LOGIN', { username }, request, env);
          return createUnauthorizedResponse();
        }

        const token = await generateToken(user, env);

        // Log successful authentication
        await logSecurityEvent('SUCCESSFUL_LOGIN', user, request, env);

        // Set httpOnly cookie for secure token storage
        const authCookie = createAuthCookie(token, request);

        return new Response(JSON.stringify({
          success: true,
          token, // Still return token for backward compatibility during migration
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
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': authCookie
          }
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
        }

        // Clear the httpOnly cookie
        const logoutCookie = createLogoutCookie(request);

        return new Response(JSON.stringify({
          success: true,
          message: 'Logged out successfully'
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

    default:
      return createErrorResponse('Authentication endpoint not found', 404);
  }
}

/**
 * Authenticate user with username and password
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
    // Load credentials from secure file
    const credentials = await loadCredentials(env);
    if (!credentials) {
      console.error('Failed to load credentials file');
      return null;
    }

    // Check admin credentials (original admin)
    // Uses verifyPassword for secure comparison (supports both hashed and plain text during migration)
    if (credentials.admin?.username === username &&
        await verifyPassword(password, credentials.admin?.password)) {
      // Auth successful - admin user
      return {
        username: credentials.admin.username,
        role: credentials.admin.role,
        station_acronym: null,
        station_normalized_name: null,
        edit_privileges: true,
        permissions: ['read', 'write', 'edit', 'delete', 'admin']
      };
    }

    // Check sites-admin credentials (global admin)
    if (credentials.sites_admin?.username === username &&
        await verifyPassword(password, credentials.sites_admin?.password)) {
      // Auth successful - sites-admin user
      return {
        username: credentials.sites_admin.username,
        role: 'admin',
        station_acronym: null,
        station_normalized_name: null,
        edit_privileges: true,
        permissions: credentials.sites_admin.permissions || ['read', 'write', 'edit', 'delete', 'admin']
      };
    }

    // Check station-admin credentials
    if (credentials.station_admins) {
      for (const [stationName, adminCreds] of Object.entries(credentials.station_admins)) {
        if (adminCreds?.username === username &&
            await verifyPassword(password, adminCreds?.password)) {
          // Get station data from database to get both acronym and integer ID
          const stationData = await getStationByNormalizedName(stationName, env);
          // Auth successful - station-admin user
          return {
            username: adminCreds.username,
            role: adminCreds.role || 'station-admin',
            station_id: stationData?.id || null,
            station_acronym: stationData?.acronym || adminCreds.station_id,
            station_normalized_name: stationName,
            edit_privileges: true,
            permissions: adminCreds.permissions || ['read', 'write', 'edit', 'delete']
          };
        }
      }
    }

    // Check station credentials (regular station users)
    if (credentials.stations) {
      for (const [stationName, stationCreds] of Object.entries(credentials.stations)) {
        if (stationCreds?.username === username &&
            await verifyPassword(password, stationCreds?.password)) {
          // Get station data from database to get both acronym and integer ID
          const stationData = await getStationByNormalizedName(stationName, env);
          // Auth successful - station user
          return {
            username: stationCreds.username,
            role: stationCreds.role,
            station_id: stationData?.id || null, // Use integer ID from database
            station_acronym: stationData?.acronym || null,
            station_normalized_name: stationName,
            edit_privileges: stationCreds.edit_privileges || false,
            permissions: stationCreds.permissions || ['read']
          };
        }
      }
    }

    console.warn(`Authentication failed for username: ${username}`);
    return null;
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
    // Load JWT secret from credentials
    const credentials = await loadCredentials(env);
    if (!credentials?.jwt_secret) {
      console.error('JWT secret not found in credentials');
      throw new Error('JWT secret not available');
    }

    // Create secret key for HMAC-SHA256
    const secret = new TextEncoder().encode(credentials.jwt_secret);

    // Build JWT with proper signing using jose library
    const jwt = await new SignJWT({
      username: user.username,
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
      .sign(secret);

    return jwt;
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}

/**
 * Extract and validate user from request
 * Checks httpOnly cookie first, then falls back to Authorization header
 * Uses proper JWT verification with HMAC-SHA256
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} User object or null if invalid
 */
export async function getUserFromRequest(request, env) {
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

    // Check required fields
    if (!payload.username || !payload.role) {
      console.warn('Invalid token: missing required fields');
      return null;
    }

    // Token validated successfully
    return {
      username: payload.username,
      role: payload.role,
      station_acronym: payload.station_acronym,
      station_normalized_name: payload.station_normalized_name,
      station_id: payload.station_id,
      edit_privileges: payload.edit_privileges,
      permissions: payload.permissions
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