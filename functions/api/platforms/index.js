// API handlers for platforms endpoint - Full CRUD operations for platforms table
import { getUserFromRequest, requirePermission } from '../../../src/auth-secrets.js';

export async function onRequestGet({ request, env, params }) {
  try {
    const url = new URL(request.url);
    const { id } = params;
    const stationIdFilter = url.searchParams.get('station_id');
    
    if (id) {
      // Get single platform
      const platform = await env.DB.prepare(`
        SELECT
          p.*,
          s.display_name as station_name,
          s.acronym as station_acronym,
          COUNT(CASE WHEN i.instrument_type = 'phenocam' THEN 1 END) as phenocam_count,
          COUNT(CASE WHEN i.instrument_type != 'phenocam' THEN 1 END) as sensor_count,
          COUNT(i.id) as total_instruments
        FROM platforms p
        LEFT JOIN stations s ON p.station_id = s.id
        LEFT JOIN instruments i ON p.id = i.platform_id
        WHERE p.id = ?
        GROUP BY p.id
      `).bind(id).first();
      
      if (!platform) {
        return new Response(JSON.stringify({ error: 'Platform not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(platform), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get all platforms with filtering
      let query = `
        SELECT
          p.*,
          s.display_name as station_name,
          s.acronym as station_acronym,
          COUNT(CASE WHEN i.instrument_type = 'phenocam' THEN 1 END) as phenocam_count,
          COUNT(CASE WHEN i.instrument_type != 'phenocam' THEN 1 END) as sensor_count,
          COUNT(i.id) as total_instruments
        FROM platforms p
        LEFT JOIN stations s ON p.station_id = s.id
        LEFT JOIN instruments i ON p.id = i.platform_id
      `;
      
      const params = [];
      if (stationIdFilter) {
        query += ' WHERE p.station_id = ?';
        params.push(stationIdFilter);
      }
      
      query += ' GROUP BY p.id ORDER BY s.display_name, p.canonical_id';
      
      const result = params.length > 0 
        ? await env.DB.prepare(query).bind(...params).all()
        : await env.DB.prepare(query).all();
      
      return new Response(JSON.stringify({
        platforms: result.results || []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Platforms GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch platforms',
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
    const userOrResponse = await requirePermission(request, env, 'write', 'platform');
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user = userOrResponse;
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.platform_id || !data.canonical_id || !data.name || !data.station_id || !data.type) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: platform_id, canonical_id, name, station_id, type' 
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
    
    // Validate platform type
    const validTypes = ['tower', 'mast', 'building', 'ground'];
    if (!validTypes.includes(data.type)) {
      return new Response(JSON.stringify({ 
        error: `Invalid platform type. Must be one of: ${validTypes.join(', ')}` 
      }), {
        status: 400,
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
    const existing = await env.DB.prepare('SELECT id FROM platforms WHERE canonical_id = ?')
      .bind(data.canonical_id).first();
    if (existing) {
      return new Response(JSON.stringify({ error: 'Platform with this canonical_id already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Insert new platform
    const result = await env.DB.prepare(`
      INSERT INTO platforms (
        station_id, platform_id, canonical_id, name, type, latitude, longitude, 
        elevation_m, platform_height_m, structure_material, foundation_type, 
        access_method, max_instruments, mounting_points, power_available, 
        network_available, status, installation_date, description, 
        installation_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.station_id,
      data.platform_id,
      data.canonical_id,
      data.name,
      data.type,
      data.latitude || null,
      data.longitude || null,
      data.elevation_m || null,
      data.platform_height_m || 0,
      data.structure_material || null,
      data.foundation_type || null,
      data.access_method || null,
      data.max_instruments || 10,
      data.mounting_points || null,
      data.power_available || false,
      data.network_available || false,
      data.status || 'Active',
      data.installation_date || null,
      data.description || null,
      data.installation_notes || null
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create platform');
    }
    
    // Return the created platform
    const newPlatform = await env.DB.prepare(`
      SELECT p.*, s.display_name as station_name, s.acronym as station_acronym
      FROM platforms p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `).bind(result.meta.last_row_id).first();
    
    return new Response(JSON.stringify(newPlatform), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Platform creation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create platform',
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
    const userOrResponse = await requirePermission(request, env, 'write', 'platform');
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user = userOrResponse;
    
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Platform ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await request.json();
    
    // Get existing platform to check access
    const existing = await env.DB.prepare('SELECT * FROM platforms WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Platform not found' }), {
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
    
    // Validate platform type if provided
    if (data.type) {
      const validTypes = ['tower', 'mast', 'building', 'ground'];
      if (!validTypes.includes(data.type)) {
        return new Response(JSON.stringify({ 
          error: `Invalid platform type. Must be one of: ${validTypes.join(', ')}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Check for canonical_id conflicts if changed
    if (data.canonical_id && data.canonical_id !== existing.canonical_id) {
      const conflict = await env.DB.prepare('SELECT id FROM platforms WHERE canonical_id = ? AND id != ?')
        .bind(data.canonical_id, id).first();
      if (conflict) {
        return new Response(JSON.stringify({ error: 'Platform with this canonical_id already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Update platform
    const result = await env.DB.prepare(`
      UPDATE platforms SET
        platform_id = COALESCE(?, platform_id),
        canonical_id = COALESCE(?, canonical_id),
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        elevation_m = COALESCE(?, elevation_m),
        platform_height_m = COALESCE(?, platform_height_m),
        structure_material = COALESCE(?, structure_material),
        foundation_type = COALESCE(?, foundation_type),
        access_method = COALESCE(?, access_method),
        max_instruments = COALESCE(?, max_instruments),
        mounting_points = COALESCE(?, mounting_points),
        power_available = COALESCE(?, power_available),
        network_available = COALESCE(?, network_available),
        status = COALESCE(?, status),
        installation_date = COALESCE(?, installation_date),
        description = COALESCE(?, description),
        installation_notes = COALESCE(?, installation_notes),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.platform_id || null,
      data.canonical_id || null,
      data.name || null,
      data.type || null,
      data.latitude || null,
      data.longitude || null,
      data.elevation_m || null,
      data.platform_height_m || null,
      data.structure_material || null,
      data.foundation_type || null,
      data.access_method || null,
      data.max_instruments || null,
      data.mounting_points || null,
      data.power_available || null,
      data.network_available || null,
      data.status || null,
      data.installation_date || null,
      data.description || null,
      data.installation_notes || null,
      id
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to update platform');
    }
    
    // Return the updated platform
    const updatedPlatform = await env.DB.prepare(`
      SELECT p.*, s.display_name as station_name, s.acronym as station_acronym
      FROM platforms p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.id = ?
    `).bind(id).first();
    
    return new Response(JSON.stringify(updatedPlatform), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Platform update error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update platform',
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
    const userOrResponse = await requirePermission(request, env, 'write', 'platform');
    if (userOrResponse instanceof Response) {
      return userOrResponse;
    }
    const user = userOrResponse;
    
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Platform ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing platform to check access and dependencies
    const existing = await env.DB.prepare('SELECT * FROM platforms WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Platform not found' }), {
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
    
    // Check if platform has instruments attached
    const instrumentCount = await env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM phenocams WHERE platform_id = ?) +
        (SELECT COUNT(*) FROM mspectral_sensors WHERE platform_id = ?) as count
    `).bind(id, id).first();
    
    if (instrumentCount && instrumentCount.count > 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete platform with attached instruments. Remove instruments first.' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete platform
    const result = await env.DB.prepare('DELETE FROM platforms WHERE id = ?').bind(id).run();
    
    if (!result.success) {
      throw new Error('Failed to delete platform');
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Platform deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Platform deletion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete platform',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}