// Authentication system using station-credentials-SECURE.json
import { SignJWT, jwtVerify } from 'jose';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  'd13570ae6cb3e670a8aba30acc062bd92ba5a552e2f27b6a1e9a85449e0244cb842466279e3c05531d63e9f4fb2a37d96e1d2aef33649fbc0035cc0bc3d87f84'
);
const JWT_ISSUER = 'sites-spectral';
const JWT_AUDIENCE = 'sites-spectral-users';

// Load credentials from SECURE file
const CREDENTIALS = {
  "admin": {
    "username": "admin",
    "password": "IvKlLUk1JzBz6CrudDVxxSec",
    "role": "admin"
  },
  "abisko": {
    "username": "abisko",
    "password": "HRdz99RNihpa0K99wtAkT4XR",
    "role": "station",
    "station_acronym": "ANS"
  },
  "asa": {
    "username": "asa",
    "password": "RFglByrYfkN37s9fIssBQIjx",
    "role": "station",
    "station_acronym": "ASA"
  },
  "grimso": {
    "username": "grimso",
    "password": "HTZkIOIh7rAWLowwXRnxAvKA",
    "role": "station",
    "station_acronym": "GRI"
  },
  "lonnstorp": {
    "username": "lonnstorp",
    "password": "Y1VnG71Ho6zwPpCOFiALszaP",
    "role": "station",
    "station_acronym": "LON"
  },
  "robacksdalen": {
    "username": "robacksdalen",
    "password": "jMeu6AIt9Ep1AaBwHfmxhGqB",
    "role": "station",
    "station_acronym": "RBD"
  },
  "skogaryd": {
    "username": "skogaryd",
    "password": "4k5tk8EaxifV5qjrx3cKjEpA",
    "role": "station",
    "station_acronym": "SKC"
  },
  "svartberget": {
    "username": "svartberget",
    "password": "BvmF1ioEIw7AYXs2t1SoEI8Y",
    "role": "station",
    "station_acronym": "SVB"
  }
};

/**
 * Authenticate user with username/password
 */
export async function authenticateUser(username, password) {
  const user = CREDENTIALS[username];
  if (!user || user.password !== password) {
    return null;
  }

  return {
    id: username,
    username: user.username,
    role: user.role,
    station_acronym: user.station_acronym || null,
    full_name: user.username,
    auth_method: 'secrets'
  };
}

/**
 * Generate JWT token for user
 */
export async function generateToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    station_acronym: user.station_acronym,
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
 * Verify JWT token
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get user from request (extract from Authorization header)
 */
export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    username: payload.username,
    role: payload.role,
    station_acronym: payload.station_acronym
  };
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return user;
}

/**
 * Check if user has permission for an operation
 */
export function hasPermission(user, operation, resource, resourceAcronym = null) {
  // Admin users have all permissions
  if (user.role === 'admin') {
    return true;
  }

  // Station users can only access their assigned station's resources
  if (user.role === 'station') {
    // For read operations, station users can see their station
    if (operation === 'read') {
      return resourceAcronym === null || resourceAcronym === user.station_acronym;
    }

    // For write operations, station users can edit their station's resources
    if (operation === 'write') {
      return resourceAcronym === user.station_acronym;
    }
  }

  // Readonly users can only read
  if (user.role === 'readonly') {
    return operation === 'read';
  }

  return false;
}

/**
 * Check station access for station users
 */
export function checkStationAccess(user, stationAcronym) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'station') {
    return user.station_acronym === stationAcronym;
  }

  return false;
}

/**
 * Hash password using Web Crypto API with salt
 */
export async function hashPassword(password, salt = 'sites_spectral_salt_v2') {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash, salt = 'sites_spectral_salt_v2') {
    const hashedInput = await hashPassword(password, salt);
    return hashedInput === hash;
}

/**
 * Middleware to require specific permission
 */
export async function requirePermission(request, action, resource, resourceStationId = null) {
    const userOrResponse = await requireAuth(request);

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
 * Log user activity (enhanced for secrets-based auth)
 */
export async function logActivity(env, userId, actionType, resourceType, resourceId, oldValues = null, newValues = null, request = null) {
    if (!env.DB) return; // Skip if no database available

    try {
        const ip = request?.headers.get('CF-Connecting-IP') ||
                   request?.headers.get('X-Forwarded-For') || 'unknown';
        const userAgent = request?.headers.get('User-Agent') || 'unknown';

        await env.DB.prepare(`
            INSERT INTO activity_log (
                user_id, action_type, resource_type, resource_id,
                old_values, new_values, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            typeof userId === 'string' ? userId : userId.toString(),
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
 * Get all available station usernames for admin purposes
 */
export function getAvailableStations() {
    return [
        'abisko', 'asa', 'bolmen', 'erken', 'grimso',
        'lonnstorp', 'robacksdalen', 'skogaryd', 'stordalen',
        'svartberget', 'tarfala'
    ];
}

/**
 * Validate station username
 */
export function isValidStationUsername(username) {
    return getAvailableStations().includes(username.toLowerCase());
}