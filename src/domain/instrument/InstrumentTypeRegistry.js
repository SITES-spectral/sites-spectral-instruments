/**
 * Instrument Type Registry
 *
 * Configuration-driven registry for instrument types.
 * Loads type definitions from YAML configuration (via build-time generation).
 *
 * Unlike platform types (Strategy pattern with code-based behavior),
 * instrument types use a Registry pattern because they only differ
 * in data schema, not behavior.
 *
 * @module domain/instrument/InstrumentTypeRegistry
 * @see yamls/instruments/instrument-types.yaml - Source of truth
 * @see scripts/build.js - Generates instrument-types.generated.js
 */

import {
  INSTRUMENT_TYPES,
  CATEGORIES
} from './instrument-types.generated.js';

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

    // Load types from generated module (YAML source of truth)
    this._loadTypes(config || INSTRUMENT_TYPES);

    // Load categories from generated module
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
