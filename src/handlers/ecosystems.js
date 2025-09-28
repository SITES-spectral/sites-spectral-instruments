// SITES Spectral Ecosystem Codes Handler
// Serves ecosystem codes from ecosystems.yaml for form components

import { createSuccessResponse, createErrorResponse } from '../utils/responses.js';

/**
 * Ecosystem codes based on ecosystems.yaml configuration
 * Used for instrument ecosystem classification dropdowns
 */
const ECOSYSTEM_CODES = [
  { code: 'HEA', description: 'Heathland', acronym: 'HEA' },
  { code: 'AGR', description: 'Arable Land', acronym: 'AGR' },
  { code: 'MIR', description: 'Mires', acronym: 'MIR' },
  { code: 'LAK', description: 'Lake', acronym: 'LAK' },
  { code: 'WET', description: 'Wetland', acronym: 'WET' },
  { code: 'GRA', description: 'Grassland', acronym: 'GRA' },
  { code: 'FOR', description: 'Forest', acronym: 'FOR' },
  { code: 'ALP', description: 'Alpine Forest', acronym: 'ALP' },
  { code: 'CON', description: 'Coniferous Forest', acronym: 'CON' },
  { code: 'DEC', description: 'Deciduous Forest', acronym: 'DEC' },
  { code: 'MAR', description: 'Marshland', acronym: 'MAR' },
  { code: 'PEA', description: 'Peatland', acronym: 'PEA' }
];

/**
 * Handle ecosystem codes API requests
 * @param {string} method - HTTP method
 * @param {string} id - Resource identifier (unused for this endpoint)
 * @param {Request} request - HTTP request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} API response
 */
export async function handleEcosystems(method, id, request, env) {
  try {
    switch (method) {
      case 'GET':
        return handleGetEcosystems(request, env);

      default:
        return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Ecosystems handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get all ecosystem codes
 * @param {Request} request - HTTP request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} JSON response with ecosystem codes
 */
async function handleGetEcosystems(request, env) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'full';

  try {
    let response;

    switch (format) {
      case 'dropdown':
        // Format for dropdown components
        response = ECOSYSTEM_CODES.map(eco => ({
          value: eco.code,
          label: `${eco.code} - ${eco.description}`,
          description: eco.description
        }));
        break;

      case 'codes':
        // Just the codes array
        response = ECOSYSTEM_CODES.map(eco => eco.code);
        break;

      case 'full':
      default:
        // Full ecosystem data
        response = ECOSYSTEM_CODES;
        break;
    }

    return createSuccessResponse({
      success: true,
      data: response,
      count: response.length,
      format: format
    });

  } catch (error) {
    console.error('Error getting ecosystem codes:', error);
    return createErrorResponse('Failed to retrieve ecosystem codes', 500);
  }
}

/**
 * Get ecosystem codes formatted for dropdown components
 * @param {Request} request - HTTP request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} JSON response formatted for dropdowns
 */
export async function getEcosystemDropdownValues(request, env) {
  try {
    const dropdownValues = ECOSYSTEM_CODES.map(eco => ({
      value: eco.code,
      label: `${eco.code} - ${eco.description}`,
      description: eco.description,
      category: getCategoryForEcosystem(eco.code)
    }));

    return createSuccessResponse({
      success: true,
      data: dropdownValues,
      count: dropdownValues.length
    });

  } catch (error) {
    console.error('Error getting ecosystem dropdown values:', error);
    return createErrorResponse('Failed to retrieve ecosystem dropdown values', 500);
  }
}

/**
 * Categorize ecosystems for better organization in dropdowns
 * @param {string} code - Ecosystem code
 * @returns {string} Category name
 */
function getCategoryForEcosystem(code) {
  const categories = {
    'FOR': 'Forest',
    'ALP': 'Forest',
    'CON': 'Forest',
    'DEC': 'Forest',
    'AGR': 'Agricultural',
    'GRA': 'Grassland',
    'LAK': 'Aquatic',
    'WET': 'Wetland',
    'MIR': 'Wetland',
    'MAR': 'Wetland',
    'PEA': 'Wetland',
    'HEA': 'Other'
  };

  return categories[code] || 'Other';
}

/**
 * Validate ecosystem code
 * @param {string} code - Ecosystem code to validate
 * @returns {boolean} True if valid
 */
export function validateEcosystemCode(code) {
  return ECOSYSTEM_CODES.some(eco => eco.code === code);
}

/**
 * Get ecosystem description by code
 * @param {string} code - Ecosystem code
 * @returns {string|null} Description or null if not found
 */
export function getEcosystemDescription(code) {
  const ecosystem = ECOSYSTEM_CODES.find(eco => eco.code === code);
  return ecosystem ? ecosystem.description : null;
}