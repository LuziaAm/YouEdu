import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface VideoSession {
    id: string;
    video_url: string;
    video_title: string;
    started_at: string;
    completed_at?: string;
    progress_percent: number;
    quiz_score?: number;
}

interface HistoryViewProps {
    onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<VideoSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, _setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.email) return;

            try {
                // TODO: Replace with actual API call when backend is ready
                const response = await fetch(`http://localhost:8000/api/students/email/${encodeURIComponent(user.email)}/sessions`);

                if (response.ok) {
                    const data = await response.json();
                    setSessions(data);
                } else {
                    // Mock data for now
                    setSessions([]);
                }
            } catch (err) {
                console.log('History API not available yet');
                setSessions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                        <h1 className="text-2xl md:text-3xl font-bold">Histórico de Vídeos</h1>
                        <p className="text-slate-400">Seus vídeos assistidos</p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-2xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum vídeo assistido</h3>
                        <p className="text-slate-500">Assista seu primeiro vídeo para começar a aprender!</p>
                        <button
                            onClick={onBack}
                            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
                        >
                            Assistir Vídeo
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Video Thumbnail Placeholder */}
                                    <div className="w-24 h-16 md:w-32 md:h-20 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate">{session.video_title || 'Vídeo sem título'}</h3>
                                        <p className="text-sm text-slate-500 truncate">{session.video_url}</p>
                                        <p className="text-xs text-slate-600 mt-1">{formatDate(session.started_at)}</p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-lg font-bold text-blue-400">{session.progress_percent}%</div>
                                        {session.quiz_score !== undefined && (
                                            <div className="text-sm text-emerald-400">Quiz: {session.quiz_score}%</div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                        style={{ width: `${session.progress_percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryView;
