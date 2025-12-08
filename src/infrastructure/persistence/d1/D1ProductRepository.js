/**
 * D1 Product Repository
 *
 * Cloudflare D1 implementation of ProductRepository.
 * Adapts the domain port to the D1 database.
 *
 * @module infrastructure/persistence/d1/D1ProductRepository
 */

import { Product } from '../../../domain/index.js';

/**
 * D1 Product Repository Adapter
 * @implements {import('../../../domain/product/ProductRepository.js').ProductRepository}
 */
export class D1ProductRepository {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Map database row to Product entity
   * @param {Object} row - Database row
   * @returns {Product}
   */
  mapToEntity(row) {
    return new Product({
      id: row.id,
      name: row.product_name,
      description: row.description,
      type: row.product_type || Product.TYPES.IMAGE,
      instrumentId: row.instrument_id,
      campaignId: row.campaign_id,
      processingLevel: row.processing_level || Product.PROCESSING_LEVELS.L0,
      dataPath: row.file_path,
      dataUrl: null, // Generate URL from path if needed
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      qualityScore: row.quality_score,
      qualityControlLevel: row.quality_control_level || Product.QUALITY_CONTROL.RAW,
      productDate: row.source_date || row.source_datetime,
      processingDate: row.created_at,
      dataLicense: row.data_license || Product.LICENSES.CC_BY_4_0,
      licenseUrl: row.license_url || 'https://creativecommons.org/licenses/by/4.0/',
      doi: row.associated_doi,
      citation: null,
      keywords: [], // Could be extracted from metadata
      spatialResolution: row.resolution_m ? `${row.resolution_m}m` : null,
      temporalResolution: null,
      format: row.file_format,
      fileSize: row.file_size_bytes,
      checksum: null,
      version: '1.0',
      isPublic: row.status !== 'archived',
      createdAt: row.created_at,
      updatedAt: row.created_at // Products table doesn't have updated_at
    });
  }

  /**
   * Find product by ID
   * @param {number} id
   * @returns {Promise<Product|null>}
   */
  async findById(id) {
    const result = await this.db
      .prepare('SELECT * FROM products WHERE id = ?')
      .bind(id)
      .first();

    return result ? this.mapToEntity(result) : null;
  }

  /**
   * Find all products for an instrument
   * @param {number} instrumentId
   * @returns {Promise<Product[]>}
   */
  async findByInstrumentId(instrumentId) {
    const results = await this.db
      .prepare('SELECT * FROM products WHERE instrument_id = ? ORDER BY source_date DESC')
      .bind(instrumentId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find all products for a campaign
   * @param {number} campaignId
   * @returns {Promise<Product[]>}
   */
  async findByCampaignId(campaignId) {
    const results = await this.db
      .prepare('SELECT * FROM products WHERE campaign_id = ? ORDER BY source_date DESC')
      .bind(campaignId)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find products by processing level
   * @param {string} processingLevel
   * @returns {Promise<Product[]>}
   */
  async findByProcessingLevel(processingLevel) {
    const results = await this.db
      .prepare('SELECT * FROM products WHERE processing_level = ? ORDER BY source_date DESC')
      .bind(processingLevel)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find products by type
   * @param {string} type
   * @returns {Promise<Product[]>}
   */
  async findByType(type) {
    const results = await this.db
      .prepare('SELECT * FROM products WHERE product_type = ? ORDER BY source_date DESC')
      .bind(type)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find products by quality control level
   * @param {string} qualityControlLevel
   * @returns {Promise<Product[]>}
   */
  async findByQualityControlLevel(qualityControlLevel) {
    const results = await this.db
      .prepare('SELECT * FROM products WHERE quality_control_level = ? ORDER BY source_date DESC')
      .bind(qualityControlLevel)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find public products
   * @returns {Promise<Product[]>}
   */
  async findPublicProducts() {
    const results = await this.db
      .prepare("SELECT * FROM products WHERE status = 'available' ORDER BY source_date DESC")
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find products within date range
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Product[]>}
   */
  async findByDateRange(startDate, endDate) {
    const results = await this.db
      .prepare(`
        SELECT * FROM products
        WHERE source_date >= ? AND source_date <= ?
        ORDER BY source_date DESC
      `)
      .bind(startDate, endDate)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find products by keyword
   * @param {string} keyword
   * @returns {Promise<Product[]>}
   */
  async findByKeyword(keyword) {
    const results = await this.db
      .prepare(`
        SELECT * FROM products
        WHERE product_name LIKE ? OR description LIKE ?
        ORDER BY source_date DESC
      `)
      .bind(`%${keyword}%`, `%${keyword}%`)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find products with quality score above threshold
   * @param {number} threshold
   * @returns {Promise<Product[]>}
   */
  async findByMinQualityScore(threshold) {
    // Convert 0-1 score to 0-100 scale used in DB
    const dbThreshold = threshold * 100;
    const results = await this.db
      .prepare(`
        SELECT * FROM products
        WHERE quality_score >= ?
        ORDER BY quality_score DESC, source_date DESC
      `)
      .bind(dbThreshold)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find products for instrument within date range
   * @param {number} instrumentId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Product[]>}
   */
  async findByInstrumentAndDateRange(instrumentId, startDate, endDate) {
    const results = await this.db
      .prepare(`
        SELECT * FROM products
        WHERE instrument_id = ?
        AND source_date >= ? AND source_date <= ?
        ORDER BY source_date DESC
      `)
      .bind(instrumentId, startDate, endDate)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find latest products for an instrument
   * @param {number} instrumentId
   * @param {number} limit
   * @returns {Promise<Product[]>}
   */
  async findLatestByInstrument(instrumentId, limit = 10) {
    const results = await this.db
      .prepare(`
        SELECT * FROM products
        WHERE instrument_id = ?
        ORDER BY source_date DESC
        LIMIT ?
      `)
      .bind(instrumentId, limit)
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Find all products
   * @returns {Promise<Product[]>}
   */
  async findAll() {
    const results = await this.db
      .prepare('SELECT * FROM products ORDER BY source_date DESC')
      .all();

    return results.results.map(row => this.mapToEntity(row));
  }

  /**
   * Save product (insert or update)
   * @param {Product} product
   * @returns {Promise<Product>}
   */
  async save(product) {
    const now = new Date().toISOString();
    const metadataJson = JSON.stringify(product.metadata || {});
    // Convert 0-1 quality score to 0-100 for DB storage
    const qualityScoreDb = product.qualityScore !== null ? product.qualityScore * 100 : null;

    if (product.id) {
      // Update existing
      await this.db
        .prepare(`
          UPDATE products SET
            product_name = ?,
            description = ?,
            product_type = ?,
            instrument_id = ?,
            campaign_id = ?,
            processing_level = ?,
            file_path = ?,
            file_format = ?,
            file_size_bytes = ?,
            quality_score = ?,
            quality_control_level = ?,
            data_license = ?,
            license_url = ?,
            associated_doi = ?,
            metadata_json = ?
          WHERE id = ?
        `)
        .bind(
          product.name,
          product.description,
          product.type,
          product.instrumentId,
          product.campaignId,
          product.processingLevel,
          product.dataPath,
          product.format,
          product.fileSize,
          qualityScoreDb,
          product.qualityControlLevel,
          product.dataLicense,
          product.licenseUrl,
          product.doi,
          metadataJson,
          product.id
        )
        .run();

      return await this.findById(product.id);
    } else {
      // Insert new
      const result = await this.db
        .prepare(`
          INSERT INTO products (
            station_id, platform_id, campaign_id, aoi_id,
            product_name, product_type, description,
            source_date, source_datetime,
            file_path, file_format, file_size_bytes,
            processing_level, quality_score, quality_control_level,
            data_license, license_url, associated_doi,
            instrument_id, metadata_json, status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?)
        `)
        .bind(
          null, // station_id - derive from instrument if needed
          null, // platform_id - derive from instrument if needed
          product.campaignId,
          null, // aoi_id
          product.name,
          product.type,
          product.description,
          product.productDate,
          product.productDate,
          product.dataPath,
          product.format,
          product.fileSize,
          product.processingLevel,
          qualityScoreDb,
          product.qualityControlLevel,
          product.dataLicense,
          product.licenseUrl,
          product.doi,
          product.instrumentId,
          metadataJson,
          now
        )
        .run();

      return await this.findById(result.meta.last_row_id);
    }
  }

  /**
   * Delete product by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteById(id) {
    const result = await this.db
      .prepare('DELETE FROM products WHERE id = ?')
      .bind(id)
      .run();

    return result.meta.changes > 0;
  }

  /**
   * Count products for an instrument
   * @param {number} instrumentId
   * @returns {Promise<number>}
   */
  async countByInstrumentId(instrumentId) {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM products WHERE instrument_id = ?')
      .bind(instrumentId)
      .first();

    return result?.count || 0;
  }

  /**
   * Count products by processing level
   * @param {string} processingLevel
   * @returns {Promise<number>}
   */
  async countByProcessingLevel(processingLevel) {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM products WHERE processing_level = ?')
      .bind(processingLevel)
      .first();

    return result?.count || 0;
  }

  /**
   * Check if product exists by ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async existsById(id) {
    const result = await this.db
      .prepare('SELECT 1 FROM products WHERE id = ?')
      .bind(id)
      .first();

    return !!result;
  }

  /**
   * Find product by DOI
   * @param {string} doi
   * @returns {Promise<Product|null>}
   */
  async findByDOI(doi) {
    const result = await this.db
      .prepare('SELECT * FROM products WHERE associated_doi = ?')
      .bind(doi)
      .first();

    return result ? this.mapToEntity(result) : null;
  }
}
