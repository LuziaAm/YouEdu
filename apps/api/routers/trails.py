"""
Router for Trails (learning paths) management.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import uuid4
from datetime import datetime
import re

from schemas.trails import (
    TrailCreate, TrailUpdate, TrailResponse, TrailDetailResponse,
    AddVideoRequest, TrailVideoResponse, ProgressUpdate, ProgressResponse
)

router = APIRouter()

# In-memory storage for development (replace with Supabase in production)
trails_db = {}
trail_videos_db = {}
user_progress_db = {}


def extract_video_info(url: str) -> dict:
    """Extract provider and video ID from URL."""
    # YouTube patterns
    yt_patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in yt_patterns:
        match = re.search(pattern, url)
        if match:
            return {"provider": "youtube", "video_id": match.group(1)}
    
    # Vimeo patterns
    vimeo_match = re.search(r'vimeo\.com/(?:video/)?(\d+)', url)
    if vimeo_match:
        return {"provider": "vimeo", "video_id": vimeo_match.group(1)}
    
    # Direct video URL
    if any(ext in url.lower() for ext in ['.mp4', '.webm', '.ogg', '.mov']):
        return {"provider": "direct", "video_id": None}
    
    return {"provider": "unknown", "video_id": None}


@router.post("", response_model=TrailResponse)
async def create_trail(trail: TrailCreate):
    """Create a new learning trail."""
    trail_id = str(uuid4())
    now = datetime.utcnow()
    
    # Create trail
    trail_data = {
        "id": trail_id,
        "title": trail.title,
        "description": trail.description,
        "cover_image_url": trail.cover_image_url,
        "is_public": trail.is_public,
        "created_at": now,
        "user_id": "demo-user"  # TODO: Get from auth
    }
    trails_db[trail_id] = trail_data
    
    # Add initial videos if provided
    trail_videos_db[trail_id] = []
    if trail.videos:
        for i, video in enumerate(trail.videos):
            video_info = extract_video_info(video.video_url)
            video_data = {
                "id": str(uuid4()),
                "trail_id": trail_id,
                "video_url": video.video_url,
                "video_provider": video_info["provider"],
                "video_id": video_info["video_id"],
                "title": video.title,
                "duration_seconds": video.duration_seconds,
                "order_index": i
            }
            trail_videos_db[trail_id].append(video_data)
    
    return TrailResponse(
        id=trail_id,
        title=trail.title,
        description=trail.description,
        cover_image_url=trail.cover_image_url,
        is_public=trail.is_public,
        created_at=now,
        video_count=len(trail_videos_db.get(trail_id, [])),
        completed_count=0,
        total_duration_seconds=sum(v.get("duration_seconds", 0) or 0 for v in trail_videos_db.get(trail_id, []))
    )


@router.get("", response_model=List[TrailResponse])
async def list_trails():
    """List all trails for the current user."""
    result = []
    for trail_id, trail in trails_db.items():
        videos = trail_videos_db.get(trail_id, [])
        result.append(TrailResponse(
            id=trail["id"],
            title=trail["title"],
            description=trail.get("description"),
            cover_image_url=trail.get("cover_image_url"),
            is_public=trail.get("is_public", False),
            created_at=trail["created_at"],
            video_count=len(videos),
            completed_count=0,  # TODO: Calculate from progress
            total_duration_seconds=sum(v.get("duration_seconds", 0) or 0 for v in videos)
        ))
    return result


@router.get("/{trail_id}", response_model=TrailDetailResponse)
async def get_trail(trail_id: str):
    """Get detailed information about a trail."""
    if trail_id not in trails_db:
        raise HTTPException(status_code=404, detail="Trail not found")
    
    trail = trails_db[trail_id]
    videos = trail_videos_db.get(trail_id, [])
    
    # Get progress for each video
    video_responses = []
    for video in videos:
        progress_key = f"demo-user:{trail_id}:{video['id']}"
        progress = user_progress_db.get(progress_key, {})
        
        video_responses.append(TrailVideoResponse(
            id=video["id"],
            video_url=video["video_url"],
            video_provider=video.get("video_provider"),
            video_id=video.get("video_id"),
            title=video["title"],
            duration_seconds=video.get("duration_seconds"),
            order_index=video.get("order_index", 0),
            completed=progress.get("completed", False),
            quiz_score=progress.get("quiz_score")
        ))
    
    return TrailDetailResponse(
        id=trail["id"],
        title=trail["title"],
        description=trail.get("description"),
        cover_image_url=trail.get("cover_image_url"),
        is_public=trail.get("is_public", False),
        created_at=trail["created_at"],
        video_count=len(videos),
        completed_count=sum(1 for v in video_responses if v.completed),
        total_duration_seconds=sum(v.duration_seconds or 0 for v in video_responses),
        videos=video_responses
    )


@router.post("/{trail_id}/videos", response_model=TrailVideoResponse)
async def add_video_to_trail(trail_id: str, request: AddVideoRequest):
    """Add a video to an existing trail."""
    if trail_id not in trails_db:
        raise HTTPException(status_code=404, detail="Trail not found")
    
    if trail_id not in trail_videos_db:
        trail_videos_db[trail_id] = []
    
    video_info = extract_video_info(request.video_url)
    existing_videos = trail_videos_db[trail_id]
    
    video_data = {
        "id": str(uuid4()),
        "trail_id": trail_id,
        "video_url": request.video_url,
        "video_provider": video_info["provider"],
        "video_id": video_info["video_id"],
        "title": request.title or f"Vídeo {len(existing_videos) + 1}",
        "duration_seconds": None,
        "order_index": len(existing_videos)
    }
    
    trail_videos_db[trail_id].append(video_data)
    
    return TrailVideoResponse(
        id=video_data["id"],
        video_url=video_data["video_url"],
        video_provider=video_data["video_provider"],
        video_id=video_data["video_id"],
        title=video_data["title"],
        duration_seconds=video_data["duration_seconds"],
        order_index=video_data["order_index"],
        completed=False,
        quiz_score=None
    )


@router.delete("/{trail_id}")
async def delete_trail(trail_id: str):
    """Delete a trail and its videos."""
    if trail_id not in trails_db:
        raise HTTPException(status_code=404, detail="Trail not found")
    
    del trails_db[trail_id]
    if trail_id in trail_videos_db:
        del trail_videos_db[trail_id]
    
    return {"message": "Trail deleted successfully"}


@router.patch("/progress", response_model=ProgressResponse)
async def update_progress(progress: ProgressUpdate):
    """Update user progress on a video."""
    progress_key = f"demo-user:{progress.trail_id}:{progress.video_id}"
    
    existing = user_progress_db.get(progress_key, {
        "trail_id": progress.trail_id,
        "video_id": progress.video_id,
        "watched_seconds": 0,
        "completed": False,
        "quiz_score": None
    })
    
    if progress.watched_seconds is not None:
        existing["watched_seconds"] = progress.watched_seconds
    if progress.completed is not None:
        existing["completed"] = progress.completed
    if progress.quiz_score is not None:
        existing["quiz_score"] = progress.quiz_score
    
    user_progress_db[progress_key] = existing
    
    return ProgressResponse(**existing)
