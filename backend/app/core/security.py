"""
Security utilities for password hashing and JWT token management.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from ..core.config import settings

# Bcrypt rounds (12 is a good balance between security and performance)
BCRYPT_ROUNDS = 12


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    Supports both bcrypt direct and passlib formats.
    """
    if not plain_password or not hashed_password:
        return False
    
    # Ensure password is a string
    if isinstance(plain_password, bytes):
        password_str = plain_password.decode('utf-8')
    else:
        password_str = str(plain_password)
    
    # Ensure hashed_password is a string
    if isinstance(hashed_password, bytes):
        hashed_str = hashed_password.decode('utf-8')
    else:
        hashed_str = str(hashed_password)
    
    # Try bcrypt direct first (for new hashes)
    try:
        password_bytes = password_str.encode('utf-8')
        hashed_bytes = hashed_str.encode('utf-8')
        result = bcrypt.checkpw(password_bytes, hashed_bytes)
        if result:
            return True
    except Exception as e:
        # Log the error for debugging but continue to try passlib
        print(f"Bcrypt direct verification failed: {e}")
    
    # Fallback: try with passlib (for old hashes or if bcrypt fails)
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        result = pwd_context.verify(password_str, hashed_str)
        if result:
            return True
    except Exception as e:
        print(f"Passlib verification failed: {e}")
        return False
    
    return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    Bcrypt has a 72 byte limit, so we ensure the password is properly handled.
    """
    # Ensure password is a string and encode to bytes
    if isinstance(password, bytes):
        password_bytes = password
    else:
        password_str = str(password)
        password_bytes = password_str.encode('utf-8')
    
    # Bcrypt has a 72 byte limit - truncate if necessary
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    try:
        # Generate salt and hash password
        salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        hashed = bcrypt.hashpw(password_bytes, salt)
        # Return as string (decode from bytes)
        return hashed.decode('utf-8')
    except Exception as e:
        # Fallback: try with passlib if bcrypt fails
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_str = password_bytes.decode('utf-8', errors='ignore')
        return pwd_context.hash(password_str)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing the data to encode in the token
        expires_delta: Optional timedelta for token expiration
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token data if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError as e:
        # Only log errors, not successful operations
        return None

