#!/usr/bin/env python3
"""
SITES Spectral - Bulk Import Script
Import instruments, platforms, or ROIs from CSV or JSON files.

Usage:
    python bulk_import.py instruments --file instruments.csv --station SVB
    python bulk_import.py platforms --file platforms.json --station SVB
    python bulk_import.py rois --file rois.csv --instrument SVB_FOR_PL01_PHE01
"""

import argparse
import csv
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict

from d1_client import get_db


def import_instruments(
    file_path: str,
    station_acronym: str,
    dry_run: bool = False
) -> List[Dict]:
    """Import instruments from CSV or JSON file.

    Args:
        file_path: Path to CSV or JSON file
        station_acronym: Target station acronym
        dry_run: If True, validate but don't insert

    Returns:
        List of imported instrument data
    """
    db = get_db()

    # Get station ID
    station = db.query_one(
        "SELECT id FROM stations WHERE acronym = ?",
        [station_acronym]
    )
    if not station:
        raise ValueError(f"Station {station_acronym} not found")

    # Get platform mapping
    platforms = db.query(
        "SELECT id, normalized_name FROM platforms WHERE station_id = ?",
        [station['id']]
    )
    platform_map = {p['normalized_name']: p['id'] for p in platforms}

    # Load data from file
    path = Path(file_path)
    if path.suffix.lower() == '.json':
        with open(path) as f:
            rows = json.load(f)
    else:
        with open(path) as f:
            rows = list(csv.DictReader(f))

    imported = []
    errors = []

    for i, row in enumerate(rows, 1):
        try:
            # Get platform ID
            platform_name = row.get('platform_normalized_name') or row.get('platform')
            platform_id = platform_map.get(platform_name)

            if not platform_id:
                errors.append(f"Row {i}: Platform '{platform_name}' not found")
                continue

            # Prepare instrument data
            instrument_data = {
                "platform_id": platform_id,
                "normalized_name": row['normalized_name'],
                "display_name": row.get('display_name', row['normalized_name']),
                "instrument_type": row['instrument_type'],
                "status": row.get('status', 'Active'),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            # Add optional fields
            optional_fields = [
                'description', 'serial_number', 'manufacturer', 'model',
                'latitude', 'longitude', 'installation_date'
            ]
            for field in optional_fields:
                if field in row and row[field]:
                    instrument_data[field] = row[field]

            if dry_run:
                print(f"  [DRY RUN] Would insert: {instrument_data['normalized_name']}")
            else:
                instrument_id = db.insert("instruments", instrument_data)
                instrument_data['id'] = instrument_id
                print(f"  Inserted: {instrument_data['normalized_name']} (ID: {instrument_id})")

            imported.append(instrument_data)

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    # Summary
    print(f"\nImport Summary:")
    print(f"  Total rows: {len(rows)}")
    print(f"  Imported: {len(imported)}")
    print(f"  Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  - {error}")

    return imported


def import_platforms(
    file_path: str,
    station_acronym: str,
    dry_run: bool = False
) -> List[Dict]:
    """Import platforms from CSV or JSON file.

    Args:
        file_path: Path to CSV or JSON file
        station_acronym: Target station acronym
        dry_run: If True, validate but don't insert

    Returns:
        List of imported platform data
    """
    db = get_db()

    # Get station ID
    station = db.query_one(
        "SELECT id FROM stations WHERE acronym = ?",
        [station_acronym]
    )
    if not station:
        raise ValueError(f"Station {station_acronym} not found")

    # Load data
    path = Path(file_path)
    if path.suffix.lower() == '.json':
        with open(path) as f:
            rows = json.load(f)
    else:
        with open(path) as f:
            rows = list(csv.DictReader(f))

    imported = []

    for row in rows:
        platform_data = {
            "station_id": station['id'],
            "normalized_name": row['normalized_name'],
            "display_name": row.get('display_name', row['normalized_name']),
            "platform_type": row.get('platform_type', 'fixed'),
            "ecosystem_code": row.get('ecosystem_code', 'FOR'),
            "status": row.get('status', 'Active'),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        # Add optional fields
        if 'latitude' in row:
            platform_data['latitude'] = float(row['latitude'])
        if 'longitude' in row:
            platform_data['longitude'] = float(row['longitude'])
        if 'description' in row:
            platform_data['description'] = row['description']

        if dry_run:
            print(f"  [DRY RUN] Would insert: {platform_data['normalized_name']}")
        else:
            platform_id = db.insert("platforms", platform_data)
            platform_data['id'] = platform_id
            print(f"  Inserted: {platform_data['normalized_name']} (ID: {platform_id})")

        imported.append(platform_data)

    return imported


def import_rois(
    file_path: str,
    instrument_name: str,
    dry_run: bool = False
) -> List[Dict]:
    """Import ROIs from CSV or JSON file.

    Args:
        file_path: Path to CSV or JSON file
        instrument_name: Target instrument normalized name
        dry_run: If True, validate but don't insert

    Returns:
        List of imported ROI data
    """
    db = get_db()

    # Get instrument ID
    instrument = db.query_one(
        "SELECT id FROM instruments WHERE normalized_name = ?",
        [instrument_name]
    )
    if not instrument:
        raise ValueError(f"Instrument {instrument_name} not found")

    # Load data
    path = Path(file_path)
    if path.suffix.lower() == '.json':
        with open(path) as f:
            rows = json.load(f)
    else:
        with open(path) as f:
            rows = list(csv.DictReader(f))

    imported = []

    for row in rows:
        roi_data = {
            "instrument_id": instrument['id'],
            "roi_name": row['roi_name'],
            "description": row.get('description', ''),
            "polygon_points": row.get('polygon_points', '[]'),
            "color": row.get('color', '#FF0000'),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        if dry_run:
            print(f"  [DRY RUN] Would insert: {roi_data['roi_name']}")
        else:
            roi_id = db.insert("instrument_rois", roi_data)
            roi_data['id'] = roi_id
            print(f"  Inserted: {roi_data['roi_name']} (ID: {roi_id})")

        imported.append(roi_data)

    return imported


def main():
    parser = argparse.ArgumentParser(
        description="Bulk import data into SITES Spectral database"
    )
    subparsers = parser.add_subparsers(dest="command", help="Import type")

    # Instruments subcommand
    inst_parser = subparsers.add_parser("instruments", help="Import instruments")
    inst_parser.add_argument("--file", "-f", required=True, help="Input CSV/JSON file")
    inst_parser.add_argument("--station", "-s", required=True, help="Station acronym")
    inst_parser.add_argument("--dry-run", action="store_true", help="Validate without inserting")

    # Platforms subcommand
    plat_parser = subparsers.add_parser("platforms", help="Import platforms")
    plat_parser.add_argument("--file", "-f", required=True, help="Input CSV/JSON file")
    plat_parser.add_argument("--station", "-s", required=True, help="Station acronym")
    plat_parser.add_argument("--dry-run", action="store_true", help="Validate without inserting")

    # ROIs subcommand
    roi_parser = subparsers.add_parser("rois", help="Import ROIs")
    roi_parser.add_argument("--file", "-f", required=True, help="Input CSV/JSON file")
    roi_parser.add_argument("--instrument", "-i", required=True, help="Instrument normalized name")
    roi_parser.add_argument("--dry-run", action="store_true", help="Validate without inserting")

    args = parser.parse_args()

    if args.command == "instruments":
        import_instruments(args.file, args.station.upper(), args.dry_run)
    elif args.command == "platforms":
        import_platforms(args.file, args.station.upper(), args.dry_run)
    elif args.command == "rois":
        import_rois(args.file, args.instrument, args.dry_run)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
