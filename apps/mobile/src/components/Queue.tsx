import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from "react-native";
import { Topic, formatTime } from "@speed-code/shared";
import { Mail, PlayCircle } from "@tamagui/lucide-icons";

interface QueueProps {
    queue: Topic[];
    onTopicClick: (topic: Topic) => void;
    onPlayTopic: (topicId: string) => void;
}

export const Queue = ({ queue, onTopicClick, onPlayTopic }: QueueProps) => {
    const [showAllQueue, setShowAllQueue] = useState(false);
    const displayQueue = showAllQueue ? queue : queue.slice(0, 1);

    const handleItemClick = (topic: Topic) => {
        if (topic.playback_content_id) {
            onPlayTopic(topic.id);
        } else {
            onTopicClick(topic);
        }
    };

    return (
        <View style={styles.queueContainer}>
            <View style={styles.queueHeader}>
                <Text style={styles.queueTitle}>Up Next</Text>
                <Text style={styles.queueCount}>{queue.length} items</Text>
            </View>

            <View style={styles.queueList}>
                {displayQueue.map((topic, index) => {
                    const isReady = !!topic.playback_content_id;

                    return (
                        <TouchableOpacity
                            key={`${topic.id}-${index}`}
                            style={[styles.queueItem, index === 0 && styles.firstQueueItem]}
                            onPress={() => handleItemClick(topic)}
                        >
                            <View style={styles.queueIcon}>
                                {isReady ? (
                                    <PlayCircle size={16} color={index === 0 ? "#9333ea" : "#10b981"} />
                                ) : (
                                    <Mail size={16} color={index === 0 ? "#9333ea" : "#a8a29e"} />
                                )}
                            </View>
                            <View style={styles.queueContent}>
                                <Text
                                    style={[
                                        styles.queueItemTitle,
                                        index === 0 && styles.firstQueueItemText,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {topic.title}
                                </Text>
                                <Text style={styles.queueItemSender}>
                                    {topic.sender || "Anonymous"}
                                </Text>
                            </View>

                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.timestamp}>
                                    {formatTime(topic.timestamp)}
                                </Text>
                                {isReady && (
                                    <View style={styles.readyIndicator}>
                                        <Text style={styles.readyText}>Ready</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {queue.length === 0 && (
                    <Text style={styles.emptyQueue}>Queue is empty</Text>
                )}
            </View>

            {queue.length > 1 && (
                <TouchableOpacity
                    onPress={() => setShowAllQueue(!showAllQueue)}
                    style={styles.expandButton}
                >
                    <Text style={styles.expandText}>
                        {showAllQueue ? "Collapse" : `+ ${queue.length - 1} more`}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    queueContainer: {
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#e7e5e4",
    },
    queueHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    queueTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#a8a29e",
        textTransform: "uppercase",
    },
    queueCount: {
        fontSize: 10,
        color: "#a8a29e",
        backgroundColor: "#f5f5f4",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    queueList: {
        width: "100%",
    },
    queueItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginBottom: 8,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#f5f5f4",
    },
    firstQueueItem: {
        backgroundColor: "white",
        borderColor: "#d8b4fe",
    },
    queueIcon: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#f5f5f4",
        marginRight: 12,
    },
    queueContent: {
        flex: 1,
        marginRight: 10,
    },
    queueItemTitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "#44403c",
    },
    firstQueueItemText: {
        color: "#581c87",
    },
    queueItemSender: {
        fontSize: 10,
        color: "#a8a29e",
    },
    timestamp: {
        fontSize: 10,
        color: "#a8a29e",
        fontWeight: "500",
    },
    emptyQueue: {
        textAlign: "center",
        color: "#a8a29e",
        marginTop: 20,
    },
    expandButton: {
        width: "100%",
        marginTop: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#f5f5f4",
        alignItems: "center",
    },
    expandText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#78716c",
    },
    readyIndicator: {
        marginTop: 2,
        backgroundColor: "#10b981",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    readyText: {
        fontSize: 8,
        color: "white",
        fontWeight: "bold",
    }
});
