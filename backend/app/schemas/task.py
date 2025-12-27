"""
Pydantic schemas for task and pomodoro session API endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import enum

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Task Schemas
class TaskBase(BaseModel):
    """Base task schema with common fields"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    """Schema for creating a new task"""
    pass

class TaskUpdate(BaseModel):
    """Schema for updating a task (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None

class Task(TaskBase):
    """Schema for task responses"""
    id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    pomodoro_sessions: List["PomodoroSession"] = []

    class Config:
        from_attributes = True

# Pomodoro Session Schemas
class PomodoroSessionBase(BaseModel):
    """Base pomodoro session schema"""
    duration_minutes: int = Field(..., gt=0, le=60)
    session_type: str = Field(..., pattern="^(work|short_break|long_break)$")

class PomodoroSessionCreate(PomodoroSessionBase):
    """Schema for creating a new pomodoro session"""
    task_id: int

class PomodoroSessionUpdate(BaseModel):
    """Schema for updating a pomodoro session"""
    actual_duration_minutes: Optional[int] = Field(None, gt=0, le=60)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class PomodoroSession(PomodoroSessionBase):
    """Schema for pomodoro session responses"""
    id: int
    task_id: int
    actual_duration_minutes: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Statistics Schemas
class TaskStats(BaseModel):
    """Statistics for tasks"""
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    todo_tasks: int
    completion_rate: float

class PomodoroStats(BaseModel):
    """Statistics for pomodoro sessions"""
    total_sessions: int
    completed_sessions: int
    total_work_minutes: int
    average_session_duration: float
    sessions_today: int
    work_minutes_today: int

class DashboardStats(BaseModel):
    """Combined dashboard statistics"""
    task_stats: TaskStats
    pomodoro_stats: PomodoroStats

# Rebuild models to resolve forward references
Task.model_rebuild()
