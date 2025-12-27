/**
 * Platform Types Module
 *
 * Exports all platform type strategies and provides a factory
 * for getting the appropriate strategy based on type code.
 *
 * @module domain/platform/types
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';
import { FixedPlatformType } from './FixedPlatformType.js';
import { UAVPlatformType } from './UAVPlatformType.js';
import { SatellitePlatformType } from './SatellitePlatformType.js';
import { MobilePlatformType } from './MobilePlatformType.js';
import { USVPlatformType } from './USVPlatformType.js';
import { UUVPlatformType } from './UUVPlatformType.js';

// Export individual strategies
export { PlatformTypeStrategy } from './PlatformTypeStrategy.js';
export { FixedPlatformType } from './FixedPlatformType.js';
export { UAVPlatformType, UAV_SPECIFICATIONS } from './UAVPlatformType.js';
export { SatellitePlatformType, SATELLITE_SPECIFICATIONS } from './SatellitePlatformType.js';
export { MobilePlatformType, MOBILE_CARRIER_TYPES } from './MobilePlatformType.js';
export { USVPlatformType, USV_HULL_TYPES, USV_PROPULSION_TYPES } from './USVPlatformType.js';
export { UUVPlatformType, UUV_TYPES, UUV_PROPULSION_TYPES, UUV_NAVIGATION_SYSTEMS } from './UUVPlatformType.js';

/**
 * Platform Type Registry
 *
 * Factory for getting platform type strategies.
 * Implements Open/Closed Principle - add new types without modifying existing code.
 */
class PlatformTypeRegistry {
  constructor() {
    this._strategies = new Map();

    // Register built-in types
    this.register(new FixedPlatformType());
    this.register(new UAVPlatformType());
    this.register(new SatellitePlatformType());
    this.register(new MobilePlatformType());
    this.register(new USVPlatformType());
    this.register(new UUVPlatformType());
  }

  /**
   * Register a platform type strategy
   * @param {PlatformTypeStrategy} strategy - Strategy instance
   */
  register(strategy) {
    if (!(strategy instanceof PlatformTypeStrategy)) {
      throw new Error('Strategy must extend PlatformTypeStrategy');
    }
    this._strategies.set(strategy.getTypeCode(), strategy);
  }

  /**
   * Get strategy for a platform type
   * @param {string} typeCode - Platform type code ('fixed', 'uav', 'satellite')
   * @returns {PlatformTypeStrategy}
   * @throws {Error} If type is not registered
   */
  getStrategy(typeCode) {
    const strategy = this._strategies.get(typeCode);
    if (!strategy) {
      throw new Error(`Unknown platform type: ${typeCode}. Available types: ${this.getAvailableTypes().join(', ')}`);
    }
    return strategy;
  }

  /**
   * Check if a platform type is registered
   * @param {string} typeCode - Platform type code
   * @returns {boolean}
   */
  hasType(typeCode) {
    return this._strategies.has(typeCode);
  }

  /**
   * Get all available platform types
   * @returns {string[]}
   */
  getAvailableTypes() {
    return Array.from(this._strategies.keys());
  }

  /**
   * Get all strategies
   * @returns {PlatformTypeStrategy[]}
   */
  getAllStrategies() {
    return Array.from(this._strategies.values());
  }

  /**
   * Generate normalized name using the appropriate strategy
   * @param {string} typeCode - Platform type code
   * @param {Object} context - Naming context
   * @returns {string}
   */
  generateNormalizedName(typeCode, context) {
    return this.getStrategy(typeCode).generateNormalizedName(context);
  }

  /**
   * Validate platform data using the appropriate strategy
   * @param {string} typeCode - Platform type code
   * @param {Object} data - Platform data
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate(typeCode, data) {
    return this.getStrategy(typeCode).validate(data);
  }

  /**
   * Get form fields for a platform type
   * @param {string} typeCode - Platform type code
   * @returns {Object[]}
   */
  getFormFields(typeCode) {
    return this.getStrategy(typeCode).getFormFields();
  }

  /**
   * Get auto-created instruments for a platform
   * @param {string} typeCode - Platform type code
   * @param {Object} platformData - Platform data
   * @returns {Object[]}
   */
  getAutoCreatedInstruments(typeCode, platformData) {
    const strategy = this.getStrategy(typeCode);
    if (strategy.autoCreatesInstruments()) {
      return strategy.getAutoCreatedInstruments(platformData);
    }
    return [];
  }
}

// Export singleton registry instance
export const platformTypeRegistry = new PlatformTypeRegistry();

// Default export for convenience
export default platformTypeRegistry;
