// API handlers for phenocams endpoint
import { getUserFromRequest, requirePermission } from '../../src/auth-secrets.js';

export async function onRequestGet({ request, env, params }) {
  try {
    const url = new URL(request.url);
    const stationIdFilter = url.searchParams.get('station_id');
    
    let query = `
      SELECT 
        p.id,
        p.canonical_id,
        p.canonical_id as name,
        p.station_id,
        p.status,
        p.ecosystem,
        p.location,
        p.latitude,
        p.longitude,
        p.thematic_program,
        p.priority,
        p.deployment_date,
        p.created_at,
        p.updated_at,
        s.display_name as station_name,
        s.acronym as station_acronym,
        s.region as station_region
      FROM phenocams p
      LEFT JOIN stations s ON p.station_id = s.id
    `;
    
    const params = [];
    if (stationIdFilter) {
      query += ' WHERE p.station_id = ?';
      params.push(stationIdFilter);
    }
    
    query += ' ORDER BY s.display_name, p.canonical_id';
    
    const result = params.length > 0 
      ? await env.DB.prepare(query).bind(...params).all()
      : await env.DB.prepare(query).all();
    
    return new Response(JSON.stringify({
      phenocams: result.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Phenocams GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch phenocams',
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
    const userOrResponse = await requirePermission(request, env, 'write', 'phenocam');
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
    const existing = await env.DB.prepare('SELECT id FROM phenocams WHERE canonical_id = ?')
      .bind(data.canonical_id).first();
    if (existing) {
      return new Response(JSON.stringify({ error: 'Phenocam with this canonical_id already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Insert new phenocam
    const result = await env.DB.prepare(`
      INSERT INTO phenocams (
        canonical_id, station_id, status, ecosystem, location, latitude, longitude,
        thematic_program, priority, deployment_date, legacy_acronym, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
      data.deployment_date || null,
      data.legacy_acronym || null
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create phenocam');
    }
    
    // Return the created phenocam
    const newPhenocam = await env.DB.prepare(`
      SELECT p.*, s.display_name as station_name, s.acronym as station_acronym
      FROM phenocams p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `).bind(result.meta.last_row_id).first();
    
    return new Response(JSON.stringify(newPhenocam), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Phenocam creation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create phenocam',
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
    const userOrResponse = await requirePermission(request, env, 'write', 'phenocam');
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user = userOrResponse;
    
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Phenocam ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await request.json();
    
    // Get existing phenocam to check access
    const existing = await env.DB.prepare('SELECT * FROM phenocams WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Phenocam not found' }), {
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
      const conflict = await env.DB.prepare('SELECT id FROM phenocams WHERE canonical_id = ? AND id != ?')
        .bind(data.canonical_id, id).first();
      if (conflict) {
        return new Response(JSON.stringify({ error: 'Phenocam with this canonical_id already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Update phenocam
    const result = await env.DB.prepare(`
      UPDATE phenocams SET
        canonical_id = COALESCE(?, canonical_id),
        status = COALESCE(?, status),
        ecosystem = COALESCE(?, ecosystem),
        location = COALESCE(?, location),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        thematic_program = COALESCE(?, thematic_program),
        priority = COALESCE(?, priority),
        deployment_date = COALESCE(?, deployment_date),
        legacy_acronym = COALESCE(?, legacy_acronym),
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
      data.deployment_date || null,
      data.legacy_acronym || null,
      id
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to update phenocam');
    }
    
    // Return the updated phenocam
    const updatedPhenocam = await env.DB.prepare(`
      SELECT p.*, s.display_name as station_name, s.acronym as station_acronym
      FROM phenocams p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify(updatedPhenocam), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Phenocam update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update phenocam',
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
    const userOrResponse = await requirePermission(request, env, 'write', 'phenocam');
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user = userOrResponse;
    
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Phenocam ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing phenocam to check access
    const existing = await env.DB.prepare('SELECT * FROM phenocams WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Phenocam not found' }), {
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
    
    // Delete phenocam
    const result = await env.DB.prepare('DELETE FROM phenocams WHERE id = ?').bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete phenocam');
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Phenocam deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Phenocam deletion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete phenocam',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}