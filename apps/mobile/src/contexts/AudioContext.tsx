import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { AudioContextType, Topic } from "@speed-code/shared";

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
    const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);

    // Derived stream URL
    const streamUrl = currentTopic?.playback_content
        ? currentTopic.playback_content.m4a_file_url
        : "";

    const player = useAudioPlayer(streamUrl, {
        updateInterval: 1000,
        // downloadFirst: true, // Removing this to allow streaming immediately
    });

    // Auto-play when streamUrl changes to a valid URL
    useEffect(() => {
        if (streamUrl && player) {
            player.play();
        }
    }, [streamUrl, player]);

    const [isMuted, setIsMuted] = useState(false);

    // Sync mute state with player
    useEffect(() => {
        if (player) {
            player.muted = isMuted;
        }
    }, [player, isMuted]);

    const status = useAudioPlayerStatus(player);
    const onPlaybackFinishedRef = useRef<(() => void) | null>(null);

    const isPlaying = status.playing;
    const currentTime = status.currentTime;
    const duration = status.duration;

    useEffect(() => {
        // Only trigger finish if we have a valid duration and we are actually at the end
        // checking duration > 0 prevents firing on initial load
        const isFinished = status.didJustFinish ||
            status.playbackState === "finished" ||
            (status.duration > 0 && status.currentTime >= status.duration);

        if (isFinished) {
            if (onPlaybackFinishedRef.current) {
                onPlaybackFinishedRef.current();
            }
        }
    }, [status]);

    const setOnPlaybackFinished = (callback: () => void) => {
        onPlaybackFinishedRef.current = callback;
    };

    const togglePlay = () => {
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const startPlayingAudioForTopic = (topic: Topic) => {
        if (topic.id === currentTopic?.id) {
            return;
        } else {
            setCurrentTopic(topic);
            // player.play() is handled by the useEffect when streamUrl changes
        }
    };

    const value = {
        isPlaying,
        isMuted,
        currentTime,
        duration,
        togglePlay,
        toggleMute,
        startPlayingAudioForTopic,
        currentTopic,
        seekBy: (seconds: number) => {
            if (player) {
                player.seekTo(player.currentTime + seconds);
            }
        },
        setOnPlaybackFinished,
        player, // Expose player for visualizer
    };

    return (
        <AudioContext.Provider value={value as any}>{children}</AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
};
