/**
 * Sensor Documentation Handler
 *
 * Manages sensor documentation files (specification sheets, calibration certificates,
 * user manuals, etc.) stored in Cloudflare R2. Supports both model-level documentation
 * (applies to all instances of a sensor model) and instrument-level documentation
 * (specific to individual instrument instances).
 *
 * Endpoints:
 * - GET /api/documentation?sensor_model_id=X - List model documentation
 * - GET /api/documentation?instrument_id=X - List instrument documentation
 * - GET /api/documentation/:id - Get document metadata
 * - GET /api/documentation/:id/download - Download document file
 * - POST /api/documentation/upload - Upload new document
 * - PUT /api/documentation/:id - Update document metadata
 * - DELETE /api/documentation/:id - Delete document
 *
 * @module handlers/documentation
 */

import { requireAuthentication } from '../auth/permissions.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responses.js';

/**
 * Main request handler for documentation endpoints
 */
export async function handleDocumentation(method, pathSegments, request, env) {
  // All operations require authentication
  const user = await requireAuthentication(request, env);

  // Route to appropriate handler
  if (method === 'GET' && pathSegments.length === 2) {
    // GET /api/documentation?sensor_model_id=X or ?instrument_id=X
    return await getDocumentationList(user, request, env);
  } else if (method === 'GET' && pathSegments.length === 3) {
    // GET /api/documentation/:id
    const docId = parseInt(pathSegments[2]);
    return await getDocumentationById(docId, user, env);
  } else if (method === 'GET' && pathSegments.length === 4 && pathSegments[3] === 'download') {
    // GET /api/documentation/:id/download
    const docId = parseInt(pathSegments[2]);
    return await downloadDocument(docId, user, request, env);
  } else if (method === 'POST' && pathSegments.length === 3 && pathSegments[2] === 'upload') {
    // POST /api/documentation/upload
    return await uploadDocument(user, request, env);
  } else if (method === 'PUT' && pathSegments.length === 3) {
    // PUT /api/documentation/:id
    const docId = parseInt(pathSegments[2]);
    return await updateDocumentation(docId, user, request, env);
  } else if (method === 'DELETE' && pathSegments.length === 3) {
    // DELETE /api/documentation/:id
    const docId = parseInt(pathSegments[2]);
    return await deleteDocumentation(docId, user, request, env);
  }

  return createErrorResponse('Invalid documentation endpoint', 404);
}

/**
 * Get list of documentation for a sensor model or instrument
 * Query params: sensor_model_id OR instrument_id (required)
 */
async function getDocumentationList(user, request, env) {
  const url = new URL(request.url);
  const sensorModelId = url.searchParams.get('sensor_model_id');
  const instrumentId = url.searchParams.get('instrument_id');

  if (!sensorModelId && !instrumentId) {
    return createErrorResponse('Either sensor_model_id or instrument_id parameter required', 400);
  }

  let query = 'SELECT * FROM sensor_documentation WHERE ';
  let binding;

  if (sensorModelId) {
    query += 'sensor_model_id = ?';
    binding = parseInt(sensorModelId);
  } else {
    query += 'instrument_id = ?';
    binding = parseInt(instrumentId);
  }

  query += ' ORDER BY document_date DESC, upload_date DESC';

  const result = await env.DB.prepare(query).bind(binding).all();

  // Parse tags JSON field
  const docs = result.results?.map(doc => ({
    ...doc,
    tags: tryParseJSON(doc.tags)
  })) || [];

  return createSuccessResponse({
    documents: docs,
    total: docs.length,
    sensor_model_id: sensorModelId ? parseInt(sensorModelId) : null,
    instrument_id: instrumentId ? parseInt(instrumentId) : null
  });
}

/**
 * Get single documentation metadata
 */
async function getDocumentationById(docId, user, env) {
  const doc = await env.DB.prepare(
    'SELECT * FROM sensor_documentation WHERE id = ?'
  ).bind(docId).first();

  if (!doc) {
    return createErrorResponse('Documentation not found', 404);
  }

  // Parse tags
  const parsedDoc = {
    ...doc,
    tags: tryParseJSON(doc.tags)
  };

  return createSuccessResponse(parsedDoc);
}

/**
 * Download document file from R2
 */
async function downloadDocument(docId, user, request, env) {
  // Get document metadata
  const doc = await env.DB.prepare(
    'SELECT * FROM sensor_documentation WHERE id = ?'
  ).bind(docId).first();

  if (!doc) {
    return createErrorResponse('Documentation not found', 404);
  }

  try {
    // Get file from R2
    const object = await env.DOCS_BUCKET.get(doc.file_path);

    if (!object) {
      return createErrorResponse('File not found in storage', 404);
    }

    // Return file with appropriate headers
    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': doc.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${doc.file_name}"`,
        'Content-Length': doc.file_size_bytes?.toString() || '',
        'Cache-Control': 'public, max-age=31536000'
      }
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    return createErrorResponse(`Failed to download document: ${error.message}`, 500);
  }
}

/**
 * Upload new document
 * Expects multipart/form-data with file and metadata
 */
async function uploadDocument(user, request, env) {
  // Admin-only for model documentation, station users can upload for their instruments
  if (user.role === 'readonly') {
    return createErrorResponse('Read-only users cannot upload documentation', 403);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const sensorModelId = formData.get('sensor_model_id');
    const instrumentId = formData.get('instrument_id');
    const documentType = formData.get('document_type');
    const title = formData.get('title');
    const description = formData.get('description');
    const version = formData.get('version');
    const documentDate = formData.get('document_date');
    const tags = formData.get('tags'); // JSON array string

    // Validation
    if (!file) {
      return createErrorResponse('File is required', 400);
    }

    if (!sensorModelId && !instrumentId) {
      return createErrorResponse('Either sensor_model_id or instrument_id is required', 400);
    }

    if (sensorModelId && instrumentId) {
      return createErrorResponse('Cannot specify both sensor_model_id and instrument_id', 400);
    }

    if (!documentType) {
      return createErrorResponse('document_type is required', 400);
    }

    // Permission check for model-level uploads (admin only)
    if (sensorModelId && user.role !== 'admin') {
      return createErrorResponse('Only administrators can upload model documentation', 403);
    }

    // Permission check for instrument-level uploads (station users can only upload for their instruments)
    if (instrumentId) {
      const instrument = await getInstrumentForUser(parseInt(instrumentId), user, env);
      if (!instrument) {
        return createErrorResponse('Instrument not found or access denied', 404);
      }
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(file.name);
    const fileExtension = sanitizedFilename.split('.').pop();
    const basePath = sensorModelId
      ? `models/${sensorModelId}`
      : `instruments/${instrumentId}`;
    const filePath = `${basePath}/${documentType}/${timestamp}_${sanitizedFilename}`;

    // Upload to R2
    await env.DOCS_BUCKET.put(filePath, file.stream(), {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Insert metadata into database
    const insertQuery = `
      INSERT INTO sensor_documentation (
        sensor_model_id,
        instrument_id,
        document_type,
        file_name,
        file_path,
        file_size_bytes,
        mime_type,
        title,
        description,
        version,
        document_date,
        uploaded_by,
        tags,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const result = await env.DB.prepare(insertQuery).bind(
      sensorModelId ? parseInt(sensorModelId) : null,
      instrumentId ? parseInt(instrumentId) : null,
      documentType,
      sanitizedFilename,
      filePath,
      file.size,
      file.type,
      title || null,
      description || null,
      version || null,
      documentDate || null,
      user.username,
      tags || null
    ).run();

    // Fetch created document
    const newDoc = await env.DB.prepare(
      'SELECT * FROM sensor_documentation WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    // Parse tags
    const parsedDoc = {
      ...newDoc,
      tags: tryParseJSON(newDoc.tags)
    };

    return createSuccessResponse(parsedDoc, 201);

  } catch (error) {
    console.error('Error uploading document:', error);
    return createErrorResponse(`Failed to upload document: ${error.message}`, 500);
  }
}

/**
 * Update document metadata (not the file itself)
 */
async function updateDocumentation(docId, user, request, env) {
  if (user.role === 'readonly') {
    return createErrorResponse('Read-only users cannot update documentation', 403);
  }

  const docData = await request.json();

  // Check if document exists
  const existing = await env.DB.prepare(
    'SELECT * FROM sensor_documentation WHERE id = ?'
  ).bind(docId).first();

  if (!existing) {
    return createErrorResponse('Documentation not found', 404);
  }

  // Permission check
  if (existing.sensor_model_id && user.role !== 'admin') {
    return createErrorResponse('Only administrators can update model documentation', 403);
  }

  if (existing.instrument_id) {
    const instrument = await getInstrumentForUser(existing.instrument_id, user, env);
    if (!instrument) {
      return createErrorResponse('Access denied', 403);
    }
  }

  // Build UPDATE query
  const updates = [];
  const values = [];

  const editableFields = [
    'document_type', 'title', 'description', 'version',
    'document_date', 'tags', 'notes'
  ];

  for (const field of editableFields) {
    if (docData[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(docData[field]);
    }
  }

  if (updates.length === 0) {
    return createErrorResponse('No fields to update', 400);
  }

  // Add updated_at
  updates.push('updated_at = datetime(\'now\')');
  values.push(docId);

  const updateQuery = `
    UPDATE sensor_documentation
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  try {
    await env.DB.prepare(updateQuery).bind(...values).run();

    // Fetch updated document
    const updated = await env.DB.prepare(
      'SELECT * FROM sensor_documentation WHERE id = ?'
    ).bind(docId).first();

    // Parse tags
    const parsedDoc = {
      ...updated,
      tags: tryParseJSON(updated.tags)
    };

    return createSuccessResponse(parsedDoc);

  } catch (error) {
    console.error('Error updating documentation:', error);
    return createErrorResponse(`Failed to update documentation: ${error.message}`, 500);
  }
}

/**
 * Delete document (removes from R2 and database)
 */
async function deleteDocumentation(docId, user, request, env) {
  if (user.role === 'readonly') {
    return createErrorResponse('Read-only users cannot delete documentation', 403);
  }

  // Get document
  const doc = await env.DB.prepare(
    'SELECT * FROM sensor_documentation WHERE id = ?'
  ).bind(docId).first();

  if (!doc) {
    return createErrorResponse('Documentation not found', 404);
  }

  // Permission check
  if (doc.sensor_model_id && user.role !== 'admin') {
    return createErrorResponse('Only administrators can delete model documentation', 403);
  }

  if (doc.instrument_id) {
    const instrument = await getInstrumentForUser(doc.instrument_id, user, env);
    if (!instrument) {
      return createErrorResponse('Access denied', 403);
    }
  }

  try {
    // Delete from R2
    await env.DOCS_BUCKET.delete(doc.file_path);

    // Delete from database
    await env.DB.prepare('DELETE FROM sensor_documentation WHERE id = ?').bind(docId).run();

    return createSuccessResponse({
      message: 'Documentation deleted successfully',
      deleted_document_id: docId,
      file_name: doc.file_name,
      file_path: doc.file_path
    });

  } catch (error) {
    console.error('Error deleting documentation:', error);
    return createErrorResponse(`Failed to delete documentation: ${error.message}`, 500);
  }
}

/**
 * Helper: Get instrument if user has access
 */
async function getInstrumentForUser(instrumentId, user, env) {
  const query = `
    SELECT i.*, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `;

  const instrument = await env.DB.prepare(query).bind(instrumentId).first();

  if (!instrument) {
    return null;
  }

  // Permission check
  if (user.role === 'station' && instrument.station_normalized_name !== user.station) {
    return null;
  }

  return instrument;
}

/**
 * Helper: Sanitize filename for safe storage
 */
function sanitizeFilename(filename) {
  // Remove path components and dangerous characters
  return filename
    .replace(/^.*[\\\/]/, '') // Remove path
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .substring(0, 255); // Limit length
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
