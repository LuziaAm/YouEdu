"""
Pytest Configuration and Fixtures

This module provides shared fixtures for all tests.
"""

import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# Set test environment variables before importing app
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role-key"
os.environ["GEMINI_API_KEY"] = "test-gemini-key"
os.environ["NODE_ENV"] = "test"


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for tests."""
    mock_client = MagicMock()

    # Mock common operations
    mock_client.table.return_value.select.return_value.execute.return_value.data = []
    mock_client.table.return_value.insert.return_value.execute.return_value.data = [{}]
    mock_client.table.return_value.update.return_value.execute.return_value.data = [{}]
    mock_client.table.return_value.delete.return_value.execute.return_value.data = [{}]

    return mock_client


@pytest.fixture
def client(mock_supabase):
    """Create a test client with mocked dependencies."""
    with patch("database.supabase_client.get_supabase_client", return_value=mock_supabase):
        with patch("database.init_supabase", return_value=mock_supabase):
            from main import app

            with TestClient(app) as test_client:
                yield test_client


@pytest.fixture
def authenticated_client(client):
    """
    Test client with authentication headers.

    In a real scenario, you would generate a valid JWT token.
    """
    client.headers["Authorization"] = "Bearer test-token"
    return client


@pytest.fixture
def sample_student():
    """Sample student data for tests."""
    return {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Test Student",
        "email": "test@example.com",
        "total_xp": 100,
        "level": 2,
    }


@pytest.fixture
def sample_video_session(sample_student):
    """Sample video session data for tests."""
    return {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "student_id": sample_student["id"],
        "video_title": "Test Video",
        "video_url": "https://youtube.com/watch?v=test123",
        "video_source": "youtube",
        "video_duration": 600,
        "score": 85,
    }
