// API handlers for recent activity endpoint
export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50); // Max 50 items
    
    // Get recent activity from both phenocams and mspectral_sensors tables
    // This creates a synthetic activity feed based on created_at and updated_at timestamps
    
    const activities = await env.DB.prepare(`
      SELECT 
        'instrument_created' as activity_type,
        'phenocam' as instrument_type,
        p.canonical_id as instrument_name,
        p.station_id,
        s.display_name as station_name,
        s.acronym as station_acronym,
        p.status,
        p.thematic_program,
        p.created_at as timestamp,
        p.created_at,
        p.updated_at
      FROM phenocams p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.created_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'instrument_created' as activity_type,
        'mspectral_sensor' as instrument_type,
        m.canonical_id as instrument_name,
        m.station_id,
        s.display_name as station_name,
        s.acronym as station_acronym,
        m.status,
        m.thematic_program,
        m.created_at as timestamp,
        m.created_at,
        m.updated_at
      FROM mspectral_sensors m
      LEFT JOIN stations s ON m.station_id = s.id
      WHERE m.created_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'instrument_updated' as activity_type,
        'phenocam' as instrument_type,
        p.canonical_id as instrument_name,
        p.station_id,
        s.display_name as station_name,
        s.acronym as station_acronym,
        p.status,
        p.thematic_program,
        p.updated_at as timestamp,
        p.created_at,
        p.updated_at
      FROM phenocams p
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE p.updated_at IS NOT NULL 
        AND p.updated_at != p.created_at
      
      UNION ALL
      
      SELECT 
        'instrument_updated' as activity_type,
        'mspectral_sensor' as instrument_type,
        m.canonical_id as instrument_name,
        m.station_id,
        s.display_name as station_name,
        s.acronym as station_acronym,
        m.status,
        m.thematic_program,
        m.updated_at as timestamp,
        m.created_at,
        m.updated_at
      FROM mspectral_sensors m
      LEFT JOIN stations s ON m.station_id = s.id
      WHERE m.updated_at IS NOT NULL 
        AND m.updated_at != m.created_at
      
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(limit).all();

    // Format activities for frontend consumption
    const formattedActivities = (activities.results || []).map(activity => {
      const timeAgo = getTimeAgo(new Date(activity.timestamp));
      
      let description, icon, actionText;
      
      if (activity.activity_type === 'instrument_created') {
        icon = activity.instrument_type === 'phenocam' ? 'fa-camera' : 'fa-eye';
        actionText = 'deployed';
        description = `${activity.instrument_type === 'phenocam' ? 'Phenocam' : 'Multispectral sensor'} ${activity.instrument_name} deployed at ${activity.station_name}`;
      } else if (activity.activity_type === 'instrument_updated') {
        icon = 'fa-edit';
        actionText = 'updated';
        description = `${activity.instrument_type === 'phenocam' ? 'Phenocam' : 'Multispectral sensor'} ${activity.instrument_name} updated at ${activity.station_name}`;
      }

      return {
        id: `${activity.activity_type}_${activity.instrument_type}_${activity.station_id}_${activity.timestamp}`,
        type: activity.activity_type,
        instrument_type: activity.instrument_type,
        instrument_name: activity.instrument_name,
        station_id: activity.station_id,
        station_name: activity.station_name,
        station_acronym: activity.station_acronym,
        description,
        icon,
        action_text: actionText,
        status: activity.status,
        program: activity.thematic_program,
        timestamp: activity.timestamp,
        time_ago: timeAgo,
        created_at: activity.created_at,
        updated_at: activity.updated_at
      };
    });

    return new Response(JSON.stringify({
      activities: formattedActivities,
      total_returned: formattedActivities.length,
      limit: limit,
      generated_at: new Date().toISOString()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });
    
  } catch (error) {
    console.error('Recent activity GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch recent activity',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const secondsAgo = Math.floor((now - date) / 1000);
  
  if (secondsAgo < 60) {
    return 'just now';
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (secondsAgo < 2592000) {
    const days = Math.floor(secondsAgo / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}