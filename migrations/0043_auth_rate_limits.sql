-- Migration 0043: Auth Rate Limits
-- SITES Spectral v12.0.8
-- Date: 2025-12-26
--
-- Creates table for auth rate limiting to prevent brute force attacks.
-- Rate limits:
-- - Login: 5 attempts per minute per IP
-- - Other auth: 30 requests per minute per IP

-- ============================================================
-- AUTH RATE LIMITS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_ip TEXT NOT NULL,
    action TEXT NOT NULL,  -- 'login', 'verify', etc.
    username TEXT,         -- attempted username (for logging)
    timestamp TEXT NOT NULL,

    -- Indexes for efficient lookups
    CONSTRAINT chk_action CHECK (action IN ('login', 'verify', 'refresh', 'logout'))
);

-- Indexes for rate limit queries
CREATE INDEX IF NOT EXISTS idx_auth_rate_ip_action ON auth_rate_limits(client_ip, action);
CREATE INDEX IF NOT EXISTS idx_auth_rate_timestamp ON auth_rate_limits(timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_rate_ip_action_time ON auth_rate_limits(client_ip, action, timestamp);

-- ============================================================
-- CLEANUP: Auto-delete old entries
-- ============================================================
-- Note: D1 doesn't support scheduled triggers, but we clean up
-- in the application code (10% of requests clean up old entries)

-- Add comment for documentation
-- This table stores failed authentication attempts for rate limiting.
-- Entries older than 1 hour are periodically cleaned up by the application.
