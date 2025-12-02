#!/usr/bin/env python3
"""
SITES Spectral - Cloudflare D1 Database Client
Direct database access for automation and batch operations.

Usage:
    from d1_client import get_db, CloudflareD1Client

    db = get_db()
    stations = db.query("SELECT * FROM stations")
"""

import os
import json
import requests
from typing import Any, Optional, List, Dict
from dotenv import load_dotenv

load_dotenv()


class CloudflareD1Client:
    """Client for Cloudflare D1 database operations.

    Attributes:
        account_id: Cloudflare account identifier
        database_id: D1 database identifier
        api_token: Cloudflare API token with D1 permissions
    """

    # Default configuration - loaded from environment variables
    # Set these in .env file (see .env.example)
    DEFAULT_ACCOUNT_ID = None  # CLOUDFLARE_ACCOUNT_ID
    DEFAULT_DATABASE_ID = None  # CLOUDFLARE_D1_DATABASE_ID
    DEFAULT_DATABASE_NAME = "spectral_stations_db"

    def __init__(
        self,
        account_id: Optional[str] = None,
        database_id: Optional[str] = None,
        api_token: Optional[str] = None
    ):
        """Initialize the D1 client.

        Args:
            account_id: Cloudflare account ID (uses env var or default if not provided)
            database_id: D1 database ID (uses env var or default if not provided)
            api_token: Cloudflare API token (required, uses env var if not provided)
        """
        self.account_id = account_id or os.getenv('CLOUDFLARE_ACCOUNT_ID')
        self.database_id = database_id or os.getenv('CLOUDFLARE_D1_DATABASE_ID')
        self.api_token = api_token or os.getenv('CLOUDFLARE_API_TOKEN')

        if not all([self.account_id, self.database_id, self.api_token]):
            missing = []
            if not self.account_id:
                missing.append('CLOUDFLARE_ACCOUNT_ID')
            if not self.database_id:
                missing.append('CLOUDFLARE_D1_DATABASE_ID')
            if not self.api_token:
                missing.append('CLOUDFLARE_API_TOKEN')
            raise ValueError(
                f"Missing required credentials: {', '.join(missing)}. "
                "Set environment variables or create .env file (see .env.example)."
            )

        self.base_url = (
            f"https://api.cloudflare.com/client/v4/accounts/"
            f"{self.account_id}/d1/database/{self.database_id}"
        )
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    def execute(self, sql: str, params: Optional[List] = None) -> Dict:
        """Execute a SQL query on the D1 database.

        Args:
            sql: SQL query string
            params: Optional list of parameters for prepared statements

        Returns:
            dict with 'results', 'success', 'meta' keys

        Raises:
            Exception: If the query fails
        """
        url = f"{self.base_url}/query"
        payload = {"sql": sql}

        if params:
            payload["params"] = params

        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()

        data = response.json()

        if not data.get("success"):
            errors = data.get("errors", [])
            raise Exception(f"D1 query failed: {errors}")

        # Return first result set
        results = data.get("result", [])
        if results and len(results) > 0:
            return results[0]
        return {"results": [], "success": True, "meta": {}}

    def query(self, sql: str, params: Optional[List] = None) -> List[Dict]:
        """Execute query and return results as list of dicts.

        Args:
            sql: SQL query string
            params: Optional parameters for prepared statements

        Returns:
            List of dictionaries representing rows
        """
        result = self.execute(sql, params)
        return result.get("results", [])

    def query_one(self, sql: str, params: Optional[List] = None) -> Optional[Dict]:
        """Execute query and return first result or None.

        Args:
            sql: SQL query string
            params: Optional parameters for prepared statements

        Returns:
            Single row dictionary or None if no results
        """
        results = self.query(sql, params)
        return results[0] if results else None

    def insert(self, table: str, data: Dict) -> int:
        """Insert a row into a table.

        Args:
            table: Table name
            data: Dictionary of column names to values

        Returns:
            Last row ID
        """
        columns = ", ".join(data.keys())
        placeholders = ", ".join(["?" for _ in data])
        sql = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"

        result = self.execute(sql, list(data.values()))
        return result.get("meta", {}).get("last_row_id", 0)

    def update(self, table: str, data: Dict, where: str, where_params: List) -> int:
        """Update rows in a table.

        Args:
            table: Table name
            data: Dictionary of column names to new values
            where: WHERE clause (without WHERE keyword)
            where_params: Parameters for WHERE clause

        Returns:
            Number of rows changed
        """
        set_clause = ", ".join([f"{k} = ?" for k in data.keys()])
        sql = f"UPDATE {table} SET {set_clause} WHERE {where}"

        params = list(data.values()) + where_params
        result = self.execute(sql, params)
        return result.get("meta", {}).get("changes", 0)

    def delete(self, table: str, where: str, where_params: List) -> int:
        """Delete rows from a table.

        Args:
            table: Table name
            where: WHERE clause (without WHERE keyword)
            where_params: Parameters for WHERE clause

        Returns:
            Number of rows deleted
        """
        sql = f"DELETE FROM {table} WHERE {where}"
        result = self.execute(sql, where_params)
        return result.get("meta", {}).get("changes", 0)

    def get_tables(self) -> List[str]:
        """Get list of all tables in the database.

        Returns:
            List of table names
        """
        results = self.query(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        return [r['name'] for r in results]

    def get_table_schema(self, table: str) -> List[Dict]:
        """Get schema information for a table.

        Args:
            table: Table name

        Returns:
            List of column info dictionaries
        """
        return self.query(f"PRAGMA table_info({table})")

    def count(self, table: str, where: Optional[str] = None, params: Optional[List] = None) -> int:
        """Count rows in a table.

        Args:
            table: Table name
            where: Optional WHERE clause
            params: Optional parameters for WHERE clause

        Returns:
            Row count
        """
        sql = f"SELECT COUNT(*) as count FROM {table}"
        if where:
            sql += f" WHERE {where}"
        result = self.query_one(sql, params)
        return result['count'] if result else 0


def get_db() -> CloudflareD1Client:
    """Get a configured D1 client instance.

    Returns:
        Configured CloudflareD1Client

    Example:
        db = get_db()
        stations = db.query("SELECT * FROM stations")
    """
    return CloudflareD1Client()


if __name__ == "__main__":
    # Quick test
    try:
        db = get_db()
        tables = db.get_tables()
        print(f"Connected! Found {len(tables)} tables:")
        for table in tables:
            count = db.count(table)
            print(f"  - {table}: {count} rows")
    except Exception as e:
        print(f"Error: {e}")
