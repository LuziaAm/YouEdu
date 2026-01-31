
import React from 'react';

interface XPBarProps {
  xp: number;
  level: number;
}

const XPBar: React.FC<XPBarProps> = ({ xp, level }) => {
  return (
    <div className="w-full glass p-4 rounded-xl flex items-center gap-6 sticky top-4 z-50">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Nível do Aluno</span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-white italic">LVL {level}</span>
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-slate-400">Progresso de Experiência</span>
          <span className="text-xs font-bold text-blue-300">{xp}%</span>
        </div>
        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 transition-all duration-700 ease-out xp-glow"
            style={{ width: `${xp}%` }}
          />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-xs font-bold text-blue-400 uppercase">Status: Ativo</span>
      </div>
    </div>
  );
};

export default XPBar;
