/**
 * Fixed Platform Type Strategy
 *
 * Handles fixed/stationary platforms like towers, masts, and permanent installations.
 * Naming convention: {STATION}_{ECOSYSTEM}_{MOUNT_TYPE_CODE}
 * Example: SVB_FOR_PL01, ANS_MIR_BL01, LON_AGR_GL01
 *
 * Mount Type Codes:
 * - PL: Pole/Tower/Mast (elevated structures)
 * - BL: Building (rooftop or facade mounted)
 * - GL: Ground Level (below 1.5m height)
 *
 * @module domain/platform/types/FixedPlatformType
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';
import { ECOSYSTEM_CODES, MOUNT_TYPE_PREFIXES } from '../Platform.js';

/**
 * Valid mount type prefixes for fixed platforms
 */
const FIXED_MOUNT_TYPES = ['PL', 'BL', 'GL'];

export class FixedPlatformType extends PlatformTypeStrategy {
  /**
   * Get the platform type code
   * @returns {string}
   */
  getTypeCode() {
    return 'fixed';
  }

  /**
   * Get the display name
   * @returns {string}
   */
  getDisplayName() {
    return 'Fixed Platform';
  }

  /**
   * Generate normalized name
   * Pattern: {STATION}_{ECOSYSTEM}_{MOUNT_TYPE_CODE}
   * @param {Object} context - Naming context
   * @returns {string}
   */
  generateNormalizedName(context) {
    const { stationAcronym, ecosystemCode, mountTypeCode } = context;

    if (!stationAcronym) {
      throw new Error('Station acronym is required for fixed platform naming');
    }
    if (!ecosystemCode) {
      throw new Error('Ecosystem code is required for fixed platform naming');
    }
    if (!mountTypeCode) {
      throw new Error('Mount type code is required for fixed platform naming');
    }

    return `${stationAcronym}_${ecosystemCode}_${mountTypeCode}`;
  }

  /**
   * Get required fields
   * @returns {string[]}
   */
  getRequiredFields() {
    return ['stationId', 'displayName', 'ecosystemCode', 'mountTypeCode'];
  }

  /**
   * Check if ecosystem is required
   * @returns {boolean}
   */
  requiresEcosystem() {
    return true;
  }

  /**
   * Get available mount types for fixed platforms
   * @returns {Object[]}
   */
  getAvailableMountTypes() {
    return FIXED_MOUNT_TYPES.map(code => ({
      value: code,
      label: MOUNT_TYPE_PREFIXES[code].name,
      description: MOUNT_TYPE_PREFIXES[code].description
    }));
  }

  /**
   * Get form field configuration
   * @returns {Object[]}
   */
  getFormFields() {
    return [
      {
        name: 'ecosystemCode',
        label: 'Ecosystem',
        type: 'select',
        required: true,
        options: ECOSYSTEM_CODES.map(code => ({ value: code, label: code })),
        helpText: 'The ecosystem type this platform monitors'
      },
      {
        name: 'mountType',
        label: 'Mount Type',
        type: 'select',
        required: true,
        options: this.getAvailableMountTypes(),
        helpText: 'Physical mounting structure type (PL=Pole/Tower, BL=Building, GL=Ground Level)'
      },
      {
        name: 'mountTypeCode',
        label: 'Mount Type Code',
        type: 'text',
        required: true,
        readonly: true,
        pattern: /^(PL|BL|GL)\d{2}$/,
        placeholder: 'PL01',
        helpText: 'Auto-generated (e.g., PL01=Pole #1, BL01=Building #1, GL01=Ground Level #1)'
      },
      {
        name: 'mountingStructure',
        label: 'Structure Description',
        type: 'text',
        required: false,
        placeholder: 'e.g., 30m observation tower, Building rooftop',
        helpText: 'Detailed description of the mounting structure'
      },
      {
        name: 'platformHeightM',
        label: 'Height (m)',
        type: 'number',
        required: false,
        min: 0,
        max: 500,
        helpText: 'Height above ground in meters'
      },
      {
        name: 'latitude',
        label: 'Latitude',
        type: 'number',
        required: false,
        min: -90,
        max: 90,
        step: 0.000001,
        helpText: 'Geographic latitude (decimal degrees)'
      },
      {
        name: 'longitude',
        label: 'Longitude',
        type: 'number',
        required: false,
        min: -180,
        max: 180,
        step: 0.000001,
        helpText: 'Geographic longitude (decimal degrees)'
      }
    ];
  }

  /**
   * Validate platform data
   * @param {Object} data - Platform data
   * @returns {{valid: boolean, errors: string[]}}
   */
  validate(data) {
    const errors = [];

    if (!data.ecosystemCode) {
      errors.push('Ecosystem code is required for fixed platforms');
    } else if (!ECOSYSTEM_CODES.includes(data.ecosystemCode)) {
      errors.push(`Invalid ecosystem code. Must be one of: ${ECOSYSTEM_CODES.join(', ')}`);
    }

    if (!data.displayName) {
      errors.push('Display name is required');
    }

    if (data.platformHeightM !== undefined && data.platformHeightM !== null) {
      if (data.platformHeightM < 0 || data.platformHeightM > 500) {
        errors.push('Platform height must be between 0 and 500 meters');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Fixed platforms don't auto-create instruments
   * @returns {boolean}
   */
  autoCreatesInstruments() {
    return false;
  }
}
