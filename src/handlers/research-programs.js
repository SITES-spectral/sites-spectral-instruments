// Research Programs Handler Module
// API endpoints for multiselect support and research program management

import { requireAuthentication } from '../auth/permissions.js';
import { executeQuery, executeQueryFirst } from '../utils/database.js';
import {
  createSuccessResponse,
  createErrorResponse,
  createMethodNotAllowedResponse
} from '../utils/responses.js';

/**
 * Handle research programs requests
 * @param {string} method - HTTP method
 * @param {string} id - Program identifier (optional)
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Research programs response
 */
export async function handleResearchPrograms(method, id, request, env) {
  if (!['GET'].includes(method)) {
    return createMethodNotAllowedResponse();
  }

  // Authentication required for research programs access
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user; // Return error response
  }

  try {
    switch (method) {
      case 'GET':
        if (id) {
          return await getResearchProgramById(id, env);
        } else {
          return await getResearchProgramsList(request, env);
        }

      default:
        return createMethodNotAllowedResponse();
    }
  } catch (error) {
    console.error('Research programs handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get list of research programs for multiselect components
 * @param {Request} request - The request object (for query parameters)
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Research programs list response
 */
async function getResearchProgramsList(request, env) {
  const url = new URL(request.url);
  const activeOnly = url.searchParams.get('active') === 'true';
  const withStats = url.searchParams.get('stats') === 'true';

  let query = `
    SELECT rp.id, rp.program_code, rp.program_name, rp.description,
           rp.start_year, rp.end_year, rp.is_active, rp.created_at
  `;

  if (withStats) {
    query += `,
           COUNT(DISTINCT p.id) as platform_count,
           COUNT(DISTINCT s.id) as station_count,
           COUNT(DISTINCT i.id) as instrument_count
    `;
  }

  query += `
    FROM research_programs rp
  `;

  if (withStats) {
    query += `
    LEFT JOIN platforms p ON p.research_programs LIKE '%' || rp.program_code || '%'
    LEFT JOIN stations s ON p.station_id = s.id
    LEFT JOIN instruments i ON i.platform_id = p.id
    `;
  }

  let whereConditions = [];
  let params = [];

  if (activeOnly) {
    whereConditions.push('rp.is_active = ?');
    params.push(true);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  if (withStats) {
    query += ' GROUP BY rp.id';
  }

  query += ' ORDER BY rp.program_name';

  const result = await executeQuery(env, query, params, 'getResearchProgramsList');

  return createSuccessResponse({
    research_programs: result?.results || [],
    total_count: result?.results?.length || 0,
    filters_applied: {
      active_only: activeOnly,
      with_statistics: withStats
    }
  });
}

/**
 * Get specific research program by ID with detailed statistics
 * @param {string} id - Research program ID
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Research program data response
 */
async function getResearchProgramById(id, env) {
  const query = `
    SELECT rp.id, rp.program_code, rp.program_name, rp.description,
           rp.start_year, rp.end_year, rp.is_active, rp.created_at,
           COUNT(DISTINCT p.id) as platform_count,
           COUNT(DISTINCT s.id) as station_count,
           COUNT(DISTINCT i.id) as instrument_count,
           COUNT(DISTINCT ir.id) as roi_count
    FROM research_programs rp
    LEFT JOIN platforms p ON p.research_programs LIKE '%' || rp.program_code || '%'
    LEFT JOIN stations s ON p.station_id = s.id
    LEFT JOIN instruments i ON i.platform_id = p.id
    LEFT JOIN instrument_rois ir ON i.id = ir.instrument_id
    WHERE rp.id = ?
    GROUP BY rp.id
  `;

  const result = await executeQueryFirst(env, query, [id], 'getResearchProgramById');

  if (!result) {
    return createErrorResponse('Research program not found', 404);
  }

  // Get participating platforms details
  const platformsQuery = `
    SELECT p.id, p.normalized_name, p.display_name, p.location_code,
           s.acronym as station_acronym, s.display_name as station_name,
           COUNT(i.id) as instrument_count
    FROM platforms p
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN instruments i ON i.platform_id = p.id
    WHERE p.research_programs LIKE '%' || ? || '%'
    GROUP BY p.id
    ORDER BY s.acronym, p.location_code
  `;

  const platforms = await executeQuery(env, platformsQuery, [result.program_code], 'getResearchProgramPlatforms');

  return createSuccessResponse({
    ...result,
    participating_platforms: platforms?.results || []
  });
}

/**
 * Get unique research programs values for multiselect autocomplete
 * @param {Request} request - The request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} Unique values response
 */
export async function getResearchProgramsValues(request, env) {
  // Authentication required
  const user = await requireAuthentication(request, env);
  if (user instanceof Response) {
    return user;
  }

  try {
    // Get all unique research program codes from platforms
    const platformProgramsQuery = `
      SELECT DISTINCT TRIM(value) as program_code
      FROM platforms p,
           json_each('[' || '"' || REPLACE(REPLACE(p.research_programs, ', ', '","'), ',', '","') || '"' || ']')
      WHERE p.research_programs IS NOT NULL
        AND p.research_programs != ''
        AND TRIM(value) != ''
    `;

    const platformPrograms = await executeQuery(env, platformProgramsQuery, [], 'getPlatformResearchPrograms');

    // Get all available research programs from lookup table
    const allProgramsQuery = `
      SELECT program_code, program_name, is_active
      FROM research_programs
      WHERE is_active = true
      ORDER BY program_name
    `;

    const allPrograms = await executeQuery(env, allProgramsQuery, [], 'getAllResearchPrograms');

    // Combine and format for multiselect component
    const usedPrograms = new Set((platformPrograms?.results || []).map(r => r.program_code));
    const availablePrograms = (allPrograms?.results || []).map(prog => ({
      value: prog.program_code,
      label: prog.program_name,
      code: prog.program_code,
      is_active: prog.is_active,
      is_used: usedPrograms.has(prog.program_code)
    }));

    return createSuccessResponse({
      programs: availablePrograms,
      summary: {
        total_available: availablePrograms.length,
        currently_used: usedPrograms.size,
        unused_programs: availablePrograms.filter(p => !p.is_used).length
      }
    });

  } catch (error) {
    console.error('Research programs values error:', error);
    return createErrorResponse('Failed to fetch research programs values', 500);
  }
}

/**
 * Parse comma-separated research programs string into array
 * @param {string} programsString - Comma-separated programs
 * @returns {Array} Array of program codes
 */
export function parseResearchPrograms(programsString) {
  if (!programsString || typeof programsString !== 'string') {
    return [];
  }

  return programsString
    .split(',')
    .map(code => code.trim())
    .filter(code => code.length > 0);
}

/**
 * Format research programs array into comma-separated string
 * @param {Array} programsArray - Array of program codes
 * @returns {string} Comma-separated programs string
 */
export function formatResearchPrograms(programsArray) {
  if (!Array.isArray(programsArray)) {
    return '';
  }

  return programsArray
    .filter(code => code && typeof code === 'string' && code.trim().length > 0)
    .map(code => code.trim())
    .join(', ');
}

/**
 * Validate research programs against lookup table
 * @param {Array} programCodes - Array of program codes to validate
 * @param {Object} env - Environment variables and bindings
 * @returns {Object} Validation result with valid/invalid programs
 */
export async function validateResearchPrograms(programCodes, env) {
  if (!Array.isArray(programCodes) || programCodes.length === 0) {
    return { valid: [], invalid: [], all_valid: true };
  }

  const query = `
    SELECT program_code
    FROM research_programs
    WHERE program_code IN (${programCodes.map(() => '?').join(',')})
      AND is_active = true
  `;

  const result = await executeQuery(env, query, programCodes, 'validateResearchPrograms');
  const validCodes = new Set((result?.results || []).map(r => r.program_code));

  const valid = programCodes.filter(code => validCodes.has(code));
  const invalid = programCodes.filter(code => !validCodes.has(code));

  return {
    valid,
    invalid,
    all_valid: invalid.length === 0,
    validation_summary: `${valid.length}/${programCodes.length} programs are valid`
  };
}