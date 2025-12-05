/**
 * Platform Type Strategy Interface
 *
 * Strategy pattern for handling platform type-specific behavior.
 * Each platform type (Fixed, UAV, Satellite) has different:
 * - Naming conventions
 * - Required fields
 * - Auto-creation behavior
 *
 * @module domain/platform/types/PlatformTypeStrategy
 */

/**
 * @typedef {Object} NamingContext
 * @property {string} stationAcronym - Station acronym (e.g., 'SVB')
 * @property {string} [ecosystemCode] - Ecosystem code for fixed platforms
 * @property {string} [locationCode] - Location code (e.g., 'PL01', 'UAV01')
 * @property {string} [vendor] - UAV vendor (e.g., 'DJI')
 * @property {string} [model] - UAV model (e.g., 'M3M')
 * @property {string} [agency] - Satellite agency (e.g., 'ESA')
 * @property {string} [satellite] - Satellite name (e.g., 'S2A')
 * @property {string} [sensor] - Satellite sensor (e.g., 'MSI')
 */

/**
 * Platform Type Strategy Interface
 *
 * @interface PlatformTypeStrategy
 */
export class PlatformTypeStrategy {
  /**
   * Get the platform type code
   * @returns {string} Type code ('fixed', 'uav', 'satellite')
   */
  getTypeCode() {
    throw new Error('PlatformTypeStrategy.getTypeCode() must be implemented');
  }

  /**
   * Get the display name for this platform type
   * @returns {string}
   */
  getDisplayName() {
    throw new Error('PlatformTypeStrategy.getDisplayName() must be implemented');
  }

  /**
   * Generate the normalized name for a platform
   * @param {NamingContext} context - Naming context
   * @returns {string} Normalized name (e.g., 'SVB_FOR_PL01', 'SVB_DJI_M3M_UAV01')
   */
  generateNormalizedName(context) {
    throw new Error('PlatformTypeStrategy.generateNormalizedName() must be implemented');
  }

  /**
   * Get required fields for this platform type
   * @returns {string[]} List of required field names
   */
  getRequiredFields() {
    throw new Error('PlatformTypeStrategy.getRequiredFields() must be implemented');
  }

  /**
   * Check if this platform type requires ecosystem code
   * @returns {boolean}
   */
  requiresEcosystem() {
    throw new Error('PlatformTypeStrategy.requiresEcosystem() must be implemented');
  }

  /**
   * Get form field configuration for this platform type
   * @returns {Object[]} Array of field configurations
   */
  getFormFields() {
    throw new Error('PlatformTypeStrategy.getFormFields() must be implemented');
  }

  /**
   * Validate platform data for this type
   * @param {Object} data - Platform data
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate(data) {
    throw new Error('PlatformTypeStrategy.validate() must be implemented');
  }

  /**
   * Check if this platform type auto-creates instruments
   * @returns {boolean}
   */
  autoCreatesInstruments() {
    return false;
  }

  /**
   * Get auto-created instruments for this platform type
   * @param {Object} platformData - Platform data
   * @returns {Object[]} Array of instrument data to create
   */
  getAutoCreatedInstruments(platformData) {
    return [];
  }
}
