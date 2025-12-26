/**
 * Get Instrument Analytics Query
 *
 * Retrieves detailed instrument analytics.
 *
 * @module application/queries/analytics/GetInstrumentAnalytics
 */

export class GetInstrumentAnalytics {
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
    // Fetch all instrument analytics in parallel
    const [
      deploymentTrends,
      cameraBrands,
      cameraModels,
      measurementStatus,
      heightDistribution,
      roiStatistics
    ] = await Promise.allSettled([
      this.analyticsRepository.getDeploymentTrends(24),
      this.analyticsRepository.getCameraBrandDistribution(),
      this.analyticsRepository.getCameraModelDistribution(10),
      this.analyticsRepository.getMeasurementStatusDistribution(),
      this.analyticsRepository.getHeightDistribution(),
      this.analyticsRepository.getROIStatistics()
    ]);

    // Extract values with fallbacks
    const getValue = (result, fallback) =>
      result.status === 'fulfilled' ? result.value : fallback;

    return {
      deployment_trends: getValue(deploymentTrends, []),
      camera_brands: getValue(cameraBrands, []),
      camera_models: getValue(cameraModels, []),
      measurement_status: getValue(measurementStatus, []),
      height_distribution: getValue(heightDistribution, []),
      roi_statistics: getValue(roiStatistics, [])
    };
  }
}
