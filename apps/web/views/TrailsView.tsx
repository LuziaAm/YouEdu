import React, { useState, useEffect } from 'react';
import { Trail, listTrails, createTrail, deleteTrail } from '../services/trailsService';

interface TrailsViewProps {
    onSelectTrail: (trailId: string) => void;
    onBack: () => void;
}

const TrailsView: React.FC<TrailsViewProps> = ({ onSelectTrail, onBack }) => {
    const [trails, setTrails] = useState<Trail[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTrailTitle, setNewTrailTitle] = useState('');
    const [newTrailDescription, setNewTrailDescription] = useState('');

    useEffect(() => {
        loadTrails();
    }, []);

    const loadTrails = async () => {
        try {
            const data = await listTrails();
            setTrails(data);
        } catch (error) {
            console.error('Failed to load trails:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTrail = async () => {
        if (!newTrailTitle.trim()) return;

        try {
            const newTrail = await createTrail({
                title: newTrailTitle,
                description: newTrailDescription || undefined,
            });
            setTrails([...trails, newTrail]);
            setShowCreateModal(false);
            setNewTrailTitle('');
            setNewTrailDescription('');
        } catch (error) {
            console.error('Failed to create trail:', error);
        }
    };

    const handleDeleteTrail = async (trailId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir esta trilha?')) return;

        try {
            await deleteTrail(trailId);
            setTrails(trails.filter(t => t.id !== trailId));
        } catch (error) {
            console.error('Failed to delete trail:', error);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Header */}
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Minhas Trilhas</span>
                        <h1 className="text-lg font-black text-white tracking-tight">JORNADAS DE APRENDIZADO</h1>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nova Trilha
                </button>
            </nav>

            {/* Content */}
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : trails.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-400 mb-2">Nenhuma trilha criada</h2>
                        <p className="text-slate-500 mb-6">Comece criando sua primeira jornada de aprendizado!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-all"
                        >
                            Criar Primeira Trilha
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trails.map((trail) => (
                            <div
                                key={trail.id}
                                onClick={() => onSelectTrail(trail.id)}
                                className="group bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/10"
                            >
                                {/* Cover */}
                                <div className="h-32 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 relative">
                                    <div className="absolute inset-0 bg-slate-900/50" />
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                        <span className="bg-slate-900/80 text-emerald-400 text-xs font-bold px-2 py-1 rounded">
                                            {trail.video_count} vídeos
                                        </span>
                                        {trail.total_duration_seconds > 0 && (
                                            <span className="bg-slate-900/80 text-slate-400 text-xs px-2 py-1 rounded">
                                                {formatDuration(trail.total_duration_seconds)}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteTrail(trail.id, e)}
                                        className="absolute top-3 right-3 p-2 bg-red-600/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                                        {trail.title}
                                    </h3>
                                    {trail.description && (
                                        <p className="text-sm text-slate-500 line-clamp-2">{trail.description}</p>
                                    )}

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Progresso</span>
                                            <span>{trail.completed_count}/{trail.video_count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all"
                                                style={{ width: trail.video_count > 0 ? `${(trail.completed_count / trail.video_count) * 100}%` : '0%' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Criar Nova Trilha</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Título da Trilha</label>
                                <input
                                    type="text"
                                    value={newTrailTitle}
                                    onChange={(e) => setNewTrailTitle(e.target.value)}
                                    placeholder="Ex: Curso de Python Completo"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Descrição (opcional)</label>
                                <textarea
                                    value={newTrailDescription}
                                    onChange={(e) => setNewTrailDescription(e.target.value)}
                                    placeholder="Descreva o objetivo desta trilha..."
                                    rows={3}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateTrail}
                                disabled={!newTrailTitle.trim()}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Criar Trilha
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrailsView;
