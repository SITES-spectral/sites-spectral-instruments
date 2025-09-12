// Authentication API endpoints for SITES Spectral
// Enhanced with Cloudflare secrets support for station-based authentication
import { hashPassword, verifyPassword, generateToken, verifyToken, createSession, deleteSession, logActivity } from '../../src/auth.js';
import { authenticateUser, generateToken as generateSecretToken } from '../../src/auth-secrets.js';

export async function onRequestPost({ request, env }) {
    const url = new URL(request.url);
    const endpoint = url.pathname.split('/').pop();
    
    switch (endpoint) {
        case 'login':
            return await handleLogin(request, env);
        case 'logout':
            return await handleLogout(request, env);
        case 'verify':
            return await handleVerify(request, env);
        case 'refresh':
            return await handleRefresh(request, env);
        default:
            return new Response('Not Found', { status: 404 });
    }
}

export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const endpoint = url.pathname.split('/').pop();
    
    if (endpoint === 'verify') {
        return await handleVerify(request, env);
    }
    
    return new Response('Method Not Allowed', { status: 405 });
}

async function handleLogin(request, env) {
    try {
        const { username, password } = await request.json();
        
        if (!username || !password) {
            return new Response(JSON.stringify({ 
                error: 'Username and password required' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Try secrets-based authentication first (for station users)
        const secretUser = await authenticateUser(username, password, env);
        
        if (secretUser) {
            // Generate token using secrets-based system
            const token = await generateSecretToken(secretUser, env);
            
            // Log successful login
            await logActivity(env, secretUser.id, 'login', 'auth', null, null, { 
                ip: request.headers.get('CF-Connecting-IP'),
                auth_method: 'secrets'
            }, request);

            // Get station information and verify it's active
            let stationInfo = {};
            if (secretUser.station_id && env.DB) {
                try {
                    const station = await env.DB.prepare(
                        'SELECT display_name, acronym, status FROM stations WHERE id = ?'
                    ).bind(secretUser.station_id).first();
                    
                    if (station) {
                        // Check if station is inactive/disabled in database
                        if (station.status === 'Inactive') {
                            return new Response(JSON.stringify({ 
                                error: 'Station access is disabled' 
                            }), {
                                status: 403,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        
                        stationInfo = {
                            station_name: station.display_name,
                            station_acronym: station.acronym
                        };
                    }
                } catch (dbError) {
                    console.warn('Could not fetch station info:', dbError);
                }
            }

            // Return user info and token
            const userResponse = {
                id: secretUser.id,
                username: secretUser.username,
                role: secretUser.role,
                station_id: secretUser.station_id,
                ...stationInfo,
                full_name: secretUser.username, // Use username as display name
                auth_method: 'secrets'
            };

            return new Response(JSON.stringify({
                success: true,
                user: userResponse,
                token,
                expires_in: 24 * 60 * 60 // 24 hours in seconds
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fallback to database authentication (legacy users)
        if (!env.DB) {
            return new Response(JSON.stringify({ 
                error: 'Invalid credentials' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = await env.DB.prepare(`
            SELECT u.*, s.display_name as station_name, s.acronym as station_acronym
            FROM users u
            LEFT JOIN stations s ON u.station_id = s.id
            WHERE u.username = ? OR u.email = ?
        `).bind(username, username).first();

        if (!user) {
            // Log failed attempt
            await logActivity(env, null, 'login_failed', 'auth', null, null, { 
                username, 
                reason: 'user_not_found',
                auth_method: 'database'
            }, request);
            
            return new Response(JSON.stringify({ 
                error: 'Invalid credentials' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if account is active
        if (!user.active) {
            await logActivity(env, user.id, 'login_failed', 'auth', null, null, { 
                reason: 'account_disabled',
                auth_method: 'database'
            }, request);
            
            return new Response(JSON.stringify({ 
                error: 'Account disabled' 
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return new Response(JSON.stringify({ 
                error: 'Account temporarily locked due to failed login attempts' 
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify password
        const passwordValid = await verifyPassword(password, user.password_hash);
        
        if (!passwordValid) {
            // Increment failed attempts
            const failedAttempts = (user.failed_login_attempts || 0) + 1;
            let lockUntil = null;
            
            // Lock account after 5 failed attempts for 30 minutes
            if (failedAttempts >= 5) {
                lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
            }
            
            await env.DB.prepare(`
                UPDATE users SET 
                    failed_login_attempts = ?,
                    locked_until = ?
                WHERE id = ?
            `).bind(failedAttempts, lockUntil, user.id).run();
            
            await logActivity(env, user.id, 'login_failed', 'auth', null, null, { 
                reason: 'invalid_password', 
                attempts: failedAttempts,
                auth_method: 'database'
            }, request);
            
            return new Response(JSON.stringify({ 
                error: 'Invalid credentials' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Success - reset failed attempts and generate token
        await env.DB.prepare(`
            UPDATE users SET 
                failed_login_attempts = 0,
                locked_until = NULL,
                last_login = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(user.id).run();

        const token = await generateToken(user);
        await createSession(env, user.id, token, request);
        
        // Log successful login
        await logActivity(env, user.id, 'login', 'auth', null, null, { 
            ip: request.headers.get('CF-Connecting-IP'),
            auth_method: 'database'
        }, request);

        // Return user info and token
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            station_id: user.station_id,
            station_name: user.station_name,
            station_acronym: user.station_acronym,
            full_name: user.full_name,
            organization: user.organization,
            auth_method: 'database'
        };

        return new Response(JSON.stringify({
            success: true,
            user: userResponse,
            token,
            expires_in: 24 * 60 * 60 // 24 hours in seconds
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ 
            error: 'Login failed' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleLogout(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ 
                success: true,
                message: 'No active session' 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        const payload = await verifyToken(token);
        
        if (payload) {
            // Delete session from database
            await deleteSession(env, token);
            
            // Log logout
            await logActivity(env, parseInt(payload.sub), 'logout', 'auth', null, null, null, request);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Logged out successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Logout error:', error);
        return new Response(JSON.stringify({ 
            error: 'Logout failed' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleVerify(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ 
                valid: false,
                error: 'No token provided' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        
        // Try secrets-based authentication first
        const secretPayload = await import('../../src/auth-secrets.js').then(module => module.verifyToken(token, env));
        
        if (secretPayload) {
            // Valid secrets-based token
            return new Response(JSON.stringify({
                valid: true,
                user: {
                    id: secretPayload.sub,
                    username: secretPayload.username,
                    role: secretPayload.role,
                    station_id: secretPayload.station_id
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Fallback to database-based verification
        const payload = await verifyToken(token);
        
        if (!payload) {
            return new Response(JSON.stringify({ 
                valid: false,
                error: 'Invalid token' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if session exists in database for database users
        if (env.DB) {
            const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
            const tokenHashHex = Array.from(new Uint8Array(tokenHash))
                .map(b => b.toString(16).padStart(2, '0')).join('');
            
            const session = await env.DB.prepare(`
                SELECT s.*, u.active 
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token_hash = ? AND s.expires_at > datetime('now')
            `).bind(tokenHashHex).first();

            if (!session || !session.active) {
                return new Response(JSON.stringify({ 
                    valid: false,
                    error: 'Session expired or user disabled' 
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Update last activity
            await env.DB.prepare(`
                UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP 
                WHERE token_hash = ?
            `).bind(tokenHashHex).run();
        }

        return new Response(JSON.stringify({
            valid: true,
            user: {
                id: parseInt(payload.sub),
                username: payload.username,
                role: payload.role,
                station_id: payload.station_id
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Verify error:', error);
        return new Response(JSON.stringify({ 
            valid: false,
            error: 'Token verification failed' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleRefresh(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ 
                error: 'No token provided' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.substring(7);
        const payload = await verifyToken(token);
        
        if (!payload) {
            return new Response(JSON.stringify({ 
                error: 'Invalid token' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get fresh user data
        const user = await env.DB.prepare(`
            SELECT u.*, s.display_name as station_name, s.acronym as station_acronym
            FROM users u
            LEFT JOIN stations s ON u.station_id = s.id
            WHERE u.id = ? AND u.active = TRUE
        `).bind(payload.sub).first();

        if (!user) {
            return new Response(JSON.stringify({ 
                error: 'User not found or disabled' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate new token
        const newToken = await generateToken(user);
        
        // Delete old session and create new one
        await deleteSession(env, token);
        await createSession(env, user.id, newToken, request);
        
        // Log token refresh
        await logActivity(env, user.id, 'token_refresh', 'auth', null, null, null, request);

        return new Response(JSON.stringify({
            success: true,
            token: newToken,
            expires_in: 24 * 60 * 60 // 24 hours in seconds
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Refresh error:', error);
        return new Response(JSON.stringify({ 
            error: 'Token refresh failed' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}