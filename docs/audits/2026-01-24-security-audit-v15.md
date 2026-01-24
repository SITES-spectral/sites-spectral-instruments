# Security Audit Report - v15.0.0

> **Audited by:** @shield (Security Expert Agent)
> **Date:** 2026-01-24
> **Version:** 15.0.0
> **Scope:** SITES Spectral Webapp Instruments Registry
> **Classification:** CONFIDENTIAL

---

## Executive Summary

This comprehensive security audit of SITES Spectral webapp v15.0.0 evaluates the authentication, authorization, and data protection mechanisms implemented across the Cloudflare Workers-based application. The audit covers the dual authentication system (Cloudflare Access + legacy credentials), magic link tokens, CORS configuration, CSRF protection, input sanitization, rate limiting, and XSS prevention.

**Overall Security Posture: STRONG**

The application demonstrates enterprise-grade security practices with:
- Proper JWT implementation using HMAC-SHA256 via the `jose` library
- Secure cookie handling with httpOnly, Secure, and SameSite=Strict
- Comprehensive input sanitization framework
- CSRF protection for state-changing operations
- Rate limiting on authentication endpoints
- SHA-256 token hashing for magic links
- PBKDF2 password hashing with 100,000 iterations

**Key Findings:**
- **Critical Issues:** 0
- **High Issues:** 1
- **Medium Issues:** 4
- **Low Issues:** 6
- **Informational:** 3

---

## Critical Issues

*No critical security vulnerabilities were identified.*

---

## High Issues

### H-001: CSRF ALLOWED_ORIGINS Not Synchronized with CORS Configuration
**File:** `src/utils/csrf.js:9-16`
**Severity:** HIGH
**CVSS:** 6.5

**Description:**
The CSRF protection module maintains its own hardcoded `ALLOWED_ORIGINS` list that is not synchronized with the centralized CORS configuration in `src/config/allowed-origins.js`. This creates a maintenance risk where origins could be added to CORS but not to CSRF protection, potentially allowing CSRF attacks from new subdomains.

**Current Code:**
```javascript
// csrf.js
const ALLOWED_ORIGINS = [
    'https://sitesspectral.work',  // MGeo/Lund University production
    'https://sites.jobelab.com',
    'https://sites-spectral-instruments.jose-beltran.workers.dev',
    'https://sites-spectral-instruments.jose-e5f.workers.dev',
    'http://localhost:8787',
    'http://127.0.0.1:8787'
];
```

**Missing Origins:** The CSRF list does not include:
- `https://admin.sitesspectral.work`
- Station subdomains (e.g., `https://svartberget.sitesspectral.work`)

**Risk:** Form submissions from legitimate station portals may fail CSRF validation.

**Recommendation:**
- [ ] Import `ALLOWED_ORIGINS` and `isAllowedOrigin` from `src/config/allowed-origins.js`
- [ ] Use the centralized origin validation for CSRF protection
- [ ] Add unit tests to verify CSRF and CORS origins are synchronized

---

## Medium Issues

### M-001: Legacy Plain Text Password Fallback
**File:** `src/auth/password-hasher.js:111-115`
**Severity:** MEDIUM
**CVSS:** 5.3

**Description:**
The password verification function includes a fallback for plain text passwords during a "migration period." This legacy support weakens overall security.

```javascript
// Handle plain text passwords during migration period
// TODO: Remove this fallback after all passwords are hashed
if (!storedHash.includes(':')) {
    // This is a plain text password (legacy)
    return timingSafeEqual(password, storedHash);
}
```

**Risk:** Any user with a legacy plain text password is vulnerable to database exposure.

**Recommendation:**
- [ ] Audit database for any remaining plain text passwords
- [ ] Force password reset for accounts with plain text passwords
- [ ] Remove legacy fallback code after migration completion
- [ ] Add logging for plain text password usage to track migration

---

### M-002: Open Subdomain Pattern in CORS
**File:** `src/config/allowed-origins.js:104-113`
**Severity:** MEDIUM
**CVSS:** 4.7

**Description:**
The CORS configuration allows any subdomain of `sitesspectral.work` with a simple alphanumeric pattern match. While the pattern is restricted, it could allow unintended subdomains if DNS is misconfigured.

```javascript
// Allow any subdomain of sitesspectral.work
if (host.endsWith('.sitesspectral.work')) {
    const subdomain = host.replace('.sitesspectral.work', '');
    if (/^[a-z0-9-]+$/.test(subdomain)) {
        return true;
    }
}
```

**Risk:** If an attacker gains control of a `*.sitesspectral.work` subdomain (e.g., through DNS hijacking or subdomain takeover), they could make authenticated cross-origin requests.

**Recommendation:**
- [ ] Consider validating against explicit station list from database
- [ ] Implement subdomain inventory monitoring
- [ ] Log CORS requests from unexpected subdomains

---

### M-003: Global Admin Emails Hardcoded
**File:** `src/infrastructure/auth/CloudflareAccessAdapter.js:37-40`
**Severity:** MEDIUM
**CVSS:** 4.3

**Description:**
Global admin emails are hardcoded in the source code:

```javascript
const GLOBAL_ADMIN_EMAILS = [
  'jose.beltran@mgeo.lu.se',
  'lars.eklundh@nateko.lu.se'
];
```

**Risk:**
- Requires code deployment to add/remove administrators
- Admin emails exposed in codebase
- No audit trail for admin list changes

**Recommendation:**
- [ ] Move admin list to database table with audit logging
- [ ] Or use Cloudflare Access groups for admin designation
- [ ] Implement admin provisioning workflow with approval process

---

### M-004: Workers.dev Domain Allowed in CORS
**File:** `src/config/allowed-origins.js:115-117`
**Severity:** MEDIUM
**CVSS:** 4.0

**Description:**
Any `*.workers.dev` subdomain is allowed for CORS, which is overly permissive for production:

```javascript
// Allow workers.dev subdomains for development
if (host.endsWith('.workers.dev')) {
    return true;
}
```

**Risk:** Other Cloudflare Workers on the `.workers.dev` domain could make cross-origin requests to this API.

**Recommendation:**
- [ ] Restrict to specific workers.dev subdomains in production
- [ ] Or disable workers.dev CORS in production environment
- [ ] Use environment variable to control development CORS relaxation

---

## Low Issues

### L-001: X-Subdomain Header Trust
**File:** `src/worker.js:34-36`
**Severity:** LOW
**CVSS:** 3.1

**Description:**
The worker trusts the `X-Subdomain` header for subdomain routing on workers.dev domains:

```javascript
const subdomainHeader = request.headers.get('X-Subdomain');
if (subdomainHeader) {
    return subdomainHeader;
}
```

**Risk:** Attackers could set this header to spoof subdomain context on workers.dev URLs.

**Recommendation:**
- [ ] Only trust X-Subdomain in development mode
- [ ] Add authentication check before trusting header
- [ ] Log X-Subdomain spoofing attempts

---

### L-002: Rate Limit Failure Mode
**File:** `src/middleware/auth-rate-limiter.js:112-117`
**Severity:** LOW
**CVSS:** 3.0

**Description:**
When rate limit checking fails (e.g., database error), requests are allowed through:

```javascript
} catch (error) {
    // If rate limit check fails, allow the request
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: config.maxAttempts, resetAt: 0 };
}
```

**Risk:** During database outages, rate limiting is bypassed, potentially allowing brute force attacks.

**Recommendation:**
- [ ] Consider fail-closed behavior for authentication endpoints
- [ ] Implement in-memory fallback rate limiting
- [ ] Alert on rate limit check failures

---

### L-003: Magic Link Token Displayed in Response
**File:** `src/handlers/magic-links.js:192`
**Severity:** LOW
**CVSS:** 2.8

**Description:**
The full magic link token is returned in the API response:

```javascript
return new Response(JSON.stringify({
    success: true,
    magic_link: {
        token: token, // Only returned once at creation
        url: magicLinkUrl,
        // ...
    }
}));
```

**Risk:** While necessary for functionality, this token could be logged or captured in transit.

**Recommendation:**
- [ ] Ensure TLS is enforced for all API responses
- [ ] Recommend secure token delivery methods in documentation
- [ ] Add warning about single-use nature to response

---

### L-004: Console Logging of Sensitive Operations
**Files:** Multiple
**Severity:** LOW
**CVSS:** 2.5

**Description:**
Several files log potentially sensitive information:
- `console.warn('CF Access user not found in database: ${emailLower}')` - Exposes email
- `console.error('CF Access verification error:', error)` - May expose token details
- `console.warn('Invalid password for user: ${username}')` - Confirms username existence

**Recommendation:**
- [ ] Review all console.log/warn/error for sensitive data
- [ ] Use structured logging with sensitive field masking
- [ ] Implement log level configuration for production

---

### L-005: Missing Content-Security-Policy Headers
**File:** `src/worker.js`
**Severity:** LOW
**CVSS:** 2.3

**Description:**
No Content-Security-Policy (CSP) headers are set on responses, which could allow XSS exploitation if vulnerabilities exist.

**Recommendation:**
- [ ] Implement CSP headers for HTML responses
- [ ] Start with report-only mode to identify issues
- [ ] Consider using Cloudflare Page Shield

---

### L-006: Secure Cookie Missing on Localhost
**File:** `src/auth/cookie-utils.js:28-32`
**Severity:** LOW
**CVSS:** 2.0

**Description:**
The Secure flag is intentionally omitted for localhost development, but this could allow cookie interception on local networks:

```javascript
if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return false;
}
```

**Risk:** Minimal - only affects development environments.

**Recommendation:**
- [ ] Document this behavior for developers
- [ ] Consider using `https://localhost` with self-signed certs for development

---

## Informational

### I-001: PBKDF2 Iterations Could Be Increased
**File:** `src/auth/password-hasher.js:14`

PBKDF2 uses 100,000 iterations, which was the 2023 OWASP recommendation. Consider increasing to 210,000+ as of 2024 OWASP guidance for improved security margin.

---

### I-002: JWT Expiration Time
**File:** `src/auth/authentication.js:284`

JWTs expire after 24 hours. Consider:
- Shorter expiration (4-8 hours) with refresh token pattern
- Or sliding window expiration for active sessions

---

### I-003: Magic Link Session Duration
**File:** `src/handlers/magic-links.js:294`

Magic link sessions expire after 8 hours, which is appropriate for read-only internal access. Consider making this configurable per use case.

---

## Passed Checks

### Authentication
- [x] **JWT Algorithm:** HMAC-SHA256 using jose library (industry standard)
- [x] **JWT Secret Management:** Loaded from Cloudflare secrets (env.JWT_SECRET)
- [x] **Token Structure:** Proper JWT format with iss, sub, iat, exp claims
- [x] **Token Verification:** Full signature and expiration validation
- [x] **Cloudflare Access JWT:** Proper verification via JWKS endpoint

### Cookie Security
- [x] **httpOnly:** Enabled on auth cookie (prevents XSS token theft)
- [x] **Secure:** Enabled in production (HTTPS only)
- [x] **SameSite:** Strict mode (CSRF protection)
- [x] **Path:** Set to root (/)
- [x] **Max-Age:** 24 hours (matches JWT expiry)

### Password Hashing
- [x] **Algorithm:** PBKDF2 with SHA-256
- [x] **Iterations:** 100,000 (meets 2023 OWASP minimum)
- [x] **Salt:** 16 bytes of cryptographic random
- [x] **Key Length:** 256 bits
- [x] **Timing-Safe Comparison:** Implemented for password verification

### Magic Links
- [x] **Token Generation:** 32 bytes (256 bits) of cryptographic random
- [x] **Token Storage:** SHA-256 hash stored, not plain token
- [x] **Expiration:** Default 7 days, configurable
- [x] **Single-Use Option:** Supported with used_at tracking
- [x] **Revocation:** Implemented with revoked_at timestamp
- [x] **Authorization:** Only admins can create/revoke

### SQL Injection Prevention
- [x] **Parameterized Queries:** All database queries use `.bind()` for parameters
- [x] **No String Concatenation:** No raw SQL string building with user input
- [x] **D1 Prepared Statements:** Proper use of `env.DB.prepare()`

### XSS Prevention
- [x] **escapeHtml Function:** Centralized in `public/js/core/security.js`
- [x] **sanitizeUrl Function:** Blocks javascript: and data: protocols
- [x] **textContent Usage:** Preferred over innerHTML for user data
- [x] **Event Delegation:** Image error handling without inline handlers
- [x] **createElement Pattern:** Safe DOM construction helpers

### Input Sanitization
- [x] **String Sanitization:** Control character removal, length limits
- [x] **Integer Validation:** Range checking, NaN handling
- [x] **Float Validation:** Precision control, infinity handling
- [x] **Coordinate Validation:** Latitude/longitude range validation
- [x] **Identifier Sanitization:** Alphanumeric pattern enforcement
- [x] **Enum Validation:** Whitelist-based validation
- [x] **Schema-Based Validation:** Predefined schemas for entities

### CSRF Protection
- [x] **Origin Validation:** Exact match against allowed origins
- [x] **Referer Fallback:** Checks Referer when Origin is absent
- [x] **Safe Methods Bypass:** GET/HEAD/OPTIONS exempted
- [x] **Form Detection:** Enhanced validation for form submissions

### Rate Limiting
- [x] **Login Attempts:** 5 per minute per IP
- [x] **Block Duration:** 5 minutes after limit exceeded
- [x] **IP Detection:** CF-Connecting-IP with fallbacks
- [x] **Success Reset:** Counter cleared on successful login
- [x] **Cleanup:** Automatic old entry cleanup

### Authorization
- [x] **Role-Based Access:** globalAdmin, stationAdmin, stationUser, readonly
- [x] **Permission Matrix:** Resource-action permissions defined
- [x] **Station Scope:** Station users limited to their station
- [x] **Write Protection:** Station users are read-only
- [x] **Portal Access Control:** Subdomain-based portal restrictions

### CORS
- [x] **Origin Whitelist:** Explicit allowed origins
- [x] **Dynamic Origin:** Returns requesting origin if allowed
- [x] **Credentials Support:** Access-Control-Allow-Credentials: true
- [x] **Vary Header:** Proper caching with dynamic origins
- [x] **Preflight Handling:** OPTIONS requests return 204

### HTTPS
- [x] **HTTP Redirect:** Automatic 301 redirect to HTTPS
- [x] **Localhost Exception:** Only for development

---

## Recommendations Summary

### Priority 1 (Address within 2 weeks)
1. Synchronize CSRF allowed origins with CORS configuration
2. Audit and migrate remaining plain text passwords
3. Restrict workers.dev CORS in production

### Priority 2 (Address within 1 month)
4. Move global admin list to database
5. Implement CSP headers
6. Add fail-closed rate limiting fallback

### Priority 3 (Address within 3 months)
7. Review all console logging for sensitive data
8. Increase PBKDF2 iterations to 210,000
9. Consider shorter JWT expiration with refresh tokens
10. Implement subdomain inventory monitoring

---

## Appendix A: Files Reviewed

| Category | File | Status |
|----------|------|--------|
| Auth | `src/auth/authentication.js` | Reviewed |
| Auth | `src/auth/password-hasher.js` | Reviewed |
| Auth | `src/auth/cookie-utils.js` | Reviewed |
| Auth | `src/auth/permissions.js` | Reviewed |
| Auth | `src/infrastructure/auth/CloudflareAccessAdapter.js` | Reviewed |
| Handlers | `src/handlers/magic-links.js` | Reviewed |
| Config | `src/config/allowed-origins.js` | Reviewed |
| Utils | `src/utils/validation.js` | Reviewed |
| Utils | `src/utils/csrf.js` | Reviewed |
| Utils | `src/utils/database.js` | Reviewed |
| Middleware | `src/middleware/auth-rate-limiter.js` | Reviewed |
| Worker | `src/worker.js` | Reviewed |
| API | `src/api-handler.js` | Reviewed |
| CORS | `src/cors.js` | Reviewed |
| Authorization | `src/domain/authorization/AuthorizationService.js` | Reviewed |
| Frontend | `public/js/core/security.js` | Reviewed |
| Frontend | `public/js/core/app.js` | Reviewed |
| Frontend | `public/js/api.js` | Reviewed |
| Repository | `src/infrastructure/persistence/d1/D1InstrumentRepository.js` | Reviewed |

---

## Appendix B: Test Coverage

| Test Category | Tests | Status |
|---------------|-------|--------|
| Total Tests | 653 | Passing |
| Authorization Tests | 57 | Passing |
| Integration Tests | 36 files | Passing |

---

## Appendix C: Security Dependencies

| Package | Version | Purpose | Vulnerability Status |
|---------|---------|---------|---------------------|
| jose | ^5.10.0 | JWT signing/verification | No known vulnerabilities |
| js-yaml | ^4.1.0 | YAML parsing | No known vulnerabilities |
| wrangler | ^4.53.0 | Cloudflare deployment | No known vulnerabilities |

---

*Report generated by @shield Security Expert Agent*
*SITES Spectral Security Audit Framework v2.0*
