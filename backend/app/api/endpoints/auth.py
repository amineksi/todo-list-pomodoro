"""
API endpoints for authentication (register, login, me).
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import verify_password, get_password_hash, create_access_token
from ...core.config import settings
from ...core.dependencies import get_current_active_user
from ...models.user import User
from ...schemas.auth import UserCreate, User as UserSchema, Token

router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    If registration fails after user creation, the user is removed from the database.
    """
    new_user = None
    try:
        # Check if user with email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create new user
        # Ensure password is a string before hashing
        password_str = str(user_data.password)
        hashed_password = get_password_hash(password_str)
        
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Verify the password can be verified immediately after creation
        # This ensures the hash is correct before returning
        verification_result = verify_password(password_str, hashed_password)
        if not verification_result:
            # If password verification fails, remove the user
            db.delete(new_user)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error: Password hash verification failed. User not created."
            )
        
        # Return the user - login should work immediately after
        return new_user
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        # If user was created, try to remove it
        if new_user and hasattr(new_user, 'id') and new_user.id:
            try:
                db.delete(new_user)
                db.commit()
            except Exception:
                db.rollback()
        raise
    except Exception as e:
        # Rollback any pending transaction
        db.rollback()
        
        # If user was created, try to remove it
        if new_user and hasattr(new_user, 'id') and new_user.id:
            try:
                # Refresh to ensure we have the latest state
                db.refresh(new_user)
                db.delete(new_user)
                db.commit()
            except Exception as delete_error:
                db.rollback()
                # Log the error but don't fail the request
                print(f"Warning: Could not delete user after failed registration: {delete_error}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login endpoint. Returns JWT access token.
    
    Note: OAuth2PasswordRequestForm expects 'username' field,
    but we accept both username and email for login.
    """
    # Try to find user by username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    password_valid = verify_password(form_data.password, user.hashed_password)
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    # Note: JWT 'sub' (subject) must be a string, not an integer
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    """
    return current_user

