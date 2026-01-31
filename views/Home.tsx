
import React from 'react';

interface HomeProps {
  onSelectRole: (role: 'student') => void;
}

const Home: React.FC<HomeProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full text-center z-10 space-y-12">
        <header className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-bold uppercase tracking-widest mb-4">
            Plataforma Edu-Tech v2.0
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            O Futuro da <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Educação</span> é Interativo.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Aprenda programação com desafios gerados por IA em tempo real. Transforme qualquer vídeo em uma experiência de aprendizado gamificada.
          </p>
        </header>

        <div className="flex justify-center px-4">
          <button 
            onClick={() => onSelectRole('student')}
            className="group relative glass p-10 rounded-3xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 text-center overflow-hidden max-w-md w-full shadow-2xl shadow-blue-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 italic">Começar a Aprender</h3>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                Assista aulas interativas, resolva quizzes em tempo real e conquiste XP para subir de nível agora mesmo.
              </p>
              <div className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:translate-y-[-2px] transition-all">
                ENTRAR
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          </button>
        </div>

        <footer className="pt-12 text-slate-600 text-xs font-medium uppercase tracking-[0.2em]">
          Powered by Gemini 2.5 Flash & Next-Gen UI
        </footer>
      </div>
    </div>
  );
};

export default Home;
