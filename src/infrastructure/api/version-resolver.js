/**
 * API Version Resolver
 * Infrastructure layer - resolves API version from request path or headers
 *
 * Supports:
 * - Explicit versions: /api/v11, /api/v10
 * - Semantic aliases: /api/latest, /api/stable, /api/current
 * - Header-based version selection: X-API-Version
 *
 * @module infrastructure/api/version-resolver
 * @version 11.0.0-alpha.32
 */

/**
 * Version configuration loaded from YAML
 * In Cloudflare Workers, we embed this as a static config
 * Update this when changing yamls/api/api-versions.yaml
 */
const VERSION_CONFIG = {
  current: {
    version: 'v11',
    versionNumber: '11.0.0-alpha.32'
  },
  aliases: {
    latest: 'v11',
    stable: 'v11',
    current: 'v11',
    legacy: 'v10'
  },
  supportedVersions: {
    v11: { status: 'current', description: 'Hexagonal Architecture' },
    v10: { status: 'legacy', description: 'ROI Management + Admin Panel' }
  },
  defaultVersion: 'v11'
};

/**
 * Resolve API version from request
 *
 * @param {Request} request - HTTP request
 * @returns {Object} Version resolution result
 * @returns {string} result.requested - Originally requested version/alias
 * @returns {string} result.resolved - Resolved concrete version (e.g., 'v11')
 * @returns {boolean} result.isAlias - Whether an alias was used
 * @returns {string} result.status - Version status (current, legacy, deprecated)
 * @returns {Object} result.config - Full version configuration
 */
export function resolveAPIVersion(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Extract version from path: /api/{version}/...
  let requestedVersion = null;

  if (pathParts[0] === 'api' && pathParts.length >= 2) {
    requestedVersion = pathParts[1];
  }

  // Check for version override in header
  const headerVersion = request.headers.get('X-API-Version');
  if (headerVersion) {
    requestedVersion = headerVersion;
  }

  // Default if no version specified
  if (!requestedVersion) {
    requestedVersion = VERSION_CONFIG.defaultVersion;
  }

  // Resolve aliases
  const isAlias = VERSION_CONFIG.aliases.hasOwnProperty(requestedVersion);
  const resolvedVersion = isAlias
    ? VERSION_CONFIG.aliases[requestedVersion]
    : requestedVersion;

  // Get version configuration
  const versionConfig = VERSION_CONFIG.supportedVersions[resolvedVersion];

  // Check if version is supported
  if (!versionConfig) {
    return {
      requested: requestedVersion,
      resolved: null,
      isAlias,
      status: 'unsupported',
      config: null,
      error: `Unsupported API version: ${requestedVersion}`,
      supported: Object.keys(VERSION_CONFIG.supportedVersions)
    };
  }

  return {
    requested: requestedVersion,
    resolved: resolvedVersion,
    isAlias,
    status: versionConfig.status,
    config: versionConfig,
    error: null
  };
}

/**
 * Check if a version string is an alias
 *
 * @param {string} version - Version or alias string
 * @returns {boolean}
 */
export function isAlias(version) {
  return VERSION_CONFIG.aliases.hasOwnProperty(version);
}

/**
 * Get the current production version
 *
 * @returns {string}
 */
export function getCurrentVersion() {
  return VERSION_CONFIG.current.version;
}

/**
 * Get the stable version (alias resolution)
 *
 * @returns {string}
 */
export function getStableVersion() {
  return VERSION_CONFIG.aliases.stable;
}

/**
 * Get all supported versions
 *
 * @returns {string[]}
 */
export function getSupportedVersions() {
  return Object.keys(VERSION_CONFIG.supportedVersions);
}

/**
 * Get all available aliases
 *
 * @returns {Object}
 */
export function getAliases() {
  return { ...VERSION_CONFIG.aliases };
}

/**
 * Add version headers to response
 *
 * @param {Response} response - Original response
 * @param {Object} versionInfo - Version resolution result
 * @returns {Response} Response with version headers
 */
export function addVersionHeaders(response, versionInfo) {
  const headers = new Headers(response.headers);

  headers.set('X-API-Version', versionInfo.resolved || VERSION_CONFIG.defaultVersion);
  headers.set('X-API-Version-Status', versionInfo.status || 'unknown');

  if (versionInfo.isAlias) {
    headers.set('X-API-Alias', versionInfo.requested);
  }

  headers.set('X-API-Latest-Version', VERSION_CONFIG.aliases.latest);

  // Add deprecation warning for legacy versions
  if (versionInfo.status === 'legacy' || versionInfo.status === 'deprecated') {
    headers.set('X-API-Deprecated', 'true');
    headers.set('X-API-Migration', `Upgrade to /api/latest (resolves to ${VERSION_CONFIG.aliases.latest})`);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Create error response for unsupported version
 *
 * @param {Object} versionInfo - Version resolution result with error
 * @returns {Response}
 */
export function createUnsupportedVersionResponse(versionInfo) {
  return new Response(JSON.stringify({
    error: 'Unsupported API version',
    message: versionInfo.error,
    requested: versionInfo.requested,
    supported_versions: versionInfo.supported,
    aliases: Object.keys(VERSION_CONFIG.aliases),
    recommendation: 'Use /api/latest for automatic version resolution'
  }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Latest-Version': VERSION_CONFIG.aliases.latest
    }
  });
}

/**
 * Get version info for health/info endpoints
 *
 * @returns {Object}
 */
export function getVersionInfo() {
  return {
    current: VERSION_CONFIG.current,
    aliases: VERSION_CONFIG.aliases,
    supported: Object.entries(VERSION_CONFIG.supportedVersions).map(([version, config]) => ({
      version,
      ...config
    })),
    default: VERSION_CONFIG.defaultVersion
  };
}
