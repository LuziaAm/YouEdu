"""
Gamification endpoints for tracking real-time session data
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from services.supabase_service import (
    get_record_by_id, get_all_records, create_record, update_record
)

router = APIRouter()

# In-memory session tracking (for demo purposes)
# In production, this would be stored in the database
session_data = {}


class SessionStats(BaseModel):
    streak_days: int = 0
    questions_today: int = 0
    xp_today: int = 0
    last_activity: Optional[str] = None


class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    target: int
    current: int
    completed: bool = False


class Mission(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    reward_xp: int
    progress: int
    target: int


class GamificationData(BaseModel):
    session: SessionStats
    next_achievement: Optional[Achievement]
    missions: List[Mission]


class UpdateSessionRequest(BaseModel):
    student_id: str
    questions_answered: Optional[int] = None
    xp_earned: Optional[int] = None
    correct_answers: Optional[int] = None


def get_or_create_session(student_id: str) -> dict:
    """Get or create a session for a student"""
    today = date.today().isoformat()
    
    if student_id not in session_data:
        session_data[student_id] = {
            "streak_days": 1,
            "questions_today": 0,
            "xp_today": 0,
            "correct_streak": 0,
            "total_correct_today": 0,
            "code_challenges_today": 0,
            "watch_time_today": 0,  # in seconds
            "last_activity_date": today,
            "consecutive_correct": 0
        }
    
    # Check if it's a new day
    session = session_data[student_id]
    if session["last_activity_date"] != today:
        # Check if yesterday for streak
        from datetime import timedelta
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        if session["last_activity_date"] == yesterday:
            session["streak_days"] += 1
        else:
            session["streak_days"] = 1
        
        # Reset daily counters
        session["questions_today"] = 0
        session["xp_today"] = 0
        session["correct_streak"] = 0
        session["total_correct_today"] = 0
        session["code_challenges_today"] = 0
        session["watch_time_today"] = 0
        session["last_activity_date"] = today
    
    return session


@router.get("/gamification/{student_id}")
async def get_gamification_data(student_id: str):
    """Get complete gamification data for dashboard"""
    session = get_or_create_session(student_id)
    
    # Calculate next achievement based on session data
    achievements = [
        {
            "id": "python-master",
            "name": "Sabichão do Python",
            "description": "Acertar 5 respostas consecutivas sem erro na categoria Backend.",
            "icon": "🐍",
            "category": "Backend",
            "target": 5,
            "current": min(session.get("consecutive_correct", 0), 5)
        },
        {
            "id": "code-warrior",
            "name": "Guerreiro do Código",
            "description": "Completar 10 desafios de código.",
            "icon": "⚔️",
            "category": "Coding",
            "target": 10,
            "current": session.get("code_challenges_today", 0)
        },
        {
            "id": "streak-master",
            "name": "Mestre da Consistência",
            "description": "Manter uma sequência de 7 dias de estudo.",
            "icon": "🔥",
            "category": "Streak",
            "target": 7,
            "current": session.get("streak_days", 0)
        }
    ]
    
    # Find next uncompleted achievement
    next_achievement = None
    for ach in achievements:
        if ach["current"] < ach["target"]:
            next_achievement = {
                **ach,
                "completed": False
            }
            break
    
    if not next_achievement:
        next_achievement = {
            **achievements[0],
            "completed": True
        }
    
    # Calculate missions
    missions = [
        {
            "id": "marathon",
            "title": "Maratona de Estudos",
            "description": "Assista 30min de conteúdo",
            "icon": "⏱️",
            "reward_xp": 500,
            "progress": min(session.get("watch_time_today", 0), 1800),  # max 30 min
            "target": 1800  # 30 minutes in seconds
        },
        {
            "id": "bug-hunter",
            "title": "Bug Hunter",
            "description": "Resolva 1 desafio de código",
            "icon": "🐛",
            "reward_xp": 300,
            "progress": min(session.get("code_challenges_today", 0), 1),
            "target": 1
        },
        {
            "id": "quiz-master",
            "title": "Mestre do Quiz",
            "description": "Responda 10 questões corretamente",
            "icon": "🎯",
            "reward_xp": 400,
            "progress": min(session.get("total_correct_today", 0), 10),
            "target": 10
        }
    ]
    
    return {
        "session": {
            "streak_days": session.get("streak_days", 0),
            "questions_today": session.get("questions_today", 0),
            "xp_today": session.get("xp_today", 0),
            "last_activity": session.get("last_activity_date")
        },
        "next_achievement": next_achievement,
        "missions": missions
    }


@router.post("/gamification/update")
async def update_session_stats(request: UpdateSessionRequest):
    """Update gamification stats after quiz/challenge completion"""
    session = get_or_create_session(request.student_id)
    
    if request.questions_answered:
        session["questions_today"] += request.questions_answered
    
    if request.xp_earned:
        session["xp_today"] += request.xp_earned
    
    if request.correct_answers:
        session["total_correct_today"] += request.correct_answers
        session["consecutive_correct"] += request.correct_answers
    
    session_data[request.student_id] = session
    
    return {
        "success": True,
        "updated_session": {
            "streak_days": session["streak_days"],
            "questions_today": session["questions_today"],
            "xp_today": session["xp_today"],
            "consecutive_correct": session["consecutive_correct"]
        }
    }


@router.post("/gamification/add-watch-time")
async def add_watch_time(student_id: str, seconds: int):
    """Add watch time to session"""
    session = get_or_create_session(student_id)
    session["watch_time_today"] += seconds
    return {"watch_time_today": session["watch_time_today"]}


@router.post("/gamification/complete-code-challenge")
async def complete_code_challenge(student_id: str):
    """Record a completed code challenge"""
    session = get_or_create_session(student_id)
    session["code_challenges_today"] += 1
    return {"code_challenges_today": session["code_challenges_today"]}


@router.post("/gamification/reset-streak")
async def reset_consecutive_correct(student_id: str):
    """Reset consecutive correct answers (on wrong answer)"""
    session = get_or_create_session(student_id)
    session["consecutive_correct"] = 0
    return {"consecutive_correct": 0}
