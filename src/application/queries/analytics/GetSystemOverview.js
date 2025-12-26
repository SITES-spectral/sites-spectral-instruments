/**
 * Get System Overview Query
 *
 * Retrieves comprehensive system-wide analytics.
 *
 * @module application/queries/analytics/GetSystemOverview
 */

import { SystemOverview } from '../../../domain/analytics/SystemOverview.js';

export class GetSystemOverview {
  /**
   * @param {Object} dependencies
   * @param {import('../../../domain/analytics/AnalyticsRepository.js').AnalyticsRepository} dependencies.analyticsRepository
   */
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  /**
   * Execute the query
   * @returns {Promise<SystemOverview>}
   */
  async execute() {
    // Fetch all required data in parallel
    const [
      counts,
      stationsStatus,
      platformsStatus,
      instrumentsStatus,
      instrumentTypes,
      ecosystems,
      deploymentTimeline,
      recentActivity
    ] = await Promise.allSettled([
      this.analyticsRepository.getTotalCounts(),
      this.analyticsRepository.getStatusBreakdown('stations'),
      this.analyticsRepository.getStatusBreakdown('platforms'),
      this.analyticsRepository.getStatusBreakdown('instruments'),
      this.analyticsRepository.getInstrumentTypeDistribution(),
      this.analyticsRepository.getEcosystemDistribution(),
      this.analyticsRepository.getDeploymentTimeline(),
      this.analyticsRepository.getRecentActivity(7)
    ]);

    // Extract values with fallbacks
    const getValue = (result, fallback) =>
      result.status === 'fulfilled' ? result.value : fallback;

    const countsData = getValue(counts, { stations: 0, platforms: 0, instruments: 0, rois: 0 });

    return SystemOverview.fromQueryResults({
      stationsCount: countsData.stations,
      platformsCount: countsData.platforms,
      instrumentsCount: countsData.instruments,
      roisCount: countsData.rois,
      stationsStatus: getValue(stationsStatus, []),
      platformsStatus: getValue(platformsStatus, []),
      instrumentsStatus: getValue(instrumentsStatus, []),
      instrumentTypes: getValue(instrumentTypes, []),
      ecosystems: getValue(ecosystems, []),
      deploymentTimeline: getValue(deploymentTimeline, []),
      recentActivity: getValue(recentActivity, [])
    });
  }
}
