import React, { useState, useEffect } from 'react';
import { FinalAssessment, getFinalAssessment, submitFinalAssessment, AssessmentResult } from '../services/assessmentService';

interface FinalAssessmentViewProps {
    trailId: string;
    trailTitle: string;
    onComplete: (result: AssessmentResult) => void;
    onCancel: () => void;
}

const FinalAssessmentView: React.FC<FinalAssessmentViewProps> = ({
    trailId,
    trailTitle,
    onComplete,
    onCancel
}) => {
    const [assessment, setAssessment] = useState<FinalAssessment | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<AssessmentResult | null>(null);

    useEffect(() => {
        loadAssessment();
    }, []);

    useEffect(() => {
        if (timeLeft > 0 && !result) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && assessment && !result) {
            handleSubmit();
        }
    }, [timeLeft, result]);

    const loadAssessment = async () => {
        try {
            const data = await getFinalAssessment(trailId);
            setAssessment(data);
            setTimeLeft(data.time_limit_minutes * 60);
        } catch (error) {
            console.error('Failed to load assessment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: string, answerIndex: number) => {
        setAnswers({ ...answers, [questionId]: answerIndex });
    };

    const handleSubmit = async () => {
        if (!assessment) return;

        setSubmitting(true);
        try {
            const res = await submitFinalAssessment(assessment.id, answers);
            setResult(res);
        } catch (error) {
            console.error('Failed to submit assessment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Preparando avaliação...</p>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${result.passed ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                        {result.passed ? (
                            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {result.passed ? 'Aprovado! 🎉' : 'Não foi dessa vez'}
                    </h2>
                    <p className="text-slate-400 mb-6">
                        {result.passed
                            ? 'Parabéns! Você pode solicitar seu certificado.'
                            : 'Revise o conteúdo e tente novamente.'}
                    </p>

                    <div className="bg-slate-800 rounded-xl p-6 mb-6">
                        <div className="text-5xl font-bold text-white mb-2">{result.percentage.toFixed(0)}%</div>
                        <div className="text-slate-400">
                            {result.score} de {result.total_points} pontos
                        </div>
                        <div className="text-sm text-slate-500 mt-2">
                            Mínimo para aprovação: 60%
                        </div>
                    </div>

                    <button
                        onClick={() => onComplete(result)}
                        className={`w-full py-4 rounded-xl font-bold ${result.passed
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-white'
                            }`}
                    >
                        {result.passed ? 'Ir para Certificado' : 'Voltar à Trilha'}
                    </button>
                </div>
            </div>
        );
    }

    if (!assessment) return null;

    const question = assessment.questions[currentQuestion];
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-xs text-emerald-400 uppercase tracking-wider">Avaliação Final</p>
                        <h1 className="font-bold">{trailTitle}</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Tempo Restante</p>
                            <p className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 text-slate-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="bg-slate-900/50 px-6 py-2">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-1">
                        {assessment.questions.map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 h-2 rounded-full ${answers[assessment.questions[i].id] !== undefined
                                        ? 'bg-emerald-500'
                                        : i === currentQuestion
                                            ? 'bg-blue-500'
                                            : 'bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Question */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <span className="text-sm text-slate-500">Questão {currentQuestion + 1} de {assessment.questions.length}</span>
                    <h2 className="text-2xl font-bold mt-2">{question.question}</h2>
                </div>

                <div className="space-y-3 mb-8">
                    {question.options.map((option, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(question.id, i)}
                            className={`w-full p-5 rounded-xl text-left transition-all ${answers[question.id] === i
                                    ? 'bg-emerald-600/30 border-2 border-emerald-500'
                                    : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <span className="font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
                            {option}
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    {currentQuestion > 0 && (
                        <button
                            onClick={() => setCurrentQuestion(currentQuestion - 1)}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl"
                        >
                            Anterior
                        </button>
                    )}

                    {currentQuestion < assessment.questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestion(currentQuestion + 1)}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold"
                        >
                            Próxima
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || answeredCount < assessment.questions.length}
                            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded-xl font-bold"
                        >
                            {submitting ? 'Enviando...' : `Finalizar (${answeredCount}/${assessment.questions.length})`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinalAssessmentView;
