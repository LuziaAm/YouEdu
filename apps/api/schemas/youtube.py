from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Optional


class YouTubeParseRequest(BaseModel):
    url: str = Field(..., description="YouTube URL to parse")
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("URL must be a non-empty string")
        return v.strip()


class YouTubeParseResponse(BaseModel):
    videoId: Optional[str] = Field(None, description="Extracted video ID")
    playlistId: Optional[str] = Field(None, description="Extracted playlist ID")
    provider: Optional[str] = Field("youtube", description="Provider: 'youtube', 'vimeo', etc.")
    type: str = Field(..., description="Type: 'video', 'playlist', or 'unknown'")


class OEmbedResponse(BaseModel):
    title: str
    author_name: str
    author_url: str
    type: str
    thumbnail_url: str
    thumbnail_width: int
    thumbnail_height: int
    html: str
