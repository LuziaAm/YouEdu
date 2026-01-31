/**
 * Custom hook for YouTube IFrame Player API integration
 * Provides real-time tracking of video state (playing, paused, currentTime)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Declare YouTube API types
declare global {
    interface Window {
        YT: typeof YT;
        onYouTubeIframeAPIReady: () => void;
    }
}

declare namespace YT {
    class Player {
        constructor(elementId: string | HTMLElement, options: PlayerOptions);
        playVideo(): void;
        pauseVideo(): void;
        getCurrentTime(): number;
        getDuration(): number;
        getPlayerState(): number;
        destroy(): void;
    }

    interface PlayerOptions {
        videoId?: string;
        playerVars?: PlayerVars;
        events?: PlayerEvents;
    }

    interface PlayerVars {
        autoplay?: 0 | 1;
        controls?: 0 | 1;
        enablejsapi?: 0 | 1;
        origin?: string;
        rel?: 0 | 1;
    }

    interface PlayerEvents {
        onReady?: (event: { target: Player }) => void;
        onStateChange?: (event: { data: number; target: Player }) => void;
        onError?: (event: { data: number }) => void;
    }

    const PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
    };
}

interface UseYouTubePlayerResult {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isReady: boolean;
    playerRef: React.RefObject<HTMLDivElement>;
}

// Load YouTube IFrame API script
let isApiLoaded = false;
let apiLoadPromise: Promise<void> | null = null;

const loadYouTubeApi = (): Promise<void> => {
    if (isApiLoaded) return Promise.resolve();
    if (apiLoadPromise) return apiLoadPromise;

    apiLoadPromise = new Promise((resolve) => {
        // Check if already loaded
        if (window.YT && window.YT.Player) {
            isApiLoaded = true;
            resolve();
            return;
        }

        // Create callback for when API is ready
        window.onYouTubeIframeAPIReady = () => {
            isApiLoaded = true;
            resolve();
        };

        // Load the script
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.body.appendChild(script);
    });

    return apiLoadPromise;
};

export const useYouTubePlayer = (videoId: string | null): UseYouTubePlayerResult => {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const playerRef = useRef<HTMLDivElement>(null);
    const playerInstanceRef = useRef<YT.Player | null>(null);
    const timeIntervalRef = useRef<number | null>(null);

    // Update current time periodically when playing
    const startTimeTracking = useCallback(() => {
        if (timeIntervalRef.current) return;

        timeIntervalRef.current = window.setInterval(() => {
            if (playerInstanceRef.current) {
                try {
                    const time = playerInstanceRef.current.getCurrentTime();
                    setCurrentTime(time);
                } catch {
                    // Player might not be ready
                }
            }
        }, 250); // Update every 250ms for smooth transcript sync
    }, []);

    const stopTimeTracking = useCallback(() => {
        if (timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
            timeIntervalRef.current = null;
        }
    }, []);

    // Handle player state changes
    const onStateChange = useCallback((event: { data: number }) => {
        const state = event.data;

        if (state === 1) { // PLAYING
            setIsPlaying(true);
            startTimeTracking();
        } else if (state === 2) { // PAUSED
            setIsPlaying(false);
            stopTimeTracking();
            // Update time one last time on pause
            if (playerInstanceRef.current) {
                setCurrentTime(playerInstanceRef.current.getCurrentTime());
            }
        } else if (state === 0) { // ENDED
            setIsPlaying(false);
            stopTimeTracking();
        } else if (state === 3) { // BUFFERING
            // Keep current playing state during buffering
        }
    }, [startTimeTracking, stopTimeTracking]);

    // Initialize player when videoId changes
    useEffect(() => {
        if (!videoId || !playerRef.current) return;

        let isMounted = true;

        const initPlayer = async () => {
            await loadYouTubeApi();

            if (!isMounted || !playerRef.current) return;

            // Destroy existing player
            if (playerInstanceRef.current) {
                try {
                    playerInstanceRef.current.destroy();
                } catch {
                    // Ignore destroy errors
                }
                playerInstanceRef.current = null;
            }

            // Create new player
            playerInstanceRef.current = new window.YT.Player(playerRef.current, {
                videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    enablejsapi: 1,
                    origin: window.location.origin,
                    rel: 0
                },
                events: {
                    onReady: (event) => {
                        if (isMounted) {
                            setIsReady(true);
                            setDuration(event.target.getDuration());
                        }
                    },
                    onStateChange: (event) => {
                        if (isMounted) {
                            onStateChange(event);
                        }
                    },
                    onError: (event) => {
                        console.error('YouTube player error:', event.data);
                    }
                }
            });
        };

        initPlayer();

        return () => {
            isMounted = false;
            stopTimeTracking();
            if (playerInstanceRef.current) {
                try {
                    playerInstanceRef.current.destroy();
                } catch {
                    // Ignore destroy errors
                }
                playerInstanceRef.current = null;
            }
            setIsReady(false);
            setIsPlaying(false);
            setCurrentTime(0);
        };
    }, [videoId, onStateChange, stopTimeTracking]);

    return {
        currentTime,
        duration,
        isPlaying,
        isReady,
        playerRef
    };
};

export default useYouTubePlayer;
