#!/usr/bin/env python3
"""
Script to reset PostgreSQL database.
Works with both local and remote PostgreSQL.
"""

import sys
import os
from sqlalchemy import create_engine, text

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import create_tables
from app.models import user, task  # Import models to register them

def reset_postgres_db():
    """Reset PostgreSQL database by dropping and recreating schema"""
    # Check for --yes flag to skip confirmation
    skip_confirmation = "--yes" in sys.argv or "-y" in sys.argv
    
    db_url = settings.DATABASE_URL
    
    if "sqlite" in db_url.lower():
        print("❌ This script is for PostgreSQL only.")
        print("For SQLite, use: python3 clear_db.py")
        sys.exit(1)
    
    print(f"🔍 Database URL: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    
    if not skip_confirmation:
        print("\n⚠️  WARNING: This will delete ALL data from the PostgreSQL database!")
        response = input("Are you sure you want to continue? (yes/no): ")
        
        if response.lower() != "yes":
            print("Operation cancelled.")
            sys.exit(0)
    
    try:
        # Create engine
        engine = create_engine(db_url)
        
        # Drop all tables
        print("\n🔄 Dropping all tables...")
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
        
        print("✅ All tables dropped")
        
        # Recreate tables
        print("🔄 Creating tables...")
        create_tables()
        
        print("✅ Database reset successfully!")
        print("All tables have been recreated.")
        
    except Exception as e:
        print(f"\n❌ Error resetting database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    reset_postgres_db()

