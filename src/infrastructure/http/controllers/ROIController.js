/**
 * ROI Controller (V11 Architecture)
 *
 * HTTP controller for Region of Interest endpoints.
 * Maps HTTP requests to ROI domain service operations.
 * v11.0.0-alpha.34: Only super admins can create/update/delete ROIs
 *
 * @module infrastructure/http/controllers/ROIController
 * @version 11.0.0
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createValidationErrorResponse
} from '../../../utils/responses.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { ROIService } from '../../../domain/roi/ROIService.js';
import { D1ROIRepository } from '../../persistence/d1/D1ROIRepository.js';
import {
  sanitizeRequestBody,
  sanitizeString,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeJSON,
  ROI_SCHEMA
} from '../../../utils/validation.js';
import {
  parsePagination,
  parsePathId
} from './ControllerUtils.js';

/**
 * Super admin roles that can directly edit ROIs
 */
const SUPER_ADMIN_ROLES = ['admin', 'sites-admin', 'spectral-admin'];

/**
 * Check if user can directly edit ROIs (super admin only)
 */
function canDirectlyEditROI(user) {
  return SUPER_ADMIN_ROLES.includes(user.role);
}

/**
 * ROI Controller
 */
export class ROIController {
  /**
   * @param {D1Database} db - Cloudflare D1 database instance
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(db, env) {
    this.roiRepository = new D1ROIRepository(db);
    this.roiService = new ROIService(this.roiRepository);
    this.auth = new AuthMiddleware(env);
  }

  /**
   * GET /rois - List ROIs with filters
   */
  async list(request, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'read'
    );
    if (response) return response;

    // Validate pagination
    const paginationResult = parsePagination(url);
    if (!paginationResult.valid) return paginationResult.error;

    const { page, limit } = paginationResult.pagination;
    const instrumentId = url.searchParams.get('instrument_id') || url.searchParams.get('instrument');
    const stationId = url.searchParams.get('station_id') || url.searchParams.get('station');
    const includeLegacy = url.searchParams.get('include_legacy') === 'true';
    const status = url.searchParams.get('status');

    // Apply station filtering for station users
    let effectiveStationId = stationId;
    if (user.role === 'station' && user.station_id) {
      effectiveStationId = user.station_id;
    }

    const result = await this.roiService.getAll(
      {
        instrumentId: instrumentId ? parseInt(instrumentId, 10) : undefined,
        stationId: effectiveStationId ? parseInt(effectiveStationId, 10) : undefined,
        includeLegacy,
        status
      },
      { page, limit }
    );

    return createSuccessResponse({
      data: result.rois.map(roi => roi.toJSON()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit
      }
    });
  }

  /**
   * GET /rois/:id - Get ROI by ID
   */
  async get(request, id) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'read'
    );
    if (response) return response;

    const roi = await this.roiService.getById(parseInt(id, 10));

    if (!roi) {
      return createNotFoundResponse(`ROI '${id}' not found`);
    }

    // Check station access for station users
    if (user.role === 'station') {
      const info = await this.roiRepository.getInstrumentInfo(parseInt(id, 10));
      if (info && info.stationNormalizedName !== user.station_normalized_name) {
        return createForbiddenResponse();
      }
    }

    return createSuccessResponse({ data: roi.toJSON() });
  }

  /**
   * GET /rois/instrument/:instrumentId - Get ROIs by instrument
   */
  async getByInstrument(request, instrumentId, url) {
    // Authentication required for read
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'read'
    );
    if (response) return response;

    const includeLegacy = url.searchParams.get('include_legacy') === 'true';

    const rois = await this.roiService.getByInstrument(
      parseInt(instrumentId, 10),
      { includeLegacy }
    );

    return createSuccessResponse({
      data: rois.map(roi => roi.toJSON())
    });
  }

  /**
   * GET /rois/:id/edit-mode - Get ROI edit mode based on user permissions
   */
  async getEditMode(request, id) {
    // Authentication required
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'read'
    );
    if (response) return response;

    // Check station access for station users
    if (user.role === 'station') {
      const info = await this.roiRepository.getInstrumentInfo(parseInt(id, 10));
      if (info && info.stationNormalizedName !== user.station_normalized_name) {
        return createForbiddenResponse();
      }
    }

    const isSuperAdmin = canDirectlyEditROI(user);
    const editMode = await this.roiService.getEditMode(parseInt(id, 10), isSuperAdmin);

    if (!editMode) {
      return createNotFoundResponse(`ROI '${id}' not found`);
    }

    return createSuccessResponse({
      roi_id: editMode.roiId,
      roi_name: editMode.roiName,
      is_legacy: editMode.isLegacy,
      timeseries_broken: editMode.timeseriesBroken,
      edit_mode: editMode.editMode,
      can_direct_edit: editMode.canDirectEdit,
      requires_legacy_workflow: editMode.requiresLegacyWorkflow,
      message: editMode.message
    });
  }

  /**
   * POST /rois - Create ROI
   * RESTRICTED: Only super admins can create ROIs (v11.0.0-alpha.34)
   */
  async create(request) {
    // Authentication required for write
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'write'
    );
    if (response) return response;

    // Only super admins can create ROIs
    if (!canDirectlyEditROI(user)) {
      return createForbiddenResponse('Only super admins can create ROIs. Contact an administrator for ROI changes.');
    }

    let rawData;
    try {
      rawData = await request.json();
    } catch (e) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Sanitize ROI data
    const roiData = this._sanitizeROIData(rawData);

    // Verify instrument access for station users
    if (user.role === 'station') {
      const instrumentId = roiData.instrument_id || roiData.instrumentId;
      if (instrumentId) {
        // Get instrument's station
        const rois = await this.roiRepository.findByInstrumentId(instrumentId, { includeLegacy: true });
        if (rois.length > 0 && rois[0].stationNormalizedName !== user.station_normalized_name) {
          return createForbiddenResponse();
        }
      }
    }

    const result = await this.roiService.create(roiData);

    if (!result.success) {
      return createValidationErrorResponse(result.errors);
    }

    return createSuccessResponse({
      success: true,
      message: 'ROI created successfully',
      data: result.roi.toJSON()
    }, 201);
  }

  /**
   * PUT /rois/:id - Update ROI
   * RESTRICTED: Only super admins can update ROIs (v11.0.0-alpha.34)
   */
  async update(request, id) {
    // Authentication required for write
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'write'
    );
    if (response) return response;

    // Only super admins can update ROIs
    if (!canDirectlyEditROI(user)) {
      return createForbiddenResponse('Only super admins can update ROIs. Contact an administrator for ROI changes.');
    }

    // Check station access
    const info = await this.roiRepository.getInstrumentInfo(parseInt(id, 10));
    if (!info) {
      return createNotFoundResponse(`ROI '${id}' not found`);
    }

    if (user.role === 'station' && info.stationNormalizedName !== user.station_normalized_name) {
      return createForbiddenResponse();
    }

    let rawData;
    try {
      rawData = await request.json();
    } catch (e) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Sanitize ROI data
    const roiData = this._sanitizeROIData(rawData);

    const result = await this.roiService.update(parseInt(id, 10), roiData);

    if (!result.success) {
      return createValidationErrorResponse(result.errors);
    }

    return createSuccessResponse({
      success: true,
      message: 'ROI updated successfully',
      data: result.roi.toJSON()
    });
  }

  /**
   * PUT /rois/:id/override - Admin override update (sets timeseries_broken)
   */
  async adminOverride(request, id) {
    // Authentication required for write
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'write'
    );
    if (response) return response;

    // Only super admins can use override
    if (!canDirectlyEditROI(user)) {
      return createForbiddenResponse('Only super admins can use the override endpoint');
    }

    let rawData;
    try {
      rawData = await request.json();
    } catch (e) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    // Sanitize ROI data
    const roiData = this._sanitizeROIData(rawData);

    const result = await this.roiService.adminOverrideUpdate(parseInt(id, 10), roiData);

    if (!result.success) {
      return createValidationErrorResponse(result.errors);
    }

    return createSuccessResponse({
      success: true,
      message: result.roi.isLegacy
        ? 'Legacy ROI updated (admin override)'
        : 'ROI updated with admin override. Time series data may be affected.',
      data: result.roi.toJSON(),
      timeseries_broken: result.timeseriesBroken
    });
  }

  /**
   * POST /rois/:id/legacy - Mark ROI as legacy
   * RESTRICTED: Only super admins (v11.0.0-alpha.34)
   */
  async markAsLegacy(request, id) {
    // Authentication required for write
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'write'
    );
    if (response) return response;

    // Only super admins can mark as legacy
    if (!canDirectlyEditROI(user)) {
      return createForbiddenResponse('Only super admins can mark ROIs as legacy. Contact an administrator for ROI changes.');
    }

    // Check station access
    const info = await this.roiRepository.getInstrumentInfo(parseInt(id, 10));
    if (!info) {
      return createNotFoundResponse(`ROI '${id}' not found`);
    }

    if (user.role === 'station' && info.stationNormalizedName !== user.station_normalized_name) {
      return createForbiddenResponse();
    }

    let rawData;
    try {
      rawData = await request.json();
    } catch (e) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }

    const reason = sanitizeString(rawData.reason, { maxLength: 500 }) || 'Replaced by new ROI';
    const replacementData = rawData.replacement_data;

    const result = await this.roiService.markAsLegacy(
      parseInt(id, 10),
      reason,
      replacementData ? this._sanitizeROIData(replacementData) : null
    );

    if (!result.success) {
      return createValidationErrorResponse(result.errors);
    }

    return createSuccessResponse({
      success: true,
      message: 'ROI marked as legacy',
      legacy_roi: result.legacyRoi.toJSON(),
      new_roi: result.newRoi ? result.newRoi.toJSON() : null
    });
  }

  /**
   * DELETE /rois/:id - Delete ROI
   * RESTRICTED: Only super admins (v11.0.0-alpha.34)
   */
  async delete(request, id) {
    // Authentication required for delete
    const { user, response } = await this.auth.authenticateAndAuthorize(
      request, 'rois', 'delete'
    );
    if (response) return response;

    // Only super admins can delete ROIs
    if (!canDirectlyEditROI(user)) {
      return createForbiddenResponse('Only super admins can delete ROIs. Contact an administrator for ROI changes.');
    }

    // Check station access
    const info = await this.roiRepository.getInstrumentInfo(parseInt(id, 10));
    if (!info) {
      return createNotFoundResponse(`ROI '${id}' not found`);
    }

    if (user.role === 'station' && info.stationNormalizedName !== user.station_normalized_name) {
      return createForbiddenResponse();
    }

    const result = await this.roiService.delete(parseInt(id, 10));

    if (!result.success) {
      return createErrorResponse(result.error, 400);
    }

    return createSuccessResponse({
      success: true,
      message: 'ROI deleted successfully',
      deleted: true
    });
  }

  /**
   * Sanitize ROI data from request
   * @private
   */
  _sanitizeROIData(rawData) {
    const roiData = sanitizeRequestBody(rawData, ROI_SCHEMA);

    // Handle additional ROI-specific fields
    if (rawData.alpha !== undefined) {
      roiData.alpha = sanitizeFloat(rawData.alpha, { min: 0, max: 1 });
    }
    if (rawData.thickness !== undefined) {
      roiData.thickness = sanitizeInteger(rawData.thickness, { min: 1, max: 20 });
    }
    if (rawData.color_r !== undefined) {
      roiData.color_r = sanitizeInteger(rawData.color_r, { min: 0, max: 255 });
    }
    if (rawData.color_g !== undefined) {
      roiData.color_g = sanitizeInteger(rawData.color_g, { min: 0, max: 255 });
    }
    if (rawData.color_b !== undefined) {
      roiData.color_b = sanitizeInteger(rawData.color_b, { min: 0, max: 255 });
    }
    if (rawData.auto_generated !== undefined) {
      roiData.auto_generated = rawData.auto_generated === true || rawData.auto_generated === 'true';
    }
    if (rawData.source_image !== undefined) {
      roiData.source_image = sanitizeString(rawData.source_image, { maxLength: 500 });
    }
    if (rawData.generated_date !== undefined) {
      roiData.generated_date = sanitizeString(rawData.generated_date, { maxLength: 50 });
    }
    if (rawData.points_json !== undefined) {
      const points = sanitizeJSON(rawData.points_json);
      roiData.points_json = points ? JSON.stringify(points) : rawData.points_json;
    }

    return roiData;
  }

  /**
   * Handle request routing
   */
  async handle(request, pathSegments, url) {
    const method = request.method;
    const segment1 = pathSegments[0];
    const segment2 = pathSegments[1];

    // GET /rois
    if (method === 'GET' && !segment1) {
      return this.list(request, url);
    }

    // GET /rois/instrument/:instrumentId
    if (method === 'GET' && segment1 === 'instrument' && segment2) {
      return this.getByInstrument(request, segment2, url);
    }

    // GET /rois/:id/edit-mode
    if (method === 'GET' && segment1 && /^\d+$/.test(segment1) && segment2 === 'edit-mode') {
      return this.getEditMode(request, segment1);
    }

    // GET /rois/:id
    if (method === 'GET' && segment1 && /^\d+$/.test(segment1)) {
      return this.get(request, segment1);
    }

    // POST /rois/:id/legacy
    if (method === 'POST' && segment1 && /^\d+$/.test(segment1) && segment2 === 'legacy') {
      return this.markAsLegacy(request, segment1);
    }

    // POST /rois
    if (method === 'POST' && !segment1) {
      return this.create(request);
    }

    // PUT /rois/:id/override
    if (method === 'PUT' && segment1 && /^\d+$/.test(segment1) && segment2 === 'override') {
      return this.adminOverride(request, segment1);
    }

    // PUT /rois/:id
    if (method === 'PUT' && segment1 && /^\d+$/.test(segment1)) {
      return this.update(request, segment1);
    }

    // DELETE /rois/:id
    if (method === 'DELETE' && segment1 && /^\d+$/.test(segment1)) {
      return this.delete(request, segment1);
    }

    return createNotFoundResponse();
  }
}
