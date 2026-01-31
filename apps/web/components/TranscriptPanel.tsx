import React, { useEffect, useRef } from 'react';

interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
}

interface TranscriptPanelProps {
    segments: TranscriptSegment[];
    currentTime: number;
    isPlaying?: boolean;  // Controls whether auto-scroll is active
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ segments, currentTime, isPlaying = true }) => {
    const activeSegmentRef = useRef<HTMLDivElement>(null);
    const lastActiveIndex = useRef<number>(-1);

    // Find current active segment
    const activeIndex = segments.findIndex(
        seg => currentTime >= seg.start && currentTime < seg.end
    );

    // Auto-scroll to active segment only when playing and segment changes
    useEffect(() => {
        if (isPlaying && activeSegmentRef.current && activeIndex !== lastActiveIndex.current) {
            activeSegmentRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            lastActiveIndex.current = activeIndex;
        }
    }, [activeIndex, isPlaying]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass rounded-2xl p-6 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Transcrição do Vídeo</h3>
                    <p className="text-xs text-slate-400">Acompanhe o conteúdo em texto</p>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {segments.map((segment, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <div
                            key={index}
                            ref={isActive ? activeSegmentRef : null}
                            className={`p-3 rounded-lg transition-all duration-300 ${isActive
                                ? 'bg-blue-500/20 border-l-4 border-blue-500 scale-105'
                                : 'bg-slate-900/50 border-l-4 border-transparent hover:bg-slate-800/50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`text-xs font-mono shrink-0 ${isActive ? 'text-blue-400 font-bold' : 'text-slate-500'
                                    }`}>
                                    {formatTime(segment.start)}
                                </span>
                                <p className={`text-sm leading-relaxed ${isActive ? 'text-white font-medium' : 'text-slate-300'
                                    }`}>
                                    {segment.text}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {segments.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Nenhuma transcrição disponível</p>
                </div>
            )}
        </div>
    );
};

export default TranscriptPanel;
