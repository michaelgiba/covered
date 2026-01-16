import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Platform,
    TouchableOpacity,
} from "react-native";
import { Visualizer, ScrollingText, SourceCard, TranscriptCard, PlaybackControls } from "../components/";
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

    const [viewMode, setViewMode] = useState<'visualize' | 'read' | 'source'>('visualize');

    const renderContent = () => {
        switch (viewMode) {
            case 'read':
                return (
                    <TranscriptCard
                        topic={currentTopic}
                        player={player}
                    />
                );
            case 'source':
                return (
                    <SourceCard
                        topic={currentTopic}
                        isPlaying={isPlaying}
                        isMuted={isMuted}
                        player={player}
                    />
                );
            case 'visualize':
            default:
                return (
                    <View
                        style={styles.visualizerTouchable}
                    >
                        <Visualizer
                            isPlaying={isPlaying}
                            isMuted={isMuted}
                            onToggleMute={() => { }}
                            player={player}
                        />
                    </View>
                );
        }
    };

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
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Now Playing</Text>
                </View>
            </View>

            <View style={styles.content}>
                {/* Topic Title */}
                <View style={styles.titleContainer}>
                    <Text
                        style={styles.topicTitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {currentTopic?.processed_input.title || ""}
                    </Text>
                </View>

                {/* Top Section - Visualizer or Transcript (fixed height area) */}
                <View style={styles.topSection}>
                    {renderContent()}
                </View>

                {/* View Toggles */}
                <View style={styles.toggleContainer}>
                    {(['visualize', 'read', 'source'] as const).map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[
                                styles.toggleChip,
                                viewMode === mode && styles.toggleChipActive,
                            ]}
                            onPress={() => setViewMode(mode)}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    viewMode === mode && styles.toggleTextActive,
                                ]}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: {
        padding: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#e7e5e4',
        borderRadius: 25,
        padding: 6,
        gap: 6,
        alignSelf: 'center', // Center it horizontally
        marginBottom: 20,
    },
    toggleChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    toggleChipActive: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#78716c",
    },
    toggleTextActive: {
        color: "#1c1917",
        fontWeight: "600",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 0,
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
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 44, // Balance the back button width to center the text
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c1917',
    },
    titleContainer: {
        width: '100%',
        marginBottom: 10,
        alignItems: 'center',
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    topicTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1c1917',
        textAlign: 'center',
    },
});
