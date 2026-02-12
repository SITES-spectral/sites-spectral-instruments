/**
 * Station Internal Authorization Tests
 *
 * Tests for the station-internal role which provides:
 * - Station-scoped read-only access (NOT global read)
 * - Magic link authentication support
 *
 * AUTH-001: Fix station-internal role falling back to readonly (global access)
 *
 * @version 15.6.3
 */

import { describe, it, expect } from 'vitest';
import { Role, User, AuthorizationService } from '../../src/domain/authorization/index.js';

describe('Station Internal Authorization (AUTH-001 Fix)', () => {
  describe('Role.isStationInternal()', () => {
    it('should return true for station-internal role', () => {
      const role = new Role('station-internal');
      expect(role.isStationInternal()).toBe(true);
    });

    it('should return false for readonly role', () => {
      const role = new Role('readonly');
      expect(role.isStationInternal()).toBe(false);
    });

    it('should return false for station role', () => {
      const role = new Role('station');
      expect(role.isStationInternal()).toBe(false);
    });
  });

  describe('User.isStationInternal()', () => {
    it('should return true for station-internal user', () => {
      const user = new User({
        username: 'svb-internal',
        role: 'station-internal',
        stationId: 1,
        stationAcronym: 'SVB',
        stationNormalizedName: 'svartberget'
      });
      expect(user.isStationInternal()).toBe(true);
    });

    it('should return false for readonly user', () => {
      const user = new User({
        username: 'viewer',
        role: 'readonly'
      });
      expect(user.isStationInternal()).toBe(false);
    });

    it('should return false for station user', () => {
      const user = new User({
        username: 'svartberget',
        role: 'station',
        stationId: 1,
        stationAcronym: 'SVB'
      });
      expect(user.isStationInternal()).toBe(false);
    });
  });

  describe('Station Internal Access (CRITICAL - Station Scoped)', () => {
    const svbInternal = new User({
      username: 'svb-internal',
      role: 'station-internal',
      stationId: 1,
      stationAcronym: 'SVB',
      stationNormalizedName: 'svartberget'
    });

    it('should allow access to own station by ID', () => {
      expect(svbInternal.hasAccessToStation(1)).toBe(true);
    });

    it('should allow access to own station by acronym', () => {
      expect(svbInternal.hasAccessToStation('SVB')).toBe(true);
    });

    it('should allow access to own station by normalized name', () => {
      expect(svbInternal.hasAccessToStation('svartberget')).toBe(true);
    });

    it('should DENY access to other stations (CRITICAL FIX)', () => {
      expect(svbInternal.hasAccessToStation('lonnstorp')).toBe(false);
      expect(svbInternal.hasAccessToStation('LON')).toBe(false);
      expect(svbInternal.hasAccessToStation(5)).toBe(false);
    });

    it('should NOT be treated as global readonly (the bug we are fixing)', () => {
      // This is the core of AUTH-001 - station-internal should NOT have global read
      expect(svbInternal.isReadOnly()).toBe(false);
    });

    it('should NOT be able to edit anything', () => {
      expect(svbInternal.canEditStation('svartberget')).toBe(false);
      expect(svbInternal.canEditStation('lonnstorp')).toBe(false);
    });

    it('should NOT be able to delete anything', () => {
      expect(svbInternal.canDeleteAtStation('svartberget')).toBe(false);
      expect(svbInternal.canDeleteAtStation('lonnstorp')).toBe(false);
    });
  });

  describe('AuthorizationService with Station Internal', () => {
    const service = new AuthorizationService();

    const svbInternal = new User({
      username: 'svb-internal',
      role: 'station-internal',
      stationId: 1,
      stationAcronym: 'SVB',
      stationNormalizedName: 'svartberget'
    });

    describe('Read Permissions (Station-Scoped)', () => {
      it('should allow reading own station data', () => {
        const result = service.authorize(svbInternal, 'instruments', 'read', { stationId: 1 });
        expect(result.allowed).toBe(true);
      });

      it('should allow reading platforms at own station', () => {
        const result = service.authorize(svbInternal, 'platforms', 'read', { stationId: 1 });
        expect(result.allowed).toBe(true);
      });

      it('should allow reading ROIs at own station', () => {
        const result = service.authorize(svbInternal, 'rois', 'read', { stationId: 1 });
        expect(result.allowed).toBe(true);
      });
    });

    describe('Write Permissions (DENIED)', () => {
      it('should DENY writing instruments even at own station', () => {
        const result = service.authorize(svbInternal, 'instruments', 'write', { stationId: 1 });
        expect(result.allowed).toBe(false);
      });

      it('should DENY writing platforms even at own station', () => {
        const result = service.authorize(svbInternal, 'platforms', 'write', { stationId: 1 });
        expect(result.allowed).toBe(false);
      });

      it('should DENY writing at other stations', () => {
        const result = service.authorize(svbInternal, 'instruments', 'write', { stationId: 5 });
        expect(result.allowed).toBe(false);
      });
    });

    describe('Delete Permissions (DENIED)', () => {
      it('should DENY deleting instruments even at own station', () => {
        const result = service.authorize(svbInternal, 'instruments', 'delete', { stationId: 1 });
        expect(result.allowed).toBe(false);
      });

      it('should DENY deleting platforms even at own station', () => {
        const result = service.authorize(svbInternal, 'platforms', 'delete', { stationId: 1 });
        expect(result.allowed).toBe(false);
      });
    });

    describe('Admin Permissions (DENIED)', () => {
      it('should DENY user management access', () => {
        const result = service.authorize(svbInternal, 'users', 'read');
        expect(result.allowed).toBe(false);
      });

      it('should DENY admin panel access', () => {
        const result = service.authorize(svbInternal, 'admin', 'read');
        expect(result.allowed).toBe(false);
      });
    });

    describe('filterByPermissions (Station-Scoped)', () => {
      const testData = [
        { id: 1, station_id: 1, station_acronym: 'SVB', name: 'Item 1' },
        { id: 2, station_id: 1, station_acronym: 'SVB', name: 'Item 2' },
        { id: 3, station_id: 5, station_acronym: 'LON', name: 'Item 3' }
      ];

      it('should return ONLY own station data for station-internal user (not all data)', () => {
        const filtered = service.filterByPermissions(svbInternal, testData);
        expect(filtered).toHaveLength(2);
        expect(filtered.every(item => item.station_acronym === 'SVB')).toBe(true);
      });

      it('should filter out other station data', () => {
        const filtered = service.filterByPermissions(svbInternal, testData);
        expect(filtered.some(item => item.station_acronym === 'LON')).toBe(false);
      });
    });
  });

  describe('Comparison: Station Internal vs Readonly', () => {
    const stationInternal = new User({
      username: 'svb-internal',
      role: 'station-internal',
      stationId: 1,
      stationAcronym: 'SVB',
      stationNormalizedName: 'svartberget'
    });

    const readonly = new User({
      username: 'viewer',
      role: 'readonly'
    });

    it('readonly should see all stations', () => {
      expect(readonly.hasAccessToStation('svartberget')).toBe(true);
      expect(readonly.hasAccessToStation('lonnstorp')).toBe(true);
      expect(readonly.hasAccessToStation('abisko')).toBe(true);
    });

    it('station-internal should ONLY see own station', () => {
      expect(stationInternal.hasAccessToStation('svartberget')).toBe(true);
      expect(stationInternal.hasAccessToStation('SVB')).toBe(true);
      expect(stationInternal.hasAccessToStation('lonnstorp')).toBe(false);
      expect(stationInternal.hasAccessToStation('abisko')).toBe(false);
    });
  });
});
