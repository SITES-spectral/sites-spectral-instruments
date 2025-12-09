-- Migration: 0039_add_specifications_column.sql
-- Description: Add specifications JSON column to instruments table for storing flexible metadata
-- Version: 11.0.0-alpha.27
-- Date: 2025-12-09

-- Add specifications column to instruments table
-- This allows storing type-specific configuration as JSON (e.g., channels, resolution, bands)
ALTER TABLE instruments ADD COLUMN specifications TEXT DEFAULT '{}';

-- Create index for common specification queries (optional, for future optimization)
-- CREATE INDEX IF NOT EXISTS idx_instruments_specifications ON instruments(specifications);
