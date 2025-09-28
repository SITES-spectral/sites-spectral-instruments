// SITES Spectral Status Codes Handler
// Serves status options from status.yaml for form components

import { createJsonResponse, createErrorResponse } from '../utils/responses.js';

/**
 * Status codes based on status.yaml configuration
 * Used for station, platform, and instrument status dropdowns
 */
const STATUS_CODES = [
  {
    code: 'Active',
    description: 'Currently operational and collecting data.',
    category: 'Operational',
    color: '#10B981' // Green
  },
  {
    code: 'Inactive',
    description: 'Temporarily not in use but can be reactivated.',
    category: 'Operational',
    color: '#F59E0B' // Amber
  },
  {
    code: 'Testing',
    description: 'Installed and being tested but not yet fully operational.',
    category: 'Development',
    color: '#3B82F6' // Blue
  },
  {
    code: 'Planned',
    description: 'Approved and planned for future construction or installation.',
    category: 'Development',
    color: '#6366F1' // Indigo
  },
  {
    code: 'Under Construction',
    description: 'In the process of being built or installed but not yet operational.',
    category: 'Development',
    color: '#8B5CF6' // Purple
  },
  {
    code: 'Pending Activation',
    description: 'Installed but not yet active, awaiting final checks or deployment steps.',
    category: 'Development',
    color: '#06B6D4' // Cyan
  },
  {
    code: 'Maintenance',
    description: 'Temporarily out of service for maintenance or repairs.',
    category: 'Temporary',
    color: '#F97316' // Orange
  },
  {
    code: 'Upgrading',
    description: 'Currently being upgraded with new equipment or software.',
    category: 'Temporary',
    color: '#84CC16' // Lime
  },
  {
    code: 'Dormant',
    description: 'Not currently active but maintained for potential future use.',
    category: 'Temporary',
    color: '#64748B' // Slate
  },
  {
    code: 'Decommissioned',
    description: 'Permanently retired from use and will not be reactivated.',
    category: 'Retired',
    color: '#EF4444' // Red
  },
  {
    code: 'Dismantled',
    description: 'Permanently taken out of service and no longer in place.',
    category: 'Retired',
    color: '#DC2626' // Dark Red
  },
  {
    code: 'Scheduled for Decommission',
    description: 'Will be decommissioned in the near future.',
    category: 'Retired',
    color: '#F87171' // Light Red
  }
];

/**
 * Handle status codes API requests
 * @param {string} method - HTTP method
 * @param {string} id - Resource identifier (unused for this endpoint)
 * @param {Request} request - HTTP request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} API response
 */
export async function handleStatusCodes(method, id, request, env) {
  try {
    switch (method) {
      case 'GET':
        return handleGetStatusCodes(request, env);

      default:
        return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Status codes handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Get all status codes
 * @param {Request} request - HTTP request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} JSON response with status codes
 */
async function handleGetStatusCodes(request, env) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'full';
  const category = url.searchParams.get('category');

  try {
    let statusCodes = STATUS_CODES;

    // Filter by category if specified
    if (category) {
      statusCodes = statusCodes.filter(status =>
        status.category.toLowerCase() === category.toLowerCase()
      );
    }

    let response;

    switch (format) {
      case 'dropdown':
        // Format for dropdown components
        response = statusCodes.map(status => ({
          value: status.code,
          label: status.code,
          description: status.description,
          category: status.category,
          color: status.color
        }));
        break;

      case 'codes':
        // Just the codes array
        response = statusCodes.map(status => status.code);
        break;

      case 'categories':
        // Group by categories
        const categories = {};
        statusCodes.forEach(status => {
          if (!categories[status.category]) {
            categories[status.category] = [];
          }
          categories[status.category].push({
            code: status.code,
            description: status.description,
            color: status.color
          });
        });
        response = categories;
        break;

      case 'full':
      default:
        // Full status data
        response = statusCodes;
        break;
    }

    return createJsonResponse({
      success: true,
      data: response,
      count: Array.isArray(response) ? response.length : Object.keys(response).length,
      format: format,
      category: category
    });

  } catch (error) {
    console.error('Error getting status codes:', error);
    return createErrorResponse('Failed to retrieve status codes', 500);
  }
}

/**
 * Get status codes formatted for dropdown components
 * @param {Request} request - HTTP request object
 * @param {Object} env - Environment variables and bindings
 * @returns {Response} JSON response formatted for dropdowns
 */
export async function getStatusDropdownValues(request, env) {
  try {
    const dropdownValues = STATUS_CODES.map(status => ({
      value: status.code,
      label: status.code,
      description: status.description,
      category: status.category,
      color: status.color
    }));

    return createJsonResponse({
      success: true,
      data: dropdownValues,
      count: dropdownValues.length
    });

  } catch (error) {
    console.error('Error getting status dropdown values:', error);
    return createErrorResponse('Failed to retrieve status dropdown values', 500);
  }
}

/**
 * Validate status code
 * @param {string} code - Status code to validate
 * @returns {boolean} True if valid
 */
export function validateStatusCode(code) {
  return STATUS_CODES.some(status => status.code === code);
}

/**
 * Get status description by code
 * @param {string} code - Status code
 * @returns {string|null} Description or null if not found
 */
export function getStatusDescription(code) {
  const status = STATUS_CODES.find(s => s.code === code);
  return status ? status.description : null;
}

/**
 * Get status color by code
 * @param {string} code - Status code
 * @returns {string|null} Color or null if not found
 */
export function getStatusColor(code) {
  const status = STATUS_CODES.find(s => s.code === code);
  return status ? status.color : null;
}