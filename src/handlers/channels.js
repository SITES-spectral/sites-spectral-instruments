/**
 * Instrument Channels Handler
 *
 * Manages spectral channels/bands for multispectral instruments.
 * Each MS instrument can have 2-8+ channels with specific wavelength
 * characteristics.
 *
 * Endpoints:
 * - GET /api/channels?instrument_id=X - List all channels for an instrument
 * - GET /api/channels/:id - Get channel details
 * - POST /api/channels - Create new channel
 * - PUT /api/channels/:id - Update channel
 * - DELETE /api/channels/:id - Delete channel
 *
 * @module handlers/channels
 */

import { requireAuthentication } from '../auth/permissions.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responses.js';

/**
 * Main request handler for channels endpoints
 */
export async function handleChannels(method, pathSegments, request, env) {
  // All operations require authentication
  const user = await requireAuthentication(request, env);

  // Route to appropriate handler based on method and path
  if (method === 'GET' && pathSegments.length === 2) {
    // GET /api/channels?instrument_id=X
    return await getChannelsList(user, request, env);
  } else if (method === 'GET' && pathSegments.length === 3) {
    // GET /api/channels/:id
    const channelId = parseInt(pathSegments[2]);
    return await getChannelById(channelId, user, env);
  } else if (method === 'POST' && pathSegments.length === 2) {
    // POST /api/channels
    return await createChannel(user, request, env);
  } else if (method === 'PUT' && pathSegments.length === 3) {
    // PUT /api/channels/:id
    const channelId = parseInt(pathSegments[2]);
    return await updateChannel(channelId, user, request, env);
  } else if (method === 'DELETE' && pathSegments.length === 3) {
    // DELETE /api/channels/:id
    const channelId = parseInt(pathSegments[2]);
    return await deleteChannel(channelId, user, env);
  }

  return createErrorResponse('Invalid channels endpoint', 404);
}

/**
 * Get list of channels for an instrument
 * Query params: instrument_id (required)
 */
async function getChannelsList(user, request, env) {
  const url = new URL(request.url);
  const instrumentId = url.searchParams.get('instrument_id');

  if (!instrumentId) {
    return createErrorResponse('instrument_id parameter required', 400);
  }

  // Verify user has access to this instrument
  const instrument = await getInstrumentForUser(parseInt(instrumentId), user, env);
  if (!instrument) {
    return createErrorResponse('Instrument not found or access denied', 404);
  }

  // Fetch channels for this instrument
  const query = `
    SELECT
      c.*,
      i.normalized_name as instrument_name
    FROM instrument_channels c
    JOIN instruments i ON c.instrument_id = i.id
    WHERE c.instrument_id = ?
    ORDER BY c.channel_number ASC
  `;

  const result = await env.DB.prepare(query).bind(parseInt(instrumentId)).all();

  return createSuccessResponse({
    channels: result.results || [],
    total: result.results?.length || 0,
    instrument_id: parseInt(instrumentId),
    instrument_name: result.results?.[0]?.instrument_name || null
  });
}

/**
 * Get single channel details
 */
async function getChannelById(channelId, user, env) {
  const query = `
    SELECT
      c.*,
      i.normalized_name as instrument_name,
      i.platform_id,
      p.station_id,
      s.normalized_name as station_normalized_name
    FROM instrument_channels c
    JOIN instruments i ON c.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE c.id = ?
  `;

  const result = await env.DB.prepare(query).bind(channelId).first();

  if (!result) {
    return createErrorResponse('Channel not found', 404);
  }

  // Permission check: station users can only access their station
  if (user.role === 'station' && result.station_normalized_name !== user.station) {
    return createErrorResponse('Access denied', 403);
  }

  return createSuccessResponse(result);
}

/**
 * Create new channel
 */
async function createChannel(user, request, env) {
  const channelData = await request.json();

  // Validate required fields
  const requiredFields = [
    'instrument_id',
    'channel_name',
    'channel_number',
    'center_wavelength_nm',
    'bandwidth_nm'
  ];

  for (const field of requiredFields) {
    if (!channelData[field]) {
      return createErrorResponse(`Missing required field: ${field}`, 400);
    }
  }

  // Verify user has access to this instrument
  const instrument = await getInstrumentForUser(channelData.instrument_id, user, env);
  if (!instrument) {
    return createErrorResponse('Instrument not found or access denied', 404);
  }

  // Validate wavelength range (typical: 300-1200nm)
  if (channelData.center_wavelength_nm < 300 || channelData.center_wavelength_nm > 1200) {
    return createErrorResponse('Center wavelength must be between 300-1200nm', 400);
  }

  // Validate bandwidth
  if (channelData.bandwidth_nm < 1 || channelData.bandwidth_nm > 200) {
    return createErrorResponse('Bandwidth must be between 1-200nm', 400);
  }

  // Check for duplicate channel number on this instrument
  const duplicateCheck = await env.DB.prepare(
    'SELECT id FROM instrument_channels WHERE instrument_id = ? AND channel_number = ?'
  ).bind(channelData.instrument_id, channelData.channel_number).first();

  if (duplicateCheck) {
    return createErrorResponse(
      `Channel number ${channelData.channel_number} already exists for this instrument`,
      409
    );
  }

  // Check for duplicate channel name on this instrument
  const nameCheck = await env.DB.prepare(
    'SELECT id FROM instrument_channels WHERE instrument_id = ? AND channel_name = ?'
  ).bind(channelData.instrument_id, channelData.channel_name).first();

  if (nameCheck) {
    return createErrorResponse(
      `Channel name '${channelData.channel_name}' already exists for this instrument`,
      409
    );
  }

  // Generate wavelength notation if not provided
  const wavelengthNotation = channelData.wavelength_notation ||
    `NW${channelData.bandwidth_nm}nm`;

  // Insert channel
  const insertQuery = `
    INSERT INTO instrument_channels (
      instrument_id,
      channel_name,
      channel_number,
      center_wavelength_nm,
      bandwidth_nm,
      wavelength_notation,
      band_type,
      calibration_coefficient,
      calibration_offset,
      last_calibrated_date,
      data_column_name,
      processing_enabled,
      quality_flag,
      description,
      notes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `;

  try {
    const result = await env.DB.prepare(insertQuery).bind(
      channelData.instrument_id,
      channelData.channel_name,
      channelData.channel_number,
      channelData.center_wavelength_nm,
      channelData.bandwidth_nm,
      wavelengthNotation,
      channelData.band_type || null,
      channelData.calibration_coefficient || null,
      channelData.calibration_offset || null,
      channelData.last_calibrated_date || null,
      channelData.data_column_name || null,
      channelData.processing_enabled !== undefined ? channelData.processing_enabled : true,
      channelData.quality_flag || null,
      channelData.description || null,
      channelData.notes || null
    ).run();

    // Fetch the created channel
    const newChannel = await env.DB.prepare(
      'SELECT * FROM instrument_channels WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return createSuccessResponse(newChannel, 201);

  } catch (error) {
    console.error('Error creating channel:', error);
    return createErrorResponse(`Failed to create channel: ${error.message}`, 500);
  }
}

/**
 * Update existing channel
 */
async function updateChannel(channelId, user, request, env) {
  const channelData = await request.json();

  // Fetch existing channel with permission check
  const existing = await env.DB.prepare(`
    SELECT c.*, p.station_id, s.normalized_name as station_normalized_name
    FROM instrument_channels c
    JOIN instruments i ON c.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE c.id = ?
  `).bind(channelId).first();

  if (!existing) {
    return createErrorResponse('Channel not found', 404);
  }

  // Permission check
  if (user.role === 'station' && existing.station_normalized_name !== user.station) {
    return createErrorResponse('Access denied', 403);
  }

  if (user.role === 'readonly') {
    return createErrorResponse('Read-only users cannot modify channels', 403);
  }

  // Build UPDATE query dynamically for provided fields
  const updates = [];
  const values = [];

  // Editable fields
  const editableFields = [
    'channel_name',
    'center_wavelength_nm',
    'bandwidth_nm',
    'wavelength_notation',
    'band_type',
    'calibration_coefficient',
    'calibration_offset',
    'last_calibrated_date',
    'data_column_name',
    'processing_enabled',
    'quality_flag',
    'description',
    'notes'
  ];

  for (const field of editableFields) {
    if (channelData[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(channelData[field]);
    }
  }

  if (updates.length === 0) {
    return createErrorResponse('No fields to update', 400);
  }

  // Add updated_at
  updates.push('updated_at = datetime(\'now\')');
  values.push(channelId);

  const updateQuery = `
    UPDATE instrument_channels
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  try {
    await env.DB.prepare(updateQuery).bind(...values).run();

    // Fetch updated channel
    const updated = await env.DB.prepare(
      'SELECT * FROM instrument_channels WHERE id = ?'
    ).bind(channelId).first();

    return createSuccessResponse(updated);

  } catch (error) {
    console.error('Error updating channel:', error);
    return createErrorResponse(`Failed to update channel: ${error.message}`, 500);
  }
}

/**
 * Delete channel
 */
async function deleteChannel(channelId, user, env) {
  // Fetch channel with permission check
  const channel = await env.DB.prepare(`
    SELECT c.*, p.station_id, s.normalized_name as station_normalized_name,
           i.number_of_channels
    FROM instrument_channels c
    JOIN instruments i ON c.instrument_id = i.id
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE c.id = ?
  `).bind(channelId).first();

  if (!channel) {
    return createErrorResponse('Channel not found', 404);
  }

  // Permission check
  if (user.role === 'station' && channel.station_normalized_name !== user.station) {
    return createErrorResponse('Access denied', 403);
  }

  if (user.role === 'readonly') {
    return createErrorResponse('Read-only users cannot delete channels', 403);
  }

  // Get current channel count
  const channelCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM instrument_channels WHERE instrument_id = ?'
  ).bind(channel.instrument_id).first();

  // Warning if this would leave 0 channels
  if (channelCount.count <= 1) {
    return createErrorResponse(
      'Cannot delete last channel. Instrument must have at least one channel.',
      400
    );
  }

  // Delete channel
  try {
    await env.DB.prepare('DELETE FROM instrument_channels WHERE id = ?').bind(channelId).run();

    return createSuccessResponse({
      message: 'Channel deleted successfully',
      deleted_channel_id: channelId,
      remaining_channels: channelCount.count - 1
    });

  } catch (error) {
    console.error('Error deleting channel:', error);
    return createErrorResponse(`Failed to delete channel: ${error.message}`, 500);
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
 * Validation helper: Check if number_of_channels matches actual channels
 * Call this from instruments handler after channel creation/deletion
 */
export async function validateChannelCount(instrumentId, env) {
  const instrument = await env.DB.prepare(
    'SELECT number_of_channels FROM instruments WHERE id = ?'
  ).bind(instrumentId).first();

  const channelCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM instrument_channels WHERE instrument_id = ?'
  ).bind(instrumentId).first();

  return {
    declared: instrument?.number_of_channels || 0,
    actual: channelCount?.count || 0,
    matches: instrument?.number_of_channels === channelCount?.count
  };
}
