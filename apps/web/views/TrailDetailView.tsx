import React, { useState, useEffect } from 'react';
import { TrailDetail, TrailVideo, getTrail, addVideoToTrail } from '../services/trailsService';
import { checkCertificateEligibility, EligibilityCheck } from '../services/assessmentService';
import CertificatePreview from '../components/CertificatePreview';
import FinalAssessmentView from '../components/FinalAssessmentView';

interface TrailDetailViewProps {
    trailId: string;
    onBack: () => void;
    onPlayVideo: (video: TrailVideo, trailId: string) => void;
}

const TrailDetailView: React.FC<TrailDetailViewProps> = ({ trailId, onBack, onPlayVideo }) => {
    const [trail, setTrail] = useState<TrailDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newVideoTitle, setNewVideoTitle] = useState('');
    const [showCertificate, setShowCertificate] = useState(false);
    const [showAssessment, setShowAssessment] = useState(false);
    const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);

    useEffect(() => {
        loadTrail();
    }, [trailId]);

    const loadTrail = async () => {
        try {
            const data = await getTrail(trailId);
            setTrail(data);
            try {
                const elig = await checkCertificateEligibility(trailId);
                setEligibility(elig);
            } catch (e) { }
        } catch (error) {
            console.error('Failed to load trail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVideo = async () => {
        if (!newVideoUrl.trim()) return;
        try {
            const newVideo = await addVideoToTrail(trailId, {
                video_url: newVideoUrl,
                title: newVideoTitle || undefined,
            });
            if (trail) {
                setTrail({
                    ...trail,
                    videos: [...trail.videos, newVideo],
                    video_count: trail.video_count + 1
                });
            }
            setShowAddModal(false);
            setNewVideoUrl('');
            setNewVideoTitle('');
        } catch (error) {
            console.error('Failed to add video:', error);
        }
    };

    const handleAssessmentComplete = (result: any) => {
        setShowAssessment(false);
        if (result.passed) {
            setShowCertificate(true);
        }
        loadTrail();
    };

    const getProviderIcon = (provider?: string) => {
        switch (provider) {
            case 'youtube':
                return (
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                    </div>
                );
            case 'vimeo':
                return (
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    if (showAssessment && trail) {
        return (
            <FinalAssessmentView
                trailId={trailId}
                trailTitle={trail.title}
                onComplete={handleAssessmentComplete}
                onCancel={() => setShowAssessment(false)}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!trail) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 mb-4">Trilha não encontrada</p>
                    <button onClick={onBack} className="text-emerald-500 hover:underline">Voltar</button>
                </div>
            </div>
        );
    }

    const allCompleted = trail.video_count > 0 && trail.completed_count >= trail.video_count;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Trilha de Aprendizado</span>
                        <h1 className="text-lg font-black text-white tracking-tight">{trail.title}</h1>
                    </div>
                </div>
                <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Vídeo
                </button>
            </nav>

            <div className="p-6 md:p-8 max-w-4xl mx-auto">
                {trail.description && <p className="text-slate-400 mb-6">{trail.description}</p>}

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-400">Progresso da Trilha</span>
                        <span className="text-emerald-400 font-bold">{trail.completed_count}/{trail.video_count} completos</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all" style={{ width: trail.video_count > 0 ? `${(trail.completed_count / trail.video_count) * 100}%` : '0%' }} />
                    </div>
                </div>

                {trail.videos.length > 0 && (
                    <div className="flex gap-4 mb-8">
                        <button onClick={() => setShowAssessment(true)} disabled={!allCompleted} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${allCompleted ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Fazer Avaliação Final
                        </button>
                        <button onClick={() => setShowCertificate(true)} disabled={!eligibility?.is_eligible} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${eligibility?.is_eligible ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                            Emitir Certificado
                        </button>
                    </div>
                )}

                <h2 className="text-lg font-bold text-white mb-4">Vídeos da Trilha</h2>

                {trail.videos.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl">
                        <p className="text-slate-500 mb-4">Nenhum vídeo adicionado ainda</p>
                        <button onClick={() => setShowAddModal(true)} className="text-emerald-500 hover:underline">Adicionar primeiro vídeo</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {trail.videos.map((video, index) => (
                            <div key={video.id} onClick={() => onPlayVideo(video, trailId)} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${video.completed ? 'bg-emerald-900/20 border border-emerald-800/50' : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${video.completed ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    {video.completed ? (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>) : (index + 1)}
                                </div>
                                {getProviderIcon(video.video_provider)}
                                <div className="flex-1">
                                    <h3 className="font-medium text-white">{video.title}</h3>
                                    {video.quiz_score !== null && <span className="text-xs text-emerald-400">Quiz: {video.quiz_score} pts</span>}
                                </div>
                                <div className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Adicionar Vídeo</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">URL do Vídeo</label>
                                <input type="text" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Título (opcional)</label>
                                <input type="text" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} placeholder="Título do vídeo" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 outline-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={handleAddVideo} disabled={!newVideoUrl.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">Adicionar</button>
                        </div>
                    </div>
                </div>
            )}

            {showCertificate && <CertificatePreview trailId={trailId} trailTitle={trail.title} onClose={() => setShowCertificate(false)} />}
        </div>
    );
};

export default TrailDetailView;
