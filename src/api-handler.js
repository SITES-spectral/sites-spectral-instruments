// API Route Handler for SITES Spectral application

import { getUserFromRequest, hasPermission, requireAuth } from './auth-secrets.js';

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
        
      case 'geojson':
        return await handleGeoJSON(method, pathSegments, request, env);
        
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
  const { onRequestGet, onRequestPost, onRequestPut, onRequestDelete } = await import('../functions/api/stations/index.js');
  
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
    const { onRequestGet, onRequestPost, onRequestPut, onRequestDelete } = await import('../functions/api/instruments/index.js');
    
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

async function handleHealthCheck(env) {
  try {
    // Test database connectivity
    const dbTest = await env.DB.prepare('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name').all();
    const tables = dbTest.results?.map(row => row.name) || [];

    // Test a simple query
    let stationCount = 0;
    try {
      const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM stations').first();
      stationCount = countResult?.count || 0;
    } catch (e) {
      console.warn('Station count query failed:', e);
    }

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SITES Spectral Stations & Instruments',
      version: env?.APP_VERSION || '2.0.0',
      environment: env?.ENVIRONMENT || 'development',
      database: {
        type: 'Cloudflare D1',
        connected: true,
        tables: tables.length,
        table_list: tables,
        stations: stationCount
      },
      endpoints: {
        stations: '/api/stations',
        phenocams: '/api/phenocams',
        mspectral: '/api/mspectral',
        stats: '/api/stats/network'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'SITES Spectral Stations & Instruments',
      version: env?.APP_VERSION || '2.0.0',
      environment: env?.ENVIRONMENT || 'development',
      database: {
        type: 'Cloudflare D1',
        connected: false,
        error: error.message
      },
      message: 'Database connectivity issue'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper functions for stats
async function getNetworkStats(env) {
  try {
    // Try to get stats with fallback for missing tables
    let stationsCount = 0;
    let totalInstruments = 0;
    let activeInstruments = 0;

    try {
      const stationsResult = await env.DB.prepare('SELECT COUNT(*) as count FROM stations').first();
      stationsCount = stationsResult?.count || 0;
    } catch (e) {
      console.warn('Failed to get stations count:', e.message);
    }

    try {
      const phenocamsResult = await env.DB.prepare(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active
        FROM phenocams
      `).first();

      totalInstruments += phenocamsResult?.total || 0;
      activeInstruments += phenocamsResult?.active || 0;
    } catch (e) {
      console.warn('Failed to get phenocams count:', e.message);
    }

    try {
      const mspectralResult = await env.DB.prepare(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active
        FROM mspectral_sensors
      `).first();

      totalInstruments += mspectralResult?.total || 0;
      activeInstruments += mspectralResult?.active || 0;
    } catch (e) {
      console.warn('Failed to get multispectral sensors count:', e.message);
    }

    // If we have no data, provide some default values
    if (stationsCount === 0 && totalInstruments === 0) {
      return new Response(JSON.stringify({
        total_stations: 0,
        total_instruments: 0,
        active_instruments: 0,
        note: 'Database contains no data - migrations may be incomplete'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      total_stations: stationsCount,
      total_instruments: totalInstruments,
      active_instruments: activeInstruments
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to get network stats',
      message: error.message,
      total_stations: 0,
      total_instruments: 0,
      active_instruments: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
        // Public read access for phenocams data
        const user = await getUserFromRequest(request, env);
        
        let query = `
          SELECT 
            p.*,
            s.display_name as station_name,
            s.acronym as station_acronym
          FROM phenocams p
          LEFT JOIN stations s ON p.station_id = s.id
        `;
        
        const queryParams = [];
        
        // Apply station filtering based on user role
        if (user && user.role === 'station') {
          query += ' WHERE p.station_id = ?';
          queryParams.push(user.station_id);
        }
        
        query += ' ORDER BY p.priority, p.canonical_id';
        
        const result = queryParams.length > 0 
          ? await env.DB.prepare(query).bind(...queryParams).all()
          : await env.DB.prepare(query).all();
        
        return new Response(JSON.stringify({
          phenocams: result.results || []
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'PATCH':
        // Require authentication for modifications
        const patchUser = await getUserFromRequest(request, env);
        if (!patchUser) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Extract ID from pathSegments
        const id = pathSegments[1];
        if (!id) {
          return new Response('ID required', { status: 400 });
        }
        
        // Check if user has permission to modify this phenocam
        const phenocamCheck = await env.DB.prepare(
          'SELECT station_id FROM phenocams WHERE id = ?'
        ).bind(id).first();
        
        if (!phenocamCheck) {
          return new Response('Phenocam not found', { status: 404 });
        }
        
        if (!hasPermission(patchUser, 'write', 'instrument', phenocamCheck.station_id)) {
          return new Response(JSON.stringify({ error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
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
        // Public read access for sensor data
        const user = await getUserFromRequest(request, env);
        
        let query = `
          SELECT 
            m.*,
            s.display_name as station_name,
            s.acronym as station_acronym
          FROM mspectral_sensors m
          LEFT JOIN stations s ON m.station_id = s.id
        `;
        
        const queryParams = [];
        
        // Apply station filtering based on user role
        if (user && user.role === 'station') {
          query += ' WHERE m.station_id = ?';
          queryParams.push(user.station_id);
        }
        
        query += ' ORDER BY m.priority, m.canonical_id';
        
        const result = await env.DB.prepare(query).all();
        
        return new Response(JSON.stringify({
          mspectral_sensors: result.results || []
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'PATCH':
        // Require authentication for modifications
        const sensorPatchUser = await getUserFromRequest(request, env);
        if (!sensorPatchUser) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Extract ID from pathSegments
        const sensorId = pathSegments[1];
        if (!sensorId) {
          return new Response('ID required', { status: 400 });
        }
        
        // Check if user has permission to modify this sensor
        const sensorCheck = await env.DB.prepare(
          'SELECT station_id FROM mspectral_sensors WHERE id = ?'
        ).bind(sensorId).first();
        
        if (!sensorCheck) {
          return new Response('Sensor not found', { status: 404 });
        }
        
        if (!hasPermission(sensorPatchUser, 'write', 'instrument', sensorCheck.station_id)) {
          return new Response(JSON.stringify({ error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
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

// Users API handler
async function handleUsers(method, id, request, env) {
  try {
    // Require authentication for all user operations
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    switch (method) {
      case 'GET':
        // Only admins can view user lists, users can view their own profile
        if (id) {
          // Get specific user profile
          if (user.role !== 'admin' && user.sub !== id) {
            return new Response(JSON.stringify({ error: 'Permission denied' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const userProfile = await env.DB.prepare(`
            SELECT id, username, role, station_id, active, created_at, last_login
            FROM users WHERE id = ?
          `).bind(id).first();
          
          if (!userProfile) {
            return new Response('User not found', { status: 404 });
          }
          
          return new Response(JSON.stringify(userProfile), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          // List all users (admin only)
          if (user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const users = await env.DB.prepare(`
            SELECT u.id, u.username, u.role, u.station_id, u.active, u.created_at, u.last_login,
                   s.display_name as station_name
            FROM users u
            LEFT JOIN stations s ON u.station_id = s.id
            ORDER BY u.created_at DESC
          `).all();
          
          return new Response(JSON.stringify({
            users: users.results || []
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
      case 'POST':
        // Create new user (admin only)
        if (user.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const userData = await request.json();
        const requiredFields = ['username', 'password', 'role'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        
        if (missingFields.length > 0) {
          return new Response(JSON.stringify({
            error: `Missing required fields: ${missingFields.join(', ')}`
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
        // Validate role
        const validRoles = ['admin', 'station', 'readonly'];
        if (!validRoles.includes(userData.role)) {
          return new Response(JSON.stringify({
            error: 'Invalid role. Must be one of: admin, station, readonly'
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
        // Hash password and create user
        const { hashPassword } = await import('./auth.js');
        const hashedPassword = await hashPassword(userData.password);
        
        const insertResult = await env.DB.prepare(`
          INSERT INTO users (username, password_hash, role, station_id, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          userData.username,
          hashedPassword,
          userData.role,
          userData.station_id || null,
          userData.active !== undefined ? userData.active : true
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          id: insertResult.meta.last_row_id
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'PATCH':
        // Update user (admin only, or users can update their own profile)
        if (!id) {
          return new Response('User ID required', { status: 400 });
        }
        
        if (user.role !== 'admin' && user.sub !== id) {
          return new Response(JSON.stringify({ error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const updateData = await request.json();
        const updateFields = [];
        const updateValues = [];
        
        // Different fields allowed for admin vs regular users
        const allowedFields = user.role === 'admin' 
          ? ['username', 'role', 'station_id', 'active']
          : ['username']; // Regular users can only update their username
          
        if (updateData.password && user.sub === id) {
          // Users can update their own password
          const { hashPassword } = await import('./auth.js');
          const hashedPassword = await hashPassword(updateData.password);
          updateFields.push('password_hash = ?');
          updateValues.push(hashedPassword);
        }
        
        for (const [field, value] of Object.entries(updateData)) {
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
          UPDATE users 
          SET ${updateFields.join(', ')}, updated_at = datetime('now') 
          WHERE id = ?
        `;
        
        await env.DB.prepare(updateQuery).bind(...updateValues).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'DELETE':
        // Delete user (admin only)
        if (!id) {
          return new Response('User ID required', { status: 400 });
        }
        
        if (user.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Prevent self-deletion
        if (user.sub === id) {
          return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Users API error:', error);
    return new Response(JSON.stringify({ 
      error: 'User operation failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Platforms API handler - Routes to CRUD endpoints
async function handlePlatforms(method, id, request, env) {
  const { onRequestGet, onRequestPost, onRequestPut, onRequestPatch, onRequestDelete } = await import('../functions/api/platforms/index.js');
  
  const params = { id };
  const mockRequest = { request, env, params };
  
  switch (method) {
    case 'GET':
      return await onRequestGet(mockRequest);
    case 'POST':
      return await onRequestPost(mockRequest);
    case 'PUT':
      return await onRequestPut(mockRequest);
    case 'PATCH':
      return await onRequestPatch(mockRequest);
    case 'DELETE':
      return await onRequestDelete(mockRequest);
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

// Handle GeoJSON endpoints
async function handleGeoJSON(method, pathSegments, request, env) {
  try {
    if (method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    // Import the GeoJSON handler
    const { onRequestGet } = await import('../functions/api/geojson/index.js');
    
    // Set up params for type routing (all, stations, platforms)
    const type = pathSegments[1] || 'all'; // geojson/[type]
    const params = { type };
    const mockRequest = { request, env, params };
    
    return await onRequestGet(mockRequest);
    
  } catch (error) {
    console.error('GeoJSON API error:', error);
    return new Response(JSON.stringify({ 
      error: 'GeoJSON request failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
