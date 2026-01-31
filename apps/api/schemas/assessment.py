"""
Pydantic schemas for Assessment system.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    PRACTICAL = "practical"


class CheckpointQuestion(BaseModel):
    """A checkpoint question during video playback."""
    id: str
    question: str
    options: List[str]
    correct_answer: int = Field(..., ge=0, le=3)
    explanation: Optional[str] = None
    timestamp_seconds: int = Field(..., description="When to show this checkpoint")


class CheckpointResult(BaseModel):
    """Result of a checkpoint answer."""
    checkpoint_id: str
    video_id: str
    trail_id: Optional[str] = None  # Optional for non-trail videos
    selected_answer: int
    is_correct: bool
    skipped: bool = False  # Track if user skipped this checkpoint
    answered_at: datetime = Field(default_factory=datetime.utcnow)


class VideoProgress(BaseModel):
    """Detailed progress for a video."""
    video_id: str
    trail_id: Optional[str] = None
    watched_seconds: int = 0
    total_seconds: Optional[int] = None
    completed: bool = False
    checkpoint_results: List[CheckpointResult] = []
    checkpoint_score: float = 0.0  # Percentage of correct checkpoints
    checkpoints_answered: int = 0  # Count of answered checkpoints
    checkpoints_skipped: int = 0   # Count of skipped checkpoints
    checkpoints_correct: int = 0   # Count of correct answers
    checkpoint_score_impact: float = 0.0  # Impact on final grade (-8% to +20%)


class FinalAssessmentQuestion(BaseModel):
    """A question in the final assessment."""
    id: str
    question: str
    options: List[str]
    correct_answer: int
    points: int = 10


class FinalAssessmentCreate(BaseModel):
    """Request to generate final assessment."""
    trail_id: str


class FinalAssessmentResponse(BaseModel):
    """Generated final assessment."""
    id: str
    trail_id: str
    questions: List[FinalAssessmentQuestion]
    total_points: int
    time_limit_minutes: int = 30
    generated_at: datetime


class SubmitAssessmentRequest(BaseModel):
    """Request to submit final assessment answers."""
    assessment_id: str
    answers: dict  # {question_id: selected_answer}


class AssessmentResultResponse(BaseModel):
    """Result of final assessment."""
    assessment_id: str
    trail_id: str
    score: int
    total_points: int
    percentage: float
    passed: bool
    passing_percentage: float = 60.0
    completed_at: datetime


class EligibilityCheck(BaseModel):
    """Check if user is eligible for certificate."""
    trail_id: str
    is_eligible: bool
    completion_percentage: float
    checkpoint_average: float
    final_assessment_passed: Optional[bool]
    final_score: Optional[float]
    missing_requirements: List[str] = []
