import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
        downloadFirst: true,
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

    const isPlaying = status.playing;
    const currentTime = status.currentTime;
    const duration = status.duration;

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

    const playTopic = (topic: Topic) => {
        if (topic.id === currentTopic?.id) {
            togglePlay();
            return;
        } else {
            setCurrentTopic(topic);
            player?.play();
        }
    };

    const value = {
        isPlaying,
        isMuted,
        currentTime,
        duration,
        togglePlay,
        toggleMute,
        playTopic,
        currentTopic,
        seekBy: (seconds: number) => {
            if (player) {
                player.seekTo(player.currentTime + seconds);
            }
        },
    };

    return (
        <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
};
