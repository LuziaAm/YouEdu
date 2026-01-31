"""
Router for Assessments - Checkpoints and Final Evaluations.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
from datetime import datetime
import json

from schemas.assessment import (
    CheckpointQuestion, CheckpointResult, VideoProgress,
    FinalAssessmentResponse, FinalAssessmentQuestion,
    SubmitAssessmentRequest, AssessmentResultResponse, EligibilityCheck
)
from services.checkpoint_ai_service import (
    generate_checkpoint_questions as ai_generate_checkpoints,
    calculate_checkpoint_score_impact,
    CHECKPOINT_PERCENTAGES
)

router = APIRouter()

# In-memory storage (replace with Supabase)
video_progress_db = {}
checkpoint_results_db = {}
final_assessments_db = {}
assessment_results_db = {}
generated_checkpoints_cache = {}  # Cache for generated checkpoints


# Request model for generating checkpoints
class GenerateCheckpointsRequest(BaseModel):
    video_id: str
    duration_seconds: int
    transcript: str


# Request model for skipping a checkpoint
class SkipCheckpointRequest(BaseModel):
    checkpoint_id: str
    video_id: str
    trail_id: Optional[str] = None



def generate_checkpoint_questions(video_title: str, timestamp_percent: float) -> CheckpointQuestion:
    """Generate a checkpoint question based on video context."""
    # Mock questions for now - in production, use Gemini AI
    questions_pool = [
        {
            "question": "Qual conceito foi explicado nesta seção do vídeo?",
            "options": ["Variáveis", "Funções", "Loops", "Classes"],
            "correct": 0
        },
        {
            "question": "O que o instrutor demonstrou agora?",
            "options": ["Um exemplo prático", "Uma teoria", "Um erro comum", "Uma otimização"],
            "correct": 0
        },
        {
            "question": "Qual é o próximo passo lógico após este conceito?",
            "options": ["Praticar com exercícios", "Avançar para tópico avançado", "Revisar fundamentos", "Fazer uma pausa"],
            "correct": 0
        }
    ]
    
    idx = int(timestamp_percent * 10) % len(questions_pool)
    q = questions_pool[idx]
    
    return CheckpointQuestion(
        id=f"cp-{uuid4().hex[:8]}",
        question=q["question"],
        options=q["options"],
        correct_answer=q["correct"],
        explanation="Continue assistindo para aprofundar o conceito!",
        timestamp_seconds=int(timestamp_percent * 300)  # Assume 5min video
    )


@router.get("/checkpoints/{video_id}")
async def get_video_checkpoints(video_id: str, duration_seconds: int = 300) -> List[CheckpointQuestion]:
    """Get checkpoint questions for a video at 25%, 50%, 75%, 100%."""
    # Check cache first
    cache_key = f"{video_id}:{duration_seconds}"
    if cache_key in generated_checkpoints_cache:
        return generated_checkpoints_cache[cache_key]
    
    # Generate fallback checkpoints (4 instead of 3)
    checkpoints = []
    for percent in CHECKPOINT_PERCENTAGES:  # [0.25, 0.50, 0.75, 1.00]
        checkpoint = generate_checkpoint_questions(video_id, percent)
        # Adjust 100% to trigger slightly before end
        if percent >= 1.0:
            checkpoint.timestamp_seconds = max(duration_seconds - 5, int(duration_seconds * 0.95))
        else:
            checkpoint.timestamp_seconds = int(duration_seconds * percent)
        checkpoints.append(checkpoint)
    
    return checkpoints


@router.post("/checkpoints/generate")
async def generate_ai_checkpoints(request: GenerateCheckpointsRequest) -> List[CheckpointQuestion]:
    """Generate AI-powered checkpoint questions based on video transcript."""
    cache_key = f"{request.video_id}:{request.duration_seconds}"
    
    # Check cache first
    if cache_key in generated_checkpoints_cache:
        return generated_checkpoints_cache[cache_key]
    
    # Generate checkpoints using AI
    checkpoints = await ai_generate_checkpoints(
        transcript=request.transcript,
        duration_seconds=request.duration_seconds,
        video_id=request.video_id
    )
    
    # Cache the result
    generated_checkpoints_cache[cache_key] = checkpoints
    
    return checkpoints


@router.post("/checkpoint/answer")
async def submit_checkpoint_answer(result: CheckpointResult):
    """Submit answer for a checkpoint question."""
    key = f"{result.trail_id or 'standalone'}:{result.video_id}"
    
    if key not in checkpoint_results_db:
        checkpoint_results_db[key] = []
    
    checkpoint_results_db[key].append(result.dict())
    
    # Update video progress for score tracking
    if key not in video_progress_db:
        video_progress_db[key] = {
            "video_id": result.video_id,
            "trail_id": result.trail_id,
            "checkpoints_answered": 0,
            "checkpoints_skipped": 0,
            "checkpoints_correct": 0,
            "checkpoint_score_impact": 0.0
        }
    
    progress = video_progress_db[key]
    progress["checkpoints_answered"] = progress.get("checkpoints_answered", 0) + 1
    if result.is_correct:
        progress["checkpoints_correct"] = progress.get("checkpoints_correct", 0) + 1
    
    # Recalculate score impact
    progress["checkpoint_score_impact"] = calculate_checkpoint_score_impact(
        correct_count=progress.get("checkpoints_correct", 0),
        skipped_count=progress.get("checkpoints_skipped", 0)
    )
    
    return {
        "success": True,
        "is_correct": result.is_correct,
        "message": "Correto! +5% na nota final!" if result.is_correct else "Não foi dessa vez. Continue assistindo!",
        "score_impact": progress["checkpoint_score_impact"]
    }


@router.post("/checkpoint/skip")
async def skip_checkpoint(request: SkipCheckpointRequest):
    """Record that a checkpoint was skipped. Affects final grade (-2%)."""
    key = f"{request.trail_id or 'standalone'}:{request.video_id}"
    
    if key not in checkpoint_results_db:
        checkpoint_results_db[key] = []
    
    # Record the skip
    skip_result = CheckpointResult(
        checkpoint_id=request.checkpoint_id,
        video_id=request.video_id,
        trail_id=request.trail_id,
        selected_answer=-1,  # -1 indicates skipped
        is_correct=False,
        skipped=True
    )
    checkpoint_results_db[key].append(skip_result.dict())
    
    # Update video progress
    if key not in video_progress_db:
        video_progress_db[key] = {
            "video_id": request.video_id,
            "trail_id": request.trail_id,
            "checkpoints_answered": 0,
            "checkpoints_skipped": 0,
            "checkpoints_correct": 0,
            "checkpoint_score_impact": 0.0
        }
    
    progress = video_progress_db[key]
    progress["checkpoints_skipped"] = progress.get("checkpoints_skipped", 0) + 1
    
    # Recalculate score impact
    progress["checkpoint_score_impact"] = calculate_checkpoint_score_impact(
        correct_count=progress.get("checkpoints_correct", 0),
        skipped_count=progress.get("checkpoints_skipped", 0)
    )
    
    return {
        "success": True,
        "message": "Checkpoint pulado. -2% na nota final.",
        "score_impact": progress["checkpoint_score_impact"]
    }



@router.get("/progress/{trail_id}/{video_id}")
async def get_video_progress(trail_id: str, video_id: str) -> VideoProgress:
    """Get detailed progress for a specific video."""
    key = f"{trail_id}:{video_id}"
    
    progress = video_progress_db.get(key, {
        "video_id": video_id,
        "trail_id": trail_id,
        "watched_seconds": 0,
        "total_seconds": None,
        "completed": False,
        "checkpoint_results": [],
        "checkpoint_score": 0.0
    })
    
    return VideoProgress(**progress)


@router.patch("/progress/video")
async def update_video_progress(
    trail_id: str,
    video_id: str,
    watched_seconds: int,
    total_seconds: Optional[int] = None
):
    """Update watched time for a video."""
    key = f"{trail_id}:{video_id}"
    
    progress = video_progress_db.get(key, {
        "video_id": video_id,
        "trail_id": trail_id,
        "watched_seconds": 0,
        "total_seconds": total_seconds,
        "completed": False,
        "checkpoint_results": [],
        "checkpoint_score": 0.0
    })
    
    progress["watched_seconds"] = max(progress["watched_seconds"], watched_seconds)
    if total_seconds:
        progress["total_seconds"] = total_seconds
        if watched_seconds >= total_seconds * 0.95:
            progress["completed"] = True
    
    video_progress_db[key] = progress
    
    return {"success": True, "completed": progress["completed"]}


@router.get("/final/{trail_id}")
async def generate_final_assessment(trail_id: str) -> FinalAssessmentResponse:
    """Generate final assessment for a trail."""
    # Mock questions - in production, use Gemini AI based on trail content
    questions = [
        FinalAssessmentQuestion(
            id=f"q{i+1}",
            question=f"Questão {i+1} sobre o conteúdo da trilha",
            options=["Opção A", "Opção B", "Opção C", "Opção D"],
            correct_answer=0,
            points=10
        )
        for i in range(10)
    ]
    
    assessment_id = str(uuid4())
    assessment = FinalAssessmentResponse(
        id=assessment_id,
        trail_id=trail_id,
        questions=questions,
        total_points=sum(q.points for q in questions),
        time_limit_minutes=30,
        generated_at=datetime.utcnow()
    )
    
    final_assessments_db[assessment_id] = assessment.dict()
    
    return assessment


@router.post("/final/submit")
async def submit_final_assessment(request: SubmitAssessmentRequest) -> AssessmentResultResponse:
    """Submit answers for final assessment."""
    if request.assessment_id not in final_assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    assessment = final_assessments_db[request.assessment_id]
    questions = assessment["questions"]
    
    # Calculate score
    correct = 0
    total_points = 0
    
    for q in questions:
        total_points += q["points"]
        if request.answers.get(q["id"]) == q["correct_answer"]:
            correct += q["points"]
    
    percentage = (correct / total_points) * 100 if total_points > 0 else 0
    passed = percentage >= 60
    
    result = AssessmentResultResponse(
        assessment_id=request.assessment_id,
        trail_id=assessment["trail_id"],
        score=correct,
        total_points=total_points,
        percentage=percentage,
        passed=passed,
        completed_at=datetime.utcnow()
    )
    
    assessment_results_db[f"{assessment['trail_id']}:demo-user"] = result.dict()
    
    return result


@router.get("/eligibility/{trail_id}")
async def check_certificate_eligibility(trail_id: str) -> EligibilityCheck:
    """Check if user is eligible for certificate."""
    # Get trail progress from trails router storage
    from routers.trails import trail_videos_db, user_progress_db
    
    videos = trail_videos_db.get(trail_id, [])
    total_videos = len(videos)
    completed_videos = 0
    
    for video in videos:
        progress_key = f"demo-user:{trail_id}:{video['id']}"
        progress = user_progress_db.get(progress_key, {})
        if progress.get("completed", False):
            completed_videos += 1
    
    completion_percentage = (completed_videos / total_videos * 100) if total_videos > 0 else 0
    
    # Check final assessment
    result_key = f"{trail_id}:demo-user"
    assessment_result = assessment_results_db.get(result_key)
    
    final_passed = assessment_result["passed"] if assessment_result else None
    final_score = assessment_result["percentage"] if assessment_result else None
    
    # Determine eligibility
    missing = []
    if completion_percentage < 100:
        missing.append(f"Completar todos os vídeos ({completed_videos}/{total_videos})")
    if final_passed is None:
        missing.append("Realizar avaliação final")
    elif not final_passed:
        missing.append("Aprovação na avaliação final (mínimo 60%)")
    
    is_eligible = completion_percentage >= 100 and final_passed is True
    
    return EligibilityCheck(
        trail_id=trail_id,
        is_eligible=is_eligible,
        completion_percentage=completion_percentage,
        checkpoint_average=0.0,  # TODO: Calculate from checkpoint results
        final_assessment_passed=final_passed,
        final_score=final_score,
        missing_requirements=missing
    )
