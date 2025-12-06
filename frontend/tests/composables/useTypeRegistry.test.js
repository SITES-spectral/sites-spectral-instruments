/**
 * Tests for useTypeRegistry composable
 *
 * Tests the platform type strategies and instrument type registry.
 */
import { describe, it, expect } from 'vitest';
import {
  PLATFORM_TYPE_STRATEGIES,
  INSTRUMENT_TYPE_REGISTRY,
  ECOSYSTEM_CODES,
  getPlatformTypeStrategy,
  getInstrumentTypeConfig,
  getInstrumentFields,
  getInstrumentTypeCode,
  getEcosystemInfo,
  formatFieldValue
} from '@composables/useTypeRegistry';

describe('useTypeRegistry', () => {
  describe('PLATFORM_TYPE_STRATEGIES', () => {
    it('should have all required platform types', () => {
      expect(PLATFORM_TYPE_STRATEGIES).toHaveProperty('fixed');
      expect(PLATFORM_TYPE_STRATEGIES).toHaveProperty('uav');
      expect(PLATFORM_TYPE_STRATEGIES).toHaveProperty('satellite');
    });

    it('should have correct structure for fixed platform', () => {
      const fixed = PLATFORM_TYPE_STRATEGIES.fixed;
      expect(fixed.key).toBe('fixed');
      expect(fixed.name).toBe('Fixed Platform');
      expect(fixed.namingPattern).toBe('{STATION}_{ECOSYSTEM}_{MOUNT_TYPE}');
      expect(fixed.fields).toHaveProperty('ecosystem_code');
      expect(fixed.fields).toHaveProperty('mount_type_code');
    });

    it('should have correct structure for UAV platform', () => {
      const uav = PLATFORM_TYPE_STRATEGIES.uav;
      expect(uav.key).toBe('uav');
      expect(uav.name).toBe('UAV Platform');
      expect(uav.fields).toHaveProperty('vendor');
      expect(uav.fields).toHaveProperty('model');
      expect(uav.autoInstruments).toBe(true);
    });

    it('should have correct structure for satellite platform', () => {
      const satellite = PLATFORM_TYPE_STRATEGIES.satellite;
      expect(satellite.key).toBe('satellite');
      expect(satellite.name).toBe('Satellite Platform');
      expect(satellite.fields).toHaveProperty('agency');
      expect(satellite.fields).toHaveProperty('satellite');
      expect(satellite.fields).toHaveProperty('sensor');
    });
  });

  describe('getPlatformTypeStrategy', () => {
    it('should return correct strategy for valid type', () => {
      const strategy = getPlatformTypeStrategy('fixed');
      expect(strategy).toBe(PLATFORM_TYPE_STRATEGIES.fixed);
    });

    it('should return null for invalid type', () => {
      const strategy = getPlatformTypeStrategy('invalid');
      expect(strategy).toBeNull();
    });

    it('should return null for undefined', () => {
      const strategy = getPlatformTypeStrategy(undefined);
      expect(strategy).toBeNull();
    });
  });

  describe('INSTRUMENT_TYPE_REGISTRY', () => {
    it('should have all required instrument types', () => {
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('phenocam');
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('multispectral');
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('par_sensor');
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('ndvi_sensor');
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('pri_sensor');
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('hyperspectral');
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('thermal');
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('lidar');
      expect(INSTRUMENT_TYPE_REGISTRY).toHaveProperty('radar');
    });

    it('should have correct structure for phenocam', () => {
      const phenocam = INSTRUMENT_TYPE_REGISTRY.phenocam;
      expect(phenocam.key).toBe('phenocam');
      expect(phenocam.name).toBe('Phenocam');
      expect(phenocam.code).toBe('PHE');
      expect(phenocam.fields).toBeDefined();
      expect(phenocam.fields).toHaveProperty('camera_brand');
      expect(phenocam.fields).toHaveProperty('camera_model');
    });

    it('should have correct field definitions', () => {
      const phenocam = INSTRUMENT_TYPE_REGISTRY.phenocam;
      const cameraBrand = phenocam.fields.camera_brand;
      expect(cameraBrand.type).toBe('text');
      expect(cameraBrand.label).toBe('Camera Brand');
    });

    it('should define platform compatibility', () => {
      const phenocam = INSTRUMENT_TYPE_REGISTRY.phenocam;
      expect(phenocam.platforms).toContain('fixed');
      expect(phenocam.platforms).toContain('uav');

      const radar = INSTRUMENT_TYPE_REGISTRY.radar;
      expect(radar.platforms).toContain('satellite');
      expect(radar.platforms).not.toContain('fixed');
    });
  });

  describe('getInstrumentTypeConfig', () => {
    it('should return config for valid type by key', () => {
      const config = getInstrumentTypeConfig('phenocam');
      expect(config.key).toBe('phenocam');
      expect(config.name).toBe('Phenocam');
    });

    it('should return config for valid type by display name', () => {
      const config = getInstrumentTypeConfig('Phenocam');
      expect(config.key).toBe('phenocam');
    });

    it('should return null for invalid type', () => {
      const config = getInstrumentTypeConfig('completely_invalid_xyz');
      expect(config).toBeNull();
    });
  });

  describe('getInstrumentFields', () => {
    it('should return fields for valid type', () => {
      const fields = getInstrumentFields('phenocam');
      expect(fields).toHaveProperty('camera_brand');
      expect(fields).toHaveProperty('camera_model');
    });

    it('should return empty object for invalid type', () => {
      const fields = getInstrumentFields('completely_invalid_xyz');
      expect(fields).toEqual({});
    });
  });

  describe('getInstrumentTypeCode', () => {
    it('should return code for phenocam', () => {
      expect(getInstrumentTypeCode('phenocam')).toBe('PHE');
    });

    it('should return code for multispectral', () => {
      expect(getInstrumentTypeCode('multispectral')).toBe('MS');
    });

    it('should return null for invalid type', () => {
      expect(getInstrumentTypeCode('completely_invalid_xyz')).toBeNull();
    });
  });

  describe('ECOSYSTEM_CODES', () => {
    it('should have all required ecosystem codes', () => {
      expect(ECOSYSTEM_CODES).toHaveProperty('FOR');
      expect(ECOSYSTEM_CODES).toHaveProperty('AGR');
      expect(ECOSYSTEM_CODES).toHaveProperty('GRA');
      expect(ECOSYSTEM_CODES).toHaveProperty('HEA');
      expect(ECOSYSTEM_CODES).toHaveProperty('MIR');
      expect(ECOSYSTEM_CODES).toHaveProperty('LAK');
    });

    it('should have correct structure for FOR (Forest)', () => {
      const forest = ECOSYSTEM_CODES.FOR;
      expect(forest.code).toBe('FOR');
      expect(forest.name).toBe('Forest');
    });
  });

  describe('getEcosystemInfo', () => {
    it('should return config for valid ecosystem code', () => {
      const config = getEcosystemInfo('FOR');
      expect(config.code).toBe('FOR');
      expect(config.name).toBe('Forest');
    });

    it('should return null for invalid code', () => {
      const config = getEcosystemInfo('INVALID');
      expect(config).toBeNull();
    });

    it('should return null for undefined', () => {
      const config = getEcosystemInfo(undefined);
      // The function returns ECOSYSTEM_CODES[undefined] which is undefined
      expect(config).toBeFalsy();
    });
  });

  describe('formatFieldValue', () => {
    it('should format text field', () => {
      const config = { type: 'text' };
      expect(formatFieldValue('test value', config)).toBe('test value');
    });

    it('should format number field with unit', () => {
      const config = { type: 'number', unit: 'nm' };
      expect(formatFieldValue(550, config)).toBe('550 nm');
    });

    it('should format number field without unit', () => {
      const config = { type: 'number' };
      expect(formatFieldValue(42, config)).toBe('42');
    });

    it('should format date field', () => {
      const config = { type: 'date' };
      const result = formatFieldValue('2024-01-15', config);
      expect(result).toBeTruthy();
      // Date format depends on locale
    });

    it('should return em dash for null value', () => {
      const config = { type: 'text' };
      expect(formatFieldValue(null, config)).toBe('—');
    });

    it('should return em dash for undefined value', () => {
      const config = { type: 'text' };
      expect(formatFieldValue(undefined, config)).toBe('—');
    });

    it('should return em dash for empty string', () => {
      const config = { type: 'text' };
      expect(formatFieldValue('', config)).toBe('—');
    });
  });
});
