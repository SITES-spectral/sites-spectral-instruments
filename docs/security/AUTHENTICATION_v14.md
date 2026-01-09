# Authentication System v14.0

> **Version**: 14.0.3
> **Last Updated**: 2026-01-09
> **Status**: Production Ready

## Overview

SITES Spectral v14.0 implements a secure authentication system using httpOnly JWT cookies with comprehensive role-based access control. This document describes the authentication flow, role hierarchy, and redirect logic.

## Authentication Architecture

### Security Features

| Feature | Implementation |
|---------|----------------|
| **Token Storage** | httpOnly cookies (not accessible via JavaScript) |
| **Token Signing** | JWT with HMAC-SHA256 |
| **Password Hashing** | PBKDF2 with salt |
| **CSRF Protection** | Origin/Referer header validation |
| **Session Verification** | Server-side via `/api/auth/verify` |

### Authentication Flow

```
1. User visits login.html
   ↓
2. verifySessionAndRedirect() checks for existing session
   ↓
3. If valid session → redirect to appropriate dashboard
   ↓
4. User submits credentials
   ↓
5. POST /api/auth/login with credentials: 'include'
   ↓
6. Server validates credentials, returns user info
   ↓
7. Server sets httpOnly cookie automatically
   ↓
8. Frontend stores user info (non-sensitive) in localStorage
   ↓
9. redirectUser() sends to role-appropriate dashboard
```

## Role Hierarchy

SITES Spectral supports 5 user roles with different permission levels:

| Role | Level | Scope | Dashboard |
|------|-------|-------|-----------|
| `admin` | Super Admin | All stations | `/sites-dashboard.html` |
| `sites-admin` | Sites Admin | All stations | `/sites-dashboard.html` |
| `station-admin` | Station Admin | Single station | `/station-dashboard.html?station={acronym}` |
| `station` | Station User | Single station (read-write) | `/station-dashboard.html?station={acronym}` |
| `readonly` | Read Only | All stations (read-only) | `/sites-dashboard.html` |

### Role Capabilities

| Capability | admin | sites-admin | station-admin | station | readonly |
|------------|-------|-------------|---------------|---------|----------|
| View all stations | Yes | Yes | No | No | Yes |
| Edit any station | Yes | Yes | No | No | No |
| Edit assigned station | Yes | Yes | Yes | Yes | No |
| Create platforms | Yes | Yes | Yes | Yes | No |
| Delete stations | Yes | No | No | No | No |
| Manage users | Yes | No | No | No | No |

## Redirect Logic (v14.0.1 Fix)

### Problem Solved

Prior to v14.0.1, the `redirectUser()` function only handled `admin` and `station` roles explicitly, with a default fallback to `/login.html`. This caused infinite redirect loops for:
- `sites-admin` users
- `station-admin` users
- `readonly` users

### Current Implementation

```javascript
redirectUser(user) {
    // SECURITY: Validate redirect URL to prevent open redirect attacks
    const isValidRedirect = redirect &&
        redirect.startsWith('/') &&
        !redirect.startsWith('//') &&
        !redirect.toLowerCase().includes('javascript:') &&
        !redirect.toLowerCase().includes('data:') &&
        !redirect.toLowerCase().includes('vbscript:');

    // Default to sites-dashboard (NOT login.html to avoid infinite loop)
    let targetUrl = '/sites-dashboard.html';

    // Global admins (admin or sites-admin)
    if (user.role === 'admin' || user.role === 'sites-admin') {
        targetUrl = isValidRedirect ? redirect : '/sites-dashboard.html';
    }
    // Station-specific admin with assigned station
    else if (user.role === 'station-admin' && user.station_acronym) {
        targetUrl = isValidRedirect ? redirect : `/station-dashboard.html?station=${user.station_acronym}`;
    }
    // Regular station user with assigned station
    else if (user.role === 'station' && user.station_acronym) {
        targetUrl = isValidRedirect ? redirect : `/station-dashboard.html?station=${user.station_acronym}`;
    }
    // Read-only users view all stations
    else if (user.role === 'readonly') {
        targetUrl = isValidRedirect ? redirect : '/sites-dashboard.html';
    }
    // Fallback: sites-dashboard (safe default)

    window.location.href = targetUrl;
}
```

### Key Design Decisions

1. **Safe Default**: Default redirect is `/sites-dashboard.html`, never `/login.html`
2. **Explicit Role Handling**: All 5 roles are explicitly handled
3. **Station Binding**: Station-specific roles require `station_acronym`
4. **Open Redirect Prevention**: Validates redirect URLs before use

## Files Implementing Authentication

| File | Purpose |
|------|---------|
| `public/login.html` | Main login page with redirect logic |
| `public/index.html` | Root redirect with session check |
| `public/js/legacy/api-v1.js` | API client with auth helpers |
| `public/js/dashboard.js` | Dashboard redirect logic |
| `src/auth.js` | Server-side JWT validation |
| `src/handlers/auth.js` | Login/logout/verify endpoints |

## API Endpoints

### POST /api/auth/login

Authenticates user and sets httpOnly cookie.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "station_acronym": null
  }
}
```

### GET /api/auth/verify

Verifies current session via httpOnly cookie.

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "station_acronym": null
  }
}
```

### POST /api/auth/logout

Clears httpOnly cookie and ends session.

**Response (200):**
```json
{
  "success": true
}
```

## Helper Functions (api-v1.js)

```javascript
// Check if user has global admin role (admin or sites-admin)
isAdmin() {
    const user = this.getUser();
    return user && (user.role === 'admin' || user.role === 'sites-admin');
}

// Check if user has station-admin role
isStationAdmin() {
    const user = this.getUser();
    return user && user.role === 'station-admin';
}

// Check if user has any edit permission
canEdit() {
    const user = this.getUser();
    if (!user) return false;
    return ['admin', 'sites-admin', 'station-admin', 'station'].includes(user.role);
}
```

## Security Considerations

### httpOnly Cookies

- Tokens are stored in httpOnly cookies, preventing XSS attacks from stealing tokens
- All API requests must include `credentials: 'include'` to send cookies
- Session verification happens server-side, not by checking localStorage

### Open Redirect Prevention

The redirect validation prevents attackers from crafting malicious login URLs:

```javascript
// These are blocked:
?redirect=//evil.com           // Protocol-relative URL
?redirect=javascript:alert(1)   // JavaScript protocol
?redirect=data:text/html,...    // Data URL
?redirect=vbscript:...          // VBScript protocol

// These are allowed:
?redirect=/sites-dashboard.html  // Relative path
?redirect=/station-dashboard.html?station=SVB  // With query params
```

### Session Storage

| Storage | Content | Accessible via JS |
|---------|---------|-------------------|
| httpOnly Cookie | JWT token | No (secure) |
| localStorage | User info (role, username) | Yes (for UI only) |

The localStorage user info is only used for UI display purposes. All permission checks happen server-side using the httpOnly cookie.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v14.0.0 | 2026-01-08 | httpOnly cookie migration, centralized auth |
| v14.0.1 | 2026-01-08 | Fixed redirect loops for all 5 roles |
| v14.0.2 | 2026-01-08 | Build artifacts updated |
| v14.0.3 | 2026-01-09 | Duplicate platform prevention dialog |

## Related Documentation

- [Authorization Architecture](./AUTHORIZATION_ARCHITECTURE_DIAGRAM.md)
- [Authorization Security Analysis](./AUTHORIZATION_SECURITY_ANALYSIS.md)
- [Quick Reference: Enhanced Permissions](./QUICK_REFERENCE_ENHANCED_PERMISSIONS.md)
