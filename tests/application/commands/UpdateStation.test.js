/**
 * @vitest-environment node
 *
 * UpdateStation Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateStation } from '../../../src/application/commands/UpdateStation.js';

describe('UpdateStation Command', () => {
  let command;
  let mockStationRepository;

  const createMockStation = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  beforeEach(() => {
    mockStationRepository = {
      findById: vi.fn(),
      save: vi.fn()
    };

    command = new UpdateStation({
      stationRepository: mockStationRepository
    });
  });

  describe('execute', () => {
    it('should update station display name', async () => {
      const existingStation = createMockStation(1, {
        acronym: 'SVB',
        displayName: 'Old Name',
        description: 'Description',
        latitude: 64.256,
        longitude: 19.774
      });

      mockStationRepository.findById.mockResolvedValue(existingStation);
      mockStationRepository.save.mockImplementation(station =>
        Promise.resolve(station)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'New Name'
      });

      expect(result.displayName).toBe('New Name');
      expect(result.description).toBe('Description'); // unchanged
    });

    it('should update multiple fields', async () => {
      const existingStation = createMockStation(1, {
        acronym: 'SVB',
        displayName: 'Old Name',
        latitude: 64.256,
        longitude: 19.774
      });

      mockStationRepository.findById.mockResolvedValue(existingStation);
      mockStationRepository.save.mockImplementation(station =>
        Promise.resolve(station)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'Updated Name',
        description: 'New description',
        latitude: 65.0,
        longitude: 20.0
      });

      expect(result.displayName).toBe('Updated Name');
      expect(result.description).toBe('New description');
      expect(result.latitude).toBe(65.0);
      expect(result.longitude).toBe(20.0);
    });

    it('should throw error if station not found', async () => {
      mockStationRepository.findById.mockResolvedValue(null);

      await expect(command.execute({
        id: 999,
        displayName: 'New Name'
      })).rejects.toThrow("Station with ID '999' not found");
    });

    it('should update timestamp', async () => {
      const existingStation = createMockStation(1, {
        acronym: 'SVB',
        displayName: 'Name',
        updatedAt: '2024-01-01T00:00:00.000Z'
      });

      mockStationRepository.findById.mockResolvedValue(existingStation);
      mockStationRepository.save.mockImplementation(station =>
        Promise.resolve(station)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'Updated'
      });

      expect(result.updatedAt).not.toBe('2024-01-01T00:00:00.000Z');
    });

    it('should update website URL', async () => {
      const existingStation = createMockStation(1, {
        acronym: 'SVB',
        displayName: 'Name'
      });

      mockStationRepository.findById.mockResolvedValue(existingStation);
      mockStationRepository.save.mockImplementation(station =>
        Promise.resolve(station)
      );

      const result = await command.execute({
        id: 1,
        websiteUrl: 'https://example.com'
      });

      expect(result.websiteUrl).toBe('https://example.com');
    });

    it('should update contact email', async () => {
      const existingStation = createMockStation(1, {
        acronym: 'SVB',
        displayName: 'Name'
      });

      mockStationRepository.findById.mockResolvedValue(existingStation);
      mockStationRepository.save.mockImplementation(station =>
        Promise.resolve(station)
      );

      const result = await command.execute({
        id: 1,
        contactEmail: 'test@example.com'
      });

      expect(result.contactEmail).toBe('test@example.com');
    });
  });
});
