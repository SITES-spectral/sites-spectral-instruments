/**
 * Security Port
 *
 * Port interface for authentication and authorization.
 * Implementations live in infrastructure layer.
 *
 * @module domain/shared/ports/SecurityPort
 * @version 13.1.0
 */

/**
 * Principal - represents an authenticated user
 */
export class Principal {
  /**
   * Create a principal
   * @param {Object} params
   * @param {string} params.userId - User ID
   * @param {string} params.username - Username
   * @param {string[]} params.roles - User roles
   * @param {number|null} params.stationId - Associated station ID
   * @param {string|null} params.stationAcronym - Associated station acronym
   * @param {string[]} params.permissions - Granted permissions
   */
  constructor({ userId, username, roles, stationId = null, stationAcronym = null, permissions = [] }) {
    this.userId = userId;
    this.username = username;
    this.roles = roles;
    this.stationId = stationId;
    this.stationAcronym = stationAcronym;
    this.permissions = permissions;
  }

  /**
   * Check if principal has a specific role
   * @param {string} role
   * @returns {boolean}
   */
  hasRole(role) {
    return this.roles.includes(role);
  }

  /**
   * Check if principal has any of the specified roles
   * @param {string[]} roles
   * @returns {boolean}
   */
  hasAnyRole(roles) {
    return roles.some(role => this.roles.includes(role));
  }

  /**
   * Check if principal has a specific permission
   * @param {string} permission
   * @returns {boolean}
   */
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  /**
   * Check if principal is a super admin
   * @returns {boolean}
   */
  isSuperAdmin() {
    return this.hasAnyRole(['admin', 'sites-admin']);
  }

  /**
   * Check if principal can access a specific station
   * @param {number} stationId
   * @returns {boolean}
   */
  canAccessStation(stationId) {
    if (this.isSuperAdmin()) return true;
    return this.stationId === stationId;
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

/**
 * Security Port (Abstract)
 *
 * @interface
 */
export class SecurityPort {
  /**
   * Authenticate a token and return a Principal
   * @param {string} token - Authentication token
   * @returns {Promise<Principal>}
   * @throws {AuthenticationError}
   */
  async authenticate(token) {
    throw new Error('SecurityPort.authenticate() must be implemented');
  }

  /**
   * Check if principal is authorized for an action on a resource
   * @param {Principal} principal - Authenticated principal
   * @param {string} resource - Resource name (e.g., 'stations', 'instruments')
   * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
   * @param {Object} [context] - Additional context (e.g., { stationId: 5 })
   * @returns {Promise<boolean>}
   */
  async authorize(principal, resource, action, context = {}) {
    throw new Error('SecurityPort.authorize() must be implemented');
  }

  /**
   * Check authorization and throw if not authorized
   * @param {Principal} principal
   * @param {string} resource
   * @param {string} action
   * @param {Object} [context]
   * @throws {AuthorizationError}
   */
  async requireAuthorization(principal, resource, action, context = {}) {
    const authorized = await this.authorize(principal, resource, action, context);
    if (!authorized) {
      throw new AuthorizationError(`Access denied: cannot ${action} ${resource}`);
    }
  }
}

export default SecurityPort;
