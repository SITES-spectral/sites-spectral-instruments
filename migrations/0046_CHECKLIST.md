# Migration 0046 - Deployment Checklist

**Version:** v15.0.0
**Type:** BREAKING CHANGE
**Date:** 2026-01-26

## Pre-Deployment Checklist

### Documentation Review
- [ ] Read `0046_SUMMARY.md` (executive overview)
- [ ] Read `0046_README.md` (complete documentation)
- [ ] Read `0046_EXECUTION_GUIDE.md` (step-by-step instructions)
- [ ] Understand breaking changes and impact
- [ ] Review rollback procedure

### Stakeholder Communication
- [ ] Notify technical team (2 weeks before)
- [ ] Notify product team about breaking changes
- [ ] Notify users about upcoming changes
- [ ] Schedule deployment window (off-peak hours)
- [ ] Coordinate with client application teams

### Environment Preparation
- [ ] Local database setup and working
- [ ] Wrangler CLI configured and authenticated
- [ ] Access to production database verified
- [ ] Backup strategy confirmed
- [ ] Monitoring tools ready

### Code Review
- [ ] Migration SQL reviewed by peer
- [ ] Test suite reviewed and approved
- [ ] Rollback script reviewed and verified
- [ ] No syntax errors in SQL files
- [ ] All indexes properly named

### Approval Gates
- [ ] Technical Lead approval obtained
- [ ] Database Admin approval obtained
- [ ] DevOps Lead approval obtained
- [ ] Product Manager approval obtained
- [ ] QA Lead approval obtained

## Local Testing Checklist

### Test Environment Setup
- [ ] Local database backup created
- [ ] Local database contains representative data
- [ ] Wrangler local environment working
- [ ] Test data includes all mount types (PL, BL, GL)

### Migration Testing
- [ ] Pre-migration snapshot captured
- [ ] Migration applied successfully (local)
- [ ] Zero errors during execution
- [ ] Execution time < 5 seconds
- [ ] All SQL statements executed

### Verification Testing
- [ ] Test suite executed (0046_test_migration.sql)
- [ ] TEST 1: Column Existence - PASS ✅
- [ ] TEST 2: JSON Validity - PASS ✅
- [ ] TEST 3: Mount Type Code Normalization - PASS ✅
- [ ] TEST 4: Platform Name Normalization - PASS ✅
- [ ] TEST 5: Instrument Name Normalization - PASS ✅
- [ ] TEST 6: New Codes Present - PASS ✅
- [ ] TEST 7: Platform-Instrument Consistency - PASS ✅
- [ ] TEST 8: Legacy Names Captured - PASS ✅
- [ ] TEST 9: Legacy Names Content - PASS ✅
- [ ] TEST 10: Referential Integrity - PASS ✅
- [ ] TEST 11: Index Creation - PASS ✅
- [ ] TEST 12: Timestamp Updates - PASS ✅
- [ ] **All 12 tests PASSED** ✅

### Manual Verification
- [ ] Sample platform names verified (TWR/BLD/GND)
- [ ] Sample instrument names match platform prefixes
- [ ] Legacy_names contain old values
- [ ] No orphaned records found
- [ ] JSON arrays properly formatted
- [ ] Query performance acceptable

### Rollback Testing
- [ ] Rollback script applied successfully
- [ ] Database restored to pre-migration state
- [ ] All legacy codes (PL, BL, GL) restored
- [ ] No data loss detected
- [ ] Rollback time < 2 minutes

### Local Testing Sign-Off
- [ ] **All local tests passed**
- [ ] **Rollback verified working**
- [ ] **Ready to proceed to production**

**Tester:** _________________ **Date:** _______ **Sign:** _______

## Production Deployment Checklist

### Pre-Deployment Actions
- [ ] Production deployment window scheduled
- [ ] All stakeholders notified
- [ ] Monitoring dashboard open
- [ ] Error alerting enabled
- [ ] On-call team ready
- [ ] Rollback command prepared

### Backup Verification
- [ ] Production database backup initiated
- [ ] Backup completed successfully
- [ ] Backup size verified (reasonable)
- [ ] Backup accessibility confirmed
- [ ] Backup restoration tested (if possible)

### Migration Execution
- [ ] Migration file uploaded to correct location
- [ ] Wrangler authenticated to production
- [ ] Migration command prepared and reviewed
- [ ] Start time recorded: _______________
- [ ] Migration executed
- [ ] End time recorded: _______________
- [ ] Execution duration: _______________
- [ ] Zero errors reported
- [ ] Transaction committed successfully

### Post-Migration Verification
- [ ] Test suite executed on production
- [ ] All 12 verification tests PASSED ✅
- [ ] Manual query: No legacy codes remaining
- [ ] Manual query: Platform names normalized
- [ ] Manual query: Instrument names normalized
- [ ] Manual query: Legacy_names populated
- [ ] Sample records reviewed and correct

### Application Deployment
- [ ] Application code updated (if needed)
- [ ] Version bumped to v15.0.0
- [ ] CHANGELOG.md updated
- [ ] Application deployed successfully
- [ ] Health check endpoint returns 200 OK
- [ ] Application logs show no errors

### Smoke Testing
- [ ] API health check: PASS ✅
- [ ] GET /api/platforms: Returns new format ✅
- [ ] GET /api/platforms/{id}: Contains legacy_names ✅
- [ ] GET /api/instruments: Names normalized ✅
- [ ] Platform filtering by mount type: Works with new codes ✅
- [ ] Frontend platform display: Renders correctly ✅
- [ ] Frontend search/filter: Works with new codes ✅

### Performance Verification
- [ ] API response time within normal range
- [ ] Database query latency acceptable
- [ ] No slow query alerts triggered
- [ ] CPU/memory usage normal
- [ ] No timeout errors reported

### Error Monitoring (First Hour)
- [ ] API error rate: _____________ (target: < 1% increase)
- [ ] 404 errors: _____________ (target: no increase)
- [ ] 500 errors: _____________ (target: zero)
- [ ] Database errors: _____________ (target: zero)
- [ ] Frontend errors: _____________ (target: no increase)

### Production Deployment Sign-Off
- [ ] **Migration successful**
- [ ] **All smoke tests passed**
- [ ] **No critical errors detected**
- [ ] **Performance within acceptable range**

**Deployer:** _________________ **Date:** _______ **Sign:** _______

## Post-Deployment Monitoring (24 Hours)

### Hour 1 Monitoring
- [ ] Time: _______ | API errors: _______ | Status: _______
- [ ] All systems nominal
- [ ] No rollback required

### Hour 2 Monitoring
- [ ] Time: _______ | API errors: _______ | Status: _______
- [ ] All systems nominal
- [ ] No rollback required

### Hour 4 Monitoring
- [ ] Time: _______ | API errors: _______ | Status: _______
- [ ] All systems nominal
- [ ] No rollback required

### Hour 8 Monitoring
- [ ] Time: _______ | API errors: _______ | Status: _______
- [ ] All systems nominal
- [ ] No rollback required

### Hour 24 Monitoring
- [ ] Time: _______ | API errors: _______ | Status: _______
- [ ] All systems nominal
- [ ] No rollback required

### Monitoring Metrics (24h Summary)
- [ ] Total API calls: _____________
- [ ] Error rate: _____________ (target: < 0.5%)
- [ ] Average response time: _____________ (target: < 200ms)
- [ ] P95 response time: _____________ (target: < 500ms)
- [ ] P99 response time: _____________ (target: < 1000ms)
- [ ] Database query count: _____________
- [ ] Slow queries: _____________ (target: 0)
- [ ] User-reported issues: _____________ (target: 0)

### 24-Hour Monitoring Sign-Off
- [ ] **All metrics within acceptable range**
- [ ] **No critical issues reported**
- [ ] **Migration considered stable**

**Monitor:** _________________ **Date:** _______ **Sign:** _______

## Documentation Updates Checklist

### Code Documentation
- [ ] CLAUDE.md updated (mount type codes section)
- [ ] CHANGELOG.md updated (v15.0.0 entry added)
- [ ] README.md updated (examples with new codes)
- [ ] API documentation updated (all examples)
- [ ] TypeScript types updated (mount code enums)

### User Documentation
- [ ] STATION_USER_GUIDE.md updated
- [ ] FAQ updated (breaking changes explained)
- [ ] Migration announcement published
- [ ] Tutorial videos updated (if applicable)
- [ ] Help articles updated

### Developer Documentation
- [ ] OpenAPI spec updated
- [ ] Client SDK examples updated
- [ ] Test fixtures updated (new naming)
- [ ] Mock data updated
- [ ] Integration guides updated

### Internal Documentation
- [ ] Runbook updated
- [ ] Troubleshooting guide updated
- [ ] Monitoring dashboard annotations added
- [ ] Incident response plan updated

## Client Application Updates

### Web Frontend
- [ ] Updated to use new mount codes
- [ ] Updated platform name handling
- [ ] Updated instrument name handling
- [ ] Updated search/filter logic
- [ ] Tested and deployed

### Mobile App (if applicable)
- [ ] Updated to use new mount codes
- [ ] Updated platform name handling
- [ ] Updated instrument name handling
- [ ] Tested and deployed

### Data Export Scripts
- [ ] Updated to expect new format
- [ ] Updated to parse legacy_names (if needed)
- [ ] Tested with production data
- [ ] Deployed/distributed

### Third-Party Integrations
- [ ] Partner A notified and updated
- [ ] Partner B notified and updated
- [ ] Partner C notified and updated
- [ ] Integration tests passed

## Rollback Decision Tree

### Rollback Triggers (Automatic)

- [ ] API error rate > 20% for 5+ minutes
- [ ] Database query failures > 50 in 1 minute
- [ ] Frontend error rate > 30% increase
- [ ] Critical functionality broken
- [ ] Data integrity issues detected

**If ANY rollback trigger activated:**
- [ ] Rollback initiated immediately
- [ ] Follow `0046_rollback.sql` procedure
- [ ] Post-rollback verification completed
- [ ] Stakeholders notified
- [ ] Root cause analysis scheduled

### Rollback Decision (Manual)

**Considerations:**
- Severity of issues: _______________________
- Number of users affected: _________________
- Time to fix forward: ______________________
- Business impact: _________________________

**Decision:** [ ] Continue Monitoring [ ] Rollback

**Decision Maker:** _____________ **Time:** _______

## Completion Checklist

### Migration Complete
- [ ] Production migration successful
- [ ] 24-hour monitoring completed
- [ ] No critical issues detected
- [ ] All documentation updated
- [ ] All client applications updated
- [ ] Stakeholders informed of completion

### Post-Migration Tasks
- [ ] Migration files archived
- [ ] Backup retention policy applied
- [ ] Lessons learned documented
- [ ] Team retrospective scheduled
- [ ] Migration ticket closed

### Continuous Improvement
- [ ] Migration process improvements noted
- [ ] Test coverage improvements identified
- [ ] Documentation gaps identified
- [ ] Monitoring improvements noted
- [ ] Next migration planned (if any)

## Final Sign-Off

### Project Completion

**Migration successful and stable:**
- All tests passed ✅
- No rollback required ✅
- Documentation updated ✅
- Client applications updated ✅
- 24-hour monitoring stable ✅

**Project Lead:** _________________ **Date:** _______ **Sign:** _______

**Technical Lead:** _________________ **Date:** _______ **Sign:** _______

**Database Admin:** _________________ **Date:** _______ **Sign:** _______

**DevOps Lead:** _________________ **Date:** _______ **Sign:** _______

---

## Notes & Observations

**Issues Encountered:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**Resolutions Applied:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**Improvements for Next Time:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

**Additional Comments:**
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

**Checklist Version:** 1.0
**Last Updated:** 2026-01-26
**Migration:** 0046_normalize_mount_types_add_legacy_names
