/**
 * Activity Log Entity
 *
 * Represents an activity log entry tracking user actions.
 *
 * @module domain/admin/ActivityLog
 */

export class ActivityLog {
  /**
   * @param {Object} props - Activity log properties
   * @param {number} props.id - Unique identifier
   * @param {number|null} props.userId - User ID who performed the action
   * @param {string|null} props.username - Username
   * @param {string} props.action - Action type (create, update, delete, view, login, logout)
   * @param {string} props.entityType - Entity type (station, platform, instrument, etc.)
   * @param {number|null} props.entityId - Entity ID
   * @param {string|null} props.entityName - Entity name for display
   * @param {Object|null} props.details - Additional details (JSON)
   * @param {string|null} props.ipAddress - Client IP address
   * @param {string|null} props.userAgent - Client user agent
   * @param {string|null} props.stationId - Associated station ID
   * @param {string|null} props.stationAcronym - Associated station acronym
   * @param {Date} props.createdAt - Timestamp
   */
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId;
    this.username = props.username;
    this.action = props.action;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.entityName = props.entityName;
    this.details = props.details;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.stationId = props.stationId;
    this.stationAcronym = props.stationAcronym;
    this.createdAt = props.createdAt;
  }

  /**
   * Valid action types
   */
  static get ACTIONS() {
    return ['create', 'update', 'delete', 'view', 'login', 'logout'];
  }

  /**
   * Valid entity types
   */
  static get ENTITY_TYPES() {
    return ['station', 'platform', 'instrument', 'roi', 'aoi', 'campaign', 'user', 'system'];
  }

  /**
   * Create from database row
   * @param {Object} row - Database row
   * @returns {ActivityLog}
   */
  static fromRow(row) {
    let details = null;
    if (row.details) {
      try {
        details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
      } catch {
        details = row.details;
      }
    }

    return new ActivityLog({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityName: row.entity_name,
      details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      stationId: row.station_id,
      stationAcronym: row.station_acronym,
      createdAt: row.created_at ? new Date(row.created_at) : new Date()
    });
  }

  /**
   * Convert to JSON representation
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      username: this.username,
      action: this.action,
      entity_type: this.entityType,
      entity_id: this.entityId,
      entity_name: this.entityName,
      details: this.details,
      ip_address: this.ipAddress,
      station_id: this.stationId,
      station_acronym: this.stationAcronym,
      created_at: this.createdAt?.toISOString()
    };
  }
}

/**
 * User Session Summary
 *
 * Represents aggregated user session/login data.
 */
export class UserSessionSummary {
  /**
   * @param {Object} props - Session summary properties
   */
  constructor(props) {
    this.id = props.id;
    this.username = props.username;
    this.role = props.role;
    this.stationId = props.stationId;
    this.stationAcronym = props.stationAcronym;
    this.lastLogin = props.lastLogin;
    this.loginCount = props.loginCount;
    this.active = props.active;
  }

  /**
   * Create from database row
   * @param {Object} row - Database row
   * @returns {UserSessionSummary}
   */
  static fromRow(row) {
    return new UserSessionSummary({
      id: row.id,
      username: row.username,
      role: row.role,
      stationId: row.station_id,
      stationAcronym: row.station_acronym,
      lastLogin: row.last_login ? new Date(row.last_login) : null,
      loginCount: row.login_count || 0,
      active: row.active === 1
    });
  }

  /**
   * Convert to JSON representation
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      station_id: this.stationId,
      station_acronym: this.stationAcronym,
      last_login: this.lastLogin?.toISOString() || null,
      login_count: this.loginCount,
      active: this.active
    };
  }
}

/**
 * Station Activity Statistics
 *
 * Represents aggregated activity statistics for a station.
 */
export class StationActivityStats {
  /**
   * @param {Object} props - Station stats properties
   */
  constructor(props) {
    this.stationId = props.stationId;
    this.stationAcronym = props.stationAcronym;
    this.displayName = props.displayName;
    this.totalActivity = props.totalActivity;
    this.createCount = props.createCount;
    this.updateCount = props.updateCount;
    this.deleteCount = props.deleteCount;
    this.lastActivity = props.lastActivity;
    this.uniqueUsers = props.uniqueUsers;
  }

  /**
   * Create from database row
   * @param {Object} row - Database row
   * @returns {StationActivityStats}
   */
  static fromRow(row) {
    return new StationActivityStats({
      stationId: row.station_id || row.id,
      stationAcronym: row.acronym || row.station_acronym,
      displayName: row.display_name,
      totalActivity: row.total_activity || 0,
      createCount: row.create_count || 0,
      updateCount: row.update_count || 0,
      deleteCount: row.delete_count || 0,
      lastActivity: row.last_activity ? new Date(row.last_activity) : null,
      uniqueUsers: row.unique_users || 0
    });
  }

  /**
   * Convert to JSON representation
   * @returns {Object}
   */
  toJSON() {
    return {
      station_id: this.stationId,
      station_acronym: this.stationAcronym,
      display_name: this.displayName,
      total_activity: this.totalActivity,
      create_count: this.createCount,
      update_count: this.updateCount,
      delete_count: this.deleteCount,
      last_activity: this.lastActivity?.toISOString() || null,
      unique_users: this.uniqueUsers
    };
  }
}
