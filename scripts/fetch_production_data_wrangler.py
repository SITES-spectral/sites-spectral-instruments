#!/usr/bin/env python3
"""
Fetch production data from Cloudflare D1 database using wrangler and generate updated stations.yaml

This script uses wrangler CLI which must be authenticated (wrangler login).
No API token needed - uses your existing wrangler authentication.

Usage:
    python fetch_production_data_wrangler.py

Requirements:
    - wrangler CLI installed and authenticated (wrangler login)
    - pyyaml (pip install pyyaml)
"""

import subprocess
import json
import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import sys

# Database connection info
DATABASE_NAME = "spectral_stations_db"

class WranglerD1Fetcher:
    """Fetch data from Cloudflare D1 database using wrangler CLI"""

    def __init__(self, database_name: str):
        self.database_name = database_name

    def execute_query(self, query: str) -> List[Dict]:
        """Execute SQL query using wrangler d1 execute with remote flag"""
        try:
            # Clean up query: remove extra whitespace and newlines
            clean_query = ' '.join(query.split())

            # Use --remote flag to execute against production database
            cmd = [
                "wrangler",
                "d1",
                "execute",
                self.database_name,
                "--remote",
                "--command",
                clean_query,
                "--json"
            ]

            print(f"Executing query: {clean_query[:80]}...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
                cwd=str(Path(__file__).parent.parent)  # Run from project root
            )

            # Parse JSON output
            # Wrangler outputs informational text before JSON, extract just the JSON part
            stdout = result.stdout.strip()
            if not stdout:
                return []

            # Find the JSON array (starts with '[')
            json_start = stdout.find('[')
            if json_start == -1:
                print(f"No JSON found in output: {stdout[:200]}")
                return []

            json_str = stdout[json_start:]
            data = json.loads(json_str)

            # Extract results from wrangler JSON structure
            if isinstance(data, list) and len(data) > 0:
                if 'results' in data[0]:
                    return data[0]['results']
                elif 'data' in data[0]:
                    return data[0]['data']
                return data

            return []

        except subprocess.CalledProcessError as e:
            print(f"Error executing query: {e}")
            print(f"STDOUT: {e.stdout[:500]}")
            print(f"STDERR: {e.stderr[:500]}")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            print(f"Output was: {result.stdout[:200]}")
            return []

    def fetch_stations(self) -> List[Dict]:
        """Fetch all stations"""
        query = """
        SELECT id, display_name, acronym, normalized_name, latitude, longitude,
               elevation_m, status, country, description
        FROM stations
        ORDER BY display_name
        """
        return self.execute_query(query)

    def fetch_platforms(self, station_id: int) -> List[Dict]:
        """Fetch platforms for a station"""
        query = f"""
        SELECT id, display_name, normalized_name, location_code, mounting_structure,
               platform_height_m, status, deployment_date, description,
               operation_programs, latitude, longitude
        FROM platforms
        WHERE station_id = {station_id}
        ORDER BY location_code, display_name
        """
        return self.execute_query(query)

    def fetch_instruments(self, platform_id: int) -> List[Dict]:
        """Fetch instruments for a platform"""
        query = f"""
        SELECT id, display_name, normalized_name, instrument_type, instrument_number,
               ecosystem_code, status, instrument_height_m, viewing_direction, azimuth_degrees,
               latitude, longitude, description, installation_notes, maintenance_notes,
               camera_brand, camera_model, camera_resolution, camera_serial_number,
               first_measurement_year, last_measurement_year, measurement_status,
               deployment_date as instrument_deployment_date,
               degrees_from_nadir as instrument_degrees_from_nadir, legacy_acronym
        FROM instruments
        WHERE platform_id = {platform_id}
        ORDER BY instrument_number
        """
        return self.execute_query(query)

    def fetch_rois(self, instrument_id: int) -> List[Dict]:
        """Fetch ROIs for an instrument"""
        query = f"""
        SELECT id, roi_name, description, alpha, auto_generated,
               color_r, color_g, color_b, thickness, generated_date,
               source_image, points_json, updated_at
        FROM instrument_rois
        WHERE instrument_id = {instrument_id}
        ORDER BY roi_name
        """
        return self.execute_query(query)

class YAMLGenerator:
    """Generate stations.yaml from database data"""

    def __init__(self, fetcher: WranglerD1Fetcher):
        self.fetcher = fetcher

    def parse_json_field(self, value: Any) -> Any:
        """Parse JSON string field if needed"""
        if isinstance(value, str) and (value.startswith('[') or value.startswith('{')):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return value

    def parse_points(self, points_json: str) -> Optional[List[List[int]]]:
        """Parse ROI points JSON"""
        if not points_json:
            return None

        try:
            points = json.loads(points_json)
            if isinstance(points, list):
                return points
        except (json.JSONDecodeError, TypeError):
            pass

        return None

    def build_roi_dict(self, roi: Dict) -> Dict:
        """Build ROI dictionary from database record"""
        roi_dict = {}

        if roi.get('description'):
            roi_dict['description'] = roi['description']

        if roi.get('alpha') is not None:
            roi_dict['alpha'] = float(roi['alpha'])

        if roi.get('auto_generated'):
            roi_dict['auto_generated'] = True

        # Color
        if all(roi.get(f'color_{c}') is not None for c in ['r', 'g', 'b']):
            roi_dict['color'] = [
                int(roi['color_r']),
                int(roi['color_g']),
                int(roi['color_b'])
            ]

        # Points
        points = self.parse_points(roi.get('points_json'))
        if points:
            roi_dict['points'] = points

        if roi.get('thickness'):
            roi_dict['thickness'] = int(roi['thickness'])

        if roi.get('generated_date'):
            roi_dict['generated_date'] = roi['generated_date']

        if roi.get('source_image'):
            roi_dict['source_image'] = roi['source_image']

        if roi.get('comment'):
            roi_dict['comment'] = roi['comment']

        # Maintenance/processing fields
        if roi.get('roi_processing_enabled') is not None:
            roi_dict['processing_enabled'] = bool(roi['roi_processing_enabled'])

        if roi.get('vegetation_mask_path'):
            roi_dict['vegetation_mask_path'] = roi['vegetation_mask_path']

        if roi.get('last_processed_timestamp'):
            roi_dict['last_processed'] = roi['last_processed_timestamp']

        if roi.get('processing_status'):
            roi_dict['processing_status'] = roi['processing_status']

        if roi.get('updated_at'):
            # Extract date from timestamp
            updated = roi['updated_at'].split('T')[0] if 'T' in str(roi['updated_at']) else str(roi['updated_at'])
            roi_dict['updated'] = updated

        return roi_dict

    def build_instrument_dict(self, instrument: Dict, platform_id: int) -> Dict:
        """Build instrument dictionary from database record"""
        inst_dict = {
            'id': instrument['normalized_name'],
            'normalized_name': instrument['normalized_name'],
            'display_name': instrument['display_name'],
        }

        # Add optional fields
        if instrument.get('legacy_acronym'):
            inst_dict['legacy_acronym'] = instrument['legacy_acronym']

        inst_dict['instrument_type'] = instrument.get('instrument_type', 'phenocam')
        inst_dict['ecosystem_code'] = instrument.get('ecosystem_code', '')
        inst_dict['instrument_number'] = instrument.get('instrument_number', '')
        inst_dict['status'] = instrument.get('status', 'Active')

        if instrument.get('instrument_deployment_date'):
            inst_dict['instrument_deployment_date'] = instrument['instrument_deployment_date']

        if instrument.get('instrument_height_m') is not None:
            inst_dict['instrument_height_m'] = float(instrument['instrument_height_m'])

        if instrument.get('viewing_direction'):
            inst_dict['instrument_viewing_direction'] = instrument['viewing_direction']

        if instrument.get('azimuth_degrees') is not None:
            inst_dict['instrument_azimuth_degrees'] = float(instrument['azimuth_degrees'])

        if instrument.get('instrument_degrees_from_nadir') is not None:
            inst_dict['instrument_degrees_from_nadir'] = float(instrument['instrument_degrees_from_nadir'])

        # Camera specifications
        camera_specs = {}
        if instrument.get('camera_aperture'):
            camera_specs['aperture'] = instrument['camera_aperture']
        if instrument.get('camera_brand'):
            camera_specs['brand'] = instrument['camera_brand']
        if instrument.get('camera_exposure_time'):
            camera_specs['exposure_time'] = instrument['camera_exposure_time']
        if instrument.get('camera_focal_length_mm'):
            camera_specs['focal_length_mm'] = float(instrument['camera_focal_length_mm'])
        if instrument.get('camera_iso'):
            camera_specs['iso'] = instrument['camera_iso']
        if instrument.get('camera_lens'):
            camera_specs['lens'] = instrument['camera_lens']
        if instrument.get('camera_mega_pixels'):
            camera_specs['mega_pixels'] = instrument['camera_mega_pixels']
        if instrument.get('camera_model'):
            camera_specs['model'] = instrument['camera_model']
        if instrument.get('camera_resolution'):
            camera_specs['resolution'] = instrument['camera_resolution']
        if instrument.get('camera_serial_number'):
            camera_specs['serial_number'] = instrument['camera_serial_number']
        if instrument.get('camera_white_balance'):
            camera_specs['white_balance'] = instrument['camera_white_balance']

        if camera_specs:
            inst_dict['camera_specifications'] = camera_specs

        # Measurement timeline
        measurement_timeline = {}
        if instrument.get('first_measurement_year'):
            measurement_timeline['first_measurement_year'] = int(instrument['first_measurement_year'])
        if instrument.get('last_measurement_year'):
            measurement_timeline['last_measurement_year'] = int(instrument['last_measurement_year'])
        if instrument.get('measurement_status'):
            measurement_timeline['measurement_status'] = instrument['measurement_status']

        if measurement_timeline:
            inst_dict['measurement_timeline'] = measurement_timeline

        # Descriptions and notes
        if instrument.get('description'):
            inst_dict['description'] = instrument['description']
        if instrument.get('installation_notes'):
            inst_dict['installation_notes'] = instrument['installation_notes']
        if instrument.get('maintenance_notes'):
            inst_dict['maintenance_notes'] = instrument['maintenance_notes']

        # Maintenance parameters (NEW)
        maintenance = {}
        if instrument.get('calibration_date'):
            maintenance['calibration_date'] = instrument['calibration_date']
        if instrument.get('calibration_notes'):
            maintenance['calibration_notes'] = instrument['calibration_notes']
        if instrument.get('manufacturer_warranty_expires'):
            maintenance['warranty_expires'] = instrument['manufacturer_warranty_expires']
        if instrument.get('power_source'):
            maintenance['power_source'] = instrument['power_source']
        if instrument.get('data_transmission'):
            maintenance['data_transmission'] = instrument['data_transmission']
        if instrument.get('last_image_timestamp'):
            maintenance['last_image_timestamp'] = instrument['last_image_timestamp']
        if instrument.get('image_quality_score') is not None:
            maintenance['image_quality_score'] = float(instrument['image_quality_score'])
        if instrument.get('image_processing_enabled') is not None:
            maintenance['image_processing_enabled'] = bool(instrument['image_processing_enabled'])
        if instrument.get('image_archive_path'):
            maintenance['image_archive_path'] = instrument['image_archive_path']

        if maintenance:
            inst_dict['maintenance'] = maintenance

        # ROIs
        rois = self.fetcher.fetch_rois(instrument['id'])
        if rois:
            roi_dict = {}
            legacy_roi_dict = {}

            for roi in rois:
                roi_name = roi['roi_name']
                roi_data = self.build_roi_dict(roi)

                # Separate legacy ROIs
                if roi_data.get('comment', '').startswith('DEPRECATED'):
                    legacy_roi_dict[roi_name] = roi_data
                else:
                    roi_dict[roi_name] = roi_data

            if roi_dict:
                inst_dict['rois'] = roi_dict
            if legacy_roi_dict:
                inst_dict['legacy_phenocam_rois'] = legacy_roi_dict

        # Geolocation
        if instrument.get('latitude') is not None and instrument.get('longitude') is not None:
            inst_dict['geolocation'] = {
                'point': {
                    'epsg': instrument.get('epsg_code', 'epsg:4326'),
                    'latitude_dd': float(instrument['latitude']),
                    'longitude_dd': float(instrument['longitude'])
                }
            }

        return inst_dict

    def build_platform_dict(self, platform: Dict, station_id: int) -> Dict:
        """Build platform dictionary from database record"""
        plat_dict = {
            'id': platform['normalized_name'],
            'normalized_name': platform['normalized_name'],
            'display_name': platform['display_name'],
            'location_code': platform.get('location_code', ''),
        }

        # Operation programs
        if platform.get('operation_programs'):
            programs = self.parse_json_field(platform['operation_programs'])
            if programs and isinstance(programs, list):
                plat_dict['operation_programs'] = programs

        if platform.get('mounting_structure'):
            plat_dict['mounting_structure'] = platform['mounting_structure']

        if platform.get('platform_height_m') is not None:
            plat_dict['platform_height_m'] = float(platform['platform_height_m'])

        plat_dict['status'] = platform.get('status', 'Active')

        # elevation_m not in production database yet
        plat_dict['elevation_m'] = None

        if platform.get('deployment_date'):
            plat_dict['platform_deployment_date'] = platform['deployment_date']

        if platform.get('description'):
            plat_dict['description'] = platform['description']

        # Instruments
        instruments = self.fetcher.fetch_instruments(platform['id'])
        if instruments:
            phenocams_dict = {}
            for inst in instruments:
                inst_data = self.build_instrument_dict(inst, platform['id'])
                phenocams_dict[inst_data['id']] = inst_data

            if phenocams_dict:
                plat_dict['instruments'] = {'phenocams': phenocams_dict}

        # Geolocation
        if platform.get('latitude') is not None and platform.get('longitude') is not None:
            plat_dict['geolocation'] = {
                'point': {
                    'epsg': platform.get('epsg_code', 'epsg:4326'),
                    'latitude_dd': float(platform['latitude']),
                    'longitude_dd': float(platform['longitude'])
                }
            }

        return plat_dict

    def build_station_dict(self, station: Dict) -> Dict:
        """Build station dictionary from database record"""
        station_dict = {
            'id': station['acronym'],
            'normalized_name': station['normalized_name'],
            'display_name': station['display_name'],
            'acronym': station['acronym'],
            'status': station.get('status', 'Active'),
            'country': station.get('country', 'Sweden'),
        }

        if station.get('elevation_m') is not None:
            station_dict['elevation_m'] = float(station['elevation_m'])

        if station.get('description'):
            station_dict['description'] = station['description']

        # Platforms
        platforms = self.fetcher.fetch_platforms(station['id'])
        if platforms:
            platforms_dict = {}
            for plat in platforms:
                plat_data = self.build_platform_dict(plat, station['id'])
                platforms_dict[plat_data['id']] = plat_data

            if platforms_dict:
                station_dict['platforms'] = platforms_dict

        # Geolocation
        if station.get('latitude') is not None and station.get('longitude') is not None:
            station_dict['geolocation'] = {
                'point': {
                    'epsg': station.get('epsg_code', 'epsg:4326'),
                    'latitude_dd': float(station['latitude']),
                    'longitude_dd': float(station['longitude'])
                }
            }

        return station_dict

    def generate_yaml(self) -> Optional[Dict]:
        """Generate complete stations YAML structure"""
        # Fetch all stations
        stations = self.fetcher.fetch_stations()

        if not stations:
            print("No stations found in database!")
            return None

        print(f"Found {len(stations)} stations\n")

        # Build YAML structure
        yaml_data = {
            'stations': {}
        }

        for station in stations:
            print(f"Processing station: {station['display_name']}")
            station_dict = self.build_station_dict(station)
            yaml_data['stations'][station['normalized_name']] = station_dict

        return yaml_data

    def save_yaml(self, data: Dict, output_path: Path):
        """Save YAML data to file with proper formatting"""
        # Add header comment
        header = f"""# YAML 1.1
# Regularly review and update the information to ensure accuracy.
# Last updated: {datetime.now().strftime('%Y-%m-%d')}
# Generated by SITES Spectral @ Lunds University - spectral-stations-instruments tool
# Version: {datetime.now().strftime('%Y.%-m.%-d.1')} - Synced from production Cloudflare D1 database
"""

        # Convert to YAML
        yaml_str = yaml.dump(
            data,
            default_flow_style=False,
            sort_keys=False,
            allow_unicode=True,
            width=120
        )

        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(header)
            f.write(yaml_str)

        print(f"\n✓ Successfully saved YAML to: {output_path}")

def main():
    """Main execution"""
    print("="*80)
    print("SITES Spectral - Production Data Fetch (Wrangler)")
    print("="*80)
    print()

    # Check if wrangler is available and authenticated
    try:
        result = subprocess.run(
            ['wrangler', 'whoami'],
            capture_output=True,
            text=True,
            check=False
        )
        if result.returncode != 0 or 'logged in' not in result.stdout.lower():
            print("ERROR: Wrangler not authenticated!")
            print("Please run: wrangler login")
            sys.exit(1)

        print("✓ Wrangler authenticated\n")

    except FileNotFoundError:
        print("ERROR: Wrangler CLI not found!")
        print("Please install wrangler: npm install -g wrangler")
        sys.exit(1)

    # Initialize fetcher
    fetcher = WranglerD1Fetcher(DATABASE_NAME)

    # Initialize generator
    generator = YAMLGenerator(fetcher)

    # Generate YAML structure
    print("Fetching data from Cloudflare D1 production database...")
    print()
    yaml_data = generator.generate_yaml()

    if not yaml_data:
        print("\nFailed to generate YAML data!")
        sys.exit(1)

    # Create output directory
    output_dir = Path(__file__).parent.parent / "yamls"
    output_dir.mkdir(exist_ok=True)

    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = output_dir / f"stations_production_{timestamp}.yaml"

    # Save YAML
    generator.save_yaml(yaml_data, output_file)

    # Also save as latest
    latest_file = output_dir / "stations_latest_production.yaml"
    generator.save_yaml(yaml_data, latest_file)

    print()
    print("="*80)
    print("✓ Production data fetch completed successfully!")
    print(f"  • Timestamped: {output_file.name}")
    print(f"  • Latest: {latest_file.name}")
    print(f"  • Location: {output_dir}")
    print("="*80)

if __name__ == "__main__":
    main()
