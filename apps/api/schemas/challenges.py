from pydantic import BaseModel, Field
from typing import Literal, Optional, Union


class ChallengeType:
    QUIZ = "quiz"
    CODE = "code"


class ChallengeBase(BaseModel):
    timestamp: int = Field(..., description="Timestamp in seconds")
    timestampLabel: str = Field(..., description="Formatted timestamp MM:SS")
    type: Literal["quiz", "code"] = Field(..., description="Challenge type")
    title: str = Field(..., description="Challenge title")
    content: str = Field(..., description="Challenge question or task")
    summary: str = Field(..., description="Concept summary")


class QuizChallenge(ChallengeBase):
    type: Literal["quiz"] = "quiz"
    options: list[str] = Field(..., description="Quiz options (4 items)")
    correctAnswer: int = Field(..., description="Index of correct answer (0-3)")


class CodeChallenge(ChallengeBase):
    type: Literal["code"] = "code"
    correctAnswer: str = Field(..., description="Expected code snippet")


# Union type for API response
Challenge = Union[QuizChallenge, CodeChallenge]


class ChallengeGenerateRequest(BaseModel):
    videoBase64: str = Field(..., description="Base64 encoded video data")
    mimeType: str = Field(..., description="Video MIME type (e.g., video/mp4)")


class ChallengesResponse(BaseModel):
    challenges: list[dict] = Field(..., description="List of generated challenges")


class ChallengeWithId(BaseModel):
    """Challenge with auto-generated ID"""
    id: str
    timestamp: int
    timestampLabel: str
    type: str
    title: str
    content: str
    options: Optional[list[str]] = None
    correctAnswer: Union[str, int]
    summary: str
