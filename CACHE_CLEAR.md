# Cache Clearing Instructions

To ensure you see the latest changes (v0.4.1), please follow these steps:

## Browser Cache Clearing

### Chrome/Edge/Brave
1. **Hard Refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Or Full Clear**: `F12` → `Application` tab → `Storage` → `Clear storage`
3. **Or Settings**: `Settings` → `Privacy and security` → `Clear browsing data` → `Cached images and files`

### Firefox
1. **Hard Refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Or Full Clear**: `Ctrl+Shift+Delete` → Check `Cache` → `Clear Now`

### Safari
1. **Hard Refresh**: `Cmd+Option+R`
2. **Or Full Clear**: `Safari` → `Clear History...` → `All History`

## Cloudflare Cache Clearing

If you have access to the Cloudflare dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain (`jobelab.com`)
3. Go to `Caching` → `Configuration`
4. Click `Purge Everything` button
5. Confirm the cache purge

## Verification

After clearing cache, check that:
- ✅ Status bar shows **Version 0.4.1**
- ✅ Station pages load data correctly
- ✅ Interactive map displays properly
- ✅ Console shows no API errors

## Development Cache Busting

All resources now use `v=0.4.0` parameters:
- `/css/styles.css?v=0.4.0`
- `/js/utils.js?v=0.4.0`
- `/js/api.js?v=0.4.0`
- `/js/components.js?v=0.4.0`
- `/js/interactive-map.js?v=0.4.0`
- `/js/dashboard.js?v=0.4.0`

This should force browsers to fetch fresh copies of all resources.