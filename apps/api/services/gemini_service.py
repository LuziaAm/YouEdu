"""
Gemini video analysis service with model fallback.
"""

import os
import base64
import time
import json
from typing import Any, List
from google import genai
from google.genai import types

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")

# Model fallback order
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite", 
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
]

# Enhanced system prompt for pedagogical tutor
SYSTEM_PROMPT = """
Você é um tutor pedagógico especialista em criar experiências de aprendizado gamificadas e interativas.

SUA MISSÃO:
Analisar o vídeo educacional fornecido e criar desafios interativos que testem a compreensão do aluno em momentos estratégicos.

DIRETRIZES:
1. Identifique momentos-chave para pausar e verificar o conhecimento.
2. Crie quizzes de múltipla escolha e exercícios de código.
3. Distribua os desafios ao longo do vídeo.

SAÍDA ESPERADA (JSON):
{
  "challenges": [
    {
      "timestamp": 45,
      "timestampLabel": "00:45",
      "type": "quiz",
      "title": "Conceito de Variáveis",
      "content": "Qual a função principal de uma variável?",
      "options": ["Armazenar dados", "Loop", "Função", "Texto"],
      "correctAnswer": 0,
      "summary": "Explicação..."
    }
  ]
}
"""


def _call_gemini_with_fallback(client: genai.Client, contents: list, config: types.GenerateContentConfig) -> str:
    """
    Try multiple Gemini models with fallback on quota/not-found errors.
    """
    last_error = None
    
    for model in GEMINI_MODELS:
        try:
            print(f"Trying model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            if response.text:
                print(f"Success with model: {model}")
                return response.text
            else:
                print(f"Empty response from {model}, trying next...")
                continue
                
        except Exception as e:
            error_str = str(e)
            print(f"Model {model} failed: {error_str[:200]}")
            
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                last_error = e
                continue
            elif "404" in error_str or "NOT_FOUND" in error_str:
                last_error = e
                continue
            else:
                raise e
    
    raise Exception(f"All Gemini models failed. Last error: {last_error}")


async def analyze_video(video_base64: str, mime_type: str) -> List[dict[str, Any]]:
    """
    Analyze video using Google GenAI SDK with model fallback.
    """
    if not api_key:
        print("GEMINI_API_KEY not set, returning fallback")
        return _get_fallback_challenges()
    
    try:
        client = genai.Client(api_key=api_key)
        
        video_bytes = base64.b64decode(video_base64)
        
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=video_bytes, mime_type=mime_type),
                    types.Part.from_text(text=SYSTEM_PROMPT)
                ]
            )
        ]
        
        config = types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
            response_mime_type="application/json"
        )
        
        response_text = _call_gemini_with_fallback(client, contents, config)
        data = json.loads(response_text)
        
        challenges = data.get('challenges', [])
        timestamp = int(time.time() * 1000)
        
        for i, challenge in enumerate(challenges):
            challenge['id'] = f"ai-{timestamp}-{i}"
            
        return challenges
            
    except Exception as e:
        print(f"Error analyzing video: {str(e)}")
        print("Falling back to mock challenges due to API error")
        return _get_fallback_challenges()


def _get_fallback_challenges() -> List[dict[str, Any]]:
    """Return mock challenges when AI fails."""
    return [
        {
            "id": "fallback-1",
            "timestamp": 30,
            "timestampLabel": "00:30",
            "type": "quiz",
            "title": "Conceito Inicial",
            "content": "Qual o objetivo principal apresentado?",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctAnswer": 0,
            "summary": "Fallback challenge generated due to AI error."
        }
    ]
