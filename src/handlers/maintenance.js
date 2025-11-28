// Maintenance History Handler Module
// SITES Spectral v8.0.0 - Phase 7
// Handles CRUD operations for instrument maintenance records

import { requireAuthentication } from '../auth/permissions.js';
import { executeQuery, executeQueryFirst, executeQueryRun } from '../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse,
  createValidationErrorResponse
} from '../utils/responses.js';

/**
 * Handle maintenance requests
 * @param {string} method - HTTP method
 * @param {string[]} pathSegments - URL path segments
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Maintenance response
 */
export async function handleMaintenance(method, pathSegments, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all maintenance operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  const id = pathSegments[1];
  const subResource = pathSegments[2];

  try {
    // Special sub-routes
    if (id === 'stats') {
      return await getMaintenanceStats(user, request, env);
    }
    if (id === 'upcoming') {
      return await getUpcomingMaintenance(user, request, env);
    }
    if (id === 'recurrent') {
      return await getRecurrentProblems(user, request, env);
    }
    if (id === 'by-instrument' && subResource) {
      return await getMaintenanceByInstrument(subResource, user, request, env);
    }
    if (id === 'by-station' && subResource) {
      return await getMaintenanceByStation(subResource, user, request, env);
    }

    switch (method) {
      case 'GET':
        if (id && !isNaN(parseInt(id))) {
          return await getMaintenanceById(id, user, env);
        } else {
          return await getMaintenanceList(user, request, env);
        }

      case 'POST':
        return await createMaintenance(user, request, env);

      case 'PUT':
        if (!id || isNaN(parseInt(id))) {
          return createErrorResponse('Maintenance record ID required for update', 400);
        }
        return await updateMaintenance(id, user, request, env);

      case 'DELETE':
        if (!id || isNaN(parseInt(id))) {
          return createErrorResponse('Maintenance record ID required for deletion', 400);
        }
        return await deleteMaintenance(id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Maintenance handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get maintenance record by ID
 */
async function getMaintenanceById(id, user, env) {
  let query = `
    SELECT mh.*,
           i.display_name as instrument_name,
           i.normalized_name as instrument_normalized_name,
           i.instrument_type,
           p.display_name as platform_name,
           p.ecosystem_code,
           s.acronym as station_acronym,
           s.display_name as station_name,
           u.username as technician_username
    FROM maintenance_history mh
    JOIN instruments i ON mh.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN users u ON mh.technician_id = u.id
    WHERE mh.id = ?
  `;

  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const record = await executeQueryFirst(env, query, params, 'getMaintenanceById');

  if (!record) {
    return createNotFoundResponse('Maintenance record not found');
  }

  // Parse JSON fields
  try {
    if (record.tags) record.tags = JSON.parse(record.tags);
    if (record.parts_replaced) record.parts_replaced = JSON.parse(record.parts_replaced);
    if (record.materials_used) record.materials_used = JSON.parse(record.materials_used);
    if (record.photos_json) record.photos = JSON.parse(record.photos_json);
    if (record.documents_json) record.documents = JSON.parse(record.documents_json);
  } catch (e) {
    console.error('Error parsing maintenance JSON fields:', e);
  }

  return createSuccessResponse(record);
}

/**
 * Get list of maintenance records with filtering
 */
async function getMaintenanceList(user, request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const priority = url.searchParams.get('priority');
  const recurrent = url.searchParams.get('recurrent');

  let query = `
    SELECT mh.id, mh.instrument_id, mh.maintenance_date, mh.maintenance_type,
           mh.description, mh.status, mh.priority, mh.recurrent_problem,
           mh.problem_category, mh.technician, mh.duration_minutes, mh.total_cost,
           mh.created_at, mh.updated_at,
           i.display_name as instrument_name,
           i.normalized_name as instrument_normalized_name,
           p.display_name as platform_name,
           s.acronym as station_acronym
    FROM maintenance_history mh
    JOIN instruments i ON mh.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE 1=1
  `;

  const params = [];

  // Filter by user's station if not admin
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  // Apply filters
  if (status) {
    query += ' AND mh.status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND mh.maintenance_type = ?';
    params.push(type);
  }
  if (priority) {
    query += ' AND mh.priority = ?';
    params.push(priority);
  }
  if (recurrent === 'true') {
    query += ' AND mh.recurrent_problem = 1';
  }

  // Count query
  const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM');
  const countResult = await executeQueryFirst(env, countQuery, params, 'countMaintenance');
  const totalCount = countResult?.count || 0;

  // Add ordering and pagination
  query += ' ORDER BY mh.maintenance_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const records = await executeQuery(env, query, params, 'getMaintenanceList');

  return createSuccessResponse({
    data: records,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    }
  });
}

/**
 * Create new maintenance record
 */
async function createMaintenance(user, request, env) {
  // Only admin and station users can create maintenance records
  if (user.role === 'readonly') {
    return createForbiddenResponse('Insufficient permissions to create maintenance records');
  }

  const body = await request.json();
  const { instrument_id, maintenance_date, maintenance_type, description, ...optionalFields } = body;

  // Validation
  if (!instrument_id || !maintenance_date || !maintenance_type || !description) {
    return createValidationErrorResponse('Required fields: instrument_id, maintenance_date, maintenance_type, description');
  }

  // Verify instrument exists and user has access
  const instrumentQuery = `
    SELECT i.id, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;
  const instrument = await executeQueryFirst(env, instrumentQuery, [instrument_id], 'verifyInstrument');

  if (!instrument) {
    return createNotFoundResponse('Instrument not found');
  }

  // Station users can only create records for their station
  if (user.role === 'station' && user.station_normalized_name !== instrument.station_normalized_name) {
    return createForbiddenResponse('Cannot create maintenance records for other stations');
  }

  // Prepare JSON fields
  const tags = optionalFields.tags ? JSON.stringify(optionalFields.tags) : null;
  const partsReplaced = optionalFields.parts_replaced ? JSON.stringify(optionalFields.parts_replaced) : null;
  const materialsUsed = optionalFields.materials_used ? JSON.stringify(optionalFields.materials_used) : null;
  const photosJson = optionalFields.photos ? JSON.stringify(optionalFields.photos) : null;
  const documentsJson = optionalFields.documents ? JSON.stringify(optionalFields.documents) : null;

  const insertQuery = `
    INSERT INTO maintenance_history (
      instrument_id, maintenance_date, maintenance_type, description,
      tags, status, priority, recurrent_problem, problem_category, problem_severity,
      root_cause, technician, technician_id, duration_minutes,
      parts_replaced, materials_used, total_cost,
      scheduled_date, completed_date, next_maintenance_date,
      notes, photos_json, documents_json, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    instrument_id,
    maintenance_date,
    maintenance_type,
    description,
    tags,
    optionalFields.status || 'completed',
    optionalFields.priority || 'normal',
    optionalFields.recurrent_problem ? 1 : 0,
    optionalFields.problem_category || null,
    optionalFields.problem_severity || null,
    optionalFields.root_cause || null,
    optionalFields.technician || user.username,
    optionalFields.technician_id || user.id,
    optionalFields.duration_minutes || null,
    partsReplaced,
    materialsUsed,
    optionalFields.total_cost || null,
    optionalFields.scheduled_date || null,
    optionalFields.completed_date || null,
    optionalFields.next_maintenance_date || null,
    optionalFields.notes || null,
    photosJson,
    documentsJson,
    user.id
  ];

  const result = await executeQueryRun(env, insertQuery, params, 'createMaintenance');

  if (result.success) {
    // Fetch the created record
    const newRecord = await executeQueryFirst(
      env,
      'SELECT * FROM maintenance_history WHERE id = ?',
      [result.meta.last_row_id],
      'getCreatedMaintenance'
    );

    return createSuccessResponse({
      message: 'Maintenance record created successfully',
      maintenance: newRecord
    }, 201);
  }

  return createErrorResponse('Failed to create maintenance record', 500);
}

/**
 * Update maintenance record
 */
async function updateMaintenance(id, user, request, env) {
  if (user.role === 'readonly') {
    return createForbiddenResponse('Insufficient permissions to update maintenance records');
  }

  // Verify record exists and user has access
  const existingQuery = `
    SELECT mh.*, s.normalized_name as station_normalized_name
    FROM maintenance_history mh
    JOIN instruments i ON mh.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE mh.id = ?
  `;
  const existing = await executeQueryFirst(env, existingQuery, [id], 'getExistingMaintenance');

  if (!existing) {
    return createNotFoundResponse('Maintenance record not found');
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse('Cannot update maintenance records for other stations');
  }

  const body = await request.json();

  // Build dynamic update query
  const updateFields = [];
  const params = [];

  const allowedFields = [
    'maintenance_date', 'maintenance_type', 'description', 'status', 'priority',
    'recurrent_problem', 'problem_category', 'problem_severity', 'root_cause',
    'technician', 'technician_id', 'duration_minutes', 'total_cost',
    'scheduled_date', 'completed_date', 'next_maintenance_date', 'notes'
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      params.push(field === 'recurrent_problem' ? (body[field] ? 1 : 0) : body[field]);
    }
  }

  // Handle JSON fields
  if (body.tags !== undefined) {
    updateFields.push('tags = ?');
    params.push(JSON.stringify(body.tags));
  }
  if (body.parts_replaced !== undefined) {
    updateFields.push('parts_replaced = ?');
    params.push(JSON.stringify(body.parts_replaced));
  }
  if (body.materials_used !== undefined) {
    updateFields.push('materials_used = ?');
    params.push(JSON.stringify(body.materials_used));
  }
  if (body.photos !== undefined) {
    updateFields.push('photos_json = ?');
    params.push(JSON.stringify(body.photos));
  }
  if (body.documents !== undefined) {
    updateFields.push('documents_json = ?');
    params.push(JSON.stringify(body.documents));
  }

  if (updateFields.length === 0) {
    return createValidationErrorResponse('No valid fields to update');
  }

  params.push(id);

  const updateQuery = `UPDATE maintenance_history SET ${updateFields.join(', ')} WHERE id = ?`;
  const result = await executeQueryRun(env, updateQuery, params, 'updateMaintenance');

  if (result.success) {
    const updated = await executeQueryFirst(
      env,
      'SELECT * FROM maintenance_history WHERE id = ?',
      [id],
      'getUpdatedMaintenance'
    );

    return createSuccessResponse({
      message: 'Maintenance record updated successfully',
      maintenance: updated
    });
  }

  return createErrorResponse('Failed to update maintenance record', 500);
}

/**
 * Delete maintenance record
 */
async function deleteMaintenance(id, user, env) {
  // Only admin can delete maintenance records
  if (user.role !== 'admin') {
    return createForbiddenResponse('Only administrators can delete maintenance records');
  }

  const existing = await executeQueryFirst(
    env,
    'SELECT id FROM maintenance_history WHERE id = ?',
    [id],
    'checkMaintenanceExists'
  );

  if (!existing) {
    return createNotFoundResponse('Maintenance record not found');
  }

  const result = await executeQueryRun(
    env,
    'DELETE FROM maintenance_history WHERE id = ?',
    [id],
    'deleteMaintenance'
  );

  if (result.success) {
    return createSuccessResponse({ message: 'Maintenance record deleted successfully' });
  }

  return createErrorResponse('Failed to delete maintenance record', 500);
}

/**
 * Get maintenance statistics (uses v_maintenance_stats view)
 */
async function getMaintenanceStats(user, request, env) {
  let query = 'SELECT * FROM v_maintenance_stats';
  const params = [];

  if (user.role === 'station' && user.station_normalized_name) {
    query = `
      SELECT * FROM v_maintenance_stats ms
      JOIN stations s ON ms.station_id = s.id
      WHERE s.normalized_name = ?
    `;
    params.push(user.station_normalized_name);
  }

  const stats = await executeQuery(env, query, params, 'getMaintenanceStats');
  return createSuccessResponse(stats);
}

/**
 * Get upcoming scheduled maintenance (uses v_upcoming_maintenance view)
 */
async function getUpcomingMaintenance(user, request, env) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days')) || 30;

  let query = `
    SELECT * FROM v_upcoming_maintenance
    WHERE scheduled_date <= date('now', '+' || ? || ' days')
  `;
  const params = [days];

  if (user.role === 'station' && user.station_normalized_name) {
    const stationQuery = `
      SELECT id FROM stations WHERE normalized_name = ?
    `;
    const station = await executeQueryFirst(env, stationQuery, [user.station_normalized_name], 'getStation');
    if (station) {
      query += ' AND station_id = ?';
      params.push(station.id);
    }
  }

  const upcoming = await executeQuery(env, query, params, 'getUpcomingMaintenance');
  return createSuccessResponse(upcoming);
}

/**
 * Get recurrent problems (uses v_recurrent_problems view)
 */
async function getRecurrentProblems(user, request, env) {
  let query = 'SELECT * FROM v_recurrent_problems';
  const params = [];

  if (user.role === 'station' && user.station_normalized_name) {
    const stationQuery = `
      SELECT acronym FROM stations WHERE normalized_name = ?
    `;
    const station = await executeQueryFirst(env, stationQuery, [user.station_normalized_name], 'getStation');
    if (station) {
      query += ' WHERE station_acronym = ?';
      params.push(station.acronym);
    }
  }

  const problems = await executeQuery(env, query, params, 'getRecurrentProblems');
  return createSuccessResponse(problems);
}

/**
 * Get maintenance by instrument ID
 */
async function getMaintenanceByInstrument(instrumentId, user, request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);

  let query = `
    SELECT mh.*, i.display_name as instrument_name, s.acronym as station_acronym
    FROM maintenance_history mh
    JOIN instruments i ON mh.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE mh.instrument_id = ?
  `;
  const params = [instrumentId];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' ORDER BY mh.maintenance_date DESC LIMIT ?';
  params.push(limit);

  const records = await executeQuery(env, query, params, 'getMaintenanceByInstrument');
  return createSuccessResponse(records);
}

/**
 * Get maintenance by station acronym
 */
async function getMaintenanceByStation(stationAcronym, user, request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);

  // Station users can only see their own station
  if (user.role === 'station') {
    const stationQuery = `
      SELECT acronym FROM stations WHERE normalized_name = ?
    `;
    const userStation = await executeQueryFirst(env, stationQuery, [user.station_normalized_name], 'getUserStation');
    if (userStation && userStation.acronym !== stationAcronym.toUpperCase()) {
      return createForbiddenResponse('Cannot view maintenance records for other stations');
    }
  }

  const query = `
    SELECT mh.*, i.display_name as instrument_name, i.normalized_name as instrument_normalized_name,
           p.display_name as platform_name
    FROM maintenance_history mh
    JOIN instruments i ON mh.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE s.acronym = ?
    ORDER BY mh.maintenance_date DESC
    LIMIT ?
  `;

  const records = await executeQuery(env, query, [stationAcronym.toUpperCase(), limit], 'getMaintenanceByStation');
  return createSuccessResponse(records);
}
