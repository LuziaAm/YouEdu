
import React, { useState, useRef, useEffect } from 'react';
import { analyzeVideo } from './services/geminiService';
import { Challenge, StudentState } from './types';
import XPBar from './components/XPBar';
import ChallengeOverlay from './components/ChallengeOverlay';
import Home from './views/Home';

type ViewMode = 'home' | 'student';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('home');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [ytInput, setYtInput] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [configError, setConfigError] = useState<{ code: number; message: string } | null>(null);
  const [student, setStudent] = useState<StudentState>({ level: 1, xp: 0, completedChallenges: [] });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
    };
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYoutubeSubmit = async () => {
    const id = getYoutubeId(ytInput);
    if (id) {
      setYoutubeId(id);
      setVideoUrl(null);
      setIsAnalyzing(true);
      setConfigError(null);
      
      setTimeout(() => {
        const mockChallenges: Challenge[] = [
          {
            id: 'yt-1',
            timestamp: 10,
            timestampLabel: '00:10',
            type: 'quiz' as any,
            title: 'Conceito Inicial',
            content: 'De acordo com a introdução do vídeo, qual o objetivo principal da ferramenta apresentada?',
            options: ['Automatizar testes', 'Gerar código com IA', 'Analisar logs', 'Nenhuma das anteriores'],
            correctAnswer: 1,
            summary: 'O vídeo foca na geração de código assistida por IA.'
          },
          {
            id: 'yt-2',
            timestamp: 30,
            timestampLabel: '00:30',
            type: 'code' as any,
            title: 'Mão na Massa',
            content: 'Escreva a função de soma mencionada no vídeo.',
            correctAnswer: 'function sum(a, b) { return a + b; }',
            summary: 'Funções puras em JavaScript.'
          }
        ];
        setChallenges(mockChallenges);
        setIsAnalyzing(false);
      }, 3000);
    } else {
      setConfigError({ code: 153, message: "Erro de configuração do video: Formato ou ID não suportado." });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setYoutubeId(null);
      setVideoUrl(URL.createObjectURL(file));
      setIsAnalyzing(true);
      setConfigError(null);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const result = await analyzeVideo(base64, file.type);
          setChallenges(result);
        } catch (error) {
          console.error("Erro na análise do Gemini:", error);
          setConfigError({ code: 153, message: "Erro de configuração do video: Falha na análise de conteúdo via IA." });
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.onerror = () => {
        setConfigError({ code: 153, message: "Erro de configuração do video: Falha ao ler arquivo local." });
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || activeChallenge) return;
    
    const currentTime = videoRef.current.currentTime;
    const challengeToTrigger = challenges.find(c => 
      !student.completedChallenges.includes(c.id) && 
      Math.abs(c.timestamp - currentTime) < 0.8
    );

    if (challengeToTrigger) {
      videoRef.current.pause();
      setActiveChallenge(challengeToTrigger);
    }
  };

  const handleChallengeSolved = (success: boolean) => {
    if (!activeChallenge) return;

    setStudent(prev => {
      let newXp = prev.xp;
      let newLevel = prev.level;

      if (success) {
        newXp += 25;
        if (newXp >= 100) {
          newLevel += 1;
          newXp = 0;
        }
      } else {
        newXp = Math.max(0, newXp - 5);
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        completedChallenges: [...prev.completedChallenges, activeChallenge.id]
      };
    });

    setActiveChallenge(null);
    if (videoRef.current) videoRef.current.play();
  };

  if (view === 'home') {
    return <Home onSelectRole={() => setView('student')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-[60]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('home')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-tighter">Painel do Aluno</span>
            <span className="text-lg font-black text-white italic tracking-tighter">GEMINI EDU-TECH</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[10px] font-bold text-slate-500">EXPERIÊNCIA ATUAL</span>
            <span className="text-[10px] font-bold text-blue-400">LVL {student.level}</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${student.xp}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white border-2 border-slate-800 shadow-xl">
            AL
          </div>
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <XPBar xp={student.xp} level={student.level} />

          {configError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h4 className="text-rose-400 font-bold uppercase text-xs tracking-widest mb-1">Erro {configError.code}</h4>
                <p className="text-sm text-slate-300">{configError.message}</p>
              </div>
              <button 
                onClick={() => setConfigError(null)}
                className="ml-auto text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {(!videoUrl && !youtubeId) ? (
                <div className="aspect-video glass rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-blue-500/30 transition-all p-8 text-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                    <div className="flex flex-col items-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-colors group">
                       <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                       </div>
                       <h4 className="font-bold text-white mb-2">Upload de Vídeo</h4>
                       <p className="text-xs text-slate-500 mb-6">Suporta MP4, WebM e OGG</p>
                       <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" id="video-upload" />
                       <label htmlFor="video-upload" className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition-colors">
                        Escolher Arquivo
                       </label>
                    </div>

                    <div className="flex flex-col items-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-red-500/50 transition-colors group">
                       <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                       </div>
                       <h4 className="font-bold text-white mb-2">Link do YouTube</h4>
                       <p className="text-xs text-slate-500 mb-4 w-full">Insira a URL do vídeo</p>
                       <div className="flex w-full gap-2">
                         <input 
                           type="text" 
                           value={ytInput}
                           onChange={(e) => setYtInput(e.target.value)}
                           placeholder="https://youtube.com/..."
                           className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] focus:border-red-500 outline-none"
                         />
                         <button 
                           onClick={handleYoutubeSubmit}
                           className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-2 rounded-xl transition-colors"
                         >
                           Analisar
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-800 ring-1 ring-slate-800/50">
                  {videoUrl ? (
                    <video ref={videoRef} src={videoUrl} onTimeUpdate={handleTimeUpdate} controls className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full">
                      <iframe
                        id="yt-player"
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  {isAnalyzing && (
                    <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 relative">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <h4 className="text-2xl font-black text-white mt-8 mb-2 italic">SINCRONIZANDO IA...</h4>
                      <p className="text-blue-400 font-medium max-w-xs leading-relaxed">Mapeando pontos de interação na aula...</p>
                    </div>
                  )}
                  {activeChallenge && (
                    <ChallengeOverlay challenge={activeChallenge} studentLevel={student.level} onSolve={handleChallengeSolved} />
                  )}
                </div>
              )}

              <div className="glass p-8 rounded-3xl border border-slate-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="text-xl font-bold text-white italic">Notas da Aula</h2>
                </div>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Esta experiência é adaptativa. Acerte os desafios no tempo certo para desbloquear novos níveis e bônus de XP. {youtubeId && "Atenção: Para vídeos do YouTube, o rastreamento automático de desafios está em fase experimental."}
                </p>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="glass h-full rounded-3xl p-6 flex flex-col border border-slate-800/50">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                  <h3 className="text-lg font-black text-white italic tracking-tight">PROGRESSO</h3>
                  <span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase tracking-tighter">
                    {challenges.length} MÓDULOS
                  </span>
                </div>
                
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {challenges.length === 0 && !isAnalyzing ? (
                    <div className="text-center py-20 text-slate-600 text-sm italic">
                      Mapa de estudos ainda não gerado.
                    </div>
                  ) : isAnalyzing ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex gap-4 p-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                        <div className="flex-1 space-y-3 py-1">
                          <div className="h-3 bg-slate-800 rounded w-3/4" />
                        </div>
                      </div>
                    ))
                  ) : (
                    challenges.map((challenge, index) => (
                      <div 
                        key={challenge.id} 
                        className={`group p-5 rounded-2xl border transition-all duration-300 ${
                          student.completedChallenges.includes(challenge.id)
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                            MOD {index + 1} • {challenge.timestampLabel}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors mb-2">{challenge.title}</h4>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
