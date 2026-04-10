/**
 * Public Data Sync Port
 *
 * Port interface for synchronizing station data to the public-facing database.
 * Implementations live in infrastructure layer.
 *
 * @module domain/shared/ports/PublicDataSyncPort
 * @version 16.1.0
 */

/**
 * Public Data Sync Port (Abstract)
 *
 * @interface
 */
export class PublicDataSyncPort {
  /**
   * Sync a station's full public data (metadata + counts)
   * @param {number} stationId - Station ID in the main database
   * @returns {Promise<void>}
   */
  async syncStation(stationId) {
    throw new Error('PublicDataSyncPort.syncStation() must be implemented');
  }

  /**
   * Remove a station from the public database
   * @param {number} stationId - Station ID to remove
   * @returns {Promise<void>}
   */
  async removeStation(stationId) {
    throw new Error('PublicDataSyncPort.removeStation() must be implemented');
  }

  /**
   * Sync only platform and instrument counts for a station
   * @param {number} stationId - Station ID whose counts changed
   * @returns {Promise<void>}
   */
  async syncStationCounts(stationId) {
    throw new Error('PublicDataSyncPort.syncStationCounts() must be implemented');
  }

  /**
   * Full sync of all stations from main database to public database
   * @returns {Promise<{synced: number}>}
   */
  async fullSync() {
    throw new Error('PublicDataSyncPort.fullSync() must be implemented');
  }
}

export default PublicDataSyncPort;
