// New API Handler for Authentication-First Architecture
import { getUserFromRequest, authenticateUser, generateToken, hasPermission, checkStationAccess } from './auth-secrets.js';

export async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(segment => segment);

  // Remove 'api' from path segments
  if (pathSegments[0] === 'api') {
    pathSegments.shift();
  }

  const method = request.method;
  const resource = pathSegments[0];
  const id = pathSegments[1];

  try {
    switch (resource) {
      case 'auth':
        return await handleAuth(method, pathSegments, request, env);

      case 'stations':
        return await handleStations(method, id, request, env);

      case 'platforms':
        return await handlePlatforms(method, id, request, env);

      case 'instruments':
        return await handleInstruments(method, id, request, env);

      case 'geojson':
        return await handleGeoJSON(method, pathSegments, request, env);

      case 'health':
        return await handleHealth(env);

      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Authentication endpoints
async function handleAuth(method, pathSegments, request, env) {
  const action = pathSegments[1];

  switch (action) {
    case 'login':
      if (method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const { username, password } = await request.json();

        if (!username || !password) {
          return new Response(JSON.stringify({ error: 'Username and password required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const user = await authenticateUser(username, password);
        if (!user) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const token = await generateToken(user);

        return new Response(JSON.stringify({
          success: true,
          user: user,
          token: token,
          expires_in: 86400 // 24 hours
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    case 'verify':
      if (method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const user = await getUserFromRequest(request);
      if (!user) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ valid: true, user: user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    default:
      return new Response(JSON.stringify({ error: 'Auth endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// Stations CRUD
async function handleStations(method, id, request, env) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  switch (method) {
    case 'GET':
      if (id) {
        return await getStation(env.DB, id, user);
      } else {
        return await getStations(env.DB, user, new URL(request.url).searchParams);
      }

    case 'PUT':
      if (!id) {
        return new Response(JSON.stringify({ error: 'Station ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!hasPermission(user, 'write', 'station', parseInt(id))) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const stationData = await request.json();
      return await updateStation(env.DB, id, stationData, user);

    case 'POST':
      if (user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const newStationData = await request.json();
      return await createStation(env.DB, newStationData, user);

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// Platforms CRUD
async function handlePlatforms(method, id, request, env) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  switch (method) {
    case 'GET':
      if (id) {
        return await getPlatform(env.DB, id, user);
      } else {
        return await getPlatforms(env.DB, user, new URL(request.url).searchParams);
      }

    case 'PUT':
      if (!id) {
        return new Response(JSON.stringify({ error: 'Platform ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const platformData = await request.json();
      return await updatePlatform(env.DB, id, platformData, user);

    case 'POST':
      const newPlatformData = await request.json();
      return await createPlatform(env.DB, newPlatformData, user);

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// Instruments CRUD
async function handleInstruments(method, id, request, env) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  switch (method) {
    case 'GET':
      if (id) {
        return await getInstrument(env.DB, id, user);
      } else {
        return await getInstruments(env.DB, user, new URL(request.url).searchParams);
      }

    case 'PUT':
      if (!id) {
        return new Response(JSON.stringify({ error: 'Instrument ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const instrumentData = await request.json();
      return await updateInstrument(env.DB, id, instrumentData, user);

    case 'POST':
      const newInstrumentData = await request.json();
      return await createInstrument(env.DB, newInstrumentData, user);

    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// GeoJSON endpoints
async function handleGeoJSON(method, pathSegments, request, env) {
  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const type = pathSegments[1] || 'all';
  return await getGeoJSON(env.DB, type, user);
}

// Health check
async function handleHealth(env) {
  try {
    const result = await env.DB.prepare('SELECT COUNT(*) as count FROM stations').first();

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SITES Spectral Stations & Instruments',
      version: '3.0.0',
      environment: 'production',
      database: {
        type: 'Cloudflare D1',
        connected: true,
        stations: result.count
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Database functions for stations
async function getStations(db, user, searchParams) {
  let query = `
    SELECT
      s.*,
      COALESCE(i.instrument_count, 0) as instrument_count,
      COALESCE(i.active_instruments, 0) as active_instruments
    FROM stations s
    LEFT JOIN (
      SELECT
        p.station_id,
        COUNT(i.id) as instrument_count,
        COUNT(CASE WHEN i.status = 'Active' THEN 1 END) as active_instruments
      FROM platforms p
      LEFT JOIN instruments i ON p.id = i.platform_id
      GROUP BY p.station_id
    ) i ON s.id = i.station_id
  `;

  const params = [];

  // Station users can only see their assigned station
  if (user.role === 'station') {
    query += ` WHERE s.acronym = ?`;
    params.push(user.station_acronym);
  }

  query += ` ORDER BY s.display_name`;

  const result = await db.prepare(query).bind(...params).all();

  return new Response(JSON.stringify(result.results || []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getStation(db, identifier, user) {
  // Handle both numeric ID and acronym/normalized_name
  const isNumericId = !isNaN(identifier) && !isNaN(parseFloat(identifier));

  // For permission checking, we need to get the station first to check access
  let station;
  if (isNumericId) {
    station = await db.prepare(`SELECT id, acronym, normalized_name FROM stations WHERE id = ?`).bind(parseInt(identifier)).first();
  } else {
    station = await db.prepare(`SELECT id, acronym, normalized_name FROM stations WHERE acronym = ? OR normalized_name = ?`).bind(identifier, identifier).first();
  }

  if (!station) {
    return new Response(JSON.stringify({ error: 'Station not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check station access using the station ID
  if (!checkStationAccess(user, station.id)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await db.prepare(`
    SELECT
      s.*,
      COALESCE(i.instrument_count, 0) as instrument_count,
      COALESCE(i.active_instruments, 0) as active_instruments
    FROM stations s
    LEFT JOIN (
      SELECT
        p.station_id,
        COUNT(i.id) as instrument_count,
        COUNT(CASE WHEN i.status = 'Active' THEN 1 END) as active_instruments
      FROM platforms p
      LEFT JOIN instruments i ON p.id = i.platform_id
      GROUP BY p.station_id
    ) i ON s.id = i.station_id
    WHERE s.id = ?
  `).bind(station.id).first();

  if (!result) {
    return new Response(JSON.stringify({ error: 'Station not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updateStation(db, id, data, user) {
  if (!checkStationAccess(user, id)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const allowedFields = ['display_name', 'acronym', 'status', 'country', 'latitude', 'longitude', 'elevation_m', 'description'];
  const updateFields = [];
  const params = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  params.push(id);

  await db.prepare(`
    UPDATE stations
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(...params).run();

  return await getStation(db, id, user);
}

async function createStation(db, data, user) {
  const requiredFields = ['display_name', 'acronym'];

  for (const field of requiredFields) {
    if (!data[field]) {
      return new Response(JSON.stringify({ error: `${field} is required` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const result = await db.prepare(`
    INSERT INTO stations (normalized_name, display_name, acronym, status, country, latitude, longitude, elevation_m, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.display_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    data.display_name,
    data.acronym,
    data.status || 'Active',
    data.country || 'Sweden',
    data.latitude || null,
    data.longitude || null,
    data.elevation_m || null,
    data.description || null
  ).run();

  return await getStation(db, result.meta.last_row_id, user);
}

// Database functions for platforms
async function getPlatforms(db, user, searchParams) {
  let query = `
    SELECT p.*, s.display_name as station_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
  `;

  const params = [];

  // Station users can only see platforms from their station
  if (user.role === 'station') {
    query += ` WHERE p.station_id = ?`;
    params.push(user.station_id);
  }

  const stationId = searchParams.get('station_id');
  if (stationId && checkStationAccess(user, stationId)) {
    if (user.role !== 'station') {
      query += ` WHERE p.station_id = ?`;
      params.push(stationId);
    }
  }

  query += ` ORDER BY s.display_name, p.display_name`;

  const result = await db.prepare(query).bind(...params).all();

  return new Response(JSON.stringify(result.results || []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Database functions for instruments
async function getInstruments(db, user, searchParams) {
  let query = `
    SELECT
      i.*,
      p.display_name as platform_name,
      s.display_name as station_name,
      s.id as station_id
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
  `;

  const params = [];

  // Station users can only see instruments from their station
  if (user.role === 'station') {
    query += ` WHERE s.id = ?`;
    params.push(user.station_id);
  }

  query += ` ORDER BY s.display_name, p.display_name, i.display_name`;

  const result = await db.prepare(query).bind(...params).all();

  return new Response(JSON.stringify(result.results || []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// GeoJSON function
async function getGeoJSON(db, type, user) {
  const features = [];

  // Add stations with platform and instrument counts
  if (type === 'all' || type === 'stations') {
    let stationsQuery = `
      SELECT
        s.id, s.normalized_name, s.display_name, s.acronym, s.latitude, s.longitude, s.status,
        COUNT(DISTINCT p.id) as platform_count,
        COUNT(DISTINCT i.id) as instrument_count,
        COUNT(DISTINCT CASE WHEN i.status = 'Active' THEN i.id END) as active_instrument_count
      FROM stations s
      LEFT JOIN platforms p ON s.id = p.station_id
      LEFT JOIN instruments i ON p.id = i.platform_id
      WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
    `;

    const stationParams = [];

    if (user.role === 'station') {
      stationsQuery += ` AND s.id = ?`;
      stationParams.push(user.station_id);
    }

    stationsQuery += ` GROUP BY s.id, s.normalized_name, s.display_name, s.acronym, s.latitude, s.longitude, s.status`;

    const stations = await db.prepare(stationsQuery).bind(...stationParams).all();

    for (const station of stations.results || []) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [station.longitude, station.latitude]
        },
        properties: {
          type: 'station',
          id: station.id,
          name: station.display_name,
          acronym: station.acronym,
          status: station.status,
          latitude: station.latitude,
          longitude: station.longitude,
          platform_count: station.platform_count || 0,
          instrument_count: station.instrument_count || 0,
          active_instrument_count: station.active_instrument_count || 0
        }
      });
    }
  }

  // Add platforms with instrument details
  if (type === 'all' || type === 'platforms') {
    let platformsQuery = `
      SELECT p.id, p.display_name, p.location_code, p.mounting_structure, p.platform_height_m,
             p.latitude, p.longitude, p.status, s.display_name as station_name, s.id as station_id,
             COUNT(DISTINCT i.id) as instrument_count,
             COUNT(DISTINCT CASE WHEN i.status = 'Active' THEN i.id END) as active_instrument_count,
             GROUP_CONCAT(DISTINCT i.camera_brand) as camera_brands,
             GROUP_CONCAT(DISTINCT i.ecosystem_code) as ecosystem_codes,
             GROUP_CONCAT(DISTINCT i.display_name) as instrument_names
      FROM platforms p
      JOIN stations s ON p.station_id = s.id
      LEFT JOIN instruments i ON p.id = i.platform_id
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    `;

    const platformParams = [];

    if (user.role === 'station') {
      platformsQuery += ` AND s.id = ?`;
      platformParams.push(user.station_id);
    }

    platformsQuery += ` GROUP BY p.id, p.display_name, p.location_code, p.mounting_structure, p.platform_height_m, p.latitude, p.longitude, p.status, s.display_name, s.id`;

    const platforms = await db.prepare(platformsQuery).bind(...platformParams).all();

    for (const platform of platforms.results || []) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [platform.longitude, platform.latitude]
        },
        properties: {
          type: 'platform',
          id: platform.id,
          name: platform.display_name || platform.location_code || `Platform ${platform.id}`,
          station_name: platform.station_name,
          station_id: platform.station_id,
          mounting_structure: platform.mounting_structure,
          platform_height_m: platform.platform_height_m,
          status: platform.status,
          latitude: platform.latitude,
          longitude: platform.longitude,
          instrument_count: platform.instrument_count || 0,
          active_instrument_count: platform.active_instrument_count || 0,
          camera_brands: platform.camera_brands ? platform.camera_brands.split(',').filter(b => b) : [],
          ecosystem_codes: platform.ecosystem_codes ? platform.ecosystem_codes.split(',').filter(e => e) : [],
          instrument_names: platform.instrument_names ? platform.instrument_names.split(',').filter(n => n) : []
        }
      });
    }
  }

  return new Response(JSON.stringify({
    type: 'FeatureCollection',
    features: features
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Platform CRUD operations
async function getPlatform(db, id, user) {
  const result = await db.prepare(`
    SELECT p.*, s.display_name as station_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `).bind(parseInt(id)).first();

  if (!result) {
    return new Response(JSON.stringify({ error: 'Platform not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check station access
  if (!checkStationAccess(user, result.station_id)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updatePlatform(db, id, data, user) {
  // Check if platform exists and user has access
  const existing = await db.prepare(`
    SELECT p.*, s.id as station_id FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `).bind(parseInt(id)).first();

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Platform not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!checkStationAccess(user, existing.station_id)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build update query dynamically
  const updateFields = [];
  const params = [];

  const allowedFields = ['display_name', 'location_code', 'mounting_structure', 'platform_height_m', 'status', 'deployment_date', 'latitude', 'longitude', 'description'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  params.push(parseInt(id));

  await db.prepare(`
    UPDATE platforms
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `).bind(...params).run();

  return new Response(JSON.stringify({ success: true, message: 'Platform updated successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function createPlatform(db, data, user) {
  if (!data.station_id) {
    return new Response(JSON.stringify({ error: 'Station ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!checkStationAccess(user, parseInt(data.station_id))) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await db.prepare(`
    INSERT INTO platforms (station_id, display_name, location_code, mounting_structure, platform_height_m, status, deployment_date, latitude, longitude, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    parseInt(data.station_id),
    data.display_name || null,
    data.location_code || null,
    data.mounting_structure || null,
    data.platform_height_m || null,
    data.status || 'Active',
    data.deployment_date || null,
    data.latitude || null,
    data.longitude || null,
    data.description || null
  ).run();

  return new Response(JSON.stringify({
    success: true,
    message: 'Platform created successfully',
    id: result.insertId
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Instrument CRUD operations
async function getInstrument(db, id, user) {
  const result = await db.prepare(`
    SELECT i.*, p.display_name as platform_name, s.display_name as station_name, s.id as station_id
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.id = ?
  `).bind(parseInt(id)).first();

  if (!result) {
    return new Response(JSON.stringify({ error: 'Instrument not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check station access
  if (!checkStationAccess(user, result.station_id)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updateInstrument(db, id, data, user) {
  // Check if instrument exists and user has access
  const existing = await db.prepare(`
    SELECT i.*, p.station_id FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    WHERE i.id = ?
  `).bind(parseInt(id)).first();

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Instrument not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!checkStationAccess(user, existing.station_id)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build update query dynamically
  const updateFields = [];
  const params = [];

  const allowedFields = [
    'display_name', 'ecosystem_code', 'instrument_number', 'status', 'camera_brand', 'camera_model',
    'camera_resolution', 'camera_serial_number', 'first_measurement_year', 'last_measurement_year',
    'measurement_status', 'deployment_date', 'removal_date', 'latitude', 'longitude',
    'instrument_height_m', 'viewing_direction', 'azimuth_degrees', 'degrees_from_nadir',
    'description', 'installation_notes', 'maintenance_notes'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  params.push(parseInt(id));

  await db.prepare(`
    UPDATE instruments
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `).bind(...params).run();

  return new Response(JSON.stringify({ success: true, message: 'Instrument updated successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function createInstrument(db, data, user) {
  if (!data.platform_id) {
    return new Response(JSON.stringify({ error: 'Platform ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if platform exists and user has access
  const platform = await db.prepare(`
    SELECT p.*, s.id as station_id FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.id = ?
  `).bind(parseInt(data.platform_id)).first();

  if (!platform) {
    return new Response(JSON.stringify({ error: 'Platform not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!checkStationAccess(user, platform.station_id)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await db.prepare(`
    INSERT INTO instruments (
      platform_id, display_name, ecosystem_code, instrument_number, status, camera_brand, camera_model,
      camera_resolution, camera_serial_number, first_measurement_year, last_measurement_year,
      measurement_status, deployment_date, removal_date, latitude, longitude, instrument_height_m,
      viewing_direction, azimuth_degrees, degrees_from_nadir, description, installation_notes, maintenance_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    parseInt(data.platform_id),
    data.display_name || null,
    data.ecosystem_code || null,
    data.instrument_number || null,
    data.status || 'Active',
    data.camera_brand || 'Mobotix',
    data.camera_model || null,
    data.camera_resolution || null,
    data.camera_serial_number || null,
    data.first_measurement_year || null,
    data.last_measurement_year || null,
    data.measurement_status || 'Active',
    data.deployment_date || null,
    data.removal_date || null,
    data.latitude || null,
    data.longitude || null,
    data.instrument_height_m || null,
    data.viewing_direction || null,
    data.azimuth_degrees || null,
    data.degrees_from_nadir || null,
    data.description || null,
    data.installation_notes || null,
    data.maintenance_notes || null
  ).run();

  return new Response(JSON.stringify({
    success: true,
    message: 'Instrument created successfully',
    id: result.insertId
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}