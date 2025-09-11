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
            s.ecosystem,
            s.station_type,
            COALESCE(p.phenocam_count, 0) + COALESCE(m.sensor_count, 0) as instrument_count,
            COALESCE(p.active_phenocams, 0) + COALESCE(m.active_sensors, 0) as active_instruments,
            COALESCE(p.phenocam_count, 0) as phenocam_count,
            COALESCE(m.sensor_count, 0) as sensor_count
        FROM stations s
        LEFT JOIN (
            SELECT 
                station_id, 
                COUNT(*) as phenocam_count,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_phenocams
            FROM phenocams 
            GROUP BY station_id
        ) p ON s.id = p.station_id
        LEFT JOIN (
            SELECT 
                station_id, 
                COUNT(*) as sensor_count,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_sensors
            FROM mspectral_sensors 
            GROUP BY station_id
        ) m ON s.id = m.station_id
        WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
        ORDER BY s.display_name
    `;

    const stations = await db.prepare(query).all();
    const features = [];

    for (const station of stations.results || []) {
        let instruments = [];
        
        if (includeInstruments) {
            // Get instruments for this station
            const [phenocams, sensors] = await Promise.all([
                db.prepare(`
                    SELECT 'phenocam' as type, canonical_id, status, ecosystem, location, 
                           latitude, longitude, created_at, updated_at
                    FROM phenocams
                    WHERE station_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
                    ORDER BY canonical_id
                `).bind(station.id).all(),
                db.prepare(`
                    SELECT 'mspectral_sensor' as type, canonical_id, status, ecosystem, location,
                           latitude, longitude, brand, model, center_wavelength_nm, usage_type,
                           created_at, updated_at
                    FROM mspectral_sensors
                    WHERE station_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
                    ORDER BY canonical_id
                `).bind(station.id).all()
            ]);
            
            instruments = [
                ...(phenocams.results || []),
                ...(sensors.results || [])
            ];
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
                ecosystem: station.ecosystem,
                station_type: station.station_type,
                instrument_count: station.instrument_count,
                active_instruments: station.active_instruments,
                phenocam_count: station.phenocam_count,
                sensor_count: station.sensor_count,
                instruments: includeInstruments ? instruments : undefined
            }
        };

        features.push(feature);
    }

    return features;
}

async function getPlatformsGeoJSON(db) {
    // First, let's check what tables exist for platforms/instruments
    const phenocamsQuery = `
        SELECT 
            p.id,
            p.canonical_id as platform_id,
            p.canonical_id as name,
            'phenocam' as type,
            p.status,
            p.ecosystem,
            p.location,
            p.latitude,
            p.longitude,
            NULL as platform_height_m,
            p.station_id,
            s.display_name as station_name,
            s.acronym as station_acronym,
            'SITES_Spectral' as thematic_program,
            p.created_at,
            p.updated_at
        FROM phenocams p
        JOIN stations s ON p.station_id = s.id
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        ORDER BY s.display_name, p.canonical_id
    `;

    const sensorsQuery = `
        SELECT 
            m.id,
            m.canonical_id as platform_id,
            m.canonical_id as name,
            'mspectral_sensor' as type,
            m.status,
            m.ecosystem,
            m.location,
            m.latitude,
            m.longitude,
            NULL as platform_height_m,
            m.station_id,
            s.display_name as station_name,
            s.acronym as station_acronym,
            'SITES_Spectral' as thematic_program,
            m.created_at,
            m.updated_at,
            m.brand,
            m.model,
            m.center_wavelength_nm,
            m.usage_type
        FROM mspectral_sensors m
        JOIN stations s ON m.station_id = s.id
        WHERE m.latitude IS NOT NULL AND m.longitude IS NOT NULL
        ORDER BY s.display_name, m.canonical_id
    `;

    const [phenocams, sensors] = await Promise.all([
        db.prepare(phenocamsQuery).all(),
        db.prepare(sensorsQuery).all()
    ]);

    const features = [];
    
    // Add phenocam features
    for (const platform of phenocams.results || []) {
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(platform.longitude), parseFloat(platform.latitude)]
            },
            properties: {
                id: platform.id,
                type: 'platform',
                platform_type: platform.type,
                platform_id: platform.platform_id,
                name: platform.name,
                status: platform.status,
                ecosystem: platform.ecosystem,
                location: platform.location,
                platform_height_m: platform.platform_height_m,
                station_id: platform.station_id,
                station_name: platform.station_name,
                station_acronym: platform.station_acronym,
                thematic_program: platform.thematic_program,
                created_at: platform.created_at,
                updated_at: platform.updated_at
            }
        };
        features.push(feature);
    }
    
    // Add sensor features
    for (const platform of sensors.results || []) {
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(platform.longitude), parseFloat(platform.latitude)]
            },
            properties: {
                id: platform.id,
                type: 'platform',
                platform_type: platform.type,
                platform_id: platform.platform_id,
                name: platform.name,
                status: platform.status,
                ecosystem: platform.ecosystem,
                location: platform.location,
                platform_height_m: platform.platform_height_m,
                station_id: platform.station_id,
                station_name: platform.station_name,
                station_acronym: platform.station_acronym,
                thematic_program: platform.thematic_program,
                brand: platform.brand,
                model: platform.model,
                center_wavelength_nm: platform.center_wavelength_nm,
                usage_type: platform.usage_type,
                created_at: platform.created_at,
                updated_at: platform.updated_at
            }
        };
        features.push(feature);
    }

    return features;
}