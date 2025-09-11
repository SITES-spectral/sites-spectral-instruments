# Cloudflare Workers GitHub Integration Setup

This document explains how to set up automatic deployment from GitHub to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with Workers enabled
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Cloudflare API Token**: Generate an API token with Workers permissions

## Setup Steps

### 1. Generate Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Worker:Edit" template or create a custom token with these permissions:
   - Zone: Zone Settings:Read, Zone:Read
   - Account: Cloudflare Workers:Edit
   - Include: All accounts

### 2. Get Your Account ID

1. Go to your Cloudflare dashboard
2. Select your account
3. Copy the Account ID from the right sidebar

### 3. Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, then add:

- `CLOUDFLARE_API_TOKEN`: Your API token from step 1
- `CLOUDFLARE_ACCOUNT_ID`: Your account ID from step 2

### 4. Verify Deployment

1. Push changes to the `main` branch
2. Go to Actions tab in GitHub to see the deployment status
3. Check your Cloudflare Workers dashboard to confirm the deployment

## Configuration Files

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests (if any)
        run: npm test --if-present

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
        env:
          NODE_VERSION: 18
```

### Wrangler Configuration (`wrangler.toml`)

The `wrangler.toml` file contains your Worker configuration:

```toml
name = "spectral-stations-instruments"
main = "src/worker.js"
compatibility_date = "2024-01-15"
compatibility_flags = ["nodejs_compat"]
workers_dev = true
preview_urls = true

# GitHub integration
# Enable auto-deployment from GitHub when commits are pushed to main branch

# Static Assets Configuration
[assets]
directory = "public"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "spectral_stations_db"
database_id = "your-database-id"

[vars]
ENVIRONMENT = "production"
APP_NAME = "SITES Spectral Stations & Instruments"
APP_VERSION = "0.3.0"
USE_CLOUDFLARE_SECRETS = "true"

# Custom domain routes  
[[routes]]
pattern = "your-domain.com"
zone_name = "your-domain.com"

[[routes]]
pattern = "your-domain.com/*"
zone_name = "your-domain.com"
```

## Manual Deployment

If you need to deploy manually:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy
```

## Troubleshooting

### Common Issues

1. **API Token Permissions**: Ensure your API token has the correct permissions
2. **Account ID**: Double-check your account ID is correct
3. **Zone ID**: For custom domains, ensure your zone is properly configured
4. **Database ID**: Make sure your D1 database ID is correct in `wrangler.toml`

### Debugging

- Check GitHub Actions logs for deployment errors
- Use `wrangler tail` to see real-time logs from your Worker
- Check Cloudflare dashboard for deployment status and errors

## Security Best Practices

1. **Never commit secrets**: Always use GitHub Secrets for sensitive data
2. **Restrict API tokens**: Use minimal permissions for API tokens
3. **Regular rotation**: Rotate API tokens periodically
4. **Monitor usage**: Keep an eye on your Cloudflare usage and billing

## Features Enabled

With this setup, you get:

- ✅ Automatic deployment on every push to main
- ✅ Build validation on pull requests
- ✅ Static asset serving from `/public` directory
- ✅ D1 database integration
- ✅ Custom domain routing
- ✅ Environment variables support
- ✅ Preview deployments for testing

## Next Steps

1. Set up the GitHub secrets as described above
2. Push to main branch to trigger first deployment
3. Configure custom domain in Cloudflare dashboard (optional)
4. Set up monitoring and alerts for your Worker