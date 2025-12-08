/**
 * Get Maintenance Timeline Query
 *
 * Retrieves the maintenance timeline for a platform or instrument.
 * Shows historical maintenance events in chronological order.
 *
 * @module application/queries/GetMaintenanceTimeline
 */

export class GetMaintenanceTimeline {
  constructor({ maintenanceRepository }) {
    this.maintenanceRepository = maintenanceRepository;
  }

  async execute({ entityType, entityId, startDate, endDate }) {
    if (!entityType || !entityId) {
      throw new Error('Entity type and entity ID are required');
    }

    if (!['platform', 'instrument'].includes(entityType)) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }

    const timeline = await this.maintenanceRepository.findTimeline(
      entityType,
      entityId,
      { startDate, endDate }
    );

    // Group by year/month for easier visualization
    const grouped = this.groupByPeriod(timeline);

    return {
      entityType,
      entityId,
      timeline,
      grouped,
      summary: this.calculateSummary(timeline)
    };
  }

  groupByPeriod(records) {
    const grouped = {};

    for (const record of records) {
      const date = new Date(record.scheduledDate || record.createdAt);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[yearMonth]) {
        grouped[yearMonth] = [];
      }
      grouped[yearMonth].push(record);
    }

    return grouped;
  }

  calculateSummary(records) {
    const completed = records.filter(r => r.status === 'completed');
    const totalCost = completed.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalDuration = completed.reduce((sum, r) => sum + (r.duration || 0), 0);

    const byType = {};
    for (const record of records) {
      byType[record.type] = (byType[record.type] || 0) + 1;
    }

    return {
      totalRecords: records.length,
      completedRecords: completed.length,
      totalCost,
      totalDurationMinutes: totalDuration,
      byType
    };
  }
}
