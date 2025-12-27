/**
 * @vitest-environment node
 *
 * CreateStation Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateStation } from '../../../src/application/commands/CreateStation.js';

describe('CreateStation Command', () => {
  let command;
  let mockStationRepository;

  const validInput = {
    acronym: 'TEST',
    displayName: 'Test Station',
    description: 'A test station',
    latitude: 64.256,
    longitude: 19.774,
    websiteUrl: 'https://test.example.com',
    contactEmail: 'test@example.com'
  };

  const createMockStation = (data) => ({
    id: 1,
    ...data,
    toJSON: () => ({ id: 1, ...data })
  });

  beforeEach(() => {
    mockStationRepository = {
      findByAcronym: vi.fn(),
      save: vi.fn()
    };

    command = new CreateStation({
      stationRepository: mockStationRepository
    });
  });

  describe('execute', () => {
    it('should create station with valid input', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);
      mockStationRepository.save.mockImplementation(station =>
        Promise.resolve(createMockStation({
          acronym: station.acronym,
          displayName: station.displayName,
          latitude: station.latitude,
          longitude: station.longitude
        }))
      );

      const result = await command.execute(validInput);

      expect(mockStationRepository.findByAcronym).toHaveBeenCalledWith('TEST');
      expect(mockStationRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should throw error if acronym already exists', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(
        createMockStation({ acronym: 'TEST' })
      );

      await expect(command.execute(validInput))
        .rejects.toThrow("Station with acronym 'TEST' already exists");

      expect(mockStationRepository.save).not.toHaveBeenCalled();
    });

    it('should validate acronym format', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);

      await expect(command.execute({
        ...validInput,
        acronym: 'test' // lowercase - should fail
      })).rejects.toThrow();
    });

    it('should validate latitude range', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);

      await expect(command.execute({
        ...validInput,
        latitude: 100 // out of range
      })).rejects.toThrow();
    });

    it('should validate longitude range', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);

      await expect(command.execute({
        ...validInput,
        longitude: 200 // out of range
      })).rejects.toThrow();
    });

    it('should require display name', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);

      await expect(command.execute({
        ...validInput,
        displayName: ''
      })).rejects.toThrow();
    });

    it('should allow optional description', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);
      mockStationRepository.save.mockImplementation(station =>
        Promise.resolve(createMockStation({
          acronym: station.acronym,
          displayName: station.displayName,
          latitude: station.latitude,
          longitude: station.longitude,
          description: station.description
        }))
      );

      const inputWithoutDescription = { ...validInput };
      delete inputWithoutDescription.description;

      const result = await command.execute(inputWithoutDescription);
      expect(result).toBeDefined();
    });

    it('should allow optional website URL', async () => {
      mockStationRepository.findByAcronym.mockResolvedValue(null);
      mockStationRepository.save.mockImplementation(station =>
        Promise.resolve(createMockStation({
          acronym: station.acronym,
          displayName: station.displayName,
          latitude: station.latitude,
          longitude: station.longitude
        }))
      );

      const inputWithoutUrl = { ...validInput };
      delete inputWithoutUrl.websiteUrl;

      const result = await command.execute(inputWithoutUrl);
      expect(result).toBeDefined();
    });
  });
});
