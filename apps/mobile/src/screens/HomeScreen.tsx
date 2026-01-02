import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Platform,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { useState } from "react";
import { Topic, formatTime } from "@speed-code/shared";
import { Visualizer, TopicModal, Logo, ScrollingText, Queue } from "../components/";
import { Mail } from "@tamagui/lucide-icons";
import { useAudio } from "../context/AudioContext";

export const HomeScreen = () => {
    const {
        isPlaying,
        isMuted,
        togglePlay,
        toggleMute,
        currentTopic,
        queue,
        playTopic,
    } = useAudio();

    const hasStarted = !!currentTopic;


    // State for selected topic modal
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);


    return (
        <SafeAreaView style={styles.container}>
            {/* Header Logo */}
            <View style={styles.header}>
                <Logo />
                <Text style={styles.logoText}>Covered</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Visualizer & Active Segment */}
                <View style={styles.visualizerWrapper}>
                    <Visualizer
                        isPlaying={isPlaying}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                        analyser={null}
                    />

                    {/* Start Overlay */}
                    {!hasStarted && (
                        <View style={styles.startOverlay}>
                            <TouchableOpacity
                                onPress={togglePlay}
                                style={styles.tuneInButton}
                            >
                                <Text style={styles.tuneInText}>Tune In</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Integrated Live Card */}
                    <TouchableOpacity
                        onPress={() => currentTopic && setSelectedTopic(currentTopic)}
                        style={[styles.liveCard, !hasStarted && { opacity: 0 }]}
                        disabled={!hasStarted}
                    >
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.liveContent}>
                            <ScrollingText
                                text={currentTopic?.title || "Waiting..."}
                                className="text-sm font-medium text-stone-900"
                            />
                            {currentTopic && (
                                <Text style={styles.topicSender}>
                                    {currentTopic.sender || "Anonymous"}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Queue Card */}
                <Queue
                    queue={queue}
                    onTopicClick={setSelectedTopic}
                    onPlayTopic={playTopic}
                />
            </ScrollView>

            <TopicModal
                topic={selectedTopic}
                onClose={() => setSelectedTopic(null)}
            />
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
        gap: 10,
    },
    logoText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1c1917",
    },
    content: {
        padding: 20,
        gap: 30,
        alignItems: "center",
    },
    visualizerWrapper: {
        width: "100%",
        alignItems: "center",
        position: "relative",
    },
    startOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 200, // Match visualizer height
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    tuneInButton: {
        backgroundColor: "#1c1917",
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tuneInText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    liveCard: {
        marginTop: 30,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        padding: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: "#e7e5e4",
        width: "100%",
        maxWidth: 350,
    },
    liveIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#a855f7",
    },
    liveText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#78716c",
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: "#d6d3d1",
        marginHorizontal: 12,
    },
    liveContent: {
        flex: 1,
        overflow: "hidden",
    },
    topicTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1c1917",
    },
    topicSender: {
        fontSize: 10,
        color: "#78716c",
    },

});
