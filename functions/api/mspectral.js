// API handlers for multispectral sensors endpoint
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