# Production Data Sync - Quick Start Guide

> [!info] Overview
> This guide explains how to sync production data from the Cloudflare D1 database to generate updated `stations.yaml` files with the latest information from all SITES stations.

---

## 🎯 What Does It Do?

The production sync tool connects to the live Cloudflare D1 database and retrieves:

- ✅ **9 SITES Stations** with current status and coordinates
- ✅ **All Platforms** with deployment dates and research programs
- ✅ **All Instruments** (phenocams) with camera specifications
- ✅ **ROI Polygons** with coordinates and metadata
- ✅ **Maintenance Information** (when available in database)

---

## 🚀 Quick Start

### Prerequisites

> [!warning] Requirements
> - **Wrangler CLI** authenticated (`wrangler login`)
> - **uv** package manager installed
> - **Python 3.12.9** (managed by uv)

### Run the Sync

```bash
cd /home/jobelund/lu2024-12-46/SITES/Spectral/apps/sites-spectral-instruments
./scripts/sync_production_yaml.sh
```

> [!success] That's it!
> The script will automatically:
> 1. Check wrangler authentication
> 2. Create/activate Python 3.12.9 virtual environment
> 3. Install dependencies with `uv pip`
> 4. Fetch all production data
> 5. Generate timestamped YAML files

---

## 📂 Output Files

### Generated Files

```
yamls/
├── stations_latest_production.yaml          # ← Always latest version
├── stations_production_20251002_185119.yaml # Timestamped backup
├── stations_production_20251001_094433.yaml # Previous sync
└── ... (historical backups)
```

> [!tip] Use Latest File
> Always use `stations_latest_production.yaml` for the most recent production data.

---

## 📖 What's Included in the YAML?

### Station Level
```yaml
stations:
  lonnstorp:
    id: LON
    normalized_name: lonnstorp
    display_name: Lönnstorp
    status: Active
    country: Sweden
    elevation_m: null
    geolocation:
      point:
        epsg: epsg:4326
        latitude_dd: 55.669
        longitude_dd: 13.110
```

### Platform Level
```yaml
platforms:
  LON_AGR_TWR01:
    display_name: Lönnstorp Agriculture Tower 01
    operation_programs:
      - SLU
      - SITES
      - ICOS
    mounting_structure: Tower
    platform_height_m: 10.0
    status: Active
```

### Instrument Level
```yaml
instruments:
  phenocams:
    LON_AGR_TWR01_PHE01:
      display_name: Lönnstorp Agriculture Tower 01 Phenocam 01
      instrument_type: phenocam
      ecosystem_code: AGR
      status: Active
      camera_specifications:
        brand: Mobotix
        model: Mobotix M16 IP
        resolution: 3072x2048
      measurement_timeline:
        first_measurement_year: 2018
        last_measurement_year: 2025
```

### ROI Level
```yaml
rois:
  ROI_00:
    description: Full image excluding sky (auto-calculated)
    alpha: 0.0
    auto_generated: true
    color: [255, 255, 255]
    points:
      - [10, 340]
      - [3062, 340]
      - [3062, 2038]
      - [10, 2038]
    thickness: 7
    updated: '2025-09-20 19:22:20'
```

---

## 🔧 Manual Python Script

If you prefer to run the Python script directly:

```bash
cd /home/jobelund/lu2024-12-46/SITES/Spectral/apps/sites-spectral-instruments
source .venv/bin/activate
python3 scripts/fetch_production_data_wrangler.py
```

> [!info] Virtual Environment
> The script uses a local `.venv` with Python 3.12.9 and PyYAML 6.0.3

---

## 🔄 Automation

### Daily Auto-Sync with Cron

Add to your crontab (`crontab -e`):

```bash
# Sync production data daily at 2 AM
0 2 * * * cd /home/jobelund/lu2024-12-46/SITES/Spectral/apps/sites-spectral-instruments && ./scripts/sync_production_yaml.sh >> logs/sync.log 2>&1
```

### Weekly Sync

```bash
# Sync every Sunday at 3 AM
0 3 * * 0 cd /home/jobelund/lu2024-12-46/SITES/Spectral/apps/sites-spectral-instruments && ./scripts/sync_production_yaml.sh >> logs/sync.log 2>&1
```

---

## 🗂️ File Structure

```
sites-spectral-instruments/
├── scripts/
│   ├── sync_production_yaml.sh           # Automated wrapper script
│   ├── fetch_production_data_wrangler.py # Main Python script
│   ├── fetch_production_data_api.py      # API version (optional)
│   ├── README.md                         # Detailed documentation
│   └── .env.example                      # Credentials template
├── yamls/
│   ├── stations_latest_production.yaml   # Latest sync
│   └── stations_production_*.yaml        # Timestamped backups
├── .venv/                                # Python 3.12.9 virtual environment
└── docs/
    └── PRODUCTION_DATA_SYNC.md           # This guide
```

---

## 📊 Database Schema Mapping

> [!note] Schema Reference
> The sync script uses the complete mapping documented in `YAML_to_Database_Mapping.md`

| YAML Structure | Database Table | Notes |
|----------------|----------------|-------|
| `stations` | `stations` | 9 SITES research stations |
| `platforms` | `platforms` | Phenocam mounting platforms |
| `instruments` | `instruments` | Camera equipment and specs |
| `rois` | `instrument_rois` | Region of Interest polygons |

### Key Field Mappings

- `operation_programs` ← `platforms.operation_programs` (JSON array)
- `camera_specifications` ← Multiple `instruments.camera_*` fields
- `measurement_timeline` ← `instruments.first/last_measurement_year`
- `rois.points` ← `instrument_rois.points_json` (polygon coordinates)

---

## ❓ Troubleshooting

### Error: "Wrangler not authenticated"

```bash
wrangler login
```

### Error: "uv is not installed"

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Error: "No module named 'yaml'"

The script should auto-install dependencies, but you can manually install:

```bash
source .venv/bin/activate
uv pip install pyyaml
```

### Check Wrangler Status

```bash
wrangler whoami
```

Should show:
```
👋 You are logged in with an OAuth Token
```

---

## 📝 What's Different from Original stations.yaml?

> [!tip] Production Updates
> The synced YAML includes real-time updates made by station managers through the web interface.

### User-Modified Data

1. **Status Changes** - Instruments and platforms with updated operational status
2. **New Equipment** - Recently added cameras and platforms
3. **ROI Updates** - Modified polygon coordinates from user adjustments
4. **Deployment Dates** - Actual deployment information
5. **Research Programs** - Current research affiliations

### Fields Not Yet in Production DB

> [!warning] Missing Fields
> Some fields from the original YAML aren't in the production database yet:
> - `elevation_m` (platforms)
> - Advanced maintenance parameters (being added gradually)
> - Some camera specifications (aperture, ISO, focal length)

These will automatically appear in future syncs once added to the database.

---

## 🔗 Related Documentation

- [[YAML_to_Database_Mapping|Database Schema Mapping]]
- [[scripts/README|Scripts README]]
- [[PRODUCTION_SYNC_GUIDE|Quick Start Guide]]
- `wrangler.toml` - Database configuration

---

## 👨‍💻 Script Details

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Python | 3.12.9 |
| Package Manager | uv | latest |
| Database | Cloudflare D1 | Production |
| CLI Tool | Wrangler | 4.35.0+ |
| Format | YAML | 1.1 |

### Dependencies

- **PyYAML 6.0.3** - YAML parsing and generation
- **Wrangler CLI** - Cloudflare D1 database access

---

## 📅 Version History

| Date | Version | Description |
|------|---------|-------------|
| 2025-10-02 | 1.0.0 | Initial production sync implementation |
| 2025-10-02 | 1.1.0 | Added uv and Python 3.12.9 support |

---

## 💡 Tips & Best Practices

> [!tip] Regular Syncs
> Run the sync weekly to keep your local YAML files up-to-date with production changes.

> [!tip] Version Control
> Timestamped files allow you to track changes over time and revert if needed.

> [!tip] Comparison
> Use `diff` to see what changed between syncs:
> ```bash
> diff yamls/stations_production_20251001_*.yaml yamls/stations_production_20251002_*.yaml
> ```

> [!success] Automation
> Set up automated syncs with cron for hands-free updates.

---

## 📞 Support

For issues or questions:
1. Check `scripts/README.md` for detailed documentation
2. Review `YAML_to_Database_Mapping.md` for schema details
3. Verify wrangler authentication: `wrangler whoami`

---

> [!abstract] Summary
> The production data sync provides an automated way to keep your stations.yaml files synchronized with the live Cloudflare database, ensuring you always have the latest station, platform, instrument, and ROI information at your fingertips.

**Last Updated:** 2025-10-02
**Maintained By:** SITES Spectral @ Lunds University
