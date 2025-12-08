# Station User Authentication Fixes

## Overview

Fixed critical authentication issue where station users were unable to create instruments due to a station_id data type mismatch between JWT tokens and database lookups.

**Status**: ✅ **RESOLVED** - Deployed in version 5.2.26 (2025-09-29)

---

## The Problem

Station users encountered "Platform not found" errors when attempting to create instruments, even though they had the correct permissions. This was due to a data type mismatch:

- **JWT Token**: `station_id: "SVB"` (string acronym)
- **Database**: `platform.station_id: 7` (integer foreign key)
- **Result**: Platform lookup failed because `"SVB" !== 7`

## The Solution

### 1. Fixed JWT Token Generation

**File**: `/src/auth/authentication.js`

**Before**:
```javascript
station_id: stationCreds.station_id, // Used string from credentials
```

**After**:
```javascript
station_id: stationData?.id || null, // Use integer ID from database
```

**Impact**: JWT tokens now contain the correct integer station_id that matches database foreign key references.

### 2. Enhanced Platform Access Validation

**File**: `/src/handlers/instruments.js`

**Before**:
```javascript
if (user.station_normalized_name !== platform.station_normalized_name) {
  return createForbiddenResponse();
}
```

**After**:
```javascript
const userCanAccessPlatform =
  user.station_id === platform.station_id ||
  user.station_normalized_name === platform.station_normalized_name;

if (!userCanAccessPlatform) {
  return createForbiddenResponse();
}
```

**Impact**: Platform access now validates using both integer IDs (primary) and normalized names (fallback).

### 3. Improved Permission Filtering

**File**: `/src/auth/permissions.js`

Enhanced `validateStationAccess()` and `filterDataByPermissions()` to handle multiple ID formats:

```javascript
// Now checks multiple formats
return user.station_id === stationId ||
       user.station_id === parseInt(stationId, 10) ||
       user.station_acronym === stationId ||
       user.station_normalized_name === stationId;
```

---

## Verification Results

### Test Results (Simulated)

| Scenario | Old System | New System |
|----------|------------|------------|
| JWT station_id | `"SVB"` (string) | `7` (integer) |
| Platform station_id | `7` (integer) | `7` (integer) |
| **Match Result** | ❌ `false` | ✅ `true` |

### Deployment Status

- **Version**: 5.2.26
- **Deployed**: 2025-09-29
- **Status**: ✅ Live and operational
- **URL**: https://sites.jobelab.com

---

## Usage Examples

### Creating Instrument SVB_MIR_PL02_PHE02

Station users (like SVB station user) can now successfully create instruments:

```javascript
// API Request that now works
POST /api/instruments
Authorization: Bearer <station_user_token>

{
  "display_name": "SVB DEGERÖ MIR Platform 02 Phenocam 02",
  "platform_id": 18,        // SVB_MIR_PL02 platform
  "instrument_type": "Phenocam",
  "status": "Testing"
}

// Expected Response:
{
  "success": true,
  "message": "Instrument created successfully",
  "id": 123,
  "normalized_name": "SVB_MIR_PL02_PHE_02",
  "instrument_number": "01"
}
```

### Permission Matrix

Station users now have proper access to:

| Resource | Actions | Scope |
|----------|---------|-------|
| Stations | Read | Own station only |
| Platforms | Read, Write | Own station's platforms only |
| Instruments | Read, Write | Own station's instruments only |
| ROIs | Read, Write | Own station's ROIs only |

---

## Technical Details

### Database Schema Reference

```sql
-- Stations table
stations: {
  id: INTEGER PRIMARY KEY,     -- Used in JWT tokens now
  acronym: TEXT,              -- "SVB", "ASA", etc.
  normalized_name: TEXT       -- "svartberget", "asa", etc.
}

-- Platforms table
platforms: {
  id: INTEGER PRIMARY KEY,
  station_id: INTEGER,        -- Foreign key to stations.id
  normalized_name: TEXT       -- "SVB_MIR_PL02", etc.
}
```

### JWT Token Structure

Station user tokens now contain:

```json
{
  "username": "svartberget_user",
  "role": "station",
  "station_id": 7,                        // Integer ID (FIXED)
  "station_acronym": "SVB",               // String acronym
  "station_normalized_name": "svartberget", // Normalized name
  "issued_at": 1727627394000,
  "expires_at": 1727713794000
}
```

---

## Files Modified

1. **`/src/auth/authentication.js`**
   - Fixed `authenticateUser()` to use database integer ID
   - Updated JWT token generation

2. **`/src/handlers/instruments.js`**
   - Enhanced platform access validation in `createInstrument()`
   - Added robust permission checking

3. **`/src/auth/permissions.js`**
   - Improved `validateStationAccess()` for multiple ID formats
   - Enhanced `filterDataByPermissions()` robustness

---

## Future Considerations

1. **Backward Compatibility**: The fixes maintain compatibility with existing tokens during the transition period.

2. **Error Logging**: Added detailed logging to help diagnose permission issues in development.

3. **Security**: All fixes maintain the principle of least privilege - station users can only access their own station's resources.

4. **Performance**: Integer comparisons are more efficient than string comparisons, improving overall performance.

---

## Testing

To verify the fix is working:

1. **Login** as a station user (e.g., SVB station user)
2. **Navigate** to your station's page
3. **Create Instrument** on one of your station's platforms
4. **Verify** the instrument is created successfully

**Expected Result**: Instrument creation should now succeed without "Platform not found" errors.