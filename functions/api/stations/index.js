// Cloudflare Worker function for Stations API
export async function onRequestGet({ request, env, params }) {
    const url = new URL(request.url);
    const stationId = params.id;

    try {
        if (stationId) {
            // Get single station
            return await getStation(env.DB, stationId);
        } else {
            // Get all stations
            return await getStations(env.DB, url.searchParams);
        }
    } catch (error) {
        console.error('Stations API Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();
        return await createStation(env.DB, data);
    } catch (error) {
        console.error('Create Station Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to create station',
            message: error.message 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestPut({ request, env, params }) {
    try {
        const data = await request.json();
        return await updateStation(env.DB, params.id, data);
    } catch (error) {
        console.error('Update Station Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to update station',
            message: error.message 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestDelete({ env, params }) {
    try {
        return await deleteStation(env.DB, params.id);
    } catch (error) {
        console.error('Delete Station Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to delete station',
            message: error.message 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Station CRUD operations
async function getStations(db, searchParams) {
    const region = searchParams.get('region');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;

    let query = `
        SELECT 
            s.*,
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
        WHERE 1=1
    `;
    
    const params = [];

    if (region) {
        query += ` AND s.region = ?`;
        params.push(region);
    }

    if (search) {
        query += ` AND (
            s.display_name LIKE ? OR 
            s.normalized_name LIKE ? OR 
            s.acronym LIKE ? OR
            s.description LIKE ?
        )`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY s.id ORDER BY s.display_name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Get count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM stations WHERE 1=1`;
    const countParams = [];

    if (region) {
        countQuery += ` AND region = ?`;
        countParams.push(region);
    }

    if (search) {
        countQuery += ` AND (display_name LIKE ? OR normalized_name LIKE ? OR acronym LIKE ? OR description LIKE ?)`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [stations, countResult] = await Promise.all([
        db.prepare(query).bind(...params).all(),
        db.prepare(countQuery).bind(...countParams).first()
    ]);

    return new Response(JSON.stringify({
        stations: stations.results || [],
        pagination: {
            page,
            limit,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / limit)
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function getStation(db, id) {
    const station = await db.prepare(`
        SELECT 
            s.*,
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
            WHERE station_id = ?
            GROUP BY station_id
        ) p ON s.id = p.station_id
        LEFT JOIN (
            SELECT 
                station_id, 
                COUNT(*) as sensor_count,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_sensors
            FROM mspectral_sensors 
            WHERE station_id = ?
            GROUP BY station_id
        ) m ON s.id = m.station_id
        WHERE s.id = ?
    `).bind(id, id, id).first();

    if (!station) {
        return new Response(JSON.stringify({ error: 'Station not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Get station instruments (phenocams and multispectral sensors)
    const [phenocams, sensors] = await Promise.all([
        db.prepare(`
            SELECT 'phenocam' as type, canonical_id, status, ecosystem, location, 
                   latitude, longitude, created_at, updated_at
            FROM phenocams
            WHERE station_id = ?
            ORDER BY canonical_id
        `).bind(id).all(),
        db.prepare(`
            SELECT 'mspectral_sensor' as type, canonical_id, status, ecosystem, location,
                   latitude, longitude, brand, model, center_wavelength_nm, usage_type,
                   created_at, updated_at
            FROM mspectral_sensors
            WHERE station_id = ?
            ORDER BY canonical_id
        `).bind(id).all()
    ]);

    const instruments = [
        ...(phenocams.results || []),
        ...(sensors.results || [])
    ];

    // Map fields to match frontend expectations
    const stationResponse = {
        ...station,
        name: station.display_name, // Map display_name to name for frontend compatibility
        location: station.region || station.country || 'Unknown', // Provide location field
        status: 'Active', // Default status
        instruments
    };

    return new Response(JSON.stringify(stationResponse), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function createStation(db, data) {
    // Validate required fields
    const required = ['normalized_name', 'display_name', 'acronym'];
    for (const field of required) {
        if (!data[field]) {
            return new Response(JSON.stringify({ 
                error: 'Validation failed',
                message: `${field} is required` 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Check for unique constraints
    const existing = await db.prepare(`
        SELECT id FROM stations 
        WHERE normalized_name = ? OR acronym = ?
    `).bind(data.normalized_name, data.acronym).first();

    if (existing) {
        return new Response(JSON.stringify({ 
            error: 'Validation failed',
            message: 'Station with this normalized name or acronym already exists' 
        }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Insert new station
    const result = await db.prepare(`
        INSERT INTO stations (
            normalized_name, display_name, acronym, country, region,
            established_date, description, website_url, contact_email,
            latitude, longitude, elevation_m, timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        data.normalized_name,
        data.display_name,
        data.acronym,
        data.country || 'Sweden',
        data.region,
        data.established_date || null,
        data.description || null,
        data.website_url || null,
        data.contact_email || null,
        data.latitude || null,
        data.longitude || null,
        data.elevation_m || null,
        data.timezone || 'Europe/Stockholm'
    ).run();

    // Get the created station
    const station = await db.prepare(`
        SELECT * FROM stations WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify(station), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function updateStation(db, id, data) {
    // Check if station exists
    const existing = await db.prepare(`
        SELECT * FROM stations WHERE id = ?
    `).bind(id).first();

    if (!existing) {
        return new Response(JSON.stringify({ error: 'Station not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Check for unique constraints (excluding current station)
    if (data.normalized_name || data.acronym) {
        const conflict = await db.prepare(`
            SELECT id FROM stations 
            WHERE (normalized_name = ? OR acronym = ?) AND id != ?
        `).bind(
            data.normalized_name || existing.normalized_name,
            data.acronym || existing.acronym,
            id
        ).first();

        if (conflict) {
            return new Response(JSON.stringify({ 
                error: 'Validation failed',
                message: 'Station with this normalized name or acronym already exists' 
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Update station
    await db.prepare(`
        UPDATE stations SET
            normalized_name = COALESCE(?, normalized_name),
            display_name = COALESCE(?, display_name),
            acronym = COALESCE(?, acronym),
            country = COALESCE(?, country),
            region = COALESCE(?, region),
            established_date = COALESCE(?, established_date),
            description = COALESCE(?, description),
            website_url = COALESCE(?, website_url),
            contact_email = COALESCE(?, contact_email),
            latitude = COALESCE(?, latitude),
            longitude = COALESCE(?, longitude),
            elevation_m = COALESCE(?, elevation_m),
            timezone = COALESCE(?, timezone),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).bind(
        data.normalized_name || null,
        data.display_name || null,
        data.acronym || null,
        data.country || null,
        data.region || null,
        data.established_date || null,
        data.description || null,
        data.website_url || null,
        data.contact_email || null,
        data.latitude || null,
        data.longitude || null,
        data.elevation_m || null,
        data.timezone || null,
        id
    ).run();

    // Get updated station
    const station = await db.prepare(`
        SELECT * FROM stations WHERE id = ?
    `).bind(id).first();

    return new Response(JSON.stringify(station), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function deleteStation(db, id) {
    // Check if station exists and has instruments
    const [station, phenocamCount, sensorCount] = await Promise.all([
        db.prepare(`SELECT * FROM stations WHERE id = ?`).bind(id).first(),
        db.prepare(`SELECT COUNT(*) as count FROM phenocams WHERE station_id = ?`).bind(id).first(),
        db.prepare(`SELECT COUNT(*) as count FROM mspectral_sensors WHERE station_id = ?`).bind(id).first()
    ]);

    if (!station) {
        return new Response(JSON.stringify({ error: 'Station not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const totalInstruments = phenocamCount.count + sensorCount.count;

    // Delete station (cascade will handle instruments)
    await db.prepare(`DELETE FROM stations WHERE id = ?`).bind(id).run();

    return new Response(JSON.stringify({ 
        message: 'Station deleted successfully',
        deleted_instruments: totalInstruments
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}