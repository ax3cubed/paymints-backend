from pydantic import BaseSettings, Field
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Paymint API"
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    
    # MongoDB settings
    MONGODB_URL: str = Field(..., env="MONGODB_URL")
    MONGODB_DB_NAME: str = Field(default="paymint")
    
    # JWT settings
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=48 * 60)  # 48 hours
    
    # Email settings
    SMTP_HOST: str = Field(..., env="SMTP_HOST")
    SMTP_PORT: int = Field(..., env="SMTP_PORT")
    SMTP_USER: str = Field(..., env="SMTP_USER")
    SMTP_PASSWORD: str = Field(..., env="SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: str = Field(..., env="EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: Optional[str] = Field(default="Paymint")
    
    # CORS settings
    CORS_ORIGINS: list = Field(default=["*"])
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()