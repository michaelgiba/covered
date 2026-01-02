import { useEffect, useRef, useCallback } from "react";

// Poll interval in ms
const POLL_INTERVAL = 2000;
// Pre-buffer time in seconds
const PRE_BUFFER = 0.5;
// Crossfade duration in seconds
const CROSSFADE = 0.03;

interface HeadlessHlsParams {
  src: string;
  isPlaying: boolean;
  isMuted?: boolean;
  onTopicChange?: (topicId: string) => void;
}

interface Segment {
  fullUrl: string;
  metadata: string;
}

const parseHlsManifest = (text: string, baseUrl: string): Segment[] => {
  const lines = text.split("\n");
  const segments: Segment[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    const fullUrl = new URL(line, baseUrl).toString();
    const metadata = i > 0 ? lines[i - 1] : "";
    segments.push({ fullUrl, metadata });
  }
  return segments;
};

const extractTopicId = (metadata: string): string | null => {
  const match = metadata.match(/,ID:([a-f0-9-]+)/i);
  return match ? match[1] : null;
};

const fetchAudioSegment = async (
  ctx: AudioContext,
  url: string,
): Promise<AudioBuffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer.slice(0));
};

export const useHeadlessHls = ({
  src,
  isPlaying,
  isMuted = false,
  onTopicChange,
}: HeadlessHlsParams) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const processedSegments = useRef<Set<string>>(new Set());
  const schedulerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);
  const hasSeenInitialManifest = useRef(false);
  const currentTopicIdRef = useRef<string | null>(null);

  // Setup Media Session for lock screen
  const setupMediaSession = useCallback(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Live Broadcast",
        artist: "Covered Radio",
        album: "Live Stream",
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
    gainNode.gain.value = 1;

    analyser.connect(gainNode);
    gainNode.connect(ctx.destination);

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
  }, [setupMediaSession]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  // Schedule buffer with crossfade
  const scheduleWithCrossfade = (
    ctx: AudioContext,
    audioBuffer: AudioBuffer,
    startTime: number,
  ) => {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const segGain = ctx.createGain();
    source.connect(segGain);
    segGain.connect(analyserRef.current!);

    const duration = audioBuffer.duration;

    // Fade in
    segGain.gain.setValueAtTime(0.001, startTime);
    segGain.gain.exponentialRampToValueAtTime(1, startTime + CROSSFADE);

    // Fade out
    segGain.gain.setValueAtTime(1, startTime + duration - CROSSFADE);
    segGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    source.start(startTime);
    return startTime + duration - CROSSFADE;
  };

  const processSegment = async (
    ctx: AudioContext,
    segment: Segment,
    strategy: "immediate" | "queue",
  ) => {
    // Check for topic change
    const topicId = extractTopicId(segment.metadata);
    if (topicId && topicId !== currentTopicIdRef.current) {
      currentTopicIdRef.current = topicId;
      onTopicChange?.(topicId);
    }

    // Fetch and decode
    const audioBuffer = await fetchAudioSegment(ctx, segment.fullUrl);

    // Determine start time
    let startTime;
    if (strategy === "immediate") {
      startTime = ctx.currentTime;
    } else {
      startTime = Math.max(
        ctx.currentTime + PRE_BUFFER,
        nextStartTimeRef.current,
      );
    }

    // Schedule
    nextStartTimeRef.current = scheduleWithCrossfade(
      ctx,
      audioBuffer,
      startTime,
    );
  };

  // Poll Manifest and Schedule Audio
  const scheduleLoop = useCallback(async () => {
    if (!isPlaying || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    try {
      const response = await fetch(src);
      const text = await response.text();
      const baseUrl = new URL(src, window.location.origin).toString();
      const segments = parseHlsManifest(text, baseUrl);

      if (!hasSeenInitialManifest.current) {
        hasSeenInitialManifest.current = true;
        // Mark all as processed so we don't play old history
        for (const seg of segments) {
          processedSegments.current.add(seg.fullUrl);
        }

        // Play only the very last segment to jump to "live"
        if (segments.length > 0) {
          const lastSeg = segments[segments.length - 1];
          await processSegment(ctx, lastSeg, "immediate");
        }
      } else {
        // Play any new segments
        for (const seg of segments) {
          if (processedSegments.current.has(seg.fullUrl)) continue;
          processedSegments.current.add(seg.fullUrl);
          await processSegment(ctx, seg, "queue");
        }
      }
    } catch (error) {
      console.error("Error in scheduleLoop:", error);
    }

    schedulerTimer.current = setTimeout(scheduleLoop, POLL_INTERVAL);
  }, [src, isPlaying, onTopicChange]);

  useEffect(() => {
    if (isPlaying) {
      scheduleLoop();
    } else {
      if (schedulerTimer.current) clearTimeout(schedulerTimer.current);
      if (audioContextRef.current) audioContextRef.current.suspend();
    }
    return () => {
      if (schedulerTimer.current) clearTimeout(schedulerTimer.current);
    };
  }, [isPlaying, scheduleLoop]);

  return {
    initAudio,
    analyser: analyserRef.current,
  };
};
