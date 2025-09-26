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

      case 'export':
        return await handleExport(method, pathSegments, request, env);

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
  if (!['GET', 'PUT'].includes(method)) {
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
    if (method === 'GET' && id) {
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

    } else if (method === 'GET') {
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
    } else if (method === 'PUT' && id) {
      // Update platform
      const platformData = await request.json();

      // First verify platform exists and get its station
      let checkQuery = `
        SELECT p.id, s.normalized_name as station_normalized_name
        FROM platforms p
        JOIN stations s ON p.station_id = s.id
        WHERE p.id = ?
      `;

      const existingPlatform = await env.DB.prepare(checkQuery).bind(id).first();

      if (!existingPlatform) {
        return new Response(JSON.stringify({ error: 'Platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check permissions based on the platform's actual station
      if (!hasPermission(user, 'write', 'platforms', existingPlatform.station_normalized_name)) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Build update query with allowed fields
      const allowedFields = [];
      const values = [];

      // Fields that station users can edit
      const stationEditableFields = [
        'display_name', 'status', 'mounting_structure', 'platform_height_m',
        'latitude', 'longitude', 'deployment_date', 'description', 'operation_programs', 'updated_at'
      ];

      // Fields that only admin can edit
      const adminOnlyFields = ['location_code'];

      // Add station editable fields
      stationEditableFields.forEach(field => {
        if (platformData[field] !== undefined) {
          allowedFields.push(`${field} = ?`);
          values.push(platformData[field]);
        }
      });

      // Add admin-only fields if user is admin
      if (user.role === 'admin') {
        adminOnlyFields.forEach(field => {
          if (platformData[field] !== undefined) {
            allowedFields.push(`${field} = ?`);
            values.push(platformData[field]);
          }
        });
      }

      if (allowedFields.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Always update updated_at if not explicitly provided
      if (!platformData.updated_at) {
        allowedFields.push('updated_at = ?');
        values.push(new Date().toISOString());
      }

      const updateQuery = `
        UPDATE platforms
        SET ${allowedFields.join(', ')}
        WHERE id = ?
      `;

      values.push(id);

      await env.DB.prepare(updateQuery).bind(...values).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Platform updated successfully',
        id: parseInt(id)
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
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
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
    if (method === 'GET' && id) {
      // Get specific instrument by ID
      let query = `
        SELECT i.id, i.normalized_name, i.display_name, i.legacy_acronym, i.platform_id,
               i.instrument_type, i.ecosystem_code, i.instrument_number, i.status, i.deployment_date,
               i.latitude, i.longitude, i.viewing_direction, i.azimuth_degrees, i.degrees_from_nadir,
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

    } else if (method === 'GET') {
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
    } else if (method === 'PUT' && id) {
      // Update instrument
      const instrumentData = await request.json();

      // First verify instrument exists and get its station
      let checkQuery = `
        SELECT i.id, s.normalized_name as station_normalized_name
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.id = ?
      `;

      const existingInstrument = await env.DB.prepare(checkQuery).bind(id).first();

      if (!existingInstrument) {
        return new Response(JSON.stringify({ error: 'Instrument not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check permissions based on the instrument's actual station
      if (!hasPermission(user, 'write', 'instruments', existingInstrument.station_normalized_name)) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Build update query with allowed fields
      const allowedFields = [];
      const values = [];

      // Fields that station users can edit
      const stationEditableFields = [
        'display_name', 'status',
        // Camera specifications
        'camera_brand', 'camera_model', 'camera_resolution', 'camera_serial_number',
        // Position & orientation
        'latitude', 'longitude', 'instrument_height_m', 'viewing_direction', 'azimuth_degrees', 'degrees_from_nadir',
        // Timeline & classification
        'instrument_type', 'ecosystem_code', 'deployment_date', 'first_measurement_year', 'last_measurement_year', 'measurement_status',
        // Notes & context
        'description', 'installation_notes', 'maintenance_notes',
        'updated_at'
      ];

      // Fields that only admin can edit
      const adminOnlyFields = ['legacy_acronym', 'normalized_name'];

      // Add station editable fields
      stationEditableFields.forEach(field => {
        if (instrumentData[field] !== undefined) {
          allowedFields.push(`${field} = ?`);
          values.push(instrumentData[field]);
        }
      });

      // Add admin-only fields if user is admin
      if (user.role === 'admin') {
        adminOnlyFields.forEach(field => {
          if (instrumentData[field] !== undefined) {
            allowedFields.push(`${field} = ?`);
            values.push(instrumentData[field]);
          }
        });
      }

      if (allowedFields.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Always update updated_at if not explicitly provided
      if (!instrumentData.updated_at) {
        allowedFields.push('updated_at = ?');
        values.push(new Date().toISOString());
      }

      const updateQuery = `
        UPDATE instruments
        SET ${allowedFields.join(', ')}
        WHERE id = ?
      `;

      values.push(id);

      await env.DB.prepare(updateQuery).bind(...values).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Instrument updated successfully',
        id: parseInt(id)
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (method === 'POST') {
      // Create new instrument
      const instrumentData = await request.json();

      if (!instrumentData.platform_id) {
        return new Response(JSON.stringify({ error: 'Platform ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify platform exists and get its station for permission check
      const platformQuery = `
        SELECT p.id, p.normalized_name as platform_normalized_name, s.normalized_name as station_normalized_name
        FROM platforms p
        JOIN stations s ON p.station_id = s.id
        WHERE p.id = ?
      `;

      const platform = await env.DB.prepare(platformQuery).bind(instrumentData.platform_id).first();

      if (!platform) {
        return new Response(JSON.stringify({ error: 'Platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check permissions for the platform's station
      if (!hasPermission(user, 'write', 'instruments', platform.station_normalized_name)) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate next normalized name for this platform
      const existingInstrumentsQuery = `
        SELECT normalized_name FROM instruments
        WHERE platform_id = ? AND normalized_name LIKE ?
        ORDER BY normalized_name DESC
      `;

      const namePattern = `${platform.platform_normalized_name}_PHE%`;
      const existingInstruments = await env.DB.prepare(existingInstrumentsQuery)
        .bind(instrumentData.platform_id, namePattern).all();

      // Find next PHE number
      let nextPheNumber = 1;
      if (existingInstruments.results && existingInstruments.results.length > 0) {
        const existingNumbers = existingInstruments.results
          .map(r => {
            const match = r.normalized_name.match(/_PHE(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(n => n > 0);

        if (existingNumbers.length > 0) {
          nextPheNumber = Math.max(...existingNumbers) + 1;
        }
      }

      const normalizedName = `${platform.platform_normalized_name}_PHE${nextPheNumber.toString().padStart(2, '0')}`;
      const displayName = instrumentData.display_name || `${platform.platform_normalized_name} Phenocam ${nextPheNumber.toString().padStart(2, '0')}`;

      // Insert new instrument with auto-generated normalized name
      const insertQuery = `
        INSERT INTO instruments (
          platform_id, normalized_name, display_name, instrument_type, ecosystem_code,
          instrument_number, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date().toISOString();
      const instrumentNumber = `PHE${nextPheNumber.toString().padStart(2, '0')}`;

      const result = await env.DB.prepare(insertQuery).bind(
        instrumentData.platform_id,
        normalizedName,
        displayName,
        'phenocam',
        instrumentData.ecosystem_code || '',
        instrumentNumber,
        'Planned',
        now,
        now
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Instrument created successfully',
        id: result.meta.last_row_id,
        normalized_name: normalizedName
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (method === 'DELETE' && id) {
      // Delete instrument
      const url = new URL(request.url);
      const backup = url.searchParams.get('backup') === 'true';

      // First verify instrument exists and get its station for permission check
      const checkQuery = `
        SELECT i.id, i.normalized_name, s.normalized_name as station_normalized_name
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.id = ?
      `;

      const existingInstrument = await env.DB.prepare(checkQuery).bind(id).first();

      if (!existingInstrument) {
        return new Response(JSON.stringify({ error: 'Instrument not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check permissions
      if (!hasPermission(user, 'write', 'instruments', existingInstrument.station_normalized_name)) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let backupData = null;

      // Generate backup if requested
      if (backup) {
        // Get complete instrument data
        const instrumentQuery = `
          SELECT i.*, p.display_name as platform_name, p.normalized_name as platform_normalized_name,
                 s.acronym as station_acronym, s.display_name as station_name
          FROM instruments i
          JOIN platforms p ON i.platform_id = p.id
          JOIN stations s ON p.station_id = s.id
          WHERE i.id = ?
        `;

        const instrumentData = await env.DB.prepare(instrumentQuery).bind(id).first();

        // Get associated ROIs
        const roisQuery = `
          SELECT * FROM instrument_rois WHERE instrument_id = ?
        `;
        const roisResult = await env.DB.prepare(roisQuery).bind(id).all();

        backupData = {
          instrument: instrumentData,
          rois: roisResult?.results || [],
          backup_metadata: {
            timestamp: new Date().toISOString(),
            backup_type: 'instrument_deletion',
            platform_name: instrumentData.platform_normalized_name,
            station: instrumentData.station_acronym,
            deleted_by: user.username
          }
        };
      }

      // Delete instrument (ROIs will be deleted by CASCADE)
      await env.DB.prepare('DELETE FROM instruments WHERE id = ?').bind(id).run();

      const response = {
        success: true,
        message: 'Instrument deleted successfully',
        id: parseInt(id)
      };

      if (backupData) {
        response.backup_data = backupData;
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Instruments error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process instrument request',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Export endpoints
async function handleExport(method, pathSegments, request, env) {
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

  const action = pathSegments[1];
  const stationId = pathSegments[2];

  try {
    switch (action) {
      case 'station':
        if (!stationId) {
          return new Response(JSON.stringify({ error: 'Station ID required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return await handleStationExport(stationId, user, env);

      default:
        return new Response(JSON.stringify({ error: 'Export type not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to export data',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStationExport(stationId, user, env) {
  try {
    // Get station data first to check permissions and get station name
    const station = await getStationData(stationId, env);
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

    // Query for complete station data with all platforms and instruments
    let query = `
      SELECT
        s.display_name as station_name,
        s.acronym as station_acronym,
        s.normalized_name as station_normalized_name,
        s.status as station_status,
        s.country as station_country,
        s.latitude as station_latitude,
        s.longitude as station_longitude,
        s.elevation_m as station_elevation,
        s.description as station_description,

        p.id as platform_id,
        p.normalized_name as platform_normalized_name,
        p.display_name as platform_name,
        p.location_code as platform_location_code,
        p.mounting_structure as platform_mounting_structure,
        p.platform_height_m as platform_height,
        p.status as platform_status,
        p.latitude as platform_latitude,
        p.longitude as platform_longitude,
        p.deployment_date as platform_deployment_date,
        p.description as platform_description,
        p.operation_programs as platform_operation_programs,

        i.id as instrument_id,
        i.normalized_name as instrument_normalized_name,
        i.display_name as instrument_name,
        i.legacy_acronym as instrument_legacy_acronym,
        i.instrument_type as instrument_type,
        i.ecosystem_code as instrument_ecosystem_code,
        i.instrument_number as instrument_number,
        i.camera_brand as instrument_camera_brand,
        i.camera_model as instrument_camera_model,
        i.camera_resolution as instrument_camera_resolution,
        i.camera_serial_number as instrument_camera_serial,
        i.first_measurement_year as instrument_first_measurement_year,
        i.last_measurement_year as instrument_last_measurement_year,
        i.measurement_status as instrument_measurement_status,
        i.status as instrument_status,
        i.latitude as instrument_latitude,
        i.longitude as instrument_longitude,
        i.instrument_height_m as instrument_height,
        i.viewing_direction as instrument_viewing_direction,
        i.azimuth_degrees as instrument_azimuth,
        i.description as instrument_description,
        i.installation_notes as instrument_installation_notes,
        i.maintenance_notes as instrument_maintenance_notes
      FROM stations s
      LEFT JOIN platforms p ON s.id = p.station_id
      LEFT JOIN instruments i ON p.id = i.platform_id
      WHERE s.normalized_name = ? OR s.acronym = ?
      ORDER BY p.display_name, i.display_name
    `;

    const result = await env.DB.prepare(query).bind(stationId, stationId).all();
    const rows = result?.results || [];

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'No data found for station' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate CSV content
    const csvContent = generateStationCSV(rows);

    // Generate filename
    const stationName = station.display_name || station.acronym || stationId;
    const filename = `${sanitizeFilename(stationName)}_SITES_SPECTRAL_INSTRUMENTS.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Station export error:', error);
    throw error;
  }
}

function generateStationCSV(rows) {
  // CSV headers
  const headers = [
    'Station Name', 'Station Acronym', 'Station Status', 'Station Country',
    'Station Latitude', 'Station Longitude', 'Station Elevation (m)', 'Station Description',
    'Platform ID', 'Platform Name', 'Platform Location Code', 'Platform Mounting Structure',
    'Platform Height (m)', 'Platform Status', 'Platform Latitude', 'Platform Longitude',
    'Platform Deployment Date', 'Platform Description', 'Platform Operation Programs',
    'Instrument ID', 'Instrument Name', 'Instrument Legacy Acronym', 'Instrument Type',
    'Instrument Ecosystem Code', 'Instrument Number', 'Camera Brand', 'Camera Model',
    'Camera Resolution', 'Camera Serial Number', 'First Measurement Year', 'Last Measurement Year',
    'Measurement Status', 'Instrument Status', 'Instrument Latitude', 'Instrument Longitude',
    'Instrument Height (m)', 'Viewing Direction', 'Azimuth (degrees)', 'Instrument Description',
    'Installation Notes', 'Maintenance Notes'
  ];

  // Convert rows to CSV format
  let csvContent = headers.join(',') + '\n';

  for (const row of rows) {
    const csvRow = [
      escapeCsvValue(row.station_name),
      escapeCsvValue(row.station_acronym),
      escapeCsvValue(row.station_status),
      escapeCsvValue(row.station_country),
      row.station_latitude || '',
      row.station_longitude || '',
      row.station_elevation || '',
      escapeCsvValue(row.station_description),
      row.platform_id || '',
      escapeCsvValue(row.platform_name),
      escapeCsvValue(row.platform_location_code),
      escapeCsvValue(row.platform_mounting_structure),
      row.platform_height || '',
      escapeCsvValue(row.platform_status),
      row.platform_latitude || '',
      row.platform_longitude || '',
      escapeCsvValue(row.platform_deployment_date),
      escapeCsvValue(row.platform_description),
      escapeCsvValue(row.platform_operation_programs),
      row.instrument_id || '',
      escapeCsvValue(row.instrument_name),
      escapeCsvValue(row.instrument_legacy_acronym),
      escapeCsvValue(row.instrument_type),
      escapeCsvValue(row.instrument_ecosystem_code),
      escapeCsvValue(row.instrument_number),
      escapeCsvValue(row.instrument_camera_brand),
      escapeCsvValue(row.instrument_camera_model),
      escapeCsvValue(row.instrument_camera_resolution),
      escapeCsvValue(row.instrument_camera_serial),
      row.instrument_first_measurement_year || '',
      row.instrument_last_measurement_year || '',
      escapeCsvValue(row.instrument_measurement_status),
      escapeCsvValue(row.instrument_status),
      row.instrument_latitude || '',
      row.instrument_longitude || '',
      row.instrument_height || '',
      escapeCsvValue(row.instrument_viewing_direction),
      row.instrument_azimuth || '',
      escapeCsvValue(row.instrument_description),
      escapeCsvValue(row.instrument_installation_notes),
      escapeCsvValue(row.instrument_maintenance_notes)
    ];

    csvContent += csvRow.join(',') + '\n';
  }

  return csvContent;
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

function sanitizeFilename(filename) {
  // Replace spaces with underscores and remove invalid characters
  return filename
    .replace(/\s+/g, '_')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/[^\w\-_.]/g, '');
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
  if (!['GET', 'POST', 'DELETE'].includes(method)) {
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
    if (method === 'GET' && id) {
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

    } else if (method === 'GET') {
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

    } else if (method === 'POST') {
      // Create new ROI
      const roiData = await request.json();

      if (!roiData.instrument_id) {
        return new Response(JSON.stringify({ error: 'Instrument ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify instrument exists and get its station for permission check
      const instrumentQuery = `
        SELECT i.id, i.normalized_name as instrument_normalized_name,
               s.normalized_name as station_normalized_name
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.id = ?
      `;

      const instrument = await env.DB.prepare(instrumentQuery).bind(roiData.instrument_id).first();

      if (!instrument) {
        return new Response(JSON.stringify({ error: 'Instrument not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check permissions for the instrument's station
      if (!hasPermission(user, 'write', 'rois', instrument.station_normalized_name)) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate next ROI name for this instrument
      const existingROIsQuery = `
        SELECT roi_name FROM instrument_rois
        WHERE instrument_id = ? AND roi_name LIKE 'ROI_%'
        ORDER BY roi_name DESC
      `;

      const existingROIs = await env.DB.prepare(existingROIsQuery)
        .bind(roiData.instrument_id).all();

      // Find next ROI number
      let nextRoiNumber = 0;
      if (existingROIs.results && existingROIs.results.length > 0) {
        const existingNumbers = existingROIs.results
          .map(r => {
            const match = r.roi_name.match(/^ROI_(\d+)$/);
            return match ? parseInt(match[1]) : -1;
          })
          .filter(n => n >= 0);

        if (existingNumbers.length > 0) {
          nextRoiNumber = Math.max(...existingNumbers) + 1;
        }
      }

      const roiName = `ROI_${nextRoiNumber.toString().padStart(2, '0')}`;

      // Insert new ROI with auto-generated name and default values
      const insertQuery = `
        INSERT INTO instrument_rois (
          instrument_id, roi_name, description, alpha, auto_generated,
          color_r, color_g, color_b, thickness, points_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date().toISOString();

      const result = await env.DB.prepare(insertQuery).bind(
        roiData.instrument_id,
        roiName,
        roiData.description || '',
        roiData.alpha || 0.0,
        false, // auto_generated
        roiData.color_r || 255,
        roiData.color_g || 255,
        roiData.color_b || 255,
        roiData.thickness || 7,
        roiData.points_json || '[]',
        now,
        now
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'ROI created successfully',
        id: result.meta.last_row_id,
        roi_name: roiName
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (method === 'DELETE' && id) {
      // Delete ROI
      const url = new URL(request.url);
      const backup = url.searchParams.get('backup') === 'true';

      // First verify ROI exists and get its station for permission check
      const checkQuery = `
        SELECT r.id, r.roi_name, s.normalized_name as station_normalized_name,
               i.normalized_name as instrument_normalized_name
        FROM instrument_rois r
        JOIN instruments i ON r.instrument_id = i.id
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE r.id = ?
      `;

      const existingROI = await env.DB.prepare(checkQuery).bind(id).first();

      if (!existingROI) {
        return new Response(JSON.stringify({ error: 'ROI not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check permissions
      if (!hasPermission(user, 'write', 'rois', existingROI.station_normalized_name)) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let backupData = null;

      // Generate backup if requested
      if (backup) {
        // Get complete ROI data
        const roiQuery = `
          SELECT r.*, i.normalized_name as instrument_normalized_name,
                 p.normalized_name as platform_normalized_name,
                 s.acronym as station_acronym, s.display_name as station_name
          FROM instrument_rois r
          JOIN instruments i ON r.instrument_id = i.id
          JOIN platforms p ON i.platform_id = p.id
          JOIN stations s ON p.station_id = s.id
          WHERE r.id = ?
        `;

        const roiData = await env.DB.prepare(roiQuery).bind(id).first();

        backupData = {
          roi: roiData,
          instrument_context: {
            normalized_name: roiData.instrument_normalized_name,
            platform_name: roiData.platform_normalized_name,
            station: roiData.station_acronym
          },
          backup_metadata: {
            timestamp: new Date().toISOString(),
            backup_type: 'roi_deletion',
            deleted_by: user.username
          }
        };
      }

      // Delete ROI
      await env.DB.prepare('DELETE FROM instrument_rois WHERE id = ?').bind(id).run();

      const response = {
        success: true,
        message: 'ROI deleted successfully',
        id: parseInt(id)
      };

      if (backupData) {
        response.backup_data = backupData;
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('ROI endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process ROI request',
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

// Permission checking function for CRUD operations
function hasPermission(user, operation, resource, stationNormalizedName) {
  // Admin users have all permissions
  if (user.role === 'admin') {
    return true;
  }

  // Read-only users only have read permissions
  if (user.role === 'readonly') {
    return operation === 'read';
  }

  // Station users have write permissions for their own station's resources
  if (user.role === 'station') {
    if (operation === 'read') {
      return true; // Station users can read data
    }

    if (operation === 'write') {
      // Check if resource belongs to user's station
      return user.station_normalized_name === stationNormalizedName;
    }
  }

  return false;
}