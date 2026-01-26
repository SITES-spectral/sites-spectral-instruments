# SITES Spectral Admin User Guide

> **Version**: 15.6.0
> **Portal**: https://admin.sitesspectral.work
> **Last Updated**: 2026-01-26

---

## Overview

This guide is for users with `admin` or `sites-admin` roles who manage the entire SITES Spectral system, including stations, users, and system-wide settings.

---

## Accessing the Admin Portal

### Login

1. Navigate to https://admin.sitesspectral.work
2. Cloudflare Access will prompt for authentication
3. Enter your authorized email address
4. Check email for one-time password (OTP)
5. Enter OTP to access admin dashboard

### Dashboard Overview

The admin dashboard displays:

- **Station Grid**: All 9 SITES stations with status
- **System Stats**: Total stations, platforms, instruments
- **Recent Activity**: Latest changes across the system
- **Users Tab**: User management interface

---

## Station Management

### Viewing Stations

The station grid shows cards for each station:

| Field | Description |
|-------|-------------|
| Acronym | Station code (e.g., SVB) |
| Display Name | Full station name |
| Platform Count | Number of platforms |
| Instrument Count | Number of instruments |
| Status | Active, Inactive, Maintenance |
| Location | Coordinates |

### Creating a Station

1. Click **"+ Add Station"** button
2. Fill in the form:
   - **Display Name**: Official station name
   - **Acronym**: 2-5 uppercase letters (unique)
   - **Normalized Name**: Auto-generated from display name
   - **Country**: Default Sweden
   - **Coordinates**: Latitude/Longitude (optional)
   - **Elevation**: Meters above sea level
   - **Description**: Brief description
3. Click **"Create Station"**

### Editing a Station

1. Click the **edit** button (pencil icon) on station card
2. Modify fields as needed
3. Click **"Save Changes"**

### Deleting a Station

1. Click the **delete** button (trash icon) on station card
2. Confirm deletion in the dialog
3. **Warning**: This deletes all associated platforms and instruments

---

## User Management

### Users Tab

Click the **"Users"** tab to access user management.

### User Roles

| Role | Access Level |
|------|--------------|
| `admin` | Full system access |
| `sites-admin` | Full system access |
| `station-admin` | Admin for assigned station |
| `station` | Read-only for assigned station |
| `uav-pilot` | UAV operations access |
| `station-internal` | Magic link access |
| `readonly` | Read-only system-wide |

### Creating a User

1. Click **"+ Add User"**
2. Fill in the form:
   - **Username**: Unique identifier
   - **Email**: User's email address
   - **Full Name**: Display name
   - **Role**: Select from dropdown
   - **Station**: Required for station-specific roles
   - **Password**: Initial password
3. Click **"Create User"**

### Editing a User

1. Click **edit** on user card
2. Modify role, station assignment, or status
3. Click **"Save"**

### Resetting Passwords

1. Click **edit** on user card
2. Enter new password
3. Click **"Save"**

User must change password on next login.

### Deactivating a User

1. Click **edit** on user card
2. Toggle **"Active"** to off
3. Click **"Save"**

Deactivated users cannot log in.

---

## Activity Logs

### Viewing Logs

1. Click **"Settings"** tab
2. Select **"Activity Log"**
3. View chronological list of all system changes

### Log Entry Fields

| Field | Description |
|-------|-------------|
| Timestamp | When action occurred |
| User | Who performed action |
| Action | Type of action (create, update, delete) |
| Entity | What was modified |
| Details | Specific changes |

### Filtering Logs

- **By User**: Select user from dropdown
- **By Action**: Filter by create/update/delete
- **By Date**: Set date range
- **By Entity**: Filter by stations/platforms/instruments

---

## System Settings

### Health Dashboard

View system health status:

- **Database Status**: Connection health
- **API Version**: Current version
- **Last Deploy**: Deployment timestamp
- **Error Rate**: Recent error statistics

### Maintenance Mode

To enable maintenance mode:

1. Go to Settings → System
2. Toggle **"Maintenance Mode"**
3. Set maintenance message
4. Click **"Enable"**

Users will see maintenance message instead of normal UI.

---

## Platform Management

### Creating Platforms (Any Station)

Admins can create platforms at any station:

1. Navigate to station dashboard
2. Click **"+ Add Platform"**
3. Select platform type:
   - **Fixed**: Towers, buildings, ground installations
   - **UAV**: Drones with auto-instrument creation
   - **Satellite**: Earth observation platforms
4. Fill in required fields
5. Click **"Create"**

### UAV Platform Auto-Creation

When creating UAV platforms, instruments are automatically added:

| Vendor | Model | Auto-Created Instruments |
|--------|-------|-------------------------|
| DJI | M3M | MS01, RGB01 |
| DJI | M30T | RGB01, TIR01 |
| MicaSense | RedEdge-MX | MS01 |

---

## Instrument Management

### Type-Specific Modals

Each instrument type has a dedicated editing modal:

| Type | Key Fields |
|------|------------|
| Phenocam | Camera brand/model, resolution, interval |
| Multispectral | Number of channels, spectral range |
| PAR | Spectral range, calibration coefficient |
| NDVI | Red/NIR wavelengths |
| PRI | Band wavelengths (531nm, 570nm) |
| Hyperspectral | Spectral resolution, range |

### Bulk Operations

Admins can perform bulk operations:

1. Select multiple instruments (checkboxes)
2. Choose bulk action:
   - **Update Status**: Change to Active/Inactive
   - **Export**: Download as CSV/JSON
   - **Delete**: Remove selected (with confirmation)

---

## ROI Management

### Legacy ROI Override

Admins can override the legacy ROI system:

1. Edit existing ROI
2. Confirm admin override in warning dialog
3. Type **"CONFIRM"** to proceed
4. ROI is modified directly (timeseries_broken flag set)

**Warning**: This breaks time series continuity. Use sparingly.

---

## UAV Administration

### Pilot Approval

Review and approve pilot registrations:

1. Go to UAV section
2. Click **"Pending Pilots"**
3. Review certification documents
4. Click **"Approve"** or **"Reject"**

### Mission Approval

Approve mission plans:

1. Go to UAV → Missions
2. Filter by **"Planned"** status
3. Review mission details
4. Click **"Approve"** to authorize

### Incident Review

Review reported flight incidents:

1. Go to UAV → Flights
2. Filter by **"Has Incident"**
3. Review incident details
4. Add admin notes if needed

---

## Data Export

### Station Export

Export all data for a station:

1. Go to station dashboard
2. Click **"Export"** button
3. Select format (CSV, JSON, TSV)
4. Select data types to include
5. Click **"Download"**

### System-Wide Export

Export entire system data:

1. Go to Admin → Export
2. Select entities to export
3. Click **"Generate Export"**
4. Download when ready

---

## Troubleshooting

### User Can't Login

1. Check user status (Active/Inactive)
2. Verify correct portal URL
3. Reset password if needed
4. Check Cloudflare Access configuration

### Station Not Appearing

1. Verify station was created successfully
2. Check station status
3. Clear browser cache
4. Check activity logs for errors

### Database Issues

1. Check health endpoint: `/api/v11/health`
2. Review error logs in Cloudflare dashboard
3. Contact technical support if persists

---

## Best Practices

### Security

- Regularly review user access levels
- Deactivate users who no longer need access
- Monitor activity logs for unusual patterns
- Use strong passwords for all accounts

### Data Management

- Regular database backups
- Review and clean up test data
- Maintain consistent naming conventions
- Document any custom configurations

### User Management

- Use appropriate roles (least privilege)
- Assign station-specific roles when possible
- Regular access reviews
- Document role assignments

---

## Related Documentation

- [[USER_GUIDE_STATION_ADMIN]] - Station admin guide
- [[USER_GUIDE_UAV_PILOT]] - UAV pilot guide
- [[API_REFERENCE]] - API documentation
- [[SYSTEM_ARCHITECTURE]] - Technical architecture
