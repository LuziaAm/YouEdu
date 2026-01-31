from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import pathlib

# Load environment variables FIRST, before importing routers
load_dotenv(pathlib.Path(__file__).parent.parent.parent / ".env")

from routers import youtube, challenges, students, transcription, models, trails, assessment, certificates, gamification, auth
from database import init_supabase

app = FastAPI(
    title="YouEdu API",
    description="Backend API for YouEdu - Intelligent Learning Platform with Gemini AI",
    version="2.0.0"
)

# Configure CORS
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = ["*"] # Allow all origins for dev
# origins = [origin.strip() for origin in origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase on startup
@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup"""
    try:
        init_supabase()
        print("✅ Supabase initialized successfully")
    except Exception as e:
        print(f"⚠️  Warning: Supabase initialization failed: {e}")
        print("   The API will still work, but database features will be unavailable.")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(youtube.router, prefix="/api/youtube", tags=["YouTube"])
app.include_router(challenges.router, prefix="/api/challenges", tags=["Challenges"])
app.include_router(students.router, prefix="/api/students", tags=["Students & Progress"])
app.include_router(transcription.router, prefix="/api/transcription", tags=["Transcription"])
app.include_router(models.router, prefix="/api/models", tags=["AI Models"])
app.include_router(trails.router, prefix="/api/trails", tags=["Learning Trails"])
app.include_router(assessment.router, prefix="/api/assessment", tags=["Assessment"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["Gamification"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "your-edu-interativo-api",
        "version": "2.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Your-Edu-Interativo API",
        "docs": "/docs",
        "health": "/api/health"
    }
