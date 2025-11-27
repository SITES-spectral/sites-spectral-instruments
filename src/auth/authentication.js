// Authentication Module
// JWT authentication, user verification, session management

import { createErrorResponse, createUnauthorizedResponse } from '../utils/responses.js';
import { logSecurityEvent } from '../utils/logging.js';

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

        return new Response(JSON.stringify({
          success: true,
          token,
          user: {
            username: user.username,
            role: user.role,
            station_acronym: user.station_acronym,
            station_normalized_name: user.station_normalized_name
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Login error:', error);
        return createErrorResponse('Login failed', 500);
      }

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
          user: {
            username: user.username,
            role: user.role,
            station_acronym: user.station_acronym,
            station_normalized_name: user.station_normalized_name
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Token verification error:', error);
        return createUnauthorizedResponse();
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

    // Check admin credentials
    if (credentials.admin?.username === username && credentials.admin?.password === password) {
      console.log(`Admin user authenticated: ${username}`);
      return {
        username: credentials.admin.username,
        role: credentials.admin.role,
        station_acronym: null,
        station_normalized_name: null
      };
    }

    // Check station credentials
    if (credentials.stations) {
      for (const [stationName, stationCreds] of Object.entries(credentials.stations)) {
        if (stationCreds?.username === username && stationCreds?.password === password) {
          // Get station data from database to get both acronym and integer ID
          const stationData = await getStationByNormalizedName(stationName, env);
          console.log(`Station user authenticated: ${username} for station: ${stationName}`);
          return {
            username: stationCreds.username,
            role: stationCreds.role,
            station_id: stationData?.id || null, // Use integer ID from database
            station_acronym: stationData?.acronym || null,
            station_normalized_name: stationName,
            edit_privileges: stationCreds.edit_privileges || false,
            permissions: stationCreds.permissions || ["read"]
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
 * Generate JWT token for authenticated user
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

    // Simple token for now - will upgrade to proper JWT later
    const tokenData = {
      username: user.username,
      role: user.role,
      station_acronym: user.station_acronym,
      station_normalized_name: user.station_normalized_name,
      station_id: user.station_id,
      edit_privileges: user.edit_privileges,
      permissions: user.permissions,
      issued_at: Date.now(),
      expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    return btoa(JSON.stringify(tokenData));
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}

/**
 * Extract and validate user from request authorization header
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} User object or null if invalid
 */
export async function getUserFromRequest(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Invalid or missing Authorization header');
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) {
      console.warn('Empty token in Authorization header');
      return null;
    }

    const tokenData = JSON.parse(atob(token));

    // Check required fields
    if (!tokenData.username || !tokenData.role) {
      console.warn('Invalid token: missing required fields');
      return null;
    }

    // Check token expiration
    if (tokenData.expires_at && Date.now() > tokenData.expires_at) {
      console.warn(`Token expired for user: ${tokenData.username}`);
      return null;
    }

    console.log(`Valid token for user: ${tokenData.username}, role: ${tokenData.role}`);
    return tokenData;
  } catch (error) {
    console.error('Token validation error:', error);
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
        stations: {},
        jwt_secret: env.JWT_SECRET
      };

      // Load station credentials from individual secrets
      const stationNames = ['abisko', 'asa', 'bolmen', 'erken', 'grimso', 'lonnstorp', 'robacksdalen', 'skogaryd', 'svartberget'];

      for (const stationName of stationNames) {
        const secretName = `STATION_${stationName.toUpperCase()}_CREDENTIALS`;
        const stationSecret = env[secretName];
        if (stationSecret) {
          try {
            credentials.stations[stationName] = JSON.parse(stationSecret);
          } catch (parseError) {
            console.warn(`Failed to parse credentials for ${stationName}:`, parseError);
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