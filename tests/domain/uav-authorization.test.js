/**
 * UAV Authorization Service Tests
 *
 * Tests for UAV domain authorization including mission approval,
 * flight log creation, and battery access control.
 *
 * @module tests/domain/uav-authorization
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UAVAuthorizationService } from '../../src/domain/uav/authorization/UAVAuthorizationService.js';
import { User } from '../../src/domain/authorization/User.js';

describe('UAV Authorization Service', () => {
  let authService;

  beforeEach(() => {
    authService = new UAVAuthorizationService();
  });

  // Helper to create mock users
  // Maps shorthand role names to valid Role values
  const roleMapping = {
    'admin': 'admin',
    'sites-admin': 'sites-admin',
    'svartberget-admin': 'station-admin', // Station admin for svartberget
    'abisko-admin': 'station-admin',      // Station admin for abisko
    'uav-pilot': 'uav-pilot',
    'svartberget': 'station',             // Station user
    'readonly': 'readonly'
  };

  const createUser = (roleShorthand, stationId = null, stationNormalizedName = null) => {
    const role = roleMapping[roleShorthand] || roleShorthand;
    return new User({
      username: roleShorthand, // Use shorthand as username for testing
      role: role,              // Pass string, not Role object
      stationId,
      stationNormalizedName
    });
  };

  describe('Mission Approval Authorization (UAV-001)', () => {
    const mission = { id: 1, station_id: 1, status: 'pending_approval' };

    it('should allow global admin to approve any mission', () => {
      const user = createUser('admin');
      expect(authService.canApproveMission(user, mission)).toBe(true);
    });

    it('should allow sites-admin to approve any mission', () => {
      const user = createUser('sites-admin');
      expect(authService.canApproveMission(user, mission)).toBe(true);
    });

    it('should allow station-admin to approve own station mission', () => {
      const user = createUser('svartberget-admin', 1, 'svartberget');
      expect(authService.canApproveMission(user, mission)).toBe(true);
    });

    it('should DENY station-admin approving other station mission', () => {
      const user = createUser('abisko-admin', 2, 'abisko');
      const otherStationMission = { id: 2, station_id: 1, status: 'pending_approval' };
      expect(authService.canApproveMission(user, otherStationMission)).toBe(false);
    });

    it('should DENY uav-pilot from approving missions', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      expect(authService.canApproveMission(user, mission)).toBe(false);
    });

    it('should DENY station user from approving missions', () => {
      const user = createUser('svartberget', 1, 'svartberget');
      expect(authService.canApproveMission(user, mission)).toBe(false);
    });

    it('should DENY readonly user from approving missions', () => {
      const user = createUser('readonly');
      expect(authService.canApproveMission(user, mission)).toBe(false);
    });
  });

  describe('Flight Log Creation Authorization (UAV-002)', () => {
    const mission = {
      id: 1,
      station_id: 1,
      assigned_pilots: [{ pilot_id: 10 }, { pilot_id: 20 }]
    };

    it('should allow global admin to create flight log for any mission', () => {
      const user = createUser('admin');
      expect(authService.canCreateFlightLog(user, mission, 10)).toBe(true);
    });

    it('should allow assigned pilot to create flight log', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      user.pilotId = 10; // User is pilot 10
      expect(authService.canCreateFlightLog(user, mission, 10)).toBe(true);
    });

    it('should DENY unassigned pilot from creating flight log', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      user.pilotId = 99; // User is pilot 99, not assigned
      expect(authService.canCreateFlightLog(user, mission, 99)).toBe(false);
    });

    it('should DENY pilot creating log for different pilot ID', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      user.pilotId = 10;
      // Trying to create log as pilot 20 when user is pilot 10
      expect(authService.canCreateFlightLog(user, mission, 20)).toBe(false);
    });

    it('should allow station-admin to create flight log for assigned pilots', () => {
      const user = createUser('svartberget-admin', 1, 'svartberget');
      expect(authService.canCreateFlightLog(user, mission, 10)).toBe(true);
    });

    it('should DENY station-admin creating log for unassigned pilot', () => {
      const user = createUser('svartberget-admin', 1, 'svartberget');
      expect(authService.canCreateFlightLog(user, mission, 99)).toBe(false);
    });

    it('should DENY station-admin from other station', () => {
      const user = createUser('abisko-admin', 2, 'abisko');
      expect(authService.canCreateFlightLog(user, mission, 10)).toBe(false);
    });

    it('should DENY readonly user from creating flight logs', () => {
      const user = createUser('readonly');
      expect(authService.canCreateFlightLog(user, mission, 10)).toBe(false);
    });
  });

  describe('Battery Access Authorization (UAV-003)', () => {
    const battery = { id: 1, station_id: 1 };

    it('should allow global admin to access any battery', () => {
      const user = createUser('admin');
      expect(authService.canAccessBattery(user, battery)).toBe(true);
    });

    it('should allow sites-admin to access any battery', () => {
      const user = createUser('sites-admin');
      expect(authService.canAccessBattery(user, battery)).toBe(true);
    });

    it('should allow station-admin to access own station battery', () => {
      const user = createUser('svartberget-admin', 1, 'svartberget');
      expect(authService.canAccessBattery(user, battery)).toBe(true);
    });

    it('should DENY station-admin accessing other station battery', () => {
      const user = createUser('abisko-admin', 2, 'abisko');
      expect(authService.canAccessBattery(user, battery)).toBe(false);
    });

    it('should allow uav-pilot to access own station battery', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      expect(authService.canAccessBattery(user, battery)).toBe(true);
    });

    it('should DENY uav-pilot accessing other station battery', () => {
      const user = createUser('uav-pilot', 2, 'abisko');
      expect(authService.canAccessBattery(user, battery)).toBe(false);
    });

    it('should DENY readonly user from accessing batteries', () => {
      const user = createUser('readonly');
      expect(authService.canAccessBattery(user, battery)).toBe(false);
    });
  });

  describe('Battery Modification Authorization (UAV-003)', () => {
    const battery = { id: 1, station_id: 1 };

    it('should allow global admin to modify any battery', () => {
      const user = createUser('admin');
      expect(authService.canModifyBattery(user, battery)).toBe(true);
    });

    it('should allow station-admin to modify own station battery', () => {
      const user = createUser('svartberget-admin', 1, 'svartberget');
      expect(authService.canModifyBattery(user, battery)).toBe(true);
    });

    it('should DENY station-admin modifying other station battery', () => {
      const user = createUser('abisko-admin', 2, 'abisko');
      expect(authService.canModifyBattery(user, battery)).toBe(false);
    });

    it('should DENY uav-pilot from modifying batteries', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      expect(authService.canModifyBattery(user, battery)).toBe(false);
    });
  });

  describe('Pilot Management Authorization (UAV-004)', () => {
    const pilot = { id: 1, station_id: 1 };

    it('should allow global admin to manage any pilot', () => {
      const user = createUser('admin');
      expect(authService.canManagePilot(user, pilot)).toBe(true);
    });

    it('should allow station-admin to manage own station pilot', () => {
      const user = createUser('svartberget-admin', 1, 'svartberget');
      expect(authService.canManagePilot(user, pilot)).toBe(true);
    });

    it('should DENY station-admin managing other station pilot', () => {
      const user = createUser('abisko-admin', 2, 'abisko');
      expect(authService.canManagePilot(user, pilot)).toBe(false);
    });

    it('should DENY uav-pilot from managing pilots', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      expect(authService.canManagePilot(user, pilot)).toBe(false);
    });
  });

  describe('Mission Management Authorization (UAV-004)', () => {
    const mission = { id: 1, station_id: 1 };

    it('should allow global admin to manage any mission', () => {
      const user = createUser('admin');
      expect(authService.canManageMission(user, mission)).toBe(true);
    });

    it('should allow station-admin to manage own station mission', () => {
      const user = createUser('svartberget-admin', 1, 'svartberget');
      expect(authService.canManageMission(user, mission)).toBe(true);
    });

    it('should DENY station-admin managing other station mission', () => {
      const user = createUser('abisko-admin', 2, 'abisko');
      expect(authService.canManageMission(user, mission)).toBe(false);
    });

    it('should allow uav-pilot to view but not modify mission', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      expect(authService.canViewMission(user, mission)).toBe(true);
      expect(authService.canManageMission(user, mission)).toBe(false);
    });
  });

  describe('Station Scoping for List Operations', () => {
    it('should return all stations for global admin', () => {
      const user = createUser('admin');
      const scope = authService.getStationScope(user);
      expect(scope.all).toBe(true);
      expect(scope.stationIds).toBeUndefined();
    });

    it('should return specific station for station user', () => {
      const user = createUser('svartberget-admin', 1, 'svartberget');
      const scope = authService.getStationScope(user);
      expect(scope.all).toBe(false);
      expect(scope.stationIds).toContain(1);
    });

    it('should return specific station for uav-pilot', () => {
      const user = createUser('uav-pilot', 1, 'svartberget');
      const scope = authService.getStationScope(user);
      expect(scope.all).toBe(false);
      expect(scope.stationIds).toContain(1);
    });

    it('should return no stations for readonly without station', () => {
      const user = createUser('readonly');
      const scope = authService.getStationScope(user);
      expect(scope.all).toBe(false);
      expect(scope.stationIds).toEqual([]);
    });
  });
});
