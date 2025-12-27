/**
 * @vitest-environment node
 *
 * UpdatePlatform Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePlatform } from '../../../src/application/commands/UpdatePlatform.js';

describe('UpdatePlatform Command', () => {
  let command;
  let mockPlatformRepository;

  const createMockPlatform = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  beforeEach(() => {
    mockPlatformRepository = {
      findById: vi.fn(),
      save: vi.fn()
    };

    command = new UpdatePlatform({
      platformRepository: mockPlatformRepository
    });
  });

  describe('execute', () => {
    it('should update platform display name', async () => {
      const existingPlatform = createMockPlatform(1, {
        normalizedName: 'SVB_FOR_TWR01',
        displayName: 'Old Name',
        platformType: 'fixed',
        ecosystemCode: 'FOR'
      });

      mockPlatformRepository.findById.mockResolvedValue(existingPlatform);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(platform)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'New Platform Name'
      });

      expect(result.displayName).toBe('New Platform Name');
      expect(result.normalizedName).toBe('SVB_FOR_TWR01'); // unchanged
    });

    it('should update multiple fields', async () => {
      const existingPlatform = createMockPlatform(1, {
        normalizedName: 'SVB_FOR_TWR01',
        displayName: 'Old Name',
        description: 'Old description',
        latitude: 64.256,
        longitude: 19.774,
        status: 'Active'
      });

      mockPlatformRepository.findById.mockResolvedValue(existingPlatform);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(platform)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'Updated Name',
        description: 'New description',
        latitude: 65.0,
        longitude: 20.0,
        status: 'Inactive'
      });

      expect(result.displayName).toBe('Updated Name');
      expect(result.description).toBe('New description');
      expect(result.latitude).toBe(65.0);
      expect(result.longitude).toBe(20.0);
      expect(result.status).toBe('Inactive');
    });

    it('should throw error if platform not found', async () => {
      mockPlatformRepository.findById.mockResolvedValue(null);

      await expect(command.execute({
        id: 999,
        displayName: 'New Name'
      })).rejects.toThrow("Platform with ID '999' not found");
    });

    it('should update timestamp', async () => {
      const existingPlatform = createMockPlatform(1, {
        normalizedName: 'SVB_FOR_TWR01',
        displayName: 'Name',
        updatedAt: '2024-01-01T00:00:00.000Z'
      });

      mockPlatformRepository.findById.mockResolvedValue(existingPlatform);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(platform)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'Updated'
      });

      expect(result.updatedAt).not.toBe('2024-01-01T00:00:00.000Z');
    });

    it('should preserve normalized name (immutable)', async () => {
      const existingPlatform = createMockPlatform(1, {
        normalizedName: 'SVB_FOR_TWR01',
        displayName: 'Name'
      });

      mockPlatformRepository.findById.mockResolvedValue(existingPlatform);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(platform)
      );

      const result = await command.execute({
        id: 1,
        displayName: 'Updated Name'
      });

      // Normalized name should not change even if attempted
      expect(result.normalizedName).toBe('SVB_FOR_TWR01');
    });

    it('should update description only', async () => {
      const existingPlatform = createMockPlatform(1, {
        normalizedName: 'SVB_FOR_TWR01',
        displayName: 'Platform Name',
        description: 'Old description'
      });

      mockPlatformRepository.findById.mockResolvedValue(existingPlatform);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(platform)
      );

      const result = await command.execute({
        id: 1,
        description: 'New detailed description'
      });

      expect(result.description).toBe('New detailed description');
      expect(result.displayName).toBe('Platform Name'); // unchanged
    });

    it('should update coordinates', async () => {
      const existingPlatform = createMockPlatform(1, {
        normalizedName: 'SVB_FOR_TWR01',
        displayName: 'Platform Name',
        latitude: 64.256,
        longitude: 19.774
      });

      mockPlatformRepository.findById.mockResolvedValue(existingPlatform);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(platform)
      );

      const result = await command.execute({
        id: 1,
        latitude: 64.300,
        longitude: 19.800
      });

      expect(result.latitude).toBe(64.300);
      expect(result.longitude).toBe(19.800);
    });

    it('should update status', async () => {
      const existingPlatform = createMockPlatform(1, {
        normalizedName: 'SVB_FOR_TWR01',
        displayName: 'Platform Name',
        status: 'Active'
      });

      mockPlatformRepository.findById.mockResolvedValue(existingPlatform);
      mockPlatformRepository.save.mockImplementation(platform =>
        Promise.resolve(platform)
      );

      const result = await command.execute({
        id: 1,
        status: 'Inactive'
      });

      expect(result.status).toBe('Inactive');
    });
  });
});
