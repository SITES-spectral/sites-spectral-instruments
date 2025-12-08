/**
 * Product Domain Service
 *
 * Orchestrates product business logic operations.
 * Follows Single Responsibility Principle - handles product-specific business rules.
 * Follows Dependency Inversion Principle - depends on repository abstraction.
 *
 * @module domain/product/ProductService
 */

import { Product } from './Product.js';

export class ProductService {
    /**
     * @param {ProductRepository} productRepository - Product repository implementation
     */
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Create a new product
     * @param {Object} productData - Product data
     * @returns {Promise<Product>}
     */
    async createProduct(productData) {
        const product = new Product(productData);
        return await this.productRepository.save(product);
    }

    /**
     * Update an existing product
     * @param {number} id - Product ID
     * @param {Object} updates - Properties to update
     * @returns {Promise<Product>}
     */
    async updateProduct(id, updates) {
        const existingProduct = await this.productRepository.findById(id);
        if (!existingProduct) {
            throw new Error(`Product with ID ${id} not found`);
        }

        const updatedProduct = existingProduct.update(updates);
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Delete a product
     * @param {number} id - Product ID
     * @returns {Promise<boolean>}
     */
    async deleteProduct(id) {
        const exists = await this.productRepository.existsById(id);
        if (!exists) {
            throw new Error(`Product with ID ${id} not found`);
        }

        return await this.productRepository.deleteById(id);
    }

    /**
     * Get product by ID
     * @param {number} id - Product ID
     * @returns {Promise<Product|null>}
     */
    async getProductById(id) {
        return await this.productRepository.findById(id);
    }

    /**
     * Get all products for an instrument
     * @param {number} instrumentId - Instrument ID
     * @returns {Promise<Product[]>}
     */
    async getProductsByInstrument(instrumentId) {
        return await this.productRepository.findByInstrumentId(instrumentId);
    }

    /**
     * Get all products for a campaign
     * @param {number} campaignId - Campaign ID
     * @returns {Promise<Product[]>}
     */
    async getProductsByCampaign(campaignId) {
        return await this.productRepository.findByCampaignId(campaignId);
    }

    /**
     * Get products by processing level
     * @param {string} processingLevel - Processing level (L0, L1, L2, L3, L4)
     * @returns {Promise<Product[]>}
     */
    async getProductsByProcessingLevel(processingLevel) {
        return await this.productRepository.findByProcessingLevel(processingLevel);
    }

    /**
     * Get products by type
     * @param {string} type - Product type
     * @returns {Promise<Product[]>}
     */
    async getProductsByType(type) {
        return await this.productRepository.findByType(type);
    }

    /**
     * Get products by quality control level
     * @param {string} qualityControlLevel - Quality control level
     * @returns {Promise<Product[]>}
     */
    async getProductsByQualityControlLevel(qualityControlLevel) {
        return await this.productRepository.findByQualityControlLevel(qualityControlLevel);
    }

    /**
     * Get public products
     * @returns {Promise<Product[]>}
     */
    async getPublicProducts() {
        return await this.productRepository.findPublicProducts();
    }

    /**
     * Get products within date range
     * @param {string} startDate - Start date (ISO 8601)
     * @param {string} endDate - End date (ISO 8601)
     * @returns {Promise<Product[]>}
     */
    async getProductsInDateRange(startDate, endDate) {
        return await this.productRepository.findByDateRange(startDate, endDate);
    }

    /**
     * Get products for instrument within date range
     * @param {number} instrumentId - Instrument ID
     * @param {string} startDate - Start date (ISO 8601)
     * @param {string} endDate - End date (ISO 8601)
     * @returns {Promise<Product[]>}
     */
    async getProductsByInstrumentAndDateRange(instrumentId, startDate, endDate) {
        return await this.productRepository.findByInstrumentAndDateRange(instrumentId, startDate, endDate);
    }

    /**
     * Get latest products for an instrument
     * @param {number} instrumentId - Instrument ID
     * @param {number} limit - Maximum number of products to return
     * @returns {Promise<Product[]>}
     */
    async getLatestProductsByInstrument(instrumentId, limit = 10) {
        return await this.productRepository.findLatestByInstrument(instrumentId, limit);
    }

    /**
     * Get products by keyword
     * @param {string} keyword - Keyword to search for
     * @returns {Promise<Product[]>}
     */
    async getProductsByKeyword(keyword) {
        return await this.productRepository.findByKeyword(keyword);
    }

    /**
     * Get high quality products (score >= 0.8)
     * @returns {Promise<Product[]>}
     */
    async getHighQualityProducts() {
        return await this.productRepository.findByMinQualityScore(0.8);
    }

    /**
     * Get acceptable quality products (score >= 0.6)
     * @returns {Promise<Product[]>}
     */
    async getAcceptableQualityProducts() {
        return await this.productRepository.findByMinQualityScore(0.6);
    }

    /**
     * Get products with quality score above threshold
     * @param {number} threshold - Minimum quality score (0-1)
     * @returns {Promise<Product[]>}
     */
    async getProductsByMinQualityScore(threshold) {
        return await this.productRepository.findByMinQualityScore(threshold);
    }

    /**
     * Get validated products
     * @returns {Promise<Product[]>}
     */
    async getValidatedProducts() {
        const products = await this.productRepository.findAll();
        return products.filter(product => product.isValidated());
    }

    /**
     * Get research grade products
     * @returns {Promise<Product[]>}
     */
    async getResearchGradeProducts() {
        const products = await this.productRepository.findAll();
        return products.filter(product => product.isResearchGrade());
    }

    /**
     * Get L0 products (raw data)
     * @returns {Promise<Product[]>}
     */
    async getL0Products() {
        return await this.productRepository.findByProcessingLevel(Product.PROCESSING_LEVELS.L0);
    }

    /**
     * Get L1 products (geometrically corrected)
     * @returns {Promise<Product[]>}
     */
    async getL1Products() {
        return await this.productRepository.findByProcessingLevel(Product.PROCESSING_LEVELS.L1);
    }

    /**
     * Get L2 products (derived variables)
     * @returns {Promise<Product[]>}
     */
    async getL2Products() {
        return await this.productRepository.findByProcessingLevel(Product.PROCESSING_LEVELS.L2);
    }

    /**
     * Get L3 products (aggregated)
     * @returns {Promise<Product[]>}
     */
    async getL3Products() {
        return await this.productRepository.findByProcessingLevel(Product.PROCESSING_LEVELS.L3);
    }

    /**
     * Get L4 products (model output)
     * @returns {Promise<Product[]>}
     */
    async getL4Products() {
        return await this.productRepository.findByProcessingLevel(Product.PROCESSING_LEVELS.L4);
    }

    /**
     * Add keyword to product
     * @param {number} productId - Product ID
     * @param {string} keyword - Keyword to add
     * @returns {Promise<Product>}
     */
    async addKeyword(productId, keyword) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const updatedProduct = product.addKeyword(keyword);
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Remove keyword from product
     * @param {number} productId - Product ID
     * @param {string} keyword - Keyword to remove
     * @returns {Promise<Product>}
     */
    async removeKeyword(productId, keyword) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const updatedProduct = product.removeKeyword(keyword);
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Set quality score for product
     * @param {number} productId - Product ID
     * @param {number} score - Quality score (0-1)
     * @returns {Promise<Product>}
     */
    async setQualityScore(productId, score) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const updatedProduct = product.setQualityScore(score);
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Promote quality control level
     * @param {number} productId - Product ID
     * @returns {Promise<Product>}
     */
    async promoteQualityControlLevel(productId) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const updatedProduct = product.promoteQualityControlLevel();
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Make product public
     * @param {number} productId - Product ID
     * @returns {Promise<Product>}
     */
    async makeProductPublic(productId) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const updatedProduct = product.makePublic();
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Make product private
     * @param {number} productId - Product ID
     * @returns {Promise<Product>}
     */
    async makeProductPrivate(productId) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const updatedProduct = product.makePrivate();
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Set DOI for product
     * @param {number} productId - Product ID
     * @param {string} doi - Digital Object Identifier
     * @returns {Promise<Product>}
     */
    async setDOI(productId, doi) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const updatedProduct = product.setDOI(doi);
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Set citation for product
     * @param {number} productId - Product ID
     * @param {string} citation - Citation text
     * @returns {Promise<Product>}
     */
    async setCitation(productId, citation) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        const updatedProduct = product.setCitation(citation);
        return await this.productRepository.save(updatedProduct);
    }

    /**
     * Link product to campaign
     * @param {number} productId - Product ID
     * @param {number} campaignId - Campaign ID
     * @returns {Promise<Product>}
     */
    async linkProductToCampaign(productId, campaignId) {
        return await this.updateProduct(productId, { campaignId });
    }

    /**
     * Unlink product from campaign
     * @param {number} productId - Product ID
     * @returns {Promise<Product>}
     */
    async unlinkProductFromCampaign(productId) {
        return await this.updateProduct(productId, { campaignId: null });
    }

    /**
     * Count products for an instrument
     * @param {number} instrumentId - Instrument ID
     * @returns {Promise<number>}
     */
    async countProductsForInstrument(instrumentId) {
        return await this.productRepository.countByInstrumentId(instrumentId);
    }

    /**
     * Count products by processing level
     * @param {string} processingLevel - Processing level
     * @returns {Promise<number>}
     */
    async countProductsByProcessingLevel(processingLevel) {
        return await this.productRepository.countByProcessingLevel(processingLevel);
    }

    /**
     * Get product by DOI
     * @param {string} doi - Digital Object Identifier
     * @returns {Promise<Product|null>}
     */
    async getProductByDOI(doi) {
        return await this.productRepository.findByDOI(doi);
    }

    /**
     * Get product statistics for an instrument
     * @param {number} instrumentId - Instrument ID
     * @returns {Promise<Object>} Statistics object
     */
    async getProductStatisticsForInstrument(instrumentId) {
        const products = await this.productRepository.findByInstrumentId(instrumentId);

        const stats = {
            total: products.length,
            byProcessingLevel: {},
            byQualityControlLevel: {},
            public: 0,
            private: 0,
            withDOI: 0,
            highQuality: 0,
            acceptableQuality: 0,
            lowQuality: 0
        };

        products.forEach(product => {
            // Count by processing level
            stats.byProcessingLevel[product.processingLevel] =
                (stats.byProcessingLevel[product.processingLevel] || 0) + 1;

            // Count by quality control level
            stats.byQualityControlLevel[product.qualityControlLevel] =
                (stats.byQualityControlLevel[product.qualityControlLevel] || 0) + 1;

            // Count public/private
            if (product.isPublic) {
                stats.public++;
            } else {
                stats.private++;
            }

            // Count with DOI
            if (product.hasDOI()) {
                stats.withDOI++;
            }

            // Count by quality rating
            if (product.isHighQuality()) {
                stats.highQuality++;
            } else if (product.isAcceptableQuality()) {
                stats.acceptableQuality++;
            } else if (product.isLowQuality()) {
                stats.lowQuality++;
            }
        });

        return stats;
    }

    /**
     * Validate product data without saving
     * @param {Object} productData - Product data
     * @returns {boolean}
     */
    validateProductData(productData) {
        try {
            new Product(productData);
            return true;
        } catch (error) {
            throw new Error(`Product validation failed: ${error.message}`);
        }
    }
}
