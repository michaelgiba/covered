import React from "react";
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
} from "react-native";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, SkipBack, SkipForward } from "@tamagui/lucide-icons";

interface PlaybackControlsProps {
    isPlaying: boolean;
    isMuted: boolean;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onSeekBy: (seconds: number) => void;
    onPlayNext: () => void;
    onPlayPrev: () => void;
    isExpanded: boolean;
}

export const PlaybackControls = ({
    isPlaying,
    isMuted,
    onTogglePlay,
    onToggleMute,
    onSeekBy,
    onPlayNext,
    onPlayPrev,
    isExpanded,
}: PlaybackControlsProps) => {
    // Scale factor for compressed state
    const scale = isExpanded ? 1 : 0.6;
    const playButtonSize = isExpanded ? 80 : 50;

    return (
        <View style={styles.container}>
            <View style={[styles.mainControlsRow, isExpanded && styles.mainControlsRowExpanded]}>
                <TouchableOpacity onPress={onPlayPrev} style={[styles.controlButton, !isExpanded && { transform: [{ scale }] }]}>
                    <SkipBack size={32} color="#1c1917" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onTogglePlay}
                    style={[
                        styles.playPauseButton,
                        {
                            width: playButtonSize,
                            height: playButtonSize,
                            borderRadius: playButtonSize / 2,
                        }
                    ]}
                >
                    {isPlaying ? (
                        <Pause size={isExpanded ? 40 : 24} color="white" />
                    ) : (
                        <Play size={isExpanded ? 40 : 24} color="white" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={onPlayNext} style={[styles.controlButton, !isExpanded && { transform: [{ scale }] }]}>
                    <SkipForward size={32} color="#1c1917" />
                </TouchableOpacity>
            </View>

            {isExpanded && (
                <View style={styles.secondaryControlsRow}>
                    <TouchableOpacity onPress={() => onSeekBy(-15)} style={styles.secondaryControlButton}>
                        <RotateCcw size={20} color="#78716c" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onToggleMute} style={styles.muteButton}>
                        {isMuted ? (
                            <VolumeX size={24} color="#78716c" />
                        ) : (
                            <Volume2 size={24} color="#78716c" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => onSeekBy(30)} style={styles.secondaryControlButton}>
                        <RotateCw size={20} color="#78716c" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        alignItems: "center",
        gap: 15,
    },
    compressedLabel: { // Removing this style usage but keeping unrelated styles clean
        display: 'none',
    },
    mainControlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center", // Centered when compressed
        gap: 40, // Wider gap when compressed (was 15)
        width: "100%",
    },
    mainControlsRowExpanded: {
        justifyContent: "space-between", // Spread out when expanded
        paddingHorizontal: 40, // Even wider padding
        maxWidth: 400,
        gap: 0,
    },
    secondaryControlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        marginTop: 10,
    },
    controlButton: {
        padding: 12,
    },
    secondaryControlButton: {
        padding: 12,
    },
    muteButton: {
        padding: 12,
        backgroundColor: "rgba(0,0,0,0.05)",
        borderRadius: 25,
    },
    playPauseButton: {
        backgroundColor: "#1c1917",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
});
