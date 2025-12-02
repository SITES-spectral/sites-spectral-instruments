# Python Direct Database Access Guide

> [!INFO] Overview
> This guide explains how to access the SITES Spectral Cloudflare D1 database directly from Python for automation and batch operations.

## Related Documentation

- [[API_REFERENCE]] - V3 REST API Reference
- [[FRONTEND_COMPONENTS]] - Frontend Component Documentation
- [[../../scripts/python/README|Python Scripts README]]

---

## Prerequisites

### Required Information

| Parameter | Description | Source |
|-----------|-------------|--------|
| Account ID | Cloudflare account identifier | See `wrangler.toml` or Cloudflare dashboard |
| Database ID | D1 database identifier | See `wrangler.toml` → `database_id` |
| Database Name | D1 database name | `spectral_stations_db` |
| API Token | Cloudflare API token | Create in Cloudflare dashboard |

> [!WARNING] Sensitive Information
> Account ID and Database ID are in the project's `wrangler.toml` file (not committed to public repos).

### Create Cloudflare API Token

> [!WARNING] Security
> Never commit API tokens to version control. Always use environment variables or `.env` files.

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Profile → API Tokens
2. Click "Create Token"
3. Use "Custom token" template
4. Permissions needed:
   - Account → D1 → Edit
   - Account → Workers Scripts → Edit (optional, for deployments)
5. Save the token securely

---

## Installation

### Using uv (Recommended)

```bash
cd scripts/python
uv pip install -r requirements.txt
```

### Using pip

```bash
cd scripts/python
pip install -r requirements.txt
```

### Environment Setup

```bash
# Copy example config
cp .env.example .env

# Edit with your API token
nano .env
```

---

## D1 Client

> [!TIP] Quick Start
> The `d1_client.py` module provides a simple interface for all database operations.

### Basic Usage

```python
from d1_client import get_db

# Get client instance
db = get_db()

# Query all stations
stations = db.query("SELECT * FROM stations ORDER BY acronym")
for station in stations:
    print(f"{station['acronym']}: {station['display_name']}")
```

### Client Class Reference

| Method | Description | Returns |
|--------|-------------|---------|
| `query(sql, params)` | Execute query, return all rows | `List[Dict]` |
| `query_one(sql, params)` | Execute query, return first row | `Dict` or `None` |
| `insert(table, data)` | Insert row | `int` (row ID) |
| `update(table, data, where, params)` | Update rows | `int` (changes) |
| `delete(table, where, params)` | Delete rows | `int` (deleted) |
| `count(table, where, params)` | Count rows | `int` |
| `get_tables()` | List all tables | `List[str]` |
| `get_table_schema(table)` | Get column info | `List[Dict]` |

---

## Query Examples

> [!NOTE] Script Location
> See [[../../scripts/python/query_examples|query_examples.py]] for runnable examples.

### Station Summary

```python
from d1_client import get_db

db = get_db()

# Get station with counts
results = db.query("""
    SELECT
        s.acronym,
        s.display_name,
        COUNT(DISTINCT p.id) as platform_count,
        COUNT(DISTINCT i.id) as instrument_count
    FROM stations s
    LEFT JOIN platforms p ON s.id = p.station_id
    LEFT JOIN instruments i ON p.id = i.platform_id
    GROUP BY s.id
    ORDER BY s.acronym
""")
```

### Instruments by Type

```python
# Get instrument counts by type
results = db.query("""
    SELECT
        instrument_type,
        COUNT(*) as count
    FROM instruments
    GROUP BY instrument_type
    ORDER BY count DESC
""")
```

### Phenocams with ROIs

```python
# Get phenocams that have ROIs defined
results = db.query("""
    SELECT
        i.normalized_name,
        s.acronym as station,
        COUNT(r.id) as roi_count
    FROM instruments i
    JOIN platforms p ON i.platform_id = p.id
    JOIN stations s ON p.station_id = s.id
    LEFT JOIN instrument_rois r ON i.id = r.instrument_id
    WHERE i.instrument_type = 'Phenocam'
    GROUP BY i.id
    HAVING roi_count > 0
    ORDER BY s.acronym
""")
```

---

## Export Operations

> [!NOTE] Script Location
> See [[../../scripts/python/export_station|export_station.py]] for the full script.

### Export Single Station

```bash
python export_station.py SVB -o svb_export.json
```

### Export All Stations

```bash
python export_station.py --all --output-dir ./exports
```

### Programmatic Export

```python
from export_station import export_station_data

# Export with nested platforms/instruments/ROIs
data = export_station_data("SVB", "svb_export.json")
print(f"Exported {len(data['platforms'])} platforms")
```

---

## Import Operations

> [!NOTE] Script Location
> See [[../../scripts/python/bulk_import|bulk_import.py]] for the full script.

### Import Instruments from CSV

```bash
python bulk_import.py instruments --file instruments.csv --station SVB
```

**CSV Format:**
```csv
platform_normalized_name,normalized_name,display_name,instrument_type,status
SVB_FOR_PL01,SVB_FOR_PL01_PHE02,New Phenocam,Phenocam,Active
```

### Import Platforms from JSON

```bash
python bulk_import.py platforms --file platforms.json --station SVB
```

**JSON Format:**
```json
[
  {
    "normalized_name": "SVB_FOR_PL99",
    "display_name": "Test Platform",
    "platform_type": "fixed",
    "ecosystem_code": "FOR",
    "latitude": 64.256,
    "longitude": 19.775
  }
]
```

### Dry Run Mode

> [!TIP] Validate First
> Always use `--dry-run` to validate data before importing.

```bash
python bulk_import.py instruments --file instruments.csv --station SVB --dry-run
```

---

## Sync Operations

> [!NOTE] Script Location
> See [[../../scripts/python/sync_data|sync_data.py]] for the full script.

### Pull Data

```bash
# Pull station data to local JSON
python sync_data.py pull --station SVB --output ./data
```

### Push Changes

```bash
# Push local changes to database
python sync_data.py push --station SVB --file ./data/svb_sync.json

# Dry run first
python sync_data.py push --station SVB --file ./data/svb_sync.json --dry-run
```

### Show Differences

```bash
python sync_data.py diff --station SVB --file ./data/svb_sync.json
```

### Full Backup

```bash
python sync_data.py backup --output ./backups
```

---

## Wrangler CLI Access

> [!INFO] Alternative Access
> For quick queries, you can also use the wrangler CLI directly.

### Basic Query

```bash
# Account ID is read from wrangler.toml automatically
npx wrangler d1 execute spectral_stations_db --remote \
  --command="SELECT acronym, display_name FROM stations ORDER BY acronym;"
```

### JSON Output

```bash
npx wrangler d1 execute spectral_stations_db --remote \
  --command="SELECT * FROM platforms WHERE station_id = 7;" \
  --json
```

### Run SQL File

```bash
npx wrangler d1 execute spectral_stations_db --remote \
  --file="./scripts/update_data.sql"
```

---

## Database Schema

### Entity Relationships

```
stations (1) ─── (N) platforms (1) ─── (N) instruments (1) ─── (N) instrument_rois
                         │
                         └─── (N) areas_of_interest
```

### Core Tables

| Table | Description |
|-------|-------------|
| `stations` | Research stations (SVB, ANS, LON, etc.) |
| `platforms` | Observation platforms (towers, UAVs, satellites) |
| `instruments` | Sensors and cameras |
| `instrument_rois` | Regions of interest for phenocams |
| `areas_of_interest` | AOIs for UAV/satellite platforms |

### Support Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `user_sessions` | Authentication sessions |
| `activity_log` | Audit trail |
| `ecosystems` | Ecosystem codes |
| `status_codes` | Status definitions |

---

## Security Best Practices

> [!DANGER] Critical Security Rules
> Follow these rules to protect database credentials and data.

### Token Management

1. **Never commit API tokens** - Use environment variables or `.env` files
2. **Add `.env` to `.gitignore`** - Prevent accidental commits
3. **Use read-only tokens when possible** - For scripts that only query data
4. **Rotate tokens regularly** - Update tokens periodically
5. **Limit token permissions** - Only grant necessary permissions

### Example .gitignore

```gitignore
# Environment files
.env
.env.local
*.env

# Exports and backups
exports/
backups/
*_export.json
*_backup.json
```

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid API token | Check token in Cloudflare dashboard |
| `403 Forbidden` | Token lacks permissions | Add D1 Edit permission to token |
| `404 Not Found` | Wrong database ID | Verify database ID in wrangler.toml |
| `SQLITE_CONSTRAINT` | Foreign key violation | Check parent record exists |

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable HTTP debugging
import http.client
http.client.HTTPConnection.debuglevel = 1
```

### Connection Test

```python
from d1_client import get_db

try:
    db = get_db()
    tables = db.get_tables()
    print(f"✓ Connected! Found {len(tables)} tables")
except Exception as e:
    print(f"✗ Connection failed: {e}")
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-02 | Initial release with D1 client, export, import, sync scripts |

---

> [!INFO] Contributing
> See [[../../CLAUDE|CLAUDE.md]] for project guidelines and development workflow.
