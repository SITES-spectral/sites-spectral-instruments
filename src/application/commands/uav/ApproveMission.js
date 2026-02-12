/**
 * Approve Mission Command
 *
 * Application layer command for approving a UAV mission.
 * Includes authorization check (UAV-001) to ensure only authorized users
 * can approve missions.
 *
 * @module application/commands/uav/ApproveMission
 * @see docs/audits/2026-02-11-COMPREHENSIVE-SECURITY-AUDIT.md (UAV-001)
 */

import { UAVAuthorizationService } from '../../../domain/uav/authorization/UAVAuthorizationService.js';

/**
 * Approve Mission Command
 */
export class ApproveMission {
  /**
   * @param {Object} dependencies
   * @param {Object} dependencies.missionRepository - Mission repository
   * @param {UAVAuthorizationService} [dependencies.authorizationService] - Authorization service
   */
  constructor({ missionRepository, authorizationService = null }) {
    this.missionRepository = missionRepository;
    this.authorizationService = authorizationService || new UAVAuthorizationService();
  }

  /**
   * Execute the approve mission command
   *
   * @param {Object} input
   * @param {number} input.missionId - Mission ID
   * @param {number} input.approvedByUserId - Approving user ID
   * @param {string} [input.approvalNotes] - Approval notes
   * @param {import('../../../domain/authorization/User.js').User} [input.user] - Authenticated user (required for authorization)
   * @returns {Promise<Mission>} Approved mission
   * @throws {Error} If mission not found, user unauthorized, or cannot be approved
   */
  async execute(input) {
    const mission = await this.missionRepository.findById(input.missionId);
    if (!mission) {
      throw new Error(`Mission ${input.missionId} not found`);
    }

    // UAV-001: Authorization check - only admins can approve missions
    if (input.user) {
      if (!this.authorizationService.canApproveMission(input.user, mission)) {
        throw new Error(
          `Unauthorized: User '${input.user.username}' cannot approve missions ` +
          `for station ${mission.station_id}. Only global admins and station admins ` +
          `for this station can approve missions.`
        );
      }
    }

    // Domain entity handles validation and state transition
    mission.approve(input.approvedByUserId, input.approvalNotes);

    return await this.missionRepository.save(mission);
  }
}
