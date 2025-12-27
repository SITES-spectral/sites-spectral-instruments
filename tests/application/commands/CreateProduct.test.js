/**
 * @vitest-environment node
 *
 * CreateProduct Command Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProduct } from '../../../src/application/commands/CreateProduct.js';

describe('CreateProduct Command', () => {
  let command;
  let mockProductRepository;

  const createMockProduct = (id, data) => ({
    id,
    ...data,
    toJSON: () => ({ id, ...data })
  });

  const validInput = {
    name: 'GCC Time Series 2025',
    description: 'Green chromatic coordinate time series',
    instrumentId: 1,
    productDate: '2025-01-15'
  };

  beforeEach(() => {
    mockProductRepository = {
      save: vi.fn()
    };

    command = new CreateProduct({
      productRepository: mockProductRepository
    });
  });

  describe('execute', () => {
    it('should create product with valid input', async () => {
      mockProductRepository.save.mockImplementation(product =>
        Promise.resolve(createMockProduct(1, {
          name: product.name,
          instrumentId: product.instrumentId
        }))
      );

      const result = await command.execute(validInput);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('GCC Time Series 2025');
    });

    it('should set default product type to image', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute(validInput);

      expect(savedProduct.type).toBe('image');
    });

    it('should set default processing level to L0', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute(validInput);

      expect(savedProduct.processingLevel).toBe('L0');
    });

    it('should set default quality control to raw', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute(validInput);

      expect(savedProduct.qualityControlLevel).toBe('raw');
    });

    it('should set default license to CC-BY-4.0', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute(validInput);

      expect(savedProduct.dataLicense).toBe('CC-BY-4.0');
    });

    it('should use provided processing level', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute({
        ...validInput,
        processingLevel: 'L2'
      });

      expect(savedProduct.processingLevel).toBe('L2');
    });

    it('should use provided product type', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute({
        ...validInput,
        type: 'timeseries'
      });

      expect(savedProduct.type).toBe('timeseries');
    });

    it('should include campaign association', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute({
        ...validInput,
        campaignId: 5
      });

      expect(savedProduct.campaignId).toBe(5);
    });

    it('should include file metadata', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute({
        ...validInput,
        format: 'GeoTIFF',
        fileSize: 1048576,
        checksum: 'abc123'
      });

      expect(savedProduct.format).toBe('GeoTIFF');
      expect(savedProduct.fileSize).toBe(1048576);
      expect(savedProduct.checksum).toBe('abc123');
    });

    it('should include keywords', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute({
        ...validInput,
        keywords: ['GCC', 'phenology', 'forest']
      });

      expect(savedProduct.keywords).toEqual(['GCC', 'phenology', 'forest']);
    });

    it('should default isPublic to true', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute(validInput);

      expect(savedProduct.isPublic).toBe(true);
    });

    it('should allow isPublic to be set to false', async () => {
      let savedProduct;
      mockProductRepository.save.mockImplementation(product => {
        savedProduct = product;
        return Promise.resolve(createMockProduct(1, {}));
      });

      await command.execute({
        ...validInput,
        isPublic: false
      });

      expect(savedProduct.isPublic).toBe(false);
    });
  });
});
