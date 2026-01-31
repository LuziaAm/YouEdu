/**
 * Service for video transcription and quiz generation
 */

const API_BASE_URL = 'http://localhost:8000/api/transcription';

export interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
}

export interface TranscriptResponse {
    transcript: string;
    segments: TranscriptSegment[];
    duration: number;
    language: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export interface CodingExercise {
    id: string;
    title: string;
    description: string;
    starterCode?: string;
    expectedOutput?: string;
}

export interface QuizResponse {
    questions: QuizQuestion[];
    codingExercises: CodingExercise[];
    totalPoints: number;
}

/**
 * Transcribe video file
 */
export const transcribeVideo = async (file: File): Promise<TranscriptResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Transcription API Error:", error);
        throw new Error(error.detail || 'Transcription failed');
    }

    const data = await response.json();
    console.log("Transcription API Response RAW:", data);
    return data;
};

/**
 * Generate quiz from transcript using AI
 */
export const generateQuiz = async (transcript: string): Promise<QuizResponse> => {
    const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Quiz generation failed');
    }

    return response.json();
};

export interface CaptionsResponse {
    success: boolean;
    video_id: string;
    language: string;
    is_auto_generated: boolean;
    transcript: string;
    segments: {
        start: number;
        duration: number;
        text: string;
    }[];
    segment_count: number;
    duration: number;
}

/**
 * Get YouTube video captions/subtitles
 */
export const getYouTubeCaptions = async (videoIdOrUrl: string): Promise<CaptionsResponse> => {
    const isUrl = videoIdOrUrl.includes('youtube') || videoIdOrUrl.includes('youtu.be');

    const response = await fetch(`${API_BASE_URL}/youtube-captions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(isUrl ? { url: videoIdOrUrl } : { video_id: videoIdOrUrl }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get captions');
    }

    return response.json();
};

/**
 * Convert captions to TranscriptResponse format
 */
export const captionsToTranscript = (captions: CaptionsResponse): TranscriptResponse => {
    return {
        transcript: captions.transcript,
        segments: captions.segments.map(seg => ({
            start: seg.start,
            end: seg.start + seg.duration,
            text: seg.text
        })),
        duration: captions.duration,
        language: captions.language
    };
};
