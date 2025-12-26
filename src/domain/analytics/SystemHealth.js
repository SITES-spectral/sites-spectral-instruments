/**
 * System Health Value Object
 *
 * Represents system health metrics and data quality scores.
 *
 * @module domain/analytics/SystemHealth
 */

export class SystemHealth {
  /**
   * @param {Object} props
   * @param {boolean} props.databaseHealthy - Database connectivity status
   * @param {number} props.healthScore - Overall health score (0-100)
   * @param {Object} props.dataQuality - Data quality metrics
   * @param {Object} props.issues - Issue counts
   * @param {Array} props.recommendations - Health recommendations
   */
  constructor(props) {
    this.databaseHealthy = props.databaseHealthy;
    this.healthScore = props.healthScore;
    this.dataQuality = props.dataQuality;
    this.issues = props.issues;
    this.recommendations = props.recommendations;

    Object.freeze(this);
  }

  /**
   * Create from raw database results
   * @param {Object} data - Raw query results
   * @returns {SystemHealth}
   */
  static fromQueryResults(data) {
    const {
      databaseHealthy,
      totalStations,
      totalPlatforms,
      totalInstruments,
      stationsNoCoordinates,
      platformsNoCoordinates,
      instrumentsNoDeploymentDate,
      instrumentsNoHeight,
      instrumentsNoROIs
    } = data;

    // Calculate completeness percentages
    const coordinateCompleteness = {
      stations: 100 - (stationsNoCoordinates / Math.max(totalStations, 1) * 100),
      platforms: 100 - (platformsNoCoordinates / Math.max(totalPlatforms, 1) * 100)
    };

    const metadataCompleteness = {
      deployment_dates: 100 - (instrumentsNoDeploymentDate / Math.max(totalInstruments, 1) * 100),
      heights: 100 - (instrumentsNoHeight / Math.max(totalInstruments, 1) * 100),
      rois: 100 - (instrumentsNoROIs / Math.max(totalInstruments, 1) * 100)
    };

    // Calculate overall health score
    const healthScore = Math.round((
      coordinateCompleteness.stations +
      coordinateCompleteness.platforms +
      metadataCompleteness.deployment_dates +
      metadataCompleteness.heights +
      metadataCompleteness.rois
    ) / 5);

    const issues = {
      stations_without_coordinates: stationsNoCoordinates,
      platforms_without_coordinates: platformsNoCoordinates,
      instruments_without_deployment_date: instrumentsNoDeploymentDate,
      instruments_without_height: instrumentsNoHeight,
      instruments_without_rois: instrumentsNoROIs
    };

    const recommendations = SystemHealth.generateRecommendations(issues);

    return new SystemHealth({
      databaseHealthy,
      healthScore,
      dataQuality: {
        coordinate_completeness: coordinateCompleteness,
        metadata_completeness: metadataCompleteness
      },
      issues,
      recommendations
    });
  }

  /**
   * Generate health recommendations based on issues
   * @param {Object} issues - Issue counts
   * @returns {Array} Recommendations
   */
  static generateRecommendations(issues) {
    const recommendations = [];

    if (issues.stations_without_coordinates > 0) {
      recommendations.push({
        priority: 'high',
        category: 'data_quality',
        message: `${issues.stations_without_coordinates} station(s) missing coordinates. Add latitude/longitude for mapping.`
      });
    }

    if (issues.platforms_without_coordinates > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'data_quality',
        message: `${issues.platforms_without_coordinates} platform(s) missing coordinates. Consider adding precise platform locations.`
      });
    }

    if (issues.instruments_without_deployment_date > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'metadata',
        message: `${issues.instruments_without_deployment_date} instrument(s) missing deployment dates. Update for timeline analysis.`
      });
    }

    if (issues.instruments_without_height > 0) {
      recommendations.push({
        priority: 'low',
        category: 'metadata',
        message: `${issues.instruments_without_height} instrument(s) missing height data. Add for spatial analysis.`
      });
    }

    if (issues.instruments_without_rois > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'rois',
        message: `${issues.instruments_without_rois} instrument(s) have no ROIs defined. Add ROIs for image analysis.`
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'info',
        category: 'success',
        message: 'System health is excellent! All critical data is complete.'
      });
    }

    return recommendations;
  }

  /**
   * Check if system is healthy
   * @returns {boolean}
   */
  isHealthy() {
    return this.databaseHealthy && this.healthScore >= 80;
  }

  /**
   * Get critical issues count
   * @returns {number}
   */
  getCriticalIssuesCount() {
    return this.recommendations.filter(r => r.priority === 'high').length;
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      database_healthy: this.databaseHealthy,
      health_score: this.healthScore,
      data_quality: this.dataQuality,
      issues: this.issues,
      recommendations: this.recommendations
    };
  }
}
