#!/usr/bin/env python3
"""
SITES Spectral Quality Metrics Collector

Collects quality metrics from git history to compare agent-assisted
development versus manual development.

Usage:
    python scripts/collect_quality_metrics.py [--days N] [--output PATH]

Options:
    --days N        Number of days to analyze (default: 90)
    --output PATH   Output YAML file path (default: docs/metrics/quality_metrics.yaml)
"""

import subprocess
import re
import yaml
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Tuple


def get_commits_by_type(since_date: str, until_date: str) -> Tuple[List[Dict], List[Dict]]:
    """
    Get commits and categorize by agent/manual.

    Args:
        since_date: Start date in YYYY-MM-DD format
        until_date: End date in YYYY-MM-DD format

    Returns:
        Tuple of (agent_commits, manual_commits) lists
    """
    cmd = [
        'git', 'log',
        f'--since={since_date}',
        f'--until={until_date}',
        '--pretty=format:%H|%s|%an|%ad|%ar',
        '--date=iso'
    ]

    try:
        output = subprocess.check_output(cmd, text=True, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print(f"Error running git log: {e}")
        return [], []

    agent_commits = []
    manual_commits = []

    for line in output.strip().split('\n'):
        if not line or '|' not in line:
            continue

        parts = line.split('|')
        if len(parts) < 5:
            continue

        sha, subject, author, date, relative_date = parts

        commit_data = {
            'sha': sha,
            'subject': subject,
            'author': author,
            'date': date,
            'relative_date': relative_date
        }

        # Categorize by commit message prefix
        if subject.startswith('[AGENT:'):
            agent_match = re.match(r'\[AGENT:(\w+)\]', subject)
            agent_name = agent_match.group(1) if agent_match else 'unknown'
            commit_data['agent'] = agent_name
            agent_commits.append(commit_data)
        elif subject.startswith('[MANUAL]'):
            manual_commits.append(commit_data)
        else:
            # Untagged commits are treated as manual by default
            manual_commits.append(commit_data)

    return agent_commits, manual_commits


def calculate_lines_changed(commits: List[Dict]) -> Tuple[int, int]:
    """
    Calculate total lines added/removed for given commits.

    Args:
        commits: List of commit dictionaries

    Returns:
        Tuple of (lines_added, lines_removed)
    """
    added = 0
    removed = 0

    for commit in commits:
        cmd = ['git', 'show', '--numstat', '--pretty=', commit['sha']]
        try:
            output = subprocess.check_output(cmd, text=True, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError:
            continue

        for line in output.split('\n'):
            if not line.strip():
                continue

            parts = line.split('\t')
            if len(parts) >= 2:
                try:
                    # Handle binary files (marked as '-')
                    add_count = int(parts[0]) if parts[0] != '-' else 0
                    rem_count = int(parts[1]) if parts[1] != '-' else 0
                    added += add_count
                    removed += rem_count
                except ValueError:
                    pass

    return added, removed


def detect_breaking_changes(commits: List[Dict]) -> int:
    """
    Detect breaking changes from commit messages.

    Looks for keywords: BREAKING, breaking-change, BC:

    Args:
        commits: List of commit dictionaries

    Returns:
        Count of commits with breaking changes
    """
    breaking_keywords = [
        'BREAKING',
        'breaking-change',
        'BC:',
        'breaking change',
        '⚠️'
    ]

    count = 0
    for commit in commits:
        subject = commit['subject'].lower()
        if any(keyword.lower() in subject for keyword in breaking_keywords):
            count += 1

    return count


def count_features_completed(commits: List[Dict]) -> int:
    """
    Count feature completions from commit messages.

    Looks for keywords: feat, feature, add, implement, new

    Args:
        commits: List of commit dictionaries

    Returns:
        Count of feature commits
    """
    feature_keywords = [
        'feat:',
        'feature:',
        'add ',
        'implement',
        'new ',
        '✨'
    ]

    count = 0
    for commit in commits:
        subject = commit['subject'].lower()
        if any(keyword.lower() in subject for keyword in feature_keywords):
            count += 1

    return count


def get_bug_counts_from_commits(commits: List[Dict]) -> Dict[str, int]:
    """
    Analyze commit messages for bug introductions and fixes.

    Looks for:
    - Bug fixes: fix, bug, hotfix, patch
    - Bug introductions: Estimated from reverts and subsequent fixes

    Args:
        commits: List of commit dictionaries

    Returns:
        Dictionary with 'introduced' and 'fixed' counts
    """
    fix_keywords = ['fix', 'bug', 'hotfix', 'patch', 'resolve', '🐛']
    revert_keywords = ['revert', 'rollback']

    fixes = 0
    reverts = 0

    for commit in commits:
        subject = commit['subject'].lower()

        if any(keyword in subject for keyword in fix_keywords):
            fixes += 1

        if any(keyword in subject for keyword in revert_keywords):
            reverts += 1

    # Rough estimate: reverts indicate bugs introduced
    # This is imperfect but gives us a baseline
    return {
        'fixed': fixes,
        'introduced': reverts,  # Placeholder estimation
    }


def calculate_quality_scores(metrics: Dict) -> Dict[str, float]:
    """
    Calculate derived quality metrics.

    Args:
        metrics: Dictionary with raw metrics

    Returns:
        Dictionary of quality scores
    """
    scores = {}

    # Bug density per 1000 LOC
    total_loc = metrics['lines_added'] + metrics['lines_removed']
    if total_loc > 0:
        scores['bug_density'] = round((metrics['bugs_introduced'] / total_loc) * 1000, 2)
    else:
        scores['bug_density'] = 0.0

    # Fix ratio (higher is better)
    if metrics['bugs_introduced'] > 0:
        scores['fix_ratio'] = round(metrics['bugs_fixed'] / metrics['bugs_introduced'], 2)
    else:
        scores['fix_ratio'] = float('inf') if metrics['bugs_fixed'] > 0 else 0.0

    # Stability score (higher is better, 1.0 = no breaking changes)
    if metrics['commits'] > 0:
        scores['stability_score'] = round(1 - (metrics['breaking_changes'] / metrics['commits']), 2)
    else:
        scores['stability_score'] = 1.0

    # Feature velocity (features per commit)
    if metrics['commits'] > 0:
        scores['feature_velocity'] = round(metrics['features_completed'] / metrics['commits'], 2)
    else:
        scores['feature_velocity'] = 0.0

    return scores


def analyze_agent_distribution(agent_commits: List[Dict]) -> Dict[str, Dict]:
    """
    Break down metrics by individual agent.

    Args:
        agent_commits: List of agent commit dictionaries

    Returns:
        Dictionary mapping agent name to metrics
    """
    agent_stats = defaultdict(lambda: {
        'commits': 0,
        'lines_added': 0,
        'lines_removed': 0,
        'features': 0,
        'breaking_changes': 0
    })

    for commit in agent_commits:
        agent_name = commit.get('agent', 'unknown')

        agent_stats[agent_name]['commits'] += 1

        # Calculate LOC for this commit
        cmd = ['git', 'show', '--numstat', '--pretty=', commit['sha']]
        try:
            output = subprocess.check_output(cmd, text=True, stderr=subprocess.PIPE)
            for line in output.split('\n'):
                if line.strip():
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        try:
                            agent_stats[agent_name]['lines_added'] += int(parts[0]) if parts[0] != '-' else 0
                            agent_stats[agent_name]['lines_removed'] += int(parts[1]) if parts[1] != '-' else 0
                        except ValueError:
                            pass
        except subprocess.CalledProcessError:
            pass

        # Check for features and breaking changes
        subject = commit['subject'].lower()
        if any(kw in subject for kw in ['feat', 'feature', 'add', 'implement', 'new']):
            agent_stats[agent_name]['features'] += 1

        if any(kw in subject for kw in ['breaking', 'bc:', '⚠️']):
            agent_stats[agent_name]['breaking_changes'] += 1

    return dict(agent_stats)


def main():
    """Main metrics collection function."""
    parser = argparse.ArgumentParser(description='Collect SITES Spectral quality metrics')
    parser.add_argument('--days', type=int, default=90, help='Number of days to analyze (default: 90)')
    parser.add_argument('--output', type=str, default='docs/metrics/quality_metrics.yaml',
                        help='Output YAML file path')
    args = parser.parse_args()

    # Define time period
    end_date = datetime.now()
    start_date = end_date - timedelta(days=args.days)

    print(f"Collecting metrics from {start_date.date()} to {end_date.date()} ({args.days} days)")

    # Collect commit data
    agent_commits, manual_commits = get_commits_by_type(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d')
    )

    print(f"Found {len(agent_commits)} agent commits and {len(manual_commits)} manual commits")

    # Calculate LOC
    print("Calculating lines of code changes...")
    agent_added, agent_removed = calculate_lines_changed(agent_commits)
    manual_added, manual_removed = calculate_lines_changed(manual_commits)

    # Analyze bug patterns
    print("Analyzing bug patterns...")
    agent_bugs = get_bug_counts_from_commits(agent_commits)
    manual_bugs = get_bug_counts_from_commits(manual_commits)

    # Detect breaking changes
    agent_breaking = detect_breaking_changes(agent_commits)
    manual_breaking = detect_breaking_changes(manual_commits)

    # Count features
    agent_features = count_features_completed(agent_commits)
    manual_features = count_features_completed(manual_commits)

    # Analyze agent distribution
    print("Analyzing individual agent contributions...")
    agent_distribution = analyze_agent_distribution(agent_commits)

    # Build metrics structure
    metrics = {
        'collection_info': {
            'generated_at': datetime.now().isoformat(),
            'time_period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'days': args.days
            }
        },
        'agent_work': {
            'commits': len(agent_commits),
            'lines_added': agent_added,
            'lines_removed': agent_removed,
            'net_change': agent_added - agent_removed,
            'bugs_introduced': agent_bugs['introduced'],
            'bugs_fixed': agent_bugs['fixed'],
            'breaking_changes': agent_breaking,
            'features_completed': agent_features
        },
        'manual_work': {
            'commits': len(manual_commits),
            'lines_added': manual_added,
            'lines_removed': manual_removed,
            'net_change': manual_added - manual_removed,
            'bugs_introduced': manual_bugs['introduced'],
            'bugs_fixed': manual_bugs['fixed'],
            'breaking_changes': manual_breaking,
            'features_completed': manual_features
        },
        'agent_distribution': agent_distribution
    }

    # Calculate quality scores
    print("Calculating quality scores...")
    metrics['quality_scores'] = {
        'agent_work': calculate_quality_scores(metrics['agent_work']),
        'manual_work': calculate_quality_scores(metrics['manual_work'])
    }

    # Calculate comparison ratios
    if metrics['manual_work']['commits'] > 0:
        metrics['comparison'] = {
            'bug_density_ratio': round(
                metrics['quality_scores']['agent_work']['bug_density'] /
                metrics['quality_scores']['manual_work']['bug_density']
                if metrics['quality_scores']['manual_work']['bug_density'] > 0 else 0,
                2
            ),
            'stability_ratio': round(
                metrics['quality_scores']['agent_work']['stability_score'] /
                metrics['quality_scores']['manual_work']['stability_score']
                if metrics['quality_scores']['manual_work']['stability_score'] > 0 else 0,
                2
            ),
            'agent_work_percentage': round(
                (metrics['agent_work']['commits'] /
                 (metrics['agent_work']['commits'] + metrics['manual_work']['commits'])) * 100,
                1
            )
        }

    # Save to YAML
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        yaml.dump(metrics, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    print(f"\nMetrics saved to: {output_path}")
    print("\nSummary:")
    print(f"  Total commits: {metrics['agent_work']['commits'] + metrics['manual_work']['commits']}")
    print(f"  Agent commits: {metrics['agent_work']['commits']} ({metrics.get('comparison', {}).get('agent_work_percentage', 0)}%)")
    print(f"  Manual commits: {metrics['manual_work']['commits']}")
    print(f"\n  Agent bug density: {metrics['quality_scores']['agent_work']['bug_density']:.2f} bugs/1K LOC")
    print(f"  Manual bug density: {metrics['quality_scores']['manual_work']['bug_density']:.2f} bugs/1K LOC")
    print(f"\n  Agent stability score: {metrics['quality_scores']['agent_work']['stability_score']:.2f}")
    print(f"  Manual stability score: {metrics['quality_scores']['manual_work']['stability_score']:.2f}")

    if agent_distribution:
        print("\n  Agent Distribution:")
        for agent, stats in sorted(agent_distribution.items(), key=lambda x: x[1]['commits'], reverse=True):
            print(f"    - {agent}: {stats['commits']} commits, {stats['lines_added'] + stats['lines_removed']} LOC")


if __name__ == '__main__':
    main()
