// API handlers for instruments endpoint
import { getUserFromRequest, hasPermission } from '../../src/auth-secrets.js';

export async function onRequestGet({ request, env, params }) {
  try {
    const user = await getUserFromRequest(request, env);
    const { id } = params;
    
    if (id) {
      // Get specific instrument - first try phenocams, then mspectral_sensors
      let instrument = await env.DB.prepare(`
        SELECT 
          'phenocam' as type,
          p.id, p.canonical_id, p.canonical_id as name, p.station_id, null as platform_id, p.status,
          p.location, p.location as platform_name, p.thematic_program, p.priority, p.created_at, p.updated_at,
          s.display_name as station_name, s.acronym as station_acronym,
          p.ecosystem, 'Camera' as model, p.canonical_id as serial_number,
          p.deployment_date as installed_date
        FROM phenocams p
        LEFT JOIN stations s ON p.station_id = s.id
        WHERE p.id = ?
      `).bind(id).first();
      
      if (!instrument) {
        instrument = await env.DB.prepare(`
          SELECT 
            'mspectral_sensor' as type,
            m.id, m.canonical_id, m.canonical_id as name, m.station_id, null as platform_id, m.status,
            m.location, m.location as platform_name, m.thematic_program, m.priority, m.created_at, m.updated_at,
            s.display_name as station_name, s.acronym as station_acronym,
            m.ecosystem, m.model, m.canonical_id as serial_number,
            m.created_at as installed_date
          FROM mspectral_sensors m
          LEFT JOIN stations s ON m.station_id = s.id
          WHERE m.id = ?
        `).bind(id).first();
      }
      
      if (!instrument) {
        return new Response('Instrument not found', { status: 404 });
      }
      
      // Check access for single instrument
      if (user && user.role === 'station' && instrument.station_id !== user.station_id) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(instrument), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // List all instruments by combining phenocams and mspectral_sensors
      const queryParams = [];
      const url = new URL(request.url);
      const stationIdFilter = url.searchParams.get('station_id');
      
      // Determine filtering
      let stationCondition = '';
      if (user && user.role === 'station') {
        stationCondition = ' WHERE p.station_id = ?';
        queryParams.push(user.station_id);
        queryParams.push(user.station_id); // For second part of UNION
      } else if (stationIdFilter) {
        stationCondition = ' WHERE p.station_id = ?';
        queryParams.push(stationIdFilter);
        queryParams.push(stationIdFilter); // For second part of UNION
      }
      
      let query = `
        SELECT 
          'phenocam' as type,
          p.id,
          p.canonical_id,
          p.canonical_id as name,
          p.station_id,
          null as platform_id,
          p.status,
          p.location,
          p.location as platform_name,
          p.thematic_program,
          p.priority,
          p.created_at,
          p.updated_at,
          s.display_name as station_name,
          s.acronym as station_acronym,
          p.ecosystem,
          'Camera' as model,
          p.canonical_id as serial_number,
          p.deployment_date as installed_date
        FROM phenocams p
        LEFT JOIN stations s ON p.station_id = s.id
        ${stationCondition}
        UNION ALL
        SELECT 
          'mspectral_sensor' as type,
          m.id,
          m.canonical_id,
          m.canonical_id as name,
          m.station_id,
          null as platform_id,
          m.status,
          m.location,
          m.location as platform_name,
          m.thematic_program,
          m.priority,
          m.created_at,
          m.updated_at,
          s.display_name as station_name,
          s.acronym as station_acronym,
          m.ecosystem,
          m.model,
          m.canonical_id as serial_number,
          m.created_at as installed_date
        FROM mspectral_sensors m
        LEFT JOIN stations s ON m.station_id = s.id
        ${stationCondition.replace('p.station_id', 'm.station_id')}
        ORDER BY station_id, priority, canonical_id
      `;
      
      const result = queryParams.length > 0 
        ? await env.DB.prepare(query).bind(...queryParams).all()
        : await env.DB.prepare(query).all();
      
      return new Response(JSON.stringify({
        instruments: result.results || []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Instruments GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch instruments',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env, params }) {
  try {
    // Require authentication for creating instruments
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const instrumentData = await request.json();
    
    // Check if user has permission to create instrument for this station
    if (!hasPermission(user, 'write', 'instrument', instrumentData.station_id)) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Required fields validation
    const requiredFields = ['canonical_id', 'type', 'station_id'];
    const missingFields = requiredFields.filter(field => !instrumentData[field]);
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        error: `Missing required fields: ${missingFields.join(', ')}`
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Validate instrument type
    const validTypes = ['phenocam', 'mspectral', 'lidar', 'weather', 'soil'];
    if (!validTypes.includes(instrumentData.type)) {
      return new Response(JSON.stringify({
        error: 'Invalid instrument type. Must be one of: ' + validTypes.join(', ')
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const insertQuery = `
      INSERT INTO instruments (
        canonical_id, type, station_id, platform_id, status,
        location, thematic_program, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const insertResult = await env.DB.prepare(insertQuery).bind(
      instrumentData.canonical_id,
      instrumentData.type,
      instrumentData.station_id,
      instrumentData.platform_id || null,
      instrumentData.status || 'Active',
      instrumentData.location || null,
      instrumentData.thematic_program || 'SITES_Spectral',
      instrumentData.priority || 1
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      id: insertResult.meta.last_row_id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Instruments POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create instrument',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    // Require authentication for updating instruments
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { id } = params;
    if (!id) {
      return new Response('Instrument ID required', { status: 400 });
    }
    
    // Check if instrument exists and get its station_id for permission check
    const existingInstrument = await env.DB.prepare(
      'SELECT station_id FROM instruments WHERE id = ?'
    ).bind(id).first();
    
    if (!existingInstrument) {
      return new Response('Instrument not found', { status: 404 });
    }
    
    // Check if user has permission to update this instrument
    if (!hasPermission(user, 'write', 'instrument', existingInstrument.station_id)) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updateData = await request.json();
    const updateFields = [];
    const updateValues = [];
    
    // Allowed fields for update
    const allowedUpdateFields = [
      'canonical_id', 'type', 'platform_id', 'status', 
      'location', 'thematic_program', 'priority'
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
    
    updateValues.push(id);
    
    const updateQuery = `
      UPDATE instruments 
      SET ${updateFields.join(', ')}, updated_at = datetime('now') 
      WHERE id = ?
    `;
    
    await env.DB.prepare(updateQuery).bind(...updateValues).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Instruments PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update instrument',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    // Require authentication for deleting instruments
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { id } = params;
    if (!id) {
      return new Response('Instrument ID required', { status: 400 });
    }
    
    // Check if instrument exists and get its station_id for permission check
    const instrumentToDelete = await env.DB.prepare(
      'SELECT station_id FROM instruments WHERE id = ?'
    ).bind(id).first();
    
    if (!instrumentToDelete) {
      return new Response('Instrument not found', { status: 404 });
    }
    
    // Check if user has permission to delete this instrument
    if (!hasPermission(user, 'delete', 'instrument', instrumentToDelete.station_id)) {
      return new Response(JSON.stringify({ error: 'Permission denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if instrument has dependencies (ROIs, data files, etc.)
    const dependencyCheck = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM instrument_history WHERE instrument_id = ?
    `).bind(id).first();
    
    if (dependencyCheck.count > 0) {
      return new Response(JSON.stringify({
        error: 'Cannot delete instrument with history records. Archive instead.'
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    await env.DB.prepare('DELETE FROM instruments WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Instruments DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete instrument',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}