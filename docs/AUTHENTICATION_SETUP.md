# Authentication & Security Setup Guide

## Overview

This document explains the authentication system for the SITES Spectral Stations & Instruments Management System. **This guide contains only generic examples and placeholders - never include real passwords in documentation.**

---

## 🔐 Authentication Architecture

### Three-Tier Access Control

1. **Public Access**: Read-only access to basic station information
2. **Station Access**: Full management rights for assigned station only  
3. **Admin Access**: System-wide management and configuration rights

### Security Features

- **JWT-based Authentication**: Secure token-based sessions
- **Cloudflare Secrets**: Encrypted credential storage
- **Role-based Authorization**: Granular permission controls
- **Session Management**: Automatic token refresh and expiration
- **Audit Logging**: Complete activity tracking

---

## 👤 User Account Structure

### Station User Accounts

Each SITES research station has a dedicated user account:

```yaml
# Example account structure (GENERIC - NOT REAL CREDENTIALS)
username: "example_station"
password: "EXAMPLE_PASSWORD_123"  # Real passwords are secure and generated
role: "station"
station_id: 1
permissions:
  - read: own_station_data
  - write: own_station_data  
  - create: platforms, instruments
  - update: platforms, instruments
  - delete: none
```

### Admin Account

```yaml  
# Example admin structure (GENERIC - NOT REAL CREDENTIALS)
username: "admin"
password: "ADMIN_EXAMPLE_456"  # Real passwords are secure and generated
role: "admin"
station_id: null
permissions:
  - read: all_data
  - write: all_data
  - create: all_resources
  - update: all_resources
  - delete: platforms, instruments (stations protected)
  - manage: users, system_config
```

---

## 🏢 Station Account Examples

### Available Station Accounts

The system supports accounts for these SITES research stations:

```
abisko          - Abisko Scientific Research Station
asa             - Asa Research Station  
bolmen          - Bolmen Research Station
erken           - Erken Laboratory
grimso          - Grimsö Wildlife Research Station
lonnstorp       - Lönnstorp Field Research Station
robacksdalen    - Röbäcksdalen Field Research Station
skogaryd        - Skogaryd Research Station
stordalen       - Stordalen Research Station
svartberget     - Svartberget Field Research Station
tarfala         - Tarfala Research Station
```

### Generic Login Format

```
Username: [station_name]        # e.g., "abisko", "lonnstorp"  
Password: [SECURE_GENERATED]    # Contact administrator for real credentials
```

**⚠️ IMPORTANT**: The passwords shown in this documentation are **examples only**. Real passwords are:
- Randomly generated with high entropy
- Stored securely in Cloudflare Secrets
- Never included in version control or documentation
- Only shared through secure channels

---

## 🔧 Technical Implementation

### Cloudflare Secrets Structure

Credentials are stored as encrypted secrets in Cloudflare Workers:

```javascript
// Secret naming convention (for administrator reference)
ADMIN_CREDENTIALS              // Admin account data
STATION_ABISKO_CREDENTIALS     // Abisko station account  
STATION_LONNSTORP_CREDENTIALS  // Lönnstorp station account
// ... etc for each station
```

### JWT Token Structure

```json
{
  "sub": "station_user_id",
  "username": "station_name", 
  "role": "station",
  "station_id": 1,
  "iss": "sites-spectral",
  "aud": "sites-spectral-users",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Permission Validation

```javascript
// Example permission check (from source code)
function hasPermission(user, action, resource, resourceStationId) {
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Station users can only access their own station
    if (user.role === 'station') {
        if (resourceStationId && resourceStationId !== user.station_id) {
            return false;
        }
        return ['read', 'write'].includes(action);
    }
    
    return false;
}
```

---

## 🚀 Deployment & Configuration

### Environment Variables

```bash
# Production configuration
ENVIRONMENT=production
USE_CLOUDFLARE_SECRETS=true
JWT_SECRET=[SECURE_RANDOM_STRING]  # Not in version control
```

### Secret Management Commands

```bash
# Generic examples - real commands use actual secure values
wrangler secret put ADMIN_CREDENTIALS --env production
wrangler secret put STATION_ABISKO_CREDENTIALS --env production
# ... etc for each station
```

**⚠️ SECURITY NOTE**: Real secret values are:
- Generated using cryptographically secure methods
- Never stored in plain text files
- Rotated regularly for security
- Accessible only to authorized administrators

---

## 🔍 Security Best Practices

### For Administrators

1. **Credential Generation**
   - Use cryptographically secure random password generators
   - Minimum 24 character length with mixed case, numbers, and symbols
   - Never reuse passwords across accounts or systems

2. **Secret Management** 
   - Store all credentials in Cloudflare Secrets (encrypted at rest)
   - Never include real passwords in code or documentation
   - Use environment-specific secrets for different deployment stages

3. **Access Control**
   - Implement principle of least privilege
   - Regular access reviews and credential rotation
   - Monitor authentication logs for suspicious activity

### For Station Users

1. **Password Security**
   - Keep login credentials confidential
   - Do not share accounts between staff members
   - Report suspected credential compromise immediately

2. **Session Management**
   - Log out when session completed
   - System automatically expires sessions for security
   - Clear browser data on shared computers

3. **Data Access**
   - Only access data for your assigned station
   - Respect data privacy and usage policies  
   - Report any unauthorized access attempts

---

## 🛠️ Troubleshooting Authentication

### Common Login Issues

**Invalid Credentials**:
- Verify username matches station name exactly (lowercase)
- Confirm password with system administrator
- Check account status is active

**Session Expired**:  
- Normal security behavior after inactivity
- Simply log in again with credentials
- Contact support if persistent issues

**Permission Denied**:
- Confirm you're accessing your station's data only
- Check that your account role is correctly configured
- Verify station_id assignment matches your station

### Error Messages

```
"Authentication required"     -> Need to log in
"Account disabled"           -> Contact administrator  
"Insufficient permissions"   -> Accessing wrong station data
"Account temporarily locked" -> Too many failed attempts
```

---

## 📞 Support & Administration

### For Station Managers

- **Password Issues**: Contact system administrator via secure channel
- **Account Access**: Verify your station assignment and permissions
- **Technical Support**: Use official support channels only

### For System Administrators

- **Credential Management**: Use Cloudflare Workers dashboard
- **User Administration**: Access admin panel after authentication
- **Security Monitoring**: Review authentication and activity logs
- **Secret Rotation**: Regular security maintenance procedures

---

## 📋 Security Checklist

### System Security ✅

- [x] JWT-based authentication with secure signing
- [x] Encrypted credential storage in Cloudflare Secrets  
- [x] Role-based access control implementation
- [x] Session timeout and automatic cleanup
- [x] Comprehensive audit logging
- [x] No credentials in version control or documentation

### Account Security ✅

- [x] Unique accounts for each station
- [x] Strong password generation (24+ characters)
- [x] Proper permission boundaries (station isolation)
- [x] Admin account with appropriate privileges
- [x] Regular credential rotation procedures
- [x] Secure credential distribution methods

---

*This authentication guide provides the framework for secure access to the SITES Spectral management system. All password examples are generic placeholders - real credentials are generated securely and distributed through appropriate channels.*