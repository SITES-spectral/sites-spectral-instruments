/**
 * Sensor Models Handler
 *
 * Manages the centralized library of sensor models (SKR 1800, SKR110, PP Systems, etc.)
 * Stores manufacturer specifications, calibration procedures, and technical documentation
 * for reuse across multiple instrument instances.
 *
 * Endpoints:
 * - GET /api/sensor-models - List all sensor models (admin + station)
 * - GET /api/sensor-models/:id - Get model details
 * - POST /api/sensor-models - Create model (admin only)
 * - PUT /api/sensor-models/:id - Update model (admin only)
 * - DELETE /api/sensor-models/:id - Delete model (admin only)
 *
 * @module handlers/sensor-models
 */

import { requireAuthentication } from '../auth/permissions.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responses.js';

/**
 * Main request handler for sensor-models endpoints
 */
export async function handleSensorModels(method, pathSegments, request, env) {
  // All operations require authentication
  const user = await requireAuthentication(request, env);

  // Route to appropriate handler
  if (method === 'GET' && pathSegments.length === 2) {
    // GET /api/sensor-models
    return await getSensorModelsList(user, request, env);
  } else if (method === 'GET' && pathSegments.length === 3) {
    // GET /api/sensor-models/:id
    const modelId = parseInt(pathSegments[2]);
    return await getSensorModelById(modelId, user, env);
  } else if (method === 'POST' && pathSegments.length === 2) {
    // POST /api/sensor-models (admin only)
    return await createSensorModel(user, request, env);
  } else if (method === 'PUT' && pathSegments.length === 3) {
    // PUT /api/sensor-models/:id (admin only)
    const modelId = parseInt(pathSegments[2]);
    return await updateSensorModel(modelId, user, request, env);
  } else if (method === 'DELETE' && pathSegments.length === 3) {
    // DELETE /api/sensor-models/:id (admin only)
    const modelId = parseInt(pathSegments[2]);
    return await deleteSensorModel(modelId, user, env);
  }

  return createErrorResponse('Invalid sensor-models endpoint', 404);
}

/**
 * Get list of all sensor models
 * Available to all authenticated users (admin + station)
 */
async function getSensorModelsList(user, request, env) {
  const url = new URL(request.url);
  const manufacturer = url.searchParams.get('manufacturer');
  const sensorType = url.searchParams.get('type');

  let query = 'SELECT * FROM sensor_models WHERE 1=1';
  const bindings = [];

  if (manufacturer) {
    query += ' AND manufacturer = ?';
    bindings.push(manufacturer);
  }

  if (sensorType) {
    query += ' AND sensor_type = ?';
    bindings.push(sensorType);
  }

  query += ' ORDER BY manufacturer, model_number';

  const result = await env.DB.prepare(query).bind(...bindings).all();

  // Parse JSON fields for easier frontend consumption
  const models = result.results?.map(model => ({
    ...model,
    available_channels_config: tryParseJSON(model.available_channels_config),
    typical_calibration_coefficients: tryParseJSON(model.typical_calibration_coefficients),
    dimensions_mm: tryParseJSON(model.dimensions_mm)
  })) || [];

  return createSuccessResponse({
    models,
    total: models.length
  });
}

/**
 * Get single sensor model details
 */
async function getSensorModelById(modelId, user, env) {
  const model = await env.DB.prepare(
    'SELECT * FROM sensor_models WHERE id = ?'
  ).bind(modelId).first();

  if (!model) {
    return createErrorResponse('Sensor model not found', 404);
  }

  // Parse JSON fields
  const parsedModel = {
    ...model,
    available_channels_config: tryParseJSON(model.available_channels_config),
    typical_calibration_coefficients: tryParseJSON(model.typical_calibration_coefficients),
    dimensions_mm: tryParseJSON(model.dimensions_mm)
  };

  return createSuccessResponse(parsedModel);
}

/**
 * Create new sensor model (admin only)
 */
async function createSensorModel(user, request, env) {
  // Admin-only operation
  if (user.role !== 'admin') {
    return createErrorResponse('Only administrators can create sensor models', 403);
  }

  const modelData = await request.json();

  // Validate required fields
  const requiredFields = ['manufacturer', 'model_number'];
  for (const field of requiredFields) {
    if (!modelData[field]) {
      return createErrorResponse(`Missing required field: ${field}`, 400);
    }
  }

  // Check for duplicate model_number
  const duplicate = await env.DB.prepare(
    'SELECT id FROM sensor_models WHERE model_number = ?'
  ).bind(modelData.model_number).first();

  if (duplicate) {
    return createErrorResponse(
      `Model number '${modelData.model_number}' already exists`,
      409
    );
  }

  // Stringify JSON fields
  const availableChannelsConfig = modelData.available_channels_config ?
    JSON.stringify(modelData.available_channels_config) : null;

  const calibrationCoefficients = modelData.typical_calibration_coefficients ?
    JSON.stringify(modelData.typical_calibration_coefficients) : null;

  const dimensions = modelData.dimensions_mm ?
    JSON.stringify(modelData.dimensions_mm) : null;

  // Insert model
  const insertQuery = `
    INSERT INTO sensor_models (
      manufacturer,
      model_number,
      model_name,
      sensor_type,
      wavelength_range_min_nm,
      wavelength_range_max_nm,
      available_channels_config,
      field_of_view_degrees,
      angular_response,
      cosine_response,
      spectral_sensitivity_curve,
      temperature_coefficient,
      calibration_procedure,
      factory_calibration_interval_months,
      recalibration_requirements,
      typical_calibration_coefficients,
      dimensions_mm,
      weight_grams,
      cable_types,
      connector_type,
      power_requirements,
      ip_rating,
      operating_temp_min_c,
      operating_temp_max_c,
      manufacturer_website_url,
      specification_sheet_url,
      user_manual_url,
      notes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `;

  try {
    const result = await env.DB.prepare(insertQuery).bind(
      modelData.manufacturer,
      modelData.model_number,
      modelData.model_name || null,
      modelData.sensor_type || null,
      modelData.wavelength_range_min_nm || null,
      modelData.wavelength_range_max_nm || null,
      availableChannelsConfig,
      modelData.field_of_view_degrees || null,
      modelData.angular_response || null,
      modelData.cosine_response || null,
      modelData.spectral_sensitivity_curve || null,
      modelData.temperature_coefficient || null,
      modelData.calibration_procedure || null,
      modelData.factory_calibration_interval_months || null,
      modelData.recalibration_requirements || null,
      calibrationCoefficients,
      dimensions,
      modelData.weight_grams || null,
      modelData.cable_types || null,
      modelData.connector_type || null,
      modelData.power_requirements || null,
      modelData.ip_rating || null,
      modelData.operating_temp_min_c || null,
      modelData.operating_temp_max_c || null,
      modelData.manufacturer_website_url || null,
      modelData.specification_sheet_url || null,
      modelData.user_manual_url || null,
      modelData.notes || null
    ).run();

    // Fetch created model
    const newModel = await env.DB.prepare(
      'SELECT * FROM sensor_models WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    // Parse JSON fields
    const parsedModel = {
      ...newModel,
      available_channels_config: tryParseJSON(newModel.available_channels_config),
      typical_calibration_coefficients: tryParseJSON(newModel.typical_calibration_coefficients),
      dimensions_mm: tryParseJSON(newModel.dimensions_mm)
    };

    return createSuccessResponse(parsedModel, 201);

  } catch (error) {
    console.error('Error creating sensor model:', error);
    return createErrorResponse(`Failed to create sensor model: ${error.message}`, 500);
  }
}

/**
 * Update sensor model (admin only)
 */
async function updateSensorModel(modelId, user, request, env) {
  // Admin-only operation
  if (user.role !== 'admin') {
    return createErrorResponse('Only administrators can update sensor models', 403);
  }

  const modelData = await request.json();

  // Check if model exists
  const existing = await env.DB.prepare(
    'SELECT id FROM sensor_models WHERE id = ?'
  ).bind(modelId).first();

  if (!existing) {
    return createErrorResponse('Sensor model not found', 404);
  }

  // Build UPDATE query dynamically
  const updates = [];
  const values = [];

  // All fields are editable for admin
  const editableFields = [
    'manufacturer', 'model_number', 'model_name', 'sensor_type',
    'wavelength_range_min_nm', 'wavelength_range_max_nm',
    'field_of_view_degrees', 'angular_response', 'cosine_response',
    'spectral_sensitivity_curve', 'temperature_coefficient',
    'calibration_procedure', 'factory_calibration_interval_months',
    'recalibration_requirements', 'weight_grams', 'cable_types',
    'connector_type', 'power_requirements', 'ip_rating',
    'operating_temp_min_c', 'operating_temp_max_c',
    'manufacturer_website_url', 'specification_sheet_url',
    'user_manual_url', 'notes'
  ];

  for (const field of editableFields) {
    if (modelData[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(modelData[field]);
    }
  }

  // Handle JSON fields separately
  if (modelData.available_channels_config !== undefined) {
    updates.push('available_channels_config = ?');
    values.push(JSON.stringify(modelData.available_channels_config));
  }

  if (modelData.typical_calibration_coefficients !== undefined) {
    updates.push('typical_calibration_coefficients = ?');
    values.push(JSON.stringify(modelData.typical_calibration_coefficients));
  }

  if (modelData.dimensions_mm !== undefined) {
    updates.push('dimensions_mm = ?');
    values.push(JSON.stringify(modelData.dimensions_mm));
  }

  if (updates.length === 0) {
    return createErrorResponse('No fields to update', 400);
  }

  // Add updated_at
  updates.push('updated_at = datetime(\'now\')');
  values.push(modelId);

  const updateQuery = `
    UPDATE sensor_models
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  try {
    await env.DB.prepare(updateQuery).bind(...values).run();

    // Fetch updated model
    const updated = await env.DB.prepare(
      'SELECT * FROM sensor_models WHERE id = ?'
    ).bind(modelId).first();

    // Parse JSON fields
    const parsedModel = {
      ...updated,
      available_channels_config: tryParseJSON(updated.available_channels_config),
      typical_calibration_coefficients: tryParseJSON(updated.typical_calibration_coefficients),
      dimensions_mm: tryParseJSON(updated.dimensions_mm)
    };

    return createSuccessResponse(parsedModel);

  } catch (error) {
    console.error('Error updating sensor model:', error);
    return createErrorResponse(`Failed to update sensor model: ${error.message}`, 500);
  }
}

/**
 * Delete sensor model (admin only)
 */
async function deleteSensorModel(modelId, user, env) {
  // Admin-only operation
  if (user.role !== 'admin') {
    return createErrorResponse('Only administrators can delete sensor models', 403);
  }

  // Check if model exists
  const model = await env.DB.prepare(
    'SELECT * FROM sensor_models WHERE id = ?'
  ).bind(modelId).first();

  if (!model) {
    return createErrorResponse('Sensor model not found', 404);
  }

  // Check if any instruments are using this model
  const instrumentsUsing = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM instruments WHERE sensor_model = ?'
  ).bind(model.model_number).first();

  if (instrumentsUsing.count > 0) {
    return createErrorResponse(
      `Cannot delete model. ${instrumentsUsing.count} instrument(s) are using this model.`,
      400
    );
  }

  // Check if any documentation is attached
  const docsCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM sensor_documentation WHERE sensor_model_id = ?'
  ).bind(modelId).first();

  // Delete model (CASCADE will handle documentation)
  try {
    await env.DB.prepare('DELETE FROM sensor_models WHERE id = ?').bind(modelId).run();

    return createSuccessResponse({
      message: 'Sensor model deleted successfully',
      deleted_model_id: modelId,
      model_number: model.model_number,
      documentation_deleted: docsCount.count
    });

  } catch (error) {
    console.error('Error deleting sensor model:', error);
    return createErrorResponse(`Failed to delete sensor model: ${error.message}`, 500);
  }
}

/**
 * Helper: Try to parse JSON, return original on error
 */
function tryParseJSON(jsonString) {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return jsonString;
  }
}
