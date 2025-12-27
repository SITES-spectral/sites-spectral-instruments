/**
 * SITES Spectral - Configuration Management (ES6 Module)
 *
 * Centralized configuration for the frontend application.
 *
 * @module core/config
 * @version 13.15.0
 */

/**
 * Application version
 */
export const APP_VERSION = __APP_VERSION__ || '13.15.0';

/**
 * API configuration
 */
export const API_CONFIG = {
    baseUrl: '',  // Same origin
    version: 'v3',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
};

/**
 * Get API endpoint URL
 * @param {string} path - API path
 * @returns {string} Full API URL
 */
export function getApiUrl(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_CONFIG.baseUrl}/api/${API_CONFIG.version}${cleanPath}`;
}

/**
 * Platform type configuration
 */
export const PLATFORM_TYPES = {
    fixed: {
        code: 'fixed',
        name: 'Fixed Installation',
        icon: 'fa-tower-observation',
        color: '#059669',
        mountTypes: ['TWR', 'BLD', 'GND'],
    },
    uav: {
        code: 'uav',
        name: 'UAV (Drone)',
        icon: 'fa-crosshairs',
        color: '#3b82f6',
        mountTypes: ['UAV'],
    },
    satellite: {
        code: 'satellite',
        name: 'Satellite',
        icon: 'fa-satellite',
        color: '#8b5cf6',
        mountTypes: ['SAT'],
    },
    mobile: {
        code: 'mobile',
        name: 'Mobile Platform',
        icon: 'fa-truck',
        color: '#f59e0b',
        mountTypes: ['MOB'],
    },
    usv: {
        code: 'usv',
        name: 'Surface Vehicle',
        icon: 'fa-ship',
        color: '#0ea5e9',
        mountTypes: ['USV'],
    },
    uuv: {
        code: 'uuv',
        name: 'Underwater Vehicle',
        icon: 'fa-water',
        color: '#06b6d4',
        mountTypes: ['UUV'],
    },
};

/**
 * Get platform type configuration
 * @param {string} type - Platform type code
 * @returns {Object|null} Platform type config or null
 */
export function getPlatformType(type) {
    return PLATFORM_TYPES[type] || null;
}

/**
 * Instrument type configuration
 */
export const INSTRUMENT_TYPES = {
    phenocam: {
        code: 'phenocam',
        name: 'Phenocam',
        icon: 'fa-camera',
        color: '#059669',
        category: 'camera',
    },
    multispectral: {
        code: 'multispectral',
        name: 'Multispectral Sensor',
        icon: 'fa-satellite-dish',
        color: '#3b82f6',
        category: 'sensor',
    },
    rgb: {
        code: 'rgb',
        name: 'RGB Camera',
        icon: 'fa-camera-retro',
        color: '#10b981',
        category: 'camera',
    },
    par: {
        code: 'par',
        name: 'PAR Sensor',
        icon: 'fa-sun',
        color: '#f59e0b',
        category: 'sensor',
    },
    ndvi: {
        code: 'ndvi',
        name: 'NDVI Sensor',
        icon: 'fa-leaf',
        color: '#22c55e',
        category: 'sensor',
    },
    pri: {
        code: 'pri',
        name: 'PRI Sensor',
        icon: 'fa-microscope',
        color: '#8b5cf6',
        category: 'sensor',
    },
    hyperspectral: {
        code: 'hyperspectral',
        name: 'Hyperspectral Sensor',
        icon: 'fa-rainbow',
        color: '#ec4899',
        category: 'sensor',
    },
    thermal: {
        code: 'thermal',
        name: 'Thermal Camera',
        icon: 'fa-temperature-high',
        color: '#ef4444',
        category: 'camera',
    },
    lidar: {
        code: 'lidar',
        name: 'LiDAR',
        icon: 'fa-broadcast-tower',
        color: '#6366f1',
        category: 'sensor',
    },
};

/**
 * Get instrument type configuration
 * @param {string} type - Instrument type code
 * @returns {Object|null} Instrument type config or null
 */
export function getInstrumentType(type) {
    if (!type) return null;
    const normalized = type.toLowerCase().replace(/[_\s]/g, '');
    return INSTRUMENT_TYPES[normalized] || null;
}

/**
 * Status configuration
 */
export const STATUS_CONFIG = {
    active: { label: 'Active', color: '#10b981', bgColor: '#d1fae5' },
    inactive: { label: 'Inactive', color: '#6b7280', bgColor: '#f3f4f6' },
    maintenance: { label: 'Maintenance', color: '#f59e0b', bgColor: '#fef3c7' },
    decommissioned: { label: 'Decommissioned', color: '#ef4444', bgColor: '#fee2e2' },
    pending: { label: 'Pending', color: '#3b82f6', bgColor: '#dbeafe' },
};

/**
 * Get status configuration
 * @param {string} status - Status code
 * @returns {Object} Status config
 */
export function getStatusConfig(status) {
    const normalized = status?.toLowerCase() || 'inactive';
    return STATUS_CONFIG[normalized] || STATUS_CONFIG.inactive;
}

/**
 * Ecosystem codes
 */
export const ECOSYSTEM_CODES = {
    FOR: 'Forest',
    AGR: 'Arable Land',
    GRA: 'Grassland',
    HEA: 'Heathland',
    MIR: 'Mires',
    ALP: 'Alpine Forest',
    LAK: 'Lake',
    CON: 'Coniferous Forest',
    WET: 'Wetland',
    DEC: 'Deciduous Forest',
    MAR: 'Marshland',
    PEA: 'Peatland',
};

/**
 * Get ecosystem name
 * @param {string} code - Ecosystem code
 * @returns {string} Ecosystem name
 */
export function getEcosystemName(code) {
    return ECOSYSTEM_CODES[code] || code;
}

/**
 * Config namespace export
 */
export const Config = {
    APP_VERSION,
    API_CONFIG,
    PLATFORM_TYPES,
    INSTRUMENT_TYPES,
    STATUS_CONFIG,
    ECOSYSTEM_CODES,
    getApiUrl,
    getPlatformType,
    getInstrumentType,
    getStatusConfig,
    getEcosystemName,
};

export default Config;
