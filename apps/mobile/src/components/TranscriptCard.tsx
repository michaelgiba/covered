import React, { useEffect, useState, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Topic } from "@speed-code/shared";
import { AudioPlayer } from "expo-audio";

interface TranscriptCardProps {
    topic: Topic | null;
    player: AudioPlayer | null;
}

interface TranscriptSegment {
    start: number;
    end: number;
    segment: string;
}

interface TranscriptData {
    transcript: {
        segments: TranscriptSegment[];
    };
    text: string;
}

export const TranscriptCard = ({
    topic,
    player,
}: TranscriptCardProps) => {
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeindex, setActiveIndex] = useState<number>(-1);
    const scrollViewRef = useRef<ScrollView>(null);
    const segmentRefs = useRef<(View | null)[]>([]);

    useEffect(() => {
        const fetchTranscript = async () => {
            if (!topic?.playback_content?.script_json_url) return;

            try {
                setLoading(true);
                const response = await fetch(topic.playback_content.script_json_url);
                const data: TranscriptData = await response.json();
                if (data.transcript && data.transcript.segments) {
                    setSegments(data.transcript.segments);
                }
            } catch (error) {
                console.error("Failed to fetch transcript:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTranscript();
    }, [topic]);

    // Update active segment based on playback time
    useEffect(() => {
        if (!player || segments.length === 0) return;

        const interval = setInterval(() => {
            const currentTime = player.currentTime;
            const index = segments.findIndex(
                (seg) => currentTime >= seg.start && currentTime <= seg.end
            );

            if (index !== -1 && index !== activeindex) {
                setActiveIndex(index);
                // Optional: Scroll to active segment
                // segmentRefs.current[index]?.measureLayout( ... )
            }
        }, 100);

        return () => clearInterval(interval);
    }, [player, segments, activeindex]);

    // Scroll to active segment
    useEffect(() => {
        if (activeindex !== -1 && scrollViewRef.current && activeindex < segments.length) {
            // Simple scroll to rough position
            // This is a rough estimation or we need layout measurement
        }
    }, [activeindex]);


    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator color="#1c1917" />
                </View>
            </View>
        );
    }

    if (segments.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>No transcript available</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.textContainer}>
                    {segments.map((segment, index) => (
                        <Text
                            key={index}
                            style={[
                                styles.segment,
                                index === activeindex && styles.activeSegment,
                            ]}
                        >
                            {segment.segment}{" "}
                        </Text>
                    ))}
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    textContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    segment: {
        fontSize: 18,
        lineHeight: 28,
        color: "#a8a29e", // muted color
    },
    activeSegment: {
        color: "#1c1917",
        backgroundColor: "#f5f5f4", // warm grey 100
        borderRadius: 4,
        overflow: 'hidden', // ensuring border radius works on text on Android sometimes needs this or just works
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: "#78716c",
        fontSize: 16,
    }
});
