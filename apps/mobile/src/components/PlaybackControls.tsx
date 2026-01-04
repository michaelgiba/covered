import React from "react";
import {
    StyleSheet,
    View,
    TouchableOpacity,
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
}

export const PlaybackControls = ({
    isPlaying,
    isMuted,
    onTogglePlay,
    onToggleMute,
    onSeekBy,
    onPlayNext,
    onPlayPrev,
}: PlaybackControlsProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.mainControlsRow}>
                <TouchableOpacity onPress={onPlayPrev} style={styles.controlButton}>
                    <SkipBack size={32} color="#1c1917" />
                </TouchableOpacity>

                <TouchableOpacity onPress={onTogglePlay} style={styles.playPauseButton}>
                    {isPlaying ? (
                        <Pause size={40} color="white" />
                    ) : (
                        <Play size={40} color="white" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={onPlayNext} style={styles.controlButton}>
                    <SkipForward size={32} color="#1c1917" />
                </TouchableOpacity>
            </View>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        alignItems: "center",
        gap: 25,
    },
    mainControlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 20,
        maxWidth: 300,
    },
    secondaryControlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
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
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
});
