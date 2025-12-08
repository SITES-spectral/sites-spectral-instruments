/**
 * Promote Product Quality Use Case
 *
 * Application layer command for promoting a product's quality control level.
 * Progresses through: raw -> quality_controlled -> validated -> research_grade
 *
 * @module application/commands/PromoteProductQuality
 */

/**
 * Promote Product Quality Command
 */
export class PromoteProductQuality {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/product/ProductRepository.js').ProductRepository} dependencies.productRepository
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the promote quality command
   *
   * @param {number} id - Product ID
   * @returns {Promise<import('../../domain/product/Product.js').Product>} Updated product
   * @throws {Error} If product not found or already at highest level
   */
  async execute(id) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const promotedProduct = product.promoteQualityControlLevel();
    return await this.productRepository.save(promotedProduct);
  }
}
