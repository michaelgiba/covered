import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { PlaybackManager, Topic } from "@speed-code/shared";
import { useAudio } from "./AudioContext";

const PlaybackManagerContext = createContext<PlaybackManager | undefined>(undefined);

export const PlaybackManagerProvider = ({ children }: { children: ReactNode }) => {
    const { startPlayingAudioForTopic, setOnPlaybackFinished, currentTopic } = useAudio();

    const [queue, setQueueState] = useState<Topic[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [playedTopicIds, setPlayedTopicIds] = useState<Set<string>>(new Set());

    const setQueue = useCallback((topics: Topic[]) => {
        setQueueState(topics);
        if (currentTopic) {
            const index = topics.findIndex(t => t.id === currentTopic.id);
            setCurrentIndex(index);
        } else {
            setCurrentIndex(-1);
        }
    }, [currentTopic]);

    const playTopic = useCallback((topic: Topic) => {
        const index = queue.findIndex(t => t.id === topic.id);
        if (index !== -1) {
            setCurrentIndex(index);
        }
        setPlayedTopicIds((prev) => new Set(prev).add(topic.id));
        startPlayingAudioForTopic(topic);
    }, [queue, startPlayingAudioForTopic]);

    const playNextTopic = useCallback(() => {
        if (currentIndex < queue.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextTopic = queue[nextIndex];
            setCurrentIndex(nextIndex);
            setPlayedTopicIds((prev) => new Set(prev).add(nextTopic.id));
            startPlayingAudioForTopic(nextTopic);
            return nextTopic;
        }
        return null;
    }, [currentIndex, queue, startPlayingAudioForTopic]);

    const playPrevTopic = useCallback(() => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            const prevTopic = queue[prevIndex];
            setCurrentIndex(prevIndex);
            setPlayedTopicIds((prev) => new Set(prev).add(prevTopic.id));
            startPlayingAudioForTopic(prevTopic);
            return prevTopic;
        }
        return null;
    }, [currentIndex, queue, startPlayingAudioForTopic]);

    const isPlayed = useCallback((topic: Topic) => {
        return playedTopicIds.has(topic.id);
    }, [playedTopicIds]);

    const playbackQueue = currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;
    const playedTopics = currentIndex !== -1 ? queue.slice(0, currentIndex) : [];

    useEffect(() => {
        if (setOnPlaybackFinished) {
            setOnPlaybackFinished(playNextTopic);
        }
    }, [setOnPlaybackFinished, playNextTopic]);

    const value: PlaybackManager = {
        playNextTopic,
        playPrevTopic,
        playedTopics,
        playbackQueue,
        setQueue,
        isPlayed,
        playTopic,
    };

    return (
        <PlaybackManagerContext.Provider value={value}>
            {children}
        </PlaybackManagerContext.Provider>
    );
};

export const usePlaybackManager = () => {
    const context = useContext(PlaybackManagerContext);
    if (context === undefined) {
        throw new Error("usePlaybackManager must be used within a PlaybackManagerProvider");
    }
    return context;
};
