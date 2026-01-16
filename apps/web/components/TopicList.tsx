import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Info } from "lucide-react";
import { Topic, formatTime } from "@speed-code/shared";
import { usePlaybackManager } from "@/contexts/PlaybackManagerContext";

interface TopicListProps {
    queue: Topic[];
    currentTopic: Topic | null;
    hasStarted: boolean;
    onTopicClick: (topic: Topic) => void;
    onInfoClick: (topic: Topic) => void;
}

export const TopicList = ({ queue, currentTopic, hasStarted, onTopicClick, onInfoClick }: TopicListProps) => {
    const displayQueue = queue;
    const { isPlayed } = usePlaybackManager();

    return (
        <div className={`w-full transition-all duration-500 ${!hasStarted ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
            <div className="w-full bg-white/60 rounded-2xl border border-stone-200 py-5 px-0 backdrop-blur-md shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-3 px-5">
                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Topics</h2>
                    <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-2 py-1 rounded-full">{queue.length} items</span>
                </div>

                <div className="w-full">
                    {/* @ts-expect-error framer-motion types */}
                    <AnimatePresence initial={false} mode="popLayout">
                        {displayQueue.map((topic, index) => {
                            const isReady = !!topic.playback_content;
                            const isPlaying = topic.id === currentTopic?.id;
                            const played = isPlayed(topic);
                            const isUnplayed = !played && !isPlaying;

                            return (
                                // @ts-expect-error framer-motion types
                                <motion.div
                                    key={topic.id}
                                    onClick={() => isReady && onTopicClick(topic)}
                                    className={`flex items-center justify-between p-4 border-b border-stone-100 transition-all group ${isReady
                                        ? 'cursor-pointer hover:bg-white/50'
                                        : 'cursor-default opacity-60 bg-stone-50'
                                        } ${isPlaying
                                            ? 'bg-purple-50/50'
                                            : 'bg-transparent'
                                        }`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10, transition: { duration: 0.2 } }}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${isPlaying ? 'bg-purple-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                            {topic.playback_content?.thumbnail_url ? (
                                                <img
                                                    src={topic.playback_content.thumbnail_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Mail size={16} />
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium truncate transition-colors ${isPlaying ? 'text-purple-900' : 'text-stone-700 group-hover:text-purple-700'}`}>
                                                    {topic.processed_input.title}
                                                </span>
                                                {isUnplayed && isReady && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <span className="text-[10px] text-stone-400 truncate">
                                                {formatTime(topic.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isReady && (
                                            <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                                                Processing
                                            </span>
                                        )}
                                        {isPlaying && (
                                            <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">
                                                Playing
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onInfoClick(topic);
                                            }}
                                            className="p-1 hover:bg-stone-100 rounded-full transition-colors"
                                        >
                                            <Info size={16} className="text-stone-400 hover:text-stone-600" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {queue.length === 0 && (
                        <div className="text-center text-stone-400 text-xs py-4">
                            There is nothing in the queue!<br /> <br />
                            <a href="mailto:coveredappinbox@gmail.com" className="ext-stone-700 font-medium hover:underline">Email coveredappinbox@gmail.com to add</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
