// Authentication utilities for SITES Spectral application
import { SignJWT, jwtVerify } from 'jose';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  'SITES_SPECTRAL_SECRET_KEY_2025' // In production, use env.JWT_SECRET
);
const JWT_ISSUER = 'sites-spectral';
const JWT_AUDIENCE = 'sites-spectral-users';
const JWT_EXPIRES_IN = '24h';

/**
 * Hash password using Web Crypto API
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sites_spectral_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} - Password matches
 */
export async function verifyPassword(password, hash) {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id, username, role, station_id
 * @returns {Promise<string>} - JWT token
 */
export async function generateToken(user) {
  const payload = {
    sub: user.id.toString(),
    username: user.username,
    role: user.role,
    station_id: user.station_id,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(JWT_SECRET);
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} - Decoded payload or null if invalid
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract user from request headers
 * @param {Request} request - HTTP request
 * @returns {Promise<Object|null>} - User payload or null
 */
export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return await verifyToken(token);
}

/**
 * Check if user has permission to access resource
 * @param {Object} user - User payload from JWT
 * @param {string} action - Action being performed (read, write, delete)
 * @param {string} resource - Resource type (station, instrument, platform)
 * @param {number|null} resourceStationId - Station ID of the resource
 * @returns {boolean} - Permission granted
 */
export function hasPermission(user, action, resource, resourceStationId = null) {
  if (!user) return false;

  // Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }

  // Station users can only access their own station
  if (user.role === 'station') {
    // For station-level resources, check station ownership
    if (resource === 'station') {
      return resourceStationId === user.station_id;
    }
    
    // For instruments/platforms, they must belong to user's station
    if (resourceStationId && resourceStationId !== user.station_id) {
      return false;
    }

    // Station users can read/write their own data but not delete stations/users
    if (action === 'delete' && ['station', 'user'].includes(resource)) {
      return false;
    }

    return ['read', 'write'].includes(action);
  }

  // Readonly users can only read
  if (user.role === 'readonly') {
    return action === 'read';
  }

  return false;
}

/**
 * Middleware to require authentication
 * @param {Request} request - HTTP request
 * @param {Object} env - Environment variables
 * @returns {Promise<Object|Response>} - User object or error response
 */
export async function requireAuth(request, env) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if user is active
  const dbUser = await env.DB.prepare(
    'SELECT active, locked_until FROM users WHERE id = ?'
  ).bind(user.sub).first();

  if (!dbUser || !dbUser.active) {
    return new Response(JSON.stringify({ error: 'Account disabled' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (dbUser.locked_until && new Date(dbUser.locked_until) > new Date()) {
    return new Response(JSON.stringify({ error: 'Account temporarily locked' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return user;
}

/**
 * Middleware to require specific permission
 * @param {Request} request - HTTP request  
 * @param {Object} env - Environment variables
 * @param {string} action - Required action
 * @param {string} resource - Resource type
 * @param {number|null} resourceStationId - Station ID of resource
 * @returns {Promise<Object|Response>} - User object or error response
 */
export async function requirePermission(request, env, action, resource, resourceStationId = null) {
  const userOrResponse = await requireAuth(request, env);
  
  if (userOrResponse instanceof Response) {
    return userOrResponse; // Return error response
  }

  const user = userOrResponse;
  
  if (!hasPermission(user, action, resource, resourceStationId)) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return user;
}

/**
 * Log user activity
 * @param {Object} env - Environment variables
 * @param {number} userId - User ID
 * @param {string} actionType - Type of action
 * @param {string} resourceType - Type of resource
 * @param {number} resourceId - Resource ID
 * @param {Object} oldValues - Old values (for updates)
 * @param {Object} newValues - New values
 * @param {Request} request - HTTP request for IP/User-Agent
 */
export async function logActivity(env, userId, actionType, resourceType, resourceId, oldValues = null, newValues = null, request = null) {
  try {
    const ip = request?.headers.get('CF-Connecting-IP') || request?.headers.get('X-Forwarded-For') || 'unknown';
    const userAgent = request?.headers.get('User-Agent') || 'unknown';
    
    await env.DB.prepare(`
      INSERT INTO activity_log (
        user_id, action_type, resource_type, resource_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      actionType,
      resourceType,
      resourceId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ip,
      userAgent
    ).run();
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Create session record in database
 * @param {Object} env - Environment variables
 * @param {number} userId - User ID
 * @param {string} token - JWT token
 * @param {Request} request - HTTP request
 */
export async function createSession(env, userId, token, request) {
  const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const tokenHashHex = Array.from(new Uint8Array(tokenHash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  
  await env.DB.prepare(`
    INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(userId, tokenHashHex, expiresAt.toISOString(), ip, userAgent).run();
}

/**
 * Delete session from database
 * @param {Object} env - Environment variables
 * @param {string} token - JWT token to invalidate
 */
export async function deleteSession(env, token) {
  const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const tokenHashHex = Array.from(new Uint8Array(tokenHash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  await env.DB.prepare('DELETE FROM user_sessions WHERE token_hash = ?')
    .bind(tokenHashHex).run();
}