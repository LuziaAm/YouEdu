import React, { useState } from 'react';
import { gamificationService } from '../services/gamificationService';

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface CodingExercise {
    id: string;
    title: string;
    description: string;
    starterCode?: string;
    expectedOutput?: string;
}

interface FinalQuizProps {
    questions: QuizQuestion[];
    codingExercises: CodingExercise[];
    onComplete: (score: number, totalPoints: number) => void;
    onClose?: () => void;  // Optional callback to close quiz and return to video
}

interface QuestionState {
    attempts: number;
    answered: boolean;
    correct: boolean;
    selectedAnswer: number | null;
    showFeedback: boolean;
    exhausted: boolean; // Used all 2 attempts
}

const FinalQuiz: React.FC<FinalQuizProps> = ({ questions, codingExercises, onComplete, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);

    // Track state per question
    const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>(() => {
        const initial: Record<string, QuestionState> = {};
        questions.forEach(q => {
            initial[q.id] = {
                attempts: 0,
                answered: false,
                correct: false,
                selectedAnswer: null,
                showFeedback: false,
                exhausted: false
            };
        });
        return initial;
    });

    const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    const MAX_ATTEMPTS = 2;

    const isQuizSection = currentQuestion < questions.length;
    const currentQuizQuestion = isQuizSection ? questions[currentQuestion] : null;
    const currentExercise = !isQuizSection ? codingExercises[currentQuestion - questions.length] : null;
    const currentState = currentQuizQuestion ? questionStates[currentQuizQuestion.id] : null;

    const handleAnswerSelect = (answerIndex: number) => {
        if (!currentQuizQuestion) return;

        const state = questionStates[currentQuizQuestion.id];

        // If already correctly answered or exhausted attempts, don't allow changes
        if (state.correct || state.exhausted) return;

        const isCorrect = answerIndex === currentQuizQuestion.correctAnswer;
        const newAttempts = state.attempts + 1;
        const exhausted = !isCorrect && newAttempts >= MAX_ATTEMPTS;

        setQuestionStates({
            ...questionStates,
            [currentQuizQuestion.id]: {
                attempts: newAttempts,
                answered: true,
                correct: isCorrect,
                selectedAnswer: answerIndex,
                showFeedback: true,
                exhausted
            }
        });
    };

    const handleCodeChange = (code: string) => {
        if (!currentExercise) return;
        setCodeAnswers({ ...codeAnswers, [currentExercise.id]: code });
    };

    const canProceed = () => {
        if (!currentQuizQuestion) return true;
        const state = questionStates[currentQuizQuestion.id];
        return state.correct || state.exhausted;
    };

    const handleNext = () => {
        const totalItems = questions.length + codingExercises.length;
        if (currentQuestion < totalItems - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            calculateScore();
        }
    };

    const calculateScore = () => {
        let points = 0;
        const pointsPerQuestion = 20;
        const pointsPerExercise = 50;

        // Calculate quiz score - full points only if correct on first try, half if correct on second
        questions.forEach(q => {
            const state = questionStates[q.id];
            if (state.correct) {
                if (state.attempts === 1) {
                    points += pointsPerQuestion; // Full points for first try
                } else {
                    points += Math.floor(pointsPerQuestion / 2); // Half for second try
                }
            }
        });

        // Calculate coding exercises score
        codingExercises.forEach(ex => {
            const answer = codeAnswers[ex.id] || '';
            const expected = ex.expectedOutput || '';
            if (answer.trim().toLowerCase().includes(expected.trim().toLowerCase())) {
                points += pointsPerExercise;
            }
        });

        const totalPoints = questions.length * pointsPerQuestion + codingExercises.length * pointsPerExercise;
        setScore(points);
        setShowResults(true);

        // Update gamification stats
        const totalQuestions = questions.length + codingExercises.length;
        const states = Object.values(questionStates) as QuestionState[];
        const correctAnswers = states.filter(s => s.correct).length;
        gamificationService.updateAfterQuiz(totalQuestions, points, correctAnswers);

        onComplete(points, totalPoints);
    };

    // Render feedback for current question
    const renderFeedback = () => {
        if (!currentQuizQuestion || !currentState?.showFeedback) return null;

        if (currentState.correct) {
            return (
                <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-emerald-400 font-bold mb-1">
                                {currentState.attempts === 1 ? '🎉 Correto!' : '✅ Acertou na segunda tentativa!'}
                            </h4>
                            <p className="text-slate-300 text-sm">{currentQuizQuestion.explanation}</p>
                            {currentState.attempts === 1 && (
                                <p className="text-emerald-400 text-xs mt-2 font-medium">+20 XP</p>
                            )}
                            {currentState.attempts === 2 && (
                                <p className="text-yellow-400 text-xs mt-2 font-medium">+10 XP (metade por segunda tentativa)</p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (currentState.exhausted) {
            // Used all attempts - show correct answer and suggest reviewing video
            return (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-red-400 font-bold mb-1">Não foi dessa vez...</h4>
                                <p className="text-slate-300 text-sm mb-2">
                                    A resposta correta é: <strong className="text-emerald-400">
                                        {String.fromCharCode(65 + currentQuizQuestion.correctAnswer)}) {currentQuizQuestion.options[currentQuizQuestion.correctAnswer]}
                                    </strong>
                                </p>
                                <p className="text-slate-400 text-sm">{currentQuizQuestion.explanation}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-blue-400 font-bold text-sm">💡 Dica de estudo</h4>
                                <p className="text-slate-300 text-sm">
                                    Reveja o trecho do vídeo sobre este tópico para reforçar o aprendizado!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Wrong answer but still has attempts
        const attemptsLeft = MAX_ATTEMPTS - currentState.attempts;
        return (
            <div className="mt-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-orange-400 font-bold mb-1">Resposta incorreta</h4>
                        <p className="text-slate-300 text-sm">
                            Você tem mais <strong className="text-orange-300">{attemptsLeft} {attemptsLeft === 1 ? 'tentativa' : 'tentativas'}</strong>.
                            Pense com calma e tente novamente!
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    if (showResults) {
        const totalPoints = questions.length * 20 + codingExercises.length * 50;
        const percentage = (score / totalPoints) * 100;

        // Count stats
        const states = Object.values(questionStates) as QuestionState[];
        const correctFirstTry = states.filter(s => s.correct && s.attempts === 1).length;
        const correctSecondTry = states.filter(s => s.correct && s.attempts === 2).length;
        const failed = states.filter(s => s.exhausted).length;

        return (
            <div className="glass rounded-3xl p-8 border border-blue-500/30 text-center">
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${percentage >= 70
                    ? 'bg-gradient-to-br from-emerald-500 to-blue-500'
                    : 'bg-gradient-to-br from-orange-500 to-red-500'
                    }`}>
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {percentage >= 70 ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                    </svg>
                </div>

                <h2 className="text-3xl font-black text-white mb-2">Quiz Concluído!</h2>
                <p className="text-slate-400 mb-8">Confira seu desempenho</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <div className="text-3xl font-black text-blue-400 mb-1">{score}</div>
                        <div className="text-xs text-slate-400 uppercase">Pontos</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <div className="text-3xl font-black text-emerald-400 mb-1">{percentage.toFixed(0)}%</div>
                        <div className="text-xs text-slate-400 uppercase">Acertos</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <div className="text-3xl font-black text-purple-400 mb-1">{totalPoints}</div>
                        <div className="text-xs text-slate-400 uppercase">Total</div>
                    </div>
                </div>

                {/* Detailed breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
                    <div className="bg-emerald-500/20 rounded-lg p-3 border border-emerald-500/30">
                        <div className="text-emerald-400 font-bold">{correctFirstTry}</div>
                        <div className="text-slate-400 text-xs">1ª tentativa</div>
                    </div>
                    <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
                        <div className="text-yellow-400 font-bold">{correctSecondTry}</div>
                        <div className="text-slate-400 text-xs">2ª tentativa</div>
                    </div>
                    <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                        <div className="text-red-400 font-bold">{failed}</div>
                        <div className="text-slate-400 text-xs">Erros</div>
                    </div>
                </div>

                <div className={`p-4 rounded-xl mb-6 ${percentage >= 70 ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-orange-500/20 border border-orange-500/30'
                    }`}>
                    <p className={`text-sm font-medium ${percentage >= 70 ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {percentage >= 70
                            ? '🎉 Parabéns! Você demonstrou ótimo entendimento do conteúdo!'
                            : '💪 Continue praticando! Revise o vídeo e tente novamente.'}
                    </p>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-all"
                >
                    Assistir Outro Vídeo
                </button>
            </div>
        );
    }

    return (
        <div className="glass rounded-3xl p-8 border border-blue-500/30">
            {/* Header with close button */}
            {onClose && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar ao Vídeo
                    </button>
                </div>
            )}
            {/* Progress */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-400">
                        Questão {currentQuestion + 1} de {questions.length + codingExercises.length}
                    </span>
                    <div className="flex items-center gap-2">
                        {currentState && !currentState.correct && !currentState.exhausted && (
                            <span className="text-xs font-medium text-slate-500">
                                Tentativa {currentState.attempts + 1}/{MAX_ATTEMPTS}
                            </span>
                        )}
                        <span className="text-sm font-bold text-blue-400">
                            {isQuizSection ? '🧠 Quiz' : '💻 Prática'}
                        </span>
                    </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${((currentQuestion + 1) / (questions.length + codingExercises.length)) * 100}%` }}
                    />
                </div>
            </div>

            {/* Quiz Question */}
            {currentQuizQuestion && (
                <div>
                    <h3 className="text-2xl font-bold text-white mb-6">{currentQuizQuestion.question}</h3>
                    <div className="space-y-3 mb-4">
                        {currentQuizQuestion.options.map((option, index) => {
                            const isSelected = currentState?.selectedAnswer === index;
                            const isCorrectAnswer = index === currentQuizQuestion.correctAnswer;
                            const showCorrect = currentState?.showFeedback && isCorrectAnswer && (currentState.correct || currentState.exhausted);
                            const showWrong = currentState?.showFeedback && isSelected && !isCorrectAnswer;
                            const disabled = currentState?.correct || currentState?.exhausted;

                            let buttonClass = 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500';

                            if (showCorrect) {
                                buttonClass = 'bg-emerald-600/30 border-emerald-400 text-emerald-300';
                            } else if (showWrong) {
                                buttonClass = 'bg-red-600/30 border-red-400 text-red-300';
                            } else if (isSelected && !currentState?.showFeedback) {
                                buttonClass = 'bg-blue-600 border-blue-400 text-white scale-105';
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(index)}
                                    disabled={disabled}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${buttonClass} ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${showCorrect ? 'bg-emerald-500 text-white' :
                                            showWrong ? 'bg-red-500 text-white' :
                                                isSelected ? 'bg-white text-blue-600' : 'bg-slate-700'
                                            }`}>
                                            {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + index)}
                                        </span>
                                        {option}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback area */}
                    {renderFeedback()}
                </div>
            )}

            {/* Coding Exercise */}
            {currentExercise && (
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{currentExercise.title}</h3>
                    <p className="text-slate-400 mb-6">{currentExercise.description}</p>
                    <textarea
                        value={codeAnswers[currentExercise.id] || currentExercise.starterCode || ''}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="// Digite seu código aqui..."
                        className="w-full h-48 bg-slate-950 text-emerald-400 font-mono p-4 rounded-xl border border-slate-800 focus:border-blue-500 outline-none resize-none mb-4"
                    />
                    <p className="text-xs text-slate-500">💡 Dica: Escreva um código limpo e bem formatado</p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
                <button
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ← Anterior
                </button>
                <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {currentQuestion === questions.length + codingExercises.length - 1 ? 'Finalizar' : 'Próxima →'}
                </button>
            </div>
        </div>
    );
};

export default FinalQuiz;
