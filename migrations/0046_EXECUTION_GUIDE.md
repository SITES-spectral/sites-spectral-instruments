# Migration 0046 - Quick Execution Guide

## Pre-Flight Checklist

- [ ] Read `0046_README.md` completely
- [ ] Database backup exists and verified
- [ ] Local testing environment ready
- [ ] Production deployment window scheduled
- [ ] Rollback plan understood and ready
- [ ] Team notified of upcoming breaking change

## Step-by-Step Execution

### Phase 1: Local Testing (Required)

```bash
# 1. Backup local database
npx wrangler d1 backup create spectral_stations_db --local

# 2. Run pre-migration tests
npx wrangler d1 execute spectral_stations_db --local \
  --command="SELECT COUNT(*) as platforms_with_legacy_codes FROM platforms WHERE mount_type_code LIKE 'PL%' OR mount_type_code LIKE 'BL%' OR mount_type_code LIKE 'GL%';"

# 3. Apply migration to local database
npx wrangler d1 execute spectral_stations_db --local \
  --file=migrations/0046_normalize_mount_types_add_legacy_names.sql

# 4. Run full test suite
npx wrangler d1 execute spectral_stations_db --local \
  --file=migrations/0046_test_migration.sql > local_test_results.txt

# 5. Review test results
cat local_test_results.txt | grep -E "TEST [0-9]+:|result|PASS|FAIL"
```

**🛑 STOP:** Do not proceed to Phase 2 unless ALL tests show `PASS`

### Phase 2: Production Migration

```bash
# 1. Create production backup
npx wrangler d1 backup create spectral_stations_db

# 2. Verify backup completed
npx wrangler d1 backup list spectral_stations_db

# 3. Apply migration to production
npx wrangler d1 execute spectral_stations_db --remote \
  --file=migrations/0046_normalize_mount_types_add_legacy_names.sql

# 4. Run production verification
npx wrangler d1 execute spectral_stations_db --remote \
  --file=migrations/0046_test_migration.sql > production_test_results.txt

# 5. Quick verification
npx wrangler d1 execute spectral_stations_db --remote \
  --command="SELECT 'Legacy Codes Remaining' as check, COUNT(*) as count FROM platforms WHERE mount_type_code LIKE 'PL%' OR mount_type_code LIKE 'BL%' OR mount_type_code LIKE 'GL%';"
```

**Expected Output:** `count: 0` (no legacy codes remaining)

### Phase 3: Application Deployment

```bash
# 1. Update version in package.json
npm version minor # v14.2.0 -> v15.0.0

# 2. Update CHANGELOG.md
# Add v15.0.0 entry with breaking changes

# 3. Deploy application
npm run deploy

# 4. Verify deployment
curl https://sites.jobelab.com/api/health
```

### Phase 4: Smoke Testing

```bash
# Test 1: Platform list endpoint
curl https://sites.jobelab.com/api/platforms | jq '.[] | {name: .normalized_name, code: .mount_type_code}' | head -20

# Test 2: Platform by ID (check legacy_names field)
curl https://sites.jobelab.com/api/platforms/1 | jq '{name: .normalized_name, legacy: .legacy_names}'

# Test 3: Instrument list (verify names updated)
curl https://sites.jobelab.com/api/instruments | jq '.[] | {name: .normalized_name}' | head -20

# Test 4: Search by mount type (use new codes)
curl https://sites.jobelab.com/api/platforms?mount_type=TWR | jq 'length'
```

### Phase 5: Monitoring (First 24 Hours)

```bash
# Monitor API error rates
npx wrangler tail --format=pretty

# Check database query performance
npx wrangler d1 execute spectral_stations_db --remote \
  --command="SELECT 'Query Performance Check' as test, COUNT(*) as platforms_queried FROM platforms WHERE mount_type_code IN ('TWR01', 'TWR02', 'TWR03');"

# Monitor frontend errors (check browser console)
# Visit: https://sites.jobelab.com
```

## Quick Rollback (If Needed)

```bash
# 1. Apply rollback script
npx wrangler d1 execute spectral_stations_db --remote \
  --file=migrations/0046_rollback.sql

# 2. Verify rollback
npx wrangler d1 execute spectral_stations_db --remote \
  --command="SELECT mount_type_code, COUNT(*) FROM platforms GROUP BY mount_type_code;"

# 3. Redeploy previous version
git revert HEAD
npm run deploy

# 4. Clear caches
# Cloudflare dashboard: Purge cache
```

## Verification Queries

### Quick Health Check
```sql
-- Run this to verify migration success
SELECT
  'Migration Status' as metric,
  COUNT(*) as total_platforms,
  COUNT(CASE WHEN mount_type_code LIKE 'TWR%' THEN 1 END) as tower_platforms,
  COUNT(CASE WHEN mount_type_code LIKE 'BLD%' THEN 1 END) as building_platforms,
  COUNT(CASE WHEN mount_type_code LIKE 'GND%' THEN 1 END) as ground_platforms,
  COUNT(CASE WHEN mount_type_code LIKE 'PL%' OR mount_type_code LIKE 'BL%' OR mount_type_code LIKE 'GL%' THEN 1 END) as legacy_remaining,
  COUNT(CASE WHEN legacy_names != '[]' THEN 1 END) as platforms_with_history
FROM platforms;
```

**Expected:**
- `legacy_remaining`: 0
- `platforms_with_history`: > 0 (should match tower + building + ground counts)

### Sample Data Check
```sql
-- Verify transformation examples
SELECT
  id,
  normalized_name,
  mount_type_code,
  json_extract(legacy_names, '$[0]') as original_name
FROM platforms
WHERE legacy_names != '[]'
ORDER BY normalized_name
LIMIT 10;
```

**Expected:** See TWR/BLD/GND in normalized_name, PL/BL/GL in original_name

## Troubleshooting

### Issue: Migration hangs or times out

**Solution:**
```bash
# Check database status
npx wrangler d1 execute spectral_stations_db --remote \
  --command="SELECT 'Database Status' as status, COUNT(*) as platform_count FROM platforms;"

# If stuck, rollback and retry
npx wrangler d1 execute spectral_stations_db --remote \
  --file=migrations/0046_rollback.sql
```

### Issue: Tests fail with "inconsistent records"

**Diagnosis:**
```bash
# Find inconsistent records
npx wrangler d1 execute spectral_stations_db --remote \
  --command="SELECT i.normalized_name as instrument, p.normalized_name as platform FROM instruments i JOIN platforms p ON i.platform_id = p.id WHERE SUBSTR(i.normalized_name, 1, LENGTH(p.normalized_name)) != p.normalized_name;"
```

**Solution:** Review output, may need manual correction

### Issue: API returns 404 for platforms

**Diagnosis:**
- Check if client using old naming convention
- Verify API code updated to use new field values

**Solution:**
```javascript
// Update API client to use new codes
const platformCode = 'TWR01'; // was: 'PL01'
```

## Success Indicators

After migration, you should see:

✅ All test queries return `PASS`
✅ API responses contain `legacy_names` field
✅ Platform names use TWR/BLD/GND format
✅ Instrument names match platform prefixes
✅ No 404 errors on platform lookups
✅ Frontend displays platforms correctly
✅ Search/filter works with new codes
✅ Database query performance maintained

## Post-Migration Tasks

- [ ] Update API documentation
- [ ] Update frontend examples
- [ ] Update test fixtures
- [ ] Announce to users
- [ ] Monitor for 24 hours
- [ ] Archive migration files
- [ ] Close migration ticket

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Local Testing | 15 min | Includes test runs |
| Production Migration | 5 min | Database updates |
| Application Deployment | 10 min | Build and deploy |
| Smoke Testing | 10 min | Manual verification |
| **Total** | **40 min** | Plus 24h monitoring |

## Contact

If you encounter issues:

1. **Check test output:** Review `production_test_results.txt`
2. **Check logs:** `npx wrangler tail`
3. **Rollback if critical:** Use `0046_rollback.sql`
4. **Get help:** [Support contact info]

---

**Last Updated:** 2026-01-26
**Status:** Ready for execution
**Breaking Change:** YES
**Rollback Available:** YES
