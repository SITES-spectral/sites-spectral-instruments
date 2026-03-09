/**
 * @vitest-environment node
 *
 * RemovePilotFromMission Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemovePilotFromMission } from '../../../../src/application/commands/uav/RemovePilotFromMission.js';

describe('RemovePilotFromMission Command', () => {
  let command;
  let mockMissionRepository;
  let mockPilotRepository;

  const createMockMission = (id) => ({ id, station_id: 1, status: 'approved' });
  const createMockPilot = (id) => ({ id, full_name: 'Test Pilot' });

  beforeEach(() => {
    mockMissionRepository = {
      findById: vi.fn(),
      removePilotFromMission: vi.fn()
    };

    mockPilotRepository = {
      findById: vi.fn()
    };

    command = new RemovePilotFromMission({
      missionRepository: mockMissionRepository,
      pilotRepository: mockPilotRepository
    });
  });

  describe('execute', () => {
    it('should remove pilot from mission successfully', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10));
      mockPilotRepository.findById.mockResolvedValue(createMockPilot(5));
      mockMissionRepository.removePilotFromMission.mockResolvedValue(true);

      const result = await command.execute({ missionId: 10, pilotId: 5 });

      expect(result).toBe(true);
      expect(mockMissionRepository.removePilotFromMission).toHaveBeenCalledWith(10, 5);
    });

    it('should throw if mission not found', async () => {
      mockMissionRepository.findById.mockResolvedValue(null);

      await expect(command.execute({ missionId: 99, pilotId: 5 }))
        .rejects.toThrow('Mission 99 not found');

      expect(mockMissionRepository.removePilotFromMission).not.toHaveBeenCalled();
    });

    it('should throw if pilot not found', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10));
      mockPilotRepository.findById.mockResolvedValue(null);

      await expect(command.execute({ missionId: 10, pilotId: 99 }))
        .rejects.toThrow('Pilot 99 not found');

      expect(mockMissionRepository.removePilotFromMission).not.toHaveBeenCalled();
    });

    it('should throw if pilot was not assigned to mission', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(10));
      mockPilotRepository.findById.mockResolvedValue(createMockPilot(5));
      mockMissionRepository.removePilotFromMission.mockResolvedValue(false);

      await expect(command.execute({ missionId: 10, pilotId: 5 }))
        .rejects.toThrow('Pilot 5 is not assigned to mission 10');
    });

    it('should call removePilotFromMission with correct ids', async () => {
      mockMissionRepository.findById.mockResolvedValue(createMockMission(7));
      mockPilotRepository.findById.mockResolvedValue(createMockPilot(3));
      mockMissionRepository.removePilotFromMission.mockResolvedValue(true);

      await command.execute({ missionId: 7, pilotId: 3 });

      expect(mockMissionRepository.removePilotFromMission).toHaveBeenCalledWith(7, 3);
    });

    it('should validate mission before pilot lookup', async () => {
      mockMissionRepository.findById.mockResolvedValue(null);

      await expect(command.execute({ missionId: 1, pilotId: 1 }))
        .rejects.toThrow('Mission 1 not found');

      expect(mockPilotRepository.findById).not.toHaveBeenCalled();
    });
  });
});
