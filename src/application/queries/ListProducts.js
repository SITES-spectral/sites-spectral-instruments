/**
 * List Products Query
 *
 * Application layer query for listing products with various filters.
 *
 * @module application/queries/ListProducts
 */

/**
 * List Products Query
 */
export class ListProducts {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/product/ProductRepository.js').ProductRepository} dependencies.productRepository
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  /**
   * List all products
   *
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async all() {
    return await this.productRepository.findAll();
  }

  /**
   * List products by instrument ID
   *
   * @param {number} instrumentId - Instrument ID
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async byInstrument(instrumentId) {
    return await this.productRepository.findByInstrumentId(instrumentId);
  }

  /**
   * List products by campaign ID
   *
   * @param {number} campaignId - Campaign ID
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async byCampaign(campaignId) {
    return await this.productRepository.findByCampaignId(campaignId);
  }

  /**
   * List products by processing level
   *
   * @param {string} processingLevel - Processing level (L0-L4)
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async byProcessingLevel(processingLevel) {
    return await this.productRepository.findByProcessingLevel(processingLevel);
  }

  /**
   * List products by type
   *
   * @param {string} type - Product type
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async byType(type) {
    return await this.productRepository.findByType(type);
  }

  /**
   * List products by quality control level
   *
   * @param {string} qualityControlLevel - Quality control level
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async byQualityControlLevel(qualityControlLevel) {
    return await this.productRepository.findByQualityControlLevel(qualityControlLevel);
  }

  /**
   * List public products
   *
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async public() {
    return await this.productRepository.findPublicProducts();
  }

  /**
   * List products in date range
   *
   * @param {string} startDate - Start date (ISO 8601)
   * @param {string} endDate - End date (ISO 8601)
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async inDateRange(startDate, endDate) {
    return await this.productRepository.findByDateRange(startDate, endDate);
  }

  /**
   * List products by instrument and date range
   *
   * @param {number} instrumentId - Instrument ID
   * @param {string} startDate - Start date (ISO 8601)
   * @param {string} endDate - End date (ISO 8601)
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async byInstrumentAndDateRange(instrumentId, startDate, endDate) {
    return await this.productRepository.findByInstrumentAndDateRange(instrumentId, startDate, endDate);
  }

  /**
   * List latest products by instrument
   *
   * @param {number} instrumentId - Instrument ID
   * @param {number} limit - Maximum number of products
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async latestByInstrument(instrumentId, limit = 10) {
    return await this.productRepository.findLatestByInstrument(instrumentId, limit);
  }

  /**
   * List products by keyword
   *
   * @param {string} keyword - Keyword
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async byKeyword(keyword) {
    return await this.productRepository.findByKeyword(keyword);
  }

  /**
   * List products with minimum quality score
   *
   * @param {number} threshold - Minimum quality score (0-1)
   * @returns {Promise<import('../../domain/product/Product.js').Product[]>}
   */
  async byMinQualityScore(threshold) {
    return await this.productRepository.findByMinQualityScore(threshold);
  }

  /**
   * Get product count by instrument
   *
   * @param {number} instrumentId - Instrument ID
   * @returns {Promise<number>}
   */
  async countByInstrument(instrumentId) {
    return await this.productRepository.countByInstrumentId(instrumentId);
  }

  /**
   * Get product count by processing level
   *
   * @param {string} processingLevel - Processing level
   * @returns {Promise<number>}
   */
  async countByProcessingLevel(processingLevel) {
    return await this.productRepository.countByProcessingLevel(processingLevel);
  }
}
