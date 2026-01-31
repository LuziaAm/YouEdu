from fastapi import APIRouter, HTTPException
from schemas.youtube import YouTubeParseRequest, YouTubeParseResponse
import re
from typing import Optional

router = APIRouter()


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from various URL formats.
    
    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/v/VIDEO_ID
    """
    patterns = [
        r'(?:v=|/)([0-9A-Za-z_-]{11}).*',
        r'youtu\.be/([0-9A-Za-z_-]{11})',
        r'embed/([0-9A-Za-z_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None


def extract_playlist_id(url: str) -> Optional[str]:
    """Extract YouTube playlist ID from URL."""
    match = re.search(r'[?&]list=([0-9A-Za-z_-]+)', url)
    return match.group(1) if match else None


def extract_vimeo_id(url: str) -> Optional[str]:
    """Extract Vimeo ID from URL."""
    match = re.search(r'vimeo\.com/(?:video/|channels/[^/]+/|groups/[^/]+/videos/|)?([0-9]+)', url)
    return match.group(1) if match else None


@router.post("/parse", response_model=YouTubeParseResponse)
async def parse_youtube_url(request: YouTubeParseRequest):
    """
    Parse video URL and extract video ID (YouTube or Vimeo).
    """
    try:
        url = request.url
        
        # Try YouTube
        video_id = extract_video_id(url)
        provider = "youtube"
        
        # Try Vimeo if not YouTube
        if not video_id:
            video_id = extract_vimeo_id(url)
            if video_id:
                provider = "vimeo"
        
        playlist_id = extract_playlist_id(url)
        
        # Determine type
        if video_id:
            url_type = "video"
        elif playlist_id:
            url_type = "playlist"
        else:
            url_type = "unknown"
            provider = None
        
        return YouTubeParseResponse(
            videoId=video_id,
            playlistId=playlist_id,
            provider=provider,
            type=url_type
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse YouTube URL: {str(e)}"
        )


@router.get("/oembed")
async def get_oembed(url: str):
    """
    Get YouTube video metadata using oEmbed API.
    
    This endpoint is optional and can be used to fetch video title and thumbnails.
    """
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.youtube.com/oembed?url={url}&format=json"
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch oEmbed data: {str(e)}"
        )
