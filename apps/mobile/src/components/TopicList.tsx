import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from "react-native";
import { Topic, formatTime } from "@speed-code/shared";
import { Mail, PlayCircle, Info } from "@tamagui/lucide-icons";
import { usePlaybackManager } from "../contexts/PlaybackManagerContext";

interface TopicListProps {
    queue: Topic[];
    currentTopic: Topic | null;
    onTopicClick: (topic: Topic) => void;
    onPlayTopic: (topic: Topic) => void;
    onQuickPlay: (topic: Topic) => void;
    onInfoClick: (topic: Topic) => void;
}

export const TopicList = ({ queue, currentTopic, onTopicClick, onPlayTopic, onQuickPlay, onInfoClick }: TopicListProps) => {
    const displayQueue = queue;

    const { isPlayed } = usePlaybackManager();

    const handleItemClick = (topic: Topic) => {
        if (topic.playback_content) {
            onPlayTopic(topic);
        } else {
            onTopicClick(topic);
        }
    };

    const handleQuickPlay = (topic: Topic) => {
        if (topic.playback_content) {
            onQuickPlay(topic);
        }
    };

    return (
        <View style={styles.queueContainer}>
            <View style={styles.queueHeader}>
                <Text style={styles.queueTitle}>Topics</Text>
                <Text style={styles.queueCount}>{queue.length} items</Text>
            </View>

            <View style={styles.queueList}>
                {displayQueue.map((topic, index) => {
                    const isReady = !!topic.playback_content;
                    const isPlaying = topic.id === currentTopic?.id;
                    const played = isPlayed(topic);
                    const isUnplayed = !played && !isPlaying;

                    return (
                        <TouchableOpacity
                            key={`${topic.id}-${index}`}
                            style={[
                                styles.queueItem,
                                isPlaying && styles.playingQueueItem,
                                !isReady && styles.disabledQueueItem
                            ]}
                            onPress={() => isReady && handleItemClick(topic)}
                            disabled={!isReady}
                        >
                            <TouchableOpacity
                                style={[styles.queueIcon, isPlaying && styles.playingQueueIcon]}
                                onPress={() => isReady && handleQuickPlay(topic)}
                                disabled={!isReady}
                            >
                                {isReady ? (
                                    <PlayCircle size={16} color={isPlaying ? "white" : "#10b981"} />
                                ) : (
                                    <Mail size={16} color="#a8a29e" />
                                )}
                            </TouchableOpacity>
                            <View style={styles.queueContent}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text
                                        style={[
                                            styles.queueItemTitle,
                                            isPlaying && styles.playingQueueItemText
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {topic.title}
                                    </Text>
                                    {isUnplayed && isReady && (
                                        <View style={styles.unplayedDot} />
                                    )}
                                </View>
                                <Text style={styles.queueItemSender}>
                                    {formatTime(topic.timestamp)}
                                </Text>
                            </View>

                            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                                {!isReady && (
                                    <View style={styles.processingIndicator}>
                                        <Text style={styles.processingText}>Processing</Text>
                                    </View>
                                )}
                                {isPlaying && (
                                    <View style={styles.playingIndicator}>
                                        <Text style={styles.playingText}>Playing</Text>
                                    </View>
                                )}
                                <TouchableOpacity onPress={() => onInfoClick(topic)}>
                                    <Info size={16} color="#a8a29e" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {queue.length === 0 && (
                    <Text style={styles.emptyQueue}>No topics available</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    queueContainer: {
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 0, // Remove horizontal padding
        borderWidth: 1,
        borderColor: "#e7e5e4",
        overflow: "hidden", // Clip children
    },
    queueHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
        paddingHorizontal: 20, // Add padding back to header
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
        padding: 16, // Increase padding for better touch area
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderBottomWidth: 1, // Use border bottom instead of full border
        borderBottomColor: "#f5f5f4",
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
    playingQueueItem: {
        backgroundColor: "#f3e8ff", // purple-100
    },
    disabledQueueItem: {
        opacity: 0.6,
        backgroundColor: "#fafaf9", // stone-50
    },
    playingQueueIcon: {
        backgroundColor: "#a855f7", // purple-500
    },
    playingQueueItemText: {
        color: "#581c87", // purple-900
        fontWeight: "600",
    },
    processingIndicator: {
        marginTop: 2,
        backgroundColor: "#fb923c", // orange-400
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    processingText: {
        fontSize: 8,
        color: "white",
        fontWeight: "bold",
    },
    playingIndicator: {
        marginTop: 2,
        backgroundColor: "#a855f7", // purple-500
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    playingText: {
        fontSize: 8,
        color: "white",
        fontWeight: "bold",
    },
    unplayedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#3b82f6", // blue-500
    }
});
