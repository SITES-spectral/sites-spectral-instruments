#!/usr/bin/env python3
"""
SITES Spectral - Database to YAML Export Script

Converts the instruments database export (JSON) to a structured YAML format.

Usage:
    npx wrangler d1 execute spectral_stations_db --remote --json --command="SELECT
      s.acronym,
      s.display_name as station_display,
      p.normalized_name as platform,
      p.display_name as platform_display,
      p.location_code,
      p.mounting_structure,
      p.platform_height_m,
      p.latitude as plat_lat,
      p.longitude as plat_lon,
      i.normalized_name as instrument,
      i.display_name as instr_display,
      i.instrument_type,
      i.instrument_number,
      i.status,
      i.legacy_acronym,
      i.instrument_height_m,
      i.deployment_date,
      i.camera_brand,
      i.camera_model,
      i.camera_serial_number,
      i.sensor_brand,
      i.sensor_model,
      i.installation_notes
    FROM stations s
    JOIN platforms p ON s.id = p.station_id
    JOIN instruments i ON p.id = i.platform_id
    ORDER BY s.acronym, p.normalized_name, i.normalized_name;" 2>/dev/null | python3 scripts/export_db_to_yaml.py > docs/migrations/instruments_database_export_$(date +%Y-%m-%d).yaml

Author: SITES Spectral Team
Generated with Claude Code
"""

import json
import sys
from collections import defaultdict
from datetime import datetime


def main():
    # Read JSON data from stdin
    try:
        data = json.load(sys.stdin)
        results = data[0]['results']
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"Error parsing JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    # Organize by station -> platform -> instruments
    stations = defaultdict(lambda: {
        'display_name': '',
        'platforms': defaultdict(lambda: {
            'display_name': '',
            'location_code': '',
            'mounting_structure': '',
            'platform_height_m': None,
            'latitude': None,
            'longitude': None,
            'instruments': {}
        })
    })

    for row in results:
        station = row['acronym']
        platform = row['platform']
        instrument = row['instrument']

        stations[station]['display_name'] = row['station_display']

        p = stations[station]['platforms'][platform]
        p['display_name'] = row['platform_display']
        p['location_code'] = row['location_code']
        p['mounting_structure'] = row['mounting_structure']
        p['platform_height_m'] = row['platform_height_m']
        p['latitude'] = row['plat_lat']
        p['longitude'] = row['plat_lon']

        p['instruments'][instrument] = {
            'display_name': row['instr_display'],
            'instrument_type': row['instrument_type'],
            'instrument_number': row['instrument_number'],
            'status': row['status'],
            'legacy_acronym': row['legacy_acronym'],
            'instrument_height_m': row['instrument_height_m'],
            'deployment_date': row['deployment_date'],
            'camera': {
                'brand': row['camera_brand'],
                'model': row['camera_model'],
                'serial_number': row['camera_serial_number']
            } if row['camera_brand'] else None,
            'sensor': {
                'brand': row['sensor_brand'],
                'model': row['sensor_model']
            } if row['sensor_brand'] else None,
            'installation_notes': row['installation_notes']
        }

    # Output as YAML
    print(f"# SITES Spectral Instruments Database Export")
    print(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"# Total Stations: {len(stations)}")
    print(f"# Total Instruments: {len(results)}")
    print()

    for station, sdata in sorted(stations.items()):
        print(f"{station}:")
        print(f"  display_name: \"{sdata['display_name']}\"")
        print(f"  platforms:")

        for platform, pdata in sorted(sdata['platforms'].items()):
            print(f"    {platform}:")
            print(f"      display_name: \"{pdata['display_name']}\"")
            print(f"      location_code: \"{pdata['location_code']}\"")
            if pdata['mounting_structure']:
                print(f"      mounting_structure: \"{pdata['mounting_structure']}\"")
            if pdata['platform_height_m']:
                print(f"      platform_height_m: {pdata['platform_height_m']}")
            if pdata['latitude']:
                print(f"      latitude: {pdata['latitude']}")
            if pdata['longitude']:
                print(f"      longitude: {pdata['longitude']}")
            print(f"      instruments:")

            for instr, idata in sorted(pdata['instruments'].items()):
                print(f"        {instr}:")
                print(f"          display_name: \"{idata['display_name']}\"")
                print(f"          instrument_type: \"{idata['instrument_type']}\"")
                if idata['instrument_number']:
                    print(f"          instrument_number: \"{idata['instrument_number']}\"")
                print(f"          status: \"{idata['status']}\"")
                if idata['legacy_acronym']:
                    print(f"          legacy_acronym: \"{idata['legacy_acronym']}\"")
                if idata['instrument_height_m']:
                    print(f"          instrument_height_m: {idata['instrument_height_m']}")
                if idata['deployment_date']:
                    print(f"          deployment_date: \"{idata['deployment_date']}\"")
                if idata['camera']:
                    print(f"          camera:")
                    if idata['camera']['brand']:
                        print(f"            brand: \"{idata['camera']['brand']}\"")
                    if idata['camera']['model']:
                        print(f"            model: \"{idata['camera']['model']}\"")
                    if idata['camera']['serial_number']:
                        print(f"            serial_number: \"{idata['camera']['serial_number']}\"")
                if idata['sensor']:
                    print(f"          sensor:")
                    if idata['sensor']['brand']:
                        print(f"            brand: \"{idata['sensor']['brand']}\"")
                    if idata['sensor']['model']:
                        print(f"            model: \"{idata['sensor']['model']}\"")
                if idata['installation_notes']:
                    notes = idata['installation_notes'].replace('"', '\\"')
                    print(f"          installation_notes: \"{notes}\"")


if __name__ == '__main__':
    main()
