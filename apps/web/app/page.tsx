"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Logo, TopicModal, ScrollingText, TopicList, PlaybackBar } from "@/components";
import { Topic, formatTime, useTopics, WEB_API_URL } from "@speed-code/shared";
import { Visualizer } from "@/components/Visualizer";
import { Mail, Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useAudio } from "@/context/AudioContext";

export default function Home() {
    const {
        initAudio,
        analyser,
        currentTopic,
        isPlaying,
        isMuted,
        togglePlay,
        toggleMute,
        playTopic,
        seekBy,
    } = useAudio();

    const { data: rawTopics } = useTopics(WEB_API_URL);

    // Deduplicate topics
    const topics = rawTopics?.filter((topic, index, self) =>
        index === self.findIndex((t) => t.id === topic.id)
    );

    const [hasStarted, setHasStarted] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

    // Keep screen awake when the session has started
    useWakeLock(hasStarted);

    // Calculate queue
    const queue = topics?.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || "")) || [];

    const handleTogglePlay = () => {
        if (!hasStarted) {
            setHasStarted(true);
        }
        togglePlay();
    };

    const handleTopicClick = (topic: Topic) => {
        setSelectedTopic(topic);
    };

    const handlePlayTopic = (topic: Topic) => {
        if (!hasStarted) {
            setHasStarted(true);
        }
        playTopic(topic);
    };


    return (
        <main className="flex min-h-screen flex-col items-center justify-start pt-32 md:pt-24 p-6 pb-32 bg-[#F5F5F7] text-stone-900 font-sans relative overflow-hidden">
            {/* Header Logo */}
            <div className="absolute top-6 left-6 flex items-center gap-3 font-bold text-xl tracking-tighter text-stone-900 z-20">
                <Logo />
                Covered
            </div>

            {/* Email Banner */}
            <a
                href="mailto:coveredappinbox@gmail.com"
                className="absolute top-20 md:top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/50 backdrop-blur-md rounded-full border border-stone-200 shadow-sm text-xs text-stone-500 z-20 hover:bg-white/80 transition-colors cursor-pointer whitespace-nowrap"
            >
                Email <span className="text-stone-700 font-medium">coveredappinbox@gmail.com</span> with topics you'd like covered
            </a>

            <div className="flex flex-col items-center justify-center w-full max-w-xl gap-8 z-10">

                {/* Visualizer & Active Segment */}
                <div className="flex flex-col items-center w-full relative">

                    <Visualizer
                        analyser={analyser as any}
                        initAudio={initAudio || (() => { })}
                        isPlaying={isPlaying}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                    />

                    {/* Start Overlay */}
                    {!hasStarted && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <button
                                onClick={handleTogglePlay}
                                className="px-8 py-3 bg-stone-900 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-xl"
                            >
                                Tune In
                            </button>
                        </div>
                    )}

                </div>

                {/* Topic List */}
                <TopicList
                    queue={queue}
                    currentTopic={currentTopic}
                    hasStarted={hasStarted}
                    onTopicClick={handlePlayTopic}
                    onInfoClick={handleTopicClick}
                />

            </div>

            <PlaybackBar
                isPlaying={isPlaying}
                isMuted={isMuted}
                currentTopic={currentTopic}
                onTogglePlay={handleTogglePlay}
                onToggleMute={toggleMute}
                onSeekBy={seekBy}
            />

            <TopicModal
                topic={selectedTopic}
                onClose={() => setSelectedTopic(null)}
            />
        </main >
    );
}
