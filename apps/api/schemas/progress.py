from pydantic import BaseModel, Field
from typing import Optional, Literal
from uuid import UUID


class VideoSessionCreate(BaseModel):
    """Schema for creating a new video session"""
    student_id: str = Field(..., description="Student UUID")
    video_title: str = Field(..., description="Video title", max_length=200)
    video_url: Optional[str] = Field(None, description="Video URL")
    video_source: Literal['upload', 'youtube'] = Field(..., description="Video source type")
    video_duration: int = Field(..., description="Video duration in seconds", gt=0)
    total_challenges: int = Field(0, description="Total number of challenges", ge=0)


class VideoSessionUpdate(BaseModel):
    """Schema for updating a video session"""
    completed_at: Optional[str] = None
    score: Optional[int] = Field(None, ge=0, le=100)
    time_spent: Optional[int] = Field(None, ge=0)
    challenges_completed: Optional[int] = Field(None, ge=0)


class VideoSessionResponse(BaseModel):
    """Schema for video session response"""
    id: str
    student_id: str
    video_title: str
    video_url: Optional[str]
    video_source: str
    video_duration: int
    started_at: str
    completed_at: Optional[str]
    score: Optional[int]
    time_spent: Optional[int]
    total_challenges: int
    challenges_completed: int


class ChallengeAttemptCreate(BaseModel):
    """Schema for creating a challenge attempt"""
    session_id: str = Field(..., description="Video session UUID")
    challenge_id: str = Field(..., description="Challenge identifier")
    challenge_type: Literal['quiz', 'code', 'multiple', 'fill_blank'] = Field(..., description="Challenge type")
    is_correct: bool = Field(..., description="Whether the answer was correct")
    time_taken: Optional[int] = Field(None, description="Time taken in seconds", ge=0)
    xp_earned: int = Field(0, description="XP earned from this attempt", ge=0)


class ChallengeAttemptResponse(BaseModel):
    """Schema for challenge attempt response"""
    id: str
    session_id: str
    challenge_id: str
    challenge_type: str
    is_correct: bool
    time_taken: Optional[int]
    xp_earned: int
    attempted_at: str
