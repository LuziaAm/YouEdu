import React, { useEffect, useState } from 'react';
import { gamificationService, GamificationData } from '../services/gamificationService';

interface GamificationPanelProps {
    refreshTrigger?: number; // Increment to force refresh
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ refreshTrigger = 0 }) => {
    const [data, setData] = useState<GamificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [_error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const gamificationData = await gamificationService.getGamificationData();
                setData(gamificationData);
                setError(null);
            } catch (err) {
                setError('Erro ao carregar dados');
                console.error('Failed to load gamification data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [refreshTrigger]);

    // Loading skeleton
    if (loading && !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 animate-pulse">
                <div className="glass p-5 rounded-2xl border border-slate-800/50 h-40 bg-slate-800/30" />
                <div className="glass p-5 rounded-2xl border border-slate-800/50 md:col-span-2 h-40 bg-slate-800/30" />
                <div className="glass p-5 rounded-2xl border border-slate-800/50 md:col-span-3 h-32 bg-slate-800/30" />
            </div>
        );
    }

    const session = data?.session || { streak_days: 0, questions_today: 0, xp_today: 0 };
    const nextAchievement = data?.next_achievement;
    const missions = data?.missions || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

            {/* Card 1: Daily Streak & Stats */}
            <div className="glass p-5 rounded-2xl border border-slate-800/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-24 h-24 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sessão Atual</h4>
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-black text-white">{session.streak_days}</span>
                    <span className="text-sm font-bold text-orange-500 mb-1">🔥 dias seguidos</span>
                </div>
                <p className="text-xs text-slate-500">
                    {session.streak_days >= 7
                        ? '🏆 Sequência incrível! Continue assim!'
                        : 'Volte amanhã para manter o combo!'}
                </p>

                <div className="mt-4 flex gap-2">
                    <div className="flex-1 bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xl font-bold text-blue-400">{session.questions_today}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Questões</div>
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xl font-bold text-emerald-400">{session.xp_today}</div>
                        <div className="text-[10px] text-slate-500 uppercase">XP Hoje</div>
                    </div>
                </div>
            </div>

            {/* Card 2: Next Achievement */}
            <div className="glass p-5 rounded-2xl border border-slate-800/50 md:col-span-2 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />

                {nextAchievement && (
                    <>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    {nextAchievement.completed ? 'Conquista Completa!' : 'Próxima Conquista'}
                                </h4>
                                <h3 className="text-xl font-bold text-white">{nextAchievement.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{nextAchievement.description}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${nextAchievement.completed
                                    ? 'bg-emerald-600 border-emerald-500'
                                    : 'bg-slate-800 border-slate-700'
                                }`}>
                                <span className="text-2xl">{nextAchievement.icon}</span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                <span>Progresso</span>
                                <span>{nextAchievement.current} / {nextAchievement.target}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                <div
                                    className={`h-full shadow-[0_0_10px_rgba(59,130,246,0.5)] relative transition-all duration-500 ${nextAchievement.completed
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                        }`}
                                    style={{ width: `${Math.min((nextAchievement.current / nextAchievement.target) * 100, 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Card 3: Missions */}
            <div className="glass p-5 rounded-2xl border border-slate-800/50 md:col-span-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Missões Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {missions.map((mission) => {
                        const progressPercent = Math.min((mission.progress / mission.target) * 100, 100);
                        const isCompleted = mission.progress >= mission.target;

                        return (
                            <div
                                key={mission.id}
                                className={`flex items-center gap-4 p-3 rounded-xl border transition-colors cursor-default group ${isCompleted
                                        ? 'bg-emerald-900/20 border-emerald-700/50'
                                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform ${isCompleted ? 'bg-emerald-700' : 'bg-slate-800'
                                    }`}>
                                    {isCompleted ? '✓' : mission.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h5 className={`font-bold text-sm ${isCompleted ? 'text-emerald-300' : 'text-slate-200'}`}>
                                            {mission.title}
                                        </h5>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isCompleted
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {mission.reward_xp} XP
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        {isCompleted ? '✨ Completa!' : mission.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default GamificationPanel;
