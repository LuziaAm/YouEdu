import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Certificate {
    id: string;
    verification_code: string;
    student_name: string;
    trail_title: string;
    trail_description?: string;
    final_score: number;
    status: 'passed' | 'distinction';
    issued_at: string;
    pdf_url?: string;
}

interface CertificatesViewProps {
    onBack: () => void;
}

const CertificatesView: React.FC<CertificatesViewProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/certificates/user/${encodeURIComponent(user?.email || '')}`);

                if (response.ok) {
                    const data = await response.json();
                    setCertificates(data);
                } else {
                    setCertificates([]);
                }
            } catch (err) {
                console.log('Certificates API not available yet');
                setCertificates([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, [user]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
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
                        <h1 className="text-2xl md:text-3xl font-bold">Meus Certificados</h1>
                        <p className="text-slate-400">Trilhas concluídas com sucesso</p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-2xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum certificado</h3>
                        <p className="text-slate-500">Complete uma trilha para ganhar seu primeiro certificado!</p>
                        <button
                            onClick={onBack}
                            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
                        >
                            Ver Trilhas
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {certificates.map((cert) => (
                            <div
                                key={cert.id}
                                className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 overflow-hidden group hover:border-blue-500/50 transition-colors"
                            >
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-5">
                                    <svg className="w-full h-full" viewBox="0 0 100 100">
                                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                        </pattern>
                                        <rect width="100" height="100" fill="url(#grid)" />
                                    </svg>
                                </div>

                                {/* Badge */}
                                {cert.status === 'distinction' && (
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                                        <span className="text-xs font-bold text-amber-400">⭐ Distinção</span>
                                    </div>
                                )}

                                <div className="relative">
                                    {/* Icon */}
                                    <div className="w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-bold text-white mb-1">{cert.trail_title}</h3>
                                    <p className="text-slate-400 text-sm mb-4">{cert.trail_description}</p>

                                    <div className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="text-slate-500">Nota Final</p>
                                            <p className="text-2xl font-bold text-blue-400">{cert.final_score}%</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-500">Emitido em</p>
                                            <p className="text-white">{formatDate(cert.issued_at)}</p>
                                        </div>
                                    </div>

                                    {/* Verification Code */}
                                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-1">Código de Verificação</p>
                                        <code className="text-sm font-mono text-blue-400 bg-slate-800 px-2 py-1 rounded">
                                            {cert.verification_code}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificatesView;
