import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Topic, formatTime } from "@speed-code/shared";
import { Visualizer, TopicModal, Logo, ScrollingText } from "../components/";
import { Mail } from "@tamagui/lucide-icons";

const API_URL = "http://localhost:8000/data";

const fetchTopics = async (): Promise<Topic[]> => {
  const res = await fetch(`${API_URL}/topics_on_deck.json`);
  if (!res.ok) {
    throw new Error("Failed to fetch topics");
  }
  return res.json();
};

export const HomeScreen = () => {
  const { data: topics } = useQuery({
    queryKey: ["topics"],
    queryFn: fetchTopics,
    refetchInterval: 1000,
  });

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showAllQueue, setShowAllQueue] = useState(false);

  async function playSound() {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      console.log("Loading Sound");
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${API_URL}/feed/stream.m3u8` },
        { shouldPlay: true },
      );
      setSound(sound);
      setIsPlaying(true);
      setHasStarted(true);
    }
  }

  const togglePlay = () => {
    if (!hasStarted) {
      playSound();
    } else {
      playSound();
    }
  };

  const toggleMute = async () => {
    if (sound) {
      await sound.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const queue = topics?.filter((t) => t.status === "pending") || [];
  const displayQueue = showAllQueue ? queue : queue.slice(0, 1);
  const currentTopic = topics?.find((t) => t.status === "active") || null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Logo */}
      <View style={styles.header}>
        <Logo />
        <Text style={styles.logoText}>Covered</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Visualizer & Active Segment */}
        <View style={styles.visualizerWrapper}>
          <Visualizer
            isPlaying={isPlaying}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            analyser={null}
          />

          {/* Start Overlay */}
          {!hasStarted && (
            <View style={styles.startOverlay}>
              <TouchableOpacity
                onPress={togglePlay}
                style={styles.tuneInButton}
              >
                <Text style={styles.tuneInText}>Tune In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Integrated Live Card */}
          <TouchableOpacity
            onPress={() => currentTopic && setSelectedTopic(currentTopic)}
            style={[styles.liveCard, !hasStarted && { opacity: 0 }]}
            disabled={!hasStarted}
          >
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.liveContent}>
              <ScrollingText
                text={currentTopic?.title || "Waiting..."}
                className="text-sm font-medium text-stone-900"
              />
              {currentTopic && (
                <Text style={styles.topicSender}>
                  {currentTopic.sender || "Anonymous"}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Queue Card */}
        <View style={[styles.queueContainer, !hasStarted && { opacity: 0.5 }]}>
          <View style={styles.queueHeader}>
            <Text style={styles.queueTitle}>Up Next</Text>
            <Text style={styles.queueCount}>{queue.length} items</Text>
          </View>

          <View style={styles.queueList}>
            {displayQueue.map((topic, index) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.queueItem, index === 0 && styles.firstQueueItem]}
                onPress={() => setSelectedTopic(topic)}
              >
                <View style={styles.queueIcon}>
                  <Mail size={16} color={index === 0 ? "#9333ea" : "#a8a29e"} />
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
                <Text style={styles.timestamp}>
                  {formatTime(topic.timestamp)}
                </Text>
              </TouchableOpacity>
            ))}
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
      </ScrollView>

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
    gap: 30,
    alignItems: "center",
  },
  visualizerWrapper: {
    width: "100%",
    alignItems: "center",
    position: "relative",
  },
  startOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200, // Match visualizer height
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  tuneInButton: {
    backgroundColor: "#1c1917",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tuneInText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  liveCard: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    width: "100%",
    maxWidth: 350,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#a855f7",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#78716c",
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: "#d6d3d1",
    marginHorizontal: 12,
  },
  liveContent: {
    flex: 1,
    overflow: "hidden",
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1c1917",
  },
  topicSender: {
    fontSize: 10,
    color: "#78716c",
  },
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
});
