-- Migration 0022: Add operation_programs field to platforms table
-- This adds support for tracking which research programs operate each platform
-- Programs typically include: SITES, ICOS, Swedish Polar Research Secretariat, etc.

-- Add operation_programs column to platforms table
ALTER TABLE platforms ADD COLUMN operation_programs TEXT;

-- Update operation_programs with data from stations.yaml
-- These are based on the actual operation_programs data from the YAML file

-- Abisko platforms (Swedish Polar Research Secretariat, SITES, ICOS)
UPDATE platforms SET operation_programs = 'Swedish Polar Research Secretariat, SITES, ICOS'
WHERE normalized_name LIKE 'ANS_%';

-- Grimsö platforms (SITES, ICOS)
UPDATE platforms SET operation_programs = 'SITES, ICOS'
WHERE normalized_name LIKE 'GRI_%';

-- Lönnstorp platforms (SITES, ICOS)
UPDATE platforms SET operation_programs = 'SITES, ICOS'
WHERE normalized_name LIKE 'LON_%';

-- Röbäcksdalen platforms (SITES, ICOS)
UPDATE platforms SET operation_programs = 'SITES, ICOS'
WHERE normalized_name LIKE 'RBD_%';

-- Skogaryd platforms (SITES, ICOS)
UPDATE platforms SET operation_programs = 'SITES, ICOS'
WHERE normalized_name LIKE 'SKC_%';

-- Svartberget platforms (SITES, ICOS)
UPDATE platforms SET operation_programs = 'SITES, ICOS'
WHERE normalized_name LIKE 'SVB_%';

-- ASA platforms (SITES)
UPDATE platforms SET operation_programs = 'SITES'
WHERE normalized_name LIKE 'ASA_%';