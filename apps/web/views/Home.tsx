import React from 'react';

interface HomeProps {
  onSelectRole: (role: 'student' | 'trails' | 'verification') => void;
}

const Home: React.FC<HomeProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl w-full text-center z-10 space-y-10">
        <header className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-bold uppercase tracking-widest mb-4">
            YouEdu - Plataforma Inteligente
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            Transforme Vídeos em <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Jornadas</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Organize qualquer vídeo em trilhas de aprendizado personalizadas, com avaliações geradas por IA e certificados verificáveis.
          </p>
        </header>

        <div className="flex flex-col md:flex-row justify-center gap-5 px-4">
          {/* Trilhas Button */}
          <button onClick={() => onSelectRole('trails')} className="group relative glass p-6 rounded-2xl border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-500 text-center overflow-hidden max-w-xs w-full shadow-xl shadow-emerald-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Minhas Trilhas</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">Crie cursos em jornadas estruturadas.</p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-500/20 group-hover:translate-y-[-2px] transition-all">
                ACESSAR
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          </button>

          {/* Quick Study Button */}
          <button onClick={() => onSelectRole('student')} className="group relative glass p-6 rounded-2xl border border-blue-500/30 hover:border-blue-500/60 transition-all duration-500 text-center overflow-hidden max-w-xs w-full shadow-xl shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Estudo Rápido</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">Cole um link e comece a aprender.</p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20 group-hover:translate-y-[-2px] transition-all">
                ASSISTIR
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          </button>

          {/* Verify Certificate Button */}
          <button onClick={() => onSelectRole('verification')} className="group relative glass p-6 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all duration-500 text-center overflow-hidden max-w-xs w-full shadow-xl shadow-amber-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-14 h-14 bg-amber-600/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Verificar Certificado</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">Autentique um certificado emitido.</p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-amber-500/20 group-hover:translate-y-[-2px] transition-all">
                VERIFICAR
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </button>
        </div>

        <footer className="pt-4 text-slate-600 text-xs font-medium uppercase tracking-[0.2em]">
          Powered by Gemini AI & YouEdu Platform
        </footer>
      </div>
    </div>
  );
};

export default Home;
