import { useEffect, useRef, useCallback } from 'react';

// Poll interval in ms
const POLL_INTERVAL = 500;
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

export const useHeadlessHls = ({ src, isPlaying, isMuted = false, onTopicChange }: HeadlessHlsParams) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const processedSegments = useRef<Set<string>>(new Set());
    const schedulerTimer = useRef<NodeJS.Timeout | null>(null);
    const isInitialized = useRef(false);
    const hasSeenInitialManifest = useRef(false);
    const currentTopicIdRef = useRef<string | null>(null);

    // Setup Media Session for lock screen
    const setupMediaSession = useCallback(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Live Broadcast',
                artist: 'Covered Radio',
                album: 'Live Stream',
            });
        }
    }, []);

    const initAudio = useCallback(() => {
        if (isInitialized.current) return;

        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
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

        if (ctx.state === 'suspended') ctx.resume();

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
    const scheduleWithCrossfade = (ctx: AudioContext, audioBuffer: AudioBuffer, startTime: number) => {
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

    // Poll Manifest and Schedule Audio
    const scheduleLoop = useCallback(async () => {
        if (!isPlaying || !audioContextRef.current) return;

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const response = await fetch(src);
        const text = await response.text();
        const lines = text.split('\n');

        const segments: { fullUrl: string; metadata: string }[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue;

            const baseUrl = new URL(src, window.location.origin).toString();
            const fullUrl = new URL(line, baseUrl).toString();
            const metadata = i > 0 ? lines[i - 1] : '';
            segments.push({ fullUrl, metadata });
        }

        if (!hasSeenInitialManifest.current) {
            hasSeenInitialManifest.current = true;
            for (const seg of segments) {
                processedSegments.current.add(seg.fullUrl);
            }
            if (segments.length > 0) {
                const lastSeg = segments[segments.length - 1];
                const topicMatch = lastSeg.metadata.match(/,ID:([a-f0-9-]+)/i);
                if (topicMatch && topicMatch[1] !== currentTopicIdRef.current) {
                    currentTopicIdRef.current = topicMatch[1];
                    onTopicChange?.(topicMatch[1]);
                }
                const audioResp = await fetch(lastSeg.fullUrl);
                const arrayBuffer = await audioResp.arrayBuffer();
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
                nextStartTimeRef.current = scheduleWithCrossfade(ctx, audioBuffer, ctx.currentTime);
            }
            schedulerTimer.current = setTimeout(scheduleLoop, POLL_INTERVAL);
            return;
        }

        for (const seg of segments) {
            if (processedSegments.current.has(seg.fullUrl)) continue;
            processedSegments.current.add(seg.fullUrl);

            const topicMatch = seg.metadata.match(/,ID:([a-f0-9-]+)/i);
            if (topicMatch && topicMatch[1] !== currentTopicIdRef.current) {
                currentTopicIdRef.current = topicMatch[1];
                onTopicChange?.(topicMatch[1]);
            }

            const audioResp = await fetch(seg.fullUrl);
            const arrayBuffer = await audioResp.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

            const startTime = Math.max(ctx.currentTime + PRE_BUFFER, nextStartTimeRef.current);
            nextStartTimeRef.current = scheduleWithCrossfade(ctx, audioBuffer, startTime);
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
        }
    }, [isPlaying, scheduleLoop]);

    return {
        initAudio,
        analyser: analyserRef.current
    };
};
