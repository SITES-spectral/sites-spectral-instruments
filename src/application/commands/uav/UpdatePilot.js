/**
 * Update Pilot Command
 *
 * Application layer command for updating an existing UAV pilot.
 *
 * @module application/commands/uav/UpdatePilot
 */

import { Pilot } from '../../../domain/uav/index.js';

/**
 * Update Pilot Command
 */
export class UpdatePilot {
  /**
   * @param {Object} dependencies
   * @param {import('../../../infrastructure/persistence/d1/D1PilotRepository.js').D1PilotRepository} dependencies.pilotRepository
   */
  constructor({ pilotRepository }) {
    this.pilotRepository = pilotRepository;
  }

  /**
   * Execute the update pilot command
   *
   * @param {Object} input - Updated pilot data
   * @param {number} input.id - Pilot ID
   * @returns {Promise<Pilot>} Updated pilot
   * @throws {Error} If pilot not found
   */
  async execute(input) {
    const existing = await this.pilotRepository.findById(input.id);
    if (!existing) {
      throw new Error(`Pilot ${input.id} not found`);
    }

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
      status: input.status ?? existing.status,
      notes: input.notes ?? existing.notes,
      created_at: existing.created_at
    });

    return await this.pilotRepository.save(pilot);
  }
}
