/**
 * Delete Mission Command
 *
 * Application layer command for deleting a UAV mission.
 *
 * @module application/commands/uav/DeleteMission
 */

/**
 * Delete Mission Command
 */
export class DeleteMission {
  /**
   * @param {Object} dependencies
   */
  constructor({ missionRepository }) {
    this.missionRepository = missionRepository;
  }

  /**
   * Execute the delete mission command
   *
   * @param {number} id - Mission ID
   * @returns {Promise<boolean>} True if deleted
   * @throws {Error} If mission not found or cannot be deleted
   */
  async execute(id) {
    const existing = await this.missionRepository.findById(id);
    if (!existing) {
      throw new Error(`Mission ${id} not found`);
    }

    // Only allow deletion if not in progress or completed
    if (existing.status === 'in_progress') {
      throw new Error('Cannot delete a mission that is in progress');
    }

    if (existing.status === 'completed') {
      throw new Error('Cannot delete a completed mission');
    }

    return await this.missionRepository.delete(id);
  }
}
