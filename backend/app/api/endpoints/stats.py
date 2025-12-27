"""
API endpoints for statistics and dashboard data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from ...core.database import get_db
from ...models.task import Task, TaskStatus, PomodoroSession
from ...schemas.task import DashboardStats, TaskStats, PomodoroStats

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get comprehensive dashboard statistics.
    """
    # Task statistics
    total_tasks = db.query(func.count(Task.id)).scalar()
    completed_tasks = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.DONE).scalar()
    in_progress_tasks = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.IN_PROGRESS).scalar()
    todo_tasks = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.TODO).scalar()

    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    task_stats = TaskStats(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        todo_tasks=todo_tasks,
        completion_rate=round(completion_rate, 2)
    )

    # Pomodoro statistics
    total_sessions = db.query(func.count(PomodoroSession.id)).scalar()
    completed_sessions = db.query(func.count(PomodoroSession.id)).filter(
        PomodoroSession.completed_at.isnot(None)
    ).scalar()

    # Total work minutes (only completed work sessions)
    total_work_minutes_result = db.query(func.sum(PomodoroSession.actual_duration_minutes)).filter(
        PomodoroSession.session_type == "work",
        PomodoroSession.completed_at.isnot(None)
    ).scalar()
    total_work_minutes = total_work_minutes_result or 0

    # Average session duration
    avg_duration_result = db.query(func.avg(PomodoroSession.actual_duration_minutes)).filter(
        PomodoroSession.completed_at.isnot(None)
    ).scalar()
    average_session_duration = avg_duration_result or 0

    # Today's statistics
    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)

    sessions_today = db.query(func.count(PomodoroSession.id)).filter(
        PomodoroSession.created_at >= today,
        PomodoroSession.created_at < tomorrow
    ).scalar()

    work_minutes_today_result = db.query(func.sum(PomodoroSession.actual_duration_minutes)).filter(
        PomodoroSession.session_type == "work",
        PomodoroSession.completed_at.isnot(None),
        PomodoroSession.created_at >= today,
        PomodoroSession.created_at < tomorrow
    ).scalar()
    work_minutes_today = work_minutes_today_result or 0

    pomodoro_stats = PomodoroStats(
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        total_work_minutes=total_work_minutes,
        average_session_duration=round(average_session_duration, 2),
        sessions_today=sessions_today,
        work_minutes_today=work_minutes_today
    )

    return DashboardStats(
        task_stats=task_stats,
        pomodoro_stats=pomodoro_stats
    )

@router.get("/tasks/summary")
def get_task_summary(db: Session = Depends(get_db)):
    """
    Get a summary of tasks by status.
    """
    stats = db.query(Task.status, func.count(Task.id)).group_by(Task.status).all()
    return {status.value: count for status, count in stats}

@router.get("/pomodoro/summary")
def get_pomodoro_summary(db: Session = Depends(get_db)):
    """
    Get a summary of pomodoro sessions.
    """
    # Sessions by type
    type_stats = db.query(PomodoroSession.session_type, func.count(PomodoroSession.id)).group_by(
        PomodoroSession.session_type
    ).all()

    # Completion rate
    total_sessions = db.query(func.count(PomodoroSession.id)).scalar()
    completed_sessions = db.query(func.count(PomodoroSession.id)).filter(
        PomodoroSession.completed_at.isnot(None)
    ).scalar()

    return {
        "sessions_by_type": {session_type: count for session_type, count in type_stats},
        "completion_rate": round((completed_sessions / total_sessions * 100), 2) if total_sessions > 0 else 0
    }
