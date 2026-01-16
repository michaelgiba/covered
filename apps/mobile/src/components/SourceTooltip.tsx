import React from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
} from "react-native";
import { Topic } from "@speed-code/shared";

interface SourceTooltipProps {
    topic: Topic | null;
}

export const SourceTooltip = ({
    topic,
}: SourceTooltipProps) => {
    return (

        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>

                <View style={styles.header}>
                    <Text style={styles.title}>{topic?.processed_input.title || "No Title"}</Text>
                    <Text style={styles.timestamp}>{topic?.timestamp || ""}</Text>
                </View>
                <Text style={styles.content}>
                    {topic?.processed_input.content || "No source content available."}
                </Text>
            </ScrollView>

        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        maxHeight: 600, // Increased max height
        minHeight: 300, // Increased min height for less "narrow" feel
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        // Shadows kept for the card itself
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        borderColor: "rgba(0,0,0,0.1)",
        borderWidth: 1,
    },
    header: {
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5",
        paddingBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1c1917",
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 12,
        color: "#78716c",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        fontSize: 14,
        lineHeight: 22,
        color: "#44403c",
    },
});
