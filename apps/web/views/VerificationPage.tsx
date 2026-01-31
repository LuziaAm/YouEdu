import React, { useState, useEffect } from 'react';
import { verifyCertificate, CertificateVerification } from '../services/assessmentService';

interface VerificationPageProps {
    initialCode?: string;
    onBack: () => void;
}

const VerificationPage: React.FC<VerificationPageProps> = ({ initialCode, onBack }) => {
    const [code, setCode] = useState(initialCode || '');
    const [result, setResult] = useState<CertificateVerification | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        if (initialCode) {
            handleVerify();
        }
    }, [initialCode]);

    const handleVerify = async () => {
        if (!code.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const verification = await verifyCertificate(code.trim());
            setResult(verification);
        } catch (error) {
            setResult({
                valid: false,
                verification_code: code,
                message: 'Erro ao verificar certificado. Tente novamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header */}
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Verificação</span>
                    <h1 className="text-lg font-black text-white tracking-tight">AUTENTICAR CERTIFICADO</h1>
                </div>
            </nav>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    {/* Search Box */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold mb-2">Verificar Certificado YouEdu</h2>
                            <p className="text-slate-400 text-sm">Insira o código de verificação para confirmar a autenticidade</p>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                                placeholder="Ex: YE-ABCD1234"
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:border-emerald-500 outline-none font-mono text-center text-lg tracking-wider"
                            />
                            <button
                                onClick={handleVerify}
                                disabled={!code.trim() || loading}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold px-6 rounded-xl transition-colors"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Result */}
                    {searched && result && (
                        <div className={`rounded-2xl p-8 border ${result.valid ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.valid ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                    {result.valid ? (
                                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${result.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {result.valid ? 'Certificado Válido' : 'Certificado Não Encontrado'}
                                    </h3>
                                    <p className="text-slate-400 text-sm">{result.message}</p>
                                </div>
                            </div>

                            {result.valid && (
                                <div className="space-y-4 border-t border-slate-700/50 pt-6">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nome do Aluno</span>
                                        <span className="font-medium text-white">{result.student_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Trilha Concluída</span>
                                        <span className="font-medium text-white">{result.trail_title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nota Final</span>
                                        <span className="font-medium text-emerald-400">{result.final_score}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Status</span>
                                        <span className={`font-medium ${result.status === 'approved_with_distinction' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {result.status === 'approved_with_distinction' ? '⭐ Com Distinção' : '✅ Aprovado'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Data de Emissão</span>
                                        <span className="font-medium text-white">{formatDate(result.issued_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Código</span>
                                        <span className="font-mono text-emerald-400">{result.verification_code}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info */}
                    <div className="text-center mt-8 text-slate-500 text-sm">
                        <p>Certificados emitidos pela plataforma YouEdu são verificáveis publicamente.</p>
                        <p className="mt-1">Em caso de dúvidas, entre em contato com o suporte.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;
