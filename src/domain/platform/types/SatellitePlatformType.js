/**
 * Satellite Platform Type Strategy
 *
 * Handles satellite/spaceborne platforms for Earth observation.
 * Naming convention: {STATION}_{AGENCY}_{SATELLITE}_{SENSOR}
 * Example: SVB_ESA_S2A_MSI, ANS_NASA_LANDSAT9_OLI
 *
 * Mount Type Code: SAT## (virtual position identifier)
 * NO ecosystem code in satellite platform names.
 *
 * @module domain/platform/types/SatellitePlatformType
 */

import { PlatformTypeStrategy } from './PlatformTypeStrategy.js';

/**
 * Known satellite agencies and their satellites with sensor specifications
 */
export const SATELLITE_SPECIFICATIONS = {
  ESA: {
    displayName: 'European Space Agency',
    satellites: {
      S2A: {
        displayName: 'Sentinel-2A',
        sensors: {
          MSI: {
            displayName: 'MultiSpectral Instrument',
            type: 'Multispectral Sensor',
            bands: 13,
            resolution: '10-60m'
          }
        }
      },
      S2B: {
        displayName: 'Sentinel-2B',
        sensors: {
          MSI: {
            displayName: 'MultiSpectral Instrument',
            type: 'Multispectral Sensor',
            bands: 13,
            resolution: '10-60m'
          }
        }
      },
      S3A: {
        displayName: 'Sentinel-3A',
        sensors: {
          OLCI: {
            displayName: 'Ocean and Land Colour Instrument',
            type: 'Multispectral Sensor',
            bands: 21,
            resolution: '300m'
          },
          SLSTR: {
            displayName: 'Sea and Land Surface Temperature Radiometer',
            type: 'Thermal Camera',
            bands: 11,
            resolution: '500m-1km'
          }
        }
      },
      S3B: {
        displayName: 'Sentinel-3B',
        sensors: {
          OLCI: {
            displayName: 'Ocean and Land Colour Instrument',
            type: 'Multispectral Sensor',
            bands: 21,
            resolution: '300m'
          },
          SLSTR: {
            displayName: 'Sea and Land Surface Temperature Radiometer',
            type: 'Thermal Camera',
            bands: 11,
            resolution: '500m-1km'
          }
        }
      },
      S1A: {
        displayName: 'Sentinel-1A',
        sensors: {
          SAR: {
            displayName: 'Synthetic Aperture Radar',
            type: 'Radar (SAR)',
            mode: 'C-band',
            resolution: '5-40m'
          }
        }
      }
    }
  },
  NASA: {
    displayName: 'National Aeronautics and Space Administration',
    satellites: {
      LANDSAT8: {
        displayName: 'Landsat 8',
        sensors: {
          OLI: {
            displayName: 'Operational Land Imager',
            type: 'Multispectral Sensor',
            bands: 9,
            resolution: '15-30m'
          },
          TIRS: {
            displayName: 'Thermal Infrared Sensor',
            type: 'Thermal Camera',
            bands: 2,
            resolution: '100m'
          }
        }
      },
      LANDSAT9: {
        displayName: 'Landsat 9',
        sensors: {
          OLI2: {
            displayName: 'Operational Land Imager 2',
            type: 'Multispectral Sensor',
            bands: 9,
            resolution: '15-30m'
          },
          TIRS2: {
            displayName: 'Thermal Infrared Sensor 2',
            type: 'Thermal Camera',
            bands: 2,
            resolution: '100m'
          }
        }
      },
      MODIS_TERRA: {
        displayName: 'Terra (MODIS)',
        sensors: {
          MODIS: {
            displayName: 'Moderate Resolution Imaging Spectroradiometer',
            type: 'Multispectral Sensor',
            bands: 36,
            resolution: '250m-1km'
          }
        }
      },
      MODIS_AQUA: {
        displayName: 'Aqua (MODIS)',
        sensors: {
          MODIS: {
            displayName: 'Moderate Resolution Imaging Spectroradiometer',
            type: 'Multispectral Sensor',
            bands: 36,
            resolution: '250m-1km'
          }
        }
      }
    }
  },
  PLANET: {
    displayName: 'Planet Labs',
    satellites: {
      PLANETSCOPE: {
        displayName: 'PlanetScope',
        sensors: {
          PS2: {
            displayName: 'PlanetScope Camera',
            type: 'Multispectral Sensor',
            bands: 4,
            resolution: '3m'
          }
        }
      },
      SKYSAT: {
        displayName: 'SkySat',
        sensors: {
          SKYSAT: {
            displayName: 'SkySat Camera',
            type: 'Multispectral Sensor',
            bands: 4,
            resolution: '0.5-0.8m'
          }
        }
      }
    }
  }
};

export class SatellitePlatformType extends PlatformTypeStrategy {
  /**
   * Get the platform type code
   * @returns {string}
   */
  getTypeCode() {
    return 'satellite';
  }

  /**
   * Get the display name
   * @returns {string}
   */
  getDisplayName() {
    return 'Satellite Platform';
  }

  /**
   * Generate normalized name
   * Pattern: {STATION}_{AGENCY}_{SATELLITE}_{SENSOR}
   * @param {Object} context - Naming context
   * @returns {string}
   */
  generateNormalizedName(context) {
    const { stationAcronym, agency, satellite, sensor } = context;

    if (!stationAcronym) {
      throw new Error('Station acronym is required for satellite platform naming');
    }
    if (!agency) {
      throw new Error('Agency is required for satellite platform naming');
    }
    if (!satellite) {
      throw new Error('Satellite is required for satellite platform naming');
    }
    if (!sensor) {
      throw new Error('Sensor is required for satellite platform naming');
    }

    return `${stationAcronym}_${agency}_${satellite}_${sensor}`;
  }

  /**
   * Get required fields
   * @returns {string[]}
   */
  getRequiredFields() {
    return ['stationId', 'displayName', 'agency', 'satellite', 'sensor'];
  }

  /**
   * Satellite platforms do NOT require ecosystem
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
    const agencies = Object.keys(SATELLITE_SPECIFICATIONS);

    return [
      {
        name: 'agency',
        label: 'Space Agency',
        type: 'select',
        required: true,
        options: agencies.map(a => ({
          value: a,
          label: SATELLITE_SPECIFICATIONS[a].displayName
        })),
        helpText: 'Space agency operating the satellite'
      },
      {
        name: 'satellite',
        label: 'Satellite',
        type: 'select',
        required: true,
        dependsOn: 'agency',
        getOptions: (agency) => {
          if (!agency || !SATELLITE_SPECIFICATIONS[agency]) return [];
          return Object.entries(SATELLITE_SPECIFICATIONS[agency].satellites).map(([code, spec]) => ({
            value: code,
            label: spec.displayName
          }));
        },
        helpText: 'Satellite mission'
      },
      {
        name: 'sensor',
        label: 'Sensor',
        type: 'select',
        required: true,
        dependsOn: ['agency', 'satellite'],
        getOptions: (agency, satellite) => {
          if (!agency || !satellite) return [];
          const agencySpec = SATELLITE_SPECIFICATIONS[agency];
          if (!agencySpec) return [];
          const satSpec = agencySpec.satellites[satellite];
          if (!satSpec) return [];
          return Object.entries(satSpec.sensors).map(([code, spec]) => ({
            value: code,
            label: `${spec.displayName} (${spec.resolution})`
          }));
        },
        helpText: 'Sensor/instrument on the satellite'
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        required: false,
        helpText: 'Notes about satellite data usage at this station'
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

    if (!data.agency) {
      errors.push('Space agency is required');
    } else if (!SATELLITE_SPECIFICATIONS[data.agency]) {
      errors.push(`Unknown agency: ${data.agency}. Known agencies: ${Object.keys(SATELLITE_SPECIFICATIONS).join(', ')}`);
    }

    if (!data.satellite) {
      errors.push('Satellite is required');
    } else if (data.agency) {
      const agencySpec = SATELLITE_SPECIFICATIONS[data.agency];
      if (agencySpec && !agencySpec.satellites[data.satellite]) {
        errors.push(`Unknown satellite for ${data.agency}: ${data.satellite}`);
      }
    }

    if (!data.sensor) {
      errors.push('Sensor is required');
    } else if (data.agency && data.satellite) {
      const agencySpec = SATELLITE_SPECIFICATIONS[data.agency];
      const satSpec = agencySpec?.satellites[data.satellite];
      if (satSpec && !satSpec.sensors[data.sensor]) {
        errors.push(`Unknown sensor for ${data.satellite}: ${data.sensor}`);
      }
    }

    // Satellite platforms should NOT have ecosystem code
    if (data.ecosystemCode) {
      errors.push('Satellite platforms should not have ecosystem code');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Satellite platforms auto-create one instrument (the sensor)
   * @returns {boolean}
   */
  autoCreatesInstruments() {
    return true;
  }

  /**
   * Get auto-created instrument for this satellite sensor
   * @param {Object} platformData - Platform data
   * @returns {Object[]} Array with single instrument data
   */
  getAutoCreatedInstruments(platformData) {
    const { agency, satellite, sensor, normalizedName } = platformData;

    if (!agency || !satellite || !sensor) return [];

    const agencySpec = SATELLITE_SPECIFICATIONS[agency];
    if (!agencySpec) return [];

    const satSpec = agencySpec.satellites[satellite];
    if (!satSpec) return [];

    const sensorSpec = satSpec.sensors[sensor];
    if (!sensorSpec) return [];

    const typeCode = this._getInstrumentTypeCode(sensorSpec.type);

    return [{
      instrumentType: sensorSpec.type,
      displayName: sensorSpec.displayName,
      normalizedName: `${normalizedName}_${typeCode}01`,
      specifications: {
        bands: sensorSpec.bands,
        resolution: sensorSpec.resolution,
        mode: sensorSpec.mode,
        autoCreated: true,
        satellite: satSpec.displayName,
        agency: agencySpec.displayName
      }
    }];
  }

  /**
   * Get instrument type code from type name
   * @private
   * @param {string} typeName - Instrument type name
   * @returns {string} Type code
   */
  _getInstrumentTypeCode(typeName) {
    const typeMap = {
      'Multispectral Sensor': 'MS',
      'Hyperspectral Sensor': 'HYP',
      'Thermal Camera': 'TIR',
      'Radar (SAR)': 'SAR'
    };
    return typeMap[typeName] || 'INS';
  }
}
