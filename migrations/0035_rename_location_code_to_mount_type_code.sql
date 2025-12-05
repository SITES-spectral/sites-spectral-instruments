-- Migration: 0035_rename_location_code_to_mount_type_code.sql
-- Date: 2025-12-05
-- Description: Rename location_code to mount_type_code for semantic clarity
--
-- The 'location_code' field was semantically incorrect as it describes the
-- mounting structure type (PL=Pole/Tower, BL=Building, GL=Ground Level),
-- not a geographic location.
--
-- Mount Type Prefixes:
--   PL  - Pole/Tower/Mast (elevated structures)
--   BL  - Building (rooftop or facade mounted)
--   GL  - Ground Level (installations below 1.5m height)
--   UAV - UAV Position (drone flight position identifier)
--   SAT - Satellite (virtual position for satellite data)
--   MOB - Mobile (portable platform position)
--   USV - Surface Vehicle (unmanned surface vehicle position)
--   UUV - Underwater Vehicle (unmanned underwater vehicle position)

-- SQLite does not support direct column rename in older versions,
-- so we need to recreate the table. However, D1 SQLite supports ALTER TABLE RENAME COLUMN.
-- Let's use the modern approach first.

-- Rename the column from location_code to mount_type_code
ALTER TABLE platforms RENAME COLUMN location_code TO mount_type_code;

-- Add a comment explaining the semantic meaning (via index naming)
-- Note: SQLite doesn't support comments, but we document it here
-- mount_type_code values follow the pattern: {PREFIX}{NUMBER}
-- where PREFIX is one of: PL, BL, GL, UAV, SAT, MOB, USV, UUV
-- and NUMBER is a 2-digit sequence number (01, 02, etc.)
