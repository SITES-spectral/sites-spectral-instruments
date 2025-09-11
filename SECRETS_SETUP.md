# Cloudflare Secrets Setup for Station Authentication

This document explains how to set up and manage Cloudflare secrets for station-based user authentication in the SITES Spectral application.

## Overview

The system uses Cloudflare Workers secrets to store station-specific user credentials, providing:

- **Enhanced Security**: Credentials stored in Cloudflare's secure secret management system
- **Station-Based Authentication**: Each station gets a dedicated user account using the station name as username
- **Centralized Management**: Easy credential rotation and management through Cloudflare
- **Backward Compatibility**: Existing database users continue to work alongside secrets-based users

## Station Accounts

Each SITES station has a dedicated user account:

| Station | Username | Role | Station ID |
|---------|----------|------|------------|
| Abisko | `abisko` | station | 1 |
| Asa | `asa` | station | 2 |
| Bolmen | `bolmen` | station | 3 |
| Erken | `erken` | station | 4 |
| Grimsö | `grimso` | station | 5 |
| Lönnstorp | `lonnstorp` | station | 6 |
| Röbäcksdalen | `robacksdalen` | station | 7 |
| Skogaryd | `skogaryd` | station | 8 |
| Stordalen | `stordalen` | station | 9 |
| Svartberget | `svartberget` | station | 10 |
| Tarfala | `tarfala` | station | 11 |

Plus an admin account: `admin` with role `admin`.

## Setup Instructions

### Prerequisites

1. Install and configure the Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler auth login
   ```

2. Navigate to the project directory:
   ```bash
   cd /path/to/spectral-stations-instruments
   ```

### 1. Generate Secrets

Run the setup script to generate all station credentials and secrets:

```bash
node scripts/setup-station-secrets.js
```

This will:
- Generate secure random passwords for all stations and admin
- Create Cloudflare secrets for each account
- Generate a secure JWT secret key
- Create a credentials file for secure distribution

### 2. Verify Secrets

Check that secrets were created successfully:

```bash
wrangler secret list
```

You should see secrets like:
- `JWT_SECRET`
- `ADMIN_CREDENTIALS`
- `STATION_ABISKO_CREDENTIALS`
- `STATION_ASA_CREDENTIALS`
- etc.

### 3. Deploy Updated Worker

Deploy the worker with the new authentication system:

```bash
wrangler deploy
```

### 4. Distribute Credentials

The setup script creates a `station-credentials-SECURE.json` file containing all passwords. 

**⚠️ Security Important:**
1. Store this file securely
2. Distribute passwords to station managers through secure channels
3. Delete the file after credential distribution
4. Consider using password managers for long-term storage

## Using Station Authentication

### For Station Managers

Station managers can log in using their station username and generated password:

- **Username**: Station name (e.g., `abisko`, `lonnstorp`)
- **Password**: Provided by system administrator
- **Access**: Full read/write access to their station's instruments and platforms

### For Administrators

Admin users have full system access:

- **Username**: `admin`
- **Password**: Generated admin password
- **Access**: Full system administration capabilities

## Managing Secrets

### View Secrets

```bash
# List all secrets
wrangler secret list

# View a specific secret (will prompt for value)
wrangler secret get JWT_SECRET
```

### Update Secrets

To rotate passwords or update credentials:

```bash
# Update a station password
wrangler secret put STATION_ABISKO_CREDENTIALS --text '{"username":"abisko","role":"station","station_id":1,"active":true,"password":"new_password_here"}'

# Update JWT secret
wrangler secret put JWT_SECRET --text "new_jwt_secret_key_here"
```

### Delete Secrets

```bash
# Remove a secret
wrangler secret delete STATION_ABISKO_CREDENTIALS
```

## Authentication Flow

1. **User Login**: Station manager enters username/password
2. **Secrets Check**: System first checks Cloudflare secrets for matching username
3. **Database Fallback**: If not found in secrets, falls back to database authentication
4. **Token Generation**: On success, generates JWT token using secrets-based JWT key
5. **Access Control**: Token includes station_id for proper access control

## Security Features

### Password Security
- 24-character randomly generated passwords
- Character set includes uppercase, lowercase, numbers, and symbols
- Passwords hashed using SHA-256 with salt

### JWT Security
- 64-byte randomly generated secret key stored in Cloudflare
- 24-hour token expiration
- Includes station_id and role in payload

### Access Control
- Station users can only access their own station's data
- Admin users have full system access
- Read-only users (if configured) have read-only access

## Troubleshooting

### Authentication Issues

1. **"Invalid credentials" error**:
   - Verify username is correct (must match station name exactly)
   - Check password was entered correctly
   - Ensure secrets were deployed properly

2. **"Account disabled" error**:
   - Check if `active` field in secret is set to `false`
   - Verify secret format is correct JSON

3. **Token verification failures**:
   - Ensure JWT_SECRET is properly set
   - Check token hasn't expired (24-hour limit)

### Secret Management Issues

1. **Secret not found**:
   ```bash
   # Re-run setup for missing secrets
   node scripts/setup-station-secrets.js
   ```

2. **Deployment issues**:
   ```bash
   # Check wrangler configuration
   wrangler whoami
   wrangler deploy --dry-run
   ```

### Logs and Debugging

Check worker logs for authentication issues:

```bash
wrangler tail
```

Look for log entries with `auth_method: 'secrets'` for secrets-based authentication.

## Migration from Database Authentication

The system supports both authentication methods simultaneously:

1. **Existing users**: Continue using database authentication
2. **New station users**: Use secrets-based authentication
3. **Migration path**: Gradually move users to secrets-based system

To migrate a database user to secrets:

1. Create secret for the user
2. Test login with new credentials
3. Optionally disable database user account

## Backup and Recovery

### Backup Secrets

Secrets are automatically backed up in Cloudflare's infrastructure, but you can export them:

```bash
# Export all secrets (requires manual script)
node scripts/export-secrets.js
```

### Recovery

If secrets are lost:

1. Re-run the setup script: `node scripts/setup-station-secrets.js`
2. Redistribute new passwords to station managers
3. Consider implementing automatic notification system

## Best Practices

1. **Regular Rotation**: Rotate passwords quarterly or after staff changes
2. **Secure Distribution**: Use secure channels for password distribution
3. **Monitoring**: Monitor authentication logs for suspicious activity
4. **Documentation**: Keep this documentation updated with any changes
5. **Testing**: Test authentication after any secret updates

## Environment Variables

The system uses these Cloudflare environment variables:

- `USE_CLOUDFLARE_SECRETS`: Set to "true" to enable secrets-based auth
- `ENVIRONMENT`: Set to "production" for production deployment
- `JWT_SECRET`: Stored as Cloudflare secret, not environment variable

## Support

For issues with the secrets system:

1. Check wrangler logs: `wrangler tail`
2. Verify secret configuration: `wrangler secret list`
3. Test authentication endpoints manually
4. Review this documentation for troubleshooting steps

## Security Notes

- Never commit passwords or JWT secrets to version control
- Use strong passwords and regular rotation
- Monitor access logs for unusual activity
- Keep the credentials file secure and delete after distribution
- Consider implementing multi-factor authentication for enhanced security