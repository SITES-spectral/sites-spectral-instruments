/**
 * Fixed Platform Type Strategy
 *
 * Handles fixed/stationary platforms like towers, masts, and permanent installations.
 * Naming convention: {STATION}_{ECOSYSTEM}_{LOCATION}
 * Example: SVB_FOR_PL01, ANS_MIR_PL02
 *
 * @module domain/platform/types/FixedPlatformType
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';
import { ECOSYSTEM_CODES } from '../Platform.js';

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
   * Pattern: {STATION}_{ECOSYSTEM}_{LOCATION}
   * @param {Object} context - Naming context
   * @returns {string}
   */
  generateNormalizedName(context) {
    const { stationAcronym, ecosystemCode, locationCode } = context;

    if (!stationAcronym) {
      throw new Error('Station acronym is required for fixed platform naming');
    }
    if (!ecosystemCode) {
      throw new Error('Ecosystem code is required for fixed platform naming');
    }
    if (!locationCode) {
      throw new Error('Location code is required for fixed platform naming');
    }

    return `${stationAcronym}_${ecosystemCode}_${locationCode}`;
  }

  /**
   * Get required fields
   * @returns {string[]}
   */
  getRequiredFields() {
    return ['stationId', 'displayName', 'ecosystemCode', 'locationCode'];
  }

  /**
   * Check if ecosystem is required
   * @returns {boolean}
   */
  requiresEcosystem() {
    return true;
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
        name: 'locationCode',
        label: 'Location Code',
        type: 'text',
        required: true,
        pattern: /^PL\d{2}$/,
        placeholder: 'PL01',
        helpText: 'Auto-generated location code (e.g., PL01, PL02)'
      },
      {
        name: 'mountingStructure',
        label: 'Mounting Structure',
        type: 'text',
        required: false,
        placeholder: 'e.g., Tower, Mast, Building',
        helpText: 'Type of mounting structure'
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
