-- Seed public database from main database
-- Run against the PUBLIC database (spectral_public_db)
--
-- This script is for initial population only.
-- After initial seed, the D1PublicDataSyncAdapter keeps the public DB in sync.
--
-- Usage:
--   1. First, export data from main DB:
--      npx wrangler d1 execute spectral_stations_db --command="SELECT id, acronym, normalized_name, display_name, description, latitude, longitude, elevation_m, status, country, sites_member, icos_member, icos_class, (SELECT COUNT(*) FROM platforms p WHERE p.station_id = s.id) as platform_count, (SELECT COUNT(*) FROM instruments i JOIN platforms p ON i.platform_id = p.id WHERE p.station_id = s.id) as instrument_count FROM stations s ORDER BY s.id" --json > /home/jobelund/lu2024-12-46/tmp/stations_export.json
--
--   2. Then generate INSERT statements from the JSON and run against public DB.
--      Or use the admin sync endpoint: POST /api/admin/sync-public-db
--
-- Alternative: Use the fullSync() method via the admin API endpoint.

-- Clear existing data
DELETE FROM public_stations;

-- Example INSERT template (replace with actual data from main DB export):
-- INSERT INTO public_stations (id, acronym, normalized_name, display_name, description, latitude, longitude, elevation_m, status, country, sites_member, icos_member, icos_class, platform_count, instrument_count, updated_at)
-- VALUES (1, 'ANS', 'abisko', 'Abisko', 'Abisko Scientific Research Station', 68.353729, 18.816522, NULL, 'Active', 'Sweden', 1, 0, NULL, 3, 5, datetime('now'));
