// API handlers for instruments endpoint - Uses new unified instruments table
import { getUserFromRequest, hasPermission } from '../../../src/auth-secrets.js';

export async function onRequestGet({ request, env, params }) {
  try {
    const user = await getUserFromRequest(request, env);
    const { id } = params;

    if (id) {
      // Get specific instrument from unified instruments table
      let query = `
        SELECT
          i.*,
          s.display_name as station_name,
          s.acronym as station_acronym,
          p.display_name as platform_name,
          p.name as platform_canonical_id
        FROM instruments i
        LEFT JOIN platforms p ON i.platform_id = p.id
        LEFT JOIN stations s ON p.station_id = s.id
        WHERE i.id = ?
      `;

      const instrument = await env.DB.prepare(query).bind(id).first();

      if (!instrument) {
        return new Response(JSON.stringify({
          error: 'Instrument not found',
          details: 'No instrument exists with the specified ID'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check station access for station users
      if (user && user.role === 'station') {
        // Get station_id from platform relationship
        const stationCheck = await env.DB.prepare(`
          SELECT p.station_id
          FROM instruments i
          LEFT JOIN platforms p ON i.platform_id = p.id
          WHERE i.id = ?
        `).bind(id).first();

        if (!stationCheck || stationCheck.station_id !== user.station_id) {
          return new Response(JSON.stringify({
            error: 'Access denied',
            details: 'You can only access instruments from your assigned station'
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify(instrument), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // List all instruments with enhanced filtering and error handling
      const url = new URL(request.url);
      const stationIdFilter = url.searchParams.get('station_id');
      const platformIdFilter = url.searchParams.get('platform_id');
      const instrumentTypeFilter = url.searchParams.get('instrument_type');
      const statusFilter = url.searchParams.get('status');

      let query = `
        SELECT
          i.*,
          s.display_name as station_name,
          s.acronym as station_acronym,
          p.display_name as platform_name,
          p.name as platform_canonical_id,
          p.type as platform_type
        FROM instruments i
        LEFT JOIN platforms p ON i.platform_id = p.id
        LEFT JOIN stations s ON p.station_id = s.id
        WHERE i.instrument_type = 'phenocam'
      `;

      const queryParams = [];

      // Apply station filtering based on user role
      if (user && user.role === 'station') {
        query += ' AND p.station_id = ?';
        queryParams.push(user.station_id);
      } else if (stationIdFilter) {
        query += ' AND p.station_id = ?';
        queryParams.push(stationIdFilter);
      }

      // Apply additional filters
      if (platformIdFilter) {
        query += ' AND i.platform_id = ?';
        queryParams.push(platformIdFilter);
      }

      // Temporarily disabled - only phenocams supported
      // if (instrumentTypeFilter) {
      //   query += ' AND i.instrument_type = ?';
      //   queryParams.push(instrumentTypeFilter);
      // }

      if (statusFilter) {
        query += ' AND i.status = ?';
        queryParams.push(statusFilter);
      }

      query += ' ORDER BY s.display_name, p.display_name, i.priority, i.canonical_id';

      const result = await env.DB.prepare(query).bind(...queryParams).all();

      return new Response(JSON.stringify({
        instruments: result.results || [],
        count: (result.results || []).length,
        filters: {
          station_id: stationIdFilter,
          platform_id: platformIdFilter,
          instrument_type: instrumentTypeFilter,
          status: statusFilter
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Instruments GET error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch instruments',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env, params }) {
  try {
    // Require authentication for creating instruments
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        details: 'You must be logged in to create instruments'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const instrumentData = await request.json();

    // Enhanced validation
    if (!instrumentData || typeof instrumentData !== 'object') {
      return new Response(JSON.stringify({
        error: 'Invalid request body',
        details: 'Request body must be a valid JSON object'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Required fields validation
    const requiredFields = ['canonical_id', 'instrument_type', 'platform_id'];
    const missingFields = requiredFields.filter(field => !instrumentData[field]);
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        details: `The following fields are required: ${missingFields.join(', ')}`,
        received_fields: Object.keys(instrumentData)
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate instrument type - currently only phenocam supported
    const validTypes = ['phenocam'];
    if (!validTypes.includes(instrumentData.instrument_type)) {
      return new Response(JSON.stringify({
        error: 'Invalid instrument type',
        details: `Currently only phenocam instruments are supported. Valid types: ${validTypes.join(', ')}`,
        received: instrumentData.instrument_type,
        note: 'Other instrument types will be available after database migration'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify platform exists and get station_id for permission check
    const platform = await env.DB.prepare('SELECT id, station_id FROM platforms WHERE id = ?')
      .bind(instrumentData.platform_id).first();

    if (!platform) {
      return new Response(JSON.stringify({
        error: 'Platform not found',
        details: 'The specified platform_id does not exist',
        platform_id: instrumentData.platform_id
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to create instrument for this station
    if (!hasPermission(user, 'write', 'instrument', platform.station_id)) {
      return new Response(JSON.stringify({
        error: 'Permission denied',
        details: 'You do not have permission to create instruments for this station'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicate canonical_id
    const existingInstrument = await env.DB.prepare(
      'SELECT id FROM instruments WHERE canonical_id = ?'
    ).bind(instrumentData.canonical_id).first();

    if (existingInstrument) {
      return new Response(JSON.stringify({
        error: 'Duplicate canonical_id',
        details: 'An instrument with this canonical_id already exists',
        canonical_id: instrumentData.canonical_id
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert new instrument with comprehensive error handling
    const insertQuery = `
      INSERT INTO instruments (
        canonical_id, instrument_type, platform_id, status,
        location, thematic_program, priority, ecosystem,
        legacy_acronym, legacy_name, model, serial_number,
        center_wavelength_nm, usage_type, brand_model,
        installation_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const insertResult = await env.DB.prepare(insertQuery).bind(
      instrumentData.canonical_id,
      instrumentData.instrument_type,
      instrumentData.platform_id,
      instrumentData.status || 'Active',
      instrumentData.location || null,
      instrumentData.thematic_program || 'SITES_Spectral',
      instrumentData.priority || 1,
      instrumentData.ecosystem || null,
      instrumentData.legacy_acronym || null,
      instrumentData.legacy_name || null,
      instrumentData.model || null,
      instrumentData.serial_number || null,
      instrumentData.center_wavelength_nm || null,
      instrumentData.usage_type || null,
      instrumentData.brand_model || null,
      instrumentData.installation_date || null
    ).run();

    if (!insertResult.success) {
      throw new Error('Database insert operation failed');
    }

    // Return the created instrument with all joined data
    const newInstrument = await env.DB.prepare(`
      SELECT
        i.*,
        s.display_name as station_name,
        s.acronym as station_acronym,
        p.display_name as platform_name,
        p.name as platform_canonical_id
      FROM instruments i
      LEFT JOIN platforms p ON i.platform_id = p.id
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE i.id = ?
    `).bind(insertResult.meta.last_row_id).first();

    return new Response(JSON.stringify({
      success: true,
      instrument: newInstrument,
      id: insertResult.meta.last_row_id
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Instruments POST error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create instrument',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    // Require authentication for updating instruments
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        details: 'You must be logged in to update instruments'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({
        error: 'Instrument ID required',
        details: 'No instrument ID provided in the request'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if instrument exists and get its station_id for permission check
    const existingInstrument = await env.DB.prepare(`
      SELECT i.*, p.station_id
      FROM instruments i
      LEFT JOIN platforms p ON i.platform_id = p.id
      WHERE i.id = ?
    `).bind(id).first();

    if (!existingInstrument) {
      return new Response(JSON.stringify({
        error: 'Instrument not found',
        details: 'No instrument exists with the specified ID',
        id: id
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to update this instrument
    if (!hasPermission(user, 'write', 'instrument', existingInstrument.station_id)) {
      return new Response(JSON.stringify({
        error: 'Permission denied',
        details: 'You do not have permission to update this instrument'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updateData = await request.json();

    if (!updateData || typeof updateData !== 'object') {
      return new Response(JSON.stringify({
        error: 'Invalid request body',
        details: 'Request body must be a valid JSON object'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updateFields = [];
    const updateValues = [];

    // Allowed fields for update
    const allowedUpdateFields = [
      'canonical_id', 'instrument_type', 'platform_id', 'status',
      'location', 'thematic_program', 'priority', 'ecosystem',
      'legacy_acronym', 'legacy_name', 'model', 'serial_number',
      'center_wavelength_nm', 'usage_type', 'brand_model', 'installation_date'
    ];

    for (const [field, value] of Object.entries(updateData)) {
      if (allowedUpdateFields.includes(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return new Response(JSON.stringify({
        error: 'No valid fields to update',
        details: `Valid fields are: ${allowedUpdateFields.join(', ')}`,
        received_fields: Object.keys(updateData)
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for canonical_id conflicts if changed
    if (updateData.canonical_id && updateData.canonical_id !== existingInstrument.canonical_id) {
      const conflict = await env.DB.prepare(
        'SELECT id FROM instruments WHERE canonical_id = ? AND id != ?'
      ).bind(updateData.canonical_id, id).first();

      if (conflict) {
        return new Response(JSON.stringify({
          error: 'Duplicate canonical_id',
          details: 'Another instrument with this canonical_id already exists',
          canonical_id: updateData.canonical_id
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate platform_id if changed
    if (updateData.platform_id && updateData.platform_id !== existingInstrument.platform_id) {
      const platform = await env.DB.prepare('SELECT id FROM platforms WHERE id = ?')
        .bind(updateData.platform_id).first();

      if (!platform) {
        return new Response(JSON.stringify({
          error: 'Platform not found',
          details: 'The specified platform_id does not exist',
          platform_id: updateData.platform_id
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    updateValues.push(id);

    const updateQuery = `
      UPDATE instruments
      SET ${updateFields.join(', ')}, updated_at = datetime('now')
      WHERE id = ?
    `;

    const updateResult = await env.DB.prepare(updateQuery).bind(...updateValues).run();

    if (!updateResult.success) {
      throw new Error('Database update operation failed');
    }

    // Return the updated instrument
    const updatedInstrument = await env.DB.prepare(`
      SELECT
        i.*,
        s.display_name as station_name,
        s.acronym as station_acronym,
        p.display_name as platform_name,
        p.name as platform_canonical_id
      FROM instruments i
      LEFT JOIN platforms p ON i.platform_id = p.id
      LEFT JOIN stations s ON p.station_id = s.id
      WHERE i.id = ?
    `).bind(id).first();

    return new Response(JSON.stringify({
      success: true,
      instrument: updatedInstrument
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Instruments PUT error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update instrument',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    // Require authentication for deleting instruments
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        details: 'You must be logged in to delete instruments'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({
        error: 'Instrument ID required',
        details: 'No instrument ID provided in the request'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if instrument exists and get its station_id for permission check
    const instrumentToDelete = await env.DB.prepare(`
      SELECT i.*, p.station_id
      FROM instruments i
      LEFT JOIN platforms p ON i.platform_id = p.id
      WHERE i.id = ?
    `).bind(id).first();

    if (!instrumentToDelete) {
      return new Response(JSON.stringify({
        error: 'Instrument not found',
        details: 'No instrument exists with the specified ID',
        id: id
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to delete this instrument
    if (!hasPermission(user, 'delete', 'instrument', instrumentToDelete.station_id)) {
      return new Response(JSON.stringify({
        error: 'Permission denied',
        details: 'You do not have permission to delete this instrument'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if instrument has dependencies (ROIs, etc.)
    const dependencyCheck = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM instrument_rois WHERE instrument_id = ?
    `).bind(id).first();

    if (dependencyCheck && dependencyCheck.count > 0) {
      return new Response(JSON.stringify({
        error: 'Cannot delete instrument with dependencies',
        details: 'This instrument has ROI records. Please remove them first or archive the instrument instead.',
        dependencies: {
          roi_count: dependencyCheck.count
        }
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deleteResult = await env.DB.prepare('DELETE FROM instruments WHERE id = ?').bind(id).run();

    if (!deleteResult.success) {
      throw new Error('Database delete operation failed');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Instrument deleted successfully',
      deleted_instrument: {
        id: instrumentToDelete.id,
        canonical_id: instrumentToDelete.canonical_id
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Instruments DELETE error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete instrument',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}