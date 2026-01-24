# Cloudflare Access Integration

> **Architecture Credit**: This subdomain-based architecture design is based on
> architectural knowledge shared by **Flights for Biodiversity Sweden AB**
> (https://github.com/flightsforbiodiversity).

## Overview

SITES Spectral uses Cloudflare Access for passwordless authentication via email OTP. This replaces the traditional username/password authentication for admin and station portals.

---

## Access Applications

### 1. Admin Portal Application

| Property | Value |
|----------|-------|
| Application Name | SITES Spectral Admin Portal |
| Application Domain | `admin.sitesspectral.work` |
| Session Duration | 24 hours |
| Authentication | Email OTP |

**Access Policies:**

```yaml
Policy: Allow Global Admins
  Rule: Include
    - Email: jose.beltran@mgeo.lu.se
    - Email: lars.eklundh@nateko.lu.se
```

### 2. Station Wildcard Application

| Property | Value |
|----------|-------|
| Application Name | SITES Spectral Station Portals |
| Application Domain | `*.sitesspectral.work` |
| Session Duration | 24 hours |
| Authentication | Email OTP |

**Access Policies:**

```yaml
Policy: Allow Station Admins
  Rule: Include
    - Emails ending in: @slu.se
    - Emails ending in: @nateko.lu.se
    - Emails ending in: @mgeo.lu.se
    - Additional station-specific emails

Policy: Bypass Public Assets
  Rule: Bypass
    - Path: /api/public/*
    - Path: /css/*
    - Path: /js/*
    - Path: /images/*
    - Path: /favicon.ico
```

---

## JWT Verification

### Token Location

Cloudflare Access adds the JWT to the request header:

```
Cf-Access-Jwt-Assertion: eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

### Verification Process

```javascript
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Create JWKS for signature verification
const jwks = createRemoteJWKSet(
  new URL('https://sitesspectral.cloudflareaccess.com/cdn-cgi/access/certs')
);

// Verify the JWT
const { payload } = await jwtVerify(jwt, jwks, {
  audience: CF_ACCESS_AUD, // Your application AUD
  issuer: 'https://sitesspectral.cloudflareaccess.com'
});

// Extract user email
const email = payload.email;
```

### JWT Claims

| Claim | Description |
|-------|-------------|
| `email` | User's verified email address |
| `sub` | Subject (unique identifier) |
| `aud` | Audience (your application ID) |
| `iss` | Issuer (your Access team domain) |
| `iat` | Issued at timestamp |
| `exp` | Expiration timestamp |
| `identity_nonce` | Unique session identifier |

---

## Email-to-User Mapping

### Mapping Priority

1. Check `users.cf_access_email` for exact match
2. Check `uav_pilots.email` for pilot access
3. Check global admin whitelist
4. Return null if no match (user not authorized)

### Global Admin Whitelist

```javascript
const GLOBAL_ADMIN_EMAILS = [
  'jose.beltran@mgeo.lu.se',
  'lars.eklundh@nateko.lu.se'
];
```

### User Creation

Users must be pre-registered in the database. Auto-provisioning is not enabled to maintain access control.

To register a new CF Access user:

```sql
INSERT INTO users (username, email, role, station_id, auth_provider, cf_access_email, active)
VALUES ('svartberget-admin', 'user@slu.se', 'station-admin', 7, 'cloudflare_access', 'user@slu.se', 1);
```

---

## Portal Access Control

### Access Decision Flow

```
Request arrives at Worker
    │
    ├── Extract subdomain
    │
    ├── Determine portal type (public/admin/station)
    │
    ├── If public: Allow without auth
    │
    ├── If admin/station:
    │   │
    │   ├── Verify CF Access JWT
    │   │
    │   ├── Map email to user
    │   │
    │   ├── Check role permissions
    │   │
    │   └── Allow or deny access
    │
    └── Return response
```

### Permission Matrix

| Role | Admin Portal | Station Portal (own) | Station Portal (other) |
|------|--------------|---------------------|----------------------|
| admin | ✅ | ✅ | ✅ |
| sites-admin | ✅ | ✅ | ✅ |
| station-admin | ❌ | ✅ | ❌ |
| station | ❌ | ✅ (read-only) | ❌ |
| uav-pilot | ❌ | ✅ (authorized) | ❌ |

---

## Cloudflare Dashboard Setup

### Step 1: Create Team

1. Go to Cloudflare Zero Trust Dashboard
2. Create organization: `sitesspectral`
3. Note your team domain: `sitesspectral.cloudflareaccess.com`

### Step 2: Create Admin Application

1. Go to Access → Applications → Add an Application
2. Select "Self-hosted"
3. Configure:
   - Application name: `SITES Spectral Admin Portal`
   - Application domain: `admin.sitesspectral.work`
   - Session duration: 24 hours

### Step 3: Create Admin Policy

1. Add policy to Admin Application
2. Policy name: `Allow Global Admins`
3. Action: Allow
4. Include:
   - Selector: Emails
   - Value: `jose.beltran@mgeo.lu.se`
   - Value: `lars.eklundh@nateko.lu.se`

### Step 4: Create Station Wildcard Application

1. Add another application
2. Configure:
   - Application name: `SITES Spectral Station Portals`
   - Application domain: `*.sitesspectral.work`
   - Session duration: 24 hours

### Step 5: Create Station Policies

Add policies for each station's authorized users, or use email domain matching.

### Step 6: Get Application AUD

1. View application details
2. Copy the `Application Audience (AUD)` value
3. Add to Cloudflare Worker secrets:

```bash
wrangler secret put CF_ACCESS_AUD
```

---

## Troubleshooting

### "Access Denied" Errors

1. Verify email is in Access policy
2. Check user exists in database with matching `cf_access_email`
3. Verify JWT is being passed correctly

### JWT Verification Fails

1. Check team domain is correct
2. Verify AUD value matches application
3. Check for clock skew issues

### Session Not Persisting

1. Verify session duration in Access application
2. Check for cookie issues (SameSite, Secure flags)
3. Verify domain matches between Access and Worker

---

## Related Documentation

- [[SUBDOMAIN_ARCHITECTURE]] - Overall architecture overview
- [[MAGIC_LINK_SYSTEM]] - Alternative authentication for internal users
