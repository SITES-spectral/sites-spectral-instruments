/**
 * USV Platform Type Strategy
 *
 * Handles Unmanned Surface Vehicles (USVs) for aquatic surveys.
 * Used for autonomous boats conducting lake/river/coastal surveys.
 *
 * Naming convention: {STATION}_{ECOSYSTEM}_{MOUNT_TYPE_CODE}
 * Example: ANS_LAK_USV01, SVB_WET_USV01, GRI_MAR_USV01
 *
 * Primary use cases:
 * - Lake bathymetry surveys
 * - Water quality monitoring
 * - Aquatic vegetation mapping
 * - Coastal/shoreline surveys
 *
 * @module domain/platform/types/USVPlatformType
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';
import { ECOSYSTEM_CODES, MOUNT_TYPE_PREFIXES } from '../Platform.js';

/**
 * Aquatic ecosystems typically used with USVs
 */
const AQUATIC_ECOSYSTEMS = ['LAK', 'WET', 'MAR', 'GEN'];

/**
 * Hull types for USVs
 */
export const USV_HULL_TYPES = {
  monohull: {
    code: 'monohull',
    name: 'Monohull',
    description: 'Single hull design - stable and efficient'
  },
  catamaran: {
    code: 'catamaran',
    name: 'Catamaran',
    description: 'Dual hull design - excellent stability'
  },
  trimaran: {
    code: 'trimaran',
    name: 'Trimaran',
    description: 'Triple hull design - maximum stability'
  },
  inflatable: {
    code: 'inflatable',
    name: 'Inflatable',
    description: 'Inflatable hull - portable and lightweight'
  }
};

/**
 * Propulsion types for USVs
 */
export const USV_PROPULSION_TYPES = {
  electric: {
    code: 'electric',
    name: 'Electric',
    description: 'Battery-powered electric motor'
  },
  gasoline: {
    code: 'gasoline',
    name: 'Gasoline',
    description: 'Internal combustion engine'
  },
  hybrid: {
    code: 'hybrid',
    name: 'Hybrid',
    description: 'Combined electric and gasoline'
  },
  solar: {
    code: 'solar',
    name: 'Solar Electric',
    description: 'Solar-powered electric motor'
  },
  jet: {
    code: 'jet',
    name: 'Water Jet',
    description: 'Water jet propulsion'
  }
};

export class USVPlatformType extends PlatformTypeStrategy {
  /**
   * Get the platform type code
   * @returns {string}
   */
  getTypeCode() {
    return 'usv';
  }

  /**
   * Get the display name
   * @returns {string}
   */
  getDisplayName() {
    return 'Unmanned Surface Vehicle';
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
      throw new Error('Station acronym is required for USV platform naming');
    }
    if (!ecosystemCode) {
      throw new Error('Ecosystem code is required for USV platform naming');
    }
    if (!mountTypeCode) {
      throw new Error('Mount type code is required for USV platform naming');
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
   * Get recommended ecosystems for USVs
   * @returns {string[]}
   */
  getRecommendedEcosystems() {
    return AQUATIC_ECOSYSTEMS;
  }

  /**
   * Get available hull types
   * @returns {Object[]}
   */
  getAvailableHullTypes() {
    return Object.values(USV_HULL_TYPES).map(hull => ({
      value: hull.code,
      label: hull.name,
      description: hull.description
    }));
  }

  /**
   * Get available propulsion types
   * @returns {Object[]}
   */
  getAvailablePropulsionTypes() {
    return Object.values(USV_PROPULSION_TYPES).map(prop => ({
      value: prop.code,
      label: prop.name,
      description: prop.description
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
        options: ECOSYSTEM_CODES.map(code => ({
          value: code,
          label: code,
          recommended: AQUATIC_ECOSYSTEMS.includes(code)
        })),
        helpText: 'Aquatic ecosystem where USV operates (LAK, WET, MAR recommended)'
      },
      {
        name: 'mountTypeCode',
        label: 'USV Number',
        type: 'text',
        required: true,
        readonly: true,
        pattern: /^USV\d{2}$/,
        placeholder: 'USV01',
        helpText: 'Auto-generated USV number (e.g., USV01, USV02)'
      },
      {
        name: 'usvModel',
        label: 'USV Model',
        type: 'text',
        required: false,
        placeholder: 'e.g., Clearpath Heron, Oceanscience Q-Boat',
        helpText: 'Model name/number of the USV'
      },
      {
        name: 'manufacturer',
        label: 'Manufacturer',
        type: 'text',
        required: false,
        placeholder: 'e.g., Clearpath Robotics, Oceanscience',
        helpText: 'USV manufacturer'
      },
      {
        name: 'hullType',
        label: 'Hull Type',
        type: 'select',
        required: false,
        options: this.getAvailableHullTypes(),
        helpText: 'Type of hull design'
      },
      {
        name: 'propulsionType',
        label: 'Propulsion',
        type: 'select',
        required: false,
        options: this.getAvailablePropulsionTypes(),
        helpText: 'Primary propulsion system'
      },
      {
        name: 'lengthM',
        label: 'Length (m)',
        type: 'number',
        required: false,
        min: 0.1,
        max: 20,
        step: 0.1,
        helpText: 'Overall length in meters'
      },
      {
        name: 'maxPayloadKg',
        label: 'Max Payload (kg)',
        type: 'number',
        required: false,
        min: 0,
        max: 500,
        helpText: 'Maximum payload capacity in kg'
      },
      {
        name: 'maxSpeedKnots',
        label: 'Max Speed (knots)',
        type: 'number',
        required: false,
        min: 0,
        max: 50,
        step: 0.5,
        helpText: 'Maximum speed in knots'
      },
      {
        name: 'enduranceHours',
        label: 'Endurance (hours)',
        type: 'number',
        required: false,
        min: 0,
        max: 72,
        step: 0.5,
        helpText: 'Maximum operational endurance in hours'
      },
      {
        name: 'maxWaveHeightM',
        label: 'Max Wave Height (m)',
        type: 'number',
        required: false,
        min: 0,
        max: 5,
        step: 0.1,
        helpText: 'Maximum safe wave height for operation'
      },
      {
        name: 'navigationSystem',
        label: 'Navigation System',
        type: 'select',
        required: false,
        options: [
          { value: 'gps', label: 'GPS' },
          { value: 'dgps', label: 'Differential GPS' },
          { value: 'rtk', label: 'RTK GPS' },
          { value: 'gnss', label: 'GNSS Multi-constellation' }
        ],
        helpText: 'Primary navigation system'
      },
      {
        name: 'controlMode',
        label: 'Control Mode',
        type: 'select',
        required: false,
        options: [
          { value: 'autonomous', label: 'Fully Autonomous' },
          { value: 'supervised', label: 'Supervised Autonomy' },
          { value: 'remote', label: 'Remote Control' },
          { value: 'hybrid', label: 'Hybrid (Auto + Remote)' }
        ],
        helpText: 'Primary control/operation mode'
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
      errors.push('Ecosystem code is required for USV platforms');
    } else if (!ECOSYSTEM_CODES.includes(data.ecosystemCode)) {
      errors.push(`Invalid ecosystem code. Must be one of: ${ECOSYSTEM_CODES.join(', ')}`);
    }

    if (!data.displayName) {
      errors.push('Display name is required');
    }

    if (data.hullType && !USV_HULL_TYPES[data.hullType]) {
      errors.push(`Invalid hull type. Must be one of: ${Object.keys(USV_HULL_TYPES).join(', ')}`);
    }

    if (data.propulsionType && !USV_PROPULSION_TYPES[data.propulsionType]) {
      errors.push(`Invalid propulsion type. Must be one of: ${Object.keys(USV_PROPULSION_TYPES).join(', ')}`);
    }

    if (data.lengthM !== undefined && data.lengthM !== null) {
      if (data.lengthM < 0.1 || data.lengthM > 20) {
        errors.push('Length must be between 0.1 and 20 meters');
      }
    }

    if (data.maxSpeedKnots !== undefined && data.maxSpeedKnots !== null) {
      if (data.maxSpeedKnots < 0 || data.maxSpeedKnots > 50) {
        errors.push('Max speed must be between 0 and 50 knots');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * USV platforms don't auto-create instruments
   * @returns {boolean}
   */
  autoCreatesInstruments() {
    return false;
  }
}
