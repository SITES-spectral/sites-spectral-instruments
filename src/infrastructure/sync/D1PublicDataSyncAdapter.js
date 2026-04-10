/**
 * D1 Public Data Sync Adapter
 *
 * Infrastructure adapter implementing PublicDataSyncPort.
 * Syncs denormalized station data from the main D1 database
 * to the public-only D1 database after authorized changes.
 *
 * Sync failures are caught and logged — they must never break
 * the primary write operation on the main database.
 *
 * @module infrastructure/sync/D1PublicDataSyncAdapter
 * @version 16.1.0
 */

import { PublicDataSyncPort } from '../../domain/shared/ports/PublicDataSyncPort.js';

export class D1PublicDataSyncAdapter extends PublicDataSyncPort {
  /**
   * @param {Object} mainDb - Main D1 database binding (env.DB)
   * @param {Object} publicDb - Public D1 database binding (env.PUBLIC_DB)
   */
  constructor(mainDb, publicDb) {
    super();
    this.mainDb = mainDb;
    this.publicDb = publicDb;
  }

  /**
   * Sync a station's full public data (metadata + computed counts)
   * @param {number} stationId - Station ID in the main database
   */
  async syncStation(stationId) {
    try {
      const station = await this.mainDb.prepare(`
        SELECT
          s.id, s.acronym, s.normalized_name, s.display_name, s.description,
          s.latitude, s.longitude, s.elevation_m, s.status, s.country,
          s.sites_member, s.icos_member, s.icos_class,
          (SELECT COUNT(*) FROM platforms p WHERE p.station_id = s.id) as platform_count,
          (SELECT COUNT(*) FROM instruments i
           JOIN platforms p ON i.platform_id = p.id
           WHERE p.station_id = s.id) as instrument_count
        FROM stations s
        WHERE s.id = ?
      `).bind(stationId).first();

      if (!station) {
        console.warn(`PublicDataSync: Station ${stationId} not found in main DB`);
        return;
      }

      await this.publicDb.prepare(`
        INSERT INTO public_stations (
          id, acronym, normalized_name, display_name, description,
          latitude, longitude, elevation_m, status, country,
          sites_member, icos_member, icos_class,
          platform_count, instrument_count, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          acronym = excluded.acronym,
          normalized_name = excluded.normalized_name,
          display_name = excluded.display_name,
          description = excluded.description,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          elevation_m = excluded.elevation_m,
          status = excluded.status,
          country = excluded.country,
          sites_member = excluded.sites_member,
          icos_member = excluded.icos_member,
          icos_class = excluded.icos_class,
          platform_count = excluded.platform_count,
          instrument_count = excluded.instrument_count,
          updated_at = datetime('now')
      `).bind(
        station.id, station.acronym, station.normalized_name,
        station.display_name, station.description,
        station.latitude, station.longitude, station.elevation_m,
        station.status, station.country,
        station.sites_member, station.icos_member, station.icos_class,
        station.platform_count, station.instrument_count
      ).run();
    } catch (error) {
      console.error(`PublicDataSync: Failed to sync station ${stationId}:`, error);
    }
  }

  /**
   * Remove a station from the public database
   * @param {number} stationId - Station ID to remove
   */
  async removeStation(stationId) {
    try {
      await this.publicDb.prepare(
        'DELETE FROM public_stations WHERE id = ?'
      ).bind(stationId).run();
    } catch (error) {
      console.error(`PublicDataSync: Failed to remove station ${stationId}:`, error);
    }
  }

  /**
   * Sync only platform and instrument counts for a station
   * @param {number} stationId - Station ID whose counts changed
   */
  async syncStationCounts(stationId) {
    try {
      const counts = await this.mainDb.prepare(`
        SELECT
          (SELECT COUNT(*) FROM platforms p WHERE p.station_id = ?) as platform_count,
          (SELECT COUNT(*) FROM instruments i
           JOIN platforms p ON i.platform_id = p.id
           WHERE p.station_id = ?) as instrument_count
      `).bind(stationId, stationId).first();

      await this.publicDb.prepare(`
        UPDATE public_stations
        SET platform_count = ?, instrument_count = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        counts.platform_count, counts.instrument_count, stationId
      ).run();
    } catch (error) {
      console.error(`PublicDataSync: Failed to sync counts for station ${stationId}:`, error);
    }
  }

  /**
   * Full sync of all stations from main database to public database
   * @returns {Promise<{synced: number}>}
   */
  async fullSync() {
    try {
      const stations = await this.mainDb.prepare(`
        SELECT
          s.id, s.acronym, s.normalized_name, s.display_name, s.description,
          s.latitude, s.longitude, s.elevation_m, s.status, s.country,
          s.sites_member, s.icos_member, s.icos_class,
          (SELECT COUNT(*) FROM platforms p WHERE p.station_id = s.id) as platform_count,
          (SELECT COUNT(*) FROM instruments i
           JOIN platforms p ON i.platform_id = p.id
           WHERE p.station_id = s.id) as instrument_count
        FROM stations s
        ORDER BY s.id
      `).all();

      // Clear and repopulate
      await this.publicDb.prepare('DELETE FROM public_stations').run();

      for (const station of stations.results) {
        await this.publicDb.prepare(`
          INSERT INTO public_stations (
            id, acronym, normalized_name, display_name, description,
            latitude, longitude, elevation_m, status, country,
            sites_member, icos_member, icos_class,
            platform_count, instrument_count, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          station.id, station.acronym, station.normalized_name,
          station.display_name, station.description,
          station.latitude, station.longitude, station.elevation_m,
          station.status, station.country,
          station.sites_member, station.icos_member, station.icos_class,
          station.platform_count, station.instrument_count
        ).run();
      }

      return { synced: stations.results.length };
    } catch (error) {
      console.error('PublicDataSync: Full sync failed:', error);
      throw error;
    }
  }
}

export default D1PublicDataSyncAdapter;
