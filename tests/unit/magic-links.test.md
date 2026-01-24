# Magic Links Handler - Unit Test Coverage

**Test File:** `tests/unit/magic-links.test.js`  
**Handler:** `src/handlers/magic-links.js`  
**Total Tests:** 55 passing  
**Test Framework:** Vitest

## Test Coverage Summary

### 1. Route Handler (6 tests)
- ✓ Routes to create endpoint for POST /create
- ✓ Routes to validate endpoint for GET /validate
- ✓ Routes to revoke endpoint for POST /revoke
- ✓ Routes to list endpoint for GET /list
- ✓ Returns 404 for unknown endpoint
- ✓ Returns 405 for wrong HTTP method

### 2. Token Generation - POST /create (13 tests)
- ✓ Creates magic link for admin user
- ✓ Creates magic link for sites-admin user
- ✓ Creates magic link for station-admin for their station
- ✓ Rejects creation by station-admin for different station
- ✓ Rejects creation by station user (non-admin)
- ✓ Rejects creation by readonly user
- ✓ Rejects creation without authentication
- ✓ Rejects creation without station_id
- ✓ Rejects invalid role
- ✓ Accepts valid roles (readonly, station-internal)
- ✓ Uses custom expiry duration
- ✓ Creates single-use magic link
- ✓ Stores hashed token in database
- ✓ Handles database errors gracefully

### 3. Token Validation - GET /validate (9 tests)
- ✓ Validates and issues session for valid token
- ✓ Rejects missing token
- ✓ Rejects non-existent token
- ✓ Rejects expired token
- ✓ Rejects revoked token
- ✓ Rejects already-used single-use token
- ✓ Allows multi-use token to be used multiple times
- ✓ Records IP and user agent on use
- ✓ Handles database errors during validation

### 4. Token Revocation - POST /revoke (10 tests)
- ✓ Allows admin to revoke any token
- ✓ Allows sites-admin to revoke tokens
- ✓ Allows station-admin to revoke their station tokens
- ✓ Rejects station-admin revoking other station tokens
- ✓ Rejects revocation by station user
- ✓ Rejects revocation without authentication
- ✓ Rejects revocation without token_id
- ✓ Handles non-existent token gracefully
- ✓ Allows revocation with optional reason
- ✓ Handles database errors during revocation

### 5. Token Listing - GET /list (11 tests)
- ✓ Allows admin to list all tokens
- ✓ Allows station-admin to list only their station tokens
- ✓ Rejects listing by station user
- ✓ Rejects listing without authentication
- ✓ Filters by station_id for admin
- ✓ Excludes revoked tokens by default
- ✓ Includes revoked tokens when requested
- ✓ Excludes expired tokens by default
- ✓ Includes expired tokens when requested
- ✓ Handles database errors during listing

### 6. Security Tests (6 tests)
- ✓ Generates unique tokens for each creation
- ✓ Uses SHA-256 for token hashing
- ✓ Never stores full token in database
- ✓ Only returns full token once at creation
- ✓ Enforces role-based access control
- ✓ Prevents token enumeration attacks

## Security Features Tested

### Token Generation
- Cryptographically secure random token generation (32 bytes = 256 bits)
- SHA-256 hashing before storage
- Original token never stored in database
- Only truncated token (first 8 chars + "...") stored for display

### Role-Based Access Control
| Role | Create | Validate | Revoke | List |
|------|--------|----------|--------|------|
| admin | ✓ All stations | ✓ | ✓ All tokens | ✓ All tokens |
| sites-admin | ✓ All stations | ✓ | ✓ All tokens | ✓ All tokens |
| station-admin | ✓ Own station only | ✓ | ✓ Own station only | ✓ Own station only |
| station | ✗ | ✓ | ✗ | ✗ |
| readonly | ✗ | ✓ | ✗ | ✗ |
| unauthenticated | ✗ | ✓ | ✗ | ✗ |

### Token Validation
- Token hash verification (SHA-256)
- Expiry checking
- Revocation status checking
- Single-use enforcement
- IP and User-Agent logging
- Security event logging for all validation attempts

### Token Lifecycle
1. **Creation** - Generate random token, hash with SHA-256, store hash
2. **Validation** - Hash provided token, compare with stored hash
3. **Usage** - Mark as used, record IP/User-Agent
4. **Revocation** - Mark as revoked with timestamp and reason
5. **Listing** - Filter by station, revoked status, expiry

## Mock Structure

### Dependencies Mocked
- `getUserFromRequest` - Authentication
- `logSecurityEvent` - Security logging
- `createAuthCookie` - Cookie generation
- Response utilities - Error responses
- Database (env.DB) - D1 database operations

### Mock Users
- `mockAdminUser` - Global admin
- `mockSitesAdmin` - Sites admin
- `mockStationAdmin` - Station-specific admin
- `mockStationUser` - Regular station user
- `mockReadonlyUser` - Read-only user

## Test Patterns

### Request Mocking
```javascript
createMockRequest({
  method: 'POST',
  url: 'https://sites.jobelab.com/api/v11/magic-links/create',
  body: { station_id: 1, label: 'Test' },
  headers: { 'CF-Connecting-IP': '192.168.1.1' }
})
```

### Environment Mocking
```javascript
createMockEnv() // Returns mock DB with prepare/bind/run/first/all chain
```

### Assertion Examples
```javascript
// Status code
expect(response.status).toBe(201);

// Response body
const body = await response.json();
expect(body.success).toBe(true);

// Security logging
expect(logSecurityEvent).toHaveBeenCalledWith(
  'MAGIC_LINK_CREATED',
  expect.objectContaining({ station_id: 1 }),
  expect.anything(),
  expect.anything()
);

// Database operations
expect(env.DB.prepare).toHaveBeenCalledWith(
  expect.stringContaining('INSERT INTO magic_link_tokens')
);
```

## Running Tests

```bash
# Run all magic links tests
npm test -- tests/unit/magic-links.test.js

# Run with coverage
npm test -- tests/unit/magic-links.test.js --coverage

# Run specific test
npm test -- tests/unit/magic-links.test.js -t "should create magic link for admin"
```

## Test Maintenance

When updating the magic links handler:
1. Add tests for new endpoints
2. Update security tests for new validation rules
3. Add tests for new role permissions
4. Update error response assertions if error messages change
5. Add tests for new database fields
