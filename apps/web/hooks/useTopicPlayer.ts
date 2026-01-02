import { useEffect, useRef, useCallback, useState } from "react";
import { Topic } from "@speed-code/shared";

interface UseTopicPlayerParams {
    topics: Topic[];
    isPlaying: boolean;
    isMuted?: boolean;
    onTopicChange?: (topicId: string) => void;
}

export const useTopicPlayer = ({
    topics,
    isPlaying,
    isMuted = false,
    onTopicChange,
}: UseTopicPlayerParams) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

    const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
    const [playedTopicIds, setPlayedTopicIds] = useState<Set<string>>(new Set());
    const isInitialized = useRef(false);

    // Setup Media Session for lock screen
    const setupMediaSession = useCallback((topic?: Topic) => {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: topic?.title || "Covered Radio",
                artist: topic?.sender || "Covered",
                album: "Daily Briefing",
            });

            navigator.mediaSession.setActionHandler('play', () => {
                if (audioElementRef.current) audioElementRef.current.play();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                if (audioElementRef.current) audioElementRef.current.pause();
            });
        }
    }, []);

    const initAudio = useCallback(() => {
        if (isInitialized.current) return;

        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;

        const gainNode = ctx.createGain();
        gainNode.gain.value = isMuted ? 0 : 1;

        // Create Audio Element
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audioElementRef.current = audio;

        // Connect nodes
        // Note: createMediaElementSource can only be called once per element
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(ctx.destination);

        sourceNodeRef.current = source;
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        gainNodeRef.current = gainNode;
        isInitialized.current = true;

        if (ctx.state === "suspended") ctx.resume();

        // iOS audio unlock
        const silentBuffer = ctx.createBuffer(1, 1, 22050);
        const silentSource = ctx.createBufferSource();
        silentSource.buffer = silentBuffer;
        silentSource.connect(ctx.destination);
        silentSource.start(0);

        setupMediaSession();
    }, [isMuted, setupMediaSession]);

    // Handle Mute
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isMuted ? 0 : 1;
        }
    }, [isMuted]);

    // Handle Play/Pause
    useEffect(() => {
        if (!audioElementRef.current) return;

        if (isPlaying) {
            if (audioContextRef.current?.state === "suspended") {
                audioContextRef.current.resume();
            }
            audioElementRef.current.play().catch(e => console.log("Play failed:", e));
        } else {
            audioElementRef.current.pause();
        }
    }, [isPlaying]);

    // Playback Logic
    useEffect(() => {
        if (!isPlaying || !isInitialized.current || !audioElementRef.current) return;

        const audio = audioElementRef.current;

        const playNext = () => {
            // Find oldest unplayed topic with playback content
            const sortedTopics = [...topics].sort((a, b) =>
                (a.timestamp || "").localeCompare(b.timestamp || "")
            );

            const nextTopic = sortedTopics.find(t =>
                t.playback_content_id &&
                !playedTopicIds.has(t.id)
            );

            if (nextTopic) {
                console.log("Playing next topic:", nextTopic.title);
                const m4aUrl = `/data/playback_content/${nextTopic.playback_content_id}.m4a`;

                audio.src = m4aUrl;
                audio.play().then(() => {
                    setCurrentTopicId(nextTopic.id);
                    onTopicChange?.(nextTopic.id);
                    setupMediaSession(nextTopic);
                    setPlayedTopicIds(prev => {
                        const newSet = new Set(prev);
                        newSet.add(nextTopic.id);
                        return newSet;
                    });
                }).catch(e => console.error("Failed to play topic:", e));
            } else {
                console.log("No more topics to play");
                setCurrentTopicId(null);
            }
        };

        // If audio is paused or ended, try to play next
        if (audio.paused || audio.ended) {
            // If we are not currently playing a track (src is empty or we just finished)
            if (!audio.src || audio.ended) {
                playNext();
            }
        }

        const handleEnded = () => {
            playNext();
        };

        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
    }, [topics, isPlaying, onTopicChange, setupMediaSession, playedTopicIds]);

    return {
        initAudio,
        analyser: analyserRef.current,
        currentTopicId,
        playedTopicIds
    };
};
