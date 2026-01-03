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
import { Topic, useTopics, MOBILE_API_URL } from "@speed-code/shared";
import { Visualizer } from "../components/Visualizer";
import { TopicModal } from "../components/TopicModal";
import { Logo } from "../components/Logo";
import { ScrollingText } from "../components/ScrollingText";
import { TopicList } from "../components/TopicList";
import { MiniPlayer } from "../components/MiniPlayer";
import { useAudio } from "../context/AudioContext";
import { useNavigation } from "../context/NavigationContext";

export const HomeScreen = () => {
    const {
        playTopic,
        currentTopic,
    } = useAudio();
    const { navigateTo } = useNavigation();

    const { data: rawTopics } = useTopics(MOBILE_API_URL);

    // Deduplicate topics
    const topics = rawTopics?.filter((topic, index, self) =>
        index === self.findIndex((t) => t.id === topic.id)
    );

    // Calculate queue
    const queue = topics?.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || "")) || [];

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
                {/* Topic List */}
                <TopicList
                    queue={queue}
                    currentTopic={currentTopic}
                    onTopicClick={setSelectedTopic}
                    onPlayTopic={(topic) => {
                        playTopic(topic);
                        navigateTo("Player");
                    }}
                    onQuickPlay={(topic) => {
                        playTopic(topic);
                    }}
                />
            </ScrollView>

            <MiniPlayer />

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
        paddingBottom: 100, // Add padding for MiniPlayer
        gap: 30,
        alignItems: "center",
    },
    topicSender: {
        fontSize: 14,
        color: "#78716c",
        fontWeight: "500",
    },

});
