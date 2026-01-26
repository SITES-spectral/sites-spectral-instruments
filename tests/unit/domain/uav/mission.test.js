/**
 * UAV Mission Entity Tests
 * Tests for mission lifecycle, state transitions, and approval workflow
 */

import { describe, it, expect } from 'vitest';
import { Mission, MISSION_STATUSES, FLIGHT_PATTERNS } from '../../../../src/domain/uav/Mission.js';

describe('Mission Entity', () => {
  // Valid mission data for testing
  const validMissionData = {
    station_id: 1,
    platform_id: 5,
    mission_code: 'SVB_2026-01-26_001',
    display_name: 'Forest Survey Q1',
    planned_date: '2026-01-26',
    planned_start_time: '09:00',
    planned_end_time: '12:00',
    planned_area_hectares: 50,
    planned_altitude_m: 120,
    planned_flight_pattern: 'grid',
    planned_overlap_side: 70,
    planned_overlap_front: 80,
    objectives: ['vegetation mapping', 'NDVI calculation'],
    target_products: ['orthomosaic', 'ndvi_map'],
    status: 'draft'
  };

  describe('Constructor & Validation', () => {
    it('should create mission with valid data', () => {
      const mission = new Mission(validMissionData);

      expect(mission.station_id).toBe(1);
      expect(mission.mission_code).toBe('SVB_2026-01-26_001');
      expect(mission.planned_flight_pattern).toBe('grid');
      expect(mission.status).toBe('draft');
    });

    it('should throw error for missing station_id', () => {
      expect(() => new Mission({ ...validMissionData, station_id: null }))
        .toThrow('Station ID is required');
    });

    it('should throw error for missing planned_date', () => {
      expect(() => new Mission({ ...validMissionData, planned_date: null }))
        .toThrow('Planned date is required');
    });

    it('should throw error for invalid status', () => {
      expect(() => new Mission({ ...validMissionData, status: 'INVALID' }))
        .toThrow('Invalid status');
    });

    it('should throw error for invalid flight pattern', () => {
      expect(() => new Mission({ ...validMissionData, planned_flight_pattern: 'INVALID' }))
        .toThrow('Invalid flight pattern');
    });

    it('should throw error for invalid quality score (out of range)', () => {
      expect(() => new Mission({ ...validMissionData, quality_score: 150 }))
        .toThrow('Quality score must be between 0 and 100');
    });

    it('should default status to draft', () => {
      const mission = new Mission({
        station_id: 1,
        planned_date: '2026-01-26'
      });
      expect(mission.status).toBe('draft');
    });

    it('should parse objectives from JSON string', () => {
      const mission = new Mission({
        ...validMissionData,
        objectives: '["vegetation mapping", "NDVI"]'
      });
      expect(mission.objectives).toEqual(['vegetation mapping', 'NDVI']);
    });

    it('should parse weather_conditions from JSON string', () => {
      const mission = new Mission({
        ...validMissionData,
        weather_conditions: '{"temperature_c": 15, "wind_speed_ms": 5}'
      });
      expect(mission.weather_conditions).toEqual({ temperature_c: 15, wind_speed_ms: 5 });
    });
  });

  describe('Mission Code Generation', () => {
    it('should generate correct mission code format', () => {
      const code = Mission.generateMissionCode('SVB', '2026-01-26', 1);
      expect(code).toBe('SVB_2026-01-26_001');
    });

    it('should pad sequence number to 3 digits', () => {
      expect(Mission.generateMissionCode('ANS', '2026-02-15', 3)).toBe('ANS_2026-02-15_003');
      expect(Mission.generateMissionCode('LON', '2026-03-20', 12)).toBe('LON_2026-03-20_012');
      expect(Mission.generateMissionCode('GRI', '2026-04-10', 100)).toBe('GRI_2026-04-10_100');
    });

    it('should uppercase station acronym', () => {
      const code = Mission.generateMissionCode('svb', '2026-01-26', 1);
      expect(code).toBe('SVB_2026-01-26_001');
    });
  });

  describe('State Checks', () => {
    it('should identify planning state', () => {
      const draftMission = new Mission({ ...validMissionData, status: 'draft' });
      const plannedMission = new Mission({ ...validMissionData, status: 'planned' });
      const approvedMission = new Mission({ ...validMissionData, status: 'approved' });

      expect(draftMission.isPlanning()).toBe(true);
      expect(plannedMission.isPlanning()).toBe(true);
      expect(approvedMission.isPlanning()).toBe(false);
    });

    it('should identify if mission needs approval', () => {
      const mission = new Mission({ ...validMissionData, status: 'planned' });
      expect(mission.needsApproval()).toBe(true);

      const approvedMission = new Mission({
        ...validMissionData,
        status: 'planned',
        approved_at: '2026-01-25T10:00:00Z'
      });
      expect(approvedMission.needsApproval()).toBe(false);
    });

    it('should identify approved missions', () => {
      const mission = new Mission({
        ...validMissionData,
        approved_at: '2026-01-25T10:00:00Z'
      });
      expect(mission.isApproved()).toBe(true);
    });

    it('should identify active missions', () => {
      const approved = new Mission({ ...validMissionData, status: 'approved' });
      const inProgress = new Mission({ ...validMissionData, status: 'in_progress' });
      const completed = new Mission({ ...validMissionData, status: 'completed' });

      expect(approved.isActive()).toBe(true);
      expect(inProgress.isActive()).toBe(true);
      expect(completed.isActive()).toBe(false);
    });

    it('should identify completed missions', () => {
      const mission = new Mission({ ...validMissionData, status: 'completed' });
      expect(mission.isCompleted()).toBe(true);
    });

    it('should identify cancelled/aborted missions', () => {
      const aborted = new Mission({ ...validMissionData, status: 'aborted' });
      const cancelled = new Mission({ ...validMissionData, status: 'cancelled' });

      expect(aborted.isCancelled()).toBe(true);
      expect(cancelled.isCancelled()).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should start approved mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'approved' });

      mission.start();

      expect(mission.status).toBe('in_progress');
      expect(mission.actual_start_time).toBeDefined();
    });

    it('should not start unapproved mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'planned' });

      expect(() => mission.start()).toThrow('Mission cannot be started - must be approved first');
    });

    it('should complete in-progress mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'in_progress' });

      mission.complete({ images_captured: 500, data_collected_gb: 12.5 });

      expect(mission.status).toBe('completed');
      expect(mission.actual_end_time).toBeDefined();
      expect(mission.images_captured).toBe(500);
      expect(mission.data_collected_gb).toBe(12.5);
    });

    it('should not complete non-in-progress mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'approved' });

      expect(() => mission.complete()).toThrow('Mission must be in progress to complete');
    });

    it('should abort approved or in-progress mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'in_progress' });

      mission.abort('Weather deterioration');

      expect(mission.status).toBe('aborted');
      expect(mission.actual_end_time).toBeDefined();
      expect(mission.notes).toContain('Aborted: Weather deterioration');
    });

    it('should not abort completed mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'completed' });

      expect(() => mission.abort('test')).toThrow('Can only abort approved or in-progress missions');
    });

    it('should cancel planned mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'planned' });

      mission.cancel('Client cancelled');

      expect(mission.status).toBe('cancelled');
      expect(mission.notes).toContain('Cancelled: Client cancelled');
    });

    it('should not cancel completed mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'completed' });

      expect(() => mission.cancel('test')).toThrow('Can only cancel planned missions');
    });

    it('should approve planned mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'planned' });

      mission.approve(42, 'All checks passed');

      expect(mission.status).toBe('approved');
      expect(mission.approved_by_user_id).toBe(42);
      expect(mission.approved_at).toBeDefined();
      expect(mission.approval_notes).toBe('All checks passed');
    });

    it('should not approve non-planned mission', () => {
      const mission = new Mission({ ...validMissionData, status: 'draft' });

      expect(() => mission.approve(42)).toThrow('Can only approve planned missions');
    });
  });

  describe('Duration Calculation', () => {
    it('should calculate actual duration in minutes', () => {
      const mission = new Mission({
        ...validMissionData,
        actual_start_time: '2026-01-26T09:00:00Z',
        actual_end_time: '2026-01-26T11:30:00Z'
      });

      expect(mission.getActualDurationMinutes()).toBe(150);
    });

    it('should return null when times not set', () => {
      const mission = new Mission(validMissionData);
      expect(mission.getActualDurationMinutes()).toBeNull();
    });
  });

  describe('Serialization', () => {
    it('should convert to database record format', () => {
      const mission = new Mission(validMissionData);
      const record = mission.toRecord();

      expect(record.station_id).toBe(1);
      expect(record.objectives).toBe('["vegetation mapping","NDVI calculation"]');
      expect(record.target_products).toBe('["orthomosaic","ndvi_map"]');
    });

    it('should convert to JSON with computed fields', () => {
      const mission = new Mission({ ...validMissionData, status: 'approved' });
      const json = mission.toJSON();

      expect(json.is_planning).toBe(false);
      expect(json.is_approved).toBe(false); // No approved_at set
      expect(json.is_active).toBe(true);
      expect(json.can_start).toBe(true);
      expect(json.objectives).toEqual(['vegetation mapping', 'NDVI calculation']);
    });

    it('should create from database record', () => {
      const record = {
        id: 1,
        station_id: 1,
        planned_date: '2026-01-26',
        objectives: '["test"]',
        status: 'draft'
      };

      const mission = Mission.fromRecord(record);

      expect(mission.id).toBe(1);
      expect(mission.objectives).toEqual(['test']);
    });
  });

  describe('Constants', () => {
    it('should export valid mission statuses', () => {
      expect(MISSION_STATUSES).toContain('draft');
      expect(MISSION_STATUSES).toContain('planned');
      expect(MISSION_STATUSES).toContain('approved');
      expect(MISSION_STATUSES).toContain('in_progress');
      expect(MISSION_STATUSES).toContain('completed');
      expect(MISSION_STATUSES).toContain('aborted');
      expect(MISSION_STATUSES).toContain('cancelled');
    });

    it('should export valid flight patterns', () => {
      expect(FLIGHT_PATTERNS).toContain('grid');
      expect(FLIGHT_PATTERNS).toContain('crosshatch');
      expect(FLIGHT_PATTERNS).toContain('perimeter');
      expect(FLIGHT_PATTERNS).toContain('point_of_interest');
      expect(FLIGHT_PATTERNS).toContain('custom');
    });
  });
});
