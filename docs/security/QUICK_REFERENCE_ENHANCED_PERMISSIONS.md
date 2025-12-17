# Quick Reference: Enhanced Station-Admin Permissions

**Version:** 1.0
**Date:** 2025-12-09
**Status:** Proposed Implementation

---

## TL;DR - Critical Security Gap

**Problem**: Station admins (e.g., `svb-admin`) currently have **unintended global admin access** due to conflation of `role === 'admin'`.

**Solution**: Distinguish global admins by username pattern:
- `admin`, `sites-admin` → Global admins (full access)
- `{station}-admin` → Station admins (station-scoped only)

**Impact**: Closes critical privilege escalation vulnerability.

---

## Current vs Proposed Authorization

### Current System (INSECURE)

```javascript
// ❌ PROBLEM: All admins have global access
function validateAdminPermission(user) {
  return user.role === 'admin'; // svb-admin, ans-admin, etc. all return true
}

// Result: svb-admin can access ALL stations and admin panel
```

### Proposed System (SECURE)

```javascript
// ✅ SOLUTION: Username-based global admin check
const SUPER_ADMIN_ROLES = ['admin', 'sites-admin'];

function isGlobalAdmin(user) {
  return user.role === 'admin' && SUPER_ADMIN_ROLES.includes(user.username);
}

function isStationAdmin(user) {
  return user.role === 'station-admin' ||
         (user.role === 'admin' && user.username.endsWith('-admin'));
}

// Result: Only admin and sites-admin have global access
// svb-admin, ans-admin, etc. are station-scoped
```

---

## New Authorization Functions

### Global Admin Check

```javascript
import { isGlobalAdmin, requireGlobalAdmin } from '../auth/permissions.js';

// Use in handlers that require system-wide access
const adminUser = await requireGlobalAdmin(request, env);
if (adminUser instanceof Response) {
  return adminUser; // 403 Forbidden for station admins
}

// Examples: User management, system analytics, cross-station operations
```

### Station Admin Check

```javascript
import { requireStationAdminAccess } from '../auth/permissions.js';

// Use in handlers that modify station resources
const adminUser = await requireStationAdminAccess(request, env, stationId);
if (adminUser instanceof Response) {
  return adminUser; // 403 if user cannot access this station
}

// Examples: Platform delete, instrument delete, ROI override
```

---

## Access Matrix (After Enhancement)

| User | Username | Access Level | Restrictions |
|------|----------|--------------|--------------|
| **Global Admin** | `admin` | ALL stations + admin panel | None |
| **Global Admin** | `sites-admin` | ALL stations + admin panel | None |
| **Station Admin** | `svb-admin` | SVB station ONLY | ❌ No other stations<br>❌ No admin panel<br>❌ No user management |
| **Station Admin** | `ans-admin` | ANS station ONLY | ❌ No other stations<br>❌ No admin panel<br>❌ No user management |
| **Station User** | `svb-user` | SVB station (limited) | ❌ No delete operations<br>❌ No admin features |
| **Readonly** | `viewer` | ALL stations (read-only) | ❌ No write operations |

---

## Endpoints Requiring Global Admin

These endpoints will **REJECT** station admins after enhancement:

| Endpoint | Current Behavior | New Behavior |
|----------|------------------|--------------|
| `GET /api/admin/user-sessions` | ✅ svb-admin allowed | ❌ svb-admin DENIED |
| `GET /api/admin/station-stats` | ✅ svb-admin allowed | ❌ svb-admin DENIED |
| `GET /api/users/list` | ✅ svb-admin allowed | ❌ svb-admin DENIED |
| `POST /api/users/create` | ✅ svb-admin allowed | ❌ svb-admin DENIED |
| `GET /api/analytics/system-wide` | ✅ svb-admin allowed | ❌ svb-admin DENIED |

---

## Station-Scoped Operations

Station admins will **CONTINUE** to have full access within their station:

| Operation | svb-admin @ SVB | svb-admin @ ANS |
|-----------|-----------------|-----------------|
| `GET /api/platforms` (SVB) | ✅ Allowed | ❌ DENIED |
| `POST /api/platforms` (SVB) | ✅ Allowed | ❌ DENIED |
| `DELETE /api/platforms/SVB_FOR_TWR01` | ✅ Allowed | N/A |
| `DELETE /api/platforms/ANS_FOR_BLD01` | ❌ DENIED | ✅ Allowed (if ans-admin) |
| `PUT /api/instruments/SVB_FOR_TWR01_PHE01` | ✅ Allowed | N/A |
| `DELETE /api/instruments/ANS_FOR_BLD01_PHE01` | ❌ DENIED | ✅ Allowed (if ans-admin) |
| `GET /api/export/station/SVB` | ✅ Allowed | ❌ DENIED |

---

## Implementation Checklist

### Phase 1: Core Permission Functions ✅

- [ ] Add `SUPER_ADMIN_ROLES` constant to `src/auth/permissions.js`
- [ ] Implement `isGlobalAdmin(user)` function
- [ ] Implement `isStationAdmin(user)` function
- [ ] Update `validateAdminPermission()` to use `isGlobalAdmin()`
- [ ] Add `requireGlobalAdmin(request, env)` middleware
- [ ] Add `requireStationAdminAccess(request, env, stationId)` middleware
- [ ] Update `checkUserPermissions()` permission matrix

### Phase 2: Handler Updates ⚠️ CRITICAL

- [ ] **`src/handlers/users.js`** (line 31):
  ```javascript
  - if (user.role !== 'admin')
  + const adminUser = await requireGlobalAdmin(request, env)
  ```

- [ ] **`src/infrastructure/http/controllers/AdminController.js`** (line 35):
  ```javascript
  - if (!user || user.role !== 'admin')
  + if (!isGlobalAdmin(user))
  ```

- [ ] **`src/admin/admin-router.js`**:
  - Add `requireGlobalAdmin()` to all admin routes

- [ ] **Platform/Instrument Handlers**:
  - Add `requireStationAdminAccess()` to delete operations

### Phase 3: Enhanced Logging 📊

- [ ] Add `UNAUTHORIZED_GLOBAL_ADMIN_ACCESS` event type
- [ ] Add `UNAUTHORIZED_STATION_ADMIN_ACCESS` event type
- [ ] Add `STATION_BOUNDARY_VIOLATION` event type
- [ ] Update `logSecurityEvent()` to include station context

### Phase 4: Testing 🧪

- [ ] Test global admin (`admin`) can access all endpoints
- [ ] Test global admin (`sites-admin`) can access all endpoints
- [ ] Test station admin (`svb-admin`) can access SVB only
- [ ] Test station admin (`svb-admin`) is **DENIED** ANS access
- [ ] Test station admin (`svb-admin`) is **DENIED** `/api/admin/*`
- [ ] Test station admin (`svb-admin`) is **DENIED** `/api/users/*`
- [ ] Verify all denied requests are logged

---

## Testing Commands

### Test Global Admin Access (Should Pass)

```bash
# Login as global admin
curl -X POST https://sites.jobelab.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sites-admin","password":"[REDACTED]"}'

# Test global endpoints (should work)
curl -H "Authorization: Bearer $TOKEN" \
  https://sites.jobelab.com/api/admin/user-sessions

curl -H "Authorization: Bearer $TOKEN" \
  https://sites.jobelab.com/api/users/list
```

### Test Station Admin Access (Should Fail for Global Endpoints)

```bash
# Login as station admin
curl -X POST https://sites.jobelab.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"svb-admin","password":"[REDACTED]"}'

# Test global endpoints (should fail with 403)
curl -H "Authorization: Bearer $TOKEN" \
  https://sites.jobelab.com/api/admin/user-sessions
# Expected: {"error":"Global admin privileges required..."}

curl -H "Authorization: Bearer $TOKEN" \
  https://sites.jobelab.com/api/users/list
# Expected: {"error":"Global admin privileges required..."}

# Test own station (should work)
curl -H "Authorization: Bearer $TOKEN" \
  https://sites.jobelab.com/api/platforms?station=svartberget
# Expected: 200 OK with SVB platforms

# Test other station (should fail with 403)
curl -H "Authorization: Bearer $TOKEN" \
  https://sites.jobelab.com/api/platforms?station=abisko
# Expected: {"error":"Station admin svb-admin cannot access station abisko"}
```

---

## Security Event Logs (Expected)

After enhancement, these events will appear in `activity_log`:

```json
{
  "event_type": "UNAUTHORIZED_GLOBAL_ADMIN_ACCESS",
  "timestamp": "2025-12-09T14:32:15.123Z",
  "username": "svb-admin",
  "role": "station-admin",
  "user_station": "svartberget",
  "target_station": null,
  "details": {
    "endpoint": "/api/admin/user-sessions",
    "reason": "Station admin cannot access global endpoint"
  }
}

{
  "event_type": "STATION_BOUNDARY_VIOLATION",
  "timestamp": "2025-12-09T14:35:42.456Z",
  "username": "svb-admin",
  "role": "station-admin",
  "user_station": "svartberget",
  "target_station": "abisko",
  "details": {
    "endpoint": "/api/platforms/ANS_FOR_PL01",
    "reason": "Station admin svb-admin cannot access station abisko"
  }
}
```

---

## Communication Template for Station Admins

**Subject:** Security Enhancement - Station Admin Permissions Update

Dear Station Administrator,

**What's Changing:**
- Station admins (e.g., `svb-admin`, `ans-admin`) will be restricted to their assigned station only
- Global system endpoints (user management, analytics) now require global admin credentials

**What You Can Still Do:**
- ✅ Full edit/delete permissions within your assigned station
- ✅ Platform and instrument lifecycle management
- ✅ ROI management
- ✅ Data export for your station

**What You Can No Longer Do:**
- ❌ Access other stations' resources
- ❌ View system-wide user sessions
- ❌ Manage user accounts
- ❌ Access global analytics

**If You Need Cross-Station Access:**
Contact the SITES Spectral system administrator (`admin` or `sites-admin`) at sites-spectral-support@example.com

**Effective Date:** [Deployment Date]

This change closes a security gap and ensures proper access control.

Thank you,
SITES Spectral Team

---

## Rollback Plan (If Needed)

If issues arise after deployment:

### Quick Rollback (Emergency)

```bash
# Revert permissions.js changes
git revert <commit-hash>
npm run build
npm run deploy

# Estimated rollback time: 15 minutes
```

### Validation After Rollback

```bash
# Test that station admins regain access
curl -H "Authorization: Bearer $TOKEN" \
  https://sites.jobelab.com/api/admin/user-sessions
# Expected: 200 OK (if rolled back)
```

---

## References

- **Full Analysis**: `docs/security/AUTHORIZATION_SECURITY_ANALYSIS.md`
- **OWASP Top 10**: A01:2021 - Broken Access Control
- **NIST RBAC**: SP 800-162 - Role-Based Access Control
- **Zero Trust**: NIST SP 800-207

---

**Prepared By**: Shield (Security Architecture Agent)
**Last Updated**: 2025-12-09
**Version**: 1.0
