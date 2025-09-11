// API handlers for network statistics endpoint
export async function onRequestGet({ request, env }) {
  try {
    // Get comprehensive network statistics
    const [stationsStats, phenocamsStats, mspectralStats] = await Promise.all([
      // Stations statistics
      env.DB.prepare(`
        SELECT 
          COUNT(*) as total_stations,
          COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as stations_with_coordinates,
          COUNT(DISTINCT region) as unique_regions,
          COUNT(DISTINCT country) as unique_countries
        FROM stations
      `).first(),
      
      // Phenocams statistics  
      env.DB.prepare(`
        SELECT 
          COUNT(*) as total_phenocams,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_phenocams,
          COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive_phenocams,
          COUNT(DISTINCT station_id) as stations_with_phenocams,
          COUNT(CASE WHEN thematic_program = 'SITES_Spectral' THEN 1 END) as sites_spectral_phenocams,
          COUNT(CASE WHEN thematic_program = 'ICOS' THEN 1 END) as icos_phenocams
        FROM phenocams
      `).first(),
      
      // Multispectral sensors statistics
      env.DB.prepare(`
        SELECT 
          COUNT(*) as total_mspectral_sensors,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_mspectral_sensors,
          COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive_mspectral_sensors,
          COUNT(DISTINCT station_id) as stations_with_mspectral,
          COUNT(CASE WHEN thematic_program = 'SITES_Spectral' THEN 1 END) as sites_spectral_sensors,
          COUNT(CASE WHEN thematic_program = 'ICOS' THEN 1 END) as icos_sensors,
          COUNT(DISTINCT brand) as unique_brands,
          COUNT(DISTINCT model) as unique_models
        FROM mspectral_sensors
      `).first()
    ]);

    // Calculate combined statistics
    const totalInstruments = phenocamsStats.total_phenocams + mspectralStats.total_mspectral_sensors;
    const activeInstruments = phenocamsStats.active_phenocams + mspectralStats.active_mspectral_sensors;
    const inactiveInstruments = phenocamsStats.inactive_phenocams + mspectralStats.inactive_mspectral_sensors;

    // Get recent deployment statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const recentDeployments = await env.DB.prepare(`
      SELECT 
        COUNT(*) as recent_deployments
      FROM (
        SELECT created_at FROM phenocams WHERE created_at >= ?
        UNION ALL
        SELECT created_at FROM mspectral_sensors WHERE created_at >= ?
      )
    `).bind(thirtyDaysAgoISO, thirtyDaysAgoISO).first();

    const networkStats = {
      stations: {
        total: stationsStats.total_stations,
        with_coordinates: stationsStats.stations_with_coordinates,
        unique_regions: stationsStats.unique_regions,
        unique_countries: stationsStats.unique_countries
      },
      instruments: {
        total: totalInstruments,
        active: activeInstruments,
        inactive: inactiveInstruments,
        phenocams: {
          total: phenocamsStats.total_phenocams,
          active: phenocamsStats.active_phenocams,
          inactive: phenocamsStats.inactive_phenocams,
          stations_with_phenocams: phenocamsStats.stations_with_phenocams,
          sites_spectral: phenocamsStats.sites_spectral_phenocams,
          icos: phenocamsStats.icos_phenocams
        },
        mspectral_sensors: {
          total: mspectralStats.total_mspectral_sensors,
          active: mspectralStats.active_mspectral_sensors,
          inactive: mspectralStats.inactive_mspectral_sensors,
          stations_with_mspectral: mspectralStats.stations_with_mspectral,
          sites_spectral: mspectralStats.sites_spectral_sensors,
          icos: mspectralStats.icos_sensors,
          unique_brands: mspectralStats.unique_brands,
          unique_models: mspectralStats.unique_models
        }
      },
      programs: {
        sites_spectral_instruments: phenocamsStats.sites_spectral_phenocams + mspectralStats.sites_spectral_sensors,
        icos_instruments: phenocamsStats.icos_phenocams + mspectralStats.icos_sensors
      },
      recent_activity: {
        deployments_last_30_days: recentDeployments.recent_deployments
      },
      generated_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(networkStats), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Network stats GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch network statistics',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}