-- Migration 0034: Audit Fixes - CASCADE and Indexes
-- SITES Spectral v8.5.4
-- Date: 2025-11-28
--
-- Fixes identified in comprehensive audit:
-- 1. Add ON DELETE CASCADE to products table foreign keys
-- 2. Add missing indexes for query performance
-- 3. Add FK constraint to error_log.user_id

-- ============================================================
-- 1. RECREATE PRODUCTS TABLE WITH CASCADE
-- ============================================================
-- SQLite doesn't support ALTER TABLE for FK changes, so we must recreate

-- Backup existing data
CREATE TABLE IF NOT EXISTS products_backup AS SELECT * FROM products;

-- Drop old table
DROP TABLE IF EXISTS products;

-- Recreate with proper CASCADE constraints
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    platform_id INTEGER,
    campaign_id INTEGER,
    aoi_id INTEGER,

    -- Product Info
    product_type TEXT NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT,

    -- Source
    source_platform_type TEXT,
    source_date TEXT,
    source_datetime TEXT,

    -- Spatial Info
    bbox_json TEXT,
    center_lat REAL,
    center_lon REAL,
    resolution_m REAL,
    crs TEXT,

    -- Data
    file_path TEXT,
    file_format TEXT,
    file_size_bytes INTEGER,

    -- Statistics
    min_value REAL,
    max_value REAL,
    mean_value REAL,
    std_value REAL,
    nodata_percent REAL,

    -- Quality
    quality_flag TEXT,
    cloud_cover_pct INTEGER,

    -- Processing
    processing_level TEXT,
    algorithm_version TEXT,

    -- Status
    status TEXT DEFAULT 'available',

    -- Metadata
    metadata_json TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    -- FIXED: Add ON DELETE CASCADE to all foreign keys
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES acquisition_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (aoi_id) REFERENCES areas_of_interest(id) ON DELETE SET NULL
);

-- Restore data from backup
INSERT INTO products SELECT * FROM products_backup;

-- Drop backup table
DROP TABLE IF EXISTS products_backup;

-- Recreate indexes for products
CREATE INDEX IF NOT EXISTS idx_product_station ON products(station_id);
CREATE INDEX IF NOT EXISTS idx_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_product_date ON products(source_date);
CREATE INDEX IF NOT EXISTS idx_product_platform_type ON products(source_platform_type);
CREATE INDEX IF NOT EXISTS idx_product_campaign ON products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_product_aoi ON products(aoi_id);

-- ============================================================
-- 2. ADD MISSING INDEXES
-- ============================================================

-- Index for acquisition_campaigns.aoi_id (frequently used in joins)
CREATE INDEX IF NOT EXISTS idx_campaigns_aoi_id ON acquisition_campaigns(aoi_id);

-- Index for acquisition_campaigns.station_id
CREATE INDEX IF NOT EXISTS idx_campaigns_station_id ON acquisition_campaigns(station_id);

-- Index for acquisition_campaigns.platform_id
CREATE INDEX IF NOT EXISTS idx_campaigns_platform_id ON acquisition_campaigns(platform_id);

-- Index for areas_of_interest.station_id
CREATE INDEX IF NOT EXISTS idx_aoi_station_id ON areas_of_interest(station_id);

-- Index for areas_of_interest.platform_id
CREATE INDEX IF NOT EXISTS idx_aoi_platform_id ON areas_of_interest(platform_id);

-- Index for areas_of_interest.status (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_aoi_status ON areas_of_interest(status);

-- Index for platforms.ecosystem_code (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_platforms_ecosystem ON platforms(ecosystem_code);

-- ============================================================
-- 3. ADD FK CONSTRAINT TO ERROR_LOG
-- ============================================================
-- Note: SQLite doesn't enforce FK constraints on existing tables without recreation
-- We'll create an index to at least optimize the join

CREATE INDEX IF NOT EXISTS idx_error_log_user_id ON error_log(user_id);

-- ============================================================
-- 4. UNIQUE CONSTRAINT ON AOI NORMALIZED_NAME
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_aoi_normalized_name_unique ON areas_of_interest(normalized_name);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
