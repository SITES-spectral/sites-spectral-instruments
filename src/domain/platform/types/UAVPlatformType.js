/**
 * UAV Platform Type Strategy
 *
 * Handles UAV/drone platforms with auto-instrument creation.
 * Naming convention: {STATION}_{VENDOR}_{MODEL}_{LOCATION}
 * Example: SVB_DJI_M3M_UAV01, ANS_MICASENSE_REDEDGE_UAV02
 *
 * NO ecosystem code in UAV platform names.
 *
 * @module domain/platform/types/UAVPlatformType
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';

/**
 * Known UAV vendors and their models with auto-instrument specifications
 */
export const UAV_SPECIFICATIONS = {
  DJI: {
    models: {
      M3M: {
        displayName: 'Mavic 3 Multispectral',
        instruments: [
          { type: 'Multispectral Sensor', name: 'Multispectral Camera', channels: 5 },
          { type: 'Phenocam', name: 'RGB Camera', resolution: '20MP' }
        ]
      },
      P4M: {
        displayName: 'Phantom 4 Multispectral',
        instruments: [
          { type: 'Multispectral Sensor', name: 'Multispectral Camera', channels: 6 }
        ]
      },
      M30T: {
        displayName: 'Matrice 30T',
        instruments: [
          { type: 'Phenocam', name: 'Wide Camera', resolution: '12MP' },
          { type: 'Phenocam', name: 'Zoom Camera', resolution: '48MP' },
          { type: 'Thermal Camera', name: 'Thermal Camera', resolution: '640x512' }
        ]
      },
      M300: {
        displayName: 'Matrice 300 RTK',
        instruments: [] // Payload dependent
      },
      M350: {
        displayName: 'Matrice 350 RTK',
        instruments: [] // Payload dependent
      }
    }
  },
  MICASENSE: {
    models: {
      REDEDGE_MX: {
        displayName: 'RedEdge-MX',
        instruments: [
          { type: 'Multispectral Sensor', name: 'Multispectral Camera', channels: 5 }
        ]
      },
      ALTUM_PT: {
        displayName: 'Altum-PT',
        instruments: [
          { type: 'Multispectral Sensor', name: 'Multispectral Camera', channels: 5 },
          { type: 'Thermal Camera', name: 'Thermal Camera', resolution: '320x256' }
        ]
      }
    }
  },
  PARROT: {
    models: {
      SEQUOIA_PLUS: {
        displayName: 'Sequoia+',
        instruments: [
          { type: 'Multispectral Sensor', name: 'Multispectral Camera', channels: 4 }
        ]
      }
    }
  },
  HEADWALL: {
    models: {
      NANO_HYPERSPEC: {
        displayName: 'Nano-Hyperspec',
        instruments: [
          { type: 'Hyperspectral Sensor', name: 'Hyperspectral Camera', bands: 270 }
        ]
      }
    }
  }
};

export class UAVPlatformType extends PlatformTypeStrategy {
  /**
   * Get the platform type code
   * @returns {string}
   */
  getTypeCode() {
    return 'uav';
  }

  /**
   * Get the display name
   * @returns {string}
   */
  getDisplayName() {
    return 'UAV Platform';
  }

  /**
   * Generate normalized name
   * Pattern: {STATION}_{VENDOR}_{MODEL}_{LOCATION}
   * @param {Object} context - Naming context
   * @returns {string}
   */
  generateNormalizedName(context) {
    const { stationAcronym, vendor, model, locationCode } = context;

    if (!stationAcronym) {
      throw new Error('Station acronym is required for UAV platform naming');
    }
    if (!vendor) {
      throw new Error('Vendor is required for UAV platform naming');
    }
    if (!model) {
      throw new Error('Model is required for UAV platform naming');
    }
    if (!locationCode) {
      throw new Error('Location code is required for UAV platform naming');
    }

    // Normalize vendor and model (uppercase, no spaces)
    const normalizedVendor = vendor.toUpperCase().replace(/\s+/g, '');
    const normalizedModel = model.toUpperCase().replace(/[\s-]+/g, '');

    return `${stationAcronym}_${normalizedVendor}_${normalizedModel}_${locationCode}`;
  }

  /**
   * Get required fields
   * @returns {string[]}
   */
  getRequiredFields() {
    return ['stationId', 'displayName', 'vendor', 'model', 'locationCode'];
  }

  /**
   * UAV platforms do NOT require ecosystem
   * @returns {boolean}
   */
  requiresEcosystem() {
    return false;
  }

  /**
   * Get form field configuration
   * @returns {Object[]}
   */
  getFormFields() {
    const vendors = Object.keys(UAV_SPECIFICATIONS);

    return [
      {
        name: 'vendor',
        label: 'UAV Vendor',
        type: 'select',
        required: true,
        options: vendors.map(v => ({ value: v, label: v })),
        helpText: 'Drone manufacturer'
      },
      {
        name: 'model',
        label: 'UAV Model',
        type: 'select',
        required: true,
        dependsOn: 'vendor',
        getOptions: (vendor) => {
          if (!vendor || !UAV_SPECIFICATIONS[vendor]) return [];
          return Object.entries(UAV_SPECIFICATIONS[vendor].models).map(([code, spec]) => ({
            value: code,
            label: spec.displayName
          }));
        },
        helpText: 'Drone model - determines auto-created instruments'
      },
      {
        name: 'locationCode',
        label: 'Location Code',
        type: 'text',
        required: true,
        pattern: /^UAV\d{2}$/,
        placeholder: 'UAV01',
        helpText: 'Auto-generated location code (e.g., UAV01, UAV02)'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        helpText: 'Additional notes about this UAV platform'
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

    if (!data.displayName) {
      errors.push('Display name is required');
    }

    if (!data.vendor) {
      errors.push('UAV vendor is required');
    } else if (!UAV_SPECIFICATIONS[data.vendor.toUpperCase()]) {
      errors.push(`Unknown vendor: ${data.vendor}. Known vendors: ${Object.keys(UAV_SPECIFICATIONS).join(', ')}`);
    }

    if (!data.model) {
      errors.push('UAV model is required');
    } else if (data.vendor) {
      const vendorSpec = UAV_SPECIFICATIONS[data.vendor.toUpperCase()];
      if (vendorSpec && !vendorSpec.models[data.model.toUpperCase()]) {
        errors.push(`Unknown model for ${data.vendor}: ${data.model}`);
      }
    }

    // UAV platforms should NOT have ecosystem code
    if (data.ecosystemCode) {
      errors.push('UAV platforms should not have ecosystem code');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * UAV platforms auto-create instruments based on model
   * @returns {boolean}
   */
  autoCreatesInstruments() {
    return true;
  }

  /**
   * Get auto-created instruments for this UAV
   * @param {Object} platformData - Platform data with vendor and model
   * @returns {Object[]} Array of instrument data to create
   */
  getAutoCreatedInstruments(platformData) {
    const { vendor, model, normalizedName } = platformData;

    if (!vendor || !model) return [];

    const vendorSpec = UAV_SPECIFICATIONS[vendor.toUpperCase()];
    if (!vendorSpec) return [];

    const modelSpec = vendorSpec.models[model.toUpperCase()];
    if (!modelSpec || !modelSpec.instruments) return [];

    // Generate instruments with proper naming
    return modelSpec.instruments.map((inst, index) => {
      const typeCode = this._getInstrumentTypeCode(inst.type);
      const number = String(index + 1).padStart(2, '0');

      return {
        instrumentType: inst.type,
        displayName: inst.name,
        normalizedName: `${normalizedName}_${typeCode}${number}`,
        specifications: {
          channels: inst.channels,
          resolution: inst.resolution,
          bands: inst.bands,
          autoCreated: true,
          sourceModel: `${vendor} ${modelSpec.displayName}`
        }
      };
    });
  }

  /**
   * Get instrument type code from type name
   * @private
   * @param {string} typeName - Instrument type name
   * @returns {string} Type code
   */
  _getInstrumentTypeCode(typeName) {
    const typeMap = {
      'Phenocam': 'PHE',
      'Multispectral Sensor': 'MS',
      'Hyperspectral Sensor': 'HYP',
      'Thermal Camera': 'TIR',
      'LiDAR': 'LID'
    };
    return typeMap[typeName] || 'INS';
  }
}
