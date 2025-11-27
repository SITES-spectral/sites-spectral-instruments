// SITES Spectral Constants Configuration
// Centralized constants for the application

/**
 * Application version information
 */
export const VERSION = {
  MAJOR: 7,
  MINOR: 0,
  PATCH: 0,
  get FULL() {
    return `${this.MAJOR}.${this.MINOR}.${this.PATCH}`;
  },
  API_VERSIONS: ['v1', 'v2'],
  DEFAULT_API_VERSION: 'v1'
};

/**
 * HTTP Status codes used in the API
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
};

/**
 * User roles and their capabilities
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  STATION: 'station',
  READONLY: 'readonly'
};

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY = {
  [USER_ROLES.READONLY]: 1,
  [USER_ROLES.STATION]: 2,
  [USER_ROLES.ADMIN]: 3
};

/**
 * Entity status options
 */
export const ENTITY_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  TESTING: 'Testing',
  MAINTENANCE: 'Maintenance',
  DECOMMISSIONED: 'Decommissioned',
  PLANNED: 'Planned'
};

/**
 * Measurement status options
 */
export const MEASUREMENT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PLANNED: 'Planned',
  SUSPENDED: 'Suspended',
  ENDED: 'Ended'
};

/**
 * Instrument type codes for naming conventions
 */
export const INSTRUMENT_TYPE_CODES = {
  PHENOCAM: 'PHE',
  MULTISPECTRAL: 'MS',
  PRI: 'PRI',
  NDVI: 'NDVI',
  PAR: 'PAR',
  HYPERSPECTRAL: 'HYP'
};

/**
 * Ecosystem codes used across SITES stations
 */
export const ECOSYSTEM_CODES = {
  FOR: { code: 'FOR', name: 'Forest' },
  AGR: { code: 'AGR', name: 'Arable Land' },
  MIR: { code: 'MIR', name: 'Mires' },
  LAK: { code: 'LAK', name: 'Lake' },
  WET: { code: 'WET', name: 'Wetland' },
  GRA: { code: 'GRA', name: 'Grassland' },
  HEA: { code: 'HEA', name: 'Heathland' },
  ALP: { code: 'ALP', name: 'Alpine Forest' },
  CON: { code: 'CON', name: 'Coniferous Forest' },
  DEC: { code: 'DEC', name: 'Deciduous Forest' },
  MAR: { code: 'MAR', name: 'Marshland' },
  PEA: { code: 'PEA', name: 'Peatland' }
};

/**
 * SITES Research stations
 */
export const SITES_STATIONS = {
  ANS: { acronym: 'ANS', name: 'Abisko', normalized: 'abisko' },
  ASA: { acronym: 'ASA', name: 'Asa', normalized: 'asa' },
  GRI: { acronym: 'GRI', name: 'Grimsö', normalized: 'grimso' },
  LON: { acronym: 'LON', name: 'Lönnstorp', normalized: 'lonnstorp' },
  RBD: { acronym: 'RBD', name: 'Röbäcksdalen', normalized: 'robacksdalen' },
  SKC: { acronym: 'SKC', name: 'Skogaryd', normalized: 'skogaryd' },
  SVB: { acronym: 'SVB', name: 'Svartberget', normalized: 'svartberget' }
};

/**
 * Default coordinate reference system
 */
export const DEFAULT_CRS = 'EPSG:4326';

/**
 * Coordinate validation ranges (WGS84)
 */
export const COORDINATE_RANGES = {
  LATITUDE: { MIN: -90, MAX: 90 },
  LONGITUDE: { MIN: -180, MAX: 180 }
};

/**
 * Swedish territory approximate bounds
 * Used for sanity checking coordinates
 */
export const SWEDEN_BOUNDS = {
  LATITUDE: { MIN: 55.0, MAX: 69.5 },
  LONGITUDE: { MIN: 10.5, MAX: 24.5 }
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 500,
  DEFAULT_OFFSET: 0
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  AUTH_ATTEMPTS: { MAX: 5, WINDOW_MINUTES: 15 },
  WRITE_OPERATIONS: { MAX: 100, WINDOW_MINUTES: 60 },
  ADMIN_OPERATIONS: { MAX: 50, WINDOW_MINUTES: 60 }
};

/**
 * Request size limits
 */
export const REQUEST_LIMITS = {
  MAX_BODY_SIZE: 1024 * 1024, // 1MB
  MAX_JSON_DEPTH: 10
};

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  STATIC_DATA: 3600, // 1 hour - ecosystems, status codes
  USER_SESSION: 86400, // 24 hours
  STATION_LIST: 300, // 5 minutes
  INSTRUMENT_DATA: 60 // 1 minute
};

/**
 * Default values for instruments
 */
export const INSTRUMENT_DEFAULTS = {
  POWER_SOURCE: 'Solar+Battery',
  DATA_TRANSMISSION: 'LoRaWAN',
  IMAGE_PROCESSING_ENABLED: false
};

/**
 * Sensor brand mappings for normalized naming
 */
export const SENSOR_BRAND_MAPPINGS = {
  'SKYE': 'SKYE',
  'APOGEE': 'APOGEE',
  'DECAGON': 'DECAGON',
  'METER': 'METER',
  'LICOR': 'LICOR',
  'LI-COR': 'LICOR',
  'PPSYSTEMS': 'PP',
  'PP SYSTEMS': 'PP',
  'PP': 'PP'
};

/**
 * Content types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  HTML: 'text/html',
  CSS: 'text/css',
  JS: 'application/javascript',
  CSV: 'text/csv',
  TSV: 'text/tab-separated-values'
};

/**
 * CORS configuration
 */
export const CORS = {
  ALLOWED_ORIGINS: ['*'], // Configure as needed for production
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
  MAX_AGE: 86400 // 24 hours
};
