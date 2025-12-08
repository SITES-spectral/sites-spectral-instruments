/**
 * Maintenance Record Entity
 *
 * Represents a maintenance event for platforms or instruments.
 * Supports timeline tracking for maintenance history.
 *
 * @module domain/maintenance/MaintenanceRecord
 */

/**
 * Maintenance Record Entity
 */
export class MaintenanceRecord {
  /**
   * Entity types that can have maintenance records
   */
  static ENTITY_TYPES = {
    PLATFORM: 'platform',
    INSTRUMENT: 'instrument'
  };

  /**
   * Maintenance types
   */
  static TYPES = {
    PREVENTIVE: 'preventive',      // Scheduled/routine maintenance
    CORRECTIVE: 'corrective',      // Repairs after failure
    INSPECTION: 'inspection',      // Regular inspection/check
    CLEANING: 'cleaning',          // Cleaning of sensors/equipment
    FIRMWARE_UPDATE: 'firmware_update', // Software/firmware updates
    REPLACEMENT: 'replacement',    // Component replacement
    CALIBRATION_CHECK: 'calibration_check', // Pre-calibration check
    INSTALLATION: 'installation',  // Initial installation
    DECOMMISSION: 'decommission'   // Decommissioning/removal
  };

  /**
   * Maintenance status
   */
  static STATUS = {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DEFERRED: 'deferred'
  };

  /**
   * Priority levels
   */
  static PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  /**
   * @param {Object} props - Maintenance record properties
   */
  constructor({
    id = null,
    entityType,
    entityId,
    stationId = null,
    maintenanceType,
    status = MaintenanceRecord.STATUS.COMPLETED,
    priority = MaintenanceRecord.PRIORITY.MEDIUM,
    scheduledDate = null,
    performedDate = null,
    completedDate = null,
    performedBy = null,
    performedByUserId = null,
    description = null,
    workPerformed = null,
    partsReplaced = null,
    cost = null,
    currency = 'SEK',
    duration = null,
    nextScheduledDate = null,
    notes = null,
    attachments = [],
    metadata = {},
    createdAt = null,
    updatedAt = null
  }) {
    this.id = id;
    this.entityType = entityType;
    this.entityId = entityId;
    this.stationId = stationId;
    this.maintenanceType = maintenanceType;
    this.status = status;
    this.priority = priority;
    this.scheduledDate = scheduledDate;
    this.performedDate = performedDate;
    this.completedDate = completedDate;
    this.performedBy = performedBy;
    this.performedByUserId = performedByUserId;
    this.description = description;
    this.workPerformed = workPerformed;
    this.partsReplaced = partsReplaced;
    this.cost = cost;
    this.currency = currency;
    this.duration = duration; // Duration in minutes
    this.nextScheduledDate = nextScheduledDate;
    this.notes = notes;
    this.attachments = attachments;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Validate the maintenance record
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.entityType) {
      errors.push('Entity type is required');
    } else if (!Object.values(MaintenanceRecord.ENTITY_TYPES).includes(this.entityType)) {
      errors.push(`Invalid entity type: ${this.entityType}`);
    }

    if (!this.entityId) {
      errors.push('Entity ID is required');
    }

    if (!this.maintenanceType) {
      errors.push('Maintenance type is required');
    } else if (!Object.values(MaintenanceRecord.TYPES).includes(this.maintenanceType)) {
      errors.push(`Invalid maintenance type: ${this.maintenanceType}`);
    }

    if (this.status && !Object.values(MaintenanceRecord.STATUS).includes(this.status)) {
      errors.push(`Invalid status: ${this.status}`);
    }

    if (this.priority && !Object.values(MaintenanceRecord.PRIORITY).includes(this.priority)) {
      errors.push(`Invalid priority: ${this.priority}`);
    }

    // Date validations
    if (this.completedDate && this.performedDate) {
      const performed = new Date(this.performedDate);
      const completed = new Date(this.completedDate);
      if (completed < performed) {
        errors.push('Completed date cannot be before performed date');
      }
    }

    // Cost validation
    if (this.cost !== null && this.cost < 0) {
      errors.push('Cost cannot be negative');
    }

    // Duration validation
    if (this.duration !== null && this.duration < 0) {
      errors.push('Duration cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if maintenance is for a platform
   * @returns {boolean}
   */
  isPlatformMaintenance() {
    return this.entityType === MaintenanceRecord.ENTITY_TYPES.PLATFORM;
  }

  /**
   * Check if maintenance is for an instrument
   * @returns {boolean}
   */
  isInstrumentMaintenance() {
    return this.entityType === MaintenanceRecord.ENTITY_TYPES.INSTRUMENT;
  }

  /**
   * Check if maintenance is completed
   * @returns {boolean}
   */
  isCompleted() {
    return this.status === MaintenanceRecord.STATUS.COMPLETED;
  }

  /**
   * Check if maintenance is overdue
   * @returns {boolean}
   */
  isOverdue() {
    if (this.status !== MaintenanceRecord.STATUS.SCHEDULED) {
      return false;
    }
    if (!this.scheduledDate) {
      return false;
    }
    return new Date(this.scheduledDate) < new Date();
  }

  /**
   * Mark maintenance as started
   * @param {string} performedBy - Person performing maintenance
   * @param {number} performedByUserId - User ID
   */
  start(performedBy, performedByUserId = null) {
    this.status = MaintenanceRecord.STATUS.IN_PROGRESS;
    this.performedDate = new Date().toISOString();
    this.performedBy = performedBy;
    this.performedByUserId = performedByUserId;
  }

  /**
   * Mark maintenance as completed
   * @param {Object} options - Completion options
   */
  complete({ workPerformed, partsReplaced, cost, duration, notes, nextScheduledDate } = {}) {
    this.status = MaintenanceRecord.STATUS.COMPLETED;
    this.completedDate = new Date().toISOString();
    if (workPerformed) this.workPerformed = workPerformed;
    if (partsReplaced) this.partsReplaced = partsReplaced;
    if (cost !== undefined) this.cost = cost;
    if (duration !== undefined) this.duration = duration;
    if (notes) this.notes = notes;
    if (nextScheduledDate) this.nextScheduledDate = nextScheduledDate;
  }

  /**
   * Cancel the maintenance
   * @param {string} reason - Cancellation reason
   */
  cancel(reason) {
    this.status = MaintenanceRecord.STATUS.CANCELLED;
    this.notes = reason ? `Cancelled: ${reason}` : 'Cancelled';
  }

  /**
   * Defer the maintenance to a new date
   * @param {string} newDate - New scheduled date
   * @param {string} reason - Deferral reason
   */
  defer(newDate, reason) {
    this.status = MaintenanceRecord.STATUS.DEFERRED;
    this.scheduledDate = newDate;
    if (reason) {
      this.notes = this.notes
        ? `${this.notes}\nDeferred: ${reason}`
        : `Deferred: ${reason}`;
    }
  }

  /**
   * Convert to JSON representation
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      entity_type: this.entityType,
      entity_id: this.entityId,
      station_id: this.stationId,
      maintenance_type: this.maintenanceType,
      status: this.status,
      priority: this.priority,
      scheduled_date: this.scheduledDate,
      performed_date: this.performedDate,
      completed_date: this.completedDate,
      performed_by: this.performedBy,
      performed_by_user_id: this.performedByUserId,
      description: this.description,
      work_performed: this.workPerformed,
      parts_replaced: this.partsReplaced,
      cost: this.cost,
      currency: this.currency,
      duration: this.duration,
      next_scheduled_date: this.nextScheduledDate,
      notes: this.notes,
      attachments: this.attachments,
      metadata: this.metadata,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      // Computed properties
      is_overdue: this.isOverdue(),
      is_completed: this.isCompleted()
    };
  }

  /**
   * Create from database row
   * @param {Object} row - Database row
   * @returns {MaintenanceRecord}
   */
  static fromRow(row) {
    return new MaintenanceRecord({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      stationId: row.station_id,
      maintenanceType: row.maintenance_type,
      status: row.status,
      priority: row.priority,
      scheduledDate: row.scheduled_date,
      performedDate: row.performed_date,
      completedDate: row.completed_date,
      performedBy: row.performed_by,
      performedByUserId: row.performed_by_user_id,
      description: row.description,
      workPerformed: row.work_performed,
      partsReplaced: row.parts_replaced ? JSON.parse(row.parts_replaced) : null,
      cost: row.cost,
      currency: row.currency,
      duration: row.duration,
      nextScheduledDate: row.next_scheduled_date,
      notes: row.notes,
      attachments: row.attachments_json ? JSON.parse(row.attachments_json) : [],
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
