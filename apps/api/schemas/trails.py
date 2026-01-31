"""
Pydantic schemas for Trails system.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class VideoItem(BaseModel):
    """A video within a trail."""
    video_url: str = Field(..., description="URL of the video (YouTube, Vimeo, or direct)")
    video_provider: Optional[str] = Field(None, description="Provider: youtube, vimeo, direct")
    video_id: Optional[str] = Field(None, description="Extracted video ID")
    title: str = Field(..., description="Video title")
    duration_seconds: Optional[int] = Field(None, description="Video duration in seconds")
    order_index: int = Field(0, description="Order within the trail")


class TrailCreate(BaseModel):
    """Request body for creating a trail."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    cover_image_url: Optional[str] = None
    is_public: bool = Field(False)
    videos: Optional[List[VideoItem]] = Field(default_factory=list)


class TrailUpdate(BaseModel):
    """Request body for updating a trail."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    is_public: Optional[bool] = None


class TrailVideoResponse(BaseModel):
    """Video item in trail response."""
    id: str
    video_url: str
    video_provider: Optional[str]
    video_id: Optional[str]
    title: str
    duration_seconds: Optional[int]
    order_index: int
    completed: bool = False
    quiz_score: Optional[int] = None


class TrailResponse(BaseModel):
    """Response model for a trail."""
    id: str
    title: str
    description: Optional[str]
    cover_image_url: Optional[str]
    is_public: bool
    created_at: datetime
    video_count: int = 0
    completed_count: int = 0
    total_duration_seconds: int = 0


class TrailDetailResponse(TrailResponse):
    """Detailed trail response with videos."""
    videos: List[TrailVideoResponse] = []


class AddVideoRequest(BaseModel):
    """Request to add a video to a trail."""
    video_url: str
    title: Optional[str] = None


class ProgressUpdate(BaseModel):
    """Request to update user progress."""
    trail_id: str
    video_id: str
    watched_seconds: Optional[int] = None
    completed: Optional[bool] = None
    quiz_score: Optional[int] = None


class ProgressResponse(BaseModel):
    """User progress response."""
    trail_id: str
    video_id: str
    watched_seconds: int
    completed: bool
    quiz_score: Optional[int]
