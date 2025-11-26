// Pagination Middleware for SITES Spectral API v2
// Implements standard pagination with limit/offset parameters

/**
 * Default and maximum pagination limits
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 500,
  DEFAULT_OFFSET: 0
};

/**
 * Extract pagination parameters from request URL
 * @param {Request} request - The incoming request
 * @returns {Object} Pagination parameters { limit, offset }
 */
export function extractPaginationParams(request) {
  const url = new URL(request.url);

  let limit = parseInt(url.searchParams.get('limit'), 10);
  let offset = parseInt(url.searchParams.get('offset'), 10);

  // Apply defaults if not provided or invalid
  if (isNaN(limit) || limit < 1) {
    limit = PAGINATION_DEFAULTS.DEFAULT_LIMIT;
  }

  // Cap at maximum
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    limit = PAGINATION_DEFAULTS.MAX_LIMIT;
  }

  if (isNaN(offset) || offset < 0) {
    offset = PAGINATION_DEFAULTS.DEFAULT_OFFSET;
  }

  return { limit, offset };
}

/**
 * Build paginated response with metadata
 * @param {Array} items - The data items
 * @param {number} total - Total count of items (before pagination)
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @param {string} resourceName - Name of the resource (e.g., 'instruments')
 * @returns {Object} Paginated response object
 */
export function buildPaginatedResponse(items, total, limit, offset, resourceName) {
  const hasMore = offset + items.length < total;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    [resourceName]: items,
    pagination: {
      total,
      limit,
      offset,
      count: items.length,
      hasMore,
      currentPage,
      totalPages
    }
  };
}

/**
 * Add LIMIT and OFFSET to SQL query
 * @param {string} baseQuery - The base SQL query
 * @param {number} limit - Items per page
 * @param {number} offset - Current offset
 * @returns {string} Query with pagination
 */
export function addPaginationToQuery(baseQuery, limit, offset) {
  return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Generate count query from base query
 * @param {string} baseQuery - The base SQL query (SELECT ... FROM ...)
 * @returns {string} Count query
 */
export function generateCountQuery(baseQuery) {
  // Extract the FROM clause and everything after
  const fromIndex = baseQuery.toUpperCase().indexOf('FROM');
  if (fromIndex === -1) {
    throw new Error('Invalid query: no FROM clause found');
  }

  const fromClause = baseQuery.substring(fromIndex);

  // Remove ORDER BY clause if present
  const orderByIndex = fromClause.toUpperCase().indexOf('ORDER BY');
  const cleanFromClause = orderByIndex !== -1
    ? fromClause.substring(0, orderByIndex).trim()
    : fromClause;

  return `SELECT COUNT(*) as total ${cleanFromClause}`;
}
