/**
 * Type Registry Composable
 *
 * Frontend mirror of domain layer type definitions.
 * Provides field schemas for type-aware rendering of cards, forms, and modals.
 *
 * Architecture:
 * - Platform types use Strategy pattern (different behavior per type)
 * - Instrument types use Registry pattern (different data schema per type)
 *
 * @module composables/useTypeRegistry
 */

/**
 * Platform Type Strategies
 *
 * Each platform type has:
 * - Specific naming convention
 * - Required/optional fields
 * - Display configuration
 */
export const PLATFORM_TYPE_STRATEGIES = {
  fixed: {
    key: 'fixed',
    name: 'Fixed Platform',
    description: 'Permanent installations on towers, buildings, or ground level',
    icon: 'tower-observation',
    color: 'info',
    namingPattern: '{STATION}_{ECOSYSTEM}_{MOUNT_TYPE}',
    namingExample: 'SVB_FOR_PL01',

    // Fields specific to fixed platforms
    fields: {
      ecosystem_code: {
        label: 'Ecosystem',
        type: 'select',
        required: true,
        options: ['FOR', 'AGR', 'GRA', 'HEA', 'MIR', 'ALP', 'LAK', 'CON', 'WET', 'DEC', 'MAR', 'PEA', 'GEN'],
        helpText: 'Ecosystem type being monitored'
      },
      mount_type_code: {
        label: 'Mount Type',
        type: 'select',
        required: true,
        options: ['PL', 'BL', 'GL'],
        optionLabels: {
          PL: 'Pole/Tower/Mast (>1.5m)',
          BL: 'Building (rooftop/facade)',
          GL: 'Ground Level (<1.5m)'
        },
        helpText: 'Physical mounting structure type'
      },
      platform_height_m: {
        label: 'Platform Height (m)',
        type: 'number',
        required: false,
        min: 0,
        max: 500,
        helpText: 'Height above ground in meters'
      },
      mounting_structure: {
        label: 'Mounting Structure',
        type: 'text',
        required: false,
        helpText: 'Description of mounting structure'
      }
    },

    // Fields NOT shown for this type
    excludeFields: ['vendor', 'model', 'agency', 'satellite', 'sensor']
  },

  uav: {
    key: 'uav',
    name: 'UAV Platform',
    description: 'Drone-based platforms with auto-instrument creation',
    icon: 'drone',
    color: 'warning',
    namingPattern: '{STATION}_{VENDOR}_{MODEL}_{MOUNT_TYPE}',
    namingExample: 'SVB_DJI_M3M_UAV01',

    // Fields specific to UAV platforms
    fields: {
      vendor: {
        label: 'Vendor',
        type: 'select',
        required: true,
        options: ['DJI', 'MicaSense', 'Parrot', 'Headwall', 'senseFly', 'Other'],
        helpText: 'UAV/sensor manufacturer'
      },
      model: {
        label: 'Model',
        type: 'select',
        required: true,
        dependsOn: 'vendor',
        optionsByParent: {
          DJI: ['M3M', 'P4M', 'M30T', 'M300', 'M350'],
          MicaSense: ['RedEdge-MX', 'Altum-PT'],
          Parrot: ['Sequoia+', 'Anafi'],
          Headwall: ['Nano-Hyperspec'],
          senseFly: ['eBee X'],
          Other: []
        },
        helpText: 'UAV or sensor model'
      },
      mount_type_code: {
        label: 'Position ID',
        type: 'text',
        required: true,
        pattern: '^UAV\\d{2}$',
        placeholder: 'UAV01',
        helpText: 'UAV position identifier (e.g., UAV01)'
      }
    },

    // Fields NOT shown for this type
    excludeFields: ['ecosystem_code', 'platform_height_m', 'mounting_structure', 'agency', 'satellite', 'sensor'],

    // Auto-creates instruments based on vendor/model
    autoInstruments: true
  },

  satellite: {
    key: 'satellite',
    name: 'Satellite Platform',
    description: 'Virtual platforms for satellite sensor data',
    icon: 'satellite',
    color: 'accent',
    namingPattern: '{STATION}_{AGENCY}_{SATELLITE}_{SENSOR}',
    namingExample: 'SVB_ESA_S2A_MSI',

    // Fields specific to satellite platforms
    fields: {
      agency: {
        label: 'Space Agency',
        type: 'select',
        required: true,
        options: ['ESA', 'NASA', 'JAXA', 'ISRO', 'CSA', 'Other'],
        helpText: 'Operating space agency'
      },
      satellite: {
        label: 'Satellite',
        type: 'select',
        required: true,
        dependsOn: 'agency',
        optionsByParent: {
          ESA: ['S2A', 'S2B', 'S3A', 'S3B', 'S1A', 'S1B'],
          NASA: ['L8', 'L9', 'MODIS-Terra', 'MODIS-Aqua'],
          JAXA: ['ALOS-2'],
          ISRO: ['RS2'],
          CSA: ['RCM'],
          Other: []
        },
        helpText: 'Satellite identifier'
      },
      sensor: {
        label: 'Sensor',
        type: 'select',
        required: true,
        dependsOn: 'satellite',
        optionsByParent: {
          S2A: ['MSI'],
          S2B: ['MSI'],
          S3A: ['OLCI', 'SLSTR'],
          S3B: ['OLCI', 'SLSTR'],
          S1A: ['SAR'],
          S1B: ['SAR'],
          L8: ['OLI', 'TIRS'],
          L9: ['OLI-2', 'TIRS-2'],
          'MODIS-Terra': ['MODIS'],
          'MODIS-Aqua': ['MODIS']
        },
        helpText: 'Sensor instrument'
      },
      mount_type_code: {
        label: 'Virtual Position',
        type: 'hidden',
        required: true,
        defaultValue: 'SAT',
        helpText: 'Automatically set to SAT'
      }
    },

    // Fields NOT shown for this type
    excludeFields: ['ecosystem_code', 'platform_height_m', 'mounting_structure', 'vendor', 'model', 'latitude', 'longitude']
  }
};

/**
 * Instrument Type Registry
 *
 * Each instrument type has:
 * - Field schema defining what data to collect
 * - Display configuration
 * - Platform compatibility
 */
export const INSTRUMENT_TYPE_REGISTRY = {
  phenocam: {
    key: 'phenocam',
    name: 'Phenocam',
    code: 'PHE',
    description: 'Digital camera for repeat photography and phenology monitoring',
    icon: 'camera',
    color: '#3b82f6',
    category: 'imaging',
    platforms: ['fixed', 'uav'],

    // Type-specific fields
    fields: {
      camera_brand: {
        label: 'Camera Brand',
        type: 'text',
        required: false,
        helpText: 'Manufacturer (e.g., StarDot, Axis)'
      },
      camera_model: {
        label: 'Camera Model',
        type: 'text',
        required: false,
        helpText: 'Model number'
      },
      resolution: {
        label: 'Resolution',
        type: 'text',
        required: false,
        placeholder: '1920x1080',
        helpText: 'Image resolution in pixels'
      },
      interval_minutes: {
        label: 'Capture Interval (min)',
        type: 'number',
        required: false,
        min: 1,
        max: 1440,
        defaultValue: 30,
        helpText: 'Time between captures'
      },
      lens_focal_length_mm: {
        label: 'Focal Length (mm)',
        type: 'number',
        required: false,
        helpText: 'Lens focal length'
      },
      field_of_view_degrees: {
        label: 'Field of View (°)',
        type: 'number',
        required: false,
        min: 1,
        max: 360,
        helpText: 'Horizontal field of view'
      }
    },

    // Fields to display in card summary
    summaryFields: ['camera_brand', 'camera_model', 'resolution', 'interval_minutes']
  },

  multispectral: {
    key: 'multispectral',
    name: 'Multispectral Sensor',
    code: 'MS',
    description: 'Sensor capturing discrete spectral bands',
    icon: 'layer-group',
    color: '#8b5cf6',
    category: 'spectral',
    platforms: ['fixed', 'uav', 'satellite'],

    fields: {
      number_of_channels: {
        label: 'Number of Channels',
        type: 'number',
        required: false,
        min: 2,
        max: 50,
        helpText: 'Number of spectral bands'
      },
      spectral_range: {
        label: 'Spectral Range',
        type: 'text',
        required: false,
        placeholder: '400-1000 nm',
        helpText: 'Wavelength range covered'
      },
      band_wavelengths: {
        label: 'Band Wavelengths (nm)',
        type: 'text',
        required: false,
        placeholder: '475, 560, 668, 717, 842',
        helpText: 'Center wavelengths of each band'
      },
      orientation: {
        label: 'Orientation',
        type: 'select',
        required: false,
        options: ['Nadir', 'Oblique', 'Hemispherical'],
        helpText: 'Sensor viewing direction'
      },
      datalogger: {
        label: 'Datalogger',
        type: 'text',
        required: false,
        helpText: 'Connected datalogger model'
      }
    },

    summaryFields: ['number_of_channels', 'spectral_range', 'orientation']
  },

  par_sensor: {
    key: 'par_sensor',
    name: 'PAR Sensor',
    code: 'PAR',
    description: 'Photosynthetically Active Radiation sensor (400-700 nm)',
    icon: 'sun',
    color: '#f59e0b',
    category: 'radiation',
    platforms: ['fixed'],

    fields: {
      spectral_range: {
        label: 'Spectral Range',
        type: 'text',
        required: false,
        defaultValue: '400-700 nm',
        helpText: 'PAR wavelength range'
      },
      calibration_coefficient: {
        label: 'Calibration Coefficient',
        type: 'number',
        required: false,
        helpText: 'Sensor calibration factor'
      },
      calibration_date: {
        label: 'Calibration Date',
        type: 'date',
        required: false,
        helpText: 'Last calibration date'
      },
      sensor_brand: {
        label: 'Sensor Brand',
        type: 'text',
        required: false,
        helpText: 'Manufacturer (e.g., LI-COR, Apogee)'
      },
      sensor_model: {
        label: 'Sensor Model',
        type: 'text',
        required: false,
        helpText: 'Model number'
      }
    },

    summaryFields: ['spectral_range', 'sensor_brand', 'sensor_model']
  },

  ndvi_sensor: {
    key: 'ndvi_sensor',
    name: 'NDVI Sensor',
    code: 'NDVI',
    description: 'Dedicated sensor for NDVI measurements',
    icon: 'leaf',
    color: '#22c55e',
    category: 'spectral',
    platforms: ['fixed'],

    fields: {
      red_wavelength_nm: {
        label: 'Red Band (nm)',
        type: 'number',
        required: false,
        defaultValue: 650,
        helpText: 'Red band center wavelength'
      },
      nir_wavelength_nm: {
        label: 'NIR Band (nm)',
        type: 'number',
        required: false,
        defaultValue: 850,
        helpText: 'NIR band center wavelength'
      },
      sensor_brand: {
        label: 'Sensor Brand',
        type: 'text',
        required: false,
        helpText: 'Manufacturer'
      },
      sensor_model: {
        label: 'Sensor Model',
        type: 'text',
        required: false,
        helpText: 'Model number'
      }
    },

    summaryFields: ['red_wavelength_nm', 'nir_wavelength_nm', 'sensor_brand']
  },

  pri_sensor: {
    key: 'pri_sensor',
    name: 'PRI Sensor',
    code: 'PRI',
    description: 'Photochemical Reflectance Index sensor',
    icon: 'microscope',
    color: '#06b6d4',
    category: 'spectral',
    platforms: ['fixed'],

    fields: {
      band1_wavelength_nm: {
        label: 'Band 1 (nm)',
        type: 'number',
        required: false,
        defaultValue: 531,
        helpText: 'Reference band wavelength'
      },
      band2_wavelength_nm: {
        label: 'Band 2 (nm)',
        type: 'number',
        required: false,
        defaultValue: 570,
        helpText: 'Stress-sensitive band wavelength'
      },
      sensor_brand: {
        label: 'Sensor Brand',
        type: 'text',
        required: false,
        helpText: 'Manufacturer'
      },
      sensor_model: {
        label: 'Sensor Model',
        type: 'text',
        required: false,
        helpText: 'Model number'
      }
    },

    summaryFields: ['band1_wavelength_nm', 'band2_wavelength_nm', 'sensor_brand']
  },

  hyperspectral: {
    key: 'hyperspectral',
    name: 'Hyperspectral Sensor',
    code: 'HYP',
    description: 'Imaging spectrometer with continuous spectral bands',
    icon: 'rainbow',
    color: '#ec4899',
    category: 'spectral',
    platforms: ['fixed', 'uav', 'satellite'],

    fields: {
      spectral_range_start_nm: {
        label: 'Range Start (nm)',
        type: 'number',
        required: false,
        helpText: 'Starting wavelength'
      },
      spectral_range_end_nm: {
        label: 'Range End (nm)',
        type: 'number',
        required: false,
        helpText: 'Ending wavelength'
      },
      spectral_resolution_nm: {
        label: 'Spectral Resolution (nm)',
        type: 'number',
        required: false,
        helpText: 'Bandwidth per channel'
      },
      number_of_bands: {
        label: 'Number of Bands',
        type: 'number',
        required: false,
        helpText: 'Total spectral bands'
      },
      spatial_resolution: {
        label: 'Spatial Resolution',
        type: 'text',
        required: false,
        helpText: 'Ground sample distance'
      }
    },

    summaryFields: ['spectral_range_start_nm', 'spectral_range_end_nm', 'number_of_bands']
  },

  thermal: {
    key: 'thermal',
    name: 'Thermal Camera',
    code: 'TIR',
    description: 'Infrared camera for surface temperature measurement',
    icon: 'temperature-high',
    color: '#ef4444',
    category: 'thermal',
    platforms: ['fixed', 'uav', 'satellite'],

    fields: {
      temperature_range_min: {
        label: 'Min Temperature (°C)',
        type: 'number',
        required: false,
        helpText: 'Minimum measurable temperature'
      },
      temperature_range_max: {
        label: 'Max Temperature (°C)',
        type: 'number',
        required: false,
        helpText: 'Maximum measurable temperature'
      },
      thermal_sensitivity: {
        label: 'Thermal Sensitivity (mK)',
        type: 'number',
        required: false,
        helpText: 'NETD value'
      },
      resolution: {
        label: 'Resolution',
        type: 'text',
        required: false,
        placeholder: '640x512',
        helpText: 'Sensor resolution'
      },
      spectral_range: {
        label: 'Spectral Range',
        type: 'text',
        required: false,
        placeholder: '7.5-13.5 μm',
        helpText: 'Thermal wavelength range'
      }
    },

    summaryFields: ['temperature_range_min', 'temperature_range_max', 'resolution']
  },

  lidar: {
    key: 'lidar',
    name: 'LiDAR',
    code: 'LID',
    description: 'Light Detection and Ranging for 3D structure',
    icon: 'wave-square',
    color: '#14b8a6',
    category: 'structural',
    platforms: ['uav', 'satellite'],

    fields: {
      wavelength_nm: {
        label: 'Wavelength (nm)',
        type: 'number',
        required: false,
        helpText: 'Laser wavelength'
      },
      pulse_rate: {
        label: 'Pulse Rate',
        type: 'text',
        required: false,
        placeholder: '100 kHz',
        helpText: 'Pulses per second'
      },
      range_m: {
        label: 'Range (m)',
        type: 'number',
        required: false,
        helpText: 'Maximum detection range'
      },
      accuracy_cm: {
        label: 'Accuracy (cm)',
        type: 'number',
        required: false,
        helpText: 'Vertical accuracy'
      },
      point_density: {
        label: 'Point Density',
        type: 'text',
        required: false,
        placeholder: '100 pts/m²',
        helpText: 'Points per square meter'
      }
    },

    summaryFields: ['wavelength_nm', 'pulse_rate', 'range_m']
  },

  radar: {
    key: 'radar',
    name: 'Radar (SAR)',
    code: 'SAR',
    description: 'Synthetic Aperture Radar for all-weather observation',
    icon: 'satellite-dish',
    color: '#6366f1',
    category: 'microwave',
    platforms: ['satellite'],

    fields: {
      band: {
        label: 'Band',
        type: 'select',
        required: false,
        options: ['X', 'C', 'S', 'L', 'P'],
        helpText: 'Radar frequency band'
      },
      polarization: {
        label: 'Polarization',
        type: 'select',
        required: false,
        options: ['VV', 'VH', 'HH', 'HV', 'Dual', 'Quad'],
        helpText: 'Polarization mode'
      },
      resolution_m: {
        label: 'Resolution (m)',
        type: 'number',
        required: false,
        helpText: 'Spatial resolution'
      },
      swath_width_km: {
        label: 'Swath Width (km)',
        type: 'number',
        required: false,
        helpText: 'Ground coverage width'
      }
    },

    summaryFields: ['band', 'polarization', 'resolution_m']
  }
};

/**
 * Mount Type Codes
 */
export const MOUNT_TYPE_CODES = {
  PL: {
    code: 'PL',
    name: 'Pole/Tower/Mast',
    description: 'Elevated structures (>1.5m height)',
    icon: 'tower-observation',
    platformTypes: ['fixed'],
    minHeight: 1.5
  },
  BL: {
    code: 'BL',
    name: 'Building',
    description: 'Rooftop or facade mounted',
    icon: 'building',
    platformTypes: ['fixed']
  },
  GL: {
    code: 'GL',
    name: 'Ground Level',
    description: 'Installations below 1.5m height',
    icon: 'down-long',
    platformTypes: ['fixed'],
    maxHeight: 1.5
  },
  UAV: {
    code: 'UAV',
    name: 'UAV Position',
    description: 'Drone flight position',
    icon: 'drone',
    platformTypes: ['uav']
  },
  SAT: {
    code: 'SAT',
    name: 'Satellite',
    description: 'Virtual satellite position',
    icon: 'satellite',
    platformTypes: ['satellite']
  },
  MOB: {
    code: 'MOB',
    name: 'Mobile',
    description: 'Portable platform',
    icon: 'truck',
    platformTypes: ['mobile']
  },
  USV: {
    code: 'USV',
    name: 'Surface Vehicle',
    description: 'Unmanned surface vehicle',
    icon: 'ship',
    platformTypes: ['usv']
  },
  UUV: {
    code: 'UUV',
    name: 'Underwater Vehicle',
    description: 'Unmanned underwater vehicle',
    icon: 'water',
    platformTypes: ['uuv']
  }
};

/**
 * Ecosystem Codes
 */
export const ECOSYSTEM_CODES = {
  FOR: { code: 'FOR', name: 'Forest', description: 'Mixed or unspecified forest' },
  AGR: { code: 'AGR', name: 'Arable Land', description: 'Agricultural cropland' },
  GRA: { code: 'GRA', name: 'Grassland', description: 'Natural grassland' },
  HEA: { code: 'HEA', name: 'Heathland', description: 'Heath and shrubland' },
  MIR: { code: 'MIR', name: 'Mires', description: 'Wetland mire ecosystems' },
  ALP: { code: 'ALP', name: 'Alpine', description: 'Alpine and subalpine zones' },
  LAK: { code: 'LAK', name: 'Lake', description: 'Freshwater lake ecosystems' },
  CON: { code: 'CON', name: 'Coniferous Forest', description: 'Evergreen conifer forest' },
  WET: { code: 'WET', name: 'Wetland', description: 'Wetland ecosystems' },
  DEC: { code: 'DEC', name: 'Deciduous Forest', description: 'Broadleaf deciduous forest' },
  MAR: { code: 'MAR', name: 'Marshland', description: 'Marsh ecosystems' },
  PEA: { code: 'PEA', name: 'Peatland', description: 'Peat-forming wetlands' },
  GEN: { code: 'GEN', name: 'General', description: 'General or multiple ecosystems' }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get platform type strategy
 * @param {string} platformType - Platform type key
 * @returns {Object|null}
 */
export function getPlatformTypeStrategy(platformType) {
  return PLATFORM_TYPE_STRATEGIES[platformType] || null;
}

/**
 * Get fields for a platform type
 * @param {string} platformType - Platform type key
 * @returns {Object}
 */
export function getPlatformFields(platformType) {
  const strategy = PLATFORM_TYPE_STRATEGIES[platformType];
  return strategy?.fields || {};
}

/**
 * Get excluded fields for a platform type
 * @param {string} platformType - Platform type key
 * @returns {string[]}
 */
export function getPlatformExcludedFields(platformType) {
  const strategy = PLATFORM_TYPE_STRATEGIES[platformType];
  return strategy?.excludeFields || [];
}

/**
 * Check if field is valid for platform type
 * @param {string} platformType - Platform type key
 * @param {string} fieldName - Field name to check
 * @returns {boolean}
 */
export function isFieldValidForPlatform(platformType, fieldName) {
  const excluded = getPlatformExcludedFields(platformType);
  return !excluded.includes(fieldName);
}

/**
 * Get instrument type config
 * @param {string} instrumentType - Instrument type key or display name
 * @returns {Object|null}
 */
export function getInstrumentTypeConfig(instrumentType) {
  if (!instrumentType) return null;

  const key = instrumentType.toLowerCase().replace(/[\s-]/g, '_');

  // Direct key match
  if (INSTRUMENT_TYPE_REGISTRY[key]) {
    return INSTRUMENT_TYPE_REGISTRY[key];
  }

  // Name-based matching
  for (const config of Object.values(INSTRUMENT_TYPE_REGISTRY)) {
    if (config.name.toLowerCase() === instrumentType.toLowerCase()) {
      return config;
    }
    if (instrumentType.toLowerCase().includes(config.key)) {
      return config;
    }
  }

  return null;
}

/**
 * Get fields for an instrument type
 * @param {string} instrumentType - Instrument type key or name
 * @returns {Object}
 */
export function getInstrumentFields(instrumentType) {
  const config = getInstrumentTypeConfig(instrumentType);
  return config?.fields || {};
}

/**
 * Get instrument type code
 * @param {string} instrumentType - Instrument type key or name
 * @returns {string|null}
 */
export function getInstrumentTypeCode(instrumentType) {
  const config = getInstrumentTypeConfig(instrumentType);
  return config?.code || null;
}

/**
 * Get summary fields for instrument type (for card display)
 * @param {string} instrumentType - Instrument type key or name
 * @returns {string[]}
 */
export function getInstrumentSummaryFields(instrumentType) {
  const config = getInstrumentTypeConfig(instrumentType);
  return config?.summaryFields || [];
}

/**
 * Check if instrument type is compatible with platform type
 * @param {string} instrumentType - Instrument type key
 * @param {string} platformType - Platform type key
 * @returns {boolean}
 */
export function isInstrumentCompatibleWithPlatform(instrumentType, platformType) {
  const config = getInstrumentTypeConfig(instrumentType);
  if (!config) return true; // Unknown types are allowed anywhere
  return config.platforms.includes(platformType);
}

/**
 * Get compatible instrument types for a platform
 * @param {string} platformType - Platform type key
 * @returns {Object[]}
 */
export function getCompatibleInstrumentTypes(platformType) {
  return Object.values(INSTRUMENT_TYPE_REGISTRY).filter(
    config => config.platforms.includes(platformType)
  );
}

/**
 * Get mount type info
 * @param {string} mountTypeCode - Full code (e.g., 'PL01') or prefix (e.g., 'PL')
 * @returns {Object|null}
 */
export function getMountTypeInfo(mountTypeCode) {
  if (!mountTypeCode) return null;
  const prefix = mountTypeCode.match(/^([A-Z]+)/)?.[1];
  return prefix ? MOUNT_TYPE_CODES[prefix] : null;
}

/**
 * Get ecosystem info
 * @param {string} ecosystemCode - Ecosystem code
 * @returns {Object|null}
 */
export function getEcosystemInfo(ecosystemCode) {
  return ECOSYSTEM_CODES[ecosystemCode] || null;
}

/**
 * Format field value for display
 * @param {*} value - Field value
 * @param {Object} fieldConfig - Field configuration
 * @returns {string}
 */
export function formatFieldValue(value, fieldConfig) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (fieldConfig?.type === 'date') {
    return new Date(value).toLocaleDateString();
  }

  if (fieldConfig?.type === 'number' && fieldConfig?.unit) {
    return `${value} ${fieldConfig.unit}`;
  }

  return String(value);
}

// ============================================================================
// Composable Export
// ============================================================================

/**
 * Type Registry composable
 * @returns {Object} Registry functions and constants
 */
export function useTypeRegistry() {
  return {
    // Constants
    PLATFORM_TYPE_STRATEGIES,
    INSTRUMENT_TYPE_REGISTRY,
    MOUNT_TYPE_CODES,
    ECOSYSTEM_CODES,

    // Platform functions
    getPlatformTypeStrategy,
    getPlatformFields,
    getPlatformExcludedFields,
    isFieldValidForPlatform,

    // Instrument functions
    getInstrumentTypeConfig,
    getInstrumentFields,
    getInstrumentTypeCode,
    getInstrumentSummaryFields,
    isInstrumentCompatibleWithPlatform,
    getCompatibleInstrumentTypes,

    // Utility functions
    getMountTypeInfo,
    getEcosystemInfo,
    formatFieldValue
  };
}
