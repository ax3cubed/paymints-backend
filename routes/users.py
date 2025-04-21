from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from models.user import UserResponse, UserUpdate, UserInDB
from models.common import PaginatedResponse
from database import get_db
from middleware.auth import get_current_user, admin_required
from bson import ObjectId
import structlog

router = APIRouter()
logger = structlog.get_logger()

@router.get("/", response_model=PaginatedResponse)
async def get_users(
    name: Optional[str] = None,
    wallet_address: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get list of users with pagination and filters"""
    db = get_db()
    
    # Build query
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    
    if wallet_address:
        query["wallet_address"] = wallet_address.lower()
    
    if status:
        query["status"] = status
    
    # Count total documents
    total = await db.users.count_documents(query)
    
    # Pagination
    skip = (page - 1) * page_size
    
    # Get users
    cursor = db.users.find(query).skip(skip).limit(page_size)
    users = await cursor.to_list(length=page_size)
    
    # Convert ObjectId to string
    for user in users:
        user["id"] = str(user.pop("_id"))
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": users
    }

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user by ID"""
    db = get_db()
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Convert ObjectId to string
    user["id"] = str(user.pop("_id"))
    
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user"""
    db = get_db()
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is updating their own profile or is admin
    if str(current_user["_id"]) != user_id and not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update user
    update_data = user_update.dict(exclude_unset=True)
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    # Convert ObjectId to string
    updated_user["id"] = str(updated_user.pop("_id"))
    
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(admin_required)
):
    """Delete user (admin only)"""
    db = get_db()
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete user
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    return None