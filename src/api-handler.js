// SITES Spectral API Handler
// Handles authentication and station data endpoints
// Uses station normalized names and secure credentials

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

      case 'rois':
        return await handleROIs(method, id, request, env);

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

        const user = await authenticateUser(username, password, env);
        if (!user) {
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const token = await generateToken(user, env);

        return new Response(JSON.stringify({
          success: true,
          token,
          user: {
            username: user.username,
            role: user.role,
            station_acronym: user.station_acronym,
            station_normalized_name: user.station_normalized_name
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ error: 'Login failed' }), {
          status: 500,
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

      try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          valid: true,
          user: {
            username: user.username,
            role: user.role,
            station_acronym: user.station_acronym,
            station_normalized_name: user.station_normalized_name
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Token verification failed' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    default:
      return new Response(JSON.stringify({ error: 'Auth endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// Station endpoints
async function handleStations(method, id, request, env) {
  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Authentication required
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (id) {
      // Get specific station by normalized name or acronym
      const station = await getStationData(id, env);
      if (!station) {
        return new Response(JSON.stringify({ error: 'Station not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check access permission
      if (!canAccessStation(user, station)) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(station), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // List stations (filtered by user permissions)
      const stations = await getStationsData(user, env);
      return new Response(JSON.stringify({ stations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Stations error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch station data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Platform endpoints
async function handlePlatforms(method, id, request, env) {
  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Authentication required
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (id) {
      // Get specific platform by ID
      let query = `
        SELECT p.id, p.normalized_name, p.display_name, p.location_code, p.station_id,
               p.latitude, p.longitude, p.platform_height_m, p.status, p.mounting_structure,
               p.deployment_date, p.description, p.operation_programs,
               s.acronym as station_acronym, s.display_name as station_name
        FROM platforms p
        JOIN stations s ON p.station_id = s.id
        WHERE p.id = ?
      `;

      // Add permission filtering
      if (user.role === 'station' && user.station_normalized_name) {
        query += ' AND s.normalized_name = ?';
      }

      const params = user.role === 'station' && user.station_normalized_name
        ? [id, user.station_normalized_name]
        : [id];

      const result = await env.DB.prepare(query).bind(...params).first();

      if (!result) {
        return new Response(JSON.stringify({ error: 'Platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // List platforms (existing logic)
      const url = new URL(request.url);
      const stationParam = url.searchParams.get('station');

      let query = `
        SELECT p.id, p.normalized_name, p.display_name, p.location_code, p.station_id,
               p.latitude, p.longitude, p.platform_height_m, p.status, p.mounting_structure,
               p.operation_programs, s.acronym as station_acronym, s.display_name as station_name
        FROM platforms p
        JOIN stations s ON p.station_id = s.id
      `;

      let params = [];

      if (stationParam) {
        query += ' WHERE s.acronym = ? OR s.normalized_name = ?';
        params = [stationParam, stationParam];
      }

      // Add permission filtering
      if (user.role === 'station' && user.station_normalized_name) {
        query += stationParam ? ' AND' : ' WHERE';
        query += ' s.normalized_name = ?';
        params.push(user.station_normalized_name);
      }

      query += ' ORDER BY p.display_name';

      const result = await env.DB.prepare(query).bind(...params).all();

      return new Response(JSON.stringify({
        platforms: result?.results || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Platforms error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch platform data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Instrument endpoints
async function handleInstruments(method, id, request, env) {
  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Authentication required
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (id) {
      // Get specific instrument by ID
      let query = `
        SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
               i.instrument_type, i.ecosystem_code, i.instrument_number, i.status,
               i.latitude, i.longitude, i.viewing_direction, i.azimuth_degrees,
               i.camera_brand, i.camera_model, i.camera_resolution, i.camera_serial_number,
               i.first_measurement_year, i.last_measurement_year, i.measurement_status,
               i.instrument_height_m, i.description, i.installation_notes, i.maintenance_notes,
               p.display_name as platform_name, p.location_code, p.mounting_structure,
               s.acronym as station_acronym, s.display_name as station_name
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.id = ?
      `;

      // Add permission filtering
      if (user.role === 'station' && user.station_normalized_name) {
        query += ' AND s.normalized_name = ?';
      }

      const params = user.role === 'station' && user.station_normalized_name
        ? [id, user.station_normalized_name]
        : [id];

      const result = await env.DB.prepare(query).bind(...params).first();

      if (!result) {
        return new Response(JSON.stringify({ error: 'Instrument not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // List instruments (existing logic)
      const url = new URL(request.url);
      const stationParam = url.searchParams.get('station');

      let query = `
        SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
               i.instrument_type, i.ecosystem_code, i.instrument_number, i.status,
               i.latitude, i.longitude, i.viewing_direction, i.azimuth_degrees,
               i.camera_brand, i.camera_model, i.camera_resolution,
               p.display_name as platform_name, p.location_code,
               s.acronym as station_acronym, s.display_name as station_name
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
      `;

      let params = [];

      if (stationParam) {
        query += ' WHERE s.acronym = ? OR s.normalized_name = ?';
        params = [stationParam, stationParam];
      }

      // Add permission filtering
      if (user.role === 'station' && user.station_normalized_name) {
        query += stationParam ? ' AND' : ' WHERE';
        query += ' s.normalized_name = ?';
        params.push(user.station_normalized_name);
      }

      query += ' ORDER BY i.display_name';

      const result = await env.DB.prepare(query).bind(...params).all();

      return new Response(JSON.stringify({
        instruments: result?.results || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Instruments error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch instrument data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Health check endpoint
async function handleHealth(env) {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION || '4.1.0'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Authentication functions
async function authenticateUser(username, password, env) {
  if (!username || !password) {
    console.warn('Authentication attempted with missing username or password');
    return null;
  }

  try {
    // Load credentials from secure file
    const credentials = await loadCredentials(env);
    if (!credentials) {
      console.error('Failed to load credentials file');
      return null;
    }

    // Check admin credentials
    if (credentials.admin?.username === username && credentials.admin?.password === password) {
      console.log(`Admin user authenticated: ${username}`);
      return {
        username: credentials.admin.username,
        role: credentials.admin.role,
        station_acronym: null,
        station_normalized_name: null
      };
    }

    // Check station credentials
    if (credentials.stations) {
      for (const [stationName, stationCreds] of Object.entries(credentials.stations)) {
        if (stationCreds?.username === username && stationCreds?.password === password) {
          // Get station acronym from database
          const stationData = await getStationByNormalizedName(stationName, env);
          console.log(`Station user authenticated: ${username} for station: ${stationName}`);
          return {
            username: stationCreds.username,
            role: stationCreds.role,
            station_id: stationCreds.station_id,
            station_acronym: stationData?.acronym || null,
            station_normalized_name: stationName
          };
        }
      }
    }

    console.warn(`Authentication failed for username: ${username}`);
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

async function generateToken(user, env) {
  try {
    // Load JWT secret from credentials
    const credentials = await loadCredentials(env);
    if (!credentials?.jwt_secret) {
      console.error('JWT secret not found in credentials');
      throw new Error('JWT secret not available');
    }

    // Simple token for now - will upgrade to proper JWT later
    const tokenData = {
      username: user.username,
      role: user.role,
      station_acronym: user.station_acronym,
      station_normalized_name: user.station_normalized_name,
      station_id: user.station_id,
      issued_at: Date.now(),
      expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    return btoa(JSON.stringify(tokenData));
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
}

async function getUserFromRequest(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Invalid or missing Authorization header');
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) {
      console.warn('Empty token in Authorization header');
      return null;
    }

    const tokenData = JSON.parse(atob(token));

    // Check required fields
    if (!tokenData.username || !tokenData.role) {
      console.warn('Invalid token: missing required fields');
      return null;
    }

    // Check token expiration
    if (tokenData.expires_at && Date.now() > tokenData.expires_at) {
      console.warn(`Token expired for user: ${tokenData.username}`);
      return null;
    }

    console.log(`Valid token for user: ${tokenData.username}, role: ${tokenData.role}`);
    return tokenData;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

// Data access functions
async function loadCredentials(env) {
  try {
    // Load credentials from Cloudflare secrets
    if (env.USE_CLOUDFLARE_SECRETS === 'true') {
      const credentials = {
        admin: JSON.parse(env.ADMIN_CREDENTIALS || '{}'),
        stations: {},
        jwt_secret: env.JWT_SECRET
      };

      // Load station credentials from individual secrets
      const stationNames = ['abisko', 'asa', 'bolmen', 'erken', 'grimso', 'lonnstorp', 'robacksdalen', 'skogaryd', 'svartberget'];

      for (const stationName of stationNames) {
        const secretName = `STATION_${stationName.toUpperCase()}_CREDENTIALS`;
        const stationSecret = env[secretName];
        if (stationSecret) {
          try {
            credentials.stations[stationName] = JSON.parse(stationSecret);
          } catch (parseError) {
            console.warn(`Failed to parse credentials for ${stationName}:`, parseError);
          }
        }
      }

      return credentials;
    } else {
      // Fallback: try to load from database or return error
      console.error('No credential loading method configured');
      return null;
    }
  } catch (error) {
    console.error('Failed to load credentials:', error);
    return null;
  }
}

async function getStationByNormalizedName(normalizedName, env) {
  try {
    const query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description
      FROM stations
      WHERE normalized_name = ?
    `;

    const result = await env.DB.prepare(query).bind(normalizedName).first();
    return result || null;
  } catch (error) {
    console.error('Database error in getStationByNormalizedName:', error);
    return null;
  }
}

async function getStationData(identifier, env) {
  try {
    const query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description
      FROM stations
      WHERE normalized_name = ? OR acronym = ?
    `;

    const result = await env.DB.prepare(query).bind(identifier, identifier).first();
    return result || null;
  } catch (error) {
    console.error('Database error in getStationData:', error);
    return null;
  }
}

async function getStationsData(user, env) {
  try {
    let query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description
      FROM stations
    `;

    let result;

    // Filter based on user role
    if (user.role === 'admin') {
      // Admin can see all stations
      result = await env.DB.prepare(query + ' ORDER BY display_name').all();
    } else if (user.role === 'station' && user.station_normalized_name) {
      // Station users can only see their own station
      query += ' WHERE normalized_name = ? ORDER BY display_name';
      result = await env.DB.prepare(query).bind(user.station_normalized_name).all();
    } else {
      // Readonly users can see all stations
      result = await env.DB.prepare(query + ' ORDER BY display_name').all();
    }

    return result?.results || [];
  } catch (error) {
    console.error('Database error in getStationsData:', error);
    return [];
  }
}

// Handle ROI requests
async function handleROIs(method, id, request, env) {
  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const user = await getUserFromRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const instrumentParam = url.searchParams.get('instrument');

  try {
    if (id) {
      // Get specific ROI by ID
      let query = `
        SELECT r.id, r.roi_name, r.description, r.alpha, r.auto_generated,
               r.color_r, r.color_g, r.color_b, r.thickness, r.generated_date,
               r.source_image, r.points_json, r.created_at,
               i.normalized_name as instrument_name, i.display_name as instrument_display_name,
               s.acronym as station_acronym
        FROM instrument_rois r
        JOIN instruments i ON r.instrument_id = i.id
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE r.id = ?
      `;

      const roi = await env.DB.prepare(query).bind(id).first();

      if (!roi) {
        return new Response(JSON.stringify({ error: 'ROI not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Parse points JSON
      if (roi.points_json) {
        roi.points = JSON.parse(roi.points_json);
      }

      return new Response(JSON.stringify(roi), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // Get ROIs for a specific instrument
      if (instrumentParam) {
        let query = `
          SELECT r.id, r.roi_name, r.description, r.alpha, r.auto_generated,
                 r.color_r, r.color_g, r.color_b, r.thickness, r.generated_date,
                 r.source_image, r.points_json, r.created_at,
                 i.normalized_name as instrument_name, i.display_name as instrument_display_name
          FROM instrument_rois r
          JOIN instruments i ON r.instrument_id = i.id
          WHERE i.normalized_name = ?
          ORDER BY r.roi_name
        `;

        const results = await env.DB.prepare(query).bind(instrumentParam).all();
        const rois = results.results.map(roi => {
          if (roi.points_json) {
            roi.points = JSON.parse(roi.points_json);
          }
          return roi;
        });

        return new Response(JSON.stringify({ rois }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } else {
        // Get all ROIs
        let query = `
          SELECT r.id, r.roi_name, r.description, r.alpha, r.auto_generated,
                 r.color_r, r.color_g, r.color_b, r.thickness, r.generated_date,
                 r.source_image, r.points_json, r.created_at,
                 i.normalized_name as instrument_name, i.display_name as instrument_display_name,
                 s.acronym as station_acronym
          FROM instrument_rois r
          JOIN instruments i ON r.instrument_id = i.id
          JOIN platforms p ON i.platform_id = p.id
          JOIN stations s ON p.station_id = s.id
          ORDER BY s.acronym, i.normalized_name, r.roi_name
        `;

        const results = await env.DB.prepare(query).all();
        const rois = results.results.map(roi => {
          if (roi.points_json) {
            roi.points = JSON.parse(roi.points_json);
          }
          return roi;
        });

        return new Response(JSON.stringify({ rois }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

  } catch (error) {
    console.error('ROI endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch ROI data',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function canAccessStation(user, station) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'station') {
    return user.station_normalized_name === station.normalized_name;
  }

  // readonly users can access all stations
  return user.role === 'readonly';
}