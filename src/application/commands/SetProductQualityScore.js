/**
 * Set Product Quality Score Use Case
 *
 * Application layer command for setting a product's quality score.
 *
 * @module application/commands/SetProductQualityScore
 */

/**
 * Set Product Quality Score Command
 */
export class SetProductQualityScore {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/product/ProductRepository.js').ProductRepository} dependencies.productRepository
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the set quality score command
   *
   * @param {number} id - Product ID
   * @param {number} score - Quality score (0-1)
   * @returns {Promise<import('../../domain/product/Product.js').Product>} Updated product
   * @throws {Error} If product not found or score invalid
   */
  async execute(id, score) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const updatedProduct = product.setQualityScore(score);
    return await this.productRepository.save(updatedProduct);
  }
}
