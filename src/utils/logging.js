// Logging Utilities
// Audit logging and security event tracking

/**
 * Comprehensive API Request Logging
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment variables and bindings
 * @param {Object} ctx - Request context
 */
export async function logApiRequest(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';

    // Extract basic auth info without exposing tokens
    const authHeader = request.headers.get('Authorization');
    let authType = 'none';
    if (authHeader) {
      authType = authHeader.startsWith('Bearer ') ? 'bearer' : 'other';
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: url.pathname,
      query_params: Object.fromEntries(url.searchParams),
      client_ip: clientIP,
      user_agent: userAgent,
      auth_type: authType,
      country: request.cf?.country || 'unknown',
      request_id: crypto.randomUUID()
    };

    // Store in audit log (implement based on your storage preference)
    // For now, just console.log for development
    console.log('API_REQUEST:', JSON.stringify(logEntry));

  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

/**
 * Admin Action Logging
 * @param {Object} user - The admin user performing the action
 * @param {string} action - Action type (create, update, delete, etc.)
 * @param {string} description - Human-readable description of the action
 * @param {Object} env - Environment variables and bindings
 * @param {Object} metadata - Additional metadata to log
 */
export async function logAdminAction(user, action, description, env, metadata = {}) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      admin_user: user.username,
      action: action,
      description: description,
      metadata: metadata,
      session_id: user.session_id || null
    };

    // Insert into audit log table (create if needed)
    const query = `
      INSERT INTO admin_audit_log (
        timestamp, admin_user, action, description, metadata
      ) VALUES (?, ?, ?, ?, ?)
    `;

    await env.DB.prepare(query).bind(
      logEntry.timestamp,
      logEntry.admin_user,
      logEntry.action,
      logEntry.description,
      JSON.stringify(logEntry.metadata)
    ).run();

  } catch (error) {
    // Fallback to console if database logging fails
    console.error('Failed to log admin action:', error);
    console.log('ADMIN_ACTION:', JSON.stringify({
      user: user.username,
      action,
      description,
      metadata
    }));
  }
}

/**
 * Security Event Logging
 * @param {string} eventType - Type of security event
 * @param {Object} user - User involved in the security event
 * @param {Request} request - The request that triggered the event
 * @param {Object} env - Environment variables and bindings
 */
export async function logSecurityEvent(eventType, user, request, env) {
  try {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    const securityEvent = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      user: user ? user.username : 'anonymous',
      user_role: user ? user.role : null,
      client_ip: clientIP,
      path: url.pathname,
      user_agent: request.headers.get('User-Agent') || '',
      country: request.cf?.country || 'unknown'
    };

    console.log('SECURITY_EVENT:', JSON.stringify(securityEvent));

    // In production, also send to security monitoring service

  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}