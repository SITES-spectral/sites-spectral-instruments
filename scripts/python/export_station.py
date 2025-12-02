#!/usr/bin/env python3
"""
SITES Spectral - Station Data Export Script
Export complete station data including platforms, instruments, and ROIs to JSON.

Usage:
    python export_station.py SVB                    # Export SVB to svb_export.json
    python export_station.py SVB -o my_export.json  # Custom output file
    python export_station.py --all                  # Export all stations
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from d1_client import get_db


def export_station_data(station_acronym: str, output_file: Optional[str] = None) -> dict:
    """Export complete station data to JSON.

    Args:
        station_acronym: Station acronym (e.g., 'SVB', 'ANS')
        output_file: Optional output file path

    Returns:
        Exported station data dictionary
    """
    db = get_db()

    # Get station
    station = db.query_one(
        "SELECT * FROM stations WHERE acronym = ?",
        [station_acronym]
    )
    if not station:
        raise ValueError(f"Station {station_acronym} not found")

    print(f"Exporting station: {station['display_name']} ({station_acronym})")

    # Get platforms
    platforms = db.query("""
        SELECT * FROM platforms
        WHERE station_id = ?
        ORDER BY display_name
    """, [station['id']])

    print(f"  Found {len(platforms)} platforms")

    # Get instruments for each platform
    total_instruments = 0
    total_rois = 0

    for platform in platforms:
        instruments = db.query("""
            SELECT * FROM instruments
            WHERE platform_id = ?
            ORDER BY display_name
        """, [platform['id']])
        platform['instruments'] = instruments
        total_instruments += len(instruments)

        # Get ROIs for each instrument
        for instrument in instruments:
            rois = db.query("""
                SELECT * FROM instrument_rois
                WHERE instrument_id = ?
                ORDER BY roi_name
            """, [instrument['id']])
            instrument['rois'] = rois
            total_rois += len(rois)

    print(f"  Found {total_instruments} instruments")
    print(f"  Found {total_rois} ROIs")

    # Add platforms to station
    station['platforms'] = platforms

    # Add export metadata
    station['_export_meta'] = {
        'exported_at': datetime.utcnow().isoformat(),
        'platform_count': len(platforms),
        'instrument_count': total_instruments,
        'roi_count': total_rois
    }

    # Write to file if specified
    if output_file:
        output_path = Path(output_file)
        with open(output_path, 'w') as f:
            json.dump(station, f, indent=2, default=str)
        print(f"  Exported to: {output_path}")

    return station


def export_all_stations(output_dir: str = ".") -> list:
    """Export all stations to individual JSON files.

    Args:
        output_dir: Directory for output files

    Returns:
        List of exported station data
    """
    db = get_db()
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    stations = db.query("SELECT acronym FROM stations ORDER BY acronym")
    exported = []

    for station in stations:
        acronym = station['acronym']
        output_file = output_path / f"{acronym.lower()}_export.json"
        data = export_station_data(acronym, str(output_file))
        exported.append(data)

    print(f"\nExported {len(exported)} stations to {output_path}")
    return exported


def main():
    parser = argparse.ArgumentParser(
        description="Export SITES Spectral station data to JSON"
    )
    parser.add_argument(
        "station",
        nargs="?",
        help="Station acronym (e.g., SVB, ANS)"
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file path"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Export all stations"
    )
    parser.add_argument(
        "--output-dir",
        default="./exports",
        help="Output directory for --all exports"
    )

    args = parser.parse_args()

    if args.all:
        export_all_stations(args.output_dir)
    elif args.station:
        output_file = args.output or f"{args.station.lower()}_export.json"
        export_station_data(args.station.upper(), output_file)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
