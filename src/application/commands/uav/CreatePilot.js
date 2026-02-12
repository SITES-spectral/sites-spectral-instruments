/**
 * Create Pilot Command
 *
 * Application layer command for creating a new UAV pilot.
 * Includes authorization check (UAV-004) to ensure only authorized users
 * can create pilots.
 *
 * @module application/commands/uav/CreatePilot
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md (UAV-004)
 */

import { Pilot } from '../../../domain/uav/index.js';
import { UAVAuthorizationService } from '../../../domain/uav/authorization/UAVAuthorizationService.js';

/**
 * Create Pilot Command
 */
export class CreatePilot {
  /**
   * @param {Object} dependencies
   * @param {import('../../../infrastructure/persistence/d1/D1PilotRepository.js').D1PilotRepository} dependencies.pilotRepository
   * @param {UAVAuthorizationService} [dependencies.authorizationService] - Authorization service
   */
  constructor({ pilotRepository, authorizationService = null }) {
    this.pilotRepository = pilotRepository;
    this.authorizationService = authorizationService || new UAVAuthorizationService();
  }

  /**
   * Execute the create pilot command
   *
   * @param {Object} input - Pilot data
   * @param {import('../../../domain/authorization/User.js').User} [input.user] - Authenticated user (required for authorization)
   * @returns {Promise<Pilot>} Created pilot
   * @throws {Error} If email already exists, user unauthorized, or validation fails
   */
  async execute(input) {
    // UAV-004: Authorization check - only admins can create pilots
    if (input.user) {
      if (!this.authorizationService.canManagePilot(input.user, null)) {
        throw new Error(
          `Unauthorized: User '${input.user.username}' cannot create pilots. ` +
          `Only global admins and station admins can manage pilot records.`
        );
      }
    }

    // Check if email already exists
    const existing = await this.pilotRepository.findByEmail(input.email);
    if (existing) {
      throw new Error(`Pilot with email '${input.email}' already exists`);
    }

    // Create pilot entity (validates input)
    const pilot = new Pilot({
      user_id: input.user_id,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      pilot_certificate_number: input.pilot_certificate_number,
      certificate_type: input.certificate_type,
      certificate_issued_date: input.certificate_issued_date,
      certificate_expiry_date: input.certificate_expiry_date,
      insurance_provider: input.insurance_provider,
      insurance_policy_number: input.insurance_policy_number,
      insurance_expiry_date: input.insurance_expiry_date,
      flight_hours_total: input.flight_hours_total || 0,
      flight_hours_sites_spectral: input.flight_hours_sites_spectral || 0,
      authorized_stations: input.authorized_stations || [],
      status: input.status || 'pending_verification',
      notes: input.notes
    });

    // Persist and return
    return await this.pilotRepository.save(pilot);
  }
}
