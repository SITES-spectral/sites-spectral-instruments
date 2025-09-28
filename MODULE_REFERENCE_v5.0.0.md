# SITES Spectral v5.0.0 - Module Reference Guide

## 🗂️ Module Directory Structure

### Core Router
- **`src/api-handler.js`** (109 lines) - Main API request router with health checks

### Authentication & Security
- **`src/auth/authentication.js`** (241 lines) - JWT authentication, user verification, credentials loading
- **`src/auth/permissions.js`** (179 lines) - Role-based access control, permission validation, middleware

### Regular Operation Handlers
- **`src/handlers/stations.js`** (98 lines) - GET operations for stations (non-admin)
- **`src/handlers/platforms.js`** (189 lines) - GET/PUT operations for platforms (station users)
- **`src/handlers/instruments.js`** (218 lines) - GET/PUT operations for instruments (station users)
- **`src/handlers/rois.js`** (415 lines) - Full CRUD for ROIs (station users can create/edit/delete)
- **`src/handlers/export.js`** (243 lines) - Data export functionality with hierarchical JSON format

### Admin-Only Operations
- **`src/admin/admin-router.js`** (85 lines) - Admin security middleware and routing
- **`src/admin/admin-stations.js`** (258 lines) - Admin-only station CREATE/UPDATE/DELETE
- **`src/admin/admin-platforms.js`** (270 lines) - Admin-only platform CREATE/DELETE
- **`src/admin/admin-instruments.js`** (283 lines) - Admin-only instrument CREATE/DELETE

### Utility Modules
- **`src/utils/responses.js`** (102 lines) - Centralized HTTP response creation
- **`src/utils/logging.js`** (88 lines) - API request logging, admin action logging, security events
- **`src/utils/rate-limiting.js`** (37 lines) - Rate limiting for admin operations
- **`src/utils/database.js`** (274 lines) - Database query helpers and station resolution
- **`src/utils/validation.js`** (294 lines) - Input validation, Swedish compliance, ecosystem codes
- **`src/utils/backup.js`** (213 lines) - Comprehensive backup generation for deletions

## 🔑 Key Exports by Module

### Authentication (`auth/authentication.js`)
```javascript
export { handleAuth, authenticateUser, generateToken, getUserFromRequest }
```

### Permissions (`auth/permissions.js`)
```javascript
export {
  validateAdminPermission,
  validateStationAccess,
  checkUserPermissions,
  requireAuthentication,
  requireAdminPermission,
  requireStationAccess,
  filterDataByPermissions
}
```

### Database (`utils/database.js`)
```javascript
export {
  executeQuery, executeQueryFirst, executeQueryRun,
  getStationData, getStationByNormalizedName, getStationsData,
  getPlatformsByStationId, getInstrumentsByPlatformId, getROIsByInstrumentId,
  stationExists, platformExists, instrumentExists,
  resolveStationIdentifier
}
```

### Validation (`utils/validation.js`)
```javascript
export {
  validateStationData, validateStationUpdateData, validatePlatformData,
  validateInstrumentData, validateROIData, validateSwedishCoordinates,
  generateNormalizedName, generateAlternativeNormalizedName, generateAlternativeAcronym,
  checkPlatformConflicts, generatePlatformAlternatives, getValidEcosystemCodes
}
```

### Responses (`utils/responses.js`)
```javascript
export {
  createSuccessResponse, createErrorResponse, createValidationErrorResponse,
  createMethodNotAllowedResponse, createUnauthorizedResponse, createForbiddenResponse,
  createNotFoundResponse, createInternalServerErrorResponse, createRateLimitResponse
}
```

## 🔄 Data Flow Architecture

### Regular Operations Flow
```
Request → api-handler.js → handlers/{resource}.js → utils/database.js → Response
          ↓
       auth/authentication.js (for auth)
          ↓
       auth/permissions.js (for access control)
```

### Admin Operations Flow
```
Request → api-handler.js → admin/admin-router.js → admin/admin-{resource}.js → Response
                              ↓                          ↓
                        Security Middleware        utils/backup.js (for deletions)
                              ↓                          ↓
                        Rate Limiting              utils/logging.js (for audit)
```

## 🛡️ Security Architecture

### Authentication Layers
1. **JWT Token Validation** (`auth/authentication.js`)
2. **Role-Based Permissions** (`auth/permissions.js`)
3. **Admin Security Middleware** (`admin/admin-router.js`)
4. **Rate Limiting** (`utils/rate-limiting.js`)

### Permission Matrix
| Role     | Stations | Platforms | Instruments | ROIs | Admin |
|----------|----------|-----------|-------------|------|-------|
| admin    | Full     | Full      | Full        | Full | Full  |
| station  | Read     | Read/Edit | Read/Edit   | Full | None  |
| readonly | Read     | Read      | Read        | Read | None  |

## 🎯 Module Interaction Rules

### Import Guidelines
1. **Utils modules** can import other utils modules
2. **Handler modules** can import auth and utils modules
3. **Admin modules** can import auth and utils modules
4. **Auth modules** can import utils modules
5. **Main router** imports from all categories

### Circular Dependency Prevention
- Utils modules are foundational (no business logic imports)
- Handler modules don't import from other handlers
- Admin modules don't import from regular handlers
- Authentication is independent of business logic

## 📝 Development Guidelines

### Adding New Features
1. **New endpoint**: Add to appropriate handler module
2. **New validation**: Extend `utils/validation.js`
3. **New permission**: Extend `auth/permissions.js`
4. **New admin operation**: Add to `admin/` directory
5. **New utility**: Add to `utils/` directory

### Testing Strategy
1. **Unit test each module** independently
2. **Mock dependencies** using module interfaces
3. **Integration test** API endpoints
4. **Security test** authentication and permissions

### Code Standards
1. **JSDoc comments** for all exported functions
2. **Error handling** using utils/responses.js
3. **Logging** for all admin operations
4. **Validation** for all user inputs
5. **Swedish compliance** for research station data

## 🚀 Future Enhancement Areas

### Easy Additions
1. **Caching Layer**: Add `utils/cache.js`
2. **Email Notifications**: Add `utils/notifications.js`
3. **File Upload**: Add `handlers/upload.js`
4. **Background Jobs**: Add `jobs/` directory
5. **API Versioning**: Add `v2/` directory structure

### Architecture Improvements
1. **TypeScript Migration**: Gradual module-by-module
2. **Database Migrations**: Add `migrations/` module
3. **Testing Framework**: Add `tests/` directory
4. **Documentation**: Auto-generate from JSDoc
5. **Performance Monitoring**: Add `utils/metrics.js`

This modular architecture provides a **solid foundation** for sustainable development and team collaboration! 🎉