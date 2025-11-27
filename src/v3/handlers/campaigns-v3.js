// SITES Spectral V3 Campaigns Handler
// Acquisition campaign management for UAV/Satellite platforms
// Version: 8.0.0

import { requireAuthentication, checkUserPermissions } from '../../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse,
  createValidationErrorResponse
} from '../../utils/responses.js';
import { parsePaginationParams, parseSortParams, createPaginatedResponse } from '../api-handler-v3.js';

// Valid campaign statuses
const CAMPAIGN_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled', 'failed'];
const CAMPAIGN_TYPES = ['flight', 'acquisition', 'survey', 'monitoring', 'calibration'];
const PROCESSING_STATUSES = ['pending', 'processing', 'completed', 'failed'];

/**
 * Handle V3 campaign requests
 * @param {string} method - HTTP method
 * @param {Object} params - Route parameters { id, status, stationId, platformId, aoiId, updateStatus }
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @param {URL} url - Parsed URL object
 * @returns {Response} Campaign response
 */
export async function handleCampaignsV3(method, params, request, env, url) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  try {
    // Handle filtered queries
    if (params.status) {
      return await getCampaignsByStatusV3(params.status, user, request, env, url);
    }

    if (params.stationId) {
      return await getCampaignsByStationV3(params.stationId, user, request, env, url);
    }

    if (params.platformId) {
      return await getCampaignsByPlatformV3(params.platformId, user, request, env, url);
    }

    if (params.aoiId) {
      return await getCampaignsByAOIV3(params.aoiId, user, request, env, url);
    }

    // Handle status update shortcut
    if (params.id && params.updateStatus && method === 'PUT') {
      return await updateCampaignStatusV3(params.id, user, request, env);
    }

    // Standard CRUD operations
    switch (method) {
      case 'GET':
        if (params.id) {
          return await getCampaignByIdV3(params.id, user, env);
        } else {
          return await getCampaignsListV3(user, request, env, url);
        }

      case 'POST':
        return await createCampaignV3(user, request, env);

      case 'PUT':
        if (!params.id) {
          return createErrorResponse('Campaign ID required for update', 400);
        }
        return await updateCampaignV3(params.id, user, request, env);

      case 'DELETE':
        if (!params.id) {
          return createErrorResponse('Campaign ID required for deletion', 400);
        }
        return await deleteCampaignV3(params.id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Campaign V3 handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get campaign by ID with full details
 */
async function getCampaignByIdV3(id, user, env) {
  let query = `
    SELECT c.id, c.station_id, c.platform_id, c.aoi_id,
           c.campaign_name, c.campaign_type, c.description,
           c.planned_start_datetime, c.planned_end_datetime,
           c.actual_start_datetime, c.actual_end_datetime,
           c.status,
           c.flight_altitude_m, c.flight_speed_ms,
           c.overlap_frontal_pct, c.overlap_side_pct, c.gsd_cm,
           c.weather_conditions, c.wind_speed_ms, c.cloud_cover_pct,
           c.images_collected, c.data_size_gb,
           c.quality_score, c.quality_notes,
           c.processing_status, c.products_generated,
           c.metadata_json,
           c.created_by, c.created_at, c.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           p.display_name as platform_name, p.platform_type,
           a.name as aoi_name
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    JOIN platforms p ON c.platform_id = p.id
    LEFT JOIN areas_of_interest a ON c.aoi_id = a.id
    WHERE c.id = ?
  `;

  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const campaign = await executeQueryFirst(env, query, params, 'getCampaignByIdV3');

  if (!campaign) {
    return createNotFoundResponse();
  }

  // Parse JSON fields
  if (campaign.products_generated) {
    try {
      campaign.products = JSON.parse(campaign.products_generated);
    } catch (e) {
      campaign.products = [];
    }
  }

  if (campaign.metadata_json) {
    try {
      campaign.metadata = JSON.parse(campaign.metadata_json);
    } catch (e) {
      campaign.metadata = {};
    }
  }

  // Get product count
  const productCount = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM products WHERE campaign_id = ?',
    [id], 'getCampaignProductCount'
  );
  campaign.product_count = productCount?.count || 0;

  return createSuccessResponse(campaign);
}

/**
 * Get campaigns list with pagination
 */
async function getCampaignsListV3(user, request, env, url) {
  const pagination = parsePaginationParams(url);
  const { sortBy, sortOrder } = parseSortParams(url, ['created_at', 'campaign_name', 'planned_start_datetime', 'status']);

  // Filter parameters
  const stationParam = url.searchParams.get('station');
  const platformParam = url.searchParams.get('platform');
  const statusParam = url.searchParams.get('status');
  const typeParam = url.searchParams.get('type');
  const fromDate = url.searchParams.get('from_date');
  const toDate = url.searchParams.get('to_date');

  let whereConditions = [];
  let params = [];

  if (stationParam) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ? OR s.id = ?)');
    params.push(stationParam, stationParam, stationParam);
  }

  if (platformParam) {
    whereConditions.push('(p.id = ? OR p.normalized_name = ?)');
    params.push(platformParam, platformParam);
  }

  if (statusParam) {
    whereConditions.push('c.status = ?');
    params.push(statusParam);
  }

  if (typeParam) {
    whereConditions.push('c.campaign_type = ?');
    params.push(typeParam);
  }

  if (fromDate) {
    whereConditions.push('c.planned_start_datetime >= ?');
    params.push(fromDate);
  }

  if (toDate) {
    whereConditions.push('c.planned_start_datetime <= ?');
    params.push(toDate);
  }

  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    JOIN platforms p ON c.platform_id = p.id
    ${whereClause}
  `;
  const countResult = await executeQueryFirst(env, countQuery, params, 'getCampaignsListCount');
  const totalCount = countResult?.total || 0;

  // Main query
  const query = `
    SELECT c.id, c.station_id, c.platform_id, c.aoi_id,
           c.campaign_name, c.campaign_type, c.description,
           c.planned_start_datetime, c.planned_end_datetime,
           c.actual_start_datetime, c.actual_end_datetime,
           c.status, c.processing_status,
           c.flight_altitude_m, c.gsd_cm,
           c.images_collected, c.data_size_gb,
           c.quality_score, c.cloud_cover_pct,
           c.created_at, c.updated_at,
           s.acronym as station_acronym, s.display_name as station_name,
           p.display_name as platform_name, p.platform_type,
           a.name as aoi_name,
           (SELECT COUNT(*) FROM products WHERE campaign_id = c.id) as product_count
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    JOIN platforms p ON c.platform_id = p.id
    LEFT JOIN areas_of_interest a ON c.aoi_id = a.id
    ${whereClause}
    ORDER BY c.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, pagination.limit, pagination.offset];
  const result = await executeQuery(env, query, queryParams, 'getCampaignsListV3');
  const campaigns = result?.results || [];

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(campaigns, totalCount, pagination, baseUrl));
}

/**
 * Get campaigns by status
 */
async function getCampaignsByStatusV3(status, user, request, env, url) {
  if (!CAMPAIGN_STATUSES.includes(status)) {
    return createErrorResponse(`Invalid status. Valid statuses: ${CAMPAIGN_STATUSES.join(', ')}`, 400);
  }

  url.searchParams.set('status', status);
  return await getCampaignsListV3(user, request, env, url);
}

/**
 * Get campaigns by station
 */
async function getCampaignsByStationV3(stationId, user, request, env, url) {
  url.searchParams.set('station', stationId);
  return await getCampaignsListV3(user, request, env, url);
}

/**
 * Get campaigns by platform
 */
async function getCampaignsByPlatformV3(platformId, user, request, env, url) {
  url.searchParams.set('platform', platformId);
  return await getCampaignsListV3(user, request, env, url);
}

/**
 * Get campaigns by AOI
 */
async function getCampaignsByAOIV3(aoiId, user, request, env, url) {
  const pagination = parsePaginationParams(url);

  let query = `
    SELECT c.id, c.campaign_name, c.campaign_type, c.status,
           c.planned_start_datetime, c.actual_start_datetime,
           c.images_collected, c.quality_score,
           s.acronym as station_acronym,
           p.display_name as platform_name, p.platform_type
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    JOIN platforms p ON c.platform_id = p.id
    WHERE c.aoi_id = ?
  `;

  const params = [aoiId];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' ORDER BY c.planned_start_datetime DESC LIMIT ? OFFSET ?';
  params.push(pagination.limit, pagination.offset);

  const result = await executeQuery(env, query, params, 'getCampaignsByAOIV3');

  // Get count
  const countResult = await executeQueryFirst(env, `
    SELECT COUNT(*) as total FROM acquisition_campaigns WHERE aoi_id = ?
  `, [aoiId], 'getCampaignsByAOICount');

  const baseUrl = url.origin + url.pathname;
  return createSuccessResponse(createPaginatedResponse(
    result?.results || [],
    countResult?.total || 0,
    pagination,
    baseUrl
  ));
}

/**
 * Create a new campaign
 */
async function createCampaignV3(user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const campaignData = await request.json();

  // Validate required fields
  const errors = [];

  if (!campaignData.campaign_name || campaignData.campaign_name.trim().length < 3) {
    errors.push('Campaign name is required and must be at least 3 characters');
  }

  if (!campaignData.station_id) {
    errors.push('Station ID is required');
  }

  if (!campaignData.platform_id) {
    errors.push('Platform ID is required');
  }

  if (campaignData.campaign_type && !CAMPAIGN_TYPES.includes(campaignData.campaign_type)) {
    errors.push(`Invalid campaign type. Valid types: ${CAMPAIGN_TYPES.join(', ')}`);
  }

  if (campaignData.status && !CAMPAIGN_STATUSES.includes(campaignData.status)) {
    errors.push(`Invalid status. Valid statuses: ${CAMPAIGN_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return createValidationErrorResponse(errors);
  }

  // Verify platform exists and get station info
  const platform = await executeQueryFirst(env, `
    SELECT p.id, p.station_id, p.platform_type, s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `, [campaignData.platform_id], 'createCampaignV3-platformCheck');

  if (!platform) {
    return createErrorResponse('Platform not found', 404);
  }

  // Verify station matches
  if (parseInt(platform.station_id, 10) !== parseInt(campaignData.station_id, 10)) {
    return createErrorResponse('Platform does not belong to specified station', 400);
  }

  // Check user access
  if (user.role === 'station' && user.station_normalized_name !== platform.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Verify AOI if provided
  if (campaignData.aoi_id) {
    const aoi = await executeQueryFirst(env,
      'SELECT id FROM areas_of_interest WHERE id = ? AND station_id = ?',
      [campaignData.aoi_id, campaignData.station_id], 'createCampaignV3-aoiCheck'
    );

    if (!aoi) {
      return createErrorResponse('AOI not found or does not belong to station', 404);
    }
  }

  // Handle JSON fields
  const productsGenerated = campaignData.products_generated
    ? (typeof campaignData.products_generated === 'string' ? campaignData.products_generated : JSON.stringify(campaignData.products_generated))
    : null;

  const metadataJson = campaignData.metadata
    ? (typeof campaignData.metadata === 'string' ? campaignData.metadata : JSON.stringify(campaignData.metadata))
    : null;

  const now = new Date().toISOString();

  const insertQuery = `
    INSERT INTO acquisition_campaigns (
      station_id, platform_id, aoi_id,
      campaign_name, campaign_type, description,
      planned_start_datetime, planned_end_datetime,
      actual_start_datetime, actual_end_datetime,
      status,
      flight_altitude_m, flight_speed_ms,
      overlap_frontal_pct, overlap_side_pct, gsd_cm,
      weather_conditions, wind_speed_ms, cloud_cover_pct,
      images_collected, data_size_gb,
      quality_score, quality_notes,
      processing_status, products_generated,
      metadata_json,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await executeQueryRun(env, insertQuery, [
    campaignData.station_id,
    campaignData.platform_id,
    campaignData.aoi_id || null,
    campaignData.campaign_name.trim(),
    campaignData.campaign_type || 'flight',
    campaignData.description || null,
    campaignData.planned_start_datetime || null,
    campaignData.planned_end_datetime || null,
    campaignData.actual_start_datetime || null,
    campaignData.actual_end_datetime || null,
    campaignData.status || 'planned',
    campaignData.flight_altitude_m || null,
    campaignData.flight_speed_ms || null,
    campaignData.overlap_frontal_pct || null,
    campaignData.overlap_side_pct || null,
    campaignData.gsd_cm || null,
    campaignData.weather_conditions || null,
    campaignData.wind_speed_ms || null,
    campaignData.cloud_cover_pct || null,
    campaignData.images_collected || null,
    campaignData.data_size_gb || null,
    campaignData.quality_score || null,
    campaignData.quality_notes || null,
    campaignData.processing_status || 'pending',
    productsGenerated,
    metadataJson,
    user.id || null,
    now,
    now
  ], 'createCampaignV3');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create campaign', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'create', 'campaign', ?, ?, ?)
    `, [user.id, user.username, result.meta.last_row_id, campaignData.campaign_name, now], 'createCampaignV3-log');
  } catch (e) {
    console.warn('Failed to log campaign creation:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'Campaign created successfully',
    id: result.meta.last_row_id,
    campaign_name: campaignData.campaign_name,
    status: campaignData.status || 'planned'
  }, 201);
}

/**
 * Update campaign
 */
async function updateCampaignV3(id, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const campaignData = await request.json();

  // Verify campaign exists
  const existing = await executeQueryFirst(env, `
    SELECT c.id, c.campaign_name, c.status, s.normalized_name as station_normalized_name
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    WHERE c.id = ?
  `, [id], 'updateCampaignV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Validate status transition if provided
  if (campaignData.status && !CAMPAIGN_STATUSES.includes(campaignData.status)) {
    return createErrorResponse(`Invalid status. Valid statuses: ${CAMPAIGN_STATUSES.join(', ')}`, 400);
  }

  // Build update query
  const allowedFields = [];
  const values = [];

  const editableFields = [
    'campaign_name', 'campaign_type', 'description',
    'planned_start_datetime', 'planned_end_datetime',
    'actual_start_datetime', 'actual_end_datetime',
    'status',
    'flight_altitude_m', 'flight_speed_ms',
    'overlap_frontal_pct', 'overlap_side_pct', 'gsd_cm',
    'weather_conditions', 'wind_speed_ms', 'cloud_cover_pct',
    'images_collected', 'data_size_gb',
    'quality_score', 'quality_notes',
    'processing_status', 'products_generated',
    'metadata_json', 'aoi_id'
  ];

  editableFields.forEach(field => {
    if (campaignData[field] !== undefined) {
      let value = campaignData[field];

      // Handle JSON fields
      if ((field === 'products_generated' || field === 'metadata_json') && typeof value !== 'string' && value !== null) {
        value = JSON.stringify(value);
      }

      // Handle numeric fields
      if (['flight_altitude_m', 'flight_speed_ms', 'gsd_cm', 'wind_speed_ms', 'data_size_gb', 'quality_score'].includes(field)) {
        value = value !== null && value !== '' ? parseFloat(value) : null;
      }

      if (['overlap_frontal_pct', 'overlap_side_pct', 'cloud_cover_pct', 'images_collected'].includes(field)) {
        value = value !== null && value !== '' ? parseInt(value, 10) : null;
      }

      allowedFields.push(`${field} = ?`);
      values.push(value);
    }
  });

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  allowedFields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const updateQuery = `UPDATE acquisition_campaigns SET ${allowedFields.join(', ')} WHERE id = ?`;
  const result = await executeQueryRun(env, updateQuery, values, 'updateCampaignV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update campaign', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'update', 'campaign', ?, ?, ?)
    `, [user.id, user.username, id, existing.campaign_name, new Date().toISOString()], 'updateCampaignV3-log');
  } catch (e) {
    console.warn('Failed to log campaign update:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'Campaign updated successfully',
    id: parseInt(id, 10)
  });
}

/**
 * Update campaign status only (shortcut endpoint)
 */
async function updateCampaignStatusV3(id, user, request, env) {
  const permission = checkUserPermissions(user, 'platforms', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const { status, processing_status } = await request.json();

  if (!status && !processing_status) {
    return createErrorResponse('Either status or processing_status is required', 400);
  }

  if (status && !CAMPAIGN_STATUSES.includes(status)) {
    return createErrorResponse(`Invalid status. Valid statuses: ${CAMPAIGN_STATUSES.join(', ')}`, 400);
  }

  if (processing_status && !PROCESSING_STATUSES.includes(processing_status)) {
    return createErrorResponse(`Invalid processing_status. Valid statuses: ${PROCESSING_STATUSES.join(', ')}`, 400);
  }

  // Verify campaign exists and access
  const existing = await executeQueryFirst(env, `
    SELECT c.id, c.campaign_name, c.status, s.normalized_name as station_normalized_name
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    WHERE c.id = ?
  `, [id], 'updateCampaignStatusV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Build update
  const updates = [];
  const values = [];

  if (status) {
    updates.push('status = ?');
    values.push(status);

    // Auto-set actual datetimes based on status
    if (status === 'in_progress' && !existing.actual_start_datetime) {
      updates.push('actual_start_datetime = ?');
      values.push(new Date().toISOString());
    } else if (status === 'completed' && !existing.actual_end_datetime) {
      updates.push('actual_end_datetime = ?');
      values.push(new Date().toISOString());
    }
  }

  if (processing_status) {
    updates.push('processing_status = ?');
    values.push(processing_status);
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const updateQuery = `UPDATE acquisition_campaigns SET ${updates.join(', ')} WHERE id = ?`;
  const result = await executeQueryRun(env, updateQuery, values, 'updateCampaignStatusV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update campaign status', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Campaign status updated successfully',
    id: parseInt(id, 10),
    status: status || existing.status,
    processing_status: processing_status
  });
}

/**
 * Delete campaign
 */
async function deleteCampaignV3(id, user, env) {
  const permission = checkUserPermissions(user, 'platforms', 'delete');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Verify campaign exists
  const existing = await executeQueryFirst(env, `
    SELECT c.id, c.campaign_name, s.normalized_name as station_normalized_name
    FROM acquisition_campaigns c
    JOIN stations s ON c.station_id = s.id
    WHERE c.id = ?
  `, [id], 'deleteCampaignV3-check');

  if (!existing) {
    return createNotFoundResponse();
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse();
  }

  // Check for products
  const productCheck = await executeQueryFirst(env,
    'SELECT COUNT(*) as count FROM products WHERE campaign_id = ?',
    [id], 'deleteCampaignV3-productCheck'
  );

  if (productCheck && productCheck.count > 0) {
    return createErrorResponse(
      `Cannot delete campaign: ${productCheck.count} product(s) are associated. Delete products first or set campaign to archived.`,
      409
    );
  }

  const result = await executeQueryRun(env, 'DELETE FROM acquisition_campaigns WHERE id = ?', [id], 'deleteCampaignV3');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete campaign', 500);
  }

  // Log activity
  try {
    await executeQueryRun(env, `
      INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, entity_name, created_at)
      VALUES (?, ?, 'delete', 'campaign', ?, ?, ?)
    `, [user.id, user.username, id, existing.campaign_name, new Date().toISOString()], 'deleteCampaignV3-log');
  } catch (e) {
    console.warn('Failed to log campaign deletion:', e);
  }

  return createSuccessResponse({
    success: true,
    message: 'Campaign deleted successfully',
    id: parseInt(id, 10)
  });
}
