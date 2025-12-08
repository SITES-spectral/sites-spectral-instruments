/**
 * Delete Product Use Case
 *
 * Application layer command for deleting a product.
 *
 * @module application/commands/DeleteProduct
 */

/**
 * Delete Product Command
 */
export class DeleteProduct {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/product/ProductRepository.js').ProductRepository} dependencies.productRepository
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the delete product command
   *
   * @param {number} id - Product ID
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If product not found
   */
  async execute(id) {
    const exists = await this.productRepository.existsById(id);
    if (!exists) {
      throw new Error(`Product with ID ${id} not found`);
    }

    return await this.productRepository.deleteById(id);
  }
}
