"""
Router for Gemini model management and diagnostics.
"""
from fastapi import APIRouter, HTTPException
from google import genai
import os

router = APIRouter()

API_KEY = os.getenv("GEMINI_API_KEY")

@router.get("/list")
async def list_available_models():
    """
    List all available Gemini models for the current API key.
    This helps diagnose which models are accessible.
    """
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    
    try:
        client = genai.Client(api_key=API_KEY)
        
        models = []
        for model in client.models.list():
            models.append({
                "name": model.name,
                "display_name": getattr(model, 'display_name', model.name),
                "supported_methods": getattr(model, 'supported_generation_methods', [])
            })
        
        # Filter to show only models that support generateContent
        content_models = [m for m in models if 'generateContent' in str(m.get('supported_methods', []))]
        
        return {
            "total_models": len(models),
            "content_generation_models": len(content_models),
            "models": content_models[:20],  # Limit to first 20
            "all_model_names": [m["name"] for m in models]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")
