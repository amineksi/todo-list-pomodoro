#!/usr/bin/env python3
"""
Development server runner for the Pomodoro Task Manager API.
"""

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.SERVER_PORT,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )
