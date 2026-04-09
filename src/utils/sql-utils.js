// SQL Utility Functions
// v16.0.0: LIKE pattern escaping to prevent wildcard injection

/**
 * Escape LIKE wildcard characters in user-supplied input
 * Prevents % and _ from altering LIKE pattern semantics.
 * Use with ESCAPE '\\' in the SQL query.
 *
 * @param {string} input - User-supplied string for LIKE clause
 * @returns {string} Escaped string safe for LIKE patterns
 */
export function escapeLikePattern(input) {
  return String(input)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}
