/**
 * Mobile Platform Type Strategy
 *
 * Handles mobile/portable platforms like backpack sensors, vehicle-mounted
 * instruments, rovers, boats (small), and bicycles.
 *
 * Naming convention: {STATION}_{ECOSYSTEM}_{CARRIER}_{MOUNT_TYPE_CODE}
 * Example: SVB_FOR_BPK_MOB01, ANS_LAK_BOT_MOB01, LON_AGR_VEH_MOB01
 *
 * Carrier Types:
 * - VEH: Vehicle (truck, car, ATV)
 * - BOT: Boat (kayak, motorboat - small watercraft)
 * - ROV: Rover (autonomous/RC robot)
 * - BPK: Backpack (human walking)
 * - BIC: Bicycle (human cycling)
 * - OTH: Other
 *
 * @module domain/platform/types/MobilePlatformType
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';
import { ECOSYSTEM_CODES, MOUNT_TYPE_PREFIXES } from '../Platform.js';

/**
 * Valid carrier types for mobile platforms
 */
export const MOBILE_CARRIER_TYPES = {
  VEH: {
    code: 'VEH',
    name: 'Vehicle',
    description: 'Truck, car, ATV, or other motorized vehicle',
    icon: 'fa-truck'
  },
  BOT: {
    code: 'BOT',
    name: 'Boat',
    description: 'Kayak, canoe, motorboat, or other small watercraft',
    icon: 'fa-ship'
  },
  ROV: {
    code: 'ROV',
    name: 'Rover',
    description: 'Autonomous or remote-controlled ground robot',
    icon: 'fa-robot'
  },
  BPK: {
    code: 'BPK',
    name: 'Backpack',
    description: 'Human-carried backpack with portable sensors',
    icon: 'fa-hiking'
  },
  BIC: {
    code: 'BIC',
    name: 'Bicycle',
    description: 'Bicycle-mounted sensors for transect surveys',
    icon: 'fa-bicycle'
  },
  OTH: {
    code: 'OTH',
    name: 'Other',
    description: 'Other mobile carrier type',
    icon: 'fa-question'
  }
};

export class MobilePlatformType extends PlatformTypeStrategy {
  /**
   * Get the platform type code
   * @returns {string}
   */
  getTypeCode() {
    return 'mobile';
  }

  /**
   * Get the display name
   * @returns {string}
   */
  getDisplayName() {
    return 'Mobile Platform';
  }

  /**
   * Generate normalized name
   * Pattern: {STATION}_{ECOSYSTEM}_{CARRIER}_{MOUNT_TYPE_CODE}
   * @param {Object} context - Naming context
   * @returns {string}
   */
  generateNormalizedName(context) {
    const { stationAcronym, ecosystemCode, carrierType, mountTypeCode } = context;

    if (!stationAcronym) {
      throw new Error('Station acronym is required for mobile platform naming');
    }
    if (!ecosystemCode) {
      throw new Error('Ecosystem code is required for mobile platform naming');
    }
    if (!carrierType) {
      throw new Error('Carrier type is required for mobile platform naming');
    }
    if (!mountTypeCode) {
      throw new Error('Mount type code is required for mobile platform naming');
    }

    return `${stationAcronym}_${ecosystemCode}_${carrierType}_${mountTypeCode}`;
  }

  /**
   * Get required fields
   * @returns {string[]}
   */
  getRequiredFields() {
    return ['stationId', 'displayName', 'ecosystemCode', 'carrierType', 'mountTypeCode'];
  }

  /**
   * Check if ecosystem is required
   * @returns {boolean}
   */
  requiresEcosystem() {
    return true;
  }

  /**
   * Get available carrier types for mobile platforms
   * @returns {Object[]}
   */
  getAvailableCarrierTypes() {
    return Object.values(MOBILE_CARRIER_TYPES).map(carrier => ({
      value: carrier.code,
      label: carrier.name,
      description: carrier.description,
      icon: carrier.icon
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
        helpText: 'Primary ecosystem where mobile surveys are conducted'
      },
      {
        name: 'carrierType',
        label: 'Carrier Type',
        type: 'select',
        required: true,
        options: this.getAvailableCarrierTypes(),
        helpText: 'Type of mobile carrier (VEH=Vehicle, BPK=Backpack, BOT=Boat, etc.)'
      },
      {
        name: 'mountTypeCode',
        label: 'Platform Number',
        type: 'text',
        required: true,
        readonly: true,
        pattern: /^MOB\d{2}$/,
        placeholder: 'MOB01',
        helpText: 'Auto-generated platform number (e.g., MOB01, MOB02)'
      },
      {
        name: 'carrierModel',
        label: 'Carrier Model',
        type: 'text',
        required: false,
        placeholder: 'e.g., Toyota Hilux, Kayak Explorer',
        helpText: 'Model name/number of the carrier'
      },
      {
        name: 'carrierDescription',
        label: 'Carrier Description',
        type: 'textarea',
        required: false,
        placeholder: 'Describe the mobile platform setup...',
        helpText: 'Detailed description of the carrier and sensor mounting'
      },
      {
        name: 'typicalSpeedKmh',
        label: 'Typical Speed (km/h)',
        type: 'number',
        required: false,
        min: 0,
        max: 200,
        helpText: 'Typical survey speed in km/h'
      },
      {
        name: 'rangeKm',
        label: 'Range (km)',
        type: 'number',
        required: false,
        min: 0,
        max: 1000,
        helpText: 'Typical operating range in km'
      },
      {
        name: 'powerType',
        label: 'Power Source',
        type: 'select',
        required: false,
        options: [
          { value: 'battery', label: 'Battery' },
          { value: 'vehicle', label: 'Vehicle Power' },
          { value: 'solar', label: 'Solar' },
          { value: 'manual', label: 'Manual/No Power' },
          { value: 'hybrid', label: 'Hybrid' }
        ],
        helpText: 'Primary power source for instruments'
      },
      {
        name: 'runtimeHours',
        label: 'Runtime (hours)',
        type: 'number',
        required: false,
        min: 0,
        max: 100,
        step: 0.5,
        helpText: 'Typical operational runtime in hours'
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
      errors.push('Ecosystem code is required for mobile platforms');
    } else if (!ECOSYSTEM_CODES.includes(data.ecosystemCode)) {
      errors.push(`Invalid ecosystem code. Must be one of: ${ECOSYSTEM_CODES.join(', ')}`);
    }

    if (!data.carrierType) {
      errors.push('Carrier type is required for mobile platforms');
    } else if (!MOBILE_CARRIER_TYPES[data.carrierType]) {
      errors.push(`Invalid carrier type. Must be one of: ${Object.keys(MOBILE_CARRIER_TYPES).join(', ')}`);
    }

    if (!data.displayName) {
      errors.push('Display name is required');
    }

    if (data.typicalSpeedKmh !== undefined && data.typicalSpeedKmh !== null) {
      if (data.typicalSpeedKmh < 0 || data.typicalSpeedKmh > 200) {
        errors.push('Typical speed must be between 0 and 200 km/h');
      }
    }

    if (data.rangeKm !== undefined && data.rangeKm !== null) {
      if (data.rangeKm < 0 || data.rangeKm > 1000) {
        errors.push('Range must be between 0 and 1000 km');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Mobile platforms don't auto-create instruments
   * @returns {boolean}
   */
  autoCreatesInstruments() {
    return false;
  }
}
