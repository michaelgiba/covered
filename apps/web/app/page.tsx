"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Logo, TopicModal, ScrollingText } from "@/components";
import { Topic, formatTime, useTopics, WEB_API_URL } from "@speed-code/shared";
import { Visualizer } from "@/components/Visualizer";
import { Mail } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useWakeLock } from "@/hooks/useWakeLock";

export default function Home() {
    const { data: topics } = useTopics(WEB_API_URL);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showAllQueue, setShowAllQueue] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [playingTopicId, setPlayingTopicId] = useState<string | null>(null);

    // Keep screen awake when the session has started
    useWakeLock(hasStarted);

    // Keep screen awake when the session has started
    useWakeLock(hasStarted);

    const handleTopicChange = (topicId: string) => {
        setPlayingTopicId(topicId);
    };

    const togglePlay = () => {
        if (!isPlaying) {
            setHasStarted(true);
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleTopicClick = (topic: Topic) => {
        setSelectedTopic(topic);
    };

    // Determine active ID: what's actually playing (from HLS metadata)
    const activeId = playingTopicId;

    // Filter topics for queue
    const queue = topics?.filter(t => t.status === 'pending' && t.id !== activeId) || [];
    const displayQueue = showAllQueue ? queue : queue.slice(0, 1);

    // Construct current topic object for modal if needed
    const currentTopic = topics?.find(t => t.id === activeId) || null;

    return (
        <main className="flex min-h-screen flex-col items-center justify-start pt-32 md:pt-24 p-6 bg-[#F5F5F7] text-stone-900 font-sans relative overflow-hidden">
            {/* Background Gradient Blob */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-orange-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

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
                        isPlaying={isPlaying}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                        onTopicChange={handleTopicChange}
                    />

                    {/* Start Overlay */}
                    {!hasStarted && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <button
                                onClick={togglePlay}
                                className="px-8 py-3 bg-stone-900 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-xl"
                            >
                                Tune In
                            </button>
                        </div>
                    )}

                    {/* Integrated Live Card (Moved Below) */}
                    <div
                        onClick={() => currentTopic && handleTopicClick(currentTopic)}
                        className={`mt-8 flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-stone-200 shadow-sm transition-all duration-500 cursor-pointer hover:bg-white/80 hover:scale-[1.02] ${!hasStarted ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Live</span>
                        </div>
                        <div className="w-px h-4 bg-stone-300"></div>
                        <div className="relative overflow-hidden min-w-[100px] max-w-[200px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentTopic?.id || "waiting"}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex flex-col">
                                        <ScrollingText
                                            text={currentTopic?.title || "Waiting..."}
                                            className="text-sm font-medium text-stone-900"
                                        />
                                        {currentTopic && (
                                            <span className="text-[10px] text-stone-500 truncate">
                                                {currentTopic.sender || "Anonymous"}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Queue Card */}
                <div className={`w-full transition-all duration-500 ${!hasStarted ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                    <div className="w-full bg-white/60 rounded-2xl border border-stone-200 p-5 backdrop-blur-md shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Up Next</h2>
                            <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-2 py-1 rounded-full">{queue.length} items</span>
                        </div>

                        <div className="space-y-2">
                            <AnimatePresence initial={false} mode="popLayout">
                                {displayQueue.map((topic, index) => (
                                    <motion.div
                                        key={topic.id}
                                        onClick={() => handleTopicClick(topic)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:bg-white group ${index === 0
                                            ? 'bg-white border-purple-300 shadow-sm'
                                            : 'bg-white/50 border-stone-100 hover:border-purple-200'
                                            }`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10, transition: { duration: 0.2 } }}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded-full ${index === 0 ? 'bg-purple-100 text-purple-600' : 'bg-stone-100 text-stone-400'}`}>
                                                <Mail size={16} />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={`text-sm font-medium truncate transition-colors ${index === 0 ? 'text-purple-900' : 'text-stone-700 group-hover:text-purple-700'}`}>
                                                    {topic.title}
                                                </span>
                                                <span className="text-[10px] text-stone-400 truncate">
                                                    {topic.sender || "Anonymous"}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-medium text-stone-400 whitespace-nowrap ml-2">
                                            {formatTime(topic.timestamp)}
                                        </span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {queue.length === 0 && (
                                <div className="text-center text-stone-400 text-xs py-4">
                                    There is nothing in the queue!<br /> <br />
                                    <a href="mailto:coveredappinbox@gmail.com" className="ext-stone-700 font-medium hover:underline">Email coveredappinbox@gmail.com to add</a>
                                </div>
                            )}
                        </div>

                        {queue.length > 1 && (
                            <button
                                onClick={() => setShowAllQueue(!showAllQueue)}
                                className="w-full mt-3 py-2 text-[10px] font-semibold text-stone-500 hover:text-purple-600 transition-colors border-t border-stone-100"
                            >
                                {showAllQueue ? "Collapse" : `+ ${queue.length - 1} more`}
                            </button>
                        )}


                    </div>
                </div>

            </div>

            <TopicModal
                topic={selectedTopic}
                onClose={() => setSelectedTopic(null)}
            />
        </main>
    );
}
