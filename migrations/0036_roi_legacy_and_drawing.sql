-- Migration 0036: Add Legacy ROI System and Drawing Support
-- Version: v10.0.0-alpha.17
-- Date: 2025-12-07
--
-- Purpose: Preserves ROI numbers to prevent breaking time series data (L2, L3 products)
-- by allowing ROIs to be marked as legacy instead of deleted or overwritten.
--
-- Key Features:
--   - is_legacy: Boolean flag to mark ROI as legacy (inactive but preserved)
--   - legacy_date: When the ROI was marked as legacy
--   - replaced_by_roi_id: FK to the new ROI that replaced this one
--   - timeseries_broken: Flag set when admin overrides an active ROI
--   - legacy_reason: Text explaining why ROI was deprecated

-- Add legacy system columns to instrument_rois table
ALTER TABLE instrument_rois ADD COLUMN is_legacy BOOLEAN DEFAULT false;
ALTER TABLE instrument_rois ADD COLUMN legacy_date DATETIME;
ALTER TABLE instrument_rois ADD COLUMN replaced_by_roi_id INTEGER REFERENCES instrument_rois(id);
ALTER TABLE instrument_rois ADD COLUMN timeseries_broken BOOLEAN DEFAULT false;
ALTER TABLE instrument_rois ADD COLUMN legacy_reason TEXT;

-- Add index for efficient legacy filtering
CREATE INDEX IF NOT EXISTS idx_instrument_rois_is_legacy ON instrument_rois(is_legacy);

-- Add index for legacy date queries (useful for audit/cleanup)
CREATE INDEX IF NOT EXISTS idx_instrument_rois_legacy_date ON instrument_rois(legacy_date);

-- Add index for timeseries_broken flag (useful for identifying ROIs with data issues)
CREATE INDEX IF NOT EXISTS idx_instrument_rois_timeseries_broken ON instrument_rois(timeseries_broken);

-- Note: SQLite doesn't support CHECK constraints with subqueries,
-- so the constraint that replaced_by_roi_id must reference the same instrument
-- is enforced at the application level in src/handlers/rois.js
