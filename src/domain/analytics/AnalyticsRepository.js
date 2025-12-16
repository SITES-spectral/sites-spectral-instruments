/**
 * Analytics Repository Port (Interface)
 *
 * Defines the contract for analytics data access.
 * Infrastructure layer must implement this interface.
 *
 * Following Hexagonal Architecture (Ports & Adapters):
 * - This is a PORT (interface) in the domain layer
 * - Adapters (D1AnalyticsRepository) implement this in infrastructure
 *
 * @module domain/analytics/AnalyticsRepository
 */

/**
 * @typedef {Object} CountSummary
 * @property {number} stations - Total station count
 * @property {number} platforms - Total platform count
 * @property {number} instruments - Total instrument count
 * @property {number} rois - Total ROI count
 */

/**
 * @typedef {Object} StatusBreakdown
 * @property {string} status - Status name
 * @property {number} count - Count for this status
 */

/**
 * @typedef {Object} StationWithCounts
 * @property {number} id - Station ID
 * @property {string} normalized_name - Normalized station name
 * @property {string} display_name - Display name
 * @property {string} acronym - Station acronym
 * @property {string} status - Station status
 * @property {string} country - Country code
 * @property {number} latitude - Latitude
 * @property {number} longitude - Longitude
 * @property {number} elevation_m - Elevation in meters
 * @property {number} platform_count - Number of platforms
 * @property {number} instrument_count - Number of instruments
 * @property {number} roi_count - Number of ROIs
 */

/**
 * @typedef {Object} HealthIssues
 * @property {number} stationsNoCoordinates - Stations without coordinates
 * @property {number} platformsNoCoordinates - Platforms without coordinates
 * @property {number} instrumentsNoDeploymentDate - Instruments without deployment date
 * @property {number} instrumentsNoHeight - Instruments without height
 * @property {number} instrumentsNoROIs - Instruments without ROIs
 */

export class AnalyticsRepository {
  /**
   * Get total counts for all entities
   * @returns {Promise<CountSummary>}
   */
  async getTotalCounts() {
    throw new Error('AnalyticsRepository.getTotalCounts() must be implemented');
  }

  /**
   * Get status breakdown for an entity type
   * @param {string} entityType - 'stations', 'platforms', or 'instruments'
   * @returns {Promise<StatusBreakdown[]>}
   */
  async getStatusBreakdown(entityType) {
    throw new Error('AnalyticsRepository.getStatusBreakdown() must be implemented');
  }

  /**
   * Get instrument type distribution
   * @returns {Promise<Array<{instrument_type: string, count: number}>>}
   */
  async getInstrumentTypeDistribution() {
    throw new Error('AnalyticsRepository.getInstrumentTypeDistribution() must be implemented');
  }

  /**
   * Get ecosystem distribution
   * @returns {Promise<Array<{ecosystem_code: string, count: number}>>}
   */
  async getEcosystemDistribution() {
    throw new Error('AnalyticsRepository.getEcosystemDistribution() must be implemented');
  }

  /**
   * Get deployment timeline by year
   * @returns {Promise<Array<{year: string, count: number}>>}
   */
  async getDeploymentTimeline() {
    throw new Error('AnalyticsRepository.getDeploymentTimeline() must be implemented');
  }

  /**
   * Get recent activity from activity log
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array<{action: string, count: number}>>}
   */
  async getRecentActivity(days = 7) {
    throw new Error('AnalyticsRepository.getRecentActivity() must be implemented');
  }

  /**
   * Get stations with entity counts
   * @returns {Promise<StationWithCounts[]>}
   */
  async getStationsWithCounts() {
    throw new Error('AnalyticsRepository.getStationsWithCounts() must be implemented');
  }

  /**
   * Get instrument deployment trends
   * @param {number} months - Number of months to look back
   * @returns {Promise<Array<{month: string, instrument_type: string, count: number}>>}
   */
  async getDeploymentTrends(months = 24) {
    throw new Error('AnalyticsRepository.getDeploymentTrends() must be implemented');
  }

  /**
   * Get camera brand distribution
   * @returns {Promise<Array<{camera_brand: string, count: number}>>}
   */
  async getCameraBrandDistribution() {
    throw new Error('AnalyticsRepository.getCameraBrandDistribution() must be implemented');
  }

  /**
   * Get camera model distribution
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array<{camera_model: string, camera_brand: string, count: number}>>}
   */
  async getCameraModelDistribution(limit = 10) {
    throw new Error('AnalyticsRepository.getCameraModelDistribution() must be implemented');
  }

  /**
   * Get measurement status distribution
   * @returns {Promise<Array<{measurement_status: string, count: number}>>}
   */
  async getMeasurementStatusDistribution() {
    throw new Error('AnalyticsRepository.getMeasurementStatusDistribution() must be implemented');
  }

  /**
   * Get instrument height distribution
   * @returns {Promise<Array<{height_range: string, count: number}>>}
   */
  async getHeightDistribution() {
    throw new Error('AnalyticsRepository.getHeightDistribution() must be implemented');
  }

  /**
   * Get ROI statistics by instrument type
   * @returns {Promise<Array<{instrument_type: string, total_rois: number, percent_with_rois: number}>>}
   */
  async getROIStatistics() {
    throw new Error('AnalyticsRepository.getROIStatistics() must be implemented');
  }

  /**
   * Get activity log entries
   * @param {number} limit - Maximum number of entries
   * @returns {Promise<Array>}
   */
  async getActivityLog(limit = 50) {
    throw new Error('AnalyticsRepository.getActivityLog() must be implemented');
  }

  /**
   * Get activity by day
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array<{date: string, count: number}>>}
   */
  async getActivityByDay(days = 30) {
    throw new Error('AnalyticsRepository.getActivityByDay() must be implemented');
  }

  /**
   * Get activity by type
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array<{action: string, count: number}>>}
   */
  async getActivityByType(days = 30) {
    throw new Error('AnalyticsRepository.getActivityByType() must be implemented');
  }

  /**
   * Get entity creation timeline
   * @param {number} limit - Maximum number of entries
   * @returns {Promise<Array<{entity_type: string, created_at: string}>>}
   */
  async getEntityTimeline(limit = 100) {
    throw new Error('AnalyticsRepository.getEntityTimeline() must be implemented');
  }

  /**
   * Check database connectivity
   * @returns {Promise<boolean>}
   */
  async checkDatabaseHealth() {
    throw new Error('AnalyticsRepository.checkDatabaseHealth() must be implemented');
  }

  /**
   * Get health issues counts
   * @returns {Promise<HealthIssues>}
   */
  async getHealthIssues() {
    throw new Error('AnalyticsRepository.getHealthIssues() must be implemented');
  }
}
