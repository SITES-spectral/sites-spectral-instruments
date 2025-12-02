# SITES Spectral - Diagnostics and Quality Tracking Scripts

This document covers diagnostic and quality tracking scripts for the SITES Spectral project.

For production data sync scripts, see [README.md](./README.md).

---

## Diagnostic Scripts

### Platform Creation Diagnostics

**File:** `diagnose_platform_creation.js`

**Purpose:** Diagnose why platform creation controls are not showing for admin users.

**Usage:**
1. Open `station-dashboard.html` in browser
2. Press F12 to open DevTools Console
3. Copy entire contents of `diagnose_platform_creation.js`
4. Paste into console and press Enter
5. Review diagnostic output

**What it checks:**
- localStorage authentication data
- API instance initialization
- Dashboard instance state
- Global variable synchronization
- DOM element visibility
- Permission logic evaluation

**Output:**
- Detailed diagnostic report
- List of issues found
- Recommended actions
- JavaScript object with all diagnostic data

---

## Quality Tracking Scripts

### Quality Metrics Collector

**File:** `collect_quality_metrics.py`

**Purpose:** Collect and analyze quality metrics comparing agent-assisted vs manual development.

**Usage:**
```bash
# Basic usage (last 90 days)
python scripts/collect_quality_metrics.py

# Custom time period
python scripts/collect_quality_metrics.py --days 30

# Custom output location
python scripts/collect_quality_metrics.py --output custom_metrics.yaml
```

**Requirements:**
- Python 3.12.9+
- PyYAML package: `pip install pyyaml`

**Output:**
- `docs/metrics/quality_metrics.yaml` with detailed metrics
- Console summary of key metrics

**Metrics Collected:**
- Commit counts (agent vs manual)
- Lines of code changed
- Bug introduction/fix rates
- Breaking changes count
- Feature completion velocity
- Quality scores (bug density, stability, fix ratio)
- Agent distribution breakdown

---

## Git Hooks

### Automatic Commit Tagging

**File:** `.git/hooks/prepare-commit-msg`

**Purpose:** Automatically tag commits with [AGENT:name] or [MANUAL] prefix based on branch naming.

**Installation:**
Already installed if you're reading this. Make executable:
```bash
chmod +x .git/hooks/prepare-commit-msg
```

**Branch Naming Convention:**

**For Agent Work:**
```bash
git checkout -b agent-coordinator/feature-name
git checkout -b agent-security/csrf-implementation
git checkout -b agent-pipeline/l2-optimization
```

Commits will be auto-tagged:
```
[AGENT:coordinator] Add feature description
[AGENT:security] Implement CSRF protection
```

**For Manual Work:**
```bash
git checkout -b manual/bug-fix
git checkout -b fix/platform-button
git checkout -b feature/new-dashboard
```

Commits will be auto-tagged:
```
[MANUAL] Fix bug description
[MANUAL] Fix platform button visibility
```

**Manual Tagging:**
If not using branch naming convention, prefix commits manually:
```bash
git commit -m "[AGENT:coordinator] Add diagnostics"
git commit -m "[MANUAL] Update CSS styling"
```

---

## Workflow Examples

### Diagnosing Platform Creation Issue

1. User reports: "Platform creation button not showing"
2. Ask user to run diagnostic script in console
3. Review diagnostic output for issues:
   - Missing authentication token
   - User role incorrect
   - Station data not loaded
   - Timing issue with data sync
4. Apply recommended fix
5. Verify with user

### Collecting Quality Metrics

1. End of month arrives
2. Run metrics collection:
   ```bash
   python scripts/collect_quality_metrics.py --days 30
   ```
3. Review output in `docs/metrics/quality_metrics.yaml`
4. Generate monthly report (see docs/metrics/README.md)
5. Identify trends and improvements needed
6. Update agent documentation if needed

### Starting Agent Work

1. Create properly named branch:
   ```bash
   git checkout -b agent-frontend/modal-improvements
   ```
2. Make changes
3. Commit (auto-tagged by hook):
   ```bash
   git commit -m "Improve modal accessibility"
   # Results in: [AGENT:frontend] Improve modal accessibility
   ```
4. Push and create PR
5. Metrics will automatically categorize as agent work

---

## Maintenance

### Updating Metrics Collection

Edit `collect_quality_metrics.py` to:
- Add new metrics
- Change keyword detection
- Adjust quality score formulas
- Add new agent types

### Updating Diagnostic Script

Edit `diagnose_platform_creation.js` to:
- Add new diagnostic checks
- Update for new UI components
- Check additional global variables

### Updating Git Hook

Edit `.git/hooks/prepare-commit-msg` to:
- Support new branch naming patterns
- Add additional auto-tagging rules
- Customize tag formats

---

## Troubleshooting

### Metrics Script Issues

**Problem:** "No module named 'yaml'"
**Solution:** Install PyYAML: `pip install pyyaml`

**Problem:** "No commits found"
**Solution:** Check date range with `--days` parameter

**Problem:** "Git command failed"
**Solution:** Ensure you're in git repository root

### Git Hook Not Working

**Problem:** Commits not being auto-tagged
**Solution:**
1. Check hook is executable: `chmod +x .git/hooks/prepare-commit-msg`
2. Verify branch naming: Must start with `agent-` or `manual/`
3. Check hook didn't fail: Look for error messages during commit

### Diagnostic Script Issues

**Problem:** "ReferenceError: currentUser is not defined"
**Solution:** This is expected if data not loaded - script handles it

**Problem:** Script doesn't run
**Solution:**
1. Copy entire file contents
2. Paste in console as single block
3. Press Enter once

---

## Contributing

When adding new scripts:

1. Add documentation to this file or README.md
2. Add usage examples
3. Include error handling
4. Test on clean repository
5. Update main project CLAUDE.md if needed

---

## Related Documentation

- [Platform Creation Diagnosis](../docs/PLATFORM_CREATION_DIAGNOSIS_AND_AGENT_QUALITY_FRAMEWORK.md)
- [Quality Metrics Documentation](../docs/metrics/README.md)
- [Project CLAUDE.md](../CLAUDE.md)
- [Production Sync Scripts](./README.md)

---

## Questions?

Open an issue with the `scripts` or `diagnostics` label.
