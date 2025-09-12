-- Fix station data consistency issues
-- Created: 2025-09-12
-- Purpose: Align station data with YAML sources and disable invalid stations

-- Add status column to stations table if it doesn't exist
ALTER TABLE stations ADD COLUMN status TEXT DEFAULT 'Active';

-- Update Tarfala to disabled/inactive status (no longer part of SITES)
UPDATE stations SET status = 'Inactive' WHERE normalized_name = 'tarfala';

-- Update station display names to match YAML sources
UPDATE stations SET display_name = 'Abisko' WHERE normalized_name = 'abisko';
UPDATE stations SET display_name = 'Grimsö' WHERE normalized_name = 'grimso'; 
UPDATE stations SET display_name = 'Lönnstorp' WHERE normalized_name = 'lonnstorp';
UPDATE stations SET display_name = 'Röbäcksdalen' WHERE normalized_name = 'robacksdalen';
UPDATE stations SET display_name = 'Skogaryd' WHERE normalized_name = 'skogaryd';
UPDATE stations SET display_name = 'Svartberget' WHERE normalized_name = 'svartberget';

-- Update Skogaryd acronym to match phenocams (SKC) as primary
UPDATE stations SET acronym = 'SKC' WHERE normalized_name = 'skogaryd';

-- Remove bolmen, erken, and stordalen if they exist (not in YAML sources)
DELETE FROM instruments WHERE station_id IN (
    SELECT id FROM stations WHERE normalized_name IN ('bolmen', 'erken', 'stordalen')
);
DELETE FROM stations WHERE normalized_name IN ('bolmen', 'erken', 'stordalen');

-- Update timestamps
UPDATE stations SET updated_at = CURRENT_TIMESTAMP WHERE normalized_name IN (
    'abisko', 'grimso', 'lonnstorp', 'robacksdalen', 'skogaryd', 'svartberget', 'tarfala'
);