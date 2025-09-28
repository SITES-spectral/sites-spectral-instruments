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

  // Log API request for audit trail
  await logApiRequest(request, env, ctx);

  try {
    switch (resource) {
      case 'auth':
        return await handleAuth(method, pathSegments, request, env);

      case 'admin':
        return await handleAdmin(method, pathSegments, request, env);

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

    } else if (method === 'GET') {
      // List stations (filtered by user permissions)
      const stations = await getStationsData(user, env);
      return new Response(JSON.stringify({ stations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (method === 'POST') {
      // Create new station (admin only)
      if (user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const stationData = await request.json();

      // Required fields validation
      if (!stationData.display_name || !stationData.acronym) {
        return new Response(JSON.stringify({ error: 'Display name and acronym are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate normalized name from display name
      const normalizedName = stationData.normalized_name ||
        stationData.display_name.toLowerCase().replace(/\s+/g, '_').replace(/[åä]/g, 'a').replace(/[ö]/g, 'o');

      // Check for duplicate normalized names and acronyms
      const duplicateCheck = await env.DB.prepare(`
        SELECT normalized_name, acronym FROM stations
        WHERE normalized_name = ? OR acronym = ?
      `).bind(normalizedName, stationData.acronym).all();

      if (duplicateCheck.results && duplicateCheck.results.length > 0) {
        const conflicts = duplicateCheck.results.map(r => ({
          field: r.normalized_name === normalizedName ? 'normalized_name' : 'acronym',
          value: r.normalized_name === normalizedName ? r.normalized_name : r.acronym
        }));

        return new Response(JSON.stringify({
          error: 'Duplicate values detected',
          conflicts: conflicts,
          suggestions: {
            normalized_name: generateAlternativeNormalizedName(normalizedName, duplicateCheck.results.map(r => r.normalized_name))
          }
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Insert new station
      const insertQuery = `
        INSERT INTO stations (
          normalized_name, display_name, acronym, status, country,
          latitude, longitude, elevation_m, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date().toISOString();

      const result = await env.DB.prepare(insertQuery).bind(
        normalizedName,
        stationData.display_name,
        stationData.acronym.toUpperCase(),
        stationData.status || 'Active',
        stationData.country || 'Sweden',
        stationData.latitude || null,
        stationData.longitude || null,
        stationData.elevation_m || null,
        stationData.description || '',
        now,
        now
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Station created successfully',
        id: result.meta.last_row_id,
        normalized_name: normalizedName
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (method === 'PUT' && id) {
      // Update station (admin only)
      if (user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const stationData = await request.json();

      // First verify station exists
      const existingStation = await getStationData(id, env);
      if (!existingStation) {
        return new Response(JSON.stringify({ error: 'Station not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check for duplicate normalized names and acronyms if they're being changed
      if ((stationData.normalized_name && stationData.normalized_name !== existingStation.normalized_name) ||
          (stationData.acronym && stationData.acronym !== existingStation.acronym)) {

        const duplicateCheck = await env.DB.prepare(`
          SELECT normalized_name, acronym FROM stations
          WHERE (normalized_name = ? OR acronym = ?) AND id != ?
        `).bind(
          stationData.normalized_name || existingStation.normalized_name,
          stationData.acronym || existingStation.acronym,
          existingStation.id
        ).all();

        if (duplicateCheck.results && duplicateCheck.results.length > 0) {
          const conflicts = duplicateCheck.results.map(r => ({
            field: r.normalized_name === (stationData.normalized_name || existingStation.normalized_name) ? 'normalized_name' : 'acronym',
            value: r.normalized_name === (stationData.normalized_name || existingStation.normalized_name) ? r.normalized_name : r.acronym
          }));

          return new Response(JSON.stringify({
            error: 'Duplicate values detected',
            conflicts: conflicts
          }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Build update query with provided fields
      const allowedFields = [];
      const values = [];
      const editableFields = [
        'normalized_name', 'display_name', 'acronym', 'status', 'country',
        'latitude', 'longitude', 'elevation_m', 'description'
      ];

      editableFields.forEach(field => {
        if (stationData[field] !== undefined) {
          allowedFields.push(`${field} = ?`);
          values.push(field === 'acronym' ? stationData[field].toUpperCase() : stationData[field]);
        }
      });

      if (allowedFields.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Always update updated_at
      allowedFields.push('updated_at = ?');
      values.push(new Date().toISOString());

      const updateQuery = `
        UPDATE stations
        SET ${allowedFields.join(', ')}
        WHERE id = ?
      `;

      values.push(existingStation.id);

      await env.DB.prepare(updateQuery).bind(...values).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Station updated successfully',
        id: existingStation.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (method === 'DELETE' && id) {
      // Delete station (admin only)
      if (user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(request.url);
      const backup = url.searchParams.get('backup') === 'true';

      // First verify station exists
      const existingStation = await getStationData(id, env);
      if (!existingStation) {
        return new Response(JSON.stringify({ error: 'Station not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check for dependent data
      const dependencyCheck = await env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM platforms WHERE station_id = ?) as platform_count,
          (SELECT COUNT(*) FROM instruments i JOIN platforms p ON i.platform_id = p.id WHERE p.station_id = ?) as instrument_count,
          (SELECT COUNT(*) FROM instrument_rois r JOIN instruments i ON r.instrument_id = i.id JOIN platforms p ON i.platform_id = p.id WHERE p.station_id = ?) as roi_count
      `).bind(existingStation.id, existingStation.id, existingStation.id).first();

      const hasDependendencies = dependencyCheck.platform_count > 0 || dependencyCheck.instrument_count > 0 || dependencyCheck.roi_count > 0;

      if (hasDependendencies && !url.searchParams.get('force_cascade')) {
        return new Response(JSON.stringify({
          error: 'Station has dependent data',
          dependencies: {
            platforms: dependencyCheck.platform_count,
            instruments: dependencyCheck.instrument_count,
            rois: dependencyCheck.roi_count
          },
          message: 'Use force_cascade=true to delete station and all dependent data'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let backupData = null;

      // Generate backup if requested
      if (backup) {
        // Get complete station data with all dependents
        const stationQuery = `SELECT * FROM stations WHERE id = ?`;
        const platformsQuery = `SELECT * FROM platforms WHERE station_id = ?`;
        const instrumentsQuery = `
          SELECT i.* FROM instruments i
          JOIN platforms p ON i.platform_id = p.id
          WHERE p.station_id = ?
        `;
        const roisQuery = `
          SELECT r.* FROM instrument_rois r
          JOIN instruments i ON r.instrument_id = i.id
          JOIN platforms p ON i.platform_id = p.id
          WHERE p.station_id = ?
        `;

        const [station, platforms, instruments, rois] = await Promise.all([
          env.DB.prepare(stationQuery).bind(existingStation.id).first(),
          env.DB.prepare(platformsQuery).bind(existingStation.id).all(),
          env.DB.prepare(instrumentsQuery).bind(existingStation.id).all(),
          env.DB.prepare(roisQuery).bind(existingStation.id).all()
        ]);

        backupData = {
          station: station,
          platforms: platforms?.results || [],
          instruments: instruments?.results || [],
          rois: rois?.results || [],
          backup_metadata: {
            timestamp: new Date().toISOString(),
            backup_type: 'station_deletion',
            deleted_by: user.username,
            dependency_counts: dependencyCheck
          }
        };
      }

      // Delete station (will cascade to platforms, instruments, and ROIs due to foreign key constraints)
      await env.DB.prepare('DELETE FROM stations WHERE id = ?').bind(existingStation.id).run();

      const response = {
        success: true,
        message: 'Station deleted successfully',
        id: existingStation.id,
        dependencies_deleted: dependencyCheck
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
    console.error('Stations error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch station data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Platform endpoints
async function handlePlatforms(method, id, request, env) {
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

    } else if (method === 'POST') {
      // Create new platform (admin only)
      if (user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const platformData = await request.json();

      // Required fields validation
      if (!platformData.station_id || !platformData.display_name || !platformData.location_code) {
        return new Response(JSON.stringify({ error: 'Station ID, display name, and location code are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Verify station exists
      const station = await env.DB.prepare('SELECT id, acronym, normalized_name FROM stations WHERE id = ?')
        .bind(platformData.station_id).first();

      if (!station) {
        return new Response(JSON.stringify({ error: 'Station not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate normalized name based on station acronym, ecosystem, and location code
      const ecosystemCode = platformData.ecosystem_code || 'GEN'; // Default to GEN for general
      const normalizedName = platformData.normalized_name ||
        `${station.acronym}_${ecosystemCode}_${platformData.location_code}`;

      // Check for duplicate normalized names within the same station
      const duplicateCheck = await env.DB.prepare(`
        SELECT normalized_name, location_code FROM platforms
        WHERE station_id = ? AND (normalized_name = ? OR location_code = ?)
      `).bind(platformData.station_id, normalizedName, platformData.location_code).all();

      if (duplicateCheck.results && duplicateCheck.results.length > 0) {
        const conflicts = duplicateCheck.results.map(r => ({
          field: r.normalized_name === normalizedName ? 'normalized_name' : 'location_code',
          value: r.normalized_name === normalizedName ? r.normalized_name : r.location_code
        }));

        return new Response(JSON.stringify({
          error: 'Duplicate values detected',
          conflicts: conflicts,
          suggestions: {
            location_code: generateNextLocationCode(platformData.location_code, duplicateCheck.results.map(r => r.location_code)),
            normalized_name: generateAlternativeNormalizedName(normalizedName, duplicateCheck.results.map(r => r.normalized_name))
          }
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Insert new platform
      const insertQuery = `
        INSERT INTO platforms (
          station_id, normalized_name, display_name, location_code,
          mounting_structure, platform_height_m, status, latitude, longitude,
          deployment_date, description, operation_programs, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date().toISOString();

      const result = await env.DB.prepare(insertQuery).bind(
        platformData.station_id,
        normalizedName,
        platformData.display_name,
        platformData.location_code,
        platformData.mounting_structure || null,
        platformData.platform_height_m || null,
        platformData.status || 'Active',
        platformData.latitude || null,
        platformData.longitude || null,
        platformData.deployment_date || null,
        platformData.description || '',
        platformData.operation_programs || null,
        now,
        now
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Platform created successfully',
        id: result.meta.last_row_id,
        normalized_name: normalizedName
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (method === 'DELETE' && id) {
      // Delete platform (admin only)
      if (user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(request.url);
      const backup = url.searchParams.get('backup') === 'true';

      // First verify platform exists and get its station info
      const existingPlatform = await env.DB.prepare(`
        SELECT p.id, p.normalized_name, p.display_name,
               s.acronym as station_acronym, s.display_name as station_name
        FROM platforms p
        JOIN stations s ON p.station_id = s.id
        WHERE p.id = ?
      `).bind(id).first();

      if (!existingPlatform) {
        return new Response(JSON.stringify({ error: 'Platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check for dependent data
      const dependencyCheck = await env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM instruments WHERE platform_id = ?) as instrument_count,
          (SELECT COUNT(*) FROM instrument_rois r JOIN instruments i ON r.instrument_id = i.id WHERE i.platform_id = ?) as roi_count
      `).bind(id, id).first();

      const hasDependendencies = dependencyCheck.instrument_count > 0 || dependencyCheck.roi_count > 0;

      if (hasDependendencies && !url.searchParams.get('force_cascade')) {
        return new Response(JSON.stringify({
          error: 'Platform has dependent data',
          dependencies: {
            instruments: dependencyCheck.instrument_count,
            rois: dependencyCheck.roi_count
          },
          message: 'Use force_cascade=true to delete platform and all dependent data'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let backupData = null;

      // Generate backup if requested
      if (backup) {
        // Get complete platform data with all dependents
        const platformQuery = `
          SELECT p.*, s.acronym as station_acronym, s.display_name as station_name
          FROM platforms p
          JOIN stations s ON p.station_id = s.id
          WHERE p.id = ?
        `;
        const instrumentsQuery = `SELECT * FROM instruments WHERE platform_id = ?`;
        const roisQuery = `
          SELECT r.* FROM instrument_rois r
          JOIN instruments i ON r.instrument_id = i.id
          WHERE i.platform_id = ?
        `;

        const [platform, instruments, rois] = await Promise.all([
          env.DB.prepare(platformQuery).bind(id).first(),
          env.DB.prepare(instrumentsQuery).bind(id).all(),
          env.DB.prepare(roisQuery).bind(id).all()
        ]);

        backupData = {
          platform: platform,
          instruments: instruments?.results || [],
          rois: rois?.results || [],
          backup_metadata: {
            timestamp: new Date().toISOString(),
            backup_type: 'platform_deletion',
            station: existingPlatform.station_acronym,
            deleted_by: user.username,
            dependency_counts: dependencyCheck
          }
        };
      }

      // Delete platform (will cascade to instruments and ROIs due to foreign key constraints)
      await env.DB.prepare('DELETE FROM platforms WHERE id = ?').bind(id).run();

      const response = {
        success: true,
        message: 'Platform deleted successfully',
        id: parseInt(id),
        dependencies_deleted: dependencyCheck
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
      result = await env.DB.prepare(query).all();
    } else if (user.role === 'station' && user.station_normalized_name) {
      // Station users can only see their own station
      query += ' WHERE s.normalized_name = ? GROUP BY s.id ORDER BY s.display_name';
      result = await env.DB.prepare(query).bind(user.station_normalized_name).all();
    } else {
      // Readonly users can see all stations
      query += ' GROUP BY s.id ORDER BY s.display_name';
      result = await env.DB.prepare(query).all();
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
    // Check both normalized name and acronym for station access
    return user.station_normalized_name === station.normalized_name ||
           user.station_acronym === station.acronym ||
           user.station_acronym === station.normalized_name;
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

// Helper function to generate alternative normalized names when conflicts occur
function generateAlternativeNormalizedName(baseName, existingNames) {
  let counter = 1;
  let candidateName = baseName;

  while (existingNames.includes(candidateName)) {
    candidateName = `${baseName}_${counter}`;
    counter++;
  }

  return candidateName;
}

// Helper function to generate next available location code
function generateNextLocationCode(baseCode, existingCodes) {
  // Extract base pattern (letters) and number
  const match = baseCode.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return `${baseCode}02`; // Default to adding 02 if pattern not recognized
  }

  const [, prefix, number] = match;
  let counter = parseInt(number) + 1;

  let candidateCode = `${prefix}${counter.toString().padStart(2, '0')}`;

  while (existingCodes.includes(candidateCode)) {
    counter++;
    candidateCode = `${prefix}${counter.toString().padStart(2, '0')}`;
  }

  return candidateCode;
}

// ===================================================================
// ENHANCED ADMIN API ENDPOINTS - SITES SPECTRAL v5.0.0
// ===================================================================

// Enhanced Admin CRUD Operations Handler
async function handleAdmin(method, pathSegments, request, env) {
  const resourceType = pathSegments[1]; // stations, platforms, instruments, etc.
  const resourceId = pathSegments[2];

  // Apply admin security middleware
  const adminCheck = await adminSecurityMiddleware(request, env);
  if (adminCheck.error) {
    return adminCheck.response;
  }

  const user = adminCheck.user;

  // Rate limiting for admin operations
  const rateLimitCheck = await checkAdminRateLimit(user, method, env);
  if (rateLimitCheck.exceeded) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many admin operations. Please wait before retrying.',
      retry_after: rateLimitCheck.retry_after
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    switch (resourceType) {
      case 'stations':
        return await handleAdminStations(method, resourceId, request, env, user);

      case 'platforms':
        return await handleAdminPlatforms(method, resourceId, request, env, user);

      case 'instruments':
        return await handleAdminInstruments(method, resourceId, request, env, user);

      case 'rois':
        return await handleAdminROIs(method, resourceId, request, env, user);

      case 'audit':
        return await handleAdminAudit(method, resourceId, request, env, user);

      default:
        return new Response(JSON.stringify({ error: 'Admin resource not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Admin API Error:', error);
    await logAdminAction(user, 'ERROR', `Admin operation failed: ${error.message}`, env);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Admin Security Middleware
async function adminSecurityMiddleware(request, env) {
  const user = await getUserFromRequest(request, env);

  if (!user) {
    return {
      error: true,
      response: new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  if (user.role !== 'admin') {
    await logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', user, request, env);
    return {
      error: true,
      response: new Response(JSON.stringify({
        error: 'Admin privileges required',
        message: 'Access denied: insufficient privileges for admin operations'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return { error: false, user };
}

// Enhanced Admin Stations Handler
async function handleAdminStations(method, id, request, env, user) {
  const startTime = Date.now();

  try {
    let result;

    switch (method) {
      case 'POST':
        result = await createStationAdmin(request, env, user);
        break;

      case 'PUT':
        if (!id) {
          return new Response(JSON.stringify({ error: 'Station ID required for update' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        result = await updateStationAdmin(id, request, env, user);
        break;

      case 'DELETE':
        if (!id) {
          return new Response(JSON.stringify({ error: 'Station ID required for deletion' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        result = await deleteStationAdmin(id, request, env, user);
        break;

      case 'GET':
        result = await getStationsAdmin(id, request, env, user);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Log successful admin operation
    const duration = Date.now() - startTime;
    await logAdminAction(user, method, `Station operation completed in ${duration}ms`, env, {
      resource_type: 'station',
      resource_id: id,
      duration_ms: duration
    });

    return result;
  } catch (error) {
    console.error('Admin stations error:', error);
    await logAdminAction(user, 'ERROR', `Station operation failed: ${error.message}`, env);
    throw error;
  }
}

// Enhanced Admin Platforms Handler
async function handleAdminPlatforms(method, id, request, env, user) {
  const startTime = Date.now();

  try {
    let result;

    switch (method) {
      case 'POST':
        result = await createPlatformAdmin(request, env, user);
        break;

      case 'PUT':
        if (!id) {
          return new Response(JSON.stringify({ error: 'Platform ID required for update' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        result = await updatePlatformAdmin(id, request, env, user);
        break;

      case 'DELETE':
        if (!id) {
          return new Response(JSON.stringify({ error: 'Platform ID required for deletion' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        result = await deletePlatformAdmin(id, request, env, user);
        break;

      case 'GET':
        result = await getPlatformsAdmin(id, request, env, user);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Log successful admin operation
    const duration = Date.now() - startTime;
    await logAdminAction(user, method, `Platform operation completed in ${duration}ms`, env, {
      resource_type: 'platform',
      resource_id: id,
      duration_ms: duration
    });

    return result;
  } catch (error) {
    console.error('Admin platforms error:', error);
    await logAdminAction(user, 'ERROR', `Platform operation failed: ${error.message}`, env);
    throw error;
  }
}

// Unified Identifier Resolution System
async function resolveStationIdentifier(identifier, env) {
  if (!identifier) return null;

  // Try numeric ID first (fastest)
  if (/^\d+$/.test(identifier)) {
    const query = `
      SELECT id, display_name, acronym, normalized_name, latitude, longitude,
             elevation_m, status, country, description, created_at, updated_at
      FROM stations WHERE id = ?
    `;
    const result = await env.DB.prepare(query).bind(parseInt(identifier)).first();
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
  return await env.DB.prepare(query).bind(identifier, identifier).first();
}

async function resolvePlatformIdentifier(identifier, env) {
  if (!identifier) return null;

  // Try numeric ID first
  if (/^\d+$/.test(identifier)) {
    const query = `
      SELECT p.*, s.acronym as station_acronym, s.normalized_name as station_normalized_name
      FROM platforms p
      JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `;
    const result = await env.DB.prepare(query).bind(parseInt(identifier)).first();
    if (result) return result;
  }

  // Try normalized name
  const query = `
    SELECT p.*, s.acronym as station_acronym, s.normalized_name as station_normalized_name
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    WHERE p.normalized_name = ?
    LIMIT 1
  `;
  return await env.DB.prepare(query).bind(identifier).first();
}

async function resolveInstrumentIdentifier(identifier, env) {
  if (!identifier) return null;

  // Try numeric ID first
  if (/^\d+$/.test(identifier)) {
    const query = `
      SELECT i.*, p.normalized_name as platform_normalized_name,
             s.acronym as station_acronym, s.normalized_name as station_normalized_name
      FROM instruments i
      JOIN platforms p ON i.platform_id = p.id
      JOIN stations s ON p.station_id = s.id
      WHERE i.id = ?
    `;
    const result = await env.DB.prepare(query).bind(parseInt(identifier)).first();
    if (result) return result;
  }

  // Try normalized name and legacy acronym
  const query = `
    SELECT i.*, p.normalized_name as platform_normalized_name,
           s.acronym as station_acronym, s.normalized_name as station_normalized_name
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    WHERE i.normalized_name = ? OR i.legacy_acronym = ?
    LIMIT 1
  `;
  return await env.DB.prepare(query).bind(identifier, identifier).first();
}

// Admin CRUD Implementation Functions
async function createStationAdmin(request, env, user) {
  const stationData = await request.json();

  // Enhanced validation
  const validation = validateStationData(stationData);
  if (!validation.valid) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: validation.errors
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Generate normalized name with Swedish character handling
  const normalizedName = generateNormalizedName(stationData.display_name);

  // Check for conflicts using unified resolution
  const existingStation = await resolveStationIdentifier(normalizedName, env);
  const existingAcronym = await resolveStationIdentifier(stationData.acronym, env);

  if (existingStation || existingAcronym) {
    const conflicts = [];
    if (existingStation) conflicts.push({ field: 'normalized_name', value: normalizedName });
    if (existingAcronym) conflicts.push({ field: 'acronym', value: stationData.acronym });

    return new Response(JSON.stringify({
      error: 'Duplicate values detected',
      conflicts: conflicts,
      suggestions: {
        normalized_name: await generateAlternativeNormalizedNameAdvanced(normalizedName, env),
        acronym: await generateAlternativeAcronym(stationData.acronym, env)
      }
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Insert with comprehensive data
  const insertQuery = `
    INSERT INTO stations (
      normalized_name, display_name, acronym, status, country,
      latitude, longitude, elevation_m, description,
      created_at, updated_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();
  const result = await env.DB.prepare(insertQuery).bind(
    normalizedName,
    stationData.display_name,
    stationData.acronym.toUpperCase(),
    stationData.status || 'Active',
    stationData.country || 'Sweden',
    stationData.latitude || null,
    stationData.longitude || null,
    stationData.elevation_m || null,
    stationData.description || '',
    now,
    now,
    user.username
  ).run();

  // Log admin action
  await logAdminAction(user, 'CREATE', `Station created: ${stationData.display_name}`, env, {
    station_id: result.meta.last_row_id,
    normalized_name: normalizedName
  });

  return new Response(JSON.stringify({
    success: true,
    message: 'Station created successfully',
    id: result.meta.last_row_id,
    normalized_name: normalizedName,
    created_at: now
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updateStationAdmin(id, request, env, user) {
  const stationData = await request.json();

  // Resolve station using unified system
  const existingStation = await resolveStationIdentifier(id, env);
  if (!existingStation) {
    return new Response(JSON.stringify({ error: 'Station not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Enhanced validation for updates
  const validation = validateStationUpdateData(stationData);
  if (!validation.valid) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: validation.errors
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build dynamic update query
  const { query, values } = buildStationUpdateQuery(existingStation.id, stationData, user);

  await env.DB.prepare(query).bind(...values).run();

  // Log admin action
  await logAdminAction(user, 'UPDATE', `Station updated: ${existingStation.display_name}`, env, {
    station_id: existingStation.id,
    changes: Object.keys(stationData)
  });

  return new Response(JSON.stringify({
    success: true,
    message: 'Station updated successfully',
    id: existingStation.id,
    updated_at: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function deleteStationAdmin(id, request, env, user) {
  const url = new URL(request.url);
  const forceCascade = url.searchParams.get('force_cascade') === 'true';
  const backup = url.searchParams.get('backup') === 'true';

  // Resolve station using unified system
  const existingStation = await resolveStationIdentifier(id, env);
  if (!existingStation) {
    return new Response(JSON.stringify({ error: 'Station not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Enhanced dependency analysis
  const dependencies = await analyzeDependencies('station', existingStation.id, env);

  if (dependencies.hasDependendencies && !forceCascade) {
    return new Response(JSON.stringify({
      error: 'Station has dependent data',
      dependencies: dependencies.summary,
      cascade_preview: dependencies.cascade_preview,
      message: 'Use force_cascade=true to delete station and all dependent data'
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let backupData = null;
  if (backup) {
    backupData = await generateComprehensiveBackup('station', existingStation.id, env, user);
  }

  // Delete with transaction safety
  await env.DB.prepare('DELETE FROM stations WHERE id = ?').bind(existingStation.id).run();

  // Log admin action
  await logAdminAction(user, 'DELETE', `Station deleted: ${existingStation.display_name}`, env, {
    station_id: existingStation.id,
    cascade: forceCascade,
    backup_generated: backup,
    dependencies_deleted: dependencies.summary
  });

  const response = {
    success: true,
    message: 'Station deleted successfully',
    id: existingStation.id,
    dependencies_deleted: dependencies.summary
  };

  if (backupData) {
    response.backup_data = backupData;
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Enhanced Platform Operations
async function createPlatformAdmin(request, env, user) {
  const platformData = await request.json();

  // Enhanced validation
  const validation = validatePlatformData(platformData);
  if (!validation.valid) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: validation.errors
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Resolve station using unified system
  const station = await resolveStationIdentifier(platformData.station_id, env);
  if (!station) {
    return new Response(JSON.stringify({ error: 'Station not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Generate smart normalized name
  const ecosystemCode = platformData.ecosystem_code || 'GEN';
  const normalizedName = `${station.acronym}_${ecosystemCode}_${platformData.location_code}`;

  // Check conflicts
  const conflicts = await checkPlatformConflicts(platformData.station_id, normalizedName, platformData.location_code, env);
  if (conflicts.length > 0) {
    return new Response(JSON.stringify({
      error: 'Duplicate values detected',
      conflicts: conflicts,
      suggestions: await generatePlatformAlternatives(normalizedName, platformData.location_code, platformData.station_id, env)
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Insert platform
  const insertQuery = `
    INSERT INTO platforms (
      station_id, normalized_name, display_name, location_code,
      ecosystem_code, mounting_structure, platform_height_m, status,
      latitude, longitude, deployment_date, description, operation_programs,
      created_at, updated_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const now = new Date().toISOString();
  const result = await env.DB.prepare(insertQuery).bind(
    station.id,
    normalizedName,
    platformData.display_name,
    platformData.location_code,
    ecosystemCode,
    platformData.mounting_structure || null,
    platformData.platform_height_m || null,
    platformData.status || 'Active',
    platformData.latitude || null,
    platformData.longitude || null,
    platformData.deployment_date || null,
    platformData.description || '',
    platformData.operation_programs || null,
    now,
    now,
    user.username
  ).run();

  // Log admin action
  await logAdminAction(user, 'CREATE', `Platform created: ${platformData.display_name}`, env, {
    platform_id: result.meta.last_row_id,
    station_id: station.id,
    normalized_name: normalizedName
  });

  return new Response(JSON.stringify({
    success: true,
    message: 'Platform created successfully',
    id: result.meta.last_row_id,
    normalized_name: normalizedName,
    created_at: now
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ===================================================================
// AUDIT LOGGING AND SECURITY FUNCTIONS
// ===================================================================

// Comprehensive API Request Logging
async function logApiRequest(request, env, ctx) {
  try {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';

    // Extract basic auth info without exposing tokens
    const authHeader = request.headers.get('Authorization');
    let authType = 'none';
    if (authHeader) {
      authType = authHeader.startsWith('Bearer ') ? 'bearer' : 'other';
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: url.pathname,
      query_params: Object.fromEntries(url.searchParams),
      client_ip: clientIP,
      user_agent: userAgent,
      auth_type: authType,
      country: request.cf?.country || 'unknown',
      request_id: crypto.randomUUID()
    };

    // Store in audit log (implement based on your storage preference)
    // For now, just console.log for development
    console.log('API_REQUEST:', JSON.stringify(logEntry));

  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

// Admin Action Logging
async function logAdminAction(user, action, description, env, metadata = {}) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      admin_user: user.username,
      action: action,
      description: description,
      metadata: metadata,
      session_id: user.session_id || null
    };

    // Insert into audit log table (create if needed)
    const query = `
      INSERT INTO admin_audit_log (
        timestamp, admin_user, action, description, metadata
      ) VALUES (?, ?, ?, ?, ?)
    `;

    await env.DB.prepare(query).bind(
      logEntry.timestamp,
      logEntry.admin_user,
      logEntry.action,
      logEntry.description,
      JSON.stringify(logEntry.metadata)
    ).run();

  } catch (error) {
    // Fallback to console if database logging fails
    console.error('Failed to log admin action:', error);
    console.log('ADMIN_ACTION:', JSON.stringify({
      user: user.username,
      action,
      description,
      metadata
    }));
  }
}

// Security Event Logging
async function logSecurityEvent(eventType, user, request, env) {
  try {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    const securityEvent = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      user: user ? user.username : 'anonymous',
      user_role: user ? user.role : null,
      client_ip: clientIP,
      path: url.pathname,
      user_agent: request.headers.get('User-Agent') || '',
      country: request.cf?.country || 'unknown'
    };

    console.log('SECURITY_EVENT:', JSON.stringify(securityEvent));

    // In production, also send to security monitoring service

  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Rate Limiting for Admin Operations
async function checkAdminRateLimit(user, method, env) {
  try {
    const windowMinutes = 5;
    const maxOperations = method === 'DELETE' ? 10 : 50; // Stricter limits for deletions

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Count recent operations by this admin user
    const query = `
      SELECT COUNT(*) as operation_count
      FROM admin_audit_log
      WHERE admin_user = ? AND timestamp > ? AND action = ?
    `;

    const result = await env.DB.prepare(query).bind(user.username, windowStart, method).first();
    const currentCount = result?.operation_count || 0;

    if (currentCount >= maxOperations) {
      return {
        exceeded: true,
        retry_after: windowMinutes * 60,
        current_count: currentCount,
        limit: maxOperations
      };
    }

    return { exceeded: false };

  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow operation if rate limit check fails
    return { exceeded: false };
  }
}

// ===================================================================
// VALIDATION AND UTILITY FUNCTIONS
// ===================================================================

// Enhanced Station Data Validation
function validateStationData(data) {
  const errors = [];

  if (!data.display_name || data.display_name.trim().length === 0) {
    errors.push('Display name is required');
  }

  if (!data.acronym || data.acronym.trim().length === 0) {
    errors.push('Acronym is required');
  } else if (!/^[A-Z0-9]{2,10}$/.test(data.acronym)) {
    errors.push('Acronym must be 2-10 uppercase letters/numbers');
  }

  if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (data.elevation_m && (data.elevation_m < -500 || data.elevation_m > 10000)) {
    errors.push('Elevation must be between -500 and 10000 meters');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function validateStationUpdateData(data) {
  const errors = [];

  if (data.display_name !== undefined && data.display_name.trim().length === 0) {
    errors.push('Display name cannot be empty');
  }

  if (data.acronym !== undefined) {
    if (data.acronym.trim().length === 0) {
      errors.push('Acronym cannot be empty');
    } else if (!/^[A-Z0-9]{2,10}$/.test(data.acronym)) {
      errors.push('Acronym must be 2-10 uppercase letters/numbers');
    }
  }

  if (data.latitude !== undefined && (data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude !== undefined && (data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function validatePlatformData(data) {
  const errors = [];

  if (!data.station_id) {
    errors.push('Station ID is required');
  }

  if (!data.display_name || data.display_name.trim().length === 0) {
    errors.push('Display name is required');
  }

  if (!data.location_code || !/^[A-Z]{2,3}\d{2}$/.test(data.location_code)) {
    errors.push('Location code must follow format like HEA01, GRA02, etc.');
  }

  const validEcosystems = ['HEA', 'AGR', 'MIR', 'LAK', 'WET', 'GRA', 'FOR', 'ALP', 'CON', 'DEC', 'MAR', 'PEA', 'GEN'];
  if (data.ecosystem_code && !validEcosystems.includes(data.ecosystem_code)) {
    errors.push(`Ecosystem code must be one of: ${validEcosystems.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Enhanced Normalized Name Generation
function generateNormalizedName(displayName) {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[åä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Advanced Alternative Name Generation
async function generateAlternativeNormalizedNameAdvanced(baseName, env) {
  const query = `
    SELECT normalized_name FROM stations
    WHERE normalized_name LIKE ?
    ORDER BY normalized_name
  `;

  const existing = await env.DB.prepare(query).bind(`${baseName}%`).all();
  const existingNames = existing.results?.map(r => r.normalized_name) || [];

  let counter = 1;
  let candidateName = baseName;

  while (existingNames.includes(candidateName)) {
    candidateName = `${baseName}_${counter.toString().padStart(2, '0')}`;
    counter++;
  }

  return candidateName;
}

async function generateAlternativeAcronym(baseAcronym, env) {
  const query = `
    SELECT acronym FROM stations
    WHERE acronym LIKE ?
    ORDER BY acronym
  `;

  const existing = await env.DB.prepare(query).bind(`${baseAcronym}%`).all();
  const existingAcronyms = existing.results?.map(r => r.acronym) || [];

  let counter = 1;
  let candidateAcronym = baseAcronym;

  while (existingAcronyms.includes(candidateAcronym)) {
    candidateAcronym = `${baseAcronym}${counter.toString().padStart(2, '0')}`;
    counter++;
  }

  return candidateAcronym;
}

// Comprehensive Dependency Analysis
async function analyzeDependencies(resourceType, resourceId, env) {
  const dependencies = {
    hasDependendencies: false,
    summary: {},
    cascade_preview: []
  };

  if (resourceType === 'station') {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM platforms WHERE station_id = ?) as platform_count,
        (SELECT COUNT(*) FROM instruments i JOIN platforms p ON i.platform_id = p.id WHERE p.station_id = ?) as instrument_count,
        (SELECT COUNT(*) FROM instrument_rois r JOIN instruments i ON r.instrument_id = i.id JOIN platforms p ON i.platform_id = p.id WHERE p.station_id = ?) as roi_count
    `;

    const result = await env.DB.prepare(query).bind(resourceId, resourceId, resourceId).first();
    dependencies.summary = {
      platforms: result.platform_count,
      instruments: result.instrument_count,
      rois: result.roi_count
    };

    dependencies.hasDependendencies = result.platform_count > 0 || result.instrument_count > 0 || result.roi_count > 0;

    // Generate cascade preview
    if (dependencies.hasDependendencies) {
      dependencies.cascade_preview = [
        `${result.platform_count} platforms will be deleted`,
        `${result.instrument_count} instruments will be deleted`,
        `${result.roi_count} ROIs will be deleted`
      ].filter(item => !item.startsWith('0 '));
    }
  }

  return dependencies;
}

// Dynamic Update Query Builder
function buildStationUpdateQuery(stationId, updateData, user) {
  const allowedFields = [
    'normalized_name', 'display_name', 'acronym', 'status', 'country',
    'latitude', 'longitude', 'elevation_m', 'description'
  ];

  const setClause = [];
  const values = [];

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      setClause.push(`${field} = ?`);
      values.push(field === 'acronym' ? updateData[field].toUpperCase() : updateData[field]);
    }
  });

  // Always update these tracking fields
  setClause.push('updated_at = ?', 'updated_by = ?');
  values.push(new Date().toISOString(), user.username);

  const query = `
    UPDATE stations
    SET ${setClause.join(', ')}
    WHERE id = ?
  `;

  values.push(stationId);

  return { query, values };
}

// Comprehensive Backup Generation
async function generateComprehensiveBackup(resourceType, resourceId, env, user) {
  const backup = {
    backup_metadata: {
      timestamp: new Date().toISOString(),
      backup_type: `${resourceType}_deletion`,
      resource_id: resourceId,
      created_by: user.username,
      sites_spectral_version: '5.0.0'
    }
  };

  if (resourceType === 'station') {
    // Get complete station hierarchy
    const stationQuery = `SELECT * FROM stations WHERE id = ?`;
    const platformsQuery = `SELECT * FROM platforms WHERE station_id = ?`;
    const instrumentsQuery = `
      SELECT i.* FROM instruments i
      JOIN platforms p ON i.platform_id = p.id
      WHERE p.station_id = ?
    `;
    const roisQuery = `
      SELECT r.* FROM instrument_rois r
      JOIN instruments i ON r.instrument_id = i.id
      JOIN platforms p ON i.platform_id = p.id
      WHERE p.station_id = ?
    `;

    const [station, platforms, instruments, rois] = await Promise.all([
      env.DB.prepare(stationQuery).bind(resourceId).first(),
      env.DB.prepare(platformsQuery).bind(resourceId).all(),
      env.DB.prepare(instrumentsQuery).bind(resourceId).all(),
      env.DB.prepare(roisQuery).bind(resourceId).all()
    ]);

    backup.station = station;
    backup.platforms = platforms?.results || [];
    backup.instruments = instruments?.results || [];
    backup.rois = rois?.results || [];
  }

  return backup;
}

// Platform-specific functions
async function checkPlatformConflicts(stationId, normalizedName, locationCode, env) {
  const query = `
    SELECT normalized_name, location_code FROM platforms
    WHERE station_id = ? AND (normalized_name = ? OR location_code = ?)
  `;

  const result = await env.DB.prepare(query).bind(stationId, normalizedName, locationCode).all();

  return (result?.results || []).map(r => ({
    field: r.normalized_name === normalizedName ? 'normalized_name' : 'location_code',
    value: r.normalized_name === normalizedName ? r.normalized_name : r.location_code
  }));
}

async function generatePlatformAlternatives(normalizedName, locationCode, stationId, env) {
  const existingQuery = `
    SELECT normalized_name, location_code FROM platforms
    WHERE station_id = ?
  `;

  const existing = await env.DB.prepare(existingQuery).bind(stationId).all();
  const existingNames = existing.results?.map(r => r.normalized_name) || [];
  const existingCodes = existing.results?.map(r => r.location_code) || [];

  return {
    normalized_name: generateAlternativeNormalizedName(normalizedName, existingNames),
    location_code: generateNextLocationCode(locationCode, existingCodes)
  };
}