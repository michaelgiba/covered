import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Platform,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
} from "react-native";
import { Visualizer, ScrollingText, TranscriptCard, PlaybackControls, SourceTooltip } from "../components/";
import { useAudio } from "../contexts/AudioContext";
import { useNavigation } from "../contexts/NavigationContext";
import { usePlaybackManager } from "../contexts/PlaybackManagerContext";
import { ChevronDown, Volume2, VolumeX, Info } from "@tamagui/lucide-icons";

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

    const [viewMode, setViewMode] = useState<'visualize' | 'read'>('visualize');
    const [isSourceTooltipVisible, setIsSourceTooltipVisible] = useState(false);

    const renderContent = () => {
        switch (viewMode) {
            case 'read':
                return (
                    <TranscriptCard
                        topic={currentTopic}
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

                {/* Info Button for Source Tooltip */}
                <TouchableOpacity
                    onPress={() => setIsSourceTooltipVisible(!isSourceTooltipVisible)}
                    style={styles.infoButton}
                >
                    <Info size={24} color={isSourceTooltipVisible ? "#1c1917" : "#78716c"} />
                </TouchableOpacity>
            </View>

            {/* Tooltip Overhead Layer */}
            {isSourceTooltipVisible && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
                    <TouchableWithoutFeedback onPress={() => setIsSourceTooltipVisible(false)}>
                        <View style={styles.backdrop} />
                    </TouchableWithoutFeedback>
                    <View style={styles.tooltipWrapper}>
                        {/* Triangle Arrow */}
                        <View style={styles.tooltipArrow} />
                        <SourceTooltip topic={currentTopic} />
                    </View>
                </View>
            )}

            <View style={styles.content}>
                {/* Top Content Area */}
                <View style={{ flex: 1, width: '100%' }}>
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

                    {/* Top Section - Visualizer or Transcript */}
                    <View style={styles.topSection}>
                        {renderContent()}
                    </View>

                    {/* View Toggles + Mute Row */}
                    <View style={styles.togglesRow}>
                        <View style={styles.toggleContainer}>
                            {(['visualize', 'read'] as const).map((mode) => (
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

                        {/* Mute Button */}
                        <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                            {isMuted ? (
                                <VolumeX size={20} color="#78716c" />
                            ) : (
                                <Volume2 size={20} color="#78716c" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Controls */}
                <View style={{ width: '100%', alignItems: 'center' }} >
                    <PlaybackControls
                        isPlaying={isPlaying}
                        onTogglePlay={togglePlay}
                        onSeekBy={seekBy}
                        onPlayNext={playNextTopic}
                        onPlayPrev={playPrevTopic}
                    />
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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 10,
    },
    backButton: {
        padding: 8,
    },
    infoButton: {
        padding: 8,
    },
    backdrop: {
        flex: 1,
        // backgroundColor: 'rgba(0,0,0,0.1)', // Optional dimming
    },
    tooltipWrapper: {
        position: 'absolute',
        top: 100, // Increased to safely clear header on all devices
        right: 16,
        width: '90%',
        maxWidth: 400,
        alignItems: 'flex-end',
    },
    tooltipArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'white',
        marginRight: 14, // Aligns center of arrow (16+14+10=40px from right) with center of icon
        marginBottom: -1,
        zIndex: 51,
        elevation: 10, // Ensure arrow has elevation too to match card
    },
    togglesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 15,
        width: '100%',
        paddingHorizontal: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#e7e5e4',
        borderRadius: 25,
        padding: 6,
        gap: 6,
        flex: 1, // Expand to fill available space
    },
    toggleChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        flex: 1, // Share space equally
        alignItems: 'center', // Center text
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
    muteButton: {
        padding: 10,
        backgroundColor: '#e7e5e4',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        width: 48,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 0,
        paddingBottom: 20,
        justifyContent: "space-between",
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
