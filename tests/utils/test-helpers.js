/**
 * SITES Spectral V3 API Test Helpers
 * Utilities for testing API endpoints
 */

/**
 * Get the mock environment
 * @returns {Object} Mock environment
 */
export function getMockEnv() {
  return globalThis.env;
}

/**
 * Create a mock Request object
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Request} Mock request
 */
export function createMockRequest(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    authToken = null,
  } = options;

  const requestHeaders = new Headers(headers);

  if (authToken) {
    requestHeaders.set('Authorization', `Bearer ${authToken}`);
  }

  if (body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const requestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return new Request(url, requestInit);
}

/**
 * Create a mock environment with D1 database
 * @param {Object} db - D1 database instance
 * @returns {Object} Mock environment
 */
export function createMockEnv(db) {
  return {
    DB: db,
    ENVIRONMENT: 'test',
    APP_NAME: 'SITES Spectral Test',
    APP_VERSION: '8.0.0-rc.1',
    JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
    USE_CLOUDFLARE_SECRETS: 'false',
  };
}

/**
 * Create a mock context
 * @returns {Object} Mock context
 */
export function createMockCtx() {
  return {
    waitUntil: (promise) => promise,
    passThroughOnException: () => {},
  };
}

/**
 * Generate a test JWT token
 * @param {Object} payload - Token payload
 * @returns {string} Base64 encoded token (simplified for testing)
 */
export function generateTestToken(payload = {}) {
  const defaultPayload = {
    username: 'testuser',
    role: 'admin',
    station_id: null,
    station_acronym: null,
    issued_at: Date.now(),
    expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    ...payload,
  };

  return Buffer.from(JSON.stringify(defaultPayload)).toString('base64');
}

/**
 * Parse JSON response
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Parsed JSON
 */
export async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text, parseError: e.message };
  }
}

/**
 * Assert response status and return JSON
 * @param {Response} response - Fetch response
 * @param {number} expectedStatus - Expected HTTP status
 * @returns {Promise<Object>} Parsed JSON
 */
export async function assertResponse(response, expectedStatus) {
  const json = await parseJsonResponse(response);
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${JSON.stringify(json)}`
    );
  }
  return json;
}

/**
 * Base URL for API testing
 */
export const API_BASE_URL = 'https://test.sites-spectral.dev';

/**
 * Create full API URL
 * @param {string} path - API path
 * @returns {string} Full URL
 */
export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
