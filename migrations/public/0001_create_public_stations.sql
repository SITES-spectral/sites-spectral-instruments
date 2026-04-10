-- Public-facing denormalized station data
-- Applied to PUBLIC_DB (spectral_public_db)
-- v16.1.0: Initial schema for public database isolation
--
-- Usage: npx wrangler d1 execute spectral_public_db --file=migrations/public/0001_create_public_stations.sql

CREATE TABLE IF NOT EXISTS public_stations (
  id INTEGER PRIMARY KEY,
  acronym TEXT UNIQUE NOT NULL,
  normalized_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  latitude REAL,
  longitude REAL,
  elevation_m REAL,
  status TEXT DEFAULT 'Active',
  country TEXT,
  sites_member INTEGER DEFAULT 0,
  icos_member INTEGER DEFAULT 0,
  icos_class TEXT,
  platform_count INTEGER DEFAULT 0,
  instrument_count INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_public_stations_status ON public_stations(status);
