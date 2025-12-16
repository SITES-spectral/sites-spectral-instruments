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
import { D1ExportRepository } from '../../persistence/d1/D1ExportRepository.js';
import { requireAuthentication } from '../../../auth/permissions.js';
import {
  createErrorResponse,
  createNotFoundResponse,
  createForbiddenResponse,
  createMethodNotAllowedResponse
} from '../../../utils/responses.js';

export class ExportController {
  /**
   * Handle export requests
   * @param {Request} request - HTTP request
   * @param {Object} env - Environment bindings
   * @param {string} method - HTTP method
   * @param {string[]} pathSegments - URL path segments
   * @returns {Promise<Response>}
   */
  static async handle(request, env, method, pathSegments) {
    if (method !== 'GET') {
      return createMethodNotAllowedResponse();
    }

    // Authentication required for all export operations
    const user = await requireAuthentication(request, env);
    if (user instanceof Response) {
      return user; // Return error response
    }

    const action = pathSegments[1];
    const identifier = pathSegments[2];

    try {
      switch (action) {
        case 'station':
          if (!identifier) {
            return createErrorResponse('Station ID required', 400);
          }
          return await this.handleStationExport(identifier, user, env);

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
   * @param {Object} env - Environment bindings
   * @returns {Promise<Response>}
   */
  static async handleStationExport(identifier, user, env) {
    // Create repository and service
    const repository = new D1ExportRepository(env.DB);
    const service = new ExportService(repository);

    try {
      const result = await service.exportStationToCSV(identifier, user);

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
