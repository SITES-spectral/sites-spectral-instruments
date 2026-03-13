-- Migration 0051: Add session revocation table for secure token refresh (L1 audit fix)
-- v15.8.6: Enables session cookie refresh without creating non-expiring sessions
--
-- When a session is refreshed, the old token's JTI is recorded here.
-- getUserFromLegacyAuth checks this table to reject revoked tokens.
-- A scheduled cleanup removes expired entries (tokens that would have expired anyway).

CREATE TABLE IF NOT EXISTS revoked_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jti TEXT NOT NULL UNIQUE,           -- JWT ID of the revoked token
    user_id TEXT,                       -- Username for audit trail
    revoked_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,           -- Original token expiry (for cleanup)
    reason TEXT DEFAULT 'refresh'       -- 'refresh', 'logout', 'admin_revoke'
);

-- Index for fast JTI lookup during token validation
CREATE INDEX IF NOT EXISTS idx_revoked_sessions_jti ON revoked_sessions(jti);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_revoked_sessions_expires ON revoked_sessions(expires_at);
