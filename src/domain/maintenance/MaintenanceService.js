/**
 * Maintenance Service
 *
 * Domain service for maintenance record business logic.
 * Handles validation, scheduling, and timeline operations.
 *
 * @module domain/maintenance/MaintenanceService
 */

import { MaintenanceRecord } from './MaintenanceRecord.js';

/**
 * Maintenance Service
 */
export class MaintenanceService {
  /**
   * Create a new maintenance record
   * @param {Object} data - Maintenance data
   * @returns {{ record: MaintenanceRecord, errors: string[] }}
   */
  createRecord(data) {
    const record = new MaintenanceRecord({
      entityType: data.entityType,
      entityId: data.entityId,
      stationId: data.stationId,
      maintenanceType: data.maintenanceType,
      status: data.status || MaintenanceRecord.STATUS.SCHEDULED,
      priority: data.priority || MaintenanceRecord.PRIORITY.MEDIUM,
      scheduledDate: data.scheduledDate,
      performedDate: data.performedDate,
      completedDate: data.completedDate,
      performedBy: data.performedBy,
      performedByUserId: data.performedByUserId,
      description: data.description,
      workPerformed: data.workPerformed,
      partsReplaced: data.partsReplaced,
      cost: data.cost,
      currency: data.currency || 'SEK',
      duration: data.duration,
      nextScheduledDate: data.nextScheduledDate,
      notes: data.notes,
      attachments: data.attachments || [],
      metadata: data.metadata || {},
      createdAt: new Date().toISOString()
    });

    const validation = record.validate();
    return {
      record: validation.valid ? record : null,
      errors: validation.errors
    };
  }

  /**
   * Schedule preventive maintenance
   * @param {Object} data - Scheduling data
   * @returns {{ record: MaintenanceRecord, errors: string[] }}
   */
  schedulePreventive(data) {
    return this.createRecord({
      ...data,
      maintenanceType: MaintenanceRecord.TYPES.PREVENTIVE,
      status: MaintenanceRecord.STATUS.SCHEDULED
    });
  }

  /**
   * Log completed maintenance (for historical records)
   * @param {Object} data - Maintenance data
   * @returns {{ record: MaintenanceRecord, errors: string[] }}
   */
  logCompleted(data) {
    const result = this.createRecord({
      ...data,
      status: MaintenanceRecord.STATUS.COMPLETED,
      completedDate: data.completedDate || data.performedDate || new Date().toISOString()
    });

    return result;
  }

  /**
   * Start a scheduled maintenance
   * @param {MaintenanceRecord} record
   * @param {Object} data - { performedBy, performedByUserId }
   * @returns {{ record: MaintenanceRecord, errors: string[] }}
   */
  startMaintenance(record, { performedBy, performedByUserId }) {
    const errors = [];

    if (record.status !== MaintenanceRecord.STATUS.SCHEDULED &&
        record.status !== MaintenanceRecord.STATUS.DEFERRED) {
      errors.push(`Cannot start maintenance with status: ${record.status}`);
      return { record: null, errors };
    }

    if (!performedBy) {
      errors.push('Performed by is required');
      return { record: null, errors };
    }

    record.start(performedBy, performedByUserId);
    record.updatedAt = new Date().toISOString();

    return { record, errors: [] };
  }

  /**
   * Complete a maintenance record
   * @param {MaintenanceRecord} record
   * @param {Object} data - Completion data
   * @returns {{ record: MaintenanceRecord, errors: string[] }}
   */
  completeMaintenance(record, data) {
    const errors = [];

    if (record.status === MaintenanceRecord.STATUS.COMPLETED) {
      errors.push('Maintenance is already completed');
      return { record: null, errors };
    }

    if (record.status === MaintenanceRecord.STATUS.CANCELLED) {
      errors.push('Cannot complete cancelled maintenance');
      return { record: null, errors };
    }

    record.complete(data);
    record.updatedAt = new Date().toISOString();

    return { record, errors: [] };
  }

  /**
   * Cancel a maintenance record
   * @param {MaintenanceRecord} record
   * @param {string} reason
   * @returns {{ record: MaintenanceRecord, errors: string[] }}
   */
  cancelMaintenance(record, reason) {
    const errors = [];

    if (record.status === MaintenanceRecord.STATUS.COMPLETED) {
      errors.push('Cannot cancel completed maintenance');
      return { record: null, errors };
    }

    if (record.status === MaintenanceRecord.STATUS.CANCELLED) {
      errors.push('Maintenance is already cancelled');
      return { record: null, errors };
    }

    record.cancel(reason);
    record.updatedAt = new Date().toISOString();

    return { record, errors: [] };
  }

  /**
   * Defer a maintenance record
   * @param {MaintenanceRecord} record
   * @param {string} newDate
   * @param {string} reason
   * @returns {{ record: MaintenanceRecord, errors: string[] }}
   */
  deferMaintenance(record, newDate, reason) {
    const errors = [];

    if (record.status === MaintenanceRecord.STATUS.COMPLETED) {
      errors.push('Cannot defer completed maintenance');
      return { record: null, errors };
    }

    if (!newDate) {
      errors.push('New scheduled date is required');
      return { record: null, errors };
    }

    if (new Date(newDate) <= new Date()) {
      errors.push('New date must be in the future');
      return { record: null, errors };
    }

    record.defer(newDate, reason);
    record.updatedAt = new Date().toISOString();

    return { record, errors: [] };
  }

  /**
   * Update maintenance record
   * @param {MaintenanceRecord} record
   * @param {Object} updates
   * @returns {{ record: MaintenanceRecord, errors: string[] }}
   */
  updateRecord(record, updates) {
    // Apply updates
    if (updates.description !== undefined) record.description = updates.description;
    if (updates.priority !== undefined) record.priority = updates.priority;
    if (updates.scheduledDate !== undefined) record.scheduledDate = updates.scheduledDate;
    if (updates.performedBy !== undefined) record.performedBy = updates.performedBy;
    if (updates.workPerformed !== undefined) record.workPerformed = updates.workPerformed;
    if (updates.partsReplaced !== undefined) record.partsReplaced = updates.partsReplaced;
    if (updates.cost !== undefined) record.cost = updates.cost;
    if (updates.duration !== undefined) record.duration = updates.duration;
    if (updates.nextScheduledDate !== undefined) record.nextScheduledDate = updates.nextScheduledDate;
    if (updates.notes !== undefined) record.notes = updates.notes;
    if (updates.attachments !== undefined) record.attachments = updates.attachments;
    if (updates.metadata !== undefined) record.metadata = { ...record.metadata, ...updates.metadata };

    record.updatedAt = new Date().toISOString();

    const validation = record.validate();
    return {
      record: validation.valid ? record : null,
      errors: validation.errors
    };
  }

  /**
   * Calculate days since last maintenance
   * @param {MaintenanceRecord} lastRecord
   * @returns {number|null}
   */
  daysSinceLastMaintenance(lastRecord) {
    if (!lastRecord || !lastRecord.completedDate) {
      return null;
    }

    const completed = new Date(lastRecord.completedDate);
    const now = new Date();
    const diffTime = Math.abs(now - completed);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate days until next scheduled maintenance
   * @param {MaintenanceRecord} nextRecord
   * @returns {number|null}
   */
  daysUntilNextMaintenance(nextRecord) {
    if (!nextRecord || !nextRecord.scheduledDate) {
      return null;
    }

    const scheduled = new Date(nextRecord.scheduledDate);
    const now = new Date();
    const diffTime = scheduled - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get maintenance summary for an entity
   * @param {MaintenanceRecord[]} records
   * @returns {Object}
   */
  getSummary(records) {
    const completed = records.filter(r => r.isCompleted());
    const scheduled = records.filter(r => r.status === MaintenanceRecord.STATUS.SCHEDULED);
    const overdue = records.filter(r => r.isOverdue());
    const inProgress = records.filter(r => r.status === MaintenanceRecord.STATUS.IN_PROGRESS);

    const totalCost = completed.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalDuration = completed.reduce((sum, r) => sum + (r.duration || 0), 0);

    const typeBreakdown = {};
    for (const record of records) {
      typeBreakdown[record.maintenanceType] = (typeBreakdown[record.maintenanceType] || 0) + 1;
    }

    return {
      total: records.length,
      completed: completed.length,
      scheduled: scheduled.length,
      overdue: overdue.length,
      inProgress: inProgress.length,
      totalCost,
      totalDuration,
      typeBreakdown,
      lastMaintenance: completed.length > 0 ? completed[0] : null,
      nextMaintenance: scheduled.length > 0 ? scheduled[0] : null
    };
  }

  /**
   * Get platform-specific maintenance types
   * @returns {string[]}
   */
  getPlatformMaintenanceTypes() {
    return [
      MaintenanceRecord.TYPES.PREVENTIVE,
      MaintenanceRecord.TYPES.CORRECTIVE,
      MaintenanceRecord.TYPES.INSPECTION,
      MaintenanceRecord.TYPES.CLEANING,
      MaintenanceRecord.TYPES.REPLACEMENT,
      MaintenanceRecord.TYPES.INSTALLATION,
      MaintenanceRecord.TYPES.DECOMMISSION
    ];
  }

  /**
   * Get instrument-specific maintenance types
   * @returns {string[]}
   */
  getInstrumentMaintenanceTypes() {
    return [
      MaintenanceRecord.TYPES.PREVENTIVE,
      MaintenanceRecord.TYPES.CORRECTIVE,
      MaintenanceRecord.TYPES.INSPECTION,
      MaintenanceRecord.TYPES.CLEANING,
      MaintenanceRecord.TYPES.FIRMWARE_UPDATE,
      MaintenanceRecord.TYPES.REPLACEMENT,
      MaintenanceRecord.TYPES.CALIBRATION_CHECK,
      MaintenanceRecord.TYPES.INSTALLATION,
      MaintenanceRecord.TYPES.DECOMMISSION
    ];
  }
}
