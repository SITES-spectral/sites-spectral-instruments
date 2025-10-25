#!/usr/bin/env python3
"""
Fetch production data from Cloudflare D1 database via API and generate updated stations.yaml

This script:
1. Queries the Cloudflare D1 production database using the REST API
2. Fetches all stations, platforms, instruments, ROIs, and maintenance logs
3. Maps the database schema to the stations.yaml structure
4. Generates an updated stations.yaml file with all production data
5. Adds maintenance parameters to all instruments

Usage:
    python fetch_production_data_api.py

Requirements:
    - Cloudflare API credentials (account ID and API token)
    - requests library (pip install requests)
"""

import requests
import json
import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import sys
import os

# Database connection info
ACCOUNT_ID = "e5f93ed83288202d33cf9c7b18068f64"
DATABASE_ID = "2a6e433a-db6e-4b75-bba3-eb7e59363e1d"

# API endpoints
API_BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}"

class CloudflareD1APIFetcher:
    """Fetch data from Cloudflare D1 database via API"""

    def __init__(self, account_id: str, database_id: str, api_token: str):
        self.account_id = account_id
        self.database_id = database_id
        self.api_token = api_token
        self.api_base = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

    def execute_query(self, query: str) -> List[Dict]:
        """Execute SQL query via Cloudflare D1 API"""
        try:
            url = f"{self.api_base}/query"
            payload = {
                "sql": query
            }

            print(f"Executing query: {query[:100]}...")
            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code != 200:
                print(f"API Error: {response.status_code}")
                print(f"Response: {response.text}")
                return []

            data = response.json()

            # Extract results from API response
            if data.get('success') and 'result' in data:
                result = data['result']
                if isinstance(result, list) and len(result) > 0:
                    # First item contains the query results
                    if 'results' in result[0]:
                        return result[0]['results']
                    return result[0].get('rows', [])

            return []

        except requests.RequestException as e:
            print(f"Error executing query: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return []

    def fetch_stations(self) -> List[Dict]:
        """Fetch all stations"""
        query = """
        SELECT id, display_name, acronym, normalized_name, latitude, longitude,
               elevation_m, status, country, description, epsg_code, created_at, updated_at
        FROM stations
        ORDER BY display_name
        """
        return self.execute_query(query)

    def fetch_platforms(self, station_id: int) -> List[Dict]:
        """Fetch platforms for a station"""
        query = f"""
        SELECT id, display_name, normalized_name, location_code, mounting_structure,
               platform_height_m, status, elevation_m, deployment_date, description,
               research_programs, latitude, longitude, epsg_code, created_at, updated_at
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
               instrument_deployment_date, instrument_degrees_from_nadir, legacy_acronym,
               camera_aperture, camera_exposure_time, camera_focal_length_mm, camera_iso,
               camera_lens, camera_mega_pixels, camera_white_balance, epsg_code,
               calibration_date, calibration_notes, manufacturer_warranty_expires,
               power_source, data_transmission, image_processing_enabled, image_archive_path,
               last_image_timestamp, image_quality_score, created_at, updated_at
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
               source_image, points_json, comment, roi_processing_enabled,
               vegetation_mask_path, last_processed_timestamp, processing_status,
               created_at, updated_at
        FROM instrument_rois
        WHERE instrument_id = {instrument_id}
        ORDER BY roi_name
        """
        return self.execute_query(query)

class YAMLGenerator:
    """Generate stations.yaml from database data"""

    def __init__(self, fetcher: CloudflareD1APIFetcher):
        self.fetcher = fetcher

    def parse_json_field(self, value: Any) -> Any:
        """Parse JSON string field if needed"""
        if isinstance(value, str) and (value.startswith('[') or value.startswith('{')):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return value

    def parse_points(self, points_json: str) -> List[List[int]]:
        """Parse ROI points JSON"""
        if not points_json:
            return None

        try:
            points = json.loads(points_json)
            if isinstance(points, list):
                return points
        except json.JSONDecodeError:
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
            updated = roi['updated_at'].split('T')[0] if 'T' in roi['updated_at'] else roi['updated_at']
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
        if platform.get('research_programs'):
            programs = self.parse_json_field(platform['research_programs'])
            if programs and isinstance(programs, list):
                plat_dict['operation_programs'] = programs

        if platform.get('mounting_structure'):
            plat_dict['mounting_structure'] = platform['mounting_structure']

        if platform.get('platform_height_m') is not None:
            plat_dict['platform_height_m'] = float(platform['platform_height_m'])

        plat_dict['status'] = platform.get('status', 'Active')

        if platform.get('elevation_m') is not None:
            plat_dict['elevation_m'] = float(platform['elevation_m'])

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

    def generate_yaml(self) -> Dict:
        """Generate complete stations YAML structure"""
        # Fetch all stations
        stations = self.fetcher.fetch_stations()

        if not stations:
            print("No stations found in database!")
            return None

        print(f"Found {len(stations)} stations")

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

        print(f"\nSuccessfully saved YAML to: {output_path}")

def main():
    """Main execution"""
    print("="*80)
    print("SITES Spectral - Production Data Fetch from Cloudflare D1 (API)")
    print("="*80)
    print()

    # Get API token from environment (optional, wrangler may handle auth)
    api_token = os.getenv('CLOUDFLARE_API_TOKEN')

    # Check if wrangler is authenticated as fallback
    if not api_token:
        print("No CLOUDFLARE_API_TOKEN found, checking wrangler authentication...")
        try:
            result = subprocess.run(
                ['wrangler', 'whoami'],
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode == 0 and 'logged in' in result.stdout.lower():
                print("✓ Wrangler is authenticated")
                print("Note: Using wrangler CLI authentication instead of API token")
                print()
                # Use wrangler d1 execute instead of direct API
                use_wrangler_cli()
                return
            else:
                print("ERROR: No authentication found!")
                print("Please either:")
                print("  1. Set CLOUDFLARE_API_TOKEN: export CLOUDFLARE_API_TOKEN='your-token'")
                print("  2. Login with wrangler: wrangler login")
                sys.exit(1)
        except FileNotFoundError:
            print("ERROR: Neither CLOUDFLARE_API_TOKEN nor wrangler CLI found!")
            sys.exit(1)

    # Initialize fetcher with API token
    fetcher = CloudflareD1APIFetcher(ACCOUNT_ID, DATABASE_ID, api_token)

    # Initialize generator
    generator = YAMLGenerator(fetcher)

    # Generate YAML structure
    print("Fetching data from Cloudflare D1 database via API...")
    yaml_data = generator.generate_yaml()

    if not yaml_data:
        print("Failed to generate YAML data!")
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
    print("Production data fetch completed successfully!")
    print(f"Files saved to: {output_dir}")
    print("="*80)

if __name__ == "__main__":
    main()
