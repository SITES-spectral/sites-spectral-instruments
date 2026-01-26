/**
 * Report Flight Incident Command
 *
 * Application layer command for reporting an incident during a flight.
 *
 * @module application/commands/uav/ReportFlightIncident
 */

/**
 * Report Flight Incident Command
 */
export class ReportFlightIncident {
  /**
   * @param {Object} dependencies
   */
  constructor({ flightLogRepository }) {
    this.flightLogRepository = flightLogRepository;
  }

  /**
   * Execute the report incident command
   *
   * @param {Object} input
   * @param {number} input.flightLogId - Flight log ID
   * @param {string} input.description - Incident description
   * @param {string} input.severity - Incident severity (minor, moderate, major, critical)
   * @returns {Promise<FlightLog>} Updated flight log
   * @throws {Error} If flight log not found
   */
  async execute(input) {
    const flightLog = await this.flightLogRepository.findById(input.flightLogId);
    if (!flightLog) {
      throw new Error(`Flight log ${input.flightLogId} not found`);
    }

    // Domain entity handles validation
    flightLog.reportIncident(input.description, input.severity);

    return await this.flightLogRepository.save(flightLog);
  }
}
