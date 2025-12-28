#!/usr/bin/env python3
"""
Simple script to clear the database by finding and deleting the SQLite file.
"""

import os
import sys
from pathlib import Path

def find_db_files():
    """Find all possible database file locations"""
    backend_dir = Path(__file__).parent
    possible_locations = [
        backend_dir / "pomodoro_tasks.db",
        backend_dir / "data" / "pomodoro_tasks.db",
        backend_dir.parent / "pomodoro_tasks.db",
    ]
    
    found_files = []
    for location in possible_locations:
        if location.exists():
            found_files.append(location)
    
    return found_files

if __name__ == "__main__":
    # Check for --yes flag to skip confirmation
    skip_confirmation = "--yes" in sys.argv or "-y" in sys.argv
    
    print("🔍 Searching for database files...")
    db_files = find_db_files()
    
    if not db_files:
        print("✅ No database files found. Database will be created on first run.")
        sys.exit(0)
    
    print(f"\n📁 Found {len(db_files)} database file(s):")
    for db_file in db_files:
        size = db_file.stat().st_size
        print(f"   - {db_file.absolute()} ({size} bytes)")
    
    if not skip_confirmation:
        print("\n⚠️  WARNING: This will delete the database file(s)!")
        response = input("Are you sure you want to continue? (yes/no): ")
        
        if response.lower() != "yes":
            print("Operation cancelled.")
            sys.exit(0)
    
    deleted_count = 0
    for db_file in db_files:
        try:
            db_file.unlink()
            print(f"✅ Deleted: {db_file.absolute()}")
            deleted_count += 1
        except Exception as e:
            print(f"❌ Error deleting {db_file}: {e}")
    
    if deleted_count > 0:
        print(f"\n✅ Successfully deleted {deleted_count} database file(s).")
        print("   Tables will be recreated on next backend start.")
    else:
        print("\n❌ No files were deleted.")

