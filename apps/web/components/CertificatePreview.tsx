import React, { useState } from 'react';
import { Certificate, generateCertificate, checkCertificateEligibility, EligibilityCheck } from '../services/assessmentService';

interface CertificatePreviewProps {
    trailId: string;
    trailTitle: string;
    onClose: () => void;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({ trailId, trailTitle, onClose }) => {
    const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'check' | 'form' | 'success'>('check');

    React.useEffect(() => {
        checkEligibility();
    }, []);

    const checkEligibility = async () => {
        setLoading(true);
        try {
            const result = await checkCertificateEligibility(trailId);
            setEligibility(result);
            if (result.is_eligible) {
                setStep('form');
            }
        } catch (error) {
            console.error('Failed to check eligibility:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!studentName.trim()) return;

        setLoading(true);
        try {
            const cert = await generateCertificate(trailId, studentName);
            setCertificate(cert);
            setStep('success');
        } catch (error: any) {
            console.error('Failed to generate certificate:', error);
            alert(error.message || 'Erro ao gerar certificado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-xl w-full shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {loading ? (
                    <div className="flex flex-col items-center py-12">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-slate-400">Verificando elegibilidade...</p>
                    </div>
                ) : step === 'check' && eligibility && !eligibility.is_eligible ? (
                    /* Not Eligible */
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Não é Possível Emitir Certificado</h2>
                        <p className="text-slate-400 mb-6">Você ainda não completou todos os requisitos:</p>

                        <div className="bg-slate-800 rounded-xl p-4 mb-6 text-left">
                            <ul className="space-y-2">
                                {eligibility.missing_requirements.map((req, i) => (
                                    <li key={i} className="flex items-center gap-2 text-red-400">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">Progresso da Trilha</span>
                                <span className="text-emerald-400">{eligibility.completion_percentage.toFixed(0)}%</span>
                            </div>
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all"
                                    style={{ width: `${eligibility.completion_percentage}%` }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-8 py-3 rounded-xl"
                        >
                            Voltar e Continuar Estudando
                        </button>
                    </div>
                ) : step === 'form' ? (
                    /* Enter Name Form */
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Parabéns! 🎉</h2>
                        <p className="text-slate-400 mb-6">Você completou todos os requisitos para receber seu certificado!</p>

                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left">
                            <p className="text-sm text-slate-400 mb-1">Trilha Concluída:</p>
                            <p className="font-bold text-white">{trailTitle}</p>
                            {eligibility && (
                                <p className="text-emerald-400 text-sm mt-2">Nota Final: {eligibility.final_score?.toFixed(0)}%</p>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-slate-400 mb-2 text-left">Nome completo (como aparecerá no certificado)</label>
                            <input
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="Seu nome completo"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!studentName.trim() || loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors"
                        >
                            {loading ? 'Gerando...' : 'Gerar Meu Certificado'}
                        </button>
                    </div>
                ) : step === 'success' && certificate ? (
                    /* Success */
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Certificado Emitido!</h2>

                        {/* Certificate Preview */}
                        <div className="bg-gradient-to-br from-emerald-900/30 to-blue-900/30 border-2 border-emerald-700/50 rounded-2xl p-6 mb-6">
                            <div className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-2">YouEdu</div>
                            <h3 className="text-xl font-bold text-white mb-1">Certificado de Conclusão</h3>
                            <p className="text-slate-300 mb-4">{certificate.student_name}</p>
                            <p className="text-slate-400 text-sm mb-4">Concluiu a trilha "{certificate.trail_title}"</p>
                            <div className="flex justify-center gap-4 text-sm">
                                <span className="text-emerald-400">Nota: {certificate.final_score}%</span>
                                <span className="text-slate-500">|</span>
                                <span className="text-slate-400">
                                    {certificate.status === 'approved_with_distinction' ? '⭐ Com Distinção' : '✓ Aprovado'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 mb-6">
                            <p className="text-xs text-slate-500 mb-1">Código de Verificação</p>
                            <p className="font-mono text-lg text-emerald-400">{certificate.verification_code}</p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl"
                        >
                            Concluir
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default CertificatePreview;
