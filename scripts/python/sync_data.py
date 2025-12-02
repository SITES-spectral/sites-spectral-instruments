#!/usr/bin/env python3
"""
SITES Spectral - Data Synchronization Script
Sync data between local files and the Cloudflare D1 database.

Usage:
    python sync_data.py pull --station SVB         # Pull station data to local JSON
    python sync_data.py push --station SVB         # Push local changes to database
    python sync_data.py diff --station SVB         # Show differences
    python sync_data.py backup --output ./backups  # Full database backup
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List

from d1_client import get_db


def pull_station(station_acronym: str, output_dir: str = "./data") -> Path:
    """Pull station data from database to local JSON file.

    Args:
        station_acronym: Station acronym
        output_dir: Directory for output files

    Returns:
        Path to created file
    """
    db = get_db()
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Get station with all related data
    station = db.query_one(
        "SELECT * FROM stations WHERE acronym = ?",
        [station_acronym]
    )
    if not station:
        raise ValueError(f"Station {station_acronym} not found")

    # Get platforms
    platforms = db.query("""
        SELECT * FROM platforms WHERE station_id = ? ORDER BY normalized_name
    """, [station['id']])

    for platform in platforms:
        # Get instruments
        instruments = db.query("""
            SELECT * FROM instruments WHERE platform_id = ? ORDER BY normalized_name
        """, [platform['id']])

        for instrument in instruments:
            # Get ROIs
            rois = db.query("""
                SELECT * FROM instrument_rois WHERE instrument_id = ? ORDER BY roi_name
            """, [instrument['id']])
            instrument['rois'] = rois

        platform['instruments'] = instruments

    station['platforms'] = platforms
    station['_sync_meta'] = {
        'pulled_at': datetime.utcnow().isoformat(),
        'source': 'cloudflare_d1'
    }

    # Write to file
    output_file = output_path / f"{station_acronym.lower()}_sync.json"
    with open(output_file, 'w') as f:
        json.dump(station, f, indent=2, default=str)

    print(f"Pulled {station_acronym} to {output_file}")
    print(f"  Platforms: {len(platforms)}")
    print(f"  Instruments: {sum(len(p['instruments']) for p in platforms)}")

    return output_file


def push_station(station_acronym: str, input_file: str, dry_run: bool = False) -> Dict:
    """Push local changes to database.

    Args:
        station_acronym: Station acronym
        input_file: Path to JSON file with changes
        dry_run: If True, show changes without applying

    Returns:
        Summary of changes made
    """
    db = get_db()

    with open(input_file) as f:
        local_data = json.load(f)

    # Get current database state
    station = db.query_one(
        "SELECT * FROM stations WHERE acronym = ?",
        [station_acronym]
    )
    if not station:
        raise ValueError(f"Station {station_acronym} not found")

    changes = {'updated': 0, 'inserted': 0, 'deleted': 0}

    # Update station fields
    station_fields = ['display_name', 'description', 'latitude', 'longitude']
    station_updates = {}
    for field in station_fields:
        if field in local_data and local_data[field] != station.get(field):
            station_updates[field] = local_data[field]

    if station_updates:
        station_updates['updated_at'] = datetime.utcnow().isoformat()
        if dry_run:
            print(f"[DRY RUN] Would update station: {station_updates}")
        else:
            db.update("stations", station_updates, "id = ?", [station['id']])
            changes['updated'] += 1

    # Process platforms
    for local_platform in local_data.get('platforms', []):
        existing = db.query_one(
            "SELECT * FROM platforms WHERE normalized_name = ?",
            [local_platform['normalized_name']]
        )

        if existing:
            # Update existing platform
            platform_updates = {}
            for field in ['display_name', 'description', 'latitude', 'longitude', 'status']:
                if field in local_platform and local_platform[field] != existing.get(field):
                    platform_updates[field] = local_platform[field]

            if platform_updates:
                platform_updates['updated_at'] = datetime.utcnow().isoformat()
                if dry_run:
                    print(f"[DRY RUN] Would update platform {local_platform['normalized_name']}: {platform_updates}")
                else:
                    db.update("platforms", platform_updates, "id = ?", [existing['id']])
                    changes['updated'] += 1

            # Process instruments in platform
            for local_instrument in local_platform.get('instruments', []):
                existing_inst = db.query_one(
                    "SELECT * FROM instruments WHERE normalized_name = ?",
                    [local_instrument['normalized_name']]
                )

                if existing_inst:
                    inst_updates = {}
                    for field in ['display_name', 'description', 'status', 'serial_number']:
                        if field in local_instrument and local_instrument[field] != existing_inst.get(field):
                            inst_updates[field] = local_instrument[field]

                    if inst_updates:
                        inst_updates['updated_at'] = datetime.utcnow().isoformat()
                        if dry_run:
                            print(f"[DRY RUN] Would update instrument {local_instrument['normalized_name']}")
                        else:
                            db.update("instruments", inst_updates, "id = ?", [existing_inst['id']])
                            changes['updated'] += 1

    print(f"\nSync Summary for {station_acronym}:")
    print(f"  Updated: {changes['updated']}")
    print(f"  Inserted: {changes['inserted']}")
    print(f"  Deleted: {changes['deleted']}")

    return changes


def diff_station(station_acronym: str, local_file: str) -> Dict:
    """Show differences between local file and database.

    Args:
        station_acronym: Station acronym
        local_file: Path to local JSON file

    Returns:
        Dictionary of differences
    """
    db = get_db()

    with open(local_file) as f:
        local_data = json.load(f)

    station = db.query_one(
        "SELECT * FROM stations WHERE acronym = ?",
        [station_acronym]
    )
    if not station:
        raise ValueError(f"Station {station_acronym} not found")

    differences = {'station': [], 'platforms': [], 'instruments': []}

    # Compare station fields
    for field in ['display_name', 'description', 'latitude', 'longitude']:
        local_val = local_data.get(field)
        db_val = station.get(field)
        if local_val != db_val:
            differences['station'].append({
                'field': field,
                'local': local_val,
                'database': db_val
            })

    # Compare platforms
    local_platforms = {p['normalized_name']: p for p in local_data.get('platforms', [])}
    db_platforms = db.query(
        "SELECT * FROM platforms WHERE station_id = ?",
        [station['id']]
    )

    for db_plat in db_platforms:
        local_plat = local_platforms.get(db_plat['normalized_name'])
        if local_plat:
            for field in ['display_name', 'status', 'latitude', 'longitude']:
                if local_plat.get(field) != db_plat.get(field):
                    differences['platforms'].append({
                        'platform': db_plat['normalized_name'],
                        'field': field,
                        'local': local_plat.get(field),
                        'database': db_plat.get(field)
                    })

    # Print differences
    print(f"\nDifferences for {station_acronym}:")

    if differences['station']:
        print("\nStation:")
        for diff in differences['station']:
            print(f"  {diff['field']}: '{diff['database']}' -> '{diff['local']}'")

    if differences['platforms']:
        print("\nPlatforms:")
        for diff in differences['platforms']:
            print(f"  {diff['platform']}.{diff['field']}: '{diff['database']}' -> '{diff['local']}'")

    if not any(differences.values()):
        print("  No differences found")

    return differences


def backup_database(output_dir: str = "./backups") -> Path:
    """Create full database backup.

    Args:
        output_dir: Directory for backup files

    Returns:
        Path to backup file
    """
    db = get_db()
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    backup_data = {
        '_backup_meta': {
            'created_at': datetime.utcnow().isoformat(),
            'tables': []
        }
    }

    # Get all tables
    tables = db.get_tables()

    for table in tables:
        if table.startswith('_') or table == 'd1_migrations':
            continue

        rows = db.query(f"SELECT * FROM {table}")
        backup_data[table] = rows
        backup_data['_backup_meta']['tables'].append({
            'name': table,
            'row_count': len(rows)
        })
        print(f"  Backed up {table}: {len(rows)} rows")

    # Write backup file
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    backup_file = output_path / f"sites_spectral_backup_{timestamp}.json"

    with open(backup_file, 'w') as f:
        json.dump(backup_data, f, indent=2, default=str)

    print(f"\nBackup saved to: {backup_file}")
    return backup_file


def main():
    parser = argparse.ArgumentParser(
        description="Sync data between local files and SITES Spectral database"
    )
    subparsers = parser.add_subparsers(dest="command", help="Sync command")

    # Pull command
    pull_parser = subparsers.add_parser("pull", help="Pull data from database")
    pull_parser.add_argument("--station", "-s", required=True, help="Station acronym")
    pull_parser.add_argument("--output", "-o", default="./data", help="Output directory")

    # Push command
    push_parser = subparsers.add_parser("push", help="Push changes to database")
    push_parser.add_argument("--station", "-s", required=True, help="Station acronym")
    push_parser.add_argument("--file", "-f", required=True, help="Local JSON file")
    push_parser.add_argument("--dry-run", action="store_true", help="Show changes without applying")

    # Diff command
    diff_parser = subparsers.add_parser("diff", help="Show differences")
    diff_parser.add_argument("--station", "-s", required=True, help="Station acronym")
    diff_parser.add_argument("--file", "-f", required=True, help="Local JSON file")

    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Full database backup")
    backup_parser.add_argument("--output", "-o", default="./backups", help="Output directory")

    args = parser.parse_args()

    if args.command == "pull":
        pull_station(args.station.upper(), args.output)
    elif args.command == "push":
        push_station(args.station.upper(), args.file, args.dry_run)
    elif args.command == "diff":
        diff_station(args.station.upper(), args.file)
    elif args.command == "backup":
        backup_database(args.output)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
