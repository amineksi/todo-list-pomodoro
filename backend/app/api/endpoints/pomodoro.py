"""
API endpoints for pomodoro session management.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ...core.database import get_db
from ...models.task import PomodoroSession, Task
from ...schemas.task import PomodoroSessionCreate, PomodoroSessionUpdate, PomodoroSession as PomodoroSessionSchema

router = APIRouter()

@router.post("/", response_model=PomodoroSessionSchema, status_code=status.HTTP_201_CREATED)
def create_pomodoro_session(session: PomodoroSessionCreate, db: Session = Depends(get_db)):
    """
    Create a new pomodoro session for a task.
    """
    # Verify task exists
    task = db.query(Task).filter(Task.id == session.task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db_session = PomodoroSession(**session.model_dump())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=List[PomodoroSessionSchema])
def read_pomodoro_sessions(
    skip: int = 0,
    limit: int = 100,
    task_id: int = None,
    db: Session = Depends(get_db)
):
    """
    Get all pomodoro sessions with optional task filtering.
    """
    query = db.query(PomodoroSession)
    if task_id:
        query = query.filter(PomodoroSession.task_id == task_id)
    sessions = query.offset(skip).limit(limit).all()
    return sessions

@router.get("/{session_id}", response_model=PomodoroSessionSchema)
def read_pomodoro_session(session_id: int, db: Session = Depends(get_db)):
    """
    Get a specific pomodoro session by ID.
    """
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Pomodoro session not found")
    return session

@router.put("/{session_id}", response_model=PomodoroSessionSchema)
def update_pomodoro_session(
    session_id: int,
    session_update: PomodoroSessionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a pomodoro session (start, complete, etc.).
    """
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Pomodoro session not found")

    # Update fields
    update_data = session_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)

    db.commit()
    db.refresh(session)
    return session

@router.post("/{session_id}/start", response_model=PomodoroSessionSchema)
def start_pomodoro_session(session_id: int, db: Session = Depends(get_db)):
    """
    Start a pomodoro session.
    """
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Pomodoro session not found")

    if session.started_at is not None:
        raise HTTPException(status_code=400, detail="Session already started")

    session.started_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session

@router.post("/{session_id}/complete", response_model=PomodoroSessionSchema)
def complete_pomodoro_session(session_id: int, db: Session = Depends(get_db)):
    """
    Complete a pomodoro session.
    """
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Pomodoro session not found")

    if session.started_at is None:
        raise HTTPException(status_code=400, detail="Session not started")

    if session.completed_at is not None:
        raise HTTPException(status_code=400, detail="Session already completed")

    session.completed_at = datetime.utcnow()
    if session.started_at:
        # Calculate actual duration in minutes
        duration = (session.completed_at - session.started_at).total_seconds() / 60
        session.actual_duration_minutes = int(duration)

    db.commit()
    db.refresh(session)
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pomodoro_session(session_id: int, db: Session = Depends(get_db)):
    """
    Delete a pomodoro session.
    """
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if session is None:
        raise HTTPException(status_code=404, detail="Pomodoro session not found")

    db.delete(session)
    db.commit()
    return {"detail": "Pomodoro session deleted successfully"}
