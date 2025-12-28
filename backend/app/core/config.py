"""
Core configuration for the Pomodoro Task Manager API.
Environment variables and settings management.
"""

from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator, ValidationInfo
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    # API Configuration
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Server Configuration
    SERVER_NAME: str = "Pomodoro Task Manager"
    SERVER_HOST: AnyHttpUrl = "http://localhost"
    SERVER_PORT: int = 8000

    # CORS Configuration - Store as string to avoid JSON parsing issues
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> str:
        """Convert CORS origins to comma-separated string"""
        if isinstance(v, list):
            return ",".join(str(item) for item in v)
        return str(v)
    
    def get_cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list"""
        if not self.BACKEND_CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

    # Database Configuration
    # PostgreSQL is used for both development and production
    # Format: postgresql://user:password@host:port/dbname
    # For local development: postgresql://pomodoro_user:pomodoro_password@localhost:5432/pomodoro_db
    # The URL can be overridden via environment variable or .env file
    DATABASE_URL: str = "postgresql://pomodoro_user:pomodoro_password@localhost:5432/pomodoro_db"

    # Pomodoro Configuration
    POMODORO_WORK_DURATION: int = 25  # minutes
    POMODORO_SHORT_BREAK: int = 5     # minutes
    POMODORO_LONG_BREAK: int = 15     # minutes
    POMODOROS_BEFORE_LONG_BREAK: int = 4

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
