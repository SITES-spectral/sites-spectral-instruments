# Session Persistence for Cloudflare Access Users

> **Version**: v15.6.11
> **Security ID**: SEC-007
> **Date**: 2026-02-16
> **Status**: Production Active

## Overview

This document describes the session persistence mechanism implemented in v15.6.11 that allows Cloudflare Access authenticated users to maintain their session without repeated OTP verification.

## Problem Statement

### Before v15.6.11

When users authenticated via Cloudflare Access (passwordless OTP), the system relied solely on the CF Access JWT token:

```
User → CF Access OTP → CF Access JWT → API Request
                         ↓
              JWT expires (policy-based)
                         ↓
              User must re-authenticate via OTP
```

**Issues:**
- CF Access JWT has a configurable but typically short lifetime (hours to 24 hours)
- Every API request required valid CF Access JWT
- When JWT expired, users were forced to re-enter OTP codes
- This created significant friction for admins making multiple updates

### Authentication Comparison (Before v15.6.11)

| Auth Method | Initial Auth | Session Management | User Experience |
|-------------|--------------|-------------------|-----------------|
| CF Access OTP | Email OTP | CF Access JWT only | Re-auth on JWT expiry |
| Password | Password | Internal cookie (24h) | Seamless 24h session |
| Magic Link | Email link | Internal cookie (24h) | Seamless 24h session |

## Solution

### v15.6.11 Implementation

When CF Access authentication succeeds, the system now issues an internal session cookie alongside the CF Access JWT:

```
User → CF Access OTP → CF Access JWT → First API Request
                                              ↓
                              Internal JWT generated
                              Cookie set (24h, httpOnly)
                                              ↓
                        Subsequent requests use cookie
                              (CF Access JWT optional)
```

### Authentication Flow (After v15.6.11)

| Auth Method | Initial Auth | Session Persistence | User Experience |
|-------------|--------------|---------------------|-----------------|
| CF Access OTP | Email OTP | Internal cookie (24h) | Seamless 24h session |
| Password | Password | Internal cookie (24h) | Seamless 24h session |
| Magic Link | Email link | Internal cookie (24h) | Seamless 24h session |

All authentication methods now provide consistent session management.

## Technical Implementation

### Worker Entry Point (src/worker.js)

```javascript
// v15.6.11 (SEC-007): Issue persistent session cookie for CF Access users
// This prevents requiring OTP re-authentication when CF Access JWT expires
// The internal session cookie lasts 24 hours and is shared across subdomains

if (user && user.auth_provider === 'cloudflare_access') {
  const existingCookie = getTokenFromCookie(request);
  if (!existingCookie) {
    try {
      // Generate internal JWT for persistent session
      const internalToken = await generateToken(user, env);
      const authCookie = createAuthCookie(internalToken, request);
      response.headers.set('Set-Cookie', authCookie);
    } catch (cookieError) {
      // Don't fail the request if cookie generation fails
      console.warn('Failed to create session cookie for CF Access user:', cookieError);
    }
  }
}
```

### Cookie Configuration

The session cookie uses the same secure settings as password and magic link authentication:

```javascript
// From src/auth/cookie-utils.js
const COOKIE_NAME = 'sites_spectral_auth';
const COOKIE_MAX_AGE = 86400; // 24 hours

function createAuthCookie(token, request) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'HttpOnly',
    'SameSite=Lax',
    'Domain=.sitesspectral.work'  // Shared across all subdomains
  ];

  if (isSecureContext(request)) {
    parts.push('Secure');
  }

  return parts.join('; ');
}
```

### Authentication Priority

The system checks authentication sources in this order:

1. **Cloudflare Access JWT** (`Cf-Access-Jwt-Assertion` header)
2. **Request context** (`request.cfAccessUser` set by worker)
3. **httpOnly cookie** (`sites_spectral_auth`)
4. **Authorization header** (Bearer token, legacy support)

```javascript
// From src/auth/authentication.js
export async function getUserFromRequest(request, env) {
  // Priority 1: Cloudflare Access JWT
  const cfAccessUser = await getUserFromCFAccess(request, env);
  if (cfAccessUser) return cfAccessUser;

  // Priority 2: Request context (set by worker)
  if (request.cfAccessUser) return request.cfAccessUser;

  // Priority 3-4: Legacy authentication (cookie or Bearer token)
  return await getUserFromLegacyAuth(request, env);
}
```

## Security Considerations

### Cookie Security Features

| Feature | Value | Purpose |
|---------|-------|---------|
| `HttpOnly` | Yes | Prevents XSS attacks from accessing token |
| `Secure` | Yes (production) | Only sent over HTTPS |
| `SameSite` | Lax | Allows cross-subdomain auth, maintains CSRF protection |
| `Domain` | `.sitesspectral.work` | Shared across all station subdomains |
| `Max-Age` | 86400 (24h) | Matches JWT expiration |

### Cross-Subdomain Support

The cookie is configured for the root domain (`.sitesspectral.work`), allowing seamless authentication across:

- `sitesspectral.work` (public portal)
- `admin.sitesspectral.work` (admin portal)
- `svartberget.sitesspectral.work` (station portal)
- `{any-station}.sitesspectral.work` (station portals)

### CSRF Protection

While `SameSite=Lax` is less restrictive than `Strict`, CSRF protection is maintained through:

1. **Origin/Referer validation** in `src/utils/csrf.js`
2. **State-changing request checks** for POST, PUT, PATCH, DELETE
3. **Centralized allowed origins list** in `src/config/allowed-origins.js`

## Backward Compatibility

This change is fully backward compatible:

- **Password login**: Unchanged - continues to use internal cookie
- **Magic link**: Unchanged - continues to use internal cookie
- **CF Access users without cookie**: Still works via CF Access JWT
- **Existing sessions**: Unaffected - new cookie issued on next CF Access request

## Files Modified

| File | Change |
|------|--------|
| `src/worker.js` | Added session cookie issuance for CF Access users |
| `src/auth/authentication.js` | Already supports internal JWT (no changes needed) |
| `src/auth/cookie-utils.js` | Already exports required functions (no changes needed) |

## Testing

### Manual Testing

1. Clear all cookies for `sitesspectral.work`
2. Visit `admin.sitesspectral.work`
3. Authenticate via CF Access OTP
4. Check browser DevTools → Application → Cookies
5. Verify `sites_spectral_auth` cookie is present
6. Wait for CF Access JWT to expire (or manually clear CF Access cookies)
7. Verify API requests still work using internal cookie

### Verification Commands

```bash
# Check deployment health
curl -s https://sites-spectral-instruments.jose-beltran.workers.dev/api/health | jq '.version'

# Expected output: "15.6.11"
```

## Related Documentation

- [Cloudflare Access Integration](./CLOUDFLARE_ACCESS_INTEGRATION.md)
- [Authentication v14](./AUTHENTICATION_v14.md)
- [Magic Link System](../MAGIC_LINK_SYSTEM.md)
- [Subdomain Architecture](../architecture/SUBDOMAIN_ARCHITECTURE.md)

## Changelog

| Version | Date | Change |
|---------|------|--------|
| v15.6.11 | 2026-02-16 | Initial implementation of CF Access session persistence |
