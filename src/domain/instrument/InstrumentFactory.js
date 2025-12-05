/**
 * Instrument Factory
 *
 * Factory for creating Instrument entities with proper validation
 * and type-specific configuration.
 *
 * Uses InstrumentTypeRegistry for type validation and field schemas.
 *
 * @module domain/instrument/InstrumentFactory
 */

import { Instrument } from './Instrument.js';
import { instrumentTypeRegistry } from './InstrumentTypeRegistry.js';

/**
 * Instrument Factory
 *
 * Creates properly validated Instrument entities.
 */
export class InstrumentFactory {
  /**
   * Create factory with optional custom registry
   * @param {InstrumentTypeRegistry} [registry] - Custom registry instance
   */
  constructor(registry = null) {
    this._registry = registry || instrumentTypeRegistry;
  }

  /**
   * Create a new Instrument entity
   * @param {Object} props - Instrument properties
   * @returns {Instrument}
   * @throws {Error} If validation fails
   */
  create(props) {
    // Validate instrument type
    if (!this._registry.isValidType(props.instrumentType)) {
      throw new Error(`Invalid instrument type: ${props.instrumentType}`);
    }

    // Validate specifications if provided
    if (props.specifications) {
      const validation = this._registry.validateSpecifications(
        props.instrumentType,
        props.specifications
      );
      if (!validation.valid) {
        throw new Error(`Specification validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Create instrument
    const instrument = new Instrument(props);

    // Run entity validation
    instrument.validate();

    return instrument;
  }

  /**
   * Create instrument from platform auto-creation data
   * @param {Object} autoData - Auto-creation data from platform type
   * @param {number} platformId - Platform ID
   * @returns {Instrument}
   */
  createFromAutoData(autoData, platformId) {
    return this.create({
      normalizedName: autoData.normalizedName,
      displayName: autoData.displayName,
      platformId: platformId,
      instrumentType: autoData.instrumentType,
      specifications: autoData.specifications || {},
      status: 'Active',
      measurementStatus: 'Operational'
    });
  }

  /**
   * Generate normalized name for an instrument
   * @param {string} platformNormalizedName - Platform normalized name
   * @param {string} instrumentType - Instrument type
   * @param {number} number - Instrument number (1, 2, 3...)
   * @returns {string}
   */
  generateNormalizedName(platformNormalizedName, instrumentType, number) {
    const typeCode = this._registry.getCode(instrumentType) ||
                     this._getTypeCodeFallback(instrumentType);
    const paddedNumber = String(number).padStart(2, '0');
    return `${platformNormalizedName}_${typeCode}${paddedNumber}`;
  }

  /**
   * Get type code fallback for unknown types
   * @private
   * @param {string} instrumentType - Instrument type
   * @returns {string}
   */
  _getTypeCodeFallback(instrumentType) {
    // Try to extract code from type name
    const words = instrumentType.toUpperCase().split(/\s+/);
    if (words.length >= 2) {
      return words.map(w => w[0]).join('').substring(0, 3);
    }
    return words[0].substring(0, 3);
  }

  /**
   * Get default specifications for an instrument type
   * @param {string} instrumentType - Instrument type
   * @returns {Object}
   */
  getDefaultSpecifications(instrumentType) {
    const schema = this._registry.getFieldSchema(instrumentType);
    if (!schema) return {};

    const defaults = {};
    Object.entries(schema).forEach(([field, rules]) => {
      if (rules.default !== undefined) {
        defaults[field] = rules.default;
      }
    });
    return defaults;
  }

  /**
   * Get compatible instrument types for a platform type
   * @param {string} platformType - Platform type
   * @returns {Object[]}
   */
  getTypesForPlatform(platformType) {
    return this._registry.getTypesForPlatform(platformType);
  }

  /**
   * Validate if instrument type is compatible with platform
   * @param {string} instrumentType - Instrument type
   * @param {string} platformType - Platform type
   * @returns {boolean}
   */
  isTypeCompatible(instrumentType, platformType) {
    return this._registry.isCompatibleWithPlatform(instrumentType, platformType);
  }
}

// Export singleton instance
export const instrumentFactory = new InstrumentFactory();

// Default export
export default instrumentFactory;
