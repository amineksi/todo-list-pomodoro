#!/usr/bin/env python3
"""
Script to find and reset the database.
Works with both SQLite and PostgreSQL.
"""

import sys
import os
from pathlib import Path

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import reset_database, engine
from app.models import user, task  # Import models to register them

def get_database_info():
    """Get database type and location information"""
    db_url = settings.DATABASE_URL
    db_type = "Unknown"
    location = None
    
    if "sqlite" in db_url.lower():
        db_type = "SQLite"
        # Extract path from sqlite:///./path or sqlite:///path
        if db_url.startswith("sqlite:///"):
            path = db_url.replace("sqlite:///", "")
            # Handle relative paths
            if path.startswith("./"):
                path = os.path.join(os.path.dirname(__file__), path[2:])
            elif not os.path.isabs(path):
                path = os.path.join(os.path.dirname(__file__), path)
            location = path
    elif "postgresql" in db_url.lower() or "postgres" in db_url.lower():
        db_type = "PostgreSQL"
        # Extract connection info (hide password)
        if "@" in db_url:
            location = db_url.split("@")[-1]
        else:
            location = db_url
    
    return db_type, location

def find_sqlite_db():
    """Find SQLite database file location (deprecated, use get_database_info)"""
    db_type, location = get_database_info()
    if db_type == "SQLite":
        return location
    return None

if __name__ == "__main__":
    print("🔍 Database Configuration:")
    print(f"   DATABASE_URL: {settings.DATABASE_URL}")
    
    db_type, location = get_database_info()
    print(f"   Database Type: {db_type}")
    
    if db_type == "SQLite" and location:
        print(f"   SQLite DB Location: {os.path.abspath(location)}")
        if os.path.exists(location):
            size = os.path.getsize(location)
            print(f"   DB File Size: {size} bytes")
        else:
            print("   ⚠️  DB file does not exist yet (will be created on first run)")
    elif db_type == "PostgreSQL" and location:
        print(f"   PostgreSQL Connection: {location}")
    
    print("\n⚠️  WARNING: This will delete ALL data from the database!")
    response = input("Are you sure you want to continue? (yes/no): ")
    
    if response.lower() != "yes":
        print("Operation cancelled.")
        sys.exit(0)
    
    try:
        print("\n🔄 Resetting database...")
        reset_database()
        print("✅ Database reset successfully!")
        print("All tables have been dropped and recreated.")
        
        if db_type == "SQLite" and location and os.path.exists(location):
            print(f"\n📁 Database file location: {os.path.abspath(location)}")
    except Exception as e:
        print(f"\n❌ Error resetting database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

