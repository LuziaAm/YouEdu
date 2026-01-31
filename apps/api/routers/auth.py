"""
Authentication router for user management and sync
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from services.supabase_service import (
    create_record, get_all_records, update_record, get_student_by_email
)

router = APIRouter()


class SyncUserRequest(BaseModel):
    google_id: str  # Supabase Auth user ID
    email: str
    name: str
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    total_xp: int
    level: int
    created_at: str


@router.post("/sync-user")
async def sync_user(request: SyncUserRequest):
    """
    Sync Google user with database.
    Creates new user on first login, updates on subsequent logins.
    Uses email as the unique identifier (compatible with existing schema).
    """
    try:
        # Check if user already exists by email
        existing_user = await get_student_by_email(request.email)
        
        if existing_user:
            # Update existing user - update name if provided
            updated = await update_record("students", existing_user["id"], {
                "name": request.name
            })
            return {
                "message": "User updated",
                "user": updated or existing_user,
                "is_new": False
            }
        
        # Create new user with basic fields (compatible with existing schema)
        new_user = await create_record("students", {
            "email": request.email,
            "name": request.name,
            "total_xp": 0,
            "level": 1
        })
        
        return {
            "message": "User created",
            "user": new_user,
            "is_new": True
        }
    
    except Exception as e:
        # Log the error but don't fail the login
        print(f"Warning: Failed to sync user with database: {str(e)}")
        # Return a mock response so the frontend continues working
        return {
            "message": "User sync skipped (database unavailable)",
            "user": {
                "id": f"temp-{request.google_id[:8]}",
                "email": request.email,
                "name": request.name,
                "total_xp": 0,
                "level": 1
            },
            "is_new": True
        }


@router.get("/me/{email}")
async def get_current_user(email: str):
    """Get user by email"""
    try:
        user = await get_student_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")
