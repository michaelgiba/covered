import React from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { ScrollingText } from "./ScrollingText";
import { Topic } from "@speed-code/shared";

interface PlaybackBarProps {
    isPlaying: boolean;
    isMuted: boolean;
    currentTopic: Topic | null;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onSeekBy: (seconds: number) => void;
}

export const PlaybackBar = ({
    isPlaying,
    isMuted,
    currentTopic,
    onTogglePlay,
    onToggleMute,
    onSeekBy,
}: PlaybackBarProps) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50">
            {/* Controls (Left) */}
            <div className="flex items-center gap-4 shrink-0">
                <button
                    onClick={() => onSeekBy(-15)}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors text-stone-600 hover:text-stone-900"
                >
                    <RotateCcw size={20} />
                </button>

                <button
                    onClick={onTogglePlay}
                    className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                >
                    {isPlaying ? (
                        <Pause size={24} className="text-white" />
                    ) : (
                        <Play size={24} className="text-white ml-1" />
                    )}
                </button>

                <button
                    onClick={() => onSeekBy(30)}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors text-stone-600 hover:text-stone-900"
                >
                    <RotateCw size={20} />
                </button>
            </div>

            {/* Metadata (Center - Right of Play) */}
            <div className="flex flex-col flex-1 overflow-hidden px-2">
                <ScrollingText
                    text={currentTopic?.title || "Waiting for content..."}
                    className="text-sm font-bold text-stone-900"
                />
                <span className="text-xs font-medium text-stone-500 truncate">
                    {currentTopic?.sender || "Speed Code"}
                </span>
            </div>

            {/* Volume (Right) */}
            <div className="flex items-center justify-end shrink-0">
                <button
                    onClick={onToggleMute}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors text-stone-500 hover:text-stone-900"
                >
                    {isMuted ? (
                        <VolumeX size={20} />
                    ) : (
                        <Volume2 size={20} />
                    )}
                </button>
            </div>
        </div>
    );
};
