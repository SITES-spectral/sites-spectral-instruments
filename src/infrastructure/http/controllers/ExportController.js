/**
 * Export HTTP Controller
 *
 * Handles HTTP requests for data export endpoints.
 * Delegates business logic to ExportService.
 *
 * Following Hexagonal Architecture:
 * - This is an HTTP adapter (driving adapter)
 * - Translates HTTP requests to domain service calls
 *
 * @module infrastructure/http/controllers/ExportController
 */

import { ExportService } from '../../../domain/export/ExportService.js';
import { requireAuthentication } from '../../../auth/permissions.js';
import {
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../../../utils/responses.js';

export class ExportController {
  /**
   * @param {Object} container - Dependency injection container
   * @param {Object} env - Cloudflare Worker environment
   */
  constructor(container, env) {
    this.exportRepository = container.repositories.export;
    this.service = new ExportService(this.exportRepository);
    this.env = env;
  }

  /**
   * Handle export requests
   * @param {Request} request - HTTP request
   * @param {string[]} resourcePath - URL path segments
   * @param {URL} url - Parsed URL
   * @returns {Promise<Response>}
   */
  async handle(request, resourcePath, url) {
    if (request.method !== 'GET') {
      return createMethodNotAllowedResponse();
    }

    // Authentication required for all export operations
    const user = await requireAuthentication(request, this.env);
    if (user instanceof Response) {
      return user; // Return error response
    }

    const action = resourcePath[0];
    const identifier = resourcePath[1];

    try {
      switch (action) {
        case 'station':
          if (!identifier) {
            return createErrorResponse('Station ID required', 400);
          }
          return await this.handleStationExport(identifier, user);

        default:
          return createErrorResponse('Export type not found', 404);
      }
    } catch (error) {
      console.error('Export error:', error);
      return createErrorResponse(`Failed to export data: ${error.message}`, 500);
    }
  }

  /**
   * Handle station data export
   * @param {string} identifier - Station identifier
   * @param {Object} user - Authenticated user
   * @returns {Promise<Response>}
   */
  async handleStationExport(identifier, user) {
    try {
      const result = await this.service.exportStationToCSV(identifier, user);

      if (!result) {
        return createNotFoundResponse();
      }

      if (result.error === 'forbidden') {
        return createForbiddenResponse();
      }

      // Return CSV response
      return new Response(result.csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'Cache-Control': 'no-cache'
        }
      });

    } catch (error) {
      console.error('Station export error:', error);
      return createErrorResponse(`Failed to export station data: ${error.message}`, 500);
    }
  }
}
