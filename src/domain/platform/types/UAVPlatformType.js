/**
 * UAV Platform Type Strategy
 *
 * Handles UAV/drone platforms with auto-instrument creation.
 * Naming convention: {STATION}_{VENDOR}_{MODEL}_{MOUNT_TYPE_CODE}
 * Example: SVB_DJI_M3M_UAV01, ANS_MICASENSE_REDEDGE_UAV02
 *
 * Mount Type Code: UAV##
 * NO ecosystem code in UAV platform names.
 *
 * @module domain/platform/types/UAVPlatformType
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';

/**
 * Known UAV vendors and their models with auto-instrument specifications
 *
 * DJI Mavic 3 Multispectral (M3M):
 * - 4 x 5MP multispectral cameras (Green, Red, Red Edge, NIR)
 * - 1 x 20MP RGB camera (1/2" CMOS, 4944×3700)
 * - RTK/PPK support
 *
 * DJI Phantom 4 Multispectral (P4M):
 * - 6 x 2MP multispectral cameras (Blue, Green, Red, Red Edge, NIR + RGB)
 * - Integrated into single gimbal
 * - RTK support
 *
 * MicaSense RedEdge-MX:
 * - 5 bands (Blue, Green, Red, Red Edge, NIR)
 * - Global shutter, 3.2MP per band
 * - DLS 2 light sensor compatible
 */
export const UAV_SPECIFICATIONS = {
  DJI: {
    models: {
      M3M: {
        displayName: 'Mavic 3 Multispectral',
        instruments: [
          {
            type: 'Multispectral Sensor',
            name: 'Multispectral Camera',
            channels: 4,
            bands: ['Green (560nm)', 'Red (650nm)', 'Red Edge (730nm)', 'NIR (860nm)'],
            resolution: '5MP per band'
          },
          {
            type: 'RGB Camera',
            name: 'RGB Camera',
            resolution_mp: 20,
            sensor_size: '1/2" CMOS',
            focal_length_mm: 24
          }
        ]
      },
      P4M: {
        displayName: 'Phantom 4 Multispectral',
        instruments: [
          {
            type: 'Multispectral Sensor',
            name: 'Multispectral Camera',
            channels: 6,
            bands: ['Blue (450nm)', 'Green (560nm)', 'Red (650nm)', 'Red Edge (730nm)', 'NIR (840nm)', 'RGB'],
            resolution: '2MP per band'
          }
        ]
      },
      M30T: {
        displayName: 'Matrice 30T',
        instruments: [
          { type: 'RGB Camera', name: 'Wide Camera', resolution_mp: 12 },
          { type: 'RGB Camera', name: 'Zoom Camera', resolution_mp: 48 },
          { type: 'Thermal Camera', name: 'Thermal Camera', resolution: '640x512' }
        ]
      },
      M300: {
        displayName: 'Matrice 300 RTK',
        instruments: [] // Payload dependent - user must add instruments manually
      },
      M350: {
        displayName: 'Matrice 350 RTK',
        instruments: [] // Payload dependent - user must add instruments manually
      }
    }
  },
  MICASENSE: {
    models: {
      REDEDGE_MX: {
        displayName: 'RedEdge-MX',
        instruments: [
          {
            type: 'Multispectral Sensor',
            name: 'RedEdge-MX Multispectral',
            channels: 5,
            bands: ['Blue (475nm)', 'Green (560nm)', 'Red (668nm)', 'Red Edge (717nm)', 'NIR (840nm)'],
            resolution: '3.2MP per band'
          }
        ]
      },
      ALTUM_PT: {
        displayName: 'Altum-PT',
        instruments: [
          {
            type: 'Multispectral Sensor',
            name: 'Altum Multispectral',
            channels: 5,
            bands: ['Blue (475nm)', 'Green (560nm)', 'Red (668nm)', 'Red Edge (717nm)', 'NIR (842nm)'],
            resolution: '3.2MP per band'
          },
          { type: 'Thermal Camera', name: 'Thermal Radiometer', resolution: '320x256' }
        ]
      }
    }
  },
  PARROT: {
    models: {
      SEQUOIA_PLUS: {
        displayName: 'Sequoia+',
        instruments: [
          {
            type: 'Multispectral Sensor',
            name: 'Sequoia+ Multispectral',
            channels: 4,
            bands: ['Green (550nm)', 'Red (660nm)', 'Red Edge (735nm)', 'NIR (790nm)'],
            resolution: '1.2MP per band'
          }
        ]
      }
    }
  },
  HEADWALL: {
    models: {
      NANO_HYPERSPEC: {
        displayName: 'Nano-Hyperspec',
        instruments: [
          {
            type: 'Hyperspectral Sensor',
            name: 'Nano-Hyperspec Imager',
            bands: 270,
            spectral_range: '400-1000nm',
            spectral_resolution: '2.2nm'
          }
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
   * Pattern: {STATION}_{VENDOR}_{MODEL}_{MOUNT_TYPE_CODE}
   * @param {Object} context - Naming context
   * @returns {string}
   */
  generateNormalizedName(context) {
    const { stationAcronym, vendor, model, mountTypeCode } = context;

    if (!stationAcronym) {
      throw new Error('Station acronym is required for UAV platform naming');
    }
    if (!vendor) {
      throw new Error('Vendor is required for UAV platform naming');
    }
    if (!model) {
      throw new Error('Model is required for UAV platform naming');
    }
    if (!mountTypeCode) {
      throw new Error('Mount type code is required for UAV platform naming');
    }

    // Normalize vendor and model (uppercase, no spaces)
    const normalizedVendor = vendor.toUpperCase().replace(/\s+/g, '');
    const normalizedModel = model.toUpperCase().replace(/[\s-]+/g, '');

    return `${stationAcronym}_${normalizedVendor}_${normalizedModel}_${mountTypeCode}`;
  }

  /**
   * Get required fields
   * @returns {string[]}
   */
  getRequiredFields() {
    return ['stationId', 'displayName', 'vendor', 'model', 'mountTypeCode'];
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
        name: 'mountTypeCode',
        label: 'Mount Type Code',
        type: 'text',
        required: true,
        readonly: true,
        pattern: /^UAV\d{2}$/,
        placeholder: 'UAV01',
        helpText: 'Auto-generated UAV position code (e.g., UAV01, UAV02)'
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

    // displayName is optional - will be auto-generated from normalized name if not provided
    // Check both camelCase and snake_case since frontend may use either
    // if (!data.displayName && !data.display_name) {
    //   errors.push('Display name is required');
    // }

    // Check both camelCase and snake_case variants
    const vendor = data.vendor;
    const model = data.model;

    if (!vendor) {
      errors.push('UAV vendor is required');
    } else if (!UAV_SPECIFICATIONS[vendor.toUpperCase()]) {
      errors.push(`Unknown vendor: ${vendor}. Known vendors: ${Object.keys(UAV_SPECIFICATIONS).join(', ')}`);
    }

    if (!model) {
      errors.push('UAV model is required');
    } else if (vendor) {
      const vendorSpec = UAV_SPECIFICATIONS[vendor.toUpperCase()];
      if (vendorSpec) {
        // Normalize model name: M3M, RedEdge-MX -> REDEDGE_MX, etc.
        const normalizedModel = model.toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_');
        const modelVariants = [
          model,                    // Original
          model.toUpperCase(),      // M3M
          normalizedModel,          // REDEDGE_MX
          model.replace(/-/g, ''),  // RedEdgeMX
        ];

        const modelFound = modelVariants.some(m => vendorSpec.models[m]);
        if (!modelFound) {
          errors.push(`Unknown model for ${vendor}: ${model}. Available: ${Object.keys(vendorSpec.models).join(', ')}`);
        }
      }
    }

    // UAV platforms should NOT have ecosystem code
    const ecosystemCode = data.ecosystemCode || data.ecosystem_code;
    if (ecosystemCode) {
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
    const { vendor, model } = platformData;
    // Support both normalizedName and platformName (from CreatePlatform command)
    const normalizedName = platformData.normalizedName || platformData.platformName;

    if (!vendor || !model) return [];

    const vendorSpec = UAV_SPECIFICATIONS[vendor.toUpperCase()];
    if (!vendorSpec) return [];

    const modelSpec = vendorSpec.models[model.toUpperCase()];
    if (!modelSpec || !modelSpec.instruments) return [];

    // Generate instruments with proper naming
    return modelSpec.instruments.map((inst, index) => {
      const typeCode = this._getInstrumentTypeCode(inst.type);
      const number = String(index + 1).padStart(2, '0');

      // Build specifications object with all available fields
      const specifications = {
        autoCreated: true,
        sourceModel: `${vendor} ${modelSpec.displayName}`
      };

      // Add type-specific specifications
      if (inst.channels) specifications.channels = inst.channels;
      if (inst.resolution) specifications.resolution = inst.resolution;
      if (inst.bands) specifications.bands = inst.bands;
      if (inst.resolution_mp) specifications.resolution_mp = inst.resolution_mp;
      if (inst.sensor_size) specifications.sensor_size = inst.sensor_size;
      if (inst.focal_length_mm) specifications.focal_length_mm = inst.focal_length_mm;
      if (inst.spectral_range) specifications.spectral_range = inst.spectral_range;
      if (inst.spectral_resolution) specifications.spectral_resolution = inst.spectral_resolution;

      return {
        instrumentType: inst.type,
        displayName: inst.name,
        normalizedName: `${normalizedName}_${typeCode}${number}`,
        specifications
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
      'RGB Camera': 'RGB',
      'LiDAR': 'LID'
    };
    return typeMap[typeName] || 'INS';
  }
}
