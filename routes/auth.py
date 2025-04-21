from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any
from datetime import timedelta
from passlib.context import CryptContext
from models.user import UserCreate, UserInDB, Token
from database import get_db
from middleware.auth import create_access_token
from utils.helpers import generate_7_char_username
from config import settings
import structlog
from bson import ObjectId

router = APIRouter()
logger = structlog.get_logger()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash password"""
    return pwd_context.hash(password)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with username/email and password"""
    db = get_db()
    
    # Find user by username or email
    user = await db.users.find_one({
        "$or": [
            {"username": form_data.username},
            {"email": form_data.username}
        ]
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not user.get("hashed_password") or not verify_password(
        form_data.password, user.get("hashed_password")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "is_admin": user.get("is_admin", False)
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/wallet-login", response_model=Token)
async def wallet_login(wallet_address: str = Body(..., embed=True)):
    """Login with wallet address (or create user if not exists)"""
    db = get_db()
    
    # Normalize wallet address
    wallet_address = wallet_address.lower()
    
    # Find user by wallet address
    user = await db.users.find_one({"wallet_address": wallet_address})
    
    # If user doesn't exist, create a new one
    if not user:
        # Generate username
        username = generate_7_char_username()
        
        # Check if username exists
        while await db.users.find_one({"username": username}):
            username = generate_7_char_username()
        
        # Create new user
        new_user = UserCreate(
            username=username,
            email=f"{username}@placeholder.com",  # Placeholder email
            wallet_address=wallet_address
        )
        
        user_in_db = UserInDB(**new_user.dict())
        result = await db.users.insert_one(user_in_db.dict(by_alias=True))
        
        # Get created user
        user = await db.users.find_one({"_id": result.inserted_id})
        
        logger.info("Created new user from wallet login", user_id=str(result.inserted_id))
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "is_admin": user.get("is_admin", False)
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}