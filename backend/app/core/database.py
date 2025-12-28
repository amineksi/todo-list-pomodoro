"""
Database configuration and session management.
Supports both SQLite (development) and PostgreSQL (production).
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool, QueuePool
from .config import settings

# Detect database type
is_sqlite = "sqlite" in settings.DATABASE_URL.lower()
is_postgresql = "postgresql" in settings.DATABASE_URL.lower() or "postgres" in settings.DATABASE_URL.lower()

# Configure connection arguments based on database type
if is_sqlite:
    # SQLite needs special connection args
    connect_args = {"check_same_thread": False}
    # Use StaticPool for SQLite to allow multiple threads
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        poolclass=StaticPool,
        echo=False
    )
elif is_postgresql:
    # PostgreSQL connection pool configuration
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,  # Verify connections before using
        echo=False
    )
else:
    # Default configuration for other databases
    connect_args = {}
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    """
    Dependency to get database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    Create all database tables.
    Call this once when the application starts.
    """
    Base.metadata.create_all(bind=engine)


def drop_all_tables():
    """
    Drop all database tables.
    Use with caution - this will delete all data!
    """
    Base.metadata.drop_all(bind=engine)


def reset_database():
    """
    Reset the database by dropping all tables and recreating them.
    Use with caution - this will delete all data!
    
    Works with both SQLite and PostgreSQL.
    For PostgreSQL, drops and recreates the public schema.
    """
    if is_postgresql:
        # For PostgreSQL, drop and recreate schema
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
            conn.commit()
    
    # Drop all tables (works for both SQLite and PostgreSQL)
    drop_all_tables()
    # Recreate all tables
    create_tables()