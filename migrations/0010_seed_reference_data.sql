-- Seed Reference Data and User Permissions
-- Created: 2025-09-17
-- Purpose: Populate reference tables and define user permission matrix

-- ============================================================================
-- 1. ECOSYSTEM REFERENCE DATA
-- ============================================================================

INSERT INTO ecosystems (code, name, description) VALUES
('FOR', 'Forest', 'Forest ecosystem monitoring'),
('AGR', 'Agriculture', 'Agricultural ecosystem monitoring'),
('MIR', 'Mire', 'Mire/bog ecosystem monitoring'),
('LAK', 'Lake', 'Lake ecosystem monitoring'),
('WET', 'Wetland', 'Wetland ecosystem monitoring'),
('HEA', 'Heath', 'Heath ecosystem monitoring'),
('SFO', 'Sub-forest', 'Sub-forest ecosystem monitoring'),
('CEM', 'Cemetery', 'Cemetery ecosystem monitoring');

-- ============================================================================
-- 2. USER FIELD PERMISSIONS MATRIX
-- ============================================================================

-- STATION USER PERMISSIONS - what station users CAN edit

-- Platforms - station users can edit most platform fields
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view) VALUES
('station', 'platforms', 'display_name', TRUE, TRUE),
('station', 'platforms', 'location_code', TRUE, TRUE),
('station', 'platforms', 'mounting_structure', TRUE, TRUE),
('station', 'platforms', 'platform_height_m', TRUE, TRUE),
('station', 'platforms', 'status', TRUE, TRUE),
('station', 'platforms', 'latitude', TRUE, TRUE),          -- USER CAN EDIT COORDINATES
('station', 'platforms', 'longitude', TRUE, TRUE),         -- USER CAN EDIT COORDINATES
('station', 'platforms', 'deployment_date', TRUE, TRUE),
('station', 'platforms', 'description', TRUE, TRUE);

-- Platforms - station users CANNOT edit (admin only)
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view) VALUES
('station', 'platforms', 'id', FALSE, TRUE),
('station', 'platforms', 'station_id', FALSE, TRUE),
('station', 'platforms', 'normalized_name', FALSE, TRUE),  -- ADMIN ONLY
('station', 'platforms', 'created_at', FALSE, TRUE),
('station', 'platforms', 'updated_at', FALSE, TRUE);

-- Instruments - station users can edit most instrument fields
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view) VALUES
('station', 'instruments', 'display_name', TRUE, TRUE),
('station', 'instruments', 'ecosystem_code', TRUE, TRUE),
('station', 'instruments', 'instrument_number', TRUE, TRUE),
('station', 'instruments', 'camera_brand', TRUE, TRUE),        -- USER CAN EDIT CAMERA SPECS
('station', 'instruments', 'camera_model', TRUE, TRUE),        -- USER CAN EDIT CAMERA SPECS
('station', 'instruments', 'camera_resolution', TRUE, TRUE),   -- USER CAN EDIT CAMERA SPECS
('station', 'instruments', 'camera_serial_number', TRUE, TRUE), -- USER CAN EDIT CAMERA SPECS
('station', 'instruments', 'first_measurement_year', TRUE, TRUE), -- USER CAN EDIT TIMELINE
('station', 'instruments', 'last_measurement_year', TRUE, TRUE),  -- USER CAN EDIT TIMELINE
('station', 'instruments', 'measurement_status', TRUE, TRUE),     -- USER CAN EDIT TIMELINE
('station', 'instruments', 'status', TRUE, TRUE),
('station', 'instruments', 'deployment_date', TRUE, TRUE),
('station', 'instruments', 'removal_date', TRUE, TRUE),
('station', 'instruments', 'latitude', TRUE, TRUE),            -- USER CAN EDIT COORDINATES
('station', 'instruments', 'longitude', TRUE, TRUE),           -- USER CAN EDIT COORDINATES
('station', 'instruments', 'instrument_height_m', TRUE, TRUE),
('station', 'instruments', 'viewing_direction', TRUE, TRUE),
('station', 'instruments', 'azimuth_degrees', TRUE, TRUE),
('station', 'instruments', 'degrees_from_nadir', TRUE, TRUE),
('station', 'instruments', 'description', TRUE, TRUE),
('station', 'instruments', 'installation_notes', TRUE, TRUE),
('station', 'instruments', 'maintenance_notes', TRUE, TRUE);

-- Instruments - station users CANNOT edit (admin only)
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view) VALUES
('station', 'instruments', 'id', FALSE, TRUE),
('station', 'instruments', 'platform_id', FALSE, TRUE),
('station', 'instruments', 'normalized_name', FALSE, TRUE),    -- ADMIN ONLY
('station', 'instruments', 'legacy_acronym', FALSE, TRUE),     -- ADMIN ONLY (historical data)
('station', 'instruments', 'instrument_type', FALSE, TRUE),
('station', 'instruments', 'created_at', FALSE, TRUE),
('station', 'instruments', 'updated_at', FALSE, TRUE);

-- ROIs - station users can edit all ROI data
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view) VALUES
('station', 'instrument_rois', 'roi_name', TRUE, TRUE),
('station', 'instrument_rois', 'roi_points', TRUE, TRUE),      -- USER CAN EDIT ROI GEOMETRY
('station', 'instrument_rois', 'color_rgb', TRUE, TRUE),       -- USER CAN EDIT ROI COLORS
('station', 'instrument_rois', 'thickness', TRUE, TRUE),
('station', 'instrument_rois', 'alpha', TRUE, TRUE),
('station', 'instrument_rois', 'description', TRUE, TRUE),
('station', 'instrument_rois', 'source_image', TRUE, TRUE),
('station', 'instrument_rois', 'active', TRUE, TRUE);

-- ROIs - station users CANNOT edit
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view) VALUES
('station', 'instrument_rois', 'id', FALSE, TRUE),
('station', 'instrument_rois', 'instrument_id', FALSE, TRUE),
('station', 'instrument_rois', 'auto_generated', FALSE, TRUE),
('station', 'instrument_rois', 'generated_date', FALSE, TRUE),
('station', 'instrument_rois', 'created_at', FALSE, TRUE);

-- ADMIN USER PERMISSIONS - admins can edit everything
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view)
SELECT 'admin', table_name, field_name, TRUE, TRUE
FROM user_field_permissions
WHERE role = 'station'
GROUP BY table_name, field_name;

-- Additional admin-only permissions
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view) VALUES
('admin', 'stations', 'normalized_name', TRUE, TRUE),
('admin', 'stations', 'display_name', TRUE, TRUE),
('admin', 'stations', 'acronym', TRUE, TRUE),
('admin', 'stations', 'status', TRUE, TRUE),
('admin', 'stations', 'country', TRUE, TRUE),
('admin', 'stations', 'latitude', TRUE, TRUE),
('admin', 'stations', 'longitude', TRUE, TRUE),
('admin', 'stations', 'elevation_m', TRUE, TRUE),
('admin', 'stations', 'description', TRUE, TRUE),
('admin', 'platforms', 'normalized_name', TRUE, TRUE),       -- ADMIN CAN EDIT NORMALIZED NAMES
('admin', 'instruments', 'normalized_name', TRUE, TRUE),     -- ADMIN CAN EDIT NORMALIZED NAMES
('admin', 'instruments', 'legacy_acronym', TRUE, TRUE),      -- ADMIN CAN EDIT LEGACY DATA
('admin', 'instruments', 'instrument_type', TRUE, TRUE),
('admin', 'instrument_rois', 'auto_generated', TRUE, TRUE),
('admin', 'instrument_rois', 'generated_date', TRUE, TRUE);

-- READONLY USER PERMISSIONS - can view but not edit anything
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view)
SELECT 'readonly', table_name, field_name, FALSE, TRUE
FROM user_field_permissions
WHERE role = 'station'
GROUP BY table_name, field_name;

-- Additional readonly permissions for admin-only fields
INSERT INTO user_field_permissions (role, table_name, field_name, can_edit, can_view)
SELECT 'readonly', table_name, field_name, FALSE, TRUE
FROM user_field_permissions
WHERE role = 'admin' AND field_name IN ('normalized_name', 'legacy_acronym', 'instrument_type', 'auto_generated', 'generated_date')
GROUP BY table_name, field_name;

-- ============================================================================
-- 3. DEFAULT ADMIN USER
-- ============================================================================

-- Create default admin user (password should be changed on first login)
-- Default password: 'admin123' (bcrypt hash)
INSERT INTO users (username, email, password_hash, role, full_name, organization, active) VALUES
('admin', 'admin@sites.se', '$2b$12$LQv3c1yqBwlVHp2M5tFnDOeI5v8Y9X4J6K3L2M1N0O9P8Q7R6S5T4U', 'admin', 'System Administrator', 'SITES Spectral', TRUE);

-- ============================================================================
-- 4. VALIDATION FUNCTIONS (as comments for documentation)
-- ============================================================================

-- Coordinate validation ranges:
-- Latitude: -90 to 90 degrees (Sweden: ~55 to 70)
-- Longitude: -180 to 180 degrees (Sweden: ~10 to 25)

-- Camera resolution format validation:
-- Pattern: "WidthxHeight" (e.g., "4096x3072", "2048x1536")

-- Year validation:
-- Range: 1990 to 2030 (reasonable range for measurement data)

-- Camera brand validation:
-- Allowed values: 'Mobotix', 'RedDot', 'Canon', 'Nikon'

-- Status validation:
-- Station/Platform: 'Active', 'Inactive', 'Maintenance', 'Removed', 'Planned'
-- Instrument: 'Active', 'Inactive', 'Maintenance', 'Removed', 'Planned', 'Unknown'
-- Measurement: 'Active', 'Completed', 'Interrupted', 'Planned'