from pydantic import BaseModel, Field, EmailStr, validator, root_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from models.common import PyObjectId

class UserBase(BaseModel):
    name: Optional[str] = None
    username: str
    email: EmailStr
    wallet_address: str
    image: Optional[str] = None
    is_admin: bool = False
    status: str = "active"
    twitter: Optional[str] = None
    website: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(UserBase):
    password: Optional[str] = None
    
    @validator('wallet_address')
    def wallet_address_must_be_valid(cls, v):
        # Basic validation for wallet address
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid wallet address format')
        return v.lower()
    
    @validator('username')
    def username_must_be_valid(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.isalnum() and not ('_' in v or '-' in v):
            raise ValueError('Username can only contain alphanumeric characters, underscores, and hyphens')
        return v

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: Optional[str] = None
    refresh_token: Optional[str] = None
    last_login: Optional[datetime] = None
    email_verified: bool = False
    verification_token: Optional[str] = None
    reset_password_token: Optional[str] = None
    reset_password_expires: Optional[datetime] = None
    nonce: Optional[str] = None  # For wallet authentication
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    image: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
    
    @validator('username')
    def username_must_be_valid(cls, v):
        if v is None:
            return v
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.isalnum() and not ('_' in v or '-' in v):
            raise ValueError('Username can only contain alphanumeric characters, underscores, and hyphens')
        return v

class UserResponse(UserBase):
    id: str
    
    class Config:
        orm_mode = True

class UserDetailedResponse(UserResponse):
    email_verified: bool = False
    last_login: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class UserAdminResponse(UserDetailedResponse):
    refresh_token: Optional[str] = None
    verification_token: Optional[str] = None
    reset_password_token: Optional[str] = None
    reset_password_expires: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class UserWithStats(UserResponse):
    total_nfts: int = 0
    total_collections: int = 0
    total_followers: int = 0
    total_following: int = 0
    
    class Config:
        orm_mode = True

class UserFilter(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    wallet_address: Optional[str] = None
    status: Optional[str] = None
    is_admin: Optional[bool] = None
    email_verified: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None

class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def password_strength_check(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserPasswordReset(BaseModel):
    reset_token: str
    new_password: str
    
    @validator('new_password')
    def password_strength_check(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    expires_in: int = 3600  # Default expiration time in seconds

class TokenData(BaseModel):
    user_id: Optional[str] = None
    is_admin: bool = False
    exp: Optional[int] = None

class WalletSignaturePayload(BaseModel):
    wallet_address: str
    signature: str
    message: str
    
    @validator('wallet_address')
    def wallet_address_must_be_valid(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid wallet address format')
        return v.lower()

class UserPreferences(BaseModel):
    notification_email: bool = True
    notification_push: bool = True
    theme: str = "light"
    language: str = "en"
    timezone: str = "UTC"

class UserWithPreferences(UserInDB):
    preferences: UserPreferences = Field(default_factory=UserPreferences)