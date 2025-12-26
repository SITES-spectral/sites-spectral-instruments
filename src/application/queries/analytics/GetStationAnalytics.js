/**
 * Get Station Analytics Query
 *
 * Retrieves detailed analytics for all stations.
 *
 * @module application/queries/analytics/GetStationAnalytics
 */

export class GetStationAnalytics {
  /**
   * @param {Object} dependencies
   * @param {import('../../../domain/analytics/AnalyticsRepository.js').AnalyticsRepository} dependencies.analyticsRepository
   */
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  /**
   * Execute the query
   * @returns {Promise<Object>}
   */
  async execute() {
    const stations = await this.analyticsRepository.getStationsWithCounts();

    // Calculate rankings
    const stationsWithRanks = stations.map(station => ({
      ...station,
      total_entities: station.platform_count + station.instrument_count + station.roi_count,
      data_richness_score: (station.platform_count * 1.5) + (station.instrument_count * 2) + (station.roi_count * 0.5)
    }));

    // Sort by data richness
    stationsWithRanks.sort((a, b) => b.data_richness_score - a.data_richness_score);

    // Add ranks
    stationsWithRanks.forEach((station, index) => {
      station.rank = index + 1;
    });

    return {
      stations: stationsWithRanks,
      total_stations: stations.length,
      most_active_station: stationsWithRanks[0] || null,
      least_active_station: stationsWithRanks[stationsWithRanks.length - 1] || null
    };
  }
}
