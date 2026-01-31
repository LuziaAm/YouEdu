"""
Router for Certificates - Generation and Verification.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from uuid import uuid4
from datetime import datetime
import hashlib
import base64

from schemas.certificate import (
    CertificateResponse, CertificateStatus,
    CertificateVerification, GenerateCertificateRequest
)

router = APIRouter()

from services.supabase_service import (
    create_record, get_record_by_id, get_all_records, get_student_by_email
)

router = APIRouter()


def generate_verification_code() -> str:
    """Generate a unique verification code."""
    unique = f"{uuid4().hex}{datetime.utcnow().timestamp()}"
    hash_bytes = hashlib.sha256(unique.encode()).digest()
    code = base64.urlsafe_b64encode(hash_bytes[:9]).decode().replace("=", "")
    return f"YE-{code.upper()}"


@router.post("/generate")
async def generate_certificate(request: GenerateCertificateRequest) -> CertificateResponse:
    """Generate a certificate for a completed trail."""
    # Check eligibility first
    from routers.assessment import check_certificate_eligibility
    
    eligibility = await check_certificate_eligibility(request.trail_id)
    
    if not eligibility.is_eligible:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Não é possível emitir certificado",
                "missing_requirements": eligibility.missing_requirements
            }
        )
    
    # Get trail info
    from routers.trails import trails_db
    trail = trails_db.get(request.trail_id)
    
    if not trail:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    
    # Determine status based on score
    final_score = int(eligibility.final_score or 0)
    status = CertificateStatus.DISTINCTION if final_score >= 90 else CertificateStatus.PASSED
    
    # Generate certificate
    cert_id = str(uuid4())
    verification_code = generate_verification_code()
    
    certificate = CertificateResponse(
        id=cert_id,
        verification_code=verification_code,
        student_name=request.student_name,
        trail_title=trail["title"],
        trail_description=trail.get("description"),
        final_score=final_score,
        status=status,
        issued_at=datetime.utcnow(),
        pdf_url=None  # TODO: Generate PDF
    )
    
    certificate = CertificateResponse(
        id=cert_id,
        verification_code=verification_code,
        student_name=request.student_name,
        trail_title=trail["title"],
        trail_description=trail.get("description"),
        final_score=final_score,
        status=status,
        issued_at=datetime.utcnow(),
        pdf_url=None  # TODO: Generate PDF
    )
    
    # Persist in Supabase
    try:
        # Find student by name (best effort since we don't have ID here yet - 
        # ideally request should have student_id or email)
        # For now, just create certificate without student link if no ID provided
        # Or you can update GenerateCertificateRequest to include student_email
        
        await create_record("certificates", certificate.dict())
    except Exception as e:
         print(f"Error saving certificate: {e}")
         # Don't fail the request, just log error
    
    return certificate


@router.get("/verify/{code}")
async def verify_certificate(code: str) -> CertificateVerification:
    """Public endpoint to verify a certificate."""
    try:
        certs = await get_all_records("certificates", {"verification_code": code})
        cert_data = certs[0] if certs else None
        
        if not cert_data:
            return CertificateVerification(
                valid=False,
                verification_code=code,
                message="Certificado não encontrado. Verifique se o código está correto."
            )
        
        return CertificateVerification(
            valid=True,
            verification_code=code,
            student_name=cert_data["student_name"],
            trail_title=cert_data["trail_title"],
            final_score=cert_data["final_score"],
            status=cert_data["status"],
            issued_at=datetime.fromisoformat(cert_data["issued_at"].replace('Z', '+00:00')) if isinstance(cert_data["issued_at"], str) else cert_data["issued_at"],
            message="✅ Certificado válido emitido pela plataforma YouEdu."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.get("/user")
async def list_user_certificates() -> list:
    """List all certificates (placeholder)."""
    # This endpoint is deprecated, use /user/{email} instead
    return []


@router.get("/user/{email}")
async def list_user_certificates_by_email(email: str) -> list[CertificateResponse]:
    """List all certificates for a user by email."""
    try:
        # First get student to get name or ID, but currently certificates store student_name
        # Ideally certificates should link to student_id
        
        student = await get_student_by_email(email)
        if not student:
            return []
            
        # Assuming certificates are linked by student_name for now as per schema
        # Or better, filter by student_name
        certs = await get_all_records("certificates", {"student_name": student["name"]})
        
        return [CertificateResponse(**cert) for cert in certs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list certificates: {str(e)}")


@router.get("/{certificate_id}")
async def get_certificate(certificate_id: str) -> CertificateResponse:
    """Get a specific certificate by ID."""
    try:
        cert = await get_record_by_id("certificates", certificate_id)
        if not cert:
            raise HTTPException(status_code=404, detail="Certificado não encontrado")
        return CertificateResponse(**cert)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get certificate: {str(e)}")
