"""
Main API router combining all endpoint modules.
"""

from fastapi import APIRouter
from .endpoints import tasks, pomodoro, stats, auth, admin

api_router = APIRouter()

# Include authentication router (public)
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

# Include admin router (for database management)
api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)

# Include all endpoint routers (protected)
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
