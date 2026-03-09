/**
 * @vitest-environment node
 *
 * AssignPilotToMission Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssignPilotToMission } from '../../../../src/application/commands/uav/AssignPilotToMission.js';

describe('AssignPilotToMission Command', () => {
  let command;
  let mockMissionRepository;
  let mockPilotRepository;

  const createMockMission = (id, stationId = 1) => ({
    id,
    station_id: stationId,
    status: 'approved'
  });

  const createMockPilot = (id, overrides = {}) => ({
    id,
    full_name: 'Test Pilot',
    canFly: vi.fn().mockReturnValue(true),
    isAuthorizedForStation: vi.fn().mockReturnValue(true),
    ...overrides
  });

  beforeEach(() => {
    mockMissionRepository = {
      findById: vi.fn(),
      addPilotToMission: vi.fn()
    };

    mockPilotRepository = {
      findById: vi.fn()
    };

    command = new AssignPilotToMission({
      missionRepository: mockMissionRepository,
      pilotRepository: mockPilotRepository
    });
  });

  describe('execute', () => {
    it('should assign pilot to mission successfully', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10, 1));
      mockPilotRepository.findById.mockResolvedValue(createMockPilot(5));
      mockMissionRepository.addPilotToMission.mockResolvedValue(true);

      const result = await command.execute({ missionId: 10, pilotId: 5 });

      expect(result).toBe(true);
      expect(mockMissionRepository.addPilotToMission).toHaveBeenCalledWith(10, 5, 'pilot', undefined);
    });

    it('should pass role and assignedByUserId to repository', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10, 1));
      mockPilotRepository.findById.mockResolvedValue(createMockPilot(5));
      mockMissionRepository.addPilotToMission.mockResolvedValue(true);

      await command.execute({ missionId: 10, pilotId: 5, role: 'observer', assignedByUserId: 99 });

      expect(mockMissionRepository.addPilotToMission).toHaveBeenCalledWith(10, 5, 'observer', 99);
    });

    it('should default role to pilot', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10, 1));
      mockPilotRepository.findById.mockResolvedValue(createMockPilot(5));
      mockMissionRepository.addPilotToMission.mockResolvedValue(true);

      await command.execute({ missionId: 10, pilotId: 5 });

      expect(mockMissionRepository.addPilotToMission).toHaveBeenCalledWith(10, 5, 'pilot', undefined);
    });

    it('should throw if mission not found', async () => {
      mockMissionRepository.findById.mockResolvedValue(null);

      await expect(command.execute({ missionId: 99, pilotId: 5 }))
        .rejects.toThrow('Mission 99 not found');
    });

    it('should throw if pilot not found', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10, 1));
      mockPilotRepository.findById.mockResolvedValue(null);

      await expect(command.execute({ missionId: 10, pilotId: 99 }))
        .rejects.toThrow('Pilot 99 not found');
    });

    it('should throw if pilot cannot fly', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10, 1));
      mockPilotRepository.findById.mockResolvedValue(
        createMockPilot(5, { full_name: 'Grounded Pilot', canFly: vi.fn().mockReturnValue(false) })
      );

      await expect(command.execute({ missionId: 10, pilotId: 5 }))
        .rejects.toThrow('Grounded Pilot cannot fly - check certificate and insurance status');
    });

    it('should throw if pilot not authorized for station', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10, 2));
      mockPilotRepository.findById.mockResolvedValue(
        createMockPilot(5, {
          full_name: 'Unauthorized Pilot',
          isAuthorizedForStation: vi.fn().mockReturnValue(false)
        })
      );

      await expect(command.execute({ missionId: 10, pilotId: 5 }))
        .rejects.toThrow('Unauthorized Pilot is not authorized to fly at station 2');
    });

    it('should throw if pilot already assigned', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10, 1));
      mockPilotRepository.findById.mockResolvedValue(createMockPilot(5));
      mockMissionRepository.addPilotToMission.mockResolvedValue(false);

      await expect(command.execute({ missionId: 10, pilotId: 5 }))
        .rejects.toThrow('Pilot 5 is already assigned to mission 10');
    });

    it('should check station authorization against mission station_id', async () => {
      const pilot = createMockPilot(5);
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10, 42));
      mockPilotRepository.findById.mockResolvedValue(pilot);
      mockMissionRepository.addPilotToMission.mockResolvedValue(true);

      await command.execute({ missionId: 10, pilotId: 5 });

      expect(pilot.isAuthorizedForStation).toHaveBeenCalledWith(42);
    });
  });
});
