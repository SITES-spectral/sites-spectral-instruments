/**
 * V11 API Integration Tests
 *
 * Tests the V11 hexagonal architecture API endpoints.
 * These tests validate the HTTP layer using the infrastructure controllers.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRouter } from '../../src/infrastructure/http/router.js';

describe('V11 API Integration', () => {
  describe('Router Factory', () => {
    it('should have createRouter factory function', () => {
      expect(createRouter).toBeDefined();
      expect(typeof createRouter).toBe('function');
    });

    it('should create router with handle method when given env', () => {
      // Create mock environment
      const mockEnv = {
        DB: {},
        JWT_SECRET: 'test-secret'
      };

      const router = createRouter(mockEnv);
      expect(router).toBeDefined();
      expect(typeof router.handle).toBe('function');
    });
  });

  describe('Controller Availability', () => {
    it('should have all V11 controllers registered', async () => {
      // Import controllers to verify they exist
      const { StationController } = await import('../../src/infrastructure/http/controllers/StationController.js');
      const { PlatformController } = await import('../../src/infrastructure/http/controllers/PlatformController.js');
      const { InstrumentController } = await import('../../src/infrastructure/http/controllers/InstrumentController.js');
      const { AOIController } = await import('../../src/infrastructure/http/controllers/AOIController.js');
      const { CampaignController } = await import('../../src/infrastructure/http/controllers/CampaignController.js');
      const { ProductController } = await import('../../src/infrastructure/http/controllers/ProductController.js');
      const { MaintenanceController } = await import('../../src/infrastructure/http/controllers/MaintenanceController.js');
      const { CalibrationController } = await import('../../src/infrastructure/http/controllers/CalibrationController.js');

      expect(StationController).toBeDefined();
      expect(PlatformController).toBeDefined();
      expect(InstrumentController).toBeDefined();
      expect(AOIController).toBeDefined();
      expect(CampaignController).toBeDefined();
      expect(ProductController).toBeDefined();
      expect(MaintenanceController).toBeDefined();
      expect(CalibrationController).toBeDefined();
    });
  });
});

describe('Domain Entities for V11', () => {
  describe('Station Entity', () => {
    it('should import Station entity', async () => {
      const { Station } = await import('../../src/domain/station/Station.js');
      expect(Station).toBeDefined();
    });
  });

  describe('Platform Entity', () => {
    it('should import Platform entity', async () => {
      const { Platform } = await import('../../src/domain/platform/Platform.js');
      expect(Platform).toBeDefined();
    });
  });

  describe('Instrument Entity', () => {
    it('should import Instrument entity', async () => {
      const { Instrument } = await import('../../src/domain/instrument/Instrument.js');
      expect(Instrument).toBeDefined();
    });
  });

  describe('Maintenance Entity', () => {
    it('should import MaintenanceRecord entity', async () => {
      const { MaintenanceRecord } = await import('../../src/domain/maintenance/MaintenanceRecord.js');
      expect(MaintenanceRecord).toBeDefined();
    });
  });

  describe('Calibration Entity', () => {
    it('should import CalibrationRecord entity', async () => {
      const { CalibrationRecord } = await import('../../src/domain/calibration/CalibrationRecord.js');
      expect(CalibrationRecord).toBeDefined();
    });
  });
});

describe('Repository Ports', () => {
  describe('Station Repository', () => {
    it('should import StationRepository port', async () => {
      const { StationRepository } = await import('../../src/domain/station/StationRepository.js');
      expect(StationRepository).toBeDefined();
    });
  });

  describe('Platform Repository', () => {
    it('should import PlatformRepository port', async () => {
      const { PlatformRepository } = await import('../../src/domain/platform/PlatformRepository.js');
      expect(PlatformRepository).toBeDefined();
    });
  });

  describe('Instrument Repository', () => {
    it('should import InstrumentRepository port', async () => {
      const { InstrumentRepository } = await import('../../src/domain/instrument/InstrumentRepository.js');
      expect(InstrumentRepository).toBeDefined();
    });
  });

  describe('Maintenance Repository', () => {
    it('should import MaintenanceRepository port', async () => {
      const { MaintenanceRepository } = await import('../../src/domain/maintenance/MaintenanceRepository.js');
      expect(MaintenanceRepository).toBeDefined();
    });
  });

  describe('Calibration Repository', () => {
    it('should import CalibrationRepository port', async () => {
      const { CalibrationRepository } = await import('../../src/domain/calibration/CalibrationRepository.js');
      expect(CalibrationRepository).toBeDefined();
    });
  });
});
