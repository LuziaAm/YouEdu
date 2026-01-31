import React, { useState, useEffect } from 'react';

interface XPBarProps {
  xp: number;
  level: number;
  onLevelUp?: (newLevel: number) => void;
}

const XPBar: React.FC<XPBarProps> = ({ xp, level, onLevelUp }) => {
  const [displayXP, setDisplayXP] = useState(xp);
  const [xpGain, setXPGain] = useState<number | null>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  // XP necessário para o próximo nível (100 XP por nível)
  const xpPerLevel = 100;
  const currentLevelXP = xp % xpPerLevel;
  const progressPercentage = (currentLevelXP / xpPerLevel) * 100;

  // Animar ganho de XP
  useEffect(() => {
    if (xp > displayXP) {
      const gainedXP = xp - displayXP;
      setXPGain(gainedXP);

      // Animar o valor
      const duration = 1000;
      const steps = 20;
      const increment = gainedXP / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setDisplayXP(prev => {
          const newValue = prev + increment;
          return currentStep >= steps ? xp : newValue;
        });

        if (currentStep >= steps) {
          clearInterval(interval);
          setTimeout(() => setXPGain(null), 2000);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    } else {
      setDisplayXP(xp);
    }
  }, [xp]);

  // Detectar level up
  useEffect(() => {
    const prevLevel = Math.floor((displayXP - (xp - displayXP)) / xpPerLevel) + 1;
    const newLevel = Math.floor(displayXP / xpPerLevel) + 1;

    if (newLevel > prevLevel) {
      setIsLevelingUp(true);
      onLevelUp?.(newLevel);
      setTimeout(() => setIsLevelingUp(false), 3000);
    }
  }, [displayXP, xp, onLevelUp]);

  return (
    <div className="w-full relative">
      {/* Level Up Animation */}
      {isLevelingUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-white px-8 py-4 rounded-2xl shadow-2xl border-4 border-yellow-300 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎉</span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">Level Up!</div>
                  <div className="text-2xl font-black">Nível {level}</div>
                </div>
                <span className="text-4xl">🎉</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XP Gain Indicator */}
      {xpGain !== null && !isLevelingUp && (
        <div className="absolute -top-8 right-4 z-40 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold">
            <span className="text-lg">+{xpGain}</span>
            <span className="text-xs">XP</span>
            <span className="text-xl">✨</span>
          </div>
        </div>
      )}

      {/* Main XP Bar */}
      <div className="glass p-5 rounded-2xl flex items-center gap-6 sticky top-4 z-30 shadow-xl border border-white/10">
        {/* Level Display */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 px-6 py-3 rounded-xl shadow-lg min-w-[100px]">
          <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Nível</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white drop-shadow-lg">{level}</span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-300">Progresso de Experiência</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-400">
                {currentLevelXP} / {xpPerLevel} XP
              </span>
              <span className="text-xs text-slate-500">({progressPercentage.toFixed(0)}%)</span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="relative h-6 w-full bg-slate-900/50 rounded-full overflow-hidden border-2 border-slate-700/50 shadow-inner">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />

            {/* Progress Fill */}
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />

              {/* Glow Effect */}
              <div className="absolute inset-0 shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
            </div>

            {/* Progress Indicator Dot */}
            {progressPercentage > 5 && progressPercentage < 95 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-1000"
                style={{ left: `calc(${progressPercentage}% - 6px)` }}
              />
            )}
          </div>

          {/* Next Level Indicator */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-slate-500">Nível {level}</span>
            <span className="text-xs text-slate-400 font-medium">
              {xpPerLevel - currentLevelXP} XP para o próximo nível
            </span>
            <span className="text-xs text-slate-500">Nível {level + 1}</span>
          </div>
        </div>

        {/* Total XP Display */}
        <div className="hidden lg:flex flex-col items-center bg-slate-800/50 px-6 py-3 rounded-xl border border-slate-700/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {Math.floor(displayXP)}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ativo</span>
        </div>
      </div>

      {/* Add custom animations to index.css */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default XPBar;
