// Cloudflare Worker function for GeoJSON API
export async function onRequestGet({ request, env, params }) {
    const url = new URL(request.url);
    const type = params.type || 'all'; // 'stations', 'platforms', or 'all'

    try {
        return await getGeoJSON(env.DB, type, url.searchParams);
    } catch (error) {
        console.error('GeoJSON API Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function getGeoJSON(db, type, searchParams) {
    const includeInstruments = searchParams.get('include_instruments') === 'true';
    
    let features = [];
    
    if (type === 'stations' || type === 'all') {
        const stationsFeatures = await getStationsGeoJSON(db, includeInstruments);
        features = features.concat(stationsFeatures);
    }
    
    if (type === 'platforms' || type === 'all') {
        const platformsFeatures = await getPlatformsGeoJSON(db);
        features = features.concat(platformsFeatures);
    }

    const geoJSON = {
        type: 'FeatureCollection',
        features: features,
        metadata: {
            generated_at: new Date().toISOString(),
            total_features: features.length,
            type: type
        }
    };

    return new Response(JSON.stringify(geoJSON), {
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
    });
}

async function getStationsGeoJSON(db, includeInstruments = false) {
    let query = `
        SELECT 
            s.id,
            s.normalized_name,
            s.display_name,
            s.acronym,
            s.country,
            s.region,
            s.latitude,
            s.longitude,
            s.elevation_m,
            s.established_date,
            s.description,
            s.website_url,
            s.contact_email,
            s.timezone,
            COALESCE(i.instrument_count, 0) as instrument_count,
            COALESCE(i.active_instruments, 0) as active_instruments,
            COALESCE(i.phenocam_count, 0) as phenocam_count,
            0 as sensor_count
        FROM stations s
        LEFT JOIN (
            SELECT
                p.station_id,
                COUNT(i.id) as instrument_count,
                COUNT(CASE WHEN i.status = 'Active' THEN 1 END) as active_instruments,
                COUNT(CASE WHEN i.instrument_type = 'phenocam' THEN 1 END) as phenocam_count
            FROM platforms p
            LEFT JOIN instruments i ON p.id = i.platform_id
            WHERE i.instrument_type = 'phenocam' OR i.instrument_type IS NULL
            GROUP BY p.station_id
        ) i ON s.id = i.station_id
        WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
        ORDER BY s.display_name
    `;

    const stations = await db.prepare(query).all();
    const features = [];

    for (const station of stations.results || []) {
        let instruments = [];
        
        if (includeInstruments) {
            // Get phenocam instruments only for this station
            const instrumentsResult = await db.prepare(`
                SELECT
                    i.instrument_type as type,
                    i.canonical_id,
                    i.status,
                    i.ecosystem,
                    i.location,
                    p.latitude,
                    p.longitude,
                    i.model,
                    i.brand_model,
                    i.created_at,
                    i.updated_at
                FROM instruments i
                JOIN platforms p ON i.platform_id = p.id
                WHERE p.station_id = ? AND i.instrument_type = 'phenocam'
                  AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
                ORDER BY i.canonical_id
            `).bind(station.id).all();

            instruments = instrumentsResult.results || [];
        }

        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(station.longitude), parseFloat(station.latitude)]
            },
            properties: {
                id: station.id,
                type: 'station',
                name: station.display_name,
                normalized_name: station.normalized_name,
                acronym: station.acronym,
                country: station.country,
                region: station.region,
                elevation_m: station.elevation_m,
                established_date: station.established_date,
                description: station.description,
                website_url: station.website_url,
                contact_email: station.contact_email,
                timezone: station.timezone,
                ecosystem: null, // Not in database schema
                station_type: 'Research Station', // Default value
                instrument_count: station.instrument_count,
                active_instruments: station.active_instruments,
                phenocam_count: station.phenocam_count,
                sensor_count: 0, // Temporarily disabled during migration
                instruments: includeInstruments ? instruments : undefined
            }
        };

        features.push(feature);
    }

    return features;
}

async function getPlatformsGeoJSON(db) {
    // Get platforms with phenocam instruments only
    const platformsQuery = `
        SELECT
            p.id,
            p.canonical_id as platform_id,
            p.display_name as name,
            p.type as platform_type,
            p.latitude,
            p.longitude,
            p.elevation_m,
            p.platform_height_m,
            p.status,
            p.structure_material,
            p.foundation_type,
            p.access_method,
            p.installation_date,
            p.description,
            p.station_id,
            s.display_name as station_name,
            s.acronym as station_acronym,
            COUNT(i.id) as instrument_count,
            COUNT(CASE WHEN i.status = 'Active' THEN 1 END) as active_instruments,
            p.created_at,
            p.updated_at
        FROM platforms p
        JOIN stations s ON p.station_id = s.id
        LEFT JOIN instruments i ON p.id = i.platform_id AND i.instrument_type = 'phenocam'
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        GROUP BY p.id, p.canonical_id, p.display_name, p.type, p.latitude, p.longitude,
                 p.elevation_m, p.platform_height_m, p.status, p.structure_material,
                 p.foundation_type, p.access_method, p.installation_date, p.description,
                 p.station_id, s.display_name, s.acronym, p.created_at, p.updated_at
        HAVING instrument_count > 0
        ORDER BY s.display_name, p.canonical_id
    `;

    const platforms = await db.prepare(platformsQuery).all();
    const features = [];

    // Add platform features with phenocam instruments
    for (const platform of platforms.results || []) {
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(platform.longitude), parseFloat(platform.latitude)]
            },
            properties: {
                id: platform.id,
                type: 'platform',
                platform_type: platform.platform_type,
                platform_id: platform.platform_id,
                name: platform.name,
                status: platform.status,
                elevation_m: platform.elevation_m,
                platform_height_m: platform.platform_height_m,
                structure_material: platform.structure_material,
                foundation_type: platform.foundation_type,
                access_method: platform.access_method,
                installation_date: platform.installation_date,
                description: platform.description,
                station_id: platform.station_id,
                station_name: platform.station_name,
                station_acronym: platform.station_acronym,
                instrument_count: platform.instrument_count,
                active_instruments: platform.active_instruments,
                thematic_program: 'SITES_Spectral',
                created_at: platform.created_at,
                updated_at: platform.updated_at,
                note: 'Only phenocam instruments shown during database migration'
            }
        };
        features.push(feature);
    }

    return features;
}