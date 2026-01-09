# Platform Duplicate Prevention System

> **Version**: 14.0.3
> **Last Updated**: 2026-01-09
> **Status**: Production Ready

## Overview

SITES Spectral v14.0.3 introduces a user-friendly duplicate prevention system for platform creation. When a user attempts to create a platform that conflicts with an existing one, the system presents a confirmation dialog with suggested alternatives instead of showing a generic error.

## Problem Statement

Without duplicate prevention, users could accidentally create multiple platforms with the same or similar names. For example:

- ANS_DJI_M3M_UAV01
- ANS_DJI_M3M_UAV01 (duplicate)
- ANS_DJI_M3M_UAV01 (another duplicate)

This created confusion and data integrity issues, especially for UAV platforms where auto-instrument creation is enabled.

## Solution Architecture

### Backend Detection (Already Implemented)

The backend validates platform creation requests and detects conflicts:

**Endpoint:** `POST /api/admin/platforms`

**Conflict Response (HTTP 409):**
```json
{
  "error": "Duplicate values detected",
  "conflicts": [
    {
      "field": "normalized_name",
      "value": "ANS_DJI_M3M_UAV01"
    }
  ],
  "suggestions": {
    "normalized_name": "ANS_DJI_M3M_UAV02",
    "mount_type_code": "UAV02"
  }
}
```

### Frontend Handling (v14.0.3)

The frontend now gracefully handles 409 responses with a confirmation dialog:

```
User clicks "Save Platform"
        ↓
POST /api/admin/platforms
        ↓
Server detects conflict → HTTP 409
        ↓
Frontend shows confirmation dialog
        ↓
User chooses:
  - "Cancel" → Return to form
  - "Use Suggestion" → Update and retry
```

## User Interface

### Confirmation Dialog

When a duplicate is detected, users see a modal with:

1. **Warning Icon** - Clear visual indicator
2. **Heading** - "Similar Platform Exists"
3. **Conflict Details** - Which field conflicts and its value
4. **Suggested Alternative** - System-generated unique name
5. **Action Buttons** - Cancel or Use Suggestion

### Dialog Example

```
┌─────────────────────────────────────────┐
│  ⚠️  Similar Platform Exists            │
├─────────────────────────────────────────┤
│                                         │
│  A platform with similar values         │
│  already exists:                        │
│                                         │
│  • normalized_name: ANS_DJI_M3M_UAV01   │
│                                         │
│  Suggested alternative:                 │
│  ANS_DJI_M3M_UAV02                      │
│                                         │
│  ┌──────────┐  ┌──────────────────┐     │
│  │  Cancel  │  │ Use Suggestion   │     │
│  └──────────┘  └──────────────────┘     │
└─────────────────────────────────────────┘
```

## Implementation Details

### Error Enhancement (platform-forms/index.js)

The `savePlatform()` function now captures conflict details:

```javascript
if (!response.ok) {
    const error = new Error(result.error || 'Failed to create platform');
    error.status = response.status;
    error.conflicts = result.conflicts;
    error.suggestions = result.suggestions;
    throw error;
}
```

### 409 Handling in Catch Block

```javascript
} catch (error) {
    // Handle duplicate platform conflict (HTTP 409)
    if (error.status === 409 && error.conflicts) {
        showDuplicateConfirmDialog(error.conflicts, error.suggestions, platformType);
        return;
    }
    // Generic error handling
    Toast.error(error.message || 'Failed to save platform');
}
```

### XSS-Safe Dialog Construction

The dialog is built using safe DOM methods to prevent XSS vulnerabilities:

```javascript
function showDuplicateConfirmDialog(conflicts, suggestions, platformType) {
    // Create elements using createElement (not innerHTML)
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    // Set text using textContent (auto-escapes)
    const heading = document.createElement('h3');
    heading.textContent = 'Similar Platform Exists';

    // ... build rest of dialog safely

    document.body.appendChild(overlay);
}
```

### Key Security Features

| Feature | Implementation |
|---------|----------------|
| No innerHTML | All content uses createElement/textContent |
| Safe text display | User data displayed via textContent (auto-escapes) |
| Clean removal | Dialog removed from DOM on close |
| Overlay click | Closes dialog (no action taken) |

## Supported Platform Types

The duplicate prevention system works for all platform types:

| Type | Example Conflict | Example Suggestion |
|------|------------------|-------------------|
| Fixed | SVB_FOR_TWR01 | SVB_FOR_TWR02 |
| UAV | ANS_DJI_M3M_UAV01 | ANS_DJI_M3M_UAV02 |
| Satellite | SVB_ESA_S2A_SAT01 | SVB_ESA_S2A_SAT02 |
| Mobile | LON_MOB_GND01 | LON_MOB_GND02 |

## Backend Duplicate Detection

The backend checks for duplicates using the following fields:

| Field | Check Type | Example |
|-------|------------|---------|
| `normalized_name` | Exact match | "SVB_FOR_TWR01" |
| `display_name` | Case-insensitive | "Forest Tower 1" |

### Suggestion Algorithm

When a conflict is detected, the backend generates suggestions by:

1. Extracting the numeric suffix from the mount_type_code
2. Incrementing to find the next available number
3. Rebuilding the normalized_name with new suffix

```
Existing: ANS_DJI_M3M_UAV01
          ↓
Increment: UAV01 → UAV02
          ↓
Suggested: ANS_DJI_M3M_UAV02
```

## User Workflow

### Creating a New Platform

1. User selects station and platform type
2. User fills in platform details
3. User clicks "Save Platform"
4. **If no conflict:** Platform created, success toast shown
5. **If conflict detected:** Confirmation dialog appears
   - User clicks "Cancel" → Returns to form, can modify
   - User clicks "Use Suggestion" → Form updated, save retried

### Handling Multiple Conflicts

If multiple fields conflict, all are displayed in the dialog:

```
A platform with similar values already exists:

• normalized_name: SVB_FOR_TWR01
• display_name: Forest Tower 1

Suggested alternative:
SVB_FOR_TWR02
```

## Files Modified in v14.0.3

| File | Change |
|------|--------|
| `public/js/platform-forms/index.js` | Added error enhancement, 409 handling, dialog function |
| `CHANGELOG.md` | Documented v14.0.3 changes |

## Testing

### Test Cases

1. **Create duplicate platform** - Should show dialog
2. **Click Cancel** - Should return to form without saving
3. **Click Use Suggestion** - Should update and save successfully
4. **Click overlay** - Should close dialog (same as Cancel)
5. **Multiple conflicts** - Should display all conflicting fields
6. **XSS attempt** - Malicious input in names should be escaped

### Manual Testing Steps

1. Create a UAV platform (e.g., ANS_DJI_M3M_UAV01)
2. Try to create another with same parameters
3. Verify dialog appears with suggestion (UAV02)
4. Click "Use Suggestion"
5. Verify platform created with suggested name
6. Check database for correct naming

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v14.0.3 | 2026-01-09 | Initial implementation of duplicate prevention dialog |

## Related Documentation

- [Authentication v14](./security/AUTHENTICATION_v14.md)
- [Future Platform Types](./FUTURE_PLATFORM_TYPES.md)
- [Station User Guide](./STATION_USER_GUIDE.md)
