// Allowed origins for CORS
// Only these origins can make cross-origin requests to the API
//
// v15.0.0: Added subdomain support for station portals
//
// Architecture Credit: This subdomain-based architecture design is based on
// architectural knowledge shared by Flights for Biodiversity Sweden AB
// (https://github.com/flightsforbiodiversity)

/**
 * Static list of explicitly allowed origins
 * Includes production domains, dev URLs, and local development
 */
export const ALLOWED_ORIGINS = [
  // Production - Root domain (public portal)
  'https://sitesspectral.work',

  // Production - Admin portal
  'https://admin.sitesspectral.work',

  // Production - Legacy jobelab account
  'https://sites.jobelab.com',

  // Cloudflare Workers dev URLs
  'https://sites-spectral-instruments.jose-beltran.workers.dev',
  'https://sites-spectral-instruments.jose-e5f.workers.dev',

  // Local development
  'http://localhost:8787',
  'http://127.0.0.1:8787',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * Station acronyms for dynamic subdomain matching
 * These are used to generate allowed origins for station portals
 */
const STATION_ACRONYMS = [
  'abisko',
  'ans',        // Abisko alternate
  'asa',
  'bolmen',
  'erken',
  'grimso',
  'gri',        // Grimso alternate
  'lonnstorp',
  'lon',        // Lonnstorp alternate
  'robacksdalen',
  'rob',        // Robacksdalen alternate
  'skogaryd',
  'sko',        // Skogaryd alternate
  'svartberget',
  'svb',        // Svartberget alternate
  // New stations (v14.1.0)
  'alnarp',
  'aln',        // Alnarp alternate
  'hyltemossa',
  'hyl',        // Hyltemossa alternate
];

/**
 * Generate dynamic station portal origins
 *
 * @returns {string[]} Array of station portal origins
 */
function generateStationOrigins() {
  return STATION_ACRONYMS.map(acronym =>
    `https://${acronym}.sitesspectral.work`
  );
}

/**
 * All allowed origins including dynamically generated station portals
 */
const ALL_ALLOWED_ORIGINS = [
  ...ALLOWED_ORIGINS,
  ...generateStationOrigins()
];

/**
 * Check if an origin is allowed for CORS
 * Supports both static list and dynamic subdomain patterns
 *
 * @param {string|null} origin - The origin header from the request
 * @returns {boolean} - True if origin is allowed
 */
export function isAllowedOrigin(origin) {
  if (!origin) {
    // No origin header - could be same-origin request or server-to-server
    return true;
  }

  // Check static list first
  if (ALL_ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check dynamic subdomain pattern for sitesspectral.work
  try {
    const url = new URL(origin);
    const host = url.hostname;

    // Allow any subdomain of sitesspectral.work
    if (host.endsWith('.sitesspectral.work')) {
      // Extract subdomain
      const subdomain = host.replace('.sitesspectral.work', '');

      // Validate subdomain format (alphanumeric and hyphens only)
      if (/^[a-z0-9-]+$/.test(subdomain)) {
        return true;
      }
    }

    // Allow workers.dev subdomains for development
    if (host.endsWith('.workers.dev')) {
      return true;
    }

  } catch (e) {
    // Invalid URL, fall through to false
  }

  return false;
}

/**
 * Get the appropriate Access-Control-Allow-Origin value
 *
 * @param {string|null} origin - The origin header from the request
 * @returns {string} - The allowed origin or the first allowed origin as fallback
 */
export function getAllowedOrigin(origin) {
  // If origin is allowed, return it (for dynamic origin support)
  if (origin && isAllowedOrigin(origin)) {
    return origin;
  }

  // Return first allowed origin as fallback (for error responses)
  return ALLOWED_ORIGINS[0];
}

/**
 * Get list of station acronyms for validation
 *
 * @returns {string[]} Array of valid station acronyms
 */
export function getStationAcronyms() {
  return [...STATION_ACRONYMS];
}

/**
 * Check if a subdomain corresponds to a valid station
 *
 * @param {string} subdomain - Subdomain to check
 * @returns {boolean} True if subdomain is a valid station
 */
export function isValidStationSubdomain(subdomain) {
  if (!subdomain) return false;
  return STATION_ACRONYMS.includes(subdomain.toLowerCase());
}
