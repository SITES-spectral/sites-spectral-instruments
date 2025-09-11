-- SITES Spectral Enhanced Schema: Platforms and Authentication
-- Created: 2025-09-11
-- Version: 0.1.1-dev

-- Platforms table for hierarchical structure: Stations → Platforms → Instruments
CREATE TABLE platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    platform_id TEXT NOT NULL, -- e.g., 'BL01', 'TW01', 'GR01'
    canonical_id TEXT NOT NULL UNIQUE, -- e.g., 'SVB_FOR_BL01'
    name TEXT NOT NULL, -- Human readable name
    type TEXT NOT NULL CHECK (type IN ('tower', 'mast', 'building', 'ground')),
    
    -- Location details
    latitude REAL, -- Specific platform coordinates if different from station
    longitude REAL,
    elevation_m REAL,
    platform_height_m REAL NOT NULL DEFAULT 0, -- Height of platform structure
    
    -- Platform specifications
    structure_material TEXT, -- Steel, wood, concrete, etc.
    foundation_type TEXT, -- Ground-mounted, building-mounted, etc.
    access_method TEXT, -- Ladder, stairs, ground-level, etc.
    
    -- Mounting capabilities
    max_instruments INTEGER DEFAULT 10,
    mounting_points TEXT, -- JSON array of available mounting positions
    power_available BOOLEAN DEFAULT FALSE,
    network_available BOOLEAN DEFAULT FALSE,
    
    -- Status and maintenance
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance', 'Removed', 'Planned')),
    installation_date DATE,
    last_maintenance_date DATE,
    maintenance_notes TEXT,
    
    -- Metadata
    description TEXT,
    installation_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    UNIQUE(station_id, platform_id)
);

-- User accounts for authentication system
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL, -- bcrypt hash
    role TEXT NOT NULL CHECK (role IN ('admin', 'station', 'readonly')),
    
    -- Station-specific access (NULL for admin users)
    station_id INTEGER, -- Station users can only access this station
    
    -- Account status
    active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    
    -- Profile information
    full_name TEXT,
    organization TEXT,
    phone TEXT,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- User sessions for JWT token management
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of JWT
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log for audit trail
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete'
    resource_type TEXT NOT NULL, -- 'instrument', 'platform', 'station', 'user'
    resource_id INTEGER,
    old_values TEXT, -- JSON of old values for updates
    new_values TEXT, -- JSON of new values
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Update instruments table to reference platforms
ALTER TABLE phenocams ADD COLUMN platform_id INTEGER REFERENCES platforms(id);
ALTER TABLE mspectral_sensors ADD COLUMN platform_id INTEGER REFERENCES platforms(id);

-- Add platform reference columns for better organization
ALTER TABLE phenocams ADD COLUMN platform_type TEXT; -- tower, building, etc.
ALTER TABLE mspectral_sensors ADD COLUMN platform_type TEXT;

-- Create indexes for better performance
CREATE INDEX idx_platforms_station_id ON platforms(station_id);
CREATE INDEX idx_platforms_canonical_id ON platforms(canonical_id);
CREATE INDEX idx_platforms_type ON platforms(type);
CREATE INDEX idx_platforms_status ON platforms(status);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_station_id ON users(station_id);
CREATE INDEX idx_users_active ON users(active);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_activity_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_timestamp ON activity_log(timestamp);
CREATE INDEX idx_activity_resource ON activity_log(resource_type, resource_id);

-- Add indexes for new platform columns
CREATE INDEX idx_phenocams_platform_id ON phenocams(platform_id);
CREATE INDEX idx_mspectral_platform_id ON mspectral_sensors(platform_id);

-- Triggers to update timestamps
CREATE TRIGGER update_platforms_timestamp 
    AFTER UPDATE ON platforms 
    BEGIN 
        UPDATE platforms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

CREATE TRIGGER update_users_timestamp 
    AFTER UPDATE ON users 
    BEGIN 
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id; 
    END;

-- Trigger to log activity
CREATE TRIGGER log_platform_updates
    AFTER UPDATE ON platforms
    BEGIN
        INSERT INTO activity_log (action_type, resource_type, resource_id, old_values, new_values)
        VALUES ('update', 'platform', NEW.id, 
                json_object('name', OLD.name, 'status', OLD.status),
                json_object('name', NEW.name, 'status', NEW.status));
    END;

-- Clean up expired sessions trigger
CREATE TRIGGER cleanup_expired_sessions
    AFTER INSERT ON user_sessions
    BEGIN
        DELETE FROM user_sessions WHERE expires_at < datetime('now');
    END;