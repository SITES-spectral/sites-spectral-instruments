// API handlers for multispectral sensors endpoint
import { getUserFromRequest, requirePermission } from '../../src/auth-secrets.js';

export async function onRequestGet({ request, env, params }) {
  try {
    const url = new URL(request.url);
    const stationIdFilter = url.searchParams.get('station_id');
    
    let query = `
      SELECT 
        m.id,
        m.canonical_id,
        m.canonical_id as name,
        m.station_id,
        m.status,
        m.ecosystem,
        m.location,
        m.latitude,
        m.longitude,
        m.thematic_program,
        m.priority,
        m.brand,
        m.model,
        m.center_wavelength_nm,
        m.usage_type,
        m.created_at,
        m.updated_at,
        s.display_name as station_name,
        s.acronym as station_acronym,
        s.region as station_region
      FROM mspectral_sensors m
      LEFT JOIN stations s ON m.station_id = s.id
    `;
    
    const params = [];
    if (stationIdFilter) {
      query += ' WHERE m.station_id = ?';
      params.push(stationIdFilter);
    }
    
    query += ' ORDER BY s.display_name, m.canonical_id';
    
    const result = params.length > 0 
      ? await env.DB.prepare(query).bind(...params).all()
      : await env.DB.prepare(query).all();
    
    return new Response(JSON.stringify({
      mspectral_sensors: result.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Mspectral sensors GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch multispectral sensors',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    // Check authentication and permissions
    const userOrResponse = await requirePermission(request, env, 'write', 'mspectral_sensor');
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user = userOrResponse;
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.canonical_id || !data.station_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: canonical_id, station_id' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check station access for station users
    if (user.role === 'station' && data.station_id !== user.station_id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify station exists
    const station = await env.DB.prepare('SELECT id FROM stations WHERE id = ?')
      .bind(data.station_id).first();
    if (!station) {
      return new Response(JSON.stringify({ error: 'Station not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check for duplicate canonical_id
    const existing = await env.DB.prepare('SELECT id FROM mspectral_sensors WHERE canonical_id = ?')
      .bind(data.canonical_id).first();
    if (existing) {
      return new Response(JSON.stringify({ error: 'Multispectral sensor with this canonical_id already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Insert new multispectral sensor
    const result = await env.DB.prepare(`
      INSERT INTO mspectral_sensors (
        canonical_id, station_id, status, ecosystem, location, latitude, longitude,
        thematic_program, priority, brand, model, center_wavelength_nm, usage_type, 
        legacy_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.canonical_id,
      data.station_id,
      data.status || 'Active',
      data.ecosystem || null,
      data.location || null,
      data.latitude || null,
      data.longitude || null,
      data.thematic_program || 'SITES_Spectral',
      data.priority || 'Medium',
      data.brand || null,
      data.model || null,
      data.center_wavelength_nm || null,
      data.usage_type || null,
      data.legacy_name || null
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create multispectral sensor');
    }
    
    // Return the created sensor
    const newSensor = await env.DB.prepare(`
      SELECT m.*, s.display_name as station_name, s.acronym as station_acronym
      FROM mspectral_sensors m
      LEFT JOIN stations s ON m.station_id = s.id
      WHERE m.id = ?
    `).bind(result.meta.last_row_id).first();
    
    return new Response(JSON.stringify(newSensor), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Multispectral sensor creation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create multispectral sensor',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    // Check authentication and permissions
    const userOrResponse = await requirePermission(request, env, 'write', 'mspectral_sensor');
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user = userOrResponse;
    
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Sensor ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await request.json();
    
    // Get existing sensor to check access
    const existing = await env.DB.prepare('SELECT * FROM mspectral_sensors WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Multispectral sensor not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check station access for station users
    if (user.role === 'station' && existing.station_id !== user.station_id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check for canonical_id conflicts if changed
    if (data.canonical_id && data.canonical_id !== existing.canonical_id) {
      const conflict = await env.DB.prepare('SELECT id FROM mspectral_sensors WHERE canonical_id = ? AND id != ?')
        .bind(data.canonical_id, id).first();
      if (conflict) {
        return new Response(JSON.stringify({ error: 'Multispectral sensor with this canonical_id already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Update sensor
    const result = await env.DB.prepare(`
      UPDATE mspectral_sensors SET
        canonical_id = COALESCE(?, canonical_id),
        status = COALESCE(?, status),
        ecosystem = COALESCE(?, ecosystem),
        location = COALESCE(?, location),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        thematic_program = COALESCE(?, thematic_program),
        priority = COALESCE(?, priority),
        brand = COALESCE(?, brand),
        model = COALESCE(?, model),
        center_wavelength_nm = COALESCE(?, center_wavelength_nm),
        usage_type = COALESCE(?, usage_type),
        legacy_name = COALESCE(?, legacy_name),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.canonical_id || null,
      data.status || null,
      data.ecosystem || null,
      data.location || null,
      data.latitude || null,
      data.longitude || null,
      data.thematic_program || null,
      data.priority || null,
      data.brand || null,
      data.model || null,
      data.center_wavelength_nm || null,
      data.usage_type || null,
      data.legacy_name || null,
      id
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to update multispectral sensor');
    }
    
    // Return the updated sensor
    const updatedSensor = await env.DB.prepare(`
      SELECT m.*, s.display_name as station_name, s.acronym as station_acronym
      FROM mspectral_sensors m
      LEFT JOIN stations s ON m.station_id = s.id
      WHERE m.id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify(updatedSensor), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Multispectral sensor update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update multispectral sensor',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPatch({ request, env, params }) {
  // PATCH uses the same logic as PUT for partial updates
  return onRequestPut({ request, env, params });
}

export async function onRequestDelete({ request, env, params }) {
  try {
    // Check authentication and permissions
    const userOrResponse = await requirePermission(request, env, 'write', 'mspectral_sensor');
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user = userOrResponse;
    
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Sensor ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing sensor to check access
    const existing = await env.DB.prepare('SELECT * FROM mspectral_sensors WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Multispectral sensor not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check station access for station users
    if (user.role === 'station' && existing.station_id !== user.station_id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete sensor
    const result = await env.DB.prepare('DELETE FROM mspectral_sensors WHERE id = ?').bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete multispectral sensor');
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Multispectral sensor deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Multispectral sensor deletion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete multispectral sensor',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}