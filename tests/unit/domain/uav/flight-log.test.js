/**
 * UAV Flight Log Entity Tests
 * Tests for flight logging, duration calculation, incidents, and telemetry
 */

import { describe, it, expect } from 'vitest';
import { FlightLog, INCIDENT_SEVERITIES } from '../../../../src/domain/uav/FlightLog.js';

describe('FlightLog Entity', () => {
  // Valid flight log data for testing
  const validFlightLogData = {
    mission_id: 1,
    pilot_id: 5,
    platform_id: 10,
    flight_number: 1,
    takeoff_time: '2026-01-26T09:00:00Z',
    landing_time: '2026-01-26T09:25:00Z',
    takeoff_latitude: 64.2561,
    takeoff_longitude: 19.7745,
    takeoff_altitude_m: 285,
    max_altitude_agl_m: 120,
    max_distance_m: 500,
    total_distance_m: 5000,
    average_speed_ms: 8.5,
    battery_id: 3,
    battery_start_percent: 100,
    battery_end_percent: 35,
    images_captured: 250,
    data_size_mb: 1500,
    had_incident: false
  };

  describe('Constructor & Validation', () => {
    it('should create flight log with valid data', () => {
      const flightLog = new FlightLog(validFlightLogData);

      expect(flightLog.mission_id).toBe(1);
      expect(flightLog.pilot_id).toBe(5);
      expect(flightLog.platform_id).toBe(10);
      expect(flightLog.flight_number).toBe(1);
    });

    it('should throw error for missing mission_id', () => {
      expect(() => new FlightLog({ ...validFlightLogData, mission_id: null }))
        .toThrow('Mission ID is required');
    });

    it('should throw error for missing pilot_id', () => {
      expect(() => new FlightLog({ ...validFlightLogData, pilot_id: null }))
        .toThrow('Pilot ID is required');
    });

    it('should throw error for missing platform_id', () => {
      expect(() => new FlightLog({ ...validFlightLogData, platform_id: null }))
        .toThrow('Platform ID is required');
    });

    it('should throw error for missing takeoff_time', () => {
      expect(() => new FlightLog({ ...validFlightLogData, takeoff_time: null }))
        .toThrow('Takeoff time is required');
    });

    it('should throw error for missing landing_time', () => {
      expect(() => new FlightLog({ ...validFlightLogData, landing_time: null }))
        .toThrow('Landing time is required');
    });

    it('should throw error when landing before takeoff', () => {
      expect(() => new FlightLog({
        ...validFlightLogData,
        takeoff_time: '2026-01-26T10:00:00Z',
        landing_time: '2026-01-26T09:00:00Z'
      })).toThrow('Landing time must be after takeoff time');
    });

    it('should throw error for invalid incident severity', () => {
      expect(() => new FlightLog({
        ...validFlightLogData,
        had_incident: true,
        incident_description: 'Test incident',
        incident_severity: 'INVALID'
      })).toThrow('Invalid incident severity');
    });

    it('should throw error when incident without description', () => {
      expect(() => new FlightLog({
        ...validFlightLogData,
        had_incident: true,
        incident_severity: 'minor'
      })).toThrow('Incident description is required when incident occurred');
    });

    it('should default images_captured to 0', () => {
      const flightLog = new FlightLog({
        ...validFlightLogData,
        images_captured: undefined
      });
      expect(flightLog.images_captured).toBe(0);
    });

    it('should default data_size_mb to 0', () => {
      const flightLog = new FlightLog({
        ...validFlightLogData,
        data_size_mb: undefined
      });
      expect(flightLog.data_size_mb).toBe(0);
    });
  });

  describe('Duration Calculation', () => {
    it('should calculate duration correctly', () => {
      const flightLog = new FlightLog(validFlightLogData);
      expect(flightLog.calculateDuration()).toBe(25 * 60); // 25 minutes in seconds
    });

    it('should format duration as HH:MM:SS', () => {
      const flightLog = new FlightLog({
        ...validFlightLogData,
        takeoff_time: '2026-01-26T09:00:00Z',
        landing_time: '2026-01-26T10:30:45Z' // 1 hour, 30 minutes, 45 seconds
      });
      expect(flightLog.getFormattedDuration()).toBe('01:30:45');
    });

    it('should use stored duration if available', () => {
      const flightLog = new FlightLog({
        ...validFlightLogData,
        flight_duration_seconds: 1234
      });
      expect(flightLog.getFormattedDuration()).toBe('00:20:34');
    });
  });

  describe('Battery Calculations', () => {
    it('should calculate battery usage', () => {
      const flightLog = new FlightLog(validFlightLogData);
      expect(flightLog.getBatteryUsage()).toBe(65); // 100 - 35
    });

    it('should return null for missing battery data', () => {
      const flightLog = new FlightLog({
        ...validFlightLogData,
        battery_start_percent: null
      });
      expect(flightLog.getBatteryUsage()).toBeNull();
    });
  });

  describe('Data Rate Calculation', () => {
    it('should calculate data rate in MB per minute', () => {
      const flightLog = new FlightLog(validFlightLogData);
      // 25 minutes flight, 1500 MB data = 60 MB/min
      expect(flightLog.getDataRate()).toBeCloseTo(60, 0);
    });

    it('should return null for missing data', () => {
      const flightLog = new FlightLog({
        ...validFlightLogData,
        data_size_mb: null
      });
      expect(flightLog.getDataRate()).toBeNull();
    });
  });

  describe('Incident Handling', () => {
    it('should identify flight without incident', () => {
      const flightLog = new FlightLog(validFlightLogData);
      expect(flightLog.hasIncident()).toBe(false);
    });

    it('should identify flight with incident', () => {
      const flightLog = new FlightLog({
        ...validFlightLogData,
        had_incident: true,
        incident_description: 'GPS glitch',
        incident_severity: 'minor'
      });
      expect(flightLog.hasIncident()).toBe(true);
    });

    it('should identify severe incidents', () => {
      const majorIncident = new FlightLog({
        ...validFlightLogData,
        had_incident: true,
        incident_description: 'Crash landing',
        incident_severity: 'major'
      });
      expect(majorIncident.hasSevereIncident()).toBe(true);

      const criticalIncident = new FlightLog({
        ...validFlightLogData,
        had_incident: true,
        incident_description: 'Near miss',
        incident_severity: 'critical'
      });
      expect(criticalIncident.hasSevereIncident()).toBe(true);
    });

    it('should not flag minor incidents as severe', () => {
      const minorIncident = new FlightLog({
        ...validFlightLogData,
        had_incident: true,
        incident_description: 'GPS glitch',
        incident_severity: 'minor'
      });
      expect(minorIncident.hasSevereIncident()).toBe(false);
    });

    it('should report incident correctly', () => {
      const flightLog = new FlightLog(validFlightLogData);

      flightLog.reportIncident('Unexpected wind gust', 'moderate');

      expect(flightLog.had_incident).toBe(true);
      expect(flightLog.incident_description).toBe('Unexpected wind gust');
      expect(flightLog.incident_severity).toBe('moderate');
    });

    it('should throw for invalid severity when reporting', () => {
      const flightLog = new FlightLog(validFlightLogData);

      expect(() => flightLog.reportIncident('Test', 'INVALID'))
        .toThrow('Invalid severity');
    });
  });

  describe('Serialization', () => {
    it('should convert to database record format', () => {
      const flightLog = new FlightLog(validFlightLogData);
      const record = flightLog.toRecord();

      expect(record.mission_id).toBe(1);
      expect(record.flight_duration_seconds).toBe(25 * 60);
      expect(record.had_incident).toBe(0); // Boolean to int
    });

    it('should convert incident flag to 1 for true', () => {
      const flightLog = new FlightLog({
        ...validFlightLogData,
        had_incident: true,
        incident_description: 'Test',
        incident_severity: 'minor'
      });
      const record = flightLog.toRecord();

      expect(record.had_incident).toBe(1);
    });

    it('should convert to JSON with computed fields', () => {
      const flightLog = new FlightLog(validFlightLogData);
      const json = flightLog.toJSON();

      expect(json.formatted_duration).toBe('00:25:00');
      expect(json.battery_usage).toBe(65);
      expect(json.data_rate_mb_per_min).toBeCloseTo(60, 0);
      expect(json.has_severe_incident).toBe(false);
      expect(json.had_incident).toBe(false); // Boolean, not int
    });

    it('should create from database record', () => {
      const record = {
        id: 1,
        mission_id: 1,
        pilot_id: 5,
        platform_id: 10,
        takeoff_time: '2026-01-26T09:00:00Z',
        landing_time: '2026-01-26T09:30:00Z',
        had_incident: 0 // Database stores as int
      };

      const flightLog = FlightLog.fromRecord(record);

      expect(flightLog.id).toBe(1);
      expect(flightLog.had_incident).toBe(false);
    });

    it('should create from database record with incident', () => {
      const record = {
        id: 2,
        mission_id: 1,
        pilot_id: 5,
        platform_id: 10,
        takeoff_time: '2026-01-26T09:00:00Z',
        landing_time: '2026-01-26T09:30:00Z',
        had_incident: 1, // Database stores as int
        incident_description: 'GPS signal lost briefly',
        incident_severity: 'minor'
      };

      const flightLog = FlightLog.fromRecord(record);

      expect(flightLog.id).toBe(2);
      expect(flightLog.had_incident).toBe(true); // Converted to boolean
      expect(flightLog.incident_description).toBe('GPS signal lost briefly');
    });
  });

  describe('Static Factory', () => {
    it('should create new flight log', () => {
      const flightLog = FlightLog.create({
        mission_id: 1,
        pilot_id: 5,
        platform_id: 10,
        takeoff_time: '2026-01-26T09:00:00Z',
        landing_time: '2026-01-26T09:25:00Z'
      });

      expect(flightLog.mission_id).toBe(1);
      expect(flightLog.flight_duration_seconds).toBeNull(); // Will be calculated
    });
  });

  describe('Constants', () => {
    it('should export valid incident severities', () => {
      expect(INCIDENT_SEVERITIES).toContain(null);
      expect(INCIDENT_SEVERITIES).toContain('minor');
      expect(INCIDENT_SEVERITIES).toContain('moderate');
      expect(INCIDENT_SEVERITIES).toContain('major');
      expect(INCIDENT_SEVERITIES).toContain('critical');
    });
  });
});
