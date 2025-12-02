#!/usr/bin/env python3
"""
SITES Spectral - Common Query Examples
Demonstrates typical database queries for the SITES Spectral system.

Run this script to see example outputs, or import functions for use in other scripts.

Usage:
    python query_examples.py                  # Run all examples
    python query_examples.py --example stats  # Run specific example
"""

import argparse
from d1_client import get_db


def get_station_summary():
    """Get summary statistics for all stations."""
    db = get_db()

    results = db.query("""
        SELECT
            s.acronym,
            s.display_name,
            COUNT(DISTINCT p.id) as platform_count,
            COUNT(DISTINCT i.id) as instrument_count,
            COUNT(DISTINCT r.id) as roi_count
        FROM stations s
        LEFT JOIN platforms p ON s.id = p.station_id
        LEFT JOIN instruments i ON p.id = i.platform_id
        LEFT JOIN instrument_rois r ON i.id = r.instrument_id
        GROUP BY s.id
        ORDER BY s.acronym
    """)

    print("Station Summary:")
    print("-" * 70)
    print(f"{'Station':<10} {'Name':<25} {'Platforms':>10} {'Instruments':>12} {'ROIs':>8}")
    print("-" * 70)

    for row in results:
        print(f"{row['acronym']:<10} {row['display_name'][:24]:<25} "
              f"{row['platform_count']:>10} {row['instrument_count']:>12} {row['roi_count']:>8}")

    return results


def get_instruments_by_type():
    """Get instrument counts grouped by type."""
    db = get_db()

    results = db.query("""
        SELECT
            instrument_type,
            COUNT(*) as count,
            COUNT(DISTINCT platform_id) as platforms
        FROM instruments
        GROUP BY instrument_type
        ORDER BY count DESC
    """)

    print("\nInstruments by Type:")
    print("-" * 45)
    print(f"{'Type':<20} {'Count':>10} {'Platforms':>12}")
    print("-" * 45)

    for row in results:
        print(f"{row['instrument_type']:<20} {row['count']:>10} {row['platforms']:>12}")

    return results


def get_platforms_by_ecosystem():
    """Get platform counts grouped by ecosystem."""
    db = get_db()

    results = db.query("""
        SELECT
            ecosystem_code,
            COUNT(*) as count,
            COUNT(DISTINCT station_id) as stations
        FROM platforms
        WHERE ecosystem_code IS NOT NULL
        GROUP BY ecosystem_code
        ORDER BY count DESC
    """)

    print("\nPlatforms by Ecosystem:")
    print("-" * 40)
    print(f"{'Ecosystem':<15} {'Count':>10} {'Stations':>12}")
    print("-" * 40)

    for row in results:
        print(f"{row['ecosystem_code']:<15} {row['count']:>10} {row['stations']:>12}")

    return results


def get_active_instruments(station_acronym: str = None):
    """Get all active instruments, optionally filtered by station."""
    db = get_db()

    sql = """
        SELECT
            i.normalized_name,
            i.instrument_type,
            i.status,
            p.display_name as platform,
            s.acronym as station
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.status = 'Active'
    """
    params = []

    if station_acronym:
        sql += " AND s.acronym = ?"
        params.append(station_acronym)

    sql += " ORDER BY s.acronym, p.display_name, i.normalized_name"

    results = db.query(sql, params if params else None)

    title = f"Active Instruments" + (f" for {station_acronym}" if station_acronym else "")
    print(f"\n{title}:")
    print("-" * 90)
    print(f"{'Station':<8} {'Platform':<25} {'Instrument':<30} {'Type':<15}")
    print("-" * 90)

    for row in results:
        print(f"{row['station']:<8} {row['platform'][:24]:<25} "
              f"{row['normalized_name']:<30} {row['instrument_type']:<15}")

    return results


def get_phenocams_with_rois():
    """Get all phenocams that have ROIs defined."""
    db = get_db()

    results = db.query("""
        SELECT
            i.normalized_name,
            i.display_name,
            s.acronym as station,
            COUNT(r.id) as roi_count,
            GROUP_CONCAT(r.roi_name) as roi_names
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        LEFT JOIN instrument_rois r ON i.id = r.instrument_id
        WHERE i.instrument_type = 'Phenocam'
        GROUP BY i.id
        HAVING roi_count > 0
        ORDER BY s.acronym, i.normalized_name
    """)

    print("\nPhenocams with ROIs:")
    print("-" * 80)

    for row in results:
        print(f"\n{row['station']} - {row['normalized_name']}")
        print(f"  Display Name: {row['display_name']}")
        print(f"  ROI Count: {row['roi_count']}")
        if row['roi_names']:
            print(f"  ROIs: {row['roi_names']}")

    return results


def get_recent_changes(days: int = 7):
    """Get recently modified entities."""
    db = get_db()

    # Instruments updated recently
    instruments = db.query(f"""
        SELECT
            i.normalized_name,
            i.updated_at,
            s.acronym as station
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.updated_at >= datetime('now', '-{days} days')
        ORDER BY i.updated_at DESC
        LIMIT 20
    """)

    print(f"\nRecently Updated Instruments (last {days} days):")
    print("-" * 60)

    if instruments:
        for row in instruments:
            print(f"  {row['updated_at'][:19]} - {row['station']}/{row['normalized_name']}")
    else:
        print("  No recent updates")

    return instruments


def search_instruments(query: str):
    """Search instruments by name or description."""
    db = get_db()

    results = db.query("""
        SELECT
            i.normalized_name,
            i.display_name,
            i.instrument_type,
            i.description,
            s.acronym as station
        FROM instruments i
        JOIN platforms p ON i.platform_id = p.id
        JOIN stations s ON p.station_id = s.id
        WHERE i.normalized_name LIKE ?
           OR i.display_name LIKE ?
           OR i.description LIKE ?
        ORDER BY s.acronym, i.normalized_name
    """, [f"%{query}%", f"%{query}%", f"%{query}%"])

    print(f"\nSearch Results for '{query}':")
    print("-" * 70)

    if results:
        for row in results:
            print(f"\n{row['station']} - {row['normalized_name']}")
            print(f"  Type: {row['instrument_type']}")
            print(f"  Display: {row['display_name']}")
            if row['description']:
                print(f"  Description: {row['description'][:100]}...")
    else:
        print("  No results found")

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Run common SITES Spectral database query examples"
    )
    parser.add_argument(
        "--example", "-e",
        choices=['stats', 'types', 'ecosystems', 'active', 'phenocams', 'recent', 'search'],
        help="Run specific example"
    )
    parser.add_argument(
        "--station", "-s",
        help="Filter by station (for active instruments)"
    )
    parser.add_argument(
        "--query", "-q",
        help="Search query (for search example)"
    )
    parser.add_argument(
        "--days", "-d",
        type=int,
        default=7,
        help="Days to look back (for recent changes)"
    )

    args = parser.parse_args()

    if args.example == 'stats':
        get_station_summary()
    elif args.example == 'types':
        get_instruments_by_type()
    elif args.example == 'ecosystems':
        get_platforms_by_ecosystem()
    elif args.example == 'active':
        get_active_instruments(args.station)
    elif args.example == 'phenocams':
        get_phenocams_with_rois()
    elif args.example == 'recent':
        get_recent_changes(args.days)
    elif args.example == 'search':
        if not args.query:
            print("Error: --query required for search example")
        else:
            search_instruments(args.query)
    else:
        # Run all examples
        get_station_summary()
        get_instruments_by_type()
        get_platforms_by_ecosystem()
        get_phenocams_with_rois()


if __name__ == "__main__":
    main()
