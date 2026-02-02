from fastapi import APIRouter, HTTPException
from schemas.youtube import YouTubeParseRequest, YouTubeParseResponse
from pydantic import BaseModel
import re
import os
import httpx
from typing import Optional, List
from datetime import datetime, timedelta
import random

router = APIRouter()

# Cache for recommendations (simple in-memory cache)
_recommendations_cache = {
    "data": None,
    "timestamp": None,
    "cache_duration": timedelta(hours=1)
}


class VideoRecommendation(BaseModel):
    video_id: str
    title: str
    channel: str
    thumbnail: str
    views: str
    published_at: str
    url: str


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


def get_fallback_recommendations() -> List[VideoRecommendation]:
    """
    Return curated educational video recommendations as fallback.
    These are popular tech/programming videos for demonstration.
    """
    # Educational tech videos - curated list of popular programming content
    videos = [
        {
            "video_id": "rfscVS0vtbw",
            "title": "Learn Python - Full Course for Beginners",
            "channel": "freeCodeCamp.org",
            "thumbnail": "https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg",
            "views": "45M views",
            "published_at": "2024",
            "url": "https://www.youtube.com/watch?v=rfscVS0vtbw"
        },
        {
            "video_id": "PkZNo7MFNFg",
            "title": "Learn JavaScript - Full Course for Beginners",
            "channel": "freeCodeCamp.org",
            "thumbnail": "https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg",
            "views": "18M views",
            "published_at": "2024",
            "url": "https://www.youtube.com/watch?v=PkZNo7MFNFg"
        },
        {
            "video_id": "kqtD5dpn9C8",
            "title": "Python for Beginners - Learn Python in 1 Hour",
            "channel": "Programming with Mosh",
            "thumbnail": "https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg",
            "views": "28M views",
            "published_at": "2024",
            "url": "https://www.youtube.com/watch?v=kqtD5dpn9C8"
        },
        {
            "video_id": "zOjov-2OZ0E",
            "title": "React Tutorial for Beginners",
            "channel": "Programming with Mosh",
            "thumbnail": "https://i.ytimg.com/vi/zOjov-2OZ0E/hqdefault.jpg",
            "views": "8M views",
            "published_at": "2024",
            "url": "https://www.youtube.com/watch?v=zOjov-2OZ0E"
        },
        {
            "video_id": "Oe421EPjeBE",
            "title": "Node.js and Express.js - Full Course",
            "channel": "freeCodeCamp.org",
            "thumbnail": "https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg",
            "views": "6M views",
            "published_at": "2024",
            "url": "https://www.youtube.com/watch?v=Oe421EPjeBE"
        },
        {
            "video_id": "8hly31xKli0",
            "title": "Algorithms and Data Structures Tutorial",
            "channel": "freeCodeCamp.org",
            "thumbnail": "https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg",
            "views": "5M views",
            "published_at": "2024",
            "url": "https://www.youtube.com/watch?v=8hly31xKli0"
        }
    ]

    # Shuffle and return top recommendations
    random.shuffle(videos)
    return [VideoRecommendation(**v) for v in videos[:3]]


async def fetch_youtube_trending(api_key: str, category: str = "education") -> List[VideoRecommendation]:
    """
    Fetch trending/popular videos from YouTube Data API.
    Category 27 = Education
    """
    try:
        async with httpx.AsyncClient() as client:
            # Search for popular educational programming videos
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "key": api_key,
                    "part": "snippet",
                    "type": "video",
                    "q": "programação tutorial curso",
                    "order": "viewCount",
                    "relevanceLanguage": "pt",
                    "maxResults": 6,
                    "publishedAfter": (datetime.now() - timedelta(days=365)).isoformat() + "Z"
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()

            recommendations = []
            for item in data.get("items", [])[:3]:
                snippet = item.get("snippet", {})
                video_id = item.get("id", {}).get("videoId", "")

                recommendations.append(VideoRecommendation(
                    video_id=video_id,
                    title=snippet.get("title", ""),
                    channel=snippet.get("channelTitle", ""),
                    thumbnail=snippet.get("thumbnails", {}).get("high", {}).get("url",
                        f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"),
                    views="Popular",  # Would need another API call to get exact view count
                    published_at=snippet.get("publishedAt", "")[:10],
                    url=f"https://www.youtube.com/watch?v={video_id}"
                ))

            return recommendations
    except Exception as e:
        print(f"Error fetching YouTube trending: {e}")
        return []


@router.get("/recommendations", response_model=List[VideoRecommendation])
async def get_video_recommendations():
    """
    Get recommended educational videos from YouTube.
    Uses YouTube Data API if available, falls back to curated list.
    Results are cached for 1 hour.
    """
    global _recommendations_cache

    # Check cache
    if (_recommendations_cache["data"] is not None and
        _recommendations_cache["timestamp"] is not None and
        datetime.now() - _recommendations_cache["timestamp"] < _recommendations_cache["cache_duration"]):
        return _recommendations_cache["data"]

    # Try YouTube API first
    api_key = os.getenv("YOUTUBE_API_KEY")

    if api_key:
        recommendations = await fetch_youtube_trending(api_key)
        if recommendations:
            _recommendations_cache["data"] = recommendations
            _recommendations_cache["timestamp"] = datetime.now()
            return recommendations

    # Fallback to curated list
    recommendations = get_fallback_recommendations()
    _recommendations_cache["data"] = recommendations
    _recommendations_cache["timestamp"] = datetime.now()

    return recommendations
