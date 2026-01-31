"""
Checkpoint AI Service - Generates checkpoint questions using Gemini AI.
Questions are based on video transcript segments.
"""

import os
import json
import time
from typing import List, Optional
from google import genai
from google.genai import types

from schemas.assessment import CheckpointQuestion

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")

# Model fallback order (same as gemini_service)
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite", 
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
]

# Checkpoint percentages (25%, 50%, 75%, 100%)
CHECKPOINT_PERCENTAGES = [0.25, 0.50, 0.75, 1.00]

# System prompt for checkpoint question generation
CHECKPOINT_SYSTEM_PROMPT = """
Você é um tutor pedagógico especialista. Sua tarefa é criar UMA pergunta de múltipla escolha 
baseada no trecho de transcrição fornecido.

REGRAS:
1. A pergunta deve testar a compreensão do conteúdo do trecho.
2. Crie 4 opções de resposta (A, B, C, D).
3. Apenas uma resposta deve estar correta.
4. Inclua uma breve explicação da resposta correta.
5. A pergunta deve ser clara e objetiva.

FORMATO DE SAÍDA (JSON):
{
    "question": "Sua pergunta aqui?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correct_answer": 0,
    "explanation": "Explicação breve da resposta correta."
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.
"""


def _call_gemini_with_fallback(client: genai.Client, contents: list, config: types.GenerateContentConfig) -> str:
    """
    Try multiple Gemini models with fallback on quota/not-found errors.
    """
    last_error = None
    
    for model in GEMINI_MODELS:
        try:
            print(f"[Checkpoint AI] Trying model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            if response.text:
                print(f"[Checkpoint AI] Success with model: {model}")
                return response.text
            else:
                print(f"[Checkpoint AI] Empty response from {model}, trying next...")
                continue
                
        except Exception as e:
            error_str = str(e)
            print(f"[Checkpoint AI] Model {model} failed: {error_str[:200]}")
            
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                last_error = e
                continue
            elif "404" in error_str or "NOT_FOUND" in error_str:
                last_error = e
                continue
            else:
                raise e
    
    raise Exception(f"All Gemini models failed. Last error: {last_error}")


def _split_transcript_into_segments(transcript: str, num_segments: int = 4) -> List[str]:
    """
    Split transcript into equal segments for checkpoint generation.
    """
    words = transcript.split()
    total_words = len(words)
    
    if total_words < num_segments * 10:  # Minimum 10 words per segment
        # If transcript is too short, duplicate content
        return [transcript] * num_segments
    
    words_per_segment = total_words // num_segments
    segments = []
    
    for i in range(num_segments):
        start = i * words_per_segment
        end = start + words_per_segment if i < num_segments - 1 else total_words
        segment = ' '.join(words[start:end])
        segments.append(segment)
    
    return segments


def _generate_question_for_segment(client: genai.Client, segment: str, segment_index: int) -> Optional[dict]:
    """
    Generate a single checkpoint question for a transcript segment.
    """
    try:
        prompt = f"""
{CHECKPOINT_SYSTEM_PROMPT}

TRECHO DA TRANSCRIÇÃO (Segmento {segment_index + 1}):
\"\"\"
{segment[:2000]}
\"\"\"

Crie uma pergunta baseada neste trecho.
"""
        
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)]
            )
        ]
        
        config = types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
            max_output_tokens=1024,
            response_mime_type="application/json"
        )
        
        response_text = _call_gemini_with_fallback(client, contents, config)
        
        # Parse JSON response
        data = json.loads(response_text)
        return data
        
    except Exception as e:
        print(f"[Checkpoint AI] Error generating question for segment {segment_index}: {e}")
        return None


def _get_fallback_question(segment_index: int, timestamp_seconds: int) -> CheckpointQuestion:
    """
    Return a fallback question when AI generation fails.
    """
    fallback_questions = [
        {
            "question": "Qual o principal conceito apresentado nesta seção do vídeo?",
            "options": ["Conceito A", "Conceito B", "Conceito C", "Conceito D"],
            "correct_answer": 0,
            "explanation": "Este é um checkpoint de verificação de aprendizado."
        },
        {
            "question": "O que foi demonstrado neste trecho do conteúdo?",
            "options": ["Um exemplo prático", "Uma teoria abstrata", "Um exercício", "Uma revisão"],
            "correct_answer": 0,
            "explanation": "Preste atenção aos exemplos apresentados no vídeo."
        },
        {
            "question": "Qual próximo passo seria adequado após este conteúdo?",
            "options": ["Praticar com exercícios", "Avançar para o próximo tópico", "Revisar fundamentos", "Fazer anotações"],
            "correct_answer": 0,
            "explanation": "A prática é fundamental para fixar o conhecimento."
        },
        {
            "question": "Qual o resumo principal deste segmento?",
            "options": ["Introdução ao tema", "Aprofundamento técnico", "Conclusão do assunto", "Revisão geral"],
            "correct_answer": 0,
            "explanation": "Cada segmento do vídeo contribui para o aprendizado completo."
        }
    ]
    
    idx = segment_index % len(fallback_questions)
    q = fallback_questions[idx]
    
    return CheckpointQuestion(
        id=f"fallback-cp-{segment_index}-{int(time.time())}",
        question=q["question"],
        options=q["options"],
        correct_answer=q["correct_answer"],
        explanation=q["explanation"],
        timestamp_seconds=timestamp_seconds
    )


async def generate_checkpoint_questions(
    transcript: str,
    duration_seconds: int,
    video_id: str = "video"
) -> List[CheckpointQuestion]:
    """
    Generate checkpoint questions for a video based on its transcript.
    
    Args:
        transcript: Full video transcript text
        duration_seconds: Video duration in seconds
        video_id: Optional video identifier
        
    Returns:
        List of 4 CheckpointQuestion objects at 25%, 50%, 75%, 100%
    """
    checkpoints = []
    
    # Split transcript into 4 segments
    segments = _split_transcript_into_segments(transcript, len(CHECKPOINT_PERCENTAGES))
    
    # Calculate timestamps for each checkpoint
    timestamps = [int(duration_seconds * pct) for pct in CHECKPOINT_PERCENTAGES]
    
    # Ensure 100% timestamp is slightly before end to trigger properly
    if timestamps[-1] >= duration_seconds:
        timestamps[-1] = max(duration_seconds - 5, int(duration_seconds * 0.95))
    
    if not api_key:
        print("[Checkpoint AI] GEMINI_API_KEY not set, returning fallback questions")
        for i, ts in enumerate(timestamps):
            checkpoints.append(_get_fallback_question(i, ts))
        return checkpoints
    
    try:
        client = genai.Client(api_key=api_key)
        
        for i, (segment, timestamp) in enumerate(zip(segments, timestamps)):
            print(f"[Checkpoint AI] Generating question for segment {i+1}/4 at {timestamp}s")
            
            question_data = _generate_question_for_segment(client, segment, i)
            
            if question_data:
                checkpoint = CheckpointQuestion(
                    id=f"cp-{video_id}-{i}-{int(time.time() * 1000)}",
                    question=question_data.get("question", "Pergunta não gerada"),
                    options=question_data.get("options", ["A", "B", "C", "D"]),
                    correct_answer=question_data.get("correct_answer", 0),
                    explanation=question_data.get("explanation", ""),
                    timestamp_seconds=timestamp
                )
                checkpoints.append(checkpoint)
            else:
                # Use fallback if AI failed
                checkpoints.append(_get_fallback_question(i, timestamp))
        
        print(f"[Checkpoint AI] Generated {len(checkpoints)} checkpoint questions")
        return checkpoints
        
    except Exception as e:
        print(f"[Checkpoint AI] Error generating checkpoints: {e}")
        # Return all fallback questions
        for i, ts in enumerate(timestamps):
            checkpoints.append(_get_fallback_question(i, ts))
        return checkpoints


# Scoring constants for checkpoint impact on final grade
CHECKPOINT_CORRECT_BONUS = 5.0  # +5% per correct answer
CHECKPOINT_SKIP_PENALTY = 2.0   # -2% per skipped checkpoint


def calculate_checkpoint_score_impact(
    correct_count: int,
    skipped_count: int,
    total_checkpoints: int = 4
) -> float:
    """
    Calculate the impact on final grade based on checkpoint performance.
    
    Args:
        correct_count: Number of correctly answered checkpoints
        skipped_count: Number of skipped checkpoints
        total_checkpoints: Total number of checkpoints (default 4)
        
    Returns:
        Percentage impact on final grade (can be positive or negative)
    """
    bonus = correct_count * CHECKPOINT_CORRECT_BONUS
    penalty = skipped_count * CHECKPOINT_SKIP_PENALTY
    
    # Max bonus: 20% (4 × 5%)
    # Max penalty: -8% (4 × 2%)
    impact = bonus - penalty
    
    return impact
