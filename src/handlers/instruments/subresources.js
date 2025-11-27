// Instruments Handler - Subresource Operations
// Sub-resource endpoints: latest-image, rois

import { executeQuery, executeQueryFirst } from '../../utils/database.js';
import {
  createSuccessResponse,
  createNotFoundResponse
} from '../../utils/responses.js';
import { getInstrumentForUser } from './utils.js';

/**
 * Get latest phenocam image metadata for an instrument
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Latest image metadata
 */
export async function getLatestImage(id, user, env) {
  // Check if instrument exists and user has access
  const instrument = await getInstrumentForUser(id, user, env);
  if (!instrument) {
    return createNotFoundResponse();
  }

  // Query for latest image metadata from the instrument
  const query = `
    SELECT
      id,
      normalized_name,
      display_name,
      instrument_type,
      status,
      image_archive_path,
      last_image_timestamp,
      image_quality_score,
      image_processing_enabled
    FROM instruments
    WHERE id = ?
  `;

  const result = await executeQueryFirst(env, query, [id], 'getLatestImage');

  if (!result) {
    return createNotFoundResponse();
  }

  // Build response with image metadata
  const imageMetadata = {
    instrument_id: result.id,
    instrument_name: result.normalized_name,
    display_name: result.display_name,
    instrument_type: result.instrument_type,
    status: result.status,
    image_available: !!result.last_image_timestamp,
    last_image_timestamp: result.last_image_timestamp || null,
    image_quality_score: result.image_quality_score || null,
    image_archive_path: result.image_archive_path || null,
    image_processing_enabled: result.image_processing_enabled || false,
    // Placeholder for future image URL generation
    image_url: result.last_image_timestamp && result.image_archive_path
      ? `/api/images/${result.image_archive_path}`
      : null,
    thumbnail_url: result.last_image_timestamp && result.image_archive_path
      ? `/api/images/thumbnails/${result.image_archive_path}`
      : null
  };

  return createSuccessResponse(imageMetadata);
}

/**
 * Get all ROIs for a specific instrument
 * @param {string} id - Instrument ID
 * @param {Object} user - Authenticated user
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Instrument ROIs list
 */
export async function getInstrumentROIs(id, user, env) {
  // Check if instrument exists and user has access
  const instrument = await getInstrumentForUser(id, user, env);
  if (!instrument) {
    return createNotFoundResponse();
  }

  // Query for all ROIs for this instrument
  const query = `
    SELECT
      id,
      instrument_id,
      roi_name,
      description,
      color_r,
      color_g,
      color_b,
      alpha,
      thickness,
      points_json,
      auto_generated,
      source_image,
      generated_date,
      roi_processing_enabled,
      created_at,
      updated_at
    FROM instrument_rois
    WHERE instrument_id = ?
    ORDER BY roi_name
  `;

  const rois = await executeQuery(env, query, [id], 'getInstrumentROIs');

  return createSuccessResponse(rois || []);
}
