import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAudioPlayer, useAudioPlayerStatus, AudioPlayer, AudioStatus } from "expo-audio";
import { Topic, useTopics, MOBILE_API_URL } from "@speed-code/shared";

interface AudioContextType {
    player: AudioPlayer;
    status: AudioStatus;
    isPlaying: boolean;
    isMuted: boolean;
    currentTime: number;
    duration: number;
    hasStarted: boolean;
    togglePlay: () => void;
    toggleMute: () => void;
    currentTopic: Topic | null;
    queue: Topic[];
    topics: Topic[] | undefined;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// WARNING: This functionality doesn't ACTUALLY work. 
// The problem is that HLS compatibility for expo is not really that good
// or complicated. We are going to adjust our system architecture to directly
// work with persisted m4a files instead of HLS.
export const AudioProvider = ({ children }: { children: ReactNode }) => {
    const { data: topics } = useTopics(MOBILE_API_URL);
    const [streamUrl, setStreamUrl] = useState<string | null>(null);

    useEffect(() => {
        if (streamUrl) return;

        const checkStream = async () => {
            console.log("checking stream.")
            try {
                const url = `${MOBILE_API_URL}/feed/stream.m3u8`;
                const res = await fetch(url, { method: "HEAD" });
                console.log(res);
                if (res.ok) {
                    setStreamUrl(url);
                    console.log(url);
                }
            } catch (error) {
                console.log(error);
                // Stream not ready yet
            }
        };

        const interval = setInterval(checkStream, 2000);
        checkStream();

        return () => clearInterval(interval);
    }, [streamUrl]);

    const player = useAudioPlayer(streamUrl || "", {
        updateInterval: 1000,
        downloadFirst: true,
    });

    const status = useAudioPlayerStatus(player);

    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (streamUrl && !hasStarted) {
            console.log("starting to play: " + streamUrl);
            player.play();
            console.log(player);
            setHasStarted(true);
        }
    }, [streamUrl, hasStarted, player]);

    const isPlaying = status.playing;
    const isMuted = status.mute;
    const currentTime = status.currentTime;
    const duration = status.duration;

    const togglePlay = () => {
        if (!hasStarted) {
            player.play();
            setHasStarted(true);
        } else {
            if (isPlaying) {
                player.pause();
            } else {
                player.play();
            }
        }
    };

    const toggleMute = () => {
        player.muted = !isMuted;
    };

    const currentTopic = topics?.find((t) => t.status === "active") || null;
    const queue = topics?.filter((t) => t.status === "pending") || [];

    const value = {
        player,
        status,
        isPlaying,
        isMuted,
        currentTime,
        duration,
        hasStarted,
        togglePlay,
        toggleMute,
        currentTopic,
        queue,
        topics,
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
