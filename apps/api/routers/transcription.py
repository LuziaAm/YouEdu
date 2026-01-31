"""
Router for video transcription endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from services.transcription_service import (
    transcribe_video,
    generate_quiz_from_transcript
)
from services.captions_service import get_youtube_captions, get_captions_from_url

router = APIRouter()


class CaptionsRequest(BaseModel):
    video_id: str = None
    url: str = None
    languages: Optional[List[str]] = None


@router.post("/transcribe")
async def transcribe_video_endpoint(file: UploadFile = File(...)):
    """
    Transcribe uploaded video file using real transcription services.
    
    Uses fallback chain:
    1. Google Cloud Speech-to-Text
    2. AssemblyAI
    3. Gemini AI
    
    Returns transcript with timestamps.
    """
    try:
        video_data = await file.read()
        transcript_data = await transcribe_video(video_data, file.content_type or "video/mp4")
        return transcript_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/youtube-captions")
async def youtube_captions_endpoint(request: CaptionsRequest):
    """
    Extract captions/subtitles from a YouTube video.
    
    Provide either video_id or url. Languages defaults to ['pt', 'en'].
    Returns full transcript and segments with timestamps.
    """
    try:
        if request.url:
            result = get_captions_from_url(request.url, request.languages)
        elif request.video_id:
            result = get_youtube_captions(request.video_id, request.languages)
        else:
            raise HTTPException(status_code=400, detail="video_id or url is required")
        
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("error", "Captions not found"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get captions: {str(e)}")


@router.get("/youtube-captions/{video_id}")
async def get_youtube_captions_by_id(video_id: str):
    """
    Get YouTube captions by video ID (GET method for convenience).
    """
    result = get_youtube_captions(video_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Captions not found"))
    
    return result


@router.post("/generate-quiz")
async def generate_quiz_endpoint(transcript: dict):
    """
    Generate quiz questions from transcript using AI.
    
    Request body:
    {
        "transcript": "full transcript text..."
    }
    """
    try:
        transcript_text = transcript.get("transcript", "")
        
        if not transcript_text:
            raise HTTPException(status_code=400, detail="Transcript text is required")
        
        quiz_data = generate_quiz_from_transcript(transcript_text)
        
        return quiz_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")


@router.get("/providers")
async def get_available_providers():
    """
    Check which transcription providers are configured.
    """
    import os
    
    google_cloud = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
    assemblyai = bool(os.getenv("ASSEMBLYAI_API_KEY"))
    gemini = bool(os.getenv("GEMINI_API_KEY"))
    
    return {
        "providers": {
            "google_cloud": {"configured": google_cloud, "priority": 1},
            "assemblyai": {"configured": assemblyai, "priority": 2},
            "gemini": {"configured": gemini, "priority": 3}
        },
        "active_count": sum([google_cloud, assemblyai, gemini]),
        "message": "At least one provider must be configured for transcription"
    }
