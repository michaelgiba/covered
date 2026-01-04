import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { useNavigation } from "../contexts/NavigationContext";
import { Topic, formatTime } from "@speed-code/shared";

export const TopicDetailScreen = () => {
    const { goBack, screenParams } = useNavigation();
    const topic = screenParams?.topic as Topic;

    if (!topic) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backButton}>
                        <ChevronLeft size={28} color="#1c1917" />
                    </TouchableOpacity>
                </View>
                <View style={styles.content}>
                    <Text>Topic not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <ChevronLeft size={28} color="#1c1917" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Topic Details</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{topic.title}</Text>

                <View style={styles.metaContainer}>
                    {topic.sender && (
                        <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>From:</Text>
                            <Text style={styles.metaValue}>{topic.sender}</Text>
                        </View>
                    )}
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Time:</Text>
                        <Text style={styles.metaValue}>{formatTime(topic.timestamp)}</Text>
                    </View>
                </View>

                <View style={styles.contextContainer}>
                    <Text style={styles.contextText}>{topic.context}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F7",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1c1917",
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1c1917",
        marginBottom: 20,
        lineHeight: 32,
    },
    metaContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 15,
        marginBottom: 25,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e7e5e4",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 5,
    },
    metaLabel: {
        fontSize: 12,
        color: "#78716c",
        fontWeight: "500",
    },
    metaValue: {
        fontSize: 12,
        color: "#44403c",
        fontWeight: "600",
    },
    contextContainer: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e7e5e4",
    },
    contextText: {
        fontSize: 16,
        color: "#44403c",
        lineHeight: 24,
    },
});
