import React from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Platform,
    TouchableOpacity,
} from "react-native";
import { Visualizer, ScrollingText } from "../components/";
import { useAudio } from "../contexts/AudioContext";
import { useNavigation } from "../contexts/NavigationContext";
import { usePlaybackManager } from "../contexts/PlaybackManagerContext";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, ChevronDown, SkipBack, SkipForward } from "@tamagui/lucide-icons";

export const TopicPlaybackScreen = () => {
    const {
        isPlaying,
        isMuted,
        togglePlay,
        toggleMute,
        currentTopic,
        seekBy,
        // @ts-expect-error player is not in shared type
        player,
    } = useAudio();
    const { navigateTo } = useNavigation();
    const { playNextTopic, playPrevTopic } = usePlaybackManager();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigateTo("Home")}
                    style={styles.backButton}
                >
                    <ChevronDown size={28} color="#1c1917" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Now Playing</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                {/* Visualizer */}
                <View style={styles.visualizerWrapper}>
                    <Visualizer
                        isPlaying={isPlaying}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                        player={player}
                    />
                </View>

                {/* Playback Controls */}
                <View style={styles.playbackCard}>
                    {/* Metadata */}
                    <View style={styles.metadataContainer}>
                        <ScrollingText
                            text={currentTopic?.title || ""}
                            className="text-2xl font-bold text-stone-900 mb-2"
                        />
                        <Text style={styles.topicSender}>
                            {currentTopic?.sender}
                        </Text>
                    </View>

                    {/* Controls */}
                    <View style={styles.controlsContainer}>
                        <View style={styles.mainControlsRow}>
                            <TouchableOpacity onPress={playPrevTopic} style={styles.controlButton}>
                                <SkipBack size={32} color="#1c1917" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={togglePlay} style={styles.playPauseButton}>
                                {isPlaying ? (
                                    <Pause size={40} color="white" />
                                ) : (
                                    <Play size={40} color="white" />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={playNextTopic} style={styles.controlButton}>
                                <SkipForward size={32} color="#1c1917" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.secondaryControlsRow}>
                            <TouchableOpacity onPress={() => seekBy(-15)} style={styles.secondaryControlButton}>
                                <RotateCcw size={20} color="#78716c" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                                {isMuted ? (
                                    <VolumeX size={24} color="#78716c" />
                                ) : (
                                    <Volume2 size={24} color="#78716c" />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => seekBy(30)} style={styles.secondaryControlButton}>
                                <RotateCw size={20} color="#78716c" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F7",
        paddingTop: Platform.OS === "android" ? 40 : 0,
    },
    header: {
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1c1917",
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: "space-evenly",
        alignItems: "center",
    },
    visualizerWrapper: {
        width: "100%",
        alignItems: "center",
        height: 250,
        justifyContent: "center",
    },
    playbackCard: {
        width: "100%",
        gap: 40,
        alignItems: "center",
    },
    metadataContainer: {
        alignItems: "center",
        gap: 8,
        width: "100%",
    },
    topicSender: {
        fontSize: 16,
        color: "#78716c",
        fontWeight: "500",
    },
    controlsContainer: {
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
