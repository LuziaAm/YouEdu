"""
Real transcription service using:
1. Google Cloud Speech-to-Text (primary)
2. AssemblyAI (fallback)
3. Google Gemini (tertiary fallback)

No mocks - real transcription only.
"""

import os
import subprocess
import tempfile
import json
import asyncio
from typing import Dict, Any, Optional, List
from pathlib import Path

# Google Cloud Speech
try:
    from google.cloud import speech
    GOOGLE_CLOUD_AVAILABLE = True
except ImportError:
    GOOGLE_CLOUD_AVAILABLE = False

# AssemblyAI
try:
    import assemblyai as aai
    ASSEMBLYAI_AVAILABLE = True
except ImportError:
    ASSEMBLYAI_AVAILABLE = False

# Google Gemini (tertiary)
from google import genai
from google.genai import types

# Environment variables
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini model fallback order
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite", 
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
]


class TranscriptSegment:
    def __init__(self, start: float, end: float, text: str):
        self.start = start
        self.end = end
        self.text = text
    
    def to_dict(self) -> Dict[str, Any]:
        return {"start": float(self.start), "end": float(self.end), "text": self.text}


def extract_audio_from_video(video_path: str, output_format: str = "wav") -> Optional[str]:
    """Extract audio from video using FFmpeg, optimized for speech recognition."""
    try:
        suffix = f".{output_format}"
        temp_audio = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
        temp_audio.close()
        audio_path = temp_audio.name
        
        # Settings optimized for speech recognition
        if output_format == "wav":
            cmd = [
                "ffmpeg", "-y", "-i", video_path,
                "-vn", "-acodec", "pcm_s16le",
                "-ac", "1", "-ar", "16000",
                audio_path
            ]
        else:  # mp3 for AssemblyAI
            cmd = [
                "ffmpeg", "-y", "-i", video_path,
                "-vn", "-acodec", "libmp3lame",
                "-ac", "1", "-ar", "16000", "-q:a", "4",
                audio_path
            ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        return audio_path
        
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode()
        print(f"FFmpeg error: {error_msg}")
        if "Output file does not contain any stream" in error_msg:
            return None
        raise Exception(f"Failed to extract audio: {error_msg}")


# ============================================================================
# GOOGLE CLOUD SPEECH-TO-TEXT (PRIMARY)
# ============================================================================

async def transcribe_with_google_cloud(audio_path: str) -> Dict[str, Any]:
    """
    Transcribe audio using Google Cloud Speech-to-Text.
    Requires GOOGLE_APPLICATION_CREDENTIALS environment variable.
    """
    if not GOOGLE_CLOUD_AVAILABLE:
        raise Exception("google-cloud-speech not installed")
    
    if not GOOGLE_APPLICATION_CREDENTIALS:
        raise Exception("GOOGLE_APPLICATION_CREDENTIALS not set")
    
    print("📢 Transcribing with Google Cloud Speech-to-Text...")
    
    client = speech.SpeechClient()
    
    with open(audio_path, "rb") as audio_file:
        content = audio_file.read()
    
    audio = speech.RecognitionAudio(content=content)
    
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code="pt-BR",
        alternative_language_codes=["en-US", "es-ES"],
        enable_word_time_offsets=True,
        enable_automatic_punctuation=True,
        model="latest_long",
    )
    
    # Use async long-running recognition for longer audio
    operation = client.long_running_recognize(config=config, audio=audio)
    print("Waiting for Google Cloud operation to complete...")
    response = operation.result(timeout=300)
    
    segments = []
    full_transcript = []
    
    for result in response.results:
        if result.alternatives:
            alt = result.alternatives[0]
            text = alt.transcript
            full_transcript.append(text)
            
            # Get word-level timing for segments
            if alt.words:
                start_time = alt.words[0].start_time.total_seconds()
                end_time = alt.words[-1].end_time.total_seconds()
                segments.append({
                    "start": start_time,
                    "end": end_time,
                    "text": text
                })
    
    duration = segments[-1]["end"] if segments else 0
    
    return {
        "transcript": " ".join(full_transcript),
        "segments": segments,
        "duration": duration,
        "language": "pt-BR",
        "provider": "google_cloud"
    }


# ============================================================================
# ASSEMBLYAI (SECONDARY FALLBACK)
# ============================================================================

async def transcribe_with_assemblyai(audio_path: str) -> Dict[str, Any]:
    """
    Transcribe audio using AssemblyAI.
    Requires ASSEMBLYAI_API_KEY environment variable.
    """
    if not ASSEMBLYAI_AVAILABLE:
        raise Exception("assemblyai not installed")
    
    if not ASSEMBLYAI_API_KEY:
        raise Exception("ASSEMBLYAI_API_KEY not set")
    
    print("📢 Transcribing with AssemblyAI...")
    
    aai.settings.api_key = ASSEMBLYAI_API_KEY
    
    config = aai.TranscriptionConfig(
        language_code="pt",
        punctuate=True,
        format_text=True,
    )
    
    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(audio_path, config=config)
    
    if transcript.status == aai.TranscriptStatus.error:
        raise Exception(f"AssemblyAI error: {transcript.error}")
    
    segments = []
    if transcript.words:
        # Group words into sentences (roughly every 10 words or at punctuation)
        current_segment = {"start": 0, "end": 0, "words": []}
        
        for word in transcript.words:
            if not current_segment["words"]:
                current_segment["start"] = word.start / 1000  # ms to seconds
            
            current_segment["words"].append(word.text)
            current_segment["end"] = word.end / 1000
            
            # Split at sentence-ending punctuation or every ~15 words
            if word.text.endswith(('.', '?', '!')) or len(current_segment["words"]) >= 15:
                segments.append({
                    "start": current_segment["start"],
                    "end": current_segment["end"],
                    "text": " ".join(current_segment["words"])
                })
                current_segment = {"start": 0, "end": 0, "words": []}
        
        # Add remaining words
        if current_segment["words"]:
            segments.append({
                "start": current_segment["start"],
                "end": current_segment["end"],
                "text": " ".join(current_segment["words"])
            })
    
    duration = segments[-1]["end"] if segments else 0
    
    return {
        "transcript": transcript.text or "",
        "segments": segments,
        "duration": duration,
        "language": transcript.language_code or "pt",
        "provider": "assemblyai"
    }


# ============================================================================
# GEMINI (TERTIARY FALLBACK)
# ============================================================================

def _call_gemini_with_fallback(client: genai.Client, contents: list, config: types.GenerateContentConfig) -> str:
    """Try multiple Gemini models with fallback on quota errors."""
    last_error = None
    
    for model in GEMINI_MODELS:
        try:
            print(f"Trying Gemini model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            if response.text:
                print(f"Success with model: {model}")
                return response.text
        except Exception as e:
            error_str = str(e)
            print(f"Model {model} failed: {error_str[:100]}")
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "404" in error_str:
                last_error = e
                continue
            raise e
    
    raise Exception(f"All Gemini models failed. Last error: {last_error}")


async def transcribe_with_gemini(audio_path: str) -> Dict[str, Any]:
    """Transcribe audio using Gemini (tertiary fallback)."""
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY not set")
    
    print("📢 Transcribing with Gemini AI...")
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    with open(audio_path, "rb") as f:
        audio_data = f.read()
    
    prompt = """
    Transcreva o áudio a seguir com precisão.
    Retorne APENAS um JSON válido com este formato:
    {
      "transcript": "Texto completo corrido...",
      "segments": [
        {"start": 0.0, "end": 5.2, "text": "Trecho..."}
      ],
      "language": "pt-BR"
    }
    """
    
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_bytes(data=audio_data, mime_type="audio/mp3"),
                types.Part.from_text(text=prompt)
            ]
        )
    ]
    
    config = types.GenerateContentConfig(
        temperature=0.3,
        response_mime_type="application/json"
    )
    
    response_text = _call_gemini_with_fallback(client, contents, config)
    data = json.loads(response_text)
    
    duration = 0
    if "segments" in data and data["segments"]:
        duration = data["segments"][-1].get("end", 0)
    
    data["duration"] = duration
    data["provider"] = "gemini"
    return data


# ============================================================================
# MAIN TRANSCRIPTION FUNCTION (with fallback chain)
# ============================================================================

async def transcribe_audio(audio_path: str, prefer_mp3: bool = False) -> Dict[str, Any]:
    """
    Transcribe audio using the fallback chain:
    1. Google Cloud Speech-to-Text (best quality)
    2. AssemblyAI (good quality, cloud-based)
    3. Gemini AI (fallback)
    
    Raises exception if all providers fail.
    """
    errors = []
    
    # 1. Try Google Cloud Speech-to-Text
    if GOOGLE_APPLICATION_CREDENTIALS and GOOGLE_CLOUD_AVAILABLE:
        try:
            return await transcribe_with_google_cloud(audio_path)
        except Exception as e:
            print(f"❌ Google Cloud failed: {e}")
            errors.append(f"Google Cloud: {str(e)[:100]}")
    else:
        print("⚠️ Google Cloud Speech not configured (missing GOOGLE_APPLICATION_CREDENTIALS)")
    
    # 2. Try AssemblyAI
    if ASSEMBLYAI_API_KEY and ASSEMBLYAI_AVAILABLE:
        try:
            # AssemblyAI works better with mp3
            mp3_path = audio_path
            if not audio_path.endswith('.mp3'):
                mp3_path = audio_path.replace('.wav', '.mp3')
                # Convert if needed
                if not os.path.exists(mp3_path):
                    cmd = ["ffmpeg", "-y", "-i", audio_path, "-acodec", "libmp3lame", "-q:a", "4", mp3_path]
                    subprocess.run(cmd, check=True, capture_output=True)
            
            return await transcribe_with_assemblyai(mp3_path)
        except Exception as e:
            print(f"❌ AssemblyAI failed: {e}")
            errors.append(f"AssemblyAI: {str(e)[:100]}")
    else:
        print("⚠️ AssemblyAI not configured (missing ASSEMBLYAI_API_KEY)")
    
    # 3. Try Gemini
    if GEMINI_API_KEY:
        try:
            return await transcribe_with_gemini(audio_path)
        except Exception as e:
            print(f"❌ Gemini failed: {e}")
            errors.append(f"Gemini: {str(e)[:100]}")
    else:
        print("⚠️ Gemini not configured (missing GEMINI_API_KEY)")
    
    # All providers failed
    raise Exception(f"All transcription providers failed: {'; '.join(errors)}")


async def transcribe_video(video_data: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Main entry point for video transcription.
    1. Saves video to temp
    2. Extracts audio
    3. Transcribes using available providers
    """
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_video:
        temp_video.write(video_data)
        temp_video_path = temp_video.name
    
    audio_path = None
    try:
        # Extract audio as WAV (best for Google Cloud)
        audio_path = extract_audio_from_video(temp_video_path, "wav")
        
        if not audio_path:
            raise Exception("No audio track found in video")
        
        result = await transcribe_audio(audio_path)
        return result
        
    finally:
        if os.path.exists(temp_video_path):
            os.unlink(temp_video_path)
        if audio_path and os.path.exists(audio_path):
            os.unlink(audio_path)
        # Clean up potential mp3 conversion
        mp3_path = audio_path.replace('.wav', '.mp3') if audio_path else None
        if mp3_path and os.path.exists(mp3_path):
            os.unlink(mp3_path)


# ============================================================================
# QUIZ GENERATION (using Gemini)
# ============================================================================

def calculate_quiz_questions(duration_seconds: int) -> int:
    """
    Calculate the number of quiz questions based on video duration.

    Formula: 1 question per 3 minutes, minimum 2, maximum 10.
    - Videos < 3 min: 2 questions
    - Videos 3-6 min: 2 questions
    - Videos 6-9 min: 3 questions
    - Videos 9-12 min: 4 questions
    - ... and so on
    - Videos >= 27 min: 10 questions (max)
    """
    duration_minutes = duration_seconds / 60
    num_questions = max(2, min(10, int(duration_minutes / 3) + 1))
    return num_questions


def generate_quiz_from_transcript(transcript_text: str, duration_seconds: int = 300) -> Dict[str, Any]:
    """
    Generate quiz questions based on transcript using Gemini.

    The number of questions is proportional to video duration:
    - Minimum: 2 questions
    - Maximum: 10 questions
    - Formula: ~1 question per 3 minutes of video
    """
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY not set for quiz generation")

    # Calculate proportional number of questions
    num_questions = calculate_quiz_questions(duration_seconds)
    duration_minutes = duration_seconds / 60

    print(f"📝 Generating quiz: {num_questions} questions for {duration_minutes:.1f} min video")

    client = genai.Client(api_key=GEMINI_API_KEY)

    # Decide if coding exercise should be included (only for longer videos)
    include_coding = duration_seconds >= 600  # 10+ minutes
    coding_instruction = "e 1 exercício de código (se o conteúdo envolver programação)" if include_coding else ""

    prompt = f"""
    Com base no seguinte texto transcrito de uma aula, crie um quiz educativo.

    TEXTO:
    "{transcript_text[:10000]}"

    TAREFA:
    Gere EXATAMENTE {num_questions} perguntas de múltipla escolha{coding_instruction}.
    
    FORMATO JSON:
    {{
        "questions": [
            {{
                "id": "q1",
                "question": "...",
                "options": ["A", "B", "C", "D"],
                "correctAnswer": 0,
                "explanation": "..."
            }}
        ],
        "codingExercises": [
            {{
                "id": "ex1",
                "title": "...",
                "description": "...",
                "starterCode": "...",
                "expectedOutput": "..."
            }}
        ]
    }}
    """

    config = types.GenerateContentConfig(
        temperature=0.5,
        response_mime_type="application/json"
    )
    
    response_text = _call_gemini_with_fallback(client, [prompt], config)
    result = json.loads(response_text)
    
    q_count = len(result.get("questions", []))
    ex_count = len(result.get("codingExercises", []))
    result["totalPoints"] = (q_count * 20) + (ex_count * 50)
    
    return result
