import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useAudio } from "../context/AudioContext";
import { useNavigation } from "../context/NavigationContext";
import { Play, Pause } from "@tamagui/lucide-icons";
import { ScrollingText } from "./ScrollingText";

export const MiniPlayer = () => {
    const { currentTopic, isPlaying, togglePlay } = useAudio();
    const { navigateTo } = useNavigation();

    if (!currentTopic) return null;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigateTo("Player")}
            activeOpacity={0.9}
        >
            <View style={styles.infoContainer}>
                <ScrollingText
                    text={currentTopic.title}
                    className="text-sm font-bold text-stone-900"
                />
                <Text style={styles.senderText} numberOfLines={1}>
                    {currentTopic.sender || "Speed Code"}
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
        padding: 12,
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
    },
    infoContainer: {
        flex: 1,
        marginRight: 12,
        overflow: "hidden",
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
    },
});
