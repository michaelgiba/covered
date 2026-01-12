"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { AudioContextType, Topic } from "@speed-code/shared";

// Extend the shared type to include analyser for internal use in web
interface WebAudioContextType extends AudioContextType {
    analyser?: AnalyserNode | null;
}

const AudioContext = createContext<WebAudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const isInitialized = useRef(false);
    const onPlaybackFinishedRef = useRef<(() => void) | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const setupMediaSession = useCallback((topic?: Topic) => {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: topic?.processed_input.title || "Covered Radio",
                artist: topic?.processed_input.sender || "Covered",
                album: "Daily Briefing",
            });

            navigator.mediaSession.setActionHandler('play', () => {
                if (audioElementRef.current) {
                    audioElementRef.current.play();
                    setIsPlaying(true);
                }
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                if (audioElementRef.current) {
                    audioElementRef.current.pause();
                    setIsPlaying(false);
                }
            });
        }
    }, []);

    const initAudio = useCallback(() => {
        if (isInitialized.current) return;

        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();

        const newAnalyser = ctx.createAnalyser();
        newAnalyser.fftSize = 64;

        const gainNode = ctx.createGain();
        gainNode.gain.value = isMuted ? 0 : 1;

        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audioElementRef.current = audio;

        const source = ctx.createMediaElementSource(audio);
        source.connect(newAnalyser);
        newAnalyser.connect(gainNode);
        gainNode.connect(ctx.destination);

        audioContextRef.current = ctx;
        setAnalyser(newAnalyser);
        gainNodeRef.current = gainNode;
        isInitialized.current = true;

        if (ctx.state === "suspended") ctx.resume();

        // iOS unlock
        const silentBuffer = ctx.createBuffer(1, 1, 22050);
        const silentSource = ctx.createBufferSource();
        silentSource.buffer = silentBuffer;
        silentSource.connect(ctx.destination);
        silentSource.start(0);

        setupMediaSession();

        // Listeners for time update
        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
        });
        audio.addEventListener('durationchange', () => {
            setDuration(audio.duration);
        });

        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            if (onPlaybackFinishedRef.current) {
                onPlaybackFinishedRef.current();
            }
        });

    }, [isMuted, setupMediaSession]);

    // Handle Mute
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isMuted ? 0 : 1;
        }
    }, [isMuted]);

    // Handle Play/Pause
    useEffect(() => {
        if (!audioElementRef.current) return;

        if (isPlaying) {
            if (audioContextRef.current?.state === "suspended") {
                audioContextRef.current.resume();
            }
            const playPromise = audioElementRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log("Play failed:", e);
                });
            }
        } else {
            audioElementRef.current.pause();
        }
    }, [isPlaying, currentTopic]);

    const startPlayingAudioForTopic = useCallback((topic: Topic) => {
        if (!isInitialized.current) initAudio();

        if (topic.id === currentTopic?.id) {
            setIsPlaying(!isPlaying);
            return;
        }

        if (topic && topic.playback_content && audioElementRef.current) {
            const m4aUrl = topic.playback_content.m4a_file_url;
            audioElementRef.current.src = m4aUrl;

            setCurrentTopic(topic);
            setIsPlaying(true);
            setupMediaSession(topic);
        }
    }, [currentTopic, isPlaying, initAudio, setupMediaSession]);

    const togglePlay = useCallback(() => {
        if (!isInitialized.current) initAudio();
        setIsPlaying(!isPlaying);
    }, [isPlaying, initAudio]);

    const toggleMute = useCallback(() => {
        setIsMuted(!isMuted);
    }, [isMuted]);

    const value = {
        isPlaying,
        isMuted,
        currentTime,
        duration,
        togglePlay,
        toggleMute,
        startPlayingAudioForTopic,
        currentTopic,
        initAudio,
        seekBy: (seconds: number) => {
            if (audioElementRef.current) {
                audioElementRef.current.currentTime += seconds;
            }
        },
        setOnPlaybackFinished: (callback: () => void) => {
            onPlaybackFinishedRef.current = callback;
        },
        analyser // Expose analyser for internal use, even if not in shared type
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
};
