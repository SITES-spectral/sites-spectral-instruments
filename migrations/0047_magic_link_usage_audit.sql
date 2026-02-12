-- Migration: 0047_magic_link_usage_audit.sql
-- Description: Multi-use token audit trail and IP pinning for magic links
-- Addresses: ML-005, ML-006 from security audit
-- Date: 2026-02-12

-- Table to track each use of a multi-use magic link
CREATE TABLE IF NOT EXISTS magic_link_usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER NOT NULL REFERENCES magic_link_tokens(id) ON DELETE CASCADE,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    client_ip TEXT NOT NULL,
    user_agent TEXT,
    session_jwt_hash TEXT, -- Hash of issued JWT for session correlation
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT, -- 'expired', 'revoked', 'ip_mismatch', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_magic_link_usage_token_id ON magic_link_usage_log(token_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_usage_used_at ON magic_link_usage_log(used_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_usage_client_ip ON magic_link_usage_log(client_ip);

-- Add IP pinning fields to magic_link_tokens
-- first_use_ip: Captured on first use, used for subsequent validation
-- ip_pinning_enabled: Whether to enforce IP matching on multi-use tokens
ALTER TABLE magic_link_tokens ADD COLUMN first_use_ip TEXT;
ALTER TABLE magic_link_tokens ADD COLUMN ip_pinning_enabled BOOLEAN DEFAULT FALSE;

-- Index for IP lookups
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_first_use_ip ON magic_link_tokens(first_use_ip);

-- Track use count for multi-use tokens (denormalized for performance)
ALTER TABLE magic_link_tokens ADD COLUMN use_count INTEGER DEFAULT 0;

-- Table for pilot status change audit trail (UAV-005)
CREATE TABLE IF NOT EXISTS pilot_status_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pilot_id INTEGER NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    changed_by_user_id INTEGER REFERENCES users(id),
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reason TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    client_ip TEXT,
    user_agent TEXT
);

-- Indexes for pilot audit queries
CREATE INDEX IF NOT EXISTS idx_pilot_status_audit_pilot_id ON pilot_status_audit(pilot_id);
CREATE INDEX IF NOT EXISTS idx_pilot_status_audit_changed_at ON pilot_status_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_pilot_status_audit_new_status ON pilot_status_audit(new_status);
