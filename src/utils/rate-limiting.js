// Rate Limiting Utilities
// Rate limiting for admin operations

/**
 * Check rate limits for admin operations
 * @param {Object} user - The admin user
 * @param {string} method - HTTP method (DELETE has stricter limits)
 * @param {Object} env - Environment variables and bindings
 * @returns {Object} Rate limit status
 */
export async function checkAdminRateLimit(user, method, env) {
  try {
    const windowMinutes = 5;
    const maxOperations = method === 'DELETE' ? 10 : 50; // Stricter limits for deletions

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Count recent operations by this admin user
    const query = `
      SELECT COUNT(*) as operation_count
      FROM admin_audit_log
      WHERE admin_user = ? AND timestamp > ? AND action = ?
    `;

    const result = await env.DB.prepare(query).bind(user.username, windowStart, method).first();
    const currentCount = result?.operation_count || 0;

    if (currentCount >= maxOperations) {
      return {
        exceeded: true,
        retry_after: windowMinutes * 60,
        current_count: currentCount,
        limit: maxOperations
      };
    }

    return { exceeded: false };

  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow operation if rate limit check fails
    return { exceeded: false };
  }
}