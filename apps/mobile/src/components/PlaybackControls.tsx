import React from "react";
import {
    StyleSheet,
    View,
    TouchableOpacity,
} from "react-native";
import { Play, Pause, RotateCcw, RotateCw, SkipBack, SkipForward } from "@tamagui/lucide-icons";

interface PlaybackControlsProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    onSeekBy: (seconds: number) => void;
    onPlayNext: () => void;
    onPlayPrev: () => void;
}

export const PlaybackControls = ({
    isPlaying,
    onTogglePlay,
    onSeekBy,
    onPlayNext,
    onPlayPrev,
}: PlaybackControlsProps) => {
    // Static sizes
    const playButtonSize = 70;
    const iconColor = "#1c1917";
    const seekSize = 24;
    const skipSize = 32;

    return (
        <View style={styles.container}>
            <View style={styles.controlsRow}>
                {/* Seek Back -15s */}
                <TouchableOpacity
                    onPress={() => onSeekBy(-15)}
                    style={styles.controlButton}
                >
                    <RotateCcw size={seekSize} color="#78716c" />
                </TouchableOpacity>

                {/* Prev Topic */}
                <TouchableOpacity
                    onPress={onPlayPrev}
                    style={styles.controlButton}
                >
                    <SkipBack size={skipSize} color={iconColor} />
                </TouchableOpacity>

                {/* Play/Pause */}
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
                        <Pause size={32} color="white" />
                    ) : (
                        <Play size={32} color="white" />
                    )}
                </TouchableOpacity>

                {/* Next Topic */}
                <TouchableOpacity
                    onPress={onPlayNext}
                    style={styles.controlButton}
                >
                    <SkipForward size={skipSize} color={iconColor} />
                </TouchableOpacity>

                {/* Seek Forward +30s */}
                <TouchableOpacity
                    onPress={() => onSeekBy(30)}
                    style={styles.controlButton}
                >
                    <RotateCw size={seekSize} color="#78716c" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        alignItems: "center",
        paddingVertical: 10,
    },
    controlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        width: "100%",
    },
    controlButton: {
        padding: 10,
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
