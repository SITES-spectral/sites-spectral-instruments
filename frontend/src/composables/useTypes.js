/**
 * Type Configuration Composables
 *
 * Provides consistent type information for platforms and instruments
 * across all Vue components.
 *
 * @module composables/useTypes
 */

/**
 * Mount type prefixes with styling
 */
export const MOUNT_TYPES = {
  PL: {
    code: 'PL',
    name: 'Pole/Tower/Mast',
    description: 'Elevated structures (>1.5m height)',
    icon: 'tower-observation',
    color: 'info'
  },
  BL: {
    code: 'BL',
    name: 'Building',
    description: 'Rooftop or facade mounted',
    icon: 'building',
    color: 'secondary'
  },
  GL: {
    code: 'GL',
    name: 'Ground Level',
    description: 'Installations below 1.5m height',
    icon: 'down-long',
    color: 'success'
  },
  UAV: {
    code: 'UAV',
    name: 'UAV Position',
    description: 'Drone flight position',
    icon: 'drone',
    color: 'warning'
  },
  SAT: {
    code: 'SAT',
    name: 'Satellite',
    description: 'Virtual satellite position',
    icon: 'satellite',
    color: 'accent'
  },
  MOB: {
    code: 'MOB',
    name: 'Mobile',
    description: 'Portable platform',
    icon: 'truck',
    color: 'neutral'
  },
  USV: {
    code: 'USV',
    name: 'Surface Vehicle',
    description: 'Unmanned surface vehicle',
    icon: 'ship',
    color: 'primary'
  },
  UUV: {
    code: 'UUV',
    name: 'Underwater Vehicle',
    description: 'Unmanned underwater vehicle',
    icon: 'water',
    color: 'primary'
  }
};

/**
 * Platform type configurations with styling
 */
export const PLATFORM_TYPES = {
  fixed: {
    key: 'fixed',
    name: 'Fixed',
    icon: 'tower-observation',
    color: 'info',
    bgClass: 'bg-info/10',
    textClass: 'text-info',
    badgeClass: 'badge-info'
  },
  uav: {
    key: 'uav',
    name: 'UAV',
    icon: 'drone',
    color: 'warning',
    bgClass: 'bg-warning/10',
    textClass: 'text-warning',
    badgeClass: 'badge-warning'
  },
  satellite: {
    key: 'satellite',
    name: 'Satellite',
    icon: 'satellite',
    color: 'accent',
    bgClass: 'bg-accent/10',
    textClass: 'text-accent',
    badgeClass: 'badge-accent'
  },
  mobile: {
    key: 'mobile',
    name: 'Mobile',
    icon: 'truck',
    color: 'neutral',
    bgClass: 'bg-neutral/10',
    textClass: 'text-neutral',
    badgeClass: 'badge-neutral'
  },
  usv: {
    key: 'usv',
    name: 'USV',
    icon: 'ship',
    color: 'primary',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    badgeClass: 'badge-primary'
  },
  uuv: {
    key: 'uuv',
    name: 'UUV',
    icon: 'water',
    color: 'primary',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    badgeClass: 'badge-primary'
  }
};

/**
 * Instrument type configurations with styling
 */
export const INSTRUMENT_TYPES = {
  phenocam: {
    key: 'phenocam',
    name: 'Phenocam',
    code: 'PHE',
    icon: 'camera',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-500',
    badgeClass: 'badge-info'
  },
  multispectral: {
    key: 'multispectral',
    name: 'Multispectral',
    code: 'MS',
    icon: 'layer-group',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-500',
    badgeClass: 'badge-secondary'
  },
  par_sensor: {
    key: 'par_sensor',
    name: 'PAR Sensor',
    code: 'PAR',
    icon: 'sun',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    badgeClass: 'badge-warning'
  },
  ndvi_sensor: {
    key: 'ndvi_sensor',
    name: 'NDVI Sensor',
    code: 'NDVI',
    icon: 'leaf',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-500',
    badgeClass: 'badge-success'
  },
  pri_sensor: {
    key: 'pri_sensor',
    name: 'PRI Sensor',
    code: 'PRI',
    icon: 'microscope',
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-500',
    badgeClass: 'badge-accent'
  },
  hyperspectral: {
    key: 'hyperspectral',
    name: 'Hyperspectral',
    code: 'HYP',
    icon: 'rainbow',
    color: '#ec4899',
    bgClass: 'bg-pink-500/10',
    textClass: 'text-pink-500',
    badgeClass: 'badge-secondary badge-outline'
  },
  thermal: {
    key: 'thermal',
    name: 'Thermal',
    code: 'TIR',
    icon: 'temperature-high',
    color: '#ef4444',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500',
    badgeClass: 'badge-error'
  },
  lidar: {
    key: 'lidar',
    name: 'LiDAR',
    code: 'LID',
    icon: 'wave-square',
    color: '#14b8a6',
    bgClass: 'bg-teal-500/10',
    textClass: 'text-teal-500',
    badgeClass: 'badge-accent badge-outline'
  },
  radar: {
    key: 'radar',
    name: 'Radar (SAR)',
    code: 'SAR',
    icon: 'satellite-dish',
    color: '#6366f1',
    bgClass: 'bg-indigo-500/10',
    textClass: 'text-indigo-500',
    badgeClass: 'badge-primary'
  }
};

/**
 * Status configurations with styling
 */
export const STATUS_TYPES = {
  Active: {
    name: 'Active',
    badgeClass: 'badge-success',
    textClass: 'text-success',
    dotClass: 'bg-success'
  },
  Inactive: {
    name: 'Inactive',
    badgeClass: 'badge-warning',
    textClass: 'text-warning',
    dotClass: 'bg-warning'
  },
  Maintenance: {
    name: 'Maintenance',
    badgeClass: 'badge-info',
    textClass: 'text-info',
    dotClass: 'bg-info'
  },
  Removed: {
    name: 'Removed',
    badgeClass: 'badge-error',
    textClass: 'text-error',
    dotClass: 'bg-error'
  },
  Decommissioned: {
    name: 'Decommissioned',
    badgeClass: 'badge-neutral',
    textClass: 'text-neutral',
    dotClass: 'bg-neutral'
  },
  Pending: {
    name: 'Pending',
    badgeClass: 'badge-ghost',
    textClass: 'text-base-content/60',
    dotClass: 'bg-base-content/50'
  }
};

/**
 * Measurement status configurations
 */
export const MEASUREMENT_STATUS = {
  Operational: {
    name: 'Operational',
    textClass: 'text-success',
    dotClass: 'bg-success'
  },
  Degraded: {
    name: 'Degraded',
    textClass: 'text-warning',
    dotClass: 'bg-warning'
  },
  Failed: {
    name: 'Failed',
    textClass: 'text-error',
    dotClass: 'bg-error'
  },
  Unknown: {
    name: 'Unknown',
    textClass: 'text-base-content/50',
    dotClass: 'bg-base-content/50'
  }
};

/**
 * Get mount type info from mount_type_code (e.g., 'PL01' -> PL info)
 * @param {string} mountTypeCode - Full mount type code
 * @returns {Object} Mount type configuration
 */
export function getMountType(mountTypeCode) {
  if (!mountTypeCode) return null;
  const prefix = mountTypeCode.match(/^([A-Z]+)/)?.[1];
  return prefix ? MOUNT_TYPES[prefix] : null;
}

/**
 * Get platform type info
 * @param {string} platformType - Platform type key
 * @returns {Object} Platform type configuration
 */
export function getPlatformType(platformType) {
  return PLATFORM_TYPES[platformType] || PLATFORM_TYPES.fixed;
}

/**
 * Get instrument type info from type name
 * @param {string} instrumentType - Instrument type name or key
 * @returns {Object} Instrument type configuration
 */
export function getInstrumentType(instrumentType) {
  if (!instrumentType) return null;

  const type = instrumentType.toLowerCase();

  // Direct key match
  if (INSTRUMENT_TYPES[type]) {
    return INSTRUMENT_TYPES[type];
  }

  // Name-based matching
  if (type.includes('phenocam') || type.includes('camera')) {
    return INSTRUMENT_TYPES.phenocam;
  }
  if (type.includes('multispectral')) {
    return INSTRUMENT_TYPES.multispectral;
  }
  if (type.includes('par')) {
    return INSTRUMENT_TYPES.par_sensor;
  }
  if (type.includes('ndvi')) {
    return INSTRUMENT_TYPES.ndvi_sensor;
  }
  if (type.includes('pri')) {
    return INSTRUMENT_TYPES.pri_sensor;
  }
  if (type.includes('hyperspectral')) {
    return INSTRUMENT_TYPES.hyperspectral;
  }
  if (type.includes('thermal')) {
    return INSTRUMENT_TYPES.thermal;
  }
  if (type.includes('lidar')) {
    return INSTRUMENT_TYPES.lidar;
  }
  if (type.includes('radar') || type.includes('sar')) {
    return INSTRUMENT_TYPES.radar;
  }

  // Default
  return {
    key: 'unknown',
    name: instrumentType,
    code: '???',
    icon: 'cube',
    color: '#6b7280',
    bgClass: 'bg-gray-500/10',
    textClass: 'text-gray-500',
    badgeClass: 'badge-ghost'
  };
}

/**
 * Get status info
 * @param {string} status - Status value
 * @returns {Object} Status configuration
 */
export function getStatus(status) {
  return STATUS_TYPES[status] || STATUS_TYPES.Active;
}

/**
 * Get measurement status info
 * @param {string} status - Measurement status value
 * @returns {Object} Measurement status configuration
 */
export function getMeasurementStatus(status) {
  return MEASUREMENT_STATUS[status] || MEASUREMENT_STATUS.Unknown;
}

/**
 * Composable for type-related utilities
 * @returns {Object} Type utilities
 */
export function useTypes() {
  return {
    // Constants
    MOUNT_TYPES,
    PLATFORM_TYPES,
    INSTRUMENT_TYPES,
    STATUS_TYPES,
    MEASUREMENT_STATUS,

    // Functions
    getMountType,
    getPlatformType,
    getInstrumentType,
    getStatus,
    getMeasurementStatus
  };
}
