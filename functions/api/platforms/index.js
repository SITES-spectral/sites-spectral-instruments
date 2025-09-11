// API handlers for platforms endpoint
// Returns platforms (instruments) grouped by unique platform combinations

export async function onRequestGet({ request, env, params }) {
  try {
    const url = new URL(request.url);
    const stationIdFilter = url.searchParams.get('station_id');
    
    // Build query to get unique platforms from both phenocams and mspectral_sensors
    let platforms = [];
    
    if (stationIdFilter) {
      // Get platforms for specific station
      const [phenocamPlatforms, sensorPlatforms] = await Promise.all([
        getPhenocamPlatforms(env.DB, stationIdFilter),
        getSensorPlatforms(env.DB, stationIdFilter)
      ]);
      
      platforms = [...phenocamPlatforms, ...sensorPlatforms];
    } else {
      // Get all platforms
      const [phenocamPlatforms, sensorPlatforms] = await Promise.all([
        getPhenocamPlatforms(env.DB),
        getSensorPlatforms(env.DB)
      ]);
      
      platforms = [...phenocamPlatforms, ...sensorPlatforms];
    }
    
    // Remove duplicates based on coordinates and station (in case instruments share exact locations)
    const uniquePlatforms = platforms.reduce((acc, platform) => {
      const key = `${platform.station_id}-${platform.latitude}-${platform.longitude}-${platform.location}`;
      if (!acc.some(p => `${p.station_id}-${p.latitude}-${p.longitude}-${p.location}` === key)) {
        acc.push(platform);
      }
      return acc;
    }, []);
    
    return new Response(JSON.stringify(uniquePlatforms), {
      headers: { 'Content-Type': 'application/json' }
    });
    
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

async function getPhenocamPlatforms(db, stationId = null) {
  let query = `
    SELECT DISTINCT
      p.canonical_id as platform_id,
      p.canonical_id as name,
      'phenocam' as type,
      p.status,
      p.location,
      p.latitude,
      p.longitude,
      p.station_id,
      s.display_name as station_name,
      s.acronym as station_acronym,
      p.thematic_program,
      p.created_at,
      p.updated_at,
      p.ecosystem
    FROM phenocams p
    JOIN stations s ON p.station_id = s.id
    WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
  `;
  
  const params = [];
  if (stationId) {
    query += ' AND p.station_id = ?';
    params.push(stationId);
  }
  
  query += ' ORDER BY s.display_name, p.canonical_id';
  
  const result = params.length > 0 
    ? await db.prepare(query).bind(...params).all()
    : await db.prepare(query).all();
    
  return result.results || [];
}

async function getSensorPlatforms(db, stationId = null) {
  let query = `
    SELECT DISTINCT
      m.canonical_id as platform_id,
      m.canonical_id as name,
      'mspectral_sensor' as type,
      m.status,
      m.location,
      m.latitude,
      m.longitude,
      m.station_id,
      s.display_name as station_name,
      s.acronym as station_acronym,
      m.thematic_program,
      m.created_at,
      m.updated_at,
      m.ecosystem,
      m.brand,
      m.model
    FROM mspectral_sensors m
    JOIN stations s ON m.station_id = s.id
    WHERE m.latitude IS NOT NULL AND m.longitude IS NOT NULL
  `;
  
  const params = [];
  if (stationId) {
    query += ' AND m.station_id = ?';
    params.push(stationId);
  }
  
  query += ' ORDER BY s.display_name, m.canonical_id';
  
  const result = params.length > 0 
    ? await db.prepare(query).bind(...params).all()
    : await db.prepare(query).all();
    
  return result.results || [];
}