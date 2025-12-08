/**
 * Product Repository Port (Interface)
 *
 * Defines the contract for Product persistence operations.
 * Follows Interface Segregation Principle - focused interface for product operations.
 * Follows Dependency Inversion Principle - domain depends on this abstraction.
 *
 * Implementations (adapters) live in infrastructure layer.
 *
 * @module domain/product/ProductRepository
 */

export class ProductRepository {
    /**
     * Find product by ID
     * @param {number} id - Product ID
     * @returns {Promise<Product|null>}
     */
    async findById(id) {
        throw new Error('Method findById() must be implemented');
    }

    /**
     * Find all products for an instrument
     * @param {number} instrumentId - Instrument ID
     * @returns {Promise<Product[]>}
     */
    async findByInstrumentId(instrumentId) {
        throw new Error('Method findByInstrumentId() must be implemented');
    }

    /**
     * Find all products for a campaign
     * @param {number} campaignId - Campaign ID
     * @returns {Promise<Product[]>}
     */
    async findByCampaignId(campaignId) {
        throw new Error('Method findByCampaignId() must be implemented');
    }

    /**
     * Find products by processing level
     * @param {string} processingLevel - Processing level (L0, L1, L2, L3, L4)
     * @returns {Promise<Product[]>}
     */
    async findByProcessingLevel(processingLevel) {
        throw new Error('Method findByProcessingLevel() must be implemented');
    }

    /**
     * Find products by type
     * @param {string} type - Product type
     * @returns {Promise<Product[]>}
     */
    async findByType(type) {
        throw new Error('Method findByType() must be implemented');
    }

    /**
     * Find products by quality control level
     * @param {string} qualityControlLevel - Quality control level
     * @returns {Promise<Product[]>}
     */
    async findByQualityControlLevel(qualityControlLevel) {
        throw new Error('Method findByQualityControlLevel() must be implemented');
    }

    /**
     * Find public products
     * @returns {Promise<Product[]>}
     */
    async findPublicProducts() {
        throw new Error('Method findPublicProducts() must be implemented');
    }

    /**
     * Find products within date range
     * @param {string} startDate - Start date (ISO 8601)
     * @param {string} endDate - End date (ISO 8601)
     * @returns {Promise<Product[]>}
     */
    async findByDateRange(startDate, endDate) {
        throw new Error('Method findByDateRange() must be implemented');
    }

    /**
     * Find products by keyword
     * @param {string} keyword - Keyword to search for
     * @returns {Promise<Product[]>}
     */
    async findByKeyword(keyword) {
        throw new Error('Method findByKeyword() must be implemented');
    }

    /**
     * Find products with quality score above threshold
     * @param {number} threshold - Minimum quality score (0-1)
     * @returns {Promise<Product[]>}
     */
    async findByMinQualityScore(threshold) {
        throw new Error('Method findByMinQualityScore() must be implemented');
    }

    /**
     * Find products for instrument within date range
     * @param {number} instrumentId - Instrument ID
     * @param {string} startDate - Start date (ISO 8601)
     * @param {string} endDate - End date (ISO 8601)
     * @returns {Promise<Product[]>}
     */
    async findByInstrumentAndDateRange(instrumentId, startDate, endDate) {
        throw new Error('Method findByInstrumentAndDateRange() must be implemented');
    }

    /**
     * Find latest products for an instrument
     * @param {number} instrumentId - Instrument ID
     * @param {number} limit - Maximum number of products to return
     * @returns {Promise<Product[]>}
     */
    async findLatestByInstrument(instrumentId, limit = 10) {
        throw new Error('Method findLatestByInstrument() must be implemented');
    }

    /**
     * Find all products
     * @returns {Promise<Product[]>}
     */
    async findAll() {
        throw new Error('Method findAll() must be implemented');
    }

    /**
     * Save product (create or update)
     * @param {Product} product - Product entity
     * @returns {Promise<Product>}
     */
    async save(product) {
        throw new Error('Method save() must be implemented');
    }

    /**
     * Delete product by ID
     * @param {number} id - Product ID
     * @returns {Promise<boolean>}
     */
    async deleteById(id) {
        throw new Error('Method deleteById() must be implemented');
    }

    /**
     * Count products for an instrument
     * @param {number} instrumentId - Instrument ID
     * @returns {Promise<number>}
     */
    async countByInstrumentId(instrumentId) {
        throw new Error('Method countByInstrumentId() must be implemented');
    }

    /**
     * Count products by processing level
     * @param {string} processingLevel - Processing level
     * @returns {Promise<number>}
     */
    async countByProcessingLevel(processingLevel) {
        throw new Error('Method countByProcessingLevel() must be implemented');
    }

    /**
     * Check if product exists by ID
     * @param {number} id - Product ID
     * @returns {Promise<boolean>}
     */
    async existsById(id) {
        throw new Error('Method existsById() must be implemented');
    }

    /**
     * Find products by DOI
     * @param {string} doi - Digital Object Identifier
     * @returns {Promise<Product|null>}
     */
    async findByDOI(doi) {
        throw new Error('Method findByDOI() must be implemented');
    }
}
