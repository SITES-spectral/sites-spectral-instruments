/**
 * Product Controller (V11 Architecture)
 *
 * HTTP controller for data product endpoints.
 * Maps HTTP requests to application use cases.
 * Supports processing levels (L0-L4), quality control, and DOI assignment.
 *
 * @module infrastructure/http/controllers/ProductController
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse
} from '../../../utils/responses.js';

/**
 * Product Controller
 */
export class ProductController {
  /**
   * @param {Object} container - Dependency injection container
   */
  constructor(container) {
    this.queries = container.queries;
    this.commands = container.commands;
  }

  /**
   * GET /products - List products with filters
   */
  async list(request, url) {
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '25', 10),
      100
    );
    const instrumentId = url.searchParams.get('instrument_id');
    const campaignId = url.searchParams.get('campaign_id');
    const type = url.searchParams.get('type');
    const processingLevel = url.searchParams.get('processing_level');
    const qualityControlLevel = url.searchParams.get('quality_control_level');
    const minQualityScore = url.searchParams.get('min_quality_score');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const keyword = url.searchParams.get('keyword');
    const isPublic = url.searchParams.get('is_public');
    const sortBy = url.searchParams.get('sort_by') || 'product_date';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';

    const result = await this.queries.listProducts.execute({
      page,
      limit,
      instrumentId: instrumentId ? parseInt(instrumentId, 10) : undefined,
      campaignId: campaignId ? parseInt(campaignId, 10) : undefined,
      type,
      processingLevel,
      qualityControlLevel,
      minQualityScore: minQualityScore ? parseFloat(minQualityScore) : undefined,
      startDate,
      endDate,
      keyword,
      isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
      sortBy,
      sortOrder
    });

    return createSuccessResponse({
      data: result.items.map(p => p.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /products/:id - Get product by ID
   */
  async get(request, id) {
    const product = await this.queries.getProduct.byId(parseInt(id, 10));

    if (!product) {
      return createNotFoundResponse(`Product '${id}' not found`);
    }

    return createSuccessResponse({ data: product.toJSON() });
  }

  /**
   * GET /products/doi/:doi - Get product by DOI
   */
  async getByDOI(request, doi) {
    // DOI may contain slashes, so join segments
    const product = await this.queries.getProduct.byDOI(doi);

    if (!product) {
      return createNotFoundResponse(`Product with DOI '${doi}' not found`);
    }

    return createSuccessResponse({ data: product.toJSON() });
  }

  /**
   * GET /products/instrument/:instrumentId - Get products by instrument
   */
  async getByInstrument(request, instrumentId, url) {
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '50', 10),
      100
    );

    const result = await this.queries.listProducts.execute({
      instrumentId: parseInt(instrumentId, 10),
      limit
    });

    return createSuccessResponse({
      data: result.items.map(p => p.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /products/campaign/:campaignId - Get products by campaign
   */
  async getByCampaign(request, campaignId, url) {
    const result = await this.queries.listProducts.execute({
      campaignId: parseInt(campaignId, 10),
      limit: 100
    });

    return createSuccessResponse({
      data: result.items.map(p => p.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * GET /products/processing-level/:level - Get products by processing level
   */
  async getByProcessingLevel(request, level, url) {
    const result = await this.queries.listProducts.execute({
      processingLevel: level.toUpperCase(),
      limit: 100
    });

    return createSuccessResponse({
      data: result.items.map(p => p.toJSON()),
      meta: result.pagination
    });
  }

  /**
   * POST /products - Create product
   */
  async create(request) {
    const body = await request.json();

    try {
      const product = await this.commands.createProduct.execute({
        name: body.name || body.product_name,
        description: body.description,
        type: body.type || body.product_type,
        instrumentId: body.instrument_id || body.instrumentId,
        campaignId: body.campaign_id || body.campaignId,
        processingLevel: body.processing_level || body.processingLevel,
        dataPath: body.data_path || body.dataPath || body.file_path,
        dataUrl: body.data_url || body.dataUrl,
        metadata: body.metadata,
        qualityScore: body.quality_score || body.qualityScore,
        qualityControlLevel: body.quality_control_level || body.qualityControlLevel,
        productDate: body.product_date || body.productDate || body.source_date,
        dataLicense: body.data_license || body.dataLicense,
        licenseUrl: body.license_url || body.licenseUrl,
        doi: body.doi || body.associated_doi,
        citation: body.citation,
        keywords: body.keywords,
        spatialResolution: body.spatial_resolution || body.spatialResolution,
        temporalResolution: body.temporal_resolution || body.temporalResolution,
        format: body.format || body.file_format,
        fileSize: body.file_size || body.fileSize || body.file_size_bytes,
        checksum: body.checksum,
        version: body.version,
        isPublic: body.is_public !== undefined ? body.is_public : body.isPublic
      });

      return createSuccessResponse({ data: product.toJSON() }, 201);
    } catch (error) {
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * PUT /products/:id - Update product
   */
  async update(request, id) {
    const body = await request.json();

    try {
      const product = await this.commands.updateProduct.execute({
        id: parseInt(id, 10),
        name: body.name || body.product_name,
        description: body.description,
        type: body.type || body.product_type,
        processingLevel: body.processing_level || body.processingLevel,
        dataPath: body.data_path || body.dataPath || body.file_path,
        dataUrl: body.data_url || body.dataUrl,
        metadata: body.metadata,
        productDate: body.product_date || body.productDate || body.source_date,
        dataLicense: body.data_license || body.dataLicense,
        licenseUrl: body.license_url || body.licenseUrl,
        doi: body.doi || body.associated_doi,
        citation: body.citation,
        keywords: body.keywords,
        spatialResolution: body.spatial_resolution || body.spatialResolution,
        temporalResolution: body.temporal_resolution || body.temporalResolution,
        format: body.format || body.file_format,
        fileSize: body.file_size || body.fileSize || body.file_size_bytes,
        checksum: body.checksum,
        version: body.version,
        isPublic: body.is_public !== undefined ? body.is_public : body.isPublic
      });

      return createSuccessResponse({ data: product.toJSON() });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /products/:id/quality-score - Set quality score
   */
  async setQualityScore(request, id) {
    const body = await request.json();

    try {
      const product = await this.commands.setProductQualityScore.execute({
        productId: parseInt(id, 10),
        qualityScore: body.quality_score || body.qualityScore,
        qualityMetrics: body.quality_metrics || body.qualityMetrics
      });

      return createSuccessResponse({
        data: product.toJSON(),
        message: 'Quality score updated successfully'
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * POST /products/:id/promote-quality - Promote quality control level
   */
  async promoteQuality(request, id) {
    const body = await request.json();

    try {
      const product = await this.commands.promoteProductQuality.execute({
        productId: parseInt(id, 10),
        targetLevel: body.target_level || body.targetLevel,
        validationNotes: body.validation_notes || body.validationNotes,
        validatedBy: body.validated_by || body.validatedBy
      });

      return createSuccessResponse({
        data: product.toJSON(),
        message: `Quality level promoted to ${body.target_level || body.targetLevel}`
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * DELETE /products/:id - Delete product
   */
  async delete(request, id) {
    try {
      await this.commands.deleteProduct.execute(parseInt(id, 10));
      return createSuccessResponse({ deleted: true });
    } catch (error) {
      if (error.message.includes('not found')) {
        return createNotFoundResponse(error.message);
      }
      return createErrorResponse(error.message, 400);
    }
  }

  /**
   * Handle request routing
   */
  async handle(request, pathSegments, url) {
    const method = request.method;
    const segment1 = pathSegments[0];
    const segment2 = pathSegments[1];
    const segment3 = pathSegments[2];

    // GET /products
    if (method === 'GET' && !segment1) {
      return this.list(request, url);
    }

    // GET /products/doi/:doi (DOI may contain slashes)
    if (method === 'GET' && segment1 === 'doi' && segment2) {
      // Reconstruct DOI from remaining segments
      const doi = pathSegments.slice(1).join('/');
      return this.getByDOI(request, doi);
    }

    // GET /products/instrument/:instrumentId
    if (method === 'GET' && segment1 === 'instrument' && segment2) {
      return this.getByInstrument(request, segment2, url);
    }

    // GET /products/campaign/:campaignId
    if (method === 'GET' && segment1 === 'campaign' && segment2) {
      return this.getByCampaign(request, segment2, url);
    }

    // GET /products/processing-level/:level
    if (method === 'GET' && segment1 === 'processing-level' && segment2) {
      return this.getByProcessingLevel(request, segment2, url);
    }

    // GET /products/:id
    if (method === 'GET' && segment1 && /^\d+$/.test(segment1)) {
      return this.get(request, segment1);
    }

    // POST /products/:id/quality-score
    if (method === 'POST' && segment1 && /^\d+$/.test(segment1) && segment2 === 'quality-score') {
      return this.setQualityScore(request, segment1);
    }

    // POST /products/:id/promote-quality
    if (method === 'POST' && segment1 && /^\d+$/.test(segment1) && segment2 === 'promote-quality') {
      return this.promoteQuality(request, segment1);
    }

    // POST /products
    if (method === 'POST' && !segment1) {
      return this.create(request);
    }

    // PUT /products/:id
    if (method === 'PUT' && segment1 && /^\d+$/.test(segment1)) {
      return this.update(request, segment1);
    }

    // DELETE /products/:id
    if (method === 'DELETE' && segment1 && /^\d+$/.test(segment1)) {
      return this.delete(request, segment1);
    }

    return createNotFoundResponse();
  }
}
