// API handlers for phenocams endpoint
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