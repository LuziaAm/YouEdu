import React from 'react';
import { Challenge, ChallengeType } from '../types';

interface ChallengesPreviewProps {
    challenges: Challenge[];
    onStart: () => void;
    videoTitle?: string;
}

const ChallengesPreview: React.FC<ChallengesPreviewProps> = ({ challenges, onStart, videoTitle }) => {
    const totalChallenges = challenges.length;
    const quizCount = challenges.filter(c => c.type === ChallengeType.QUIZ).length;
    const codeCount = challenges.filter(c => c.type === ChallengeType.CODE).length;

    return (
        <div className="glass rounded-3xl p-8 border border-blue-500/30">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/30">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Análise Concluída!</h2>
                <p className="text-slate-400 text-sm">
                    {videoTitle && <span className="font-medium text-white">{videoTitle}</span>}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
                    <div className="text-3xl font-black text-blue-400 mb-1">{totalChallenges}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Desafios</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
                    <div className="text-3xl font-black text-purple-400 mb-1">{quizCount}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Quiz</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
                    <div className="text-3xl font-black text-emerald-400 mb-1">{codeCount}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Código</div>
                </div>
            </div>

            {/* Challenges List */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pontos de Aprendizado
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {challenges.map((challenge, idx) => (
                        <div
                            key={challenge.id || idx}
                            className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800/50 hover:border-blue-500/30 transition-colors"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 shrink-0">
                                <span className="text-xs font-bold text-blue-400">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-white truncate">{challenge.title}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${challenge.type === ChallengeType.QUIZ
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {challenge.type === ChallengeType.QUIZ ? 'Quiz' : 'Código'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2">{challenge.summary || challenge.content}</p>
                                <span className="text-[10px] text-slate-500 mt-1 inline-block">{challenge.timestampLabel}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-blue-400 mb-1">Como Funciona?</h4>
                        <ul className="text-xs text-slate-400 space-y-1">
                            <li>• O vídeo pausará automaticamente nos timestamps dos desafios</li>
                            <li>• Responda corretamente para ganhar XP</li>
                            <li>• Você pode fechar o desafio sem responder (não ganha XP)</li>
                            <li>• O vídeo só continua após você interagir</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Start Button */}
            <button
                onClick={onStart}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Iniciar Experiência Interativa</span>
            </button>
        </div>
    );
};

export default ChallengesPreview;
