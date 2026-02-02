import React, { useState } from 'react';
import { Challenge, ChallengeType } from '../types';
import studentProgressService from '../services/studentProgressService';

interface ChallengeOverlayProps {
  challenge: Challenge;
  studentLevel: number;
  studentId?: string;
  sessionId?: string;
  onSolve: (success: boolean, xpEarned?: number) => void;
}

const ChallengeOverlay: React.FC<ChallengeOverlayProps> = ({
  challenge,
  onSolve,
  studentLevel,
  studentId: _studentId,
  sessionId
}) => {
  const [userCode, setUserCode] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string, xp?: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    let isCorrect = false;

    if (challenge.type === ChallengeType.QUIZ) {
      isCorrect = selectedOption === Number(challenge.correctAnswer);
    } else {
      // Simple code matching (in a real sandbox we would eval or use a linter)
      const cleanInput = userCode.replace(/\s/g, '').toLowerCase();
      const cleanAnswer = String(challenge.correctAnswer).replace(/\s/g, '').toLowerCase();
      isCorrect = cleanInput.includes(cleanAnswer) || cleanAnswer.includes(cleanInput);
    }

    // Calculate XP
    const timeTaken = 0; // TODO: Track actual time
    const xpEarned = studentProgressService.calculateChallengeXP(
      isCorrect,
      challenge.type as 'quiz' | 'code',
      timeTaken
    );

    // Register attempt in backend if we have sessionId
    if (sessionId) {
      try {
        await studentProgressService.registerChallengeAttempt({
          session_id: sessionId,
          challenge_id: challenge.id || 'unknown',
          challenge_type: challenge.type as 'quiz' | 'code',
          is_correct: isCorrect,
          time_taken: timeTaken,
          xp_earned: xpEarned,
        });
      } catch (error) {
        console.error('Failed to register challenge attempt:', error);
      }
    }

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: `🎉 Excelente! Você dominou esse conceito. +${xpEarned} XP`,
        xp: xpEarned
      });
      setTimeout(() => {
        setIsSubmitting(false);
        onSolve(true, xpEarned);
      }, 2500);
    } else {
      setFeedback({
        type: 'error',
        message: `💡 Quase lá! Resumo do que vimos: ${challenge.summary}. Tente novamente!`
      });
      setTimeout(() => {
        setFeedback(null);
        setIsSubmitting(false);
      }, 4000);
    }
  };

  // Handle close without answering (no XP)
  const handleClose = () => {
    onSolve(false, 0); // Continue video without XP
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <div className="absolute inset-0 z-40 glass rounded-2xl flex items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-blue-500/30 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors group"
          title="Fechar sem responder (sem XP)"
        >
          <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 inline-block">
            {challenge.type === ChallengeType.QUIZ ? '🧠 Desafio de Conhecimento' : '💻 Prática de Código'}
          </span>
          <h2 className="text-2xl font-bold text-white mb-2">{challenge.title}</h2>
          <p className="text-slate-300">{challenge.content}</p>

          <div className="flex items-center gap-2 mt-3">
            <p className="text-xs text-slate-500 italic">Dificuldade ajustada para Nível {studentLevel}</p>
            <div className="relative group cursor-help">
              <svg
                className="w-4 h-4 text-slate-500 hover:text-blue-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              {/* Tooltip content */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="font-bold text-blue-400 mb-1">Como funciona o XP?</div>
                • Quiz correto: +25 XP<br />
                • Código correto: +50 XP<br />
                • Bônus de velocidade (&lt;15s): +10 XP<br />
                • 100 XP = 1 nível
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
        </div>

        {challenge.type === ChallengeType.QUIZ ? (
          <div className="grid grid-cols-1 gap-3 mb-8">
            {challenge.options?.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => !isSubmitting && setSelectedOption(idx)}
                disabled={isSubmitting}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedOption === idx
                  ? 'bg-blue-600 border-blue-400 text-white scale-105 shadow-lg'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-750'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${selectedOption === idx ? 'bg-white text-blue-600' : 'bg-slate-700'
                    }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-500">
              <span>editor.js</span>
              <div className="flex items-center gap-2">
                <span>javascript</span>
                <span className="text-slate-600">•</span>
                <span className="text-blue-400">Ctrl/Cmd + Enter para enviar</span>
              </div>
            </div>
            <textarea
              value={userCode}
              onChange={(e) => !isSubmitting && setUserCode(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSubmitting}
              placeholder="// Digite seu código aqui..."
              className="w-full h-48 bg-slate-950 text-emerald-400 font-mono p-4 rounded-xl border border-slate-800 focus:border-blue-500 outline-none resize-none disabled:opacity-50"
            />
            <p className="text-xs text-slate-600 mt-1">💡 Dica: Pressione Ctrl/Cmd + Enter para enviar</p>
          </div>
        )}

        {feedback ? (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-bounce' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
            <span className="text-xl">{feedback.type === 'success' ? '🚀' : '💡'}</span>
            <div className="flex-1">
              <p className="font-medium">{feedback.message}</p>
              {feedback.xp && (
                <p className="text-xs mt-1 text-emerald-300">
                  Total de XP ganho: <span className="font-bold">{feedback.xp}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (challenge.type === ChallengeType.QUIZ && selectedOption === null)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Resposta'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChallengeOverlay;
