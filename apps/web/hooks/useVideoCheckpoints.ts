/**
 * Hook for managing video checkpoint questions during playback.
 * Handles auto-triggering, answering, and skipping with score tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    CheckpointQuestion,
    generateCheckpointsFromTranscript,
    submitCheckpointAnswer,
    submitCheckpointSkip
} from '../services/assessmentService';

export interface CheckpointScoreState {
    checkpointsAnswered: number;
    checkpointsSkipped: number;
    checkpointsCorrect: number;
    scoreImpact: number; // -8% to +20%
}

export interface UseVideoCheckpointsReturn {
    checkpoints: CheckpointQuestion[];
    currentCheckpoint: CheckpointQuestion | null;
    completedCheckpoints: Set<string>;
    scoreState: CheckpointScoreState;
    isLoading: boolean;
    error: string | null;
    handleAnswer: (selectedAnswer: number) => Promise<boolean>;
    handleSkip: () => Promise<void>;
    loadCheckpoints: (transcript: string, duration: number, videoId?: string) => Promise<void>;
    resetCheckpoints: () => void;
}

export function useVideoCheckpoints(
    currentTime: number,
    isPlaying: boolean,
    videoDuration: number,
    videoId: string = 'video',
    trailId?: string
): UseVideoCheckpointsReturn {
    const [checkpoints, setCheckpoints] = useState<CheckpointQuestion[]>([]);
    const [currentCheckpoint, setCurrentCheckpoint] = useState<CheckpointQuestion | null>(null);
    const [completedCheckpoints, setCompletedCheckpoints] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scoreState, setScoreState] = useState<CheckpointScoreState>({
        checkpointsAnswered: 0,
        checkpointsSkipped: 0,
        checkpointsCorrect: 0,
        scoreImpact: 0
    });

    // Track if we've checked this second to avoid re-triggering
    const lastCheckedSecond = useRef<number>(-1);
    // Callback ref for pause function (to be set by parent)
    const pauseVideoRef = useRef<(() => void) | null>(null);

    // Check for checkpoint triggers based on current time
    useEffect(() => {
        if (!isPlaying || currentCheckpoint || checkpoints.length === 0) {
            return;
        }

        const currentSecond = Math.floor(currentTime);

        // Avoid checking the same second multiple times
        if (currentSecond === lastCheckedSecond.current) {
            return;
        }
        lastCheckedSecond.current = currentSecond;

        // Find checkpoint that should trigger (within 1.5 second window)
        for (const checkpoint of checkpoints) {
            if (
                !completedCheckpoints.has(checkpoint.id) &&
                Math.abs(currentTime - checkpoint.timestamp_seconds) < 1.5
            ) {
                console.log(`[Checkpoint] Triggering checkpoint at ${checkpoint.timestamp_seconds}s`);
                setCurrentCheckpoint(checkpoint);
                break;
            }
        }
    }, [currentTime, isPlaying, checkpoints, completedCheckpoints, currentCheckpoint]);

    // Load checkpoints from AI based on transcript
    const loadCheckpoints = useCallback(async (
        transcript: string,
        duration: number,
        customVideoId?: string
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const id = customVideoId || videoId;
            console.log(`[Checkpoint] Generating checkpoints for video ${id} (${duration}s)`);

            const generatedCheckpoints = await generateCheckpointsFromTranscript(
                id,
                Math.floor(duration),
                transcript
            );

            setCheckpoints(generatedCheckpoints);
            setCompletedCheckpoints(new Set());
            setScoreState({
                checkpointsAnswered: 0,
                checkpointsSkipped: 0,
                checkpointsCorrect: 0,
                scoreImpact: 0
            });

            console.log(`[Checkpoint] Loaded ${generatedCheckpoints.length} checkpoints`);
        } catch (err) {
            console.error('[Checkpoint] Failed to load checkpoints:', err);
            setError('Falha ao carregar checkpoints');
        } finally {
            setIsLoading(false);
        }
    }, [videoId]);

    // Handle answering a checkpoint
    const handleAnswer = useCallback(async (selectedAnswer: number): Promise<boolean> => {
        if (!currentCheckpoint) {
            return false;
        }

        const isCorrect = selectedAnswer === currentCheckpoint.correct_answer;

        try {
            const result = await submitCheckpointAnswer({
                checkpoint_id: currentCheckpoint.id,
                video_id: videoId,
                trail_id: trailId,
                selected_answer: selectedAnswer,
                is_correct: isCorrect
            });

            // Update score state
            setScoreState(prev => ({
                ...prev,
                checkpointsAnswered: prev.checkpointsAnswered + 1,
                checkpointsCorrect: isCorrect ? prev.checkpointsCorrect + 1 : prev.checkpointsCorrect,
                scoreImpact: result.score_impact ?? prev.scoreImpact
            }));
        } catch (err) {
            console.error('[Checkpoint] Failed to submit answer:', err);
        }

        // Mark as completed
        setCompletedCheckpoints(prev => new Set([...prev, currentCheckpoint.id]));
        setCurrentCheckpoint(null);

        return isCorrect;
    }, [currentCheckpoint, videoId, trailId]);

    // Handle skipping a checkpoint
    const handleSkip = useCallback(async () => {
        if (!currentCheckpoint) {
            return;
        }

        try {
            const result = await submitCheckpointSkip(
                currentCheckpoint.id,
                videoId,
                trailId
            );

            // Update score state
            setScoreState(prev => ({
                ...prev,
                checkpointsSkipped: prev.checkpointsSkipped + 1,
                scoreImpact: result.score_impact ?? prev.scoreImpact
            }));
        } catch (err) {
            console.error('[Checkpoint] Failed to submit skip:', err);
        }

        // Mark as completed (skipped)
        setCompletedCheckpoints(prev => new Set([...prev, currentCheckpoint.id]));
        setCurrentCheckpoint(null);
    }, [currentCheckpoint, videoId, trailId]);

    // Reset all checkpoint state
    const resetCheckpoints = useCallback(() => {
        setCheckpoints([]);
        setCurrentCheckpoint(null);
        setCompletedCheckpoints(new Set());
        setScoreState({
            checkpointsAnswered: 0,
            checkpointsSkipped: 0,
            checkpointsCorrect: 0,
            scoreImpact: 0
        });
        setError(null);
        lastCheckedSecond.current = -1;
    }, []);

    return {
        checkpoints,
        currentCheckpoint,
        completedCheckpoints,
        scoreState,
        isLoading,
        error,
        handleAnswer,
        handleSkip,
        loadCheckpoints,
        resetCheckpoints
    };
}

export default useVideoCheckpoints;
