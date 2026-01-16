import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { useAudio } from "../contexts/AudioContext";
import { useNavigation } from "../contexts/NavigationContext";
import { Play, Pause, Mail } from "@tamagui/lucide-icons";
import { ScrollingText } from "./ScrollingText";

export const MiniPlayer = () => {
    const { currentTopic, isPlaying, isMuted, togglePlay, player } = useAudio();
    const { navigateTo } = useNavigation();

    if (!currentTopic) return null;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigateTo("Player")}
            activeOpacity={0.9}
        >
            {currentTopic.playback_content?.thumbnail_url ? (
                <Image
                    source={{ uri: currentTopic.playback_content.thumbnail_url }}
                    style={styles.thumbnail}
                />
            ) : (
                <View style={styles.thumbnailPlaceholder}>
                    <Mail size={20} color="#a8a29e" />
                </View>
            )}
            <View style={styles.infoContainer}>
                <ScrollingText
                    text={currentTopic.processed_input.title}
                    className="text-sm font-bold text-stone-900"
                />
                <Text style={styles.senderText} numberOfLines={1}>
                    {currentTopic.processed_input.sender || "Speed Code"}
                </Text>
            </View>

            <TouchableOpacity onPress={(e) => {
                e.stopPropagation();
                togglePlay();
            }} style={styles.playButton}>
                {isPlaying ? (
                    <Pause size={20} color="#1c1917" />
                ) : (
                    <Play size={20} color="#1c1917" />
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 16,
        padding: 8, // Add padding
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        overflow: "hidden",
    },
    infoContainer: {
        flex: 1,
        marginHorizontal: 12,
        overflow: "hidden",
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: "#f5f5f4",
    },
    thumbnailPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: "#f5f5f4",
        alignItems: "center",
        justifyContent: "center",
    },
    senderText: {
        fontSize: 10,
        color: "#78716c",
        marginTop: 2,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.05)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
});
