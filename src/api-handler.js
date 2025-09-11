// API Route Handler for SITES Spectral application

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
      case 'stations':
        return await handleStations(method, id, request, env);
        
      case 'instruments':
        return await handleInstruments(method, id, pathSegments, request, env);
        
      case 'export':
        return await handleExport(method, request, env);
        
      case 'stats':
        return await handleStats(method, pathSegments, request, env);
        
      case 'reference':
        return await handleReference(method, pathSegments, request, env);
        
      case 'activity':
        return await handleActivity(method, request, env);
        
      case 'search':
        return await handleSearch(method, pathSegments, request, env);
        
      case 'phenocams':
        return await handlePhenocams(method, pathSegments, request, env);
        
      case 'mspectral':
        return await handleMspectralSensors(method, pathSegments, request, env);
        
      case 'auth':
        return await handleAuth(method, pathSegments, request, env);
        
      case 'users':
        return await handleUsers(method, id, request, env);
        
      case 'platforms':
        return await handlePlatforms(method, id, request, env);
        
      case 'health':
        return handleHealthCheck(env);
        
      default:
        return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('API Handler Error:', error);
    return new Response(JSON.stringify({ 
      error: 'API request failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStations(method, id, request, env) {
  const { onRequestGet, onRequestPost, onRequestPut, onRequestDelete } = await import('../functions/api/stations.js');
  
  const params = { id };
  const mockRequest = { request, env, params };
  
  switch (method) {
    case 'GET':
      return await onRequestGet(mockRequest);
    case 'POST':
      return await onRequestPost(mockRequest);
    case 'PUT':
      return await onRequestPut(mockRequest);
    case 'DELETE':
      return await onRequestDelete(mockRequest);
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

async function handleInstruments(method, id, pathSegments, request, env) {
  // Handle nested instrument routes like /instruments/{id}/rois, /instruments/{id}/history
  if (pathSegments.length > 2) {
    const subResource = pathSegments[2];
    const subId = pathSegments[3];
    
    switch (subResource) {
      case 'rois':
        return await handleInstrumentROIs(method, id, subId, request, env);
      case 'history':
        return await handleInstrumentHistory(method, id, request, env);
      case 'quality-flags':
        return await handleQualityFlags(method, id, request, env);
      default:
        return new Response('Sub-resource not found', { status: 404 });
    }
  }
  
  // Basic instrument CRUD
  const params = { id };
  const mockRequest = { request, env, params };
  
  // Import instrument handlers (we'll need to create this)
  try {
    const { onRequestGet, onRequestPost, onRequestPut, onRequestDelete } = await import('../functions/api/instruments.js');
    
    switch (method) {
      case 'GET':
        return await onRequestGet(mockRequest);
      case 'POST':
        return await onRequestPost(mockRequest);
      case 'PUT':
        return await onRequestPut(mockRequest);
      case 'DELETE':
        return await onRequestDelete(mockRequest);
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    // Temporary response until we create the instruments handler
    return new Response(JSON.stringify({ 
      message: 'Instruments API coming soon',
      method,
      id,
      error: error.message 
    }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleExport(method, request, env) {
  if (method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // Temporary export functionality
  return new Response(JSON.stringify({ 
    message: 'Export functionality coming soon',
    available_formats: ['csv', 'yaml', 'json']
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleStats(method, pathSegments, request, env) {
  if (method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  const statsType = pathSegments[1];
  
  try {
    switch (statsType) {
      case 'network':
        return await getNetworkStats(env);
      case 'stations':
        return await getStationStats(pathSegments[2], env);
      case 'instruments':
        return await getInstrumentStats(env);
      default:
        return new Response('Stats type not found', { status: 404 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleReference(method, pathSegments, request, env) {
  if (method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  const refType = pathSegments[1];
  
  try {
    let query, data;
    
    switch (refType) {
      case 'ecosystems':
        query = 'SELECT * FROM ecosystems ORDER BY name';
        data = await env.DB.prepare(query).all();
        break;
        
      case 'instrument-types':
        query = 'SELECT * FROM instrument_types ORDER BY name';
        data = await env.DB.prepare(query).all();
        break;
        
      case 'platform-types':
        query = 'SELECT * FROM platform_types ORDER BY name';
        data = await env.DB.prepare(query).all();
        break;
        
      default:
        return new Response('Reference type not found', { status: 404 });
    }
    
    return new Response(JSON.stringify(data.results || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleActivity(method, request, env) {
  if (method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit')) || 10;
  
  try {
    const query = `
      SELECT 
        ih.*,
        s.display_name as station_name,
        i.canonical_id as instrument_id
      FROM instrument_history ih
      LEFT JOIN instruments i ON ih.instrument_id = i.id
      LEFT JOIN stations s ON i.station_id = s.id
      ORDER BY ih.created_at DESC
      LIMIT ?
    `;
    
    const activities = await env.DB.prepare(query).bind(limit).all();
    
    return new Response(JSON.stringify({
      activities: activities.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleSearch(method, pathSegments, request, env) {
  // Search functionality placeholder
  return new Response(JSON.stringify({ 
    message: 'Search functionality coming soon' 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function handleHealthCheck(env) {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'SITES Spectral Stations & Instruments',
    version: env?.APP_VERSION || '0.1.0-dev',
    environment: env?.ENVIRONMENT || 'development',
    database: 'Cloudflare D1',
    endpoints: {
      stations: '/api/stations',
      phenocams: '/api/phenocams', 
      mspectral: '/api/mspectral',
      stats: '/api/stats/network'
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions for stats
async function getNetworkStats(env) {
  try {
    const [stationsResult, phenocamsResult, mspectralResult] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM stations').first(),
      env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active
        FROM phenocams
      `).first(),
      env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active
        FROM mspectral_sensors
      `).first()
    ]);

    const totalInstruments = phenocamsResult.total + mspectralResult.total;
    const activeInstruments = phenocamsResult.active + mspectralResult.active;

    return new Response(JSON.stringify({
      total_stations: stationsResult.count,
      total_instruments: totalInstruments,
      active_instruments: activeInstruments
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw new Error(`Failed to get network stats: ${error.message}`);
  }
}

async function getStationStats(stationId, env) {
  if (!stationId) {
    return new Response('Station ID required', { status: 400 });
  }
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        s.*,
        COUNT(i.id) as instrument_count,
        COUNT(CASE WHEN i.status = 'Active' THEN 1 END) as active_instruments
      FROM stations s
      LEFT JOIN instruments i ON s.id = i.station_id
      WHERE s.id = ?
      GROUP BY s.id
    `).bind(stationId).first();

    if (!result) {
      return new Response('Station not found', { status: 404 });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw new Error(`Failed to get station stats: ${error.message}`);
  }
}

async function getInstrumentStats(env) {
  try {
    const [phenocamsResult, mspectralResult] = await Promise.all([
      env.DB.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM phenocams
        GROUP BY status
      `).all(),
      env.DB.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM mspectral_sensors
        GROUP BY status
      `).all()
    ]);

    const stats = {};
    
    // Combine results from both tables
    [...(phenocamsResult.results || []), ...(mspectralResult.results || [])].forEach(row => {
      const statusKey = row.status.toLowerCase();
      stats[statusKey] = (stats[statusKey] || 0) + row.count;
    });

    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw new Error(`Failed to get instrument stats: ${error.message}`);
  }
}

// Placeholder functions for instrument sub-resources
async function handleInstrumentROIs(method, instrumentId, roiId, request, env) {
  return new Response(JSON.stringify({ 
    message: 'ROI API coming soon',
    instrument_id: instrumentId,
    roi_id: roiId 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleInstrumentHistory(method, instrumentId, request, env) {
  return new Response(JSON.stringify({ 
    message: 'History API coming soon',
    instrument_id: instrumentId 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleQualityFlags(method, instrumentId, request, env) {
  return new Response(JSON.stringify({ 
    message: 'Quality flags API coming soon',
    instrument_id: instrumentId 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Phenocams API handler
async function handlePhenocams(method, pathSegments, request, env) {
  try {
    switch (method) {
      case 'GET':
        const query = `
          SELECT 
            p.*,
            s.display_name as station_name,
            s.acronym as station_acronym
          FROM phenocams p
          LEFT JOIN stations s ON p.station_id = s.id
          ORDER BY p.canonical_id
        `;
        
        const result = await env.DB.prepare(query).all();
        
        return new Response(JSON.stringify({
          phenocams: result.results || []
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'PATCH':
        // Extract ID from pathSegments
        const id = pathSegments[1];
        if (!id) {
          return new Response('ID required', { status: 400 });
        }
        
        const body = await request.json();
        const updateFields = [];
        const updateValues = [];
        
        // Validate and prepare update fields
        const allowedFields = ['canonical_id', 'legacy_acronym', 'ecosystem', 'location', 'status', 'thematic_program'];
        for (const [field, value] of Object.entries(body)) {
          if (allowedFields.includes(field)) {
            updateFields.push(`${field} = ?`);
            updateValues.push(value);
          }
        }
        
        if (updateFields.length === 0) {
          return new Response('No valid fields to update', { status: 400 });
        }
        
        updateValues.push(id);
        
        const updateQuery = `
          UPDATE phenocams 
          SET ${updateFields.join(', ')}, updated_at = datetime('now') 
          WHERE id = ?
        `;
        
        await env.DB.prepare(updateQuery).bind(...updateValues).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Phenocams API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch phenocams',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Multispectral sensors API handler
async function handleMspectralSensors(method, pathSegments, request, env) {
  try {
    switch (method) {
      case 'GET':
        const query = `
          SELECT 
            m.*,
            s.display_name as station_name,
            s.acronym as station_acronym
          FROM mspectral_sensors m
          LEFT JOIN stations s ON m.station_id = s.id
          ORDER BY m.canonical_id
        `;
        
        const result = await env.DB.prepare(query).all();
        
        return new Response(JSON.stringify({
          mspectral_sensors: result.results || []
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'PATCH':
        // Extract ID from pathSegments
        const sensorId = pathSegments[1];
        if (!sensorId) {
          return new Response('ID required', { status: 400 });
        }
        
        const sensorBody = await request.json();
        const sensorUpdateFields = [];
        const sensorUpdateValues = [];
        
        // Validate and prepare update fields
        const allowedSensorFields = ['canonical_id', 'legacy_name', 'ecosystem', 'location', 'status', 'center_wavelength_nm', 'usage_type', 'brand_model', 'thematic_program'];
        for (const [field, value] of Object.entries(sensorBody)) {
          if (allowedSensorFields.includes(field)) {
            sensorUpdateFields.push(`${field} = ?`);
            sensorUpdateValues.push(value);
          }
        }
        
        if (sensorUpdateFields.length === 0) {
          return new Response('No valid fields to update', { status: 400 });
        }
        
        sensorUpdateValues.push(sensorId);
        
        const sensorUpdateQuery = `
          UPDATE mspectral_sensors 
          SET ${sensorUpdateFields.join(', ')}, updated_at = datetime('now') 
          WHERE id = ?
        `;
        
        await env.DB.prepare(sensorUpdateQuery).bind(...sensorUpdateValues).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Multispectral sensors API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch multispectral sensors',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Authentication API handler
async function handleAuth(method, pathSegments, request, env) {
  const authAction = pathSegments[1]; // login, logout, verify, refresh
  
  try {
    const { onRequestPost, onRequestGet } = await import('../functions/api/auth.js');
    
    // Create mock request object for auth handler
    const mockRequest = {
      request: new Request(request.url.replace(/\/auth\/.*/, `/auth/${authAction}`), request),
      env,
      params: {}
    };
    
    switch (method) {
      case 'POST':
        return await onRequestPost(mockRequest);
      case 'GET':
        return await onRequestGet(mockRequest);
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Authentication service unavailable',
      message: error.message 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Users API handler (placeholder)
async function handleUsers(method, id, request, env) {
  return new Response(JSON.stringify({ 
    message: 'User management API coming soon',
    method,
    id
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Platforms API handler
async function handlePlatforms(method, pathSegments, request, env) {
  try {
    switch (method) {
      case 'GET':
        // If there's an ID, get single platform, otherwise get all platforms
        const platformId = pathSegments[1];
        if (platformId) {
          const query = `
            SELECT 
              p.*,
              s.display_name as station_name,
              s.acronym as station_acronym
            FROM platforms p
            LEFT JOIN stations s ON p.station_id = s.id
            WHERE p.id = ?
          `;
          const result = await env.DB.prepare(query).bind(platformId).first();
          
          if (!result) {
            return new Response('Platform not found', { status: 404 });
          }
          
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const query = `
            SELECT 
              p.*,
              s.display_name as station_name,
              s.acronym as station_acronym
            FROM platforms p
            LEFT JOIN stations s ON p.station_id = s.id
            ORDER BY p.station_id, p.platform_id
          `;
          
          const result = await env.DB.prepare(query).all();
          
          return new Response(JSON.stringify({
            platforms: result.results || []
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
      case 'POST':
        const platformData = await request.json();
        
        // Required fields validation
        const requiredFields = ['station_id', 'platform_id', 'canonical_id', 'name', 'type'];
        const missingFields = requiredFields.filter(field => !platformData[field]);
        if (missingFields.length > 0) {
          return new Response(JSON.stringify({
            error: `Missing required fields: ${missingFields.join(', ')}`
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
        // Validate platform type
        const validTypes = ['tower', 'mast', 'building', 'ground'];
        if (!validTypes.includes(platformData.type)) {
          return new Response(JSON.stringify({
            error: 'Invalid platform type. Must be one of: tower, mast, building, ground'
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
        const insertQuery = `
          INSERT INTO platforms (
            station_id, platform_id, canonical_id, name, type,
            latitude, longitude, elevation_m, platform_height_m,
            structure_material, installation_date, status, notes,
            thematic_program, priority, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;
        
        const insertResult = await env.DB.prepare(insertQuery).bind(
          platformData.station_id,
          platformData.platform_id,
          platformData.canonical_id,
          platformData.name,
          platformData.type,
          platformData.latitude || null,
          platformData.longitude || null,
          platformData.elevation_m || null,
          platformData.platform_height_m || 0,
          platformData.structure_material || null,
          platformData.installation_date || null,
          platformData.status || 'Active',
          platformData.notes || null,
          platformData.thematic_program || 'SITES_Spectral',
          platformData.priority || 1
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          id: insertResult.meta.last_row_id
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'PATCH':
        const updatePlatformId = pathSegments[1];
        if (!updatePlatformId) {
          return new Response('Platform ID required', { status: 400 });
        }
        
        const updateData = await request.json();
        const updateFields = [];
        const updateValues = [];
        
        // Allowed fields for update
        const allowedUpdateFields = [
          'platform_id', 'canonical_id', 'name', 'type', 'latitude', 'longitude', 
          'elevation_m', 'platform_height_m', 'structure_material', 'installation_date', 
          'status', 'notes', 'thematic_program', 'priority'
        ];
        
        for (const [field, value] of Object.entries(updateData)) {
          if (allowedUpdateFields.includes(field)) {
            updateFields.push(`${field} = ?`);
            updateValues.push(value);
          }
        }
        
        if (updateFields.length === 0) {
          return new Response('No valid fields to update', { status: 400 });
        }
        
        updateValues.push(updatePlatformId);
        
        const updateQuery = `
          UPDATE platforms 
          SET ${updateFields.join(', ')}, updated_at = datetime('now') 
          WHERE id = ?
        `;
        
        await env.DB.prepare(updateQuery).bind(...updateValues).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'DELETE':
        const deletePlatformId = pathSegments[1];
        if (!deletePlatformId) {
          return new Response('Platform ID required', { status: 400 });
        }
        
        // Check if platform has associated instruments
        const instrumentCheck = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM (
            SELECT platform_id FROM phenocams WHERE platform_id = ?
            UNION ALL
            SELECT platform_id FROM mspectral_sensors WHERE platform_id = ?
          )
        `).bind(deletePlatformId, deletePlatformId).first();
        
        if (instrumentCheck.count > 0) {
          return new Response(JSON.stringify({
            error: 'Cannot delete platform with associated instruments. Remove instruments first.'
          }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
        
        await env.DB.prepare('DELETE FROM platforms WHERE id = ?')
          .bind(deletePlatformId).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Platforms API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Platform operation failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}