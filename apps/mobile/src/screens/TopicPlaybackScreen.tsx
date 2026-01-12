import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Platform,
    TouchableOpacity,
} from "react-native";
import { Visualizer, ScrollingText, TranscriptCard, PlaybackControls } from "../components/";
import { useAudio } from "../contexts/AudioContext";
import { useNavigation } from "../contexts/NavigationContext";
import { usePlaybackManager } from "../contexts/PlaybackManagerContext";
import { ChevronDown } from "@tamagui/lucide-icons";

export const TopicPlaybackScreen = () => {
    const {
        isPlaying,
        isMuted,
        togglePlay,
        toggleMute,
        currentTopic,
        seekBy,
        player,
    } = useAudio();
    const { navigateTo } = useNavigation();
    const { playNextTopic, playPrevTopic } = usePlaybackManager();

    const [showTranscript, setShowTranscript] = useState(false);

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
                {/* Top Section - Visualizer or Transcript (fixed height area) */}
                <View style={styles.topSection}>
                    {showTranscript ? (
                        <TranscriptCard
                            topic={currentTopic}
                            onPress={() => setShowTranscript(false)}
                            isPlaying={isPlaying}
                            isMuted={isMuted}
                            player={player}
                        />
                    ) : (
                        <TouchableOpacity
                            style={styles.visualizerTouchable}
                            onPress={() => setShowTranscript(true)}
                            activeOpacity={1}
                        >
                            <Visualizer
                                isPlaying={isPlaying}
                                isMuted={isMuted}
                                onToggleMute={() => { }}
                                player={player}
                            />
                            {/* Metadata */}
                            <View style={styles.metadataContainer}>
                                <ScrollingText
                                    text={currentTopic?.processed_input.title || ""}
                                    className="text-2xl font-bold text-stone-900 mb-2"
                                />
                                <Text style={styles.topicSender}>
                                    {currentTopic?.processed_input.sender}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Controls */}
                <PlaybackControls
                    isPlaying={isPlaying}
                    isMuted={isMuted}
                    onTogglePlay={togglePlay}
                    onToggleMute={toggleMute}
                    onSeekBy={seekBy}
                    onPlayNext={playNextTopic}
                    onPlayPrev={playPrevTopic}
                />
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
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        justifyContent: "flex-start",
        alignItems: "center",
    },
    topSection: {
        width: "100%",
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        marginBottom: 20,
    },
    visualizerTouchable: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
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
});
