/**
 * Get Product Query
 *
 * Application layer query for retrieving a single product.
 *
 * @module application/queries/GetProduct
 */

/**
 * Get Product Query
 */
export class GetProduct {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/product/ProductRepository.js').ProductRepository} dependencies.productRepository
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the get product query by ID
   *
   * @param {number} id - Product ID
   * @returns {Promise<import('../../domain/product/Product.js').Product|null>}
   */
  async byId(id) {
    return await this.productRepository.findById(id);
  }

  /**
   * Execute the get product query by DOI
   *
   * @param {string} doi - Digital Object Identifier
   * @returns {Promise<import('../../domain/product/Product.js').Product|null>}
   */
  async byDOI(doi) {
    return await this.productRepository.findByDOI(doi);
  }
}
