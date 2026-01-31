import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface StudentStats {
    total_xp: number;
    level: number;
    videos_watched: number;
    quizzes_completed: number;
    average_score: number;
    total_time_minutes: number;
    achievements_unlocked: number;
    current_streak: number;
    best_streak: number;
}

interface StatsViewProps {
    onBack: () => void;
}

const StatsView: React.FC<StatsViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.email) return;

            try {
                // Try to fetch from API
                const response = await fetch(`http://localhost:8000/api/students/email/${encodeURIComponent(user.email)}/stats`);

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                } else {
                    // Default stats for new users
                    setStats({
                        total_xp: 0,
                        level: 1,
                        videos_watched: 0,
                        quizzes_completed: 0,
                        average_score: 0,
                        total_time_minutes: 0,
                        achievements_unlocked: 0,
                        current_streak: 0,
                        best_streak: 0
                    });
                }
            } catch (err) {
                console.log('Stats API not available yet');
                setStats({
                    total_xp: 0,
                    level: 1,
                    videos_watched: 0,
                    quizzes_completed: 0,
                    average_score: 0,
                    total_time_minutes: 0,
                    achievements_unlocked: 0,
                    current_streak: 0,
                    best_streak: 0
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes}min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
    };

    const xpForNextLevel = stats ? (stats.level * 100) : 100;
    const xpProgress = stats ? ((stats.total_xp % 100) / 100) * 100 : 0;

    const statCards = stats ? [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            label: 'Vídeos Assistidos',
            value: stats.videos_watched,
            color: 'blue'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'Quizzes Completados',
            value: stats.quizzes_completed,
            color: 'emerald'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            label: 'Taxa de Acerto',
            value: `${stats.average_score}%`,
            color: 'amber'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'Tempo de Estudo',
            value: formatTime(stats.total_time_minutes),
            color: 'purple'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            ),
            label: 'Conquistas',
            value: stats.achievements_unlocked,
            color: 'pink'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
            ),
            label: 'Melhor Sequência',
            value: `${stats.best_streak} dias`,
            color: 'orange'
        }
    ] : [];

    const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
        blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
        emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
        purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
        pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
        orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Estatísticas</h1>
                        <p className="text-slate-400">Seu progresso de aprendizado</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : stats && (
                    <>
                        {/* Level Card */}
                        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-slate-400 text-sm">Seu Nível</p>
                                    <p className="text-4xl font-bold text-white">Nível {stats.level}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-sm">XP Total</p>
                                    <p className="text-2xl font-bold text-blue-400">{stats.total_xp} XP</p>
                                </div>
                            </div>

                            {/* XP Progress Bar */}
                            <div className="mb-2">
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                        style={{ width: `${xpProgress}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-slate-500">
                                {stats.total_xp % 100} / {xpForNextLevel} XP para o próximo nível
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {statCards.map((card, index) => {
                                const colors = colorClasses[card.color];
                                return (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-2xl border ${colors.border} ${colors.bg}`}
                                    >
                                        <div className={`w-10 h-10 mb-3 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                                            {card.icon}
                                        </div>
                                        <p className="text-2xl font-bold text-white">{card.value}</p>
                                        <p className="text-sm text-slate-400">{card.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Current Streak */}
                        {stats.current_streak > 0 && (
                            <div className="mt-8 p-6 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl border border-orange-500/30 text-center">
                                <div className="text-5xl mb-2">🔥</div>
                                <p className="text-2xl font-bold text-white">{stats.current_streak} dias</p>
                                <p className="text-slate-400">de sequência ativa!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default StatsView;
