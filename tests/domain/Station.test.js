/**
 * Tests for Station Entity
 *
 * Tests the domain entity for SITES research stations.
 */
import { describe, it, expect } from 'vitest';
import { Station } from '../../src/domain/station/Station.js';

describe('Station Entity', () => {
  const validStationProps = {
    id: 1,
    acronym: 'SVB',
    normalizedName: 'SVB',
    displayName: 'Svartberget Research Station',
    description: 'A test station',
    latitude: 64.256111,
    longitude: 19.774722,
    status: 'Active'
  };

  describe('constructor', () => {
    it('should create a station with valid props', () => {
      const station = new Station(validStationProps);

      expect(station.id).toBe(1);
      expect(station.acronym).toBe('SVB');
      expect(station.displayName).toBe('Svartberget Research Station');
      expect(station.latitude).toBe(64.256111);
      expect(station.longitude).toBe(19.774722);
    });

    it('should set default values', () => {
      const station = new Station({
        acronym: 'ANS',
        displayName: 'Asa Research Station',
        latitude: 57.167,
        longitude: 14.783
      });

      expect(station.id).toBeNull();
      expect(station.status).toBe('Active');
      expect(station.normalizedName).toBe('ANS');
    });

    it('should validate on construction', () => {
      expect(() => new Station({
        acronym: 'invalid', // lowercase not allowed
        displayName: 'Test',
        latitude: 50,
        longitude: 10
      })).toThrow('Acronym must be 2-10 uppercase letters');
    });
  });

  describe('validation', () => {
    it('should reject empty acronym', () => {
      expect(() => new Station({
        ...validStationProps,
        acronym: ''
      })).toThrow('Acronym is required');
    });

    it('should reject lowercase acronym', () => {
      expect(() => new Station({
        ...validStationProps,
        acronym: 'svb'
      })).toThrow('Acronym must be 2-10 uppercase letters');
    });

    it('should reject acronym with numbers', () => {
      expect(() => new Station({
        ...validStationProps,
        acronym: 'SV1'
      })).toThrow('Acronym must be 2-10 uppercase letters');
    });

    it('should reject empty display name', () => {
      expect(() => new Station({
        ...validStationProps,
        displayName: ''
      })).toThrow('Display name is required');
    });

    it('should reject invalid latitude', () => {
      expect(() => new Station({
        ...validStationProps,
        latitude: 100 // out of range
      })).toThrow('Latitude must be a number between -90 and 90');
    });

    it('should reject invalid longitude', () => {
      expect(() => new Station({
        ...validStationProps,
        longitude: 200 // out of range
      })).toThrow('Longitude must be a number between -180 and 180');
    });
  });

  describe('isActive', () => {
    it('should return true for Active status', () => {
      const station = new Station(validStationProps);
      expect(station.isActive()).toBe(true);
    });

    it('should return false for Inactive status', () => {
      const station = new Station({
        ...validStationProps,
        status: 'Inactive'
      });
      expect(station.isActive()).toBe(false);
    });
  });

  describe('getCoordinates', () => {
    it('should return coordinates as array', () => {
      const station = new Station(validStationProps);
      const coords = station.getCoordinates();

      expect(coords).toEqual([64.256111, 19.774722]);
    });
  });

  describe('toJSON', () => {
    it('should convert to plain object with snake_case keys', () => {
      const station = new Station(validStationProps);
      const json = station.toJSON();

      expect(json.id).toBe(1);
      expect(json.acronym).toBe('SVB');
      expect(json.normalized_name).toBe('SVB');
      expect(json.display_name).toBe('Svartberget Research Station');
      expect(json.latitude).toBe(64.256111);
      expect(json.longitude).toBe(19.774722);
    });
  });

  describe('fromDatabase', () => {
    it('should create station from database row', () => {
      const row = {
        id: 1,
        acronym: 'SVB',
        normalized_name: 'SVB',
        display_name: 'Svartberget Research Station',
        description: 'Test',
        latitude: 64.256111,
        longitude: 19.774722,
        status: 'Active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      const station = Station.fromDatabase(row);

      expect(station.id).toBe(1);
      expect(station.acronym).toBe('SVB');
      expect(station.displayName).toBe('Svartberget Research Station');
      expect(station.createdAt).toBe('2024-01-01T00:00:00Z');
    });
  });
});
