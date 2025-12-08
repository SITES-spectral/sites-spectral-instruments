/**
 * Create Product Use Case
 *
 * Application layer command for creating a new data product.
 * Orchestrates domain logic and persistence.
 *
 * @module application/commands/CreateProduct
 */

import { Product } from '../../domain/index.js';

/**
 * @typedef {Object} CreateProductInput
 * @property {string} name - Product name
 * @property {string} [description] - Product description
 * @property {string} [type] - Product type
 * @property {number} instrumentId - Instrument ID
 * @property {number} [campaignId] - Campaign ID
 * @property {string} [processingLevel] - Processing level (L0-L4)
 * @property {string} [dataPath] - Path to data file
 * @property {string} [dataUrl] - URL to data file
 * @property {Object} [metadata] - Additional metadata
 * @property {number} [qualityScore] - Quality score (0-1)
 * @property {string} [qualityControlLevel] - Quality control level
 * @property {string} productDate - Product date (ISO 8601)
 * @property {string} [processingDate] - Processing date (ISO 8601)
 * @property {string} [dataLicense] - Data license
 * @property {string[]} [keywords] - Keywords
 * @property {string} [spatialResolution] - Spatial resolution
 * @property {string} [temporalResolution] - Temporal resolution
 * @property {string} [format] - File format
 * @property {number} [fileSize] - File size in bytes
 * @property {string} [checksum] - File checksum
 * @property {boolean} [isPublic] - Whether product is public
 */

/**
 * Create Product Command
 */
export class CreateProduct {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/product/ProductRepository.js').ProductRepository} dependencies.productRepository
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the create product command
   *
   * @param {CreateProductInput} input - Product data
   * @returns {Promise<Product>} Created product
   * @throws {Error} If validation fails
   */
  async execute(input) {
    // Create product entity (validates input)
    const product = new Product({
      name: input.name,
      description: input.description,
      type: input.type || Product.TYPES.IMAGE,
      instrumentId: input.instrumentId,
      campaignId: input.campaignId,
      processingLevel: input.processingLevel || Product.PROCESSING_LEVELS.L0,
      dataPath: input.dataPath,
      dataUrl: input.dataUrl,
      metadata: input.metadata || {},
      qualityScore: input.qualityScore,
      qualityControlLevel: input.qualityControlLevel || Product.QUALITY_CONTROL.RAW,
      productDate: input.productDate,
      processingDate: input.processingDate,
      dataLicense: input.dataLicense || Product.LICENSES.CC_BY_4_0,
      licenseUrl: input.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/',
      keywords: input.keywords || [],
      spatialResolution: input.spatialResolution,
      temporalResolution: input.temporalResolution,
      format: input.format,
      fileSize: input.fileSize,
      checksum: input.checksum,
      isPublic: input.isPublic !== undefined ? input.isPublic : true
    });

    // Persist and return
    return await this.productRepository.save(product);
  }
}
