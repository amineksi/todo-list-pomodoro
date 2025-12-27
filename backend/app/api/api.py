"""
Main API router combining all endpoint modules.
"""

from fastapi import APIRouter
from .endpoints import tasks, pomodoro, stats

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    tasks.router,
    prefix="/tasks",
    tags=["tasks"]
)

api_router.include_router(
    pomodoro.router,
    prefix="/pomodoro",
    tags=["pomodoro"]
)

api_router.include_router(
    stats.router,
    prefix="/stats",
    tags=["statistics"]
)
