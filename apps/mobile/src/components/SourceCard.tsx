import React from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
} from "react-native";
import { Topic } from "@speed-code/shared";
import { AudioPlayer } from "expo-audio";
import { MiniVisualizer } from "./MiniVisualizer";

interface SourceCardProps {
    topic: Topic | null;
    isPlaying: boolean;
    isMuted: boolean;
    player: AudioPlayer | null;
}

export const SourceCard = ({
    topic,
    isPlaying,
    isMuted,
    player,
}: SourceCardProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{topic?.processed_input.title}</Text>
                    <Text style={styles.timestamp}>{topic?.timestamp}</Text>
                </View>
                <View style={styles.visualizerWrapper}>
                    <MiniVisualizer
                        isPlaying={isPlaying}
                        isMuted={isMuted}
                        player={player}
                        size={64}
                    />
                </View>
            </View>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.content}>
                    {topic?.processed_input.content || "No transcript available."}
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        backgroundColor: "white",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    titleContainer: {
        flex: 1,
        marginRight: 8,
        justifyContent: "center",
    },
    visualizerWrapper: {
        marginTop: -24,
        marginRight: -24,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1c1917",
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 14,
        color: "#78716c",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        fontSize: 16,
        lineHeight: 26,
        color: "#44403c",
    },
});
