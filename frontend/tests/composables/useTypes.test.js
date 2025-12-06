/**
 * Tests for useTypes composable
 *
 * Tests status configurations and type helpers.
 */
import { describe, it, expect } from 'vitest';
import {
  STATUS_TYPES,
  MEASUREMENT_STATUS,
  PLATFORM_TYPES,
  INSTRUMENT_TYPES,
  MOUNT_TYPES,
  getStatus,
  getMeasurementStatus,
  getPlatformType,
  getInstrumentType,
  getMountType
} from '@composables/useTypes';

describe('useTypes', () => {
  describe('STATUS_TYPES', () => {
    it('should have all required statuses', () => {
      expect(STATUS_TYPES).toHaveProperty('Active');
      expect(STATUS_TYPES).toHaveProperty('Inactive');
      expect(STATUS_TYPES).toHaveProperty('Maintenance');
      expect(STATUS_TYPES).toHaveProperty('Decommissioned');
    });

    it('should have correct structure for Active status', () => {
      const active = STATUS_TYPES.Active;
      expect(active.name).toBe('Active');
      expect(active.badgeClass).toContain('badge-success');
      expect(active.textClass).toContain('text-success');
    });

    it('should have correct structure for Inactive status', () => {
      const inactive = STATUS_TYPES.Inactive;
      expect(inactive.name).toBe('Inactive');
      expect(inactive.badgeClass).toContain('badge-warning');
    });

    it('should have correct structure for Maintenance status', () => {
      const maintenance = STATUS_TYPES.Maintenance;
      expect(maintenance.name).toBe('Maintenance');
      expect(maintenance.badgeClass).toContain('badge-info');
    });

    it('should have correct structure for Decommissioned status', () => {
      const decom = STATUS_TYPES.Decommissioned;
      expect(decom.name).toBe('Decommissioned');
      expect(decom.badgeClass).toContain('badge-error');
    });
  });

  describe('MEASUREMENT_STATUS', () => {
    it('should have all required measurement statuses', () => {
      expect(MEASUREMENT_STATUS).toHaveProperty('Operational');
      expect(MEASUREMENT_STATUS).toHaveProperty('Degraded');
      expect(MEASUREMENT_STATUS).toHaveProperty('Failed');
      expect(MEASUREMENT_STATUS).toHaveProperty('Unknown');
    });

    it('should have correct structure for Operational', () => {
      const operational = MEASUREMENT_STATUS.Operational;
      expect(operational.name).toBe('Operational');
      expect(operational.dotClass).toContain('bg-success');
    });

    it('should have correct structure for Failed', () => {
      const failed = MEASUREMENT_STATUS.Failed;
      expect(failed.name).toBe('Failed');
      expect(failed.dotClass).toContain('bg-error');
    });
  });

  describe('PLATFORM_TYPES', () => {
    it('should have all required platform types', () => {
      expect(PLATFORM_TYPES).toHaveProperty('fixed');
      expect(PLATFORM_TYPES).toHaveProperty('uav');
      expect(PLATFORM_TYPES).toHaveProperty('satellite');
    });

    it('should have correct structure for fixed platform', () => {
      const fixed = PLATFORM_TYPES.fixed;
      expect(fixed.key).toBe('fixed');
      expect(fixed.name).toBe('Fixed');
      expect(fixed.badgeClass).toBe('badge-info');
    });
  });

  describe('MOUNT_TYPES', () => {
    it('should have all required mount types', () => {
      expect(MOUNT_TYPES).toHaveProperty('PL');
      expect(MOUNT_TYPES).toHaveProperty('BL');
      expect(MOUNT_TYPES).toHaveProperty('GL');
      expect(MOUNT_TYPES).toHaveProperty('UAV');
      expect(MOUNT_TYPES).toHaveProperty('SAT');
    });

    it('should have correct structure for PL mount type', () => {
      const pl = MOUNT_TYPES.PL;
      expect(pl.code).toBe('PL');
      expect(pl.name).toBe('Pole/Tower/Mast');
    });
  });

  describe('getStatus', () => {
    it('should return config for valid status', () => {
      const config = getStatus('Active');
      expect(config.name).toBe('Active');
      expect(config.badgeClass).toBeDefined();
    });

    it('should return default config for invalid status', () => {
      const config = getStatus('Invalid');
      expect(config).toBeDefined();
      // Returns default Active
      expect(config.name).toBe('Active');
    });
  });

  describe('getMeasurementStatus', () => {
    it('should return config for valid measurement status', () => {
      const config = getMeasurementStatus('Operational');
      expect(config.name).toBe('Operational');
      expect(config.dotClass).toBeDefined();
    });

    it('should return Unknown for invalid status', () => {
      const config = getMeasurementStatus('Invalid');
      expect(config.name).toBe('Unknown');
    });
  });

  describe('getPlatformType', () => {
    it('should return config for valid platform type', () => {
      const config = getPlatformType('fixed');
      expect(config.key).toBe('fixed');
      expect(config.name).toBe('Fixed');
    });

    it('should return fixed as default for invalid type', () => {
      const config = getPlatformType('invalid');
      expect(config.key).toBe('fixed');
    });
  });

  describe('getInstrumentType', () => {
    it('should return config for phenocam', () => {
      const config = getInstrumentType('phenocam');
      expect(config.key).toBe('phenocam');
      expect(config.name).toBe('Phenocam');
      expect(config.code).toBe('PHE');
    });

    it('should match by name containing type', () => {
      const config = getInstrumentType('Multispectral Sensor');
      expect(config.key).toBe('multispectral');
    });

    it('should return default for unknown type', () => {
      const config = getInstrumentType('Unknown Sensor');
      expect(config.key).toBe('unknown');
    });

    it('should return null for null input', () => {
      const config = getInstrumentType(null);
      expect(config).toBeNull();
    });
  });

  describe('getMountType', () => {
    it('should return config for valid mount type code', () => {
      const config = getMountType('PL01');
      expect(config.code).toBe('PL');
      expect(config.name).toBe('Pole/Tower/Mast');
    });

    it('should return config for prefix only', () => {
      const config = getMountType('UAV');
      expect(config.code).toBe('UAV');
    });

    it('should return null for null input', () => {
      const config = getMountType(null);
      expect(config).toBeNull();
    });
  });
});
