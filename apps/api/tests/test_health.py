"""
Health Check Endpoint Tests
"""

import pytest


def test_health_check(client):
    """Test health check endpoint returns healthy status."""
    response = client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "youedu-api"
    assert "version" in data


def test_root_endpoint(client):
    """Test root endpoint returns API info."""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "YouEdu API"
    assert "docs" in data
    assert "health" in data
