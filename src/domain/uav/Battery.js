/**
 * UAV Battery Entity
 * Represents a UAV battery with lifecycle tracking and health monitoring
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module domain/uav/Battery
 * @version 15.0.0
 */

/**
 * Valid battery status values
 */
export const BATTERY_STATUSES = [
  'available',
  'in_use',
  'charging',
  'storage',
  'maintenance',
  'retired',
  'damaged'
];

/**
 * Valid battery chemistry types
 */
export const BATTERY_CHEMISTRIES = ['LiPo', 'LiHV', 'LiIon', 'other'];

/**
 * Battery Entity
 */
export class Battery {
  /**
   * @param {Object} props - Battery properties
   */
  constructor(props) {
    this.id = props.id;

    // Identification
    this.serial_number = props.serial_number;
    this.display_name = props.display_name;

    // Specifications
    this.manufacturer = props.manufacturer;
    this.model = props.model;
    this.capacity_mah = props.capacity_mah;
    this.cell_count = props.cell_count;
    this.chemistry = props.chemistry;

    // Assignment
    this.station_id = props.station_id;
    this.platform_id = props.platform_id;

    // From joins
    this.station_acronym = props.station_acronym;
    this.platform_name = props.platform_name;

    // Lifecycle
    this.purchase_date = props.purchase_date;
    this.first_use_date = props.first_use_date;
    this.last_use_date = props.last_use_date;
    this.cycle_count = props.cycle_count || 0;

    // Health
    this.health_percent = props.health_percent ?? 100;
    this.internal_resistance_mohm = props.internal_resistance_mohm;
    this.last_health_check_date = props.last_health_check_date;

    // Status
    this.status = props.status || 'available';
    this.storage_voltage_v = props.storage_voltage_v;

    // Notes
    this.notes = props.notes;

    // Timestamps
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;

    this.#validate();
  }

  /**
   * Validate battery data
   * @private
   */
  #validate() {
    if (!this.serial_number || this.serial_number.trim().length === 0) {
      throw new Error('Battery serial number is required');
    }

    if (!BATTERY_STATUSES.includes(this.status)) {
      throw new Error(`Invalid status. Must be one of: ${BATTERY_STATUSES.join(', ')}`);
    }

    if (this.chemistry && !BATTERY_CHEMISTRIES.includes(this.chemistry)) {
      throw new Error(`Invalid chemistry. Must be one of: ${BATTERY_CHEMISTRIES.join(', ')}`);
    }

    if (this.health_percent !== null && this.health_percent !== undefined) {
      if (this.health_percent < 0 || this.health_percent > 100) {
        throw new Error('Health percent must be between 0 and 100');
      }
    }

    if (this.cycle_count !== null && this.cycle_count !== undefined) {
      if (this.cycle_count < 0) {
        throw new Error('Cycle count cannot be negative');
      }
    }
  }

  /**
   * Check if battery is available for use
   * @returns {boolean}
   */
  isAvailable() {
    return this.status === 'available';
  }

  /**
   * Check if battery is in use
   * @returns {boolean}
   */
  isInUse() {
    return this.status === 'in_use';
  }

  /**
   * Check if battery is retired or damaged
   * @returns {boolean}
   */
  isRetired() {
    return ['retired', 'damaged'].includes(this.status);
  }

  /**
   * Check if battery needs health check (older than 30 days)
   * @param {number} [days=30] - Days threshold
   * @returns {boolean}
   */
  needsHealthCheck(days = 30) {
    if (!this.last_health_check_date) {
      return true;
    }
    const lastCheck = new Date(this.last_health_check_date);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    return lastCheck < threshold;
  }

  /**
   * Check if battery health is below threshold
   * @param {number} [threshold=80] - Health threshold percentage
   * @returns {boolean}
   */
  hasLowHealth(threshold = 80) {
    return this.health_percent < threshold;
  }

  /**
   * Get battery age in days
   * @returns {number|null}
   */
  getAgeInDays() {
    if (!this.purchase_date) {
      return null;
    }
    const purchase = new Date(this.purchase_date);
    const today = new Date();
    const diffTime = today.getTime() - purchase.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days since last use
   * @returns {number|null}
   */
  getDaysSinceLastUse() {
    if (!this.last_use_date) {
      return null;
    }
    const lastUse = new Date(this.last_use_date);
    const today = new Date();
    const diffTime = today.getTime() - lastUse.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get battery cell configuration string (e.g., "4S")
   * @returns {string|null}
   */
  getCellConfiguration() {
    if (!this.cell_count) {
      return null;
    }
    return `${this.cell_count}S`;
  }

  /**
   * Mark battery as in use
   * @returns {Battery}
   */
  markInUse() {
    if (this.isRetired()) {
      throw new Error('Cannot use a retired or damaged battery');
    }
    this.status = 'in_use';
    return this;
  }

  /**
   * Mark battery as available
   * @returns {Battery}
   */
  markAvailable() {
    if (this.isRetired()) {
      throw new Error('Cannot mark retired or damaged battery as available');
    }
    this.status = 'available';
    return this;
  }

  /**
   * Put battery in storage
   * @param {number} [voltage] - Storage voltage
   * @returns {Battery}
   */
  putInStorage(voltage) {
    this.status = 'storage';
    if (voltage !== undefined) {
      this.storage_voltage_v = voltage;
    }
    return this;
  }

  /**
   * Retire the battery
   * @param {string} [reason] - Reason for retirement
   * @returns {Battery}
   */
  retire(reason) {
    this.status = 'retired';
    if (reason) {
      this.notes = (this.notes || '') + `\nRetired: ${reason}`;
    }
    return this;
  }

  /**
   * Mark battery as damaged
   * @param {string} description - Damage description
   * @returns {Battery}
   */
  markDamaged(description) {
    this.status = 'damaged';
    this.notes = (this.notes || '') + `\nDamaged: ${description}`;
    return this;
  }

  /**
   * Record health check result
   * @param {number} healthPercent - Health percentage (0-100)
   * @param {number} [internalResistance] - Internal resistance in milliohms
   * @returns {Battery}
   */
  recordHealthCheck(healthPercent, internalResistance) {
    if (healthPercent < 0 || healthPercent > 100) {
      throw new Error('Health percent must be between 0 and 100');
    }
    this.health_percent = healthPercent;
    this.last_health_check_date = new Date().toISOString().split('T')[0];
    if (internalResistance !== undefined) {
      this.internal_resistance_mohm = internalResistance;
    }
    return this;
  }

  /**
   * Increment cycle count
   * @returns {Battery}
   */
  incrementCycle() {
    this.cycle_count += 1;
    this.last_use_date = new Date().toISOString().split('T')[0];
    return this;
  }

  /**
   * Convert to database record format
   * @returns {Object}
   */
  toRecord() {
    return {
      id: this.id,
      serial_number: this.serial_number,
      display_name: this.display_name,
      manufacturer: this.manufacturer,
      model: this.model,
      capacity_mah: this.capacity_mah,
      cell_count: this.cell_count,
      chemistry: this.chemistry,
      station_id: this.station_id,
      platform_id: this.platform_id,
      purchase_date: this.purchase_date,
      first_use_date: this.first_use_date,
      last_use_date: this.last_use_date,
      cycle_count: this.cycle_count,
      health_percent: this.health_percent,
      internal_resistance_mohm: this.internal_resistance_mohm,
      last_health_check_date: this.last_health_check_date,
      status: this.status,
      storage_voltage_v: this.storage_voltage_v,
      notes: this.notes
    };
  }

  /**
   * Convert to JSON (for API responses)
   * @returns {Object}
   */
  toJSON() {
    return {
      ...this.toRecord(),
      station_acronym: this.station_acronym,
      platform_name: this.platform_name,
      is_available: this.isAvailable(),
      is_retired: this.isRetired(),
      needs_health_check: this.needsHealthCheck(),
      has_low_health: this.hasLowHealth(),
      age_days: this.getAgeInDays(),
      days_since_last_use: this.getDaysSinceLastUse(),
      cell_configuration: this.getCellConfiguration(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Create Battery from database record
   * @param {Object} record - Database record
   * @returns {Battery}
   */
  static fromRecord(record) {
    return new Battery(record);
  }
}

export default Battery;
