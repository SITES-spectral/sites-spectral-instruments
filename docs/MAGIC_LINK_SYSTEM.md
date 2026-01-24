# Magic Link System

> **Architecture Credit**: This subdomain-based architecture design is based on
> architectural knowledge shared by **Flights for Biodiversity Sweden AB**
> (https://github.com/flightsforbiodiversity).

## Overview

Magic links provide passwordless, time-limited access for station internal users who need read-only access to station data without requiring a full user account or Cloudflare Access.

---

## Use Cases

| Scenario | Example |
|----------|---------|
| **Visiting Researchers** | Temporary access for a week-long field visit |
| **External Collaborators** | Read-only access to share data |
| **Demo/Training** | Limited access for workshops |
| **Backup Access** | Alternative when CF Access isn't available |

---

## Token Specification

| Property | Value |
|----------|-------|
| **Algorithm** | 256-bit cryptographic random (32 bytes) |
| **Format** | Hex-encoded string (64 characters) |
| **Storage** | SHA-256 hash only (raw token never stored) |
| **Default Expiry** | 7 days |
| **Single-use Option** | Available |
| **Scope** | Station-specific |
| **Permissions** | Read-only |

---

## API Endpoints

### Create Magic Link

```http
POST /api/v11/magic-links/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "station_id": 7,
  "label": "Visiting Researcher - Dr. Smith",
  "description": "Access for week-long field visit",
  "expires_in_days": 7,
  "single_use": false,
  "role": "readonly"
}
```

**Response:**

```json
{
  "success": true,
  "magic_link": {
    "id": 42,
    "token": "a1b2c3d4e5f6...",
    "url": "https://svartberget.sitesspectral.work/auth/magic?token=a1b2c3d4e5f6...",
    "station_id": 7,
    "station_acronym": "SVB",
    "label": "Visiting Researcher - Dr. Smith",
    "role": "readonly",
    "expires_at": "2026-01-31T12:00:00.000Z",
    "single_use": false
  },
  "message": "Magic link created. Share this URL securely - it cannot be retrieved again."
}
```

### Validate Magic Link

```http
GET /api/v11/magic-links/validate?token=a1b2c3d4e5f6...
```

**Response (Success):**

```json
{
  "success": true,
  "user": {
    "username": "magic_svb_42",
    "role": "readonly",
    "station_id": 7,
    "station_acronym": "SVB",
    "auth_provider": "magic_link",
    "permissions": ["read"]
  },
  "message": "Magic link validated successfully",
  "redirect": "/station-dashboard.html?station=SVB"
}
```

### Revoke Magic Link

```http
POST /api/v11/magic-links/revoke
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "token_id": 42,
  "reason": "Access no longer needed"
}
```

### List Magic Links

```http
GET /api/v11/magic-links/list?station_id=7&include_revoked=false&include_expired=false
Authorization: Bearer <admin_token>
```

---

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                         Token Lifecycle                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌─────────┐    ┌────────┐    ┌─────────────┐   │
│  │ Created  │───>│  Active │───>│  Used  │───>│  Expired /  │   │
│  └──────────┘    └─────────┘    └────────┘    │  Revoked    │   │
│                       │              │         └─────────────┘   │
│                       │              │                           │
│                       v              v                           │
│                  ┌──────────────────────┐                        │
│                  │  If single_use=true  │                        │
│                  │  Token invalidated   │                        │
│                  └──────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Token Security

- Raw tokens are **never stored** - only SHA-256 hash
- Tokens are returned **once** at creation time
- 256-bit entropy provides strong randomness
- Tokens cannot be guessed or brute-forced

### Session Security

- Magic link sessions expire after **8 hours**
- Sessions use httpOnly cookies (same as regular auth)
- Sessions are station-scoped (cannot access other stations)

### Access Control

| Action | Who Can Perform |
|--------|-----------------|
| Create link | Station admin (own station), Global admin |
| Revoke link | Station admin (own station), Global admin |
| Use link | Anyone with valid token |
| List links | Station admin (own station), Global admin |

### Audit Trail

All magic link operations are logged:

- `MAGIC_LINK_CREATED` - Token creation with creator info
- `MAGIC_LINK_USED` - Successful token validation
- `MAGIC_LINK_REVOKED` - Token revocation with reason
- `MAGIC_LINK_INVALID` - Invalid token attempt
- `MAGIC_LINK_EXPIRED_USE_ATTEMPT` - Expired token use
- `MAGIC_LINK_REUSE_ATTEMPT` - Single-use token reuse

---

## Database Schema

```sql
CREATE TABLE magic_link_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Token identification (hash only - raw token never stored)
    token TEXT NOT NULL UNIQUE,           -- Truncated display (first 8 chars)
    token_hash TEXT NOT NULL,             -- SHA-256 hash for lookup

    -- Association
    station_id INTEGER NOT NULL REFERENCES stations(id),
    created_by_user_id INTEGER NOT NULL REFERENCES users(id),

    -- Properties
    label TEXT,                           -- Friendly name
    description TEXT,                     -- Purpose description
    role TEXT DEFAULT 'readonly',         -- Access level
    permissions TEXT DEFAULT '["read"]',  -- JSON array

    -- Lifecycle
    expires_at DATETIME NOT NULL,
    single_use BOOLEAN DEFAULT false,
    used_at DATETIME,
    used_by_ip TEXT,
    used_by_user_agent TEXT,

    -- Revocation
    revoked_at DATETIME,
    revoked_by_user_id INTEGER REFERENCES users(id),
    revoke_reason TEXT,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## User Flow

### Creating a Magic Link

1. Station admin logs in to station portal
2. Navigates to "Access Management" section
3. Clicks "Create Magic Link"
4. Fills in:
   - Label (e.g., "Dr. Smith - Field Visit")
   - Description (optional)
   - Expiry duration (default: 7 days)
   - Single-use checkbox
5. Clicks "Create"
6. **Copies the link immediately** (cannot be retrieved later)
7. Shares link with intended recipient via email/message

### Using a Magic Link

1. User receives magic link via email
2. Clicks link: `https://svartberget.sitesspectral.work/auth/magic?token=...`
3. Token is validated by the Worker
4. If valid:
   - Session JWT is issued (8-hour expiry)
   - User is redirected to station dashboard
   - Read-only access is granted
5. If invalid/expired:
   - Error message is displayed
   - User is directed to contact station admin

---

## Best Practices

### For Administrators

- Use descriptive labels for easy management
- Set appropriate expiry (don't leave links valid indefinitely)
- Use single-use for sensitive one-time access
- Review and revoke unused links periodically
- Never share raw tokens in insecure channels

### For Users

- Don't share magic links with others
- Notify admin if link is compromised
- Log out when finished (clears session)

---

## Related Documentation

- [[SUBDOMAIN_ARCHITECTURE]] - Overall architecture overview
- [[CLOUDFLARE_ACCESS_INTEGRATION]] - Primary authentication method
