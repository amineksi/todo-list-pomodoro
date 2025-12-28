"""
Admin endpoints for database management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db, reset_database, drop_all_tables, create_tables
from ...core.config import settings
from ...models.user import User
from ...models.task import Task, PomodoroSession

router = APIRouter()


@router.post("/reset-db", status_code=status.HTTP_200_OK)
def reset_db(db: Session = Depends(get_db)):
    """
    Reset the entire database.
    WARNING: This will delete ALL data including users, tasks, and pomodoro sessions!
    
    Note: This endpoint is for development/testing only. 
    In production, use proper database migration tools.
    """
    try:
        # Close all connections first
        db.close()
        
        # Drop all tables
        drop_all_tables()
        # Recreate all tables
        create_tables()
        
        return {
            "message": "Database reset successfully",
            "status": "success",
            "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
        }
    except Exception as e:
        import traceback
        error_detail = f"Error resetting database: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting database: {str(e)}"
        )


@router.delete("/users", status_code=status.HTTP_200_OK)
def delete_all_users(db: Session = Depends(get_db)):
    """
    Delete all users from the database.
    WARNING: This will delete ALL users and their associated data!
    """
    try:
        # Delete all pomodoro sessions (they depend on tasks)
        db.query(PomodoroSession).delete()
        # Delete all tasks (they depend on users)
        db.query(Task).delete()
        # Delete all users
        deleted_count = db.query(User).delete()
        db.commit()
        
        return {
            "message": f"Deleted {deleted_count} users and all associated data",
            "status": "success"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting users: {str(e)}"
        )

