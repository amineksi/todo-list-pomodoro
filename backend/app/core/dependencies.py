"""
Dependencies for FastAPI routes, including authentication.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from ..core.database import get_db
from ..core.security import decode_access_token
from ..models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    # JWT 'sub' is stored as string (new format) or int (old format for backward compatibility)
    sub_value = payload.get("sub")
    if sub_value is None:
        raise credentials_exception
    
    # Handle both string (new) and int (old) formats
    if isinstance(sub_value, str):
        try:
            user_id = int(sub_value)
        except (ValueError, TypeError):
            raise credentials_exception
    elif isinstance(sub_value, int):
        # Backward compatibility with old tokens that had int sub
        user_id = sub_value
    else:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current active user.
    This is a convenience wrapper around get_current_user.
    """
    return current_user

