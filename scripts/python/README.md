# SITES Spectral Python Scripts

> [!NOTE]
> These scripts provide direct access to the SITES Spectral Cloudflare D1 database for automation and batch operations.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your API token

# Test connection
python d1_client.py

# Run query examples
python query_examples.py
```

## Scripts Overview

| Script | Purpose | Documentation |
|--------|---------|---------------|
| [[d1_client]] | Database client class | [[PYTHON_DATABASE_ACCESS#D1 Client]] |
| [[export_station]] | Export station data | [[PYTHON_DATABASE_ACCESS#Export Operations]] |
| [[bulk_import]] | Import from CSV/JSON | [[PYTHON_DATABASE_ACCESS#Import Operations]] |
| [[sync_data]] | Sync local/remote data | [[PYTHON_DATABASE_ACCESS#Sync Operations]] |
| [[query_examples]] | Common SQL queries | [[PYTHON_DATABASE_ACCESS#Query Examples]] |

## Related Documentation

- [[PYTHON_DATABASE_ACCESS]] - Full Python database access guide
- [[API_REFERENCE]] - V3 API documentation
- [[../../CLAUDE|CLAUDE.md]] - Project guidelines
