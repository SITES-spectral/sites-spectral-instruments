// Calibration Logs Handler Module
// SITES Spectral v8.0.0 - Phase 7
// Handles CRUD operations for instrument calibration records

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
 * Handle calibration requests
 * @param {string} method - HTTP method
 * @param {string[]} pathSegments - URL path segments
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Calibration response
 */
export async function handleCalibration(method, pathSegments, request, env) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for all calibration operations
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  const id = pathSegments[1];
  const subResource = pathSegments[2];

  try {
    // Special sub-routes
    if (id === 'due') {
      return await getCalibrationDue(user, request, env);
    }
    if (id === 'latest') {
      return await getLatestCalibrations(user, request, env);
    }
    if (id === 'trends') {
      return await getCalibrationTrends(user, request, env);
    }
    if (id === 'by-instrument' && subResource) {
      return await getCalibrationByInstrument(subResource, user, request, env);
    }
    if (id === 'by-station' && subResource) {
      return await getCalibrationByStation(subResource, user, request, env);
    }

    switch (method) {
      case 'GET':
        if (id && !isNaN(parseInt(id))) {
          return await getCalibrationById(id, user, env);
        } else {
          return await getCalibrationList(user, request, env);
        }

      case 'POST':
        return await createCalibration(user, request, env);

      case 'PUT':
        if (!id || isNaN(parseInt(id))) {
          return createErrorResponse('Calibration record ID required for update', 400);
        }
        return await updateCalibration(id, user, request, env);

      case 'DELETE':
        if (!id || isNaN(parseInt(id))) {
          return createErrorResponse('Calibration record ID required for deletion', 400);
        }
        return await deleteCalibration(id, user, env);

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Calibration handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get calibration record by ID
 */
async function getCalibrationById(id, user, env) {
  let query = `
    SELECT cl.*,
           i.display_name as instrument_name,
           i.normalized_name as instrument_normalized_name,
           i.instrument_type,
           p.display_name as platform_name,
           p.ecosystem_code,
           s.acronym as station_acronym,
           s.display_name as station_name,
           u.username as technician_username
    FROM calibration_logs cl
    JOIN instruments i ON cl.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN users u ON cl.technician_id = u.id
    WHERE cl.id = ?
  `;

  const params = [id];
  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  const record = await executeQueryFirst(env, query, params, 'getCalibrationById');

  if (!record) {
    return createNotFoundResponse('Calibration record not found');
  }

  // Parse JSON fields
  try {
    if (record.ambient_conditions) record.ambient_conditions = JSON.parse(record.ambient_conditions);
    if (record.measurements_json) record.measurements = JSON.parse(record.measurements_json);
    if (record.coefficients_json) record.coefficients = JSON.parse(record.coefficients_json);
    if (record.dark_current_values) record.dark_current_values = JSON.parse(record.dark_current_values);
    if (record.photos_json) record.photos = JSON.parse(record.photos_json);
  } catch (e) {
    console.error('Error parsing calibration JSON fields:', e);
  }

  return createSuccessResponse(record);
}

/**
 * Get list of calibration records with filtering
 */
async function getCalibrationList(user, request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  const type = url.searchParams.get('type');
  const qualityPassed = url.searchParams.get('quality_passed');
  const frequency = url.searchParams.get('frequency');

  let query = `
    SELECT cl.id, cl.instrument_id, cl.calibration_date, cl.calibration_type,
           cl.calibration_method, cl.duration_minutes, cl.frequency,
           cl.reflectance_panel_used, cl.technician, cl.quality_passed,
           cl.quality_score, cl.deviation_from_reference,
           cl.cleaning_performed, cl.created_at, cl.updated_at,
           i.display_name as instrument_name,
           i.normalized_name as instrument_normalized_name,
           i.instrument_type,
           p.display_name as platform_name,
           s.acronym as station_acronym
    FROM calibration_logs cl
    JOIN instruments i ON cl.instrument_id = i.id
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
  if (type) {
    query += ' AND cl.calibration_type = ?';
    params.push(type);
  }
  if (qualityPassed !== null && qualityPassed !== undefined) {
    query += ' AND cl.quality_passed = ?';
    params.push(qualityPassed === 'true' ? 1 : 0);
  }
  if (frequency) {
    query += ' AND cl.frequency = ?';
    params.push(frequency);
  }

  // Count query
  const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM');
  const countResult = await executeQueryFirst(env, countQuery, params, 'countCalibration');
  const totalCount = countResult?.count || 0;

  // Add ordering and pagination
  query += ' ORDER BY cl.calibration_date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const records = await executeQuery(env, query, params, 'getCalibrationList');

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
 * Create new calibration record
 */
async function createCalibration(user, request, env) {
  // Only admin and station users can create calibration records
  if (user.role === 'readonly') {
    return createForbiddenResponse('Insufficient permissions to create calibration records');
  }

  const body = await request.json();
  const { instrument_id, calibration_date, calibration_type, ...optionalFields } = body;

  // Validation
  if (!instrument_id || !calibration_date || !calibration_type) {
    return createValidationErrorResponse('Required fields: instrument_id, calibration_date, calibration_type');
  }

  // Verify instrument exists and user has access
  const instrumentQuery = `
    SELECT i.id, i.instrument_type, s.normalized_name as station_normalized_name
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
    return createForbiddenResponse('Cannot create calibration records for other stations');
  }

  // Prepare JSON fields
  const ambientConditions = optionalFields.ambient_conditions ? JSON.stringify(optionalFields.ambient_conditions) : null;
  const measurementsJson = optionalFields.measurements ? JSON.stringify(optionalFields.measurements) : null;
  const coefficientsJson = optionalFields.coefficients ? JSON.stringify(optionalFields.coefficients) : null;
  const darkCurrentValues = optionalFields.dark_current_values ? JSON.stringify(optionalFields.dark_current_values) : null;
  const photosJson = optionalFields.photos ? JSON.stringify(optionalFields.photos) : null;

  const insertQuery = `
    INSERT INTO calibration_logs (
      instrument_id, calibration_date, calibration_type, calibration_method,
      duration_minutes, frequency, next_calibration_date,
      reflectance_panel_used, panel_serial_number, panel_calibration_date, panel_condition,
      technician, technician_id, ambient_conditions,
      physical_aspect_before, sensor_cleanliness_before,
      cleaning_performed, cleaning_method, cleaning_solution,
      physical_aspect_after, sensor_cleanliness_after,
      measurements_json, coefficients_json,
      quality_passed, quality_score, quality_notes, deviation_from_reference,
      dark_current_values, integration_time_ms,
      notes, photos_json, raw_data_path, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    instrument_id,
    calibration_date,
    calibration_type,
    optionalFields.calibration_method || null,
    optionalFields.duration_minutes || null,
    optionalFields.frequency || null,
    optionalFields.next_calibration_date || null,
    optionalFields.reflectance_panel_used || null,
    optionalFields.panel_serial_number || null,
    optionalFields.panel_calibration_date || null,
    optionalFields.panel_condition || null,
    optionalFields.technician || user.username,
    optionalFields.technician_id || user.id,
    ambientConditions,
    optionalFields.physical_aspect_before || null,
    optionalFields.sensor_cleanliness_before || null,
    optionalFields.cleaning_performed ? 1 : 0,
    optionalFields.cleaning_method || null,
    optionalFields.cleaning_solution || null,
    optionalFields.physical_aspect_after || null,
    optionalFields.sensor_cleanliness_after || null,
    measurementsJson,
    coefficientsJson,
    optionalFields.quality_passed !== undefined ? (optionalFields.quality_passed ? 1 : 0) : 1,
    optionalFields.quality_score || null,
    optionalFields.quality_notes || null,
    optionalFields.deviation_from_reference || null,
    darkCurrentValues,
    optionalFields.integration_time_ms || null,
    optionalFields.notes || null,
    photosJson,
    optionalFields.raw_data_path || null,
    user.id
  ];

  const result = await executeQueryRun(env, insertQuery, params, 'createCalibration');

  if (result.success) {
    // Fetch the created record
    const newRecord = await executeQueryFirst(
      env,
      'SELECT * FROM calibration_logs WHERE id = ?',
      [result.meta.last_row_id],
      'getCreatedCalibration'
    );

    return createSuccessResponse({
      message: 'Calibration record created successfully',
      calibration: newRecord
    }, 201);
  }

  return createErrorResponse('Failed to create calibration record', 500);
}

/**
 * Update calibration record
 */
async function updateCalibration(id, user, request, env) {
  if (user.role === 'readonly') {
    return createForbiddenResponse('Insufficient permissions to update calibration records');
  }

  // Verify record exists and user has access
  const existingQuery = `
    SELECT cl.*, s.normalized_name as station_normalized_name
    FROM calibration_logs cl
    JOIN instruments i ON cl.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE cl.id = ?
  `;
  const existing = await executeQueryFirst(env, existingQuery, [id], 'getExistingCalibration');

  if (!existing) {
    return createNotFoundResponse('Calibration record not found');
  }

  if (user.role === 'station' && user.station_normalized_name !== existing.station_normalized_name) {
    return createForbiddenResponse('Cannot update calibration records for other stations');
  }

  const body = await request.json();

  // Build dynamic update query
  const updateFields = [];
  const params = [];

  const allowedFields = [
    'calibration_date', 'calibration_type', 'calibration_method',
    'duration_minutes', 'frequency', 'next_calibration_date',
    'reflectance_panel_used', 'panel_serial_number', 'panel_calibration_date', 'panel_condition',
    'technician', 'technician_id',
    'physical_aspect_before', 'sensor_cleanliness_before',
    'cleaning_method', 'cleaning_solution',
    'physical_aspect_after', 'sensor_cleanliness_after',
    'quality_score', 'quality_notes', 'deviation_from_reference',
    'integration_time_ms', 'notes', 'raw_data_path'
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      params.push(body[field]);
    }
  }

  // Handle boolean fields
  if (body.cleaning_performed !== undefined) {
    updateFields.push('cleaning_performed = ?');
    params.push(body.cleaning_performed ? 1 : 0);
  }
  if (body.quality_passed !== undefined) {
    updateFields.push('quality_passed = ?');
    params.push(body.quality_passed ? 1 : 0);
  }

  // Handle JSON fields
  if (body.ambient_conditions !== undefined) {
    updateFields.push('ambient_conditions = ?');
    params.push(JSON.stringify(body.ambient_conditions));
  }
  if (body.measurements !== undefined) {
    updateFields.push('measurements_json = ?');
    params.push(JSON.stringify(body.measurements));
  }
  if (body.coefficients !== undefined) {
    updateFields.push('coefficients_json = ?');
    params.push(JSON.stringify(body.coefficients));
  }
  if (body.dark_current_values !== undefined) {
    updateFields.push('dark_current_values = ?');
    params.push(JSON.stringify(body.dark_current_values));
  }
  if (body.photos !== undefined) {
    updateFields.push('photos_json = ?');
    params.push(JSON.stringify(body.photos));
  }

  if (updateFields.length === 0) {
    return createValidationErrorResponse('No valid fields to update');
  }

  params.push(id);

  const updateQuery = `UPDATE calibration_logs SET ${updateFields.join(', ')} WHERE id = ?`;
  const result = await executeQueryRun(env, updateQuery, params, 'updateCalibration');

  if (result.success) {
    const updated = await executeQueryFirst(
      env,
      'SELECT * FROM calibration_logs WHERE id = ?',
      [id],
      'getUpdatedCalibration'
    );

    return createSuccessResponse({
      message: 'Calibration record updated successfully',
      calibration: updated
    });
  }

  return createErrorResponse('Failed to update calibration record', 500);
}

/**
 * Delete calibration record
 */
async function deleteCalibration(id, user, env) {
  // Only admin can delete calibration records
  if (user.role !== 'admin') {
    return createForbiddenResponse('Only administrators can delete calibration records');
  }

  const existing = await executeQueryFirst(
    env,
    'SELECT id FROM calibration_logs WHERE id = ?',
    [id],
    'checkCalibrationExists'
  );

  if (!existing) {
    return createNotFoundResponse('Calibration record not found');
  }

  const result = await executeQueryRun(
    env,
    'DELETE FROM calibration_logs WHERE id = ?',
    [id],
    'deleteCalibration'
  );

  if (result.success) {
    return createSuccessResponse({ message: 'Calibration record deleted successfully' });
  }

  return createErrorResponse('Failed to delete calibration record', 500);
}

/**
 * Get instruments due for calibration (uses v_calibration_due view)
 */
async function getCalibrationDue(user, request, env) {
  let query = 'SELECT * FROM v_calibration_due';
  const params = [];

  if (user.role === 'station' && user.station_normalized_name) {
    const stationQuery = `
      SELECT id FROM stations WHERE normalized_name = ?
    `;
    const station = await executeQueryFirst(env, stationQuery, [user.station_normalized_name], 'getStation');
    if (station) {
      query += ' WHERE station_id = ?';
      params.push(station.id);
    }
  }

  query += ' ORDER BY CASE calibration_status WHEN \'overdue\' THEN 1 WHEN \'due_soon\' THEN 2 WHEN \'never_calibrated\' THEN 3 ELSE 4 END';

  const due = await executeQuery(env, query, params, 'getCalibrationDue');
  return createSuccessResponse(due);
}

/**
 * Get latest calibration for each instrument (uses v_latest_calibration view)
 */
async function getLatestCalibrations(user, request, env) {
  let query = 'SELECT * FROM v_latest_calibration';
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

  const latest = await executeQuery(env, query, params, 'getLatestCalibrations');
  return createSuccessResponse(latest);
}

/**
 * Get calibration quality trends (uses v_calibration_quality_trends view)
 */
async function getCalibrationTrends(user, request, env) {
  const url = new URL(request.url);
  const instrumentId = url.searchParams.get('instrument_id');

  let query = 'SELECT * FROM v_calibration_quality_trends';
  const params = [];

  if (instrumentId) {
    query += ' WHERE instrument_id = ?';
    params.push(instrumentId);
  } else if (user.role === 'station' && user.station_normalized_name) {
    const stationQuery = `
      SELECT acronym FROM stations WHERE normalized_name = ?
    `;
    const station = await executeQueryFirst(env, stationQuery, [user.station_normalized_name], 'getStation');
    if (station) {
      query += ' WHERE station_acronym = ?';
      params.push(station.acronym);
    }
  }

  query += ' ORDER BY instrument_id, month';

  const trends = await executeQuery(env, query, params, 'getCalibrationTrends');
  return createSuccessResponse(trends);
}

/**
 * Get calibration by instrument ID
 */
async function getCalibrationByInstrument(instrumentId, user, request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);

  let query = `
    SELECT cl.*, i.display_name as instrument_name, s.acronym as station_acronym
    FROM calibration_logs cl
    JOIN instruments i ON cl.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE cl.instrument_id = ?
  `;
  const params = [instrumentId];

  if (user.role === 'station' && user.station_normalized_name) {
    query += ' AND s.normalized_name = ?';
    params.push(user.station_normalized_name);
  }

  query += ' ORDER BY cl.calibration_date DESC LIMIT ?';
  params.push(limit);

  const records = await executeQuery(env, query, params, 'getCalibrationByInstrument');
  return createSuccessResponse(records);
}

/**
 * Get calibration by station acronym
 */
async function getCalibrationByStation(stationAcronym, user, request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);

  // Station users can only see their own station
  if (user.role === 'station') {
    const stationQuery = `
      SELECT acronym FROM stations WHERE normalized_name = ?
    `;
    const userStation = await executeQueryFirst(env, stationQuery, [user.station_normalized_name], 'getUserStation');
    if (userStation && userStation.acronym !== stationAcronym.toUpperCase()) {
      return createForbiddenResponse('Cannot view calibration records for other stations');
    }
  }

  const query = `
    SELECT cl.*, i.display_name as instrument_name, i.normalized_name as instrument_normalized_name,
           i.instrument_type, p.display_name as platform_name
    FROM calibration_logs cl
    JOIN instruments i ON cl.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE s.acronym = ?
    ORDER BY cl.calibration_date DESC
    LIMIT ?
  `;

  const records = await executeQuery(env, query, [stationAcronym.toUpperCase(), limit], 'getCalibrationByStation');
  return createSuccessResponse(records);
}
