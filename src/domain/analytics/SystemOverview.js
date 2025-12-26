/**
 * System Overview Value Object
 *
 * Represents system-wide analytics summary.
 *
 * @module domain/analytics/SystemOverview
 */

export class SystemOverview {
  /**
   * @param {Object} props
   * @param {Object} props.summary - Count summary
   * @param {Object} props.statusBreakdown - Status distributions
   * @param {Array} props.instrumentTypes - Instrument type counts
   * @param {Array} props.ecosystems - Ecosystem distribution
   * @param {Array} props.deploymentTimeline - Deployment timeline
   * @param {Array} props.recentActivity - Recent activity
   */
  constructor(props) {
    this.generatedAt = new Date().toISOString();
    this.summary = props.summary;
    this.statusBreakdown = props.statusBreakdown;
    this.instrumentTypes = props.instrumentTypes;
    this.ecosystems = props.ecosystems;
    this.deploymentTimeline = props.deploymentTimeline;
    this.recentActivity = props.recentActivity;

    Object.freeze(this);
  }

  /**
   * Create from raw database results
   * @param {Object} data - Raw query results
   * @returns {SystemOverview}
   */
  static fromQueryResults(data) {
    const {
      stationsCount,
      platformsCount,
      instrumentsCount,
      roisCount,
      stationsStatus,
      platformsStatus,
      instrumentsStatus,
      instrumentTypes,
      ecosystems,
      deploymentTimeline,
      recentActivity
    } = data;

    // Calculate averages
    const avgPlatformsPerStation = platformsCount / Math.max(stationsCount, 1);
    const avgInstrumentsPerPlatform = instrumentsCount / Math.max(platformsCount, 1);
    const avgROIsPerInstrument = roisCount / Math.max(instrumentsCount, 1);

    return new SystemOverview({
      summary: {
        total_stations: stationsCount,
        total_platforms: platformsCount,
        total_instruments: instrumentsCount,
        total_rois: roisCount,
        avg_platforms_per_station: Math.round(avgPlatformsPerStation * 10) / 10,
        avg_instruments_per_platform: Math.round(avgInstrumentsPerPlatform * 10) / 10,
        avg_rois_per_instrument: Math.round(avgROIsPerInstrument * 10) / 10
      },
      statusBreakdown: {
        stations: stationsStatus,
        platforms: platformsStatus,
        instruments: instrumentsStatus
      },
      instrumentTypes,
      ecosystems,
      deploymentTimeline,
      recentActivity
    });
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      generated_at: this.generatedAt,
      summary: this.summary,
      status_breakdown: this.statusBreakdown,
      instrument_types: this.instrumentTypes,
      ecosystems: this.ecosystems,
      deployment_timeline: this.deploymentTimeline,
      recent_activity: this.recentActivity
    };
  }
}
