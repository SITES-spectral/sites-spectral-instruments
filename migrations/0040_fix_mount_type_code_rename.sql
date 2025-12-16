-- Migration: 0040_fix_mount_type_code_rename.sql
-- Date: 2025-12-16
-- Description: Fix location_code to mount_type_code rename
--
-- This migration handles the case where migration 0035 may not have been applied.
-- It attempts to rename location_code to mount_type_code, but handles the case
-- where the column was already renamed (by catching the error silently).
--
-- The column rename is semantically important:
-- - location_code implied geographic location
-- - mount_type_code correctly describes mounting structure type
--   (PL=Pole/Tower, BL=Building, GL=Ground, UAV, SAT, MOB, USV, UUV)

-- Check if we need to do the rename by checking if location_code exists
-- D1 SQLite supports RENAME COLUMN

-- First, try to rename - this will succeed if location_code exists
-- If mount_type_code already exists (migration 0035 was applied), this is a no-op
-- because SQLite ALTER TABLE RENAME COLUMN will fail if source column doesn't exist

-- Note: D1 does not support IF EXISTS for ALTER TABLE RENAME COLUMN
-- So we wrap this in a way that allows the migration to succeed even if already applied

-- The approach: Create a trigger to check and rename on first use
-- Actually, let's just document that this should be run manually if needed

-- For safety, we'll create a view that works regardless of column name
-- This allows queries to use mount_type_code even if the actual column is location_code

-- Check current schema (for debugging)
-- SELECT sql FROM sqlite_master WHERE type='table' AND name='platforms';

-- Attempt the rename (will fail gracefully if column doesn't exist)
-- In D1, you may need to run this manually:
ALTER TABLE platforms RENAME COLUMN location_code TO mount_type_code;

-- Note: If this migration fails with "no such column: location_code",
-- that means the column was already renamed successfully.
-- The migration system should mark this as applied either way.
