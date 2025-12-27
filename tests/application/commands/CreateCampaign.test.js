/**
 * @vitest-environment node
 *
 * CreateCampaign Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCampaign } from '../../../src/application/commands/CreateCampaign.js';

describe('CreateCampaign Command', () => {
  let command;
  let mockCampaignRepository;

  const createMockCampaign = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  const validInput = {
    name: 'Summer Field Campaign 2025',
    description: 'Annual vegetation monitoring',
    startDate: '2025-06-01',
    endDate: '2025-08-31',
    stationId: 1
  };

  beforeEach(() => {
    mockCampaignRepository = {
      save: vi.fn()
    };

    command = new CreateCampaign({
      campaignRepository: mockCampaignRepository
    });
  });

  describe('execute', () => {
    it('should create campaign with valid input', async () => {
      mockCampaignRepository.save.mockImplementation(campaign =>
        Promise.resolve(createMockCampaign(1, {
          name: campaign.name,
          startDate: campaign.startDate,
          stationId: campaign.stationId
        }))
      );

      const result = await command.execute(validInput);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Summer Field Campaign 2025');
    });

    it('should set status to planned', async () => {
      let savedCampaign;
      mockCampaignRepository.save.mockImplementation(campaign => {
        savedCampaign = campaign;
        return Promise.resolve(createMockCampaign(1, {}));
      });

      await command.execute(validInput);

      expect(savedCampaign.status).toBe('planned');
    });

    it('should set default campaign type', async () => {
      let savedCampaign;
      mockCampaignRepository.save.mockImplementation(campaign => {
        savedCampaign = campaign;
        return Promise.resolve(createMockCampaign(1, {}));
      });

      await command.execute(validInput);

      expect(savedCampaign.campaignType).toBe('field_campaign');
    });

    it('should use provided campaign type', async () => {
      let savedCampaign;
      mockCampaignRepository.save.mockImplementation(campaign => {
        savedCampaign = campaign;
        return Promise.resolve(createMockCampaign(1, {}));
      });

      await command.execute({
        ...validInput,
        campaignType: 'calibration'
      });

      expect(savedCampaign.campaignType).toBe('calibration');
    });

    it('should include platform and AOI associations', async () => {
      let savedCampaign;
      mockCampaignRepository.save.mockImplementation(campaign => {
        savedCampaign = campaign;
        return Promise.resolve(createMockCampaign(1, {}));
      });

      await command.execute({
        ...validInput,
        platformId: 5,
        aoiId: 3
      });

      expect(savedCampaign.platformId).toBe(5);
      expect(savedCampaign.aoiId).toBe(3);
    });

    it('should include objectives', async () => {
      let savedCampaign;
      mockCampaignRepository.save.mockImplementation(campaign => {
        savedCampaign = campaign;
        return Promise.resolve(createMockCampaign(1, {}));
      });

      await command.execute({
        ...validInput,
        objectives: ['Measure LAI', 'Collect ground truth']
      });

      expect(savedCampaign.objectives).toEqual(['Measure LAI', 'Collect ground truth']);
    });

    it('should include budget information', async () => {
      let savedCampaign;
      mockCampaignRepository.save.mockImplementation(campaign => {
        savedCampaign = campaign;
        return Promise.resolve(createMockCampaign(1, {}));
      });

      await command.execute({
        ...validInput,
        fundingSource: 'VR Grant',
        budget: 50000
      });

      expect(savedCampaign.fundingSource).toBe('VR Grant');
      expect(savedCampaign.budget).toBe(50000);
    });

    it('should include coordinator', async () => {
      let savedCampaign;
      mockCampaignRepository.save.mockImplementation(campaign => {
        savedCampaign = campaign;
        return Promise.resolve(createMockCampaign(1, {}));
      });

      await command.execute({
        ...validInput,
        coordinatorId: 2
      });

      expect(savedCampaign.coordinatorId).toBe(2);
    });

    it('should default empty arrays', async () => {
      let savedCampaign;
      mockCampaignRepository.save.mockImplementation(campaign => {
        savedCampaign = campaign;
        return Promise.resolve(createMockCampaign(1, {}));
      });

      await command.execute(validInput);

      expect(savedCampaign.participants).toEqual([]);
      expect(savedCampaign.objectives).toEqual([]);
      expect(savedCampaign.expectedOutcomes).toEqual([]);
    });
  });
});
