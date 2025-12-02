# SITES Spectral Quality Metrics

This directory contains quality metrics and analysis for comparing agent-assisted development versus manual development.

## Quick Start

### Collect Metrics

```bash
# Analyze last 90 days (default)
python scripts/collect_quality_metrics.py

# Analyze specific time period
python scripts/collect_quality_metrics.py --days 30

# Output to custom location
python scripts/collect_quality_metrics.py --output metrics_custom.yaml
```

### View Results

```bash
# View YAML metrics
cat docs/metrics/quality_metrics.yaml

# Or use yq for formatted output
yq '.' docs/metrics/quality_metrics.yaml
```

## Directory Structure

```
docs/metrics/
├── README.md                      # This file
├── quality_metrics.yaml           # Generated metrics (gitignored)
├── monthly_reports/               # Monthly quality reports
│   ├── 2025-01.md
│   ├── 2025-02.md
│   └── ...
└── baseline/                      # Historical baseline data
    └── quality_metrics_baseline.yaml
```

## Metrics Collected

### Commit Metrics
- Total commits (agent vs manual)
- Lines of code added/removed
- Net change in codebase size
- Commit distribution by agent type

### Quality Metrics
- **Bug Density:** Bugs per 1000 lines of code
- **Fix Ratio:** Bugs fixed / bugs introduced
- **Stability Score:** 1 - (breaking changes / commits)
- **Feature Velocity:** Features completed / commits

### Bug Tracking
- Bugs introduced (estimated from reverts)
- Bugs fixed (from commit messages)
- Breaking changes (from commit keywords)

### Agent Distribution
- Commits per agent
- LOC per agent
- Features per agent
- Breaking changes per agent

## Understanding the Metrics

### Bug Density (Lower is Better)
```
bug_density = (bugs_introduced / total_LOC) * 1000
```
Target: < 5.0 bugs per 1000 LOC

### Fix Ratio (Higher is Better)
```
fix_ratio = bugs_fixed / bugs_introduced
```
Target: ≥ 2.0 (fixes twice as many as introduces)

### Stability Score (Higher is Better)
```
stability_score = 1 - (breaking_changes / commits)
```
Target: ≥ 0.90 (≤ 10% breaking changes)

### Feature Velocity
```
feature_velocity = features_completed / commits
```
Indicates productivity (not quality)

## Commit Tagging

For accurate metrics, commits should be tagged:

### Automatic Tagging (via git hook)

Create branches with format:
```bash
# Agent work
git checkout -b agent-coordinator/platform-creation-fix
git checkout -b agent-security/csrf-protection

# Manual work
git checkout -b manual/user-auth-fix
git checkout -b fix/platform-button-visibility
```

Commits will be auto-tagged:
```
[AGENT:coordinator] Fix platform creation timing issue
[MANUAL] Update user authentication flow
```

### Manual Tagging

If not using branches, prefix commit messages:
```bash
git commit -m "[AGENT:coordinator] Add platform diagnostics"
git commit -m "[MANUAL] Fix CSS styling issue"
```

## Generating Reports

### Monthly Report

1. Collect metrics for the month:
   ```bash
   python scripts/collect_quality_metrics.py --days 30
   ```

2. Copy template:
   ```bash
   cp docs/metrics/monthly_report_template.md \
      docs/metrics/monthly_reports/2025-12.md
   ```

3. Fill in metrics from `quality_metrics.yaml`

4. Review and commit report

### Quarterly Review

1. Collect metrics for quarter:
   ```bash
   python scripts/collect_quality_metrics.py --days 90
   ```

2. Compare to previous quarter baseline

3. Identify trends and patterns

4. Update agent documentation if needed

## Success Criteria

### Agent Work is Considered Successful If:

1. **Bug Density** ≤ manual work bug density
2. **Stability Score** ≥ 0.90
3. **Fix Ratio** ≥ 2.0
4. **Feature Velocity** ≥ manual work velocity
5. **No critical security issues** introduced

### Early Warning Signs:

- Bug density > 2x manual work
- Stability score < 0.70
- Fix ratio < 1.0 (introduces more than fixes)
- Increasing trend in breaking changes
- Critical bugs requiring immediate hotfixes

## Continuous Improvement

Based on metrics, take action:

### If Agent Quality is Low:
1. Review agent prompts and documentation
2. Add more context to CLAUDE.md
3. Improve test coverage
4. Create more specific agents for problem areas
5. Add quality gates to CI/CD

### If Agent Quality is High:
1. Expand agent responsibilities
2. Document successful patterns
3. Create new specialized agents
4. Share learnings with team

## Integration with CI/CD

### Quality Gates

Add to CI pipeline:
```yaml
# .github/workflows/quality-check.yml
- name: Collect Metrics
  run: python scripts/collect_quality_metrics.py --days 7

- name: Check Quality Thresholds
  run: |
    # Fail if bug density is too high
    # Fail if stability score is too low
    python scripts/check_quality_thresholds.py
```

### Automated Reports

Schedule weekly metrics collection:
```yaml
# .github/workflows/weekly-metrics.yml
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Metrics
        run: python scripts/collect_quality_metrics.py
      - name: Commit Results
        run: |
          git add docs/metrics/quality_metrics.yaml
          git commit -m "[AUTO] Weekly quality metrics update"
          git push
```

## Troubleshooting

### No Commits Found

**Problem:** Script reports 0 commits

**Solutions:**
- Check git history exists: `git log --oneline | head`
- Verify date range: commits may be outside time window
- Check branch: may need to analyze different branch

### Incorrect Categorization

**Problem:** Commits miscategorized as agent/manual

**Solutions:**
- Use proper branch naming convention
- Add commit message prefixes manually
- Update git hook to match your workflow

### Missing Metrics

**Problem:** Some metrics show as 0

**Solutions:**
- Increase time window (--days)
- Check commit message format
- Verify keyword detection patterns in script

## References

- [Platform Creation Diagnosis](../PLATFORM_CREATION_DIAGNOSIS_AND_AGENT_QUALITY_FRAMEWORK.md)
- [SITES Spectral CLAUDE.md](../../CLAUDE.md)
- [Git Hooks Documentation](https://git-scm.com/docs/githooks)

## Questions?

Contact the development team or open an issue with the `metrics` label.
