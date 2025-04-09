#!/usr/bin/env python
import os
import sys
import django
import dj_database_url
from tabulate import tabulate

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

def check_database():
    """Check database connection and display table information."""
    try:
        # Get database URL from environment or use default
        database_url = os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3')
        print(f"Connecting to database: {database_url}")
        
        # Test connection
        with connection.cursor() as cursor:
            # Get database version
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"\nDatabase version: {version}")
            
            # Get database size
            cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()));")
            db_size = cursor.fetchone()[0]
            print(f"Database size: {db_size}")
            
            # Get connection count
            cursor.execute("SELECT count(*) FROM pg_stat_activity;")
            connection_count = cursor.fetchone()[0]
            print(f"Active connections: {connection_count}")
            
            # Get table information
            print("\nTable Information:")
            cursor.execute("""
                SELECT 
                    table_name, 
                    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
                    (SELECT count(*) FROM information_schema.tables WHERE table_name = t.table_name) as row_count
                FROM information_schema.tables t
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            
            # Display table information in a nice format
            headers = ["Table Name", "Columns", "Rows"]
            print(tabulate(tables, headers=headers, tablefmt="grid"))
            
            print("\nDatabase connection successful!")
            return True
            
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return False

if __name__ == "__main__":
    check_database() 