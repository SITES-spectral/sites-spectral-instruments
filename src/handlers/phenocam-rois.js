// Phenocam ROI Handler Module
// Enhanced ROI operations for phenocam instruments with nested data support

import { requireAuthentication, checkUserPermissions } from '../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../utils/responses.js';

/**
 * Handle phenocam ROI requests with nested instrument data
 * @param {string} method - HTTP method
 * @param {Array} pathSegments - URL path segments
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Phenocam ROI response
 */
export async function handlePhenocamROIs(method, pathSegments, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all ROI operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  const instrumentId = pathSegments[1]; // /phenocam-rois/{instrumentId}
  const roiId = pathSegments[2]; // /phenocam-rois/{instrumentId}/roi/{roiId}

  try {
    switch (method) {
      case 'GET':
        if (roiId) {
          return await getPhenocamROIById(instrumentId, roiId, user, env);
        } else if (instrumentId) {
          return await getPhenocamROIsByInstrument(instrumentId, user, request, env);
        } else {
          return await getPhenocamROIsOverview(user, request, env);
        }

      case 'POST':
        if (!instrumentId) {
          return createErrorResponse('Instrument ID required for ROI creation', 400);
        }
        return await createPhenocamROI(instrumentId, user, request, env);

      case 'PUT':
        if (!instrumentId || !roiId) {
          return createErrorResponse('Instrument ID and ROI ID required for update', 400);
        }
        return await updatePhenocamROI(instrumentId, roiId, user, request, env);

      case 'DELETE':
        if (!instrumentId || !roiId) {
          return createErrorResponse('Instrument ID and ROI ID required for deletion', 400);
        }
        return await deletePhenocamROI(instrumentId, roiId, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Phenocam ROI handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get comprehensive overview of phenocam ROIs across stations
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Phenocam ROIs overview response
 */
async function getPhenocamROIsOverview(user, request, env) {
  const url = new URL(request.url);
  const processingEnabled = url.searchParams.get('processing_enabled') === 'true';
  const stationFilter = url.searchParams.get('station');

  let query = `
    SELECT
      s.id as station_id, s.acronym as station_acronym, s.display_name as station_name,
      s.normalized_name as station_normalized_name,
      p.id as platform_id, p.normalized_name as platform_normalized_name,
      p.display_name as platform_name, p.location_code, p.research_programs,
      i.id as instrument_id, i.normalized_name as instrument_normalized_name,
      i.display_name as instrument_name, i.instrument_type, i.status as instrument_status,
      i.image_processing_enabled, i.last_image_timestamp, i.image_quality_score,
      r.id as roi_id, r.roi_name, r.roi_type, r.geometry, r.description,
      r.roi_processing_enabled, r.vegetation_mask_path, r.last_processed_timestamp,
      r.processing_status, r.comment,
      COUNT(*) OVER (PARTITION BY i.id) as total_rois_per_instrument,
      COUNT(CASE WHEN r.roi_processing_enabled = true THEN 1 END) OVER (PARTITION BY i.id) as active_rois_per_instrument
    FROM stations s
    JOIN platforms p ON s.id = p.station_id
    JOIN instruments i ON p.id = i.platform_id
    LEFT JOIN instrument_rois r ON i.id = r.instrument_id
    WHERE i.instrument_type IN ('phenocam', 'camera', 'webcam', 'timelapse')
  `;

  let params = [];
  let whereConditions = [];

  // Filter by processing enabled ROIs only
  if (processingEnabled) {
    whereConditions.push('r.roi_processing_enabled = true');
  }

  // Filter by specific station
  if (stationFilter) {
    whereConditions.push('(s.acronym = ? OR s.normalized_name = ?)');
    params.push(stationFilter, stationFilter);
  }

  // Add permission filtering for station users
  if (user.role === 'station' && user.station_normalized_name) {
    whereConditions.push('s.normalized_name = ?');
    params.push(user.station_normalized_name);
  }

  if (whereConditions.length > 0) {
    query += ' AND ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY s.acronym, p.location_code, i.instrument_number, r.roi_name';

  const result = await executeQuery(env, query, params, 'getPhenocamROIsOverview');

  // Group results by station -> platform -> instrument -> ROIs
  const groupedData = groupPhenocamData(result?.results || []);

  // Calculate summary statistics
  const summary = calculatePhenocamSummary(result?.results || []);

  return createSuccessResponse({
    phenocam_data: groupedData,
    summary: summary,
    filters_applied: {
      processing_enabled: processingEnabled,
      station_filter: stationFilter,
      user_filtered: user.role === 'station'
    }
  });
}

/**
 * Get ROIs for a specific phenocam instrument with full metadata
 * @param {string} instrumentId - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument ROIs response
 */
async function getPhenocamROIsByInstrument(instrumentId, user, request, env) {
  // First verify instrument exists and user has access
  let instrumentQuery = `
    SELECT i.*, p.display_name as platform_name, p.research_programs,
           s.acronym as station_acronym, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  let params = [instrumentId];
  if (user.role === 'station' && user.station_normalized_name) {
    instrumentQuery += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const instrument = await executeQueryFirst(env, instrumentQuery, params, 'getPhenocamInstrument');

  if (!instrument) {
    return createNotFoundResponse();
  }

  // Get all ROIs for this instrument with processing metadata
  const roisQuery = `
    SELECT r.*,
           CASE
             WHEN r.last_processed_timestamp IS NOT NULL
             THEN julianday('now') - julianday(r.last_processed_timestamp)
             ELSE NULL
           END as days_since_processed,
           CASE
             WHEN i.last_image_timestamp IS NOT NULL
             THEN julianday('now') - julianday(i.last_image_timestamp)
             ELSE NULL
           END as days_since_image
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    WHERE r.instrument_id = ?
    ORDER BY r.roi_name
  `;

  const rois = await executeQuery(env, roisQuery, [instrumentId], 'getPhenocamROIs');

  return createSuccessResponse({
    instrument: instrument,
    rois: rois?.results || [],
    processing_summary: {
      total_rois: rois?.results?.length || 0,
      processing_enabled: rois?.results?.filter(r => r.roi_processing_enabled).length || 0,
      recently_processed: rois?.results?.filter(r => r.days_since_processed !== null && r.days_since_processed < 7).length || 0,
      needs_processing: rois?.results?.filter(r => r.processing_status === 'pending' || r.processing_status === 'error').length || 0
    }
  });
}

/**
 * Get specific ROI with full phenocam context
 * @param {string} instrumentId - Instrument ID
 * @param {string} roiId - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} ROI data response
 */
async function getPhenocamROIById(instrumentId, roiId, user, env) {
  let query = `
    SELECT r.*, i.normalized_name as instrument_normalized_name, i.display_name as instrument_name,
           i.image_processing_enabled, i.last_image_timestamp, i.image_quality_score,
           i.image_archive_path, i.camera_brand, i.camera_model,
           p.display_name as platform_name, p.location_code, p.research_programs,
           s.acronym as station_acronym, s.display_name as station_name,
           s.normalized_name as station_normalized_name,
           CASE
             WHEN r.last_processed_timestamp IS NOT NULL
             THEN julianday('now') - julianday(r.last_processed_timestamp)
             ELSE NULL
           END as days_since_processed,
           CASE
             WHEN i.last_image_timestamp IS NOT NULL
             THEN julianday('now') - julianday(i.last_image_timestamp)
             ELSE NULL
           END as days_since_image
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE r.id = ? AND r.instrument_id = ?
  `;

  let params = [roiId, instrumentId];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const result = await executeQueryFirst(env, query, params, 'getPhenocamROIById');

  if (!result) {
    return createNotFoundResponse();
  }

  return createSuccessResponse(result);
}

/**
 * Create new phenocam ROI with processing defaults
 * @param {string} instrumentId - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Create response
 */
async function createPhenocamROI(instrumentId, user, request, env) {
  // Check if user has write permissions for ROIs
  const permission = checkUserPermissions(user, 'rois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const roiData = await request.json();

  // Verify instrument exists and is accessible
  const instrumentCheck = await verifyInstrumentAccess(instrumentId, user, env);
  if (instrumentCheck instanceof Response) {
    return instrumentCheck;
  }

  // Required fields validation
  const requiredFields = ['roi_name', 'geometry'];
  for (const field of requiredFields) {
    if (!roiData[field]) {
      return createErrorResponse(`Missing required field: ${field}`, 400);
    }
  }

  const now = new Date().toISOString();
  const insertQuery = `
    INSERT INTO instrument_rois (
      instrument_id, roi_name, roi_type, geometry, description, comment,
      roi_processing_enabled, vegetation_mask_path, processing_status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    instrumentId,
    roiData.roi_name,
    roiData.roi_type || 'vegetation',
    roiData.geometry,
    roiData.description || null,
    roiData.comment || null,
    roiData.roi_processing_enabled !== undefined ? roiData.roi_processing_enabled : true,
    roiData.vegetation_mask_path || null,
    roiData.processing_status || 'pending',
    now,
    now
  ];

  const result = await executeQueryRun(env, insertQuery, values, 'createPhenocamROI');

  if (!result || !result.meta?.last_row_id) {
    return createErrorResponse('Failed to create ROI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Phenocam ROI created successfully',
    id: result.meta.last_row_id,
    roi_name: roiData.roi_name,
    processing_enabled: roiData.roi_processing_enabled !== false
  });
}

/**
 * Update phenocam ROI with enhanced processing metadata
 * @param {string} instrumentId - Instrument ID
 * @param {string} roiId - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Update response
 */
async function updatePhenocamROI(instrumentId, roiId, user, request, env) {
  // Check if user has write permissions for ROIs
  const permission = checkUserPermissions(user, 'rois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  const roiData = await request.json();

  // Verify ROI exists and is accessible
  const roiCheck = await verifyROIAccess(instrumentId, roiId, user, env);
  if (roiCheck instanceof Response) {
    return roiCheck;
  }

  // Build update query with allowed fields
  const allowedFields = [];
  const values = [];

  const updateableFields = [
    'roi_name', 'roi_type', 'geometry', 'description', 'comment',
    'roi_processing_enabled', 'vegetation_mask_path', 'processing_status'
  ];

  updateableFields.forEach(field => {
    if (roiData[field] !== undefined) {
      allowedFields.push(`${field} = ?`);
      values.push(roiData[field]);
    }
  });

  // Update processing timestamp if processing status changes
  if (roiData.processing_status && roiData.processing_status === 'completed') {
    allowedFields.push('last_processed_timestamp = ?');
    values.push(new Date().toISOString());
  }

  if (allowedFields.length === 0) {
    return createErrorResponse('No valid fields to update', 400);
  }

  // Add updated_at timestamp
  allowedFields.push('updated_at = ?');
  values.push(new Date().toISOString());

  // Add WHERE clause parameters
  values.push(roiId, instrumentId);

  const updateQuery = `
    UPDATE instrument_rois
    SET ${allowedFields.join(', ')}
    WHERE id = ? AND instrument_id = ?
  `;

  const result = await executeQueryRun(env, updateQuery, values, 'updatePhenocamROI');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to update ROI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Phenocam ROI updated successfully',
    id: parseInt(roiId, 10)
  });
}

/**
 * Delete phenocam ROI
 * @param {string} instrumentId - Instrument ID
 * @param {string} roiId - ROI ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Delete response
 */
async function deletePhenocamROI(instrumentId, roiId, user, env) {
  // Check if user has write permissions for ROIs
  const permission = checkUserPermissions(user, 'rois', 'write');
  if (!permission.allowed) {
    return createForbiddenResponse();
  }

  // Verify ROI exists and is accessible
  const roiCheck = await verifyROIAccess(instrumentId, roiId, user, env);
  if (roiCheck instanceof Response) {
    return roiCheck;
  }

  const deleteQuery = `DELETE FROM instrument_rois WHERE id = ? AND instrument_id = ?`;
  const result = await executeQueryRun(env, deleteQuery, [roiId, instrumentId], 'deletePhenocamROI');

  if (!result || result.changes === 0) {
    return createErrorResponse('Failed to delete ROI', 500);
  }

  return createSuccessResponse({
    success: true,
    message: 'Phenocam ROI deleted successfully',
    id: parseInt(roiId, 10)
  });
}

/**
 * Helper function to verify instrument access
 */
async function verifyInstrumentAccess(instrumentId, user, env) {
  let query = `
    SELECT i.id, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  let params = [instrumentId];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const instrument = await executeQueryFirst(env, query, params, 'verifyInstrumentAccess');
  if (!instrument) {
    return createNotFoundResponse();
  }

  return instrument;
}

/**
 * Helper function to verify ROI access
 */
async function verifyROIAccess(instrumentId, roiId, user, env) {
  let query = `
    SELECT r.id, s.normalized_name as station_normalized_name
    FROM instrument_rois r
    JOIN instruments i ON r.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE r.id = ? AND r.instrument_id = ?
  `;

  let params = [roiId, instrumentId];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const roi = await executeQueryFirst(env, query, params, 'verifyROIAccess');
  if (!roi) {
    return createNotFoundResponse();
  }

  return roi;
}

/**
 * Group phenocam data by hierarchical structure
 */
function groupPhenocamData(results) {
  const grouped = {};

  results.forEach(row => {
    const stationKey = row.station_normalized_name;
    const platformKey = row.platform_normalized_name;
    const instrumentKey = row.instrument_normalized_name;

    if (!grouped[stationKey]) {
      grouped[stationKey] = {
        station: {
          id: row.station_id,
          acronym: row.station_acronym,
          name: row.station_name,
          normalized_name: row.station_normalized_name
        },
        platforms: {}
      };
    }

    if (!grouped[stationKey].platforms[platformKey]) {
      grouped[stationKey].platforms[platformKey] = {
        platform: {
          id: row.platform_id,
          normalized_name: row.platform_normalized_name,
          name: row.platform_name,
          location_code: row.location_code,
          research_programs: row.research_programs
        },
        instruments: {}
      };
    }

    if (!grouped[stationKey].platforms[platformKey].instruments[instrumentKey]) {
      grouped[stationKey].platforms[platformKey].instruments[instrumentKey] = {
        instrument: {
          id: row.instrument_id,
          normalized_name: row.instrument_normalized_name,
          name: row.instrument_name,
          type: row.instrument_type,
          status: row.instrument_status,
          image_processing_enabled: row.image_processing_enabled,
          last_image_timestamp: row.last_image_timestamp,
          image_quality_score: row.image_quality_score,
          total_rois: row.total_rois_per_instrument,
          active_rois: row.active_rois_per_instrument
        },
        rois: []
      };
    }

    if (row.roi_id) {
      grouped[stationKey].platforms[platformKey].instruments[instrumentKey].rois.push({
        id: row.roi_id,
        name: row.roi_name,
        type: row.roi_type,
        geometry: row.geometry,
        description: row.description,
        processing_enabled: row.roi_processing_enabled,
        vegetation_mask_path: row.vegetation_mask_path,
        last_processed_timestamp: row.last_processed_timestamp,
        processing_status: row.processing_status,
        comment: row.comment
      });
    }
  });

  return grouped;
}

/**
 * Calculate summary statistics for phenocam data
 */
function calculatePhenocamSummary(results) {
  const summary = {
    total_stations: new Set(results.map(r => r.station_id)).size,
    total_platforms: new Set(results.map(r => r.platform_id)).size,
    total_instruments: new Set(results.map(r => r.instrument_id)).size,
    total_rois: results.filter(r => r.roi_id).length,
    processing_enabled_rois: results.filter(r => r.roi_processing_enabled).length,
    recently_processed: results.filter(r => r.last_processed_timestamp &&
      (new Date() - new Date(r.last_processed_timestamp)) < 7 * 24 * 60 * 60 * 1000).length
  };

  summary.processing_coverage = summary.total_rois > 0 ?
    Math.round((summary.processing_enabled_rois / summary.total_rois) * 100) : 0;

  return summary;
}