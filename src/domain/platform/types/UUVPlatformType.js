/**
 * UUV Platform Type Strategy
 *
 * Handles Unmanned Underwater Vehicles (UUVs) for subsurface surveys.
 * Includes ROVs (Remotely Operated Vehicles) and AUVs (Autonomous Underwater Vehicles).
 *
 * Naming convention: {STATION}_{ECOSYSTEM}_{MOUNT_TYPE_CODE}
 * Example: ANS_LAK_UUV01, GRI_LAK_UUV01, SVB_WET_UUV01
 *
 * Primary use cases:
 * - Underwater imaging and video
 * - Bathymetric surveys
 * - Sediment sampling
 * - Aquatic habitat mapping
 * - Infrastructure inspection
 *
 * @module domain/platform/types/UUVPlatformType
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';
import { ECOSYSTEM_CODES, MOUNT_TYPE_PREFIXES } from '../Platform.js';

/**
 * Aquatic ecosystems typically used with UUVs
 */
const AQUATIC_ECOSYSTEMS = ['LAK', 'WET', 'MAR', 'GEN'];

/**
 * UUV types (ROV vs AUV)
 */
export const UUV_TYPES = {
  rov: {
    code: 'rov',
    name: 'ROV (Remotely Operated Vehicle)',
    description: 'Tethered vehicle controlled from surface',
    icon: 'fa-robot'
  },
  auv: {
    code: 'auv',
    name: 'AUV (Autonomous Underwater Vehicle)',
    description: 'Untethered autonomous vehicle',
    icon: 'fa-satellite'
  },
  hybrid: {
    code: 'hybrid',
    name: 'Hybrid ROV/AUV',
    description: 'Can operate tethered or autonomously',
    icon: 'fa-link'
  }
};

/**
 * Propulsion types for UUVs
 */
export const UUV_PROPULSION_TYPES = {
  thruster: {
    code: 'thruster',
    name: 'Electric Thrusters',
    description: 'Multiple electric thrusters for maneuvering'
  },
  propeller: {
    code: 'propeller',
    name: 'Propeller',
    description: 'Single or twin propeller propulsion'
  },
  jet: {
    code: 'jet',
    name: 'Water Jet',
    description: 'Water jet propulsion system'
  },
  buoyancy: {
    code: 'buoyancy',
    name: 'Buoyancy-Driven',
    description: 'Glider-style buoyancy-driven propulsion'
  }
};

/**
 * Navigation systems for UUVs
 */
export const UUV_NAVIGATION_SYSTEMS = {
  dvl: {
    code: 'dvl',
    name: 'DVL (Doppler Velocity Log)',
    description: 'Acoustic velocity measurement for positioning'
  },
  usbl: {
    code: 'usbl',
    name: 'USBL (Ultra-Short BaseLine)',
    description: 'Acoustic positioning from surface transceiver'
  },
  ins: {
    code: 'ins',
    name: 'INS (Inertial Navigation System)',
    description: 'Dead reckoning with inertial sensors'
  },
  slam: {
    code: 'slam',
    name: 'Visual SLAM',
    description: 'Simultaneous Localization and Mapping using cameras'
  },
  combined: {
    code: 'combined',
    name: 'Combined/Hybrid',
    description: 'Multiple navigation systems combined'
  }
};

export class UUVPlatformType extends PlatformTypeStrategy {
  /**
   * Get the platform type code
   * @returns {string}
   */
  getTypeCode() {
    return 'uuv';
  }

  /**
   * Get the display name
   * @returns {string}
   */
  getDisplayName() {
    return 'Unmanned Underwater Vehicle';
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
      throw new Error('Station acronym is required for UUV platform naming');
    }
    if (!ecosystemCode) {
      throw new Error('Ecosystem code is required for UUV platform naming');
    }
    if (!mountTypeCode) {
      throw new Error('Mount type code is required for UUV platform naming');
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
   * Get recommended ecosystems for UUVs
   * @returns {string[]}
   */
  getRecommendedEcosystems() {
    return AQUATIC_ECOSYSTEMS;
  }

  /**
   * Get available UUV types
   * @returns {Object[]}
   */
  getAvailableUUVTypes() {
    return Object.values(UUV_TYPES).map(type => ({
      value: type.code,
      label: type.name,
      description: type.description,
      icon: type.icon
    }));
  }

  /**
   * Get available propulsion types
   * @returns {Object[]}
   */
  getAvailablePropulsionTypes() {
    return Object.values(UUV_PROPULSION_TYPES).map(prop => ({
      value: prop.code,
      label: prop.name,
      description: prop.description
    }));
  }

  /**
   * Get available navigation systems
   * @returns {Object[]}
   */
  getAvailableNavigationSystems() {
    return Object.values(UUV_NAVIGATION_SYSTEMS).map(nav => ({
      value: nav.code,
      label: nav.name,
      description: nav.description
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
        helpText: 'Aquatic ecosystem where UUV operates (LAK, WET, MAR recommended)'
      },
      {
        name: 'mountTypeCode',
        label: 'UUV Number',
        type: 'text',
        required: true,
        readonly: true,
        pattern: /^UUV\d{2}$/,
        placeholder: 'UUV01',
        helpText: 'Auto-generated UUV number (e.g., UUV01, UUV02)'
      },
      {
        name: 'uuvType',
        label: 'UUV Type',
        type: 'select',
        required: false,
        options: this.getAvailableUUVTypes(),
        helpText: 'ROV (tethered), AUV (autonomous), or Hybrid'
      },
      {
        name: 'uuvModel',
        label: 'UUV Model',
        type: 'text',
        required: false,
        placeholder: 'e.g., BlueROV2, REMUS 100',
        helpText: 'Model name/number of the UUV'
      },
      {
        name: 'manufacturer',
        label: 'Manufacturer',
        type: 'text',
        required: false,
        placeholder: 'e.g., Blue Robotics, Kongsberg',
        helpText: 'UUV manufacturer'
      },
      {
        name: 'maxDepthM',
        label: 'Max Depth (m)',
        type: 'number',
        required: false,
        min: 1,
        max: 6000,
        helpText: 'Maximum operational depth in meters'
      },
      {
        name: 'typicalDepthM',
        label: 'Typical Depth (m)',
        type: 'number',
        required: false,
        min: 0,
        max: 1000,
        helpText: 'Typical operating depth for this application'
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
        name: 'numThrusters',
        label: 'Number of Thrusters',
        type: 'number',
        required: false,
        min: 1,
        max: 12,
        helpText: 'Number of thrusters/motors'
      },
      {
        name: 'navigationSystem',
        label: 'Navigation System',
        type: 'select',
        required: false,
        options: this.getAvailableNavigationSystems(),
        helpText: 'Primary underwater navigation system'
      },
      {
        name: 'tetherLengthM',
        label: 'Tether Length (m)',
        type: 'number',
        required: false,
        min: 0,
        max: 1000,
        helpText: 'Tether length for ROVs (0 for AUVs)'
      },
      {
        name: 'enduranceHours',
        label: 'Endurance (hours)',
        type: 'number',
        required: false,
        min: 0,
        max: 72,
        step: 0.5,
        helpText: 'Maximum operational endurance'
      },
      {
        name: 'maxPayloadKg',
        label: 'Max Payload (kg)',
        type: 'number',
        required: false,
        min: 0,
        max: 200,
        helpText: 'Maximum additional payload capacity'
      },
      {
        name: 'hasManipulator',
        label: 'Has Manipulator Arm',
        type: 'checkbox',
        required: false,
        helpText: 'Whether the UUV has a manipulator arm'
      },
      {
        name: 'lightingLumens',
        label: 'Lighting (lumens)',
        type: 'number',
        required: false,
        min: 0,
        max: 50000,
        helpText: 'Total lighting capacity in lumens'
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
      errors.push('Ecosystem code is required for UUV platforms');
    } else if (!ECOSYSTEM_CODES.includes(data.ecosystemCode)) {
      errors.push(`Invalid ecosystem code. Must be one of: ${ECOSYSTEM_CODES.join(', ')}`);
    }

    if (!data.displayName) {
      errors.push('Display name is required');
    }

    if (data.uuvType && !UUV_TYPES[data.uuvType]) {
      errors.push(`Invalid UUV type. Must be one of: ${Object.keys(UUV_TYPES).join(', ')}`);
    }

    if (data.propulsionType && !UUV_PROPULSION_TYPES[data.propulsionType]) {
      errors.push(`Invalid propulsion type. Must be one of: ${Object.keys(UUV_PROPULSION_TYPES).join(', ')}`);
    }

    if (data.navigationSystem && !UUV_NAVIGATION_SYSTEMS[data.navigationSystem]) {
      errors.push(`Invalid navigation system. Must be one of: ${Object.keys(UUV_NAVIGATION_SYSTEMS).join(', ')}`);
    }

    if (data.maxDepthM !== undefined && data.maxDepthM !== null) {
      if (data.maxDepthM < 1 || data.maxDepthM > 6000) {
        errors.push('Max depth must be between 1 and 6000 meters');
      }
    }

    // ROVs should have tether length
    if (data.uuvType === 'rov' && !data.tetherLengthM) {
      // Warning only, not an error
    }

    // AUVs typically shouldn't have tether
    if (data.uuvType === 'auv' && data.tetherLengthM && data.tetherLengthM > 0) {
      // Warning only, not an error - hybrid operations possible
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * UUV platforms don't auto-create instruments
   * @returns {boolean}
   */
  autoCreatesInstruments() {
    return false;
  }
}
