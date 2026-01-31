from fastapi import APIRouter, HTTPException
from schemas.challenges import ChallengeGenerateRequest, ChallengesResponse
from services.gemini_service import analyze_video

router = APIRouter()


@router.post("/generate", response_model=ChallengesResponse)
async def generate_challenges(request: ChallengeGenerateRequest):
    """
    Generate educational challenges from video using Gemini AI.
    
    This endpoint:
    1. Receives base64 encoded video
    2. Analyzes it with Gemini AI
    3. Returns timestamped challenges (quiz or code exercises)
    """
    try:
        result = await analyze_video(
            video_base64=request.videoBase64,
            mime_type=request.mimeType
        )
        
        return ChallengesResponse(challenges=result['challenges'])
    
    except Exception as e:
        print(f"Challenge generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate challenges. Please try again with a different video."
        )
