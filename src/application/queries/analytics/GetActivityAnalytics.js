/**
 * Get Activity Analytics Query
 *
 * Retrieves activity log analytics.
 *
 * @module application/queries/analytics/GetActivityAnalytics
 */

export class GetActivityAnalytics {
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
    // Fetch all activity analytics in parallel
    const [
      activityLog,
      activityByDay,
      activityByType,
      entityTimeline
    ] = await Promise.allSettled([
      this.analyticsRepository.getActivityLog(50),
      this.analyticsRepository.getActivityByDay(30),
      this.analyticsRepository.getActivityByType(30),
      this.analyticsRepository.getEntityTimeline(100)
    ]);

    // Extract values with fallbacks
    const getValue = (result, fallback) =>
      result.status === 'fulfilled' ? result.value : fallback;

    const recentActivity = getValue(activityLog, []);

    return {
      recent_activity: recentActivity,
      activity_by_day: getValue(activityByDay, []),
      activity_by_type: getValue(activityByType, []),
      entity_timeline: getValue(entityTimeline, []),
      note: recentActivity.length === 0
        ? 'Activity logging will be available after activity_log table migration'
        : null
    };
  }
}
