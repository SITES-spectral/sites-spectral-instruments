/**
 * Update Pilot Command
 *
 * Application layer command for updating an existing UAV pilot.
 * Includes audit trail for status changes (UAV-005).
 *
 * @module application/commands/uav/UpdatePilot
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md (UAV-005)
 */

import { Pilot } from '../../../domain/uav/index.js';
import { UAVAuthorizationService } from '../../../domain/uav/authorization/UAVAuthorizationService.js';

/**
 * Update Pilot Command
 */
export class UpdatePilot {
  /**
   * @param {Object} dependencies
   * @param {import('../../../infrastructure/persistence/d1/D1PilotRepository.js').D1PilotRepository} dependencies.pilotRepository
   * @param {Object} [dependencies.db] - Database connection for audit logging
   * @param {UAVAuthorizationService} [dependencies.authorizationService] - Authorization service
   */
  constructor({ pilotRepository, db = null, authorizationService = null }) {
    this.pilotRepository = pilotRepository;
    this.db = db;
    this.authorizationService = authorizationService || new UAVAuthorizationService();
  }

  /**
   * Execute the update pilot command
   *
   * @param {Object} input - Updated pilot data
   * @param {number} input.id - Pilot ID
   * @param {import('../../../domain/authorization/User.js').User} [input.user] - Authenticated user (for authorization and audit)
   * @param {string} [input.clientIP] - Client IP for audit trail
   * @param {string} [input.userAgent] - User agent for audit trail
   * @param {string} [input.statusChangeReason] - Reason for status change (for audit)
   * @returns {Promise<Pilot>} Updated pilot
   * @throws {Error} If pilot not found or user unauthorized
   */
  async execute(input) {
    const existing = await this.pilotRepository.findById(input.id);
    if (!existing) {
      throw new Error(`Pilot ${input.id} not found`);
    }

    // UAV-004: Authorization check - only admins can update pilots
    if (input.user) {
      if (!this.authorizationService.canManagePilot(input.user, existing)) {
        throw new Error(
          `Unauthorized: User '${input.user.username}' cannot update pilot ${input.id}. ` +
          `Only global admins and station admins with access to the pilot's stations can manage pilot records.`
        );
      }
    }

    // Determine if status is changing (UAV-005)
    const newStatus = input.status ?? existing.status;
    const statusChanged = newStatus !== existing.status;

    // Create updated pilot entity
    const pilot = new Pilot({
      id: input.id,
      user_id: input.user_id ?? existing.user_id,
      full_name: input.full_name ?? existing.full_name,
      email: input.email ?? existing.email,
      phone: input.phone ?? existing.phone,
      organization: input.organization ?? existing.organization,
      pilot_certificate_number: input.pilot_certificate_number ?? existing.pilot_certificate_number,
      certificate_type: input.certificate_type ?? existing.certificate_type,
      certificate_issued_date: input.certificate_issued_date ?? existing.certificate_issued_date,
      certificate_expiry_date: input.certificate_expiry_date ?? existing.certificate_expiry_date,
      insurance_provider: input.insurance_provider ?? existing.insurance_provider,
      insurance_policy_number: input.insurance_policy_number ?? existing.insurance_policy_number,
      insurance_expiry_date: input.insurance_expiry_date ?? existing.insurance_expiry_date,
      flight_hours_total: input.flight_hours_total ?? existing.flight_hours_total,
      flight_hours_sites_spectral: input.flight_hours_sites_spectral ?? existing.flight_hours_sites_spectral,
      last_flight_date: input.last_flight_date ?? existing.last_flight_date,
      authorized_stations: input.authorized_stations ?? existing.authorized_stations,
      status: newStatus,
      notes: input.notes ?? existing.notes,
      created_at: existing.created_at
    });

    const savedPilot = await this.pilotRepository.save(pilot);

    // UAV-005: Log status change to audit trail
    if (statusChanged && this.db) {
      try {
        await this.db.prepare(`
          INSERT INTO pilot_status_audit (
            pilot_id, changed_by_user_id, previous_status, new_status,
            reason, client_ip, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          input.id,
          input.user?.id || null,
          existing.status,
          newStatus,
          input.statusChangeReason || null,
          input.clientIP || null,
          input.userAgent || null
        ).run();
      } catch (error) {
        // Log error but don't fail the update - audit is secondary
        console.error('Failed to log pilot status change to audit trail:', error);
      }
    }

    return savedPilot;
  }
}
