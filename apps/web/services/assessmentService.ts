/**
 * Service for Assessment and Certificate APIs.
 */

import { apiGet, apiPost, apiPatch } from './apiClient';

// Assessment Types
export interface CheckpointQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    explanation?: string;
    timestamp_seconds: number;
}

export interface CheckpointResult {
    checkpoint_id: string;
    video_id: string;
    trail_id?: string;  // Optional for non-trail videos
    selected_answer: number;
    is_correct: boolean;
    skipped?: boolean;  // Track if user skipped
}

// Response with score impact
export interface CheckpointAnswerResponse {
    success: boolean;
    is_correct: boolean;
    message: string;
    score_impact?: number;  // Impact on final grade
}

export interface CheckpointSkipResponse {
    success: boolean;
    message: string;
    score_impact?: number;
}

export interface FinalAssessmentQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    points: number;
}

export interface FinalAssessment {
    id: string;
    trail_id: string;
    questions: FinalAssessmentQuestion[];
    total_points: number;
    time_limit_minutes: number;
    generated_at: string;
}

export interface AssessmentResult {
    assessment_id: string;
    trail_id: string;
    score: number;
    total_points: number;
    percentage: number;
    passed: boolean;
    completed_at: string;
}

export interface EligibilityCheck {
    trail_id: string;
    is_eligible: boolean;
    completion_percentage: number;
    checkpoint_average: number;
    final_assessment_passed: boolean | null;
    final_score: number | null;
    missing_requirements: string[];
}

// Certificate Types
export interface Certificate {
    id: string;
    verification_code: string;
    student_name: string;
    trail_title: string;
    trail_description?: string;
    final_score: number;
    status: 'passed' | 'approved_with_distinction';
    issued_at: string;
    pdf_url?: string;
}

export interface CertificateVerification {
    valid: boolean;
    verification_code: string;
    student_name?: string;
    trail_title?: string;
    final_score?: number;
    status?: string;
    issued_at?: string;
    message: string;
}

// Assessment API
export async function getVideoCheckpoints(videoId: string, durationSeconds: number = 300): Promise<CheckpointQuestion[]> {
    return apiGet(`/assessment/checkpoints/${videoId}?duration_seconds=${durationSeconds}`);
}

export async function submitCheckpointAnswer(result: CheckpointResult): Promise<CheckpointAnswerResponse> {
    return apiPost('/assessment/checkpoint/answer', result);
}

/**
 * Generate checkpoint questions using AI based on video transcript.
 * Returns 4 checkpoints at 25%, 50%, 75%, and 100% of video duration.
 */
export async function generateCheckpointsFromTranscript(
    videoId: string,
    durationSeconds: number,
    transcript: string
): Promise<CheckpointQuestion[]> {
    return apiPost('/assessment/checkpoints/generate', {
        video_id: videoId,
        duration_seconds: durationSeconds,
        transcript
    });
}

/**
 * Record that a checkpoint was skipped. Affects final grade (-2%).
 */
export async function submitCheckpointSkip(
    checkpointId: string,
    videoId: string,
    trailId?: string
): Promise<CheckpointSkipResponse> {
    return apiPost('/assessment/checkpoint/skip', {
        checkpoint_id: checkpointId,
        video_id: videoId,
        trail_id: trailId
    });
}

export async function updateVideoProgress(trailId: string, videoId: string, watchedSeconds: number, totalSeconds?: number): Promise<any> {
    return apiPatch(`/assessment/progress/video?trail_id=${trailId}&video_id=${videoId}&watched_seconds=${watchedSeconds}${totalSeconds ? `&total_seconds=${totalSeconds}` : ''}`, {});
}

export async function getFinalAssessment(trailId: string): Promise<FinalAssessment> {
    return apiGet(`/assessment/final/${trailId}`);
}

export async function submitFinalAssessment(assessmentId: string, answers: Record<string, number>): Promise<AssessmentResult> {
    return apiPost('/assessment/final/submit', { assessment_id: assessmentId, answers });
}

export async function checkCertificateEligibility(trailId: string): Promise<EligibilityCheck> {
    return apiGet(`/assessment/eligibility/${trailId}`);
}

// Certificate API
export async function generateCertificate(trailId: string, studentName: string): Promise<Certificate> {
    return apiPost('/certificates/generate', { trail_id: trailId, student_name: studentName });
}

export async function verifyCertificate(code: string): Promise<CertificateVerification> {
    return apiGet(`/certificates/verify/${code}`);
}

export async function getUserCertificates(): Promise<Certificate[]> {
    return apiGet('/certificates/user');
}
