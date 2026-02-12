/**
 * UAV Authorization Service
 *
 * Domain service for UAV-specific authorization decisions.
 * Handles mission approval, flight log creation, and battery access control.
 *
 * Addresses security audit issues:
 * - UAV-001: Mission approval authorization
 * - UAV-002: Flight log pilot validation
 * - UAV-003: Station-scoped battery access
 * - UAV-004: CRUD authorization logic
 *
 * @module domain/uav/authorization/UAVAuthorizationService
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md
 */

/**
 * UAV Authorization Service
 *
 * Provides authorization decisions for UAV domain operations.
 * All methods follow the principle of least privilege.
 */
export class UAVAuthorizationService {
  /**
   * Check if user can approve a mission (UAV-001)
   *
   * Only global admins and station admins (for their own station) can approve missions.
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @param {{station_id: number}} mission - The mission to approve
   * @returns {boolean} Whether user can approve the mission
   */
  canApproveMission(user, mission) {
    // Global admins can approve any mission
    if (user.isGlobalAdmin()) {
      return true;
    }

    // Station admins can only approve missions at their station
    if (user.isStationAdmin() && user.hasAccessToStation(mission.station_id)) {
      return true;
    }

    // No one else can approve missions
    return false;
  }

  /**
   * Check if user can create a flight log for a mission (UAV-002)
   *
   * Validates:
   * 1. User has access to the mission's station
   * 2. Pilot is assigned to the mission
   * 3. User is the pilot OR has admin access
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @param {{station_id: number, assigned_pilots?: Array<{pilot_id: number}>}} mission - The mission
   * @param {number} pilotId - The pilot ID for the flight log
   * @returns {boolean} Whether user can create the flight log
   */
  canCreateFlightLog(user, mission, pilotId) {
    // Global admins can create any flight log
    if (user.isGlobalAdmin()) {
      return true;
    }

    // Must have access to the mission's station
    if (!user.hasAccessToStation(mission.station_id)) {
      return false;
    }

    // Check if pilot is assigned to the mission
    const assignedPilots = mission.assigned_pilots || [];
    const isPilotAssigned = assignedPilots.some(p => p.pilot_id === pilotId);

    if (!isPilotAssigned) {
      return false;
    }

    // Station admins can create logs for any assigned pilot at their station
    if (user.isStationAdmin()) {
      return true;
    }

    // UAV pilots can only create logs for themselves
    if (user.isUAVPilot() && user.pilotId === pilotId) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can access a battery (UAV-003)
   *
   * Access is station-scoped except for global admins.
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @param {{station_id: number}} battery - The battery
   * @returns {boolean} Whether user can access the battery
   */
  canAccessBattery(user, battery) {
    // Global admins can access any battery
    if (user.isGlobalAdmin()) {
      return true;
    }

    // Must have access to the battery's station
    if (!user.hasAccessToStation(battery.station_id)) {
      return false;
    }

    // Station admins and UAV pilots can access their station's batteries
    if (user.isStationAdmin() || user.isUAVPilot()) {
      return true;
    }

    // Station users can view but this method is for access (read)
    if (user.isStationUser()) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can modify a battery (UAV-003)
   *
   * Modification requires admin access.
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @param {{station_id: number}} battery - The battery
   * @returns {boolean} Whether user can modify the battery
   */
  canModifyBattery(user, battery) {
    // Global admins can modify any battery
    if (user.isGlobalAdmin()) {
      return true;
    }

    // Station admins can modify their station's batteries
    if (user.isStationAdmin() && user.hasAccessToStation(battery.station_id)) {
      return true;
    }

    // UAV pilots and regular users cannot modify batteries
    return false;
  }

  /**
   * Check if user can manage a pilot (UAV-004)
   *
   * Management includes create, update, delete, authorize/deauthorize.
   * Pilots can be authorized for multiple stations, so station admins
   * can manage pilots who are authorized for their station.
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @param {{station_id?: number, authorized_stations?: number[]}} pilot - The pilot (may be null for create)
   * @returns {boolean} Whether user can manage the pilot
   */
  canManagePilot(user, pilot) {
    // Global admins can manage any pilot
    if (user.isGlobalAdmin()) {
      return true;
    }

    // Station admins can manage pilots
    if (user.isStationAdmin()) {
      // For create (no existing pilot), station admins can create pilots
      // The pilot will be authorized for the admin's station
      if (!pilot) {
        return true;
      }

      // For existing pilots, check if pilot is authorized for admin's station
      // Check both station_id (legacy) and authorized_stations (current)
      if (pilot.station_id && user.hasAccessToStation(pilot.station_id)) {
        return true;
      }

      // Check authorized_stations array
      const authorizedStations = pilot.authorized_stations || [];
      if (Array.isArray(authorizedStations)) {
        for (const stationId of authorizedStations) {
          if (user.hasAccessToStation(stationId)) {
            return true;
          }
        }
      }

      return false;
    }

    return false;
  }

  /**
   * Check if user can manage a mission (UAV-004)
   *
   * Management includes create, update, delete, state transitions.
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @param {{station_id: number}} mission - The mission
   * @returns {boolean} Whether user can manage the mission
   */
  canManageMission(user, mission) {
    // Global admins can manage any mission
    if (user.isGlobalAdmin()) {
      return true;
    }

    // Station admins can manage missions at their station
    if (user.isStationAdmin() && user.hasAccessToStation(mission.station_id)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can view a mission
   *
   * Viewing is more permissive than management.
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @param {{station_id: number}} mission - The mission
   * @returns {boolean} Whether user can view the mission
   */
  canViewMission(user, mission) {
    // Global admins can view any mission
    if (user.isGlobalAdmin()) {
      return true;
    }

    // Anyone with station access can view missions
    return user.hasAccessToStation(mission.station_id);
  }

  /**
   * Get the station scope for list operations
   *
   * Returns the station IDs the user can access, or 'all' for global admins.
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @returns {{all: boolean, stationIds?: number[]}} Station scope
   */
  getStationScope(user) {
    // Global admins see all stations
    if (user.isGlobalAdmin()) {
      return { all: true };
    }

    // Station-scoped users see only their station(s)
    if (user.stationId) {
      return {
        all: false,
        stationIds: [user.stationId]
      };
    }

    // Users without station assignment see nothing
    return {
      all: false,
      stationIds: []
    };
  }

  /**
   * Filter a list of entities by station scope
   *
   * @param {import('../../authorization/User.js').User} user - The user
   * @param {Array<{station_id: number}>} entities - Entities to filter
   * @returns {Array} Filtered entities
   */
  filterByStationScope(user, entities) {
    const scope = this.getStationScope(user);

    if (scope.all) {
      return entities;
    }

    return entities.filter(e => scope.stationIds.includes(e.station_id));
  }
}

export default UAVAuthorizationService;
