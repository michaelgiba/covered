import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useAudioPlayer, useAudioPlayerStatus, AudioPlayer, AudioStatus } from "expo-audio";
import { Topic, useTopics, MOBILE_API_URL } from "@speed-code/shared";

interface AudioContextType {
    player: AudioPlayer;
    status: AudioStatus;
    isPlaying: boolean;
    isMuted: boolean;
    currentTime: number;
    duration: number;
    togglePlay: () => void;
    toggleMute: () => void;
    playTopic: (topicId: string) => void;
    currentTopic: Topic | null;
    queue: Topic[];
    topics: Topic[] | undefined;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
    const { data: topics } = useTopics(MOBILE_API_URL);
    const [playedTopicIds, setPlayedTopicIds] = useState<Set<string>>(new Set());
    const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);

    // Derived current topic
    const currentTopic = useMemo(() =>
        topics?.find(t => t.id === currentTopicId) || null
        , [topics, currentTopicId]);

    // Derived stream URL
    const streamUrl = currentTopic?.playback_content_id
        ? `${MOBILE_API_URL}/playback_content/${currentTopic.playback_content_id}.m4a`
        : "";

    const player = useAudioPlayer(streamUrl, {
        updateInterval: 1000,
        downloadFirst: true,
    });
    console.log("PLAYING?", streamUrl, player);

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
    // const isMuted = status.mute; // Don't use status.mute directly as it might be async/unreliable across player resets
    const currentTime = status.currentTime;
    const duration = status.duration;

    const togglePlay = () => {
        if (currentTopicId) {
            if (isPlaying) {
                player.pause();
            } else {
                player.play();
            }
        } else {
            // If no topic is selected, try to play the first one from the queue
            // We need to recalculate the queue here or access the memoized one?
            // Accessing memoized queue is fine.
            if (queue.length > 0) {
                playTopic(queue[0].id);
            }
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const playTopic = (topicId: string) => {
        if (topicId === currentTopicId) {
            // Toggle play if same topic
            togglePlay();
            return;
        }

        // Mark previous as played? 
        if (currentTopicId) {
            setPlayedTopicIds(prev => {
                const newSet = new Set(prev);
                newSet.add(currentTopicId);
                return newSet;
            });
        }

        setCurrentTopicId(topicId);
    };

    // Queue is unplayed topics excluding current
    const queue = useMemo(() => {
        if (!topics) return [];
        const sorted = [...topics].sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));
        return sorted.filter(t => t.playback_content_id && !playedTopicIds.has(t.id) && t.id !== currentTopicId);
    }, [topics, playedTopicIds, currentTopicId]);

    const value = {
        player,
        status,
        isPlaying,
        isMuted,
        currentTime,
        duration,
        togglePlay,
        toggleMute,
        playTopic,
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
