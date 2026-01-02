import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useHeadlessHls } from "@/hooks/useHeadlessHls";

interface VisualizerProps {
    isPlaying: boolean;
    isMuted: boolean; // Note: Web Audio gain node needed for true mute
    onToggleMute: () => void;
    onTopicChange?: (topicId: string) => void;
}

export const Visualizer = ({ isPlaying, isMuted, onToggleMute, onTopicChange }: VisualizerProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const timeRef = useRef<number>(0);
    const prevValuesRef = useRef<number[]>([]);

    // Use the Headless Hook
    const { initAudio, analyser } = useHeadlessHls({
        src: "/data/feed/stream.m3u8",
        isPlaying,
        isMuted,
        onTopicChange
    });

    // Handle User Interaction (Must be attached to a button/click)
    // You likely have a Play button higher up, pass `initAudio` to it or click here
    useEffect(() => {
        const handleUserGesture = () => initAudio();
        window.addEventListener('click', handleUserGesture);
        window.addEventListener('touchstart', handleUserGesture);
        return () => {
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('touchstart', handleUserGesture);
        }
    }, [initAudio]);

    // --- YOUR EXISTING RENDER LOOP (Unchanged) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            timeRef.current += 0.05;

            let dataArray: Uint8Array | null = null;
            let bufferLength = 0;

            if (isPlaying && analyser) {
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray as any);
            }

            // Draw Bars
            const barCount = 5; // Number of bars
            const spacing = 5; // Spacing between bars
            const totalWidth = canvas.width;
            const barWidth = (totalWidth - (spacing * (barCount - 1))) / barCount;
            const centerY = canvas.height / 2;

            // Initialize prevValues if needed
            if (prevValuesRef.current.length !== barCount) {
                prevValuesRef.current = new Array(barCount).fill(0);
            }

            for (let i = 0; i < barCount; i++) {
                let targetValue = 0;

                if (isPlaying && dataArray) {
                    // Map bar index to frequency data
                    // Center represents low frequencies, edges represent higher frequencies
                    const mid = Math.floor(barCount / 2);
                    const dist = Math.abs(i - mid);

                    // Base index based on distance from center (higher distance = higher frequency)
                    // Multiply by 2 to keep it within the voice range (0-5 range approx)
                    // Previous multiplier of 5 was pushing edges too high into treble
                    let dataIndex = dist * 2;

                    // Add slight asymmetry for the right side
                    if (i > mid) {
                        dataIndex += 1;
                    }

                    // Ensure we don't go out of bounds
                    dataIndex = Math.min(dataIndex, bufferLength - 1);

                    targetValue = dataArray[dataIndex] || 0;
                } else {
                    // Idle animation: symmetric wave from center
                    const mid = Math.floor(barCount / 2);
                    const dist = Math.abs(i - mid);
                    targetValue = 20 + Math.sin(timeRef.current - dist * 0.5) * 10;
                }

                // Smoothing with separate attack and release
                const isAttack = targetValue > prevValuesRef.current[i];
                const smoothingFactor = isAttack ? 0.9 : 0.15;

                const smoothedValue = prevValuesRef.current[i] + (targetValue - prevValuesRef.current[i]) * smoothingFactor;
                prevValuesRef.current[i] = smoothedValue;

                // Calculate bar height with interpolation for fluidity
                const minHeight = barWidth;
                const maxHeight = canvas.height;

                // Normalize value (0-1)
                let normalized = smoothedValue / 512;

                // Apply cubic scaling (x^3) to make response non-linear
                normalized = Math.pow(normalized, 2);

                // Boost the signal after cubic scaling to ensure we still hit max height
                const boosted = Math.min(1, normalized * 2.5);

                const drawHeight = minHeight + boosted * (maxHeight - minHeight);

                // Draw rounded bar
                const x = i * (barWidth + spacing);
                const y = centerY - drawHeight / 2;
                const radius = barWidth / 2;

                // Gradient
                const gradient = ctx.createLinearGradient(x, y, x, y + drawHeight);
                gradient.addColorStop(0, "#8B5CF6"); // Violet
                gradient.addColorStop(1, "#F97316"); // Orange

                ctx.fillStyle = isMuted ? "#E7E5E4" : gradient; // Gray if muted

                // Draw rounded rect manually for better control or use roundRect if supported
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(x, y, barWidth, drawHeight, radius);
                } else {
                    ctx.rect(x, y, barWidth, drawHeight);
                }
                ctx.fill();
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [analyser, isPlaying, isMuted]);

    return (
        <div className="relative group cursor-pointer" onClick={onToggleMute}>
            <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="w-full max-w-[400px] h-[200px]"
            />
            {/* Hover Overlay for Mute Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-[1px] rounded-xl">
                <div className="bg-white p-3 rounded-full shadow-lg text-stone-900">
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </div>
            </div>
        </div>
    );
};