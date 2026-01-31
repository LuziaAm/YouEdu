"""
Pydantic schemas for Certificate system.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class CertificateStatus(str, Enum):
    PASSED = "passed"
    DISTINCTION = "approved_with_distinction"  # Score >= 90%


class CertificateCreate(BaseModel):
    """Request to generate a certificate."""
    trail_id: str
    student_name: str


class CertificateResponse(BaseModel):
    """Certificate data response."""
    id: str
    verification_code: str
    student_name: str
    trail_title: str
    trail_description: Optional[str]
    final_score: int
    status: CertificateStatus
    issued_at: datetime
    pdf_url: Optional[str] = None


class CertificateVerification(BaseModel):
    """Public verification response."""
    valid: bool
    verification_code: str
    student_name: Optional[str] = None
    trail_title: Optional[str] = None
    final_score: Optional[int] = None
    status: Optional[CertificateStatus] = None
    issued_at: Optional[datetime] = None
    message: str = ""


class GenerateCertificateRequest(BaseModel):
    """Request to generate certificate for a trail."""
    trail_id: str
    student_name: str = Field(..., min_length=2, max_length=100)
