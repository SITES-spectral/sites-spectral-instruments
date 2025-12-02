# Platform Creation Diagnosis and Agent Quality Tracking Framework

**Document Version:** 1.0.0
**Date:** 2025-12-02
**Project:** SITES Spectral Instruments v9.0.0

---

## Part 1: Platform Creation Issue Analysis

### Executive Summary

The platform creation functionality relies on a multi-step authentication and data loading chain. The issue likely stems from **timing issues in the asynchronous loading sequence** or **user data not persisting correctly** in the global scope.

### Root Cause Analysis

#### 1. Authentication Flow Architecture

**File:** `/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/sites-spectral-instruments/public/station-dashboard.html`

The platform controls visibility is gated by this condition (line 4483):

```javascript
if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'station') && stationData && stationData.id) {
    document.getElementById('admin-platform-controls').style.display = 'block';
}
```

#### 2. User Data Loading Chain

**Initialization Sequence:**

1. **DOMContentLoaded** (line 4374) → Waits for modules
2. **SitesStationDashboard instance** loads data (station-dashboard.js)
3. **currentUser sync** (line 4395): `currentUser = window.sitesStationDashboard.currentUser;`
4. **showStationData()** (line 4396) → Checks permissions and shows controls

**The Problem:**

The `currentUser` variable depends on:
- `window.sitesAPI.getUser()` returning valid data (station-dashboard.js:314)
- User data being stored in localStorage under key 'sites_spectral_user' (api-v1.js:20-24)
- The SitesStationDashboard instance properly syncing to global variables

### Diagnostic Steps to Identify the Issue

#### Test 1: Verify User Data in localStorage

```javascript
// Run in browser console on station-dashboard.html
console.log('Token:', localStorage.getItem('sites_spectral_token'));
console.log('User:', localStorage.getItem('sites_spectral_user'));
console.log('Parsed User:', JSON.parse(localStorage.getItem('sites_spectral_user')));
```

**Expected Output (admin user):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "station_id": null,
  "station_acronym": null
}
```

#### Test 2: Verify API Instance

```javascript
// Run in browser console
console.log('API Instance:', window.sitesAPI);
console.log('API getUser():', window.sitesAPI?.getUser());
console.log('Dashboard Instance:', window.sitesStationDashboard);
console.log('Dashboard currentUser:', window.sitesStationDashboard?.currentUser);
console.log('Global currentUser:', currentUser);
```

#### Test 3: Check Station Data

```javascript
// Run in browser console
console.log('Station Data:', stationData);
console.log('Station ID:', stationData?.id);
console.log('Dashboard Station Data:', window.sitesStationDashboard?.stationData);
```

#### Test 4: Check Control Visibility

```javascript
// Run in browser console
const controls = document.getElementById('admin-platform-controls');
console.log('Controls element:', controls);
console.log('Display style:', controls.style.display);
console.log('Computed display:', window.getComputedStyle(controls).display);
```

### Likely Issues and Fixes

#### Issue 1: Timing Race Condition

**Symptom:** User data loads but `currentUser` is null when `showStationData()` runs.

**Fix Location:** `/lunarc/nobackup/projects/sitesspec/SITES/Spectral/apps/sites-spectral-instruments/public/station-dashboard.html` (lines 4392-4407)

**Proposed Fix:**
```javascript
// Add explicit wait for currentUser to be populated
let maxWait = 100;
while (maxWait > 0 && (!window.sitesStationDashboard?.currentUser)) {
    await new Promise(resolve => setTimeout(resolve, 50));
    maxWait--;
}

if (window.sitesStationDashboard?.currentUser) {
    currentUser = window.sitesStationDashboard.currentUser;
} else {
    console.warn('currentUser not loaded within timeout');
}
```

#### Issue 2: User Data Not Persisting

**Symptom:** `localStorage.getItem('sites_spectral_user')` returns null or malformed JSON.

**Fix Location:** Check login.html authentication handler.

**Verification:**
```javascript
// In api-v1.js, the getUser() method has error handling (lines 20-30)
getUser() {
    try {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    } catch (e) {
        console.error('Failed to parse user data:', e);
        localStorage.removeItem(this.userKey);
        return null;
    }
}
```

#### Issue 3: Admin Controls Hidden by CSS

**Symptom:** JavaScript sets display='block' but element remains hidden.

**Check:** Inspect element in DevTools for conflicting CSS rules.

**Possible Conflicts:**
- Parent element has `display: none`
- CSS class override with `!important`
- Z-index issue with overlay

### Recommended Immediate Actions

1. **Add Debug Logging** (temporary, for diagnosis):

```javascript
// Add after line 4483 in station-dashboard.html
console.log('Platform Controls Check:', {
    currentUser,
    role: currentUser?.role,
    stationData,
    stationId: stationData?.id,
    controlsElement: document.getElementById('admin-platform-controls'),
    willShow: !!(currentUser && (currentUser.role === 'admin' || currentUser.role === 'station') && stationData && stationData.id)
});
```

2. **Force Show Controls** (temporary test):

```javascript
// Add after line 4485 to verify button functionality
document.getElementById('admin-platform-controls').style.display = 'block';
```

3. **Verify Button Click Handler**:

```javascript
// Test in console
handleCreatePlatformClick();
```

### Testing Checklist

- [ ] Verify localStorage contains 'sites_spectral_user' with admin role
- [ ] Verify localStorage contains valid 'sites_spectral_token'
- [ ] Confirm window.sitesAPI is initialized
- [ ] Confirm window.sitesAPI.getUser() returns admin user object
- [ ] Confirm window.sitesStationDashboard exists
- [ ] Confirm window.sitesStationDashboard.currentUser is populated
- [ ] Confirm global currentUser variable is synced
- [ ] Confirm stationData is loaded with valid id
- [ ] Check admin-platform-controls element exists in DOM
- [ ] Check element display style is 'block' after showStationData()
- [ ] Test handleCreatePlatformClick() function manually

---

## Part 2: Agent Quality Tracking Framework

### Overview

This framework provides a systematic approach to evaluate whether using the SITES Spectral Agent Team introduces more errors and breaking changes compared to traditional development.

### Framework Architecture

#### 1. Git Commit Tagging System

**Tag Format:**
```
[AGENT:<agent-name>] <commit message>
[MANUAL] <commit message>
[AGENT:TEAM] <commit message> (for multi-agent collaboration)
```

**Examples:**
```
[AGENT:coordinator] Add platform creation diagnostics
[MANUAL] Fix user authentication timing issue
[AGENT:security] Implement CSRF protection framework
[AGENT:TEAM] Complete L0→L1→L2 pipeline refactor
```

**Implementation:**

Add to `.git/hooks/prepare-commit-msg`:
```bash
#!/bin/bash
# Auto-detect agent work from branch naming or prompt user

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Check if branch name contains 'agent-'
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null)

if [[ $BRANCH_NAME == agent-* ]]; then
    # Extract agent name from branch
    AGENT_NAME=$(echo $BRANCH_NAME | sed 's/agent-\([^-]*\).*/\1/')

    # Prepend tag if not already present
    if ! grep -q "^\[AGENT:" "$COMMIT_MSG_FILE"; then
        CURRENT_MSG=$(cat "$COMMIT_MSG_FILE")
        echo "[AGENT:$AGENT_NAME] $CURRENT_MSG" > "$COMMIT_MSG_FILE"
    fi
fi
```

#### 2. Branch Naming Convention

**Agent Work:**
```
agent-<agent-name>/<feature-or-fix>
```

**Examples:**
```
agent-coordinator/platform-creation-fix
agent-security/csrf-implementation
agent-pipeline/l2-optimization
agent-team/complete-refactor
```

**Manual Work:**
```
manual/<feature-or-fix>
fix/<bug-description>
feature/<feature-name>
```

#### 3. Issue Tracking Integration

**GitHub/GitLab Issue Labels:**

| Label | Purpose | Color |
|-------|---------|-------|
| `agent:introduced` | Bug introduced by agent work | Red (#d73a4a) |
| `agent:fixed` | Bug fixed by agent | Green (#0e8a16) |
| `manual:introduced` | Bug introduced by manual work | Orange (#d93f0b) |
| `manual:fixed` | Bug fixed by manual work | Blue (#0075ca) |
| `breaking-change` | Breaking API or behavior change | Purple (#7057ff) |
| `quality:high` | High-quality implementation | Gold (#fbca04) |
| `quality:needs-work` | Requires improvements | Yellow (#fbca04) |

**Issue Templates:**

Create `.github/ISSUE_TEMPLATE/bug_report_agent.md`:
```markdown
---
name: Bug Report (Agent Work)
about: Report a bug introduced by agent-assisted development
title: '[BUG][AGENT] '
labels: 'bug, agent:introduced'
---

## Bug Description
<!-- Clear description of the bug -->

## Agent Information
- **Agent Name:** <!-- coordinator, security, pipeline, etc. -->
- **Commit/PR:** <!-- Link to commit/PR that introduced the bug -->
- **Date Introduced:** <!-- YYYY-MM-DD -->

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Impact Assessment
- [ ] Breaking change
- [ ] Data loss risk
- [ ] Security vulnerability
- [ ] Performance degradation
- [ ] UI/UX issue
- [ ] Documentation issue

## Root Cause Analysis
<!-- Why did the agent introduce this bug? -->
- [ ] Incomplete requirements
- [ ] Missing context
- [ ] Incorrect assumptions
- [ ] Testing gap
- [ ] Documentation gap
```

#### 4. Quality Metrics Collection

**Metrics to Track:**

Create `docs/metrics/quality_metrics.yaml`:

```yaml
# SITES Spectral Quality Metrics Tracking
# Updated: YYYY-MM-DD

time_periods:
  - period: "2025-Q1"
    start_date: "2025-01-01"
    end_date: "2025-03-31"

    agent_work:
      commits: 0
      lines_added: 0
      lines_removed: 0
      bugs_introduced: 0
      bugs_fixed: 0
      breaking_changes: 0
      features_completed: 0
      avg_time_to_resolution_hours: 0
      code_review_cycles: 0

    manual_work:
      commits: 0
      lines_added: 0
      lines_removed: 0
      bugs_introduced: 0
      bugs_fixed: 0
      breaking_changes: 0
      features_completed: 0
      avg_time_to_resolution_hours: 0
      code_review_cycles: 0

    quality_scores:
      agent_work:
        bug_density: 0.0  # bugs per 1000 LOC
        fix_ratio: 0.0    # bugs_fixed / bugs_introduced
        stability_score: 0.0  # 1 - (breaking_changes / commits)
      manual_work:
        bug_density: 0.0
        fix_ratio: 0.0
        stability_score: 0.0
```

**Automated Collection Script:**

Create `scripts/collect_quality_metrics.py`:

```python
#!/usr/bin/env python3
"""
Collect quality metrics from git history and issue tracker.
"""

import subprocess
import re
import yaml
from datetime import datetime, timedelta
from collections import defaultdict

def get_commits_by_type(since_date, until_date):
    """Get commits and categorize by agent/manual."""
    cmd = [
        'git', 'log',
        f'--since={since_date}',
        f'--until={until_date}',
        '--pretty=format:%H|%s|%an|%ad',
        '--numstat'
    ]

    output = subprocess.check_output(cmd, text=True)

    agent_commits = []
    manual_commits = []

    for line in output.split('\n'):
        if '|' in line:
            sha, subject, author, date = line.split('|')

            if subject.startswith('[AGENT:'):
                agent_match = re.match(r'\[AGENT:(\w+)\]', subject)
                agent_name = agent_match.group(1) if agent_match else 'unknown'
                agent_commits.append({
                    'sha': sha,
                    'subject': subject,
                    'agent': agent_name,
                    'author': author,
                    'date': date
                })
            elif subject.startswith('[MANUAL]'):
                manual_commits.append({
                    'sha': sha,
                    'subject': subject,
                    'author': author,
                    'date': date
                })

    return agent_commits, manual_commits

def calculate_lines_changed(commits):
    """Calculate total lines added/removed."""
    added = 0
    removed = 0

    for commit in commits:
        cmd = ['git', 'show', '--numstat', '--pretty=', commit['sha']]
        output = subprocess.check_output(cmd, text=True)

        for line in output.split('\n'):
            if line.strip():
                parts = line.split('\t')
                if len(parts) >= 2:
                    try:
                        added += int(parts[0]) if parts[0] != '-' else 0
                        removed += int(parts[1]) if parts[1] != '-' else 0
                    except ValueError:
                        pass

    return added, removed

def get_bug_counts_from_issues(labels, since_date, until_date):
    """
    Query issue tracker for bugs with specific labels.
    This is a placeholder - implement actual API integration.
    """
    # TODO: Integrate with GitHub/GitLab API
    return {
        'introduced': 0,
        'fixed': 0,
        'breaking_changes': 0
    }

def calculate_quality_scores(metrics):
    """Calculate derived quality metrics."""
    scores = {}

    # Bug density per 1000 LOC
    total_loc = metrics['lines_added'] + metrics['lines_removed']
    scores['bug_density'] = (metrics['bugs_introduced'] / total_loc * 1000) if total_loc > 0 else 0

    # Fix ratio
    scores['fix_ratio'] = (metrics['bugs_fixed'] / metrics['bugs_introduced']) if metrics['bugs_introduced'] > 0 else float('inf')

    # Stability score (higher is better)
    scores['stability_score'] = 1 - (metrics['breaking_changes'] / metrics['commits']) if metrics['commits'] > 0 else 1.0

    return scores

def main():
    """Main metrics collection function."""
    # Define time period
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)  # Last quarter

    # Collect commit data
    agent_commits, manual_commits = get_commits_by_type(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d')
    )

    # Calculate LOC
    agent_added, agent_removed = calculate_lines_changed(agent_commits)
    manual_added, manual_removed = calculate_lines_changed(manual_commits)

    # Collect bug data (placeholder)
    agent_bugs = get_bug_counts_from_issues('agent:introduced', start_date, end_date)
    manual_bugs = get_bug_counts_from_issues('manual:introduced', start_date, end_date)

    # Build metrics structure
    metrics = {
        'time_period': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'agent_work': {
            'commits': len(agent_commits),
            'lines_added': agent_added,
            'lines_removed': agent_removed,
            'bugs_introduced': agent_bugs['introduced'],
            'bugs_fixed': agent_bugs['fixed'],
            'breaking_changes': agent_bugs['breaking_changes']
        },
        'manual_work': {
            'commits': len(manual_commits),
            'lines_added': manual_added,
            'lines_removed': manual_removed,
            'bugs_introduced': manual_bugs['introduced'],
            'bugs_fixed': manual_bugs['fixed'],
            'breaking_changes': manual_bugs['breaking_changes']
        }
    }

    # Calculate quality scores
    metrics['quality_scores'] = {
        'agent_work': calculate_quality_scores(metrics['agent_work']),
        'manual_work': calculate_quality_scores(metrics['manual_work'])
    }

    # Save to YAML
    with open('docs/metrics/quality_metrics.yaml', 'w') as f:
        yaml.dump(metrics, f, default_flow_style=False, sort_keys=False)

    print(f"Metrics collected for period {start_date.date()} to {end_date.date()}")
    print(f"Agent commits: {len(agent_commits)}")
    print(f"Manual commits: {len(manual_commits)}")

if __name__ == '__main__':
    main()
```

#### 5. Comparison Methodology

**Monthly Quality Report Template:**

Create `docs/metrics/monthly_quality_report_template.md`:

```markdown
# Monthly Quality Report: [MONTH YEAR]

## Executive Summary

- **Total Commits:** [X agent + Y manual = Z total]
- **Bug Introduction Rate:**
  - Agent: X bugs per 1000 LOC
  - Manual: Y bugs per 1000 LOC
- **Overall Assessment:** [Agent work is X% more/less stable than manual work]

## Detailed Metrics

### Commit Distribution

| Work Type | Commits | % of Total | LOC Added | LOC Removed | Net Change |
|-----------|---------|------------|-----------|-------------|------------|
| Agent     | X       | XX%        | XXXX      | XXXX        | +/-XXXX    |
| Manual    | Y       | YY%        | YYYY      | YYYY        | +/-YYYY    |

### Bug Analysis

| Metric | Agent Work | Manual Work | Ratio (Agent/Manual) |
|--------|------------|-------------|----------------------|
| Bugs Introduced | X | Y | Z.ZZ |
| Bugs Fixed | X | Y | Z.ZZ |
| Bug Density (per 1K LOC) | X.XX | Y.YY | Z.ZZ |
| Fix Ratio | X.XX | Y.YY | Z.ZZ |
| Breaking Changes | X | Y | Z.ZZ |

### Quality Scores

| Score | Agent Work | Manual Work | Winner |
|-------|------------|-------------|--------|
| Bug Density (lower better) | X.XX | Y.YY | [Agent/Manual] |
| Fix Ratio (higher better) | X.XX | Y.YY | [Agent/Manual] |
| Stability Score (higher better) | X.XX | Y.YY | [Agent/Manual] |

### Time to Resolution

| Work Type | Avg. Time (hours) | Median Time (hours) |
|-----------|-------------------|---------------------|
| Agent     | XX.X              | XX.X                |
| Manual    | YY.Y              | YY.Y                |

## Agent Performance by Type

| Agent | Commits | Bugs Introduced | Bug Density | Stability Score |
|-------|---------|-----------------|-------------|-----------------|
| Coordinator | X | Y | Z.ZZ | Z.ZZ |
| Security | X | Y | Z.ZZ | Z.ZZ |
| Pipeline | X | Y | Z.ZZ | Z.ZZ |
| Frontend | X | Y | Z.ZZ | Z.ZZ |

## Notable Issues

### Critical Bugs Introduced by Agents
1. [Issue #XXX] - Description - Agent: [name] - Impact: [high/medium/low]
2. ...

### Critical Bugs Introduced Manually
1. [Issue #YYY] - Description - Impact: [high/medium/low]
2. ...

## Lessons Learned

### Agent Strengths
- [Area where agents excelled]
- [Type of work best suited for agents]

### Agent Weaknesses
- [Area where agents struggled]
- [Type of work requiring manual intervention]

### Recommendations
1. [Specific recommendation for improving agent work quality]
2. [Process improvement suggestion]
3. [Training or documentation needs]

## Appendix: Raw Data

[Link to quality_metrics.yaml for this period]
```

#### 6. Continuous Monitoring Dashboard

**Create Grafana/Prometheus Integration** (optional):

Create `scripts/export_metrics_to_prometheus.py`:

```python
#!/usr/bin/env python3
"""
Export quality metrics to Prometheus format.
"""

import yaml
from datetime import datetime

def export_to_prometheus(metrics_file, output_file):
    """Convert YAML metrics to Prometheus format."""

    with open(metrics_file, 'r') as f:
        data = yaml.safe_load(f)

    timestamp = int(datetime.now().timestamp() * 1000)

    metrics = []

    # Export agent metrics
    for metric, value in data['agent_work'].items():
        metrics.append(f'sites_spectral_agent_{metric} {value} {timestamp}')

    # Export manual metrics
    for metric, value in data['manual_work'].items():
        metrics.append(f'sites_spectral_manual_{metric} {value} {timestamp}')

    # Export quality scores
    for work_type in ['agent_work', 'manual_work']:
        for score, value in data['quality_scores'][work_type].items():
            metrics.append(f'sites_spectral_{work_type}_{score} {value} {timestamp}')

    with open(output_file, 'w') as f:
        f.write('\n'.join(metrics))

if __name__ == '__main__':
    export_to_prometheus(
        'docs/metrics/quality_metrics.yaml',
        'docs/metrics/quality_metrics.prom'
    )
```

### Implementation Roadmap

#### Phase 1: Foundation (Week 1)
- [ ] Create git hook for commit tagging
- [ ] Establish branch naming conventions
- [ ] Create issue templates
- [ ] Set up metrics directory structure

#### Phase 2: Collection (Week 2)
- [ ] Implement metrics collection script
- [ ] Integrate with issue tracker API
- [ ] Create initial baseline metrics
- [ ] Document collection process

#### Phase 3: Analysis (Week 3)
- [ ] Generate first monthly report
- [ ] Identify patterns and trends
- [ ] Create visualization dashboard
- [ ] Share findings with team

#### Phase 4: Optimization (Week 4)
- [ ] Refine agent prompts based on findings
- [ ] Update agent documentation
- [ ] Implement quality gates
- [ ] Schedule regular reviews

### Success Criteria

**Agent Work is Considered Successful If:**
1. Bug density ≤ manual work bug density
2. Stability score ≥ 0.90 (≤ 10% breaking changes)
3. Fix ratio ≥ 2.0 (fixes twice as many bugs as introduces)
4. Time to resolution ≤ manual work time
5. Code review cycles ≤ manual work cycles

**Early Warning Signs:**
- Bug density > 2x manual work
- Stability score < 0.70
- Fix ratio < 1.0 (introduces more bugs than fixes)
- Increasing trend in breaking changes

### Regular Review Schedule

| Frequency | Activity | Participants |
|-----------|----------|--------------|
| Weekly | Collect metrics | Development team |
| Biweekly | Review bug trends | Tech lead + agents |
| Monthly | Generate full report | Project manager + team |
| Quarterly | Strategic assessment | Stakeholders + team |

---

## Conclusion

### Platform Creation Issue

The platform creation issue requires immediate diagnostic testing following the steps in Part 1. The most likely causes are:
1. Timing race condition in user data loading
2. localStorage data corruption
3. CSS visibility conflicts

Run the diagnostic tests in the browser console to identify the specific cause.

### Agent Quality Framework

The proposed framework provides:
- **Objective measurement** of agent vs manual work quality
- **Transparent tracking** through git tags and issue labels
- **Automated collection** of metrics from git history
- **Actionable insights** through monthly reports
- **Continuous improvement** through iterative refinement

Implementation can begin immediately with Phase 1 (git hooks and conventions) and expand to full automation over 4 weeks.

---

## Next Steps

1. **Immediate:** Run platform creation diagnostics in browser console
2. **Short-term:** Implement Phase 1 of quality framework (git hooks)
3. **Medium-term:** Collect baseline metrics for 30 days
4. **Long-term:** Generate first comparative quality report

