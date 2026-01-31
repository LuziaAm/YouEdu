from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from uuid import UUID


class StudentCreate(BaseModel):
    """Schema for creating a new student"""
    name: str = Field(..., description="Student name", min_length=2, max_length=100)
    email: Optional[EmailStr] = Field(None, description="Student email (optional for now)")


class StudentResponse(BaseModel):
    """Schema for student response"""
    id: str
    name: str
    email: Optional[str]
    total_xp: int
    level: int
    created_at: str


class StudentUpdate(BaseModel):
    """Schema for updating student data"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    total_xp: Optional[int] = Field(None, ge=0)
    level: Optional[int] = Field(None, ge=1)
