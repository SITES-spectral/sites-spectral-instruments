/**
 * Authorization Domain Tests
 *
 * Tests for the domain authorization system including:
 * - Role value object
 * - User entity
 * - AuthorizationService
 *
 * @version 11.0.0-alpha.30
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Role, User, AuthorizationService, authorizationService } from '../../src/domain/authorization/index.js';

describe('Authorization Domain', () => {
  describe('Role Value Object', () => {
    describe('constants', () => {
      it('should have all role constants', () => {
        expect(Role.GLOBAL_ADMIN).toBe('admin');
        expect(Role.SITES_ADMIN).toBe('sites-admin');
        expect(Role.STATION_ADMIN).toBe('station-admin');
        expect(Role.STATION_USER).toBe('station');
        expect(Role.READONLY).toBe('readonly');
      });

      it('should have global admin usernames list', () => {
        expect(Role.GLOBAL_ADMIN_USERNAMES).toContain('admin');
        expect(Role.GLOBAL_ADMIN_USERNAMES).toContain('sites-admin');
        expect(Role.GLOBAL_ADMIN_USERNAMES).not.toContain('svb-admin');
      });
    });

    describe('constructor', () => {
      it('should create role with valid value', () => {
        const role = new Role('admin');
        expect(role.value).toBe('admin');
      });

      it('should throw error for invalid role', () => {
        expect(() => new Role('invalid')).toThrow('Invalid role');
      });
    });

    describe('isGlobalAdmin', () => {
      it('should return true for admin role', () => {
        const role = new Role('admin');
        expect(role.isGlobalAdmin()).toBe(true);
      });

      it('should return true for sites-admin role', () => {
        const role = new Role('sites-admin');
        expect(role.isGlobalAdmin()).toBe(true);
      });

      it('should return false for station-admin role', () => {
        const role = new Role('station-admin');
        expect(role.isGlobalAdmin()).toBe(false);
      });

      it('should return false for station role', () => {
        const role = new Role('station');
        expect(role.isGlobalAdmin()).toBe(false);
      });
    });

    describe('isStationAdmin', () => {
      it('should return true for station-admin role', () => {
        const role = new Role('station-admin');
        expect(role.isStationAdmin()).toBe(true);
      });

      it('should return false for admin role', () => {
        const role = new Role('admin');
        expect(role.isStationAdmin()).toBe(false);
      });
    });

    describe('canDelete', () => {
      it('should return true for admin role', () => {
        const role = new Role('admin');
        expect(role.canDelete()).toBe(true);
      });

      it('should return true for station-admin role', () => {
        const role = new Role('station-admin');
        expect(role.canDelete()).toBe(true);
      });

      it('should return false for station role', () => {
        const role = new Role('station');
        expect(role.canDelete()).toBe(false);
      });

      it('should return false for readonly role', () => {
        const role = new Role('readonly');
        expect(role.canDelete()).toBe(false);
      });
    });
  });

  describe('User Entity', () => {
    describe('Global Admin Detection', () => {
      it('should identify admin username as global admin', () => {
        const user = new User({
          username: 'admin',
          role: 'admin',
          permissions: ['read', 'write', 'delete', 'admin']
        });
        expect(user.isGlobalAdmin()).toBe(true);
      });

      it('should identify sites-admin username as global admin', () => {
        const user = new User({
          username: 'sites-admin',
          role: 'admin',
          permissions: ['read', 'write', 'delete', 'admin']
        });
        expect(user.isGlobalAdmin()).toBe(true);
      });

      it('should NOT identify svb-admin as global admin', () => {
        const user = new User({
          username: 'svb-admin',
          role: 'station-admin',
          stationId: 1,
          stationAcronym: 'SVB',
          stationNormalizedName: 'svartberget',
          permissions: ['read', 'write', 'delete']
        });
        expect(user.isGlobalAdmin()).toBe(false);
      });

      it('should NOT identify lonnstorp-admin as global admin', () => {
        const user = new User({
          username: 'lonnstorp-admin',
          role: 'station-admin',
          stationId: 5,
          stationAcronym: 'LON',
          stationNormalizedName: 'lonnstorp',
          permissions: ['read', 'write', 'delete']
        });
        expect(user.isGlobalAdmin()).toBe(false);
      });
    });

    describe('Station Admin Detection', () => {
      it('should identify svb-admin as station admin', () => {
        const user = new User({
          username: 'svb-admin',
          role: 'station-admin',
          stationId: 1,
          stationAcronym: 'SVB'
        });
        expect(user.isStationAdmin()).toBe(true);
      });

      it('should NOT identify admin as station admin', () => {
        const user = new User({
          username: 'admin',
          role: 'admin'
        });
        expect(user.isStationAdmin()).toBe(false);
      });
    });

    describe('Station Access', () => {
      describe('Global Admin Access', () => {
        it('should allow admin access to any station', () => {
          const admin = new User({
            username: 'admin',
            role: 'admin'
          });

          expect(admin.hasAccessToStation('svartberget')).toBe(true);
          expect(admin.hasAccessToStation('lonnstorp')).toBe(true);
          expect(admin.hasAccessToStation('SVB')).toBe(true);
          expect(admin.hasAccessToStation(1)).toBe(true);
        });

        it('should allow sites-admin access to any station', () => {
          const sitesAdmin = new User({
            username: 'sites-admin',
            role: 'admin'
          });

          expect(sitesAdmin.hasAccessToStation('svartberget')).toBe(true);
          expect(sitesAdmin.hasAccessToStation('lonnstorp')).toBe(true);
        });
      });

      describe('Station Admin Access', () => {
        const svbAdmin = new User({
          username: 'svb-admin',
          role: 'station-admin',
          stationId: 1,
          stationAcronym: 'SVB',
          stationNormalizedName: 'svartberget'
        });

        it('should allow access to own station by ID', () => {
          expect(svbAdmin.hasAccessToStation(1)).toBe(true);
        });

        it('should allow access to own station by acronym', () => {
          expect(svbAdmin.hasAccessToStation('SVB')).toBe(true);
        });

        it('should allow access to own station by normalized name', () => {
          expect(svbAdmin.hasAccessToStation('svartberget')).toBe(true);
        });

        it('should DENY access to other stations', () => {
          expect(svbAdmin.hasAccessToStation('lonnstorp')).toBe(false);
          expect(svbAdmin.hasAccessToStation('LON')).toBe(false);
          expect(svbAdmin.hasAccessToStation(5)).toBe(false);
        });
      });

      describe('Station User Access', () => {
        const stationUser = new User({
          username: 'svartberget',
          role: 'station',
          stationId: 1,
          stationAcronym: 'SVB',
          stationNormalizedName: 'svartberget'
        });

        it('should allow access to own station', () => {
          expect(stationUser.hasAccessToStation('svartberget')).toBe(true);
          expect(stationUser.hasAccessToStation('SVB')).toBe(true);
          expect(stationUser.hasAccessToStation(1)).toBe(true);
        });

        it('should DENY access to other stations', () => {
          expect(stationUser.hasAccessToStation('lonnstorp')).toBe(false);
        });
      });

      describe('Readonly Access', () => {
        it('should allow readonly user to view any station', () => {
          const readonlyUser = new User({
            username: 'viewer',
            role: 'readonly'
          });

          expect(readonlyUser.hasAccessToStation('svartberget')).toBe(true);
          expect(readonlyUser.hasAccessToStation('lonnstorp')).toBe(true);
        });
      });
    });

    describe('Edit Permissions', () => {
      it('should allow global admin to edit any station', () => {
        const admin = new User({ username: 'admin', role: 'admin' });
        expect(admin.canEditStation('svartberget')).toBe(true);
        expect(admin.canEditStation('lonnstorp')).toBe(true);
      });

      it('should allow station admin to edit only their station', () => {
        const svbAdmin = new User({
          username: 'svb-admin',
          role: 'station-admin',
          stationId: 1,
          stationAcronym: 'SVB',
          stationNormalizedName: 'svartberget'
        });
        expect(svbAdmin.canEditStation('svartberget')).toBe(true);
        expect(svbAdmin.canEditStation('lonnstorp')).toBe(false);
      });

      it('should NOT allow readonly user to edit', () => {
        const readonly = new User({ username: 'viewer', role: 'readonly' });
        expect(readonly.canEditStation('svartberget')).toBe(false);
      });
    });

    describe('Delete Permissions', () => {
      it('should allow global admin to delete at any station', () => {
        const admin = new User({ username: 'admin', role: 'admin' });
        expect(admin.canDeleteAtStation('svartberget')).toBe(true);
        expect(admin.canDeleteAtStation('lonnstorp')).toBe(true);
      });

      it('should allow station admin to delete only at their station', () => {
        const svbAdmin = new User({
          username: 'svb-admin',
          role: 'station-admin',
          stationId: 1,
          stationAcronym: 'SVB',
          stationNormalizedName: 'svartberget'
        });
        expect(svbAdmin.canDeleteAtStation('svartberget')).toBe(true);
        expect(svbAdmin.canDeleteAtStation('lonnstorp')).toBe(false);
      });

      it('should NOT allow station user to delete', () => {
        const stationUser = new User({
          username: 'svartberget',
          role: 'station',
          stationId: 1,
          stationAcronym: 'SVB',
          stationNormalizedName: 'svartberget'
        });
        expect(stationUser.canDeleteAtStation('svartberget')).toBe(false);
      });
    });

    describe('Snake Case Support (JWT Payload)', () => {
      it('should support snake_case from JWT payload', () => {
        const user = new User({
          username: 'svb-admin',
          role: 'station-admin',
          station_id: 1,
          station_acronym: 'SVB',
          station_normalized_name: 'svartberget'
        });

        expect(user.stationId).toBe(1);
        expect(user.stationAcronym).toBe('SVB');
        expect(user.stationNormalizedName).toBe('svartberget');
        expect(user.hasAccessToStation(1)).toBe(true);
      });
    });
  });

  describe('AuthorizationService', () => {
    const service = new AuthorizationService();

    describe('authorize', () => {
      describe('Global Admin', () => {
        const admin = new User({ username: 'admin', role: 'admin' });

        it('should allow admin to delete stations', () => {
          const result = service.authorize(admin, 'stations', 'delete');
          expect(result.allowed).toBe(true);
        });

        it('should allow admin to access user management', () => {
          const result = service.authorize(admin, 'users', 'admin');
          expect(result.allowed).toBe(true);
        });

        it('should allow admin to access admin panel', () => {
          const result = service.authorize(admin, 'admin', 'read');
          expect(result.allowed).toBe(true);
        });
      });

      describe('Station Admin', () => {
        const svbAdmin = new User({
          username: 'svb-admin',
          role: 'station-admin',
          stationId: 1,
          stationAcronym: 'SVB',
          stationNormalizedName: 'svartberget'
        });

        it('should allow station admin to read stations', () => {
          const result = service.authorize(svbAdmin, 'stations', 'read');
          expect(result.allowed).toBe(true);
        });

        it('should DENY station admin from modifying stations', () => {
          const result = service.authorize(svbAdmin, 'stations', 'write');
          expect(result.allowed).toBe(false);
        });

        it('should allow station admin to delete platforms at own station', () => {
          const result = service.authorize(svbAdmin, 'platforms', 'delete', { stationId: 1 });
          expect(result.allowed).toBe(true);
        });

        it('should DENY station admin from deleting platforms at other station', () => {
          const result = service.authorize(svbAdmin, 'platforms', 'delete', { stationId: 5 });
          expect(result.allowed).toBe(false);
        });

        it('should DENY station admin from user management', () => {
          const result = service.authorize(svbAdmin, 'users', 'read');
          expect(result.allowed).toBe(false);
        });

        it('should DENY station admin from admin panel', () => {
          const result = service.authorize(svbAdmin, 'admin', 'read');
          expect(result.allowed).toBe(false);
        });
      });

      describe('Station User', () => {
        const stationUser = new User({
          username: 'svartberget',
          role: 'station',
          stationId: 1,
          stationAcronym: 'SVB',
          stationNormalizedName: 'svartberget'
        });

        it('should allow station user to write instruments at own station', () => {
          const result = service.authorize(stationUser, 'instruments', 'write', { stationId: 1 });
          expect(result.allowed).toBe(true);
        });

        it('should DENY station user from deleting instruments', () => {
          const result = service.authorize(stationUser, 'instruments', 'delete', { stationId: 1 });
          expect(result.allowed).toBe(false);
        });
      });

      describe('Readonly', () => {
        const readonly = new User({ username: 'viewer', role: 'readonly' });

        it('should allow readonly to read any resource', () => {
          expect(service.authorize(readonly, 'stations', 'read').allowed).toBe(true);
          expect(service.authorize(readonly, 'platforms', 'read').allowed).toBe(true);
          expect(service.authorize(readonly, 'instruments', 'read').allowed).toBe(true);
        });

        it('should DENY readonly from write operations', () => {
          expect(service.authorize(readonly, 'instruments', 'write').allowed).toBe(false);
        });
      });
    });

    describe('filterByPermissions', () => {
      const testData = [
        { id: 1, station_id: 1, station_acronym: 'SVB', name: 'Item 1' },
        { id: 2, station_id: 1, station_acronym: 'SVB', name: 'Item 2' },
        { id: 3, station_id: 5, station_acronym: 'LON', name: 'Item 3' }
      ];

      it('should return all data for global admin', () => {
        const admin = new User({ username: 'admin', role: 'admin' });
        const filtered = service.filterByPermissions(admin, testData);
        expect(filtered).toHaveLength(3);
      });

      it('should return only station data for station admin', () => {
        const svbAdmin = new User({
          username: 'svb-admin',
          role: 'station-admin',
          stationId: 1,
          stationAcronym: 'SVB'
        });
        const filtered = service.filterByPermissions(svbAdmin, testData);
        expect(filtered).toHaveLength(2);
        expect(filtered.every(item => item.station_acronym === 'SVB')).toBe(true);
      });

      it('should return all data for readonly user (for viewing)', () => {
        const readonly = new User({ username: 'viewer', role: 'readonly' });
        const filtered = service.filterByPermissions(readonly, testData);
        expect(filtered).toHaveLength(3);
      });
    });

    describe('Singleton Export', () => {
      it('should export singleton instance', () => {
        expect(authorizationService).toBeInstanceOf(AuthorizationService);
      });
    });
  });
});
