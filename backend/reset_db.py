"""
Script to reset the database.
This will delete all data and recreate all tables.
"""

import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import reset_database, engine
from app.models import user, task  # Import models to register them

if __name__ == "__main__":
    print("⚠️  WARNING: This will delete ALL data from the database!")
    response = input("Are you sure you want to continue? (yes/no): ")
    
    if response.lower() != "yes":
        print("Operation cancelled.")
        sys.exit(0)
    
    try:
        print("Resetting database...")
        reset_database()
        print("✅ Database reset successfully!")
        print("All tables have been dropped and recreated.")
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        sys.exit(1)

