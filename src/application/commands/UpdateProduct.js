/**
 * Update Product Use Case
 *
 * Application layer command for updating an existing product.
 *
 * @module application/commands/UpdateProduct
 */

/**
 * Update Product Command
 */
export class UpdateProduct {
  /**
   * @param {Object} dependencies
   * @param {import('../../domain/product/ProductRepository.js').ProductRepository} dependencies.productRepository
   */
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  /**
   * Execute the update product command
   *
   * @param {number} id - Product ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<import('../../domain/product/Product.js').Product>} Updated product
   * @throws {Error} If product not found
   */
  async execute(id, updates) {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const updatedProduct = existingProduct.update(updates);
    return await this.productRepository.save(updatedProduct);
  }
}
