import React, { useState, useRef, useEffect } from 'react';
import { transcribeVideo, generateQuiz, getYouTubeCaptions, captionsToTranscript, TranscriptResponse, QuizResponse } from './services/transcriptionService';
import studentProgressService, { Student } from './services/studentProgressService';
import { parseYouTubeUrl } from './services/youtubeService';
import { StudentState } from './types';
import TranscriptPanel from './components/TranscriptPanel';
import FinalQuiz from './components/FinalQuiz';
import GamificationPanel from './components/GamificationPanel';
import UserMenu from './components/UserMenu';
import Home from './views/Home';
import TrailsView from './views/TrailsView';
import TrailDetailView from './views/TrailDetailView';
import VerificationPage from './views/VerificationPage';
import LoginView from './views/LoginView';
import HistoryView from './views/HistoryView';
import CertificatesView from './views/CertificatesView';
import StatsView from './views/StatsView';
import CheckpointModal from './components/CheckpointModal';
import { TrailVideo } from './services/trailsService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { useVideoCheckpoints } from './hooks/useVideoCheckpoints';

type ViewMode = 'home' | 'student' | 'trails' | 'trail-detail' | 'verification' | 'login' | 'history' | 'certificates' | 'stats';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<ViewMode>('home');
  const [pendingDestination, setPendingDestination] = useState<'student' | 'trails' | 'verification' | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [vimeoId, setVimeoId] = useState<string | null>(null);
  const [ytInput, setYtInput] = useState('');

  // New State for Transcription Strategy
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFinalQuiz, setShowFinalQuiz] = useState(false);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [_configError, setConfigError] = useState<{ code: number; message: string } | null>(null);
  const [student, setStudent] = useState<StudentState>({ level: 1, xp: 0, completedChallenges: [] });
  const [dbStudent, setDbStudent] = useState<Student | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionQuizCompleted, setSessionQuizCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const ytIntervalRef = useRef<number | null>(null);

  // Trail state
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [currentTrailVideoId, setCurrentTrailVideoId] = useState<string | null>(null);

  // Video state
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);  // Track video play/pause state

  // Use the new checkpoint hook for automatic checkpoint management
  const {
    checkpoints,
    currentCheckpoint,
    isLoading: checkpointsLoading,
    handleAnswer: handleCheckpointAnswer,
    handleSkip: handleCheckpointSkip,
    loadCheckpoints: loadAICheckpoints,
  } = useVideoCheckpoints(
    currentTime,
    isVideoPlaying,
    videoDuration,
    youtubeId || currentTrailVideoId || 'video',
    selectedTrailId || undefined
  );

  // YouTube Player API integration
  const {
    currentTime: ytCurrentTime,
    isPlaying: ytIsPlaying,
    duration: ytDuration,
    isReady: ytIsReady,
    playerRef: ytPlayerRef
  } = useYouTubePlayer(youtubeId);

  // Sync YouTube player state with app state
  useEffect(() => {
    if (youtubeId && ytIsReady) {
      setCurrentTime(ytCurrentTime);
      setIsVideoPlaying(ytIsPlaying);
      if (ytDuration > 0) {
        setVideoDuration(ytDuration);
      }
    }
  }, [youtubeId, ytIsReady, ytCurrentTime, ytIsPlaying, ytDuration]);

  // Fetch student data from DB when user logs in
  useEffect(() => {
    const fetchStudentData = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`/api/auth/me/${encodeURIComponent(user.email)}`);
          if (response.ok) {
            const data = await response.json();
            setDbStudent(data);
            // Also sync local XP/Level state with DB
            if (data.total_xp) {
              setStudent(prev => ({
                ...prev,
                xp: data.total_xp,
                level: data.level || 1
              }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch student data:', error);
        }
      } else {
        setDbStudent(null);
      }
    };

    fetchStudentData();
  }, [user]);

  // Handle auth callback - after login, redirect to pending destination
  useEffect(() => {
    if (user && pendingDestination && view === 'login') {
      setView(pendingDestination);
      setPendingDestination(undefined);
    }
  }, [user, pendingDestination, view]);

  // Handle video playback session tracking
  useEffect(() => {
    const trackSession = async () => {
      // Only track if user is logged in, video is playing, and no session is active
      if (dbStudent && isVideoPlaying && !currentSessionId && (videoUrl || youtubeId) && videoDuration > 0) {
        try {
          const title = youtubeId ? 'YouTube Video' : 'Uploaded Video'; // Ideally fetch real title
          const source = youtubeId ? 'youtube' : 'upload';
          const session = await studentProgressService.createVideoSession(
            dbStudent.id,
            title,
            source,
            videoDuration,
            videoUrl || `https://youtube.com/watch?v=${youtubeId}`,
            0 // Challenges count will be updated later
          );
          setCurrentSessionId(session.id);
        } catch (error) {
          console.error('Failed to create video session:', error);
        }
      }
    };

    trackSession();
  }, [isVideoPlaying, dbStudent, currentSessionId, videoUrl, youtubeId, videoDuration]);

  // End session when video completes or navigating away (cleanup)
  // For now, simpler approach: update progress when showing final quiz
  useEffect(() => {
    if (showFinalQuiz && currentSessionId) {
      studentProgressService.updateVideoSession(currentSessionId, {
        completed_at: new Date().toISOString(),
        time_spent: videoDuration // Approximate
      }).then(() => {
        // Refresh stats/history if we had a way to trigger it
        console.log('Session marked as completed');
        setCurrentSessionId(null); // Reset session
      }).catch(err => console.error('Failed to update session:', err));
    }
  }, [showFinalQuiz, currentSessionId, videoDuration]);

  useEffect(() => {
    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
    };
  }, []);

  const handleYoutubeSubmit = async () => {
    setIsProcessing(true);
    setTranscript(null);
    setQuizData(null);
    setShowFinalQuiz(false);
    setSessionQuizCompleted(false);

    try {
      const result = await parseYouTubeUrl(ytInput);
      if (result.videoId) {
        setVideoUrl(null);
        if (result.provider === 'vimeo') {
          setVimeoId(result.videoId);
          setYoutubeId(null);
        } else {
          setYoutubeId(result.videoId);
          setVimeoId(null);
        }

        console.log(`Buscando legendas do YouTube para ${result.provider || 'video'}...`);

        // Get captions from YouTube (required for YouTube videos)
        let transcriptResult: TranscriptResponse;
        if (result.provider === 'youtube' && result.videoId) {
          try {
            const captions = await getYouTubeCaptions(result.videoId);
            transcriptResult = captionsToTranscript(captions);
            console.log('Legendas obtidas com sucesso:', transcriptResult.language);
          } catch (captionsError) {
            console.error('Legendas não disponíveis:', captionsError);
            setConfigError({ code: 155, message: "Este vídeo não possui legendas disponíveis." });
            setIsProcessing(false);
            return;
          }
        } else {
          // For non-YouTube providers, show error (they need local upload)
          setConfigError({ code: 156, message: "Para vídeos sem legendas, faça upload do arquivo." });
          setIsProcessing(false);
          return;
        }
        setTranscript(transcriptResult);
        // Note: isVideoPlaying is now synced automatically via useYouTubePlayer hook

        // Generate Quiz from real transcript
        const quizResult = await generateQuiz(transcriptResult.transcript);
        setQuizData(quizResult);

      } else {
        setConfigError({ code: 153, message: "URL inválida ou fonte não suportada." });
      }
    } catch (error) {
      console.error("Erro Video URL:", error);
      setConfigError({ code: 153, message: "Erro ao carregar vídeo externo." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setYoutubeId(null);
      setVideoUrl(URL.createObjectURL(file));
      setIsProcessing(true);
      setConfigError(null);
      setTranscript(null);
      setTranscript(null);
      setShowFinalQuiz(false);
      setSessionQuizCompleted(false);

      try {
        // 1. Transcribe Video
        const transcriptResult = await transcribeVideo(file);
        setTranscript(transcriptResult);

        // 2. Generate Quiz (in background or wait)
        const quizResult = await generateQuiz(transcriptResult.transcript);
        setQuizData(quizResult);

      } catch (error) {
        console.error("Erro no processamento detalhado:", error);
        setConfigError({ code: 154, message: "Erro ao processar vídeo: Falha na transcrição." });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);

      // Store duration
      if (videoRef.current.duration && videoDuration !== videoRef.current.duration) {
        setVideoDuration(videoRef.current.duration);
      }

      // Checkpoint triggering is now handled by useVideoCheckpoints hook
      // When currentCheckpoint is set by the hook, we pause the video
      if (currentCheckpoint && !videoRef.current.paused) {
        videoRef.current.pause();
      }

      // Check for video end to show quiz
      if (videoRef.current.duration && time >= videoRef.current.duration - 0.5 && !showFinalQuiz) {
        setShowFinalQuiz(true);
      }
    }
  };

  // Handle checkpoint answer completion
  const handleCheckpointComplete = async (correct: boolean) => {
    if (correct) {
      // Bonus XP for correct checkpoint answer
      setStudent(prev => ({ ...prev, xp: prev.xp + 10 }));
    }
    // Resume video playback
    if (videoRef.current) {
      videoRef.current.play();
    }
    // For YouTube, we need to resume via the player API
    // This is handled elsewhere for YT
  };

  // Auto-load checkpoints when transcript becomes available
  useEffect(() => {
    if (transcript && videoDuration > 0 && checkpoints.length === 0 && !checkpointsLoading) {
      console.log('[App] Loading AI checkpoints from transcript...');
      loadAICheckpoints(transcript.transcript, videoDuration);
    }
  }, [transcript, videoDuration, checkpoints.length, checkpointsLoading, loadAICheckpoints]);

  const handleQuizComplete = async (score: number, _totalPoints: number) => {
    // 1. Update local state
    setStudent(prev => {
      const newXP = prev.xp + score;
      const newLevel = Math.floor(newXP / 100) + 1;
      return { ...prev, xp: newXP, level: newLevel };
    });
    setSessionQuizCompleted(true);

    // 2. Persist to Backend
    if (dbStudent && currentSessionId) {
      try {
        // Update session with score
        await studentProgressService.updateVideoSession(currentSessionId, {
          score: score,
          completed_at: new Date().toISOString() // Ensure it's marked complete
        });

        // Add XP to student profile
        await studentProgressService.addXP(dbStudent.id, score);
        console.log('Quiz data persisted successfully');
      } catch (error) {
        console.error('Failed to persist quiz results:', error);
      }
    }
  };

  // Trail video player handler
  const handlePlayTrailVideo = (video: TrailVideo, trailId: string) => {
    setSelectedTrailId(trailId);
    setCurrentTrailVideoId(video.id);

    setSessionQuizCompleted(false);

    if (video.video_provider === 'youtube' && video.video_id) {
      setYoutubeId(video.video_id);
      setVimeoId(null);
      setVideoUrl(null);
    } else if (video.video_provider === 'vimeo' && video.video_id) {
      setVimeoId(video.video_id);
      setYoutubeId(null);
      setVideoUrl(null);
    } else {
      setVideoUrl(video.video_url);
      setYoutubeId(null);
      setVimeoId(null);
    }

    // Switch to student view to play
    setView('student');

    // Try to load captions if it's a YouTube video
    if (video.video_provider === 'youtube' && video.video_id) {
      getYouTubeCaptions(video.video_id)
        .then(captions => {
          setTranscript(captionsToTranscript(captions));
          return generateQuiz(captions.transcript);
        })
        .then(setQuizData)
        .catch(err => console.warn('Captions not available:', err));
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show login view
  if (view === 'login') {
    return <LoginView onBack={() => setView('home')} pendingDestination={pendingDestination} />;
  }

  if (view === 'history') {
    return <HistoryView onBack={() => setView('home')} />;
  }

  if (view === 'home') {
    return <Home onSelectRole={(role) => {
      // Check if user is authenticated before proceeding
      if (!user) {
        setPendingDestination(role);
        setView('login');
        return;
      }

      if (role === 'trails') {
        setView('trails');
      } else if (role === 'verification') {
        setView('verification');
      } else {
        setView('student');
      }
    }} />;
  }

  if (view === 'verification') {
    return <VerificationPage onBack={() => setView('home')} />;
  }

  if (view === 'trails') {
    return (
      <TrailsView
        onSelectTrail={(trailId) => {
          setSelectedTrailId(trailId);
          setView('trail-detail');
        }}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'trail-detail' && selectedTrailId) {
    return (
      <TrailDetailView
        trailId={selectedTrailId}
        onBack={() => setView('trails')}
        onPlayVideo={handlePlayTrailVideo}
      />
    );
  }

  if (view === 'certificates') {
    return <CertificatesView onBack={() => setView('home')} />;
  }

  if (view === 'stats') {
    return <StatsView onBack={() => setView('home')} />;
  }

  if (view === 'student') return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white">
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
            <span className="text-lg font-black text-white italic tracking-tighter">YOUEDU</span>
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
          {user ? (
            <UserMenu onNavigate={(page) => setView(page)} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse" />
          )}
        </div>
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">

            {/* Left Column: Video Player */}
            <div className="lg:col-span-2 space-y-6">
              {(!videoUrl && !youtubeId) ? (
                <div className="aspect-video glass rounded-3xl flex flex-col items-center justify-center border border-slate-800/50 p-12 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />

                  {/* Icon Circle */}
                  <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border-[3px] border-blue-500/30 shadow-xl shadow-blue-500/20 z-10">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  <h2 className="text-5xl font-black text-white mb-4 italic tracking-tight z-10">
                    VAMOS COMEÇAR?
                  </h2>

                  <p className="text-slate-400 mb-10 max-w-md z-10 text-lg">
                    Prepare sua aula interativa enviando um arquivo ou usando um link do YouTube.
                  </p>

                  <div className="flex items-center gap-3 w-full max-w-lg mb-8 z-10">
                    <input
                      type="text"
                      value={ytInput}
                      onChange={(e) => setYtInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                      placeholder="Link do YouTube..."
                      className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                    />
                    <button
                      onClick={handleYoutubeSubmit}
                      disabled={isProcessing || !ytInput.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wide shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processando...
                        </div>
                      ) : (
                        'ANALISAR'
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 w-full max-w-lg mb-8 z-10">
                    <div className="flex-1 h-px bg-slate-700/50" />
                    <span className="text-slate-500 text-sm font-medium uppercase tracking-widest">ou</span>
                    <div className="flex-1 h-px bg-slate-700/50" />
                  </div>

                  <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" id="video-upload" />
                  <label
                    htmlFor="video-upload"
                    className="w-full max-w-lg bg-slate-800/80 hover:bg-slate-700 text-white font-bold py-5 rounded-xl cursor-pointer transition-all border border-slate-700/50 hover:border-slate-600 uppercase text-sm tracking-wide flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-slate-900/50 z-10"
                  >
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    ENVIAR ARQUIVO LOCAL
                  </label>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-800 ring-1 ring-slate-800/50 group">
                    {videoUrl ? (
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                        controls
                        className="w-full h-full object-contain"
                        autoPlay
                      />
                    ) : youtubeId ? (
                      <div
                        ref={ytPlayerRef}
                        className="w-full h-full"
                      />
                    ) : vimeoId ? (
                      <div className="w-full h-full bg-black">
                        <iframe
                          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : null}
                    {/* Loading Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
                        <div className="w-24 h-24 relative mb-8">
                          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                        </div>
                        <h4 className="text-3xl font-black text-white mb-2 italic tracking-tighter">GERANDO AULA...</h4>
                        <p className="text-blue-400 font-medium max-w-xs leading-relaxed">
                          Processando transcrição e criando desafios personalizados.
                        </p>
                      </div>
                    )}

                    {/* Final Quiz Overlay */}
                    {showFinalQuiz && quizData && (
                      <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
                        <div className="w-full max-w-4xl h-full overflow-y-auto custom-scrollbar">
                          <FinalQuiz
                            questions={quizData.questions}
                            codingExercises={quizData.codingExercises}
                            onComplete={handleQuizComplete}
                            onClose={() => setShowFinalQuiz(false)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quiz Start Button for YouTube/Vimeo (since iframe doesn't trigger time events) */}
                  {(youtubeId || vimeoId) && quizData && !showFinalQuiz && !sessionQuizCompleted && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-white font-bold">Quiz Pronto!</h4>
                            <p className="text-slate-400 text-sm">
                              {quizData.questions.length} perguntas + {quizData.codingExercises?.length || 0} exercícios
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowFinalQuiz(true)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all uppercase text-sm tracking-wide shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Iniciar Quiz
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Gamification Panel below video */}
                  <GamificationPanel />
                </div>
              )}
            </div>

            {/* Checkpoint Modal - Now works for ALL videos, not just trails */}
            {currentCheckpoint && (
              <CheckpointModal
                checkpoint={currentCheckpoint}
                trailId={selectedTrailId || undefined}
                videoId={youtubeId || currentTrailVideoId || 'video'}
                checkpointIndex={checkpoints.findIndex(c => c.id === currentCheckpoint.id) + 1}
                totalCheckpoints={checkpoints.length}
                onComplete={async (correct) => {
                  await handleCheckpointAnswer(correct ? currentCheckpoint.correct_answer : -1);
                  handleCheckpointComplete(correct);
                }}
                onSkip={async () => {
                  await handleCheckpointSkip();
                  if (videoRef.current) videoRef.current.play();
                }}
                onClose={() => {
                  // The hook handles state, just resume video
                  if (videoRef.current) videoRef.current.play();
                }}
              />
            )}

            {/* Right Column: Transcript / Sidebar */}
            <div className="lg:col-span-1 h-full overflow-hidden">
              {transcript ? (
                <div className="h-full flex flex-col">
                  <TranscriptPanel segments={transcript.segments} currentTime={currentTime} isPlaying={isVideoPlaying} />
                </div>
              ) : (
                <div className="glass h-full rounded-3xl p-8 flex flex-col border border-slate-800/50 items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none" />
                  <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-700/50 transform rotate-3">
                    <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">Transcrição Indisponível</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[240px]">
                    A transcrição sincronizada aparecerá aqui automaticamente quando você iniciar uma aula.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App wrapper with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
