#!/usr/bin/env python3
"""
Process Svartberget metadata from Excel CSV and generate YAML instrument entries.
"""

import csv
import yaml
from collections import defaultdict
from datetime import datetime

# Platform mapping (P01 -> PL01 autocorrect)
PLATFORM_MAP = {
    'SVB_FOR_P01': 'SVB_FOR_PL01',
    'SVB_FOR_P02': 'SVB_FOR_PL02',
    'SVB_FOR_P03': 'SVB_FOR_PL03',
    'SVB_MIR_P01': 'SVB_MIR_PL01',
    'SVB_MIR_P02': 'SVB_MIR_PL02',
    'SVB_MIR_P03': 'SVB_MIR_PL03',
    'SVB_MIR_P04': 'SVB_MIR_PL04',
}

# Known phenocams to skip (already in database)
EXISTING_PHENOCAMS = ['SVB_MIR_PL01_PHE01', 'SVB_MIR_PL01_PHE02', 'SVB_MIR_PL02_PHE01']

def parse_wavelength(wl_str):
    """Parse wavelength, handling ranges and various formats."""
    if not wl_str or wl_str == '':
        return None

    wl_str = str(wl_str).strip()

    # Handle ranges (use lower end as instructed)
    if '-' in wl_str and not wl_str.startswith('-'):
        parts = wl_str.split('-')
        try:
            return int(float(parts[0]))
        except:
            return None

    # Handle single values
    try:
        return int(float(wl_str))
    except:
        return None

def parse_bandwidth(bw_str):
    """Parse bandwidth value."""
    if not bw_str or bw_str == '':
        return None

    try:
        return float(bw_str)
    except:
        return None

def determine_status(comments):
    """Determine instrument status from comments."""
    if not comments:
        return 'Active'

    comments_lower = comments.lower()

    if 'removed' in comments_lower or 'dismounted' in comments_lower:
        return 'Removed'
    elif 'not installed' in comments_lower or 'not installed yet' in comments_lower:
        return 'Pending Installation'
    elif 'stopped working' in comments_lower:
        return 'Inactive'
    elif 'calibrated' in comments_lower and 'not installed' not in comments_lower:
        return 'Active'
    elif 'old' in comments_lower:
        return 'Inactive'
    else:
        return 'Active'

def classify_wavelength(wl):
    """Classify wavelength into band type."""
    if wl is None:
        return 'Unknown'

    if 400 <= wl < 500:
        return 'Blue'
    elif 500 <= wl < 600:
        return 'Green'
    elif 600 <= wl < 700:
        return 'Red'
    elif 700 <= wl < 750:
        return 'Far-Red'
    elif 750 <= wl <= 1000:
        return 'NIR'
    elif 1500 <= wl <= 1700:
        return 'SWIR'
    else:
        return 'Custom'

def generate_channel_name(band_type, wavelength, bandwidth):
    """Generate channel name following convention."""
    if bandwidth:
        notation = f"NW{int(bandwidth)}nm"
    else:
        notation = "NB"  # Narrowband (unknown width)

    return f"{band_type.upper()}{wavelength}nm_{notation}"

def process_csv():
    """Process the CSV file and group instruments."""
    instruments_by_platform = defaultdict(lambda: defaultdict(list))

    # Try different encodings (degree symbol issues)
    for encoding in ['utf-8', 'latin-1', 'windows-1252', 'iso-8859-1']:
        try:
            with open('/tmp/metadata shared.csv', 'r', encoding=encoding) as f:
                reader = csv.DictReader(f)
                return process_csv_with_reader(reader)
        except UnicodeDecodeError:
            continue

    raise ValueError("Could not decode CSV file with any known encoding")

def process_csv_with_reader(reader):
    """Process CSV with given reader."""
    instruments_by_platform = defaultdict(lambda: defaultdict(list))

    for row in reader:
        site = row.get('Site', '').strip()
        platform_raw = row.get('Platform', '').strip()
        location = row.get('Location', '').strip()
        legacy_name = row.get('legacy name', '').strip()
        param_names = row.get('Parameter names', '').strip()
        center_wl_str = row.get('Centre wavelength (nm)', '').strip()
        bandwidth_str = row.get('Bandwith (nm)', '').strip()  # Note: typo in original
        brand = row.get('Brand', '').strip()
        model = row.get('Model', '').strip()
        serial = row.get('Serial number', '').strip()
        cable_length = row.get('Cable length (m)', '').strip()
        lat = row.get('Lat (�)', '').strip()  # Note: encoding issue with degree symbol
        lon = row.get('Long (�)', '').strip()
        height = row.get('Height (m)', '').strip()
        usage_type = row.get('Usage', '').strip()
        azimuth = row.get('Azimuth (�)', '').strip()
        from_nadir = row.get('From nadir (�)', '').strip()
        fov = row.get('Field of View (�)', '').strip()
        comments = row.get('Comments', '').strip()
        last_calib = row.get('Last calib', '').strip()

        # Skip empty rows or non-SVB sites
        # Note: Degerö is part of Svartberget (mire ecosystem)
        if not site or (site != 'Svartberget' and not site.startswith('Deger')):
            continue

        # Auto-correct platform naming
        platform = PLATFORM_MAP.get(platform_raw, platform_raw)
        if not platform:
            continue

        # Parse wavelength and bandwidth
        center_wl = parse_wavelength(center_wl_str)
        bandwidth = parse_bandwidth(bandwidth_str)

        # Determine instrument type
        if brand == 'Mobotix' or brand == 'Stardot':
            instrument_type = 'phenocam'
        elif brand == 'Licor' or usage_type == 'PAR':
            instrument_type = 'par_sensor'
        elif center_wl is not None:
            instrument_type = 'multispectral_sensor'
        else:
            continue

        # Create unique key for grouping
        # Instruments with same platform, location, brand, model, serial form one instrument
        key = f"{platform}|{location}|{brand}|{model}|{serial}"

        # Store row data
        row_data = {
            'platform': platform,
            'location': location,
            'legacy_name': legacy_name,
            'param_names': param_names,
            'center_wl': center_wl,
            'bandwidth': bandwidth,
            'brand': brand,
            'model': model,
            'serial': serial,
            'cable_length': cable_length,
            'lat': lat,
            'lon': lon,
            'height': height,
            'usage_type': usage_type,
            'azimuth': azimuth,
            'from_nadir': from_nadir,
            'fov': fov,
            'comments': comments,
            'last_calib': last_calib,
            'instrument_type': instrument_type,
            'status': determine_status(comments)
        }

        instruments_by_platform[platform][key].append(row_data)

    return instruments_by_platform

def generate_yaml_instruments(instruments_by_platform):
    """Generate YAML structures for instruments."""
    output = {}

    for platform, instruments in instruments_by_platform.items():
        platform_instruments = {
            'phenocams': {},
            'multispectral_sensors': {},
            'par_sensors': {}
        }

        for key, rows in instruments.items():
            # Use first row for common metadata
            first = rows[0]
            instrument_type = first['instrument_type']

            # Generate normalized name
            if instrument_type == 'phenocam':
                # Check if already exists
                potential_name = f"{platform}_PHE01"
                if potential_name in EXISTING_PHENOCAMS:
                    print(f"⏭️  Skipping existing phenocam: {potential_name}")
                    continue

                normalized_name = potential_name
                display_name = f"{platform.replace('_', ' ')} Phenocam"

            elif instrument_type == 'multispectral_sensor':
                # Count channels
                num_channels = len([r for r in rows if r['center_wl'] is not None])

                # Determine sensor number (MS01, MS02, etc.)
                ms_num = 1  # Simplified - would need to check existing instruments
                normalized_name = f"{platform}_{first['brand'].upper()}_MS{ms_num:02d}_NB{num_channels:02d}"
                display_name = f"{platform.replace('_', ' ')} {first['brand']} MS Sensor {ms_num}"

            elif instrument_type == 'par_sensor':
                # PAR sensors
                par_num = 1
                if first['brand']:
                    normalized_name = f"{platform}_{first['brand'].upper()}_PAR{par_num:02d}"
                    display_name = f"{platform.replace('_', ' ')} {first['brand']} PAR"
                else:
                    normalized_name = f"{platform}_PAR{par_num:02d}"
                    display_name = f"{platform.replace('_', ' ')} PAR Sensor"

            # Build instrument object
            instrument = {
                'id': normalized_name,
                'normalized_name': normalized_name,
                'display_name': display_name,
                'instrument_type': instrument_type.replace('_', ' ').title(),
                'status': first['status']
            }

            # Add legacy acronym if present
            if first['legacy_name']:
                instrument['legacy_acronym'] = first['legacy_name']

            # Add common fields
            if first['height']:
                try:
                    instrument['instrument_height_m'] = float(first['height'])
                except:
                    pass

            if first['azimuth']:
                try:
                    instrument['instrument_azimuth_degrees'] = float(first['azimuth'])
                except:
                    pass

            if first['from_nadir']:
                try:
                    instrument['instrument_degrees_from_nadir'] = float(first['from_nadir'])
                except:
                    pass

            if first['fov']:
                try:
                    instrument['field_of_view_degrees'] = float(first['fov'])
                except:
                    pass

            # Add specifications based on type
            if instrument_type == 'phenocam':
                instrument['camera_specifications'] = {
                    'brand': first['brand'],
                    'model': first['model']
                }
                if first['serial']:
                    instrument['camera_specifications']['serial_number'] = first['serial']

            elif instrument_type == 'multispectral_sensor':
                instrument['sensor_specifications'] = {
                    'brand': first['brand'],
                    'model': first['model'],
                    'number_of_channels': len([r for r in rows if r['center_wl'] is not None])
                }
                if first['serial']:
                    instrument['sensor_specifications']['serial_number'] = first['serial']
                if first['cable_length']:
                    try:
                        instrument['sensor_specifications']['cable_length_m'] = float(first['cable_length'])
                    except:
                        pass

                # Add channels
                channels = []
                for i, row in enumerate(rows):
                    if row['center_wl'] is not None:
                        band_type = classify_wavelength(row['center_wl'])
                        channel = {
                            'channel_number': i + 1,
                            'channel_name': generate_channel_name(band_type, row['center_wl'], row['bandwidth']),
                            'center_wavelength_nm': row['center_wl'],
                            'band_type': band_type
                        }
                        if row['bandwidth']:
                            channel['bandwidth_nm'] = row['bandwidth']
                        if row['param_names']:
                            channel['legacy_parameter_name'] = row['param_names']

                        channels.append(channel)

                instrument['spectral_channels'] = channels

            elif instrument_type == 'par_sensor':
                instrument['sensor_specifications'] = {
                    'brand': first['brand'] if first['brand'] else 'Generic',
                    'model': first['model'] if first['model'] else 'PAR Sensor',
                    'wavelength_range': '400-700nm'
                }

            # Add geolocation if available
            if first['lat'] and first['lon']:
                try:
                    lat_val = float(first['lat'])
                    lon_val = float(first['lon'])
                    instrument['geolocation'] = {
                        'point': {
                            'epsg': 'epsg:4326',
                            'latitude_dd': lat_val,
                            'longitude_dd': lon_val
                        }
                    }
                except:
                    pass

            # Add comments/notes
            if first['comments']:
                instrument['installation_notes'] = first['comments']

            if first['last_calib']:
                instrument['calibration_date'] = first['last_calib']

            # Add to appropriate category
            if instrument_type == 'phenocam':
                platform_instruments['phenocams'][normalized_name] = instrument
            elif instrument_type == 'multispectral_sensor':
                platform_instruments['multispectral_sensors'][normalized_name] = instrument
            elif instrument_type == 'par_sensor':
                platform_instruments['par_sensors'][normalized_name] = instrument

        output[platform] = platform_instruments

    return output

# Main execution
if __name__ == '__main__':
    print("🔄 Processing Svartberget instruments from CSV...")

    instruments_by_platform = process_csv()

    print(f"\n📊 Found {len(instruments_by_platform)} platforms with instruments")
    for platform, instruments in instruments_by_platform.items():
        print(f"  {platform}: {len(instruments)} unique instruments")

    print("\n🏗️  Generating YAML structures...")
    yaml_output = generate_yaml_instruments(instruments_by_platform)

    # Write to file
    output_file = '/tmp/svb_instruments_generated.yaml'
    with open(output_file, 'w', encoding='utf-8') as f:
        yaml.dump(yaml_output, f, default_flow_style=False, sort_keys=False, allow_unicode=True)

    print(f"\n✅ Generated YAML written to: {output_file}")
    print("\nℹ️  Next steps:")
    print("  1. Review the generated YAML")
    print("  2. Manually integrate into stations_latest_production.yaml")
    print("  3. Adjust instrument numbers (MS01, MS02, PAR01, etc.) as needed")
