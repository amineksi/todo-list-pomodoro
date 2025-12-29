"""
Tests for task endpoints.
"""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set DATABASE_URL to SQLite BEFORE importing app to avoid psycopg2 dependency
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key"

from app.main import app
from app.core.database import Base, get_db
from app.core.dependencies import get_current_active_user
from app.core.security import get_password_hash
from app.models.task import Task
from app.models.user import User

# Import models to ensure they're registered with Base
from app.models import user, task

# Test database (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Create a test user for authentication
def override_get_current_user():
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.username == "testuser").first()
        if not user:
            user = User(
                username="testuser",
                email="test@example.com",
                hashed_password=get_password_hash("testpassword"),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_user] = override_get_current_user

@pytest.fixture(scope="function")
def client():
    # Create all tables including User
    Base.metadata.create_all(bind=engine)
    
    # Create test user
    db = TestingSessionLocal()
    test_user = db.query(User).filter(User.username == "testuser").first()
    if not test_user:
        test_user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("testpassword"),
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
    db.close()
    
    yield TestClient(app)
    
    # Cleanup
    Base.metadata.drop_all(bind=engine)

def test_create_task(client):
    """Test creating a new task"""
    response = client.post(
        "/api/v1/tasks",
        json={
            "title": "Test Task",
            "description": "This is a test task",
            "status": "todo",
            "priority": "medium"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["status"] == "todo"
    assert "id" in data

def test_get_tasks(client):
    """Test getting all tasks"""
    # Create a task first
    client.post(
        "/api/v1/tasks",
        json={"title": "Test Task", "status": "todo"}
    )
    
    response = client.get("/api/v1/tasks")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_get_task_by_id(client):
    """Test getting a task by ID"""
    # Create a task
    create_response = client.post(
        "/api/v1/tasks",
        json={"title": "Test Task", "status": "todo"}
    )
    task_id = create_response.json()["id"]
    
    # Get the task
    response = client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == "Test Task"

def test_update_task(client):
    """Test updating a task"""
    # Create a task
    create_response = client.post(
        "/api/v1/tasks",
        json={"title": "Test Task", "status": "todo"}
    )
    task_id = create_response.json()["id"]
    
    # Update the task
    response = client.put(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Updated Task", "status": "in_progress"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Task"
    assert data["status"] == "in_progress"

def test_delete_task(client):
    """Test deleting a task"""
    # Create a task
    create_response = client.post(
        "/api/v1/tasks",
        json={"title": "Test Task", "status": "todo"}
    )
    task_id = create_response.json()["id"]
    
    # Delete the task
    response = client.delete(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 204
    
    # Verify it's deleted
    get_response = client.get(f"/api/v1/tasks/{task_id}")
    assert get_response.status_code == 404
