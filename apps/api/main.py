"""
YouEdu API - Intelligent Learning Platform Backend

This module initializes the FastAPI application with all routes,
middleware, and startup/shutdown handlers.
"""

import os
import pathlib
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables FIRST, before importing routers
load_dotenv(pathlib.Path(__file__).parent.parent.parent / ".env")

from database import init_supabase
from routers import (
    assessment,
    auth,
    certificates,
    challenges,
    gamification,
    models,
    students,
    trails,
    transcription,
    youtube,
)


def get_cors_origins() -> list[str]:
    """
    Get allowed CORS origins from environment.

    In development, defaults to localhost origins.
    In production, should be set to actual domain(s).
    """
    env = os.getenv("NODE_ENV", "development")
    origins_str = os.getenv("CORS_ORIGINS", "")

    if origins_str:
        # Parse comma-separated origins from env
        return [origin.strip() for origin in origins_str.split(",") if origin.strip()]

    # Default origins based on environment
    if env == "production":
        # In production, require explicit CORS_ORIGINS configuration
        # Return empty list to deny all cross-origin requests
        return []

    # Development defaults
    return [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler for startup and shutdown events.

    Startup: Initialize database connections and services
    Shutdown: Clean up resources
    """
    # Startup
    try:
        init_supabase()
        print("Supabase initialized successfully")
    except Exception as e:
        print(f"Warning: Supabase initialization failed: {e}")
        print("The API will still work, but database features will be unavailable.")

    yield

    # Shutdown (cleanup if needed)
    print("Shutting down YouEdu API...")


# Create FastAPI application
app = FastAPI(
    title="YouEdu API",
    description="Backend API for YouEdu - Intelligent Learning Platform with Gemini AI",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS middleware
cors_origins = get_cors_origins()
env = os.getenv("NODE_ENV", "development")

if env == "development" and not cors_origins:
    # Fallback for development if no origins configured
    cors_origins = ["*"]
    print("Warning: CORS configured to allow all origins (development mode)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],  # Useful for pagination
)

# Include routers with API prefix
API_PREFIX = "/api"

app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Authentication"])
app.include_router(youtube.router, prefix=f"{API_PREFIX}/youtube", tags=["YouTube"])
app.include_router(
    challenges.router, prefix=f"{API_PREFIX}/challenges", tags=["Challenges"]
)
app.include_router(
    students.router, prefix=f"{API_PREFIX}/students", tags=["Students & Progress"]
)
app.include_router(
    transcription.router, prefix=f"{API_PREFIX}/transcription", tags=["Transcription"]
)
app.include_router(models.router, prefix=f"{API_PREFIX}/models", tags=["AI Models"])
app.include_router(trails.router, prefix=f"{API_PREFIX}/trails", tags=["Learning Trails"])
app.include_router(
    assessment.router, prefix=f"{API_PREFIX}/assessment", tags=["Assessment"]
)
app.include_router(
    certificates.router, prefix=f"{API_PREFIX}/certificates", tags=["Certificates"]
)
app.include_router(
    gamification.router, prefix=f"{API_PREFIX}/gamification", tags=["Gamification"]
)


@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "service": "youedu-api",
        "version": "2.0.0",
        "environment": os.getenv("NODE_ENV", "development"),
    }


@app.get("/")
async def root() -> dict:
    """Root endpoint with API information."""
    return {
        "name": "YouEdu API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
