"""
Routers for student management and progress tracking
"""

from fastapi import APIRouter, HTTPException
from schemas.student import StudentCreate, StudentResponse, StudentUpdate
from schemas.progress import (
    VideoSessionCreate, VideoSessionUpdate, VideoSessionResponse,
    ChallengeAttemptCreate, ChallengeAttemptResponse
)
from services.supabase_service import (
    create_record, get_record_by_id, get_all_records, update_record,
    get_student_by_email, update_student_xp
)

router = APIRouter()


# ============ STUDENT ENDPOINTS ============

@router.post("/students", response_model=StudentResponse)
async def create_student(student: StudentCreate):
    """Create a new student"""
    try:
        # Check if email already exists
        if student.email:
            existing = await get_student_by_email(student.email)
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create student
        created = await create_record("students", student.dict(exclude_none=True))
        return created
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create student: {str(e)}")


@router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str):
    """Get a student by ID"""
    try:
        student = await get_record_by_id("students", student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get student: {str(e)}")


@router.patch("/students/{student_id}", response_model=StudentResponse)
async def update_student_info(student_id: str, update_data: StudentUpdate):
    """Update student information"""
    try:
        updated = await update_record("students", student_id, update_data.dict(exclude_none=True))
        if not updated:
            raise HTTPException(status_code=404, detail="Student not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update student: {str(e)}")


@router.post("/students/{student_id}/add-xp")
async def add_student_xp(student_id: str, xp: int):
    """Add XP to student and recalculate level"""
    try:
        if xp <= 0:
            raise HTTPException(status_code=400, detail="XP must be positive")
        
        updated = await update_student_xp(student_id, xp)
        return {
            "message": f"Added {xp} XP",
            "student": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add XP: {str(e)}")


# ============ VIDEO SESSION ENDPOINTS ============

@router.post("/sessions", response_model=VideoSessionResponse)
async def create_video_session(session: VideoSessionCreate):
    """Create a new video session"""
    try:
        # Verify student exists
        student = await get_record_by_id("students", session.student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Create session
        created = await create_record("video_sessions", session.dict())
        return created
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@router.get("/sessions/{session_id}", response_model=VideoSessionResponse)
async def get_video_session(session_id: str):
    """Get a video session by ID"""
    try:
        session = await get_record_by_id("video_sessions", session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")


@router.patch("/sessions/{session_id}", response_model=VideoSessionResponse)
async def update_video_session(session_id: str, update_data: VideoSessionUpdate):
    """Update a video session"""
    try:
        updated = await update_record("video_sessions", session_id, update_data.dict(exclude_none=True))
        if not updated:
            raise HTTPException(status_code=404, detail="Session not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update session: {str(e)}")


@router.get("/students/{student_id}/sessions", response_model=list[VideoSessionResponse])
async def get_student_sessions(student_id: str, limit: int = 10):
    """Get all video sessions for a student"""
    try:
        sessions = await get_all_records("video_sessions", {"student_id": student_id})
        # Limit results
        return sessions[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")


# ============ CHALLENGE ATTEMPT ENDPOINTS ============

@router.post("/attempts", response_model=ChallengeAttemptResponse)
async def create_challenge_attempt(attempt: ChallengeAttemptCreate):
    """Create a new challenge attempt"""
    try:
        # Verify session exists
        session = await get_record_by_id("video_sessions", attempt.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Create attempt
        created = await create_record("challenge_attempts", attempt.dict())
        
        # If correct, add XP to student
        if attempt.is_correct and attempt.xp_earned > 0:
            await update_student_xp(session["student_id"], attempt.xp_earned)
        
        # Update session challenge count
        current_completed = session.get("challenges_completed", 0)
        await update_record("video_sessions", attempt.session_id, {
            "challenges_completed": current_completed + 1
        })
        
        return created
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create attempt: {str(e)}")


@router.get("/sessions/{session_id}/attempts", response_model=list[ChallengeAttemptResponse])
async def get_session_attempts(session_id: str):
    """Get all challenge attempts for a session"""
    try:
        attempts = await get_all_records("challenge_attempts", {"session_id": session_id})
        return attempts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get attempts: {str(e)}")


@router.get("/students/{student_id}/stats")
async def get_student_stats(student_id: str):
    """Get comprehensive student statistics"""
    try:
        # Get student
        student = await get_record_by_id("students", student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get all sessions
        sessions = await get_all_records("video_sessions", {"student_id": student_id})
        
        # Calculate stats
        total_videos = len(sessions)
        completed_videos = len([s for s in sessions if s.get("completed_at")])
        total_time = sum(s.get("time_spent", 0) for s in sessions)
        avg_score = sum(s.get("score", 0) for s in sessions) / len(sessions) if sessions else 0
        
        # Get total attempts
        all_attempts = []
        for session in sessions:
            attempts = await get_all_records("challenge_attempts", {"session_id": session["id"]})
            all_attempts.extend(attempts)
        
        total_attempts = len(all_attempts)
        correct_attempts = len([a for a in all_attempts if a.get("is_correct")])
        accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
        
        return {
            "student": student,
            "stats": {
                "total_videos_started": total_videos,
                "total_videos_completed": completed_videos,
                "total_time_spent": total_time,
                "average_score": round(avg_score, 1),
                "total_challenges": total_attempts,
                "challenges_correct": correct_attempts,
                "accuracy_percentage": round(accuracy, 1)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.get("/email/{email}/sessions", response_model=list[VideoSessionResponse])
async def get_student_sessions_by_email(email: str, limit: int = 10):
    """Get all video sessions for a student by email"""
    try:
        student = await get_student_by_email(email)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
            
        return await get_student_sessions(student["id"], limit)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")


@router.get("/email/{email}/stats")
async def get_student_stats_by_email(email: str):
    """Get comprehensive student statistics by email"""
    try:
        student = await get_student_by_email(email)
        if not student:
            # Return empty stats structure if user doesn't exist yet (will be created on first sync)
            return {
                "total_xp": 0,
                "level": 1,
                "videos_watched": 0,
                "quizzes_completed": 0,
                "average_score": 0,
                "total_time_minutes": 0,
                "achievements_unlocked": 0,
                "current_streak": 0,
                "best_streak": 0
            }
            
        # Helper to get stats structure matching frontend
        stats_response = await get_student_stats(student["id"])
        stats_data = stats_response["stats"]
        
        # Map to frontend expected format
        return {
            "total_xp": student.get("total_xp", 0),
            "level": student.get("level", 1),
            "videos_watched": stats_data["total_videos_started"],
            "quizzes_completed": stats_data["total_videos_completed"],
            "average_score": stats_data["average_score"],
            "total_time_minutes": round(stats_data["total_time_spent"] / 60),
            "achievements_unlocked": 0, # TODO: Implement achievements
            "current_streak": 0, # TODO: Implement streaks
            "best_streak": 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

