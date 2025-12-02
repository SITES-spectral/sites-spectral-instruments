# Quick Start: Platform Creation Diagnostics & Agent Quality Tracking

**Created:** 2025-12-02
**For:** SITES Spectral Instruments v9.0.0

This document provides a quick-start guide for both issues you raised.

---

## Issue 1: Platform Creation Not Working (Admin Users)

### Immediate Diagnostic Steps

#### Step 1: Run Browser Console Diagnostic

1. Open the station dashboard in your browser
2. Press `F12` to open DevTools
3. Go to the **Console** tab
4. Copy and paste the entire contents of this file:
   ```
   /lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/sites-spectral-instruments/scripts/diagnose_platform_creation.js
   ```
5. Press Enter to run
6. Review the output

The script will automatically:
- Check authentication state
- Verify user permissions
- Analyze data loading
- Identify visibility issues
- Provide recommended fixes

#### Step 2: Quick Manual Checks (Alternative)

If you prefer manual testing, run these in the browser console:

```javascript
// Check authentication
console.log('Token:', !!localStorage.getItem('sites_spectral_token'));
console.log('User:', JSON.parse(localStorage.getItem('sites_spectral_user')));

// Check user object
console.log('Current User:', currentUser);
console.log('User Role:', currentUser?.role);

// Check station data
console.log('Station Data:', stationData);
console.log('Station ID:', stationData?.id);

// Check controls visibility
const controls = document.getElementById('admin-platform-controls');
console.log('Controls Display:', controls?.style.display);
console.log('Computed Display:', window.getComputedStyle(controls).display);

// Force show controls (temporary test)
if (controls) {
    controls.style.display = 'block';
    console.log('Controls now visible. Try clicking the button.');
}
```

### Common Issues and Fixes

#### Issue: User data not persisting
**Symptom:** localStorage is empty or malformed
**Fix:** Log out and log back in

#### Issue: Timing race condition
**Symptom:** currentUser is null when page loads
**Fix:** Add explicit wait in code (see full diagnosis doc)

#### Issue: Station data not loaded
**Symptom:** stationData.id is undefined
**Fix:** Refresh page, check for console errors

#### Issue: CSS conflicts
**Symptom:** Controls exist but are hidden
**Fix:** Run force-show command above to test button functionality

### Next Steps

After diagnostics, see the full analysis document:
```
/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/sites-spectral-instruments/docs/PLATFORM_CREATION_DIAGNOSIS_AND_AGENT_QUALITY_FRAMEWORK.md
```

---

## Issue 2: Agent Quality Tracking Framework

### Quick Implementation (15 minutes)

#### Phase 1: Git Commit Tagging

The git hook is already installed and ready to use:

**1. Start using proper branch naming:**

```bash
# For agent work
git checkout -b agent-coordinator/fix-platform-creation
git checkout -b agent-security/add-csrf-protection

# For manual work
git checkout -b manual/update-css
git checkout -b fix/button-visibility
```

**2. Make your commits as normal:**

```bash
git add .
git commit -m "Fix platform creation timing issue"
```

The hook will automatically tag it:
```
[AGENT:coordinator] Fix platform creation timing issue
```

**3. Start tracking immediately**

No configuration needed. The system is ready to track from your next commit.

#### Phase 2: Collect Baseline Metrics (5 minutes)

```bash
# Collect metrics for last 90 days
python scripts/collect_quality_metrics.py

# View results
cat docs/metrics/quality_metrics.yaml
```

This gives you a baseline to compare future work against.

#### Phase 3: Monthly Review (30 minutes/month)

At the end of each month:

```bash
# Collect monthly metrics
python scripts/collect_quality_metrics.py --days 30

# Review the output
cat docs/metrics/quality_metrics.yaml
```

Compare:
- Agent vs manual commit counts
- Bug density (bugs per 1000 LOC)
- Stability score (breaking changes)
- Feature velocity

### Understanding the Metrics

#### Bug Density (Lower is Better)
```
Agent: 2.5 bugs per 1000 LOC
Manual: 3.8 bugs per 1000 LOC
→ Agent work is 34% cleaner
```

#### Stability Score (Higher is Better)
```
Agent: 0.95 (5% breaking changes)
Manual: 0.87 (13% breaking changes)
→ Agent work is more stable
```

#### Fix Ratio (Higher is Better)
```
Agent: 3.2 (fixes 3.2 bugs for every bug introduced)
Manual: 1.8 (fixes 1.8 bugs for every bug introduced)
→ Agent work has better fix ratio
```

### Success Criteria

Your agent work is successful if:

1. ✓ Bug density ≤ manual work
2. ✓ Stability score ≥ 0.90
3. ✓ Fix ratio ≥ 2.0
4. ✓ No critical security issues

### Warning Signs

Stop and review if:

- ✗ Bug density > 2x manual work
- ✗ Stability score < 0.70
- ✗ Fix ratio < 1.0
- ✗ Increasing trend in breaking changes

---

## Complete Documentation Index

| Document | Purpose | Location |
|----------|---------|----------|
| **This File** | Quick start guide | `QUICK_START_DIAGNOSTICS_AND_QUALITY.md` |
| **Full Diagnosis** | Detailed platform creation analysis | `docs/PLATFORM_CREATION_DIAGNOSIS_AND_AGENT_QUALITY_FRAMEWORK.md` |
| **Metrics Guide** | How to use quality metrics | `docs/metrics/README.md` |
| **Scripts Guide** | Script usage and maintenance | `scripts/DIAGNOSTICS_AND_QUALITY.md` |
| **Diagnostic Script** | Browser console diagnostic | `scripts/diagnose_platform_creation.js` |
| **Metrics Script** | Quality metrics collector | `scripts/collect_quality_metrics.py` |
| **Git Hook** | Auto-commit tagging | `.git/hooks/prepare-commit-msg` |

---

## Immediate Action Items

### For Platform Creation Issue:

1. [ ] Run diagnostic script in browser console
2. [ ] Review output for specific issues
3. [ ] Apply recommended fixes
4. [ ] Test platform creation
5. [ ] Report findings

### For Quality Tracking:

1. [ ] Verify git hook is executable: `chmod +x .git/hooks/prepare-commit-msg`
2. [ ] Create agent branch for next feature: `git checkout -b agent-coordinator/feature-name`
3. [ ] Collect baseline metrics: `python scripts/collect_quality_metrics.py`
4. [ ] Review baseline in `docs/metrics/quality_metrics.yaml`
5. [ ] Schedule monthly review (first Monday of each month)

---

## Examples

### Example 1: Starting New Agent Work

```bash
# Create agent branch
git checkout -b agent-frontend/improve-modals

# Make changes
# ... edit files ...

# Commit (auto-tagged)
git add .
git commit -m "Add accessibility improvements to instrument modals"
# Result: [AGENT:frontend] Add accessibility improvements to instrument modals

git push origin agent-frontend/improve-modals
```

### Example 2: Collecting and Reviewing Metrics

```bash
# Collect last 30 days
python scripts/collect_quality_metrics.py --days 30

# View summary
cat docs/metrics/quality_metrics.yaml

# Output example:
# agent_work:
#   commits: 45
#   bugs_introduced: 2
#   bugs_fixed: 8
#   quality_scores:
#     bug_density: 1.2
#     stability_score: 0.96
#     fix_ratio: 4.0
#
# manual_work:
#   commits: 23
#   bugs_introduced: 4
#   bugs_fixed: 5
#   quality_scores:
#     bug_density: 3.5
#     stability_score: 0.83
#     fix_ratio: 1.25
```

### Example 3: Diagnosing Platform Issue

```javascript
// In browser console, after loading station-dashboard.html:

// Quick check
console.log('User:', currentUser);
console.log('Station:', stationData);

// If null, wait and check again
setTimeout(() => {
    console.log('User (delayed):', currentUser);
    console.log('Station (delayed):', stationData);
}, 2000);

// Force show controls to test button
document.getElementById('admin-platform-controls').style.display = 'block';

// Test button click
handleCreatePlatformClick();
```

---

## Getting Help

### Platform Creation Issues

If diagnostic script doesn't identify the issue:
1. Take screenshots of console output
2. Note browser and version
3. Check for JavaScript errors in console
4. Review network tab for failed API calls

### Quality Metrics Issues

If metrics script fails:
1. Verify you're in git repository: `git status`
2. Check Python version: `python --version` (need 3.6+)
3. Install dependencies: `pip install pyyaml`
4. Check git log has commits: `git log --oneline | head`

### Questions or Bugs

Open an issue with labels:
- `diagnostics` - for diagnostic tool issues
- `metrics` - for quality tracking issues
- `bug` - for platform creation bugs
- `help-wanted` - for general questions

---

## Conclusion

You now have:

1. **Diagnostic tool** for platform creation issues
2. **Quality tracking system** for agent vs manual work
3. **Automated tagging** via git hooks
4. **Metrics collection** script
5. **Success criteria** and warning signs

Both systems are ready to use immediately. Start with the diagnostic script for the platform issue, then begin tracking quality with your next commit.

**Total setup time:** 15-20 minutes
**Ongoing time commitment:** 30 minutes per month for review

Good luck!
