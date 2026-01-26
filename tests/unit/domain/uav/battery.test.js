/**
 * UAV Battery Entity Tests
 * Tests for battery lifecycle, health tracking, and status management
 */

import { describe, it, expect } from 'vitest';
import { Battery, BATTERY_STATUSES, BATTERY_CHEMISTRIES } from '../../../../src/domain/uav/Battery.js';

describe('Battery Entity', () => {
  // Valid battery data for testing
  const validBatteryData = {
    serial_number: 'DJI-TB30-001234',
    display_name: 'Battery 1 (Main)',
    manufacturer: 'DJI',
    model: 'TB30',
    capacity_mah: 5000,
    cell_count: 4,
    chemistry: 'LiPo',
    station_id: 1,
    platform_id: 5,
    purchase_date: '2025-06-01',
    first_use_date: '2025-06-15',
    last_use_date: '2026-01-20',
    cycle_count: 45,
    health_percent: 92,
    internal_resistance_mohm: 12,
    last_health_check_date: '2026-01-15',
    status: 'available'
  };

  describe('Constructor & Validation', () => {
    it('should create battery with valid data', () => {
      const battery = new Battery(validBatteryData);

      expect(battery.serial_number).toBe('DJI-TB30-001234');
      expect(battery.manufacturer).toBe('DJI');
      expect(battery.model).toBe('TB30');
      expect(battery.status).toBe('available');
    });

    it('should throw error for missing serial_number', () => {
      expect(() => new Battery({ ...validBatteryData, serial_number: '' }))
        .toThrow('Battery serial number is required');
    });

    it('should throw error for invalid status', () => {
      expect(() => new Battery({ ...validBatteryData, status: 'INVALID' }))
        .toThrow('Invalid status');
    });

    it('should throw error for invalid chemistry', () => {
      expect(() => new Battery({ ...validBatteryData, chemistry: 'INVALID' }))
        .toThrow('Invalid chemistry');
    });

    it('should throw error for invalid health_percent (negative)', () => {
      expect(() => new Battery({ ...validBatteryData, health_percent: -5 }))
        .toThrow('Health percent must be between 0 and 100');
    });

    it('should throw error for invalid health_percent (over 100)', () => {
      expect(() => new Battery({ ...validBatteryData, health_percent: 105 }))
        .toThrow('Health percent must be between 0 and 100');
    });

    it('should throw error for negative cycle_count', () => {
      expect(() => new Battery({ ...validBatteryData, cycle_count: -1 }))
        .toThrow('Cycle count cannot be negative');
    });

    it('should default status to available', () => {
      const battery = new Battery({ serial_number: 'TEST-001' });
      expect(battery.status).toBe('available');
    });

    it('should default cycle_count to 0', () => {
      const battery = new Battery({ serial_number: 'TEST-001' });
      expect(battery.cycle_count).toBe(0);
    });

    it('should default health_percent to 100', () => {
      const battery = new Battery({ serial_number: 'TEST-001' });
      expect(battery.health_percent).toBe(100);
    });
  });

  describe('Status Checks', () => {
    it('should identify available battery', () => {
      const battery = new Battery(validBatteryData);
      expect(battery.isAvailable()).toBe(true);
      expect(battery.isInUse()).toBe(false);
    });

    it('should identify battery in use', () => {
      const battery = new Battery({ ...validBatteryData, status: 'in_use' });
      expect(battery.isInUse()).toBe(true);
      expect(battery.isAvailable()).toBe(false);
    });

    it('should identify retired battery', () => {
      const retired = new Battery({ ...validBatteryData, status: 'retired' });
      expect(retired.isRetired()).toBe(true);

      const damaged = new Battery({ ...validBatteryData, status: 'damaged' });
      expect(damaged.isRetired()).toBe(true);
    });

    it('should not flag active battery as retired', () => {
      const battery = new Battery(validBatteryData);
      expect(battery.isRetired()).toBe(false);
    });
  });

  describe('Health Checks', () => {
    it('should identify battery needing health check (no check date)', () => {
      const battery = new Battery({
        ...validBatteryData,
        last_health_check_date: null
      });
      expect(battery.needsHealthCheck()).toBe(true);
    });

    it('should identify battery needing health check (old check)', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45); // 45 days ago

      const battery = new Battery({
        ...validBatteryData,
        last_health_check_date: oldDate.toISOString().split('T')[0]
      });
      expect(battery.needsHealthCheck()).toBe(true);
      expect(battery.needsHealthCheck(60)).toBe(false); // Custom threshold
    });

    it('should not flag recently checked battery', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

      const battery = new Battery({
        ...validBatteryData,
        last_health_check_date: recentDate.toISOString().split('T')[0]
      });
      expect(battery.needsHealthCheck()).toBe(false);
    });

    it('should identify low health battery', () => {
      const battery = new Battery({ ...validBatteryData, health_percent: 75 });
      expect(battery.hasLowHealth()).toBe(true);
      expect(battery.hasLowHealth(70)).toBe(false); // Custom threshold
    });

    it('should not flag healthy battery', () => {
      const battery = new Battery(validBatteryData);
      expect(battery.hasLowHealth()).toBe(false);
    });
  });

  describe('Age Calculations', () => {
    it('should calculate battery age in days', () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 100); // 100 days ago

      const battery = new Battery({
        ...validBatteryData,
        purchase_date: purchaseDate.toISOString().split('T')[0]
      });

      const age = battery.getAgeInDays();
      expect(age).toBeGreaterThanOrEqual(99);
      expect(age).toBeLessThanOrEqual(101);
    });

    it('should return null for unknown purchase date', () => {
      const battery = new Battery({
        ...validBatteryData,
        purchase_date: null
      });
      expect(battery.getAgeInDays()).toBeNull();
    });

    it('should calculate days since last use', () => {
      const lastUse = new Date();
      lastUse.setDate(lastUse.getDate() - 5); // 5 days ago

      const battery = new Battery({
        ...validBatteryData,
        last_use_date: lastUse.toISOString().split('T')[0]
      });

      const days = battery.getDaysSinceLastUse();
      expect(days).toBeGreaterThanOrEqual(4);
      expect(days).toBeLessThanOrEqual(6);
    });
  });

  describe('Cell Configuration', () => {
    it('should return cell configuration string', () => {
      const battery = new Battery(validBatteryData);
      expect(battery.getCellConfiguration()).toBe('4S');
    });

    it('should return null for unknown cell count', () => {
      const battery = new Battery({
        ...validBatteryData,
        cell_count: null
      });
      expect(battery.getCellConfiguration()).toBeNull();
    });
  });

  describe('Status Transitions', () => {
    it('should mark battery as in use', () => {
      const battery = new Battery(validBatteryData);
      battery.markInUse();
      expect(battery.status).toBe('in_use');
    });

    it('should not mark retired battery as in use', () => {
      const battery = new Battery({ ...validBatteryData, status: 'retired' });
      expect(() => battery.markInUse()).toThrow('Cannot use a retired or damaged battery');
    });

    it('should mark battery as available', () => {
      const battery = new Battery({ ...validBatteryData, status: 'in_use' });
      battery.markAvailable();
      expect(battery.status).toBe('available');
    });

    it('should not mark retired battery as available', () => {
      const battery = new Battery({ ...validBatteryData, status: 'retired' });
      expect(() => battery.markAvailable()).toThrow('Cannot mark retired or damaged battery as available');
    });

    it('should put battery in storage', () => {
      const battery = new Battery(validBatteryData);
      battery.putInStorage(3.85);
      expect(battery.status).toBe('storage');
      expect(battery.storage_voltage_v).toBe(3.85);
    });

    it('should retire battery with reason', () => {
      const battery = new Battery(validBatteryData);
      battery.retire('End of life');
      expect(battery.status).toBe('retired');
      expect(battery.notes).toContain('Retired: End of life');
    });

    it('should mark battery as damaged', () => {
      const battery = new Battery(validBatteryData);
      battery.markDamaged('Swollen cells');
      expect(battery.status).toBe('damaged');
      expect(battery.notes).toContain('Damaged: Swollen cells');
    });
  });

  describe('Health Recording', () => {
    it('should record health check', () => {
      const battery = new Battery(validBatteryData);
      battery.recordHealthCheck(85, 15);

      expect(battery.health_percent).toBe(85);
      expect(battery.internal_resistance_mohm).toBe(15);
      expect(battery.last_health_check_date).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should throw for invalid health percent', () => {
      const battery = new Battery(validBatteryData);
      expect(() => battery.recordHealthCheck(110)).toThrow('Health percent must be between 0 and 100');
    });
  });

  describe('Cycle Tracking', () => {
    it('should increment cycle count', () => {
      const battery = new Battery(validBatteryData);
      const initialCount = battery.cycle_count;

      battery.incrementCycle();

      expect(battery.cycle_count).toBe(initialCount + 1);
      expect(battery.last_use_date).toBe(new Date().toISOString().split('T')[0]);
    });
  });

  describe('Serialization', () => {
    it('should convert to database record format', () => {
      const battery = new Battery(validBatteryData);
      const record = battery.toRecord();

      expect(record.serial_number).toBe('DJI-TB30-001234');
      expect(record.station_id).toBe(1);
      expect(record.cycle_count).toBe(45);
    });

    it('should convert to JSON with computed fields', () => {
      const battery = new Battery(validBatteryData);
      const json = battery.toJSON();

      expect(json.is_available).toBe(true);
      expect(json.is_retired).toBe(false);
      expect(json.needs_health_check).toBeDefined();
      expect(json.has_low_health).toBe(false);
      expect(json.cell_configuration).toBe('4S');
    });

    it('should create from database record', () => {
      const record = {
        id: 1,
        serial_number: 'TEST-001',
        status: 'available',
        cycle_count: 10
      };

      const battery = Battery.fromRecord(record);

      expect(battery.id).toBe(1);
      expect(battery.serial_number).toBe('TEST-001');
      expect(battery.cycle_count).toBe(10);
    });
  });

  describe('Constants', () => {
    it('should export valid battery statuses', () => {
      expect(BATTERY_STATUSES).toContain('available');
      expect(BATTERY_STATUSES).toContain('in_use');
      expect(BATTERY_STATUSES).toContain('charging');
      expect(BATTERY_STATUSES).toContain('storage');
      expect(BATTERY_STATUSES).toContain('maintenance');
      expect(BATTERY_STATUSES).toContain('retired');
      expect(BATTERY_STATUSES).toContain('damaged');
    });

    it('should export valid battery chemistries', () => {
      expect(BATTERY_CHEMISTRIES).toContain('LiPo');
      expect(BATTERY_CHEMISTRIES).toContain('LiHV');
      expect(BATTERY_CHEMISTRIES).toContain('LiIon');
      expect(BATTERY_CHEMISTRIES).toContain('other');
    });
  });
});
