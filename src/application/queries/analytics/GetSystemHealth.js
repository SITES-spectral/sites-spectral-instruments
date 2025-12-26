/**
 * Get System Health Query
 *
 * Retrieves system health metrics and data quality scores.
 *
 * @module application/queries/analytics/GetSystemHealth
 */

import { SystemHealth } from '../../../domain/analytics/SystemHealth.js';

export class GetSystemHealth {
  /**
   * @param {Object} dependencies
   * @param {import('../../../domain/analytics/AnalyticsRepository.js').AnalyticsRepository} dependencies.analyticsRepository
   */
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  /**
   * Execute the query
   * @returns {Promise<SystemHealth>}
   */
  async execute() {
    // Fetch health data in parallel
    const [
      databaseHealthy,
      counts,
      healthIssues
    ] = await Promise.all([
      this.analyticsRepository.checkDatabaseHealth(),
      this.analyticsRepository.getTotalCounts(),
      this.analyticsRepository.getHealthIssues()
    ]);

    return SystemHealth.fromQueryResults({
      databaseHealthy,
      totalStations: counts.stations,
      totalPlatforms: counts.platforms,
      totalInstruments: counts.instruments,
      ...healthIssues
    });
  }
}
