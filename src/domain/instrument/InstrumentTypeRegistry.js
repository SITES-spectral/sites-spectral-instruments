/**
 * Instrument Type Registry
 *
 * Configuration-driven registry for instrument types.
 * Loads type definitions from YAML configuration files.
 *
 * Unlike platform types (Strategy pattern with code-based behavior),
 * instrument types use a Registry pattern because they only differ
 * in data schema, not behavior.
 *
 * @module domain/instrument/InstrumentTypeRegistry
 */

/**
 * @typedef {Object} InstrumentTypeConfig
 * @property {string} name - Display name
 * @property {string} description - Type description
 * @property {string} icon - FontAwesome icon name
 * @property {string} color - Hex color code
 * @property {string} code - Short code (PHE, MS, PAR, etc.)
 * @property {string} category - Category (imaging, spectral, radiation, etc.)
 * @property {string[]} platforms - Compatible platform types
 * @property {string} [helpText] - Help text for UI
 * @property {Object} [fieldSchema] - Type-specific field definitions
 */

/**
 * Default instrument type configurations
 * These are used if YAML config is not available
 */
const DEFAULT_INSTRUMENT_TYPES = {
  phenocam: {
    name: 'Phenocam',
    description: 'Digital camera for repeat photography and phenology monitoring',
    icon: 'camera',
    color: '#3b82f6',
    code: 'PHE',
    category: 'imaging',
    platforms: ['fixed', 'uav'],
    fieldSchema: {
      camera_brand: { type: 'string', required: false },
      camera_model: { type: 'string', required: false },
      resolution: { type: 'string', required: false },
      interval_minutes: { type: 'number', required: false, min: 1, max: 1440 }
    }
  },
  multispectral: {
    name: 'Multispectral Sensor',
    description: 'Sensor capturing discrete spectral bands',
    icon: 'layer-group',
    color: '#8b5cf6',
    code: 'MS',
    category: 'spectral',
    platforms: ['fixed', 'uav', 'satellite'],
    fieldSchema: {
      number_of_channels: { type: 'number', required: false, min: 2, max: 50 },
      spectral_range: { type: 'string', required: false },
      orientation: { type: 'string', required: false }
    }
  },
  par_sensor: {
    name: 'PAR Sensor',
    description: 'Photosynthetically Active Radiation sensor (400-700 nm)',
    icon: 'sun',
    color: '#f59e0b',
    code: 'PAR',
    category: 'radiation',
    platforms: ['fixed'],
    fieldSchema: {
      spectral_range: { type: 'string', required: false, default: '400-700 nm' },
      calibration_coefficient: { type: 'number', required: false }
    }
  },
  ndvi_sensor: {
    name: 'NDVI Sensor',
    description: 'Dedicated sensor for NDVI measurements',
    icon: 'leaf',
    color: '#22c55e',
    code: 'NDVI',
    category: 'spectral',
    platforms: ['fixed'],
    fieldSchema: {
      red_wavelength_nm: { type: 'number', required: false, default: 650 },
      nir_wavelength_nm: { type: 'number', required: false, default: 850 }
    }
  },
  pri_sensor: {
    name: 'PRI Sensor',
    description: 'Photochemical Reflectance Index sensor',
    icon: 'microscope',
    color: '#06b6d4',
    code: 'PRI',
    category: 'spectral',
    platforms: ['fixed'],
    fieldSchema: {
      band1_wavelength_nm: { type: 'number', required: false, default: 531 },
      band2_wavelength_nm: { type: 'number', required: false, default: 570 }
    }
  },
  hyperspectral: {
    name: 'Hyperspectral Sensor',
    description: 'Imaging spectrometer with continuous spectral bands',
    icon: 'rainbow',
    color: '#ec4899',
    code: 'HYP',
    category: 'spectral',
    platforms: ['fixed', 'uav', 'satellite'],
    fieldSchema: {
      spectral_range_start_nm: { type: 'number', required: false },
      spectral_range_end_nm: { type: 'number', required: false },
      spectral_resolution_nm: { type: 'number', required: false },
      number_of_bands: { type: 'number', required: false }
    }
  },
  thermal: {
    name: 'Thermal Camera',
    description: 'Infrared camera for surface temperature measurement',
    icon: 'temperature-high',
    color: '#ef4444',
    code: 'TIR',
    category: 'thermal',
    platforms: ['fixed', 'uav', 'satellite'],
    fieldSchema: {
      temperature_range_min: { type: 'number', required: false },
      temperature_range_max: { type: 'number', required: false },
      resolution: { type: 'string', required: false }
    }
  },
  lidar: {
    name: 'LiDAR',
    description: 'Light Detection and Ranging for 3D structure',
    icon: 'wave-square',
    color: '#14b8a6',
    code: 'LID',
    category: 'structural',
    platforms: ['uav', 'satellite'],
    fieldSchema: {
      wavelength_nm: { type: 'number', required: false },
      pulse_rate: { type: 'string', required: false },
      range_m: { type: 'number', required: false }
    }
  },
  radar: {
    name: 'Radar (SAR)',
    description: 'Synthetic Aperture Radar for all-weather observation',
    icon: 'satellite-dish',
    color: '#6366f1',
    code: 'SAR',
    category: 'microwave',
    platforms: ['satellite'],
    fieldSchema: {
      band: { type: 'string', required: false, enum: ['X', 'C', 'S', 'L', 'P'] },
      polarization: { type: 'string', required: false },
      resolution_m: { type: 'number', required: false }
    }
  }
};

/**
 * Category definitions
 */
const CATEGORIES = {
  imaging: { name: 'Imaging', icon: 'image', color: '#3b82f6' },
  spectral: { name: 'Spectral', icon: 'rainbow', color: '#8b5cf6' },
  radiation: { name: 'Radiation', icon: 'sun', color: '#f59e0b' },
  thermal: { name: 'Thermal', icon: 'fire', color: '#ef4444' },
  structural: { name: 'Structural', icon: 'cubes', color: '#14b8a6' },
  microwave: { name: 'Microwave', icon: 'broadcast-tower', color: '#6366f1' }
};

/**
 * Instrument Type Registry
 *
 * Singleton registry that loads instrument type configurations
 * and provides lookup and validation methods.
 */
export class InstrumentTypeRegistry {
  /**
   * Create registry with optional custom configuration
   * @param {Object} [config] - Custom type configurations
   */
  constructor(config = null) {
    this._types = new Map();
    this._categories = new Map();
    this._codeToKey = new Map();

    // Load default types
    this._loadTypes(config || DEFAULT_INSTRUMENT_TYPES);

    // Load categories
    Object.entries(CATEGORIES).forEach(([key, cat]) => {
      this._categories.set(key, cat);
    });
  }

  /**
   * Load type configurations
   * @private
   * @param {Object} typesConfig - Type configurations object
   */
  _loadTypes(typesConfig) {
    Object.entries(typesConfig).forEach(([key, config]) => {
      this._types.set(key, { ...config, key });
      this._codeToKey.set(config.code, key);
    });
  }

  /**
   * Load types from YAML configuration
   * @param {Object} yamlConfig - Parsed YAML configuration
   */
  loadFromYAML(yamlConfig) {
    if (yamlConfig.instrument_types) {
      this._types.clear();
      this._codeToKey.clear();
      this._loadTypes(yamlConfig.instrument_types);
    }

    if (yamlConfig.categories) {
      this._categories.clear();
      Object.entries(yamlConfig.categories).forEach(([key, cat]) => {
        this._categories.set(key, cat);
      });
    }
  }

  /**
   * Get type configuration by key
   * @param {string} typeKey - Type key (e.g., 'phenocam', 'multispectral')
   * @returns {InstrumentTypeConfig|null}
   */
  getType(typeKey) {
    if (!typeKey || typeof typeKey !== 'string') return null;
    return this._types.get(typeKey.toLowerCase()) || null;
  }

  /**
   * Get type configuration by code
   * @param {string} code - Type code (e.g., 'PHE', 'MS')
   * @returns {InstrumentTypeConfig|null}
   */
  getTypeByCode(code) {
    if (!code || typeof code !== 'string') return null;
    const key = this._codeToKey.get(code.toUpperCase());
    return key ? this._types.get(key) : null;
  }

  /**
   * Get type configuration by display name
   * @param {string} displayName - Display name (e.g., 'Phenocam', 'Multispectral Sensor')
   * @returns {InstrumentTypeConfig|null}
   */
  getTypeByName(displayName) {
    if (!displayName || typeof displayName !== 'string') return null;
    for (const config of this._types.values()) {
      if (config.name.toLowerCase() === displayName.toLowerCase()) {
        return config;
      }
    }
    return null;
  }

  /**
   * Get all type configurations
   * @returns {InstrumentTypeConfig[]}
   */
  getAllTypes() {
    return Array.from(this._types.values());
  }

  /**
   * Get types compatible with a platform type
   * @param {string} platformType - Platform type ('fixed', 'uav', 'satellite')
   * @returns {InstrumentTypeConfig[]}
   */
  getTypesForPlatform(platformType) {
    return this.getAllTypes().filter(type =>
      type.platforms.includes(platformType)
    );
  }

  /**
   * Get types by category
   * @param {string} category - Category key
   * @returns {InstrumentTypeConfig[]}
   */
  getTypesByCategory(category) {
    return this.getAllTypes().filter(type =>
      type.category === category
    );
  }

  /**
   * Get type code from display name
   * @param {string} displayName - Display name
   * @returns {string|null}
   */
  getCode(displayName) {
    const type = this.getTypeByName(displayName);
    return type ? type.code : null;
  }

  /**
   * Check if a type is valid
   * @param {string} typeKeyOrName - Type key or display name
   * @returns {boolean}
   */
  isValidType(typeKeyOrName) {
    return this.getType(typeKeyOrName) !== null ||
           this.getTypeByName(typeKeyOrName) !== null;
  }

  /**
   * Check if type is compatible with platform
   * @param {string} typeKeyOrName - Type key or display name
   * @param {string} platformType - Platform type
   * @returns {boolean}
   */
  isCompatibleWithPlatform(typeKeyOrName, platformType) {
    const type = this.getType(typeKeyOrName) || this.getTypeByName(typeKeyOrName);
    if (!type) return false;
    return type.platforms.includes(platformType);
  }

  /**
   * Get field schema for a type
   * @param {string} typeKeyOrName - Type key or display name
   * @returns {Object|null}
   */
  getFieldSchema(typeKeyOrName) {
    const type = this.getType(typeKeyOrName) || this.getTypeByName(typeKeyOrName);
    return type ? type.fieldSchema || {} : null;
  }

  /**
   * Validate specifications against type schema
   * @param {string} typeKeyOrName - Type key or display name
   * @param {Object} specifications - Specifications to validate
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateSpecifications(typeKeyOrName, specifications) {
    const errors = [];
    const schema = this.getFieldSchema(typeKeyOrName);

    if (!schema) {
      return { valid: true, errors: [] }; // No schema = no validation
    }

    Object.entries(schema).forEach(([field, rules]) => {
      const value = specifications[field];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        return;
      }

      // Skip validation if value not provided and not required
      if (value === undefined || value === null) return;

      // Type validation
      if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${field} must be a number`);
      }
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
      }

      // Range validation
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get all categories
   * @returns {Object[]}
   */
  getAllCategories() {
    return Array.from(this._categories.entries()).map(([key, cat]) => ({
      key,
      ...cat
    }));
  }

  /**
   * Get category by key
   * @param {string} key - Category key
   * @returns {Object|null}
   */
  getCategory(key) {
    return this._categories.get(key) || null;
  }
}

// Export singleton instance
export const instrumentTypeRegistry = new InstrumentTypeRegistry();

// Default export
export default instrumentTypeRegistry;
