"""
Service for extracting captions/transcripts from YouTube videos.
Uses youtube-transcript-api to fetch auto-generated or manual captions.

Compatible with youtube-transcript-api >= 1.2.1 (new object-oriented API)
"""

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
from typing import Optional
import re


def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If it's already just a video ID
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
    
    return None


def get_youtube_captions(video_id: str, language_codes: list = None) -> dict:
    """
    Fetch captions/transcript from a YouTube video.
    
    Args:
        video_id: YouTube video ID
        language_codes: Preferred language codes in order (default: ['pt', 'en'])
    
    Returns:
        Dictionary with transcript data and segments
    """
    if language_codes is None:
        language_codes = ['pt', 'pt-BR', 'en', 'en-US', 'es']
    
    try:
        # Create API instance (new API in version 1.2.1+)
        api = YouTubeTranscriptApi()
        
        # Get list of available transcripts using new API
        transcript_list = api.list(video_id)
        
        transcript = None
        language_used = None
        is_generated = False
        
        # Try to find manual transcript first
        for lang in language_codes:
            try:
                transcript = transcript_list.find_transcript([lang])
                language_used = lang
                is_generated = transcript.is_generated
                break
            except NoTranscriptFound:
                continue
        
        # If no manual, try auto-generated
        if transcript is None:
            for lang in language_codes:
                try:
                    transcript = transcript_list.find_generated_transcript([lang])
                    language_used = lang
                    is_generated = True
                    break
                except NoTranscriptFound:
                    continue
        
        # Last resort: get any available transcript
        if transcript is None:
            try:
                available = list(transcript_list)
                if available:
                    transcript = available[0]
                    language_used = transcript.language_code
                    is_generated = transcript.is_generated
            except Exception:
                pass
        
        if transcript is None:
            return {
                "success": False,
                "error": "Nenhuma legenda encontrada para este vídeo",
                "transcript": None,
                "segments": []
            }
        
        # Fetch the actual transcript data
        fetched = transcript.fetch()
        
        # Convert to raw data format (compatibility with old code)
        data = fetched.to_raw_data()
        
        # Build full transcript text
        full_text = " ".join([item['text'] for item in data])
        
        # Build segments with timestamps
        segments = [
            {
                "start": item['start'],
                "duration": item.get('duration', 0),
                "text": item['text']
            }
            for item in data
        ]
        
        return {
            "success": True,
            "video_id": video_id,
            "language": language_used,
            "is_auto_generated": is_generated,
            "transcript": full_text,
            "segments": segments,
            "segment_count": len(segments),
            "duration": segments[-1]['start'] + segments[-1]['duration'] if segments else 0
        }
        
    except TranscriptsDisabled:
        return {
            "success": False,
            "error": "Legendas desabilitadas para este vídeo",
            "transcript": None,
            "segments": []
        }
    except VideoUnavailable:
        return {
            "success": False,
            "error": "Vídeo não disponível ou privado",
            "transcript": None,
            "segments": []
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro ao obter legendas: {str(e)}",
            "transcript": None,
            "segments": []
        }


def get_captions_from_url(url: str, language_codes: list = None) -> dict:
    """
    Convenience function to get captions from a YouTube URL.
    """
    video_id = extract_video_id(url)
    
    if not video_id:
        return {
            "success": False,
            "error": "URL inválida ou ID de vídeo não encontrado",
            "transcript": None,
            "segments": []
        }
    
    return get_youtube_captions(video_id, language_codes)
