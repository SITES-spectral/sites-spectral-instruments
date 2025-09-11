-- Add thematic program tracking for instruments and platforms
-- Created: 2025-09-11
-- This helps prioritize SITES Spectral instruments over ICOS or other programs

-- Add program field to existing phenocams table
ALTER TABLE phenocams ADD COLUMN thematic_program TEXT DEFAULT 'SITES_Spectral' CHECK (thematic_program IN ('SITES_Spectral', 'ICOS', 'Other'));

-- Add program field to existing multispectral sensors table
ALTER TABLE mspectral_sensors ADD COLUMN thematic_program TEXT DEFAULT 'SITES_Spectral' CHECK (thematic_program IN ('SITES_Spectral', 'ICOS', 'Other'));

-- Add program field to platforms table
ALTER TABLE platforms ADD COLUMN thematic_program TEXT DEFAULT 'SITES_Spectral' CHECK (thematic_program IN ('SITES_Spectral', 'ICOS', 'Other'));

-- Add priority field for sorting (SITES Spectral gets highest priority)
ALTER TABLE phenocams ADD COLUMN priority INTEGER DEFAULT 1; -- 1 = highest priority for SITES Spectral
ALTER TABLE mspectral_sensors ADD COLUMN priority INTEGER DEFAULT 1; 
ALTER TABLE platforms ADD COLUMN priority INTEGER DEFAULT 1;

-- Update priorities based on thematic program
UPDATE phenocams SET priority = 1 WHERE thematic_program = 'SITES_Spectral';
UPDATE phenocams SET priority = 2 WHERE thematic_program = 'ICOS';
UPDATE phenocams SET priority = 3 WHERE thematic_program = 'Other';

UPDATE mspectral_sensors SET priority = 1 WHERE thematic_program = 'SITES_Spectral';
UPDATE mspectral_sensors SET priority = 2 WHERE thematic_program = 'ICOS';
UPDATE mspectral_sensors SET priority = 3 WHERE thematic_program = 'Other';

UPDATE platforms SET priority = 1 WHERE thematic_program = 'SITES_Spectral';
UPDATE platforms SET priority = 2 WHERE thematic_program = 'ICOS';
UPDATE platforms SET priority = 3 WHERE thematic_program = 'Other';

-- Create indexes for efficient filtering by program
CREATE INDEX idx_phenocams_program ON phenocams(thematic_program);
CREATE INDEX idx_mspectral_program ON mspectral_sensors(thematic_program);
CREATE INDEX idx_platforms_program ON platforms(thematic_program);

-- Create indexes for priority-based sorting
CREATE INDEX idx_phenocams_priority ON phenocams(priority, thematic_program);
CREATE INDEX idx_mspectral_priority ON mspectral_sensors(priority, thematic_program);
CREATE INDEX idx_platforms_priority ON platforms(priority, thematic_program);

-- Trigger to automatically set priority when thematic_program is updated
CREATE TRIGGER update_phenocams_priority
    AFTER UPDATE OF thematic_program ON phenocams
    WHEN NEW.thematic_program != OLD.thematic_program
    BEGIN
        UPDATE phenocams SET priority = 
            CASE NEW.thematic_program
                WHEN 'SITES_Spectral' THEN 1
                WHEN 'ICOS' THEN 2
                WHEN 'Other' THEN 3
                ELSE 1
            END
        WHERE id = NEW.id;
    END;

CREATE TRIGGER update_mspectral_priority
    AFTER UPDATE OF thematic_program ON mspectral_sensors
    WHEN NEW.thematic_program != OLD.thematic_program
    BEGIN
        UPDATE mspectral_sensors SET priority = 
            CASE NEW.thematic_program
                WHEN 'SITES_Spectral' THEN 1
                WHEN 'ICOS' THEN 2
                WHEN 'Other' THEN 3
                ELSE 1
            END
        WHERE id = NEW.id;
    END;

CREATE TRIGGER update_platforms_priority
    AFTER UPDATE OF thematic_program ON platforms
    WHEN NEW.thematic_program != OLD.thematic_program
    BEGIN
        UPDATE platforms SET priority = 
            CASE NEW.thematic_program
                WHEN 'SITES_Spectral' THEN 1
                WHEN 'ICOS' THEN 2
                WHEN 'Other' THEN 3
                ELSE 1
            END
        WHERE id = NEW.id;
    END;

-- Add comments for documentation
PRAGMA table_info(phenocams);
-- thematic_program: SITES_Spectral (priority 1), ICOS (priority 2), Other (priority 3)
-- priority: Automatically set based on thematic_program for efficient sorting