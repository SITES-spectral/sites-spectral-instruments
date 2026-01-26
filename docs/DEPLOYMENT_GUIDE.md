# SITES Spectral Deployment Guide

> **Version**: 15.6.0
> **Platform**: Cloudflare Workers + D1
> **Last Updated**: 2026-01-26

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| npm | 9+ | Package manager |
| Wrangler | 4+ | Cloudflare CLI |

### Cloudflare Account Setup

1. Create Cloudflare account at https://dash.cloudflare.com
2. Enable Workers & Pages
3. Create D1 database
4. Configure Cloudflare Access (for admin portals)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/sites-spectral-instruments.git
cd sites-spectral-instruments
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Wrangler

Create/update `wrangler.toml`:

```toml
name = "sites-spectral-instruments"
main = "src/worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
API_VERSION = "v11"

[[d1_databases]]
binding = "DB"
database_name = "spectral_stations_db"
database_id = "your-database-id-here"

[site]
bucket = "./public"
```

### 4. Create D1 Database

```bash
# Create database
npx wrangler d1 create spectral_stations_db

# Note the database_id and update wrangler.toml
```

### 5. Run Migrations

```bash
# Apply all migrations to production
npm run db:migrate

# Or for local development
npm run db:migrate:local
```

---

## Development Workflow

### Local Development

```bash
# Start local development server
npm run dev

# Server runs at http://localhost:8787
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/domain/uav/pilot.test.js

# Run in watch mode
npm run test:watch
```

### Build

```bash
# Build without version bump
npm run build

# Build with version bump (patch)
npm run build:bump
```

---

## Deployment

### Standard Deployment

```bash
# Build and deploy
npm run deploy
```

This runs:
1. `npm run build:frontend` - Build Vite frontend
2. `npm run build` - Build worker bundle
3. `wrangler deploy` - Deploy to Cloudflare

### Deployment with Version Bump

```bash
# Bump version, build, and deploy
npm run deploy:bump
```

### Manual Deployment Steps

```bash
# 1. Build frontend
npm run build:frontend

# 2. Build worker
npm run build

# 3. Deploy
npx wrangler deploy
```

### Verify Deployment

```bash
# Check health endpoint
curl https://sitesspectral.work/api/v11/health

# Expected response:
{
  "status": "healthy",
  "version": "15.6.0",
  "database": "connected"
}
```

---

## Environment Configuration

### Production Variables

Set via Cloudflare dashboard or wrangler:

```bash
# Set secret
npx wrangler secret put JWT_SECRET

# Set variable
npx wrangler var put ENVIRONMENT production
```

### Required Secrets

| Secret | Description |
|--------|-------------|
| `JWT_SECRET` | JWT signing key (min 32 chars) |
| `MAGIC_LINK_SECRET` | Magic link token signing key |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `production` | Environment name |
| `API_VERSION` | `v11` | API version |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

---

## Database Management

### Apply Migrations

```bash
# Production
npm run db:migrate

# Local
npm run db:migrate:local
```

### Database Console

```bash
# Open D1 console
npm run db:studio

# Execute query
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT * FROM stations;"
```

### Backup Database

```bash
# Export database
npx wrangler d1 export spectral_stations_db --remote --output=backup.sql
```

### Restore Database

```bash
# Import from backup
npx wrangler d1 execute spectral_stations_db --remote --file=backup.sql
```

---

## Domain Configuration

### Subdomain Setup

Configure in Cloudflare dashboard:

| Subdomain | Route | Description |
|-----------|-------|-------------|
| `sitesspectral.work` | `/*` | Public portal |
| `admin.sitesspectral.work` | `/*` | Admin portal (CF Access) |
| `svb.sitesspectral.work` | `/*` | Svartberget station |
| `ans.sitesspectral.work` | `/*` | Abisko station |
| ... | ... | Other stations |

### Cloudflare Access Configuration

For admin portal:

1. Go to Cloudflare Zero Trust
2. Create Access Application for `admin.sitesspectral.work`
3. Configure authentication method (OTP email)
4. Set policy: Allow authorized email domains

---

## Monitoring

### Health Check

```bash
# Basic health
curl https://sitesspectral.work/api/v11/health

# Full info
curl https://sitesspectral.work/api/v11/info
```

### Logs

View logs in Cloudflare dashboard:
1. Workers & Pages → sites-spectral-instruments
2. Logs tab
3. Real-time logs stream

### Metrics

Metrics available via Cloudflare Analytics:
- Request count
- Error rate
- Response time percentiles
- Geographic distribution

---

## Rollback Procedure

### Quick Rollback

```bash
# List recent deployments
npx wrangler deployments list

# Rollback to previous
npx wrangler rollback
```

### Manual Rollback

```bash
# Checkout previous version
git checkout v15.5.0

# Deploy
npm run deploy
```

### Database Rollback

If migration caused issues:

```bash
# Restore from backup
npx wrangler d1 execute spectral_stations_db --remote --file=backup-pre-migration.sql
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - run: npm test

      - run: npm run build

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: deploy
```

### Required Secrets

| Secret | Description |
|--------|-------------|
| `CF_API_TOKEN` | Cloudflare API token with Workers edit permission |

---

## Troubleshooting

### Common Issues

#### Deployment Fails

```bash
# Check wrangler config
npx wrangler whoami

# Verify database binding
npx wrangler d1 list
```

#### Database Connection Issues

```bash
# Test database
npx wrangler d1 execute spectral_stations_db --remote --command="SELECT 1;"
```

#### CORS Errors

Check `wrangler.toml` CORS_ORIGINS variable and ensure your domain is included.

#### Authentication Issues

1. Verify JWT_SECRET is set
2. Check Cloudflare Access configuration
3. Verify cookie domain settings

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
npx wrangler var put DEBUG true

# Check logs
npx wrangler tail
```

---

## Security Checklist

Before production deployment:

- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] MAGIC_LINK_SECRET is set
- [ ] Cloudflare Access configured for admin portal
- [ ] CORS origins restricted to known domains
- [ ] Rate limiting enabled
- [ ] Database backups scheduled
- [ ] Error monitoring configured
- [ ] SSL/TLS enforced (Cloudflare default)

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 15.6.0 | 2026-01-26 | Comprehensive documentation |
| 15.5.0 | 2026-01-26 | UAV tests, metrics |
| 15.4.0 | 2026-01-26 | Security hardening |
| 15.0.0 | 2026-01-24 | Subdomain architecture |

---

## Related Documentation

- [[SYSTEM_ARCHITECTURE]] - System architecture
- [[API_REFERENCE]] - API documentation
- [[DATABASE_SCHEMA]] - Database schema
- [[USER_GUIDE_ADMIN]] - Admin user guide
