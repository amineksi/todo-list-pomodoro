"""
Database models for tasks and pomodoro sessions.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from ..core.database import Base
import enum

class TaskStatus(str, enum.Enum):
    """Task status enumeration"""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskPriority(str, enum.Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Task(Base):
    """
    Task model representing a user task.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    # Use native_enum=False for PostgreSQL compatibility, True for SQLite
    status = Column(SQLEnum(TaskStatus, native_enum=False, length=20), default=TaskStatus.TODO)
    priority = Column(SQLEnum(TaskPriority, native_enum=False, length=20), default=TaskPriority.MEDIUM)

    # User relationship
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Optional due date
    due_date = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    owner = relationship("User", back_populates="tasks")
    pomodoro_sessions = relationship("PomodoroSession", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', status={self.status})>"

class PomodoroSession(Base):
    """
    Pomodoro session model tracking work sessions for tasks.
    """
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)

    # Session details
    duration_minutes = Column(Integer, nullable=False)  # Planned duration
    actual_duration_minutes = Column(Integer, nullable=True)  # Actual completed time
    session_type = Column(String(20), nullable=False)  # "work", "short_break", "long_break"

    # Timestamps
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    task = relationship("Task", back_populates="pomodoro_sessions")

    def __repr__(self):
        return f"<PomodoroSession(id={self.id}, task_id={self.task_id}, type='{self.session_type}')>"
