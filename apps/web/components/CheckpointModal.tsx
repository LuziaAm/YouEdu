import React, { useState, useEffect } from 'react';
import { CheckpointQuestion, submitCheckpointAnswer, submitCheckpointSkip } from '../services/assessmentService';

interface CheckpointModalProps {
    checkpoint: CheckpointQuestion;
    trailId?: string;  // Optional for non-trail videos
    videoId: string;
    onComplete: (correct: boolean) => void;
    onSkip?: () => void;  // New: callback for skipping
    onClose: () => void;
    checkpointIndex?: number;  // Current checkpoint number (1-4)
    totalCheckpoints?: number;  // Total checkpoints (4)
}

const CheckpointModal: React.FC<CheckpointModalProps> = ({
    checkpoint,
    trailId,
    videoId,
    onComplete,
    onSkip,
    onClose,
    checkpointIndex = 1,
    totalCheckpoints = 4
}) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [message, setMessage] = useState('');
    const [scoreImpact, setScoreImpact] = useState<number | null>(null);
    const [isSkipping, setIsSkipping] = useState(false);

    const handleSubmit = async () => {
        if (selectedAnswer === null) return;

        try {
            const result = await submitCheckpointAnswer({
                checkpoint_id: checkpoint.id,
                video_id: videoId,
                trail_id: trailId,
                selected_answer: selectedAnswer,
                is_correct: selectedAnswer === checkpoint.correct_answer
            });

            setSubmitted(true);
            setIsCorrect(result.is_correct);
            setMessage(result.message);
            if (result.score_impact !== undefined) {
                setScoreImpact(result.score_impact);
            }
        } catch (error) {
            console.error('Failed to submit checkpoint:', error);
            // Allow continue anyway
            setSubmitted(true);
            setIsCorrect(selectedAnswer === checkpoint.correct_answer);
        }
    };

    const handleSkip = async () => {
        setIsSkipping(true);
        try {
            const result = await submitCheckpointSkip(checkpoint.id, videoId, trailId);
            if (result.score_impact !== undefined) {
                setScoreImpact(result.score_impact);
            }
        } catch (error) {
            console.error('Failed to submit skip:', error);
        }

        if (onSkip) {
            onSkip();
        } else {
            onComplete(false);
        }
        onClose();
    };

    const handleContinue = () => {
        onComplete(isCorrect);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Checkpoint {checkpointIndex}/{totalCheckpoints}</span>
                            <h2 className="text-lg font-bold text-white">Hora de Verificar!</h2>
                        </div>
                    </div>
                    {/* Skip Button */}
                    {!submitted && (
                        <button
                            onClick={handleSkip}
                            disabled={isSkipping}
                            className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1 transition-colors"
                            title="Pular afeta sua nota final"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                            Pular (-2%)
                        </button>
                    )}
                </div>

                {/* Question */}
                <p className="text-slate-200 text-lg mb-6">{checkpoint.question}</p>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {checkpoint.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => !submitted && setSelectedAnswer(index)}
                            disabled={submitted}
                            className={`w-full p-4 rounded-xl text-left transition-all ${submitted
                                ? index === checkpoint.correct_answer
                                    ? 'bg-emerald-600/30 border-2 border-emerald-500 text-emerald-300'
                                    : index === selectedAnswer && !isCorrect
                                        ? 'bg-red-600/30 border-2 border-red-500 text-red-300'
                                        : 'bg-slate-800/50 border border-slate-700 text-slate-500'
                                : selectedAnswer === index
                                    ? 'bg-amber-600/30 border-2 border-amber-500 text-white'
                                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
                                }`}
                        >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                            {option}
                        </button>
                    ))}
                </div>

                {/* Result Message */}
                {submitted && (
                    <div className={`p-4 rounded-xl mb-6 ${isCorrect ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-red-900/30 border border-red-700'}`}>
                        <p className={`font-medium ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                            {message || (isCorrect ? 'Correto! 🎉' : 'Não foi dessa vez. Continue estudando!')}
                        </p>
                        {scoreImpact !== null && (
                            <p className={`text-sm mt-1 ${scoreImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                Impacto na nota: {scoreImpact >= 0 ? '+' : ''}{scoreImpact}%
                            </p>
                        )}
                        {checkpoint.explanation && (
                            <p className="text-slate-400 text-sm mt-2">{checkpoint.explanation}</p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {!submitted ? (
                        <button
                            onClick={handleSubmit}
                            disabled={selectedAnswer === null}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-colors"
                        >
                            Confirmar Resposta
                        </button>
                    ) : (
                        <button
                            onClick={handleContinue}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            Continuar Assistindo
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckpointModal;
