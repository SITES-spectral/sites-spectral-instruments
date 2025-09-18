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
    // For security, credentials are embedded at build time
    return {
      "generated_at": "2025-09-17T16:18:08.540Z",
      "jwt_secret": "d13570ae6cb3e670a8aba30acc062bd92ba5a552e2f27b6a1e9a85449e0244cb842466279e3c05531d63e9f4fb2a37d96e1d2aef33649fbc0035cc0bc3d87f84",
      "admin": {
        "username": "admin",
        "password": "IvKlLUk1JzBz6CrudDVxxSec",
        "role": "admin"
      },
      "stations": {
        "abisko": {
          "username": "abisko",
          "password": "HRdz99RNihpa0K99wtAkT4XR",
          "role": "station",
          "station_id": "ANS"
        },
        "asa": {
          "username": "asa",
          "password": "RFglByrYfkN37s9fIssBQIjx",
          "role": "station",
          "station_id": "ASA"
        },
        "bolmen": {
          "username": "bolmen",
          "password": "GhcjvVWRb2jH9RHuwDyxNtuy",
          "role": "station",
          "station_id": "BOL"
        },
        "erken": {
          "username": "erken",
          "password": "DRx6Hy2FnYrptilw6EyTu3rE",
          "role": "station",
          "station_id": "ERK"
        },
        "grimso": {
          "username": "grimso",
          "password": "HTZkIOIh7rAWLowwXRnxAvKA",
          "role": "station",
          "station_id": "GRI"
        },
        "lonnstorp": {
          "username": "lonnstorp",
          "password": "Y1VnG71Ho6zwPpCOFiALszaP",
          "role": "station",
          "station_id": "LON"
        },
        "robacksdalen": {
          "username": "robacksdalen",
          "password": "jMeu6AIt9Ep1AaBwHfmxhGqB",
          "role": "station",
          "station_id": "RBD"
        },
        "skogaryd": {
          "username": "skogaryd",
          "password": "4k5tk8EaxifV5qjrx3cKjEpA",
          "role": "station",
          "station_id": "SKC"
        },
        "svartberget": {
          "username": "svartberget",
          "password": "BvmF1ioEIw7AYXs2t1SoEI8Y",
          "role": "station",
          "station_id": "SVB"
        }
      }
    };
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