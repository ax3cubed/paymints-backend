from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from config import settings
from models.user import TokenData
from database import get_db
from bson import ObjectId
import structlog

logger = structlog.get_logger()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a new JWT token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Validate token and return current user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        is_admin: bool = payload.get("is_admin", False)
        
        if user_id is None:
            raise credentials_exception
        
        token_data = TokenData(user_id=user_id, is_admin=is_admin)
    except JWTError as e:
        logger.error("JWT validation error", error=str(e))
        raise credentials_exception
    
    # Get user from database
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(token_data.user_id)})
    
    if user is None:
        raise credentials_exception
    
    # Add user to request state
    return user

async def get_current_active_user(current_user = Depends(get_current_user)):
    """Check if user is active"""
    if current_user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user

async def admin_required(current_user = Depends(get_current_user)):
    """Check if user is admin"""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user