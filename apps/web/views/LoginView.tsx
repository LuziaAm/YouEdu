import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginViewProps {
    onBack: () => void;
    pendingDestination?: 'student' | 'trails' | 'verification';
}

const LoginView: React.FC<LoginViewProps> = ({ onBack, pendingDestination }) => {
    const { signInWithGoogle, loading } = useAuth();
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);

        const { error } = await signInWithGoogle();

        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
        // On success, the page will redirect via OAuth flow
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden relative">
            {/* Background effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full z-10">
                {/* Back button */}
                <button
                    onClick={onBack}
                    className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                </button>

                {/* Login card */}
                <div className="glass p-8 rounded-2xl border border-slate-800/50 text-center space-y-6">
                    {/* Logo / Icon */}
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-2xl font-bold text-white">Bem-vindo ao YouEdu</h1>
                        <p className="text-slate-400 mt-2">
                            {pendingDestination === 'trails'
                                ? 'Entre para acessar suas trilhas de aprendizado'
                                : pendingDestination === 'student'
                                    ? 'Entre para salvar seu progresso de estudos'
                                    : 'Entre para continuar'
                            }
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading || loading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
                    >
                        {isLoading || loading ? (
                            <>
                                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                Conectando...
                            </>
                        ) : (
                            <>
                                {/* Google logo */}
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Entrar com Google
                            </>
                        )}
                    </button>

                    {/* Privacy note */}
                    <p className="text-xs text-slate-500">
                        Ao entrar, você concorda com nossos{' '}
                        <a href="#" className="text-blue-400 hover:underline">Termos de Uso</a>
                        {' '}e{' '}
                        <a href="#" className="text-blue-400 hover:underline">Política de Privacidade</a>
                    </p>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                    {[
                        { icon: '📊', text: 'Acompanhe seu progresso' },
                        { icon: '🏆', text: 'Ganhe conquistas' },
                        { icon: '📜', text: 'Receba certificados' }
                    ].map((feature, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl mb-1">{feature.icon}</div>
                            <p className="text-xs text-slate-500">{feature.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoginView;
