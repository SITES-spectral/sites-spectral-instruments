/**
 * Get Pilots With Expiring Credentials Query
 *
 * Application layer query for finding pilots with expiring certificates or insurance.
 *
 * @module application/queries/uav/GetPilotsWithExpiringCredentials
 */

/**
 * Get Pilots With Expiring Credentials Query
 */
export class GetPilotsWithExpiringCredentials {
  /**
   * @param {Object} dependencies
   */
  constructor({ pilotRepository }) {
    this.pilotRepository = pilotRepository;
  }

  /**
   * Execute the query
   *
   * @param {Object} options
   * @param {number} [options.days=30] - Days until expiry
   * @returns {Promise<{expiringCertificates: Pilot[], expiringInsurance: Pilot[]}>}
   */
  async execute(options = {}) {
    const { days = 30 } = options;

    const [expiringCertificates, expiringInsurance] = await Promise.all([
      this.pilotRepository.findWithExpiringCertificates(days),
      this.pilotRepository.findWithExpiringInsurance(days)
    ]);

    return {
      expiringCertificates,
      expiringInsurance
    };
  }
}
