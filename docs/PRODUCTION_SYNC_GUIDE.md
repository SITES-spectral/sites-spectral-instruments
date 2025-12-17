# Production Data Sync Guide

## Quick Start

### 1. Setup Credentials

Create a `.env` file with your Cloudflare API token:

```bash
cd /home/jobelund/lu2024-12-46/SITES/Spectral/apps/sites-spectral-instruments
cp scripts/.env.example .env
# Edit .env and add your CLOUDFLARE_API_TOKEN
```

Or export it directly:

```bash
export CLOUDFLARE_API_TOKEN="your-token-here"
```

### 2. Run the Sync

```bash
./scripts/sync_production_yaml.sh
```

### 3. Check the Output

```bash
ls -lht yamls/stations_production_*.yaml | head -5
cat yamls/stations_latest_production.yaml
```

## What Does It Do?

This sync process:

1. **Connects** to your production Cloudflare D1 database
2. **Fetches** all current data:
   - Stations with updated coordinates and status
   - Platforms with research programs
   - Instruments with all camera specifications
   - ROIs with user modifications
   - **Maintenance logs and parameters** (NEW!)
3. **Generates** a properly formatted `stations.yaml` file
4. **Preserves** the original YAML structure and naming
5. **Adds** maintenance fields to every instrument:
   - Calibration dates and notes
   - Warranty information
   - Power source and data transmission
   - Image processing status
   - Quality scores and timestamps

## Output Structure

```
yamls/
├── stations_production_20251002_143522.yaml  ← Timestamped backup
├── stations_production_20251001_094433.yaml  ← Previous sync
└── stations_latest_production.yaml           ← Always latest (use this!)
```

## New Maintenance Fields

Each instrument now includes:

```yaml
instruments:
  phenocams:
    LON_AGR_TWR01_PHE01:
      # ... existing fields ...
      maintenance:
        calibration_date: "2025-05-15"
        calibration_notes: "Annual calibration completed"
        warranty_expires: "2026-12-31"
        power_source: "Solar+Battery"
        data_transmission: "LoRaWAN"
        last_image_timestamp: "2025-10-02T14:35:22Z"
        image_quality_score: 0.95
        image_processing_enabled: true
        image_archive_path: "/data/archive/lon_agr_twr01_phe01"
```

## Comparing Changes

To see what changed since last sync:

```bash
# Compare with original
diff .secure/stations.yaml yamls/stations_latest_production.yaml

# Compare two syncs
diff yamls/stations_production_20251001_*.yaml yamls/stations_production_20251002_*.yaml
```

## Automation

### Daily Auto-Sync

Add to crontab:

```bash
crontab -e
```

Then add:

```cron
# Sync production data daily at 2 AM
0 2 * * * cd /home/jobelund/lu2024-12-46/SITES/Spectral/apps/sites-spectral-instruments && ./scripts/sync_production_yaml.sh >> logs/sync.log 2>&1
```

### Auto-Commit to Git

```bash
#!/bin/bash
cd /home/jobelund/lu2024-12-46/SITES/Spectral/apps/sites-spectral-instruments
./scripts/sync_production_yaml.sh

if [ $? -eq 0 ]; then
    git add yamls/stations_latest_production.yaml
    git commit -m "chore: sync production data $(date +%Y-%m-%d)"
    git push
fi
```

## Troubleshooting

### "API Token not found"

```bash
# Check if token is set
echo $CLOUDFLARE_API_TOKEN

# Set it
export CLOUDFLARE_API_TOKEN="your-token"

# Or create .env file
echo "CLOUDFLARE_API_TOKEN=your-token" > .env
```

### "No module named 'requests'"

```bash
pip install requests pyyaml
# or
python3 -m pip install --user requests pyyaml
```

### "No stations found"

Check:
1. API token has D1 read permissions
2. Account ID and Database ID are correct (in script)
3. Network connectivity to Cloudflare API

## Files Created

| File | Purpose |
|------|---------|
| `scripts/fetch_production_data_api.py` | Python script to fetch and convert data |
| `scripts/sync_production_yaml.sh` | Automation wrapper script |
| `scripts/README.md` | Detailed documentation |
| `scripts/.env.example` | Template for credentials |
| `PRODUCTION_SYNC_GUIDE.md` | This quick start guide |

## Next Steps

1. ✅ Scripts created and ready to use
2. ⏳ Get your Cloudflare API token
3. ⏳ Run first sync: `./scripts/sync_production_yaml.sh`
4. ⏳ Compare output with original stations.yaml
5. ⏳ Set up automation (optional)

## Support

- Script documentation: `scripts/README.md`
- Database schema mapping: `YAML_to_Database_Mapping.md`
- Migration history: `migrations/` directory

---

**Created:** 2025-10-02
**Version:** 1.0.0
**Author:** SITES Spectral @ Lunds University
