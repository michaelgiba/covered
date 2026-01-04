import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { Topic } from "@speed-code/shared";

interface TranscriptCardProps {
    topic: Topic | null;
    onPress: () => void;
}

export const TranscriptCard = ({ topic, onPress }: TranscriptCardProps) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <Text style={styles.title}>{topic?.title}</Text>
            <Text style={styles.timestamp}>{topic?.timestamp}</Text>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.content}>
                    {topic?.context || "No transcript available."}
                </Text>
            </ScrollView>
        </TouchableOpacity>
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
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1c1917",
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 14,
        color: "#78716c",
        marginBottom: 16,
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
