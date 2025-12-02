"""
SITES Spectral Python Scripts

Automation and batch operation scripts for the SITES Spectral database.

Modules:
    d1_client: Cloudflare D1 database client
    export_station: Station data export
    bulk_import: Bulk data import
    sync_data: Data synchronization
    query_examples: Common query examples
"""

from .d1_client import CloudflareD1Client, get_db

__all__ = ['CloudflareD1Client', 'get_db']
__version__ = '1.0.0'
