/**
 * Tests for Platform Entity
 *
 * Tests the domain entity for measurement platforms.
 */
import { describe, it, expect } from 'vitest';
import {
  Platform,
  PLATFORM_TYPES,
  ECOSYSTEM_CODES,
  MOUNT_TYPE_PREFIXES
} from '../../src/domain/platform/Platform.js';

describe('Platform Entity', () => {
  const validFixedPlatformProps = {
    id: 1,
    normalizedName: 'SVB_FOR_TWR01',
    displayName: 'Svartberget Forest Platform 1',
    mountTypeCode: 'TWR01',
    stationId: 1,
    stationAcronym: 'SVB',
    platformType: 'fixed',
    ecosystemCode: 'FOR',
    status: 'Active'
  };

  const validUAVPlatformProps = {
    id: 2,
    normalizedName: 'SVB_DJI_M3M_UAV01',
    displayName: 'Svartberget DJI M3M UAV',
    mountTypeCode: 'UAV01',
    stationId: 1,
    stationAcronym: 'SVB',
    platformType: 'uav',
    status: 'Active'
  };

  describe('constants', () => {
    it('should have all platform types', () => {
      expect(PLATFORM_TYPES).toContain('fixed');
      expect(PLATFORM_TYPES).toContain('uav');
      expect(PLATFORM_TYPES).toContain('satellite');
      expect(PLATFORM_TYPES).toContain('mobile');
    });

    it('should have all ecosystem codes', () => {
      expect(ECOSYSTEM_CODES).toContain('FOR');
      expect(ECOSYSTEM_CODES).toContain('AGR');
      expect(ECOSYSTEM_CODES).toContain('GRA');
      expect(ECOSYSTEM_CODES).toContain('MIR');
    });

    it('should have mount type prefixes', () => {
      expect(MOUNT_TYPE_PREFIXES).toHaveProperty('TWR');
      expect(MOUNT_TYPE_PREFIXES).toHaveProperty('BLD');
      expect(MOUNT_TYPE_PREFIXES).toHaveProperty('GND');
      expect(MOUNT_TYPE_PREFIXES).toHaveProperty('UAV');
      expect(MOUNT_TYPE_PREFIXES).toHaveProperty('SAT');
    });

    it('should have correct mount type structure', () => {
      const twr = MOUNT_TYPE_PREFIXES.TWR;
      expect(twr.code).toBe('TWR');
      expect(twr.name).toBe('Tower/Mast');
      expect(twr.platformTypes).toContain('fixed');
    });
  });

  describe('constructor', () => {
    it('should create a fixed platform with valid props', () => {
      const platform = new Platform(validFixedPlatformProps);

      expect(platform.id).toBe(1);
      expect(platform.normalizedName).toBe('SVB_FOR_TWR01');
      expect(platform.platformType).toBe('fixed');
      expect(platform.ecosystemCode).toBe('FOR');
    });

    it('should create a UAV platform without ecosystem', () => {
      const platform = new Platform(validUAVPlatformProps);

      expect(platform.platformType).toBe('uav');
      expect(platform.ecosystemCode).toBeNull();
    });

    it('should set default values', () => {
      const platform = new Platform({
        normalizedName: 'TEST_FOR_PL01',
        displayName: 'Test Platform',
        stationId: 1,
        stationAcronym: 'TEST',
        ecosystemCode: 'FOR'
      });

      expect(platform.status).toBe('Active');
      expect(platform.platformType).toBe('fixed');
      expect(platform.instruments).toEqual([]);
    });
  });

  describe('validation', () => {
    it('should validate on demand', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(() => platform.validate()).not.toThrow();
    });

    it('should reject missing normalized name', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        normalizedName: ''
      });
      expect(() => platform.validate()).toThrow('Normalized name is required');
    });

    it('should reject missing station ID', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        stationId: null
      });
      expect(() => platform.validate()).toThrow('Station ID is required');
    });

    it('should reject invalid platform type', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        platformType: 'invalid'
      });
      expect(() => platform.validate()).toThrow('Invalid platform type');
    });

    it('should require ecosystem for fixed platforms', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        ecosystemCode: null
      });
      expect(() => platform.validate()).toThrow('Ecosystem code is required for fixed platforms');
    });

    it('should reject ecosystem for UAV platforms', () => {
      const platform = new Platform({
        ...validUAVPlatformProps,
        ecosystemCode: 'FOR'
      });
      expect(() => platform.validate()).toThrow('UAV platforms should not have ecosystem code');
    });

    it('should reject invalid ecosystem code', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        ecosystemCode: 'INVALID'
      });
      expect(() => platform.validate()).toThrow('Invalid ecosystem code');
    });
  });

  describe('isActive', () => {
    it('should return true for Active status', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(platform.isActive()).toBe(true);
    });

    it('should return false for Inactive status', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        status: 'Inactive'
      });
      expect(platform.isActive()).toBe(false);
    });
  });

  describe('requiresEcosystem', () => {
    it('should return true for fixed platforms', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(platform.requiresEcosystem()).toBe(true);
    });

    it('should return false for UAV platforms', () => {
      const platform = new Platform(validUAVPlatformProps);
      expect(platform.requiresEcosystem()).toBe(false);
    });
  });

  describe('isAirborne', () => {
    it('should return true for UAV platforms', () => {
      const platform = new Platform(validUAVPlatformProps);
      expect(platform.isAirborne()).toBe(true);
    });

    it('should return false for fixed platforms', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(platform.isAirborne()).toBe(false);
    });
  });

  describe('isSpaceborne', () => {
    it('should return true for satellite platforms', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        platformType: 'satellite',
        ecosystemCode: null,
        normalizedName: 'SVB_ESA_S2A_MSI'
      });
      expect(platform.isSpaceborne()).toBe(true);
    });

    it('should return false for fixed platforms', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(platform.isSpaceborne()).toBe(false);
    });
  });

  describe('getCoordinates', () => {
    it('should return coordinates when available', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        latitude: 64.256,
        longitude: 19.774
      });
      expect(platform.getCoordinates()).toEqual([64.256, 19.774]);
    });

    it('should return null when coordinates not set', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(platform.getCoordinates()).toBeNull();
    });
  });

  describe('getMountTypePrefix', () => {
    it('should extract prefix from mount type code', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(platform.getMountTypePrefix()).toBe('TWR');
    });

    it('should handle UAV mount type', () => {
      const platform = new Platform(validUAVPlatformProps);
      expect(platform.getMountTypePrefix()).toBe('UAV');
    });

    it('should return null for missing mount type code', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        mountTypeCode: null
      });
      expect(platform.getMountTypePrefix()).toBeNull();
    });
  });

  describe('getMountTypeInfo', () => {
    it('should return mount type info', () => {
      const platform = new Platform(validFixedPlatformProps);
      const info = platform.getMountTypeInfo();

      expect(info.code).toBe('TWR');
      expect(info.name).toBe('Tower/Mast');
    });
  });

  describe('isGroundLevel', () => {
    it('should return true for GND mount type', () => {
      const platform = new Platform({
        ...validFixedPlatformProps,
        mountTypeCode: 'GND01'
      });
      expect(platform.isGroundLevel()).toBe(true);
    });

    it('should return false for TWR mount type', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(platform.isGroundLevel()).toBe(false);
    });
  });

  describe('instruments', () => {
    it('should start with empty instruments array', () => {
      const platform = new Platform(validFixedPlatformProps);
      expect(platform.getInstrumentCount()).toBe(0);
    });

    it('should add instruments', () => {
      const platform = new Platform(validFixedPlatformProps);
      platform.addInstrument({ id: 1, name: 'PHE01' });
      platform.addInstrument({ id: 2, name: 'MS01' });

      expect(platform.getInstrumentCount()).toBe(2);
    });
  });

  describe('toJSON', () => {
    it('should convert to plain object with snake_case keys', () => {
      const platform = new Platform(validFixedPlatformProps);
      const json = platform.toJSON();

      expect(json.id).toBe(1);
      expect(json.normalized_name).toBe('SVB_FOR_TWR01');
      expect(json.platform_type).toBe('fixed');
      expect(json.ecosystem_code).toBe('FOR');
      expect(json.mount_type_code).toBe('TWR01');
      expect(json.mount_type_info).toBeDefined();
    });
  });

  describe('fromDatabase', () => {
    it('should create platform from database row', () => {
      const row = {
        id: 1,
        normalized_name: 'SVB_FOR_TWR01',
        display_name: 'Test Platform',
        mount_type_code: 'TWR01',
        station_id: 1,
        station_acronym: 'SVB',
        platform_type: 'fixed',
        ecosystem_code: 'FOR',
        status: 'Active'
      };

      const platform = Platform.fromDatabase(row);

      expect(platform.id).toBe(1);
      expect(platform.normalizedName).toBe('SVB_FOR_TWR01');
      expect(platform.mountTypeCode).toBe('TWR01');
    });

    it('should support legacy location_code column', () => {
      const row = {
        id: 1,
        normalized_name: 'SVB_FOR_TWR01',
        display_name: 'Test Platform',
        location_code: 'TWR01', // legacy column
        station_id: 1,
        station_acronym: 'SVB',
        platform_type: 'fixed',
        ecosystem_code: 'FOR'
      };

      const platform = Platform.fromDatabase(row);
      expect(platform.mountTypeCode).toBe('TWR01');
    });
  });
});
