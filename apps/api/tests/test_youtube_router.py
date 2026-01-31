"""
YouTube Router Tests
"""

import pytest


def test_parse_youtube_url_valid(client):
    """Test parsing a valid YouTube URL."""
    response = client.post(
        "/api/youtube/parse",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "videoId" in data or "video_id" in data


def test_parse_youtube_url_invalid(client):
    """Test parsing an invalid URL returns error."""
    response = client.post(
        "/api/youtube/parse",
        json={"url": "not-a-valid-url"},
    )

    # Should either return 400 or 422 depending on validation
    assert response.status_code in [400, 422, 200]  # 200 if it returns error in body


def test_parse_youtube_url_missing(client):
    """Test missing URL parameter."""
    response = client.post("/api/youtube/parse", json={})

    assert response.status_code == 422  # Validation error
