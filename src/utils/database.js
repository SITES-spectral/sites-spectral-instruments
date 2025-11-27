// Database Utilities
// Database query helpers and connection utilities

/**
 * Execute a database query with error handling
 * @param {Object} env - Environment variables and bindings
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} operation - Operation type for logging
 * @returns {Object|null} Query result or null on error
 */
export async function executeQuery(env, query, params = [], operation = 'query') {
  try {
    const statement = env.DB.prepare(query);

    if (params.length > 0) {
      return await statement.bind(...params).all();
    } else {
      return await statement.all();
    }
  } catch (error) {
    console.error(`Database error in ${operation}:`, error);
    return null;
  }
}

/**
 * Execute a database query returning a single row
 * @param {Object} env - Environment variables and bindings
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} operation - Operation type for logging
 * @returns {Object|null} Single row result or null
 */
export async function executeQueryFirst(env, query, params = [], operation = 'query') {
  try {
    const statement = env.DB.prepare(query);

    if (params.length > 0) {
      return await statement.bind(...params).first();
    } else {
      return await statement.first();
    }
  } catch (error) {
    console.error(`Database error in ${operation}:`, error);
    return null;
  }
}

/**
 * Execute a database query that modifies data (INSERT, UPDATE, DELETE)
 * @param {Object} env - Environment variables and bindings
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} operation - Operation type for logging
 * @returns {Object|null} Query result or null on error
 */
export async function executeQueryRun(env, query, params = [], operation = 'modification') {
  try {
    const statement = env.DB.prepare(query);

    if (params.length > 0) {
      return await statement.bind(...params).run();
    } else {
      return await statement.run();
    }
  } catch (error) {
    console.error(`Database error in ${operation}:`, error);
    return null;
  }
}

/**
 * Get station data by identifier (ID, normalized name, or acronym)
 * @param {string|number} identifier - Station ID, normalized name, or acronym
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Station data or null
 */
export async function getStationData(identifier, env) {
  // Check if identifier is a numeric ID
  const numericId = parseInt(identifier, 10);
  const isNumeric = !isNaN(numericId) && String(numericId) === String(identifier);

  let query;
  let params;

  if (isNumeric) {
    // Query by numeric ID
    query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description
      FROM stations
      WHERE id = ?
    `;
    params = [numericId];
  } else {
    // Query by normalized name or acronym
    query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description
      FROM stations
      WHERE normalized_name = ? OR acronym = ?
    `;
    params = [identifier, identifier];
  }

  return await executeQueryFirst(env, query, params, 'getStationData');
}

/**
 * Get station data by normalized name
 * @param {string} normalizedName - Station normalized name
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Station data or null
 */
export async function getStationByNormalizedName(normalizedName, env) {
  const query = `
    SELECT id, display_name, acronym, normalized_name, latitude, longitude,
           elevation_m, status, country, description
    FROM stations
    WHERE normalized_name = ?
  `;

  return await executeQueryFirst(env, query, [normalizedName], 'getStationByNormalizedName');
}

/**
 * Get platform data by ID or normalized name
 * @param {Object} env - Environment variables and bindings
 * @param {string|number} identifier - Platform ID or normalized name
 * @returns {Object|null} Platform data or null
 */
export async function getPlatformData(env, identifier) {
  // Check if identifier is a numeric ID
  const numericId = parseInt(identifier, 10);
  const isNumeric = !isNaN(numericId) && String(numericId) === String(identifier);

  let query;
  let params;

  if (isNumeric) {
    // Query by numeric ID
    query = `
      SELECT id, display_name, normalized_name, ecosystem_code, location_code,
             status, description, station_id, created_at
      FROM platforms
      WHERE id = ?
    `;
    params = [numericId];
  } else {
    // Query by normalized name
    query = `
      SELECT id, display_name, normalized_name, ecosystem_code, location_code,
             status, description, station_id, created_at
      FROM platforms
      WHERE normalized_name = ?
    `;
    params = [identifier];
  }

  return await executeQueryFirst(env, query, params, 'getPlatformData');
}

/**
 * Get stations data with platform and instrument counts, filtered by user permissions
 * @param {Object} user - User object from token
 * @param {Object} env - Environment variables and bindings
 * @returns {Array} Array of station data
 */
export async function getStationsData(user, env) {
  let query = `
    SELECT s.id, s.display_name, s.acronym, s.normalized_name, s.latitude, s.longitude,
           s.elevation_m, s.status, s.country, s.description,
           COUNT(DISTINCT p.id) as platform_count,
           COUNT(DISTINCT i.id) as instrument_count
    FROM stations s
    LEFT JOIN platforms p ON s.id = p.station_id
    LEFT JOIN instruments i ON p.id = i.platform_id
  `;

  let result;

  // Filter based on user role
  if (user.role === 'admin') {
    // Admin can see all stations
    query += ' GROUP BY s.id ORDER BY s.display_name';
    result = await executeQuery(env, query, [], 'getStationsData-admin');
  } else if (user.role === 'station' && user.station_normalized_name) {
    // Station users can only see their own station
    query += ' WHERE s.normalized_name = ? GROUP BY s.id ORDER BY s.display_name';
    result = await executeQuery(env, query, [user.station_normalized_name], 'getStationsData-station');
  } else {
    // Readonly users can see all stations
    query += ' GROUP BY s.id ORDER BY s.display_name';
    result = await executeQuery(env, query, [], 'getStationsData-readonly');
  }

  return result?.results || [];
}

/**
 * Get platform data by station ID
 * @param {number} stationId - Station ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Array} Array of platform data
 */
export async function getPlatformsByStationId(stationId, env) {
  const query = `
    SELECT p.id, p.display_name, p.normalized_name, p.ecosystem_code, p.location_code,
           p.status, p.description, p.created_at, p.station_id,
           COUNT(i.id) as instrument_count
    FROM platforms p
    LEFT JOIN instruments i ON p.id = i.platform_id
    WHERE p.station_id = ?
    GROUP BY p.id
    ORDER BY p.display_name
  `;

  const result = await executeQuery(env, query, [stationId], 'getPlatformsByStationId');
  return result?.results || [];
}

/**
 * Get instrument data by platform ID
 * @param {number} platformId - Platform ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Array} Array of instrument data
 */
export async function getInstrumentsByPlatformId(platformId, env) {
  const query = `
    SELECT i.id, i.display_name, i.normalized_name, i.instrument_type, i.manufacturer,
           i.model, i.serial_number, i.status, i.description, i.created_at, i.platform_id,
           COUNT(r.id) as roi_count
    FROM instruments i
    LEFT JOIN instrument_rois r ON i.id = r.instrument_id
    WHERE i.platform_id = ?
    GROUP BY i.id
    ORDER BY i.display_name
  `;

  const result = await executeQuery(env, query, [platformId], 'getInstrumentsByPlatformId');
  return result?.results || [];
}

/**
 * Get ROI data by instrument ID
 * @param {number} instrumentId - Instrument ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Array} Array of ROI data
 */
export async function getROIsByInstrumentId(instrumentId, env) {
  const query = `
    SELECT r.id, r.roi_name, r.description, r.alpha, r.auto_generated,
           r.color_r, r.color_g, r.color_b, r.thickness, r.generated_date,
           r.source_image, r.points_json, r.created_at
    FROM instrument_rois r
    WHERE r.instrument_id = ?
    ORDER BY r.roi_name
  `;

  const result = await executeQuery(env, query, [instrumentId], 'getROIsByInstrumentId');
  return result?.results || [];
}

/**
 * Check if station exists
 * @param {number} stationId - Station ID
 * @param {Object} env - Environment variables and bindings
 * @returns {boolean} True if station exists
 */
export async function stationExists(stationId, env) {
  const query = 'SELECT id FROM stations WHERE id = ?';
  const result = await executeQueryFirst(env, query, [stationId], 'stationExists');
  return !!result;
}

/**
 * Check if platform exists
 * @param {number} platformId - Platform ID
 * @param {Object} env - Environment variables and bindings
 * @returns {boolean} True if platform exists
 */
export async function platformExists(platformId, env) {
  const query = 'SELECT id FROM platforms WHERE id = ?';
  const result = await executeQueryFirst(env, query, [platformId], 'platformExists');
  return !!result;
}

/**
 * Check if instrument exists
 * @param {number} instrumentId - Instrument ID
 * @param {Object} env - Environment variables and bindings
 * @returns {boolean} True if instrument exists
 */
export async function instrumentExists(instrumentId, env) {
  const query = 'SELECT id FROM instruments WHERE id = ?';
  const result = await executeQueryFirst(env, query, [instrumentId], 'instrumentExists');
  return !!result;
}

/**
 * Resolve station identifier (ID, normalized name, or acronym) to station data
 * @param {string|number} identifier - Station identifier
 * @param {Object} env - Environment variables and bindings
 * @returns {Object|null} Station data or null
 */
export async function resolveStationIdentifier(identifier, env) {
  if (!identifier) return null;

  // Try numeric ID first (fastest)
  if (/^\d+$/.test(identifier)) {
    const query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description, created_at, updated_at
      FROM stations WHERE id = ?
    `;
    const result = await executeQueryFirst(env, query, [parseInt(identifier)], 'resolveStationIdentifier-id');
    if (result) return result;
  }

  // Try normalized name and acronym (with index optimization)
  const query = `
    SELECT id, display_name, acronym, normalized_name, latitude, longitude,
           elevation_m, status, country, description, created_at, updated_at
    FROM stations
    WHERE normalized_name = ? OR acronym = ?
    LIMIT 1
  `;

  return await executeQueryFirst(env, query, [identifier, identifier], 'resolveStationIdentifier-name');
}