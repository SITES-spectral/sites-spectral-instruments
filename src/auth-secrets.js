// Enhanced Authentication using Cloudflare Secrets
// This module provides station-based authentication using secrets stored in Cloudflare

import { SignJWT, jwtVerify } from 'jose';

/**
 * Get JWT secret from Cloudflare environment
 */
function getJWTSecret(env) {
    const secret = env.JWT_SECRET || 'fallback_secret_for_development';
    return new TextEncoder().encode(secret);
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
 * Generate JWT token for authenticated user
 */
export async function generateToken(user, env) {
    const secret = getJWTSecret(env);
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
        sub: user.id ? user.id.toString() : user.username,
        username: user.username,
        role: user.role,
        station_id: user.station_id,
        iss: 'sites-spectral',
        aud: 'sites-spectral-users',
        exp: now + (24 * 60 * 60), // 24 hours
        iat: now
    };

    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token, env) {
    try {
        const secret = getJWTSecret(env);
        const { payload } = await jwtVerify(token, secret, {
            issuer: 'sites-spectral',
            audience: 'sites-spectral-users'
        });
        return payload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

/**
 * Get user credentials from Cloudflare secrets
 */
async function getUserFromSecrets(username, env) {
    try {
        // Check admin credentials
        if (username === 'admin') {
            const adminCredentials = env.ADMIN_CREDENTIALS;
            if (adminCredentials) {
                const admin = JSON.parse(adminCredentials);
                return {
                    id: 'admin',
                    username: admin.username,
                    role: admin.role,
                    station_id: admin.station_id,
                    active: admin.active !== false,
                    password_hash: await hashPassword(admin.password) // Hash the stored password
                };
            }
        }
        
        // Check station credentials
        const stationSecretName = `STATION_${username.toUpperCase()}_CREDENTIALS`;
        const stationCredentials = env[stationSecretName];
        
        if (stationCredentials) {
            const station = JSON.parse(stationCredentials);
            return {
                id: station.station_id,
                username: station.username,
                role: station.role,
                station_id: station.station_id,
                active: station.active !== false,
                password_hash: await hashPassword(station.password) // Hash the stored password
            };
        }
        
        return null;
    } catch (error) {
        console.error('Failed to get user from secrets:', error);
        return null;
    }
}

/**
 * Authenticate user with username and password using secrets
 */
export async function authenticateUser(username, password, env) {
    try {
        // First try to get user from secrets (new method)
        const secretUser = await getUserFromSecrets(username, env);
        if (secretUser) {
            const isValid = await verifyPassword(password, secretUser.password_hash);
            if (isValid) {
                // Update last login in database if available
                if (env.DB) {
                    try {
                        await env.DB.prepare(
                            'UPDATE users SET last_login = datetime("now") WHERE username = ?'
                        ).bind(username).run();
                    } catch (dbError) {
                        console.warn('Could not update last login in database:', dbError);
                    }
                }
                
                return {
                    id: secretUser.id,
                    username: secretUser.username,
                    role: secretUser.role,
                    station_id: secretUser.station_id
                };
            }
        }
        
        // Fallback to database authentication (legacy method)
        if (env.DB) {
            const dbUser = await env.DB.prepare(
                'SELECT id, username, password_hash, role, station_id, active FROM users WHERE username = ?'
            ).bind(username).first();
            
            if (dbUser && dbUser.active) {
                const isValid = await verifyPassword(password, dbUser.password_hash);
                if (isValid) {
                    // Update last login
                    await env.DB.prepare(
                        'UPDATE users SET last_login = datetime("now") WHERE id = ?'
                    ).bind(dbUser.id).run();
                    
                    return {
                        id: dbUser.id,
                        username: dbUser.username,
                        role: dbUser.role,
                        station_id: dbUser.station_id
                    };
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Authentication failed:', error);
        return null;
    }
}

/**
 * Extract user from request headers
 */
export async function getUserFromRequest(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    return await verifyToken(token, env);
}

/**
 * Check if user has permission to access resource
 */
export function hasPermission(user, action, resource, resourceStationId = null) {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'admin') {
        return true;
    }

    // Station users can only access their own station's resources
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
 */
export async function requireAuth(request, env) {
    const user = await getUserFromRequest(request, env);
    
    if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // For secrets-based users, we don't need to check database status
    if (typeof user.id === 'string' || !env.DB) {
        return user;
    }

    // For database users, check if user is active
    try {
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
    } catch (error) {
        console.warn('Could not check user status in database:', error);
    }

    return user;
}

/**
 * Middleware to require specific permission
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